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
  ShieldCheck,
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
    <div className="rounded-none p-6 sm:p-7 transition-colors duration-150 bg-white dark:bg-[#0F0F10] border border-black dark:border-[#353536] flex flex-col justify-between">
      <div>
        {/* Sharp Rectangular Action Tabs: "SEND", "RECEIVE", "OFFLINE VAULT" */}
        <div className="grid grid-cols-3 p-0.5 rounded-none border border-black dark:border-[#353536] mb-6 bg-[#F7F7F7] dark:bg-[#1D1D1E]">
          <button
            onClick={() => setActiveTab('send')}
            className={`h-11 flex items-center justify-center gap-1.5 px-2 rounded-none text-xs font-sans font-black tracking-wider uppercase transition-colors cursor-pointer border ${
              activeTab === 'send'
                ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white'
                : 'border-transparent text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white'
            }`}
          >
            <ArrowUpRight size={14} />
            <span>SEND</span>
          </button>

          <button
            onClick={() => setActiveTab('receive')}
            className={`h-11 flex items-center justify-center gap-1.5 px-2 rounded-none text-xs font-sans font-black tracking-wider uppercase transition-colors cursor-pointer border ${
              activeTab === 'receive'
                ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white'
                : 'border-transparent text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white'
            }`}
          >
            <ArrowDownLeft size={14} />
            <span>RECEIVE</span>
          </button>

          <button
            onClick={() => setActiveTab('airgap')}
            className={`h-11 flex items-center justify-center gap-1.5 px-2 rounded-none text-xs font-sans font-black tracking-wider uppercase transition-colors cursor-pointer border ${
              activeTab === 'airgap'
                ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white'
                : 'border-transparent text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white'
            }`}
          >
            <Radio size={14} />
            <span className="truncate">OFFLINE VAULT</span>
          </button>
        </div>

        {/* ===================== TAB 1: SEND ===================== */}
        {activeTab === 'send' && (
          <div className="space-y-4">
            {/* Clean Token Selector with Authentic Coin SVGs */}
            <div>
              <label className="block text-[10px] font-mono font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-widest mb-1.5">
                SELECT ASSET
              </label>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setTokenDropdownOpen(!tokenDropdownOpen)}
                  className="w-full flex items-center justify-between p-3 rounded-none bg-[#F7F7F7] dark:bg-[#1D1D1E] border border-black/10 dark:border-[#353536] hover:border-black dark:hover:border-white transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <TokenIcon symbol={activeToken.symbol} size={28} />
                    <div className="text-left">
                      <div className="font-sans font-bold text-sm text-black dark:text-white leading-tight">
                        {activeToken.symbol}
                      </div>
                      <div className="text-[11px] font-mono text-zinc-500">
                        {activeToken.name}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-right font-mono">
                      <div className="text-xs font-bold text-black dark:text-white">
                        {activeToken.balance}
                      </div>
                      <div className="text-[10px] text-zinc-500 uppercase">Available</div>
                    </div>
                    <ChevronDown size={14} className="text-zinc-400" />
                  </div>
                </button>

                {/* Token Selector Dropdown */}
                {tokenDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 rounded-none bg-white dark:bg-[#0F0F10] border border-black dark:border-[#353536] p-1 z-50 animate-in fade-in duration-100">
                    <div className="text-[10px] font-mono text-zinc-500 px-3 py-1 uppercase tracking-wider font-bold">
                      Solana Assets
                    </div>
                    {tokens.map((token) => (
                      <button
                        key={token.symbol}
                        type="button"
                        onClick={() => {
                          setSelectedSymbol(token.symbol);
                          setTokenDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between p-2.5 rounded-none text-xs transition-colors cursor-pointer border ${
                          selectedSymbol === token.symbol
                            ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white font-bold'
                            : 'border-transparent text-zinc-700 dark:text-zinc-300 hover:bg-[#F7F7F7] dark:hover:bg-[#1D1D1E]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <TokenIcon symbol={token.symbol} size={24} />
                          <div className="text-left">
                            <span className="font-bold">{token.symbol}</span>
                            <span className="text-[11px] text-zinc-400 ml-1.5">
                              {token.name}
                            </span>
                          </div>
                        </div>

                        <div className="font-mono text-right text-[11px]">
                          <div className="font-bold">{token.balance}</div>
                          <div className="text-[10px] text-zinc-400">
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
                <label className="text-[10px] font-mono font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-widest">
                  AMOUNT
                </label>
                <button
                  type="button"
                  onClick={handleSetMax}
                  className="text-[11px] font-mono font-bold text-black dark:text-white uppercase tracking-wider cursor-pointer hover:underline"
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
                  className="w-full pl-4 pr-16 py-3 rounded-none bg-[#F7F7F7] dark:bg-[#1D1D1E] border border-black/10 dark:border-[#353536] text-sm font-mono font-bold text-black dark:text-white placeholder-zinc-400 focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                />
                <button
                  type="button"
                  onClick={handleSetMax}
                  className="absolute right-2 top-2 px-2.5 py-1 rounded-none text-[10px] font-sans font-black bg-black text-white dark:bg-white dark:text-black border border-black dark:border-white transition-opacity cursor-pointer uppercase"
                >
                  MAX
                </button>
              </div>

              {/* USD Equivalent Counter */}
              <div className="flex items-center justify-between mt-1.5 text-[11px] font-mono text-zinc-500">
                <span className="uppercase text-[10px] font-bold">Value in USD</span>
                <span className="font-bold text-black dark:text-white">
                  ≈ ${fiatEquivalent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                </span>
              </div>
            </div>

            {/* Destination Address */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] font-mono font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-widest">
                  DESTINATION ADDRESS
                </label>
                <button
                  type="button"
                  onClick={handlePaste}
                  className="text-[11px] font-sans text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                >
                  <Clipboard size={11} />
                  <span>PASTE</span>
                </button>
              </div>

              <div className="relative">
                <input
                  type="text"
                  placeholder="Solana recipient address..."
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className={`w-full pl-4 pr-10 py-3 rounded-none bg-[#F7F7F7] dark:bg-[#1D1D1E] border text-xs font-mono text-black dark:text-white placeholder-zinc-400 focus:outline-none transition-colors ${
                    isAddressValid === true
                      ? 'border-black dark:border-white'
                      : isAddressValid === false
                      ? 'border-zinc-500'
                      : 'border-black/10 dark:border-[#353536] focus:border-black dark:focus:border-white'
                  }`}
                />

                {/* Validation Icon */}
                <div className="absolute right-3 top-3.5">
                  {isAddressValid === true && (
                    <CheckCircle2 size={16} className="text-black dark:text-white" />
                  )}
                  {isAddressValid === false && (
                    <AlertCircle size={16} className="text-zinc-600 dark:text-zinc-400" />
                  )}
                </div>
              </div>

              {isAddressValid === false && (
                <div className="text-[11px] text-zinc-600 dark:text-zinc-400 font-mono mt-1 uppercase font-bold">
                  Invalid Solana recipient format
                </div>
              )}
            </div>

            {/* Feedback Alerts */}
            {sendSuccessHash && (
              <div className="p-3 rounded-none border border-black dark:border-white bg-[#F7F7F7] dark:bg-[#1D1D1E] text-xs text-black dark:text-white font-mono flex items-center gap-2">
                <CheckCircle2 size={16} className="shrink-0" />
                <div className="truncate">
                  <span>DISPATCHED: </span>
                  <a
                    href={`https://solscan.io/tx/${sendSuccessHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline font-bold"
                  >
                    {sendSuccessHash.slice(0, 12)}...
                  </a>
                </div>
              </div>
            )}

            {sendError && (
              <div className="p-3 rounded-none border border-black dark:border-[#353536] bg-[#F7F7F7] dark:bg-[#1D1D1E] text-xs text-black dark:text-white font-mono flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{sendError}</span>
              </div>
            )}

            {/* Large, Prominent Primary Button matching Rednit spec */}
            <button
              type="button"
              onClick={handleExecuteSend}
              disabled={
                isSending ||
                !isAddressValid ||
                !hasSufficientBalance ||
                !isOnline
              }
              className={`w-full bg-black text-white dark:bg-white dark:text-black rounded-none h-12 uppercase font-sans font-black tracking-wider transition-opacity cursor-pointer border border-black dark:border-white ${
                isSending || !isAddressValid || !hasSufficientBalance || !isOnline
                  ? 'opacity-40 cursor-not-allowed'
                  : 'hover:opacity-90'
              }`}
            >
              {isSending ? (
                'PROCESSING TRANSACTION...'
              ) : !isOnline ? (
                'OFFLINE — SWITCH TO OFFLINE VAULT'
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
            <div className="text-xs text-zinc-600 dark:text-zinc-400 font-mono uppercase tracking-wider font-bold">
              Deposit SOL or supported assets to your vault
            </div>

            {/* QR Code Presentation Box with sharp 0px borders */}
            <div className="p-4 rounded-none bg-white mx-auto w-48 h-48 flex items-center justify-center border border-black dark:border-[#353536]">
              {qrSvg ? (
                <svg
                  viewBox={`0 0 ${qrSvg.size} ${qrSvg.size}`}
                  className="w-full h-full"
                  fill="#000000"
                >
                  <path d={qrSvg.path} />
                </svg>
              ) : (
                <div className="text-zinc-500 text-xs font-mono">Loading QR...</div>
              )}
            </div>

            {/* Address Display Box */}
            <div className="p-3.5 rounded-none bg-[#F7F7F7] dark:bg-[#1D1D1E] border border-black/10 dark:border-[#353536] text-xs font-mono text-black dark:text-white break-all select-all font-bold">
              {solAddress || 'No address loaded'}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCopyReceive}
                className="flex-1 h-12 rounded-none font-sans font-black text-xs uppercase tracking-wider bg-black text-white dark:bg-white dark:text-black flex items-center justify-center gap-1.5 transition-opacity hover:opacity-90 cursor-pointer border border-black dark:border-white"
              >
                {copiedReceive ? (
                  <>
                    <Check size={14} />
                    <span>COPIED TO CLIPBOARD</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    <span>COPY ADDRESS</span>
                  </>
                )}
              </button>

              {onViewQr && solAddress && (
                <button
                  type="button"
                  onClick={() => onViewQr(solAddress)}
                  className="h-12 w-12 flex items-center justify-center rounded-none bg-[#F7F7F7] dark:bg-[#1D1D1E] border border-black dark:border-[#353536] hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black text-black dark:text-white transition-colors cursor-pointer"
                  title="Fullscreen QR"
                >
                  <QrCode size={16} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* ===================== TAB 3: OFFLINE VAULT ===================== */}
        {activeTab === 'airgap' && (
          <div className="space-y-4">
            <div className="p-4 rounded-none border border-black/10 dark:border-[#353536] bg-[#F7F7F7] dark:bg-[#1D1D1E]">
              <div className="flex items-center gap-2 text-black dark:text-white font-sans font-black text-xs uppercase tracking-wider mb-1">
                <Radio size={16} />
                <span>Zero-Network Offline Defense</span>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 font-sans leading-relaxed">
                Sign transactions completely offline on an isolated device. Transmit signatures via
                optical QR sync with zero radio or network exposure.
              </p>
            </div>

            <div className="p-3.5 rounded-none border border-black/10 dark:border-[#353536] bg-[#F7F7F7] dark:bg-[#1D1D1E] space-y-2 text-xs font-mono">
              <div className="flex justify-between text-zinc-500">
                <span className="uppercase text-[10px] font-bold">Protocol:</span>
                <span className="text-black dark:text-white font-bold">Offline Vault Protocol</span>
              </div>
              <div className="flex justify-between text-zinc-500">
                <span className="uppercase text-[10px] font-bold">Transport:</span>
                <span className="text-black dark:text-white font-bold">Encrypted QR Sync</span>
              </div>
              <div className="flex justify-between text-zinc-500">
                <span className="uppercase text-[10px] font-bold">Security:</span>
                <span className="text-black dark:text-white font-bold">Hardware Secure Enclave</span>
              </div>
            </div>

            <button
              type="button"
              onClick={onOpenAirGap}
              className="w-full bg-black text-white dark:bg-white dark:text-black rounded-none h-12 uppercase font-sans font-black tracking-wider transition-opacity hover:opacity-90 cursor-pointer flex items-center justify-center gap-2 border border-black dark:border-white"
            >
              <Radio size={16} />
              <span>LAUNCH OFFLINE VAULT</span>
            </button>
          </div>
        )}
      </div>

      {/* Card Footer Security Indicator */}
      <div className="mt-5 pt-3.5 border-t border-black/10 dark:border-[#353536] flex items-center justify-between text-[11px] font-mono text-zinc-500">
        <span className="flex items-center gap-1.5 uppercase font-mono">
          <ShieldCheck size={12} className="text-black dark:text-white" />
          <span>Self-Custodial</span>
        </span>
        <span className="text-black dark:text-white font-bold uppercase tracking-wider">
          Device Protected
        </span>
      </div>
    </div>
  );
}
