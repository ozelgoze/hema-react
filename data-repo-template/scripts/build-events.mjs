#!/usr/bin/env node
/**
 * Merges scraped-events.json + manual-events.json → events.json.
 *
 * Rules:
 *   • Manual events override scraped events on duplicate id.
 *   • Past events (endDate < today) are dropped.
 *   • Output is sorted by startDate ascending.
 *   • All required fields are validated; invalid entries are dropped (logged).
 *
 * This is the canonical writer for events.json — the React app reads this file.
 */

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const SCRAPED_PATH = resolve(ROOT, 'scraped-events.json');
const MANUAL_PATH = resolve(ROOT, 'manual-events.json');
const OUT_PATH = resolve(ROOT, 'events.json');

const REQUIRED = ['id', 'name', 'startDate', 'endDate', 'city', 'country'];
const DATE_RX = /^\d{4}-\d{2}-\d{2}$/;

function isValid(e) {
  if (!e || typeof e !== 'object') return false;
  for (const f of REQUIRED) {
    if (typeof e[f] !== 'string' || !e[f].length) return false;
  }
  if (!DATE_RX.test(e.startDate) || !DATE_RX.test(e.endDate)) return false;
  if (e.endDate < e.startDate) return false;
  return true;
}

async function loadJson(path) {
  try {
    const raw = await readFile(path, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function main() {
  const scraped = (await loadJson(SCRAPED_PATH))?.events ?? [];
  const manual = (await loadJson(MANUAL_PATH))?.events ?? [];
  const todayISO = new Date().toISOString().slice(0, 10);

  console.log(`[build] scraped=${scraped.length} manual=${manual.length}`);

  // Index by id; manual takes precedence.
  const byId = new Map();
  for (const e of scraped) {
    if (!isValid(e)) {
      console.warn(`[build] dropping invalid scraped event: ${e?.id || '(no id)'}`);
      continue;
    }
    byId.set(e.id, e);
  }
  for (const e of manual) {
    if (!isValid(e)) {
      console.warn(`[build] dropping invalid manual event: ${e?.id || '(no id)'}`);
      continue;
    }
    byId.set(e.id, { ...byId.get(e.id), ...e, source: e.source || 'manual' });
  }

  const merged = Array.from(byId.values())
    .filter((e) => e.endDate >= todayISO)
    .sort((a, b) => a.startDate.localeCompare(b.startDate));

  console.log(`[build] merged=${byId.size} → upcoming=${merged.length}`);

  const existing = await loadJson(OUT_PATH);
  if (existing && JSON.stringify(existing.events) === JSON.stringify(merged)) {
    console.log('[build] no changes — events.json untouched');
    return;
  }

  await writeFile(
    OUT_PATH,
    JSON.stringify(
      {
        lastUpdated: new Date().toISOString().slice(0, 10),
        source: 'hemaratings.com + manual',
        events: merged,
      },
      null,
      2,
    ) + '\n',
    'utf8',
  );
  console.log(`[build] wrote ${merged.length} events → events.json`);
}

main().catch((err) => {
  console.error('[build] unexpected error:', err);
  process.exitCode = 1;
});
