import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faArrowDown, 
  faShieldHalved, 
  faHandshake, 
  faClock, 
  faGraduationCap, 
  faCircleCheck, 
  faLock, 
  faUnlock 
} from '@fortawesome/free-solid-svg-icons';

gsap.registerPlugin(ScrollTrigger);

interface ScrollStoryProps {
  onExploreMentors: (campus?: string) => void;
}

export const ScrollStory: React.FC<ScrollStoryProps> = ({ onExploreMentors }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const act1Ref = useRef<HTMLDivElement>(null);
  const act2Ref = useRef<HTMLDivElement>(null);
  const act3Ref = useRef<HTMLDivElement>(null);
  const act4Ref = useRef<HTMLDivElement>(null);

  // Active chapter state for progress indicator
  const [activeChapter, setActiveChapter] = useState<1 | 2 | 3 | 4>(1);

  // Interactive state for Act 1: Hours per month slider
  const [hoursPerMonth, setHoursPerMonth] = useState<number>(8);
  const rupeeCostPerHr = 2200;
  const totalRupeeSaved = hoursPerMonth * rupeeCostPerHr;

  // Interactive state for Act 2: Swap calculator
  const [teachSkill, setTeachSkill] = useState<string>('React & TypeScript');
  const [learnSkill, setLearnSkill] = useState<string>('Rust & Systems');
  const [sessionLength, setSessionLength] = useState<15 | 30 | 60>(30);

  // Interactive state for Act 3: Escrow step simulation
  const [simulatedEscrowStep, setSimulatedEscrowStep] = useState<number>(1);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Act 1: Kinetic Reveal and Strikethrough Trigger
      if (act1Ref.current) {
        ScrollTrigger.create({
          trigger: act1Ref.current,
          start: 'top 70%',
          end: 'bottom 30%',
          onEnter: () => {
            setActiveChapter(1);
            const strike = act1Ref.current?.querySelector('.strikethrough-kinetic');
            if (strike) strike.classList.add('active');
          },
          onEnterBack: () => {
            setActiveChapter(1);
            const strike = act1Ref.current?.querySelector('.strikethrough-kinetic');
            if (strike) strike.classList.add('active');
          }
        });
      }

      // Act 2: Kinetic Ratio Reveal
      if (act2Ref.current) {
        ScrollTrigger.create({
          trigger: act2Ref.current,
          start: 'top 65%',
          end: 'bottom 35%',
          onEnter: () => setActiveChapter(2),
          onEnterBack: () => setActiveChapter(2),
        });

        gsap.fromTo(
          act2Ref.current.querySelectorAll('.kinetic-ratio-card'),
          { y: 35, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            stagger: 0.15,
            duration: 0.8,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: act2Ref.current,
              start: 'top 75%',
            }
          }
        );
      }

      // Act 3: Escrow Flow
      if (act3Ref.current) {
        ScrollTrigger.create({
          trigger: act3Ref.current,
          start: 'top 65%',
          end: 'bottom 35%',
          onEnter: () => setActiveChapter(3),
          onEnterBack: () => setActiveChapter(3),
        });

        gsap.fromTo(
          act3Ref.current.querySelectorAll('.escrow-step-card'),
          { y: 30, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            stagger: 0.12,
            duration: 0.7,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: act3Ref.current,
              start: 'top 75%',
            }
          }
        );
      }

      // Act 4: Campus Network
      if (act4Ref.current) {
        ScrollTrigger.create({
          trigger: act4Ref.current,
          start: 'top 65%',
          end: 'bottom 35%',
          onEnter: () => setActiveChapter(4),
          onEnterBack: () => setActiveChapter(4),
        });

        gsap.fromTo(
          act4Ref.current.querySelectorAll('.campus-pill-node'),
          { scale: 0.85, opacity: 0 },
          {
            scale: 1,
            opacity: 1,
            stagger: 0.08,
            duration: 0.6,
            ease: 'back.out(1.5)',
            scrollTrigger: {
              trigger: act4Ref.current,
              start: 'top 75%',
            }
          }
        );
      }
    }, containerRef);

    return () => {
      ctx.revert();
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, []);

  const scrollToAct = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div ref={containerRef} className="relative w-full py-16 space-y-28">
      
      {/* Sticky Chapter Navigation Rail (Desktop) */}
      <aside aria-label="Story Chapters" className="hidden xl:flex fixed right-8 top-1/2 -translate-y-1/2 flex-col items-end gap-3 z-30 pointer-events-auto select-none">
        <div className="bg-[#0E131B]/80 backdrop-blur-md p-3 rounded-2xl border border-white/10 space-y-2 text-right shadow-2xl">
          <div className="text-[9px] font-mono uppercase tracking-widest text-[#8E9BAE] pb-1 border-b border-white/5">
            Storyline
          </div>
          
          <button
            onClick={() => scrollToAct(act1Ref)}
            className={`block text-xs font-mono transition-all text-right w-full ${
              activeChapter === 1 ? 'text-[#3B72FE] font-bold translate-x-[-4px]' : 'text-[#8E9BAE] hover:text-white'
            }`}
          >
            01 Tuition Trap
          </button>
          
          <button
            onClick={() => scrollToAct(act2Ref)}
            className={`block text-xs font-mono transition-all text-right w-full ${
              activeChapter === 2 ? 'text-[#3B72FE] font-bold translate-x-[-4px]' : 'text-[#8E9BAE] hover:text-white'
            }`}
          >
            02 The Ratio
          </button>
          
          <button
            onClick={() => scrollToAct(act3Ref)}
            className={`block text-xs font-mono transition-all text-right w-full ${
              activeChapter === 3 ? 'text-[#3B72FE] font-bold translate-x-[-4px]' : 'text-[#8E9BAE] hover:text-white'
            }`}
          >
            03 Smart Escrow
          </button>
          
          <button
            onClick={() => scrollToAct(act4Ref)}
            className={`block text-xs font-mono transition-all text-right w-full ${
              activeChapter === 4 ? 'text-[#3B72FE] font-bold translate-x-[-4px]' : 'text-[#8E9BAE] hover:text-white'
            }`}
          >
            04 The Network
          </button>

          <div className="pt-2 border-t border-white/5">
            <button
              onClick={() => onExploreMentors()}
              className="text-[11px] font-bold text-[#00D284] hover:underline flex items-center justify-end gap-1"
            >
              <span>Skip to Mentors</span>
              <FontAwesomeIcon icon={faArrowDown} className="text-[9px]" />
            </button>
          </div>
        </div>
      </aside>

      {/* ========================================================= */}
      {/* ACT 01: THE TUITION TRAP */}
      {/* ========================================================= */}
      <section 
        ref={act1Ref}
        className="max-w-5xl mx-auto px-4 scroll-mt-28 space-y-12"
      >
        <div className="space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 font-mono text-xs text-[#3B72FE] tracking-widest uppercase">
            <span className="w-2 h-2 rounded-full bg-[#3B72FE]"></span>
            <span>Act 01 • The Tuition Extortion</span>
          </div>

          <h2 className="font-display font-extrabold text-3xl sm:text-5xl lg:text-6xl text-white tracking-[-0.03em] leading-[1.1]">
            Commercial tutors charge{' '}
            <span className="strikethrough-kinetic text-rose-400 font-black">₹2,500/hr</span>.
            <br />
            <span className="text-[#3B72FE]">Learning shouldn't be a debt sentence.</span>
          </h2>

          <p className="text-[#8E9BAE] text-base sm:text-lg leading-relaxed">
            Every semester, Indian students spend thousands of rupees on transactional tutoring or get trapped in tutorials alone. SkillSwap turns time into universal currency: <strong className="text-white font-medium">1 hour of your knowledge pays for 1 hour of someone else’s</strong>.
          </p>
        </div>

        {/* Interactive Rupee Savings Simulator */}
        <div className="bg-[#0E131B] border border-white/10 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
            <div>
              <h3 className="font-display font-bold text-xl text-white">
                Peer Time-Banking Savings Calculator
              </h3>
              <p className="text-xs text-[#8E9BAE]">
                See how much money stays in your bank account every single month
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-mono text-[#8E9BAE] uppercase tracking-wider block">
                Average Commercial Rate
              </span>
              <span className="font-mono text-xs text-rose-400">
                ₹{rupeeCostPerHr} / hour
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Slider Control */}
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#8E9BAE]">Hours of mentoring needed per month:</span>
                <span className="font-mono font-bold text-white text-lg bg-white/5 px-3 py-1 rounded-xl border border-white/10">
                  {hoursPerMonth} hrs
                </span>
              </div>
              <input
                type="range"
                min="2"
                max="30"
                step="1"
                value={hoursPerMonth}
                onChange={(e) => setHoursPerMonth(Number(e.target.value))}
                aria-label="Hours of mentoring needed per month"
                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#3B72FE]"
              />
              <div className="flex justify-between text-[10px] font-mono text-[#8E9BAE]">
                <span>2 hrs/mo (Occasional bug fix)</span>
                <span>15 hrs/mo (Semester crunch)</span>
                <span>30 hrs/mo (Interview prep)</span>
              </div>
            </div>

            {/* Kinetic Result Banner */}
            <div className="bg-[#151C26] rounded-2xl p-6 border border-white/10 flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-[#8E9BAE] uppercase">With SkillSwap</span>
                <span className="text-[10px] font-mono font-bold text-[#00D284] bg-[#00D284]/10 px-2 py-0.5 rounded-full border border-[#00D284]/20">
                  100% Cash Free
                </span>
              </div>
              <div>
                <div className="text-3xl sm:text-5xl font-mono font-black text-[#00D284] tracking-tight">
                  ₹{totalRupeeSaved.toLocaleString('en-IN')}
                </div>
                <div className="text-xs text-[#8E9BAE] mt-1">
                  Saved this month by trading <strong>{hoursPerMonth}.00 time credits</strong>
                </div>
              </div>
              <div className="text-[11px] text-[#8E9BAE] pt-2 border-t border-white/5 font-mono">
                Commercial cost: <span className="line-through text-rose-400">₹{(hoursPerMonth * rupeeCostPerHr).toLocaleString('en-IN')}</span> ➔ SkillSwap cost: <strong className="text-white">₹0.00</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* ACT 02: THE TIME-BANKING RATIO */}
      {/* ========================================================= */}
      <section 
        ref={act2Ref}
        className="max-w-5xl mx-auto px-4 scroll-mt-28 space-y-12"
      >
        <div className="space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 font-mono text-xs text-[#00D284] tracking-widest uppercase">
            <span className="w-2 h-2 rounded-full bg-[#00D284]"></span>
            <span>Act 02 • The Time-Banking Ratio</span>
          </div>

          <h2 className="font-display font-extrabold text-3xl sm:text-5xl lg:text-6xl text-white tracking-[-0.03em] leading-[1.1]">
            1 Hour Given = 1 Hour Earned.<br />
            <span className="text-[#00D284]">Time is the universal equalizer.</span>
          </h2>

          <p className="text-[#8E9BAE] text-base sm:text-lg leading-relaxed">
            A freshman debugging Python earns the exact same credit weight as a senior architecting Kubernetes. No inflation, no surge pricing, no market speculation.
          </p>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="kinetic-ratio-card bg-[#0E131B] border border-white/10 rounded-3xl p-6 space-y-3 hover:border-[#3B72FE] transition-all group">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-[#8E9BAE]">Sprint Session</span>
              <span className="w-8 h-8 rounded-full bg-[#3B72FE]/10 text-[#3B72FE] flex items-center justify-center text-xs font-mono font-bold">
                15m
              </span>
            </div>
            <div className="text-3xl font-mono font-black text-white group-hover:text-[#3B72FE] transition-colors">
              0.25 <span className="text-sm font-sans text-[#8E9BAE]">cr</span>
            </div>
            <p className="text-xs text-[#8E9BAE] leading-relaxed">
              Quick syntax fixes, Git merge conflict rescue, or resume headline polishing.
            </p>
          </div>

          <div className="kinetic-ratio-card bg-[#0E131B] border border-white/10 rounded-3xl p-6 space-y-3 hover:border-[#00D284] transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-[#00D284] text-[#0A0E14] text-[9px] font-mono font-bold px-2 py-0.5 rounded-bl-xl">
              POPULAR
            </div>
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-[#8E9BAE]">Deep Dive</span>
              <span className="w-8 h-8 rounded-full bg-[#00D284]/10 text-[#00D284] flex items-center justify-center text-xs font-mono font-bold">
                30m
              </span>
            </div>
            <div className="text-3xl font-mono font-black text-white group-hover:text-[#00D284] transition-colors">
              0.50 <span className="text-sm font-sans text-[#8E9BAE]">cr</span>
            </div>
            <p className="text-xs text-[#8E9BAE] leading-relaxed">
              API integration, algorithm pair debugging, or design portfolio review.
            </p>
          </div>

          <div className="kinetic-ratio-card bg-[#0E131B] border border-white/10 rounded-3xl p-6 space-y-3 hover:border-amber-400 transition-all group">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-[#8E9BAE]">Masterclass</span>
              <span className="w-8 h-8 rounded-full bg-amber-400/10 text-amber-400 flex items-center justify-center text-xs font-mono font-bold">
                60m
              </span>
            </div>
            <div className="text-3xl font-mono font-black text-white group-hover:text-amber-400 transition-colors">
              1.00 <span className="text-sm font-sans text-[#8E9BAE]">cr</span>
            </div>
            <p className="text-xs text-[#8E9BAE] leading-relaxed">
              Full-length mock technical interview, complete system design breakdown, or language immersion.
            </p>
          </div>
        </div>

        {/* Live Swap Pair Simulator */}
        <div className="bg-gradient-to-r from-[#0E131B] to-[#151C26] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs font-mono uppercase text-[#8E9BAE] tracking-wider">
              Interactive Swap Simulator
            </span>
            <span className="text-xs text-[#00D284] font-mono flex items-center gap-1">
              <FontAwesomeIcon icon={faCircleCheck} />
              <span>Balanced Exchange Verified</span>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-7 gap-4 items-center">
            {/* Give Box */}
            <div className="md:col-span-3 bg-black/40 rounded-2xl p-4 border border-white/5 space-y-2">
              <span className="text-[10px] font-mono text-[#3B72FE] uppercase tracking-wider block">
                1. What You Teach (Offer)
              </span>
              <input
                type="text"
                value={teachSkill}
                onChange={(e) => setTeachSkill(e.target.value)}
                placeholder="e.g. React, UI Design"
                className="w-full bg-transparent font-bold text-white text-base focus:outline-none placeholder-white/30"
              />
              <span className="text-[11px] text-[#8E9BAE] block">
                You mentor for <strong>{sessionLength}m</strong> (+{(sessionLength / 60).toFixed(2)} cr)
              </span>
            </div>

            {/* Equals Icon */}
            <div className="md:col-span-1 text-center font-display font-black text-2xl text-[#8E9BAE]">
              ⇄
            </div>

            {/* Receive Box */}
            <div className="md:col-span-3 bg-black/40 rounded-2xl p-4 border border-white/5 space-y-2">
              <span className="text-[10px] font-mono text-[#00D284] uppercase tracking-wider block">
                2. What You Learn (Receive)
              </span>
              <input
                type="text"
                value={learnSkill}
                onChange={(e) => setLearnSkill(e.target.value)}
                placeholder="e.g. Rust, ML, French"
                className="w-full bg-transparent font-bold text-white text-base focus:outline-none placeholder-white/30"
              />
              <span className="text-[11px] text-[#8E9BAE] block">
                You learn for <strong>{sessionLength}m</strong> (-{(sessionLength / 60).toFixed(2)} cr)
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-white/5 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="text-[#8E9BAE]">Session duration:</span>
              {([15, 30, 60] as const).map(d => (
                <button
                  key={d}
                  onClick={() => setSessionLength(d)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                    sessionLength === d 
                      ? 'bg-[#3B72FE] text-white' 
                      : 'bg-white/5 text-[#8E9BAE] hover:text-white'
                  }`}
                >
                  {d}m
                </button>
              ))}
            </div>

            <div className="text-white">
              Net Rupee Cost: <strong className="text-[#00D284] text-sm">₹0.00</strong> (100% Peer Swap)
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* ACT 03: ZERO-TRUST SMART ESCROW */}
      {/* ========================================================= */}
      <section 
        ref={act3Ref}
        className="max-w-5xl mx-auto px-4 scroll-mt-28 space-y-12"
      >
        <div className="space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 font-mono text-xs text-amber-400 tracking-widest uppercase">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            <span>Act 03 • Zero-Trust Smart Escrow</span>
          </div>

          <h2 className="font-display font-extrabold text-3xl sm:text-5xl lg:text-6xl text-white tracking-[-0.03em] leading-[1.1]">
            Locked upon booking.<br />
            <span className="text-amber-400">Released only upon mutual handshake.</span>
          </h2>

          <p className="text-[#8E9BAE] text-base sm:text-lg leading-relaxed">
            No flakes, no ghosting, no disputes. Credits are safely locked in smart escrow the moment a session is scheduled. When the collaboration ends, both parties confirm completion to unlock the vault.
          </p>
        </div>

        {/* 4 Step Timeline Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div 
            onClick={() => setSimulatedEscrowStep(1)}
            className={`escrow-step-card p-6 rounded-3xl border transition-all cursor-pointer ${
              simulatedEscrowStep === 1 
                ? 'bg-[#151C26] border-[#3B72FE] shadow-lg shadow-blue-500/10' 
                : 'bg-[#0E131B] border-white/5 hover:border-white/20'
            }`}
          >
            <div className="flex items-center justify-between pb-3">
              <span className="font-mono text-xs font-bold text-[#3B72FE]">Step 01</span>
              <FontAwesomeIcon icon={faLock} className="text-xs text-[#3B72FE]" />
            </div>
            <h4 className="font-display font-bold text-white text-base">Booking & Escrow Hold</h4>
            <p className="text-xs text-[#8E9BAE] mt-2 leading-relaxed">
              Learner books a slot. 0.50 credits move from active balance into Escrow Vault.
            </p>
          </div>

          <div 
            onClick={() => setSimulatedEscrowStep(2)}
            className={`escrow-step-card p-6 rounded-3xl border transition-all cursor-pointer ${
              simulatedEscrowStep === 2 
                ? 'bg-[#151C26] border-[#3B72FE] shadow-lg shadow-blue-500/10' 
                : 'bg-[#0E131B] border-white/5 hover:border-white/20'
            }`}
          >
            <div className="flex items-center justify-between pb-3">
              <span className="font-mono text-xs font-bold text-[#3B72FE]">Step 02</span>
              <FontAwesomeIcon icon={faClock} className="text-xs text-[#3B72FE]" />
            </div>
            <h4 className="font-display font-bold text-white text-base">Collaborative Studio</h4>
            <p className="text-xs text-[#8E9BAE] mt-2 leading-relaxed">
              Both join the studio room with live video, code scratchpad, and real-time agenda timer.
            </p>
          </div>

          <div 
            onClick={() => setSimulatedEscrowStep(3)}
            className={`escrow-step-card p-6 rounded-3xl border transition-all cursor-pointer ${
              simulatedEscrowStep === 3 
                ? 'bg-[#151C26] border-[#00D284] shadow-lg shadow-[#00D284]/10' 
                : 'bg-[#0E131B] border-white/5 hover:border-white/20'
            }`}
          >
            <div className="flex items-center justify-between pb-3">
              <span className="font-mono text-xs font-bold text-[#00D284]">Step 03</span>
              <FontAwesomeIcon icon={faHandshake} className="text-xs text-[#00D284]" />
            </div>
            <h4 className="font-display font-bold text-white text-base">Mutual Handshake</h4>
            <p className="text-xs text-[#8E9BAE] mt-2 leading-relaxed">
              Learner clicks 'Confirm Complete'. Escrow unlocks automatically without central admin delay.
            </p>
          </div>

          <div 
            onClick={() => setSimulatedEscrowStep(4)}
            className={`escrow-step-card p-6 rounded-3xl border transition-all cursor-pointer ${
              simulatedEscrowStep === 4 
                ? 'bg-[#151C26] border-[#00D284] shadow-lg shadow-[#00D284]/10' 
                : 'bg-[#0E131B] border-white/5 hover:border-white/20'
            }`}
          >
            <div className="flex items-center justify-between pb-3">
              <span className="font-mono text-xs font-bold text-[#00D284]">Step 04</span>
              <FontAwesomeIcon icon={faUnlock} className="text-xs text-[#00D284]" />
            </div>
            <h4 className="font-display font-bold text-white text-base">Deposit & Endorsement</h4>
            <p className="text-xs text-[#8E9BAE] mt-2 leading-relaxed">
              Mentor receives +0.50 cr to spend. Verified peer review & skill endorsement logged.
            </p>
          </div>
        </div>

        {/* Live Escrow Status Banner */}
        <div className="bg-[#151C26] rounded-3xl p-6 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#00D284]/10 text-[#00D284] flex items-center justify-center text-xl shrink-0">
              <FontAwesomeIcon icon={faShieldHalved} />
            </div>
            <div>
              <h5 className="font-bold text-white text-sm">Protected by SkillSwap Time-Vault</h5>
              <p className="text-xs text-[#8E9BAE]">
                If a mentor does not attend within 15 minutes, escrow credits are automatically refunded in full.
              </p>
            </div>
          </div>
          <div className="font-mono text-xs text-[#00D284] bg-[#00D284]/10 px-3 py-1.5 rounded-full border border-[#00D284]/20 shrink-0">
            Zero Platform Commission
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* ACT 04: MULTI-CAMPUS PEER NETWORK */}
      {/* ========================================================= */}
      <section 
        ref={act4Ref}
        className="max-w-5xl mx-auto px-4 scroll-mt-28 space-y-12"
      >
        <div className="space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 font-mono text-xs text-[#3B72FE] tracking-widest uppercase">
            <span className="w-2 h-2 rounded-full bg-[#3B72FE]"></span>
            <span>Act 04 • Multi-Campus Peer Network</span>
          </div>

          <h2 className="font-display font-extrabold text-3xl sm:text-5xl lg:text-6xl text-white tracking-[-0.03em] leading-[1.1]">
            Cross-campus intelligence.<br />
            <span className="text-[#3B72FE]">Verified by peer reputation.</span>
          </h2>

          <p className="text-[#8E9BAE] text-base sm:text-lg leading-relaxed">
            Connect directly with verified students and alumni across India's premier colleges. Learn systems programming from IIT Bombay, full-stack from BITS Pilani, or UI/UX from design universities.
          </p>
        </div>

        {/* Interactive Campus Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-xs font-mono">
          {[
            { campus: 'Chandigarh University', tag: 'WebRTC & Fullstack', count: '16 Active' },
            { campus: 'IIT Bombay', tag: 'Systems & ML', count: '14 Active' },
            { campus: 'BITS Pilani', tag: 'Next.js & Rust', count: '19 Active' },
            { campus: 'IIT Delhi', tag: 'Data & Cloud', count: '11 Active' },
            { campus: 'NIT Trichy', tag: 'Java & Spring', count: '16 Active' },
            { campus: 'IIIT Hyderabad', tag: 'Algorithms & AI', count: '22 Active' },
            { campus: 'Delhi University', tag: 'Economics & Lang', count: '12 Active' },
            { campus: 'IIT Madras', tag: 'Robotics & C++', count: '15 Active' }
          ].map((item, idx) => (
            <div
              key={idx}
              onClick={() => onExploreMentors(item.campus)}
              className="campus-pill-node bg-[#0E131B] border border-white/5 hover:border-[#3B72FE] rounded-2xl p-4 transition-all hover:-translate-y-1 cursor-pointer group"
              title={`View active peer mentors at ${item.campus}`}
            >
              <div className="flex items-center gap-1.5 text-white font-bold text-sm group-hover:text-[#3B72FE] transition-colors">
                <FontAwesomeIcon icon={faGraduationCap} className="text-[#3B72FE] text-xs" />
                <span className="truncate">{item.campus}</span>
              </div>
              <p className="text-[11px] text-[#8E9BAE] mt-1 truncate">{item.tag}</p>
              <div className="text-[10px] text-[#00D284] mt-2 font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00D284]"></span>
                <span>{item.count}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Transition Bridge to Directory */}
        <div className="pt-6 text-center space-y-4">
          <p className="text-xs font-mono text-[#8E9BAE] uppercase tracking-widest">
            The narrative leads to action
          </p>
          <button
            onClick={() => onExploreMentors()}
            className="px-8 py-4 rounded-full bg-[#3B72FE] hover:bg-[#2A61ED] text-white font-display font-bold text-sm tracking-wide shadow-xl shadow-blue-500/25 transition-all inline-flex items-center gap-3 group"
          >
            <span>Enter Live Mentor Directory</span>
            <FontAwesomeIcon icon={faArrowDown} className="text-xs group-hover:translate-y-0.5 transition-transform" />
          </button>
        </div>
      </section>

    </div>
  );
};
