import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faHandshakeAngle, 
  faLock, 
  faUserGroup, 
  faBullhorn, 
  faVideo, 
  faUserGraduate,
  faChevronDown,
  faPlus,
  faRightFromBracket
} from '@fortawesome/free-solid-svg-icons';
import gsap from 'gsap';

interface NavbarProps {
  currentTab: 'directory' | 'bounties' | 'sessions' | 'profile';
  onSelectTab: (tab: 'directory' | 'bounties' | 'sessions' | 'profile') => void;
  onOpenWallet: () => void;
  onOpenPostBounty: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  onOpenWallet,
  onOpenPostBounty
}) => {
  const { currentUser, openAuthModal, signOut } = useApp();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (navRef.current) {
      gsap.fromTo(
        navRef.current,
        { y: -30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' }
      );
    }
  }, []);

  return (
    <header className="sticky top-2 z-50 px-3 sm:px-6 pointer-events-none">
      <nav 
        ref={navRef}
        className="pointer-events-auto max-w-6xl mx-auto glass-capsule rounded-full px-4 sm:px-6 py-2.5 shadow-2xl flex items-center justify-between gap-4 border border-white/10"
      >
        
        {/* Logo & Brand */}
        <div 
          onClick={() => onSelectTab('directory')}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#3B72FE] to-[#1E40AF] flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform duration-300">
            <FontAwesomeIcon icon={faHandshakeAngle} className="text-sm" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-display font-extrabold text-lg tracking-tight text-white">
              Skill<span className="text-[#3B72FE]">Swap</span>
            </span>
            <span className="hidden sm:inline-block text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-white/5 text-[#8E9BAE] border border-white/10">
              ₹0 Tuition
            </span>
          </div>
        </div>

        {/* Center Nav Items */}
        <div className="hidden md:flex items-center gap-1 bg-black/40 p-1 rounded-full border border-white/5">
          <button
            onClick={() => onSelectTab('directory')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ${
              currentTab === 'directory'
                ? 'bg-[#3B72FE] text-white shadow-sm'
                : 'text-[#8E9BAE] hover:text-white hover:bg-white/5'
            }`}
          >
            <FontAwesomeIcon icon={faUserGroup} className="text-[11px]" />
            <span>Mentors</span>
          </button>

          <button
            onClick={() => onSelectTab('bounties')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ${
              currentTab === 'bounties'
                ? 'bg-[#3B72FE] text-white shadow-sm'
                : 'text-[#8E9BAE] hover:text-white hover:bg-white/5'
            }`}
          >
            <FontAwesomeIcon icon={faBullhorn} className="text-[11px]" />
            <span>Help Wanted</span>
          </button>

          <button
            onClick={() => onSelectTab('sessions')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ${
              currentTab === 'sessions'
                ? 'bg-[#3B72FE] text-white shadow-sm'
                : 'text-[#8E9BAE] hover:text-white hover:bg-white/5'
            }`}
          >
            <FontAwesomeIcon icon={faVideo} className="text-[11px]" />
            <span>Sessions</span>
          </button>

          {currentUser && (
            <button
              onClick={() => onSelectTab('profile')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ${
                currentTab === 'profile'
                  ? 'bg-[#3B72FE] text-white shadow-sm'
                : 'text-[#8E9BAE] hover:text-white hover:bg-white/5'
              }`}
            >
              <FontAwesomeIcon icon={faUserGraduate} className="text-[11px]" />
              <span>Profile</span>
            </button>
          )}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2.5">
          
          {currentUser ? (
            <>
              {/* Post Request Button */}
              <button
                onClick={onOpenPostBounty}
                className="hidden lg:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white text-xs font-semibold border border-white/10 transition-colors cursor-pointer"
              >
                <FontAwesomeIcon icon={faPlus} className="text-[10px] text-[#3B72FE]" />
                <span>Ask for Help</span>
              </button>

              {/* Credit Wallet Pill */}
              <button
                onClick={onOpenWallet}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#151C26] hover:bg-[#1B2432] border border-white/10 transition-all text-left group cursor-pointer"
                title="Click to view Credit Balance and Escrow details"
              >
                <span className="w-2 h-2 rounded-full bg-[#00D284] shadow-sm shadow-[#00D284]/80"></span>
                <div className="flex items-baseline gap-1 font-mono text-xs">
                  <span className="font-bold text-white tracking-tight">
                    {currentUser.credits_balance.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-[#8E9BAE] font-sans">cr</span>
                </div>
                {currentUser.credits_escrow > 0 && (
                  <div className="flex items-center gap-1 text-[10px] text-amber-400 bg-amber-950/60 px-1.5 py-0.2 rounded-full border border-amber-500/20 font-mono">
                    <FontAwesomeIcon icon={faLock} className="text-[8px]" />
                    <span>{currentUser.credits_escrow.toFixed(2)}</span>
                  </div>
                )}
              </button>

              {/* Profile Avatar & Account Menu */}
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-1.5 p-1 rounded-full hover:bg-white/10 border border-transparent hover:border-white/10 transition-all cursor-pointer"
                >
                  <img
                    src={currentUser.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80'}
                    alt={currentUser.name}
                    className="w-7 h-7 rounded-full object-cover ring-1 ring-white/20"
                  />
                  <FontAwesomeIcon icon={faChevronDown} className="text-[9px] text-[#8E9BAE] mr-1 hidden sm:block" />
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-3 w-64 bg-[#0E131B] rounded-3xl shadow-2xl border border-white/10 py-3 z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="px-4 py-2 border-b border-white/5">
                      <p className="font-bold text-white text-sm">{currentUser.name}</p>
                      <p className="text-[11px] text-[#8E9BAE] truncate">{currentUser.email}</p>
                      <p className="text-[10px] text-[#3B72FE] font-mono mt-0.5">{currentUser.campus}</p>
                    </div>

                    <div className="p-2 space-y-1">
                      <button
                        onClick={() => {
                          onSelectTab('profile');
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2 p-2 rounded-2xl text-left text-xs text-[#EEF2F6] hover:bg-white/5 transition-colors cursor-pointer"
                      >
                        <FontAwesomeIcon icon={faUserGraduate} className="text-[#3B72FE]" />
                        <span>My Skills & Profile</span>
                      </button>

                      <button
                        onClick={() => {
                          onOpenWallet();
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2 p-2 rounded-2xl text-left text-xs text-[#EEF2F6] hover:bg-white/5 transition-colors cursor-pointer"
                      >
                        <FontAwesomeIcon icon={faLock} className="text-[#00D284]" />
                        <span>Wallet & Escrow</span>
                      </button>
                    </div>

                    <div className="border-t border-white/5 pt-2 px-2">
                      <button
                        onClick={() => {
                          signOut();
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2 p-2 rounded-2xl text-rose-400 hover:bg-rose-500/10 text-xs transition-colors cursor-pointer"
                      >
                        <FontAwesomeIcon icon={faRightFromBracket} />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Logged Out Actions */
            <div className="flex items-center gap-2">
              <button
                onClick={() => openAuthModal('signin')}
                className="px-4 py-1.5 rounded-full text-xs font-semibold text-[#EEF2F6] hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              >
                Sign In
              </button>

              <button
                onClick={() => openAuthModal('signup')}
                className="px-4 py-1.5 rounded-full bg-[#3B72FE] hover:bg-[#2A61ED] text-white text-xs font-bold shadow-sm shadow-blue-500/20 transition-all flex items-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95"
              >
                <span>Get 2 Credits</span>
              </button>
            </div>
          )}

        </div>

      </nav>

      {/* Mobile Nav */}
      <div className="flex md:hidden glass-capsule rounded-full mt-2 px-4 py-2 justify-around pointer-events-auto border border-white/10">
        <button
          onClick={() => onSelectTab('directory')}
          className={`text-xs font-semibold ${currentTab === 'directory' ? 'text-[#3B72FE]' : 'text-[#8E9BAE]'}`}
        >
          Mentors
        </button>
        <button
          onClick={() => onSelectTab('bounties')}
          className={`text-xs font-semibold ${currentTab === 'bounties' ? 'text-[#3B72FE]' : 'text-[#8E9BAE]'}`}
        >
          Bounties
        </button>
        <button
          onClick={() => onSelectTab('sessions')}
          className={`text-xs font-semibold ${currentTab === 'sessions' ? 'text-[#3B72FE]' : 'text-[#8E9BAE]'}`}
        >
          Sessions
        </button>
        {currentUser && (
          <button
            onClick={() => onSelectTab('profile')}
            className={`text-xs font-semibold ${currentTab === 'profile' ? 'text-[#3B72FE]' : 'text-[#8E9BAE]'}`}
          >
            Profile
          </button>
        )}
      </div>
    </header>
  );
};
