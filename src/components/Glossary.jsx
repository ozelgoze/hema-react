import { useState, useRef, useEffect, useId, memo } from 'react';
import { useTranslation } from '../i18n/LanguageContext';

/**
 * Inline glossary tooltip for HEMA terms.
 *
 * Usage: <Glossary term="weit">Weit / Larga</Glossary>
 *   - looks up `glossary_<term>_title` and `glossary_<term>_body` from i18n.
 *
 * Desktop: hover or focus opens the popover.
 * Mobile/touch: tap toggles; click outside closes.
 */
function Glossary({ term, children, className = '' }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const id = useId();

  const titleKey = `glossary_${term}_title`;
  const bodyKey = `glossary_${term}_body`;
  const title = t(titleKey);
  const body = t(bodyKey);

  // Close on outside tap (mobile) and on Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <span
      ref={wrapRef}
      className={`relative inline-block ${className}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        aria-describedby={open ? id : undefined}
        aria-expanded={open}
        className="inline cursor-help underline decoration-dotted decoration-[var(--color-ink-red)] decoration-1 underline-offset-[3px] hover:text-[var(--color-ink-red)] focus:outline-none focus-visible:bg-[var(--color-gold)]/30"
      >
        {children}
      </button>

      {open && (
        <span
          id={id}
          role="tooltip"
          className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-[150] w-[260px] max-w-[80vw] bg-[var(--color-parchment-light)] border-2 border-[var(--color-ink-black)] shadow-[4px_4px_0_0_var(--color-ink-black)] px-3 py-2.5 pointer-events-none animate-fade-in text-left"
        >
          <span className="block font-display text-[12px] uppercase tracking-widest text-[var(--color-ink-red)] mb-1 leading-none">
            {title}
          </span>
          <span className="block text-[12.5px] leading-snug font-body text-[var(--color-ink-black)] normal-case tracking-normal">
            {body}
          </span>
        </span>
      )}
    </span>
  );
}

export default memo(Glossary);
