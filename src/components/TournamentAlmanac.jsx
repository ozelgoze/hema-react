import { useEffect } from 'react';
import { useTranslation } from '../i18n/LanguageContext';
import TournamentList from './TournamentList';

export default function TournamentAlmanac({ open, onClose }) {
  const { t } = useTranslation();

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

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

      <div className="relative w-full max-w-[680px] max-h-[calc(100dvh-3rem)] flex flex-col bg-[var(--color-parchment-light)] border-[3px] border-[var(--color-ink-black)] shadow-[8px_8px_0_0_var(--color-ink-black)]">
        <button
          onClick={onClose}
          aria-label={t('close')}
          className="absolute top-2 right-2 z-10 w-9 h-9 flex items-center justify-center bg-[var(--color-parchment)] border-2 border-[var(--color-ink-black)] text-[var(--color-ink-black)] hover:bg-[var(--color-ink-red)] hover:text-[var(--color-parchment-light)] transition-colors shadow-[2px_2px_0_0_var(--color-ink-black)] active:translate-y-[1px] active:translate-x-[1px] active:shadow-none font-bold leading-none text-lg"
        >
          ✕
        </button>

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

        <TournamentList showFilters showFooter stickyHeaders className="flex-1 min-h-0" />
      </div>
    </div>
  );
}
