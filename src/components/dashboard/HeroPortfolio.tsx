'use client';

import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownLeft,
  Radio,
  RefreshCw,
  Copy,
  Check,
  QrCode,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { useWallet } from '@/context/WalletContext';

interface HeroPortfolioProps {
  onSend: (assetSymbol?: string) => void;
  onReceive: (assetSymbol?: string) => void;
  onOpenAirGap: () => void;
  onViewQr: (address: string) => void;
}

export function HeroPortfolio({
  onSend,
  onReceive,
  onOpenAirGap,
  onViewQr,
}: HeroPortfolioProps) {
  const {
    totalFiatBalance,
    balances,
    tokens,
    addresses,
    isRefreshingBalances,
    refreshBalances,
    isOnline,
  } = useWallet();

  const [copied, setCopied] = useState(false);

  // Solana info
  const solBalance = balances.solana?.balance || '0.00';
  const solPrice = balances.solana?.tokenPriceUsd || 154.20;
  const solChange = balances.solana?.change24hPercent ?? 3.42;
  const solFiat = balances.solana?.fiatValueUsd || 0.00;

  const solAddress = addresses.solana?.address || '';
  const truncatedAddress =
    solAddress.length > 14
      ? `${solAddress.slice(0, 6)}...${solAddress.slice(-6)}`
      : solAddress || 'Loading...';

  const handleCopy = () => {
    if (!solAddress) return;
    navigator.clipboard.writeText(solAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isPositive = solChange >= 0;

  return (
    <div className="relative rounded-3xl bg-gradient-to-b from-[#11131C] via-[#0D0F17] to-[#0A0B10] border border-emerald-500/30 p-6 md:p-8 shadow-2xl shadow-black/80 overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

      {/* Top Bar: Vault Status & Solana Address Pill */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-5 border-b border-[#1A1D27]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#14F195] shadow-[0_0_8px_#14F195]" />
          <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">
            Sovereign Solana Portfolio
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/50 border border-emerald-800/40 text-emerald-300">
            SVM
          </span>
        </div>

        {/* Truncated Address with Copy, QR, Solscan */}
        {solAddress && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-[#090A0E] border border-[#1E2230] text-xs font-mono text-zinc-300 self-start sm:self-auto">
            <span className="text-zinc-400 mr-1">{truncatedAddress}</span>

            <button
              onClick={() => onViewQr(solAddress)}
              className="p-1 rounded-lg text-zinc-400 hover:text-[#14F195] transition cursor-pointer"
              title="Show Address QR Code"
            >
              <QrCode size={14} />
            </button>

            <button
              onClick={handleCopy}
              className="p-1 rounded-lg text-zinc-400 hover:text-emerald-400 transition cursor-pointer"
              title="Copy Solana Address"
            >
              {copied ? (
                <Check size={14} className="text-emerald-400" />
              ) : (
                <Copy size={14} />
              )}
            </button>

            <a
              href={`https://solscan.io/account/${solAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 rounded-lg text-zinc-400 hover:text-cyan-400 transition cursor-pointer"
              title="View on Solscan Explorer"
            >
              <ExternalLink size={14} />
            </a>
          </div>
        )}
      </div>

      {/* Main Net Worth Display */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
        <div>
          <div className="text-xs font-mono uppercase tracking-widest text-zinc-400 mb-1">
            Total Net Worth
          </div>
          <div className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight font-mono">
            ${totalFiatBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>

          {/* Live SOL Balance Sub-line */}
          <div className="flex flex-wrap items-center gap-3 mt-3 text-sm">
            <div className="flex items-center gap-1.5 font-mono text-zinc-200">
              <span className="font-semibold text-white">{solBalance}</span>
              <span className="text-zinc-400">SOL</span>
              <span className="text-zinc-500">•</span>
              <span className="text-zinc-400">≈ ${solFiat.toFixed(2)} USD</span>
            </div>

            {/* Price & 24h PnL badge */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-zinc-400">
                1 SOL = ${solPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>

              <div
                className={`flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-mono font-medium ${
                  isPositive
                    ? 'bg-emerald-950/50 text-emerald-300 border border-emerald-800/40'
                    : 'bg-red-950/50 text-red-300 border border-red-800/40'
                }`}
              >
                {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                <span>
                  {isPositive ? '+' : ''}
                  {solChange}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Zero Balance Notice if new wallet */}
        {parseFloat(solBalance) === 0 && totalFiatBalance === 0 && (
          <div className="p-3 rounded-2xl bg-emerald-950/30 border border-emerald-500/20 max-w-sm">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300 mb-0.5">
              <ShieldCheck size={14} className="text-[#14F195]" />
              <span>Sovereign Vault Active</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Real on-chain balance is $0.00. Deposit SOL or SPL tokens to this Base58 address to begin.
            </p>
          </div>
        )}
      </div>

      {/* Quick Action Buttons Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
        {/* Receive Button */}
        <button
          onClick={() => onReceive('SOL')}
          className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl font-bold text-xs bg-[#151924] hover:bg-[#1B2232] text-white border border-[#273045] shadow-lg transition cursor-pointer"
        >
          <ArrowDownLeft size={17} className="text-[#14F195]" strokeWidth={2.5} />
          <span>Receive</span>
        </button>

        {/* Send Button */}
        <button
          onClick={() => onSend('SOL')}
          className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl font-bold text-xs bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black shadow-lg shadow-emerald-500/20 transition cursor-pointer"
        >
          <ArrowUpRight size={17} strokeWidth={2.5} />
          <span>Send</span>
        </button>

        {/* Air-Gap Sign Button */}
        <button
          onClick={onOpenAirGap}
          className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl font-semibold text-xs bg-cyan-950/30 hover:bg-cyan-900/40 text-cyan-300 border border-cyan-800/50 shadow-md shadow-cyan-500/5 transition cursor-pointer"
        >
          <Radio size={16} className="text-cyan-400" />
          <span>Air-Gap Sign</span>
        </button>

        {/* Refresh Button */}
        <button
          onClick={refreshBalances}
          disabled={isRefreshingBalances || !isOnline}
          className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl font-semibold text-xs bg-[#12141C] hover:bg-[#1A1D27] text-zinc-300 hover:text-white border border-[#232734] transition cursor-pointer disabled:opacity-50"
        >
          <RefreshCw
            size={16}
            className={isRefreshingBalances ? 'animate-spin text-[#14F195]' : 'text-zinc-400'}
          />
          <span>{isRefreshingBalances ? 'Syncing...' : 'Refresh'}</span>
        </button>
      </div>
    </div>
  );
}
