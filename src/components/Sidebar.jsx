import { useState, useEffect } from 'react';
import { useTranslation } from '../i18n/LanguageContext';
import { historicalCombos } from '../data/historicalCombos';
import { storageService } from '../services/storageService';

export default function Sidebar({ currentNodes, currentEdges, onLoadCombo }) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('my-combos');
  const [savedCombos, setSavedCombos] = useState([]);
  const [comboName, setComboName] = useState('');
  const [toast, setToast] = useState(null);
  const [isOpen, setIsOpen] = useState(false); // Mobile drawer state
  const [expandedTacticsId, setExpandedTacticsId] = useState(null);
  const [isSaveExpanded, setIsSaveExpanded] = useState(false);

  useEffect(() => {
    storageService.getCombos().then(combos => {
      setSavedCombos(combos || []);
    });
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 2500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (msg) => setToast(msg);

  const handleSave = () => {
    if (!comboName.trim() || !currentNodes || currentNodes.length === 0) return;
    const combo = {
      id: `combo-${Date.now()}`,
      name: comboName.trim(),
      nodes: currentNodes,
      edges: currentEdges,
      date: new Date().toISOString()
    };
    
    storageService.saveCombo(combo).then(() => {
      setSavedCombos([...savedCombos, combo]);
      setComboName('');
      setIsSaveExpanded(false);
      showToast(t('toast_combo_saved')?.replace('{name}', combo.name) || `${combo.name} saved!`);
    });
  };

  const handleLoad = (combo) => {
    onLoadCombo(combo.nodes, combo.edges);
    showToast(t('combo_loaded'));
    setIsOpen(false);
  };

  const handleDelete = (id) => {
    storageService.deleteCombo(id).then(() => {
      setSavedCombos(savedCombos.filter(c => c.id !== id));
      showToast(t('toast_combo_deleted'));
    });
  };

  const handleLoadHistorical = (combo) => {
    onLoadCombo(combo.nodes, combo.edges);
    showToast(t('combo_loaded'));
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Toggle Bookmark Ribbon */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-0 left-4 z-[70] bg-[var(--color-ink-red)] text-[var(--color-parchment-light)] border-2 border-t-0 border-[var(--color-ink-black)] px-3 pt-6 pb-4 w-12 text-center shadow-[4px_4px_0_0_var(--color-ink-black)]"
        style={{
          clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 50% 85%, 0% 100%)'
        }}
      >
        <span className="text-xl -translate-y-2 block">📖</span>
      </button>

      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          className="md:hidden fixed inset-0 bg-[var(--color-ink-black)]/70 z-[60] backdrop-blur-sm"
        />
      )}

      {/* Sidebar Container */}
      <div className={`
        fixed md:relative top-0 left-0 h-full w-[85%] max-w-[340px] md:w-[340px] z-[70] md:z-10
        bg-[var(--color-parchment)] border-r-[3px] border-[var(--color-ink-black)] 
        flex flex-col overflow-hidden shadow-[8px_0_0_0_rgba(42,37,34,0.1)]
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Toast */}
        {toast && (
          <div className="absolute top-3 left-3 right-3 z-50 bg-[var(--color-parchment-light)] border-[2px] border-[var(--color-ink-black)] text-[var(--color-ink-red)] font-display text-sm font-bold px-3 py-2.5 shadow-[4px_4px_0_0_var(--color-ink-black)] text-center animate-fade-in">
            {toast}
          </div>
        )}

        {/* Header */}
        <div className="px-4 py-5 border-b-[2px] border-[var(--color-ink-black)] bg-[var(--color-parchment-dark)]">
          <div className="flex items-start justify-between mb-1">
            <div className="flex items-center gap-3">
              <span className="text-4xl filter grayscale opacity-90 drop-shadow-md">📖</span>
              <div>
                <h1 className="text-lg md:text-xl font-bold text-[var(--color-ink-red)] leading-tight font-display drop-cap">
                  {t('app_title')}
                </h1>
                <p className="hidden md:block text-[11px] text-[var(--color-ink-black)] uppercase tracking-widest font-bold mt-1">
                  {t('app_subtitle')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b-[2px] border-[var(--color-ink-black)] bg-[var(--color-parchment-dark)]">
          <button
            onClick={() => setActiveTab('my-combos')}
            className={`flex-1 py-4 text-xs font-bold font-display uppercase tracking-widest transition-all
              ${activeTab === 'my-combos' ? 'bg-[var(--color-parchment)] text-[var(--color-ink-red)] border-b-0 border-r-[2px] border-r-transparent shadow-[inset_0_-4px_0_0_var(--color-ink-red)]' : 'text-[var(--color-ink-black)] hover:bg-[var(--color-parchment)]/50 border-r-[2px] border-r-[var(--color-ink-black)] opacity-70'}
            `}
          >
            {t('tab_my_combos')}
          </button>
          <button
            onClick={() => setActiveTab('historical')}
            className={`flex-1 py-4 text-xs font-bold font-display uppercase tracking-widest transition-all
              ${activeTab === 'historical' ? 'bg-[var(--color-parchment)] text-[var(--color-ink-red)] border-b-0 border-l-[2px] border-l-transparent shadow-[inset_0_-4px_0_0_var(--color-ink-red)]' : 'text-[var(--color-ink-black)] hover:bg-[var(--color-parchment)]/50 border-l-[2px] border-l-[var(--color-ink-black)] opacity-70'}
            `}
          >
            {t('tab_historical')}
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto scrollbar-thin p-4 md:p-5 bg-[var(--color-parchment)]">
          {activeTab === 'my-combos' && (
            <div className="animate-fade-in flex flex-col h-full gap-5">
              {/* Save Section Accordion */}
              <div className="bg-[var(--color-parchment-light)] border-[2px] border-[var(--color-ink-black)] shadow-[4px_4px_0_0_var(--color-ink-black)]">
                <button 
                  onClick={() => setIsSaveExpanded(!isSaveExpanded)}
                  className="w-full text-left px-4 py-4 flex justify-between items-center transition-colors hover:bg-[var(--color-parchment-dark)] focus:outline-none"
                >
                  <h3 className="text-[11px] text-[var(--color-ink-red)] uppercase font-bold tracking-widest font-display flex items-center gap-2">
                     <span className="text-xl leading-none -mt-1">🔖</span> {t('save_combo')}
                  </h3>
                  <span className="text-xs opacity-70 text-[var(--color-ink-red)] font-bold">{isSaveExpanded ? '▼' : '▶'}</span>
                </button>
                {isSaveExpanded && (
                  <div className="px-4 pb-4 border-t-2 border-dashed border-[var(--color-ink-faded)] pt-3 animate-fade-in">
                    <input
                      type="text"
                      placeholder={t('save_combo_placeholder')}
                      value={comboName}
                      onChange={(e) => setComboName(e.target.value)}
                      className="w-full bg-[var(--color-parchment)] border-[2px] border-[var(--color-ink-black)] px-3 py-3 text-sm text-[var(--color-ink-black)] font-body font-bold mb-3 focus:outline-none focus:border-[var(--color-ink-red)] shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] placeholder:text-[var(--color-ink-faded)] placeholder:italic"
                    />
                    <button
                      onClick={handleSave}
                      disabled={!comboName.trim() || !currentNodes || currentNodes.length === 0}
                      className="w-full py-3 bg-[var(--color-ink-black)] text-[var(--color-gold)] font-bold text-xs uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed border-[2px] border-transparent active:border-[var(--color-ink-black)] active:bg-[var(--color-parchment)] active:text-[var(--color-ink-black)] transition-all shadow-[inset_0_0_0_1px_var(--color-parchment-light)]"
                    >
                      {t('save_btn')}
                    </button>
                  </div>
                )}
              </div>

              {/* Saved List */}
              <div className="flex-1">
                <h3 className="text-[12px] text-[var(--color-ink-black)] uppercase font-bold tracking-widest mb-3 pb-2 font-display">
                  {t('saved_combos')}
                </h3>
                {savedCombos.length === 0 ? (
                  <p className="text-sm text-[var(--color-ink-faded)] text-center py-6 italic font-body">
                    {t('no_saved_combos')}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {savedCombos.map((combo) => (
                      <div key={combo.id} className="bg-[var(--color-parchment-light)] border border-[var(--color-ink-black)] p-3 shadow-[2px_2px_0_0_var(--color-ink-faded)] group hover:shadow-[4px_4px_0_0_var(--color-ink-black)] hover:-translate-y-0.5 transition-all">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-bold font-display text-[var(--color-ink-black)] truncate pr-2">
                            {combo.name}
                          </span>
                          <span className="text-[10px] bg-[var(--color-parchment-dark)] text-[var(--color-ink-black)] px-1.5 border border-[var(--color-ink-black)]">
                            {t('steps_count').replace('{count}', combo.nodes.length)}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleLoad(combo)}
                            className="flex-1 py-1.5 bg-[var(--color-ink-black)] text-[var(--color-parchment-light)] text-[10px] font-bold uppercase tracking-wider hover:bg-[var(--color-ink-red)] transition-colors border border-[var(--color-ink-black)]"
                          >
                            {t('btn_load')}
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(combo.id); }}
                            className="px-3 py-1.5 bg-[var(--color-parchment)] text-[var(--color-ink-red)] border-[2px] border-[var(--color-ink-red)] text-[10px] font-bold uppercase hover:bg-[var(--color-ink-red)] hover:text-white transition-colors"
                          >
                            {t('delete_combo')}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'historical' && (
            <div className="animate-fade-in">
              <h3 className="text-[12px] text-[var(--color-ink-black)] uppercase font-bold tracking-widest mb-4 pb-2 font-display">
                {t('historical_masters')}
              </h3>
              <div className="space-y-5">
                {historicalCombos.map((combo) => (
                  <div key={combo.id} className="bg-[var(--color-parchment-light)] border-[2px] border-[var(--color-ink-black)] p-4 shadow-[4px_4px_0_0_var(--color-ink-black)] group">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="text-[10px] text-[var(--color-ink-red)] font-bold uppercase mb-1 font-display">
                          {t('master_label')}: {combo.master} ({t('tradition_' + combo.tradition) || combo.tradition})
                        </div>
                        <h4 className="font-bold text-[var(--color-ink-black)] text-base font-display">
                          {t(combo.nameKey)}
                        </h4>
                      </div>
                    </div>
                    <p className="text-xs text-[var(--color-ink-black)]/80 mb-4 line-clamp-3 leading-relaxed font-body italic">
                      "{t(combo.descKey) || combo.desc}"
                    </p>

                    {/* Expandable Tactics Booklet */}
                    {expandedTacticsId === combo.id && (
                      <div className="mb-4 animate-fade-in border-t border-dashed border-[var(--color-ink-faded)] pt-3 pb-2 flex flex-col gap-3">
                         <div className="bg-[var(--color-parchment-dark)] p-3 border-l-2 border-[var(--color-ink-black)] shadow-[inset_0_0_10px_rgba(42,37,34,0.05)]">
                           <h5 className="font-display font-bold text-[10px] uppercase text-[var(--color-ink-black)] mb-2 flex items-center gap-1">📜 {t('historical_analysis')}</h5>
                           <p className="text-[12px] leading-relaxed text-justify font-body text-[var(--color-ink-black)]">{t(combo.historicalMetaKey)}</p>
                         </div>
                         <div className="bg-[var(--color-ink-black)] p-3 border-l-2 border-[var(--color-ink-red)] shadow-[2px_2px_0px_0px_var(--color-ink-red)]">
                           <h5 className="font-display font-bold text-[10px] uppercase text-[var(--color-gold)] mb-2 flex items-center gap-1">⚔️ {t('modern_notes')}</h5>
                           <p className="text-[12px] leading-relaxed text-justify font-body text-[var(--color-parchment-light)] opacity-90">{t(combo.swordfishMetaKey)}</p>
                         </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                       <button
                         onClick={() => handleLoadHistorical(combo)}
                         className="flex-1 py-3 bg-[var(--color-ink-black)] text-[var(--color-parchment-light)] border-[2px] border-[var(--color-ink-black)] font-bold text-[10px] uppercase tracking-widest hover:text-[var(--color-gold)] transition-colors shadow-[2px_2px_0_0_var(--color-ink-red)] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none"
                       >
                         {t('btn_load_historical')}
                       </button>
                       <button
                         onClick={() => setExpandedTacticsId(expandedTacticsId === combo.id ? null : combo.id)}
                         className={`px-3 py-3 border-[2px] transition-colors font-display font-bold text-[10px] uppercase min-w-[44px] flex items-center justify-center ${expandedTacticsId === combo.id ? 'bg-[var(--color-ink-red)] text-white border-[var(--color-ink-red)] shadow-none' : 'bg-[var(--color-parchment-light)] text-[var(--color-ink-red)] border-[var(--color-ink-red)] shadow-[2px_2px_0_0_var(--color-ink-red)] hover:bg-[var(--color-ink-red)] hover:text-white'}`}
                       >
                         {t('tactics_note')}
                       </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
