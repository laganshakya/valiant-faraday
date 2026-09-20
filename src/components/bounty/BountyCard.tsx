import React, { useState } from 'react';
import type { HelpBounty } from '../../types';
import { useApp } from '../../context/AppContext';
import { DataService } from '../../services/dataService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBolt, 
  faClock, 
  faHandshake, 
  faCheckCircle
} from '@fortawesome/free-solid-svg-icons';

interface BountyCardProps {
  bounty: HelpBounty;
  onSessionStarted: (sessionId: string) => void;
  onRefresh: () => void;
}

export const BountyCard: React.FC<BountyCardProps> = ({
  bounty,
  onSessionStarted,
  onRefresh
}) => {
  const { currentUser, refreshUserData, showToast, openAuthModal } = useApp();
  const [isClaiming, setIsClaiming] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const isMyBounty = currentUser?.id === bounty.learner_id;
  const isClaimed = bounty.status === 'CLAIMED' || bounty.status === 'COMPLETED';

  // Rupee equivalent savings
  const rupeeVal = Math.round(bounty.preferred_duration_min * 45);

  const handleClaim = async () => {
    if (!currentUser) {
      showToast({
        type: 'info',
        title: 'Sign In Required',
        message: 'Please sign in or create an account with 2 free credits to offer help.'
      });
      openAuthModal('signin');
      return;
    }
    if (isMyBounty) {
      showToast({
        type: 'warning',
        title: 'Your Own Request',
        message: 'You cannot claim your own help request.'
      });
      return;
    }

    try {
      setIsClaiming(true);
      const session = await DataService.claimBounty(bounty.id, currentUser.id);
      await refreshUserData();
      onRefresh();

      showToast({
        type: 'success',
        title: 'Request Claimed!',
        message: `Paired with ${bounty.learner?.name || 'peer'}. Opening session room...`
      });

      onSessionStarted(session.id);
    } catch (err: any) {
      console.error('Failed to claim bounty:', err);
      showToast({
        type: 'error',
        title: 'Claim Failed',
        message: err.message || 'Could not claim this request.'
      });
    } finally {
      setIsClaiming(false);
    }
  };

  const handleCancel = async () => {
    if (!currentUser || !isMyBounty) return;
    try {
      setIsCancelling(true);
      await DataService.cancelBounty(bounty.id, currentUser.id);
      await refreshUserData();
      onRefresh();
      showToast({
        type: 'info',
        title: 'Request Cancelled',
        message: `${bounty.credits_offered.toFixed(2)} credits returned to your available balance.`
      });
    } catch (err: any) {
      console.error('Failed to cancel bounty:', err);
      showToast({
        type: 'error',
        title: 'Cancellation Failed',
        message: err.message || 'Could not cancel request.'
      });
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className={`bg-white rounded-3xl p-6 border transition-all duration-300 flex flex-col justify-between relative group ${
      bounty.urgency === 'SOS' 
        ? 'border-rose-500/50 shadow-md shadow-rose-500/5' 
        : 'border-black/5 shadow-xs hover:shadow-xl hover:-translate-y-1'
    }`}>
      
      <div className="space-y-3.5">
        
        {/* Top Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {bounty.urgency === 'SOS' ? (
              <span className="flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-rose-500 text-white shadow-xs animate-pulse">
                <FontAwesomeIcon icon={faBolt} className="text-[10px]" />
                <span>Live SOS Request</span>
              </span>
            ) : (
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                bounty.urgency === 'High' ? 'bg-amber-100 text-amber-900' : 'bg-[#EEF2F6] text-[#5A6A80]'
              }`}>
                {bounty.urgency} Priority
              </span>
            )}

            <span className="text-[11px] font-mono text-[#8E9BAE] flex items-center gap-1">
              <FontAwesomeIcon icon={faClock} className="text-[10px]" />
              {bounty.preferred_duration_min}m
            </span>
          </div>

          <div className="text-right">
            <span className="text-xs font-mono font-bold text-[#00D284] bg-[#00D284]/10 px-2.5 py-1 rounded-full border border-[#00D284]/20">
              +{bounty.credits_offered.toFixed(2)} cr
            </span>
          </div>
        </div>

        {/* Title & Description */}
        <div>
          <h3 className="font-display font-bold text-[#0A0E14] text-base leading-snug">
            {bounty.title}
          </h3>
          <p className="text-xs text-[#44546A] mt-2 line-clamp-3 leading-relaxed">
            {bounty.description}
          </p>
        </div>

        {/* Tags */}
        <div className="flex items-center gap-2 flex-wrap pt-1">
          <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-lg bg-[#3B72FE]/10 text-[#3B72FE] border border-[#3B72FE]/20">
            #{bounty.skill_tag}
          </span>
          <span className="text-[11px] text-[#5A6A80] bg-[#EEF2F6] px-2.5 py-0.5 rounded-lg">
            {bounty.category}
          </span>
          <span className="text-[10px] text-[#8E9BAE] ml-auto font-mono">
            Saves learner ~₹{rupeeVal}
          </span>
        </div>

      </div>

      {/* Footer Info & Claim */}
      <div className="pt-4 mt-4 border-t border-black/5 flex items-center justify-between gap-3">
        
        <div className="flex items-center gap-2.5 min-w-0">
          <img 
            src={bounty.learner?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=60'} 
            alt={bounty.learner?.name || 'Learner'} 
            className="w-8 h-8 rounded-full object-cover ring-1 ring-black/5 shrink-0"
          />
          <div className="min-w-0 text-xs">
            <p className="font-bold text-[#0A0E14] truncate">
              {bounty.learner?.name} {isMyBounty && <span className="text-[#3B72FE] font-normal">(You)</span>}
            </p>
            <p className="text-[10px] text-[#8E9BAE] truncate">
              {bounty.learner?.campus || 'Campus'}
            </p>
          </div>
        </div>

        <div>
          {isClaimed ? (
            <span className="flex items-center gap-1 text-xs font-bold text-[#00D284] bg-[#00D284]/10 px-3 py-1.5 rounded-full border border-[#00D284]/20">
              <FontAwesomeIcon icon={faCheckCircle} />
              <span>Claimed</span>
            </span>
          ) : isMyBounty ? (
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-[#8E9BAE] bg-black/5 px-2.5 py-1 rounded-full">
                Your Request
              </span>
              <button
                onClick={handleCancel}
                disabled={isCancelling}
                className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-full border border-rose-200 transition-all cursor-pointer hover:scale-105 active:scale-95 disabled:opacity-50"
                title="Cancel request and unlock escrow credits back to wallet"
              >
                {isCancelling ? 'Refunding...' : 'Cancel & Refund'}
              </button>
            </div>
          ) : (
            <button
              onClick={handleClaim}
              disabled={isClaiming}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#0A0E14] hover:bg-[#3B72FE] text-white text-xs font-semibold shadow-xs hover:shadow-lg transition-all duration-300 cursor-pointer hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FontAwesomeIcon icon={faHandshake} className="text-[#00D284]" />
              <span>{isClaiming ? 'Claiming...' : 'Offer Help'}</span>
            </button>
          )}
        </div>

      </div>

    </div>
  );
};
