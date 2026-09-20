import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import type { Profile, CreditTransaction } from '../types';
import { DataService } from '../services/dataService';
import type { User as SupabaseUser } from '@supabase/supabase-js';

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message?: string;
}

interface AppContextType {
  currentUser: Profile | null;
  authUser: SupabaseUser | null;
  allUsers: Profile[];
  transactions: CreditTransaction[];
  isLoading: boolean;
  isAuthModalOpen: boolean;
  authModalMode: 'signin' | 'signup';
  openAuthModal: (mode?: 'signin' | 'signup') => void;
  closeAuthModal: () => void;
  signOut: () => Promise<void>;
  refreshUserData: () => Promise<void>;
  showToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
  toasts: ToastMessage[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [authUser, setAuthUser] = useState<SupabaseUser | null>(null);
  const [allUsers, setAllUsers] = useState<Profile[]>([]);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Auth modal state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');

  const openAuthModal = (mode: 'signin' | 'signup' = 'signin') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { ...toast, id }]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  }, [removeToast]);

  const loadProfile = useCallback(async (userId: string) => {
    try {
      const profile = await DataService.getProfileById(userId);
      setCurrentUser(profile);
      if (profile) {
        const txs = await DataService.getTransactions(profile.id);
        setTransactions(txs);
      }
    } catch (err) {
      console.error('Failed to load profile for user:', err);
    }
  }, []);

  const loadAllUsers = useCallback(async () => {
    try {
      const profiles = await DataService.getProfiles();
      setAllUsers(profiles);
    } catch (err) {
      console.error('Failed to load all users:', err);
    }
  }, []);

  // Listen to Supabase Auth State
  useEffect(() => {
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    // Get current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setAuthUser(session.user);
        loadProfile(session.user.id);
      } else {
        setAuthUser(null);
        setCurrentUser(null);
      }
      loadAllUsers();
      setIsLoading(false);
    });

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setAuthUser(session.user);
        await loadProfile(session.user.id);
      } else {
        setAuthUser(null);
        setCurrentUser(null);
        setTransactions([]);
      }
      await loadAllUsers();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadProfile, loadAllUsers]);

  const refreshUserData = async () => {
    if (authUser) {
      await loadProfile(authUser.id);
    }
    await loadAllUsers();
  };

  const signOut = async () => {
    if (!supabase) return;
    try {
      await supabase.auth.signOut();
      setCurrentUser(null);
      setAuthUser(null);
      setTransactions([]);
      showToast({
        type: 'info',
        title: 'Signed Out',
        message: 'You have been signed out of SkillSwap.'
      });
      await loadAllUsers();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Error Signing Out',
        message: err.message
      });
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        authUser,
        allUsers,
        transactions,
        isLoading,
        isAuthModalOpen,
        authModalMode,
        openAuthModal,
        closeAuthModal,
        signOut,
        refreshUserData,
        showToast,
        removeToast,
        toasts
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
