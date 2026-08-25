'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [username, setUsername] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const checkSession = async () => {
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
          setUserRole(null);
          
          // Redirect if not on public pages
          const publicRoutes = ['/', '/login', '/register', '/courses', '/blogs'];
          const isPublic = publicRoutes.some(route => pathname === route || pathname?.startsWith(route + '/'));
          
          if (!isPublic && !pathname?.startsWith('/admin') && !pathname?.startsWith('/instructor') && !pathname?.startsWith('/content-manager')) {
            router.push('/login');
          }
        } else {
          try {
            const user = JSON.parse(userStr);
            if (user && user.username) {
              setUsername(user.username);
              // Fallback to local role until API resolves
              setUserRole(user.role?.type || null);
            }
            
            // ALWAYS fetch fresh role on page change or refresh
            try {
              const res = await fetch('http://localhost:1337/api/users/me?populate=role', {
                headers: { 'Authorization': `Bearer ${jwt}` }
              });
              
              if (res.ok) {
                const meData = await res.json();
                if (meData?.role) {
                  const currentRole = meData.role.type;
                  const updatedUser = { ...user, role: meData.role };
                  localStorage.setItem('user', JSON.stringify(updatedUser));
                  setUserRole(currentRole);

                  // Enforce dashboard constraints based on new role
                  if (currentRole === 'admin') {
                    if (pathname?.startsWith('/instructor') || pathname?.startsWith('/content-manager')) {
                      router.push('/admin');
                    }
                  } else if (currentRole === 'instructor') {
                    if (pathname?.startsWith('/admin') || pathname?.startsWith('/content-manager')) {
                      router.push('/instructor');
                    }
                  } else if (currentRole === 'content_manager') {
                    if (pathname?.startsWith('/admin') || pathname?.startsWith('/instructor')) {
                      router.push('/content-manager');
                    }
                  } else {
                    // Regular user / student
                    if (pathname?.startsWith('/admin') || pathname?.startsWith('/instructor') || pathname?.startsWith('/content-manager')) {
                      router.push('/');
                    }
                  }
                }
              } else {
                // If token is invalid or user was deleted
                if (res.status === 401 || res.status === 403) {
                  localStorage.removeItem('jwt');
                  localStorage.removeItem('user');
                  localStorage.removeItem('loginTimestamp');
                  setUsername(null);
                  setUserRole(null);
                  router.push('/login');
                }
              }
            } catch (err) {
              // Network error, ignore silently and rely on localstorage
            }

          } catch (e) {
            setUsername(null);
            setUserRole(null);
          }
        }
      } else {
        setUsername(null);
        setUserRole(null);
      }
    };

    // Check immediately on route change
    checkSession();

    // Check every 30 seconds for auto-logout while idling
    const intervalId = setInterval(checkSession, 30000);

    // Auto-refresh the session timer on user activity
    const updateActivity = () => {
      const jwt = localStorage.getItem('jwt');
      if (jwt) {
        localStorage.setItem('loginTimestamp', Date.now().toString());
      }
    };

    // Throttled event listeners for performance
    let throttleTimer: NodeJS.Timeout | null = null;
    const handleActivity = () => {
      if (!throttleTimer) {
        updateActivity();
        throttleTimer = setTimeout(() => {
          throttleTimer = null;
        }, 5000); // Only update timestamp once every 5 seconds maximum
      }
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('scroll', handleActivity);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('scroll', handleActivity);
    };
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
          <Link href="/blogs" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
            Blogs
          </Link>
        </div>

        {/* Right Side */}
        <div className="flex items-center space-x-6">
          {username ? (
            <div className="flex items-center space-x-4">
              {userRole === 'admin' && (
                <Link href="/admin" className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors">Admin Dashboard</Link>
              )}
              {userRole === 'content_manager' && (
                <Link href="/content-manager" className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors">Manager Dashboard</Link>
              )}
              {userRole === 'instructor' && (
                <Link href="/instructor" className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors">Instructor Dashboard</Link>
              )}
              {(!userRole || (userRole !== 'admin' && userRole !== 'instructor' && userRole !== 'content_manager')) && (
                <>
                  <Link href="/my-courses" className="text-sm font-medium text-emerald-400 hover:text-emerald-300 transition-colors">
                    My Courses
                  </Link>
                  <Link href="/track-progress" className="text-sm font-medium text-emerald-400 hover:text-emerald-300 transition-colors">
                    Track Progress
                  </Link>
                </>
              )}
              
              <span className="text-sm font-medium text-gray-400 border-l border-white/20 pl-4">
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
