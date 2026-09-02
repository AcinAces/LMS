import Link from 'next/link';
import { cookies } from 'next/headers';
import { getDictionary, Locale } from '@/i18n/dictionaries';
import AnimatedBackground from '@/components/AnimatedBackground';

export const revalidate = 0;

const TOPIC_HIERARCHY: Record<string, string[]> = {
  'Data Structure and Algorithms': ['Fundamentals', 'Maths & Recursion', 'Array & String'],
  'Web Development': ['Frontend Basics', 'Backend Development', 'DevOps'],
  'AI ML & Data Science': ['Machine Learning', 'Deep Learning', 'Data Analysis'],
  'Machine Learning': ['Supervised Learning', 'Unsupervised Learning', 'Reinforcement Learning'],
  'Python': ['Core Python', 'Django & Web', 'Data Science with Python'],
  'Java': ['Core Java', 'Spring Boot', 'Java Collections']
};

interface BlogSummary {
  id: number;
  documentId: string;
  title: string;
  subtopic: string;
  imgURL?: string | null;
  updatedAt?: string;
  body?: string;
  author?: { username: string };
}

async function getTopicBlogs(topic: string): Promise<BlogSummary[]> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/blogs?filters[topic][$eq]=${encodeURIComponent(topic)}&filters[isPublished][$eq]=true&populate[0]=author&pagination[limit]=1000`, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return data.data || [];
  } catch (e) {
    return [];
  }
}

function estimateReadingTime(text?: string, locale: Locale = 'bn') {
  if (!text) return locale === 'bn' ? '২ মিনিট পড়ার সময়' : '2 min read';
  const words = text.trim().split(/\s+/).length;
  const minutes = Math.ceil(words / 200);
  return `${minutes} ${locale === 'bn' ? 'মিনিট পড়ার সময়' : 'min read'}`;
}

export default async function TopicPage({ params }: { params: Promise<{ topic: string }> }) {
  const cookieStore = await cookies();
  const locale = (cookieStore.get('NEXT_LOCALE')?.value as Locale) || 'bn';
  const dict = await getDictionary(locale);
  const resolvedParams = await params;
  const decodedTopic = decodeURIComponent(resolvedParams.topic);
  
  const blogs = await getTopicBlogs(decodedTopic);

  const predefinedSubtopics = TOPIC_HIERARCHY[decodedTopic] || [];
  const dynamicSubtopics = Array.from(new Set(blogs.map((b) => b.subtopic)))
    .filter((s) => s && !predefinedSubtopics.includes(s)) as string[];
    
  const allSubtopics = [...predefinedSubtopics, ...dynamicSubtopics];

  return (
    <div className="relative min-h-[calc(100vh-4rem)] pt-16 pb-24">
      <AnimatedBackground />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link 
            href="/blogs" 
            className="group inline-flex items-center gap-2 text-slate-400 hover:text-emerald-400 transition-colors text-xs font-semibold bg-slate-900/70 px-4 py-2 rounded-xl border border-white/10 hover:border-emerald-500/30 backdrop-blur-md"
          >
            <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>{dict.blogs.back_to_library}</span>
          </Link>

          <span className="text-xs font-medium text-slate-400 bg-slate-900/60 px-3 py-1.5 rounded-lg border border-white/5">
            {blogs.length} {dict.blogs.articles_count_badge || 'Articles'}
          </span>
        </div>
        
        {/* Topic Header Card */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-white/10 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden backdrop-blur-xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
          
          <div className="relative z-10 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider">
              <span>{dict.blogs.topic_curriculum || 'Topic Curriculum'}</span>
              <span>•</span>
              <span>{allSubtopics.length} {dict.blogs.modules || 'Modules'}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
              {decodedTopic}
            </h1>
            <p className="text-slate-400 text-sm max-w-2xl pt-1">
              {dict.blogs.select_module_desc || 'Select a module below to access comprehensive study notes, implementation deep-dives, and code walkthroughs.'}
            </p>
          </div>
        </div>

        {allSubtopics.length === 0 ? (
          <div className="text-slate-400 py-16 bg-slate-900/50 rounded-3xl border border-white/10 p-8 text-center backdrop-blur-md">
            <div className="w-12 h-12 rounded-full bg-white/5 mx-auto mb-3 flex items-center justify-center text-slate-500">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-base font-semibold text-white">{dict.blogs.no_subtopics}</p>
          </div>
        ) : (
          <div className="space-y-8 animate-fade-in-up delay-100">
            {allSubtopics.map((subtopic) => {
              const items = blogs.filter((b) => b.subtopic === subtopic);

              return (
                <div 
                  key={subtopic} 
                  className="bg-slate-900/60 rounded-3xl border border-white/10 p-6 sm:p-8 backdrop-blur-xl shadow-xl space-y-6 hover:border-white/20 transition-all"
                >
                  <div className="flex items-center justify-between border-b border-white/5 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-2.5 h-7 bg-gradient-to-b from-emerald-400 to-teal-500 rounded-full" />
                      <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                          {subtopic}
                        </h2>
                        <span className="text-xs text-slate-400">
                          {items.length} {dict.blogs.lesson_notes || 'lesson notes'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {items.length === 0 ? (
                    <div className="bg-black/20 rounded-2xl p-6 text-center border border-white/5">
                      <p className="text-slate-400 text-xs italic">
                        {dict.blogs.no_posts_yet || 'No articles published in this section yet.'}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {items.map((item) => (
                        <Link 
                          key={item.documentId || item.id}
                          href={`/blogs/${encodeURIComponent(decodedTopic)}/${item.documentId}`}
                          className="group relative bg-slate-950/60 border border-white/5 rounded-2xl p-4 sm:p-5 hover:border-emerald-500/40 hover:bg-slate-900/80 transition-all flex gap-4 overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-0.5"
                        >
                          {/* Optional Thumbnail Preview */}
                          {item.imgURL ? (
                            <div className="w-24 h-24 sm:w-28 sm:h-24 rounded-xl overflow-hidden bg-slate-900 flex-shrink-0 border border-white/10 relative">
                              <img 
                                src={item.imgURL} 
                                alt={item.title} 
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                              />
                            </div>
                          ) : (
                            <div className="w-24 h-24 sm:w-28 sm:h-24 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 flex-shrink-0 flex items-center justify-center text-emerald-400 font-black text-2xl group-hover:scale-105 transition-transform duration-300">
                              {item.title.charAt(0).toUpperCase()}
                            </div>
                          )}

                          <div className="flex-1 min-w-0 flex flex-col justify-between">
                            <div>
                              <h3 className="text-sm sm:text-base font-bold text-slate-100 group-hover:text-emerald-400 transition-colors line-clamp-2 leading-snug">
                                {item.title}
                              </h3>
                            </div>

                            <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-2">
                              <span>{estimateReadingTime(item.body, locale)}</span>
                              <span>•</span>
                              <span className="truncate text-emerald-400/90 font-medium">By Acin&apos;sLMS team</span>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
