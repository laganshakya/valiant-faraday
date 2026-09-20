import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { DataService } from '../../services/dataService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faXmark, 
  faUser, 
  faGraduationCap, 
  faLocationDot, 
  faCheck,
  faCamera,
  faPen
} from '@fortawesome/free-solid-svg-icons';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdated: () => void;
}

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80'
];

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  onProfileUpdated
}) => {
  const { currentUser, refreshUserData, showToast } = useApp();

  const [name, setName] = useState(currentUser?.name || '');
  const [headline, setHeadline] = useState(currentUser?.headline || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [campus, setCampus] = useState(currentUser?.campus || '');
  const [city, setCity] = useState(currentUser?.city || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatar_url || AVATAR_PRESETS[0]);
  const [github, setGithub] = useState(currentUser?.social_links?.github || '');
  const [linkedin, setLinkedin] = useState(currentUser?.social_links?.linkedin || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !currentUser) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast({
        type: 'warning',
        title: 'Name Required',
        message: 'Please provide your full name.'
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await DataService.updateProfile({
        id: currentUser.id,
        name: name.trim(),
        headline: headline.trim() || 'Student & Peer Mentor',
        bio: bio.trim(),
        campus: campus.trim() || 'University Peer',
        city: city.trim() || 'Remote',
        avatar_url: avatarUrl.trim() || currentUser.avatar_url,
        social_links: {
          github: github.trim() || undefined,
          linkedin: linkedin.trim() || undefined
        }
      });

      await refreshUserData();
      onProfileUpdated();

      showToast({
        type: 'success',
        title: 'Profile Updated!',
        message: 'Your profile changes have been saved to Supabase.'
      });

      onClose();
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      showToast({
        type: 'error',
        title: 'Update Failed',
        message: err.message || 'Could not save profile details.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#080B10]/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-black/10 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-6 bg-[#0E131B] text-white flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#3B72FE] text-white flex items-center justify-center shadow-xs">
              <FontAwesomeIcon icon={faPen} />
            </div>
            <div>
              <h3 className="font-display font-extrabold text-xl text-white">Edit Student Profile</h3>
              <p className="text-xs text-[#8E9BAE]">Update your campus identity and peer portfolio</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#8E9BAE] hover:text-white hover:bg-white/10 transition-colors"
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-xs text-[#0A0E14]">
          
          {/* Avatar Preview & Selection */}
          <div>
            <label className="block font-bold uppercase tracking-wider text-[#5A6A80] mb-2">
              Profile Avatar
            </label>
            <div className="flex items-center gap-4 mb-3">
              <img
                src={avatarUrl}
                alt="Avatar preview"
                className="w-16 h-16 rounded-2xl object-cover ring-2 ring-[#3B72FE] shadow-sm shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-[#5A6A80] mb-1.5 font-medium">Select a preset or paste an image URL:</p>
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {AVATAR_PRESETS.map((preset, idx) => (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => setAvatarUrl(preset)}
                      className={`w-9 h-9 rounded-xl overflow-hidden border-2 shrink-0 transition-transform cursor-pointer hover:scale-105 active:scale-95 ${
                        avatarUrl === preset ? 'border-[#3B72FE] scale-105 ring-2 ring-[#3B72FE]/30' : 'border-black/10 hover:border-black/30'
                      }`}
                    >
                      <img src={preset} alt={`Preset ${idx}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="relative">
              <FontAwesomeIcon icon={faCamera} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8E9BAE]" />
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="Custom Image URL (https://...)"
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-black/10 bg-[#F6F8FA] focus:bg-white focus:ring-2 focus:ring-[#3B72FE] focus:outline-none text-xs"
              />
            </div>
          </div>

          {/* Full Name & Headline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold uppercase tracking-wider text-[#5A6A80] mb-1">
                Full Name *
              </label>
              <div className="relative">
                <FontAwesomeIcon icon={faUser} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8E9BAE]" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Lagan Shakya"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-black/10 bg-[#F6F8FA] focus:bg-white focus:ring-2 focus:ring-[#3B72FE] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-[#5A6A80] mb-1">
                Campus / University
              </label>
              <div className="relative">
                <FontAwesomeIcon icon={faGraduationCap} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8E9BAE]" />
                <input
                  type="text"
                  value={campus}
                  onChange={(e) => setCampus(e.target.value)}
                  placeholder="e.g. Chandigarh University"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-black/10 bg-[#F6F8FA] focus:bg-white focus:ring-2 focus:ring-[#3B72FE] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* City / Location & Professional Headline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold uppercase tracking-wider text-[#5A6A80] mb-1">
                City / Location
              </label>
              <div className="relative">
                <FontAwesomeIcon icon={faLocationDot} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8E9BAE]" />
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Mohali, Punjab"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-black/10 bg-[#F6F8FA] focus:bg-white focus:ring-2 focus:ring-[#3B72FE] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-[#5A6A80] mb-1">
                Headline
              </label>
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="e.g. CS Senior @ Chandigarh University | Full-Stack"
                className="w-full px-4 py-2.5 rounded-xl border border-black/10 bg-[#F6F8FA] focus:bg-white focus:ring-2 focus:ring-[#3B72FE] focus:outline-none"
              />
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="block font-bold uppercase tracking-wider text-[#5A6A80] mb-1">
              About / Bio
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell peers about your background, what you enjoy teaching, and what you are looking to learn..."
              className="w-full px-4 py-2.5 rounded-xl border border-black/10 bg-[#F6F8FA] focus:bg-white focus:ring-2 focus:ring-[#3B72FE] focus:outline-none resize-none leading-relaxed"
            />
          </div>

          {/* Social Links */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold uppercase tracking-wider text-[#5A6A80] mb-1">
                GitHub Profile URL
              </label>
              <input
                type="url"
                value={github}
                onChange={(e) => setGithub(e.target.value)}
                placeholder="https://github.com/..."
                className="w-full px-4 py-2 rounded-xl border border-black/10 bg-[#F6F8FA] focus:bg-white focus:ring-2 focus:ring-[#3B72FE] focus:outline-none text-xs"
              />
            </div>
            <div>
              <label className="block font-bold uppercase tracking-wider text-[#5A6A80] mb-1">
                LinkedIn Profile URL
              </label>
              <input
                type="url"
                value={linkedin}
                onChange={(e) => setLinkedin(e.target.value)}
                placeholder="https://linkedin.com/in/..."
                className="w-full px-4 py-2 rounded-xl border border-black/10 bg-[#F6F8FA] focus:bg-white focus:ring-2 focus:ring-[#3B72FE] focus:outline-none text-xs"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-full bg-[#3B72FE] hover:bg-[#2A61ED] text-white font-bold text-xs tracking-wide shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FontAwesomeIcon icon={faCheck} />
              <span>{isSubmitting ? 'Saving to Database...' : 'Save Profile Changes'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
