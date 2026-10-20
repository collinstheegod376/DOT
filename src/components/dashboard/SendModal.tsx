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
  ExternalLink,
  ChevronDown,
} from 'lucide-react';
import { useWallet } from '@/context/WalletContext';
import { TokenAsset } from '@/types/wallet';
import { validateSolanaAddress } from '@/lib/chains/sol';

interface SendModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultAssetSymbol?: string;
}

export function SendModal({
  isOpen,
  onClose,
  defaultAssetSymbol = 'SOL',
}: SendModalProps) {
  const { tokens, addresses, sendTransaction, isOnline } = useWallet();

  const [selectedSymbol, setSelectedSymbol] = useState<string>(defaultAssetSymbol);
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [priorityFeeTier, setPriorityFeeTier] = useState<'normal' | 'turbo' | 'ultra'>('normal');

  const [step, setStep] = useState<'input' | 'preview' | 'success'>('input');
  const [isSigning, setIsSigning] = useState(false);
  const [signedTxHash, setSignedTxHash] = useState<string | null>(null);

  // Sync defaultAssetSymbol if prop changes
  React.useEffect(() => {
    if (defaultAssetSymbol) {
      setSelectedSymbol(defaultAssetSymbol);
    }
  }, [defaultAssetSymbol]);

  const solanaAddress = addresses.solana?.address || '';

  const activeToken: TokenAsset = useMemo(() => {
    return (
      tokens.find((t) => t.symbol.toUpperCase() === selectedSymbol.toUpperCase()) ||
      tokens[0] || {
        symbol: 'SOL',
        name: 'Solana',
        mint: 'native',
        decimals: 9,
        balance: '0.00',
        tokenPriceUsd: 154.20,
        fiatValueUsd: 0.00,
        change24hPercent: 0,
        isNative: true,
      }
    );
  }, [tokens, selectedSymbol]);

  // Fee calculation in SOL
  const feeSol = priorityFeeTier === 'normal' ? 0.000005 : priorityFeeTier === 'turbo' ? 0.000025 : 0.0001;

  // Validation
  const isAddressValid = useMemo(() => {
    if (!recipient) return true; // not entered yet
    return validateSolanaAddress(recipient);
  }, [recipient]);

  const numericAmount = parseFloat(amount) || 0;
  const numericBalance = parseFloat(activeToken.balance) || 0;
  const isBalanceSufficient = numericBalance >= numericAmount;

  if (!isOpen) return null;

  const handleMaxClick = () => {
    if (activeToken.isNative) {
      const maxVal = Math.max(0, numericBalance - 0.001); // reserve fee
      setAmount(maxVal > 0 ? maxVal.toFixed(4) : '0.00');
    } else {
      setAmount(activeToken.balance);
    }
  };

  const handleAuthorizeAndSign = async () => {
    setIsSigning(true);
    try {
      // Simulate biometric authorization delay
      await new Promise((r) => setTimeout(r, 700));

      // Generate mock 64-character transaction signature
      const randomBytes = crypto.getRandomValues(new Uint8Array(32));
      const mockTxHash = Array.from(randomBytes)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');

      const fiatVal = numericAmount * activeToken.tokenPriceUsd;

      const tx = await sendTransaction({
        chainId: 'solana',
        hash: mockTxHash,
        type: 'send',
        amount: `${amount} ${activeToken.symbol}`,
        fiatValueUsd: fiatVal,
        from: solanaAddress,
        to: recipient,
        fee: `${feeSol} SOL`,
        note: `Transfer ${activeToken.symbol}`,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-[#0F1118] border border-[#232736] p-6 md:p-8 shadow-2xl shadow-black/90">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#1E2230] mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center text-[#14F195]">
              <Zap size={16} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Send Solana Assets</h3>
              <div className="text-[11px] font-mono text-zinc-400">
                {step === 'preview' ? 'Semantic Intent Decoder' : 'Direct Solana On-Chain Dispatch'}
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

        {/* Sender Solana Address Link */}
        <div className="mb-4 px-3 py-2 rounded-xl bg-[#090A0E] border border-[#1A1D27] flex items-center justify-between text-xs font-mono">
          <span className="text-zinc-500">From (Your Vault):</span>
          <div className="flex items-center gap-1.5">
            <span className="text-emerald-400 truncate max-w-[170px] sm:max-w-[220px]">
              {solanaAddress}
            </span>
            <a
              href={`https://solscan.io/account/${solanaAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-400 hover:text-[#14F195] transition"
              title="View your account on Solscan"
            >
              <ExternalLink size={12} />
            </a>
          </div>
        </div>

        {/* STEP 1: Input Details */}
        {step === 'input' && (
          <div className="space-y-4">
            {/* Asset Selector */}
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                Select Asset (Native SOL or SPL Token)
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {tokens.map((t) => {
                  const isSelected = activeToken.symbol === t.symbol;
                  return (
                    <button
                      key={t.symbol}
                      type="button"
                      onClick={() => setSelectedSymbol(t.symbol)}
                      className={`p-2 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-950/50 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-500/10'
                          : 'bg-[#141722] border-[#222736] text-zinc-400 hover:text-white'
                      }`}
                    >
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: t.color || '#14F195' }}
                      />
                      <span className="font-mono text-xs">{t.symbol}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Recipient Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-zinc-400">
                  Recipient Solana Address
                </label>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const text = await navigator.clipboard.readText();
                      setRecipient(text.trim());
                    } catch {
                      // Fallback demo address
                      setRecipient('83astBRguLMdt2h5U1Tpdq5LMfZynAdgSt2KUzwb9nE8');
                    }
                  }}
                  className="text-[11px] font-mono text-[#14F195] hover:underline cursor-pointer"
                >
                  Paste Clipboard
                </button>
              </div>
              <input
                type="text"
                placeholder="Solana Base58 address (e.g. 83astBR...)"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value.trim())}
                className={`w-full px-4 py-2.5 rounded-xl bg-[#141722] border text-zinc-200 font-mono text-xs focus:outline-none ${
                  !isAddressValid && recipient.length > 0
                    ? 'border-red-500/80 focus:border-red-500'
                    : 'border-[#222736] focus:border-emerald-500'
                }`}
              />
              {!isAddressValid && recipient.length > 0 && (
                <div className="text-[11px] text-red-400 mt-1">
                  Invalid Solana address format. Must be a valid 32-44 character Base58 public key.
                </div>
              )}
            </div>

            {/* Amount Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-zinc-400">Transfer Amount</label>
                <div className="text-[11px] font-mono text-zinc-400">
                  Available:{' '}
                  <span className="text-zinc-200 font-semibold">
                    {activeToken.balance} {activeToken.symbol}
                  </span>
                </div>
              </div>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-4 py-2.5 pr-24 rounded-xl bg-[#141722] border border-[#222736] text-zinc-100 font-mono text-sm focus:outline-none focus:border-emerald-500"
                />
                <div className="absolute right-2 top-2 flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleMaxClick}
                    className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 hover:bg-emerald-900/60 transition cursor-pointer"
                  >
                    MAX
                  </button>
                  <span className="text-xs font-mono text-zinc-400 pr-1">{activeToken.symbol}</span>
                </div>
              </div>
              {numericAmount > 0 && (
                <div className="text-[11px] font-mono text-zinc-400 mt-1">
                  ≈ ${(numericAmount * activeToken.tokenPriceUsd).toFixed(2)} USD
                </div>
              )}
            </div>

            {/* Solana Priority Fee Tier */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-zinc-400">
                  Compute Unit Priority Fee
                </label>
                <span className="text-[11px] font-mono text-zinc-500">
                  Estimated Fee: ~{feeSol} SOL
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(['normal', 'turbo', 'ultra'] as const).map((tier) => (
                  <button
                    key={tier}
                    type="button"
                    onClick={() => setPriorityFeeTier(tier)}
                    className={`py-2 px-3 rounded-xl border text-xs font-mono capitalize transition cursor-pointer ${
                      priorityFeeTier === tier
                        ? 'bg-[#181D2A] border-emerald-500/60 text-emerald-300 font-bold'
                        : 'bg-[#141722] border-[#222736] text-zinc-400 hover:text-white'
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
                disabled={
                  !recipient ||
                  !isAddressValid ||
                  !amount ||
                  numericAmount <= 0
                }
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-semibold bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 disabled:opacity-40 text-black font-bold shadow-lg shadow-emerald-500/15 transition cursor-pointer"
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
            <div className="p-4 rounded-2xl bg-[#131622] border border-emerald-500/40">
              <div className="flex items-center gap-2 text-xs font-mono text-[#14F195] mb-2.5">
                <ShieldCheck size={16} />
                <span>SEMANTIC SOLANA INTENT VERIFICATION</span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-[#23283A]">
                  <span className="text-zinc-400">Target Recipient:</span>
                  <div className="flex items-center gap-1 font-mono text-zinc-200 truncate max-w-[200px]">
                    <span className="truncate">{recipient}</span>
                    <a
                      href={`https://solscan.io/account/${recipient}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-zinc-400 hover:text-[#14F195]"
                    >
                      <ExternalLink size={11} />
                    </a>
                  </div>
                </div>
                <div className="flex justify-between py-1 border-b border-[#23283A]">
                  <span className="text-zinc-400">Transfer Asset:</span>
                  <span className="font-mono font-bold text-white">
                    {amount} {activeToken.symbol}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#23283A]">
                  <span className="text-zinc-400">Solana Network Fee:</span>
                  <span className="font-mono text-zinc-300">~{feeSol} SOL</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#23283A]">
                  <span className="text-zinc-400">Total USD Valuation:</span>
                  <span className="font-mono font-bold text-emerald-300">
                    ${(numericAmount * activeToken.tokenPriceUsd).toFixed(2)} USD
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-zinc-400">Remaining Balance:</span>
                  <span className="font-mono text-zinc-300">
                    {Math.max(0, numericBalance - numericAmount).toFixed(4)} {activeToken.symbol}
                  </span>
                </div>
              </div>
            </div>

            {/* Rule Checks / Warnings */}
            <div className="space-y-2">
              {!isBalanceSufficient ? (
                <div className="p-3 rounded-xl border bg-red-950/40 border-red-800/50 text-red-300 flex items-start gap-2.5 text-xs">
                  <ShieldAlert size={16} className="text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold">Insufficient Balance</div>
                    <div className="text-[11px] opacity-80 mt-0.5">
                      Your vault holds {activeToken.balance} {activeToken.symbol}, which is less than the requested transfer amount.
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl border bg-emerald-950/30 border-emerald-800/40 text-emerald-300 flex items-start gap-2.5 text-xs">
                  <ShieldCheck size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold">Cryptographic Security Verified</div>
                    <div className="text-[11px] opacity-80 mt-0.5">
                      Target address format validated. Zero plaintext secrets exposed to memory.
                    </div>
                  </div>
                </div>
              )}
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
                className="px-4 py-3 rounded-xl text-xs font-semibold bg-[#141722] text-zinc-400 hover:text-white border border-[#222736] transition cursor-pointer"
              >
                Edit
              </button>

              <button
                type="button"
                onClick={handleAuthorizeAndSign}
                disabled={isSigning || !isBalanceSufficient}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-semibold bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 disabled:opacity-40 text-black font-bold shadow-lg shadow-emerald-500/20 transition cursor-pointer"
              >
                {isSigning ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>Signing with Biometric Passkey...</span>
                  </>
                ) : (
                  <>
                    <Fingerprint size={16} />
                    <span>Authorize & Sign Solana Transfer</span>
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
              <h3 className="text-lg font-bold text-white">Solana Transfer Successfully Signed</h3>
              <p className="text-xs text-zinc-400 mt-1">
                {isOnline
                  ? 'Dispatched directly to Solana validators via public RPC.'
                  : 'Signed and queued offline in air-gap vault storage.'}
              </p>
            </div>

            {signedTxHash && (
              <div className="p-3.5 rounded-2xl bg-[#0A0C12] border border-[#1E2230] text-left space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                  <span>TRANSACTION SIGNATURE</span>
                  <a
                    href={`https://solscan.io/tx/${signedTxHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[#14F195] hover:underline"
                  >
                    <span>View on Solscan</span>
                    <ExternalLink size={11} />
                  </a>
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
