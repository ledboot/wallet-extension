import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

import { translations } from '@/ui/locales/translations';
import { settingsStore } from '@/ui/state/settings';

type Language = 'zh' | 'en' | 'ja' | 'ko';

interface LanguageContextType {
  currentLanguage: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [currentLanguage, setCurrentLanguage] = useState<Language>(() => {
    return (settingsStore.getState().locale as Language) || 'zh';
  });

  useEffect(() => {
    const unsubscribe = settingsStore.subscribe((state) => {
      if (state.locale) {
        setCurrentLanguage(state.locale as Language);
      }
    });
    return unsubscribe;
  }, []);

  const setLanguage = (lang: Language) => {
    setCurrentLanguage(lang);
    settingsStore.getState().updateSettings({ locale: lang });
  };

  const t = (key: string): string => {
    const keys = key.split('.');
    let value: any = translations[currentLanguage];

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        value = translations.zh;
        for (const fallbackKey of keys) {
          if (value && typeof value === 'object' && fallbackKey in value) {
            value = value[fallbackKey];
          } else {
            return key;
          }
        }
        break;
      }
    }

    return typeof value === 'string' ? value : key;
  };

  return <LanguageContext.Provider value={{ currentLanguage, setLanguage, t }}>{children}</LanguageContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
