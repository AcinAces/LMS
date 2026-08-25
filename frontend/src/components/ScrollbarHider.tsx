'use client';

import { useEffect } from 'react';

export default function ScrollbarHider() {
  useEffect(() => {
    let timeout: NodeJS.Timeout;

    const handleScroll = () => {
      document.documentElement.classList.add('is-scrolling');
      
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        document.documentElement.classList.remove('is-scrolling');
      }, 4000);
    };

    // Listen to scroll events
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Trigger once on mount to show scrollbar initially, then hide after 4s
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timeout);
    };
  }, []);

  return null;
}
