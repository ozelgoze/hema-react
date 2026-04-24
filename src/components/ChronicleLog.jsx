import { useState, useEffect, useRef } from 'react';
import { useTranslation } from '../i18n/LanguageContext';

export default function ChronicleLog({ nodes }) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const scrollRef = useRef(null);

  // Auto-scroll when new nodes arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [nodes, isOpen]);

  const getMasterQuote = (nameKey) => {
    if (!nameKey) return null;
    if (nameKey === 'move_high_cut') {
      const quotes = ['quote_liech_zornhau', 'quote_meyer_zornhau', 'quote_fiore_fendente'];
      return t(quotes[Math.floor(Math.random() * quotes.length)]);
    }
    if (nameKey === 'move_wind' || nameKey === 'move_wind_thrust') {
      const quotes = ['quote_liech_winden', 'quote_vadi_winden'];
      return t(quotes[Math.floor(Math.random() * quotes.length)]);
    }
    if (nameKey === 'move_chase') {
      return t('quote_liech_nachreisen');
    }
    if (nameKey === 'move_grapple') {
      return t('quote_fiore_stretto');
    }
    const generics = ['quote_generic_1', 'quote_generic_2'];
    return t(generics[Math.floor(Math.random() * generics.length)]);
  };

  const generateNarrative = (node, index) => {
    const moveName = node.data.nameKey ? t(node.data.nameKey) : '';
    const role = node.data.nodeRole;
    const quote = getMasterQuote(node.data.nameKey);

    const renderQuote = () => {
      if (!quote) return null;
      return (
        <div className="mt-3 py-2 px-3 border-l-4 border-[var(--color-ink-red)] bg-[var(--color-parchment-dark)] shadow-[2px_2px_0_0_var(--color-ink-faded)]">
           <p className="text-xs font-display text-[var(--color-ink-black)] italic leading-tight">
             {quote}
           </p>
        </div>
      );
    }
    
    if (index === 0) {
      return (
        <span className="block mb-2">
          <span className="drop-cap text-3xl font-display text-[var(--color-ink-red)] float-left leading-none pr-1">
            {t('chronicle_narrator_opening').charAt(0)}
          </span>
          <span className="leading-relaxed">
            {t('chronicle_narrator_opening').slice(1).replace('{moveName}', moveName)}
          </span>
          {renderQuote()}
        </span>
      );
    }

    if (role === 'opponent-action') {
      return (
        <span className="block mb-2 mt-4 text-[var(--color-ink-black)] italic border-l-2 border-[var(--color-ink-faded)] pl-3">
          {t('chronicle_narrator_opponent').replace('{moveName}', moveName)}
          {renderQuote()}
        </span>
      );
    }

    if (role === 'user-action') {
      if (node.data.finisherFailure) {
        return (
          <span className="block mb-2 mt-4 border-l-2 border-dashed border-[var(--color-ink-red)] pl-3 text-[var(--color-ink-black)]">
            <span className="block font-display text-[10px] uppercase tracking-widest text-[var(--color-ink-red)] mb-1">
              Ictus Vanus
            </span>
            {t('chronicle_narrator_whiff').replace('{moveName}', moveName)}
          </span>
        );
      }
      return (
        <span className="block mb-2 mt-4">
          {t('chronicle_narrator_user').replace('{moveName}', moveName)}
          {renderQuote()}
        </span>
      );
    }

    if (role === 'scoring-point') {
      return (
        <span className="block mt-6 p-3 bg-[var(--color-gold)] border border-[var(--color-ink-black)] shadow-[4px_4px_0_0_var(--color-ink-black)]">
          <strong className="font-display uppercase tracking-widest block mb-1">Finis Coronat Opus</strong>
          {t('chronicle_narrator_win').replace('{moveName}', moveName)}
        </span>
      );
    }

    if (role === 'opponent-point') {
      return (
        <span className="block mt-6 p-3 bg-[var(--color-ink-red)] text-[var(--color-parchment-light)] border border-[var(--color-ink-black)] shadow-[4px_4px_0_0_var(--color-ink-black)]">
          <strong className="font-display uppercase tracking-widest block mb-1">Mors Certa</strong>
          {t('chronicle_narrator_loss').replace('{moveName}', moveName)}
        </span>
      );
    }

    return null;
  };

  return (
    <>
    {/* Mobile backdrop — tap to close; also blocks React Flow pan behind drawer */}
    {isOpen && (
      <div
        onClick={() => setIsOpen(false)}
        className="md:hidden fixed inset-0 bg-[var(--color-ink-black)]/60 z-30 backdrop-blur-sm touch-none animate-fade-in"
        aria-hidden="true"
      />
    )}
    <div className={`fixed z-40 transition-all duration-300 pointer-events-auto
        ${isOpen ? 'right-0 top-0 h-full md:bottom-24 md:top-4 md:right-4 md:h-auto' : 'right-3 top-[72px] md:top-4 md:right-4 md:bottom-auto'}
      `}
    >
      {/* Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          aria-label={t('chronicle_open')}
          aria-expanded={isOpen}
          className="bg-[var(--color-parchment-dark)] border-2 border-[var(--color-ink-black)] text-[var(--color-ink-black)] font-display font-bold px-3 py-2 text-xs md:text-sm uppercase tracking-widest shadow-[4px_4px_0_0_var(--color-ink-black)] hover:bg-[var(--color-ink-black)] hover:text-[var(--color-parchment)] transition-all flex items-center gap-1.5 min-h-[44px] min-w-[44px] justify-center"
        >
          <span className="text-base filter grayscale">📜</span>
          <span className="hidden md:inline">{t('chronicle_open')}</span>
        </button>
      )}

      {/* The Chronicle Modal / Drawer */}
      <div
        className={`bg-[var(--color-parchment)] border-l-4 md:border-2 border-[var(--color-ink-black)] w-[85vw] max-w-[360px] md:w-96 flex flex-col shadow-[-10px_0_30px_rgba(0,0,0,0.5)] md:shadow-[10px_10px_0_0_rgba(42,37,34,0.3)] transition-all duration-300 origin-right
          ${isOpen ? 'scale-x-100 h-full h-dvh md:h-[60vh] max-h-[100vh] md:max-h-[600px]' : 'scale-x-0 h-0 hidden'}
        `}
      >
        <div className="flex justify-between items-center bg-[var(--color-ink-black)] text-[var(--color-parchment-light)] px-4 py-3 border-b-2 border-[var(--color-ink-black)] safe-top">
          <h2 className="font-display text-lg uppercase tracking-widest text-[var(--color-gold)] flex items-center gap-2">
            <span className="text-xl filter grayscale drop-shadow-md">📜</span> {t('chronicle_title')}
          </h2>
          <button
            onClick={() => setIsOpen(false)}
            aria-label={t('collapse')}
            className="w-11 h-11 flex items-center justify-center text-[var(--color-parchment)] hover:text-[var(--color-ink-red)] text-2xl leading-none transition-colors"
          >
            ×
          </button>
        </div>
        
        <div 
          ref={scrollRef}
          className="flex-1 p-5 overflow-y-auto scrollbar-thin text-base font-body text-[var(--color-ink-black)] bg-[var(--color-parchment-light)]"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.03'/%3E%3C/svg%3E")` }}
        >
          {nodes.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-40 italic text-center">
              <span className="text-4xl mb-2 grayscale">✒️</span>
              <p>{t('chronicle_empty')}</p>
            </div>
          ) : (
            <div className="space-y-2 pb-6">
              {nodes.map((node, index) => (
                <div key={node.id} className="animate-fade-in origin-left transition-all duration-500">
                  {generateNarrative(node, index)}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
}
