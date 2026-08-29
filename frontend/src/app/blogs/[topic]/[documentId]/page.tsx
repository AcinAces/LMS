import { cookies } from 'next/headers';
import { getDictionary, Locale } from '@/i18n/dictionaries';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import AnimatedBackground from '@/components/AnimatedBackground';

export const revalidate = 0;

async function getBlog(documentId: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/blogs/${documentId}?populate=author&filters[isPublished][$eq]=true`, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    return data.data;
  } catch (e) {
    return null;
  }
}

function estimateReadingTime(text?: string) {
  if (!text) return '3 min read';
  const words = text.trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min read`;
}

export default async function BlogPostPage({ params }: { params: Promise<{ topic: string, documentId: string }> }) {
  const cookieStore = await cookies();
  const locale = (cookieStore.get('NEXT_LOCALE')?.value as Locale) || 'bn';
  const dict = await getDictionary(locale);
  const resolvedParams = await params;
  const decodedTopic = decodeURIComponent(resolvedParams.topic);
  
  const blog = await getBlog(resolvedParams.documentId);

  if (!blog) {
    return (
      <div className="relative min-h-[calc(100vh-4rem)] pt-24 pb-20 flex items-center justify-center">
        <AnimatedBackground />
        <div className="relative z-10 bg-slate-900/90 backdrop-blur-xl border border-white/10 p-10 rounded-3xl max-w-md text-center text-slate-300 shadow-2xl space-y-4">
          <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl mx-auto flex items-center justify-center text-2xl">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white">Post Unavailable</h2>
          <p className="text-sm text-slate-400">
            {dict.blogs.not_found || 'This article was either removed or has not been published yet.'}
          </p>
          <Link
            href={`/blogs/${encodeURIComponent(decodedTopic)}`}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-lg shadow-emerald-500/20"
          >
            ← {dict.blogs.back_to || 'Back to '}{decodedTopic}
          </Link>
        </div>
      </div>
    );
  }

  const title = blog.title;
  const authorName = "By Acin'sLMS team";
  const updatedDate = blog.updatedAt 
    ? new Date(blog.updatedAt).toLocaleDateString(locale === 'bn' ? 'bn-BD' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' }) 
    : new Date().toLocaleDateString();
  const readTime = estimateReadingTime(blog.body);
  
  return (
    <div className="relative min-h-[calc(100vh-4rem)] pt-16 pb-32">
      <AnimatedBackground />

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in-up">
        
        {/* Breadcrumb Navigation */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
          <Link href="/blogs" className="hover:text-emerald-400 transition-colors">
            {dict.blogs.title || 'Blogs'}
          </Link>
          <span>/</span>
          <Link href={`/blogs/${encodeURIComponent(decodedTopic)}`} className="hover:text-emerald-400 transition-colors">
            {decodedTopic}
          </Link>
          {blog.subtopic && (
            <>
              <span>/</span>
              <span className="text-slate-300 font-medium">{blog.subtopic}</span>
            </>
          )}
        </div>
        
        {/* Article Container */}
        <article className="bg-slate-900/70 backdrop-blur-2xl p-6 sm:p-10 md:p-14 rounded-3xl shadow-2xl border border-white/10 relative overflow-hidden space-y-10">
          {/* Ambient Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-36 bg-emerald-500/10 blur-[90px] pointer-events-none rounded-full" />
          
          {/* Article Header */}
          <header className="relative space-y-6 pb-8 border-b border-white/10">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 text-xs rounded-full bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">
                {decodedTopic}
              </span>
              {blog.subtopic && (
                <span className="px-3 py-1 text-xs rounded-full bg-white/5 text-slate-300 font-medium border border-white/10">
                  {blog.subtopic}
                </span>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white leading-[1.2] tracking-tight">
              {title}
            </h1>
            
            {/* Meta row */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-2 text-xs sm:text-sm text-slate-400">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center text-slate-950 font-black text-sm shadow-md">
                  A
                </div>
                <div>
                  <p className="font-bold text-slate-200 leading-none">{authorName}</p>
                  <p className="text-[11px] text-emerald-400/90 mt-1">Official Learning Material</p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
                <div className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>{updatedDate}</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{readTime}</span>
                </div>
              </div>
            </div>
          </header>

          {/* Cover Picture */}
          {blog.imgURL && (
            <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl group bg-slate-950">
              <img 
                src={blog.imgURL} 
                alt={title} 
                className="w-full max-h-[480px] object-cover transition-transform duration-700 group-hover:scale-102" 
              />
            </div>
          )}

          {/* Article Markdown Body with Math (KaTeX) & GFM */}
          <div className="relative prose prose-invert prose-emerald max-w-none text-slate-300 leading-relaxed prose-headings:text-white prose-headings:font-bold prose-h2:text-2xl prose-h2:border-b prose-h2:border-white/10 prose-h2:pb-2 prose-h3:text-xl prose-a:text-emerald-400 hover:prose-a:text-emerald-300 prose-a:underline prose-code:text-emerald-300 prose-code:bg-slate-950/80 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:font-mono prose-code:text-sm prose-pre:bg-slate-950 prose-pre:border prose-pre:border-white/10 prose-pre:rounded-2xl prose-pre:p-5 prose-blockquote:border-l-4 prose-blockquote:border-emerald-500 prose-blockquote:bg-emerald-500/5 prose-blockquote:p-4 prose-blockquote:rounded-r-xl">
            {blog.body ? (
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={{
                  img: ({ node, ...props }) => (
                    <span className="block my-6">
                      <img
                        {...props}
                        alt={props.alt || 'Article visual'}
                        className="rounded-2xl border border-white/10 shadow-lg mx-auto max-h-[440px] w-full object-cover block"
                        loading="lazy"
                      />
                      {props.alt && (
                        <span className="block text-center text-xs text-slate-400 mt-2 italic">
                          {props.alt}
                        </span>
                      )}
                    </span>
                  ),
                  table: ({ node, ...props }) => (
                    <div className="overflow-x-auto my-6 rounded-2xl border border-white/10 bg-slate-950/60 p-2">
                      <table {...props} className="w-full text-left text-sm" />
                    </div>
                  )
                }}
              >
                {blog.body}
              </ReactMarkdown>
            ) : (
              <div className="text-center italic text-slate-500 py-10">
                No content available for this post.
              </div>
            )}
          </div>

          {/* Article Footer */}
          <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <Link 
              href={`/blogs/${encodeURIComponent(decodedTopic)}`}
              className="px-5 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all border border-white/10 flex items-center gap-2"
            >
              <span>← {dict.blogs.back_to || 'Back to '}{decodedTopic}</span>
            </Link>

            <Link 
              href="/blogs"
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2"
            >
              <span>{dict.blogs.back_to_library || 'Explore All Topics'}</span>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>
        </article>
      </div>
    </div>
  );
}
