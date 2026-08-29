'use client';
import { useLanguage } from '@/i18n/LanguageContext';
import { useToast } from '@/context/ToastContext';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AnimatedBackground from '@/components/AnimatedBackground';

export default function LoginPage() {
  const { t } = useLanguage();
  const toast = useToast();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If already logged in and session is valid, redirect based on role
    const jwt = localStorage.getItem('jwt');
    const userStr = localStorage.getItem('user');
    
    if (jwt) {
      const roleType = userStr ? JSON.parse(userStr)?.role?.type : null;
      if (roleType === 'admin') router.push('/admin');
      else if (roleType === 'content_manager') router.push('/content-manager');
      else if (roleType === 'instructor') router.push('/instructor');
      else router.push('/');
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/auth/local`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Strapi returns an error object if auth fails
        const errMsg = t('auth.login_error') || 'Invalid credentials';
        setError(errMsg);
        toast.error(errMsg);
        setLoading(false);
        return;
      }

      // Fetch user's role
      const meRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/users/me?populate=role`, {
        headers: {
          'Authorization': `Bearer ${data.jwt}`
        }
      });
      const meData = await meRes.json();
      const userWithRole = { ...data.user, role: meData.role };

      // Success! Save token, then redirect based on role
      localStorage.setItem('jwt', data.jwt);
      localStorage.setItem('user', JSON.stringify(userWithRole));
      toast.success(`Welcome back, ${userWithRole.username}!`, 'Login Successful');
      
      const roleType = meData.role?.type;
      if (roleType === 'admin') {
        router.push('/admin');
      } else if (roleType === 'content_manager') {
        router.push('/content-manager');
      } else if (roleType === 'instructor') {
        router.push('/instructor');
      } else {
        router.push('/');
      }
      
    } catch (err) {
      const errMsg = t('auth.unexpected_error') || 'An unexpected error occurred';
      setError(errMsg);
      toast.error(errMsg);
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center overflow-hidden">
      <AnimatedBackground />
      
      <div className="relative z-10 w-full max-w-md p-8 bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 mb-2">
            Acin's LMS
          </h1>
          <p className="text-gray-400 text-sm">{t('auth.sign_in_to_continue')}</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">{t('auth.email')}</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-500 transition-colors"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">{t('auth.password')}</label>
            <div className="relative">
              <input 
                type={showPassword ? 'text' : 'password'} 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-4 pr-11 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-500 transition-colors"
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
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white rounded-lg font-semibold transition-all transform hover:scale-[1.02] active:scale-95 shadow-lg shadow-blue-500/20 flex justify-center items-center"
          >
            {loading ? t('auth.signing_in') : t('auth.sign_in')}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-400">
            {t('auth.no_account')}{' '}
            <Link href="/register" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
              {t('auth.sign_up_link')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}



