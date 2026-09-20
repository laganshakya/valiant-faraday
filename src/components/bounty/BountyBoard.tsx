import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { HelpBounty, UrgencyLevel } from '../../types';
import { DataService } from '../../services/dataService';
import { BountyCard } from './BountyCard';
import { PostBountyModal } from './PostBountyModal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBullhorn, 
  faPlus, 
  faRotateRight
} from '@fortawesome/free-solid-svg-icons';

interface BountyBoardProps {
  onSessionStarted: (sessionId: string) => void;
  isPostModalOpen: boolean;
  onClosePostModal: () => void;
  onOpenPostModal: () => void;
}

export const BountyBoard: React.FC<BountyBoardProps> = ({
  onSessionStarted,
  isPostModalOpen,
  onClosePostModal,
  onOpenPostModal
}) => {
  const [bounties, setBounties] = useState<HelpBounty[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUrgency, setSelectedUrgency] = useState<'All' | UrgencyLevel>('All');

  const loadBounties = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await DataService.getBounties();
      setBounties(data);
    } catch (err) {
      console.error('Failed to load bounties:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBounties();
  }, [loadBounties]);

  const filteredBounties = useMemo(() => {
    return bounties.filter(b => {
      if (selectedUrgency !== 'All' && b.urgency !== selectedUrgency) return false;
      return true;
    });
  }, [bounties, selectedUrgency]);

  return (
    <div className="space-y-8 pb-16">
      
      {/* Top Header Banner */}
      <div className="pt-6 pb-2 text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-[#8E9BAE]">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
          <span>Live Community Request Stream</span>
        </div>

        <h1 className="font-display font-extrabold text-3xl sm:text-5xl text-white tracking-tight">
          Help Wanted <span className="text-[#3B72FE]">Board</span>
        </h1>

        <p className="text-[#8E9BAE] text-sm max-w-xl mx-auto leading-relaxed">
          Stuck on a tricky bug or need an urgent mock interview? Broadcast your challenge here. Earn credits to spend on your own learning by helping peers!
        </p>

        <div className="pt-2">
          <button
            onClick={onOpenPostModal}
            className="px-6 py-3 rounded-full bg-[#3B72FE] hover:bg-[#2A61ED] text-white font-bold text-xs tracking-wide shadow-lg shadow-blue-500/20 transition-all inline-flex items-center gap-2"
          >
            <FontAwesomeIcon icon={faPlus} />
            <span>Post a Request (Lock Escrow)</span>
          </button>
        </div>
      </div>

      {/* Sculpted Daylight Band */}
      <div className="band-daylight p-6 sm:p-10 space-y-6">
        
        {/* Filter Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-black/5">
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
            <span className="text-[#8E9BAE] font-bold uppercase tracking-wider text-[10px] mr-1">
              Urgency:
            </span>
            {(['All', 'SOS', 'High', 'Medium', 'Low'] as const).map(lvl => (
              <button
                key={lvl}
                onClick={() => setSelectedUrgency(lvl)}
                className={`px-3.5 py-1.5 rounded-full font-bold transition-all ${
                  selectedUrgency === lvl
                    ? lvl === 'SOS'
                      ? 'bg-rose-500 text-white shadow-sm'
                      : 'bg-[#0A0E14] text-white shadow-sm'
                    : 'bg-white text-[#5A6A80] border border-black/5 hover:bg-black/5'
                }`}
              >
                {lvl === 'SOS' ? '🚨 SOS Urgent' : lvl}
              </button>
            ))}
          </div>

          <button
            onClick={loadBounties}
            className="p-2 px-3 rounded-full text-[#5A6A80] hover:text-[#0A0E14] hover:bg-black/5 transition-colors text-xs flex items-center gap-1.5 font-mono"
            title="Refresh board"
          >
            <FontAwesomeIcon icon={faRotateRight} className={isLoading ? 'animate-spin' : ''} />
            <span>Sync</span>
          </button>
        </div>

        {/* Bounties Grid */}
        {filteredBounties.length === 0 ? (
          <div className="bg-white rounded-3xl border border-black/5 p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#EEF2F6] text-[#8E9BAE] flex items-center justify-center mx-auto text-lg">
              <FontAwesomeIcon icon={faBullhorn} />
            </div>
            <h3 className="font-bold text-[#0A0E14] text-base">No open requests matching this filter</h3>
            <p className="text-xs text-[#5A6A80] max-w-sm mx-auto">
              Post the first question or challenge to start exchanging skills!
            </p>
            <button
              onClick={onOpenPostModal}
              className="px-5 py-2.5 rounded-full bg-[#0A0E14] text-white text-xs font-semibold hover:bg-black/80 transition-colors"
            >
              Post Request Now
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredBounties.map(bounty => (
              <BountyCard
                key={bounty.id}
                bounty={bounty}
                onSessionStarted={onSessionStarted}
                onRefresh={loadBounties}
              />
            ))}
          </div>
        )}

      </div>

      {/* Post Modal */}
      {isPostModalOpen && (
        <PostBountyModal
          isOpen={isPostModalOpen}
          onClose={onClosePostModal}
          onBountyCreated={loadBounties}
        />
      )}

    </div>
  );
};
