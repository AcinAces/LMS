'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/i18n/LanguageContext';

export default function HeroGreeting() {
  const { dict, locale, t } = useLanguage();
  const [currentUser, setCurrentUser] = useState<{ username: string } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const userStr = localStorage.getItem('user');
    const jwt = localStorage.getItem('jwt');
    if (userStr && jwt) {
      try {
        const user = JSON.parse(userStr);
        if (user?.username) {
          setCurrentUser(user);
        }
      } catch (e) {}
    }
  }, []);

  const isAuthorized = mounted && !!currentUser;

  return (
    <>
      {isAuthorized ? (
        <div className="space-y-4 animate-fade-in-up w-full max-w-full">
          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-4 text-white leading-tight break-words">
            {t('home.welcome_back_title')}{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 inline-block">
              {currentUser.username}!
            </span>
          </h1>
          <p className="text-sm sm:text-lg md:text-2xl text-emerald-300/90 mb-8 max-w-2xl mx-auto font-medium tracking-wide px-2 break-words">
            {t('home.welcome_back_subtitle')}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full max-w-md sm:max-w-none mx-auto">
            <Link 
              href="/my-courses"
              className="group relative px-6 sm:px-8 py-3.5 sm:py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-base sm:text-lg transition-all transform hover:-translate-y-1 shadow-[0_0_40px_-10px_rgba(16,185,129,0.5)] w-full sm:w-auto overflow-hidden flex items-center justify-center gap-2"
            >
              <span>{t('home.my_courses_btn')}</span>
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
            <Link 
              href="/blogs" 
              className="group px-6 sm:px-8 py-3.5 sm:py-4 bg-slate-900/50 hover:bg-slate-800/80 text-white border border-white/10 rounded-xl font-semibold text-base sm:text-lg transition-all backdrop-blur-md hover:-translate-y-1 w-full sm:w-auto flex items-center justify-center gap-2"
            >
              {dict.home.read_blogs_btn}
              <svg className="w-5 h-5 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
              </svg>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4 animate-fade-in-up w-full max-w-full">
          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 text-white leading-tight break-words">
            {locale === 'en' ? (
              <>
                {dict.home.title_part1}{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-500">
                  {dict.home.title_highlight}
                </span>{' '}
                <br className="hidden sm:inline" />
                {dict.home.title_part2}
              </>
            ) : (
              <>
                {dict.home.title_part1}
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-500">
                  {dict.home.title_highlight}
                </span>
                <br />
                {dict.home.title_part2}
              </>
            )}
          </h1>
          
          <p className="text-sm sm:text-lg md:text-xl text-slate-300 mb-8 max-w-2xl mx-auto font-light leading-relaxed px-2 break-words">
            {dict.home.subtitle}
          </p>
        
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full max-w-md sm:max-w-none mx-auto">
            <a 
              href="#featured-courses" 
              className="group relative px-6 sm:px-8 py-3.5 sm:py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-base sm:text-lg transition-all transform hover:-translate-y-1 shadow-[0_0_40px_-10px_rgba(16,185,129,0.5)] w-full sm:w-auto overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-2 justify-center">
                {dict.home.featured_courses_btn}
                <svg className="w-5 h-5 group-hover:translate-y-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </span>
            </a>
            <Link 
              href="/blogs" 
              className="group px-6 sm:px-8 py-3.5 sm:py-4 bg-slate-900/50 hover:bg-slate-800/80 text-white border border-white/10 rounded-xl font-semibold text-base sm:text-lg transition-all backdrop-blur-md hover:-translate-y-1 w-full sm:w-auto flex items-center justify-center gap-2"
            >
              {dict.home.read_blogs_btn}
              <svg className="w-5 h-5 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
              </svg>
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
