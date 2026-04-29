import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from '../i18n/LanguageContext';
import tournamentData from '../data/tournaments.json';

const REGIONS = ['all', 'europe', 'americas', 'asia', 'oceania'];

const MONTH_GLYPHS = ['❦', '✦', '⚔', '⇆', '☘', '☀', '★', '⚜', '✿', '☂', '❄', '✧'];

function formatDateRange(startDate, endDate, locale) {
  try {
    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T00:00:00');
    const sameMonth =
      start.getUTCFullYear() === end.getUTCFullYear() &&
      start.getUTCMonth() === end.getUTCMonth();
    const dayFmt = new Intl.DateTimeFormat(locale, { day: 'numeric', timeZone: 'UTC' });
    const fullFmt = new Intl.DateTimeFormat(locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    });
    if (start.getTime() === end.getTime()) return fullFmt.format(start);
    if (sameMonth) return `${dayFmt.format(start)}–${fullFmt.format(end)}`;
    const shortFmt = new Intl.DateTimeFormat(locale, {
      day: 'numeric',
      month: 'short',
      timeZone: 'UTC',
    });
    return `${shortFmt.format(start)} – ${fullFmt.format(end)}`;
  } catch {
    return `${startDate} – ${endDate}`;
  }
}

function groupByMonth(events, locale) {
  const groups = new Map();
  for (const e of events) {
    const d = new Date(e.startDate + 'T00:00:00');
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
    if (!groups.has(key)) {
      const label = new Intl.DateTimeFormat(locale, {
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
      }).format(d);
      groups.set(key, { key, label, monthIdx: d.getUTCMonth(), events: [] });
    }
    groups.get(key).events.push(e);
  }
  return Array.from(groups.values()).sort((a, b) => a.key.localeCompare(b.key));
}

export default function TournamentAlmanac({ open, onClose }) {
  const { t, lang } = useTranslation();
  const [region, setRegion] = useState('all');
  const [hideInPast, setHideInPast] = useState(true);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const todayISO = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const filtered = useMemo(() => {
    const all = tournamentData.events ?? [];
    return all.filter((e) => {
      if (region !== 'all' && e.region !== region) return false;
      if (hideInPast && e.endDate < todayISO) return false;
      return true;
    });
  }, [region, hideInPast, todayISO]);

  const groups = useMemo(() => groupByMonth(filtered, lang), [filtered, lang]);
  const updatedLabel = tournamentData.lastUpdated || '—';

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="almanac-title"
      className="fixed inset-0 z-[200] flex items-center justify-center px-4 py-6 animate-fade-in"
    >
      <div
        onClick={onClose}
        className="absolute inset-0 bg-[var(--color-ink-black)]/75 backdrop-blur-[2px]"
        aria-hidden="true"
      />

      <div className="relative w-full max-w-[640px] max-h-[calc(100dvh-3rem)] flex flex-col bg-[var(--color-parchment-light)] border-[3px] border-[var(--color-ink-black)] shadow-[8px_8px_0_0_var(--color-ink-black)]">
        {/* Close */}
        <button
          onClick={onClose}
          aria-label={t('close')}
          className="absolute top-2 right-2 w-9 h-9 flex items-center justify-center bg-[var(--color-parchment)] border-2 border-[var(--color-ink-black)] text-[var(--color-ink-black)] hover:bg-[var(--color-ink-red)] hover:text-[var(--color-parchment-light)] transition-colors shadow-[2px_2px_0_0_var(--color-ink-black)] active:translate-y-[1px] active:translate-x-[1px] active:shadow-none font-bold leading-none text-lg"
        >
          ✕
        </button>

        {/* Header */}
        <div className="px-6 pt-7 pb-4 border-b-2 border-[var(--color-ink-black)] bg-[var(--color-parchment-dark)]">
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 shrink-0 flex items-center justify-center bg-[var(--color-gold)] border-2 border-[var(--color-ink-black)] shadow-[3px_3px_0_0_var(--color-ink-black)] rotate-[-4deg]"
              aria-hidden="true"
            >
              <span className="font-display text-2xl text-[var(--color-ink-black)] leading-none">⚔</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] uppercase tracking-[0.25em] text-[var(--color-ink-faded)] font-display font-bold mb-1">
                {t('almanac_subtitle')}
              </div>
              <h2
                id="almanac-title"
                className="font-display text-xl md:text-2xl text-[var(--color-ink-red)] leading-tight"
              >
                {t('almanac_title')}
              </h2>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="px-6 py-3 border-b-2 border-dashed border-[var(--color-ink-faded)]/50 bg-[var(--color-parchment)]">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            {REGIONS.map((r) => (
              <button
                key={r}
                onClick={() => setRegion(r)}
                aria-pressed={region === r}
                className={`px-3 py-1.5 min-h-[36px] text-[10px] font-display font-bold uppercase tracking-widest border-2 border-[var(--color-ink-black)] transition-all ${
                  region === r
                    ? 'bg-[var(--color-ink-black)] text-[var(--color-gold)] shadow-none'
                    : 'bg-[var(--color-parchment-light)] text-[var(--color-ink-black)] shadow-[2px_2px_0_0_var(--color-ink-black)] active:translate-y-[1px] active:translate-x-[1px] active:shadow-none'
                }`}
              >
                {t(`almanac_region_${r}`)}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 text-[11px] font-body text-[var(--color-ink-black)] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={hideInPast}
              onChange={(e) => setHideInPast(e.target.checked)}
              className="w-4 h-4 accent-[var(--color-ink-red)]"
            />
            <span>{t('almanac_hide_past')}</span>
          </label>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto scrollbar-thin px-6 py-5">
          {groups.length === 0 ? (
            <div className="relative border-2 border-dashed border-[var(--color-ink-faded)] bg-[var(--color-parchment)]/40 px-4 py-8 text-center">
              <div
                className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[var(--color-parchment-light)] px-2 text-[var(--color-ink-faded)] text-sm"
                aria-hidden="true"
              >
                ❦
              </div>
              <p className="text-sm text-[var(--color-ink-faded)] italic font-body">
                {t('almanac_empty')}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {groups.map((group) => (
                <section key={group.key}>
                  <div className="flex items-center gap-3 mb-3">
                    <span
                      className="font-display text-lg text-[var(--color-ink-red)] leading-none"
                      aria-hidden="true"
                    >
                      {MONTH_GLYPHS[group.monthIdx] || '❦'}
                    </span>
                    <h3 className="font-display text-[13px] uppercase tracking-[0.2em] text-[var(--color-ink-black)]">
                      {group.label}
                    </h3>
                    <span className="flex-1 h-px bg-[var(--color-ink-faded)]/40" />
                  </div>
                  <ul className="space-y-3">
                    {group.events.map((e) => (
                      <li
                        key={e.id}
                        className="relative bg-[var(--color-parchment-light)] border-2 border-[var(--color-ink-black)] p-3 shadow-[3px_3px_0_0_var(--color-ink-black)]"
                      >
                        <span
                          className="absolute -top-2 -left-2 w-5 h-5 flex items-center justify-center bg-[var(--color-gold)] border border-[var(--color-ink-black)] text-[var(--color-ink-black)] text-[10px] font-display leading-none shadow-[1px_1px_0_0_var(--color-ink-black)]"
                          aria-hidden="true"
                        >
                          ❦
                        </span>
                        <div className="flex items-start justify-between gap-3 mb-1">
                          <h4 className="font-display font-bold text-[var(--color-ink-black)] text-base leading-tight pr-2">
                            {e.url ? (
                              <a
                                href={e.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-[var(--color-ink-red)] underline decoration-dotted decoration-[var(--color-ink-faded)] underline-offset-[3px]"
                              >
                                {e.name}
                              </a>
                            ) : (
                              e.name
                            )}
                          </h4>
                          <span className="text-[9px] bg-[var(--color-parchment-dark)] text-[var(--color-ink-black)] px-1.5 py-0.5 border border-[var(--color-ink-black)] font-display font-bold uppercase tracking-wider shrink-0">
                            {e.country}
                          </span>
                        </div>
                        <div className="text-[11px] font-display uppercase tracking-widest text-[var(--color-ink-red)] mb-1.5">
                          {formatDateRange(e.startDate, e.endDate, lang)}
                        </div>
                        <div className="text-[12px] font-body text-[var(--color-ink-black)] mb-1.5 italic">
                          {e.city}
                        </div>
                        {Array.isArray(e.weapons) && e.weapons.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {e.weapons.map((w) => (
                              <span
                                key={w}
                                className="text-[9px] font-display uppercase tracking-wider bg-[var(--color-parchment)] text-[var(--color-ink-black)] border border-[var(--color-ink-faded)] px-1.5 py-0.5"
                              >
                                {w}
                              </span>
                            ))}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t-2 border-[var(--color-ink-black)] bg-[var(--color-parchment-dark)] safe-bottom">
          <div className="flex items-center justify-between gap-3 text-[10px] font-display uppercase tracking-widest text-[var(--color-ink-faded)]">
            <span>{t('almanac_updated').replace('{date}', updatedLabel)}</span>
            <span>
              {filtered.length} {t('almanac_events_count')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
