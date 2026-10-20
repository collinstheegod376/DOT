'use client';

import React from 'react';
import { TrendingUp, TrendingDown, Activity, ExternalLink } from 'lucide-react';
import { useWallet } from '@/context/WalletContext';
import { TokenIcon } from '@/components/dashboard/token-icons';
import { TokenAsset } from '@/types/wallet';

interface MarketWatchlistProps {
  onSelectToken?: (token: TokenAsset) => void;
}

export function MarketWatchlist({ onSelectToken }: MarketWatchlistProps) {
  const { tokens } = useWallet();

  // Primary Solana ecosystem tokens for watchlist
  const watchlistTokens = tokens.slice(0, 6);

  return (
    <div className="rounded-3xl p-5 sm:p-6 transition-colors duration-200 bg-[var(--card-bg)] border border-[var(--card-border)] shadow-[var(--card-shadow)]">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-[var(--card-border)]">
        <div className="flex items-center gap-2">
          <Activity size={18} className="text-[#14F195]" />
          <h2 className="text-lg font-bold tracking-tight text-[var(--text-primary)]">
            My Watchlist
          </h2>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] font-mono text-[var(--text-muted)]">
          <span className="w-2 h-2 rounded-full bg-[#14F195] animate-pulse" />
          <span>Solana Live</span>
        </div>
      </div>

      {/* Token List */}
      <div className="space-y-2.5">
        {watchlistTokens.map((token) => {
          const isPositive = token.change24hPercent >= 0;
          const solscanUrl = token.isNative
            ? 'https://solscan.io/token/So11111111111111111111111111111111111111112'
            : `https://solscan.io/token/${token.mint}`;

          // Format price nicely
          const formattedPrice =
            token.tokenPriceUsd < 0.001
              ? `$${token.tokenPriceUsd.toFixed(7)}`
              : token.tokenPriceUsd < 1
              ? `$${token.tokenPriceUsd.toFixed(4)}`
              : `$${token.tokenPriceUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

          return (
            <div
              key={token.symbol}
              onClick={() => onSelectToken?.(token)}
              className="group p-3 rounded-2xl bg-[var(--panel-bg)] hover:bg-[var(--panel-hover)] border border-[var(--card-border)] hover:border-emerald-500/30 transition-all duration-150 flex items-center justify-between gap-3 cursor-pointer"
            >
              {/* Left: Token Icon & Names */}
              <div className="flex items-center gap-3">
                <div className="shrink-0 transition-transform duration-200 group-hover:scale-105">
                  <TokenIcon symbol={token.symbol} size={32} />
                </div>
                <div>
                  <div className="font-bold text-xs sm:text-sm text-[var(--text-primary)] group-hover:text-emerald-400 transition-colors">
                    {token.name}
                  </div>
                  <div className="text-[11px] font-mono text-[var(--text-muted)]">
                    {token.symbol}
                  </div>
                </div>
              </div>

              {/* Middle: Mini Micro-Sparkline */}
              <div className="hidden sm:block w-16 h-7">
                <svg viewBox="0 0 60 24" className="w-full h-full overflow-visible">
                  <path
                    d={
                      isPositive
                        ? 'M 2 20 Q 15 18, 30 10 T 58 4'
                        : 'M 2 6 Q 15 8, 30 16 T 58 20'
                    }
                    fill="none"
                    stroke={isPositive ? '#14F195' : '#EF4444'}
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              {/* Right: Live Price & 24h PnL badge */}
              <div className="text-right">
                <div className="font-mono font-bold text-xs sm:text-sm text-[var(--text-primary)]">
                  {formattedPrice}
                </div>

                <div className="flex items-center justify-end gap-1 mt-0.5">
                  <span
                    className={`inline-flex items-center gap-0.5 text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded-full ${
                      isPositive
                        ? 'bg-emerald-500/15 text-emerald-400'
                        : 'bg-red-500/15 text-red-400'
                    }`}
                  >
                    {isPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                    <span>
                      {isPositive ? '+' : ''}
                      {token.change24hPercent.toFixed(2)}%
                    </span>
                  </span>

                  <a
                    href={solscanUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="p-1 rounded-lg text-[var(--text-muted)] hover:text-cyan-400 transition opacity-0 group-hover:opacity-100"
                    title="View on Solscan"
                  >
                    <ExternalLink size={11} />
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
