#!/usr/bin/env node
/**
 * Fetches the community-curated HEMA tournament list from the public data repo
 * and writes it to src/data/tournaments.json. Runs as a `prebuild` step.
 *
 * Data source: a public GitHub repo containing `events.json` with the schema:
 *   { events: [{ id, name, startDate, endDate, city, country, weapons[], url, region }] }
 *
 * Override the source via env var TOURNAMENTS_SOURCE_URL.
 *
 * Failure mode: if the fetch fails or the payload is invalid, the existing
 * file is preserved untouched. The build never fails on a fetch error.
 */

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const DEFAULT_SOURCE =
  process.env.TOURNAMENTS_SOURCE_URL ||
  'https://raw.githubusercontent.com/ozelgoze/hema-events/main/events.json';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = resolve(__dirname, '..', 'src', 'data', 'tournaments.json');

const REQUIRED_FIELDS = ['id', 'name', 'startDate', 'endDate', 'city', 'country'];

function isValidEvent(e) {
  if (!e || typeof e !== 'object') return false;
  for (const f of REQUIRED_FIELDS) {
    if (typeof e[f] !== 'string' || !e[f].length) return false;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(e.startDate)) return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(e.endDate)) return false;
  return true;
}

async function main() {
  console.log(`[fetch-tournaments] source: ${DEFAULT_SOURCE}`);

  // Manual AbortController + setTimeout. Avoids `AbortSignal.timeout()` because
  // its timer can outlive the process on Windows and trigger a libuv assertion
  // that breaks the npm `prebuild` → `build` chain.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);

  let response;
  try {
    response = await fetch(DEFAULT_SOURCE, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timer);
    console.warn(`[fetch-tournaments] fetch failed (${err.message}) — keeping existing local seed`);
    return;
  }
  clearTimeout(timer);

  if (!response.ok) {
    console.warn(`[fetch-tournaments] HTTP ${response.status} — keeping existing local seed`);
    return;
  }

  let payload;
  try {
    payload = await response.json();
  } catch (err) {
    console.warn(`[fetch-tournaments] invalid JSON (${err.message}) — keeping existing local seed`);
    return;
  }

  const rawEvents = Array.isArray(payload?.events) ? payload.events : null;
  if (!rawEvents) {
    console.warn('[fetch-tournaments] payload missing `events` array — keeping existing local seed');
    return;
  }

  const events = rawEvents.filter(isValidEvent);
  const dropped = rawEvents.length - events.length;
  if (dropped > 0) {
    console.warn(`[fetch-tournaments] dropped ${dropped} invalid event(s)`);
  }

  if (events.length === 0) {
    console.warn('[fetch-tournaments] zero valid events — keeping existing local seed');
    return;
  }

  events.sort((a, b) => a.startDate.localeCompare(b.startDate));

  const existing = await readFile(OUT_PATH, 'utf8').catch(() => null);
  const next = JSON.stringify(
    {
      lastUpdated: new Date().toISOString().slice(0, 10),
      source: DEFAULT_SOURCE,
      events,
    },
    null,
    2,
  );

  if (existing) {
    try {
      const prev = JSON.parse(existing);
      const same = JSON.stringify(prev.events) === JSON.stringify(events);
      if (same) {
        console.log('[fetch-tournaments] no changes — file untouched');
        return;
      }
    } catch {
      // fall through to overwrite
    }
  }

  await writeFile(OUT_PATH, next + '\n', 'utf8');
  console.log(`[fetch-tournaments] wrote ${events.length} event(s) to ${OUT_PATH}`);
}

main().catch((err) => {
  console.error('[fetch-tournaments] unexpected error:', err);
  // never fail the build — let the process exit naturally with code 0
});
