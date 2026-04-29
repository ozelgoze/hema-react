import { useTranslation } from '../i18n/LanguageContext';
import LanguageSelector from './LanguageSelector';
import TournamentList from './TournamentList';

const STEPS = [
  { num: '1', titleKey: 'landing_step_1_title', bodyKey: 'landing_step_1_body' },
  { num: '2', titleKey: 'landing_step_2_title', bodyKey: 'landing_step_2_body' },
  { num: '3', titleKey: 'landing_step_3_title', bodyKey: 'landing_step_3_body' },
  { num: '4', titleKey: 'landing_step_4_title', bodyKey: 'landing_step_4_body' },
];

const CONCEPTS = [
  { termKey: 'landing_concept_vornach_term', defKey: 'landing_concept_vornach_def' },
  { termKey: 'landing_concept_strongweak_term', defKey: 'landing_concept_strongweak_def' },
  { termKey: 'landing_concept_measure_term', defKey: 'landing_concept_measure_def' },
];

export default function LandingPage({ onEnter }) {
  const { t } = useTranslation();

  return (
    <div className="absolute inset-0 overflow-y-auto scrollbar-thin">
      <div className="vellum-vignette" aria-hidden="true" />

      <div className="relative z-[2] mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-10 pt-6 pb-10 sm:pt-8 sm:pb-14 safe-top safe-bottom">
        {/* Top bar — language selector */}
        <div className="flex justify-end mb-4 sm:mb-6">
          <LanguageSelector />
        </div>

        {/* Hero */}
        <header className="text-center mb-8 sm:mb-12 lg:mb-14 max-w-3xl mx-auto">
          <div className="text-[10px] sm:text-[11px] lg:text-xs uppercase tracking-[0.25em] sm:tracking-[0.32em] text-[var(--color-ink-faded)] font-display font-bold mb-3 px-2">
            {t('landing_eyebrow')}
          </div>
          <h1 className="font-display text-[clamp(1.875rem,5.2vw,3.25rem)] text-[var(--color-ink-red)] leading-[1.05] mb-4 px-2">
            {t('app_title')}
          </h1>
          <p className="font-body text-[var(--color-ink-black)]/85 text-sm sm:text-base lg:text-lg max-w-2xl mx-auto px-2 leading-relaxed">
            {t('landing_tagline')}
          </p>

          <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={onEnter}
              className="group inline-flex items-center justify-center gap-2.5 bg-[var(--color-ink-red)] text-[var(--color-parchment-light)] border-2 border-[var(--color-ink-black)] px-5 sm:px-6 py-3 sm:py-3.5 shadow-[4px_4px_0_0_var(--color-ink-black)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[5px_5px_0_0_var(--color-ink-black)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0_0_var(--color-ink-black)] transition-all"
            >
              <span className="font-display text-sm sm:text-base uppercase tracking-[0.15em] leading-none">
                {t('landing_cta')}
              </span>
              <span
                className="text-base leading-none transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              >
                →
              </span>
            </button>
            <a
              href="#calendar"
              className="inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-3 sm:py-3.5 bg-[var(--color-parchment-light)] text-[var(--color-ink-black)] border-2 border-[var(--color-ink-black)] shadow-[3px_3px_0_0_var(--color-ink-black)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0_0_var(--color-ink-black)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0_0_var(--color-ink-black)] transition-all font-display text-sm uppercase tracking-[0.15em] leading-none"
            >
              {t('landing_secondary_cta')}
            </a>
          </div>
        </header>

        {/* About + Calendar — two-column */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] gap-5 sm:gap-6 lg:gap-10 mb-10 sm:mb-14">
          {/* Left — about */}
          <section className="flex flex-col order-2 lg:order-1">
            <div className="bg-[var(--color-parchment-light)] border-2 border-[var(--color-ink-black)] shadow-[6px_6px_0_0_var(--color-ink-black)] p-5 sm:p-6 lg:p-7 flex flex-col">
              <h2 className="font-display text-xl sm:text-2xl text-[var(--color-ink-red)] mb-3 sm:mb-4 leading-tight">
                {t('landing_about_heading')}
              </h2>
              <p className="font-body text-[14px] sm:text-[15px] lg:text-base text-[var(--color-ink-black)] leading-relaxed">
                {t('landing_about_p1')}
              </p>
              <p className="font-body text-[14px] sm:text-[15px] lg:text-base text-[var(--color-ink-black)] leading-relaxed mt-3 sm:mt-4">
                {t('landing_about_p2')}
              </p>
              <p className="font-body text-[14px] sm:text-[15px] lg:text-base text-[var(--color-ink-black)] leading-relaxed mt-3 sm:mt-4">
                {t('landing_about_p3')}
              </p>

              <div
                className="my-5 sm:my-6 h-px w-full bg-[var(--color-ink-faded)]/30"
                aria-hidden="true"
              />

              {/* Feature list */}
              <ul className="space-y-2.5 sm:space-y-3">
                {['landing_feature_1', 'landing_feature_2', 'landing_feature_3'].map((key) => (
                  <li key={key} className="flex items-start gap-3">
                    <span
                      className="text-[var(--color-ink-red)] text-sm leading-none mt-1.5 shrink-0"
                      aria-hidden="true"
                    >
                      ▪
                    </span>
                    <span className="font-body text-[13px] sm:text-[14px] text-[var(--color-ink-black)] leading-snug">
                      {t(key)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Right — calendar */}
          <section id="calendar" className="flex flex-col order-1 lg:order-2 min-w-0 scroll-mt-6">
            <div className="bg-[var(--color-parchment-light)] border-2 border-[var(--color-ink-black)] shadow-[6px_6px_0_0_var(--color-ink-black)] flex flex-col overflow-hidden">
              <div className="px-4 sm:px-5 lg:px-6 pt-4 sm:pt-5 pb-3 border-b-2 border-[var(--color-ink-black)] bg-[var(--color-parchment-dark)]">
                <div className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] sm:tracking-[0.25em] text-[var(--color-ink-faded)] font-display font-bold leading-none mb-1.5">
                  {t('almanac_subtitle')}
                </div>
                <h2 className="font-display text-base sm:text-lg lg:text-xl text-[var(--color-ink-red)] leading-tight">
                  {t('almanac_title')}
                </h2>
              </div>

              <TournamentList
                showFilters
                showFooter
                stickyHeaders={false}
                className="h-[min(70vh,640px)] lg:h-[min(75vh,720px)]"
              />
            </div>
          </section>
        </div>

        {/* How it works — 4 steps */}
        <section className="mb-10 sm:mb-14">
          <div className="text-center mb-5 sm:mb-7">
            <div className="text-[10px] sm:text-[11px] uppercase tracking-[0.25em] text-[var(--color-ink-faded)] font-display font-bold mb-1.5">
              {t('landing_steps_eyebrow')}
            </div>
            <h2 className="font-display text-2xl sm:text-3xl text-[var(--color-ink-red)] leading-tight">
              {t('landing_steps_heading')}
            </h2>
          </div>
          <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {STEPS.map((s, i) => (
              <li
                key={s.num}
                className="relative bg-[var(--color-parchment-light)] border-2 border-[var(--color-ink-black)] shadow-[4px_4px_0_0_var(--color-ink-black)] p-4 sm:p-5"
              >
                <div className="flex items-baseline gap-3 mb-2">
                  <span className="font-display text-3xl sm:text-4xl text-[var(--color-ink-red)] leading-none">
                    {s.num}
                  </span>
                  <h3 className="font-display text-base sm:text-lg text-[var(--color-ink-black)] leading-tight">
                    {t(s.titleKey)}
                  </h3>
                </div>
                <p className="font-body text-[13px] sm:text-[14px] text-[var(--color-ink-black)]/85 leading-snug">
                  {t(s.bodyKey)}
                </p>
                {i < STEPS.length - 1 && (
                  <span
                    className="hidden lg:flex absolute top-1/2 -right-3 -translate-y-1/2 w-6 h-6 items-center justify-center bg-[var(--color-parchment)] border-2 border-[var(--color-ink-black)] text-[var(--color-ink-black)] text-xs leading-none"
                    aria-hidden="true"
                  >
                    →
                  </span>
                )}
              </li>
            ))}
          </ol>
        </section>

        {/* Key concepts — glossary */}
        <section className="mb-10 sm:mb-14">
          <div className="text-center mb-5 sm:mb-7">
            <div className="text-[10px] sm:text-[11px] uppercase tracking-[0.25em] text-[var(--color-ink-faded)] font-display font-bold mb-1.5">
              {t('landing_concepts_eyebrow')}
            </div>
            <h2 className="font-display text-2xl sm:text-3xl text-[var(--color-ink-red)] leading-tight">
              {t('landing_concepts_heading')}
            </h2>
          </div>
          <dl className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 bg-[var(--color-parchment-light)] border-2 border-[var(--color-ink-black)] shadow-[6px_6px_0_0_var(--color-ink-black)] p-5 sm:p-6 lg:p-7">
            {CONCEPTS.map((c, i) => (
              <div
                key={c.termKey}
                className={`flex flex-col ${i > 0 ? 'md:border-l-2 md:border-dashed md:border-[var(--color-ink-faded)]/40 md:pl-5 lg:pl-6' : ''}`}
              >
                <dt className="font-display text-base sm:text-lg text-[var(--color-ink-red)] leading-tight mb-2 tracking-wide">
                  {t(c.termKey)}
                </dt>
                <dd className="font-body text-[13px] sm:text-[14px] text-[var(--color-ink-black)] leading-relaxed">
                  {t(c.defKey)}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Footer */}
        <footer className="text-center px-3">
          <div
            className="mb-3 mx-auto h-px w-20 bg-[var(--color-ink-faded)]/30"
            aria-hidden="true"
          />
          <p className="font-body text-[11px] sm:text-[12px] text-[var(--color-ink-faded)]">
            {t('landing_footer')}
          </p>
        </footer>
      </div>
    </div>
  );
}
