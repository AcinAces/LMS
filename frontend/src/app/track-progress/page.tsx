'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AnimatedBackground from '@/components/AnimatedBackground';

interface CourseStat {
  documentId: string;
  title: string;
  totalLessons: number;
  completedLessons: number;
}

interface QuizAttempt {
  id: number;
  score: number;
  totalQuestion: number;
  percentage: number;
  submittedAt: string;
  quizTitle: string;
  courseTitle: string;
}

export default function TrackProgressPage() {
  const [courses, setCourses] = useState<CourseStat[]>([]);
  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const jwt = localStorage.getItem('jwt');
        if (!jwt) {
          router.push('/login');
          return;
        }

        const headers: HeadersInit = { 'Authorization': `Bearer ${jwt}` };

        // Fetch all courses with their lessons to ensure we get the full mapping
        const coursesRes = await fetch('http://localhost:1337/api/courses?populate[0]=lessons', { headers });
        if (coursesRes.status === 401) {
          router.push('/login');
          return;
        }
        if (!coursesRes.ok) throw new Error('Failed to fetch courses');
        const coursesData = await coursesRes.json();
        const allCourses = coursesData.data || [];

        // Fetch my enrollments
        const enrollRes = await fetch('http://localhost:1337/api/enrollments', { headers });
        if (!enrollRes.ok) throw new Error('Failed to fetch enrollments');
        const enrollData = await enrollRes.json();
        const myEnrollments = enrollData.data || [];

        // Filter courses to only those I am enrolled in
        const enrolledCourseIds = new Set(myEnrollments.map((e: any) => e.course?.documentId).filter(Boolean));
        const myCourses = allCourses.filter((c: any) => enrolledCourseIds.has(c.documentId));

        // Fetch my lesson progresses
        const progRes = await fetch('http://localhost:1337/api/lesson-progresses?populate[0]=lesson', { headers });
        let progresses: any[] = [];
        if (progRes.ok) {
          const progData = await progRes.json();
          progresses = progData.data || [];
        }

        // Build course stats map
        const courseStatsMap = new Map<string, CourseStat>();
        
        myCourses.forEach((c: any) => {
          courseStatsMap.set(c.documentId, {
            documentId: c.documentId,
            title: c.courseTitle,
            totalLessons: c.lessons?.length || 0,
            completedLessons: 0
          });
        });

        // Tally completed lessons
        progresses.forEach((p: any) => {
          if (p.completed && p.lesson?.documentId) {
            // Find which course this lesson belongs to
            myCourses.forEach((c: any) => {
              const hasLesson = c.lessons?.some((l: any) => l.documentId === p.lesson.documentId);
              if (hasLesson) {
                const stat = courseStatsMap.get(c.documentId);
                if (stat) stat.completedLessons += 1;
              }
            });
          }
        });

        setCourses(Array.from(courseStatsMap.values()));

        // Fetch quiz attempts
        const quizRes = await fetch('http://localhost:1337/api/quiz-attempts?populate[quiz][populate][0]=course', { headers });
        if (quizRes.ok) {
          const quizData = await quizRes.json();
          const attempts = (quizData.data || []).map((a: any) => ({
            id: a.id,
            score: a.score,
            totalQuestion: a.totalQuestion,
            percentage: a.percentage,
            submittedAt: a.submittedAt || a.createdAt,
            quizTitle: a.quiz?.quizTitle || 'Unknown Quiz',
            courseTitle: a.quiz?.course?.courseTitle || 'Unknown Course'
          }));
          // Sort attempts descending by submission date
          attempts.sort((a: any, b: any) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
          setQuizAttempts(attempts);
        }

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
  }, [router]);

  return (
    <div className="relative min-h-[calc(100vh-4rem)] pt-16">
      <AnimatedBackground />
      <div className="relative z-10 max-w-5xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-extrabold text-white mb-10 text-center">Your Progress Report</h1>
        
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
          </div>
        ) : (
          <div className="space-y-16">
            
            {/* Courses Section */}
            <section>
              <h2 className="text-2xl font-bold text-emerald-400 mb-6 flex items-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
                Course Completion
              </h2>
              
              {courses.length === 0 ? (
                <div className="bg-black/40 border border-white/10 rounded-xl p-8 text-center text-gray-400">
                  You are not enrolled in any courses yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {courses.map(course => {
                    const pct = course.totalLessons > 0 ? Math.round((course.completedLessons / course.totalLessons) * 100) : 0;
                    return (
                      <div key={course.documentId} className="bg-black/60 backdrop-blur-md border border-white/10 rounded-xl p-6 hover:border-emerald-500/30 transition-all shadow-lg">
                        <div className="flex justify-between items-start mb-4">
                          <h3 className="text-xl font-bold text-white line-clamp-1 flex-1 pr-4">{course.title}</h3>
                          <span className="text-emerald-400 font-bold font-mono">{pct}%</span>
                        </div>
                        
                        <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden mb-3 border border-white/5">
                          <div 
                            className="h-full bg-emerald-500 rounded-full transition-all duration-1000 ease-out relative"
                            style={{ width: `${pct}%` }}
                          >
                            <div className="absolute inset-0 bg-white/20 w-full animate-[shimmer_2s_infinite]"></div>
                          </div>
                        </div>
                        
                        <div className="flex justify-between text-sm text-gray-400">
                          <span>{course.completedLessons} / {course.totalLessons} Lessons Completed</span>
                          <Link href={`/courses/${course.documentId}`} className="text-blue-400 hover:text-blue-300 font-medium">
                            Continue &rarr;
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Quizzes Section */}
            <section>
              <h2 className="text-2xl font-bold text-emerald-400 mb-6 flex items-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                Quiz Performances
              </h2>
              
              {quizAttempts.length === 0 ? (
                <div className="bg-black/40 border border-white/10 rounded-xl p-8 text-center text-gray-400">
                  You haven't taken any quizzes yet.
                </div>
              ) : (
                <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden shadow-lg">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-white/5 border-b border-white/10">
                          <th className="p-4 text-sm font-semibold text-gray-300">Quiz</th>
                          <th className="p-4 text-sm font-semibold text-gray-300 hidden md:table-cell">Course</th>
                          <th className="p-4 text-sm font-semibold text-gray-300 text-center">Score</th>
                          <th className="p-4 text-sm font-semibold text-gray-300 text-center">Percentage</th>
                          <th className="p-4 text-sm font-semibold text-gray-300 text-right">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {quizAttempts.map(attempt => (
                          <tr key={attempt.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                            <td className="p-4 text-white font-medium">{attempt.quizTitle}</td>
                            <td className="p-4 text-gray-400 text-sm hidden md:table-cell">{attempt.courseTitle}</td>
                            <td className="p-4 text-center text-white">
                              {attempt.score} / {attempt.totalQuestion}
                            </td>
                            <td className="p-4 text-center">
                              <span className={`inline-flex px-2 py-1 rounded text-xs font-bold ${
                                attempt.percentage >= 80 ? 'bg-emerald-500/20 text-emerald-400' : 
                                attempt.percentage >= 50 ? 'bg-yellow-500/20 text-yellow-400' : 
                                'bg-red-500/20 text-red-400'
                              }`}>
                                {attempt.percentage}%
                              </span>
                            </td>
                            <td className="p-4 text-right text-sm text-gray-500 whitespace-nowrap">
                              {new Date(attempt.submittedAt).toLocaleDateString(undefined, { 
                                year: 'numeric', month: 'short', day: 'numeric'
                              })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </section>
            
          </div>
        )}
      </div>
    </div>
  );
}
