import AnimatedBackground from '@/components/AnimatedBackground';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center overflow-hidden">
      <AnimatedBackground />
      
      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8">
          Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">Acin's LMS</span>
        </h1>
        <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-2xl mx-auto font-light">
          Master your coding skills with interactive lessons, comprehensive courses, and real-world projects.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link 
            href="/courses" 
            className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-lg transition-all transform hover:scale-105 shadow-lg shadow-blue-500/30 w-full sm:w-auto"
          >
            Explore Courses
          </Link>
          <Link 
            href="/blogs" 
            className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-lg font-semibold text-lg transition-all backdrop-blur-sm w-full sm:w-auto"
          >
            Read Blogs
          </Link>
        </div>
      </div>
    </div>
  );
}
