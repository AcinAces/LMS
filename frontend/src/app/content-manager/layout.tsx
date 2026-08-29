'use client';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function ContentManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('Manager');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const verifySecurely = async () => {
      const jwt = localStorage.getItem('jwt');
      
      if (!jwt) {
        router.push('/login');
        return;
      }
      
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/users/me?populate=role`, {
          headers: { 'Authorization': `Bearer ${jwt}` }
        });
        
        if (!res.ok) {
          throw new Error('Unauthorized');
        }
        
        const meData = await res.json();
        const userStr = localStorage.getItem('user');
        if (userStr && meData?.role) {
           const user = JSON.parse(userStr);
           setUsername(meData.username || user.username || 'Manager');
           setAvatar(meData.avatar || user.avatar || null);
           localStorage.setItem('user', JSON.stringify({ ...user, ...meData, role: meData.role }));
        } else if (meData) {
           setUsername(meData.username || 'Manager');
           setAvatar(meData.avatar || null);
        }
        
        if (meData?.role?.type !== 'content_manager' && meData?.role?.type !== 'admin') {
          router.push('/');
          return;
        }
        
        setLoading(false);
      } catch (e) {
        localStorage.removeItem('jwt');
        localStorage.removeItem('user');
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

  const navItems = [
    { name: 'Dashboard', href: '/content-manager', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { name: 'Manage Courses', href: '/content-manager/courses', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
    { name: 'Manage Lessons', href: '/content-manager/lessons', icon: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z' },
    { name: 'Create Quizzes', href: '/content-manager/quizzes', icon: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { name: 'Student Progress', href: '/content-manager/progress', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    { name: 'Manage Blogs', href: '/content-manager/blogs', icon: 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z' },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-950 flex flex-col md:flex-row text-slate-100">
      
      {/* Mobile Toggle Bar */}
      <div className="md:hidden bg-slate-900 border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-white">Content Manager</span>
          <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 text-[10px] font-bold border border-cyan-500/20">Manager</span>
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
            <span className="text-xl">📝</span>
            <h2 className="text-xl font-extrabold text-white tracking-tight">Content Studio</h2>
          </div>
          <p className="text-xs text-slate-400">Curriculum & blog publishing operations</p>
        </div>

        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 text-xs sm:text-sm font-semibold ${
                  isActive 
                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-md shadow-cyan-500/10' 
                    : 'hover:bg-white/5 text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
                </svg>
                <span>{item.name}</span>
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
                className="w-8 h-8 rounded-xl object-cover border border-cyan-500/40 shadow-sm" 
              />
            ) : (
              <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center font-bold">
                {username.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="truncate max-w-[120px]">
              <p className="font-bold text-white truncate">{username}</p>
              <p className="text-[10px] text-cyan-400">Content Manager</p>
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
