'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    const checkSession = () => {
      const jwt = localStorage.getItem('jwt');
      const userStr = localStorage.getItem('user');
      const timestampStr = localStorage.getItem('loginTimestamp');

      if (jwt && userStr && timestampStr) {
        const loginTime = parseInt(timestampStr, 10);
        const isExpired = Date.now() - loginTime > 10 * 60 * 1000; // 10 minutes

        if (isExpired) {
          // Auto logout
          localStorage.removeItem('jwt');
          localStorage.removeItem('user');
          localStorage.removeItem('loginTimestamp');
          setUsername(null);
          
          // Redirect if not on public pages
          const publicRoutes = ['/', '/login', '/register', '/courses', '/success', '/blogs'];
          const isPublic = publicRoutes.some(route => pathname === route || pathname?.startsWith(route + '/'));
          
          if (!isPublic) {
            router.push('/login');
          }
        } else {
          try {
            const user = JSON.parse(userStr);
            if (user && user.username) {
              setUsername(user.username);
            }
          } catch (e) {
            setUsername(null);
          }
        }
      } else {
        setUsername(null);
      }
    };

    // Check immediately on route change
    checkSession();

    // Check every 30 seconds for auto-logout while idling
    const intervalId = setInterval(checkSession, 30000);
    return () => clearInterval(intervalId);
  }, [pathname, router]);

  const handleLogout = () => {
    localStorage.removeItem('jwt');
    localStorage.removeItem('user');
    localStorage.removeItem('loginTimestamp');
    setUsername(null);
    router.push('/login');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-md border-b border-white/10 text-white">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        
        {/* Left Side */}
        <div className="flex-shrink-0">
          <Link href="/" className="text-xl font-bold tracking-tighter hover:text-emerald-400 transition-colors">
            Acin's LMS
          </Link>
        </div>

        {/* Middle */}
        <div className="hidden md:flex space-x-8">
          <Link href="/courses" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
            All Courses
          </Link>
          <Link href="/success" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
            Success Story
          </Link>
        </div>

        {/* Right Side */}
        <div className="flex items-center space-x-6">
          <Link href="/blogs" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
            Blogs
          </Link>
          
          {username ? (
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-emerald-400">
                Hi, {username}
              </span>
              <button 
                onClick={handleLogout}
                className="px-3 py-1.5 text-xs font-medium text-white bg-red-500/20 hover:bg-red-500/40 border border-red-500/50 rounded-md transition-colors"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link 
              href="/login" 
              className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors"
            >
              Login
            </Link>
          )}
        </div>
        
      </div>
    </nav>
  );
}
