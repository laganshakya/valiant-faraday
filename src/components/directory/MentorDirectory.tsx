import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { Profile, SkillCategory } from '../../types';
import { useApp } from '../../context/AppContext';
import { MentorCard } from './MentorCard';
import { BookingModal } from './BookingModal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSearch, 
  faFilter, 
  faGraduationCap, 
  faArrowRight,
  faArrowDown
} from '@fortawesome/free-solid-svg-icons';
import gsap from 'gsap';
import { KineticTicker } from '../story/KineticTicker';
import { ScrollStory } from '../story/ScrollStory';

interface MentorDirectoryProps {
  onSessionCreated: (sessionId: string) => void;
  onNavigateToBounties: () => void;
}

const CATEGORIES: ('All' | SkillCategory)[] = [
  'All',
  'Engineering',
  'Design',
  'Data Science',
  'Languages',
  'Career & Interviews',
  'Academics'
];

export const MentorDirectory: React.FC<MentorDirectoryProps> = ({
  onSessionCreated,
  onNavigateToBounties
}) => {
  const { allUsers, currentUser, openAuthModal, showToast } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | SkillCategory>('All');
  const [selectedCampus, setSelectedCampus] = useState('All');
  const [bookingMentor, setBookingMentor] = useState<Profile | null>(null);

  const heroHeadlineRef = useRef<HTMLHeadingElement>(null);
  const heroSubRef = useRef<HTMLParagraphElement>(null);
  const bandRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Kinetic Word Mask Reveal
      const words = heroHeadlineRef.current?.querySelectorAll('.kinetic-word');
      if (words && words.length > 0) {
        gsap.fromTo(
          words,
          { yPercent: 120, opacity: 0, rotate: 3 },
          { yPercent: 0, opacity: 1, rotate: 0, duration: 0.9, stagger: 0.06, ease: 'power4.out', delay: 0.1 }
        );
      }

      gsap.fromTo(
        heroSubRef.current,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out', delay: 0.4 }
      );
    });

    return () => ctx.revert();
  }, []);

  const handleScrollToDirectory = (campus?: string) => {
    if (campus) {
      setSelectedCampus(campus);
    }
    bandRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Distinct campuses
  const campuses = useMemo(() => {
    const set = new Set<string>();
    allUsers.forEach(u => {
      if (u.campus) set.add(u.campus);
    });
    return ['All', ...Array.from(set)];
  }, [allUsers]);

  // Filter mentors
  const filteredMentors = useMemo(() => {
    return allUsers.filter(user => {
      if (selectedCampus !== 'All' && user.campus !== selectedCampus) {
        return false;
      }
      if (selectedCategory !== 'All') {
        const hasCategory = (user.skills || []).some(
          s => s.category === selectedCategory && s.skill_type === 'TEACHING'
        );
        if (!hasCategory) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = user.name.toLowerCase().includes(q);
        const matchesHeadline = user.headline.toLowerCase().includes(q);
        const matchesCampus = user.campus.toLowerCase().includes(q);
        const matchesBio = user.bio.toLowerCase().includes(q);
        const matchesSkills = (user.skills || []).some(
          s => s.skill_name.toLowerCase().includes(q)
        );
        if (!matchesName && !matchesHeadline && !matchesCampus && !matchesBio && !matchesSkills) {
          return false;
        }
      }
      return true;
    });
  }, [allUsers, selectedCampus, selectedCategory, searchQuery]);

  return (
    <div className="space-y-10 pb-16">
      
      {/* Editorial Hero Section (Inspired by Boon Global) */}
      <section className="pt-8 pb-4 text-center max-w-4xl mx-auto space-y-6">
        
        {/* Kinetic Micro-Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-[#8E9BAE]">
          <span className="w-2 h-2 rounded-full bg-[#00D284]"></span>
          <span>Time-Banking Economy • Zero ₹ Cash Required</span>
        </div>

        {/* Architectural Headline with Kinetic Typography Masks */}
        <h1 
          ref={heroHeadlineRef}
          className="font-display font-extrabold text-4xl sm:text-6xl lg:text-7xl tracking-[-0.035em] text-white leading-[1.05]"
        >
          <span className="kinetic-mask">
            <span className="kinetic-word">Trade</span>
          </span>{' '}
          <span className="kinetic-mask">
            <span className="kinetic-word">what</span>
          </span>{' '}
          <span className="kinetic-mask">
            <span className="kinetic-word">you</span>
          </span>{' '}
          <span className="kinetic-mask">
            <span className="kinetic-word">know.</span>
          </span>
          <br />
          <span className="text-[#3B72FE]">
            <span className="kinetic-mask">
              <span className="kinetic-word">Master</span>
            </span>{' '}
            <span className="kinetic-mask">
              <span className="kinetic-word">what</span>
            </span>{' '}
            <span className="kinetic-mask">
              <span className="kinetic-word">you</span>
            </span>{' '}
            <span className="kinetic-mask">
              <span className="kinetic-word">need.</span>
            </span>
          </span>
        </h1>

        {/* Value Proposition in INR */}
        <p 
          ref={heroSubRef}
          className="text-[#8E9BAE] text-base sm:text-lg max-w-2xl mx-auto font-normal leading-relaxed"
        >
          Commercial tutors charge <strong className="text-white font-medium">₹1,500 – ₹5,000/hr</strong>. On SkillSwap, your knowledge is your currency: teach 1 hour, earn 1 credit, and learn anything from verified peers.
        </p>

        {/* Hero CTAs */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => handleScrollToDirectory()}
            className="px-6 py-3 rounded-full bg-[#3B72FE] hover:bg-[#2A61ED] text-white text-xs font-bold shadow-lg shadow-blue-500/25 transition-all flex items-center gap-2 group"
          >
            <span>Browse Mentors Directly</span>
            <FontAwesomeIcon icon={faArrowDown} className="text-[10px] group-hover:translate-y-0.5 transition-transform" />
          </button>
          <button
            onClick={() => {
              const el = document.getElementById('scroll-story-anchor');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-6 py-3 rounded-full bg-white/5 hover:bg-white/10 text-white text-xs font-semibold border border-white/10 transition-colors flex items-center gap-2"
          >
            <span>How The Economy Works</span>
            <FontAwesomeIcon icon={faArrowRight} className="rotate-90 text-[10px] text-[#3B72FE]" />
          </button>
        </div>

        {/* Metric Tickers */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-4 text-xs font-mono">
          <div className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[#EEF2F6] flex items-center gap-2">
            <span className="font-bold text-[#00D284]">₹2.4L+</span>
            <span className="text-[#8E9BAE]">Peer Tuition Saved</span>
          </div>
          <div className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[#EEF2F6] flex items-center gap-2">
            <span className="font-bold text-[#3B72FE]">15–60m</span>
            <span className="text-[#8E9BAE]">Micro-Sessions</span>
          </div>
          <div className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[#EEF2F6] flex items-center gap-2">
            <span className="font-bold text-amber-400">100%</span>
            <span className="text-[#8E9BAE]">Escrow Protected</span>
          </div>
        </div>

      </section>

      {/* Kinetic Velocity Ticker Ribbon */}
      <KineticTicker />

      {/* 4-Act Scroll Storytelling Experience */}
      <div id="scroll-story-anchor">
        <ScrollStory onExploreMentors={handleScrollToDirectory} />
      </div>

      {/* Sculpted Daylight Architectural Band (NordPixel "Weisse Bänder") */}
      <div 
        id="mentor-catalogue"
        ref={bandRef}
        className="band-daylight p-6 sm:p-10 space-y-8 scroll-mt-24"
      >
        
        {/* Search & Filter Controls */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            
            {/* Search Input */}
            <div className="flex-1 relative">
              <FontAwesomeIcon 
                icon={faSearch} 
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8E9BAE] text-sm" 
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by skill (e.g. React, Figma, French, System Design) or mentor name..."
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white border border-black/10 focus:outline-none focus:ring-2 focus:ring-[#3B72FE] text-sm text-[#0A0E14] placeholder-[#8E9BAE] shadow-xs"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[#8E9BAE] hover:text-[#0A0E14]"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Campus Selector */}
            <div className="w-full md:w-60 relative">
              <FontAwesomeIcon 
                icon={faGraduationCap} 
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8E9BAE] text-sm pointer-events-none" 
              />
              <select
                value={selectedCampus}
                onChange={(e) => setSelectedCampus(e.target.value)}
                aria-label="Filter by Campus"
                className="w-full pl-11 pr-8 py-3 rounded-2xl bg-white border border-black/10 focus:outline-none focus:ring-2 focus:ring-[#3B72FE] text-sm text-[#0A0E14] appearance-none cursor-pointer shadow-xs"
              >
                <option value="All">All Campuses</option>
                {campuses.filter(c => c !== 'All').map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

          </div>

          {/* Category Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full font-semibold transition-all shrink-0 ${
                  selectedCategory === cat
                    ? 'bg-[#0A0E14] text-white shadow-sm'
                    : 'bg-white hover:bg-black/5 text-[#5A6A80] border border-black/5'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Directory Section Header */}
        <div className="flex items-center justify-between pt-2 border-t border-black/5">
          <div>
            <h2 className="font-display font-extrabold text-2xl text-[#0A0E14]">
              Available Mentors
            </h2>
            <p className="text-xs text-[#5A6A80]">
              Showing {filteredMentors.length} peer mentors ready to swap knowledge
            </p>
          </div>

          <button
            onClick={onNavigateToBounties}
            className="text-xs font-bold text-[#3B72FE] hover:text-[#1E40AF] flex items-center gap-1.5 transition-colors"
          >
            <span>Need urgent help? Post on Bounty Board</span>
            <FontAwesomeIcon icon={faArrowRight} className="text-[10px]" />
          </button>
        </div>

        {/* Mentors Grid */}
        {filteredMentors.length === 0 ? (
          <div className="bg-white rounded-3xl border border-black/5 p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#EEF2F6] text-[#8E9BAE] flex items-center justify-center mx-auto text-lg">
              <FontAwesomeIcon icon={faFilter} />
            </div>
            <h3 className="font-bold text-[#0A0E14] text-base">No mentors found matching your filters</h3>
            <p className="text-xs text-[#5A6A80] max-w-sm mx-auto">
              Try adjusting your search query or campus filter, or post a request on the Bounty Board!
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
                setSelectedCampus('All');
              }}
              className="px-5 py-2 rounded-full bg-[#0A0E14] text-white text-xs font-semibold hover:bg-black/80 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMentors.map(mentor => (
              <MentorCard
                key={mentor.id}
                mentor={mentor}
                onBook={(m) => {
                  if (!currentUser) {
                    showToast({
                      type: 'info',
                      title: 'Sign In Required',
                      message: 'Please sign in or create a free account with 2 starter credits to book a swap.'
                    });
                    openAuthModal('signup');
                    return;
                  }
                  setBookingMentor(m);
                }}
              />
            ))}
          </div>
        )}

      </div>

      {/* Booking Modal */}
      {bookingMentor && (
        <BookingModal
          mentor={bookingMentor}
          isOpen={Boolean(bookingMentor)}
          onClose={() => setBookingMentor(null)}
          onSuccess={(sessionId) => {
            onSessionCreated(sessionId);
          }}
        />
      )}

    </div>
  );
};
