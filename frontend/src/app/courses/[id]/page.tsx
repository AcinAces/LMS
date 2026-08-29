'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import AnimatedBackground from '@/components/AnimatedBackground';
import ReactMarkdown from 'react-markdown';
import { useLanguage } from '@/i18n/LanguageContext';
import ReviewsListModal from '@/components/ReviewsListModal';

interface LessonProgress {
  completed: boolean;
  lastWatchedPosition: number;
  student: { id: number };
}

interface Lesson {
  id: number;
  documentId: string;
  title: string;
  durationInSeconds: number;
  lessonProgresses: LessonProgress[];
}

interface Course {
  id: number;
  documentId: string;
  courseTitle: string;
  courseDescription: string;
  courseType?: string;
  courseTag?: string;
  courseAuthor: { username: string };
  lessons: Lesson[];
  enrollments: any[];
  reviews?: any[];
}

export default function CourseDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useLanguage();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<number | null>(null);
  const [isPublic, setIsPublic] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [localEnrolled, setLocalEnrolled] = useState(false);
  const [allProgress, setAllProgress] = useState<any[]>([]);
  const [totalQuizzes, setTotalQuizzes] = useState(0);
  const [takenQuizzes, setTakenQuizzes] = useState(0);
  const [showReviewsModal, setShowReviewsModal] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    let currentUserId = null;
    if (userStr) {
      try { 
        currentUserId = JSON.parse(userStr).id; 
        setUserId(currentUserId); 
      } catch (e) {}
    } else {
      setIsPublic(true);
    }

    const fetchCourse = async () => {
      try {
        const jwt = localStorage.getItem('jwt');
        const headers: HeadersInit = {};
        if (jwt) headers['Authorization'] = `Bearer ${jwt}`;
        
        let res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/courses/${params.id}?populate[0]=courseAuthor&populate[1]=lessons&populate[2]=reviews&populate[3]=reviews.author`, 
          { headers }
        );
        
        if (res.status === 401) {
          res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/courses/${params.id}?populate[0]=courseAuthor&populate[1]=lessons&populate[2]=reviews&populate[3]=reviews.author`
          );
        }

        if (!res.ok) throw new Error('Failed to fetch course');
        
        const data = await res.json();
        setCourse(data.data);

        // Check enrollment & progresses
        if (currentUserId && jwt) {
          try {
            const enrollRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/enrollments`, { headers });
            if (enrollRes.ok) {
              const enrollData = await enrollRes.json();
              const match = enrollData.data?.some((e: any) => e.course?.documentId === params.id);
              if (match) setLocalEnrolled(true);
            }

            const progRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/lesson-progresses?populate[0]=lesson`, { headers });
            if (progRes.ok) {
              const progData = await progRes.json();
              setAllProgress(progData.data || []);
            }
            
            // Fetch quizzes for this course
            const quizzesRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/quizzes?filters[course][documentId][$eq]=${params.id}`, { headers });
            if (quizzesRes.ok) {
                const qData = await quizzesRes.json();
                setTotalQuizzes(qData.data?.length || 0);
                
                const attemptsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/quiz-attempts?filters[student][id][$eq]=${currentUserId}&filters[quiz][course][documentId][$eq]=${params.id}&populate=quiz`, { headers });
                if (attemptsRes.ok) {
                   const attData = await attemptsRes.json();
                   const uniqueQuizIds = new Set(attData.data?.map((a: any) => a.quiz?.documentId).filter(Boolean));
                   setTakenQuizzes(uniqueQuizIds.size);
                }
            }
          } catch (err) {
            console.error('Failed to verify status', err);
          }
        }

      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCourse();
  }, [params.id]);

  const handleEnroll = async () => {
    if (!course || !userId) return;
    try {
      setEnrolling(true);
      const jwt = localStorage.getItem('jwt');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/enrollments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwt}`
        },
        body: JSON.stringify({ 
          data: { 
            course: course.documentId 
          } 
        })
      });

      if (res.ok) {
        setLocalEnrolled(true);
        setEnrolling(false);
      } else {
        console.error('Failed to enroll', await res.text());
        setEnrolling(false);
      }
    } catch (e) {
      console.error(e);
      setEnrolling(false);
    }
  };

  const formatTime = (seconds: number) => {
    if (!seconds) return '0m 0s';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}m ${s}s`;
  };

  const formatTotalDuration = (lessons: Lesson[]) => {
    const totalSecs = (lessons || []).reduce((acc, l) => acc + (l.durationInSeconds || 0), 0);
    if (totalSecs < 60) return `${totalSecs}s`;
    const hours = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  // Progress metrics for enrolled user
  const progressMetrics = useMemo(() => {
    if (!course?.lessons || course.lessons.length === 0) {
      return { completedCount: 0, totalCount: 0, percentage: 0, nextLessonDocId: null, isAllCompleted: false };
    }
    const lessonDocIds = new Set(course.lessons.map(l => l.documentId));
    const completedProgresses = allProgress.filter(p => p.lesson && lessonDocIds.has(p.lesson.documentId) && p.completed);
    const completedCount = completedProgresses.length;
    const totalCount = course.lessons.length;
    const percentage = Math.round((completedCount / totalCount) * 100);
    const isAllCompleted = completedCount >= totalCount && totalCount > 0;

    const completedIds = new Set(completedProgresses.map(p => p.lesson.documentId));
    const nextLesson = course.lessons.find(l => !completedIds.has(l.documentId)) || course.lessons[0];

    return {
      completedCount,
      totalCount,
      percentage,
      nextLessonDocId: nextLesson?.documentId || null,
      isAllCompleted
    };
  }, [course, allProgress]);

  // Average Rating
  const averageRating = useMemo(() => {
    if (!course?.reviews || course.reviews.length === 0) return null;
    const sum = course.reviews.reduce((acc, r) => acc + (Number(r.overallRating) || 0), 0);
    return (sum / course.reviews.length).toFixed(1);
  }, [course]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-16">
        <AnimatedBackground />
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 relative z-10"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-16 text-white">
        <AnimatedBackground />
        <div className="text-center space-y-4 relative z-10">
          <h1 className="text-2xl font-bold">{t('course_detail.course_not_found')}</h1>
          <Link href="/courses" className="inline-block px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-sm font-bold transition-all">
            {t('course_detail.back_to_courses')}
          </Link>
        </div>
      </div>
    );
  }

  const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
  const userObj = userStr ? JSON.parse(userStr) : null;
  const roleType = userObj?.role?.type;
  const isStaff = roleType === 'admin' || roleType === 'content_manager' || roleType === 'instructor';

  return (
    <div className="relative min-h-[calc(100vh-4rem)] pt-12 pb-24 text-slate-100">
      <AnimatedBackground />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 animate-fade-in-up">
        
        {/* Back Link */}
        <Link 
          href="/courses" 
          className="text-emerald-400 hover:text-emerald-300 text-xs sm:text-sm font-bold flex items-center gap-2 inline-flex group transition-all"
        >
          <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>{t('course_detail.back_to_courses')}</span>
        </Link>
        
        {/* Course Hero & Overview Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Course Info (2 Cols) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-slate-950/90 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-2xl shadow-2xl relative overflow-hidden space-y-6">
              <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

              {/* Tags Row */}
              <div className="flex flex-wrap items-center gap-2">
                {course.courseTag ? course.courseTag.split(',').map((tag, i) => (
                  <span key={i} className="px-3 py-1 bg-slate-950/80 text-emerald-400 text-xs font-bold rounded-full border border-emerald-500/20 shadow-sm">
                    #{tag.trim()}
                  </span>
                )) : (
                  <span className="px-3 py-1 bg-slate-950/80 text-emerald-400 text-xs font-bold rounded-full border border-emerald-500/20 shadow-sm">
                    {course.courseType || 'Theory Track'}
                  </span>
                )}

                {averageRating && (
                  <button 
                    onClick={() => setShowReviewsModal(true)}
                    className="px-3 py-1 bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 text-xs font-bold rounded-full border border-amber-500/30 flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <span>⭐ {averageRating}</span>
                    <span className="text-[11px] text-amber-400/80">({course.reviews?.length} {course.reviews?.length === 1 ? 'review' : 'reviews'})</span>
                  </button>
                )}
              </div>

              {/* Title & Author */}
              <div className="space-y-3">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
                  {course.courseTitle}
                </h1>
                
                <div className="flex items-center gap-3 pt-1">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-xs">
                    {(course.courseAuthor?.username || 'L').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">
                      {t('course_detail.by')} <strong className="text-white">{course.courseAuthor?.username || 'Curriculum Instructor'}</strong>
                    </p>
                  </div>
                </div>
              </div>

              {/* Course Meta Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                <div className="bg-slate-950/60 border border-white/5 rounded-2xl p-3 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Lessons</p>
                  <p className="text-lg font-black text-white mt-0.5">{course.lessons?.length || 0} Lessons</p>
                </div>
                <div className="bg-slate-950/60 border border-white/5 rounded-2xl p-3 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Duration</p>
                  <p className="text-lg font-black text-cyan-400 mt-0.5">{formatTotalDuration(course.lessons)}</p>
                </div>
                <div className="bg-slate-950/60 border border-white/5 rounded-2xl p-3 text-center col-span-2 sm:col-span-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Quizzes</p>
                  <p className="text-lg font-black text-purple-400 mt-0.5">{totalQuizzes} Exams</p>
                </div>
              </div>

              {/* Description Markdown */}
              {course.courseDescription && (
                <div className="pt-4 border-t border-white/10">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-2">About this curriculum</h3>
                  <div className="prose prose-invert prose-emerald max-w-none text-xs sm:text-sm text-slate-300 leading-relaxed">
                    <ReactMarkdown>{course.courseDescription}</ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Action Panel (1 Col) */}
          <div className="space-y-6">
            <div className="bg-slate-900/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-6 sticky top-24">
              <h3 className="text-lg font-bold text-white tracking-tight">
                <span>Access</span>
              </h3>

              {!isPublic ? (
                <>
                  {isStaff ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-2xl text-center space-y-1">
                        <p className="text-xs font-bold text-purple-300">Staff Inspection Mode</p>
                        <p className="text-[11px] text-slate-400">You have full staff access to review curriculum lessons.</p>
                      </div>
                      {course.lessons && course.lessons.length > 0 && (
                        <button
                          onClick={() => router.push(`/courses/${course.documentId}/lesson/${course.lessons[0].documentId}`)}
                          className="w-full py-3.5 bg-purple-600 hover:bg-purple-500 text-white text-xs sm:text-sm font-bold rounded-2xl shadow-lg shadow-purple-500/20 transition-all cursor-pointer"
                        >
                          View First Lesson →
                        </button>
                      )}
                    </div>
                  ) : localEnrolled ? (
                    <div className="space-y-5">
                      
                      {/* Enrolled Status Pill */}
                      <div className="flex items-center justify-between p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                        <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                          </svg>
                          <span>{t('course_detail.enrolled')}</span>
                        </div>
                        <span className="text-xs font-mono font-bold text-emerald-300">
                          {progressMetrics.percentage}%
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                          <span>{progressMetrics.completedCount} of {progressMetrics.totalCount} completed</span>
                        </div>
                        <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-white/5">
                          <div 
                            className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-full rounded-full transition-all duration-500" 
                            style={{ width: `${progressMetrics.percentage}%` }}
                          />
                        </div>
                      </div>

                      {/* Resume / Continue Button */}
                      {course.lessons && course.lessons.length > 0 && (
                        <button
                          onClick={() => router.push(`/courses/${course.documentId}/lesson/${progressMetrics.nextLessonDocId}`)}
                          className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold rounded-2xl shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <span>{progressMetrics.isAllCompleted ? 'Review Lessons' : 'Continue Learning'}</span>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                        </button>
                      )}

                      {/* Quizzes Button */}
                      {totalQuizzes > 0 && (
                        <div className="pt-2 border-t border-white/10 space-y-2">
                          <Link 
                            href={`/courses/${course.documentId}/quizzes`}
                            className="w-full py-3 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 text-xs sm:text-sm font-bold rounded-2xl transition-all flex items-center justify-center gap-2"
                          >
                            <span>🛡️ {takenQuizzes >= totalQuizzes ? t('course_detail.retake_quiz') : t('course_detail.take_quiz')}</span>
                          </Link>
                          <p className="text-[11px] text-center text-slate-400 font-mono">
                            {takenQuizzes}/{totalQuizzes} {t('course_detail.quizzes_taken')}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Enroll in this curriculum to access all video lectures, interactive tasks, and anti-cheat evaluations.
                      </p>
                      <button 
                        onClick={handleEnroll} 
                        disabled={enrolling}
                        className={`w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold rounded-2xl shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer ${enrolling ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {enrolling ? (
                          <>
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>{t('course_detail.enrolling')}</span>
                          </>
                        ) : (
                          <>
                            <span>{t('course_detail.enroll_now')}</span>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                            </svg>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-4 text-center p-4 bg-slate-950/60 border border-white/5 rounded-2xl">
                  <p className="text-xs text-slate-300">
                    {t('course_detail.interested')}
                  </p>
                  <Link 
                    href="/login" 
                    className="w-full inline-flex justify-center py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all"
                  >
                    {t('course_detail.login_to_access')}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Course Syllabus / Lessons List */}
        <div className="bg-slate-900/60 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">{t('course_detail.course_lessons')}</h2>
              <p className="text-xs text-slate-400 mt-0.5">Structured learning curriculum with interactive exercises</p>
            </div>
            <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-400">
              {course.lessons?.length || 0} Lessons
            </span>
          </div>

          {!course.lessons || course.lessons.length === 0 ? (
            <div className="p-12 text-center text-slate-500 italic">
              {t('course_detail.no_lessons')}
            </div>
          ) : (
            <div className="space-y-3">
              {course.lessons.map((lesson, idx) => {
                const progress = allProgress.find(p => p.lesson?.documentId === lesson.documentId);
                
                let statusText = t('course_detail.start');
                let buttonStyle = 'bg-emerald-600 hover:bg-emerald-500 text-white';
                let timeLeftText = null;
                
                if (isStaff) {
                  statusText = t('course_detail.view_lesson');
                  buttonStyle = 'bg-white/10 hover:bg-white/20 text-white border border-white/20';
                } else if (progress) {
                  if (progress.completed) {
                    statusText = t('course_detail.start_again');
                    buttonStyle = 'bg-white/10 hover:bg-white/20 text-white border border-white/20';
                  } else if (progress.lastWatchedPosition > 0) {
                    statusText = t('course_detail.resume');
                    buttonStyle = 'bg-cyan-600 hover:bg-cyan-500 text-white';
                    const left = Math.max(0, (lesson.durationInSeconds || 0) - progress.lastWatchedPosition);
                    timeLeftText = `${formatTime(left)} ${t('course_detail.left')}`;
                  }
                }

                return (
                  <div 
                    key={lesson.id} 
                    className={`backdrop-blur-md border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-200 ${
                      isPublic 
                        ? 'bg-slate-950/40 opacity-60 select-none' 
                        : 'bg-slate-950/60 hover:bg-slate-900/90 hover:border-emerald-500/30 shadow-md'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 border ${
                        progress?.completed 
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                          : 'bg-white/5 text-slate-400 border-white/10'
                      }`}>
                        {progress?.completed ? '✓' : idx + 1}
                      </div>
                      
                      <div className="space-y-0.5">
                        <h4 className="text-base sm:text-lg font-bold text-white">
                          {lesson.title || `Lesson ${idx + 1}`}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                          <span>🎬 {formatTime(lesson.durationInSeconds || 0)}</span>
                          {timeLeftText && !isStaff && (
                            <>
                              <span>•</span>
                              <span className="text-cyan-400 font-semibold">{timeLeftText}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {!isPublic && (
                      <div className="flex sm:justify-end shrink-0">
                        <button 
                          disabled={!isStaff && !localEnrolled}
                          onClick={() => router.push(`/courses/${course.documentId}/lesson/${lesson.documentId}`)}
                          className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all w-full sm:w-auto cursor-pointer ${buttonStyle} ${
                            !isStaff && !localEnrolled ? 'opacity-40 cursor-not-allowed' : 'hover:scale-105 shadow-md'
                          }`}
                        >
                          {statusText}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {showReviewsModal && course.reviews && (
        <ReviewsListModal
          courseTitle={course.courseTitle}
          reviews={course.reviews}
          onClose={() => setShowReviewsModal(false)}
        />
      )}
    </div>
  );
}
