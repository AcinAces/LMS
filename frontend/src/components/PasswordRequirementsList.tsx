'use client';

import React from 'react';
import { checkPasswordRequirements } from '@/utils/password';
import { useLanguage } from '@/i18n/LanguageContext';

interface PasswordRequirementsListProps {
  password: string;
  className?: string;
  showAlways?: boolean;
}

export default function PasswordRequirementsList({
  password,
  className = '',
  showAlways = false,
}: PasswordRequirementsListProps) {
  const { t } = useLanguage();
  const reqs = checkPasswordRequirements(password);
  const hasTyped = (password || '').length > 0;

  if (!showAlways && !hasTyped) {
    return null;
  }

  const satisfiedCount = 
    (reqs.minLength ? 1 : 0) +
    (reqs.hasUppercase ? 1 : 0) +
    (reqs.hasLowercase ? 1 : 0) +
    (reqs.hasSpecialChar ? 1 : 0);

  const strengthColor = 
    satisfiedCount === 4 
      ? 'bg-emerald-500' 
      : satisfiedCount === 3 
        ? 'bg-cyan-500' 
        : satisfiedCount >= 1 
          ? 'bg-amber-500' 
          : 'bg-slate-700';

  const strengthText = 
    satisfiedCount === 4 
      ? t('password_reqs.strong') 
      : satisfiedCount === 3 
        ? t('password_reqs.good') 
        : satisfiedCount >= 1 
          ? t('password_reqs.weak') 
          : t('password_reqs.required');

  return (
    <div className={`p-3.5 bg-slate-950/70 border border-white/10 rounded-2xl space-y-2.5 backdrop-blur-md transition-all ${className}`}>
      
      {/* Strength Bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[11px] font-mono">
          <span className="text-slate-400">{t('password_reqs.title')}</span>
          <span className={`font-bold ${
            satisfiedCount === 4 ? 'text-emerald-400' : satisfiedCount >= 2 ? 'text-amber-400' : 'text-rose-400'
          }`}>
            {t('password_reqs.fulfilled_summary', { count: satisfiedCount, strength: strengthText })}
          </span>
        </div>

        <div className="grid grid-cols-4 gap-1.5 h-1.5 w-full bg-slate-900 rounded-full overflow-hidden p-0.5 border border-white/5">
          <div className={`h-full rounded-full transition-all duration-300 ${satisfiedCount >= 1 ? strengthColor : 'bg-slate-800'}`} />
          <div className={`h-full rounded-full transition-all duration-300 ${satisfiedCount >= 2 ? strengthColor : 'bg-slate-800'}`} />
          <div className={`h-full rounded-full transition-all duration-300 ${satisfiedCount >= 3 ? strengthColor : 'bg-slate-800'}`} />
          <div className={`h-full rounded-full transition-all duration-300 ${satisfiedCount >= 4 ? strengthColor : 'bg-slate-800'}`} />
        </div>
      </div>

      {/* 4 Checklist Items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 text-xs">
        
        {/* Min Length */}
        <div className={`flex items-center gap-2 transition-colors ${reqs.minLength ? 'text-emerald-400' : 'text-slate-400'}`}>
          <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 border ${
            reqs.minLength ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-slate-900 border-white/10 text-slate-500'
          }`}>
            {reqs.minLength ? '✓' : '•'}
          </span>
          <span className="text-[11px]">{t('password_reqs.min_length')}</span>
        </div>

        {/* Sign / Special Character */}
        <div className={`flex items-center gap-2 transition-colors ${reqs.hasSpecialChar ? 'text-emerald-400' : 'text-slate-400'}`}>
          <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 border ${
            reqs.hasSpecialChar ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-slate-900 border-white/10 text-slate-500'
          }`}>
            {reqs.hasSpecialChar ? '✓' : '•'}
          </span>
          <span className="text-[11px]">{t('password_reqs.has_sign')}</span>
        </div>

        {/* Uppercase */}
        <div className={`flex items-center gap-2 transition-colors ${reqs.hasUppercase ? 'text-emerald-400' : 'text-slate-400'}`}>
          <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 border ${
            reqs.hasUppercase ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-slate-900 border-white/10 text-slate-500'
          }`}>
            {reqs.hasUppercase ? '✓' : '•'}
          </span>
          <span className="text-[11px]">{t('password_reqs.has_uppercase')}</span>
        </div>

        {/* Lowercase */}
        <div className={`flex items-center gap-2 transition-colors ${reqs.hasLowercase ? 'text-emerald-400' : 'text-slate-400'}`}>
          <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 border ${
            reqs.hasLowercase ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-slate-900 border-white/10 text-slate-500'
          }`}>
            {reqs.hasLowercase ? '✓' : '•'}
          </span>
          <span className="text-[11px]">{t('password_reqs.has_lowercase')}</span>
        </div>

      </div>

    </div>
  );
}
