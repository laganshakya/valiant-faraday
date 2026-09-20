import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { ToastContainer } from './components/common/ToastContainer';
import { WalletModal } from './components/common/WalletModal';
import { PostBountyModal } from './components/bounty/PostBountyModal';
import { AuthModal } from './components/auth/AuthModal';
import { MentorDirectory } from './components/directory/MentorDirectory';
import { BountyBoard } from './components/bounty/BountyBoard';
import { SessionsList } from './components/sessions/SessionsList';
import { UserProfileView } from './components/profile/UserProfileView';
import { VirtualRoom } from './components/room/VirtualRoom';

export function SkillSwapApp() {
  const { 
    currentUser, 
    isAuthModalOpen, 
    closeAuthModal, 
    authModalMode, 
    openAuthModal, 
    showToast 
  } = useApp();

  const [currentTab, setCurrentTab] = useState<'directory' | 'bounties' | 'sessions' | 'profile'>('directory');
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [isPostBountyOpen, setIsPostBountyOpen] = useState(false);

  const handleOpenRoom = (sessionId: string) => {
    setActiveSessionId(sessionId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExitRoom = () => {
    setActiveSessionId(null);
    setCurrentTab('sessions');
  };

  const handleOpenPostBounty = () => {
    if (!currentUser) {
      showToast({
        type: 'info',
        title: 'Sign In Required',
        message: 'Please create an account or sign in to post a help request.'
      });
      openAuthModal('signup');
      return;
    }
    setIsPostBountyOpen(true);
  };

  const handleOpenWallet = () => {
    if (!currentUser) {
      openAuthModal('signin');
      return;
    }
    setIsWalletOpen(true);
  };

  const handleSelectTab = (tab: 'directory' | 'bounties' | 'sessions' | 'profile') => {
    if ((tab === 'profile' || tab === 'sessions') && !currentUser) {
      showToast({
        type: 'info',
        title: 'Sign In Required',
        message: `Please sign in to view your ${tab}.`
      });
      openAuthModal('signin');
      return;
    }
    setActiveSessionId(null);
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#080B10] text-[#EEF2F6] font-body selection:bg-[#3B72FE] selection:text-white relative overflow-x-hidden">
      {/* Subtle ambient lighting */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-[#3B72FE]/10 rounded-full blur-[140px] pointer-events-none -z-10"></div>
      
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        onOpenWallet={handleOpenWallet}
        onOpenPostBounty={handleOpenPostBounty}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        
        {/* Active Virtual Room Workspace */}
        {activeSessionId ? (
          <VirtualRoom
            sessionId={activeSessionId}
            onExit={handleExitRoom}
          />
        ) : (
          <>
            {currentTab === 'directory' && (
              <MentorDirectory
                onSessionCreated={handleOpenRoom}
                onNavigateToBounties={() => handleSelectTab('bounties')}
              />
            )}

            {currentTab === 'bounties' && (
              <BountyBoard
                onSessionStarted={handleOpenRoom}
                isPostModalOpen={isPostBountyOpen}
                onClosePostModal={() => setIsPostBountyOpen(false)}
                onOpenPostModal={handleOpenPostBounty}
              />
            )}

            {currentTab === 'sessions' && (
              <SessionsList
                onJoinRoom={handleOpenRoom}
                onExploreMentors={() => handleSelectTab('directory')}
              />
            )}

            {currentTab === 'profile' && (
              <UserProfileView
                onOpenWallet={handleOpenWallet}
                onExploreBounties={() => handleSelectTab('bounties')}
              />
            )}
          </>
        )}

      </main>

      {/* Persistent Footer */}
      {!activeSessionId && <Footer />}

      {/* Global Wallet Modal */}
      <WalletModal
        isOpen={isWalletOpen}
        onClose={() => setIsWalletOpen(false)}
      />

      {/* Standalone Post Bounty Modal */}
      {isPostBountyOpen && currentTab !== 'bounties' && (
        <PostBountyModal
          isOpen={isPostBountyOpen}
          onClose={() => setIsPostBountyOpen(false)}
          onBountyCreated={() => {
            setCurrentTab('bounties');
          }}
        />
      )}

      {/* Supabase Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={closeAuthModal}
        initialMode={authModalMode}
      />

      {/* Global Toast Notifications */}
      <ToastContainer />

    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <SkillSwapApp />
    </AppProvider>
  );
}
