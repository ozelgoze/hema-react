// ═══════════════════════════════════════════════════════════
// Pre-built Historical Combos
// Authenticated sequences from HEMA masters, mapped to the
// high-level functional move set.
// ═══════════════════════════════════════════════════════════

export const historicalCombos = [
  {
    id: 'meyer-zornhau',
    nameKey: 'combo_meyer_zornhau',
    descKey: 'combo_meyer_zornhau_desc',
    historicalMetaKey: 'meta_meyer_hist',
    swordfishMetaKey: 'meta_meyer_swordfish',
    master: 'Meyer',
    nodes: [
      {
        id: 'mz-1',
        type: 'actionNode',
        position: { x: 250, y: 0 },
        data: {
          moveId: 'attack-high-cut',
          nameKey: 'move_high_cut',
          nodeRole: 'user-action',
          phase: 'starter',
          step: 1,
          tags: ['Cut', 'Strong', 'Long'],
        },
      },
      {
        id: 'mz-2',
        type: 'actionNode',
        position: { x: 250, y: 160 },
        data: {
          moveId: 'react-strong-parry',
          nameKey: 'move_strong_parry',
          nodeRole: 'opponent-action',
          phase: 'reaction',
          step: 2,
          tags: ['Bind', 'Strong'],
        },
      },
      {
        id: 'mz-3',
        type: 'actionNode',
        position: { x: 250, y: 320 },
        data: {
          moveId: 'fu-disengage',
          nameKey: 'move_disengage',
          nodeRole: 'user-action',
          phase: 'followup',
          step: 3,
          tags: ['Thrust', 'Weak', 'NoBind'],
        },
      },
      {
        id: 'mz-4',
        type: 'actionNode',
        position: { x: 250, y: 480 },
        data: {
          moveId: 'fin-cut',
          nameKey: 'move_fin_cut',
          nodeRole: 'scoring-point',
          phase: 'finisher',
          step: 4,
          tags: ['Cut', 'Kill'],
        },
      },
    ],
    edges: [
      { id: 'mz-e1', source: 'mz-1', target: 'mz-2', animated: true },
      { id: 'mz-e2', source: 'mz-2', target: 'mz-3', animated: true },
      { id: 'mz-e3', source: 'mz-3', target: 'mz-4', animated: true },
    ],
  },
  {
    id: 'fiore-exchange',
    nameKey: 'combo_fiore_exchange',
    descKey: 'combo_fiore_exchange_desc',
    historicalMetaKey: 'meta_fiore_hist',
    swordfishMetaKey: 'meta_fiore_swordfish',
    master: 'Fiore',
    nodes: [
      {
        id: 'fe-1',
        type: 'actionNode',
        position: { x: 250, y: 0 },
        data: {
          moveId: 'attack-thrust',
          nameKey: 'move_thrust',
          nodeRole: 'user-action',
          phase: 'starter',
          step: 1,
          tags: ['Thrust', 'Strong', 'Long', 'NoBind'],
        },
      },
      {
        id: 'fe-2',
        type: 'actionNode',
        position: { x: 250, y: 160 },
        data: {
          moveId: 'react-strong-parry',
          nameKey: 'move_strong_parry',
          nodeRole: 'opponent-action',
          phase: 'reaction',
          step: 2,
          tags: ['Bind', 'Strong'],
        },
      },
      {
        id: 'fe-3',
        type: 'actionNode',
        position: { x: 250, y: 320 },
        data: {
          moveId: 'fu-grapple',
          nameKey: 'move_grapple',
          nodeRole: 'user-action',
          phase: 'followup',
          step: 3,
          tags: ['Grapple', 'Close', 'Bind'],
        },
      },
      {
        id: 'fe-4',
        type: 'actionNode',
        position: { x: 250, y: 480 },
        data: {
          moveId: 'fin-pommel',
          nameKey: 'move_fin_pommel',
          nodeRole: 'scoring-point',
          phase: 'finisher',
          step: 4,
          tags: ['Close', 'Kill'],
        },
      },
    ],
    edges: [
      { id: 'fe-e1', source: 'fe-1', target: 'fe-2', animated: true },
      { id: 'fe-e2', source: 'fe-2', target: 'fe-3', animated: true },
      { id: 'fe-e3', source: 'fe-3', target: 'fe-4', animated: true },
    ],
  },
  {
    id: 'liechtenauer-nachreisen',
    nameKey: 'combo_liech_nachreisen',
    descKey: 'combo_liech_nachreisen_desc',
    historicalMetaKey: 'meta_liech_hist',
    swordfishMetaKey: 'meta_liech_swordfish',
    master: 'Liechtenauer',
    nodes: [
      {
        id: 'ln-1',
        type: 'actionNode',
        position: { x: 250, y: 0 },
        data: {
          moveId: 'attack-high-cut',
          nameKey: 'move_high_cut',
          nodeRole: 'user-action',
          phase: 'starter',
          step: 1,
          tags: ['Cut', 'Strong', 'Long'],
        },
      },
      {
        id: 'ln-2',
        type: 'actionNode',
        position: { x: 250, y: 160 },
        data: {
          moveId: 'react-retreat',
          nameKey: 'move_retreat',
          nodeRole: 'opponent-action',
          phase: 'reaction',
          step: 2,
          tags: ['Retreat', 'NoBind'],
        },
      },
      {
        id: 'ln-3',
        type: 'actionNode',
        position: { x: 250, y: 320 },
        data: {
          moveId: 'fu-chase',
          nameKey: 'move_chase',
          nodeRole: 'user-action',
          phase: 'followup',
          step: 3,
          tags: ['Cut', 'Strong', 'Long', 'NoBind'],
        },
      },
      {
        id: 'ln-4',
        type: 'actionNode',
        position: { x: 250, y: 480 },
        data: {
          moveId: 'fin-cut',
          nameKey: 'move_fin_cut',
          nodeRole: 'scoring-point',
          phase: 'finisher',
          step: 4,
          tags: ['Cut', 'Kill'],
        },
      },
    ],
    edges: [
      { id: 'ln-e1', source: 'ln-1', target: 'ln-2', animated: true },
      { id: 'ln-e2', source: 'ln-2', target: 'ln-3', animated: true },
      { id: 'ln-e3', source: 'ln-3', target: 'ln-4', animated: true },
    ],
  },
];
