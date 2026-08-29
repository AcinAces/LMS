'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('Admin');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const verifySecurely = async () => {
      const jwt = localStorage.getItem('jwt');
      if (!jwt) {
        router.push('/login');
        return;
      }

      // Check cached user for immediate rendering
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const cachedUser = JSON.parse(userStr);
          if (cachedUser?.username) setUsername(cachedUser.username);
          if (cachedUser?.avatar) setAvatar(cachedUser.avatar);
          if (cachedUser?.role?.type === 'admin') {
            setLoading(false);
          }
        } catch (_) {}
      }

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/users/me?populate=role`, {
          headers: { 'Authorization': `Bearer ${jwt}` },
          cache: 'no-store'
        });

        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem('jwt');
          localStorage.removeItem('user');
          router.push('/login');
          return;
        }

        if (!res.ok) {
          // If server error or temporary issue, check if cached user is valid admin
          if (userStr) {
            const cachedUser = JSON.parse(userStr);
            if (cachedUser?.role?.type === 'admin') {
              setLoading(false);
              return;
            }
          }
          router.push('/');
          return;
        }
        
        const meData = await res.json();
        if (meData?.role?.type !== 'admin') {
          router.push('/');
          return;
        }

        setUsername(meData.username || 'Admin');
        setAvatar(meData.avatar || null);
        if (userStr) {
          const user = JSON.parse(userStr);
          localStorage.setItem('user', JSON.stringify({ ...user, ...meData, role: meData.role }));
        } else {
          localStorage.setItem('user', JSON.stringify(meData));
        }

        setLoading(false);
      } catch (e) {
        console.error('Admin layout auth verification error:', e);
        if (userStr) {
          try {
            const cachedUser = JSON.parse(userStr);
            if (cachedUser?.role?.type === 'admin') {
              setLoading(false);
              return;
            }
          } catch (_) {}
        }
        router.push('/login');
      }
    };
    verifySecurely();
  }, [router]);

  if (loading) return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
    </div>
  );

  const links = [
    { href: '/admin', label: 'Dashboard', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
    { href: '/admin/users', label: 'Manage Users', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
    { href: '/admin/courses', label: 'Manage Courses', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
    { href: '/admin/featured', label: 'Featured Courses', icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z' },
    { href: '/admin/lessons', label: 'Manage Lessons', icon: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z' },
    { href: '/admin/quizzes', label: 'Create Quizzes', icon: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { href: '/admin/progress', label: 'Student Progress', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    { href: '/admin/blogs', label: 'Manage Blogs', icon: 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z' },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-950 flex flex-col md:flex-row text-slate-100">
      
      {/* Mobile Toggle Bar */}
      <div className="md:hidden bg-slate-900 border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-white">Admin Console</span>
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">Admin</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`${mobileOpen ? 'block' : 'hidden'} md:block w-full md:w-72 bg-slate-900/60 backdrop-blur-2xl border-r border-white/10 flex flex-col shrink-0 z-20`}>
        <div className="p-6 border-b border-white/10 space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xl">👑</span>
            <h2 className="text-xl font-extrabold text-white tracking-tight">Admin Console</h2>
          </div>
          <p className="text-xs text-slate-400">Full platform controls & oversight</p>
        </div>

        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link 
                key={link.href} 
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 text-xs sm:text-sm font-semibold ${
                  isActive 
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-md shadow-emerald-500/10' 
                    : 'hover:bg-white/5 text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={link.icon} />
                </svg>
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer User Info */}
        <div className="p-4 border-t border-white/10 bg-slate-950/40 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            {avatar ? (
              <img 
                src={avatar} 
                alt={username} 
                className="w-8 h-8 rounded-xl object-cover border border-emerald-500/40 shadow-sm" 
              />
            ) : (
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
                {username.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="truncate max-w-[120px]">
              <p className="font-bold text-white truncate">{username}</p>
              <p className="text-[10px] text-emerald-400">Administrator</p>
            </div>
          </div>
          <Link href="/" className="text-slate-400 hover:text-white text-[11px] flex items-center gap-1 font-mono">
            <span>Site ↗</span>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 overflow-y-auto p-4 sm:p-8 lg:p-10 animate-fade-in-up">
        {children}
      </main>
    </div>
  );
}
