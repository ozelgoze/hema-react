import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from '../i18n/LanguageContext';
import { hemaMoves, getMovesByPhase } from '../data/hemaMoves';

export default function MoveSelectorModal({ isOpen, onClose, onSelectMove, recommendedMoves, isAiMode, currentPhase }) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [phaseFilter, setPhaseFilter] = useState(null);

  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
      setPhaseFilter(null);
    }
  }, [isOpen]);

  const availableMoves = useMemo(() => {
    let moves;
    if (searchTerm) {
      moves = hemaMoves;
    } else if (phaseFilter) {
      moves = getMovesByPhase(phaseFilter);
    } else if (currentPhase === 'followup') {
      moves = [...getMovesByPhase('followup'), ...getMovesByPhase('finisher')];
    } else if (currentPhase) {
      moves = getMovesByPhase(currentPhase);
    } else {
      moves = hemaMoves;
    }

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      moves = moves.filter((m) => {
        const nameMatch = t(m.nameKey).toLowerCase().includes(search);
        const tagsMatch = m.tags?.join(' ').toLowerCase().includes(search);
        return nameMatch || tagsMatch;
      });
    }
    if (!searchTerm && recommendedMoves && recommendedMoves.length > 0) {
       const recIds = recommendedMoves.map(rm => rm.id);
       moves = moves.filter(m => !recIds.includes(m.id));
    }
    return moves;
  }, [phaseFilter, searchTerm, t, recommendedMoves, currentPhase]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] bg-[var(--color-ink-black)]/90 backdrop-blur-sm flex justify-center items-end md:items-center overflow-hidden animate-fade-in touch-none">
      <div className="w-full h-[90vh] h-[90dvh] md:h-[80vh] md:w-[600px] bg-[var(--color-parchment)] md:border-[4px] border-t-[4px] border-[var(--color-ink-black)] shadow-[0_0_50px_rgba(42,37,34,0.5)] md:shadow-[10px_10px_0_0_var(--color-ink-black)] flex flex-col animate-slide-up md:animate-scale-in relative">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b-[2px] border-[var(--color-ink-black)] bg-[var(--color-parchment-dark)] relative">
          <div className="absolute left-4 right-4 bottom-0 h-[2px] bg-[var(--color-ink-red)] opacity-30" aria-hidden="true" />
          <div>
            <h2 className="text-xl font-display font-bold text-[var(--color-ink-red)] uppercase tracking-widest leading-none flex items-center gap-2">
              <span className="text-[var(--color-ink-faded)] text-sm" aria-hidden="true">❦</span>
              {t('you')}
            </h2>
            <span className="text-xs font-bold text-[var(--color-ink-faded)] uppercase tracking-[0.2em]">{t('wizard_select')}</span>
          </div>
          <button onClick={onClose} aria-label={t('close') || 'Close'} className="w-11 h-11 flex items-center justify-center border-2 border-[var(--color-ink-black)] bg-[var(--color-parchment-light)] hover:bg-[var(--color-ink-red)] hover:text-white transition-colors shadow-[2px_2px_0_0_var(--color-ink-black)] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none font-bold text-xl">
            ✕
          </button>
        </div>

        {/* Filters */}
        <div className="p-4 bg-[var(--color-parchment-light)] border-b-[2px] border-[var(--color-ink-black)] space-y-3">
          <div className="flex bg-[var(--color-parchment-dark)] border-[2px] border-[var(--color-ink-black)] p-0.5">
            {[
              { id: 'all', glyph: '❦' },
              { id: 'starter', glyph: '⚔' },
              { id: 'reaction', glyph: '🛡' },
              { id: 'followup', glyph: '⚡' },
              { id: 'finisher', glyph: '✦' },
            ].map(({ id: ph, glyph }) => {
              const active = phaseFilter === (ph === 'all' ? null : ph);
              return (
                <button
                  key={ph}
                  onClick={() => setPhaseFilter(ph === 'all' ? null : ph)}
                  aria-pressed={active}
                  className={`flex-1 px-2 py-3 text-[11px] font-bold uppercase tracking-wider transition-all duration-300 min-h-[44px] flex flex-col items-center justify-center gap-0.5 ${
                    active
                      ? 'bg-[var(--color-ink-black)] text-[var(--color-parchment-light)]'
                      : 'bg-transparent text-[var(--color-ink-black)] hover:bg-[var(--color-parchment)]'
                  }`}
                >
                  <span className={`text-sm leading-none ${active ? 'text-[var(--color-gold)]' : 'opacity-70'}`} aria-hidden="true">{glyph}</span>
                  <span>{ph === 'all' ? t('wizard_all') : t(`phase_${ph}`)}</span>
                </button>
              );
            })}
          </div>

          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-black)] opacity-50 text-lg">🔍</span>
            <input
              type="text"
              autoFocus={typeof window !== 'undefined' && window.innerWidth >= 768}
              placeholder={t('wizard_select') + "..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[var(--color-parchment)] pl-10 pr-4 py-4 min-h-[44px] border-[2px] border-[var(--color-ink-black)] rounded-none text-base font-body font-bold text-[var(--color-ink-black)] outline-none focus:ring-2 focus:ring-[var(--color-ink-red)] focus:border-[var(--color-ink-red)] transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)]"
            />
          </div>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto scrollbar-thin p-4 bg-[var(--color-parchment)]">
          {/* Recommended Section */}
          {!searchTerm && recommendedMoves && recommendedMoves.length > 0 && (
             <div className="mb-6">
                <h3 className="text-[10px] uppercase font-display text-[var(--color-ink-red)] font-bold tracking-widest px-1 mb-3">
                  {t('wizard_recommended')}
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  {recommendedMoves.map((move, index) => {
                    const isTopAiPick = index === 0 && isAiMode;
                    return (
                      <button
                        key={move.id}
                        onClick={() => { onSelectMove(move); onClose(); }}
                        className={`relative text-left p-4 min-h-[50px] border-[2px] transition-all duration-200 overflow-hidden group focus:outline-none focus:ring-2 focus:ring-[var(--color-ink-red)] border-[var(--color-ink-black)] text-[var(--color-ink-black)] shadow-[4px_4px_0_0_var(--color-ink-black)] active:-translate-y-0 active:shadow-[2px_2px_0_0_var(--color-ink-black)]
                          ${isTopAiPick ? 'bg-[var(--color-parchment-light)] border-[var(--color-gold)] shadow-[4px_4px_0_0_var(--color-gold)] hover:shadow-[6px_6px_0_0_var(--color-gold)] hover:-translate-y-1' : 'bg-[var(--color-parchment)] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_var(--color-ink-black)]'}
                        `}
                      >
                        {isTopAiPick && (
                          <div className="absolute top-0 right-0 px-3 py-1 bg-[var(--color-gold)] border-l-[2px] border-b-[2px] border-[var(--color-ink-black)] flex items-center justify-center shadow-sm">
                             <span className="text-[var(--color-ink-black)] text-[10px] font-bold uppercase tracking-widest">🛡️ {t('ai_suggestion')}</span>
                          </div>
                        )}
                        <h4 className={`font-display font-bold ${isTopAiPick ? 'text-lg text-[var(--color-ink-red)]' : 'text-base'} tracking-wide block mb-1 mt-1`}>
                          {t(move.nameKey)}
                        </h4>
                      <span className="text-[10px] uppercase tracking-widest font-bold opacity-80 block text-[var(--color-ink-faded)]">
                        {t(`phase_${move.phase}`)}
                      </span>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {move.tags?.map(tag => (
                          <span key={tag} className="text-[9px] px-2 py-0.5 uppercase tracking-widest font-bold border border-[var(--color-ink-faded)]/40 bg-white/20">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </button>
                    );
                  })}
                </div>
             </div>
          )}

          {/* All Moves Section */}
          <h3 className="text-[10px] uppercase font-display text-[var(--color-ink-faded)] font-bold tracking-widest px-1 mb-3">
             {searchTerm ? t('search_results') : t('wizard_other')}
          </h3>
          <div className="grid grid-cols-1 gap-2">
            {availableMoves.map((move) => (
              <button
                key={move.id}
                onClick={() => { onSelectMove(move); onClose(); }}
                className="w-full text-left px-4 py-4 min-h-[55px] border-[2px] border-[var(--color-ink-black)] bg-[var(--color-parchment-light)] text-[var(--color-ink-black)] hover:bg-[var(--color-ink-black)] hover:text-[var(--color-parchment-light)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-ink-red)] shadow-[2px_2px_0_0_var(--color-ink-faded)]"
              >
                <span className="font-bold text-sm block md:inline">{t(move.nameKey)}</span>
                <span className="opacity-70 text-[10px] md:ml-2 block md:inline mt-1 md:mt-0 uppercase tracking-wider">{t(`phase_${move.phase}`)} [{move.tags?.join(', ')}]</span>
              </button>
            ))}
            {availableMoves.length === 0 && (
              <div className="px-4 py-8 text-sm italic text-[var(--color-ink-faded)] text-center font-body border-2 border-dashed border-[var(--color-ink-faded)]">
                {t('no_search_results')}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
