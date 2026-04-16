import { useState, useCallback, useMemo, useEffect } from 'react';
import { useTranslation } from '../i18n/LanguageContext';
import { getMovesByPhase, getMoveById, hemaMoves } from '../data/hemaMoves';
import LanguageSelector from './LanguageSelector';
import { playClash, playWin, playLoss, setMuted, getMuted } from '../utils/audio';
import MoveSelectorModal from './MoveSelectorModal';

// ═══════════════════════════════════════════════════════════
// AI Personality Profiles
// ═══════════════════════════════════════════════════════════
const AI_PROFILES = {
  liechtenauer: {
    nameKey: 'ai_personality_liechtenauer',
    style: 'aggressive',
    finisherBlockStrength: 0.6,
    bias: (move, userTags) => {
      let score = 0;
      const aiTags = move.tags || [];
      // Liechtenauer: relentless Vor pressure, exploit Strong/Weak imbalance
      if (aiTags.includes('Strong')) score += 6;
      if (aiTags.includes('Winden')) score += 8;
      if (userTags.includes('Weak')) score += 12;
      if (aiTags.includes('Retreat') || aiTags.includes('Abzug')) score -= 10;
      if (move.type === 'counter') score += 5;
      // Liechtenauer's Zettel: "Wer auf dich stürmt, Zucken ihm droht"
      // Against chasers: meet force with force — Gegenhau directly into the charge
      if (userTags.includes('Nachreisen')) {
        if (aiTags.includes('Bind') || aiTags.includes('Strong')) score += 15;
        if (move.id === 'g-gegenhau') score += 20; // Preferred: head-on counter-cut
        if (aiTags.includes('Retreat') || aiTags.includes('Abzug')) score -= 15; // Never yield ground
      }
      return score;
    },
  },
  fiore: {
    nameKey: 'ai_personality_fiore',
    style: 'grappling',
    finisherBlockStrength: 0.9, // Fiore fights long — very hard to finish quickly
    bias: (move, userTags) => {
      let score = 0;
      const aiTags = move.tags || [];
      // Fiore: close distance aggressively, bind, control, grapple
      if (aiTags.includes('Zogho Stretto')) score += 10;
      if (aiTags.includes('Strong')) score += 8;
      if (move.type === 'grapple') score += 15;
      if (move.type === 'counter') score += 6;
      if (userTags.includes('Zogho Largo')) score += 8;
      if (aiTags.includes('Weak')) score -= 8; // Fiore never shows weakness
      if (aiTags.includes('Retreat') || aiTags.includes('Abzug')) score -= 12;
      // Fiore's core: "Chi mi segue, trova la mia punta"
      // Against chasers, ALWAYS thrust — never cut or retreat
      if (userTags.includes('Nachreisen')) {
        if (move.type === 'thrust') score += 20;
        if (move.id === 'i-colpo-di-punta') score += 25; // Strongest preference
        if (aiTags.includes('Retreat')) score -= 20; // Never retreat from a chaser
      }
      return score;
    },
  },
  meyer: {
    nameKey: 'ai_personality_meyer',
    style: 'technical',
    finisherBlockStrength: 0.7,
    bias: (move, userTags) => {
      let score = 0;
      const aiTags = move.tags || [];
      // Meyer: technical brilliance, Meisterhau preference, varied patterns
      if (aiTags.includes('Meisterhau')) score += 12;
      if (aiTags.includes('Vor')) score += 4;
      if (move.type === 'counter') score += 6;
      if (aiTags.includes('Winden')) score += 8;
      score += Math.random() * 4;
      // Meyer's Kunst des Fechtens: use the Zwerchhau angle against a rusher
      // Catch them from the side as they charge in — technical, not brute force
      if (userTags.includes('Nachreisen')) {
        if (aiTags.includes('Meisterhau')) score += 18; // Zwerchhau-type angles
        if (move.id === 'g-gegenhau') score += 12; // Still values counter-cuts
        if (aiTags.includes('Bind')) score += 10; // Create a bind to control
        if (aiTags.includes('Retreat') || aiTags.includes('Abzug')) score -= 10; // Retreat less preferred against chasers
      }
      // Meyer is technical, not cowardly — moderate retreat penalty
      if (aiTags.includes('Retreat') || aiTags.includes('Abzug')) score -= 6;
      return score;
    },
  },
};

// AI Difficulty — controls how optimally the AI plays
const AI_DIFFICULTY = {
  novice: { randomWeight: 10, topN: 5, thinkTime: 600, minStepsForFinisher: 1, finisherBlockMult: 0 },
  adept: { randomWeight: 3, topN: 3, thinkTime: 1000, minStepsForFinisher: 3, finisherBlockMult: 0.5 },
  master: { randomWeight: 0.5, topN: 1, thinkTime: 1400, minStepsForFinisher: 5, finisherBlockMult: 1.0 },
};

// Calculate how many finisher paths are available from a given reaction
const countFinisherPaths = (reactionId) => {
  const directFinishers = hemaMoves.filter(m => m.phase === 'finisher' && m.follows?.includes(reactionId));
  const followups = hemaMoves.filter(m => m.phase === 'followup' && m.follows?.includes(reactionId));
  let indirectFinishers = 0;
  followups.forEach(fu => {
    indirectFinishers += hemaMoves.filter(m => m.phase === 'finisher' && m.follows?.includes(fu.id)).length;
  });
  return directFinishers.length + indirectFinishers;
};

export default function ComboWizard({ currentStep, nodes, onAddNode, onUndo, onClear, isMoveModalOpen, setIsMoveModalOpen, userScore, aiScore, onScoreUpdate, maxScore }) {
  const { t } = useTranslation();
  const [isAiMode, setIsAiMode] = useState(true);
  const [aiThinking, setAiThinking] = useState(false);
  const [isMutedLocal, setIsMutedLocal] = useState(getMuted());
  const [isExpanded, setIsExpanded] = useState(true);
  const [liveFeedback, setLiveFeedback] = useState(null);
  const [aiDifficulty, setAiDifficulty] = useState('adept');
  const [aiPersonality, setAiPersonality] = useState('liechtenauer');

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
  const lastNodeRendered = nodes?.length > 0 ? nodes[nodes.length - 1].data : null;
  const activePlayNodes = nodes?.filter(n => !n.data?.isSelector) || [];
  const lastNode = activePlayNodes.length > 0 ? activePlayNodes[activePlayNodes.length - 1].data : null;

  const isUserWin = lastNode?.nodeRole === 'scoring-point';
  const isOpponentWin = lastNode?.nodeRole === 'opponent-point';
  const isComplete = isUserWin || isOpponentWin;

  const isUserTurn = !lastNode || lastNode.nodeRole === 'opponent-action' || lastNode.nodeRole === 'opponent-point' || isComplete;
  
  // Is it the opponent's turn to React?
  const isOpponentTurn = lastNode && lastNode.nodeRole === 'user-action' && !lastNodeRendered?.isSelector && !isComplete;

  // Multi-exchange: determine current phase dynamically based on the last action
  let currentPhase = 'starter';
  if (activePlayNodes.length > 0) {
    if (lastNode?.nodeRole === 'user-action') {
      currentPhase = 'reaction';
    } else if (lastNode?.nodeRole === 'opponent-action') {
      // After an opponent reacts, user can do follow-ups. 
      // If we're past the first exchange, allow follow-ups and finishers
      currentPhase = 'followup';
    }
  }

  // Difficulty gates finisher access
  const difficulty = AI_DIFFICULTY[aiDifficulty];
  const canShowFinishers = activePlayNodes.length >= difficulty.minStepsForFinisher;

  const availableMoves = useMemo(() => {
    if (isComplete) return [];
    if (currentPhase === 'followup') {
       if (canShowFinishers) {
         return [...getMovesByPhase('followup'), ...getMovesByPhase('finisher')];
       }
       return getMovesByPhase('followup');
    }
    return getMovesByPhase(currentPhase);
  }, [currentPhase, isComplete, canShowFinishers]);

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
         // Update score
         if (onScoreUpdate) onScoreUpdate('user');
       } else if (isOpponentWin) {
         playLoss();
         document.body.classList.add('shake-animation');
         setTimeout(() => {
           document.body.classList.remove('shake-animation');
         }, 400);
         if (onScoreUpdate) onScoreUpdate('ai');
       }
       setHasPlayedEndSound(true);
    }
  }, [isComplete, isUserWin, isOpponentWin, hasPlayedEndSound, onScoreUpdate]);

  // For Mistake Calculation
  const oppReactionNode = (activePlayNodes.length >= 2 && lastNode?.nodeRole === 'user-action') ? activePlayNodes[activePlayNodes.length - 2]?.data : lastNode?.nodeRole === 'opponent-action' ? lastNode : null;
  const userActionData = lastNode?.nodeRole === 'user-action' && activePlayNodes.length > 1 ? getMoveById(lastNode.moveId) : null;
  const oppReactionData = oppReactionNode ? getMoveById(oppReactionNode.moveId) : null;

  const isMistake = !!(isOpponentTurn && oppReactionData && userActionData && !userActionData.follows?.includes(oppReactionData.id));

  if (isMistake) {
    const oppTags = oppReactionData.tags || [];
    const userTags = userActionData.tags || [];
    const isGerman = oppReactionData.tradition === 'german' || userActionData.tradition === 'german';

    if (isGerman) {
       if (oppTags.includes('Strong') && userTags.includes('Weak')) commentaryContext = 'feedback_german_weak_vs_strong';
       else if (oppTags.includes('Winden') && !userTags.includes('Winden')) commentaryContext = 'feedback_german_winden';
       else if (oppTags.includes('Kron')) commentaryContext = 'commentary_crown';
       else if (oppTags.includes('Retreat') || oppTags.includes('Abzug')) commentaryContext = 'commentary_retreats';
       else commentaryContext = 'commentary_generic';
    } else {
       if (oppTags.includes('Zogho Largo') && userTags.includes('Zogho Stretto')) commentaryContext = 'feedback_italian_largo_vs_stretto';
       else if (oppTags.includes('Strong')) commentaryContext = 'commentary_crown';
       else commentaryContext = 'commentary_generic';
    }
  }

  // ═══════════════════════════════════════════════════════════
  // AI Opponent Logic — Strategic Reaction Selection
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    if (isOpponentTurn && isAiMode && !isMistake) {
      // If no recommended moves exist, AI uses a fallback (withdrawal/reset)
      if (recommendedMoves.length === 0) {
        setAiThinking(true);
        const timer = setTimeout(() => {
          const personalityTradition = aiPersonality === 'fiore' ? 'italian' : 'german';
          const fallbackId = personalityTradition === 'italian' ? 'i-ritirata' : 'g-abzug';
          const fallbackMove = getMoveById(fallbackId);
          if (fallbackMove) {
            onAddNode({
              moveId: fallbackMove.id,
              moveName: fallbackMove.name,
              nameKey: fallbackMove.nameKey,
              nodeRole: 'opponent-action',
              phase: currentPhase,
              step: nodes.length + 1,
              tradition: fallbackMove.tradition,
              tags: fallbackMove.tags,
              master: fallbackMove.master,
            });
            playClash();
          }
          setAiThinking(false);
        }, difficulty.thinkTime);
        return () => clearTimeout(timer);
      }

      setAiThinking(true);
      const personality = AI_PROFILES[aiPersonality];

      const timer = setTimeout(() => {
        let scoredMoves = recommendedMoves.map((move) => {
          let score = Math.random() * difficulty.randomWeight;
          const aiTags = move.tags || [];
          const userTags = lastNode?.tags || [];

          // ── Core HEMA principles (always active) ──
          if (userTags.includes('Strong')) {
            if (aiTags.includes('Winden') || aiTags.includes('Weak') || aiTags.includes('Retreat') || aiTags.includes('Abzug')) score += 10;
            if (aiTags.includes('Strong')) score -= 5;
          }
          if (userTags.includes('Zogho Largo') || userTags.includes('Largo')) {
            if (aiTags.includes('Zogho Stretto') || aiTags.includes('Stretto')) score += 8;
          }
          if (userTags.includes('Retreat') || userTags.includes('Abzug')) {
            if (aiTags.includes('Nachreisen')) score += 10;
          }

          // ── Personality bias ──
          if (personality && personality.bias) {
            score += personality.bias(move, userTags);
          }

          // ── Tradition preference ── 
          // AI strongly prefers moves from its personality's tradition
          const personalityTradition = aiPersonality === 'fiore' ? 'italian' : 'german';
          if (move.tradition === personalityTradition) {
            score += 15; // Heavy bonus for matching tradition
          } else {
            score -= 5; // Penalty for cross-tradition
          }

          // ── Anti-finisher scoring (difficulty-scaled) ──
          // Higher difficulty AI picks reactions that expose FEWER finisher paths
          const finisherPaths = countFinisherPaths(move.id);
          const blockStrength = (personality?.finisherBlockStrength || 0.5) * difficulty.finisherBlockMult;
          score -= finisherPaths * blockStrength * 8;

          // ── Master-specific: prefer deeper exchanges ──
          if (aiDifficulty === 'master') {
            const followupDepth = hemaMoves.filter(m => m.phase === 'followup' && m.follows?.includes(move.id)).length;
            score += followupDepth * 5;
          }

          // ── Fallback penalty ──
          // Withdrawal/retreat moves marked as fallback should only be used
          // when no better tactical option exists
          if (move.isFallback) {
            score -= 25;
          }
          
          return { ...move, score };
        });

        scoredMoves.sort((a, b) => b.score - a.score);
        const topN = Math.min(difficulty.topN, scoredMoves.length);
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
      }, difficulty.thinkTime);
      return () => clearTimeout(timer);
    }
  }, [isOpponentTurn, isAiMode, recommendedMoves, onAddNode, nodes.length, currentPhase, isMistake, lastNode, aiDifficulty, aiPersonality]);

  // Mistake punishment
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

  // Reactive Spawning of SelectorNodes
  useEffect(() => {
    if (!lastNode || lastNodeRendered?.isSelector || isComplete) return;

    if (lastNode.nodeRole === 'opponent-action') {
       // Sprout User Selector — multi-exchange: always allow user to pick next move
       const timer = setTimeout(() => onAddNode({ isSelector: true, nodeRole: 'user-action' }), 500);
       return () => clearTimeout(timer);
    }

    if (!isAiMode && lastNode.nodeRole === 'user-action') {
       const timer = setTimeout(() => onAddNode({ isSelector: true, nodeRole: 'opponent-action' }), 300);
       return () => clearTimeout(timer);
    }
  }, [lastNode, lastNodeRendered, isComplete, isAiMode, onAddNode]);

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
        } else if ((aiTags.includes('Abzug') || aiTags.includes('Retreat')) && !move.tags?.includes('Nachreisen')) {
           setLiveFeedback({ type: 'warning', text: t('commentary_retreats').replace('{oppMove}', oppReactionData?.name), master: 'Historical Principle' });
        } else if (!isMistake) {
           setLiveFeedback({ type: 'good', text: t('feedback_good'), master: 'Combat Flow' });
        }
    } else {
       setLiveFeedback({ type: 'neutral', text: t('feedback_neutral').replace('{moveName}', t(move.nameKey)), master: 'Combat Flow' });
    }

    playClash();
  }, [nodes.length, onAddNode, isAiMode, isOpponentTurn, oppReactionData, isMistake, t]);

  const matchWon = userScore >= maxScore;
  const matchLost = aiScore >= maxScore;

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

        {/* Header */}
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
               title={isMutedLocal ? t('mute_on') : t('mute_off')}
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

        {/* AI Settings Row (only when AI mode active) */}
        {isAiMode && (
          <div className="px-5 py-2 flex items-center gap-3 bg-[var(--color-parchment-dark)] border-b-[2px] border-[var(--color-ink-black)] flex-wrap">
            {/* Difficulty */}
            <div className="flex items-center gap-1">
              <span className="text-[9px] uppercase font-bold text-[var(--color-ink-black)] tracking-widest">{t('ai_difficulty')}:</span>
              <div className="flex bg-[var(--color-parchment)] border border-[var(--color-ink-black)]">
                {['novice', 'adept', 'master'].map((diff) => (
                  <button
                    key={diff}
                    onClick={() => setAiDifficulty(diff)}
                    className={`px-2 py-1 text-[9px] font-bold uppercase tracking-wider transition-all min-h-[28px] ${
                      aiDifficulty === diff
                        ? 'bg-[var(--color-ink-black)] text-[var(--color-parchment-light)]'
                        : 'text-[var(--color-ink-black)] hover:bg-[var(--color-parchment-dark)]'
                    }`}
                  >
                    {t(`ai_${diff}`)}
                  </button>
                ))}
              </div>
            </div>
            {/* Personality */}
            <div className="flex items-center gap-1">
              <select
                value={aiPersonality}
                onChange={(e) => setAiPersonality(e.target.value)}
                className="bg-[var(--color-parchment)] border border-[var(--color-ink-black)] text-[9px] font-bold uppercase tracking-wider px-2 py-1 text-[var(--color-ink-black)] focus:outline-none focus:border-[var(--color-ink-red)] min-h-[28px] cursor-pointer"
              >
                {Object.keys(AI_PROFILES).map((key) => (
                  <option key={key} value={key}>{t(AI_PROFILES[key].nameKey)}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Combat Tracker (Score Counter) */}
        {!matchWon && !matchLost && (
            <div className="px-5 py-2 flex justify-center items-center gap-6 bg-[var(--color-parchment)] border-b-[2px] border-[var(--color-ink-black)]">
               <div className="flex items-center gap-2">
                 <span className="text-[10px] uppercase font-bold text-[var(--color-ink-black)] tracking-widest leading-none">{t('you')}</span>
                 <div className="flex gap-1">
                   {Array.from({length: maxScore}).map((_, i) => (
                     <div key={`u-${i}`} className={`w-3 h-3 rounded-full border border-[var(--color-ink-black)] transition-all duration-300 ${i < userScore ? 'bg-[var(--color-gold)] scale-110' : 'bg-[var(--color-parchment-dark)]'}`}></div>
                   ))}
                 </div>
               </div>
               <div className="text-xs font-display text-[var(--color-ink-red)] italic opacity-60">vs</div>
               <div className="flex items-center gap-2">
                 <div className="flex gap-1">
                   {Array.from({length: maxScore}).map((_, i) => (
                     <div key={`a-${i}`} className={`w-3 h-3 rounded-full border border-[var(--color-ink-black)] transition-all duration-300 ${i < aiScore ? 'bg-[var(--color-ink-red)] scale-110' : 'bg-[var(--color-parchment-dark)]'}`}></div>
                   ))}
                 </div>
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
          {/* Match Won/Lost Banner (full match result) */}
          {(matchWon || matchLost) ? (
            <div className="text-center py-4 animate-fade-in">
              <span className="text-6xl filter drop-shadow-md block mb-4">{matchWon ? '🏆' : '💀'}</span>
              <h3 className={`text-2xl font-bold font-display tracking-wide uppercase mb-2 ${matchWon ? 'text-[var(--color-gold)]' : 'text-[var(--color-ink-red)]'}`}>
                {matchWon ? t('score_match_won') : t('score_match_lost')}
              </h3>
              <p className="text-lg font-display text-[var(--color-ink-black)] mb-4">{userScore} — {aiScore}</p>
            </div>
          ) : isComplete ? (
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
              <p className="text-sm text-[var(--color-ink-black)] leading-relaxed mb-4 font-medium italic">
                {isUserWin ? t('duel_win_desc') : t('duel_loss_prefix')}
              </p>

              {/* Next Round Button */}
              {!matchWon && !matchLost && (
                <button
                  onClick={onClear}
                  className="mt-2 px-6 py-3 bg-[var(--color-ink-black)] text-[var(--color-gold)] font-bold text-sm uppercase tracking-widest border-[2px] border-[var(--color-gold)] shadow-[4px_4px_0_0_var(--color-gold)] hover:bg-[var(--color-gold)] hover:text-[var(--color-ink-black)] transition-all active:translate-y-[2px] active:translate-x-[2px] active:shadow-none"
                >
                  {t('score_next_round')} →
                </button>
              )}

              {/* Historical AI Coaching */}
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
       currentPhase={currentPhase}
    />
    </>
  );
}
