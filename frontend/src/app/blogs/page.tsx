import { cookies } from 'next/headers';
import { getDictionary, Locale } from '@/i18n/dictionaries';
import Link from 'next/link';
import AnimatedBackground from '@/components/AnimatedBackground';

export const revalidate = 60;

interface TopicMeta {
  name: string;
  description: string;
  icon: string;
  gradient: string;
  borderHover: string;
  accentColor: string;
}

const TOPICS: TopicMeta[] = [
  {
    name: 'Data Structure and Algorithms',
    description: 'Arrays, Trees, Graphs, Dynamic Programming, and Competitive Programming patterns.',
    icon: '⚡',
    gradient: 'from-blue-600/20 via-indigo-600/10 to-transparent',
    borderHover: 'hover:border-blue-500/50 hover:shadow-blue-500/10',
    accentColor: 'text-blue-400 bg-blue-500/10 border-blue-500/20'
  },
  {
    name: 'Web Development',
    description: 'Modern fullstack architecture, React, Next.js, Node, APIs, and DevOps deployments.',
    icon: '🌐',
    gradient: 'from-emerald-600/20 via-teal-600/10 to-transparent',
    borderHover: 'hover:border-emerald-500/50 hover:shadow-emerald-500/10',
    accentColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
  },
  {
    name: 'AI ML & Data Science',
    description: 'Neural networks, Deep Learning, computer vision, NLP, and large scale data analysis.',
    icon: '🧠',
    gradient: 'from-purple-600/20 via-fuchsia-600/10 to-transparent',
    borderHover: 'hover:border-purple-500/50 hover:shadow-purple-500/10',
    accentColor: 'text-purple-400 bg-purple-500/10 border-purple-500/20'
  },
  {
    name: 'Machine Learning',
    description: 'Supervised & unsupervised learning, classification, regression, and model tuning.',
    icon: '🤖',
    gradient: 'from-amber-600/20 via-orange-600/10 to-transparent',
    borderHover: 'hover:border-amber-500/50 hover:shadow-amber-500/10',
    accentColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20'
  },
  {
    name: 'Python',
    description: 'Core syntax, OOP, automation, asynchronous programming, Django, and FastAPI.',
    icon: '🐍',
    gradient: 'from-cyan-600/20 via-sky-600/10 to-transparent',
    borderHover: 'hover:border-cyan-500/50 hover:shadow-cyan-500/10',
    accentColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20'
  },
  {
    name: 'Java',
    description: 'Enterprise backend development, Spring Boot, microservices, JVM internals, and OOP.',
    icon: '☕',
    gradient: 'from-rose-600/20 via-pink-600/10 to-transparent',
    borderHover: 'hover:border-rose-500/50 hover:shadow-rose-500/10',
    accentColor: 'text-rose-400 bg-rose-500/10 border-rose-500/20'
  }
];

async function getTopicCounts() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/blogs?filters[isPublished][$eq]=true&fields[0]=topic&pagination[limit]=1000`, { 
      next: { revalidate: 60 } 
    });
    if (!res.ok) return {};
    const data = await res.json();
    const counts: Record<string, number> = {};
    (data.data || []).forEach((b: any) => {
      if (b.topic) {
        counts[b.topic] = (counts[b.topic] || 0) + 1;
      }
    });
    return counts;
  } catch (e) {
    return {};
  }
}

export default async function BlogsPage() {
  const cookieStore = await cookies();
  const locale = (cookieStore.get('NEXT_LOCALE')?.value as Locale) || 'bn';
  const dict = await getDictionary(locale);
  const topicCounts = await getTopicCounts();

  return (
    <div className="relative min-h-[calc(100vh-4rem)] pt-16 pb-24">
      <AnimatedBackground />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
        {/* Hero Section */}
        <div className="text-center space-y-4 max-w-3xl mx-auto animate-fade-in-up">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tight">
            {dict.blogs.title}
          </h1>
          <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            {dict.blogs.subtitle}
          </p>
        </div>

        {/* Topics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in-up delay-100">
          {TOPICS.map((topic, idx) => {
            const count = topicCounts[topic.name] || 0;

            return (
              <Link 
                href={`/blogs/${encodeURIComponent(topic.name)}`} 
                key={topic.name}
                className={`relative group bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-7 flex flex-col justify-between text-white hover:-translate-y-1.5 hover:shadow-2xl transition-all duration-300 overflow-hidden ${topic.borderHover}`}
                style={{ animationDelay: `${(idx % 10) * 50}ms` }}
              >
                {/* Background Gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${topic.gradient} opacity-40 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`} />
                
                <div className="relative z-10 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center text-2xl shadow-inner group-hover:scale-110 transition-transform duration-300">
                      {topic.icon}
                    </div>
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${topic.accentColor}`}>
                      {count} {dict.blogs.articles_count_badge || (count === 1 ? 'Article' : 'Articles')}
                    </span>
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors tracking-tight">
                      {topic.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                      {topic.description}
                    </p>
                  </div>
                </div>

                <div className="relative z-10 pt-6 mt-4 border-t border-white/5 flex items-center justify-between text-xs font-semibold text-slate-300 group-hover:text-emerald-400 transition-colors">
                  <span>{dict.blogs.read_topics || 'Explore Articles'}</span>
                  <div className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-slate-950 transition-all duration-300 group-hover:translate-x-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
