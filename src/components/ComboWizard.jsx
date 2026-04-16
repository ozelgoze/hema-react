import { useState, useCallback, useMemo, useEffect } from 'react';
import { useTranslation } from '../i18n/LanguageContext';
import { getMovesByPhase, getMoveById, hemaMoves } from '../data/hemaMoves';
import LanguageSelector from './LanguageSelector';
import { playClash, playWin, playLoss, setMuted, getMuted } from '../utils/audio';
import MoveSelectorModal from './MoveSelectorModal';

export default function ComboWizard({ currentStep, nodes, onAddNode, onUndo, onClear, isMoveModalOpen, setIsMoveModalOpen }) {
  const { t } = useTranslation();
  const [isAiMode, setIsAiMode] = useState(true);
  const [aiThinking, setAiThinking] = useState(false);
  const [isMutedLocal, setIsMutedLocal] = useState(getMuted());
  const [isExpanded, setIsExpanded] = useState(true);
  const [liveFeedback, setLiveFeedback] = useState(null);

  // Clear feedback after 4 seconds
  useEffect(() => {
    if (liveFeedback) {
      const timer = setTimeout(() => setLiveFeedback(null), 4500);
      return () => clearTimeout(timer);
    }
  }, [liveFeedback]);

  const handleToggleMute = () => {
    const newMuted = !isMutedLocal;
    setIsMutedLocal(newMuted);
    setMuted(newMuted);
  };

  // Evaluate Match Status
  const lastNode = nodes?.length > 0 ? nodes[nodes.length - 1].data : null;
  const isUserWin = lastNode?.nodeRole === 'scoring-point';
  const isOpponentWin = lastNode?.nodeRole === 'opponent-point';
  const isComplete = isUserWin || isOpponentWin;

  const isUserTurn = !lastNode || lastNode.nodeRole === 'opponent-action' || lastNode.nodeRole === 'opponent-point' || isComplete;
  const isOpponentTurn = lastNode && lastNode.nodeRole === 'user-action' && !isComplete;

  let currentPhase = 'starter';
  if (nodes.length > 0) {
    if (lastNode?.nodeRole === 'user-action') currentPhase = 'reaction';
    else if (lastNode?.nodeRole === 'opponent-action') currentPhase = 'followup';
  }

  const availableMoves = useMemo(() => {
    if (isComplete) return [];
    return getMovesByPhase(currentPhase);
  }, [currentPhase, isComplete]);

  const recommendedMoves = useMemo(() => {
    if (!lastNode) return [];
    return availableMoves.filter((m) => m.follows?.includes(lastNode.moveId));
  }, [availableMoves, lastNode]);

  let commentaryContext = 'commentary_generic';
  const [hasPlayedEndSound, setHasPlayedEndSound] = useState(false);

  useEffect(() => {
    if (!isComplete) {
       setHasPlayedEndSound(false);
    } else if (isComplete && !hasPlayedEndSound) {
       if (isUserWin) {
         playWin();
       } else if (isOpponentWin) {
         playLoss();
         document.body.classList.add('shake-animation');
         setTimeout(() => {
           document.body.classList.remove('shake-animation');
         }, 400);
       }
       setHasPlayedEndSound(true);
    }
  }, [isComplete, isUserWin, isOpponentWin, hasPlayedEndSound]);

  const oppReactionNode = (nodes.length >= 2 && lastNode?.nodeRole === 'user-action') ? nodes[nodes.length - 2]?.data : lastNode?.nodeRole === 'opponent-action' ? lastNode : null;
  const userActionData = lastNode?.nodeRole === 'user-action' && nodes.length > 1 ? getMoveById(lastNode.moveId) : null;
  const oppReactionData = oppReactionNode ? getMoveById(oppReactionNode.moveId) : null;

  const isMistake = !!(isOpponentTurn && oppReactionData && userActionData && !userActionData.follows?.includes(oppReactionData.id));

  if (isMistake) {
    const oppTags = oppReactionData.tags || [];
    const userTags = userActionData.tags || [];
    const isGerman = oppReactionData.tradition === 'german' || userActionData.tradition === 'german';

    if (isGerman) {
       if (oppTags.includes('Strong') && userTags.includes('Weak')) commentaryContext = 'feedback_german_weak_vs_strong';
       else if (oppTags.includes('Winden') && !userTags.includes('Winden')) commentaryContext = 'feedback_german_winden';
       else if (oppTags.includes('Strong')) commentaryContext = 'commentary_crown';
       else if (oppTags.includes('Retreat')) commentaryContext = 'commentary_retreats';
       else commentaryContext = 'commentary_generic';
    } else {
       if (oppTags.includes('Zogho Largo') && userTags.includes('Zogho Stretto')) commentaryContext = 'feedback_italian_largo_vs_stretto';
       else if (oppTags.includes('Strong')) commentaryContext = 'commentary_crown';
       else commentaryContext = 'commentary_generic';
    }
  }

  useEffect(() => {
    if (isOpponentTurn && isAiMode && recommendedMoves.length > 0 && !isMistake) {
      setAiThinking(true);
      const timer = setTimeout(() => {
        let scoredMoves = recommendedMoves.map((move) => {
          let score = Math.random() * 3;
          const aiTags = move.tags || [];
          const userTags = lastNode?.tags || [];

          if (userTags.includes('Strong')) {
            if (aiTags.includes('Winden') || aiTags.includes('Weak') || aiTags.includes('Retreat')) score += 10;
            if (aiTags.includes('Strong')) score -= 5;
          }
          if (userTags.includes('Zogho Largo') || userTags.includes('Largo')) {
            if (aiTags.includes('Zogho Stretto') || aiTags.includes('Stretto')) score += 8;
          }
          if (userTags.includes('Retreat') || aiTags.includes('Abzug')) {
            if (aiTags.includes('Nachreisen')) score += 10;
          }
          
          return { ...move, score };
        });

        scoredMoves.sort((a, b) => b.score - a.score);
        const topN = Math.min(3, scoredMoves.length);
        const bestMove = scoredMoves[Math.floor(Math.random() * topN)];

        onAddNode({
          moveId: bestMove.id,
          moveName: bestMove.name,
          nameKey: bestMove.nameKey,
          nodeRole: 'opponent-action',
          phase: currentPhase,
          step: nodes.length + 1,
          tradition: bestMove.tradition,
          tags: bestMove.tags,
          master: bestMove.master,
        });
        playClash();
        setAiThinking(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isOpponentTurn, isAiMode, recommendedMoves, onAddNode, nodes.length, currentPhase, isMistake, lastNode]);

  useEffect(() => {
    if (isMistake && isOpponentTurn && isAiMode) {
      const timer = setTimeout(() => {
        onAddNode({
          moveId: null,
          moveName: 'Riposte',
          nameKey: 'opponent_finisher_name',
          descKey: commentaryContext,
          nodeRole: 'opponent-point',
          phase: 'finisher',
          step: nodes.length + 1,
          tradition: oppReactionData?.tradition || 'german',
          tags: ['Punish', 'Hit'],
          master: oppReactionData?.master || 'Unknown',
        });
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [isOpponentTurn, isAiMode, isMistake, onAddNode, nodes.length, oppReactionData, commentaryContext]);

  // Reactive Spawning of SelectorNodes to avoid stale closures
  useEffect(() => {
    if (!lastNode || lastNode.isSelector || isComplete) return;

    // After AI acts, or if manual Opponent wants to act, we need a Selector
    if (lastNode.nodeRole === 'opponent-action' && currentPhase !== 'finisher') {
       // Sprout User Selector
       const timer = setTimeout(() => onAddNode({ isSelector: true, nodeRole: 'user-action' }), 500);
       return () => clearTimeout(timer);
    }

    if (!isAiMode && lastNode.nodeRole === 'user-action') {
       // Sprout Opponent Selector (Manual Mode)
       const timer = setTimeout(() => onAddNode({ isSelector: true, nodeRole: 'opponent-action' }), 300);
       return () => clearTimeout(timer);
    }
  }, [lastNode, isComplete, currentPhase, isAiMode, onAddNode]);

  const handleMoveSelect = useCallback((move) => {
    if (!move) return;
    const nodeRole = move.type === 'finisher' ? 'scoring-point' : 'user-action';

    onAddNode({
      moveId: move.id,
      moveName: move.name,
      nameKey: move.nameKey,
      nodeRole,
      phase: move.type === 'finisher' ? 'finisher' : 'user-action',
      tradition: move.tradition,
      tags: move.tags,
      master: move.master,
    }, true);
    
    const aiTags = oppReactionData?.tags || [];
    if (isAiMode && isOpponentTurn) {
        if (move.tags?.includes('Weak') && aiTags.includes('Strong')) {
           setLiveFeedback({ type: 'bad', text: t('feedback_german_weak_vs_strong'), master: 'Liechtenauer' });
        } else if (aiTags.includes('Kron') && !move.tags?.includes('Unterhau')) {
           setLiveFeedback({ type: 'warning', text: t('commentary_crown').replace('{oppMove}', oppReactionData?.name), master: 'Meyer' });
        } else if (aiTags.includes('Abzug') && !move.tags?.includes('Nachreisen')) {
           setLiveFeedback({ type: 'warning', text: t('commentary_retreats').replace('{oppMove}', oppReactionData?.name), master: 'Historical Principle' });
        } else if (!isMistake) {
           setLiveFeedback({ type: 'good', text: 'Taktik başarıyla işliyor. Rakibin zayıf noktası bulundu.', master: 'Combat Flow' });
        }
    } else {
       setLiveFeedback({ type: 'neutral', text: `Yeni form: ${t(move.nameKey)}. Rakip tepkisi bekleniyor...`, master: 'Combat Flow' });
    }

    playClash();
  }, [nodes.length, onAddNode, isAiMode, isOpponentTurn, oppReactionData, isMistake, t]);

  return (
    <>
    <div className={`fixed bottom-0 left-0 w-full md:absolute md:top-4 md:bottom-auto md:left-1/2 md:-translate-x-1/2 z-50 md:w-[420px] transition-transform duration-300 ease-in-out ${!isExpanded ? 'translate-y-[calc(100%-54px)] md:translate-y-0' : 'translate-y-0'}`}>
      <div className="bg-[var(--color-parchment-light)] rounded-t-xl md:rounded-sm border-t-[3px] md:border-[3px] border-[var(--color-ink-black)] shadow-[0_-10px_40px_rgba(42,37,34,0.2)] md:shadow-[6px_6px_0_0_var(--color-ink-black)] overflow-hidden relative transition-all duration-300">
        
        <div 
           className="md:hidden w-full h-[6px] bg-[var(--color-parchment-dark)] flex justify-center items-center py-2 border-b border-[var(--color-ink-faded)] cursor-pointer"
           onClick={() => setIsExpanded(!isExpanded)}
        >
           <div className="w-12 h-1 bg-[var(--color-ink-faded)] rounded-full"></div>
        </div>

        {/* Header API */}
        <div 
          className="px-5 py-3 border-b-[2px] border-[var(--color-ink-black)] bg-[var(--color-parchment-dark)] flex justify-between items-center cursor-pointer md:cursor-default"
          onClick={() => {
            if (window.innerWidth < 768) {
              setIsExpanded(!isExpanded);
            }
          }}
        >
          <div className="flex items-center gap-2">
             <h2 className="text-lg font-display text-[var(--color-ink-red)] flex items-center gap-2">
               <span className="text-xl filter grayscale drop-shadow-md">⚔️</span>
               {t('duel_control')}
             </h2>
             <span className="md:hidden text-[var(--color-ink-faded)] text-xs ml-1 flex">
                {isExpanded ? '▼' : '▲'}
             </span>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSelector />
            <div className="w-px h-6 bg-[var(--color-ink-faded)] mx-1"></div>
            <button
               onClick={handleToggleMute}
               className={`text-lg px-2 flex items-center justify-center rounded transition-all hover:bg-[var(--color-parchment)] ${isMutedLocal ? 'opacity-50 grayscale' : 'opacity-100'}`}
               title={isMutedLocal ? "Sesi Aç" : "Sesi Kapat"}
            >
               {isMutedLocal ? '🔇' : '🔊'}
            </button>
            <button
              onClick={() => setIsAiMode(!isAiMode)}
              className={`px-3 py-1 text-xs rounded-none border-[2px] font-bold uppercase tracking-wider transition-all duration-300 ${
                isAiMode
                  ? 'bg-[var(--color-ink-black)] text-[var(--color-parchment-light)] border-[var(--color-ink-black)]'
                  : 'bg-[var(--color-parchment-light)] text-[var(--color-ink-black)] border-[var(--color-ink-black)]'
              }`}
            >
              {isAiMode ? t('toggle_ai') : "MANUAL"}
            </button>
          </div>
        </div>

        {/* Combat Tracker (First Blood Points) */}
        {!isComplete && (
            <div className="px-5 py-2 flex justify-center items-center gap-6 bg-[var(--color-parchment)] border-b-[2px] border-[var(--color-ink-black)]">
               <div className="flex items-center gap-2">
                 <span className="text-[10px] uppercase font-bold text-[var(--color-ink-black)] tracking-widest leading-none">{t('you')}</span>
                 <div className="w-3 h-3 bg-[var(--color-ink-black)] rounded-full"></div>
               </div>
               <div className="text-xs font-display text-[var(--color-ink-red)] italic opacity-60">vs</div>
               <div className="flex items-center gap-2">
                 <div className="w-3 h-3 bg-[var(--color-ink-pinstripe)] rounded-full border border-black"></div>
                 <span className="text-[10px] uppercase font-bold text-[var(--color-ink-black)] tracking-widest leading-none">AI</span>
               </div>
            </div>
        )}
        
        {/* Live Feedback Banner */}
        {liveFeedback && !isComplete && (
           <div className={`px-5 py-3 border-b-2 shadow-[inset_0_-4px_10px_rgba(0,0,0,0.05)] animate-fade-in ${
               liveFeedback.type === 'bad' ? 'bg-[var(--color-ink-red)] text-[var(--color-parchment-light)] border-[var(--color-ink-black)]' :
               liveFeedback.type === 'warning' ? 'bg-amber-600/90 text-amber-50 border-amber-800' :
               liveFeedback.type === 'good' ? 'bg-[var(--color-ink-black)] text-[var(--color-gold)] border-[var(--color-gold)]' :
               'bg-[var(--color-parchment-dark)] text-[var(--color-ink-black)] border-[var(--color-ink-black)]'
           }`}>
              <div className="text-[9px] uppercase font-bold tracking-widest opacity-80 mb-1 flex items-center gap-1">
                 {liveFeedback.type === 'bad' || liveFeedback.type === 'warning' ? '⚠️ ' + t('warning') : '📜 ' + t('observation')} — {liveFeedback.master}
              </div>
              <p className="text-xs font-body font-medium italic leading-snug">
                 {liveFeedback.text}
              </p>
           </div>
        )}

        {/* Scrollable Body Container */}
        <div className="p-4 md:p-5 max-h-[30vh] md:max-h-none overflow-y-auto scrollbar-thin">
          {isComplete ? (
            <div className="text-center py-2 animate-fade-in relative z-10">
              <div className="mb-4">
                {isUserWin ? (
                  <span className="text-6xl filter drop-shadow-md">🏆</span>
                ) : (
                  <span className="text-6xl filter drop-shadow-md">💀</span>
                )}
              </div>
              <h3 className={`text-2xl font-bold font-display tracking-wide uppercase mb-2 ${isUserWin ? 'text-[var(--color-gold)]' : 'text-[var(--color-ink-red)]'}`}>
                {isUserWin ? t('duel_win_title') : t('duel_loss_title')}
              </h3>
              <p className="text-sm text-[var(--color-ink-black)] leading-relaxed mb-6 font-medium italic">
                {isUserWin ? t('duel_win_desc') : t('duel_loss_prefix')}
              </p>

              {/* TARIHI YAPAY ZEKA COACHING */}
              {isOpponentWin && lastNode?.descKey && (
                <div className="bg-[var(--color-parchment-light)] border-[3px] border-[var(--color-ink-red)] p-5 text-left shadow-[6px_6px_0_0_var(--color-ink-red)] mb-4 mt-8 relative">
                  <div className="text-sm text-[var(--color-ink-red)] uppercase font-display font-bold tracking-widest mb-3 flex items-center gap-2 border-b-2 border-dashed border-[var(--color-ink-red)] pb-2">
                    📜 {t('master_notes')}
                  </div>
                  <p className="text-base font-body text-[var(--color-ink-black)] font-medium leading-relaxed">
                    "{t(lastNode.descKey)}"
                  </p>
                  {/* Suggestion */}
                  {oppReactionData && (
                      <div className="mt-5 pt-4 border-t-[3px] border-[var(--color-ink-black)] bg-[var(--color-ink-black)] -mx-5 -mb-5 px-5 py-4">
                         <p className="text-[13px] md:text-sm font-body text-[var(--color-parchment-light)]">
                            <span className="text-[var(--color-gold)] font-display tracking-widest uppercase text-xs block mb-1">Rubrica:</span> 
                            {t('duel_suggestion').replace('{oppMove}', t(oppReactionData.nameKey))}
                         </p>
                      </div>
                  )}
                </div>
              )}
            </div>
          ) : aiThinking ? (
            <div className="py-10 text-center">
              <div className="text-4xl mb-4 animate-bounce filter grayscale">⚔️</div>
              <p className="text-sm font-display font-bold text-[var(--color-ink-red)] tracking-widest uppercase animate-pulse">
                {t('ai_thinking')}
              </p>
            </div>
          ) : null}
        </div>

        {/* Sticky Actions Footer (Undo / Clear only) */}
        {(!aiThinking && nodes.length > 0) && (
          <div className="flex gap-3 px-4 py-3 bg-[var(--color-parchment)] border-t-[2px] border-[var(--color-ink-black)]">
            <button onClick={onUndo} disabled={nodes.length === 0} className="px-3 py-3 md:py-3 bg-[var(--color-parchment-dark)] border-[2px] border-[var(--color-ink-black)] hover:bg-[var(--color-ink-black)] hover:text-[var(--color-parchment-light)] text-[var(--color-ink-black)] text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 shadow-[4px_4px_0_0_var(--color-ink-black)] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none min-h-[44px] min-w-0 shrink-0 flex items-center justify-center gap-2">
              ↩️ <span className="hidden md:inline">{t('wizard_undo')}</span>
            </button>
            <button onClick={onClear} disabled={nodes.length === 0} className="flex-1 py-3 bg-[var(--color-parchment)] text-[var(--color-ink-red)] border-[2px] border-[var(--color-ink-red)] font-bold text-xs uppercase hover:bg-[var(--color-ink-red)] hover:text-white transition-colors shadow-[4px_4px_0_0_var(--color-ink-red)] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none min-h-[44px]">
               {t('wizard_clear')}
            </button>
          </div>
        )}
      </div>
    </div>
    
    <MoveSelectorModal 
       isOpen={isMoveModalOpen} 
       onClose={() => setIsMoveModalOpen(false)} 
       onSelectMove={handleMoveSelect}
       recommendedMoves={recommendedMoves}
       isAiMode={isAiMode}
    />
    </>
  );
}
