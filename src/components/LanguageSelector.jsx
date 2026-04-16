import { useTranslation } from '../i18n/LanguageContext';

export default function LanguageSelector() {
  const { lang, setLang, languageLabels, languages } = useTranslation();

  return (
    <div className="flex bg-[var(--color-parchment-light)] border-[2px] border-[var(--color-ink-black)] font-display shadow-[2px_2px_0_0_var(--color-ink-black)] p-0.5 group hover:shadow-[4px_4px_0_0_var(--color-ink-black)] transition-all">
      {languages.map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={`px-2 py-1 text-[10px] font-bold uppercase tracking-widest transition-all
            ${lang === l 
              ? 'bg-[var(--color-ink-black)] text-[var(--color-parchment-light)] border border-[var(--color-ink-black)]' 
              : 'text-[var(--color-ink-faded)] hover:text-[var(--color-ink-red)] hover:bg-[var(--color-parchment)] border border-transparent'}
          `}
          title={languageLabels[l].native}
        >
          {languageLabels[l].short}
        </button>
      ))}
    </div>
  );
}
