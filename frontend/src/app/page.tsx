import { cookies } from 'next/headers';
import { getDictionary, Locale } from '@/i18n/dictionaries';
import AnimatedBackground from '@/components/AnimatedBackground';
import Link from 'next/link';
import StatCounters from '@/components/StatCounters';
import HeroGreeting from '@/components/HeroGreeting';
import MiniCodingGame from '@/components/MiniCodingGame';
import FeatureBento from '@/components/FeatureBento';

async function getFeaturedCourses() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/courses?filters[isFeatured][$eq]=true&populate[0]=courseAuthor&populate[1]=lessons`, {
      next: { revalidate: 60 }
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.data || [];
  } catch (error) {
    console.error("Failed to fetch featured courses:", error);
    return [];
  }
}

async function getSiteStats() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/site-stats`, {
      next: { revalidate: 60 }
    });
    if (!res.ok) return { studentCount: 0 };
    return await res.json();
  } catch (error) {
    console.error("Failed to fetch site stats:", error);
    return { studentCount: 0 };
  }
}

export default async function Home() {
  const cookieStore = await cookies();
  const locale = (cookieStore.get('NEXT_LOCALE')?.value as Locale) || 'bn';
  const dict = await getDictionary(locale);
  const featuredCourses = await getFeaturedCourses();
  const siteStats = await getSiteStats();
  
  const studentCount = siteStats.studentCount || 0;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center overflow-hidden pt-12 pb-20 px-4 sm:px-6 lg:px-8">
        <AnimatedBackground />
        
        {/* Ambient Glow orbs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-emerald-500/20 blur-[130px] rounded-full pointer-events-none animate-pulse-glow" />

        <div className="relative z-10 max-w-5xl mx-auto text-center mt-8 animate-fade-in-up space-y-4">
          
          {/* Animated SVG Glowing Logo */}
          <div className="flex justify-center mb-6">
            <svg width="400" height="90" viewBox="0 0 400 90" className="drop-shadow-[0_0_35px_rgba(52,211,153,0.4)] hover:scale-105 transition-transform duration-300">
              <defs>
                <linearGradient id="heroGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#34d399" />
                  <stop offset="50%" stopColor="#2dd4bf" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="2.5" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>
              
              {/* Dimmed Shadow Under Text */}
              <text 
                x="50%" 
                y="54%" 
                dominantBaseline="middle" 
                textAnchor="middle" 
                fill="#000000" 
                fillOpacity="0.7"
                fontFamily="monospace" 
                fontSize="58" 
                fontWeight="900"
                letterSpacing="4"
                style={{ filter: 'blur(4px)' }}
              >
                &lt;/&gt;$&lt;/&gt;
              </text>
              
              {/* Main Glowing SVG Text */}
              <text 
                x="50%" 
                y="52%" 
                dominantBaseline="middle" 
                textAnchor="middle" 
                fill="url(#heroGradient)" 
                fontFamily="monospace" 
                fontSize="58" 
                fontWeight="900"
                letterSpacing="4"
                filter="url(#glow)"
              >
                &lt;/&gt;$&lt;/&gt;
              </text>
            </svg>
          </div>

          {/* Dynamic Hero Greeting (Authorized vs Public) */}
          <HeroGreeting />

          {/* Simple Interactive Mini Programming Game */}
          <MiniCodingGame />
        </div>
      </section>

      {/* Feature Bento Grid Section */}
      <FeatureBento />

      {/* Featured Courses Section */}
      <section id="featured-courses" className="relative py-24 px-4 sm:px-6 lg:px-8 bg-slate-950/60 border-t border-white/5">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-4 max-w-3xl mx-auto animate-fade-in-up">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
              {dict.home.featured_title}
            </h2>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              {dict.home.featured_subtitle}
            </p>
          </div>

          {featuredCourses.length === 0 ? (
            <div className="text-center p-12 bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-3xl max-w-md mx-auto">
              <p className="text-slate-400 text-base">{dict.home.no_courses}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredCourses.map((course: any, index: number) => (
                <div 
                  key={course.id} 
                  className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-7 hover:border-emerald-500/40 hover:-translate-y-1.5 hover:shadow-2xl transition-all duration-300 group flex flex-col justify-between relative overflow-hidden" 
                  style={{ animationDelay: `${(index % 10) * 50}ms` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                  <div className="relative z-10">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                      <div className="flex flex-wrap gap-1.5">
                        {course.courseTag ? course.courseTag.split(',').map((t: string, i: number) => (
                          <span key={i} className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-bold rounded-lg border border-emerald-500/20">{t.trim()}</span>
                        )) : (
                          <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-bold rounded-lg border border-emerald-500/20">{dict.home.general}</span>
                        )}
                      </div>
                      <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-white/5 text-slate-400 font-mono">
                        {course.courseType || 'Course'}
                      </span>
                    </div>
                    
                    <h3 className="text-xl sm:text-2xl font-bold text-slate-100 mb-3 group-hover:text-emerald-300 transition-colors line-clamp-2 leading-snug">
                      {course.courseTitle}
                    </h3>
                    
                    <div className="flex items-center gap-4 text-xs text-slate-400 mb-6 font-medium">
                      <div className="flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        <span>{dict.home.by} {course.courseAuthor?.username || 'LMS'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                        <span>{course.lessons?.length || 0} {dict.home.lessons}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/5 mt-auto relative z-10">
                    <Link 
                      href={`/courses/${course.documentId}`} 
                      className="w-full py-3 flex justify-center items-center gap-2 bg-slate-800 hover:bg-emerald-600 text-slate-200 hover:text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-md group-hover:shadow-emerald-500/20"
                    >
                      <span>{dict.home.view_details}</span>
                      <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </Link>
                  </div>
                  
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Site Stats Section */}
      <section className="relative py-24 px-4 sm:px-6 lg:px-8 bg-slate-950 border-t border-white/5 overflow-hidden">
        {/* Glow orb */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-blue-500/10 blur-[140px] rounded-full pointer-events-none" />
        
        <div className="relative z-10 max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-4 max-w-3xl mx-auto animate-fade-in-up">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
              {dict.home.stats_title}
            </h2>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              {dict.home.stats_subtitle}
            </p>
          </div>
          
          <StatCounters courseCount={siteStats.courseCount || 0} studentCount={studentCount} />
        </div>
      </section>
    </div>
  );
}
