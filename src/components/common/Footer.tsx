import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faHandshakeAngle, 
  faShieldHalved, 
  faCoins, 
  faGraduationCap 
} from '@fortawesome/free-solid-svg-icons';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#080B10] border-t border-white/10 mt-auto text-xs text-[#8E9BAE] py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#3B72FE] to-[#1E40AF] flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <FontAwesomeIcon icon={faHandshakeAngle} className="text-sm" />
            </div>
            <div>
              <span className="font-display font-extrabold text-white text-base tracking-tight">Skill<span className="text-[#3B72FE]">Swap</span></span>
              <p className="text-[11px] text-[#8E9BAE]">Peer Micro-Mentoring & Time-Banking Economy</p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-[#8E9BAE] font-medium flex-wrap justify-center text-xs">
            <span className="flex items-center gap-2">
              <FontAwesomeIcon icon={faCoins} className="text-[#00D284]" />
              <span>1 Hour Taught = 1 Credit</span>
            </span>
            <span className="flex items-center gap-2">
              <FontAwesomeIcon icon={faShieldHalved} className="text-[#3B72FE]" />
              <span>Zero-Cash Escrow</span>
            </span>
            <span className="flex items-center gap-2">
              <FontAwesomeIcon icon={faGraduationCap} className="text-white" />
              <span>Saves ₹1,500 – ₹5,000/hr</span>
            </span>
          </div>

        </div>

        <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-[#5A6A80] text-[11px]">
          <p>© 2026 SkillSwap Platform. Addressing educational affordability through decentralized skill exchange.</p>
          <p className="font-mono">Vite • React • TypeScript • GSAP • Supabase</p>
        </div>

      </div>
    </footer>
  );
};
