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
      'fu-press-through', 'fu-wind-thrust',
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
      'fu-wind-thrust', 'fu-chase',
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
