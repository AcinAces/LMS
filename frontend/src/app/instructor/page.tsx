'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function InstructorDashboard() {
  const [stats, setStats] = useState({
    courses: 0,
    lessons: 0,
    quizzes: 0,
  });

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
          fetch(`http://localhost:1337/api/courses?filters[courseAuthor][id][$eq]=${myId}&pagination[limit]=1`, { headers }),
          fetch(`http://localhost:1337/api/lessons?filters[course][courseAuthor][id][$eq]=${myId}&pagination[limit]=1`, { headers }),
          fetch(`http://localhost:1337/api/quizzes?filters[course][courseAuthor][id][$eq]=${myId}&pagination[limit]=1`, { headers }),
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
      }
    };

    fetchStats();
  }, []);

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome, Instructor</h1>
          <p className="text-gray-400">Overview of your courses and student activity.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h3 className="text-gray-400 text-sm font-medium mb-1">My Courses</h3>
          <p className="text-3xl font-bold text-emerald-400">{stats.courses}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h3 className="text-gray-400 text-sm font-medium mb-1">My Lessons</h3>
          <p className="text-3xl font-bold text-blue-400">{stats.lessons}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h3 className="text-gray-400 text-sm font-medium mb-1">My Quizzes</h3>
          <p className="text-3xl font-bold text-purple-400">{stats.quizzes}</p>
        </div>
      </div>

      <div className="bg-black/40 border border-white/10 rounded-xl p-8">
        <h2 className="text-xl font-bold text-white mb-6">Quick Actions</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
          <Link href="/instructor/courses" className="p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors flex flex-col gap-2 group">
            <span className="text-blue-400 font-bold group-hover:text-blue-300">Manage My Courses</span>
            <span className="text-xs text-gray-400">Create, edit, or delete your courses</span>
          </Link>

          <Link href="/instructor/lessons" className="p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors flex flex-col gap-2 group">
            <span className="text-purple-400 font-bold group-hover:text-purple-300">Manage Lessons</span>
            <span className="text-xs text-gray-400">Add, edit, or delete video lessons for your courses</span>
          </Link>

          <Link href="/instructor/quizzes" className="p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors flex flex-col gap-2 group">
            <span className="text-pink-400 font-bold group-hover:text-pink-300">Create Quizzes</span>
            <span className="text-xs text-gray-400">Build interactive quizzes for your students</span>
          </Link>

          <Link href="/instructor/progress" className="p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors flex flex-col gap-2 group">
            <span className="text-amber-400 font-bold group-hover:text-amber-300">Student Progress</span>
            <span className="text-xs text-gray-400">View overall student completion and metrics for your courses</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
