'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AnimatedBackground from '@/components/AnimatedBackground';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If already logged in and session is valid, redirect based on role
    const jwt = localStorage.getItem('jwt');
    const userStr = localStorage.getItem('user');
    const timestampStr = localStorage.getItem('loginTimestamp');
    
    if (jwt && timestampStr) {
      const loginTime = parseInt(timestampStr, 10);
      const isExpired = Date.now() - loginTime > 10 * 60 * 1000; // 10 mins
      
      if (!isExpired) {
        const roleType = userStr ? JSON.parse(userStr)?.role?.type : null;
        if (roleType === 'admin') router.push('/admin');
        else if (roleType === 'content_manager') router.push('/content-manager');
        else if (roleType === 'instructor') router.push('/instructor');
        else router.push('/');
      } else {
        // Expired, clear it
        localStorage.removeItem('jwt');
        localStorage.removeItem('user');
        localStorage.removeItem('loginTimestamp');
      }
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
        setError("Email or password didn't match or not found.");
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

      // Success! Save token and timestamp, then redirect based on role
      localStorage.setItem('jwt', data.jwt);
      localStorage.setItem('user', JSON.stringify(userWithRole));
      localStorage.setItem('loginTimestamp', Date.now().toString());
      
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
      setError("An unexpected error occurred. Please try again.");
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
          <p className="text-gray-400 text-sm">Sign in to your account to continue</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
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
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-300">Password</label>
              <button type="button" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                Forgot password?
              </button>
            </div>
            <p className="text-xs text-amber-500/80 mb-2 italic">
              * Note: No password requirements temporarily
            </p>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-500 transition-colors"
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white rounded-lg font-semibold transition-all transform hover:scale-[1.02] active:scale-95 shadow-lg shadow-blue-500/20 flex justify-center items-center"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-400">
            Don't have an account?{' '}
            <Link href="/register" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
