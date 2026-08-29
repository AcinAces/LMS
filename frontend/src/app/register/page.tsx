'use client';
import { useLanguage } from '@/i18n/LanguageContext';
import { useToast } from '@/context/ToastContext';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import AnimatedBackground from '@/components/AnimatedBackground';
import { useRouter } from 'next/navigation';
import PasswordRequirementsList from '@/components/PasswordRequirementsList';
import { checkPasswordRequirements } from '@/utils/password';

export default function RegisterPage() {
  const { t } = useLanguage();
  const toast = useToast();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMode, setSuccessMode] = useState(false);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    // If already logged in and session is valid, redirect to home
    const jwt = localStorage.getItem('jwt');
    if (jwt) {
      router.push('/');
    }
  }, [router]);

  // Success Countdown
  useEffect(() => {
    if (successMode && countdown > 0) {
      const timer = setTimeout(() => setCountdown(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    } else if (successMode && countdown === 0) {
      router.push('/login');
    }
  }, [successMode, countdown, router]);

  // Username validation state
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Debounced live username check
  useEffect(() => {
    if (!username.trim()) {
      setUsernameStatus('idle');
      setSuggestions([]);
      return;
    }

    setUsernameStatus('checking');
    
    const delayDebounceFn = setTimeout(async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/check-username`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: username.trim() }),
        });
        
        if (!res.ok) {
          setUsernameStatus('available');
          setSuggestions([]);
          return;
        }

        const data = await res.json();
        
        if (data.available === true) {
          setUsernameStatus('available');
          setSuggestions([]);
        } else if (data.available === false) {
          setUsernameStatus('taken');
          const base = username.trim();
          setSuggestions([`${base}01`, `${base}1999`, `${base}2024`]);
        }
      } catch (err) {
        setUsernameStatus('idle');
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [username]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const reqs = checkPasswordRequirements(password);
    if (!reqs.isValid) {
      let msg = 'Password requirements are not fulfilled.';
      if (!reqs.minLength) {
        msg = 'Password must be at least 12 characters long.';
      } else if (!reqs.hasUppercase) {
        msg = 'Password must contain at least 1 uppercase letter (A-Z).';
      } else if (!reqs.hasLowercase) {
        msg = 'Password must contain at least 1 lowercase letter (a-z).';
      } else if (!reqs.hasSpecialChar) {
        msg = 'Password must contain at least 1 sign or special character (!@#$%^&* etc.).';
      }
      setError(msg);
      toast.warning(msg);
      return;
    }

    if (password !== confirmPassword) {
      const msg = t('auth.passwords_dont_match') || "Passwords don't match";
      setError(msg);
      toast.warning(msg);
      return;
    }
    
    if (usernameStatus === 'taken') {
      const msg = t('auth.choose_available') || 'Please choose an available username';
      setError(msg);
      toast.warning(msg);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/auth/local/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: username.trim(),
          email: email.trim(), 
          password
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        let msg = data?.error?.message || "Registration failed.";
        if (data?.error?.message?.toLowerCase().includes('email') || data?.error?.message?.toLowerCase().includes('taken')) {
          setError('email_taken');
          msg = "Email or username is already in use.";
        } else {
          setError(msg);
        }
        toast.error(msg);
        setLoading(false);
        return;
      }

      // Success! Switch to success modal and toast
      toast.success('Account created successfully! Redirecting to login...', 'Registration Complete');
      setSuccessMode(true);

    } catch (err) {
      const msg = t('auth.unexpected_error') || 'An unexpected error occurred';
      setError(msg);
      toast.error(msg);
      setLoading(false);
    }
  };

  if (successMode) {
    return (
      <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center overflow-hidden py-12">
        <AnimatedBackground />
        
        <div className="relative z-10 w-full max-w-sm p-8 bg-black/60 backdrop-blur-xl border border-emerald-500/30 rounded-2xl shadow-2xl text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-emerald-500/20 rounded-full flex items-center justify-center border-2 border-emerald-500">
            <svg className="w-10 h-10 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">{t('auth.registration_success')}</h2>
          <p className="text-gray-300 mb-6">
            {t('auth.account_created')}
          </p>
          <div className="text-emerald-400 font-medium">
            {t('auth.redirecting')} <span className="text-2xl ml-2">{countdown}</span>...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center overflow-hidden py-12">
      <AnimatedBackground />
      
      <div className="relative z-10 w-full max-w-md p-8 bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl my-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 mb-2">
            Acin's LMS
          </h1>
          <p className="text-gray-400 text-sm">{t('auth.start_learning')}</p>
        </div>

        {error && error === 'email_taken' && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-center flex flex-col items-center gap-3">
            <span className="text-red-500 text-sm font-medium">{t('auth.email_taken')}</span>
            <Link 
              href="/login"
              className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-md text-white text-sm font-medium transition-colors flex items-center gap-2"
            >
              {t('auth.login_instead')}
            </Link>
          </div>
        )}

        {error && error !== 'email_taken' && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-5">
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-300">{t('auth.username')}</label>
              {usernameStatus === 'checking' && <span className="text-xs text-gray-400">{t('auth.checking')}</span>}
              {usernameStatus === 'available' && <span className="text-xs text-emerald-400">✓ {t('auth.available')}</span>}
              {usernameStatus === 'taken' && <span className="text-xs text-red-400">✗ {t('auth.not_available')}</span>}
            </div>
            <input 
              type="text" 
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={`w-full px-4 py-3 bg-white/5 border rounded-lg focus:outline-none focus:ring-2 text-white placeholder-gray-500 transition-colors ${
                usernameStatus === 'taken' 
                  ? 'border-red-500/50 focus:ring-red-500' 
                  : usernameStatus === 'available'
                  ? 'border-emerald-500/50 focus:ring-emerald-500'
                  : 'border-white/10 focus:ring-emerald-500'
              }`}
              placeholder="johndoe"
            />
            {usernameStatus === 'taken' && suggestions.length > 0 && (
              <div className="mt-2 text-sm text-gray-400">
                {t('auth.suggestions')}{' '}
                <div className="flex gap-2 mt-1 flex-wrap">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setUsername(s)}
                      className="px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-xs text-emerald-300 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">{t('auth.email')}</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-white placeholder-gray-500 transition-colors"
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">{t('auth.password')}</label>
            <div className="relative">
              <input 
                type={showPassword ? 'text' : 'password'} 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-4 pr-11 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-white placeholder-gray-500 transition-colors"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-white transition-colors cursor-pointer"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>

            {/* Live Password Checklist Requirements */}
            <PasswordRequirementsList password={password} showAlways={true} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">{t('auth.confirm_password')}</label>
            <div className="relative">
              <input 
                type={showConfirmPassword ? 'text' : 'password'} 
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-4 pr-11 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-white placeholder-gray-500 transition-colors"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-white transition-colors cursor-pointer"
                title={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading || usernameStatus === 'taken'}
            className="w-full py-3 mt-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-600/50 text-white rounded-lg font-semibold transition-all transform hover:scale-[1.02] active:scale-95 shadow-lg shadow-emerald-500/20 flex justify-center items-center"
          >
            {loading ? t('auth.creating_account') : t('auth.create_account')}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-400">
            {t('auth.has_account')}{' '}
            <Link href="/login" className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
              {t('auth.sign_in_link')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}



