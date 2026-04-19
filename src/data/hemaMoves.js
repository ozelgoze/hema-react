// ═══════════════════════════════════════════════════════════
// HEMA Longsword Moves — High-Level Functional Model
// ═══════════════════════════════════════════════════════════
// Each move describes WHAT happens physically (point of contact,
// whether a bind forms, distance). Historical variants (Zornhau,
// Fendente, Winden, etc.) are consolidated into principle-level
// actions. Manuscript references remain in the descriptions.
//
// Tag vocabulary (keep small, functional):
//   Strength : Strong | Weak
//   Contact  : Bind | NoBind
//   Range    : Long | Close
//   Kind     : Cut | Thrust | Grapple | Retreat | Wind | Counter
// ═══════════════════════════════════════════════════════════

export const hemaMoves = [
  // ──────────────────────────────────────────────────────────
  // STARTERS — your opening action
  // ──────────────────────────────────────────────────────────
  {
    id: 'attack-high-cut',
    nameKey: 'move_high_cut',
    descKey: 'desc_high_cut',
    type: 'cut',
    phase: 'starter',
    tags: ['Cut', 'Strong', 'Long'],
  },
  {
    id: 'attack-side-cut',
    nameKey: 'move_side_cut',
    descKey: 'desc_side_cut',
    type: 'cut',
    phase: 'starter',
    tags: ['Cut', 'Strong', 'Long', 'NoBind'],
  },
  {
    id: 'attack-low-cut',
    nameKey: 'move_low_cut',
    descKey: 'desc_low_cut',
    type: 'cut',
    phase: 'starter',
    tags: ['Cut', 'Weak', 'Long'],
  },
  {
    id: 'attack-thrust',
    nameKey: 'move_thrust',
    descKey: 'desc_thrust',
    type: 'thrust',
    phase: 'starter',
    tags: ['Thrust', 'Strong', 'Long', 'NoBind'],
  },

  // ──────────────────────────────────────────────────────────
  // REACTIONS — opponent's response to your action
  // ──────────────────────────────────────────────────────────
  {
    id: 'react-strong-parry',
    nameKey: 'move_strong_parry',
    descKey: 'desc_strong_parry',
    type: 'bind-response',
    phase: 'reaction',
    tags: ['Bind', 'Strong'],
    follows: [
      'attack-high-cut', 'attack-side-cut', 'attack-low-cut', 'attack-thrust',
      'fu-press-through', 'fu-wind-thrust', 'fu-disengage',
    ],
  },
  {
    id: 'react-soft-parry',
    nameKey: 'move_soft_parry',
    descKey: 'desc_soft_parry',
    type: 'bind-response',
    phase: 'reaction',
    tags: ['Bind', 'Weak'],
    follows: [
      'attack-high-cut', 'attack-low-cut', 'attack-thrust',
      'fu-wind-thrust', 'fu-chase', 'fu-disengage',
    ],
  },
  {
    id: 'react-counter-cut',
    nameKey: 'move_counter_cut',
    descKey: 'desc_counter_cut',
    type: 'counter',
    phase: 'reaction',
    tags: ['Cut', 'Counter', 'Bind', 'Strong'],
    follows: [
      'attack-high-cut', 'attack-side-cut', 'attack-low-cut', 'attack-thrust',
      'fu-press-through', 'fu-disengage',
    ],
  },
  {
    id: 'react-wind',
    nameKey: 'move_wind',
    descKey: 'desc_wind',
    type: 'wind',
    phase: 'reaction',
    tags: ['Wind', 'Bind', 'Strong'],
    follows: [
      'attack-high-cut', 'attack-side-cut',
      'fu-press-through', 'fu-wind-thrust',
    ],
  },
  {
    id: 'react-retreat',
    nameKey: 'move_retreat',
    descKey: 'desc_retreat',
    type: 'retreat',
    phase: 'reaction',
    tags: ['Retreat', 'NoBind'],
    isFallback: true,
    follows: [
      'attack-high-cut', 'attack-side-cut', 'attack-low-cut', 'attack-thrust',
      'fu-disengage', 'fu-press-through', 'fu-chase', 'fu-wind-thrust', 'fu-grapple',
    ],
  },

  // ──────────────────────────────────────────────────────────
  // FOLLOW-UPS — your response to opponent's reaction
  // ──────────────────────────────────────────────────────────
  {
    id: 'fu-disengage',
    nameKey: 'move_disengage',
    descKey: 'desc_disengage',
    type: 'thrust',
    phase: 'followup',
    tags: ['Thrust', 'Weak', 'NoBind'],
    follows: ['react-strong-parry', 'react-counter-cut'],
  },
  {
    id: 'fu-press-through',
    nameKey: 'move_press_through',
    descKey: 'desc_press_through',
    type: 'bind-response',
    phase: 'followup',
    tags: ['Bind', 'Strong'],
    follows: ['react-soft-parry', 'react-wind'],
  },
  {
    id: 'fu-chase',
    nameKey: 'move_chase',
    descKey: 'desc_chase',
    type: 'cut',
    phase: 'followup',
    tags: ['Cut', 'Strong', 'Long', 'NoBind'],
    follows: ['react-retreat'],
  },
  {
    id: 'fu-wind-thrust',
    nameKey: 'move_wind_thrust',
    descKey: 'desc_wind_thrust',
    type: 'wind',
    phase: 'followup',
    tags: ['Wind', 'Thrust', 'Bind'],
    follows: ['react-strong-parry', 'react-counter-cut', 'react-wind'],
  },
  {
    id: 'fu-grapple',
    nameKey: 'move_grapple',
    descKey: 'desc_grapple',
    type: 'grapple',
    phase: 'followup',
    tags: ['Grapple', 'Close', 'Bind'],
    follows: ['react-strong-parry', 'react-counter-cut'],
  },

  // ──────────────────────────────────────────────────────────
  // FINISHERS — decisive scoring actions
  // ──────────────────────────────────────────────────────────
  {
    id: 'fin-thrust',
    nameKey: 'move_fin_thrust',
    descKey: 'desc_fin_thrust',
    type: 'finisher',
    phase: 'finisher',
    tags: ['Thrust', 'Kill'],
    follows: ['fu-disengage', 'fu-wind-thrust', 'fu-press-through', 'react-soft-parry', 'react-wind'],
  },
  {
    id: 'fin-cut',
    nameKey: 'move_fin_cut',
    descKey: 'desc_fin_cut',
    type: 'finisher',
    phase: 'finisher',
    tags: ['Cut', 'Kill'],
    follows: ['fu-press-through', 'fu-chase', 'fu-wind-thrust', 'react-retreat'],
  },
  {
    id: 'fin-pommel',
    nameKey: 'move_fin_pommel',
    descKey: 'desc_fin_pommel',
    type: 'finisher',
    phase: 'finisher',
    tags: ['Close', 'Kill'],
    follows: ['fu-grapple', 'fu-press-through'],
  },
  {
    id: 'fin-takedown',
    nameKey: 'move_fin_takedown',
    descKey: 'desc_fin_takedown',
    type: 'finisher',
    phase: 'finisher',
    tags: ['Grapple', 'Close', 'Kill'],
    follows: ['fu-grapple'],
  },
];

export const allMoves = hemaMoves;

// ═══════════════════════════════════════════════════════════
// HEMA Measure (Mensur / Misura) — 3-tier distance model
// 2 = Weit Mensur / Misura Larga (long / out-of-direct-strike)
// 1 = Mittel Mensur / Mezza Misura (middle / full cut & thrust)
// 0 = Nahe Mensur / Zogho Stretto (close / grapple, half-sword, pommel)
// ═══════════════════════════════════════════════════════════
export const MEASURE = Object.freeze({ WEIT: 2, MITTEL: 1, NAHE: 0 });
export const INITIAL_MEASURE = MEASURE.MITTEL;

// Map each move to its effect on measure.
// 'open'      → +1 (push apart, cap at weit)
// 'close'     → −1 (draw in, floor at nahe)
// 'set-nahe'  → force to 0 (grapple commits to closing)
// 'set-mittel'→ force to 1 (starter/finisher cut/thrust is a full-measure exchange)
// 'neutral'   → no change (bind-holding actions: wind, press-through on bind)
export const measureEffect = (move) => {
  if (!move) return 'neutral';
  const tags = move.tags || [];
  if (tags.includes('Retreat')) return 'open';
  if (tags.includes('Grapple')) return 'set-nahe';
  if (move.id === 'fu-chase') return 'close';         // Nachreisen physically closes
  if (move.id === 'fin-pommel') return 'set-nahe';    // Mordschlag is a close action
  if (tags.includes('Wind') && tags.includes('Bind')) return 'neutral'; // winding keeps bind measure
  if (move.phase === 'starter' || move.phase === 'finisher') return 'set-mittel';
  return 'neutral';
};

export const applyMeasureEffect = (tier, move) => {
  const e = measureEffect(move);
  if (e === 'open') return Math.min(MEASURE.WEIT, tier + 1);
  if (e === 'close') return Math.max(MEASURE.NAHE, tier - 1);
  if (e === 'set-nahe') return MEASURE.NAHE;
  if (e === 'set-mittel') return MEASURE.MITTEL;
  return tier;
};

// Walk the active play nodes in order and fold the measure effect of each move.
export const deriveMeasure = (activeNodes) => {
  let tier = INITIAL_MEASURE;
  for (const n of activeNodes || []) {
    const move = getMoveById(n?.data?.moveId);
    if (move) tier = applyMeasureEffect(tier, move);
  }
  return tier;
};

// Measure-fit heuristic for scoring: how well this move fits the current measure.
// Returns a small positive/negative number. Used by AI doctrine and user suggestion ranking.
export const measureFit = (move, tier) => {
  if (!move) return 0;
  const tags = move.tags || [];
  // Grapple / pommel / takedown need nahe. Heavy penalty from weit.
  if (tags.includes('Grapple') || move.id === 'fin-pommel' || move.id === 'fin-takedown') {
    if (tier === MEASURE.NAHE) return 6;
    if (tier === MEASURE.MITTEL) return -3;
    return -10; // from weit — impossible without closing first
  }
  // Chase closes distance — best initiated from mittel (opponent a step away, recoverable).
  if (move.id === 'fu-chase') {
    if (tier === MEASURE.MITTEL) return 3;
    if (tier === MEASURE.WEIT) return -2; // too far to chase cleanly
  }
  // Cuts & thrusts need mittel minimum. Penalize at nahe (overcommitted, tangled blade).
  if (tags.includes('Cut') || tags.includes('Thrust')) {
    if (tier === MEASURE.WEIT && !tags.includes('Counter')) return -4; // out of distance
    if (tier === MEASURE.NAHE) return -2; // too close for a full cut/thrust
  }
  // Retreat is best from nahe (break the grapple/bind) or mittel; wasted from weit.
  if (tags.includes('Retreat')) {
    if (tier === MEASURE.NAHE) return 4;
    if (tier === MEASURE.WEIT) return -3;
  }
  return 0;
};

// ═══════════════════════════════════════════════════════════
// Finisher prerequisites (HEMA doctrine).
// Returns null when the finisher is valid; otherwise a failure reason key:
//   'fin_fail_measure_nahe' — move needs mittel, opponent too close, blade tangles
//   'fin_fail_measure_weit' — move needs mittel, opponent too far, point/edge falls short
//   'fin_fail_need_nahe'    — close-work finisher attempted from mittel/weit
//   'fin_fail_no_bind'      — Schnitt / Durchstich without an established bind
//   'fin_fail_no_grapple'   — Takedown without first grappling
//   'fin_fail_controlled_bind' — thrust into opponent's dominant forte without winding first
// Caller maps each reason to i18n feedback text.
// ═══════════════════════════════════════════════════════════
export const evaluateFinisher = (move, { tier, prevOppTags = [], userPrevOwnTags = [] } = {}) => {
  if (!move || move.type !== 'finisher') return null;

  const prevWasWindOrDisengage =
    userPrevOwnTags.includes('Wind') ||
    (userPrevOwnTags.includes('NoBind') && userPrevOwnTags.includes('Thrust'));
  const prevWasGrapple = userPrevOwnTags.includes('Grapple');
  const bindEstablished = prevOppTags.includes('Bind') || userPrevOwnTags.includes('Bind');

  switch (move.id) {
    case 'fin-thrust':
      if (tier === MEASURE.NAHE) return 'fin_fail_measure_nahe';
      if (tier === MEASURE.WEIT) return 'fin_fail_measure_weit';
      if (prevOppTags.includes('Strong') && prevOppTags.includes('Bind') && !prevWasWindOrDisengage) {
        return 'fin_fail_controlled_bind';
      }
      return null;

    case 'fin-cut':
      if (tier === MEASURE.NAHE) return 'fin_fail_measure_nahe';
      if (tier === MEASURE.WEIT) return 'fin_fail_measure_weit';
      if (!bindEstablished && !prevOppTags.includes('Retreat')) return 'fin_fail_no_bind';
      return null;

    case 'fin-pommel':
      if (tier !== MEASURE.NAHE) return 'fin_fail_need_nahe';
      return null;

    case 'fin-takedown':
      if (tier !== MEASURE.NAHE) return 'fin_fail_need_nahe';
      if (!prevWasGrapple) return 'fin_fail_no_grapple';
      return null;

    default:
      return null;
  }
};

// ═══════════════════════════════════════════════════════════
// Manuscript Source Notes — primary treatise per move
// ═══════════════════════════════════════════════════════════
export const manuscriptNotes = {
  'attack-high-cut':   'ms_high_cut',
  'attack-side-cut':   'ms_side_cut',
  'attack-low-cut':    'ms_low_cut',
  'attack-thrust':     'ms_thrust',
  'react-strong-parry':'ms_strong_parry',
  'react-soft-parry':  'ms_soft_parry',
  'react-counter-cut': 'ms_counter_cut',
  'react-wind':        'ms_wind',
  'react-retreat':     'ms_retreat',
  'fu-disengage':      'ms_disengage',
  'fu-press-through':  'ms_press_through',
  'fu-chase':          'ms_chase',
  'fu-wind-thrust':    'ms_wind_thrust',
  'fu-grapple':        'ms_grapple',
  'fin-thrust':        'ms_fin_thrust',
  'fin-cut':           'ms_fin_cut',
  'fin-pommel':        'ms_fin_pommel',
  'fin-takedown':      'ms_fin_takedown',
};

export const getManuscriptKey = (moveId) => manuscriptNotes[moveId] || null;

export const getMovesByPhase = (phase) => hemaMoves.filter((m) => m.phase === phase);

export const getMoveById = (id) => hemaMoves.find((m) => m.id === id);
