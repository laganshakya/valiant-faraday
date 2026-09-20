import React, { useState, useEffect, useCallback } from 'react';
import type { UserSkill, Review, SkillType } from '../../types';
import { useApp } from '../../context/AppContext';
import { DataService } from '../../services/dataService';
import { EditSkillsModal } from './EditSkillsModal';
import { EditProfileModal } from './EditProfileModal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faGraduationCap, 
  faLocationDot, 
  faStar, 
  faCoins, 
  faLock, 
  faPlus, 
  faTrashCan, 
  faShieldHalved, 
  faAward, 
  faBookOpen,
  faCommentDots,
  faPen
} from '@fortawesome/free-solid-svg-icons';

interface UserProfileViewProps {
  onOpenWallet: () => void;
  onExploreBounties: () => void;
}

export const UserProfileView: React.FC<UserProfileViewProps> = ({
  onOpenWallet,
  onExploreBounties
}) => {
  const { currentUser, refreshUserData, showToast } = useApp();

  const [skills, setSkills] = useState<UserSkill[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [modalSkillType, setModalSkillType] = useState<SkillType>('TEACHING');

  const loadProfileData = useCallback(async () => {
    if (!currentUser) return;
    try {
      const userSkills = await DataService.getSkills(currentUser.id);
      setSkills(userSkills);
      const userReviews = await DataService.getReviews(currentUser.id);
      setReviews(userReviews);
    } catch (err) {
      console.error('Failed to load profile details:', err);
    }
  }, [currentUser]);

  useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);

  const handleDeleteSkill = async (skillId: string, skillName: string) => {
    try {
      await DataService.deleteSkill(skillId);
      await refreshUserData();
      await loadProfileData();
      showToast({
        type: 'info',
        title: 'Skill Removed',
        message: `${skillName} has been removed from your profile.`
      });
    } catch (err: any) {
      console.error('Failed to delete skill:', err);
      showToast({
        type: 'error',
        title: 'Error',
        message: err.message || 'Could not delete skill.'
      });
    }
  };

  if (!currentUser) return null;

  const teachingSkills = skills.filter(s => s.skill_type === 'TEACHING');
  const learningSkills = skills.filter(s => s.skill_type === 'LEARNING');

  return (
    <div className="space-y-8 pb-16">
      
      {/* Top Banner Header */}
      <div className="pt-6 pb-2 text-center max-w-2xl mx-auto space-y-3">
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-white tracking-tight">
          My Atelier <span className="text-[#3B72FE]">Profile</span>
        </h1>
        <p className="text-xs text-[#8E9BAE]">
          Manage your exchange portfolio, track peer endorsements, and review time-bank credits
        </p>
      </div>

      {/* Daylight Band */}
      <div className="band-daylight p-6 sm:p-10 space-y-8">
        
        {/* Profile Card */}
        <div className="bg-white rounded-3xl border border-black/5 p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          
          <div className="flex items-start sm:items-center gap-5">
            <img 
              src={currentUser.avatar_url} 
              alt={currentUser.name} 
              className="w-20 h-20 rounded-3xl object-cover ring-2 ring-black/5 shadow-md"
            />
            
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-display font-extrabold text-2xl text-[#0A0E14]">{currentUser.name}</h2>
                <span className="text-[10px] font-bold bg-[#3B72FE]/10 text-[#3B72FE] px-2.5 py-0.5 rounded-full border border-[#3B72FE]/20 flex items-center gap-1">
                  <FontAwesomeIcon icon={faShieldHalved} className="text-[9px]" />
                  Verified Student
                </span>
              </div>

              <p className="text-xs text-[#5A6A80] font-medium">{currentUser.headline}</p>

              {currentUser.bio && (
                <p className="text-xs text-[#44546A] pt-1 max-w-xl leading-relaxed">
                  {currentUser.bio}
                </p>
              )}

              <div className="flex items-center gap-3 text-xs text-[#8E9BAE] pt-1 flex-wrap">
                <span className="flex items-center gap-1 text-[#0A0E14] font-semibold">
                  <FontAwesomeIcon icon={faGraduationCap} className="text-[#3B72FE] text-[11px]" />
                  {currentUser.campus}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <FontAwesomeIcon icon={faLocationDot} className="text-[#8E9BAE] text-[10px]" />
                  {currentUser.city}
                </span>
                <span>•</span>
                <span className="font-mono font-bold text-[#0A0E14] flex items-center gap-1">
                  <FontAwesomeIcon icon={faStar} className="text-amber-500 text-[10px]" />
                  {currentUser.rating_avg.toFixed(1)} ({currentUser.rating_count} reviews)
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-start sm:items-end gap-3 shrink-0">
            <button
              onClick={() => setIsEditProfileOpen(true)}
              className="px-4 py-2 rounded-full bg-[#0A0E14] hover:bg-[#3B72FE] text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <FontAwesomeIcon icon={faPen} className="text-[10px]" />
              <span>Edit Profile</span>
            </button>

            <div className="flex items-center gap-1.5 flex-wrap">
              {currentUser.badges.map(b => (
                <span key={b} className="text-[11px] font-semibold px-3 py-1 rounded-full bg-[#EEF2F6] text-[#0A0E14] border border-black/5">
                  {b}
                </span>
              ))}
            </div>
          </div>

        </div>

        {/* Financial & Exchange Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          
          {/* Credits Available */}
          <div 
            onClick={onOpenWallet}
            className="bg-white p-6 rounded-3xl border border-black/5 shadow-xs hover:border-[#3B72FE] cursor-pointer transition-all space-y-1"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8E9BAE]">Available Balance</span>
              <FontAwesomeIcon icon={faCoins} className="text-amber-500" />
            </div>
            <div className="flex items-baseline gap-2 font-mono">
              <span className="text-3xl font-extrabold text-[#0A0E14]">{currentUser.credits_balance.toFixed(2)}</span>
              <span className="text-xs font-sans text-[#8E9BAE]">Credits</span>
            </div>
            <p className="text-[11px] text-[#3B72FE] font-semibold pt-1">
              Worth ~₹{Math.round(currentUser.credits_balance * 1500)} in tutoring value →
            </p>
          </div>

          {/* Escrow Locked */}
          <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8E9BAE]">Active Escrow</span>
              <FontAwesomeIcon icon={faLock} className="text-[#3B72FE]" />
            </div>
            <div className="flex items-baseline gap-2 font-mono">
              <span className="text-3xl font-extrabold text-[#0A0E14]">{currentUser.credits_escrow.toFixed(2)}</span>
              <span className="text-xs font-sans text-[#8E9BAE]">Credits</span>
            </div>
            <p className="text-[11px] text-[#5A6A80] pt-1">
              Safe protection for upcoming swaps
            </p>
          </div>

          {/* Tutoring Savings Generated */}
          <div 
            onClick={onExploreBounties}
            className="bg-white p-6 rounded-3xl border border-black/5 shadow-xs hover:border-[#00D284] cursor-pointer transition-all space-y-1"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8E9BAE]">Earn More Credits</span>
              <FontAwesomeIcon icon={faAward} className="text-[#00D284]" />
            </div>
            <div className="flex items-baseline gap-2 font-mono">
              <span className="text-3xl font-extrabold text-[#00D284]">₹0 Tuition</span>
            </div>
            <p className="text-[11px] text-[#00D284] font-semibold pt-1">
              Browse Help Wanted to earn credits →
            </p>
          </div>

        </div>

        {/* Skills Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Skills I Can Teach */}
          <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#3B72FE]/10 text-[#3B72FE] flex items-center justify-center text-sm font-bold">
                  <FontAwesomeIcon icon={faGraduationCap} />
                </div>
                <div>
                  <h3 className="font-display font-bold text-[#0A0E14] text-base">Skills I Can Teach</h3>
                  <p className="text-[11px] text-[#8E9BAE]">Peers book sessions with you to learn these</p>
                </div>
              </div>

              <button
                onClick={() => {
                  setModalSkillType('TEACHING');
                  setIsModalOpen(true);
                }}
                className="px-4 py-1.5 rounded-full bg-[#0A0E14] text-white hover:bg-[#3B72FE] text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95"
              >
                <FontAwesomeIcon icon={faPlus} className="text-[10px]" />
                <span>Add Skill</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {teachingSkills.length === 0 ? (
                <p className="text-xs text-[#8E9BAE] italic py-4 text-center">
                  No teaching skills listed yet. Add what you know to earn credits!
                </p>
              ) : (
                teachingSkills.map(s => (
                  <div 
                    key={s.id} 
                    className="p-4 rounded-2xl bg-[#F6F8FA] border border-black/5 flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-[#0A0E14]">{s.skill_name}</span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white text-[#0A0E14] border border-black/5">
                          {s.proficiency_level}
                        </span>
                        <span className="text-[10px] text-[#8E9BAE]">
                          {s.category}
                        </span>
                      </div>
                      {s.description && <p className="text-[#5A6A80] text-[11px]">{s.description}</p>}
                      <div className="text-[10px] font-mono text-[#3B72FE] font-bold">
                        ★ {s.endorsements_count} endorsements
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteSkill(s.id, s.skill_name)}
                      className="text-[#8E9BAE] hover:text-rose-600 transition-colors p-1.5 cursor-pointer hover:scale-110 active:scale-90"
                      title="Remove skill"
                    >
                      <FontAwesomeIcon icon={faTrashCan} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Skills I Want to Learn */}
          <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#00D284]/10 text-[#00D284] flex items-center justify-center text-sm font-bold">
                  <FontAwesomeIcon icon={faBookOpen} />
                </div>
                <div>
                  <h3 className="font-display font-bold text-[#0A0E14] text-base">Skills I Want to Learn</h3>
                  <p className="text-[11px] text-[#8E9BAE]">Enables high-synergy mutual swaps</p>
                </div>
              </div>

              <button
                onClick={() => {
                  setModalSkillType('LEARNING');
                  setIsModalOpen(true);
                }}
                className="px-4 py-1.5 rounded-full bg-[#00D284] text-[#0A0E14] hover:bg-[#00BF77] text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95"
              >
                <FontAwesomeIcon icon={faPlus} className="text-[10px]" />
                <span>Add Goal</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {learningSkills.length === 0 ? (
                <p className="text-xs text-[#8E9BAE] italic py-4 text-center">
                  No learning goals added yet.
                </p>
              ) : (
                learningSkills.map(s => (
                  <div 
                    key={s.id} 
                    className="p-4 rounded-2xl bg-[#F6F8FA] border border-black/5 flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-[#0A0E14]">{s.skill_name}</span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white text-[#0A0E14] border border-black/5">
                          Target: {s.proficiency_level}
                        </span>
                        <span className="text-[10px] text-[#8E9BAE]">
                          {s.category}
                        </span>
                      </div>
                      {s.description && <p className="text-[#5A6A80] text-[11px]">{s.description}</p>}
                    </div>

                    <button
                      onClick={() => handleDeleteSkill(s.id, s.skill_name)}
                      className="text-[#8E9BAE] hover:text-rose-600 transition-colors p-1.5 cursor-pointer hover:scale-110 active:scale-90"
                      title="Remove goal"
                    >
                      <FontAwesomeIcon icon={faTrashCan} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Peer Reviews & Endorsements */}
        <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display font-bold text-[#0A0E14] text-base flex items-center gap-2">
                <FontAwesomeIcon icon={faCommentDots} className="text-[#3B72FE]" />
                <span>Peer Endorsements & Reviews</span>
              </h3>
              <p className="text-xs text-[#8E9BAE]">Trust earned through verified micro-mentoring exchanges</p>
            </div>

            <span className="text-xs font-mono font-bold text-[#0A0E14] bg-[#EEF2F6] px-3 py-1 rounded-full">
              ★ {currentUser.rating_avg.toFixed(1)} Rating
            </span>
          </div>

          {reviews.length === 0 ? (
            <div className="p-8 text-center border border-dashed rounded-2xl text-[#8E9BAE] text-xs">
              No reviews yet. Complete your first swap to earn endorsements!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reviews.map(rev => (
                <div key={rev.id} className="p-5 rounded-2xl bg-[#F6F8FA] border border-black/5 space-y-2 text-xs">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <img 
                        src={rev.author?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=60'} 
                        alt={rev.author?.name || 'Peer'} 
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <div>
                        <p className="font-bold text-[#0A0E14]">{rev.author?.name || 'Peer'}</p>
                        <p className="text-[10px] text-[#8E9BAE]">{rev.author?.campus || 'Campus'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-amber-500 font-mono font-bold">
                      <span>★</span>
                      <span>{rev.rating}</span>
                    </div>
                  </div>

                  <p className="text-[#44546A] italic leading-relaxed">
                    "{rev.comment}"
                  </p>

                  {rev.tags && rev.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {rev.tags.map(t => (
                        <span key={t} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white text-[#0A0E14] border border-black/5">
                          ✓ {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Modals */}
      {isModalOpen && (
        <EditSkillsModal
          isOpen={isModalOpen}
          defaultType={modalSkillType}
          onClose={() => setIsModalOpen(false)}
          onSkillAdded={loadProfileData}
        />
      )}

      {isEditProfileOpen && (
        <EditProfileModal
          isOpen={isEditProfileOpen}
          onClose={() => setIsEditProfileOpen(false)}
          onProfileUpdated={loadProfileData}
        />
      )}

    </div>
  );
};
