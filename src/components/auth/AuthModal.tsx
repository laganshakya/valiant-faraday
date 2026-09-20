import React, { useState } from 'react';
import { supabase } from '../../services/supabaseClient';
import { useApp } from '../../context/AppContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faXmark, 
  faLock, 
  faEnvelope, 
  faUser, 
  faGraduationCap, 
  faCoins, 
  faArrowRightToBracket,
  faUserPlus,
  faTriangleExclamation
} from '@fortawesome/free-solid-svg-icons';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'signin'
}) => {
  const { showToast, refreshUserData } = useApp();
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  
  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [campus, setCampus] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!supabase) {
      setErrorMessage('Supabase client is not connected.');
      return;
    }

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter your email and password.');
      return;
    }

    try {
      setIsLoading(true);

      if (mode === 'signup') {
        if (!name.trim()) {
          setErrorMessage('Please enter your full name.');
          setIsLoading(false);
          return;
        }

        const trimmedEmail = email.trim();
        const trimmedName = name.trim();
        const trimmedCampus = campus.trim() || 'Student / Learner';

        // 1. Invoke the Edge Function to create & auto-confirm user (bypasses email rate limit)
        const { data: fnData, error: fnError } = await supabase.functions.invoke('signup', {
          body: {
            email: trimmedEmail,
            password: password,
            name: trimmedName,
            campus: trimmedCampus
          }
        });

        // If user already exists in the system:
        if (fnData?.alreadyExists) {
          // Attempt automatic sign in with the provided password
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: trimmedEmail,
            password: password
          });

          if (!signInError && signInData?.user) {
            showToast({
              type: 'success',
              title: 'Welcome Back! 👋',
              message: 'Account verified! Signed in with your existing credentials.'
            });
            await refreshUserData();
            onClose();
            return;
          } else {
            setErrorMessage('An account with this email already exists. Please verify your password or switch to the Sign In tab.');
            setMode('signin');
            setIsLoading(false);
            return;
          }
        }

        if (fnError || fnData?.error) {
          // Fallback check: attempt direct sign-in in case account already exists
          const { data: fallbackSignIn, error: fallbackError } = await supabase.auth.signInWithPassword({
            email: trimmedEmail,
            password: password
          });

          if (!fallbackError && fallbackSignIn?.user) {
            showToast({
              type: 'success',
              title: 'Welcome Back! 👋',
              message: 'Signed in with your existing account.'
            });
            await refreshUserData();
            onClose();
            return;
          }

          let errMsg = fnError?.message || fnData?.error || 'Registration could not be completed.';
          if (errMsg.toLowerCase().includes('already') || errMsg.toLowerCase().includes('registered') || errMsg.toLowerCase().includes('exists')) {
            setErrorMessage('An account with this email already exists. Please switch to the Sign In tab.');
            setMode('signin');
            setIsLoading(false);
            return;
          }
          throw new Error(errMsg);
        }

        // 2. Automatically sign in immediately for newly created account
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password: password
        });

        if (signInError) throw signInError;

        showToast({
          type: 'success',
          title: 'Welcome to SkillSwap! 🎉',
          message: 'Account created! You received 2.00 free starter credits.'
        });

        await refreshUserData();
        onClose();
      } else {
        // Sign in
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password
        });

        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            throw new Error('Invalid email or password. Please verify your details.');
          }
          throw error;
        }

        showToast({
          type: 'success',
          title: 'Signed In',
          message: `Welcome back to SkillSwap!`
        });

        await refreshUserData();
        onClose();
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setErrorMessage(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#080B10]/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-black/10 overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-6 bg-[#0E131B] text-white flex items-center justify-between border-b border-white/10">
          <div>
            <h3 className="font-display font-extrabold text-xl text-white">
              {mode === 'signin' ? 'Sign in to SkillSwap' : 'Create an Account'}
            </h3>
            <p className="text-xs text-[#8E9BAE] mt-0.5">
              {mode === 'signin' ? 'Access your time-bank wallet & sessions' : 'Join and receive 2.00 free credits immediately'}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#8E9BAE] hover:text-white hover:bg-white/10 transition-colors"
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex border-b border-black/5 bg-[#F6F8FA] p-1.5 gap-1.5 text-xs font-semibold">
          <button
            type="button"
            onClick={() => { setMode('signin'); setErrorMessage(null); }}
            className={`flex-1 py-2 rounded-2xl transition-all ${
              mode === 'signin'
                ? 'bg-white text-[#0A0E14] shadow-xs font-bold'
                : 'text-[#5A6A80] hover:text-[#0A0E14]'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); setErrorMessage(null); }}
            className={`flex-1 py-2 rounded-2xl transition-all ${
              mode === 'signup'
                ? 'bg-white text-[#0A0E14] shadow-xs font-bold'
                : 'text-[#5A6A80] hover:text-[#0A0E14]'
            }`}
          >
            Create Account (+2 Credits)
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs text-[#0A0E14]">
          
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2.5">
              <FontAwesomeIcon icon={faTriangleExclamation} className="mt-0.5 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {mode === 'signup' && (
            <>
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
                    placeholder="e.g. Jordan Lee"
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-black/10 bg-[#F6F8FA] focus:bg-white focus:ring-2 focus:ring-[#3B72FE] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-[#5A6A80] mb-1">
                  University or Campus
                </label>
                <div className="relative">
                  <FontAwesomeIcon icon={faGraduationCap} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8E9BAE]" />
                  <input
                    type="text"
                    value={campus}
                    onChange={(e) => setCampus(e.target.value)}
                    placeholder="e.g. IIT Delhi, UC Berkeley, Self-Taught"
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-black/10 bg-[#F6F8FA] focus:bg-white focus:ring-2 focus:ring-[#3B72FE] focus:outline-none"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block font-bold uppercase tracking-wider text-[#5A6A80] mb-1">
              Email Address *
            </label>
            <div className="relative">
              <FontAwesomeIcon icon={faEnvelope} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8E9BAE]" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@university.edu"
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-black/10 bg-[#F6F8FA] focus:bg-white focus:ring-2 focus:ring-[#3B72FE] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold uppercase tracking-wider text-[#5A6A80] mb-1">
              Password *
            </label>
            <div className="relative">
              <FontAwesomeIcon icon={faLock} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8E9BAE]" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-black/10 bg-[#F6F8FA] focus:bg-white focus:ring-2 focus:ring-[#3B72FE] focus:outline-none"
              />
            </div>
          </div>

          {mode === 'signup' && (
            <div className="p-3 rounded-2xl bg-[#00D284]/10 border border-[#00D284]/20 flex items-center gap-2 text-[#0E7048]">
              <FontAwesomeIcon icon={faCoins} className="text-sm" />
              <span className="font-semibold text-[11px]">
                You will receive <strong>2.00 free credits</strong> immediately upon signup (₹3,000 value).
              </span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-full bg-[#3B72FE] hover:bg-[#2A61ED] text-white font-bold text-sm shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
          >
            <FontAwesomeIcon icon={mode === 'signin' ? faArrowRightToBracket : faUserPlus} />
            <span>
              {isLoading
                ? 'Connecting to Supabase...'
                : mode === 'signin'
                ? 'Sign In to Account'
                : 'Create Account & Claim 2 Credits'}
            </span>
          </button>

        </form>

      </div>
    </div>
  );
};
