import AnimatedBackground from '@/components/AnimatedBackground';
import Link from 'next/link';
import StatCounters from '@/components/StatCounters';

async function getFeaturedCourses() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/courses?populate[0]=courseAuthor&populate[1]=lessons`, {
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
  const featuredCourses = await getFeaturedCourses();
  const siteStats = await getSiteStats();
  
  const studentCount = siteStats.studentCount || 0;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center overflow-hidden">
        <AnimatedBackground />
        
        {/* Glow orb */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/20 blur-[120px] rounded-full pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto text-center px-4 mt-20 animate-fade-in-up">
            <div className="flex justify-center mb-8">
              <svg width="400" height="100" viewBox="0 0 400 100" className="drop-shadow-[0_0_35px_rgba(52,211,153,0.4)] hover:scale-105 transition-transform duration-300">
                <defs>
                  <linearGradient id="heroGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#34d399" /> {/* emerald-400 */}
                    <stop offset="100%" stopColor="#3b82f6" /> {/* blue-500 */}
                  </linearGradient>
                  <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="2" result="blur" />
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
                  fontSize="64" 
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
                  fontSize="64" 
                  fontWeight="900"
                  letterSpacing="4"
                  filter="url(#glow)"
                >
                  &lt;/&gt;$&lt;/&gt;
                </text>
              </svg>
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 text-white leading-tight">
              Your next{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-500">
                git commit
              </span>
              <br className="hidden md:block" />
              starts here
            </h1>
            
            <p className="text-lg md:text-2xl text-slate-300 mb-12 max-w-2xl mx-auto font-light leading-relaxed">
              We teach coding. Your bugs are still your responsibility.
            </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a 
              href="#featured-courses" 
              className="group relative px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-lg transition-all transform hover:-translate-y-1 shadow-[0_0_40px_-10px_rgba(16,185,129,0.5)] w-full sm:w-auto overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-2 justify-center">
                Featured Courses
                <svg className="w-5 h-5 group-hover:translate-y-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
              </span>
            </a>
            <Link 
              href="/blogs" 
              className="group px-8 py-4 bg-slate-900/50 hover:bg-slate-800/80 text-white border border-white/10 rounded-xl font-semibold text-lg transition-all backdrop-blur-md hover:-translate-y-1 w-full sm:w-auto flex items-center justify-center gap-2"
            >
              Read Blogs
              <svg className="w-5 h-5 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" /></svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Courses Section */}
      <section id="featured-courses" className="relative py-24 px-6 bg-slate-950/50 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 animate-fade-in-up">
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 tracking-tight">Featured Courses</h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto mt-4">
              Dive into our hand-picked selection of top-tier coding courses designed to take your skills to the next level.
            </p>
          </div>

          {featuredCourses.length === 0 ? (
            <div className="text-center p-12 bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-2xl">
              <p className="text-slate-400 text-lg">Check back later for exciting new courses!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredCourses.map((course: any, index: number) => (
                <div key={course.id} className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-2xl p-6 hover:border-emerald-500/30 hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 group flex flex-col justify-between animate-fade-in-up" style={{ animationDelay: `${(index % 10) * 50}ms` }}>
                  
                  <div>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {course.courseTag ? course.courseTag.split(',').map((t: string, i: number) => (
                        <span key={i} className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-bold rounded-md border border-emerald-500/20">{t.trim()}</span>
                      )) : (
                        <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-bold rounded-md border border-emerald-500/20">General</span>
                      )}
                    </div>
                    
                    <h3 className="text-2xl font-bold text-slate-100 mb-3 group-hover:text-emerald-400 transition-colors line-clamp-2">{course.courseTitle}</h3>
                    
                    <div className="flex items-center gap-4 text-sm text-slate-400 mb-6">
                      <div className="flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        By {course.courseAuthor?.username || 'LMS'}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                        {course.lessons?.length || 0} Lessons
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/5 mt-auto">
                    <Link href={`/courses/${course.documentId}`} className="w-full py-3 flex justify-center items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-bold rounded-xl transition-colors">
                      View details
                    </Link>
                  </div>
                  
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Site Stats Section */}
      <section className="relative py-24 px-6 bg-slate-950 border-t border-white/5 overflow-hidden">
        {/* Glow orb */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="text-center mb-16 animate-fade-in-up">
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 tracking-tight">Site Stats</h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto mt-4">
              Join a growing community of developers upgrading their careers.
            </p>
          </div>
          
          <StatCounters courseCount={featuredCourses.length} studentCount={studentCount} />
        </div>
      </section>
    </div>
  );
}