'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import AnimatedBackground from '@/components/AnimatedBackground';
import CustomVideoPlayer from '@/components/CustomVideoPlayer';
import LessonChat from '@/components/LessonChat';
import ReactMarkdown from 'react-markdown';
import { useLanguage } from '@/i18n/LanguageContext';

interface Lesson {
  id: number;
  documentId: string;
  title: string;
  description: string;
  videoUrl: string;
  youtubeVideoId: string;
  durationInSeconds: number;
  content: string;
  order: number;
  isPreview: boolean;
}

interface Course {
  documentId: string;
  courseTitle: string;
  courseTag?: string;
  lessons: Lesson[];
}

export default function LessonPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useLanguage();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const videoPlayerRef = useRef<any>(null);
  const [progress, setProgress] = useState<any>(null);
  const [allProgress, setAllProgress] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isStaff, setIsStaff] = useState(false);
  const [isCourseAuthor, setIsCourseAuthor] = useState(false);
  const [isStudent, setIsStudent] = useState(false);
  const [markingComplete, setMarkingComplete] = useState(false);

  // Sync ref
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSyncedData = useRef<{ lastWatched: number, maxWatched: number, completed: boolean } | null>(null);

  useEffect(() => {
    const fetchLessonData = async () => {
      try {
        const jwt = localStorage.getItem('jwt');
        if (!jwt) {
          router.push('/login');
          return;
        }

        const userStr = localStorage.getItem('user');
        const currentUser = userStr ? JSON.parse(userStr) : null;
        const roleType = currentUser?.role?.type;
        const staff = roleType === 'admin' || roleType === 'content_manager' || roleType === 'instructor';
        const student = roleType === 'authenticated';
        setIsStaff(staff);
        setIsStudent(student);

        const headers = { 'Authorization': `Bearer ${jwt}` };

        // 1. Fetch the course with lessons and courseAuthor populated
        const courseRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/courses/${params.id}?populate[0]=lessons&populate[1]=courseAuthor`, 
          { headers }
        );
        if (!courseRes.ok) throw new Error('Failed to fetch course');
        const courseData = await courseRes.json();
        setCourse(courseData.data);

        // Verify if current user is the actual author of this course
        const authorId = courseData.data?.courseAuthor?.id;
        const authorDocId = courseData.data?.courseAuthor?.documentId;
        const isAuthor = roleType === 'instructor' && (
          (authorId && currentUser?.id === authorId) ||
          (authorDocId && currentUser?.documentId === authorDocId) ||
          (courseData.data?.courseAuthor?.username && currentUser?.username === courseData.data?.courseAuthor?.username)
        );
        setIsCourseAuthor(isAuthor);

        // Find the current lesson in the course
        const lesson = courseData.data?.lessons?.find((l: any) => l.documentId === params.lessonId);
        if (!lesson) throw new Error('Lesson not found');
        setCurrentLesson(lesson);

        // 2. Fetch the user's progress for this course's lessons (if student)
        if (!staff) {
          const progRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/lesson-progresses?populate[0]=lesson`, { headers });
          if (progRes.ok) {
            const progData = await progRes.json();
            setAllProgress(progData.data || []);
            
            const thisLessonProgress = progData.data?.find((p: any) => p.lesson?.documentId === params.lessonId);
            if (thisLessonProgress) {
              setProgress(thisLessonProgress);
            } else {
              setProgress({ lastWatchedPosition: 0, maxWatchedPosition: 0, completed: false });
            }
          }
        } else {
          setProgress({ lastWatchedPosition: 0, maxWatchedPosition: 0, completed: false });
        }

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchLessonData();
  }, [params.id, params.lessonId, router]);

  const handleProgressSync = useCallback((lastWatched: number, maxWatched: number, completed: boolean, duration: number) => {
    const jwt = localStorage.getItem('jwt');
    
    // Duration sync
    if (duration > 0 && (!currentLesson?.durationInSeconds || currentLesson.durationInSeconds === 0)) {
      if (jwt) {
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/lessons/${params.lessonId}/duration`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${jwt}`
          },
          body: JSON.stringify({ durationInSeconds: Math.floor(duration) })
        }).catch(console.error);
      }
      
      if (currentLesson) {
        setCurrentLesson({ ...currentLesson, durationInSeconds: Math.floor(duration) });
      }
    }

    if (isStaff) return;
    if (!jwt) return;

    setProgress((prev: any) => ({
      ...prev,
      lastWatchedPosition: Math.floor(lastWatched),
      maxWatchedPosition: Math.max(prev?.maxWatchedPosition || 0, Math.floor(maxWatched)),
      completed: completed || prev?.completed || false
    }));

    if (completed) {
      setAllProgress((prev: any[]) => {
        const index = prev.findIndex((p: any) => p.lesson?.documentId === params.lessonId);
        const updatedItem = {
          lesson: { documentId: params.lessonId },
          lastWatchedPosition: Math.floor(lastWatched),
          maxWatchedPosition: Math.max(index >= 0 ? prev[index].maxWatchedPosition || 0 : 0, Math.floor(maxWatched)),
          completed: true
        };
        if (index >= 0) {
          const copy = [...prev];
          copy[index] = { ...copy[index], ...updatedItem };
          return copy;
        } else {
          return [...prev, updatedItem];
        }
      });
    }

    const hasCompletedChanged = !lastSyncedData.current?.completed && completed;
    
    if (syncTimeoutRef.current && !hasCompletedChanged) {
      return;
    }

    if (syncTimeoutRef.current && hasCompletedChanged) {
      clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = null;
    }

    lastSyncedData.current = { lastWatched, maxWatched, completed };

    const syncToBackend = async () => {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/lesson-progresses/sync`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${jwt}`
          },
          body: JSON.stringify({
            lessonDocumentId: params.lessonId,
            lastWatchedPosition: Math.floor(lastWatched),
            maxWatchedPosition: Math.floor(maxWatched),
            completed
          })
        });
      } catch (err) {
        console.error('Failed to sync progress:', err);
      } finally {
        syncTimeoutRef.current = null;
      }
    };

    if (hasCompletedChanged) {
      syncToBackend();
    } else {
      syncTimeoutRef.current = setTimeout(syncToBackend, 3000);
    }
  }, [params.lessonId, isStaff, currentLesson]);

  const handleManualComplete = async () => {
    const jwt = localStorage.getItem('jwt');
    if (!jwt || isStaff || !currentLesson) return;

    setMarkingComplete(true);
    const maxPos = currentLesson.durationInSeconds || progress?.maxWatchedPosition || 0;

    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/lesson-progresses/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwt}`
        },
        body: JSON.stringify({
          lessonDocumentId: params.lessonId,
          lastWatchedPosition: Math.floor(progress?.lastWatchedPosition || maxPos),
          maxWatchedPosition: Math.floor(maxPos),
          completed: true
        })
      });

      setProgress((prev: any) => ({ ...prev, completed: true }));
      setAllProgress((prev: any[]) => {
        const index = prev.findIndex((p: any) => p.lesson?.documentId === params.lessonId);
        const updatedItem = {
          lesson: { documentId: params.lessonId },
          lastWatchedPosition: Math.floor(maxPos),
          maxWatchedPosition: Math.floor(maxPos),
          completed: true
        };
        if (index >= 0) {
          const copy = [...prev];
          copy[index] = { ...copy[index], ...updatedItem };
          return copy;
        } else {
          return [...prev, updatedItem];
        }
      });
    } catch (err) {
      console.error('Failed to mark lesson complete:', err);
    } finally {
      setMarkingComplete(false);
    }
  };

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0m 0s';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}m ${s}s`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-16">
        <AnimatedBackground />
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 relative z-10"></div>
      </div>
    );
  }

  if (!course || !currentLesson) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-16 text-white">
        <AnimatedBackground />
        <div className="text-center space-y-4 relative z-10">
          <h1 className="text-2xl font-bold">{t('lesson.lesson_not_found')}</h1>
          <Link href="/courses" className="inline-block px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-sm font-bold transition-all">
            {t('course_detail.back_to_courses')}
          </Link>
        </div>
      </div>
    );
  }

  // Calculate next and previous lessons
  const currentIndex = course.lessons.findIndex(l => l.documentId === currentLesson.documentId);
  const prevLesson = currentIndex > 0 ? course.lessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < course.lessons.length - 1 ? course.lessons[currentIndex + 1] : null;

  // Calculate course completion
  const totalLessons = course.lessons.length;
  const completedLessons = course.lessons.filter(l => 
    allProgress.some(p => p.lesson?.documentId === l.documentId && p.completed)
  ).length;
  const completionPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  return (
    <div className="relative min-h-[calc(100vh-4rem)] pt-12 pb-24 text-slate-100">
      <AnimatedBackground />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 animate-fade-in-up">
        
        {/* Top Header & Breadcrumbs Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:px-6 shadow-xl">
          <Link 
            href={`/courses/${course.documentId}`} 
            className="text-emerald-400 hover:text-emerald-300 text-xs sm:text-sm font-bold flex items-center gap-2 group transition-all"
          >
            <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="truncate max-w-[280px] sm:max-w-md">
              {t('lesson.back_to')} {course.courseTitle}
            </span>
          </Link>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-mono font-bold text-slate-300">
              Lesson {currentIndex + 1} of {totalLessons}
            </span>
            {progress?.completed && (
              <span className="px-3 py-1 bg-emerald-500/15 border border-emerald-500/30 rounded-full text-xs font-bold text-emerald-400 flex items-center gap-1.5 shadow-sm">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                </svg>
                <span>{t('lesson.completed')}</span>
              </span>
            )}
          </div>
        </div>

        {/* Main Grid: Video Player + Sidebar Playlist */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Cinema & Video Content Area (2 Cols) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Video Theater Card */}
            <div className="bg-slate-900/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

              {/* Lesson Title & Metadata */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10 border-b border-white/10 pb-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-snug">
                    {currentLesson.title}
                  </h1>
                  <p className="text-xs text-slate-400 font-mono mt-1 flex items-center gap-2">
                    <span>🎬 Duration: {formatTime(currentLesson.durationInSeconds || 0)}</span>
                    {isStaff && (
                      <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-bold">
                        Staff Inspection
                      </span>
                    )}
                  </p>
                </div>
              </div>
              
              {/* Custom Video Player Container */}
              <div className="w-full rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-black">
                {progress && currentLesson.youtubeVideoId ? (
                  <CustomVideoPlayer
                    ref={videoPlayerRef}
                    videoId={currentLesson.youtubeVideoId}
                    initialLastWatched={progress.lastWatchedPosition || 0}
                    initialMaxWatched={progress.maxWatchedPosition || 0}
                    isCompleted={progress.completed || false}
                    onProgressSync={handleProgressSync}
                    isStaff={isStaff}
                  />
                ) : (
                  <div className="w-full aspect-video bg-slate-950 flex flex-col items-center justify-center space-y-2">
                    <span className="text-3xl">🎬</span>
                    <span className="text-xs text-slate-500 font-mono">{t('lesson.no_video')}</span>
                  </div>
                )}
              </div>

              {/* Next/Prev Navigation & Mark Complete Controls */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div>
                  {prevLesson ? (
                    <Link 
                      href={`/courses/${course.documentId}/lesson/${prevLesson.documentId}`}
                      className="px-5 py-2.5 bg-slate-950/80 hover:bg-slate-800 text-slate-300 hover:text-white font-bold text-xs sm:text-sm rounded-xl transition-all border border-white/10 flex items-center gap-2 cursor-pointer"
                    >
                      <span>← {t('lesson.previous')}</span>
                    </Link>
                  ) : <div />}
                </div>

                <div className="flex items-center gap-3">
                  {!isStaff && !progress?.completed && (
                    <button
                      onClick={handleManualComplete}
                      disabled={markingComplete}
                      className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs sm:text-sm font-bold rounded-xl border border-white/10 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{markingComplete ? 'Saving...' : 'Mark as Complete'}</span>
                    </button>
                  )}

                  {nextLesson ? (
                    <Link 
                      href={`/courses/${course.documentId}/lesson/${nextLesson.documentId}`}
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all flex items-center gap-2 cursor-pointer transform hover:scale-105"
                    >
                      <span>{t('lesson.next')} →</span>
                    </Link>
                  ) : (
                    <Link
                      href={`/courses/${course.documentId}`}
                      className={`px-6 py-2.5 ${isStaff ? 'bg-white/10 hover:bg-white/20' : 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400'} text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 cursor-pointer`}
                    >
                      <span>{isStaff ? 'Back to Course ↑' : 'Finish Course 🎉'}</span>
                    </Link>
                  )}
                </div>
              </div>
            </div>

            {/* Lesson Content / Notes Markdown Card */}
            {currentLesson.content && (
              <div className="bg-slate-900/60 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-xl space-y-4">
                <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                  <span className="text-emerald-400">📖</span>
                  <h3 className="text-base font-bold uppercase tracking-wider text-white">
                    {t('lesson.reading_material')}
                  </h3>
                </div>
                <div className="prose prose-invert prose-emerald max-w-none text-xs sm:text-sm text-slate-300 leading-relaxed">
                  <ReactMarkdown>{currentLesson.content}</ReactMarkdown>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Playlist & Course Progress (1 Col) */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-slate-900/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-2xl space-y-6 sticky top-24">
              
              {/* Progress Summary */}
              {!isStaff && (
                <div className="space-y-3 pb-6 border-b border-white/10">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      {t('lesson.course_progress')}
                    </span>
                    <span className="text-emerald-400 font-mono font-black text-base">
                      {completionPercentage}%
                    </span>
                  </div>

                  <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-white/5">
                    <div 
                      className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full transition-all duration-700"
                      style={{ width: `${completionPercentage}%` }}
                    />
                  </div>

                  <div className="text-[11px] text-center text-slate-400 font-mono">
                    {completedLessons} of {totalLessons} {t('lesson.completed')}
                  </div>
                </div>
              )}

              {/* Playlist Title */}
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                  <span>Course Curriculum</span>
                </h3>
                <span className="text-[11px] font-mono text-slate-500">{totalLessons} lessons</span>
              </div>
              
              {/* Lesson Items Scrollable Container */}
              <div className="space-y-2.5 max-h-[520px] overflow-y-auto custom-scrollbar pr-1">
                {course.lessons.map((lesson: any, idx: number) => {
                  const isCurrent = lesson.documentId === currentLesson.documentId;
                  const lessonProgress = allProgress.find(p => p.lesson?.documentId === lesson.documentId);
                  const isCompleted = lessonProgress?.completed;
                  
                  const maxWatched = lessonProgress?.maxWatchedPosition || 0;
                  const totalDuration = lesson.durationInSeconds || 0;
                  const timeRemaining = Math.max(0, totalDuration - maxWatched);

                  return (
                    <Link 
                      key={lesson.id}
                      href={`/courses/${course.documentId}/lesson/${lesson.documentId}`}
                      className={`block p-3.5 rounded-2xl border transition-all cursor-pointer ${
                        isCurrent 
                          ? 'bg-emerald-500/15 border-emerald-500/50 shadow-md shadow-emerald-500/10' 
                          : 'bg-slate-950/60 border-white/5 hover:bg-slate-800/80 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold border ${
                          isCompleted 
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                            : isCurrent
                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                            : 'bg-white/5 text-slate-500 border-white/10'
                        }`}>
                          {isCompleted ? '✓' : idx + 1}
                        </div>

                        <div className="flex-1 min-w-0 space-y-0.5">
                          <p className={`font-bold text-xs leading-snug line-clamp-2 ${
                            isCurrent ? 'text-emerald-300' : 'text-slate-200'
                          }`}>
                            {lesson.title}
                          </p>
                          
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                            <span>{formatTime(lesson.durationInSeconds || 0)}</span>
                            {!isCompleted && maxWatched > 0 && (
                              <>
                                <span>•</span>
                                <span className="text-cyan-400">{Math.floor(timeRemaining / 60)}m left</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

        </div>

        {/* 1-to-1 Lesson Q&A / Author Chat */}
        {(isCourseAuthor || isStudent) && (
          <div className="pt-6">
            <LessonChat 
              lessonId={currentLesson.documentId} 
              courseId={course.documentId} 
              lessonTitle={currentLesson.title}
              lessonOrder={currentLesson.order}
              isAuthor={isCourseAuthor} 
            />
          </div>
        )}
      </div>
    </div>
  );
}
