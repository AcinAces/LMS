'use client';

import { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AnimatedBackground from '@/components/AnimatedBackground';
import ReviewsListModal from '@/components/ReviewsListModal';

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

export default function CoursesPage() {
  const { t } = useLanguage();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<'all' | 'Theory' | 'Contest'>('all');
  const [sortOption, setSortOption] = useState('newest');
  const [userId, setUserId] = useState<number | null>(null);
  const [userEnrollments, setUserEnrollments] = useState<any[]>([]);
  const [viewingReviews, setViewingReviews] = useState<Course | null>(null);
  const router = useRouter();

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try { setUserId(JSON.parse(userStr).id); } catch (e) {}
    }

    const fetchCourses = async () => {
      try {
        const jwt = localStorage.getItem('jwt');
        const headers: HeadersInit = {};
        if (jwt) headers['Authorization'] = `Bearer ${jwt}`;
        
        let res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/courses?populate[0]=courseAuthor&populate[1]=lessons&populate[2]=reviews&populate[3]=reviews.author`, {
          headers, cache: 'no-store' });

        if (res.status === 401) {
          res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/courses?populate[0]=courseAuthor&populate[1]=lessons&populate[2]=reviews&populate[3]=reviews.author`, { cache: 'no-store' });
        }
        
        if (!res.ok) throw new Error('Failed to fetch');
        
        const data = await res.json();
        setCourses(data.data || []);

        if (jwt) {
          const enrollRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/enrollments`, { headers, cache: 'no-store' });
          if (enrollRes.ok) {
            const enrollData = await enrollRes.json();
            setUserEnrollments(enrollData.data || []);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, [router]);

  // Extract all unique tags dynamically
  const availableTags = useMemo(() => {
    const set = new Set<string>();
    courses.forEach(c => {
      if (c.courseTag) {
        c.courseTag.split(',').forEach(tag => {
          const trimmed = tag.trim();
          if (trimmed) set.add(trimmed);
        });
      }
    });
    return Array.from(set);
  }, [courses]);

  const filteredCourses = useMemo(() => {
    return courses
      .filter(course => {
        // Search query filter
        const matchesQuery = 
          course.courseTitle.toLowerCase().includes(searchQuery.toLowerCase()) || 
          (course.courseTag && course.courseTag.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (course.courseAuthor?.username && course.courseAuthor.username.toLowerCase().includes(searchQuery.toLowerCase()));

        // Type filter (Theory / Contest)
        const matchesType = 
          selectedType === 'all' || 
          (selectedType === 'Theory' && (!course.courseType || course.courseType === 'Theory')) ||
          (selectedType === 'Contest' && course.courseType === 'Contest');

        // Tag filter
        const matchesTag = 
          selectedTag === 'all' || 
          (course.courseTag && course.courseTag.split(',').map(t => t.trim().toLowerCase()).includes(selectedTag.toLowerCase()));

        return matchesQuery && matchesType && matchesTag;
      })
      .sort((a, b) => {
        if (sortOption === 'newest') return b.id - a.id;
        if (sortOption === 'oldest') return a.id - b.id;
        if (sortOption === 'a-z') return a.courseTitle.localeCompare(b.courseTitle);
        if (sortOption === 'z-a') return b.courseTitle.localeCompare(a.courseTitle);
        if (sortOption === 'lessons') return (b.lessons?.length || 0) - (a.lessons?.length || 0);
        return 0;
      });
  }, [courses, searchQuery, selectedType, selectedTag, sortOption]);

  const theoryCount = courses.filter(c => !c.courseType || c.courseType === 'Theory').length;
  const contestCount = courses.filter(c => c.courseType === 'Contest').length;

  const renderCourseCard = (course: Course, index: number) => {
    const isEnrolled = userId ? userEnrollments?.some((e: any) => e.course?.documentId === course.documentId) : false;
    const hasReviews = course.reviews && course.reviews.length > 0;
    const avgRating = hasReviews ? (course.reviews!.reduce((acc, r) => acc + Number(r.overallRating), 0) / course.reviews!.length).toFixed(1) : null;
    const isContest = course.courseType === 'Contest';
    const authorInitial = (course.courseAuthor?.username || 'LMS').charAt(0).toUpperCase();

    return (
      <div 
        key={course.id} 
        className="relative group bg-slate-900/60 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-7 hover:border-emerald-500/50 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-300 flex flex-col justify-between overflow-hidden" 
        style={{ animationDelay: `${(index % 10) * 50}ms` }}
      >
        {/* Subtle Ambient Card Gradient Flare */}
        <div className={`absolute top-0 right-0 w-52 h-52 rounded-full blur-3xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${isContest ? 'bg-amber-500/10' : 'bg-emerald-500/10'}`} />

        <div className="relative z-10 space-y-4">
          
          {/* Top Badges Row */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className={`px-3 py-1 text-xs font-black rounded-lg uppercase tracking-wider border shadow-sm ${
                isContest 
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' 
                  : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
              }`}>
                {isContest ? '🏆 Contest' : '📖 Theory'}
              </span>

              {course.courseTag ? course.courseTag.split(',').slice(0, 2).map((tag, i) => (
                <span key={i} className="px-2.5 py-1 bg-white/5 text-slate-300 text-xs font-semibold rounded-lg border border-white/10">
                  {tag.trim()}
                </span>
              )) : (
                <span className="px-2.5 py-1 bg-white/5 text-slate-400 text-xs font-semibold rounded-lg border border-white/10">
                  {t('home.general')}
                </span>
              )}
            </div>

            {hasReviews && (
              <button 
                onClick={() => setViewingReviews(course)} 
                className="cursor-pointer flex items-center gap-1.5 text-amber-400 text-xs font-bold hover:text-amber-300 transition-all bg-amber-400/10 px-2.5 py-1 rounded-lg border border-amber-400/20 hover:scale-105"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span>{avgRating}</span>
                <span className="text-slate-400 font-normal">({course.reviews!.length})</span>
              </button>
            )}
          </div>
          
          {/* Title */}
          <Link href={`/courses/${course.documentId}`} className="block group/title">
            <h3 className="text-xl sm:text-2xl font-bold text-white group-hover/title:text-emerald-400 transition-colors line-clamp-2 leading-snug">
              {course.courseTitle}
            </h3>
          </Link>
          
          {/* Meta Info Row */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center text-slate-950 font-black text-[11px]">
                {authorInitial}
              </div>
              <span className="font-medium text-slate-300">{course.courseAuthor?.username || 'Acin\'s LMS'}</span>
            </div>

            <span>•</span>

            <div className="flex items-center gap-1.5 text-slate-300">
              <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <span>{course.lessons?.length || 0} {t('home.lessons')}</span>
            </div>

            {isEnrolled && (
              <span className="ml-auto px-2.5 py-0.5 bg-blue-500/15 text-blue-400 text-xs font-bold rounded-md border border-blue-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                {t('courses.enrolled')}
              </span>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-6 border-t border-white/5 mt-6 relative z-10">
          {!userId ? (
            <Link 
              href={`/courses/${course.documentId}`} 
              className="w-full py-3 px-4 flex justify-center items-center gap-2 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-bold rounded-xl transition-all border border-white/10 shadow-md group-hover:border-emerald-500/30"
            >
              <span>{t('courses.view_details')}</span>
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          ) : isEnrolled ? (
            <Link 
              href={`/courses/${course.documentId}`} 
              className="w-full py-3 px-4 flex justify-center items-center gap-2 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm font-bold rounded-xl transition-all shadow-md shadow-emerald-500/10"
            >
              <span>{t('courses.select')}</span>
              <svg className="w-4 h-4 text-emerald-400 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          ) : (
            <Link 
              href={`/courses/${course.documentId}`} 
              className="w-full py-3 px-4 flex justify-center items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold rounded-xl shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all group-hover:scale-101"
            >
              <span>{t('courses.view_course')}</span>
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] pt-16 pb-28">
      <AnimatedBackground />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
        
        {/* Page Hero Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 animate-fade-in-up">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-tight">
            {t('courses.available_courses')}
          </h1>
          
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            Explore curated programming tracks, algorithmic problem solving, and comprehensive video lessons taught by expert engineers.
          </p>

          {/* Type Filter Switcher Tabs */}
          <div className="inline-flex p-1.5 bg-slate-900/80 border border-white/10 rounded-2xl backdrop-blur-xl gap-1 shadow-xl mt-4">
            <button
              onClick={() => setSelectedType('all')}
              className={`px-4 sm:px-6 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                selectedType === 'all'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              All Courses ({courses.length})
            </button>
            <button
              onClick={() => setSelectedType('Theory')}
              className={`px-4 sm:px-6 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                selectedType === 'Theory'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Theory ({theoryCount})
            </button>
            <button
              onClick={() => setSelectedType('Contest')}
              className={`px-4 sm:px-6 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                selectedType === 'Contest'
                  ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Contests ({contestCount})
            </button>
          </div>
        </div>

        {/* Unified Search, Sort & Tag Filter Toolbar */}
        <div className="bg-slate-900/70 border border-white/10 rounded-3xl p-4 sm:p-6 backdrop-blur-2xl shadow-2xl space-y-4 animate-fade-in-up">
          
          <div className="flex flex-col md:flex-row gap-4 items-center">
            {/* Search Input with Clear Button */}
            <div className="relative flex-grow w-full">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input 
                type="text"
                placeholder={t('courses.search_placeholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-10 py-3.5 bg-slate-950/80 border border-white/10 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 text-sm transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            
            {/* Sort Dropdown */}
            <div className="relative w-full md:w-56 shrink-0">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                </svg>
              </div>
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="w-full pl-10 pr-9 py-3.5 appearance-none bg-slate-950/80 border border-white/10 rounded-2xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 cursor-pointer transition-all"
              >
                <option value="newest" className="bg-slate-900">{t('courses.newest_first')}</option>
                <option value="oldest" className="bg-slate-900">{t('courses.oldest_first')}</option>
                <option value="a-z" className="bg-slate-900">{t('courses.title_az')}</option>
                <option value="z-a" className="bg-slate-900">{t('courses.title_za')}</option>
                <option value="lessons" className="bg-slate-900">Most Lessons</option>
              </select>
              <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Quick Tag Pill Filters */}
          {availableTags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/5">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-1">Tags:</span>
              <button
                onClick={() => setSelectedTag('all')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  selectedTag === 'all'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                    : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/5'
                }`}
              >
                All Tags
              </button>
              {availableTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag === selectedTag ? 'all' : tag)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    selectedTag === tag
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                      : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/5'
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Courses Grid Content */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="bg-slate-900/40 border border-white/5 rounded-3xl p-7 space-y-5 h-64 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="h-5 bg-white/10 rounded-lg w-1/3" />
                  <div className="h-7 bg-white/10 rounded-lg w-3/4" />
                  <div className="h-4 bg-white/10 rounded-lg w-1/2" />
                </div>
                <div className="h-10 bg-white/10 rounded-xl w-full" />
              </div>
            ))}
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="text-center py-16 px-6 bg-slate-900/40 backdrop-blur-2xl border border-white/10 rounded-3xl max-w-lg mx-auto space-y-4 shadow-xl">
            <div className="w-16 h-16 bg-slate-800 rounded-2xl mx-auto flex items-center justify-center text-3xl text-slate-400">
              🔍
            </div>
            <h3 className="text-xl font-bold text-white">No courses match your filters</h3>
            <p className="text-slate-400 text-sm">
              {t('courses.no_courses')}
            </p>
            <button
              onClick={() => { setSearchQuery(''); setSelectedTag('all'); setSelectedType('all'); }}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-500/20"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="space-y-8 animate-fade-in-up">
            <div className="flex items-center justify-between text-xs text-slate-400 px-1 font-mono">
              <span>Showing <strong className="text-emerald-400 font-bold">{filteredCourses.length}</strong> of {courses.length} courses</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {filteredCourses.map(renderCourseCard)}
            </div>
          </div>
        )}
      </div>

      {viewingReviews && viewingReviews.reviews && (
        <ReviewsListModal 
          courseTitle={viewingReviews.courseTitle}
          reviews={viewingReviews.reviews}
          onClose={() => setViewingReviews(null)}
        />
      )}
    </div>
  );
}
