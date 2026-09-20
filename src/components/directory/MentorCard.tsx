import React from 'react';
import type { Profile } from '../../types';
import { useApp } from '../../context/AppContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faStar, 
  faGraduationCap, 
  faLocationDot, 
  faCalendarPlus, 
  faArrowRightArrowLeft
} from '@fortawesome/free-solid-svg-icons';

interface MentorCardProps {
  mentor: Profile;
  onBook: (mentor: Profile) => void;
}

export const MentorCard: React.FC<MentorCardProps> = ({ mentor, onBook }) => {
  const { currentUser } = useApp();

  const teachingSkills = (mentor.skills || []).filter(s => s.skill_type === 'TEACHING');
  const learningSkills = (mentor.skills || []).filter(s => s.skill_type === 'LEARNING');

  // Check for mutual swap match
  const myTeachingSkills = (currentUser?.skills || [])
    .filter(s => s.skill_type === 'TEACHING')
    .map(s => s.skill_name.toLowerCase());

  const hasMutualMatch = learningSkills.some(ls => 
    myTeachingSkills.some(mts => mts.includes(ls.skill_name.toLowerCase()) || ls.skill_name.toLowerCase().includes(mts))
  );

  const isSelf = currentUser?.id === mentor.id;

  return (
    <div className={`bg-white rounded-3xl p-6 border transition-all duration-300 flex flex-col justify-between relative group ${
      hasMutualMatch && !isSelf
        ? 'border-[#00D284] shadow-lg shadow-[#00D284]/10'
        : 'border-black/5 shadow-xs hover:shadow-xl hover:-translate-y-1'
    }`}>
      
      {/* Mutual Match Banner */}
      {hasMutualMatch && !isSelf && (
        <div className="absolute -top-3 left-6 bg-[#00D284] text-[#0A0E14] text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
          <FontAwesomeIcon icon={faArrowRightArrowLeft} className="text-xs" />
          <span>Mutual Swap Synergy</span>
        </div>
      )}

      <div className="space-y-4">
        
        {/* Header Profile Info */}
        <div className="flex items-start gap-4">
          <div className="relative">
            <img 
              src={mentor.avatar_url} 
              alt={mentor.name} 
              className="w-14 h-14 rounded-2xl object-cover ring-2 ring-black/5 shadow-sm"
            />
            <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-[#00D284] border-2 border-white rounded-full" title="Active Peer"></span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1">
              <h3 className="font-display font-bold text-[#0A0E14] text-base truncate group-hover:text-[#3B72FE] transition-colors">
                {mentor.name}
              </h3>
              <div className="flex items-center gap-1 bg-black/5 px-2 py-0.5 rounded-full text-xs font-mono font-bold text-[#0A0E14] shrink-0">
                <FontAwesomeIcon icon={faStar} className="text-amber-500 text-[10px]" />
                <span>{mentor.rating_avg.toFixed(1)}</span>
                <span className="text-[#8E9BAE] text-[10px] font-normal">({mentor.rating_count})</span>
              </div>
            </div>

            <p className="text-xs text-[#5A6A80] font-medium line-clamp-1 mt-0.5">
              {mentor.headline}
            </p>

            <div className="flex items-center gap-2 mt-1.5 flex-wrap text-[11px] text-[#5A6A80]">
              <span className="font-semibold bg-[#EEF2F6] px-2 py-0.5 rounded-md flex items-center gap-1 text-[#0A0E14]">
                <FontAwesomeIcon icon={faGraduationCap} className="text-[#3B72FE] text-[10px]" />
                {mentor.campus}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <FontAwesomeIcon icon={faLocationDot} className="text-[#8E9BAE] text-[9px]" />
                {mentor.city}
              </span>
            </div>
          </div>
        </div>

        {/* Bio Snippet */}
        <p className="text-xs text-[#44546A] line-clamp-2 leading-relaxed">
          {mentor.bio}
        </p>

        {/* Skills Mentoring In */}
        <div className="pt-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8E9BAE] block mb-1.5">
            Mentoring In
          </span>
          <div className="flex flex-wrap gap-1.5">
            {teachingSkills.slice(0, 3).map(s => (
              <span 
                key={s.id}
                className="text-xs font-medium px-2.5 py-1 rounded-xl bg-[#F0F4F8] text-[#0A0E14] flex items-center gap-1.5 border border-black/5"
              >
                <span>{s.skill_name}</span>
                {s.endorsements_count > 0 && (
                  <span className="text-[10px] font-mono font-bold text-[#3B72FE]">
                    ★{s.endorsements_count}
                  </span>
                )}
              </span>
            ))}
            {teachingSkills.length > 3 && (
              <span className="text-[10px] font-semibold px-2 py-1 rounded-xl bg-black/5 text-[#5A6A80]">
                +{teachingSkills.length - 3} more
              </span>
            )}
          </div>
        </div>

        {/* Currently Learning */}
        {learningSkills.length > 0 && (
          <div className="pt-2 border-t border-black/5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8E9BAE] block mb-1">
              Wants to Learn (Direct Swap)
            </span>
            <div className="flex flex-wrap gap-1">
              {learningSkills.slice(0, 2).map(s => (
                <span 
                  key={s.id}
                  className="text-[11px] font-medium px-2 py-0.5 rounded-lg bg-[#00D284]/10 text-[#0E7048] border border-[#00D284]/20"
                >
                  {s.skill_name}
                </span>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Card Footer */}
      <div className="pt-4 mt-4 border-t border-black/5 flex items-center justify-between">
        <div>
          <div className="text-xs font-mono font-bold text-[#0A0E14]">
            0.25 - 1.00 cr
          </div>
          <p className="text-[10px] text-[#00D284] font-semibold">
            Saves ₹1,500 – ₹3,000/hr
          </p>
        </div>

        {isSelf ? (
          <span className="text-xs font-bold text-[#8E9BAE] bg-black/5 px-3 py-1.5 rounded-full">
            Your Profile
          </span>
        ) : (
          <button
            onClick={() => onBook(mentor)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#0A0E14] hover:bg-[#3B72FE] text-white text-xs font-semibold shadow-xs hover:shadow-lg transition-all duration-300 group-hover:bg-[#3B72FE] cursor-pointer hover:scale-105 active:scale-95"
          >
            <FontAwesomeIcon icon={faCalendarPlus} className="text-[11px]" />
            <span>Book Swap</span>
          </button>
        )}
      </div>

    </div>
  );
};
