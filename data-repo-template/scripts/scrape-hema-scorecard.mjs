#!/usr/bin/env node
/**
 * Scrape upcoming events from HEMA Scorecard (https://hemascorecard.com/infoSelect.php).
 *
 * Page structure (verified 2026-04-29):
 *   <table id="eventListAll" class="display">
 *     <tr><th>Date</th><th>Name</th><th>Location</th><th>Status</th></tr>
 *     <tr>
 *       <td>2026-06-13</td>
 *       <td>Tournament Name <span class="hide-for-small-only">2026</span></td>
 *       <td>Country, State, City</td>
 *       <td>upcoming</td>
 *     </tr>
 *     ...
 *   </table>
 *
 * We grab all rows where the status column is "upcoming", normalize to our
 * schema, and write scraped-events.json. Fetch errors and parse-failures
 * preserve the existing file rather than wiping good data.
 *
 * Notes:
 *   • HEMA Scorecard does not expose detail-page URLs in the list view, so
 *     `url` is null. Multi-day events show only the start date — endDate
 *     equals startDate.
 *   • The list does not include weapon information at the event level —
 *     `weapons` is empty. Manual overrides can fill that in.
 *   • HEMA Ratings was evaluated and rejected: it only lists events with
 *     submitted results (a historical archive), not upcoming tournaments.
 */

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import * as cheerio from 'cheerio';

const SOURCE_URL = 'https://hemascorecard.com/infoSelect.php';
const USER_AGENT =
  'hema-react-events-bot/1.0 (+https://github.com/ozelgoze/hema-events; daily-tournament-feed)';
const FETCH_TIMEOUT_MS = 30000;

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = resolve(__dirname, '..', 'scraped-events.json');

// ── Country name → ISO-2 + region ─────────────────────────────────────────
const COUNTRY_LOOKUP = {
  'United States': { iso: 'US', region: 'americas' },
  USA: { iso: 'US', region: 'americas' },
  Canada: { iso: 'CA', region: 'americas' },
  Mexico: { iso: 'MX', region: 'americas' },
  Brazil: { iso: 'BR', region: 'americas' },
  Argentina: { iso: 'AR', region: 'americas' },
  Chile: { iso: 'CL', region: 'americas' },
  Colombia: { iso: 'CO', region: 'americas' },
  Peru: { iso: 'PE', region: 'americas' },
  'United Kingdom': { iso: 'GB', region: 'europe' },
  UK: { iso: 'GB', region: 'europe' },
  Scotland: { iso: 'GB', region: 'europe' },
  Wales: { iso: 'GB', region: 'europe' },
  England: { iso: 'GB', region: 'europe' },
  Ireland: { iso: 'IE', region: 'europe' },
  Germany: { iso: 'DE', region: 'europe' },
  France: { iso: 'FR', region: 'europe' },
  Italy: { iso: 'IT', region: 'europe' },
  Spain: { iso: 'ES', region: 'europe' },
  Portugal: { iso: 'PT', region: 'europe' },
  Netherlands: { iso: 'NL', region: 'europe' },
  Belgium: { iso: 'BE', region: 'europe' },
  Austria: { iso: 'AT', region: 'europe' },
  Switzerland: { iso: 'CH', region: 'europe' },
  Sweden: { iso: 'SE', region: 'europe' },
  Norway: { iso: 'NO', region: 'europe' },
  Denmark: { iso: 'DK', region: 'europe' },
  Finland: { iso: 'FI', region: 'europe' },
  Iceland: { iso: 'IS', region: 'europe' },
  Poland: { iso: 'PL', region: 'europe' },
  'Czech Republic': { iso: 'CZ', region: 'europe' },
  Czechia: { iso: 'CZ', region: 'europe' },
  Slovakia: { iso: 'SK', region: 'europe' },
  Hungary: { iso: 'HU', region: 'europe' },
  Romania: { iso: 'RO', region: 'europe' },
  Bulgaria: { iso: 'BG', region: 'europe' },
  Slovenia: { iso: 'SI', region: 'europe' },
  Croatia: { iso: 'HR', region: 'europe' },
  Serbia: { iso: 'RS', region: 'europe' },
  Greece: { iso: 'GR', region: 'europe' },
  Russia: { iso: 'RU', region: 'europe' },
  Ukraine: { iso: 'UA', region: 'europe' },
  Estonia: { iso: 'EE', region: 'europe' },
  Latvia: { iso: 'LV', region: 'europe' },
  Lithuania: { iso: 'LT', region: 'europe' },
  Turkey: { iso: 'TR', region: 'europe' },
  Türkiye: { iso: 'TR', region: 'europe' },
  Australia: { iso: 'AU', region: 'oceania' },
  'New Zealand': { iso: 'NZ', region: 'oceania' },
  Japan: { iso: 'JP', region: 'asia' },
  China: { iso: 'CN', region: 'asia' },
  'Hong Kong': { iso: 'HK', region: 'asia' },
  'South Korea': { iso: 'KR', region: 'asia' },
  Singapore: { iso: 'SG', region: 'asia' },
  India: { iso: 'IN', region: 'asia' },
  Israel: { iso: 'IL', region: 'asia' },
  'South Africa': { iso: 'ZA', region: 'africa' },
};

const DATE_RX = /^\d{4}-\d{2}-\d{2}$/;

function slugify(s) {
  return String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

function parseLocation(loc) {
  // "Country, State, City" → { country, city }
  // "Country, City"        → { country, city }
  // "Country"              → { country, city: '' }
  if (!loc) return { country: '', city: '' };
  const parts = loc.split(',').map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) return { country: '', city: '' };
  const country = parts[0];
  const city = parts.length >= 2 ? parts[parts.length - 1] : '';
  return { country, city };
}

function extractTitle($, $cell) {
  // Strip the trailing "<span class=hide-for-small-only>YEAR</span>" if present.
  const $clone = $cell.clone();
  $clone.find('.hide-for-small-only').remove();
  return $clone.text().trim().replace(/\s+/g, ' ');
}

function parseEvents(html) {
  const $ = cheerio.load(html);
  const todayISO = new Date().toISOString().slice(0, 10);
  const events = [];
  let processed = 0;
  let skippedNonUpcoming = 0;
  let skippedBadDate = 0;
  let skippedPast = 0;

  const $rows = $('#eventListAll tr');
  $rows.each((_, row) => {
    const $tr = $(row);
    const $tds = $tr.find('td');
    if ($tds.length < 4) return; // header row (uses <th>) or malformed
    processed += 1;

    const date = $tds.eq(0).text().trim();
    const name = extractTitle($, $tds.eq(1));
    const locationRaw = $tds.eq(2).text().trim();
    const status = $tds.eq(3).text().trim().toLowerCase();

    if (status !== 'upcoming') {
      skippedNonUpcoming += 1;
      return;
    }

    if (!DATE_RX.test(date)) {
      skippedBadDate += 1;
      return;
    }

    if (date < todayISO) {
      skippedPast += 1;
      return;
    }

    const { country, city } = parseLocation(locationRaw);
    const lookup = COUNTRY_LOOKUP[country];
    const countryISO = lookup?.iso || country.slice(0, 2).toUpperCase();
    const region = lookup?.region || 'europe';

    events.push({
      id: `hsc-${slugify(name)}-${date}`,
      name: name || '(unnamed)',
      startDate: date,
      endDate: date,
      city,
      country: countryISO,
      countryName: country,
      weapons: [],
      url: null,
      region,
      source: 'hemascorecard',
    });
  });

  return { events, processed, skippedNonUpcoming, skippedBadDate, skippedPast };
}

async function fetchPage() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(SOURCE_URL, {
      headers: { 'User-Agent': USER_AGENT, Accept: 'text/html' },
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

async function main() {
  console.log(`[scrape] fetching ${SOURCE_URL}`);
  let html;
  try {
    html = await fetchPage();
  } catch (err) {
    console.warn(`[scrape] fetch failed (${err.message}) — keeping existing scraped-events.json`);
    return;
  }
  console.log(`[scrape] fetched ${html.length} bytes`);

  const { events, processed, skippedNonUpcoming, skippedBadDate, skippedPast } = parseEvents(html);
  console.log(
    `[scrape] processed=${processed} → upcoming=${events.length} ` +
      `(non-upcoming=${skippedNonUpcoming}, bad-date=${skippedBadDate}, past=${skippedPast})`,
  );

  if (events.length === 0) {
    console.warn('[scrape] zero upcoming events — keeping existing scraped-events.json');
    return;
  }

  events.sort((a, b) => a.startDate.localeCompare(b.startDate));

  const existing = await readFile(OUT_PATH, 'utf8').catch(() => null);
  if (existing) {
    try {
      const prev = JSON.parse(existing);
      if (JSON.stringify(prev.events) === JSON.stringify(events)) {
        console.log('[scrape] no changes vs. previous run');
        return;
      }
    } catch {
      // overwrite
    }
  }

  await writeFile(
    OUT_PATH,
    JSON.stringify(
      {
        lastUpdated: new Date().toISOString().slice(0, 10),
        source: SOURCE_URL,
        events,
      },
      null,
      2,
    ) + '\n',
    'utf8',
  );
  console.log(`[scrape] wrote ${events.length} events → ${OUT_PATH}`);
}

main().catch((err) => {
  console.error('[scrape] unexpected error:', err);
});
