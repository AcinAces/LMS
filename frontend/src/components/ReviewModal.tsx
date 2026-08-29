'use client';

import { useState } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';

interface ReviewModalProps {
  courseId: string;
  courseTitle: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ReviewModal({ courseId, courseTitle, onClose, onSuccess }: ReviewModalProps) {
  const { t } = useLanguage();
  const [teaching, setTeaching] = useState(0);
  const [content, setContent] = useState(0);
  const [difficulty, setDifficulty] = useState(0);
  const [hoverTeaching, setHoverTeaching] = useState(0);
  const [hoverContent, setHoverContent] = useState(0);
  const [hoverDifficulty, setHoverDifficulty] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const overallScore = teaching > 0 && content > 0 && difficulty > 0
    ? ((teaching + content + difficulty) / 3).toFixed(1)
    : '0.0';

  const quickTags = [
    'Clear explanations',
    'Challenging problems',
    'Great code examples',
    'Well structured',
    'Beginner friendly',
    'Top-tier exercises'
  ];

  const handleAddTag = (tag: string) => {
    if (feedback.includes(tag)) return;
    const newText = feedback ? `${feedback.trim()}, ${tag.toLowerCase()}` : tag;
    if (newText.length <= 300) {
      setFeedback(newText);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (teaching === 0 || content === 0 || difficulty === 0) {
      setError(t('review.rate_all_fields'));
      return;
    }
    setSubmitting(true);
    setError('');

    try {
      const jwt = localStorage.getItem('jwt');
      const userStr = localStorage.getItem('user');
      if (!jwt || !userStr) throw new Error('Not authenticated');

      const payloadData: any = {
        teachingRating: teaching,
        contentRating: content,
        difficultyRating: difficulty,
        overallRating: parseFloat(((teaching + content + difficulty) / 3).toFixed(2)),
        course: courseId
      };

      if (feedback && feedback.trim() !== '') {
        payloadData.feedback = feedback.trim();
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwt}`
        },
        body: JSON.stringify({ data: payloadData })
      });

      if (!res.ok) {
        let errorMessage = 'Failed to submit review';
        try {
          const errData = await res.json();
          console.error("Strapi Review Error:", errData);
          errorMessage = errData?.error?.details?.errors?.[0]?.message || errData?.error?.message || errorMessage;
        } catch (e) {}
        throw new Error(errorMessage);
      }

      setShowSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 1800);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
      setSubmitting(false);
    }
  };

  const getScoreLabel = (score: number) => {
    switch (score) {
      case 5: return '⭐ 5 - Excellent';
      case 4: return '⭐ 4 - Very Good';
      case 3: return '⭐ 3 - Satisfactory';
      case 2: return '⭐ 2 - Needs Improvement';
      case 1: return '⭐ 1 - Poor';
      default: return 'Select rating';
    }
  };

  const StarRating = ({
    label,
    value,
    hoverValue,
    onChange,
    onHover,
    onLeave
  }: {
    label: string;
    value: number;
    hoverValue: number;
    onChange: (v: number) => void;
    onHover: (v: number) => void;
    onLeave: () => void;
  }) => {
    const activeVal = hoverValue || value;

    return (
      <div className="p-3.5 bg-slate-950/60 border border-white/10 rounded-2xl space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">{label}</span>
          <span className="text-xs font-mono font-semibold text-amber-400">
            {activeVal > 0 ? getScoreLabel(activeVal) : 'Required *'}
          </span>
        </div>

        <div className="flex items-center gap-1.5" onMouseLeave={onLeave}>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onMouseEnter={() => onHover(star)}
              onClick={() => onChange(star)}
              className={`p-1.5 rounded-xl transition-all duration-200 cursor-pointer transform hover:scale-125 ${
                activeVal >= star
                  ? 'text-amber-400 bg-amber-500/10 shadow-sm shadow-amber-500/20'
                  : 'text-slate-600 hover:text-slate-400 hover:bg-white/5'
              }`}
            >
              <svg className="w-6 h-6 fill-current" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </button>
          ))}
        </div>
      </div>
    );
  };

  if (showSuccess) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl animate-fade-in">
        <div className="bg-slate-900/95 border border-emerald-500/40 rounded-3xl p-8 sm:p-10 flex flex-col items-center justify-center max-w-sm w-full shadow-2xl shadow-emerald-500/20 animate-fade-in-up text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="w-20 h-20 mb-5 rounded-3xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-3xl shadow-lg shadow-emerald-500/20">
            🎉
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">
            {t('review.thanks')}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            {t('review.feedback_submitted')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-slate-900/95 border border-white/15 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-2xl animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Header Glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Close Button */}
        <button 
          onClick={onClose} 
          className="cursor-pointer absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/5 transition-all z-10"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        {/* Header Title */}
        <div className="mb-6 relative z-10 space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
              ⭐ Course Review
            </span>
            {parseFloat(overallScore) > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                Score: {overallScore} / 5.0
              </span>
            )}
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">{t('review.share_feedback')}</h2>
          <p className="text-xs text-slate-400 line-clamp-1">{courseTitle}</p>
        </div>

        {error && (
          <div className="p-3.5 mb-5 text-xs text-rose-400 bg-rose-500/10 rounded-2xl border border-rose-500/30 flex items-center gap-2 animate-fade-in-up">
            <svg className="w-4 h-4 shrink-0 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          
          {/* Star Categories */}
          <StarRating 
            label={t('review.teaching')} 
            value={teaching} 
            hoverValue={hoverTeaching}
            onChange={setTeaching}
            onHover={setHoverTeaching}
            onLeave={() => setHoverTeaching(0)}
          />
          <StarRating 
            label={t('review.content')} 
            value={content} 
            hoverValue={hoverContent}
            onChange={setContent}
            onHover={setHoverContent}
            onLeave={() => setHoverContent(0)}
          />
          <StarRating 
            label={t('review.difficulty')} 
            value={difficulty} 
            hoverValue={hoverDifficulty}
            onChange={setDifficulty}
            onHover={setHoverDifficulty}
            onLeave={() => setHoverDifficulty(0)}
          />

          {/* Quick Feedback Chips */}
          <div className="pt-1">
            <div className="flex flex-wrap gap-1.5">
              {quickTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleAddTag(tag)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-all cursor-pointer"
                >
                  + {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Written Feedback Textarea */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <label className="font-bold uppercase tracking-wider text-slate-400">
                {t('review.feedback_optional')}
              </label>
              <span className="text-[11px] font-mono text-slate-500">{feedback.length} / 300</span>
            </div>
            <textarea 
              value={feedback}
              onChange={(e) => setFeedback(e.target.value.slice(0, 300))}
              placeholder={t('review.feedback_placeholder')}
              className="w-full h-24 p-3.5 bg-slate-950/80 border border-white/10 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 resize-none text-xs sm:text-sm shadow-inner transition-all"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 flex items-center justify-end gap-3">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              {t('review.cancel')}
            </button>
            <button 
              type="submit" 
              disabled={submitting} 
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs sm:text-sm font-bold rounded-xl shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all flex items-center gap-2 cursor-pointer"
            >
              {submitting ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>{t('review.submitting')}</span>
                </>
              ) : (
                <span>{t('review.post_review')} →</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
