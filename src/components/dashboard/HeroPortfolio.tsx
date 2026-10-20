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
} from 'lucide-react';
import { useWallet } from '@/context/WalletContext';

interface HeroPortfolioProps {
  onSend: (assetSymbol?: string) => void;
  onReceive: (assetSymbol?: string) => void;
  onOpenAirGap: () => void;
  onViewQr: (address: string) => void;
}

type Timeframe = 'DAY' | 'WEEK' | 'MONTH' | 'YEAR' | 'ALL';

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
  const [timeframe, setTimeframe] = useState<Timeframe>('MONTH');

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
    <div className="relative rounded-none p-6 sm:p-8 transition-colors duration-150 bg-white dark:bg-[#0F0F10] border border-black dark:border-[#353536]">
      {/* Top Bar: Vault Status & Solana Address */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-5 border-b border-black/10 dark:border-[#353536]">
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-sans uppercase tracking-widest text-zinc-600 dark:text-zinc-400 font-black">
            SOLANA PORTFOLIO
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-none border border-black dark:border-[#353536] text-black dark:text-white uppercase tracking-widest font-bold">
            MAINNET
          </span>
        </div>

        {/* Truncated Address with Copy, QR, Solscan */}
        {solAddress && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-none border border-black dark:border-[#353536] text-xs font-mono text-zinc-800 dark:text-zinc-200 self-start sm:self-auto bg-[#F7F7F7] dark:bg-[#1D1D1E]">
            <span className="text-zinc-500 mr-1">{truncatedAddress}</span>

            <button
              onClick={() => onViewQr(solAddress)}
              className="p-1 rounded-none text-zinc-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
              title="Show Address QR Code"
            >
              <QrCode size={13} />
            </button>

            <button
              onClick={handleCopy}
              className="p-1 rounded-none text-zinc-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
              title="Copy Solana Address"
            >
              {copied ? (
                <Check size={13} className="text-black dark:text-white" />
              ) : (
                <Copy size={13} />
              )}
            </button>

            <a
              href={`https://solscan.io/account/${solAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 rounded-none text-zinc-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
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
          <div className="text-[11px] font-sans font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-1">
            TOTAL NET WORTH
          </div>
          {/* DM Sans 900 display net worth font with tight tracking (-0.03em) */}
          <div
            className="text-4xl sm:text-5xl lg:text-6xl font-sans font-black text-black dark:text-white tracking-[-0.03em]"
            style={{ letterSpacing: '-0.03em' }}
          >
            ${totalFiatBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>

          {/* Live SOL Balance Sub-line in IBM Plex Mono */}
          <div className="flex flex-wrap items-center gap-2.5 mt-2.5 text-xs sm:text-sm">
            <div className="flex items-center gap-1 font-mono text-zinc-600 dark:text-zinc-400">
              <span className="font-bold text-black dark:text-white">{solBalance}</span>
              <span>SOL</span>
              <span className="text-zinc-400 dark:text-zinc-600">•</span>
              <span>≈ ${solFiat.toFixed(2)} USD</span>
            </div>

            {/* Price & 24h PnL badge */}
            <div className="flex items-center gap-1.5 font-mono text-xs">
              <span className="text-zinc-500">
                ${solPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>

              <span
                className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-none font-bold text-[10px] border ${
                  isPositive
                    ? 'border-black dark:border-white text-black dark:text-white bg-black/5 dark:bg-white/10'
                    : 'border-zinc-500 text-zinc-700 dark:text-zinc-300 bg-zinc-200/50 dark:bg-zinc-800/50'
                }`}
              >
                {isPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                <span>
                  {isPositive ? '+' : ''}
                  {solChange}%
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Timeframe Filter Buttons: DAY, WEEK, MONTH, YEAR, ALL with sharp 1px borders and black/white inversion */}
        <div className="flex rounded-none border border-black dark:border-[#353536] p-0.5 self-start sm:self-auto text-xs font-mono">
          {(['DAY', 'WEEK', 'MONTH', 'YEAR', 'ALL'] as Timeframe[]).map((tf) => {
            const isActive = timeframe === tf;
            return (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1.5 rounded-none text-xs font-mono font-bold tracking-wider transition-colors cursor-pointer border ${
                  isActive
                    ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white'
                    : 'border-transparent text-zinc-500 hover:text-black dark:hover:text-white'
                }`}
              >
                {tf}
              </button>
            );
          })}
        </div>
      </div>

      {/* SVG Area Chart with clean lines and flat background */}
      <div className="relative w-full h-32 sm:h-44 my-6 rounded-none border border-black/10 dark:border-[#353536] bg-[#F7F7F7]/60 dark:bg-[#1D1D1E]/40 p-2">
        <svg
          viewBox="0 0 500 120"
          preserveAspectRatio="none"
          className="w-full h-full overflow-visible"
        >
          <defs>
            <linearGradient id="rednit-hero-chart-glow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.08" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0.00" />
            </linearGradient>
          </defs>

          {/* Hairline Grid lines */}
          <line x1="0" y1="30" x2="500" y2="30" stroke="currentColor" strokeOpacity="0.08" strokeDasharray="2 2" />
          <line x1="0" y1="65" x2="500" y2="65" stroke="currentColor" strokeOpacity="0.08" strokeDasharray="2 2" />
          <line x1="0" y1="100" x2="500" y2="100" stroke="currentColor" strokeOpacity="0.08" strokeDasharray="2 2" />

          {/* Area fill */}
          <path
            d="M 0 100 Q 80 85, 140 60 T 260 55 T 380 35 T 500 20 L 500 120 L 0 120 Z"
            fill="url(#rednit-hero-chart-glow)"
            className="text-black dark:text-white"
          />

          {/* Crisp Clean Stroke Curve */}
          <path
            d="M 0 100 Q 80 85, 140 60 T 260 55 T 380 35 T 500 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="square"
            className="text-black dark:text-white"
          />

          {/* Endpoint marker */}
          <rect x="497" y="17" width="6" height="6" fill="currentColor" className="text-black dark:text-white" />
        </svg>
      </div>

      {/* Action Buttons Grid with sharp 0px borders and 48px touch targets */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
        <button
          onClick={() => onSend('SOL')}
          className="h-12 flex items-center justify-center gap-2 px-4 rounded-none font-sans font-black text-xs uppercase tracking-wider bg-black text-white dark:bg-white dark:text-black hover:opacity-90 transition-opacity cursor-pointer border border-black dark:border-white"
        >
          <ArrowUpRight size={16} strokeWidth={2.5} />
          <span>SEND</span>
        </button>

        <button
          onClick={() => onReceive('SOL')}
          className="h-12 flex items-center justify-center gap-2 px-4 rounded-none font-sans font-black text-xs uppercase tracking-wider bg-white dark:bg-[#0F0F10] text-black dark:text-white border border-black dark:border-[#353536] hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors cursor-pointer"
        >
          <ArrowDownLeft size={16} strokeWidth={2.5} />
          <span>RECEIVE</span>
        </button>

        <button
          onClick={onOpenAirGap}
          className="h-12 flex items-center justify-center gap-2 px-4 rounded-none font-sans font-black text-xs uppercase tracking-wider bg-white dark:bg-[#0F0F10] text-black dark:text-white border border-black dark:border-[#353536] hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors cursor-pointer"
        >
          <Radio size={15} />
          <span>OFFLINE VAULT</span>
        </button>

        <button
          onClick={refreshBalances}
          disabled={isRefreshingBalances || !isOnline}
          className="h-12 flex items-center justify-center gap-2 px-4 rounded-none font-sans font-black text-xs uppercase tracking-wider bg-white dark:bg-[#0F0F10] text-zinc-700 dark:text-zinc-300 border border-black dark:border-[#353536] hover:border-black dark:hover:border-white hover:text-black dark:hover:text-white transition-colors cursor-pointer disabled:opacity-40"
        >
          <RefreshCw
            size={14}
            className={isRefreshingBalances ? 'animate-spin' : ''}
          />
          <span>{isRefreshingBalances ? 'SYNCING...' : 'SYNC'}</span>
        </button>
      </div>
    </div>
  );
}
