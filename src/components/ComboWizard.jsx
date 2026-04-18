import { useState, useCallback, useMemo, useEffect } from 'react';
import { useTranslation } from '../i18n/LanguageContext';
import { getMovesByPhase, getMoveById, hemaMoves, deriveMeasure, measureFit, MEASURE } from '../data/hemaMoves';
import LanguageSelector from './LanguageSelector';
import MoveSelectorModal from './MoveSelectorModal';
import MeasureGauge from './MeasureGauge';

// ═══════════════════════════════════════════════════════════
// AI Personality Profiles — functional tag system
// Tags: Strong/Weak, Bind/NoBind, Cut/Thrust/Grapple/Wind/Counter/Retreat
// ═══════════════════════════════════════════════════════════
const AI_PROFILES = {
  liechtenauer: {
    nameKey: 'ai_personality_liechtenauer',
    style: 'aggressive',
    finisherBlockStrength: 0.6,
    bias: (move, userTags) => {
      let score = 0;
      const aiTags = move.tags || [];
      // Relentless forward pressure — answer strength with strength, punish weakness
      if (aiTags.includes('Strong')) score += 6;
      if (aiTags.includes('Counter')) score += 8;
      if (aiTags.includes('Wind')) score += 7;
      if (userTags.includes('Weak')) score += 12;
      if (aiTags.includes('Retreat')) score -= 10;
      // Against a chaser: meet the charge head-on with a counter-cut
      if (userTags.includes('Cut') && userTags.includes('NoBind')) {
        if (aiTags.includes('Counter')) score += 15;
        if (aiTags.includes('Retreat')) score -= 15;
      }
      return score;
    },
  },
  fiore: {
    nameKey: 'ai_personality_fiore',
    style: 'grappling',
    finisherBlockStrength: 0.9, // Fiore fights long — hard to finish quickly
    bias: (move, userTags) => {
      let score = 0;
      const aiTags = move.tags || [];
      // Close distance, secure the bind, control with grapple/thrust
      if (aiTags.includes('Bind')) score += 8;
      if (aiTags.includes('Grapple')) score += 15;
      if (aiTags.includes('Close')) score += 6;
      if (aiTags.includes('Counter') && aiTags.includes('Thrust')) score += 10;
      if (aiTags.includes('Weak')) score -= 8;
      if (aiTags.includes('Retreat')) score -= 12;
      // "Chi mi segue, trova la mia punta" — against a chaser, set the point
      if (userTags.includes('Cut') && userTags.includes('NoBind')) {
        if (aiTags.includes('Thrust') && aiTags.includes('Counter')) score += 25;
        if (aiTags.includes('Retreat')) score -= 20;
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
      // Technical variety — winding, angles, controlled counters
      if (aiTags.includes('Wind')) score += 10;
      if (aiTags.includes('Counter')) score += 6;
      if (aiTags.includes('Bind')) score += 5;
      score += Math.random() * 4;
      // Against chasers: create a bind, wind into a new line
      if (userTags.includes('Cut') && userTags.includes('NoBind')) {
        if (aiTags.includes('Counter')) score += 14;
        if (aiTags.includes('Bind')) score += 10;
        if (aiTags.includes('Retreat')) score -= 8;
      }
      if (aiTags.includes('Retreat')) score -= 6;
      return score;
    },
  },
};

// AI Difficulty — controls how optimally the AI plays
// cleanProb = probability the AI executes its intent flawlessly (descKey unchanged).
// 1 - cleanProb = probability it botches (descKey → desc_*_sloppy). Only applied to reactions.
const AI_DIFFICULTY = {
  novice: { randomWeight: 10, topN: 5, thinkTime: 600, minStepsForFinisher: 1, finisherBlockMult: 0, cleanProb: 0.10 },
  adept: { randomWeight: 3, topN: 3, thinkTime: 1000, minStepsForFinisher: 3, finisherBlockMult: 0.5, cleanProb: 0.65 },
  master: { randomWeight: 0.5, topN: 1, thinkTime: 1400, minStepsForFinisher: 5, finisherBlockMult: 1.0, cleanProb: 0.95 },
};

// Reactions are the only moves with clean/sloppy description variants.
const REACTION_MOVE_IDS = new Set(['react-strong-parry', 'react-soft-parry', 'react-counter-cut', 'react-wind', 'react-retreat']);

// Pick clean or sloppy description based on difficulty.
// Sloppy variants only exist for reactions — other phases fall through unchanged.
const pickDescKey = (move, cleanProb) => {
  if (!move?.descKey) return null;
  if (!REACTION_MOVE_IDS.has(move.id)) return move.descKey;
  return Math.random() < cleanProb ? move.descKey : `${move.descKey}_sloppy`;
};

// ═══════════════════════════════════════════════════════════
// HEMA Attack Doctrine — based on instructor's "Basit Atak Diyagramı"
// Root: probe → read reaction → branch.
//   A. Reacts + holds centerline (Strong+Bind) → pacify & pressure (Grapple / Counter+Thrust / Wind)
//   B. Reacts + breaks centerline (own Wind or NoBind-Thrust) → RETREAT next
//   C. No reaction + can hit → strike with Counter+Thrust or committed Cut, return to sword
//   D. No reaction + can't hit → approach (not encoded — UI-level hint only)
// Returns an additive score. Applied on top of personality + core-principle scoring.
// ═══════════════════════════════════════════════════════════
const applyDoctrine = ({ aiTags = [], userTags = [], prevOwnTags = [], tier = MEASURE.MITTEL }) => {
  let score = 0;

  // B. "Merkez çizgisini bozuyor → Abnemen/Zucken/Durchwechsel/Winding sonrasında uzaklaş."
  // If the actor just broke the line (Wind, or NoBind-Thrust disengage), the NEXT move should retreat or re-bind.
  const brokeLineLastTurn =
    prevOwnTags.includes('Wind') ||
    (prevOwnTags.includes('NoBind') && prevOwnTags.includes('Thrust'));
  if (brokeLineLastTurn) {
    if (aiTags.includes('Retreat')) score += 8;
    if (aiTags.includes('Bind')) score += 3;
    if (aiTags.includes('Cut') && !aiTags.includes('Counter')) score -= 4;
  }

  // A. "Merkez çizgisinde kalıyor, eller arkada → güreş / kılıcı pasifize edip sapla veya kes."
  // Against a passive Strong+Bind opponent, favor pacify-then-thrust, grapple, or sword-manipulation (Wind).
  if (userTags.includes('Strong') && userTags.includes('Bind')) {
    if (aiTags.includes('Grapple')) score += 6;
    if (aiTags.includes('Counter') && aiTags.includes('Thrust')) score += 5;
    if (aiTags.includes('Wind')) score += 3;
  }

  // C. "Reaksiyon vermiyor, vurabilirim → saplama/kesiş + rakibin kılıcına git ya da uzaklaş."
  // After a passive retreat from the user, a committed Counter+Thrust is the cleanest finish.
  if (userTags.includes('Retreat')) {
    if (aiTags.includes('Counter') && aiTags.includes('Thrust')) score += 6;
    if (aiTags.includes('Cut') && aiTags.includes('NoBind')) score += 3;
  }

  // D. "Vuramam → ileri-geri küçük adımlarla yaklaş."
  // At weit (out of direct reach), reward the single move that closes distance (Nachreisen/chase);
  // heavily discourage anything that needs nahe (grapple/pommel/takedown) until measure collapses.
  if (tier === MEASURE.WEIT) {
    if (aiTags.includes('Grapple')) score -= 10;
    if (aiTags.includes('Close')) score -= 6;
    if (aiTags.includes('Retreat')) score -= 3;
  }
  // At nahe, the committed cut/thrust is overstretched — prefer close-work (grapple/pommel) or break out.
  if (tier === MEASURE.NAHE) {
    if (aiTags.includes('Grapple') || aiTags.includes('Close')) score += 5;
    if (aiTags.includes('Retreat')) score += 3; // legitimate break from Zogho Stretto
  }

  return score;
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

  // User's own previous action (two nodes back when it's the user's turn).
  // Used to apply doctrine rules (e.g. "after winding/disengaging, retreat next").
  const userPrevOwnTags = useMemo(() => {
    if (activePlayNodes.length < 2) return [];
    const cand = activePlayNodes[activePlayNodes.length - 2]?.data;
    return cand?.nodeRole === 'user-action' ? (cand.tags || []) : [];
  }, [activePlayNodes]);

  // Current HEMA measure (tier 0=Nahe, 1=Mittel, 2=Weit), derived by walking the exchange.
  const currentMeasure = useMemo(() => deriveMeasure(activePlayNodes), [activePlayNodes]);

  const recommendedMoves = useMemo(() => {
    if (!lastNode) return [];
    const filtered = availableMoves.filter((m) => m.follows?.includes(lastNode.moveId));
    // Sort so the diagram-compliant move surfaces as the ⭐ AI Suggestion.
    return filtered
      .map((m) => ({
        move: m,
        score:
          applyDoctrine({
            aiTags: m.tags || [],
            userTags: lastNode.tags || [],
            prevOwnTags: userPrevOwnTags,
            tier: currentMeasure,
          }) + measureFit(m, currentMeasure),
      }))
      .sort((a, b) => b.score - a.score)
      .map((x) => x.move);
  }, [availableMoves, lastNode, userPrevOwnTags, currentMeasure]);

  let commentaryContext = 'commentary_generic';
  const [hasHandledEnd, setHasHandledEnd] = useState(false);

  useEffect(() => {
    if (!isComplete) {
       setHasHandledEnd(false);
    } else if (isComplete && !hasHandledEnd) {
       if (isUserWin) {
         if (onScoreUpdate) onScoreUpdate('user');
       } else if (isOpponentWin) {
         document.body.classList.add('shake-animation');
         setTimeout(() => {
           document.body.classList.remove('shake-animation');
         }, 400);
         if (onScoreUpdate) onScoreUpdate('ai');
       }
       setHasHandledEnd(true);
    }
  }, [isComplete, isUserWin, isOpponentWin, hasHandledEnd, onScoreUpdate]);

  // For Mistake Calculation
  const oppReactionNode = (activePlayNodes.length >= 2 && lastNode?.nodeRole === 'user-action') ? activePlayNodes[activePlayNodes.length - 2]?.data : lastNode?.nodeRole === 'opponent-action' ? lastNode : null;
  const userActionData = lastNode?.nodeRole === 'user-action' && activePlayNodes.length > 1 ? getMoveById(lastNode.moveId) : null;
  const oppReactionData = oppReactionNode ? getMoveById(oppReactionNode.moveId) : null;

  const isMistake = !!(isOpponentTurn && oppReactionData && userActionData && !userActionData.follows?.includes(oppReactionData.id));

  if (isMistake) {
    const oppTags = oppReactionData.tags || [];
    const userTags = userActionData.tags || [];
    const isIntentionalDisengage = userTags.includes('Thrust') && userTags.includes('NoBind');

    // Diagnose the structural mismatch using the new functional tag vocabulary.
    // Exclude intentional disengages (Thrust+NoBind) — those legitimately break the bind.
    if (oppTags.includes('Strong') && oppTags.includes('Bind') && userTags.includes('Weak') && !isIntentionalDisengage) {
      commentaryContext = 'feedback_weak_vs_strong';
    } else if (oppTags.includes('Bind') && userTags.includes('NoBind') && !isIntentionalDisengage) {
      commentaryContext = 'feedback_bind_dropped';
    } else if (oppTags.includes('Retreat') && userTags.includes('Cut') && userTags.includes('NoBind')) {
      commentaryContext = 'feedback_chased_blind';
    } else if (oppTags.includes('Strong') && oppTags.includes('Bind') && userTags.includes('Cut')) {
      commentaryContext = 'feedback_high_strong_trap';
    } else if (userTags.includes('Grapple') && !oppTags.includes('Bind')) {
      commentaryContext = 'feedback_grapple_too_far';
    } else {
      commentaryContext = 'commentary_generic';
    }
  }

  // ═══════════════════════════════════════════════════════════
  // AI Opponent Logic — Strategic Reaction Selection
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    if (isOpponentTurn && isAiMode && !isMistake) {
      // If no recommended moves exist, AI falls back to a retreat to reset the fight
      if (recommendedMoves.length === 0) {
        setAiThinking(true);
        const timer = setTimeout(() => {
          const fallbackMove = getMoveById('react-retreat');
          if (fallbackMove) {
            onAddNode({
              moveId: fallbackMove.id,
              nameKey: fallbackMove.nameKey,
              descKey: pickDescKey(fallbackMove, difficulty.cleanProb),
              nodeRole: 'opponent-action',
              phase: currentPhase,
              step: nodes.length + 1,
              tags: fallbackMove.tags,
            });
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
          // Strong vs Strong is wasteful — yield or wind around it
          if (userTags.includes('Strong') && userTags.includes('Bind')) {
            if (aiTags.includes('Wind') || aiTags.includes('Weak') || aiTags.includes('NoBind')) score += 10;
            if (aiTags.includes('Strong') && aiTags.includes('Cut')) score -= 5;
          }
          // Against a retreating opponent, chase — but a counter-thrust is safer
          if (userTags.includes('Retreat')) {
            if (aiTags.includes('Cut') && aiTags.includes('NoBind')) score += 6;
            if (aiTags.includes('Counter') && aiTags.includes('Thrust')) score += 10;
          }
          // Against a committed cut with no bind, a counter-cut or counter-thrust is the answer
          if (userTags.includes('Cut') && userTags.includes('NoBind')) {
            if (aiTags.includes('Counter')) score += 8;
          }
          // Against a disengage-thrust (Durchwechseln: user broke bind, now thrusts a new line),
          // the AI must treat it as a fresh incoming thrust — parry it, re-bind, or counter-thrust.
          // Critically: do NOT try to wind a bind that no longer exists.
          if (userTags.includes('Thrust') && userTags.includes('NoBind')) {
            if (aiTags.includes('Bind')) score += 10;           // re-establish bind on the new thrust
            if (aiTags.includes('Counter') && aiTags.includes('Thrust')) score += 8; // counter-thrust
            if (aiTags.includes('Wind')) score -= 12;           // no bind to wind — penalize
            if (aiTags.includes('Retreat')) score -= 2;         // valid but cedes tempo
          }

          // ── Personality bias ──
          if (personality && personality.bias) {
            score += personality.bias(move, userTags);
          }

          // ── HEMA Attack Doctrine (instructor's decision tree) ──
          // AI's own previous action is 2 nodes back (opponent-action → user-action → now opponent-action).
          const aiPrevOwn = activePlayNodes.length >= 2 ? activePlayNodes[activePlayNodes.length - 2]?.data : null;
          const prevOwnTags = aiPrevOwn?.nodeRole === 'opponent-action' ? (aiPrevOwn.tags || []) : [];
          score += applyDoctrine({ aiTags, userTags, prevOwnTags, tier: currentMeasure });
          score += measureFit(move, currentMeasure);

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
          // Retreat moves marked as fallback should only be used when no better option exists
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
          nameKey: bestMove.nameKey,
          descKey: pickDescKey(bestMove, difficulty.cleanProb),
          nodeRole: 'opponent-action',
          phase: currentPhase,
          step: nodes.length + 1,
          tags: bestMove.tags,
        });
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
          nameKey: 'opponent_finisher_name',
          descKey: commentaryContext,
          nodeRole: 'opponent-point',
          phase: 'finisher',
          step: nodes.length + 1,
          tags: ['Punish', 'Hit'],
        });
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [isOpponentTurn, isAiMode, isMistake, onAddNode, nodes.length, commentaryContext]);

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
      nameKey: move.nameKey,
      nodeRole,
      phase: move.type === 'finisher' ? 'finisher' : 'user-action',
      tags: move.tags,
    }, true);

    const aiTags = oppReactionData?.tags || [];
    const userTags = move.tags || [];
    const isIntentionalDisengage = userTags.includes('Thrust') && userTags.includes('NoBind');
    if (isAiMode && isOpponentTurn) {
        if (userTags.includes('Weak') && aiTags.includes('Strong') && aiTags.includes('Bind') && !isIntentionalDisengage) {
           setLiveFeedback({ type: 'bad', text: t('feedback_weak_vs_strong'), master: 'Principle' });
        } else if (aiTags.includes('Bind') && userTags.includes('NoBind') && !isIntentionalDisengage) {
           setLiveFeedback({ type: 'warning', text: t('feedback_bind_dropped'), master: 'Principle' });
        } else if (aiTags.includes('Retreat') && userTags.includes('Cut') && userTags.includes('NoBind')) {
           setLiveFeedback({ type: 'warning', text: t('feedback_chased_blind'), master: 'Fiore' });
        } else if (userTags.includes('Grapple') && !aiTags.includes('Bind')) {
           setLiveFeedback({ type: 'warning', text: t('feedback_grapple_too_far'), master: 'Principle' });
        } else if (!isMistake) {
           setLiveFeedback({ type: 'good', text: t('feedback_good'), master: 'Combat Flow' });
        }
    } else {
       setLiveFeedback({ type: 'neutral', text: t('feedback_neutral').replace('{moveName}', t(move.nameKey)), master: 'Combat Flow' });
    }
  }, [nodes.length, onAddNode, isAiMode, isOpponentTurn, oppReactionData, isMistake, t]);

  const matchWon = userScore >= maxScore;
  const matchLost = aiScore >= maxScore;

  return (
    <>
    <div className={`fixed bottom-0 left-0 w-full md:absolute md:top-4 md:bottom-auto md:left-1/2 md:-translate-x-1/2 z-50 md:w-[420px] transition-transform duration-300 ease-in-out ${!isExpanded ? 'translate-y-[calc(100%-72px)] md:translate-y-0' : 'translate-y-0'}`}>
      <div className="bg-[var(--color-parchment-light)] rounded-t-xl md:rounded-sm border-t-[3px] md:border-[3px] border-[var(--color-ink-black)] shadow-[0_-10px_40px_rgba(42,37,34,0.2)] md:shadow-[6px_6px_0_0_var(--color-ink-black)] overflow-hidden relative transition-all duration-300">

        {/* Mobile drag handle — larger tap target with live score peek when collapsed */}
        <button
           onClick={() => setIsExpanded(!isExpanded)}
           className="md:hidden w-full bg-[var(--color-parchment-dark)] py-2.5 px-4 flex flex-col items-center gap-1.5 border-b-2 border-[var(--color-ink-black)] active:bg-[var(--color-parchment)] transition-colors min-h-[44px] focus:outline-none"
           aria-label={isExpanded ? t('collapse_duel_control') : t('expand_duel_control')}
        >
           <div className="w-12 h-1.5 bg-[var(--color-ink-faded)] rounded-full"></div>
           {!matchWon && !matchLost && (
             <div className="flex items-center gap-3 text-[10px] font-display uppercase tracking-widest text-[var(--color-ink-black)]">
               <span className="flex items-center gap-1">
                 <span className="font-bold">{t('you')}</span>
                 <span className="text-[var(--color-gold)] font-bold">{userScore}</span>
               </span>
               <span className="opacity-40">—</span>
               <span className="flex items-center gap-1">
                 <span className="text-[var(--color-ink-red)] font-bold">{aiScore}</span>
                 <span className="font-bold">AI</span>
               </span>
               {aiThinking && <span className="text-[var(--color-ink-red)] italic animate-pulse ml-2">⚔️</span>}
             </div>
           )}
        </button>

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
              onClick={() => setIsAiMode(!isAiMode)}
              aria-pressed={isAiMode}
              className={`px-3 min-h-[44px] md:min-h-0 md:py-1 text-xs rounded-none border-[2px] font-bold uppercase tracking-wider transition-all duration-300 ${
                isAiMode
                  ? 'bg-[var(--color-ink-black)] text-[var(--color-parchment-light)] border-[var(--color-ink-black)]'
                  : 'bg-[var(--color-parchment-light)] text-[var(--color-ink-black)] border-[var(--color-ink-black)]'
              }`}
            >
              {isAiMode ? t('toggle_ai') : t('mode_manual')}
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

        {/* HEMA Measure Gauge — animated Mensur/Misura indicator */}
        {!matchWon && !matchLost && <MeasureGauge tier={currentMeasure} />}

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
        <div className="p-4 md:p-5 max-h-[50vh] md:max-h-none overflow-y-auto scrollbar-thin safe-bottom">
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
          <div className="flex gap-3 px-4 py-3 bg-[var(--color-parchment)] border-t-[2px] border-[var(--color-ink-black)] safe-bottom">
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
