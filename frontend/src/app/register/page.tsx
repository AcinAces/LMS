'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import AnimatedBackground from '@/components/AnimatedBackground';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
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

    if (password !== confirmPassword) {
      setError("Passwords don't match!");
      return;
    }
    
    if (usernameStatus === 'taken') {
      setError("Please choose an available username.");
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
        if (data?.error?.message?.toLowerCase().includes('email') || data?.error?.message?.toLowerCase().includes('taken')) {
          setError('email_taken');
        } else {
          setError(data?.error?.message || "Registration failed.");
        }
        setLoading(false);
        return;
      }

      // Success! Switch to success modal
      setSuccessMode(true);

    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
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
          <h2 className="text-2xl font-bold text-white mb-4">Registration Successful!</h2>
          <p className="text-gray-300 mb-6">
            Your account has been created successfully.
          </p>
          <div className="text-emerald-400 font-medium">
            Redirecting to login page in <span className="text-2xl ml-2">{countdown}</span>...
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
          <p className="text-gray-400 text-sm">Create an account to start learning</p>
        </div>

        {error && error === 'email_taken' && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-center flex flex-col items-center gap-3">
            <span className="text-red-500 text-sm font-medium">Email already registered!</span>
            <Link 
              href="/login"
              className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-md text-white text-sm font-medium transition-colors flex items-center gap-2"
            >
              Login instead?
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
              <label className="block text-sm font-medium text-gray-300">Username</label>
              {usernameStatus === 'checking' && <span className="text-xs text-gray-400">Checking...</span>}
              {usernameStatus === 'available' && <span className="text-xs text-emerald-400">✓ Available</span>}
              {usernameStatus === 'taken' && <span className="text-xs text-red-400">✗ Not available</span>}
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
                Suggestions:{' '}
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
            <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-white placeholder-gray-500 transition-colors"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
            <p className="text-xs text-amber-500/80 mb-2 italic">
              * Note: No password requirements temporarily
            </p>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-white placeholder-gray-500 transition-colors"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Confirm Password</label>
            <input 
              type="password" 
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-white placeholder-gray-500 transition-colors"
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading || usernameStatus === 'taken'}
            className="w-full py-3 mt-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-600/50 text-white rounded-lg font-semibold transition-all transform hover:scale-[1.02] active:scale-95 shadow-lg shadow-emerald-500/20 flex justify-center items-center"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-400">
            Already have an account?{' '}
            <Link href="/login" className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
