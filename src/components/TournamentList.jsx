import { useMemo, useState } from 'react';
import { useTranslation } from '../i18n/LanguageContext';
import tournamentData from '../data/tournaments.json';

const REGIONS = ['all', 'europe', 'americas', 'asia', 'oceania'];

const MONTH_GLYPHS = ['❦', '✦', '⚔', '⇆', '☘', '☀', '★', '⚜', '✿', '☂', '❄', '✧'];

const MS_PER_DAY = 86_400_000;

function startOfUTC(iso) {
  return new Date(iso + 'T00:00:00Z');
}

function daysBetween(fromIso, toIso) {
  const a = startOfUTC(fromIso).getTime();
  const b = startOfUTC(toIso).getTime();
  return Math.round((b - a) / MS_PER_DAY);
}

function monthAbbrev(date, locale) {
  return new Intl.DateTimeFormat(locale, { month: 'short', timeZone: 'UTC' })
    .format(date)
    .replace('.', '')
    .toUpperCase();
}

function eventStatus(e, todayISO) {
  if (e.endDate < todayISO) return 'past';
  if (e.startDate <= todayISO && todayISO <= e.endDate) return 'ongoing';
  const days = daysBetween(todayISO, e.startDate);
  if (days === 1) return 'tomorrow';
  if (days <= 7) return 'soon';
  if (days <= 30) return 'month';
  return 'future';
}

function statusLabel(e, todayISO, t) {
  const days = daysBetween(todayISO, e.startDate);
  const status = eventStatus(e, todayISO);
  switch (status) {
    case 'past': return t('almanac_status_past');
    case 'ongoing': return t('almanac_status_ongoing');
    case 'tomorrow': return t('almanac_status_tomorrow');
    case 'soon':
    case 'month':
      return t('almanac_status_in_days').replace('{n}', String(days));
    default:
      return null;
  }
}

function groupByMonth(events, locale) {
  const groups = new Map();
  for (const e of events) {
    const d = startOfUTC(e.startDate);
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
    if (!groups.has(key)) {
      const label = new Intl.DateTimeFormat(locale, {
        month: 'long', year: 'numeric', timeZone: 'UTC',
      }).format(d);
      groups.set(key, { key, label, monthIdx: d.getUTCMonth(), events: [] });
    }
    groups.get(key).events.push(e);
  }
  return Array.from(groups.values()).sort((a, b) => a.key.localeCompare(b.key));
}

function DateRubric({ event, locale, status }) {
  const start = startOfUTC(event.startDate);
  const end = startOfUTC(event.endDate);
  const sameDay = event.startDate === event.endDate;
  const sameMonth =
    start.getUTCFullYear() === end.getUTCFullYear() &&
    start.getUTCMonth() === end.getUTCMonth();

  const dayClass =
    status === 'past' ? 'text-[var(--color-ink-faded)]' : 'text-[var(--color-ink-red)]';

  return (
    <div
      className="shrink-0 w-12 sm:w-16 flex flex-col items-center justify-center text-center bg-[var(--color-parchment)] border-2 border-[var(--color-ink-black)] py-1.5 px-1 shadow-[2px_2px_0_0_var(--color-ink-black)]"
      aria-hidden="true"
    >
      {sameDay ? (
        <span className={`font-display text-xl sm:text-2xl leading-none ${dayClass}`}>
          {start.getUTCDate()}
        </span>
      ) : sameMonth ? (
        <span className={`font-display text-sm sm:text-base leading-none ${dayClass}`}>
          {start.getUTCDate()}
          <span className="px-0.5 text-[var(--color-ink-faded)]">→</span>
          {end.getUTCDate()}
        </span>
      ) : (
        <span className={`font-display text-[11px] sm:text-sm leading-tight ${dayClass}`}>
          {start.getUTCDate()}
          <span className="block text-[8px] sm:text-[9px] text-[var(--color-ink-faded)] -my-0.5">
            {monthAbbrev(start, locale)}
          </span>
          {end.getUTCDate()}
        </span>
      )}
      <span className="mt-0.5 text-[8px] sm:text-[9px] font-display tracking-[0.15em] sm:tracking-[0.2em] text-[var(--color-ink-black)] leading-none">
        {sameMonth ? monthAbbrev(start, locale) : monthAbbrev(end, locale)}
      </span>
    </div>
  );
}

function StatusPill({ status, label }) {
  if (!label) return null;
  const styles = {
    ongoing: 'bg-[var(--color-ink-red)] text-[var(--color-parchment-light)] border-[var(--color-ink-black)]',
    tomorrow: 'bg-[var(--color-gold)] text-[var(--color-ink-black)] border-[var(--color-ink-black)]',
    soon: 'bg-[var(--color-gold)] text-[var(--color-ink-black)] border-[var(--color-ink-black)]',
    month: 'bg-[var(--color-parchment)] text-[var(--color-ink-black)] border-[var(--color-ink-faded)]',
    past: 'bg-transparent text-[var(--color-ink-faded)] border-[var(--color-ink-faded)]',
  };
  const cls = styles[status] || styles.month;
  return (
    <span className={`inline-flex items-center text-[9px] font-display font-bold uppercase tracking-[0.18em] border px-1.5 py-0.5 leading-none ${cls}`}>
      {label}
    </span>
  );
}

export default function TournamentList({
  showFilters = true,
  showFooter = true,
  maxEvents = null,
  stickyHeaders = true,
  className = '',
}) {
  const { t, lang } = useTranslation();
  const [region, setRegion] = useState('all');
  const [hideInPast, setHideInPast] = useState(true);

  const todayISO = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const filtered = useMemo(() => {
    const all = tournamentData.events ?? [];
    const out = all.filter((e) => {
      if (region !== 'all' && e.region !== region) return false;
      if (hideInPast && e.endDate < todayISO) return false;
      return true;
    });
    return maxEvents ? out.slice(0, maxEvents) : out;
  }, [region, hideInPast, todayISO, maxEvents]);

  const groups = useMemo(() => groupByMonth(filtered, lang), [filtered, lang]);
  const updatedLabel = tournamentData.lastUpdated || '—';

  return (
    <div className={`flex flex-col min-h-0 min-w-0 ${className}`}>
      {showFilters && (
        <div className="px-3 sm:px-4 lg:px-6 py-3 border-b-2 border-dashed border-[var(--color-ink-faded)]/50 bg-[var(--color-parchment)]">
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
          <button
            type="button"
            onClick={() => setHideInPast((v) => !v)}
            aria-pressed={hideInPast}
            className={`inline-flex items-center gap-2 px-2.5 py-1 text-[10px] font-display font-bold uppercase tracking-widest border-2 border-[var(--color-ink-black)] transition-all ${
              hideInPast
                ? 'bg-[var(--color-ink-black)] text-[var(--color-parchment-light)] shadow-none'
                : 'bg-[var(--color-parchment-light)] text-[var(--color-ink-black)] shadow-[2px_2px_0_0_var(--color-ink-black)] active:translate-y-[1px] active:translate-x-[1px] active:shadow-none'
            }`}
          >
            <span aria-hidden="true" className="text-sm leading-none">
              {hideInPast ? '☑' : '☐'}
            </span>
            <span>{t('almanac_hide_past')}</span>
          </button>
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin px-3 sm:px-4 lg:px-6 py-4 sm:py-5">
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
          <div className="space-y-5">
            {groups.map((group) => (
              <section key={group.key}>
                <div
                  className={`${stickyHeaders ? 'sticky top-0 z-[1] -mx-3 sm:-mx-4 lg:-mx-6 px-3 sm:px-4 lg:px-6 bg-[var(--color-parchment-light)]/95 backdrop-blur-[1px]' : ''} py-1.5 flex items-center gap-3`}
                >
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
                  <span className="text-[10px] font-display tracking-widest text-[var(--color-ink-faded)]">
                    {group.events.length}
                  </span>
                </div>
                <ul className="mt-3 space-y-2.5">
                  {group.events.map((e) => {
                    const status = eventStatus(e, todayISO);
                    const label = statusLabel(e, todayISO, t);
                    const isPast = status === 'past';
                    const isImminent = status === 'ongoing' || status === 'tomorrow' || status === 'soon';
                    return (
                      <li
                        key={e.id}
                        className={`relative flex gap-2.5 sm:gap-3 p-2 sm:p-2.5 border-2 border-[var(--color-ink-black)] shadow-[3px_3px_0_0_var(--color-ink-black)] ${
                          isPast
                            ? 'bg-[var(--color-parchment)]/60 opacity-70'
                            : isImminent
                              ? 'bg-[var(--color-parchment-light)] outline outline-2 outline-offset-[3px] outline-[var(--color-gold)]'
                              : 'bg-[var(--color-parchment-light)]'
                        }`}
                      >
                        <DateRubric event={e} locale={lang} status={status} />

                        <div className="min-w-0 flex-1 flex flex-col justify-center">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className={`font-display font-bold text-sm sm:text-base leading-tight pr-1 break-words ${
                              isPast ? 'text-[var(--color-ink-faded)]' : 'text-[var(--color-ink-black)]'
                            }`}>
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
                            <span
                              title={e.countryName}
                              className="shrink-0 text-[10px] font-display font-bold tracking-[0.15em] bg-[var(--color-ink-black)] text-[var(--color-gold)] px-1.5 py-0.5 border-2 border-[var(--color-ink-black)] leading-none"
                            >
                              {e.country}
                            </span>
                          </div>
                          <div className="mt-0.5 text-[11px] sm:text-[12px] font-body italic text-[var(--color-ink-faded)] truncate">
                            {e.city}
                            {e.countryName && e.countryName !== e.city ? `, ${e.countryName}` : ''}
                          </div>
                          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                            <StatusPill status={status} label={label} />
                            {Array.isArray(e.weapons) && e.weapons.length > 0 &&
                              e.weapons.map((w) => (
                                <span
                                  key={w}
                                  className="text-[9px] font-display uppercase tracking-wider bg-[var(--color-parchment)] text-[var(--color-ink-black)] border border-[var(--color-ink-faded)] px-1.5 py-0.5 leading-none"
                                >
                                  {w}
                                </span>
                              ))}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>

      {showFooter && (
        <div className="px-3 sm:px-4 lg:px-6 py-3 border-t-2 border-[var(--color-ink-black)] bg-[var(--color-parchment-dark)]">
          <div className="flex items-center justify-between gap-3 text-[10px] font-display uppercase tracking-widest text-[var(--color-ink-faded)]">
            <span>{t('almanac_updated').replace('{date}', updatedLabel)}</span>
            <span>
              {filtered.length} {t('almanac_events_count')}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
