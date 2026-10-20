'use client';

import React, { useState, useMemo } from 'react';
import {
  ArrowUpRight,
  ArrowDownLeft,
  Radio,
  Copy,
  Check,
  Clipboard,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  QrCode,
  ExternalLink,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { useWallet } from '@/context/WalletContext';
import { TokenAsset } from '@/types/wallet';
import { validateSolanaAddress } from '@/lib/chains/sol';
import { TokenIcon } from '@/components/dashboard/token-icons';
import { generateQrMatrix, generateQrSvgPath } from '@/lib/qrcode';

interface QuickActionCardProps {
  onOpenAirGap?: () => void;
  onViewQr?: (address: string) => void;
  onSendComplete?: (txHash: string) => void;
  initialTab?: 'send' | 'receive' | 'airgap';
}

type TabType = 'send' | 'receive' | 'airgap';

export function QuickActionCard({
  onOpenAirGap,
  onViewQr,
  onSendComplete,
  initialTab = 'send',
}: QuickActionCardProps) {
  const { tokens, addresses, sendTransaction, isOnline } = useWallet();

  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [selectedSymbol, setSelectedSymbol] = useState<string>('SOL');
  const [tokenDropdownOpen, setTokenDropdownOpen] = useState(false);

  // Send state
  const [amount, setAmount] = useState<string>('');
  const [recipient, setRecipient] = useState<string>('');
  const [isSending, setIsSending] = useState(false);
  const [sendSuccessHash, setSendSuccessHash] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);

  // Receive state
  const [copiedReceive, setCopiedReceive] = useState(false);

  const solAddress = addresses.solana?.address || '';

  // Active selected token
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
        fiatValueUsd: 0,
        change24hPercent: 3.42,
      }
    );
  }, [tokens, selectedSymbol]);

  // Recipient validation
  const recipientTrimmed = recipient.trim();
  const isAddressValid = useMemo(() => {
    if (!recipientTrimmed) return null;
    return validateSolanaAddress(recipientTrimmed, true);
  }, [recipientTrimmed]);

  // USD equivalent calculation
  const numAmount = parseFloat(amount) || 0;
  const fiatEquivalent = numAmount * (activeToken.tokenPriceUsd || 0);

  // Token max balance
  const tokenBalanceNum = parseFloat(activeToken.balance) || 0;
  const hasSufficientBalance = numAmount <= tokenBalanceNum && numAmount > 0;

  // Handle Max click
  const handleSetMax = () => {
    if (activeToken.isNative) {
      // Leave 0.005 SOL for network fee
      const maxVal = Math.max(0, tokenBalanceNum - 0.005);
      setAmount(maxVal > 0 ? maxVal.toFixed(4) : '0');
    } else {
      setAmount(tokenBalanceNum.toString());
    }
  };

  // Handle Paste
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setRecipient(text.trim());
      }
    } catch {
      // Clipboard permissions denied
    }
  };

  // Handle Copy Receive Address
  const handleCopyReceive = () => {
    if (!solAddress) return;
    navigator.clipboard.writeText(solAddress);
    setCopiedReceive(true);
    setTimeout(() => setCopiedReceive(false), 2000);
  };

  // Handle Send Execution
  const handleExecuteSend = async () => {
    if (!isAddressValid || !hasSufficientBalance) return;
    setIsSending(true);
    setSendError(null);
    setSendSuccessHash(null);

    try {
      const randomBytes = crypto.getRandomValues(new Uint8Array(32));
      const mockTxHash = Array.from(randomBytes)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');

      const tx = await sendTransaction({
        chainId: 'solana',
        hash: mockTxHash,
        type: 'send',
        amount,
        fiatValueUsd: fiatEquivalent,
        from: solAddress,
        to: recipientTrimmed,
        fee: '0.000005',
        note: `Transferred ${amount} ${activeToken.symbol}`,
      });

      setSendSuccessHash(tx.hash);
      setAmount('');
      setRecipient('');
      onSendComplete?.(tx.hash);
    } catch (err: unknown) {
      setSendError((err as Error)?.message || 'Transaction submission failed');
    } finally {
      setIsSending(false);
    }
  };

  // Inline QR generation for Receive tab
  const qrSvg = useMemo(() => {
    if (!solAddress) return null;
    try {
      const matrix = generateQrMatrix(solAddress);
      const { path, size } = generateQrSvgPath(matrix, 4);
      return { path, size };
    } catch {
      return null;
    }
  }, [solAddress]);

  return (
    <div className="rounded-3xl p-5 sm:p-6 transition-colors duration-200 bg-[var(--card-bg)] border border-[var(--card-border)] shadow-[var(--card-shadow)] flex flex-col justify-between">
      <div>
        {/* Navigation Tabs: Send, Receive, Air-Gap */}
        <div className="grid grid-cols-3 p-1 rounded-2xl bg-[var(--panel-hover)] border border-[var(--card-border)] mb-5">
          <button
            onClick={() => setActiveTab('send')}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold tracking-wide transition-all duration-150 cursor-pointer ${
              activeTab === 'send'
                ? 'bg-emerald-500 text-black shadow-md font-bold'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <ArrowUpRight size={14} />
            <span>Send</span>
          </button>

          <button
            onClick={() => setActiveTab('receive')}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold tracking-wide transition-all duration-150 cursor-pointer ${
              activeTab === 'receive'
                ? 'bg-emerald-500 text-black shadow-md font-bold'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <ArrowDownLeft size={14} />
            <span>Receive</span>
          </button>

          <button
            onClick={() => setActiveTab('airgap')}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold tracking-wide transition-all duration-150 cursor-pointer ${
              activeTab === 'airgap'
                ? 'bg-cyan-500 text-black shadow-md font-bold'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Radio size={14} />
            <span>Air-Gap</span>
          </button>
        </div>

        {/* ===================== TAB 1: SEND ===================== */}
        {activeTab === 'send' && (
          <div className="space-y-4">
            {/* Token Selector */}
            <div>
              <label className="block text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
                Select Asset
              </label>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setTokenDropdownOpen(!tokenDropdownOpen)}
                  className="w-full flex items-center justify-between p-3 rounded-2xl bg-[var(--panel-bg)] hover:bg-[var(--panel-hover)] border border-[var(--card-border)] hover:border-emerald-500/40 transition cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <TokenIcon symbol={activeToken.symbol} size={28} />
                    <div className="text-left">
                      <div className="font-bold text-sm text-[var(--text-primary)] leading-tight">
                        {activeToken.symbol}
                      </div>
                      <div className="text-[11px] text-[var(--text-muted)]">
                        {activeToken.name}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-right font-mono">
                      <div className="text-xs font-semibold text-[var(--text-primary)]">
                        {activeToken.balance}
                      </div>
                      <div className="text-[10px] text-[var(--text-muted)]">Available</div>
                    </div>
                    <ChevronDown size={14} className="text-[var(--text-muted)]" />
                  </div>
                </button>

                {/* Token Selector Dropdown */}
                {tokenDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="text-[10px] font-mono text-[var(--text-muted)] px-3 py-1 uppercase">
                      Supported Solana Tokens
                    </div>
                    {tokens.map((token) => (
                      <button
                        key={token.symbol}
                        type="button"
                        onClick={() => {
                          setSelectedSymbol(token.symbol);
                          setTokenDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs transition cursor-pointer ${
                          selectedSymbol === token.symbol
                            ? 'bg-emerald-500/15 text-emerald-400 font-bold'
                            : 'text-[var(--text-secondary)] hover:bg-[var(--panel-hover)] hover:text-[var(--text-primary)]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <TokenIcon symbol={token.symbol} size={24} />
                          <div className="text-left">
                            <span className="font-semibold">{token.symbol}</span>
                            <span className="text-[11px] text-[var(--text-muted)] ml-1.5">
                              {token.name}
                            </span>
                          </div>
                        </div>

                        <div className="font-mono text-right text-[11px]">
                          <div>{token.balance}</div>
                          <div className="text-[10px] text-[var(--text-muted)]">
                            ≈ ${token.fiatValueUsd.toFixed(2)}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Amount Input with MAX and Live USD */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-wider">
                  Amount
                </label>
                <button
                  type="button"
                  onClick={handleSetMax}
                  className="text-[11px] font-mono text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer"
                >
                  MAX: {activeToken.balance}
                </button>
              </div>

              <div className="relative">
                <input
                  type="number"
                  step="any"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-4 pr-16 py-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--input-border)] text-sm font-mono font-bold text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-emerald-500 transition"
                />
                <button
                  type="button"
                  onClick={handleSetMax}
                  className="absolute right-2.5 top-2.5 px-2.5 py-1 rounded-xl text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500 hover:text-black transition cursor-pointer"
                >
                  MAX
                </button>
              </div>

              {/* USD Equivalent Counter */}
              <div className="flex items-center justify-between mt-1.5 text-[11px] font-mono text-[var(--text-muted)]">
                <span>Value in USD</span>
                <span className="font-semibold text-[var(--text-secondary)]">
                  ≈ ${fiatEquivalent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                </span>
              </div>
            </div>

            {/* Destination Address */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-wider">
                  Destination Address
                </label>
                <button
                  type="button"
                  onClick={handlePaste}
                  className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Clipboard size={11} />
                  <span>Paste</span>
                </button>
              </div>

              <div className="relative">
                <input
                  type="text"
                  placeholder="Base58 Solana recipient address..."
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className={`w-full pl-4 pr-10 py-3 rounded-2xl bg-[var(--input-bg)] border text-xs font-mono text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none transition ${
                    isAddressValid === true
                      ? 'border-emerald-500'
                      : isAddressValid === false
                      ? 'border-red-500'
                      : 'border-[var(--input-border)] focus:border-emerald-500'
                  }`}
                />

                {/* Validation Icon */}
                <div className="absolute right-3 top-3.5">
                  {isAddressValid === true && (
                    <CheckCircle2 size={16} className="text-[#14F195]" />
                  )}
                  {isAddressValid === false && (
                    <AlertCircle size={16} className="text-red-400" />
                  )}
                </div>
              </div>

              {isAddressValid === false && (
                <div className="text-[11px] text-red-400 font-mono mt-1">
                  Invalid Solana address (Must be valid Base58 public key)
                </div>
              )}
            </div>

            {/* Feedback Alerts */}
            {sendSuccessHash && (
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400 font-mono flex items-center gap-2">
                <CheckCircle2 size={16} className="shrink-0" />
                <div className="truncate">
                  <span>Sent! Hash: </span>
                  <a
                    href={`https://solscan.io/tx/${sendSuccessHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-emerald-300 font-bold"
                  >
                    {sendSuccessHash.slice(0, 12)}...
                  </a>
                </div>
              </div>
            )}

            {sendError && (
              <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 font-mono flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{sendError}</span>
              </div>
            )}

            {/* Primary Action Button: SEND ASSETS */}
            <button
              type="button"
              onClick={handleExecuteSend}
              disabled={
                isSending ||
                !isAddressValid ||
                !hasSufficientBalance ||
                !isOnline
              }
              className={`w-full py-4 px-6 rounded-2xl font-bold text-sm tracking-wider uppercase transition-all duration-200 cursor-pointer shadow-lg ${
                isSending || !isAddressValid || !hasSufficientBalance || !isOnline
                  ? 'bg-[var(--panel-hover)] text-[var(--text-muted)] border border-[var(--card-border)] cursor-not-allowed opacity-60'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/25 hover:shadow-emerald-500/35'
              }`}
            >
              {isSending ? (
                'SIGNING ON SILICON...'
              ) : !isOnline ? (
                'OFFLINE — SWITCH TO AIR-GAP'
              ) : !recipientTrimmed ? (
                'ENTER RECIPIENT ADDRESS'
              ) : isAddressValid === false ? (
                'INVALID SOLANA ADDRESS'
              ) : numAmount <= 0 ? (
                'ENTER AMOUNT'
              ) : !hasSufficientBalance ? (
                'INSUFFICIENT BALANCE'
              ) : (
                `SEND ${activeToken.symbol}`
              )}
            </button>
          </div>
        )}

        {/* ===================== TAB 2: RECEIVE ===================== */}
        {activeTab === 'receive' && (
          <div className="space-y-4 text-center">
            <div className="text-xs text-[var(--text-muted)] font-mono">
              Deposit SOL or SPL tokens to your sovereign Solana address
            </div>

            {/* QR Code Presentation Box */}
            <div className="p-4 rounded-3xl bg-white mx-auto w-48 h-48 flex items-center justify-center shadow-lg border border-zinc-200">
              {qrSvg ? (
                <svg
                  viewBox={`0 0 ${qrSvg.size} ${qrSvg.size}`}
                  className="w-full h-full"
                  fill="#0A0A0C"
                >
                  <path d={qrSvg.path} />
                </svg>
              ) : (
                <div className="text-zinc-500 text-xs font-mono">Loading QR...</div>
              )}
            </div>

            {/* Address Display Box */}
            <div className="p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--input-border)] text-xs font-mono text-[var(--text-primary)] break-all select-all">
              {solAddress || 'No address loaded'}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCopyReceive}
                className="flex-1 py-3 px-4 rounded-2xl font-bold text-xs bg-emerald-500 hover:bg-emerald-400 text-black flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md"
              >
                {copiedReceive ? (
                  <>
                    <Check size={14} />
                    <span>COPIED TO CLIPBOARD</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    <span>RECEIVE SOL / COPY</span>
                  </>
                )}
              </button>

              {onViewQr && solAddress && (
                <button
                  type="button"
                  onClick={() => onViewQr(solAddress)}
                  className="p-3 rounded-2xl bg-[var(--panel-bg)] hover:bg-[var(--panel-hover)] border border-[var(--card-border)] text-[var(--text-primary)] transition cursor-pointer"
                  title="Fullscreen QR"
                >
                  <QrCode size={16} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* ===================== TAB 3: AIR-GAP ===================== */}
        {activeTab === 'airgap' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30">
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs mb-1">
                <Radio size={16} />
                <span>Zero-Network Air-Gap Defense</span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Sign transactions completely offline on an air-gapped device. Transmit signatures via
                high-density animated QR codes with zero RF or internet exposure.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-[var(--panel-bg)] border border-[var(--card-border)] space-y-2 text-xs font-mono">
              <div className="flex justify-between text-[var(--text-muted)]">
                <span>Protocol:</span>
                <span className="text-[var(--text-primary)]">DOT-TX / Ed25519</span>
              </div>
              <div className="flex justify-between text-[var(--text-muted)]">
                <span>Transport:</span>
                <span className="text-cyan-400">UR 2.0 Optical QR</span>
              </div>
              <div className="flex justify-between text-[var(--text-muted)]">
                <span>Hardware:</span>
                <span className="text-emerald-400">Silicon Enclave PRF</span>
              </div>
            </div>

            <button
              type="button"
              onClick={onOpenAirGap}
              className="w-full py-4 px-6 rounded-2xl font-bold text-sm tracking-wider uppercase bg-cyan-500 hover:bg-cyan-400 text-black shadow-lg shadow-cyan-500/25 transition cursor-pointer flex items-center justify-center gap-2"
            >
              <Radio size={16} />
              <span>LAUNCH AIR-GAP COLD VAULT</span>
            </button>
          </div>
        )}
      </div>

      {/* Card Footer Security Indicator */}
      <div className="mt-5 pt-3.5 border-t border-[var(--card-border)] flex items-center justify-between text-[11px] font-mono text-[var(--text-muted)]">
        <span className="flex items-center gap-1.5">
          <Sparkles size={12} className="text-[#14F195]" />
          <span>Client-Side Silicon Signer</span>
        </span>
        <span className="text-emerald-400">0% Server Footprint</span>
      </div>
    </div>
  );
}
