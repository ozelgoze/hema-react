import { useTranslation } from '../i18n/LanguageContext';
import LanguageSelector from './LanguageSelector';
import TournamentList from './TournamentList';

export default function LandingPage({ onEnter }) {
  const { t } = useTranslation();

  return (
    <div className="absolute inset-0 overflow-y-auto scrollbar-thin">
      <div className="vellum-vignette" aria-hidden="true" />

      <div className="relative z-[2] mx-auto max-w-6xl px-4 sm:px-6 md:px-10 py-8 md:py-12 safe-top safe-bottom">
        {/* Top bar — language selector */}
        <div className="flex justify-end mb-4">
          <LanguageSelector />
        </div>

        {/* Manuscript Header */}
        <header className="text-center mb-8 md:mb-12">
          <div
            className="inline-flex items-center justify-center w-20 h-20 md:w-24 md:h-24 bg-[var(--color-gold)] border-[3px] border-[var(--color-ink-black)] shadow-[6px_6px_0_0_var(--color-ink-black)] rotate-[-4deg] mb-6"
            aria-hidden="true"
          >
            <span className="font-display text-4xl md:text-5xl text-[var(--color-ink-black)] leading-none">⚔</span>
          </div>
          <div className="text-[11px] md:text-xs uppercase tracking-[0.35em] text-[var(--color-ink-faded)] font-display font-bold mb-2">
            {t('landing_eyebrow')}
          </div>
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl text-[var(--color-ink-red)] leading-tight mb-3">
            {t('app_title')}
          </h1>
          <p className="font-body italic text-[var(--color-ink-faded)] text-base md:text-lg max-w-2xl mx-auto">
            {t('landing_tagline')}
          </p>
          <div className="ornamental-rule mt-6 max-w-md mx-auto">
            <span className="ornamental-rule__glyph">❦ ✦ ❦</span>
          </div>
        </header>

        {/* Two-column body */}
        <div className="grid md:grid-cols-[1.05fr_1fr] gap-6 md:gap-10">
          {/* Left — what is this */}
          <section className="flex flex-col">
            <div className="bg-[var(--color-parchment-light)] border-2 border-[var(--color-ink-black)] shadow-[6px_6px_0_0_var(--color-ink-black)] p-6 md:p-7">
              <h2 className="font-display text-xl md:text-2xl text-[var(--color-ink-red)] mb-4 leading-tight">
                {t('landing_about_heading')}
              </h2>
              <p className="font-body text-[15px] md:text-base text-[var(--color-ink-black)] leading-relaxed drop-cap">
                {t('landing_about_p1')}
              </p>
              <p className="font-body text-[15px] md:text-base text-[var(--color-ink-black)] leading-relaxed mt-4">
                {t('landing_about_p2')}
              </p>
              <p className="font-body text-[15px] md:text-base text-[var(--color-ink-black)] leading-relaxed mt-4">
                {t('landing_about_p3')}
              </p>

              <div className="ornamental-rule my-5">
                <span className="ornamental-rule__glyph">✧</span>
              </div>

              {/* Feature list */}
              <ul className="space-y-2.5 mb-6">
                {[
                  ['⚔', 'landing_feature_1'],
                  ['☩', 'landing_feature_2'],
                  ['❦', 'landing_feature_3'],
                ].map(([glyph, key]) => (
                  <li key={key} className="flex items-start gap-3">
                    <span className="font-display text-[var(--color-ink-red)] text-lg leading-none mt-0.5 shrink-0" aria-hidden="true">
                      {glyph}
                    </span>
                    <span className="font-body text-[14px] text-[var(--color-ink-black)] leading-snug">
                      {t(key)}
                    </span>
                  </li>
                ))}
              </ul>

              {/* Primary CTA */}
              <button
                onClick={onEnter}
                className="group w-full flex items-center justify-center gap-3 bg-[var(--color-ink-red)] text-[var(--color-parchment-light)] border-[3px] border-[var(--color-ink-black)] px-5 py-4 shadow-[5px_5px_0_0_var(--color-ink-black)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[6px_6px_0_0_var(--color-ink-black)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0_0_var(--color-ink-black)] transition-all"
              >
                <span className="font-display text-2xl leading-none" aria-hidden="true">⚔</span>
                <span className="text-left">
                  <span className="block font-display text-lg md:text-xl uppercase tracking-widest leading-none">
                    {t('landing_cta')}
                  </span>
                  <span className="block font-body italic text-[12px] md:text-[13px] mt-1 opacity-90">
                    {t('landing_cta_subtitle')}
                  </span>
                </span>
                <span
                  className="font-display text-2xl leading-none transition-transform group-hover:translate-x-1"
                  aria-hidden="true"
                >
                  →
                </span>
              </button>
            </div>
          </section>

          {/* Right — calendar */}
          <section className="flex flex-col">
            <div className="bg-[var(--color-parchment-light)] border-2 border-[var(--color-ink-black)] shadow-[6px_6px_0_0_var(--color-ink-black)] flex flex-col overflow-hidden">
              <div className="px-5 sm:px-6 pt-5 pb-3 border-b-2 border-[var(--color-ink-black)] bg-[var(--color-parchment-dark)] flex items-center gap-3">
                <span
                  className="font-display text-xl text-[var(--color-ink-red)] leading-none"
                  aria-hidden="true"
                >
                  ✦
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] uppercase tracking-[0.25em] text-[var(--color-ink-faded)] font-display font-bold leading-none mb-1">
                    {t('almanac_subtitle')}
                  </div>
                  <h2 className="font-display text-lg md:text-xl text-[var(--color-ink-red)] leading-tight">
                    {t('almanac_title')}
                  </h2>
                </div>
              </div>

              <TournamentList
                showFilters
                showFooter
                stickyHeaders={false}
                className="max-h-[640px]"
              />
            </div>
          </section>
        </div>

        {/* Footer */}
        <footer className="mt-10 md:mt-14 text-center">
          <div className="ornamental-rule mb-3 max-w-sm mx-auto">
            <span className="ornamental-rule__glyph">❦</span>
          </div>
          <p className="font-body italic text-[12px] text-[var(--color-ink-faded)]">
            {t('landing_footer')}
          </p>
        </footer>
      </div>
    </div>
  );
}
