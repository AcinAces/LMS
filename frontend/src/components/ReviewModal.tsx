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
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

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
      const user = JSON.parse(userStr);

      const overallRating = ((teaching + content + difficulty) / 3).toFixed(2);

      const payloadData: any = {
        teachingRating: teaching,
        contentRating: content,
        difficultyRating: difficulty,
        overallRating: parseFloat(overallRating),
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
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
      setSubmitting(false);
    }
  };

  const StarRating = ({ label, value, onChange }: { label: string, value: number, onChange: (v: number) => void }) => {
    return (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <span className="text-gray-300 font-medium">{label}</span>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              type="button"
              onClick={() => onChange(star)}
              className={`cursor-pointer w-8 h-8 flex items-center justify-center rounded-full transition-all ${value >= star ? 'bg-emerald-500/20 text-emerald-400' : 'text-gray-500 hover:text-gray-400 hover:bg-white/5'}`}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
            </button>
          ))}
        </div>
      </div>
    );
  };

  if (showSuccess) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
        <div className="bg-slate-900 border border-emerald-500/30 rounded-3xl p-8 flex flex-col items-center justify-center max-w-sm w-full shadow-2xl shadow-emerald-500/20 animate-fade-in-up">
          <div className="w-20 h-20 mb-5 rounded-full bg-emerald-500/20 flex items-center justify-center animate-bounce">
            <svg className="w-10 h-10 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">{t('review.thanks')}</h2>
          <p className="text-gray-400 text-center">{t('review.feedback_submitted')}</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-slate-900 border border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="cursor-pointer absolute top-4 right-4 text-gray-400 hover:text-white transition-colors">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        
        <h2 className="text-2xl font-bold text-white mb-2">{t('review.share_feedback')}</h2>
        <p className="text-sm text-gray-400 mb-6">{courseTitle}</p>

        {error && <div className="p-3 mb-4 text-sm text-red-400 bg-red-400/10 rounded-lg border border-red-400/20">{error}</div>}

        <form onSubmit={handleSubmit}>
          <StarRating label={t('review.teaching')} value={teaching} onChange={setTeaching} />
          <StarRating label={t('review.content')} value={content} onChange={setContent} />
          <StarRating label={t('review.difficulty')} value={difficulty} onChange={setDifficulty} />

          <div className="mt-6 mb-2">
            <label className="block text-gray-300 font-medium mb-2 text-sm">{t('review.feedback_optional')}</label>
            <textarea 
              value={feedback}
              onChange={(e) => setFeedback(e.target.value.slice(0, 300))}
              placeholder={t('review.feedback_placeholder')}
              className="w-full h-24 p-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 resize-none text-sm"
            />
            <div className="text-right text-xs text-gray-500 mt-1">{feedback.length} / 300</div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="cursor-pointer px-5 py-2.5 text-sm font-medium text-gray-300 hover:text-white transition-colors">{t('review.cancel')}</button>
            <button type="submit" disabled={submitting} className="cursor-pointer px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-lg shadow-lg shadow-emerald-500/20 transition-all">
              {submitting ? t('review.submitting') : t('review.post_review')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}



