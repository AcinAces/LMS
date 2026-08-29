'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    users: 0,
    courses: 0,
    lessons: 0,
    quizzes: 0,
    blogs: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const jwt = localStorage.getItem('jwt');
        if (!jwt) return;

        const headers = { 'Authorization': `Bearer ${jwt}` };

        const [usersRes, coursesRes, lessonsRes, quizzesRes, blogsRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/users`, { headers }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/courses?pagination[limit]=1`, { headers }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/lessons?pagination[limit]=1`, { headers }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/quizzes?pagination[limit]=1`, { headers }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/blogs?pagination[limit]=1`, { headers }),
        ]);

        let usersCount = 0;
        if (usersRes.ok) {
          const uData = await usersRes.json();
          usersCount = Array.isArray(uData) ? uData.length : 0;
        }

        let coursesCount = 0;
        if (coursesRes.ok) {
          const cData = await coursesRes.json();
          coursesCount = cData.meta?.pagination?.total || cData.data?.length || 0;
        }

        let lessonsCount = 0;
        if (lessonsRes.ok) {
          const lData = await lessonsRes.json();
          lessonsCount = lData.meta?.pagination?.total || lData.data?.length || 0;
        }

        let quizzesCount = 0;
        if (quizzesRes.ok) {
          const qData = await quizzesRes.json();
          quizzesCount = qData.meta?.pagination?.total || qData.data?.length || 0;
        }
        
        let blogsCount = 0;
        if (blogsRes.ok) {
          const bData = await blogsRes.json();
          blogsCount = bData.meta?.pagination?.total || bData.data?.length || 0;
        }

        setStats({
          users: usersCount,
          courses: coursesCount,
          lessons: lessonsCount,
          quizzes: quizzesCount,
          blogs: blogsCount
        });
      } catch (e) {
        console.error('Failed to fetch stats', e);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    { label: 'Total Users', value: stats.users, icon: '👥', color: 'from-emerald-500/20 to-teal-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', href: '/admin/users' },
    { label: 'Total Courses', value: stats.courses, icon: '📚', color: 'from-cyan-500/20 to-blue-500/10', border: 'border-cyan-500/30', text: 'text-cyan-400', href: '/admin/courses' },
    { label: 'Total Lessons', value: stats.lessons, icon: '🎬', color: 'from-purple-500/20 to-indigo-500/10', border: 'border-purple-500/30', text: 'text-purple-400', href: '/admin/lessons' },
    { label: 'Anti-Cheat Quizzes', value: stats.quizzes, icon: '🛡️', color: 'from-amber-500/20 to-orange-500/10', border: 'border-amber-500/30', text: 'text-amber-400', href: '/admin/quizzes' },
    { label: 'Published Blogs', value: stats.blogs, icon: '✍️', color: 'from-rose-500/20 to-pink-500/10', border: 'border-rose-500/30', text: 'text-rose-400', href: '/admin/blogs' },
  ];

  const quickActions = [
    { href: '/admin/users', title: 'Manage User Accounts', desc: 'Assign and modify roles (Admin, Content Manager, Instructor, Student)', icon: '👥', color: 'text-emerald-400 hover:border-emerald-500/40' },
    { href: '/admin/courses', title: 'Curriculum & Courses', desc: 'Create, publish, edit, or configure all courses across the platform', icon: '📚', color: 'text-cyan-400 hover:border-cyan-500/40' },
    { href: '/admin/featured', title: 'Featured Showcase', desc: 'Select top courses to feature on public homepage showcase banners', icon: '⭐', color: 'text-amber-400 hover:border-amber-500/40' },
    { href: '/admin/lessons', title: 'Video Lessons', desc: 'Upload, edit, reorder, or update video lessons and readings', icon: '🎬', color: 'text-purple-400 hover:border-purple-500/40' },
    { href: '/admin/quizzes', title: 'Anti-Cheat Quizzes', desc: 'Author examinations with timer limits and proctor strike tracking', icon: '🛡️', color: 'text-rose-400 hover:border-rose-500/40' },
    { href: '/admin/progress', title: 'Student Progress Analytics', desc: 'Inspect comprehensive student enrollment, completion rates, and quiz attempts', icon: '📊', color: 'text-teal-400 hover:border-teal-500/40' },
    { href: '/admin/blogs', title: 'Educational Blogs', desc: 'Publish and edit rich Markdown articles across all computer science subtopics', icon: '✍️', color: 'text-indigo-400 hover:border-indigo-500/40' },
  ];

  return (
    <div className="space-y-10 animate-fade-in-up">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-slate-950/90 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-2xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Admin Overview
            </span>
            <span className="text-xs text-slate-400 font-mono">System Healthy</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            Administrator Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Real-time platform metrics, user access management, and curriculum controls.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-2">
          <Link 
            href="/admin/courses" 
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5"
          >
            <span>+ Create Course</span>
          </Link>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
        {statCards.map((card, idx) => (
          <Link
            key={idx}
            href={card.href}
            className={`relative group bg-slate-900/60 backdrop-blur-xl border border-white/10 hover:${card.border} rounded-2xl p-5 sm:p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl flex flex-col justify-between overflow-hidden`}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`} />

            <div className="relative z-10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-2xl">{card.icon}</span>
                <span className="text-slate-500 text-xs font-mono group-hover:text-white transition-colors">↗</span>
              </div>
              <div>
                <div className={`text-2xl sm:text-3xl font-black ${card.text}`}>
                  {loading ? '...' : card.value}
                </div>
                <div className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">
                  {card.label}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions Hub */}
      <div className="bg-slate-900/60 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Platform Operations & Quick Actions</h2>
            <p className="text-xs text-slate-400 mt-0.5">Direct shortcuts to manage platform infrastructure and content</p>
          </div>
          <span className="text-xs font-mono text-slate-500 hidden sm:inline">7 Controls Available</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map((action, i) => (
            <Link
              key={i}
              href={action.href}
              className={`p-5 bg-slate-950/60 hover:bg-slate-800/80 border border-white/10 rounded-2xl transition-all duration-300 group flex flex-col justify-between space-y-3 ${action.color}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl p-2 rounded-xl bg-white/5 border border-white/5 group-hover:scale-110 transition-transform">
                  {action.icon}
                </span>
                <svg className="w-4 h-4 text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </div>

              <div>
                <h3 className="font-bold text-white text-sm sm:text-base group-hover:text-emerald-300 transition-colors">
                  {action.title}
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {action.desc}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
