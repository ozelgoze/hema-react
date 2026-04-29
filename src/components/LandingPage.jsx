import { useTranslation } from '../i18n/LanguageContext';
import LanguageSelector from './LanguageSelector';
import TournamentList from './TournamentList';

export default function LandingPage({ onEnter }) {
  const { t } = useTranslation();

  return (
    <div className="absolute inset-0 overflow-y-auto scrollbar-thin">
      <div className="vellum-vignette" aria-hidden="true" />

      <div className="relative z-[2] mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-10 pt-6 pb-10 sm:pt-8 sm:pb-14 safe-top safe-bottom">
        {/* Top bar — language selector */}
        <div className="flex justify-end mb-3 sm:mb-4">
          <LanguageSelector />
        </div>

        {/* Manuscript Header */}
        <header className="text-center mb-6 sm:mb-10 lg:mb-12">
          <div
            className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-[var(--color-gold)] border-[3px] border-[var(--color-ink-black)] shadow-[6px_6px_0_0_var(--color-ink-black)] rotate-[-4deg] mb-4 sm:mb-6"
            aria-hidden="true"
          >
            <span className="font-display text-3xl sm:text-4xl lg:text-5xl text-[var(--color-ink-black)] leading-none">⚔</span>
          </div>
          <div className="text-[10px] sm:text-[11px] lg:text-xs uppercase tracking-[0.25em] sm:tracking-[0.35em] text-[var(--color-ink-faded)] font-display font-bold mb-2 px-2">
            {t('landing_eyebrow')}
          </div>
          <h1 className="font-display text-[clamp(1.75rem,5vw,3rem)] text-[var(--color-ink-red)] leading-[1.05] mb-3 px-2">
            {t('app_title')}
          </h1>
          <p className="font-body italic text-[var(--color-ink-faded)] text-sm sm:text-base lg:text-lg max-w-2xl mx-auto px-2">
            {t('landing_tagline')}
          </p>
          <div className="ornamental-rule mt-4 sm:mt-6 max-w-md mx-auto">
            <span className="ornamental-rule__glyph">❦ ✦ ❦</span>
          </div>
        </header>

        {/* Two-column body — switches at lg (1024) so mid-tablet stays stacked */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] gap-5 sm:gap-6 lg:gap-10">
          {/* Left — what is this */}
          <section className="flex flex-col order-2 lg:order-1">
            <div className="bg-[var(--color-parchment-light)] border-2 border-[var(--color-ink-black)] shadow-[6px_6px_0_0_var(--color-ink-black)] p-5 sm:p-6 lg:p-7 flex flex-col">
              <h2 className="font-display text-xl sm:text-2xl text-[var(--color-ink-red)] mb-3 sm:mb-4 leading-tight">
                {t('landing_about_heading')}
              </h2>
              <p className="font-body text-[14px] sm:text-[15px] lg:text-base text-[var(--color-ink-black)] leading-relaxed drop-cap">
                {t('landing_about_p1')}
              </p>
              <p className="font-body text-[14px] sm:text-[15px] lg:text-base text-[var(--color-ink-black)] leading-relaxed mt-3 sm:mt-4">
                {t('landing_about_p2')}
              </p>
              <p className="font-body text-[14px] sm:text-[15px] lg:text-base text-[var(--color-ink-black)] leading-relaxed mt-3 sm:mt-4">
                {t('landing_about_p3')}
              </p>

              <div className="ornamental-rule my-4 sm:my-5">
                <span className="ornamental-rule__glyph">✧</span>
              </div>

              {/* Feature list */}
              <ul className="space-y-2 sm:space-y-2.5 mb-5 sm:mb-6">
                {[
                  ['⚔', 'landing_feature_1'],
                  ['☩', 'landing_feature_2'],
                  ['❦', 'landing_feature_3'],
                ].map(([glyph, key]) => (
                  <li key={key} className="flex items-start gap-3">
                    <span className="font-display text-[var(--color-ink-red)] text-lg leading-none mt-0.5 shrink-0" aria-hidden="true">
                      {glyph}
                    </span>
                    <span className="font-body text-[13px] sm:text-[14px] text-[var(--color-ink-black)] leading-snug">
                      {t(key)}
                    </span>
                  </li>
                ))}
              </ul>

              {/* Primary CTA */}
              <button
                onClick={onEnter}
                className="group mt-auto w-full flex items-center justify-center gap-2 sm:gap-3 bg-[var(--color-ink-red)] text-[var(--color-parchment-light)] border-[3px] border-[var(--color-ink-black)] px-3 sm:px-5 py-3 sm:py-4 shadow-[5px_5px_0_0_var(--color-ink-black)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[6px_6px_0_0_var(--color-ink-black)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0_0_var(--color-ink-black)] transition-all"
              >
                <span className="font-display text-xl sm:text-2xl leading-none shrink-0" aria-hidden="true">⚔</span>
                <span className="text-left min-w-0">
                  <span className="block font-display text-base sm:text-lg lg:text-xl uppercase tracking-[0.15em] sm:tracking-widest leading-none">
                    {t('landing_cta')}
                  </span>
                  <span className="block font-body italic text-[11px] sm:text-[12px] lg:text-[13px] mt-1 opacity-90">
                    {t('landing_cta_subtitle')}
                  </span>
                </span>
                <span
                  className="font-display text-xl sm:text-2xl leading-none shrink-0 transition-transform group-hover:translate-x-1"
                  aria-hidden="true"
                >
                  →
                </span>
              </button>
            </div>
          </section>

          {/* Right — calendar */}
          <section className="flex flex-col order-1 lg:order-2 min-w-0">
            <div className="bg-[var(--color-parchment-light)] border-2 border-[var(--color-ink-black)] shadow-[6px_6px_0_0_var(--color-ink-black)] flex flex-col overflow-hidden">
              <div className="px-4 sm:px-5 lg:px-6 pt-4 sm:pt-5 pb-3 border-b-2 border-[var(--color-ink-black)] bg-[var(--color-parchment-dark)] flex items-center gap-3">
                <span
                  className="font-display text-xl text-[var(--color-ink-red)] leading-none shrink-0"
                  aria-hidden="true"
                >
                  ✦
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] sm:tracking-[0.25em] text-[var(--color-ink-faded)] font-display font-bold leading-none mb-1">
                    {t('almanac_subtitle')}
                  </div>
                  <h2 className="font-display text-base sm:text-lg lg:text-xl text-[var(--color-ink-red)] leading-tight">
                    {t('almanac_title')}
                  </h2>
                </div>
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

        {/* Footer */}
        <footer className="mt-8 sm:mt-10 lg:mt-14 text-center px-3">
          <div className="ornamental-rule mb-3 max-w-sm mx-auto">
            <span className="ornamental-rule__glyph">❦</span>
          </div>
          <p className="font-body italic text-[11px] sm:text-[12px] text-[var(--color-ink-faded)]">
            {t('landing_footer')}
          </p>
        </footer>
      </div>
    </div>
  );
}
