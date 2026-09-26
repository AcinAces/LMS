'use client';

import React, { createContext, useContext, ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { setLocaleCookie } from '@/app/actions/locale';

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
  const router = useRouter();

  // Sync with browser cache / session storage preference
  useEffect(() => {
    try {
      const stored = localStorage.getItem('preferred_locale') || sessionStorage.getItem('preferred_locale');
      if (stored && (stored === 'en' || stored === 'bn') && stored !== locale) {
        document.cookie = `NEXT_LOCALE=${stored}; path=/; max-age=31536000; SameSite=Lax`;
        setLocaleCookie(stored).then(() => {
          router.refresh();
        });
      } else if (!stored && locale) {
        localStorage.setItem('preferred_locale', locale);
        sessionStorage.setItem('preferred_locale', locale);
      }
    } catch (e) {
      // Storage may be disabled or restricted
    }
  }, [locale, router]);

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
