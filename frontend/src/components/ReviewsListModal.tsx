'use client';

import { useState, useMemo, useEffect } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { useToast } from '@/context/ToastContext';

interface Review {
  id: number;
  documentId?: string;
  teachingRating: number;
  contentRating: number;
  difficultyRating: number;
  overallRating: number;
  feedback: string;
  authorId?: number;
  authorName?: string;
  createdAt: string;
  author: {
    username: string;
  };
}

interface ReviewsListModalProps {
  courseTitle: string;
  reviews: Review[];
  onClose: () => void;
}

type SortOption = 'latest' | 'teaching' | 'content' | 'difficulty' | 'overall';

export default function ReviewsListModal({ courseTitle, reviews, onClose }: ReviewsListModalProps) {
  const { t } = useLanguage();
  const [sortBy, setSortBy] = useState<SortOption>('latest');
  const [isAdmin, setIsAdmin] = useState(false);
  const [localReviews, setLocalReviews] = useState<Review[]>(reviews);

  useEffect(() => {
    try {
      const roleStr = localStorage.getItem('role');
      if (roleStr === 'admin' || roleStr === 'content_manager') setIsAdmin(true);
      else {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          if (user?.role?.type === 'admin' || user?.role?.type === 'content_manager') setIsAdmin(true);
        }
      }
    } catch (e) {}
  }, []);

  const toast = useToast();

  const handleDeleteReview = async (review: Review) => {
    if (!confirm(t('review.delete_confirm'))) return;
    try {
      const jwt = localStorage.getItem('jwt');
      const deleteId = review.documentId || review.id;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/reviews/${deleteId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${jwt}` }
      });
      if (res.ok) {
        toast.success('Review deleted successfully');
        setLocalReviews(prev => prev.filter(r => (r.documentId || r.id) !== deleteId));
      } else {
        toast.error('Failed to delete review.');
      }
    } catch (e) {
      toast.error('Error deleting review.');
    }
  };

  // Compute Aggregate Rating Metrics
  const metrics = useMemo(() => {
    const total = localReviews.length;
    if (total === 0) return { overall: '0.0', teaching: '0.0', content: '0.0', difficulty: '0.0' };

    const overallSum = localReviews.reduce((sum, r) => sum + (Number(r.overallRating) || 0), 0);
    const teachingSum = localReviews.reduce((sum, r) => sum + (Number(r.teachingRating) || 0), 0);
    const contentSum = localReviews.reduce((sum, r) => sum + (Number(r.contentRating) || 0), 0);
    const diffSum = localReviews.reduce((sum, r) => sum + (Number(r.difficultyRating) || 0), 0);

    return {
      overall: (overallSum / total).toFixed(1),
      teaching: (teachingSum / total).toFixed(1),
      content: (contentSum / total).toFixed(1),
      difficulty: (diffSum / total).toFixed(1)
    };
  }, [localReviews]);

  const sortedReviews = useMemo(() => {
    const list = [...localReviews];
    switch (sortBy) {
      case 'teaching':
        return list.sort((a, b) => b.teachingRating - a.teachingRating);
      case 'content':
        return list.sort((a, b) => b.contentRating - a.contentRating);
      case 'difficulty':
        return list.sort((a, b) => b.difficultyRating - a.difficultyRating);
      case 'overall':
        return list.sort((a, b) => b.overallRating - a.overallRating);
      case 'latest':
      default:
        return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  }, [localReviews, sortBy]);

  const renderStars = (rating: number, size = "w-3.5 h-3.5") => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map(star => (
          <svg key={star} className={`${size} ${rating >= star ? 'text-amber-400' : 'text-slate-700'}`} fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-xl animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-slate-900/95 border border-white/15 rounded-3xl max-w-2xl w-full max-h-[85vh] shadow-2xl flex flex-col relative overflow-hidden backdrop-blur-2xl animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Accent Gradient */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-amber-500 via-emerald-500 to-teal-400" />

        {/* Modal Close Button */}
        <button 
          onClick={onClose} 
          className="cursor-pointer absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/5 transition-all z-10"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        {/* Header Summary Section */}
        <div className="p-6 sm:p-7 border-b border-white/10 bg-slate-950/50 space-y-5">
          <div className="flex items-start gap-4 pr-8">
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-400 hidden sm:block shrink-0 shadow-lg shadow-amber-500/10">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  {t('review.student_reviews_count', { count: localReviews.length })}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight mt-1">{t('review.student_reviews')}</h2>
              <p className="text-xs sm:text-sm text-slate-400 line-clamp-1">{courseTitle}</p>
            </div>
          </div>

          {/* Rating Metrics Card Breakdown */}
          {localReviews.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3.5 bg-slate-950/80 border border-white/10 rounded-2xl">
              <div className="text-center p-2 rounded-xl bg-white/5 border border-white/5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400">{t('review.overall_rating_label')}</p>
                <div className="flex items-center justify-center gap-1 mt-0.5">
                  <span className="text-xl font-black text-amber-400">{metrics.overall}</span>
                  <span className="text-xs text-amber-400/70">★</span>
                </div>
              </div>
              <div className="text-center p-2 rounded-xl bg-white/5 border border-white/5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t('review.teaching')}</p>
                <p className="text-sm font-bold text-white mt-1">{metrics.teaching} / 5.0</p>
              </div>
              <div className="text-center p-2 rounded-xl bg-white/5 border border-white/5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t('review.content')}</p>
                <p className="text-sm font-bold text-white mt-1">{metrics.content} / 5.0</p>
              </div>
              <div className="text-center p-2 rounded-xl bg-white/5 border border-white/5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t('review.difficulty')}</p>
                <p className="text-sm font-bold text-white mt-1">{metrics.difficulty} / 5.0</p>
              </div>
            </div>
          )}

          {/* Sort Switcher */}
          <div className="flex items-center justify-between gap-2 pt-1 text-xs">
            <span className="text-slate-400 font-bold">{t('review.sort_by')}</span>
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: 'latest', label: t('review.latest_first') },
                { id: 'overall', label: t('review.highest_overall') },
                { id: 'teaching', label: t('review.highest_teaching') },
                { id: 'content', label: t('review.highest_content') },
                { id: 'difficulty', label: t('review.highest_difficulty') },
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setSortBy(opt.id as SortOption)}
                  className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
                    sortBy === opt.id
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                      : 'bg-white/5 text-slate-400 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Reviews List Body */}
        <div className="p-6 sm:p-7 overflow-y-auto flex-1 custom-scrollbar space-y-4">
          {sortedReviews.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
              <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center text-3xl text-slate-500 border border-white/5 shadow-inner">
                💬
              </div>
              <p className="text-slate-200 font-bold text-lg">{t('review.no_reviews')}</p>
              <p className="text-slate-500 text-xs sm:text-sm max-w-xs">{t('review.be_first')}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {sortedReviews.map(r => {
                const authorName = r.authorName || r.author?.username || 'Student';
                
                return (
                  <div 
                    key={r.id} 
                    className="bg-slate-950/60 border border-white/10 hover:border-emerald-500/30 rounded-2xl p-5 sm:p-6 transition-all shadow-lg relative group space-y-3"
                  >
                    {isAdmin && (
                      <button 
                        onClick={() => handleDeleteReview(r)} 
                        className="absolute top-4 right-4 p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl transition-all border border-rose-500/20 z-10 cursor-pointer"
                        title="Delete Review"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                    
                    {/* Review Author Header */}
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 text-emerald-400 flex items-center justify-center font-extrabold text-base border border-emerald-500/30 shadow-inner">
                          {authorName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-white text-sm sm:text-base tracking-wide">
                              {authorName}
                            </h4>
                            <span className="px-2 py-0.2 rounded-full text-[9px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              🎓 Verified Student
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5 font-mono">
                            {new Date(r.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                          </div>
                        </div>
                      </div>
                      
                      {/* Overall Rating Pill */}
                      <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-xl border border-white/10">
                        <span className="font-black text-amber-400 text-base leading-none">{Number(r.overallRating).toFixed(1)}</span>
                        {renderStars(Math.round(r.overallRating))}
                      </div>
                    </div>
                    
                    {/* Written Feedback Quote */}
                    {r.feedback ? (
                      <p className="text-slate-300 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap pl-1 border-l-2 border-emerald-500/40">
                        "{r.feedback}"
                      </p>
                    ) : (
                      <p className="text-slate-500 italic text-xs pl-1">{t('review.no_feedback')}</p>
                    )}

                    {/* Sub-ratings Breakdown Badges */}
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-white/5">
                      <div className="flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-white/5 text-xs">
                        <span className="text-slate-400 text-[11px]">{t('review.teaching')}:</span>
                        <div className="flex items-center gap-1 font-bold text-white text-xs">
                          <span className="text-amber-400">★</span>
                          <span>{r.teachingRating}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-white/5 text-xs">
                        <span className="text-slate-400 text-[11px]">{t('review.content')}:</span>
                        <div className="flex items-center gap-1 font-bold text-white text-xs">
                          <span className="text-amber-400">★</span>
                          <span>{r.contentRating}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-white/5 text-xs">
                        <span className="text-slate-400 text-[11px]">{t('review.difficulty')}:</span>
                        <div className="flex items-center gap-1 font-bold text-white text-xs">
                          <span className="text-amber-400">★</span>
                          <span>{r.difficultyRating}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
