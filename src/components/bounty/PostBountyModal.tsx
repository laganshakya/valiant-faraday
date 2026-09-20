import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { DataService } from '../../services/dataService';
import type { SkillCategory, UrgencyLevel } from '../../types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faXmark, 
  faBullhorn, 
  faCoins, 
  faShieldHalved,
  faTriangleExclamation
} from '@fortawesome/free-solid-svg-icons';

interface PostBountyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBountyCreated: () => void;
}

const CATEGORIES: SkillCategory[] = [
  'Engineering',
  'Design',
  'Data Science',
  'Languages',
  'Career & Interviews',
  'Academics',
  'Music & Creative'
];

export const PostBountyModal: React.FC<PostBountyModalProps> = ({
  isOpen,
  onClose,
  onBountyCreated
}) => {
  const { currentUser, refreshUserData, showToast } = useApp();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [skillTag, setSkillTag] = useState('');
  const [category, setCategory] = useState<SkillCategory>('Engineering');
  const [durationMin, setDurationMin] = useState<15 | 30 | 45 | 60>(30);
  const [urgency, setUrgency] = useState<UrgencyLevel>('High');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !currentUser) return null;

  const creditsCost = durationMin / 60;
  const hasSufficientCredits = currentUser.credits_balance >= creditsCost;
  const rupeeSaved = Math.round(durationMin * 45);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !description.trim() || !skillTag.trim()) {
      showToast({
        type: 'warning',
        title: 'Missing Fields',
        message: 'Please complete all required fields.'
      });
      return;
    }

    if (!hasSufficientCredits) {
      showToast({
        type: 'error',
        title: 'Insufficient Balance',
        message: `You need ${creditsCost.toFixed(2)} credits. Current balance: ${currentUser.credits_balance.toFixed(2)} credits.`
      });
      return;
    }

    try {
      setIsSubmitting(true);

      // Lock credits in escrow
      await DataService.updateProfile({
        id: currentUser.id,
        credits_balance: Number((currentUser.credits_balance - creditsCost).toFixed(2)),
        credits_escrow: Number((currentUser.credits_escrow + creditsCost).toFixed(2))
      });

      // Record Escrow Hold
      await DataService.recordTransaction({
        profile_id: currentUser.id,
        amount: -creditsCost,
        type: 'ESCROW_HOLD',
        note: `Escrow hold for Bounty: "${title.substring(0, 30)}..." (Saves ~₹${rupeeSaved})`
      });

      // Create Bounty
      await DataService.createBounty({
        learner_id: currentUser.id,
        title: title.trim(),
        description: description.trim(),
        skill_tag: skillTag.trim(),
        category: category,
        preferred_duration_min: durationMin,
        credits_offered: creditsCost,
        urgency: urgency
      });

      await refreshUserData();

      showToast({
        type: 'success',
        title: 'Request Broadcasted!',
        message: `Live on the board. ${creditsCost.toFixed(2)} credits locked in Escrow.`
      });

      onBountyCreated();
      onClose();
    } catch (err: any) {
      console.error('Failed to post bounty:', err);
      showToast({
        type: 'error',
        title: 'Posting Error',
        message: err.message || 'Could not post request.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#080B10]/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-black/10 overflow-hidden flex flex-col max-h-[95vh]">
        
        {/* Header */}
        <div className="p-6 bg-[#0E131B] text-white flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#3B72FE] text-white flex items-center justify-center shadow-xs">
              <FontAwesomeIcon icon={faBullhorn} />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-white">Post "Help Wanted" Request</h3>
              <p className="text-xs text-[#8E9BAE]">Broadcast your learning challenge to verified peer mentors</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#8E9BAE] hover:text-white hover:bg-white/10 transition-colors"
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs text-[#0A0E14]">

          {/* Title */}
          <div>
            <label className="block font-bold uppercase tracking-wider text-[#5A6A80] mb-1">
              Request Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Quick Debug: React useEffect loop, or Mock Behavioral Interview"
              className="w-full p-3 rounded-2xl border border-black/10 bg-[#F6F8FA] focus:bg-white focus:ring-2 focus:ring-[#3B72FE] focus:outline-none text-[#0A0E14] text-xs"
            />
          </div>

          {/* Skill Tag & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold uppercase tracking-wider text-[#5A6A80] mb-1">
                Specific Skill or Tool *
              </label>
              <input
                type="text"
                required
                value={skillTag}
                onChange={(e) => setSkillTag(e.target.value)}
                placeholder="e.g. React.js, Docker, French, Git"
                className="w-full p-3 rounded-2xl border border-black/10 bg-[#F6F8FA] focus:bg-white focus:ring-2 focus:ring-[#3B72FE] focus:outline-none text-[#0A0E14] text-xs"
              />
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-[#5A6A80] mb-1">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as SkillCategory)}
                className="w-full p-3 rounded-2xl border border-black/10 bg-[#F6F8FA] focus:bg-white focus:ring-2 focus:ring-[#3B72FE] focus:outline-none text-[#0A0E14] text-xs"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Duration & Escrow */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="font-bold uppercase tracking-wider text-[#5A6A80]">
                Duration & Escrow Reward
              </label>
              <span className="font-mono font-bold text-[#00D284] bg-[#00D284]/10 px-2.5 py-0.5 rounded-full border border-[#00D284]/20">
                {creditsCost.toFixed(2)} cr (Saves ₹{rupeeSaved})
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center">
              {[
                { min: 15, cr: 0.25, label: '15m (0.25 cr)' },
                { min: 30, cr: 0.50, label: '30m (0.50 cr)' },
                { min: 45, cr: 0.75, label: '45m (0.75 cr)' },
                { min: 60, cr: 1.00, label: '60m (1.00 cr)' }
              ].map(d => (
                <button
                  type="button"
                  key={d.min}
                  onClick={() => setDurationMin(d.min as any)}
                  className={`p-2.5 rounded-2xl border transition-all ${
                    durationMin === d.min
                      ? 'border-[#0A0E14] bg-[#0A0E14] text-white font-bold shadow-xs'
                      : 'border-black/10 text-[#5A6A80] bg-[#F6F8FA]'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Urgency */}
          <div>
            <label className="block font-bold uppercase tracking-wider text-[#5A6A80] mb-1.5">
              Urgency Level
            </label>
            <div className="grid grid-cols-4 gap-2 text-center">
              {(['SOS', 'High', 'Medium', 'Low'] as UrgencyLevel[]).map(lvl => (
                <button
                  type="button"
                  key={lvl}
                  onClick={() => setUrgency(lvl)}
                  className={`p-2 rounded-2xl border transition-all font-bold ${
                    urgency === lvl
                      ? lvl === 'SOS' 
                        ? 'border-rose-500 bg-rose-500 text-white shadow-xs'
                        : 'border-[#3B72FE] bg-[#3B72FE] text-white'
                      : 'border-black/10 text-[#5A6A80] bg-[#F6F8FA]'
                  }`}
                >
                  {lvl === 'SOS' ? '🚨 SOS' : lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Detailed Problem Description */}
          <div>
            <label className="block font-bold uppercase tracking-wider text-[#5A6A80] mb-1">
              Context & Questions *
            </label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain the problem you're stuck on or the specific skills you want to practice..."
              className="w-full p-3 rounded-2xl border border-black/10 bg-[#F6F8FA] focus:bg-white focus:ring-2 focus:ring-[#3B72FE] focus:outline-none text-[#0A0E14] text-xs"
            />
          </div>

          {/* Escrow Guarantee */}
          <div className="p-4 rounded-2xl bg-[#0E131B] text-white flex items-start gap-2.5 text-[#8E9BAE]">
            <FontAwesomeIcon icon={faShieldHalved} className="text-[#3B72FE] mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              Your <strong className="text-white">{creditsCost.toFixed(2)} credits</strong> will be locked in <strong>Escrow</strong> until you confirm the session is complete. Zero cash required.
            </p>
          </div>

          {/* Insufficient Credits */}
          {!hasSufficientCredits && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-rose-800">
              <FontAwesomeIcon icon={faTriangleExclamation} />
              <span>You need {creditsCost.toFixed(2)} credits, but have {currentUser.credits_balance.toFixed(2)} credits.</span>
            </div>
          )}

          {/* CTA */}
          <button
            type="submit"
            disabled={isSubmitting || !hasSufficientCredits}
            className={`w-full py-3.5 rounded-full font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 ${
              !hasSufficientCredits || isSubmitting
                ? 'bg-[#EEF2F6] text-[#8E9BAE] cursor-not-allowed shadow-none'
                : 'bg-[#3B72FE] hover:bg-[#2A61ED] text-white shadow-blue-500/20 cursor-pointer hover:scale-105 active:scale-95'
            }`}
          >
            <FontAwesomeIcon icon={faCoins} />
            <span>
              {isSubmitting ? 'Securing Bounty...' : `Broadcast Request (Lock ${creditsCost.toFixed(2)} Credits)`}
            </span>
          </button>

        </form>

      </div>
    </div>
  );
};
