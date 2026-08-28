'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { setLocaleCookie } from '@/app/actions/locale';
import { useLanguage } from '@/i18n/LanguageContext';

export default function LanguageSelector() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { locale } = useLanguage();

  const handleLanguageChange = (newLocale: string) => {
    if (newLocale === locale) return;
    
    startTransition(async () => {
      await setLocaleCookie(newLocale);
      router.refresh();
    });
  };

  return (
    <div className="relative group">
      <button 
        disabled={isPending}
        className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors border border-slate-700/50"
      >
        <span>{locale === 'en' ? '🇺🇸 EN' : '🇧🇩 বাং'}</span>
        <svg className="w-4 h-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
      </button>
      
      {/* Dropdown */}
      <div className="absolute right-0 mt-2 w-32 bg-slate-900 border border-white/10 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
        <div className="py-1">
          <button
            onClick={() => handleLanguageChange('en')}
            className={`w-full text-left px-4 py-2 text-sm transition-colors hover:bg-white/10 ${locale === 'en' ? 'text-emerald-400 font-bold' : 'text-slate-300'}`}
          >
            🇺🇸 English
          </button>
          <button
            onClick={() => handleLanguageChange('bn')}
            className={`w-full text-left px-4 py-2 text-sm transition-colors hover:bg-white/10 ${locale === 'bn' ? 'text-emerald-400 font-bold' : 'text-slate-300'}`}
          >
            🇧🇩 বাংলা
          </button>
        </div>
      </div>
    </div>
  );
}
