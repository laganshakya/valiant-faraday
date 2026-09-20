import React from 'react';

export const KineticTicker: React.FC = () => {
  const lane1Items = [
    'TIME IS CURRENCY',
    'ZERO ₹ CASH REQUIRED',
    '1 HOUR = 1.00 CREDIT',
    '30 MIN = 0.50 CREDIT',
    'SMART ESCROW HOLD',
    'KNOWLEDGE OVER TUITION',
    'MUTUAL COMPLETION HANDSHAKE',
    'VERIFIED PEER ENDORSEMENTS',
  ];

  const lane2Campuses = [
    'CHANDIGARH UNIVERSITY',
    'IIT BOMBAY',
    'BITS PILANI',
    'IIT DELHI',
    'NIT TRICHY',
    'IIIT HYDERABAD',
    'DELHI UNIVERSITY',
    'IIT MADRAS',
    'VELLORE INSTITUTE',
    'IIT KHARAGPUR',
    'JADAVPUR UNIVERSITY'
  ];

  return (
    <div className="w-full py-8 space-y-3 overflow-hidden select-none ticker-pause relative">
      {/* Edge gradient masks for seamless fade */}
      <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-r from-[#080B10] to-transparent z-10 pointer-events-none"></div>
      <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-l from-[#080B10] to-transparent z-10 pointer-events-none"></div>

      {/* Lane 1: Economic Thesis (Flows Left) */}
      <div className="flex whitespace-nowrap overflow-hidden">
        <div className="flex items-center gap-6 animate-ticker-left">
          {[...lane1Items, ...lane1Items].map((item, idx) => (
            <div key={idx} className="flex items-center gap-6">
              <span className="font-display font-black text-xl sm:text-2xl text-white/90 tracking-tight hover:text-[#3B72FE] transition-colors cursor-default">
                {item}
              </span>
              <span className="w-2 h-2 rounded-full bg-[#3B72FE] shrink-0"></span>
            </div>
          ))}
        </div>
      </div>

      {/* Lane 2: Campus Network (Flows Right) */}
      <div className="flex whitespace-nowrap overflow-hidden">
        <div className="flex items-center gap-6 animate-ticker-right">
          {[...lane2Campuses, ...lane2Campuses].map((campus, idx) => (
            <div key={idx} className="flex items-center gap-6">
              <span className="font-mono text-xs sm:text-sm text-[#8E9BAE] uppercase tracking-widest hover:text-[#00D284] transition-colors cursor-default font-semibold">
                {campus}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#00D284]/60 shrink-0"></span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
