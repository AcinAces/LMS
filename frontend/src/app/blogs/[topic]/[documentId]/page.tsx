import Link from 'next/link';
import ReactMarkdown from 'react-markdown';

export const revalidate = 0;

async function getBlog(documentId: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/blogs/${documentId}?populate=author&filters[isPublished][$eq]=true`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.data;
  } catch (e) {
    return null;
  }
}

export default async function BlogPostPage({ params }: { params: Promise<{ topic: string, documentId: string }> }) {
  const resolvedParams = await params;
  const decodedTopic = decodeURIComponent(resolvedParams.topic);
  
  const blog = await getBlog(resolvedParams.documentId);

  if (!blog) {
    return (
      <div className="min-h-screen bg-slate-950 text-white pt-32 px-4 flex justify-center">
        <div className="bg-slate-900/80 backdrop-blur-md border border-white/10 p-8 rounded-2xl max-w-md text-center text-slate-400">
          <svg className="w-12 h-12 mx-auto mb-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          Blog post not found or it has not been published yet.
        </div>
      </div>
    );
  }

  const title = blog.title;
  const authorName = blog.author?.username || 'Acins LMS Team';
  const updatedDate = blog.updatedAt ? new Date(blog.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : new Date().toLocaleDateString();
  
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-950 text-slate-100 pt-12 px-4 sm:px-6 lg:px-8 pb-32">
      <div className="max-w-4xl mx-auto animate-fade-in-up">
        
        <Link href={`/blogs/${encodeURIComponent(decodedTopic)}`} className="group inline-flex items-center gap-2 text-slate-400 hover:text-emerald-400 transition-colors mb-10 text-sm font-medium bg-slate-900/50 px-4 py-2 rounded-full border border-white/5 hover:border-emerald-500/30">
          <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Back to {decodedTopic}
        </Link>
        
        <article className="bg-slate-900/40 backdrop-blur-xl p-8 md:p-14 rounded-3xl shadow-2xl border border-white/5 relative overflow-hidden">
          {/* Subtle glow inside card */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-emerald-500/10 blur-[80px] pointer-events-none rounded-full" />
          
          <header className="relative mb-12 pb-12 border-b border-white/10">
            <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-8 leading-[1.15] tracking-tight">{title}</h1>
            
            <div className="flex flex-wrap items-center gap-4 md:gap-6 text-slate-400 text-sm md:text-base font-medium">
              <div className="flex items-center gap-2 bg-black/20 px-4 py-2 rounded-full border border-white/5">
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-emerald-500 to-blue-500 flex items-center justify-center text-white text-xs">
                  {authorName.charAt(0).toUpperCase()}
                </div>
                <span className="text-slate-200">{authorName}</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                {updatedDate}
              </div>
            </div>
          </header>

          {blog.imgURL && (
            <div className="relative mb-14 rounded-2xl overflow-hidden border border-white/10 shadow-lg group">
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-10" />
              <img src={blog.imgURL} alt={title} className="w-full h-auto object-cover transform group-hover:scale-105 transition-transform duration-700" />
            </div>
          )}

          <div className="relative prose prose-lg md:prose-xl prose-invert prose-emerald max-w-none text-slate-300 prose-headings:text-slate-100 prose-a:text-emerald-400 hover:prose-a:text-emerald-300 prose-strong:text-white prose-code:text-emerald-300 prose-code:bg-emerald-500/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/10 prose-img:rounded-xl leading-relaxed">
            {blog.body ? (
              <ReactMarkdown>{blog.body}</ReactMarkdown>
            ) : (
              <div className="text-center italic text-slate-500">No content available for this post.</div>
            )}
          </div>
        </article>
      </div>
    </div>
  );
}
