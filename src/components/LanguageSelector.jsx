import { useTranslation } from '../i18n/LanguageContext';

export default function LanguageSelector() {
  const { lang, setLang, languageLabels, languages } = useTranslation();

  return (
    <div className="flex items-center gap-1.5 md:gap-2">
      {languages.map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={`w-7 h-7 flex items-center justify-center rounded-sm text-[10px] font-bold uppercase tracking-widest transition-all duration-200 border-[2px] shadow-[2px_2px_0_0_rgba(0,0,0,1)]
            ${lang === l 
              ? 'bg-[var(--color-ink-red)] text-white border-[var(--color-ink-red)] shadow-none translate-y-[2px] translate-x-[2px]' 
              : 'bg-[var(--color-parchment-light)] text-[var(--color-ink-black)] border-[var(--color-ink-black)] hover:bg-[var(--color-ink-black)] hover:text-[var(--color-parchment-light)]'}
          `}
          title={languageLabels[l]}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
