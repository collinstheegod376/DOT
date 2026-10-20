'use client';

import React, { useState } from 'react';
import { ArrowUpRight, ArrowDownLeft, ChevronRight } from 'lucide-react';
import { useWallet } from '@/context/WalletContext';
import { TokenAsset } from '@/types/wallet';
import { TokenIcon } from '@/components/dashboard/token-icons';

interface PortfolioAssetsProps {
  onSendToken?: (token: TokenAsset) => void;
  onReceiveToken?: (token: TokenAsset) => void;
  onSelectToken?: (token: TokenAsset) => void;
}

export function PortfolioAssets({
  onSendToken,
  onReceiveToken,
  onSelectToken,
}: PortfolioAssetsProps) {
  const { tokens, totalFiatBalance } = useWallet();
  const [showAll, setShowAll] = useState(false);

  // By default show top 4 assets unless "See All" is clicked
  const displayedTokens = showAll ? tokens : tokens.slice(0, 4);

  return (
    <div className="rounded-none p-6 sm:p-7 transition-colors duration-150 bg-white dark:bg-[#0F0F10] border border-black dark:border-[#353536]">
      {/* Header: "MY ASSETS" with uppercase DM Sans tracking */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-black/10 dark:border-[#353536]">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-sans font-black tracking-widest text-black dark:text-white uppercase">
            MY ASSETS
          </h2>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-none border border-black dark:border-[#353536] text-black dark:text-white uppercase tracking-wider font-bold">
            {tokens.length} ASSETS
          </span>
        </div>

        <button
          onClick={() => setShowAll(!showAll)}
          className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white flex items-center gap-1 transition-colors cursor-pointer select-none"
        >
          <span>{showAll ? 'LESS' : 'VIEW ALL'}</span>
          <ChevronRight
            size={13}
            className={`transition-transform duration-150 ${showAll ? 'rotate-90' : ''}`}
          />
        </button>
      </div>

      {/* Sharp Rectangular Asset Rows with 1px borders */}
      <div className="space-y-2">
        {displayedTokens.map((token) => {
          // Allocation calculation
          const numFiat = token.fiatValueUsd || 0;
          const allocationPercent =
            totalFiatBalance > 0
              ? Math.min(100, Math.round((numFiat / totalFiatBalance) * 1000) / 10)
              : 0;

          return (
            <div
              key={token.symbol}
              onClick={() => onSelectToken?.(token)}
              className="group p-4 rounded-none bg-[#F7F7F7]/60 dark:bg-[#1D1D1E]/40 hover:bg-[#ECECEC] dark:hover:bg-[#262628] border border-black/10 dark:border-[#353536] transition-colors duration-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer"
            >
              {/* Left: Authentic Coin Vector Logo + Token Name & Symbol */}
              <div className="flex items-center gap-3 min-w-[180px]">
                <div className="shrink-0">
                  <TokenIcon symbol={token.symbol} size={36} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-sans font-bold text-sm text-black dark:text-white">
                      {token.name}
                    </span>
                    {token.isNative && (
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-none border border-black dark:border-[#353536] text-black dark:text-white uppercase font-bold">
                        NATIVE
                      </span>
                    )}
                  </div>
                  <div className="text-xs font-mono text-zinc-500 uppercase">
                    {token.symbol}
                  </div>
                </div>
              </div>

              {/* Middle: Sharp Rectangular Allocation Bar */}
              <div className="flex-1 max-w-xs px-0 sm:px-4">
                <div className="flex items-center justify-between text-[11px] font-mono mb-1 text-zinc-500">
                  <span className="uppercase text-[10px] font-bold">ALLOCATION</span>
                  <span className="font-semibold text-black dark:text-white">
                    {allocationPercent.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-none bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full rounded-none bg-black dark:bg-white transition-all duration-300"
                    style={{
                      width: `${allocationPercent}%`,
                    }}
                  />
                </div>
              </div>

              {/* Right: Clean Token Balance in IBM Plex Mono + USD Valuation */}
              <div className="flex items-center justify-between sm:justify-end gap-4">
                <div className="text-left sm:text-right font-mono">
                  <div className="text-sm sm:text-base font-bold text-black dark:text-white tracking-tight">
                    ${numFiat.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">
                    {token.balance} {token.symbol}
                  </div>
                </div>

                {/* Sharp Quick Send/Receive Trigger Buttons */}
                {(onSendToken || onReceiveToken) && (
                  <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
                    {onSendToken && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSendToken(token);
                        }}
                        className="p-1.5 rounded-none border border-black/20 dark:border-[#353536] text-zinc-700 dark:text-zinc-300 hover:text-white hover:bg-black dark:hover:text-black dark:hover:bg-white transition-colors cursor-pointer"
                        title={`Send ${token.symbol}`}
                      >
                        <ArrowUpRight size={14} />
                      </button>
                    )}
                    {onReceiveToken && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onReceiveToken(token);
                        }}
                        className="p-1.5 rounded-none border border-black/20 dark:border-[#353536] text-zinc-700 dark:text-zinc-300 hover:text-white hover:bg-black dark:hover:text-black dark:hover:bg-white transition-colors cursor-pointer"
                        title={`Receive ${token.symbol}`}
                      >
                        <ArrowDownLeft size={14} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Fresh Vault Clean Indicator */}
      {totalFiatBalance === 0 && (
        <div className="mt-4 pt-3 border-t border-black/10 dark:border-[#353536] flex items-center justify-between text-[11px] font-mono text-zinc-500">
          <span className="flex items-center gap-1.5 uppercase font-mono">
            <span className="w-1.5 h-1.5 rounded-none bg-black dark:bg-white" />
            <span>Vault Ready — Deposit assets to activate tracking</span>
          </span>
          <span className="text-black dark:text-white font-bold uppercase">Ready</span>
        </div>
      )}
    </div>
  );
}
