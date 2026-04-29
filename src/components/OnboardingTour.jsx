import { useEffect, useRef, useState } from 'react';
import { useTranslation } from '../i18n/LanguageContext';
import { markOnboardingSeen } from '../utils/onboardingState';

const STEP_COUNT = 6;

const STEP_GLYPHS = ['❦', '⚔', '⇆', '✦', '🎭', '📜'];

export default function OnboardingTour({ open, onClose }) {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const previouslyFocusedRef = useRef(null);

  useEffect(() => {
    if (open) setStep(0);
  }, [open]);

  // Capture the element that opened the tour so we can hand focus back when it closes.
  useEffect(() => {
    if (!open) return;
    previouslyFocusedRef.current = document.activeElement;
    return () => {
      const target = previouslyFocusedRef.current;
      if (target && typeof target.focus === 'function') {
        // Defer until after React has unmounted the dialog so the focus actually lands.
        requestAnimationFrame(() => target.focus());
      }
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        setStep((s) => (s < STEP_COUNT - 1 ? s + 1 : s));
      } else if (e.key === 'ArrowLeft') {
        setStep((s) => (s > 0 ? s - 1 : s));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const isLast = step === STEP_COUNT - 1;
  const titleKey = `onboarding_step${step + 1}_title`;
  const bodyKey = `onboarding_step${step + 1}_body`;
  const glyph = STEP_GLYPHS[step] || '❦';

  const finish = () => {
    markOnboardingSeen();
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
      className="fixed inset-0 z-[200] flex items-center justify-center px-4 py-6 animate-fade-in"
    >
      <div
        onClick={finish}
        className="absolute inset-0 bg-[var(--color-ink-black)]/75 backdrop-blur-[2px]"
        aria-hidden="true"
      />

      <div className="relative w-full max-w-[520px] max-h-[calc(100dvh-3rem)] overflow-y-auto bg-[var(--color-parchment-light)] border-[3px] border-[var(--color-ink-black)] shadow-[8px_8px_0_0_var(--color-ink-black)] flex flex-col">
        {/* Skip button — top right */}
        <button
          onClick={finish}
          aria-label={t('onboarding_skip')}
          className="absolute top-2 right-2 w-9 h-9 flex items-center justify-center bg-[var(--color-parchment)] border-2 border-[var(--color-ink-black)] text-[var(--color-ink-black)] hover:bg-[var(--color-ink-red)] hover:text-[var(--color-parchment-light)] transition-colors shadow-[2px_2px_0_0_var(--color-ink-black)] active:translate-y-[1px] active:translate-x-[1px] active:shadow-none font-bold leading-none text-lg"
        >
          ✕
        </button>

        {/* Header — illuminated initial */}
        <div className="px-6 pt-7 pb-4 border-b-2 border-[var(--color-ink-black)] bg-[var(--color-parchment-dark)]">
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 shrink-0 flex items-center justify-center bg-[var(--color-gold)] border-2 border-[var(--color-ink-black)] shadow-[3px_3px_0_0_var(--color-ink-black)] rotate-[-4deg]"
              aria-hidden="true"
            >
              <span className="font-display text-2xl text-[var(--color-ink-black)] leading-none">
                {glyph}
              </span>
            </div>
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-[0.25em] text-[var(--color-ink-faded)] font-display font-bold mb-1">
                {t('onboarding_step_label')
                  .replace('{current}', step + 1)
                  .replace('{total}', STEP_COUNT)}
              </div>
              <h2
                id="onboarding-title"
                className="font-display text-xl md:text-2xl text-[var(--color-ink-red)] leading-tight"
              >
                {t(titleKey)}
              </h2>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex-1">
          <div className="ornamental-rule mb-4">
            <span className="ornamental-rule__glyph">❦</span>
          </div>
          <p className="font-body text-[15px] md:text-base leading-relaxed text-[var(--color-ink-black)] whitespace-pre-line">
            {t(bodyKey)}
          </p>
        </div>

        {/* Progress pips — heraldic lozenges */}
        <div className="px-6 py-3 flex items-center justify-center gap-2 border-t-2 border-dashed border-[var(--color-ink-faded)]/50">
          {Array.from({ length: STEP_COUNT }).map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              aria-label={`${t('onboarding_step_label').replace('{current}', i + 1).replace('{total}', STEP_COUNT)}`}
              aria-current={i === step ? 'step' : undefined}
              className={`w-3 h-3 rotate-45 border border-[var(--color-ink-black)] transition-colors ${
                i === step
                  ? 'bg-[var(--color-ink-red)]'
                  : i < step
                    ? 'bg-[var(--color-gold)]'
                    : 'bg-[var(--color-parchment)]'
              }`}
            />
          ))}
        </div>

        {/* Footer — nav buttons */}
        <div className="px-4 py-4 flex items-center justify-between gap-2 border-t-2 border-[var(--color-ink-black)] bg-[var(--color-parchment-dark)] safe-bottom">
          <button
            onClick={finish}
            className="px-3 py-2.5 text-[11px] font-display uppercase tracking-widest text-[var(--color-ink-faded)] hover:text-[var(--color-ink-red)] transition-colors min-h-[44px]"
          >
            {t('onboarding_skip')}
          </button>

          <div className="flex gap-2">
            <button
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              className="px-4 py-2.5 min-h-[44px] bg-[var(--color-parchment-light)] text-[var(--color-ink-black)] border-2 border-[var(--color-ink-black)] font-display text-[11px] font-bold uppercase tracking-widest shadow-[3px_3px_0_0_var(--color-ink-black)] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none disabled:opacity-30 disabled:cursor-not-allowed disabled:active:translate-x-0 disabled:active:translate-y-0 disabled:active:shadow-[3px_3px_0_0_var(--color-ink-black)] transition-all"
            >
              {t('onboarding_back')}
            </button>
            <button
              onClick={() => (isLast ? finish() : setStep((s) => s + 1))}
              autoFocus
              className="px-4 py-2.5 min-h-[44px] bg-[var(--color-ink-black)] text-[var(--color-gold)] border-2 border-[var(--color-ink-black)] font-display text-[11px] font-bold uppercase tracking-widest shadow-[3px_3px_0_0_var(--color-ink-red)] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none transition-all"
            >
              {isLast ? t('onboarding_finish') : t('onboarding_next')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
