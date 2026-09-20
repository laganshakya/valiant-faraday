import React from 'react';
import { useApp } from '../../context/AppContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faXmark, 
  faCoins, 
  faLock, 
  faShieldHalved
} from '@fortawesome/free-solid-svg-icons';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WalletModal: React.FC<WalletModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, transactions } = useApp();

  if (!isOpen || !currentUser) return null;

  const estimatedRupeeValue = Math.round(currentUser.credits_balance * 1500);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#080B10]/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-black/10 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 bg-[#0E131B] text-white flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#00D284] text-[#0A0E14] flex items-center justify-center text-xl shadow-md shadow-[#00D284]/20">
              <FontAwesomeIcon icon={faCoins} />
            </div>
            <div>
              <h3 className="font-display font-extrabold text-xl text-white">SkillSwap Time-Bank Wallet</h3>
              <p className="text-xs text-[#8E9BAE]">Decentralized peer credits • Zero ₹ cash required</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#8E9BAE] hover:text-white hover:bg-white/10 transition-colors"
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-[#0A0E14]">

          {/* Balances */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Available */}
            <div className="p-6 rounded-3xl bg-[#F6F8FA] border border-black/5 relative space-y-2">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8E9BAE]">Available to Spend</span>
                <span className="text-[10px] font-mono font-bold bg-[#00D284]/10 text-[#0E7048] px-2.5 py-0.5 rounded-full border border-[#00D284]/20">
                  Instant Access
                </span>
              </div>
              <div className="flex items-baseline gap-2 font-mono">
                <span className="text-4xl font-extrabold text-[#0A0E14]">
                  {currentUser.credits_balance.toFixed(2)}
                </span>
                <span className="text-sm font-sans font-semibold text-[#5A6A80]">Credits</span>
              </div>
              <p className="text-xs text-[#00D284] font-semibold">
                ≈ ₹{estimatedRupeeValue} in commercial tutoring equivalent
              </p>
            </div>

            {/* Escrow */}
            <div className="p-6 rounded-3xl bg-[#0E131B] text-white border border-white/10 relative space-y-2">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8E9BAE]">Locked in Escrow</span>
                <span className="text-[10px] font-mono font-bold bg-[#3B72FE]/10 text-[#3B72FE] px-2.5 py-0.5 rounded-full border border-[#3B72FE]/20 flex items-center gap-1">
                  <FontAwesomeIcon icon={faLock} className="text-[8px]" />
                  Protected
                </span>
              </div>
              <div className="flex items-baseline gap-2 font-mono">
                <span className="text-4xl font-extrabold text-white">
                  {currentUser.credits_escrow.toFixed(2)}
                </span>
                <span className="text-sm font-sans font-semibold text-[#8E9BAE]">Credits</span>
              </div>
              <p className="text-xs text-[#8E9BAE]">
                Safely held for active & upcoming swaps
              </p>
            </div>

          </div>

          {/* Time-Banking Table */}
          <div className="p-5 rounded-3xl bg-[#F6F8FA] border border-black/5 space-y-3">
            <div className="flex items-center gap-2 text-[#0A0E14] font-bold text-sm">
              <FontAwesomeIcon icon={faShieldHalved} className="text-[#3B72FE]" />
              <span>Time-Banking Economy (1 Hour = 1 Credit)</span>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
              <div className="p-3 bg-white rounded-2xl border border-black/5">
                <div className="font-mono font-bold text-[#3B72FE] text-sm">0.25 cr</div>
                <div className="text-[11px] text-[#5A6A80] font-medium mt-0.5">15m Debug</div>
                <div className="text-[10px] text-[#8E9BAE] mt-0.5 font-mono">Saves ~₹350</div>
              </div>
              <div className="p-3 bg-white rounded-2xl border border-black/5">
                <div className="font-mono font-bold text-[#3B72FE] text-sm">0.50 cr</div>
                <div className="text-[11px] text-[#5A6A80] font-medium mt-0.5">30m Review</div>
                <div className="text-[10px] text-[#8E9BAE] mt-0.5 font-mono">Saves ~₹750</div>
              </div>
              <div className="p-3 bg-white rounded-2xl border border-black/5">
                <div className="font-mono font-bold text-[#3B72FE] text-sm">0.75 cr</div>
                <div className="text-[11px] text-[#5A6A80] font-medium mt-0.5">45m Deep Dive</div>
                <div className="text-[10px] text-[#8E9BAE] mt-0.5 font-mono">Saves ~₹1,125</div>
              </div>
              <div className="p-3 bg-white rounded-2xl border border-black/5">
                <div className="font-mono font-bold text-[#3B72FE] text-sm">1.00 cr</div>
                <div className="text-[11px] text-[#5A6A80] font-medium mt-0.5">60m Masterclass</div>
                <div className="text-[10px] text-[#8E9BAE] mt-0.5 font-mono">Saves ~₹1,500</div>
              </div>
            </div>

            <p className="text-xs text-[#5A6A80] leading-relaxed">
              When booking, credits are deposited into <strong>Escrow</strong>. They only transfer when you click <em>Complete Session</em> in the virtual room. 100% refund guarantee on cancellation.
            </p>
          </div>

          {/* Transactions Ledger */}
          <div>
            <h4 className="font-bold text-sm text-[#0A0E14] mb-3 flex items-center justify-between">
              <span>Financial Ledger</span>
              <span className="text-xs font-mono font-normal text-[#8E9BAE]">{transactions.length} records</span>
            </h4>

            {transactions.length === 0 ? (
              <div className="p-6 text-center text-[#8E9BAE] border border-dashed rounded-2xl">
                <p className="text-xs">No transactions recorded yet.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {transactions.map(tx => {
                  const isPositive = tx.amount > 0;
                  const isZero = tx.amount === 0;

                  return (
                    <div 
                      key={tx.id}
                      className="p-3.5 bg-[#F6F8FA] border border-black/5 rounded-2xl flex items-center justify-between text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-[#0A0E14] border border-black/5">
                            {tx.type.replace('_', ' ')}
                          </span>
                          <span className="text-[#8E9BAE] text-[10px] font-mono">
                            {new Date(tx.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[#0A0E14] font-medium">{tx.note}</p>
                      </div>

                      <div className={`font-mono font-bold text-sm text-right ${
                        isZero ? 'text-[#8E9BAE]' :
                        isPositive ? 'text-[#00D284]' : 'text-[#0A0E14]'
                      }`}>
                        {isZero ? '0.00' : isPositive ? `+${tx.amount.toFixed(2)}` : tx.amount.toFixed(2)} cr
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-[#F6F8FA] border-t border-black/5 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-[#0A0E14] hover:bg-[#3B72FE] text-white rounded-full text-xs font-semibold transition-colors"
          >
            Close Wallet
          </button>
        </div>

      </div>
    </div>
  );
};
