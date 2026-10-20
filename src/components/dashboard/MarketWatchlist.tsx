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
    <div className="rounded-none p-6 sm:p-7 transition-colors duration-150 bg-white dark:bg-[#0F0F10] border border-black dark:border-[#353536]">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-black/10 dark:border-[#353536]">
        <div className="flex items-center gap-2">
          <Activity size={16} className="text-black dark:text-white" />
          <h2 className="text-sm font-sans font-black tracking-widest text-black dark:text-white uppercase">
            WATCHLIST
          </h2>
        </div>

        <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider font-bold">
          SOLANA LIVE
        </div>
      </div>

      {/* Token List */}
      <div className="space-y-2">
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
              className="group p-3.5 rounded-none bg-[#F7F7F7]/60 dark:bg-[#1D1D1E]/40 hover:bg-[#ECECEC] dark:hover:bg-[#262628] border border-black/10 dark:border-[#353536] transition-colors duration-100 flex items-center justify-between gap-3 cursor-pointer"
            >
              {/* Left: Authentic Token Vector Logo & Names */}
              <div className="flex items-center gap-3">
                <div className="shrink-0">
                  <TokenIcon symbol={token.symbol} size={30} />
                </div>
                <div>
                  <div className="font-sans font-bold text-xs sm:text-sm text-black dark:text-white">
                    {token.name}
                  </div>
                  <div className="text-[11px] font-mono text-zinc-500 uppercase">
                    {token.symbol}
                  </div>
                </div>
              </div>

              {/* Middle: Mini Micro-Sparkline with clean sharp geometry */}
              <div className="hidden sm:block w-16 h-6">
                <svg viewBox="0 0 60 24" className="w-full h-full overflow-visible">
                  <path
                    d={
                      isPositive
                        ? 'M 2 20 Q 15 18, 30 10 T 58 4'
                        : 'M 2 6 Q 15 8, 30 16 T 58 20'
                    }
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="square"
                    className="text-black dark:text-white opacity-60"
                  />
                </svg>
              </div>

              {/* Right: Live Price & 24h PnL badge in crisp IBM Plex Mono */}
              <div className="text-right">
                <div className="font-mono font-bold text-xs sm:text-sm text-black dark:text-white">
                  {formattedPrice}
                </div>

                <div className="flex items-center justify-end gap-1 mt-0.5">
                  <span
                    className={`inline-flex items-center gap-0.5 text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-none border ${
                      isPositive
                        ? 'border-black dark:border-white text-black dark:text-white bg-black/5 dark:bg-white/10'
                        : 'border-zinc-500 text-zinc-700 dark:text-zinc-300 bg-zinc-200/50 dark:bg-zinc-800/50'
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
                    className="p-1 rounded-none text-zinc-400 hover:text-black dark:hover:text-white transition-colors opacity-0 group-hover:opacity-100"
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
