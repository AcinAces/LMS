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

  useEffect(() => {
    const verifySecurely = async () => {
      const jwt = localStorage.getItem('jwt');
      
      if (!jwt) {
        router.push('/login');
        return;
      }
      
      try {
        const res = await fetch('http://localhost:1337/api/users/me?populate=role', {
          headers: { 'Authorization': `Bearer ${jwt}` }
        });
        
        if (!res.ok) {
          throw new Error('Unauthorized');
        }
        
        const meData = await res.json();
        
        const userStr = localStorage.getItem('user');
        if (userStr && meData?.role) {
           const user = JSON.parse(userStr);
           localStorage.setItem('user', JSON.stringify({ ...user, role: meData.role }));
        }
        
        if (meData?.role?.type !== 'content_manager' && meData?.role?.type !== 'admin') {
          // Fallback logic, though technically 'content_manager' is what we want
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

  if (loading) return <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">Loading...</div>;

  const navItems = [
    { name: 'Dashboard', href: '/content-manager', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { name: 'Courses', href: '/content-manager/courses', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
    { name: 'Lessons', href: '/content-manager/lessons', icon: 'M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { name: 'Quizzes', href: '/content-manager/quizzes', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
    { name: 'Student Progress', href: '/content-manager/progress', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    { name: 'Blogs', href: '/content-manager/blogs', icon: 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2.5 2.5 0 00-2.5-2.5H15' },
  ];

  return (
    <div className="min-h-screen bg-gray-900 flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/10 bg-black/50 hidden md:block">
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-white/10">
            <h2 className="text-xl font-bold text-white tracking-tight">Content<span className="text-emerald-500">Manager</span></h2>
          </div>
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    isActive 
                      ? 'bg-emerald-500/10 text-emerald-400 font-medium' 
                      : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                  </svg>
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 overflow-auto">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
