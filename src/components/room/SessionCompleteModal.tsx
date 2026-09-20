import React, { useState } from 'react';
import type { MentoringSession } from '../../types';
import { useApp } from '../../context/AppContext';
import { DataService } from '../../services/dataService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faStar, 
  faCoins, 
  faAward, 
  faThumbsUp, 
  faCheck 
} from '@fortawesome/free-solid-svg-icons';

interface SessionCompleteModalProps {
  session: MentoringSession;
  isOpen: boolean;
  onClose: () => void;
  onFinished: () => void;
}

const ENDORSEMENT_TAGS = [
  'Super Patient',
  'Clear Explanations',
  'Master of Debugging',
  'Great Listener',
  'Actionable Feedback',
  'Well Prepared'
];

export const SessionCompleteModal: React.FC<SessionCompleteModalProps> = ({
  session,
  isOpen,
  onClose,
  onFinished
}) => {
  const { currentUser, refreshUserData, showToast } = useApp();

  const isLearner = currentUser?.id === session.learner_id;
  const otherParty = isLearner ? session.mentor : session.learner;

  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>(['Clear Explanations', 'Super Patient']);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !currentUser || !otherParty) return null;

  const rupeeSaved = Math.round(session.duration_min * 45);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);

      await DataService.createReview({
        session_id: session.id,
        author_id: currentUser.id,
        recipient_id: otherParty.id,
        rating: rating,
        comment: comment.trim() || 'Exceptional micro-mentoring exchange!',
        skill_endorsed: session.skill_name,
        tags: selectedTags
      });

      await refreshUserData();

      showToast({
        type: 'success',
        title: 'Endorsement Recorded!',
        message: `Your feedback for ${otherParty.name} has been published.`
      });

      onFinished();
      onClose();
    } catch (err: any) {
      console.error('Failed to submit review:', err);
      showToast({
        type: 'error',
        title: 'Submission Failed',
        message: err.message || 'Could not submit review.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#080B10]/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-black/10 overflow-hidden flex flex-col max-h-[95vh]">
        
        {/* Celebration Header */}
        <div className="p-6 text-center bg-[#0E131B] text-white border-b border-white/10 relative">
          <div className="w-14 h-14 rounded-full bg-[#00D284] text-[#0A0E14] flex items-center justify-center mx-auto text-xl shadow-lg shadow-[#00D284]/20 mb-3 animate-bounce">
            <FontAwesomeIcon icon={faAward} />
          </div>

          <h3 className="font-display font-extrabold text-xl text-white">
            Session Completed! Escrow Released 🎉
          </h3>

          <p className="text-xs text-[#8E9BAE] mt-1 max-w-sm mx-auto">
            {isLearner
              ? `Your ${session.credits_amount.toFixed(2)} credits have transferred to ${session.mentor?.name}. You saved ~₹${rupeeSaved}!`
              : `You earned ${session.credits_amount.toFixed(2)} credits from ${session.learner?.name}!`}
          </p>

          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[#00D284] text-xs font-mono font-bold">
            <FontAwesomeIcon icon={faCoins} />
            <span>Escrow Settled: {session.credits_amount.toFixed(2)} Credits Transferred</span>
          </div>
        </div>

        {/* 2-Way Review Form */}
        <form onSubmit={handleReviewSubmit} className="p-6 overflow-y-auto space-y-4 text-xs text-[#0A0E14]">
          
          <div className="text-center space-y-1">
            <span className="font-bold uppercase tracking-wider text-[#8E9BAE] text-[10px]">
              Rate your exchange with {otherParty.name}
            </span>

            {/* Star Rating */}
            <div className="flex items-center justify-center gap-2 pt-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(null)}
                  className="p-1 text-2xl transition-transform hover:scale-125 active:scale-95 focus:outline-none cursor-pointer"
                >
                  <FontAwesomeIcon
                    icon={faStar}
                    className={
                      (hoverRating !== null ? star <= hoverRating : star <= rating)
                        ? 'text-amber-400 drop-shadow-xs'
                        : 'text-black/10'
                    }
                  />
                </button>
              ))}
            </div>
            <p className="text-[11px] font-semibold text-[#5A6A80]">
              {rating === 5 ? 'Exceptional peer mentoring!' :
               rating === 4 ? 'Very helpful and friendly' :
               rating === 3 ? 'Good exchange' :
               rating === 2 ? 'Needs improvement' : 'Unsatisfactory'}
            </p>
          </div>

          {/* Endorsement Tags */}
          <div>
            <label className="block font-bold uppercase tracking-wider text-[#5A6A80] mb-1.5">
              Endorse Specific Skill Qualities
            </label>
            <div className="flex flex-wrap gap-1.5">
              {ENDORSEMENT_TAGS.map(tag => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    type="button"
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1 rounded-xl border transition-all text-xs font-semibold flex items-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95 ${
                      isSelected
                        ? 'border-[#3B72FE] bg-[#3B72FE]/10 text-[#0A0E14]'
                        : 'border-black/10 text-[#5A6A80] bg-[#F6F8FA]'
                    }`}
                  >
                    {isSelected && <FontAwesomeIcon icon={faCheck} className="text-[#3B72FE] text-[10px]" />}
                    <span>{tag}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Personal Note */}
          <div>
            <label className="block font-bold uppercase tracking-wider text-[#5A6A80] mb-1">
              Public Review Note
            </label>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={`Share what you learned or how ${otherParty.name} helped you...`}
              className="w-full p-3 rounded-2xl border border-black/10 bg-[#F6F8FA] focus:bg-white focus:ring-2 focus:ring-[#3B72FE] focus:outline-none text-[#0A0E14] text-xs"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-full bg-[#3B72FE] hover:bg-[#2A61ED] text-white font-bold text-sm shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FontAwesomeIcon icon={faThumbsUp} />
            <span>{isSubmitting ? 'Publishing...' : 'Publish Endorsement & Return'}</span>
          </button>

        </form>

      </div>
    </div>
  );
};
