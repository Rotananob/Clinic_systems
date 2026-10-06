'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { en } from '../locales/en';
import { km } from '../locales/km';

type Locale = 'en' | 'km';
type Translations = typeof en;

interface I18nContextType {
  locale: Locale;
  setLocale: (loc: Locale) => void;
  toggleLocale: () => void;
  t: Translations;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<Locale>('en');

  useEffect(() => {
    // Read user saved language preference
    const saved = localStorage.getItem('clinic_language') as Locale | null;
    if (saved && (saved === 'en' || saved === 'km')) {
      setLocaleState(saved);
      document.documentElement.lang = saved;
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('clinic_language', newLocale);
    document.documentElement.lang = newLocale;
  };

  const toggleLocale = () => {
    const next = locale === 'en' ? 'km' : 'en';
    setLocale(next);
  };

  const translations = locale === 'km' ? km : en;

  return (
    <I18nContext.Provider
      value={{
        locale,
        setLocale,
        toggleLocale,
        t: translations,
      }}
    >
      {children}
    </I18nContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
};

export const useI18n = useTranslation;
