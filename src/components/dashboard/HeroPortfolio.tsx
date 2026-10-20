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

type Timeframe = '1D' | '1W' | '1M' | '1Y' | 'ALL';

export function HeroPortfolio({
  onSend,
  onReceive,
  onOpenAirGap,
  onViewQr,
}: HeroPortfolioProps) {
  const {
    totalFiatBalance,
    balances,
    addresses,
    isRefreshingBalances,
    refreshBalances,
    isOnline,
  } = useWallet();

  const [copied, setCopied] = useState(false);
  const [timeframe, setTimeframe] = useState<Timeframe>('1M');

  // Solana info
  const solBalance = balances.solana?.balance || '0.00';
  const solPrice = balances.solana?.tokenPriceUsd || 154.20;
  const solChange = balances.solana?.change24hPercent ?? 3.42;
  const solFiat = balances.solana?.fiatValueUsd || 0.00;

  const solAddress = addresses.solana?.address || '';
  const truncatedAddress =
    solAddress.length > 14
      ? `${solAddress.slice(0, 4)}...${solAddress.slice(-4)}`
      : solAddress || 'Loading...';

  const handleCopy = () => {
    if (!solAddress) return;
    navigator.clipboard.writeText(solAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isPositive = solChange >= 0;

  return (
    <div className="relative rounded-3xl p-6 sm:p-8 transition-colors duration-200 bg-[var(--card-bg)] border border-[var(--card-border)] shadow-[var(--card-shadow)] overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

      {/* Top Bar: Vault Status & Solana Address Pill */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-5 border-b border-[var(--card-border)]">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#14F195] shadow-[0_0_8px_#14F195]" />
          <span className="text-xs font-mono uppercase tracking-wider text-[var(--text-secondary)] font-semibold">
            Sovereign Solana Portfolio
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
            SVM
          </span>
        </div>

        {/* Truncated Address with Copy, QR, Solscan */}
        {solAddress && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-[var(--panel-bg)] border border-[var(--card-border)] text-xs font-mono text-[var(--text-secondary)] self-start sm:self-auto">
            <span className="text-[var(--text-muted)] mr-1">{truncatedAddress}</span>

            <button
              onClick={() => onViewQr(solAddress)}
              className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[#14F195] transition cursor-pointer"
              title="Show Address QR Code"
            >
              <QrCode size={13} />
            </button>

            <button
              onClick={handleCopy}
              className="p-1 rounded-lg text-[var(--text-muted)] hover:text-emerald-400 transition cursor-pointer"
              title="Copy Solana Address"
            >
              {copied ? (
                <Check size={13} className="text-emerald-400" />
              ) : (
                <Copy size={13} />
              )}
            </button>

            <a
              href={`https://solscan.io/account/${solAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 rounded-lg text-[var(--text-muted)] hover:text-cyan-400 transition cursor-pointer"
              title="View on Solscan Explorer"
            >
              <ExternalLink size={13} />
            </a>
          </div>
        )}
      </div>

      {/* Main Net Worth Display + Timeframe Selector */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <div className="text-xs font-mono uppercase tracking-widest text-[var(--text-muted)] mb-1">
            Total Net Worth
          </div>
          <div className="text-4xl sm:text-5xl font-extrabold tracking-tight font-mono text-[var(--text-primary)]">
            ${totalFiatBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>

          {/* Live SOL Balance Sub-line */}
          <div className="flex flex-wrap items-center gap-2.5 mt-2.5 text-xs sm:text-sm">
            <div className="flex items-center gap-1 font-mono text-[var(--text-secondary)]">
              <span className="font-bold text-[var(--text-primary)]">{solBalance}</span>
              <span>SOL</span>
              <span className="text-[var(--text-muted)]">•</span>
              <span>≈ ${solFiat.toFixed(2)} USD</span>
            </div>

            {/* Price & 24h PnL badge */}
            <div className="flex items-center gap-1.5 font-mono text-xs">
              <span className="text-[var(--text-muted)]">
                ${solPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>

              <span
                className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full font-semibold text-[11px] ${
                  isPositive
                    ? 'bg-emerald-500/15 text-emerald-400'
                    : 'bg-red-500/15 text-red-400'
                }`}
              >
                {isPositive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                <span>
                  {isPositive ? '+' : ''}
                  {solChange}%
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Timeframe Selector Pills */}
        <div className="flex rounded-xl bg-[var(--panel-hover)] p-1 border border-[var(--card-border)] self-start sm:self-auto text-xs font-mono font-semibold">
          {(['1D', '1W', '1M', '1Y', 'ALL'] as Timeframe[]).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                timeframe === tf
                  ? 'bg-emerald-500 text-black shadow-sm font-bold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Portfolio Chart Curve */}
      <div className="relative w-full h-32 sm:h-40 my-4">
        <svg
          viewBox="0 0 500 120"
          preserveAspectRatio="none"
          className="w-full h-full overflow-visible"
        >
          <defs>
            <linearGradient id="hero-chart-glow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#14F195" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#14F195" stopOpacity="0.00" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1="0" y1="30" x2="500" y2="30" stroke="currentColor" strokeOpacity="0.06" strokeDasharray="3 3" />
          <line x1="0" y1="70" x2="500" y2="70" stroke="currentColor" strokeOpacity="0.06" strokeDasharray="3 3" />
          <line x1="0" y1="110" x2="500" y2="110" stroke="currentColor" strokeOpacity="0.06" strokeDasharray="3 3" />

          {/* Area fill */}
          <path
            d="M 0 100 Q 80 85, 140 60 T 260 55 T 380 35 T 500 20 L 500 120 L 0 120 Z"
            fill="url(#hero-chart-glow)"
          />

          {/* Glowing Stroke Curve */}
          <path
            d="M 0 100 Q 80 85, 140 60 T 260 55 T 380 35 T 500 20"
            fill="none"
            stroke="#14F195"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* Pulse Endpoint */}
          <circle cx="500" cy="20" r="4.5" fill="#14F195" className="animate-pulse" />
        </svg>
      </div>

      {/* Zero balance indicator */}
      {parseFloat(solBalance) === 0 && totalFiatBalance === 0 && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mb-6 flex items-start gap-3">
          <ShieldCheck size={18} className="text-[#14F195] shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed text-[var(--text-secondary)]">
            <span className="font-semibold text-emerald-400">Vault Ready:</span> Real on-chain balance is $0.00.
            Deposit SOL or SPL tokens to your Base58 address to activate real-time tracking.
          </div>
        </div>
      )}

      {/* Action Buttons Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
        <button
          onClick={() => onReceive('SOL')}
          className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl font-bold text-xs bg-[var(--panel-bg)] hover:bg-[var(--panel-hover)] text-[var(--text-primary)] border border-[var(--card-border)] shadow-sm transition cursor-pointer"
        >
          <ArrowDownLeft size={16} className="text-[#14F195]" strokeWidth={2.5} />
          <span>Receive</span>
        </button>

        <button
          onClick={() => onSend('SOL')}
          className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl font-bold text-xs bg-emerald-500 hover:bg-emerald-400 text-black shadow-md shadow-emerald-500/20 transition cursor-pointer"
        >
          <ArrowUpRight size={16} strokeWidth={2.5} />
          <span>Send</span>
        </button>

        <button
          onClick={onOpenAirGap}
          className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl font-semibold text-xs bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-400 border border-cyan-500/30 transition cursor-pointer"
        >
          <Radio size={15} />
          <span>Air-Gap Sign</span>
        </button>

        <button
          onClick={refreshBalances}
          disabled={isRefreshingBalances || !isOnline}
          className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl font-semibold text-xs bg-[var(--panel-bg)] hover:bg-[var(--panel-hover)] text-[var(--text-secondary)] border border-[var(--card-border)] transition cursor-pointer disabled:opacity-50"
        >
          <RefreshCw
            size={15}
            className={isRefreshingBalances ? 'animate-spin text-[#14F195]' : ''}
          />
          <span>{isRefreshingBalances ? 'Syncing...' : 'Sync'}</span>
        </button>
      </div>
    </div>
  );
}
