import { useState, useCallback, useMemo, useEffect } from 'react';
import { useTranslation } from '../i18n/LanguageContext';
import { getMovesByPhase, getManuscriptKey, getMoveById } from '../data/hemaMoves';
import { playClash, playWin, playLoss, setMuted, getMuted } from '../utils/audio';

export default function ComboWizard({ currentStep, nodes, onAddNode, onUndo, onClear }) {
  const { t } = useTranslation();
  const [selectedMove, setSelectedMove] = useState('');
  const [traditionFilter, setTraditionFilter] = useState(null);
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

  // Determine Turn and Phase Dynamically
  // If no nodes: User Turn (Starter)
  // If last node is User (user-action): Opponent Turn (Reaction)
  // If last node is Opponent (opponent-action): User Turn (Followup / Finisher / Retreat)
  const isUserTurn = !lastNode || lastNode.nodeRole === 'opponent-action' || lastNode.nodeRole === 'opponent-point' || isComplete;
  const isOpponentTurn = lastNode && lastNode.nodeRole === 'user-action' && !isComplete;

  let currentPhase = 'starter';
  if (nodes.length > 0) {
    if (lastNode?.nodeRole === 'user-action') currentPhase = 'reaction';
    else if (lastNode?.nodeRole === 'opponent-action') currentPhase = 'followup';
  }

  const availableMoves = useMemo(() => {
    if (isComplete) return [];
    
    // For followup phase, also include finishers and retreats if they exist
    if (currentPhase === 'followup') {
       const followups = getMovesByPhase('followup', traditionFilter);
       const finishers = getMovesByPhase('finisher', traditionFilter);
       return [...followups, ...finishers];
    }
    return getMovesByPhase(currentPhase, traditionFilter);
  }, [currentPhase, traditionFilter, isComplete]);

  const recommendedMoves = useMemo(() => {
    if (!lastNode) return [];
    return availableMoves.filter((m) => m.follows?.includes(lastNode.moveId));
  }, [availableMoves, lastNode]);

  const otherMoves = useMemo(() => {
    if (!lastNode) return availableMoves;
    return availableMoves.filter((m) => !m.follows?.includes(lastNode.moveId));
  }, [availableMoves, lastNode]);

  // AI Mistake Evaluation (TARIHI YAPAY ZEKA)
  let mistakeReason = null;
  let commentaryContext = 'commentary_generic';
  
  // Track previous complete state to avoid playing sound repeatedly on render
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

  // Auto-select Recommended
  useEffect(() => {
    if (recommendedMoves.length > 0) {
      setSelectedMove(recommendedMoves[0].id);
    } else {
      setSelectedMove('');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPhase, lastNode, traditionFilter]);

  // AI Turn (Opponent Reacts)
  useEffect(() => {
    if (isOpponentTurn && isAiMode && recommendedMoves.length > 0 && !isMistake) {
      setAiThinking(true);
      const timer = setTimeout(() => {
        // --- 🧠 TACTICAL AI WEIGHTING ALGORITHM (GOD MODE STOCHASTIC) ---
        let scoredMoves = recommendedMoves.map((move) => {
          let score = Math.random() * 3; // base variance (luck factor)
          const aiTags = move.tags || [];
          const userTags = lastNode?.tags || [];

          // AI Counters "Strong" heavily
          if (userTags.includes('Strong')) {
            if (aiTags.includes('Winden') || aiTags.includes('Weak') || aiTags.includes('Retreat')) score += 10;
            if (aiTags.includes('Strong')) score -= 5; // Direct clash is bad
          }
          // Countering Largo
          if (userTags.includes('Zogho Largo') || userTags.includes('Largo')) {
            if (aiTags.includes('Zogho Stretto') || aiTags.includes('Stretto')) score += 8;
          }
          // Countering Retreat
          if (userTags.includes('Retreat') || aiTags.includes('Abzug')) {
            if (aiTags.includes('Nachreisen')) score += 10;
          }
          
          return { ...move, score };
        });

        // Sort descending by score
        scoredMoves.sort((a, b) => b.score - a.score);

        // Pick randomly from the Top 3 best answers (or fewer if not enough)
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
      }, 1000); // Fast AI
      return () => clearTimeout(timer);
    }
  }, [isOpponentTurn, isAiMode, recommendedMoves, onAddNode, nodes.length, currentPhase, isMistake, lastNode]);

  // AI Punish Mistake (Sudden Death)
  useEffect(() => {
    if (isMistake && isOpponentTurn && isAiMode) {
      const timer = setTimeout(() => {
        onAddNode({
          moveId: null,
          moveName: 'Riposte',
          nameKey: 'opponent_finisher_name',
          descKey: commentaryContext, // Store error context directly in descKey for the node!
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


  const handleAdd = useCallback(() => {
    if (!selectedMove) return;
    const move = availableMoves.find((m) => m.id === selectedMove);
    if (!move) return;

    const nodeRole = move.type === 'finisher' ? 'scoring-point' : 'user-action';

    onAddNode({
      moveId: move.id,
      moveName: move.name,
      nameKey: move.nameKey,
      nodeRole,
      phase: move.type === 'finisher' ? 'finisher' : 'user-action', // simplified
      step: nodes.length + 1,
      tradition: move.tradition,
      tags: move.tags,
      master: move.master,
    });
    
    // Evaluate action for live feedback
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
    setSelectedMove('');
  }, [selectedMove, availableMoves, nodes.length, onAddNode, isAiMode, isOpponentTurn, oppReactionData, isMistake, t]);

  return (
    <div className={`fixed bottom-0 left-0 w-full md:absolute md:top-4 md:bottom-auto md:left-1/2 md:-translate-x-1/2 z-50 md:w-[420px] transition-transform duration-300 ease-in-out ${!isExpanded ? 'translate-y-[calc(100%-54px)] md:translate-y-0' : 'translate-y-0'}`}>
      <div className="bg-[var(--color-parchment-light)] rounded-t-xl md:rounded-sm border-t-[3px] md:border-[3px] border-[var(--color-ink-black)] shadow-[0_-10px_40px_rgba(42,37,34,0.2)] md:shadow-[6px_6px_0_0_var(--color-ink-black)] overflow-hidden relative transition-all duration-300">
        
        {/* Mobile Pull Handle */}
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
               DÜELLO KONTROLÜ
             </h2>
             <span className="md:hidden text-[var(--color-ink-faded)] text-xs ml-1 flex">
                {isExpanded ? '▼' : '▲'}
             </span>
          </div>
          <div className="flex items-center gap-2">
            <button
               onClick={handleToggleMute}
               className={`text-lg px-2 py-1 rounded transition-all hover:bg-[var(--color-parchment)] ${isMutedLocal ? 'opacity-50 grayscale' : 'opacity-100'}`}
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
                 <span className="text-[10px] uppercase font-bold text-[var(--color-ink-black)] tracking-widest leading-none">SİZ</span>
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
                 {liveFeedback.type === 'bad' || liveFeedback.type === 'warning' ? '⚠️ Uyarısı' : '📜 Gözlem'} — {liveFeedback.master}
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
                <div className="bg-[var(--color-parchment-dark)] border-2 border-[var(--color-ink-black)] p-4 text-left shadow-[4px_4px_0_0_var(--color-ink-black)] mb-6 relative">
                  <div className="text-[11px] text-[var(--color-ink-red)] uppercase font-bold tracking-widest mb-2 flex items-center gap-2">
                    Ustadan Notlar 📜
                  </div>
                  <p className="text-sm font-body text-[var(--color-ink-black)] leading-relaxed italic">
                    "{t(lastNode.descKey)}"
                  </p>
                  {/* Suggestion */}
                  {oppReactionData && (
                      <div className="mt-4 pt-3 border-t-2 border-dashed border-[var(--color-ink-faded)]">
                         <p className="text-sm font-body font-bold text-[var(--color-ink-black)]">
                            Rubrica: <span className="font-normal italic">{t('duel_suggestion').replace('{oppMove}', t(oppReactionData.nameKey))}</span>
                         </p>
                      </div>
                  )}
                </div>
              )}

              <div className="flex gap-3 justify-center">
                <button onClick={onUndo} className="px-4 py-2 border-2 border-[var(--color-ink-black)] bg-[var(--color-parchment-light)] text-[var(--color-ink-black)] hover:bg-[var(--color-parchment-dark)] rounded-none text-xs font-bold uppercase tracking-wider transition-all shadow-[2px_2px_0_0_var(--color-ink-black)] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none">
                  {t('wizard_undo')}
                </button>
                <button onClick={onClear} className="px-5 py-2 panel-ink-red rounded-none text-xs font-bold uppercase tracking-wider">
                  YENİDEN BAŞLA
                </button>
              </div>
            </div>
          ) : aiThinking ? (
            <div className="py-10 text-center">
              <div className="text-4xl mb-4 animate-bounce filter grayscale">⚔️</div>
              <p className="text-sm font-display font-bold text-[var(--color-ink-red)] tracking-widest uppercase animate-pulse">
                {t('ai_thinking')}
              </p>
            </div>
          ) : (
            <>
              {/* Turn Information */}
              <div className="text-center mb-6">
                <p className="text-xs text-[var(--color-ink-red)] uppercase tracking-widest font-bold font-display mt-1">
                   {currentPhase === 'starter' ? "BAŞLANGIÇ: MÜSABAKA BAŞLIYOR" : "HAMLE SİZDE"}
                </p>
              </div>

              {/* Master / Tradition Tabs */}
              <div className="flex bg-[var(--color-parchment-dark)] border-[2px] border-[var(--color-ink-black)] p-0.5 mb-4">
                {['all', 'german', 'italian'].map((trad) => (
                  <button
                    key={trad}
                    onClick={() => { setTraditionFilter(trad === 'all' ? null : trad); setSelectedMove(''); }}
                    className={`flex-1 px-3 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                      (traditionFilter === (trad === 'all' ? null : trad))
                        ? 'bg-[var(--color-ink-black)] text-[var(--color-parchment-light)]'
                        : 'bg-transparent text-[var(--color-ink-black)] hover:bg-[var(--color-parchment)]'
                    }`}
                  >
                    {t(`wizard_${trad}`)}
                  </button>
                ))}
              </div>

              {/* Action Cards Grid (Destroyed the Select Box) */}
              <div className="flex flex-col gap-3 mb-2">
                {recommendedMoves.length > 0 ? (
                  <>
                    <h3 className="text-[10px] uppercase font-display text-[var(--color-ink-red)] font-bold tracking-widest px-1">
                      {t('wizard_recommended')}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {recommendedMoves.map((move) => (
                        <button
                          key={move.id}
                          onClick={() => setSelectedMove(move.id)}
                          className={`relative text-left p-3 border-[2px] transition-all duration-200 overflow-hidden group focus:outline-none
                            ${selectedMove === move.id 
                               ? 'bg-[var(--color-ink-black)] border-[var(--color-ink-black)] text-[var(--color-parchment-light)] shadow-[4px_4px_0_0_var(--color-ink-red)] -translate-y-1' 
                               : 'bg-[var(--color-parchment)] border-[var(--color-ink-black)] text-[var(--color-ink-black)] shadow-[4px_4px_0_0_var(--color-ink-black)] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_var(--color-ink-black)]'
                            }
                          `}
                        >
                          <div className={`absolute top-0 right-0 w-6 h-6 border-l-[2px] border-b-[2px] ${selectedMove === move.id ? 'border-[var(--color-parchment-light)] bg-[var(--color-ink-red)]' : 'border-[var(--color-ink-black)] bg-[var(--color-parchment-dark)]'} flex items-center justify-center`}>
                             {selectedMove === move.id && <span className="text-white text-[10px]">✓</span>}
                          </div>
                          
                          <h4 className="font-display font-bold text-sm tracking-wide block mb-1">
                            {t(move.nameKey)}
                          </h4>
                          <span className={`text-[9px] uppercase tracking-widest font-bold opacity-80 block ${selectedMove === move.id ? 'text-[var(--color-parchment-light)]' : 'text-[var(--color-ink-faded)]'}`}>
                            {move.master}
                          </span>
                          
                          {/* Tags Rendering */}
                          <div className="flex flex-wrap gap-1 mt-2">
                            {move.tags?.map(tag => (
                              <span key={tag} className={`text-[8px] px-1.5 py-0.5 uppercase tracking-widest font-bold border ${selectedMove === move.id ? 'border-[var(--color-parchment-light)]/30' : 'border-[var(--color-ink-faded)]/40'}`}>
                                {tag}
                              </span>
                            ))}
                          </div>

                          {/* Tactical Forecast */}
                          {selectedMove === move.id && (
                             <div className="mt-3 pt-2 border-t border-dashed border-[var(--color-parchment-light)]/30 text-[10px] italic !font-medium text-[var(--color-parchment-light)]/90 font-body">
                                📜 {move.tags?.includes('Meisterhau') 
                                    ? "Usta vuruşu. Doğru zamanda rakibin savunmasını parçalar." 
                                 : move.tags?.includes('Parry')
                                    ? "Pasif Savunma. İnisiyatifi ele geçirmek zor olabilir."
                                 : move.tags?.includes('Winden')
                                    ? "Bağlantıda kalarak kılıcı çevirir. Yüksek kontrol sağlar."
                                 : "Temel hamle. Rakibin açıklığına göre etkilidir."}
                             </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="p-4 border border-dashed border-[var(--color-ink-faded)] text-center text-sm italic text-[var(--color-ink-faded)]">
                    No strategic moves recommended in this context. Use Other Options.
                  </div>
                )}
                
                {/* Fallback Selection for Other Moves */}
                {otherMoves.length > 0 && (
                   <div className="mt-4">
                     <h3 className="text-[10px] uppercase font-display text-[var(--color-ink-faded)] font-bold tracking-widest px-1 mb-2">
                        {t('wizard_other')}
                     </h3>
                     <select
                       value={otherMoves.some(m => m.id === selectedMove) ? selectedMove : ''}
                       onChange={(e) => setSelectedMove(e.target.value)}
                       className="w-full bg-[var(--color-parchment-light)] px-3 py-2 border-[2px] border-[var(--color-ink-black)] rounded-none text-xs font-body text-[var(--color-ink-black)] focus:outline-none focus:border-[var(--color-ink-red)] transition-all"
                     >
                       <option value="" disabled className="italic">Geleneksel Listeden Seç...</option>
                       {otherMoves.map((move) => (
                         <option key={move.id} value={move.id}>
                           {t(move.nameKey)} — {move.master} [{move.tags?.join(', ')}]
                         </option>
                       ))}
                     </select>
                   </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Sticky Actions Footer */}
        {(!isComplete && !aiThinking) && (
          <div className="flex gap-3 px-4 py-3 bg-[var(--color-parchment)] border-t-[2px] border-[var(--color-ink-black)]">
            <button onClick={onUndo} disabled={nodes.length === 0} className="px-3 py-4 md:py-3 bg-[var(--color-parchment-dark)] border-[2px] border-[var(--color-ink-black)] hover:bg-[var(--color-ink-black)] hover:text-[var(--color-parchment-light)] text-[var(--color-ink-black)] text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 shadow-[4px_4px_0_0_var(--color-ink-black)] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none min-h-[44px] min-w-0 shrink-0">
              ↩️ <span className="hidden md:inline">{t('wizard_undo')}</span>
            </button>
            <button
              onClick={handleAdd}
              disabled={!selectedMove}
              className={`flex-1 py-4 md:py-3 text-sm md:text-xs font-bold uppercase tracking-widest transition-all border-[2px] border-[var(--color-ink-black)] shadow-[4px_4px_0_0_var(--color-ink-black)] active:translate-y-[4px] active:translate-x-[4px] active:shadow-none min-h-[44px] min-w-0 truncate px-2 ${
                selectedMove
                  ? 'bg-[var(--color-ink-red)] text-[var(--color-parchment-light)] hover:bg-[var(--color-ink-black)]'
                  : 'bg-[var(--color-parchment-dark)] text-[var(--color-ink-faded)] opacity-60 cursor-not-allowed shadow-none translate-y-[4px] translate-x-[4px]'
              }`}
            >
              {t('wizard_add')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
