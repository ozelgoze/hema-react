import { createContext, useContext, useState, useEffect } from 'react';
import en from './en';
import tr from './tr';
import de from './de';
import it from './it';

const translations = { en, tr, de, it };

const languageLabels = {
  en: '🇬🇧 English',
  tr: '🇹🇷 Türkçe',
  de: '🇩🇪 Deutsch',
  it: '🇮🇹 Italiano',
};

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('hema-lang') || 'en';
  });

  useEffect(() => {
    localStorage.setItem('hema-lang', lang);
  }, [lang]);

  const t = (key) => translations[lang]?.[key] || translations.en[key] || key;

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, languageLabels, languages: Object.keys(translations) }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useTranslation must be used within LanguageProvider');
  return ctx;
}
