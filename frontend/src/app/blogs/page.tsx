import Link from 'next/link';

const TOPICS = [
  'Data Structure and Algorithms',
  'Web Development',
  'AI ML & Data Science',
  'Machine Learning',
  'Python',
  'Java'
];

// Softer gradients for modern glassmorphic look
const cardGradients = [
  'from-blue-600/20 to-indigo-600/20',
  'from-emerald-600/20 to-teal-600/20',
  'from-purple-600/20 to-fuchsia-600/20',
  'from-orange-600/20 to-red-600/20',
  'from-sky-600/20 to-cyan-600/20',
  'from-pink-600/20 to-rose-600/20',
];

const borderColors = [
  'hover:border-blue-500/50',
  'hover:border-emerald-500/50',
  'hover:border-purple-500/50',
  'hover:border-orange-500/50',
  'hover:border-sky-500/50',
  'hover:border-pink-500/50',
];

export default function BlogsPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-950 text-slate-100 pt-12 px-4 sm:px-6 lg:px-8 pb-20">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16 animate-fade-in-up">
          <h1 className="text-4xl md:text-6xl font-extrabold mb-6 text-white tracking-tight">Explore the Library</h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">Dive into our curated collection of programming articles, tutorials, and guides spanning across various domains of software engineering.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in-up delay-100">
          {TOPICS.map((topic, idx) => {
            const gradient = cardGradients[idx % cardGradients.length];
            const borderHover = borderColors[idx % borderColors.length];
            return (
              <Link 
                href={`/blogs/${encodeURIComponent(topic)}`} 
                key={topic}
                className={`relative group bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-2xl p-8 flex flex-col items-center justify-center text-white hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 overflow-hidden ${borderHover}`}
                style={{ animationDelay: `${(idx % 10) * 50}ms` }}
              >
                {/* Background Gradient Blur */}
                <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-50 group-hover:opacity-100 transition-opacity duration-500`} />
                
                <h3 className="relative z-10 text-2xl font-bold mb-6 text-center group-hover:scale-105 transition-transform duration-300">{topic}</h3>
                
                <div className="relative z-10 border border-white/10 bg-black/20 rounded-full px-6 py-2 text-sm font-medium group-hover:bg-white/10 transition-colors backdrop-blur-md flex items-center gap-2">
                  Read topics <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
