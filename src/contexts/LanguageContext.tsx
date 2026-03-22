import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '@/translations';
import i18n from '@/i18n';

type LanguageCode = 'en' | 'hi' | 'bn' | 'pa' | 'ml' | 'kn';

type LanguageContextType = {
  currentLanguage: LanguageCode;
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: string) => string;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [currentLanguage, setCurrentLanguage] = useState<LanguageCode>(() => {
    return (localStorage.getItem('medmate_language') as LanguageCode) || 'en';
  });

  useEffect(() => {
    localStorage.setItem('medmate_language', currentLanguage);
    // Sync i18next with our language selection
    i18n.changeLanguage(currentLanguage);
  }, [currentLanguage]);

  // On mount, sync i18next with saved language
  useEffect(() => {
    i18n.changeLanguage(currentLanguage);
  }, []);

  const t = (key: string): string => {
    const langDict = translations[currentLanguage];
    if (langDict && langDict[key]) return langDict[key];
    const enDict = translations['en'];
    if (enDict && enDict[key]) return enDict[key];
    return key;
  };

  const setLanguage = (lang: LanguageCode) => {
    setCurrentLanguage(lang);
  };

  return (
    <LanguageContext.Provider value={{ 
      currentLanguage, 
      language: currentLanguage,
      setLanguage, 
      t 
    }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
