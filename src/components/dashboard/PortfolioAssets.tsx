'use client';

import React, { useState } from 'react';
import { ArrowUpRight, ArrowDownLeft, ChevronRight, Layers } from 'lucide-react';
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
    <div className="rounded-3xl p-5 sm:p-6 transition-colors duration-200 bg-[var(--card-bg)] border border-[var(--card-border)] shadow-[var(--card-shadow)]">
      {/* Header: "My Portfolio" + "See All" button */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-[var(--card-border)]">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold tracking-tight text-[var(--text-primary)]">
            My Portfolio
          </h2>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
            {tokens.length} Assets
          </span>
        </div>

        <button
          onClick={() => setShowAll(!showAll)}
          className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition cursor-pointer select-none"
        >
          <span>{showAll ? 'Show Less' : 'See All'}</span>
          <ChevronRight
            size={14}
            className={`transition-transform duration-200 ${showAll ? 'rotate-90' : ''}`}
          />
        </button>
      </div>

      {/* Asset rows */}
      <div className="space-y-3">
        {displayedTokens.map((token) => {
          // Allocation calculation: 0% cleanly when fresh vault has $0 total balance
          const numFiat = token.fiatValueUsd || 0;
          const allocationPercent =
            totalFiatBalance > 0
              ? Math.min(100, Math.round((numFiat / totalFiatBalance) * 1000) / 10)
              : 0;

          // Color for allocation progress bar
          const barColor = token.color || '#14F195';

          return (
            <div
              key={token.symbol}
              onClick={() => onSelectToken?.(token)}
              className="group p-3.5 sm:p-4 rounded-2xl bg-[var(--panel-bg)] hover:bg-[var(--panel-hover)] border border-[var(--card-border)] hover:border-emerald-500/30 transition-all duration-150 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer"
            >
              {/* Left: Token Icon + Name & Symbol */}
              <div className="flex items-center gap-3.5 min-w-[180px]">
                <div className="shrink-0 transition-transform duration-200 group-hover:scale-105">
                  <TokenIcon symbol={token.symbol} size={38} />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm text-[var(--text-primary)]">
                      {token.name}
                    </span>
                    {token.isNative && (
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-400 font-semibold">
                        SVM
                      </span>
                    )}
                  </div>
                  <div className="text-xs font-mono text-[var(--text-muted)]">
                    {token.symbol}
                  </div>
                </div>
              </div>

              {/* Middle: Allocation progress bar */}
              <div className="flex-1 max-w-xs px-0 sm:px-4">
                <div className="flex items-center justify-between text-[11px] font-mono mb-1 text-[var(--text-muted)]">
                  <span>Allocation</span>
                  <span className="font-medium text-[var(--text-secondary)]">
                    {allocationPercent.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-[var(--input-bg)] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${allocationPercent}%`,
                      backgroundColor: barColor,
                    }}
                  />
                </div>
              </div>

              {/* Right: Balance + USD Fiat Value */}
              <div className="flex items-center justify-between sm:justify-end gap-4">
                <div className="text-left sm:text-right font-mono">
                  <div className="text-sm sm:text-base font-bold text-[var(--text-primary)]">
                    ${numFiat.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="text-xs text-[var(--text-muted)]">
                    {token.balance} {token.symbol}
                  </div>
                </div>

                {/* Quick send/receive triggers */}
                {(onSendToken || onReceiveToken) && (
                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    {onSendToken && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSendToken(token);
                        }}
                        className="p-1.5 rounded-xl text-[var(--text-muted)] hover:text-black hover:bg-emerald-400 transition cursor-pointer"
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
                        className="p-1.5 rounded-xl text-[var(--text-muted)] hover:text-emerald-400 hover:bg-[var(--panel-hover)] transition cursor-pointer"
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
        <div className="mt-4 pt-3 border-t border-[var(--card-border)] flex items-center justify-between text-[11px] font-mono text-[var(--text-muted)]">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Clean 0.00 Vault State — Deposit funds to activate allocation</span>
          </span>
          <span className="text-emerald-400 font-medium">Ready</span>
        </div>
      )}
    </div>
  );
}
