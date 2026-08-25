import Link from 'next/link';

export const revalidate = 0;

const TOPIC_HIERARCHY: Record<string, string[]> = {
  'Data Structure and Algorithms': ['Fundamentals', 'Maths & Recursion', 'Array & String'],
  'Web Development': ['Frontend Basics', 'Backend Development', 'DevOps'],
  'AI ML & Data Science': ['Machine Learning', 'Deep Learning', 'Data Analysis'],
  'Machine Learning': ['Supervised Learning', 'Unsupervised Learning', 'Reinforcement Learning'],
  'Python': ['Core Python', 'Django & Web', 'Data Science with Python'],
  'Java': ['Core Java', 'Spring Boot', 'Java Collections']
};

async function getTopicBlogs(topic: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/blogs?filters[topic][$eq]=${encodeURIComponent(topic)}&filters[isPublished][$eq]=true&fields[0]=title&fields[1]=subtopic&pagination[limit]=1000`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.data || [];
  } catch (e) {
    return [];
  }
}

export default async function TopicPage({ params }: { params: Promise<{ topic: string }> }) {
  const resolvedParams = await params;
  const decodedTopic = decodeURIComponent(resolvedParams.topic);
  
  const blogs = await getTopicBlogs(decodedTopic);

  const predefinedSubtopics = TOPIC_HIERARCHY[decodedTopic] || [];
  const dynamicSubtopics = Array.from(new Set(blogs.map((b: any) => b.subtopic)))
    .filter((s: any) => s && !predefinedSubtopics.includes(s)) as string[];
    
  const allSubtopics = [...predefinedSubtopics, ...dynamicSubtopics];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-950 text-slate-100 pt-12 px-4 sm:px-6 lg:px-8 pb-20">
      <div className="max-w-4xl mx-auto animate-fade-in-up">
        
        <Link href="/blogs" className="group inline-flex items-center gap-2 text-slate-400 hover:text-emerald-400 transition-colors mb-8 text-sm font-medium bg-slate-900/50 px-4 py-2 rounded-full border border-white/5 hover:border-emerald-500/30">
          <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Back to Library
        </Link>
        
        <div className="mb-12 border-b border-white/10 pb-8 relative">
          <div className="absolute -bottom-[1px] left-0 w-32 h-[2px] bg-gradient-to-r from-emerald-400 to-transparent"></div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">{decodedTopic}</h1>
        </div>

        {allSubtopics.length === 0 ? (
          <div className="text-slate-400 py-10 bg-slate-900/50 rounded-2xl border border-white/5 p-8 text-center">
            No predefined subtopics found for this topic.
          </div>
        ) : (
          <div className="space-y-8 animate-fade-in-up delay-100">
            {allSubtopics.map((subtopic) => {
              const items = blogs.filter((b: any) => b.subtopic === subtopic);
              return (
                <div key={subtopic} className="bg-slate-900/30 rounded-2xl border border-white/5 p-6 hover:bg-slate-900/50 transition-colors">
                  <h2 className="text-2xl font-bold mb-6 text-slate-200 flex items-center gap-3">
                    <div className="w-2 h-6 bg-emerald-500 rounded-full"></div>
                    {subtopic}
                  </h2>
                  
                  {items.length === 0 ? (
                    <p className="text-slate-500 text-sm ml-5 italic bg-black/20 inline-block px-4 py-2 rounded-lg">No posts published yet.</p>
                  ) : (
                    <ul className="space-y-3">
                      {items.map((item: any) => (
                        <li key={item.id} className="group">
                          <Link 
                            href={`/blogs/${encodeURIComponent(decodedTopic)}/${item.documentId}`}
                            className="flex items-center gap-3 p-3 rounded-xl hover:bg-emerald-500/10 transition-colors"
                          >
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-600 group-hover:bg-emerald-400 transition-colors"></div>
                            <span className="text-slate-300 group-hover:text-emerald-400 transition-colors font-medium">{item.title}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
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
