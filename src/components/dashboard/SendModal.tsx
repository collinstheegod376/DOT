'use client';

import React, { useState, useMemo } from 'react';
import {
  X,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Fingerprint,
  RefreshCw,
  CheckCircle2,
  Radio,
  Zap,
} from 'lucide-react';
import { useWallet } from '@/context/WalletContext';
import { SupportedChainId } from '@/types/wallet';
import { SUPPORTED_CHAINS } from '@/lib/constants';
import { decodeTransactionIntent } from '@/lib/decoder';

interface SendModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultChainId?: SupportedChainId;
}

export function SendModal({ isOpen, onClose, defaultChainId = 'ethereum' }: SendModalProps) {
  const { selectedChains, balances, sendTransaction, isOnline } = useWallet();

  const [chainId, setChainId] = useState<SupportedChainId>(defaultChainId);
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [feeSpeed, setFeeSpeed] = useState<'low' | 'normal' | 'fast'>('normal');

  const [step, setStep] = useState<'input' | 'preview' | 'success'>('input');
  const [isSigning, setIsSigning] = useState(false);
  const [signedTxHash, setSignedTxHash] = useState<string | null>(null);

  const chain = SUPPORTED_CHAINS[chainId];
  const balanceInfo = balances[chainId];

  // Decode Intent in real-time
  const decodedIntent = useMemo(() => {
    return decodeTransactionIntent({
      chainId,
      recipient,
      amount,
      currentBalance: balanceInfo?.balance || '0',
      tokenPriceUsd: balanceInfo?.tokenPriceUsd || 0,
      priorityFeeLevel: feeSpeed,
    });
  }, [chainId, recipient, amount, balanceInfo, feeSpeed]);

  if (!isOpen) return null;

  const handleMaxClick = () => {
    if (!balanceInfo) return;
    const maxVal = Math.max(0, parseFloat(balanceInfo.balance) - 0.002);
    setAmount(maxVal.toFixed(4));
  };

  const handleAuthorizeAndSign = async () => {
    setIsSigning(true);
    try {
      // Simulate biometric authorization delay
      await new Promise((r) => setTimeout(r, 700));

      const tx = await sendTransaction({
        chainId,
        hash: '0x' + Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2, '0')).join(''),
        type: 'send',
        amount: `${amount} ${chain.symbol}`,
        fiatValueUsd: (parseFloat(amount) || 0) * (balanceInfo?.tokenPriceUsd || 0),
        from: '0x71C...4982',
        to: decodedIntent.recipient,
        fee: decodedIntent.networkFee,
        note: decodedIntent.recipientLabel || 'Transfer',
      });

      setSignedTxHash(tx.hash);
      setStep('success');
    } catch (err) {
      console.error('Signing error:', err);
    } finally {
      setIsSigning(false);
    }
  };

  const handleResetAndClose = () => {
    setRecipient('');
    setAmount('');
    setStep('input');
    setSignedTxHash(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-[#0F0F14] border border-[#1F1F24] p-6 md:p-8 shadow-2xl shadow-black/90">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#1F1F24] mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-950/60 border border-cyan-700/50 flex items-center justify-center text-cyan-400">
              <Zap size={16} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Send Cryptographic Assets</h3>
              <div className="text-[11px] font-mono text-zinc-400">
                {step === 'preview' ? 'Semantic Intent Decoder Preview' : 'Client-Side Transaction Dispatch'}
              </div>
            </div>
          </div>
          <button
            onClick={handleResetAndClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* STEP 1: Input Details */}
        {step === 'input' && (
          <div className="space-y-4">
            {/* Chain Selector */}
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Asset & Network</label>
              <div className="grid grid-cols-3 gap-2">
                {selectedChains.map((id) => {
                  const c = SUPPORTED_CHAINS[id];
                  const isSelected = chainId === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setChainId(id)}
                      className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
                        isSelected
                          ? 'bg-cyan-950/40 border-cyan-500 text-cyan-300'
                          : 'bg-[#14141C] border-[#272732] text-zinc-400 hover:text-white'
                      }`}
                    >
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                      <span>{c.symbol}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Recipient Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-zinc-400">Recipient Address</label>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const text = await navigator.clipboard.readText();
                      setRecipient(text.trim());
                    } catch {
                      // Fallback demo address
                      setRecipient('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045');
                    }
                  }}
                  className="text-[11px] font-mono text-cyan-400 hover:underline cursor-pointer"
                >
                  Paste Clipboard
                </button>
              </div>
              <input
                type="text"
                placeholder={
                  chainId === 'ethereum'
                    ? '0x... (EIP-55 EVM address)'
                    : chainId === 'bitcoin'
                    ? 'bc1q... (Native SegWit address)'
                    : 'Base58 Solana address...'
                }
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#14141C] border border-[#272732] text-zinc-200 font-mono text-xs focus:outline-none focus:border-cyan-400"
              />
            </div>

            {/* Amount Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-zinc-400">Amount</label>
                <div className="text-[11px] font-mono text-zinc-400">
                  Available: <span className="text-zinc-200">{balanceInfo?.balance || '0'} {chain.symbol}</span>
                </div>
              </div>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-4 py-2.5 pr-20 rounded-xl bg-[#14141C] border border-[#272732] text-zinc-100 font-mono text-sm focus:outline-none focus:border-cyan-400"
                />
                <div className="absolute right-2 top-2 flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleMaxClick}
                    className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950/60 border border-cyan-800/60 text-cyan-300 hover:bg-cyan-900/60 transition"
                  >
                    MAX
                  </button>
                  <span className="text-xs font-mono text-zinc-400 pr-1">{chain.symbol}</span>
                </div>
              </div>
            </div>

            {/* Priority Fee Tier */}
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Network Gas Speed</label>
              <div className="grid grid-cols-3 gap-2">
                {(['low', 'normal', 'fast'] as const).map((tier) => (
                  <button
                    key={tier}
                    type="button"
                    onClick={() => setFeeSpeed(tier)}
                    className={`py-2 px-3 rounded-xl border text-xs font-mono capitalize transition cursor-pointer ${
                      feeSpeed === tier
                        ? 'bg-[#181824] border-cyan-500/60 text-cyan-300 font-bold'
                        : 'bg-[#14141C] border-[#272732] text-zinc-400 hover:text-white'
                    }`}
                  >
                    {tier}
                  </button>
                ))}
              </div>
            </div>

            {/* Next Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setStep('preview')}
                disabled={!recipient || !amount || parseFloat(amount) <= 0}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-semibold bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 disabled:opacity-40 text-black shadow-lg shadow-cyan-500/15 transition cursor-pointer"
              >
                <span>Decode & Preview Intent</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Semantic Intent Decoder Preview */}
        {step === 'preview' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Decoded Summary Box */}
            <div className="p-4 rounded-2xl bg-[#14141E] border border-cyan-500/40">
              <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-2">
                <ShieldCheck size={16} />
                <span>SEMANTIC INTENT VERIFICATION</span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-[#272736]">
                  <span className="text-zinc-400">Recipient Target:</span>
                  <span className="font-mono text-zinc-200 text-right truncate max-w-[200px]">
                    {decodedIntent.recipientLabel || decodedIntent.recipient}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#272736]">
                  <span className="text-zinc-400">Transfer Principal:</span>
                  <span className="font-mono font-bold text-white">
                    {decodedIntent.amount} {decodedIntent.symbol}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#272736]">
                  <span className="text-zinc-400">Estimated Network Fee:</span>
                  <span className="font-mono text-zinc-300">{decodedIntent.networkFee}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#272736]">
                  <span className="text-zinc-400">Total Outflow Debit:</span>
                  <span className="font-mono font-bold text-cyan-300">
                    {decodedIntent.estimatedTotalDebit}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-zinc-400">Remaining Balance:</span>
                  <span className="font-mono text-zinc-300">
                    {decodedIntent.estimatedRemainingBalance}
                  </span>
                </div>
              </div>
            </div>

            {/* Security Warnings / Heuristics Check */}
            <div className="space-y-2">
              <div className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider">
                Cryptographic Rule Checks
              </div>

              {decodedIntent.warnings.map((w, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs ${
                    w.level === 'danger'
                      ? 'bg-red-950/40 border-red-800/50 text-red-300'
                      : w.level === 'warning'
                      ? 'bg-amber-950/40 border-amber-800/50 text-amber-300'
                      : 'bg-emerald-950/30 border-emerald-800/40 text-emerald-300'
                  }`}
                >
                  {w.level === 'danger' ? (
                    <ShieldAlert size={16} className="text-red-400 shrink-0 mt-0.5" />
                  ) : w.level === 'warning' ? (
                    <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />
                  ) : (
                    <ShieldCheck size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="font-semibold">{w.title}</div>
                    <div className="text-[11px] opacity-80 mt-0.5">{w.description}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Offline notification if airgap simulated */}
            {!isOnline && (
              <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-700/40 flex items-center gap-2 text-xs text-cyan-300 font-mono">
                <Radio size={14} className="text-cyan-400 animate-pulse" />
                <span>Air-Gap Mode Active: Signature will be queued offline safely.</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep('input')}
                className="px-4 py-3 rounded-xl text-xs font-semibold bg-[#14141C] text-zinc-400 hover:text-white border border-[#272732] transition"
              >
                Edit
              </button>

              <button
                type="button"
                onClick={handleAuthorizeAndSign}
                disabled={isSigning || decodedIntent.warnings.some((w) => w.level === 'danger')}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-semibold bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 disabled:opacity-40 text-black shadow-lg shadow-cyan-500/20 transition cursor-pointer"
              >
                {isSigning ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>Signing with Biometric Passkey...</span>
                  </>
                ) : (
                  <>
                    <Fingerprint size={16} />
                    <span>Authorize & Sign Transaction</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Success Confirmation */}
        {step === 'success' && (
          <div className="text-center py-6 space-y-4 animate-in fade-in duration-200">
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-950/50 border border-emerald-500/40 flex items-center justify-center text-emerald-400 glow-emerald">
              <CheckCircle2 size={32} />
            </div>

            <div>
              <h3 className="text-lg font-bold text-white">Transaction Successfully Signed</h3>
              <p className="text-xs text-zinc-400 mt-1">
                {isOnline
                  ? 'Broadcasted directly to network mempool with zero intermediary servers.'
                  : 'Signed and queued offline in air-gap vault storage.'}
              </p>
            </div>

            {signedTxHash && (
              <div className="p-3 rounded-xl bg-[#14141C] border border-[#272732] text-left">
                <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-1">
                  Cryptographic Transaction Hash
                </div>
                <div className="font-mono text-xs text-zinc-300 break-all select-all">
                  {signedTxHash}
                </div>
              </div>
            )}

            <button
              onClick={handleResetAndClose}
              className="w-full py-3 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-white transition cursor-pointer"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
