import React, { useState } from 'react';
import type { Profile } from '../../types';
import { useApp } from '../../context/AppContext';
import { DataService } from '../../services/dataService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faXmark, 
  faCalendarCheck, 
  faShieldHalved, 
  faGraduationCap, 
  faCheck,
  faTriangleExclamation
} from '@fortawesome/free-solid-svg-icons';

interface BookingModalProps {
  mentor: Profile;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (sessionId: string) => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  mentor,
  isOpen,
  onClose,
  onSuccess
}) => {
  const { currentUser, refreshUserData, showToast } = useApp();
  
  const teachingSkills = (mentor.skills || []).filter(s => s.skill_type === 'TEACHING');
  const defaultSkill = teachingSkills.length > 0 ? teachingSkills[0].skill_name : 'General Mentoring';

  const [selectedSkill, setSelectedSkill] = useState<string>(defaultSkill);
  const [durationMin, setDurationMin] = useState<15 | 30 | 45 | 60>(30);
  const [topicDetails, setTopicDetails] = useState('');
  const [slotChoice, setSlotChoice] = useState<'immediate' | 'today_later' | 'tomorrow'>('immediate');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !currentUser) return null;

  const creditsCost = durationMin / 60;
  const hasSufficientCredits = currentUser.credits_balance >= creditsCost;
  const isSelfBooking = currentUser.id === mentor.id;

  // Rupee commercial comparison
  const rupeeEquivalentSaving = Math.round(durationMin * 45); // ~₹1,350 for 30 min

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSelfBooking) {
      showToast({
        type: 'error',
        title: 'Invalid Booking',
        message: 'You cannot book a mentoring session with yourself!'
      });
      return;
    }

    if (!hasSufficientCredits) {
      showToast({
        type: 'error',
        title: 'Insufficient Credits',
        message: `You need ${creditsCost.toFixed(2)} credits, but have ${currentUser.credits_balance.toFixed(2)} credits.`
      });
      return;
    }

    try {
      setIsSubmitting(true);

      let scheduledTime = new Date();
      if (slotChoice === 'immediate') {
        scheduledTime = new Date(Date.now() + 5 * 60000);
      } else if (slotChoice === 'today_later') {
        scheduledTime = new Date(Date.now() + 180 * 60000);
      } else {
        scheduledTime = new Date(Date.now() + 24 * 3600000);
      }

      const newSession = await DataService.bookSession({
        learnerId: currentUser.id,
        mentorId: mentor.id,
        skillName: selectedSkill,
        durationMin: durationMin,
        scheduledAt: scheduledTime.toISOString(),
        initialNotes: `### Session Goals with ${mentor.name}:\n- Topic: ${selectedSkill}\n- Focus: ${topicDetails || 'Interactive peer micro-mentoring'}`
      });

      await refreshUserData();

      showToast({
        type: 'success',
        title: 'Micro-Session Booked!',
        message: `${creditsCost.toFixed(2)} credits held in Escrow (Saved ~₹${rupeeEquivalentSaving}). Opening room...`
      });

      onSuccess(newSession.id);
      onClose();
    } catch (err: any) {
      console.error('Booking failed:', err);
      showToast({
        type: 'error',
        title: 'Booking Failed',
        message: err.message || 'Could not complete session booking.'
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
          <div className="flex items-center gap-3.5">
            <img 
              src={mentor.avatar_url} 
              alt={mentor.name} 
              className="w-12 h-12 rounded-2xl object-cover ring-2 ring-white/20 shadow-md"
            />
            <div>
              <h3 className="font-display font-bold text-lg text-white">Book Session with {mentor.name}</h3>
              <p className="text-xs text-[#8E9BAE] flex items-center gap-1.5 mt-0.5">
                <FontAwesomeIcon icon={faGraduationCap} className="text-[#3B72FE]" />
                <span>{mentor.campus}</span>
                <span>•</span>
                <span className="text-amber-400 font-mono">★ {mentor.rating_avg.toFixed(1)}</span>
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#8E9BAE] hover:text-white hover:bg-white/10 transition-colors"
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleBooking} className="p-6 overflow-y-auto space-y-5 text-[#0A0E14]">

          {/* 1. Skill to Learn */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#5A6A80] mb-2">
              Topic or Skill
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {teachingSkills.map(skill => (
                <button
                  type="button"
                  key={skill.id}
                  onClick={() => setSelectedSkill(skill.skill_name)}
                  className={`p-3 rounded-2xl text-left border text-xs transition-all flex items-center justify-between ${
                    selectedSkill === skill.skill_name
                      ? 'border-[#3B72FE] bg-[#3B72FE]/10 text-[#0A0E14] font-bold shadow-xs'
                      : 'border-black/10 hover:border-black/20 text-[#5A6A80] bg-[#F6F8FA]'
                  }`}
                >
                  <div>
                    <p className="font-semibold text-[#0A0E14]">{skill.skill_name}</p>
                    <span className="text-[10px] text-[#8E9BAE] font-normal">{skill.proficiency_level}</span>
                  </div>
                  {selectedSkill === skill.skill_name && (
                    <FontAwesomeIcon icon={faCheck} className="text-[#3B72FE]" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Micro-Mentoring Duration */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#5A6A80]">
                Duration & Value
              </label>
              <span className="text-xs font-mono font-bold text-[#00D284] bg-[#00D284]/10 px-2.5 py-0.5 rounded-full border border-[#00D284]/20">
                Saves ₹{rupeeEquivalentSaving}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {[
                { min: 15, cr: 0.25, label: '15m Quick' },
                { min: 30, cr: 0.50, label: '30m Focus' },
                { min: 45, cr: 0.75, label: '45m Deep' },
                { min: 60, cr: 1.00, label: '60m Master' }
              ].map(d => (
                <button
                  type="button"
                  key={d.min}
                  onClick={() => setDurationMin(d.min as any)}
                  className={`p-2.5 rounded-2xl border text-center transition-all ${
                    durationMin === d.min
                      ? 'border-[#0A0E14] bg-[#0A0E14] text-white font-bold shadow-sm'
                      : 'border-black/10 text-[#5A6A80] bg-[#F6F8FA] hover:bg-white'
                  }`}
                >
                  <p className="text-xs font-bold">{d.label}</p>
                  <p className={`text-[10px] font-mono ${durationMin === d.min ? 'text-[#00D284]' : 'text-[#8E9BAE]'}`}>
                    {d.cr} cr
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* 3. When to Connect */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#5A6A80] mb-2">
              When to Connect
            </label>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setSlotChoice('immediate')}
                className={`p-2.5 rounded-2xl border text-center transition-all ${
                  slotChoice === 'immediate'
                    ? 'border-[#00D284] bg-[#00D284]/10 text-[#0A0E14] font-bold'
                    : 'border-black/10 text-[#5A6A80] bg-[#F6F8FA]'
                }`}
              >
                <span className="inline-block w-2 h-2 rounded-full bg-[#00D284] mr-1"></span>
                In 5 mins
              </button>
              <button
                type="button"
                onClick={() => setSlotChoice('today_later')}
                className={`p-2.5 rounded-2xl border text-center transition-all ${
                  slotChoice === 'today_later'
                    ? 'border-[#3B72FE] bg-[#3B72FE]/10 text-[#0A0E14] font-bold'
                    : 'border-black/10 text-[#5A6A80] bg-[#F6F8FA]'
                }`}
              >
                Today Evening
              </button>
              <button
                type="button"
                onClick={() => setSlotChoice('tomorrow')}
                className={`p-2.5 rounded-2xl border text-center transition-all ${
                  slotChoice === 'tomorrow'
                    ? 'border-[#3B72FE] bg-[#3B72FE]/10 text-[#0A0E14] font-bold'
                    : 'border-black/10 text-[#5A6A80] bg-[#F6F8FA]'
                }`}
              >
                Tomorrow
              </button>
            </div>
          </div>

          {/* 4. Goal notes */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#5A6A80] mb-1.5">
              Specific Goal or Code Question
            </label>
            <textarea
              rows={2}
              value={topicDetails}
              onChange={(e) => setTopicDetails(e.target.value)}
              placeholder="e.g. Help me review code for React re-renders or prep for technical mock..."
              className="w-full text-xs p-3 rounded-2xl border border-black/10 bg-[#F6F8FA] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3B72FE] text-[#0A0E14]"
            />
          </div>

          {/* 5. Escrow Guarantee & Rupee Framing */}
          <div className="p-4 rounded-2xl bg-[#0E131B] text-white space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[#8E9BAE]">Your Balance:</span>
              <span className="font-mono font-bold">{currentUser.credits_balance.toFixed(2)} cr</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#8E9BAE]">Session Escrow Hold:</span>
              <span className="font-mono font-bold text-amber-400">-{creditsCost.toFixed(2)} cr</span>
            </div>
            <div className="border-t border-white/10 pt-2 flex items-center justify-between font-bold">
              <span className="text-white">Fiat Cost:</span>
              <span className="text-[#00D284] font-mono">₹0.00 (Saved ₹{rupeeEquivalentSaving})</span>
            </div>

            <div className="flex items-start gap-2 pt-1 text-[11px] text-[#8E9BAE]">
              <FontAwesomeIcon icon={faShieldHalved} className="text-[#3B72FE] mt-0.5 text-xs" />
              <span>Credits held in escrow until mutual session completion. 100% refundable on cancellation.</span>
            </div>
          </div>

          {/* Insufficient Credits Alert */}
          {!hasSufficientCredits && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-2.5 text-rose-800 text-xs">
              <FontAwesomeIcon icon={faTriangleExclamation} />
              <span>You need {creditsCost.toFixed(2)} credits. Earn credits by mentoring on the Bounty Board!</span>
            </div>
          )}

          {/* CTA */}
          <button
            type="submit"
            disabled={isSubmitting || !hasSufficientCredits || isSelfBooking}
            className={`w-full py-3.5 px-6 rounded-full font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 ${
              !hasSufficientCredits || isSelfBooking || isSubmitting
                ? 'bg-[#EEF2F6] text-[#8E9BAE] cursor-not-allowed shadow-none'
                : 'bg-[#3B72FE] hover:bg-[#2A61ED] text-white shadow-blue-500/20 cursor-pointer hover:scale-105 active:scale-95'
            }`}
          >
            <FontAwesomeIcon icon={faCalendarCheck} />
            <span>
              {isSubmitting ? 'Securing Escrow...' : `Lock ${creditsCost.toFixed(2)} Credits in Escrow (₹0 Cash)`}
            </span>
          </button>

        </form>

      </div>
    </div>
  );
};
