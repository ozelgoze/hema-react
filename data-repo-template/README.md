# hema-events

Auto-curated HEMA tournament feed for [hema-react](https://github.com/ozelgoze/hema-react).

A GitHub Action runs daily, scrapes upcoming tournaments from
[HEMA Scorecard](https://hemascorecard.com/infoSelect.php), merges them with
hand-curated events from `manual-events.json`, and writes the canonical
`events.json` that the React app consumes.

## How it works

```
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────┐
│ HEMA Scorecard      │ ──▶ │ scrape-hema-        │ ──▶ │ scraped-events  │
│ (hemascorecard.com) │     │ scorecard.mjs       │     │ .json           │
└─────────────────────┘     └─────────────────────┘     └────────┬────────┘
                                                                 │
                            ┌─────────────────────┐              ▼
                            │ manual-events.json  │ ──▶ ┌─────────────────┐
                            │ (your overrides)    │     │ build-events    │ ──▶ events.json
                            └─────────────────────┘     │ .mjs            │
                                                        └─────────────────┘
```

`events.json` is the only file the React app reads (via the URL
`https://raw.githubusercontent.com/ozelgoze/hema-events/main/events.json`).

## Why HEMA Scorecard, not HEMA Ratings

HEMA Ratings was the obvious first candidate but was rejected on inspection: it
is a **historical results archive** — events appear there only after results
are submitted, so its "upcoming events" set is effectively empty. HEMA
Scorecard hosts live tournaments and exposes `status: upcoming` rows in its
event list. That's what we scrape.

If a future change makes HEMA Ratings expose upcoming events, or if we want to
add a second source (federation calendars, Eventbrite, etc.), drop another
scraper into `scripts/` that writes to a sibling JSON file and extend
`build-events.mjs` to merge it.

## Files

- **`events.json`** — canonical output, consumed by the React app. Auto-generated; don't edit by hand.
- **`scraped-events.json`** — raw scraper output. Auto-generated; don't edit.
- **`manual-events.json`** — hand-curated events. **Edit this** to add events the scraper misses or to attach weapon info / detail URLs the scraper can't see.
- **`scripts/scrape-hema-scorecard.mjs`** — the scraper.
- **`scripts/build-events.mjs`** — merges scraped + manual into `events.json`.
- **`.github/workflows/daily-scrape.yml`** — daily cron at 03:42 UTC.

## Schema

Each event in `events.json`:

```json
{
  "id": "hsc-london-hema-open-2026-05-02",
  "name": "London HEMA Open",
  "startDate": "2026-05-02",
  "endDate": "2026-05-02",
  "city": "London",
  "country": "GB",
  "countryName": "United Kingdom",
  "weapons": [],
  "url": null,
  "region": "europe",
  "source": "hemascorecard"
}
```

Required: `id`, `name`, `startDate` (`YYYY-MM-DD`), `endDate`, `city`, `country` (ISO-2).
Optional: `weapons` (array of slugs — empty from Scorecard, fill via manual override), `url`, `region` (`europe` / `americas` / `asia` / `oceania` / `africa`), `countryName`, `source`.

## Adding a manual event or correction

Edit `manual-events.json`:

```json
{
  "events": [
    {
      "id": "hsc-aegean-hema-open-2026-05-09",
      "name": "Aegean HEMA Open 2026",
      "startDate": "2026-05-09",
      "endDate": "2026-05-10",
      "city": "Izmir",
      "country": "TR",
      "weapons": ["longsword", "rapier"],
      "url": "https://example.com/aegean-2026"
    }
  ]
}
```

Commit. Manual entries override scraper entries on duplicate `id`, so this
example would patch the scraped Aegean HEMA Open with multi-day dates,
weapons, and a URL. To add a brand-new event, just use a fresh `id` like
`my-local-tourney-2026`.

## Running locally

```
npm install
npm run scrape         # writes scraped-events.json
npm run build          # merges → events.json
# or both:
npm run all
```

## Triggering a refresh manually

GitHub → **Actions** tab → **Daily HEMA tournament scrape** → **Run workflow**.

## Schedule alignment

- **Data repo (this one):** scrapes daily at 03:42 UTC.
- **App repo (`hema-react`):** pulls this `events.json` daily at 04:17 UTC.

So a fresh scrape lands in the consuming app within ~35 minutes.

## When the scraper breaks

HEMA Scorecard can change its HTML. If the scraper finds zero upcoming events
it **preserves the previous `scraped-events.json`** rather than wiping good
data. Watch the Action logs for `[scrape] zero upcoming events` to spot a
broken parser.
