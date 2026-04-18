import { memo, useEffect, useRef, useState } from 'react';
import { useTranslation } from '../i18n/LanguageContext';
import { MEASURE } from '../data/hemaMoves';

// Measure tier → pixel gap between the two fencer glyphs.
// Two sets tuned to viewport: mobile stays compact so narrow phones (≤360px) don't overflow.
const TIER_GAP_MOBILE = {
  [MEASURE.NAHE]: 2,
  [MEASURE.MITTEL]: 28,
  [MEASURE.WEIT]: 60,
};
const TIER_GAP_DESKTOP = {
  [MEASURE.NAHE]: 4,
  [MEASURE.MITTEL]: 52,
  [MEASURE.WEIT]: 104,
};

const TIER_KEY = {
  [MEASURE.NAHE]: 'measure_nahe',
  [MEASURE.MITTEL]: 'measure_mittel',
  [MEASURE.WEIT]: 'measure_weit',
};

// Stylized fencer silhouette — compact SVG, woodcut-feel.
const FencerGlyph = ({ facing, color }) => (
  <svg
    viewBox="0 0 24 40"
    width="22"
    height="36"
    style={{ transform: facing === 'right' ? 'scaleX(-1)' : 'none' }}
    className="drop-shadow-sm"
    aria-hidden="true"
  >
    {/* head */}
    <circle cx="12" cy="5" r="3" fill={color} />
    {/* torso */}
    <path d="M9 8 L15 8 L16 22 L8 22 Z" fill={color} />
    {/* lead leg */}
    <path d="M8 22 L6 38 L9 38 L11 22 Z" fill={color} />
    {/* rear leg */}
    <path d="M13 22 L15 38 L18 38 L16 22 Z" fill={color} />
    {/* sword arm + blade pointing inward (inward because we scaleX the right fencer) */}
    <path d="M15 10 L22 10 L22 11 L15 12 Z" fill={color} />
    <rect x="22" y="9.5" width="18" height="1.8" fill={color} />
  </svg>
);

function MeasureGauge({ tier }) {
  const { t } = useTranslation();
  const [pulse, setPulse] = useState(false);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);
  const prevTier = useRef(tier);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Trigger a brief pulse animation when the measure changes.
  useEffect(() => {
    if (prevTier.current !== tier) {
      setPulse(true);
      const timer = setTimeout(() => setPulse(false), 450);
      prevTier.current = tier;
      return () => clearTimeout(timer);
    }
  }, [tier]);

  const gapMap = isMobile ? TIER_GAP_MOBILE : TIER_GAP_DESKTOP;
  const gap = gapMap[tier] ?? gapMap[MEASURE.MITTEL];
  const label = t(TIER_KEY[tier] ?? TIER_KEY[MEASURE.MITTEL]);

  return (
    <div className="px-3 md:px-4 py-2 bg-[var(--color-parchment)] border-b-[2px] border-[var(--color-ink-black)]">
      <div className="flex items-center justify-between gap-2 md:gap-3">
        <span className="text-[9px] uppercase font-bold tracking-widest text-[var(--color-ink-black)] shrink-0">
          {t('measure_label')}
        </span>

        <div className={`relative flex items-center justify-center flex-1 min-w-0 h-[40px] md:h-[42px] ${pulse ? 'animate-pulse' : ''}`}>
          {/* Center track — marks the ideal contact point */}
          <div className="absolute inset-x-2 top-1/2 -translate-y-1/2 border-t border-dashed border-[var(--color-ink-faded)]/60 pointer-events-none" />

          {/* The two fencers, with a transitioning gap */}
          <div
            className="flex items-end justify-center"
            style={{ gap: `${gap}px`, transition: 'gap 0.45s cubic-bezier(0.22, 1, 0.36, 1)' }}
          >
            <FencerGlyph facing="left" color="var(--color-ink-black)" />
            <FencerGlyph facing="right" color="var(--color-ink-red)" />
          </div>
        </div>

        <span
          className={`text-[9px] md:text-xs font-display font-bold uppercase tracking-wider md:tracking-widest text-[var(--color-ink-red)] shrink-0 text-right max-w-[90px] md:max-w-none leading-tight transition-colors ${pulse ? 'text-[var(--color-gold)]' : ''}`}
        >
          {label}
        </span>
      </div>
    </div>
  );
}

export default memo(MeasureGauge);
