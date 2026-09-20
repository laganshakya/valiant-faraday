import React, { useState, useEffect, useCallback } from 'react';
import type { MentoringSession } from '../../types';
import { useApp } from '../../context/AppContext';
import { DataService } from '../../services/dataService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faVideo, 
  faCalendarCheck, 
  faClock, 
  faShieldHalved, 
  faGraduationCap,
  faArrowRight
} from '@fortawesome/free-solid-svg-icons';

interface SessionsListProps {
  onJoinRoom: (sessionId: string) => void;
  onExploreMentors: () => void;
}

export const SessionsList: React.FC<SessionsListProps> = ({
  onJoinRoom,
  onExploreMentors
}) => {
  const { currentUser } = useApp();
  const [sessions, setSessions] = useState<MentoringSession[]>([]);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed'>('all');

  const loadSessions = useCallback(async () => {
    if (!currentUser) return;
    try {
      const data = await DataService.getSessions(currentUser.id);
      setSessions(data);
    } catch (err) {
      console.error('Failed to load user sessions:', err);
    }
  }, [currentUser]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const filteredSessions = sessions.filter(s => {
    if (filter === 'upcoming') return s.status !== 'COMPLETED' && s.status !== 'CANCELLED';
    if (filter === 'completed') return s.status === 'COMPLETED';
    return true;
  });

  return (
    <div className="space-y-8 pb-16">
      
      {/* Header */}
      <div className="pt-6 pb-2 text-center max-w-2xl mx-auto space-y-3">
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-white tracking-tight">
          My Micro-Mentoring <span className="text-[#3B72FE]">Sessions</span>
        </h1>
        <p className="text-xs text-[#8E9BAE]">
          Join scheduled rooms, review collaborative notes, and monitor escrow settlement
        </p>
      </div>

      {/* Daylight Band */}
      <div className="band-daylight p-6 sm:p-10 space-y-6">
        
        {/* Filter Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-black/5">
          <div className="flex items-center gap-1.5 bg-white p-1 rounded-full border border-black/5 text-xs font-semibold">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-1.5 rounded-full transition-all ${
                filter === 'all' ? 'bg-[#0A0E14] text-white shadow-xs' : 'text-[#5A6A80] hover:text-[#0A0E14]'
              }`}
            >
              All ({sessions.length})
            </button>
            <button
              onClick={() => setFilter('upcoming')}
              className={`px-4 py-1.5 rounded-full transition-all ${
                filter === 'upcoming' ? 'bg-[#0A0E14] text-white shadow-xs' : 'text-[#5A6A80] hover:text-[#0A0E14]'
              }`}
            >
              Active ({sessions.filter(s => s.status !== 'COMPLETED').length})
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-4 py-1.5 rounded-full transition-all ${
                filter === 'completed' ? 'bg-[#0A0E14] text-white shadow-xs' : 'text-[#5A6A80] hover:text-[#0A0E14]'
              }`}
            >
              Completed ({sessions.filter(s => s.status === 'COMPLETED').length})
            </button>
          </div>
        </div>

        {/* Sessions List */}
        {filteredSessions.length === 0 ? (
          <div className="bg-white rounded-3xl border border-black/5 p-12 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-[#EEF2F6] text-[#8E9BAE] flex items-center justify-center mx-auto text-lg">
              <FontAwesomeIcon icon={faCalendarCheck} />
            </div>
            <h3 className="text-base font-bold text-[#0A0E14]">No sessions recorded in this tab</h3>
            <p className="text-xs text-[#5A6A80] max-w-sm mx-auto">
              Book a 15–60m session with a peer mentor to start trading skills without cash!
            </p>
            <button
              onClick={onExploreMentors}
              className="px-5 py-2.5 rounded-full bg-[#0A0E14] hover:bg-[#3B72FE] text-white text-xs font-semibold transition-colors inline-flex items-center gap-2"
            >
              <span>Explore Mentors</span>
              <FontAwesomeIcon icon={faArrowRight} />
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSessions.map(sess => {
              const isLearner = currentUser?.id === sess.learner_id;
              const otherParty = isLearner ? sess.mentor : sess.learner;
              const isCompleted = sess.status === 'COMPLETED';
              const rupeeSaved = Math.round(sess.duration_min * 45);

              return (
                <div
                  key={sess.id}
                  className="bg-white rounded-3xl border border-black/5 p-6 shadow-xs hover:shadow-lg transition-all flex flex-col md:flex-row md:items-center justify-between gap-5"
                >
                  <div className="flex items-start gap-4">
                    <img
                      src={otherParty?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80'}
                      alt={otherParty?.name || 'User'}
                      className="w-14 h-14 rounded-2xl object-cover ring-2 ring-black/5 shrink-0"
                    />

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-display font-bold text-[#0A0E14] text-base">{sess.skill_name}</h3>
                        <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full ${
                          isCompleted 
                            ? 'bg-[#00D284]/10 text-[#00D284]' 
                            : 'bg-[#3B72FE]/10 text-[#3B72FE]'
                        }`}>
                          {sess.status}
                        </span>
                        <span className="text-[10px] text-[#5A6A80] bg-[#EEF2F6] px-2 py-0.5 rounded-md">
                          {isLearner ? 'You are Learning' : 'You are Mentoring'}
                        </span>
                      </div>

                      <p className="text-xs text-[#5A6A80] flex items-center gap-1.5">
                        <span>With <strong>{otherParty?.name}</strong></span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <FontAwesomeIcon icon={faGraduationCap} className="text-[#3B72FE] text-[10px]" />
                          {otherParty?.campus}
                        </span>
                      </p>

                      <div className="flex items-center gap-3 text-xs text-[#8E9BAE] pt-1">
                        <span className="flex items-center gap-1 font-mono">
                          <FontAwesomeIcon icon={faClock} className="text-[10px]" />
                          {sess.duration_min}m
                        </span>
                        <span>•</span>
                        <span className="font-mono font-bold text-[#0A0E14]">
                          {sess.credits_amount.toFixed(2)} cr {isCompleted ? 'transferred' : 'in escrow'}
                        </span>
                        <span>•</span>
                        <span className="text-[#00D284] font-semibold">
                          Saved ~₹{rupeeSaved}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end md:self-center">
                    {!isCompleted && (
                      <div className="hidden sm:flex items-center gap-1.5 text-xs font-mono font-bold text-[#3B72FE] bg-[#3B72FE]/10 px-3 py-1.5 rounded-full border border-[#3B72FE]/20">
                        <FontAwesomeIcon icon={faShieldHalved} />
                        <span>Escrow Protected</span>
                      </div>
                    )}

                    <button
                      onClick={() => onJoinRoom(sess.id)}
                      className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer hover:scale-105 active:scale-95 ${
                        isCompleted
                          ? 'bg-[#EEF2F6] hover:bg-[#E2E8F0] text-[#0A0E14]'
                          : 'bg-[#3B72FE] hover:bg-[#2A61ED] text-white shadow-md shadow-blue-500/20'
                      }`}
                    >
                      <FontAwesomeIcon icon={faVideo} />
                      <span>{isCompleted ? 'View Notes' : 'Join Studio Room'}</span>
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>

    </div>
  );
};
