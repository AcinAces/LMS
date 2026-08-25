'use client';

import { useEffect, useState } from 'react';

function AnimatedCounter({ targetCount, duration = 1500 }: { targetCount: number, duration?: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (targetCount === 0) return;
    
    const steps = 30;
    const stepTime = duration / steps;
    let currentStep = 0;
    
    const timer = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      const easeOutProgress = 1 - Math.pow(1 - progress, 3);
      const currentVal = Math.floor(easeOutProgress * targetCount);
      
      if (currentStep >= steps || currentVal >= targetCount) {
        setCount(targetCount);
        clearInterval(timer);
      } else {
        setCount(currentVal);
      }
    }, stepTime);
    
    return () => clearInterval(timer);
  }, [targetCount, duration]);

  return <span>{count}</span>;
}

export default function StatCounters({ courseCount, studentCount }: { courseCount: number, studentCount: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
      <div className="bg-slate-900/40 border border-white/5 backdrop-blur-xl rounded-3xl p-10 flex flex-col items-center justify-center text-center group hover:bg-slate-900/60 transition-all hover:border-emerald-500/20">
        <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6 text-emerald-400 group-hover:scale-110 transition-transform">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
        </div>
        <div className="text-5xl font-black text-white mb-2">
          <AnimatedCounter targetCount={courseCount} />
        </div>
        <div className="text-slate-400 font-medium tracking-wide uppercase text-sm">Course Count</div>
      </div>
      
      <div className="bg-slate-900/40 border border-white/5 backdrop-blur-xl rounded-3xl p-10 flex flex-col items-center justify-center text-center group hover:bg-slate-900/60 transition-all hover:border-emerald-500/20">
        <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6 text-blue-400 group-hover:scale-110 transition-transform">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
        </div>
        <div className="text-5xl font-black text-white mb-2">
          <AnimatedCounter targetCount={studentCount} />
        </div>
        <div className="text-slate-400 font-medium tracking-wide uppercase text-sm">Student Count</div>
      </div>
    </div>
  );
}
