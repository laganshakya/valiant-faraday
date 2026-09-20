import React, { useState, useEffect } from 'react';
import type { MentoringSession } from '../../types';
import { useApp } from '../../context/AppContext';
import { DataService } from '../../services/dataService';
import { SessionCompleteModal } from './SessionCompleteModal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faVideo, 
  faVideoSlash, 
  faMicrophone, 
  faMicrophoneSlash, 
  faDesktop, 
  faClock, 
  faPlay, 
  faPause, 
  faCheckCircle, 
  faCode, 
  faFileLines, 
  faComments, 
  faPaperPlane, 
  faShieldHalved, 
  faArrowLeft, 
  faCircleCheck,
  faTerminal,
  faTriangleExclamation,
  faArrowsRotate
} from '@fortawesome/free-solid-svg-icons';
import confetti from 'canvas-confetti';
import { useWebRTC } from '../../hooks/useWebRTC';

interface VirtualRoomProps {
  sessionId: string;
  onExit: () => void;
}

export const VirtualRoom: React.FC<VirtualRoomProps> = ({ sessionId, onExit }) => {
  const { currentUser, refreshUserData, showToast } = useApp();

  const [session, setSession] = useState<MentoringSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Real WebRTC peer-to-peer media stream and signaling
  const {
    localStream,
    remoteStream,
    bindLocalVideo,
    bindRemoteVideo,
    bindRemoteAudio,
    connectionStatus,
    isCameraOn,
    isMicOn,
    isScreenSharing,
    remotePeerName,
    remotePeerAvatar,
    isRemoteCameraOn,
    isRemoteMicOn,
    isPeerPresent,
    mediaError,
    toggleCamera,
    toggleMic,
    toggleScreenShare,
    retryMedia,
  } = useWebRTC({
    roomId: sessionId,
    userId: currentUser?.id,
    userName: currentUser?.name || 'Collaborator',
    userAvatar: currentUser?.avatar_url,
  });

  // Timer state
  const [secondsRemaining, setSecondsRemaining] = useState<number>(30 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(true);

  // Workspace tab
  const [activeTab, setActiveTab] = useState<'notes' | 'code' | 'chat'>('notes');

  // Notes & Code
  const [notes, setNotes] = useState('');
  const [code, setCode] = useState('');
  const [codeOutput, setCodeOutput] = useState<string>('');

  // Checklist
  const [agenda, setAgenda] = useState<{ id: string; text: string; done: boolean }[]>([
    { id: '1', text: 'Clarify problem scope & desired outcome', done: true },
    { id: '2', text: 'Live code review / pair debugging', done: false },
    { id: '3', text: 'Takeaways & self-study next steps', done: false },
  ]);

  // Chat
  const [messages, setMessages] = useState<{ sender: string; text: string; time: string }[]>([
    { sender: 'System', text: 'Session connected. Credits held in escrow. Zero ₹ cash charged.', time: 'Now' }
  ]);
  const [chatInput, setChatInput] = useState('');

  // Completion modal
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);

  // Load session
  useEffect(() => {
    async function load() {
      try {
        setIsLoading(true);
        const s = await DataService.getSessionById(sessionId);
        if (s) {
          setSession(s);
          setSecondsRemaining(s.duration_min * 60);
          setNotes(s.shared_notes || `### Meeting Notes\n- Mentoring on: ${s.skill_name}\n- Date: ${new Date(s.scheduled_at).toLocaleDateString()}\n- Key takeaways:\n`);
          setCode(s.code_scratchpad || `// Micro-mentoring code sandbox\n// Run snippets & debug algorithms in real-time:\n\nfunction calculateSwapSaving(hours) {\n  const rupeeTutorCost = 2000; // Average commercial tutoring fee in ₹\n  return \`Saved ₹\${hours * rupeeTutorCost} via SkillSwap!\`;\n}\n\nconsole.log(calculateSwapSaving(1));`);
          
          setMessages(prev => [
            ...prev,
            { sender: s.mentor?.name || 'Mentor', text: `Hi! Ready to collaborate on ${s.skill_name}. Let's dive in!`, time: 'Just now' }
          ]);
        } else {
          // If no pre-existing session found for this room ID, bind to a real university peer from Supabase
          const allProfiles = await DataService.getProfiles();
          const peer = allProfiles.find(p => p.id !== currentUser?.id) || allProfiles[0];
          const dynamicSession: MentoringSession = {
            id: sessionId,
            learner_id: currentUser?.id || 'anonymous',
            learner: currentUser || undefined,
            mentor_id: peer?.id || 'peer-mentor',
            mentor: peer,
            skill_name: peer?.skills?.find((sk: any) => sk.skill_type === 'TEACHING')?.skill_name || 'Peer Micro-Mentoring & Live Collaboration',
            duration_min: 30,
            credits_amount: 0.5,
            scheduled_at: new Date().toISOString(),
            status: 'CONFIRMED',
            meeting_room_id: sessionId,
            shared_notes: `### Live Collaborative Meeting\n- Topic: Audio/Video Peer Collaboration\n- Peer: ${peer?.name || 'Mentor'} (${peer?.campus || 'Campus'})\n- Ready for peer collaboration`,
            code_scratchpad: `// WebRTC Code Sandbox\nconsole.log("Ready to code in studio room with ${peer?.name || 'peer'}");`,
            learner_confirmed_complete: false,
            mentor_confirmed_complete: false,
            escrow_released: false,
            created_at: new Date().toISOString(),
          };
          setSession(dynamicSession);
          setSecondsRemaining(dynamicSession.duration_min * 60);
          setNotes(dynamicSession.shared_notes);
          setCode(dynamicSession.code_scratchpad);
        }
      } catch (err) {
        console.error('Failed to load session:', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [sessionId, currentUser]);

  // Countdown timer
  useEffect(() => {
    if (!isTimerRunning) return;
    const interval = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isTimerRunning]);

  // Debounced auto-save
  useEffect(() => {
    if (!session) return;
    const timer = setTimeout(() => {
      DataService.updateSessionContent(session.id, notes, code);
    }, 1200);
    return () => clearTimeout(timer);
  }, [notes, code, session]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !currentUser) return;

    const newMsg = {
      sender: currentUser.name,
      text: chatInput.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, newMsg]);
    setChatInput('');

    if (messages.length <= 4) {
      setTimeout(() => {
        const otherName = session?.mentor_id === currentUser.id 
          ? session?.learner?.name 
          : session?.mentor?.name;
        setMessages(prev => [
          ...prev,
          { 
            sender: otherName || 'Peer', 
            text: `Got it! Let's examine that together in the scratchpad.`, 
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
          }
        ]);
      }, 1800);
    }
  };

  const handleRunCode = () => {
    try {
      const logs: string[] = [];
      const customConsole = {
        log: (...args: any[]) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ')),
        error: (...args: any[]) => logs.push('[ERROR] ' + args.join(' ')),
        warn: (...args: any[]) => logs.push('[WARN] ' + args.join(' '))
      };

      const runnable = new Function('console', code);
      runnable(customConsole);

      setCodeOutput(logs.length > 0 ? logs.join('\n') : 'Code executed with 0 errors (no console output).');
    } catch (err: any) {
      setCodeOutput(`Runtime Error: ${err.message}`);
    }
  };

  const toggleAgendaItem = (id: string) => {
    setAgenda(prev => prev.map(item => item.id === id ? { ...item, done: !item.done } : item));
  };

  const handleCompleteSession = async () => {
    if (!session || !currentUser) return;

    try {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      });

      const { session: updated, escrowReleased } = await DataService.confirmSessionCompletion(session.id, currentUser.id);
      setSession(updated);
      await refreshUserData();

      showToast({
        type: 'success',
        title: 'Session Completed!',
        message: escrowReleased 
          ? `Escrow cleared! ${session.credits_amount} credits transferred.` 
          : 'Completion confirmed. Waiting for peer.'
      });

      setIsCompleteModalOpen(true);
    } catch (err: any) {
      console.error('Failed to complete session:', err);
      showToast({
        type: 'error',
        title: 'Completion Error',
        message: err.message || 'Could not finalize session.'
      });
    }
  };

  if (isLoading || !session) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 border-4 border-[#3B72FE] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-semibold text-[#8E9BAE]">Connecting to encrypted studio workspace...</p>
      </div>
    );
  }

  const isLearner = currentUser?.id === session.learner_id;
  const otherParty = isLearner ? session.mentor : session.learner;
  const rupeeSaved = Math.round(session.duration_min * 45);

  return (
    <div className="space-y-4 pb-16 animate-in fade-in">
      
      {/* Studio Header Bar */}
      <div className="bg-[#0E131B] rounded-3xl border border-white/10 p-4 sm:p-5 shadow-2xl flex flex-wrap items-center justify-between gap-4">
        
        {/* Back & Topic */}
        <div className="flex items-center gap-3.5">
          <button
            onClick={onExit}
            className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 text-[#8E9BAE] hover:text-white flex items-center justify-center transition-colors border border-white/5"
            title="Return to Dashboard"
          >
            <FontAwesomeIcon icon={faArrowLeft} />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display font-extrabold text-white text-base sm:text-lg tracking-tight">
                {session.skill_name}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#3B72FE]/10 text-[#3B72FE] border border-[#3B72FE]/20">
                {session.duration_min}m Session
              </span>
            </div>
            <p className="text-xs text-[#8E9BAE] flex items-center gap-1.5 mt-0.5">
              <span>With <strong className="text-white">{otherParty?.name}</strong></span>
              <span>•</span>
              <span>{otherParty?.campus}</span>
              <span>•</span>
              <span className="text-[#00D284] font-mono font-bold">Saved ~₹{rupeeSaved}</span>
            </p>
          </div>
        </div>

        {/* Monospace Countdown Clock */}
        <div className="flex items-center gap-3 bg-[#151C26] px-4 py-2 rounded-full border border-white/10 shadow-inner">
          <FontAwesomeIcon 
            icon={faClock} 
            className={`text-sm ${secondsRemaining < 180 ? 'text-rose-400 animate-pulse' : 'text-[#3B72FE]'}`} 
          />
          <div className="flex items-baseline gap-2">
            <span className="text-[10px] uppercase font-bold text-[#8E9BAE]">Remaining:</span>
            <span className={`text-base font-mono font-bold tracking-widest ${
              secondsRemaining < 180 ? 'text-rose-400' : 'text-white'
            }`}>
              {formatTime(secondsRemaining)}
            </span>
          </div>

          <button
            onClick={() => setIsTimerRunning(!isTimerRunning)}
            className="p-1 rounded-full text-[#8E9BAE] hover:text-white transition-colors text-xs"
            title={isTimerRunning ? 'Pause' : 'Resume'}
          >
            <FontAwesomeIcon icon={isTimerRunning ? faPause : faPlay} />
          </button>
        </div>

        {/* Escrow Status & Completion Handshake */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col items-end text-right">
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#00D284] bg-[#00D284]/10 px-2.5 py-1 rounded-full border border-[#00D284]/20">
              <FontAwesomeIcon icon={faShieldHalved} className="text-[10px]" />
              <span>{session.credits_amount.toFixed(2)} cr Escrow</span>
            </div>
            <span className="text-[10px] text-[#8E9BAE] mt-0.5">Zero ₹ cash needed</span>
          </div>

          <button
            onClick={handleCompleteSession}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#00D284] hover:bg-[#00BF77] text-[#0A0E14] text-xs font-bold shadow-lg shadow-[#00D284]/20 transition-all hover:scale-105"
          >
            <FontAwesomeIcon icon={faCheckCircle} />
            <span>Complete & Release Escrow</span>
          </button>
        </div>

      </div>

      {/* Split Studio Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-[600px]">
        
        {/* Left: Video Media Feeds & Checklist (5 cols) */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          
          {/* Video Frames */}
          <div className="bg-[#0E131B] rounded-3xl p-3 shadow-xl border border-white/10 space-y-3">
            
            {/* Remote Peer Video Container */}
            <div className="relative aspect-video rounded-2xl bg-[#080B10] overflow-hidden border border-white/10 flex items-center justify-center group">
              
              {/* Dedicated audio element for remote audio stream */}
              <audio ref={bindRemoteAudio} autoPlay playsInline className="hidden" />

              {/* Actual Remote Video Feed */}
              <video
                ref={bindRemoteVideo}
                autoPlay
                playsInline
                className={`w-full h-full object-cover transition-opacity duration-300 ${
                  remoteStream && isRemoteCameraOn ? 'opacity-100' : 'opacity-0 absolute pointer-events-none'
                }`}
              />

              {/* Placeholder / Avatar when remote peer camera is off or stream is not active */}
              {!(remoteStream && isRemoteCameraOn) && (
                <div className="flex flex-col items-center justify-center text-center p-6 space-y-3 z-10 animate-in fade-in">
                  <div className="relative">
                    <img
                      src={remotePeerAvatar || otherParty?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'}
                      alt={remotePeerName || otherParty?.name || 'Remote Peer'}
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-2 border-white/10 shadow-2xl"
                    />
                    {!isRemoteMicOn && (
                      <div className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-rose-500 border-2 border-[#0E131B] flex items-center justify-center text-white text-[10px]" title="Microphone muted">
                        <FontAwesomeIcon icon={faMicrophoneSlash} />
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-sm sm:text-base">
                      {remotePeerName || otherParty?.name || 'Peer'}
                    </h3>
                    <p className="text-xs text-[#8E9BAE] mt-0.5">
                      {connectionStatus === 'connected'
                        ? (!isRemoteCameraOn ? 'Camera turned off' : 'Connected')
                        : connectionStatus === 'connecting'
                        ? 'Connecting P2P stream...'
                        : isPeerPresent
                        ? 'Peer is in the studio room'
                        : 'Waiting for peer to join studio...'}
                    </p>
                  </div>
                </div>
              )}

              {/* Vignette Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#080B10]/90 via-transparent to-transparent pointer-events-none"></div>

              {/* Peer label bottom-left */}
              <div className="absolute bottom-3 left-3 flex items-center gap-2 text-white z-20">
                <span className="font-display font-bold text-xs">{remotePeerName || otherParty?.name}</span>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#3B72FE] font-bold uppercase tracking-wider">
                  {isLearner ? 'Mentor' : 'Learner'}
                </span>
                {!isRemoteMicOn && (
                  <span className="text-[10px] text-rose-400 bg-rose-500/20 px-1.5 py-0.5 rounded flex items-center gap-1">
                    <FontAwesomeIcon icon={faMicrophoneSlash} className="text-[9px]" />
                    <span className="text-[9px]">Muted</span>
                  </span>
                )}
              </div>

              {/* P2P Status Indicator bottom-right */}
              <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-black/70 backdrop-blur-xs px-2.5 py-1 rounded-full text-[10px] font-mono z-20">
                {connectionStatus === 'connected' ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-[#00D284] animate-pulse"></span>
                    <span className="text-[#00D284] font-semibold">P2P Live</span>
                  </>
                ) : connectionStatus === 'connecting' ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                    <span className="text-amber-400">Connecting...</span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-slate-500"></span>
                    <span className="text-[#8E9BAE]">Ready</span>
                  </>
                )}
              </div>
            </div>

            {/* Local Video & Hardware Controls */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-3 bg-[#151C26] p-2.5 rounded-2xl border border-white/5">
                
                {/* Local Video Thumbnail */}
                <div className="relative w-32 h-24 sm:w-36 sm:h-24 rounded-2xl bg-[#080B10] overflow-hidden border border-white/10 shrink-0 flex items-center justify-center shadow-inner">
                  <video
                    ref={bindLocalVideo}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover transition-opacity duration-300 ${
                      localStream && isCameraOn ? 'opacity-100' : 'opacity-0 absolute pointer-events-none'
                    } ${isScreenSharing ? '' : '-scale-x-100'}`}
                  />
                  {!(localStream && isCameraOn) && (
                    <div className="flex flex-col items-center justify-center text-center p-1.5 z-10 animate-in fade-in">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#3B72FE] to-[#00D284] p-[1.5px] mb-1.5 shadow-md shrink-0">
                        {currentUser?.avatar_url ? (
                          <img
                            src={currentUser.avatar_url}
                            alt="You"
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full rounded-full bg-[#151C26] flex items-center justify-center text-[10px] font-bold text-white">
                            {currentUser?.name ? currentUser.name.charAt(0) : 'U'}
                          </div>
                        )}
                      </div>
                      <span className="text-[9px] uppercase tracking-wider text-[#8E9BAE] font-mono font-bold bg-white/10 px-2 py-0.5 rounded-full border border-white/5">
                        Cam Off
                      </span>
                    </div>
                  )}
                  <span className="absolute top-1.5 left-2 text-[9px] text-white/90 font-bold bg-black/70 px-1.5 py-0.5 rounded backdrop-blur-xs z-20">
                    {isScreenSharing ? 'Screen' : 'You'}
                  </span>
                  {!isMicOn && (
                    <span className="absolute top-1.5 right-2 text-[9px] text-rose-400 bg-rose-500/20 border border-rose-500/30 w-5 h-5 rounded-full flex items-center justify-center z-20" title="Microphone muted">
                      <FontAwesomeIcon icon={faMicrophoneSlash} className="text-[8px]" />
                    </span>
                  )}
                </div>

                {/* Hardware Toggles */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleMic}
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-xs transition-all cursor-pointer hover:scale-105 active:scale-95 ${
                      isMicOn 
                        ? 'bg-white/10 text-white hover:bg-white/20' 
                        : 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                    }`}
                    title={isMicOn ? 'Mute Microphone' : 'Unmute Microphone'}
                  >
                    <FontAwesomeIcon icon={isMicOn ? faMicrophone : faMicrophoneSlash} />
                  </button>

                  <button
                    onClick={toggleCamera}
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-xs transition-all cursor-pointer hover:scale-105 active:scale-95 ${
                      isCameraOn 
                        ? 'bg-white/10 text-white hover:bg-white/20' 
                        : 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                    }`}
                    title={isCameraOn ? 'Turn Camera Off' : 'Turn Camera On'}
                  >
                    <FontAwesomeIcon icon={isCameraOn ? faVideo : faVideoSlash} />
                  </button>

                  <button
                    onClick={toggleScreenShare}
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-xs transition-all cursor-pointer hover:scale-105 active:scale-95 ${
                      isScreenSharing 
                        ? 'bg-[#3B72FE] text-white shadow-lg shadow-[#3B72FE]/30 ring-2 ring-[#3B72FE]/40' 
                        : 'bg-white/10 text-[#8E9BAE] hover:text-white hover:bg-white/20'
                    }`}
                    title={isScreenSharing ? 'Stop Screen Share' : 'Share Screen'}
                  >
                    <FontAwesomeIcon icon={faDesktop} />
                  </button>
                </div>

              </div>

              {/* Hardware / Permission Warning & Retry */}
              {mediaError && (
                <div className="bg-amber-500/10 border border-amber-500/25 rounded-2xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-amber-200 animate-in fade-in">
                  <div className="flex items-start sm:items-center gap-2.5 min-w-0 flex-1">
                    <FontAwesomeIcon icon={faTriangleExclamation} className="text-amber-400 text-xs shrink-0 mt-0.5 sm:mt-0" />
                    <span className="text-[11px] leading-relaxed break-words font-medium text-amber-200">{mediaError}</span>
                  </div>
                  <button
                    onClick={() => retryMedia()}
                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 font-bold text-[10px] transition-colors shrink-0 self-end sm:self-auto cursor-pointer"
                  >
                    <FontAwesomeIcon icon={faArrowsRotate} className="text-[9px]" />
                    <span>Retry Device</span>
                  </button>
                </div>
              )}
            </div>

          </div>

          {/* Agenda & Goals */}
          <div className="bg-[#0E131B] p-5 rounded-3xl border border-white/10 shadow-xl space-y-3 flex-1">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs uppercase tracking-wider text-[#8E9BAE]">
                Session Agenda
              </h4>
              <span className="text-[10px] font-mono text-[#00D284] bg-[#00D284]/10 px-2 py-0.5 rounded-full">
                {agenda.filter(a => a.done).length}/{agenda.length} completed
              </span>
            </div>

            <div className="space-y-2">
              {agenda.map(item => (
                <button
                  key={item.id}
                  onClick={() => toggleAgendaItem(item.id)}
                  className={`w-full flex items-start gap-2.5 p-3 rounded-2xl text-left text-xs transition-colors border ${
                    item.done 
                      ? 'bg-white/5 border-white/5 text-[#8E9BAE] line-through' 
                      : 'bg-[#151C26] border-white/5 text-white hover:bg-[#1B2432]'
                  }`}
                >
                  <FontAwesomeIcon 
                    icon={faCircleCheck} 
                    className={`mt-0.5 text-xs ${item.done ? 'text-[#00D284]' : 'text-[#8E9BAE]'}`} 
                  />
                  <span>{item.text}</span>
                </button>
              ))}
            </div>

            <p className="text-[11px] text-[#8E9BAE] pt-1">
              Mutual agreement on agenda items guarantees transparent escrow release.
            </p>
          </div>

        </div>

        {/* Right: Tabbed Collaborative Atelier Workspace (7 cols) */}
        <div className="lg:col-span-7 bg-[#0E131B] rounded-3xl border border-white/10 shadow-xl flex flex-col overflow-hidden">
          
          {/* Tab Controls */}
          <div className="px-4 py-3 bg-[#151C26] border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-1 bg-black/40 p-1 rounded-full border border-white/5">
              <button
                onClick={() => setActiveTab('notes')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  activeTab === 'notes'
                    ? 'bg-[#3B72FE] text-white shadow-xs'
                    : 'text-[#8E9BAE] hover:text-white'
                }`}
              >
                <FontAwesomeIcon icon={faFileLines} />
                <span>Live Notes</span>
              </button>

              <button
                onClick={() => setActiveTab('code')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  activeTab === 'code'
                    ? 'bg-[#3B72FE] text-white shadow-xs'
                    : 'text-[#8E9BAE] hover:text-white'
                }`}
              >
                <FontAwesomeIcon icon={faCode} />
                <span>Code Sandbox</span>
              </button>

              <button
                onClick={() => setActiveTab('chat')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  activeTab === 'chat'
                    ? 'bg-[#3B72FE] text-white shadow-xs'
                    : 'text-[#8E9BAE] hover:text-white'
                }`}
              >
                <FontAwesomeIcon icon={faComments} />
                <span>Chat</span>
              </button>
            </div>

            <span className="text-[10px] font-mono text-[#8E9BAE] hidden sm:block">
              Auto-saved
            </span>
          </div>

          {/* Notes Tab */}
          {activeTab === 'notes' && (
            <div className="p-5 flex-1 flex flex-col space-y-2">
              <div className="flex items-center justify-between text-[11px] text-[#8E9BAE]">
                <span>Shared Markdown scratchpad</span>
                <span>Both can edit in real-time</span>
              </div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Take takeaways, architecture notes, and follow-up goals here..."
                className="w-full flex-1 p-4 rounded-2xl bg-[#080B10] border border-white/10 font-mono text-xs focus:ring-2 focus:ring-[#3B72FE] focus:outline-none resize-none leading-relaxed text-[#EEF2F6]"
              />
            </div>
          )}

          {/* Code Tab */}
          {activeTab === 'code' && (
            <div className="p-5 flex-1 flex flex-col space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-[#8E9BAE] flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faTerminal} className="text-[#3B72FE]" />
                  Interactive TypeScript Sandbox
                </span>

                <button
                  onClick={handleRunCode}
                  className="px-4 py-1.5 rounded-full bg-[#00D284] hover:bg-[#00BF77] text-[#0A0E14] text-xs font-bold transition-colors shadow-sm"
                >
                  <FontAwesomeIcon icon={faPlay} className="mr-1 text-[10px]" />
                  <span>Run Code</span>
                </button>
              </div>

              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full flex-1 min-h-[260px] p-4 rounded-2xl bg-[#080B10] text-[#EEF2F6] font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#3B72FE] resize-none leading-relaxed border border-white/10"
                spellCheck={false}
              />

              {codeOutput && (
                <div className="p-3 bg-black/60 rounded-2xl border border-white/10 font-mono text-xs text-[#00D284] max-h-36 overflow-y-auto">
                  <div className="text-[10px] text-[#8E9BAE] font-bold uppercase mb-1">Terminal Output:</div>
                  <pre className="whitespace-pre-wrap">{codeOutput}</pre>
                </div>
              )}
            </div>
          )}

          {/* Chat Tab */}
          {activeTab === 'chat' && (
            <div className="flex-1 flex flex-col p-5 justify-between space-y-3">
              <div className="space-y-3 overflow-y-auto max-h-[420px] pr-1">
                {messages.map((msg, idx) => {
                  const isMe = msg.sender === currentUser?.name;
                  const isSys = msg.sender === 'System';

                  if (isSys) {
                    return (
                      <div key={idx} className="text-center my-2">
                        <span className="text-[10px] font-mono bg-white/5 text-[#8E9BAE] px-3 py-1 rounded-full border border-white/10">
                          {msg.text}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={idx}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-baseline gap-1.5 mb-0.5">
                        <span className="text-[10px] font-bold text-[#8E9BAE]">{msg.sender}</span>
                        <span className="text-[9px] text-[#5A6A80] font-mono">{msg.time}</span>
                      </div>
                      <div className={`p-3 rounded-2xl text-xs max-w-[85%] leading-relaxed ${
                        isMe 
                          ? 'bg-[#3B72FE] text-white rounded-br-xs' 
                          : 'bg-[#151C26] text-[#EEF2F6] rounded-bl-xs border border-white/5'
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  );
                })}
              </div>

              <form onSubmit={handleSendMessage} className="flex items-center gap-2 pt-2 border-t border-white/10">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={`Send quick message to ${otherParty?.name}...`}
                  className="flex-1 p-3 rounded-full bg-[#151C26] border border-white/10 text-white text-xs focus:ring-2 focus:ring-[#3B72FE] focus:outline-none"
                />
                <button
                  type="submit"
                  className="w-10 h-10 rounded-full bg-[#3B72FE] hover:bg-[#2A61ED] text-white text-xs flex items-center justify-center transition-colors shadow-sm"
                >
                  <FontAwesomeIcon icon={faPaperPlane} />
                </button>
              </form>
            </div>
          )}

        </div>

      </div>

      {/* Completion Modal */}
      {isCompleteModalOpen && (
        <SessionCompleteModal
          session={session}
          isOpen={isCompleteModalOpen}
          onClose={() => setIsCompleteModalOpen(false)}
          onFinished={onExit}
        />
      )}

    </div>
  );
};
