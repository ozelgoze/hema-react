import { memo, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { useTranslation } from '../../i18n/LanguageContext';
import { getManuscriptKey, getMoveById } from '../../data/hemaMoves';

const roleConfig = {
  'user-action': {
    class: 'glass-panel', // Base parchment woodcut style
    textColor: 'text-[var(--color-ink-black)]',
    badgeColor: 'bg-[var(--color-ink-black)] text-[var(--color-parchment-light)] border border-[var(--color-ink-black)]',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><path d="M14.5 17.5L3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4M19 21l2-2" /></svg>,
    glow: '',
  },
  'opponent-action': {
    class: 'glass-panel',
    textColor: 'text-[var(--color-ink-black)]',
    badgeColor: 'bg-[var(--color-ink-red)] text-[var(--color-parchment-light)] border border-[var(--color-ink-red)]',
    icon: <svg viewBox="0 0 24 24" border="none" fill="currentColor" className="w-6 h-6 text-[var(--color-ink-red)]"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
    glow: '',
  },
  'scoring-point': {
    class: 'glass-panel border-[var(--color-gold)] shadow-[4px_4px_0px_0px_var(--color-gold)]',
    textColor: 'text-[var(--color-ink-black)]',
    badgeColor: 'bg-[var(--color-gold)] text-[var(--color-ink-black)] border border-[var(--color-gold)]',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" strokeLinejoin="miter" className="w-6 h-6 text-[var(--color-gold)]"><path d="M2 4l3 16h14l3-16-6 5-4-7-4 7z"/></svg>,
    glow: '',
  },
  'opponent-point': {
    class: 'glass-panel border-[var(--color-ink-red)] shadow-[4px_4px_0px_0px_var(--color-ink-red)]',
    textColor: 'text-[var(--color-ink-black)]',
    badgeColor: 'bg-[var(--color-ink-red)] text-[var(--color-parchment-light)] border border-[var(--color-ink-red)]',
    icon: <svg viewBox="0 0 24 24" fill="currentColor" border="none" className="w-6 h-6 text-[var(--color-ink-red)]"><path d="M12 2C7.58 2 4 5.58 4 10c0 2.37 1.05 4.5 2.7 5.96.48.42.75 1.03.75 1.67V20c0 1.1.9 2 2 2h5c1.1 0 2-.9 2-2v-2.37c0-.64.27-1.25.75-1.67C18.95 14.5 20 12.37 20 10c0-4.42-3.58-8-8-8zm-2 12H8v-2h2v2zm4 0h-2v-2h2v2z"/></svg>,
    glow: '',
  },
};

function ActionNode({ data }) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const role = data.nodeRole || 'user-action';
  const config = roleConfig[role];

  const phaseKey = `phase_${data.phase}`;

  const roleLabelKey =
    role === 'user-action'
      ? 'node_user'
      : role === 'opponent-action'
        ? 'node_opponent'
        : role === 'opponent-point'
          ? 'node_opponent_point'
          : 'node_finisher';

  return (
    <div
      className={`
        action-node-wrap
        relative min-w-[300px] w-[340px]
        ${data.isSelector ? 'glass-panel border-dashed border-[4px] border-[var(--color-ink-red)] hover:bg-[var(--color-ink-red)]/10 cursor-pointer flex flex-col items-center justify-center p-8' : config.class}
        ${!data.isSelector && 'panel-interactive'}
        transition-all duration-300
        ${data.isActive ? 'ring-4 ring-[var(--color-gold)] shadow-[0_0_20px_var(--color-gold)] scale-[1.02]' : 'opacity-80 hover:opacity-100'}
      `}
    >
      {data.isSelector ? (
        <div className="text-center animate-pulse">
           <span className="text-5xl filter grayscale mb-3 block">⚔️</span>
           <h2 className="text-xl font-display font-bold text-[var(--color-ink-red)] uppercase tracking-[0.2em]">{t('btn_load') || "HAMLE SEÇ"}</h2>
           <p className="text-xs text-[var(--color-ink-black)]/70 uppercase tracking-widest mt-2">{t('wizard_you') || "Sıra Sende"}</p>
        </div>
      ) : (
        <>
          {/* Active Indicator Pin */}
      {data.isActive && (
        <div className="absolute -top-3 -right-3 z-20 animate-bounce">
          <span className="text-2xl drop-shadow-md">👇</span>
        </div>
      )}
      {/* Target handle (top) */}
      {data.step > 1 && (
        <Handle
          type="target"
          position={Position.Top}
          className="!w-4 !h-4 !rounded-none !bg-[var(--color-parchment)] !border-2 !border-[var(--color-ink-black)]" // Woodcut look
        />
      )}

      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-4 pb-2 border-b border-[var(--color-ink-faded)]">
        <span className="text-xl filter drop-shadow-none grayscale">{config.icon}</span>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-bold tracking-widest px-2 py-0.5 uppercase ${config.badgeColor}`}>
              {t(roleLabelKey)}
            </span>
            <span className="text-sm font-display text-[var(--color-ink-faded)] italic">
              Act. {data.step}
            </span>
          </div>
        </div>
      </div>

      {/* Move Name */}
      <div className="px-4 py-3">
        <h3 className={`text-xl font-bold font-display ${config.textColor}`}>
          {data.nameKey ? (
            <>
              <span className="drop-cap">{t(data.nameKey)[0]}</span>
              {t(data.nameKey).slice(1)}
            </>
          ) : null}
        </h3>
        {(() => {
          // Derive hint_* key from move_* nameKey to show a brief localized description
          // under the original HEMA term (e.g. Oberhau → "Descending cut from high guard").
          if (!data.nameKey || !data.nameKey.startsWith('move_')) return null;
          const hintKey = 'hint_' + data.nameKey.slice('move_'.length);
          const hint = t(hintKey);
          if (!hint || hint === hintKey) return null;
          return (
            <p className="mt-1 text-[11px] md:text-xs italic font-body text-[var(--color-ink-faded)] leading-snug">
              {hint}
            </p>
          );
        })()}
      </div>

      {/* Tactical breakdown — answers the 4 questions: meeting / bind / forte-weak / execution */}
      {/* Prefer data.descKey (AI-picked clean/sloppy variant) over the static move default. */}
      {(() => {
        const breakdownKey = data.descKey || (data.moveId && getMoveById(data.moveId)?.descKey);
        return breakdownKey ? (
          <div className="px-4 pb-3">
            <p className="text-[12px] md:text-[13px] font-body text-[var(--color-ink-black)] leading-relaxed whitespace-pre-line">
              {t(breakdownKey)}
            </p>
          </div>
        ) : null;
      })()}

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5 px-5 pb-5">
        <span className="text-xs px-2 py-0.5 bg-[var(--color-parchment-dark)] text-[var(--color-ink-black)] font-bold uppercase tracking-wider border-2 border-[var(--color-ink-black)] shadow-[2px_2px_0_0_rgba(0,0,0,0.1)]">
          {t(phaseKey)}
        </span>
        {data.tags?.map((tag) => (
          <span
            key={tag}
            className="text-xs px-2 py-0.5 text-[var(--color-ink-black)] bg-[var(--color-parchment)] font-bold uppercase tracking-widest border-2 border-[var(--color-ink-black)] shadow-[2px_2px_0_0_rgba(0,0,0,0.1)]"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Manuscript Note Toggle */}
      {data.moveId && getManuscriptKey(data.moveId) && (
        <div className="border-t-[3px] border-[var(--color-ink-black)] bg-[var(--color-parchment-light)] rounded-b-sm">
          {!isExpanded ? (
            <button 
              onClick={() => setIsExpanded(true)}
              className="w-full py-3 text-[11px] uppercase tracking-widest font-bold text-[var(--color-ink-black)] flex justify-center items-center gap-2 transition-colors outline-none focus:outline-none bg-[var(--color-parchment-dark)] hover:bg-[var(--color-ink-red)] hover:text-white"
            >
              <span>{t('tactics_note') || 'Daha Fazla'}</span> <span className="text-[10px]">▼</span>
            </button>
          ) : (
            <div className="p-5 animate-fade-in relative bg-[var(--color-parchment-light)] shadow-[inset_0_4px_8px_rgba(0,0,0,0.05)] border-b-4 border-l-4 border-r-4 border-transparent">
              <button 
                onClick={() => setIsExpanded(false)}
                className="absolute top-2 right-3 w-8 h-8 flex items-center justify-center text-[var(--color-ink-black)] hover:text-white hover:bg-[var(--color-ink-red)] border-2 border-transparent hover:border-[var(--color-ink-black)] font-bold text-sm transition-all"
              >
                ▲
              </button>
              <div className="text-[10px] text-[var(--color-ink-red)] uppercase font-display font-bold tracking-widest mb-2 flex items-center gap-1.5 border-b-2 border-dashed border-[var(--color-ink-red)] pb-1 w-max">
                📜 {t('tactics_note')}
              </div>
              <p className="font-body font-medium text-[13px] md:text-sm text-[var(--color-ink-black)] leading-relaxed mt-2 pr-4">
                "{t(getManuscriptKey(data.moveId))}"
              </p>
            </div>
          )}
        </div>
      )}

      {/* Scoring point indicator */}
      {(role === 'scoring-point' || role === 'opponent-point') && (
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 translate-y-full pb-2 z-10 w-[200px] flex justify-center">
          <div className={`mt-2 px-5 py-2 text-sm font-display font-bold uppercase tracking-widest text-center shadow-[2px_2px_0px_0px_var(--color-ink-black)] border border-[var(--color-ink-black)]
            ${role === 'scoring-point' ? 'bg-[var(--color-gold)] text-[var(--color-ink-black)]' : 'bg-[var(--color-ink-red)] text-[var(--color-parchment-light)]'}
          `}>
            {role === 'scoring-point' ? "Finis Coronat Opus" : "Mors Certa"}
          </div>
        </div>
      )}
      </>
      )}

      {/* Source handle (bottom) */}
      {(role !== 'scoring-point' && role !== 'opponent-point') && (
        <Handle
          type="source"
          position={Position.Bottom}
          className="!w-4 !h-4 !rounded-none !bg-[var(--color-parchment)] !border-2 !border-[var(--color-ink-black)]"
        />
      )}
    </div>
  );
}

export default memo(ActionNode);
