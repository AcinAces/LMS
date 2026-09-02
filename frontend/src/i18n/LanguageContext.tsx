'use client';

import React, { createContext, useContext, ReactNode } from 'react';

type Dictionary = any;

interface LanguageContextProps {
  locale: string;
  dict: Dictionary;
  t: (key: string, params?: Record<string, string | number>) => string;
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
  // Simple nested key resolver (e.g., 'nav.courses') with placeholder interpolation
  const t = (key: string, params?: Record<string, string | number>): string => {
    const keys = key.split('.');
    let value = dict;
    for (const k of keys) {
      if (value === undefined || value === null) return key;
      value = value[k];
    }
    if (typeof value !== 'string') return key;
    if (params) {
      return Object.entries(params).reduce((acc, [pKey, pVal]) => {
        return acc.replace(new RegExp(`\\{${pKey}\\}`, 'g'), String(pVal));
      }, value);
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
