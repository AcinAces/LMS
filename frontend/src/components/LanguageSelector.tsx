'use client';

import { useState, useRef, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { setLocaleCookie } from '@/app/actions/locale';
import { useLanguage } from '@/i18n/LanguageContext';

export default function LanguageSelector() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { locale } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when tapping/clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  const handleLanguageChange = (newLocale: string) => {
    setIsOpen(false);
    if (newLocale === locale) return;
    
    startTransition(async () => {
      await setLocaleCookie(newLocale);
      router.refresh();
    });
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button 
        type="button"
        disabled={isPending}
        onClick={() => setIsOpen(!isOpen)}
        className="cursor-pointer flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium rounded-xl text-slate-200 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-700/80 hover:border-emerald-500/40 transition-all shadow-sm active:scale-95 disabled:opacity-50"
        aria-expanded={isOpen}
        aria-haspopup="true"
        title="Change Language"
      >
        <span>{locale === 'en' ? '🇺🇸 EN' : '🇧🇩 বাং'}</span>
        <svg 
          className={`w-3.5 h-3.5 opacity-70 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-36 bg-slate-900/95 border border-white/15 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl animate-fade-in-up z-50 py-1.5">
          <button
            type="button"
            onClick={() => handleLanguageChange('en')}
            className={`w-full text-left px-3.5 py-2 text-xs sm:text-sm font-medium transition-colors hover:bg-white/10 flex items-center justify-between cursor-pointer ${
              locale === 'en' ? 'text-emerald-400 font-bold bg-emerald-500/10' : 'text-slate-200'
            }`}
          >
            <span className="flex items-center gap-2">
              <span>🇺🇸</span>
              <span>English</span>
            </span>
            {locale === 'en' && <span className="text-emerald-400 text-xs">✓</span>}
          </button>

          <button
            type="button"
            onClick={() => handleLanguageChange('bn')}
            className={`w-full text-left px-3.5 py-2 text-xs sm:text-sm font-medium transition-colors hover:bg-white/10 flex items-center justify-between cursor-pointer ${
              locale === 'bn' ? 'text-emerald-400 font-bold bg-emerald-500/10' : 'text-slate-200'
            }`}
          >
            <span className="flex items-center gap-2">
              <span>🇧🇩</span>
              <span>বাংলা</span>
            </span>
            {locale === 'bn' && <span className="text-emerald-400 text-xs">✓</span>}
          </button>
        </div>
      )}
    </div>
  );
}
