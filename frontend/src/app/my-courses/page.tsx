'use client';

import { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AnimatedBackground from '@/components/AnimatedBackground';
import ReviewModal from '@/components/ReviewModal';

interface Course {
  id: number;
  documentId: string;
  courseTitle: string;
  courseTag: string;
  courseType?: string;
  lessons: any[];
  enrollments: any[];
  courseAuthor: any;
  reviews?: any[];
}

export default function MyCoursesPage() {
  const { t } = useLanguage();
  const [courses, setCourses] = useState<Course[]>([]);
  const [progresses, setProgresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'in_progress' | 'completed'>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [reviewingCourse, setReviewingCourse] = useState<Course | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const router = useRouter();

  const fetchMyCourses = async () => {
    try {
      const jwt = localStorage.getItem('jwt');
      const userStr = localStorage.getItem('user');
      if (!jwt || !userStr) {
        router.push('/login');
        return;
      }
      const user = JSON.parse(userStr);
      setCurrentUser(user);

      const headers: HeadersInit = { 'Authorization': `Bearer ${jwt}` };
      
      const coursesRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/courses?populate[0]=courseAuthor&populate[1]=lessons&populate[2]=reviews&populate[3]=reviews.author`, 
        { headers, cache: 'no-store' }
      );
      if (coursesRes.status === 401) {
        localStorage.removeItem('jwt');
        localStorage.removeItem('user');
        router.push('/login');
        return;
      }
      if (!coursesRes.ok) throw new Error('Failed to fetch courses');
      const coursesData = await coursesRes.json();
      const allCourses = coursesData.data || [];

      const enrollRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/enrollments`, { headers, cache: 'no-store' });
      if (!enrollRes.ok) throw new Error('Failed to fetch enrollments');
      const enrollData = await enrollRes.json();
      const myEnrollments = enrollData.data || [];

      const progRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/lesson-progresses?populate[0]=lesson`, { headers, cache: 'no-store' });
      if (!progRes.ok) throw new Error('Failed to fetch progresses');
      const progData = await progRes.json();
      setProgresses(progData.data || []);

      const enrolledCourseIds = new Set(myEnrollments.map((e: any) => e.course?.documentId).filter(Boolean));
      const myCourses = allCourses.filter((c: Course) => enrolledCourseIds.has(c.documentId));

      setCourses(myCourses);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyCourses();
  }, [router]);

  const courseProgressMap = useMemo(() => {
    const map = new Map<string, { completed: number; total: number; percentage: number; isCompleted: boolean; nextLessonDocId: string | null }>();

    courses.forEach(course => {
      const rawLessons = course.lessons || [];
      const total = rawLessons.length;
      if (total === 0) {
        map.set(course.documentId, { completed: 0, total: 0, percentage: 0, isCompleted: false, nextLessonDocId: null });
        return;
      }

      const lessonDocIds = new Set(rawLessons.map(l => l.documentId));
      const completedProgresses = progresses.filter(p => p.lesson && lessonDocIds.has(p.lesson.documentId) && p.completed);
      const completedCount = completedProgresses.length;
      const percentage = total > 0 ? Math.round((completedCount / total) * 100) : 0;
      const isCompleted = total > 0 && completedCount >= total;

      const completedIds = new Set(completedProgresses.map(p => p.lesson.documentId));
      const nextLesson = rawLessons.find(l => !completedIds.has(l.documentId)) || rawLessons[0];

      map.set(course.documentId, {
        completed: completedCount,
        total,
        percentage,
        isCompleted,
        nextLessonDocId: nextLesson?.documentId || null
      });
    });

    return map;
  }, [courses, progresses]);

  // Overall Statistics
  const overallStats = useMemo(() => {
    const totalEnrolled = courses.length;
    let completedCourses = 0;
    let inProgressCourses = 0;
    let totalCompletedLessons = 0;
    let totalLessonsCount = 0;

    courses.forEach(c => {
      const prog = courseProgressMap.get(c.documentId);
      if (prog) {
        if (prog.isCompleted) completedCourses++;
        else inProgressCourses++;
        totalCompletedLessons += prog.completed;
        totalLessonsCount += prog.total;
      }
    });

    const overallPercentage = totalLessonsCount > 0 
      ? Math.round((totalCompletedLessons / totalLessonsCount) * 100) 
      : 0;

    return {
      totalEnrolled,
      completedCourses,
      inProgressCourses,
      totalCompletedLessons,
      totalLessonsCount,
      overallPercentage
    };
  }, [courses, courseProgressMap]);

  // All Unique Tags for tag filter
  const allTags = useMemo(() => {
    const set = new Set<string>();
    courses.forEach(c => {
      if (c.courseTag) {
        c.courseTag.split(',').forEach(t => {
          const trimmed = t.trim();
          if (trimmed) set.add(trimmed);
        });
      }
    });
    return Array.from(set);
  }, [courses]);

  // Filtered Courses
  const filteredCourses = useMemo(() => {
    return courses.filter(course => {
      // Search matching
      const matchesSearch = 
        course.courseTitle.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (course.courseTag && course.courseTag.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      // Status matching
      const prog = courseProgressMap.get(course.documentId);
      if (statusFilter === 'completed' && !prog?.isCompleted) return false;
      if (statusFilter === 'in_progress' && prog?.isCompleted) return false;

      // Tag matching
      if (selectedTag !== 'all') {
        const courseTags = course.courseTag ? course.courseTag.split(',').map(t => t.trim().toLowerCase()) : [];
        if (!courseTags.includes(selectedTag.toLowerCase())) return false;
      }

      return true;
    });
  }, [courses, searchQuery, statusFilter, selectedTag, courseProgressMap]);

  return (
    <div className="relative min-h-[calc(100vh-4rem)] pt-12 pb-24 text-slate-100">
      <AnimatedBackground />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 animate-fade-in-up">
        
        {/* Header & Quick Progress Summary Banner */}
        <div className="bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-slate-950/90 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-2xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div className="flex items-start gap-4 sm:gap-5">
              {currentUser?.avatar ? (
                <img 
                  src={currentUser.avatar} 
                  alt={currentUser.username || 'Student'} 
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl object-cover border-2 border-emerald-500/40 shadow-xl shadow-emerald-500/10 shrink-0" 
                />
              ) : (
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center text-slate-950 font-black text-2xl shadow-xl shadow-emerald-500/20 shrink-0">
                  {currentUser?.username ? currentUser.username.charAt(0).toUpperCase() : 'S'}
                </div>
              )}

              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {t('dashboard.student_hub')}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    {currentUser?.username ? `@${currentUser.username}` : 'Enrolled Student'}
                  </span>
                </div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
                  {t('dashboard.my_courses')}
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
                  {t('dashboard.subtitle')}
                </p>
              </div>
            </div>

            {/* Quick Action Button */}
            <div className="flex items-center gap-3">
              <Link 
                href="/courses" 
                className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold rounded-2xl shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all transform hover:-translate-y-0.5 flex items-center gap-2 cursor-pointer"
              >
                <span>+ {t('dashboard.browse_courses')}</span>
              </Link>
            </div>
          </div>

          {/* Quick Metrics Row */}
          {!loading && courses.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-8 pt-6 border-t border-white/10 relative z-10">
              <div className="bg-slate-950/60 border border-white/5 rounded-2xl p-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{t('dashboard.total_enrolled')}</p>
                <p className="text-2xl font-black text-white mt-1">{overallStats.totalEnrolled}</p>
              </div>
              <div className="bg-slate-950/60 border border-white/5 rounded-2xl p-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-cyan-400">{t('dashboard.in_progress')}</p>
                <p className="text-2xl font-black text-cyan-400 mt-1">{overallStats.inProgressCourses}</p>
              </div>
              <div className="bg-slate-950/60 border border-white/5 rounded-2xl p-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">{t('dashboard.completed_count')}</p>
                <p className="text-2xl font-black text-emerald-400 mt-1">{overallStats.completedCourses}</p>
              </div>
              <div className="bg-slate-950/60 border border-white/5 rounded-2xl p-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-purple-400">{t('dashboard.overall_progress')}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-2xl font-black text-purple-400">{overallStats.overallPercentage}%</span>
                  <div className="flex-1 bg-white/10 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-emerald-400 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${overallStats.overallPercentage}%` }} 
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Filter Controls & Search Bar */}
        <div className="bg-slate-900/60 backdrop-blur-2xl border border-white/10 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Status Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 rounded-2xl border border-white/5 shrink-0 overflow-x-auto">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                  statusFilter === 'all'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                {t('dashboard.all_tab_count', { count: courses.length })}
              </button>
              <button
                onClick={() => setStatusFilter('in_progress')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                  statusFilter === 'in_progress'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                {t('dashboard.in_progress_tab_count', { count: overallStats.inProgressCourses })}
              </button>
              <button
                onClick={() => setStatusFilter('completed')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                  statusFilter === 'completed'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                {t('dashboard.completed_tab_count', { count: overallStats.completedCourses })}
              </button>
            </div>

            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input 
                type="text"
                placeholder={t("dashboard.search_my_courses")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-9 py-2.5 bg-slate-950/80 border border-white/10 rounded-2xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Dynamic Tags Filter Carousel */}
          {allTags.length > 0 && (
            <div className="flex items-center gap-2 pt-2 overflow-x-auto pb-1 text-xs custom-scrollbar">
              <span className="text-slate-400 font-bold shrink-0">{t('courses.tags_label')}</span>
              <button
                onClick={() => setSelectedTag('all')}
                className={`px-3 py-1 rounded-xl font-semibold transition-all shrink-0 cursor-pointer ${
                  selectedTag === 'all'
                    ? 'bg-white/15 text-white border border-white/30'
                    : 'bg-white/5 text-slate-400 hover:text-slate-200 border border-white/5'
                }`}
              >
                {t('dashboard.all_tag')}
              </button>
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`px-3 py-1 rounded-xl font-semibold transition-all shrink-0 cursor-pointer ${
                    selectedTag === tag
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-white/5 text-slate-400 hover:text-slate-200 border border-white/5'
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Course Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-slate-900/60 border border-white/10 rounded-3xl p-6 animate-pulse space-y-4">
                <div className="h-6 w-24 bg-white/10 rounded-full" />
                <div className="h-8 w-3/4 bg-white/10 rounded-xl" />
                <div className="h-4 w-1/2 bg-white/5 rounded-lg" />
                <div className="h-2 w-full bg-white/5 rounded-full mt-4" />
                <div className="h-10 w-full bg-white/10 rounded-xl mt-6" />
              </div>
            ))}
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="bg-slate-900/60 backdrop-blur-2xl border border-white/10 rounded-3xl p-12 text-center space-y-4 max-w-xl mx-auto shadow-2xl">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto text-2xl shadow-lg shadow-emerald-500/10">
              📚
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight">
              {searchQuery || selectedTag !== 'all' || statusFilter !== 'all' 
                ? t('dashboard.no_matching_enrolled')
                : t("dashboard.not_enrolled")}
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto leading-relaxed">
              {searchQuery || selectedTag !== 'all' || statusFilter !== 'all'
                ? t('dashboard.adjust_filters_hint')
                : 'Explore our catalog of programming curricula, hands-on labs, and competitive contests.'}
            </p>
            <div className="pt-2">
              <Link 
                href="/courses" 
                className="inline-flex px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold rounded-2xl shadow-lg shadow-emerald-500/20 transition-all hover:scale-105"
              >
                {t('dashboard.browse_courses')} →
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map(course => {
              const prog = courseProgressMap.get(course.documentId) || { completed: 0, total: 0, percentage: 0, isCompleted: false, nextLessonDocId: null };
              const userReview = course.reviews?.find(r => r.authorId === currentUser?.id || r.author?.id === currentUser?.id || r.author === currentUser?.id);

              return (
                <div 
                  key={course.id} 
                  className="bg-slate-900/70 hover:bg-slate-900/90 backdrop-blur-2xl border border-white/10 hover:border-emerald-500/40 rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl flex flex-col justify-between group relative overflow-hidden"
                >
                  {/* Subtle Card Ambient Glow */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors pointer-events-none" />

                  <div className="space-y-4 relative z-10">
                    
                    {/* Tags & Status Row */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex flex-wrap gap-1.5">
                        {course.courseTag ? course.courseTag.split(',').slice(0, 2).map((tag, i) => (
                          <span key={i} className="px-2.5 py-0.5 bg-slate-950/80 text-emerald-400 text-[11px] font-bold rounded-full border border-emerald-500/20">
                            #{tag.trim()}
                          </span>
                        )) : (
                          <span className="px-2.5 py-0.5 bg-slate-950/80 text-emerald-400 text-[11px] font-bold rounded-full border border-emerald-500/20">
                            {course.courseType || 'Curriculum'}
                          </span>
                        )}
                      </div>

                      {prog.isCompleted ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                          <svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                          </svg>
                          <span>{t('review.completed')}</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                          {t('dashboard.percent_done', { percent: prog.percentage })}
                        </span>
                      )}
                    </div>

                    {/* Course Title */}
                    <Link href={`/courses/${course.documentId}`}>
                      <h3 className="text-xl font-bold text-white group-hover:text-emerald-300 transition-colors leading-snug line-clamp-2">
                        {course.courseTitle}
                      </h3>
                    </Link>

                    {/* Author & Lesson Metadata */}
                    <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-[10px]">
                          {(course.courseAuthor?.username || 'L').charAt(0).toUpperCase()}
                        </div>
                        <span className="truncate max-w-[110px]">{course.courseAuthor?.username || 'Instructor'}</span>
                      </div>
                      <span className="font-mono">{prog.total} {t('dashboard.lessons_label')}</span>
                    </div>

                    {/* Progress Bar Component */}
                    <div className="space-y-2 pt-2">
                      <div className="flex justify-between items-center text-[11px] text-slate-400 font-mono">
                        <span>{t('dashboard.lessons_progress_count', { completed: prog.completed, total: prog.total })}</span>
                        <span className="font-bold text-white">{prog.percentage}%</span>
                      </div>
                      <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-white/5">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            prog.isCompleted 
                              ? 'bg-gradient-to-r from-emerald-500 to-teal-400' 
                              : 'bg-gradient-to-r from-cyan-500 to-emerald-400'
                          }`}
                          style={{ width: `${prog.percentage}%` }}
                        />
                      </div>
                    </div>

                    {/* Reviews / Feedback Badge for Completed Courses */}
                    {prog.isCompleted && (
                      <div className="pt-2 flex items-center justify-between gap-2 border-t border-white/5">
                        {!userReview ? (
                          <button
                            onClick={() => setReviewingCourse(course)}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-sm transition-all hover:scale-105 cursor-pointer flex items-center gap-1.5"
                          >
                            <span>⭐ {t('dashboard.share_feedback')}</span>
                          </button>
                        ) : (
                          <div className="flex items-center gap-1 text-xs text-slate-400 bg-white/5 px-2.5 py-1 rounded-lg border border-white/10">
                            <span>{t('dashboard.rated_label')}</span>
                            <strong className="text-emerald-400 font-mono">{Number(userReview.overallRating).toFixed(1)}/5 ⭐</strong>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Card Bottom CTA Actions */}
                  <div className="pt-6 relative z-10 flex items-center gap-2">
                    <Link
                      href={prog.nextLessonDocId ? `/courses/${course.documentId}/lesson/${prog.nextLessonDocId}` : `/courses/${course.documentId}`}
                      className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold rounded-2xl shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>{prog.isCompleted ? t('dashboard.review_course_btn') : t('dashboard.continue_learning_btn')}</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </Link>

                    <Link
                      href={`/courses/${course.documentId}`}
                      className="p-3 bg-slate-950/80 hover:bg-slate-800 text-slate-400 hover:text-white rounded-2xl border border-white/10 transition-colors"
                      title="Course Details"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {reviewingCourse && (
        <ReviewModal 
          courseId={reviewingCourse.documentId} 
          courseTitle={reviewingCourse.courseTitle}
          onClose={() => setReviewingCourse(null)}
          onSuccess={() => {
            setReviewingCourse(null);
            fetchMyCourses();
          }}
        />
      )}
    </div>
  );
}
