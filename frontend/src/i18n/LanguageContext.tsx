'use client';

import React, { createContext, useContext, ReactNode } from 'react';

type Dictionary = any;

interface LanguageContextProps {
  locale: string;
  dict: Dictionary;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextProps | null>(null);

export const LanguageProvider = ({
  children,
  locale,
  dict,
}: {
  children: ReactNode;
  locale: string;
  dict: Dictionary;
}) => {
  // Simple nested key resolver (e.g., 'nav.courses')
  const t = (key: string): string => {
    const keys = key.split('.');
    let value = dict;
    for (const k of keys) {
      if (value === undefined) return key;
      value = value[k];
    }
    return value || key;
  };

  return (
    <LanguageContext.Provider value={{ locale, dict, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
