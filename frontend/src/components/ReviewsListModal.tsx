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
      // Strapi 5 uses documentId for deletions if available, fallback to id
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

  const renderStars = (rating: number, size = "w-4 h-4") => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map(star => (
          <svg key={star} className={`${size} ${rating >= star ? 'text-amber-400' : 'text-gray-600'}`} fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-slate-900 border border-white/10 rounded-2xl max-w-2xl w-full max-h-[85vh] shadow-2xl flex flex-col relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Top Gradient Accent */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-400"></div>

        <button onClick={onClose} className="cursor-pointer absolute top-5 right-5 w-8 h-8 flex items-center justify-center bg-black/40 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-all z-10">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        
        <div className="p-6 sm:p-8 border-b border-white/10 bg-slate-900/50">
          <div className="flex items-start gap-4 mb-5 pr-10">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 hidden sm:block">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight mb-1">{t('review.student_reviews')}</h2>
              <p className="text-sm text-gray-400 line-clamp-1">{courseTitle}</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="text-gray-400 font-medium">{t('review.sort_by')}</span>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-black/50 border border-white/10 rounded-lg text-white px-4 py-2 focus:outline-none focus:border-emerald-500/50 appearance-none pr-8 relative custom-select-icon cursor-pointer shadow-inner"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.2em 1.2em' }}
            >
              <option value="latest">{t('review.latest_first')}</option>
              <option value="overall">{t('review.highest_overall')}</option>
              <option value="teaching">{t('review.highest_teaching')}</option>
              <option value="content">{t('review.highest_content')}</option>
              <option value="difficulty">{t('review.highest_difficulty')}</option>
            </select>
          </div>
        </div>

        <div className="p-6 sm:p-8 overflow-y-auto flex-1 custom-scrollbar">
          {sortedReviews.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-gray-500 mb-4">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
              </div>
               <p className="text-gray-300 font-medium text-lg">{t('review.no_reviews')}</p>
               <p className="text-gray-500 text-sm mt-1">{t('review.be_first')}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {sortedReviews.map(r => {
                const authorName = r.authorName || r.author?.username || 'Anonymous';
                
                return (
                  <div key={r.id} className="bg-slate-800/40 border border-white/5 rounded-2xl p-5 sm:p-6 hover:bg-slate-800/60 transition-colors shadow-lg relative group">
                    {isAdmin && (
                      <button 
                        onClick={() => handleDeleteReview(r)} 
                        className="absolute top-4 right-4 p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-all border border-red-500/20 z-10 cursor-pointer"
                        title="Delete Review"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    )}
                    
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 text-emerald-400 flex items-center justify-center font-extrabold text-lg border border-emerald-500/20 shadow-inner">
                          {authorName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-bold text-white text-md tracking-wide">
                            {authorName}
                          </h4>
                          <div className="text-xs text-gray-400 mt-0.5">
                            {new Date(r.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end pr-8">
                        <div className="flex items-center gap-2 bg-black/30 px-3 py-1.5 rounded-xl border border-white/5">
                          <span className="font-extrabold text-amber-400 text-lg leading-none">{Number(r.overallRating).toFixed(1)}</span>
                          {renderStars(Math.round(r.overallRating), "w-4 h-4 sm:w-5 sm:h-5")}
                        </div>
                      </div>
                    </div>
                    
                    {r.feedback ? (
                      <p className="text-gray-300 text-sm sm:text-base mb-5 leading-relaxed whitespace-pre-wrap pr-8">{r.feedback}</p>
                    ) : (
                      <p className="text-gray-500 italic text-sm mb-5 pr-8">{t('review.no_feedback')}</p>
                    )}

                    <div className="flex flex-wrap gap-2 pt-4 border-t border-white/5">
                      <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-lg border border-white/5 text-xs sm:text-sm">
                        <span className="text-gray-400">{t('review.teaching')}:</span>
                        <div className="flex items-center gap-1 font-bold text-white">
                          <svg className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                          {r.teachingRating}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-lg border border-white/5 text-xs sm:text-sm">
                        <span className="text-gray-400">{t('review.content')}:</span>
                        <div className="flex items-center gap-1 font-bold text-white">
                          <svg className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                          {r.contentRating}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-lg border border-white/5 text-xs sm:text-sm">
                        <span className="text-gray-400">{t('review.difficulty')}:</span>
                        <div className="flex items-center gap-1 font-bold text-white">
                          <svg className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                          {r.difficultyRating}
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

