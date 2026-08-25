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

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const jwt = localStorage.getItem('jwt');
        if (!jwt) return;

        const headers = { 'Authorization': `Bearer ${jwt}` };

        const [usersRes, coursesRes, lessonsRes, quizzesRes, blogsRes] = await Promise.all([
          fetch('http://localhost:1337/api/users', { headers }),
          fetch('http://localhost:1337/api/courses?pagination[limit]=1', { headers }),
          fetch('http://localhost:1337/api/lessons?pagination[limit]=1', { headers }),
          fetch('http://localhost:1337/api/quizzes?pagination[limit]=1', { headers }),
          fetch('http://localhost:1337/api/blogs?pagination[limit]=1', { headers }),
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
      }
    };

    fetchStats();
  }, []);

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome, Admin</h1>
          <p className="text-gray-400">Overview of platform statistics and recent activity.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
        {/* Stat Cards */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h3 className="text-gray-400 text-sm font-medium mb-1">Total Users</h3>
          <p className="text-3xl font-bold text-white">{stats.users}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h3 className="text-gray-400 text-sm font-medium mb-1">Total Courses</h3>
          <p className="text-3xl font-bold text-emerald-400">{stats.courses}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h3 className="text-gray-400 text-sm font-medium mb-1">Total Lessons</h3>
          <p className="text-3xl font-bold text-blue-400">{stats.lessons}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h3 className="text-gray-400 text-sm font-medium mb-1">Total Quizzes</h3>
          <p className="text-3xl font-bold text-purple-400">{stats.quizzes}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h3 className="text-gray-400 text-sm font-medium mb-1">Total Blogs</h3>
          <p className="text-3xl font-bold text-indigo-400">{stats.blogs}</p>
        </div>
      </div>

      {/* Quick Actions based on abilities requested */}
      <div className="bg-black/40 border border-white/10 rounded-xl p-8">
        <h2 className="text-xl font-bold text-white mb-6">Quick Actions</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link href="/admin/users" className="p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors flex flex-col gap-2 group">
            <span className="text-emerald-400 font-bold group-hover:text-emerald-300">Manage Users</span>
            <span className="text-xs text-gray-400">Assign roles (Admin, Content Manager, Instructor)</span>
          </Link>
          
          <Link href="/admin/courses" className="p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors flex flex-col gap-2 group">
            <span className="text-blue-400 font-bold group-hover:text-blue-300">Manage Courses</span>
            <span className="text-xs text-gray-400">Create, edit, or delete any course</span>
          </Link>

          <Link href="/admin/lessons" className="p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors flex flex-col gap-2 group">
            <span className="text-purple-400 font-bold group-hover:text-purple-300">Manage Lessons</span>
            <span className="text-xs text-gray-400">Add, edit, or delete video lessons</span>
          </Link>

          <Link href="/admin/quizzes" className="p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors flex flex-col gap-2 group">
            <span className="text-pink-400 font-bold group-hover:text-pink-300">Create Quizzes</span>
            <span className="text-xs text-gray-400">Build interactive quizzes for students</span>
          </Link>

          <Link href="/admin/progress" className="p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors flex flex-col gap-2 group">
            <span className="text-amber-400 font-bold group-hover:text-amber-300">Student Progress</span>
            <span className="text-xs text-gray-400">View overall student completion and metrics</span>
          </Link>

          <Link href="/admin/blogs" className="p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors flex flex-col gap-2 group">
            <span className="text-indigo-400 font-bold group-hover:text-indigo-300">Manage Blogs</span>
            <span className="text-xs text-gray-400">Write, edit, and manage public blog posts</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
