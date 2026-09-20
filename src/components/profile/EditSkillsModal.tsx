import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { DataService } from '../../services/dataService';
import type { SkillCategory, SkillType, ProficiencyLevel } from '../../types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faXmark, 
  faGraduationCap, 
  faPlus, 
  faBookOpen 
} from '@fortawesome/free-solid-svg-icons';

interface EditSkillsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSkillAdded: () => void;
  defaultType?: SkillType;
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

export const EditSkillsModal: React.FC<EditSkillsModalProps> = ({
  isOpen,
  onClose,
  onSkillAdded,
  defaultType = 'TEACHING'
}) => {
  const { currentUser, refreshUserData, showToast } = useApp();

  const [skillName, setSkillName] = useState('');
  const [category, setCategory] = useState<SkillCategory>('Engineering');
  const [skillType, setSkillType] = useState<SkillType>(defaultType);
  const [proficiency, setProficiency] = useState<ProficiencyLevel>('Intermediate');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !currentUser) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!skillName.trim()) {
      showToast({
        type: 'warning',
        title: 'Skill Required',
        message: 'Please enter a skill title.'
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await DataService.addSkill({
        profile_id: currentUser.id,
        skill_name: skillName.trim(),
        category: category,
        skill_type: skillType,
        proficiency_level: proficiency,
        years_experience: 1.5,
        description: description.trim() || undefined,
        endorsements_count: 0
      });

      await refreshUserData();
      onSkillAdded();

      showToast({
        type: 'success',
        title: 'Skill Published!',
        message: `${skillName} added to your ${skillType === 'TEACHING' ? 'teaching repertoire' : 'learning roadmap'}.`
      });

      onClose();
    } catch (err: any) {
      console.error('Failed to add skill:', err);
      showToast({
        type: 'error',
        title: 'Error',
        message: err.message || 'Could not save skill.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#080B10]/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-black/10 overflow-hidden flex flex-col max-h-[95vh]">
        
        {/* Header */}
        <div className="p-6 bg-[#0E131B] text-white flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#3B72FE] text-white flex items-center justify-center shadow-xs">
              <FontAwesomeIcon icon={skillType === 'TEACHING' ? faGraduationCap : faBookOpen} />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-white">
                {skillType === 'TEACHING' ? 'Add Skill to Teach' : 'Add Skill to Learn'}
              </h3>
              <p className="text-xs text-[#8E9BAE]">Build your verified peer exchange profile</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#8E9BAE] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs text-[#0A0E14]">

          {/* Type Selector */}
          <div>
            <label className="block font-bold uppercase tracking-wider text-[#5A6A80] mb-1.5">
              Category Section
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSkillType('TEACHING')}
                className={`p-3 rounded-2xl border font-bold transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-105 active:scale-95 ${
                  skillType === 'TEACHING'
                    ? 'border-[#3B72FE] bg-[#3B72FE]/10 text-[#0A0E14]'
                    : 'border-black/10 text-[#5A6A80] bg-[#F6F8FA]'
                }`}
              >
                <FontAwesomeIcon icon={faGraduationCap} />
                <span>Skill I Can Teach</span>
              </button>
              <button
                type="button"
                onClick={() => setSkillType('LEARNING')}
                className={`p-3 rounded-2xl border font-bold transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-105 active:scale-95 ${
                  skillType === 'LEARNING'
                    ? 'border-[#00D284] bg-[#00D284]/10 text-[#0A0E14]'
                    : 'border-black/10 text-[#5A6A80] bg-[#F6F8FA]'
                }`}
              >
                <FontAwesomeIcon icon={faBookOpen} />
                <span>Skill I Want to Learn</span>
              </button>
            </div>
          </div>

          {/* Skill Title */}
          <div>
            <label className="block font-bold uppercase tracking-wider text-[#5A6A80] mb-1">
              Skill Title *
            </label>
            <input
              type="text"
              required
              value={skillName}
              onChange={(e) => setSkillName(e.target.value)}
              placeholder="e.g. Next.js App Router, Auto-Layout in Figma, French, System Design"
              className="w-full p-3 rounded-2xl border border-black/10 bg-[#F6F8FA] focus:bg-white focus:ring-2 focus:ring-[#3B72FE] focus:outline-none text-[#0A0E14] text-xs"
            />
          </div>

          {/* Category & Proficiency */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold uppercase tracking-wider text-[#5A6A80] mb-1">
                Field / Category *
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

            <div>
              <label className="block font-bold uppercase tracking-wider text-[#5A6A80] mb-1">
                Proficiency Level *
              </label>
              <select
                value={proficiency}
                onChange={(e) => setProficiency(e.target.value as ProficiencyLevel)}
                className="w-full p-3 rounded-2xl border border-black/10 bg-[#F6F8FA] focus:bg-white focus:ring-2 focus:ring-[#3B72FE] focus:outline-none text-[#0A0E14] text-xs"
              >
                <option value="Beginner">Beginner (Foundations)</option>
                <option value="Intermediate">Intermediate (Practicing)</option>
                <option value="Advanced">Advanced (Proficient)</option>
                <option value="Expert">Expert (Shipped projects / Fluent)</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block font-bold uppercase tracking-wider text-[#5A6A80] mb-1">
              Description & Focus Areas
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What specifically can you teach or what are you aiming to learn?"
              className="w-full p-3 rounded-2xl border border-black/10 bg-[#F6F8FA] focus:bg-white focus:ring-2 focus:ring-[#3B72FE] focus:outline-none text-[#0A0E14] text-xs"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-full bg-[#3B72FE] hover:bg-[#2A61ED] text-white font-bold text-sm shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FontAwesomeIcon icon={faPlus} />
            <span>{isSubmitting ? 'Saving...' : 'Add Skill to Profile'}</span>
          </button>

        </form>

      </div>
    </div>
  );
};
