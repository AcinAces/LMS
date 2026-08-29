'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function InstructorDashboard() {
  const [stats, setStats] = useState({
    courses: 0,
    lessons: 0,
    quizzes: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const jwt = localStorage.getItem('jwt');
        const userStr = localStorage.getItem('user');
        if (!jwt || !userStr) return;
        
        const user = JSON.parse(userStr);
        const myId = user.id;

        const headers = { 'Authorization': `Bearer ${jwt}` };

        // Instructors should only see stats for their own courses
        const [coursesRes, lessonsRes, quizzesRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/courses?filters[courseAuthor][id][$eq]=${myId}&pagination[limit]=1`, { headers }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/lessons?filters[course][courseAuthor][id][$eq]=${myId}&pagination[limit]=1`, { headers }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/quizzes?filters[course][courseAuthor][id][$eq]=${myId}&pagination[limit]=1`, { headers }),
        ]);

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

        setStats({
          courses: coursesCount,
          lessons: lessonsCount,
          quizzes: quizzesCount
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
    { label: 'My Authored Courses', value: stats.courses, icon: '📚', color: 'from-purple-500/20 to-indigo-500/10', border: 'border-purple-500/30', text: 'text-purple-400', href: '/instructor/courses' },
    { label: 'My Uploaded Lessons', value: stats.lessons, icon: '🎬', color: 'from-cyan-500/20 to-blue-500/10', border: 'border-cyan-500/30', text: 'text-cyan-400', href: '/instructor/lessons' },
    { label: 'My Course Quizzes', value: stats.quizzes, icon: '🛡️', color: 'from-emerald-500/20 to-teal-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', href: '/instructor/quizzes' },
  ];

  const quickActions = [
    { href: '/instructor/courses', title: 'Manage My Courses', desc: 'Create, edit, or configure settings for your authored courses', icon: '📚', color: 'text-purple-400 hover:border-purple-500/40' },
    { href: '/instructor/lessons', title: 'Manage Video Lessons', desc: 'Upload, edit, and organize lessons and reading material', icon: '🎬', color: 'text-cyan-400 hover:border-cyan-500/40' },
    { href: '/instructor/quizzes', title: 'Create Quizzes', desc: 'Build and manage interactive anti-cheat exams for your students', icon: '🛡️', color: 'text-pink-400 hover:border-pink-500/40' },
    { href: '/instructor/progress', title: 'Student Progress Analytics', desc: 'View watch times, completion rates, and quiz attempts for your courses', icon: '📊', color: 'text-emerald-400 hover:border-emerald-500/40' },
  ];

  return (
    <div className="space-y-10 animate-fade-in-up">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-slate-950/90 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-2xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
              Instructor Studio
            </span>
            <span className="text-xs text-slate-400 font-mono">Course Author</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            Instructor Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Manage your courses, monitor student learning progress, and answer 1-to-1 lesson queries.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-2">
          <Link 
            href="/instructor/courses" 
            className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-500/20 transition-all flex items-center gap-1.5"
          >
            <span>+ New Course</span>
          </Link>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        {statCards.map((card, idx) => (
          <Link
            key={idx}
            href={card.href}
            className={`relative group bg-slate-900/60 backdrop-blur-xl border border-white/10 hover:${card.border} rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl flex flex-col justify-between overflow-hidden`}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`} />

            <div className="relative z-10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-3xl">{card.icon}</span>
                <span className="text-slate-500 text-xs font-mono group-hover:text-white transition-colors">↗</span>
              </div>
              <div>
                <div className={`text-3xl sm:text-4xl font-black ${card.text}`}>
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
            <h2 className="text-xl font-bold text-white tracking-tight">Instructor Shortcuts & Controls</h2>
            <p className="text-xs text-slate-400 mt-0.5">Author and manage lessons, quizzes, and student interactions</p>
          </div>
          <span className="text-xs font-mono text-slate-500 hidden sm:inline">4 Controls Available</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <h3 className="font-bold text-white text-sm sm:text-base group-hover:text-purple-300 transition-colors">
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
