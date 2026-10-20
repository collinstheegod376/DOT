'use client';

import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownLeft,
  Coins,
  ExternalLink,
  Search,
  Check,
  Copy,
} from 'lucide-react';
import { useWallet } from '@/context/WalletContext';
import { TokenAsset } from '@/types/wallet';
import { getTokenIcon } from '@/lib/token-icons';

interface TokenListProps {
  onSendToken: (token: TokenAsset) => void;
  onReceiveToken: (token: TokenAsset) => void;
}

export function TokenList({ onSendToken, onReceiveToken }: TokenListProps) {
  const { tokens } = useWallet();
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedMint, setCopiedMint] = useState<string | null>(null);

  const filteredTokens = tokens.filter((t) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      t.name.toLowerCase().includes(q) ||
      t.symbol.toLowerCase().includes(q) ||
      t.mint.toLowerCase().includes(q)
    );
  });

  const handleCopyMint = (mint: string) => {
    navigator.clipboard.writeText(mint);
    setCopiedMint(mint);
    setTimeout(() => setCopiedMint(null), 2000);
  };

  return (
    <div className="crypto-panel rounded-3xl p-5 sm:p-7 shadow-xl">
      {/* Header and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-[#1E2230]">
        <div>
          <div className="flex items-center gap-2">
            <Coins size={20} className="text-[#14F195]" />
            <h2 className="text-lg font-bold text-white tracking-tight">
              Assets & SPL Tokens
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/40 border border-emerald-800/40 text-emerald-300">
              {tokens.length} Supported
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Native SOL and standard SPL tokens held in your sovereign vault.
          </p>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-56">
          <Search size={14} className="absolute left-3 top-2.5 text-zinc-500" />
          <input
            type="text"
            placeholder="Search symbol or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#0F1118] border border-[#232736] text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Tokens List */}
      <div className="space-y-2.5">
        {filteredTokens.length === 0 ? (
          <div className="py-12 text-center text-zinc-500 text-xs">
            No tokens matching &ldquo;{searchQuery}&rdquo;
          </div>
        ) : (
          filteredTokens.map((token) => {
            const isPositive = token.change24hPercent >= 0;
            const solscanUrl = token.isNative
              ? 'https://solscan.io/token/So11111111111111111111111111111111111111112'
              : `https://solscan.io/token/${token.mint}`;

            return (
              <div
                key={token.symbol}
                className="group p-3.5 sm:p-4 rounded-2xl bg-[#0D0F17] hover:bg-[#121520] border border-[#1A1D28] hover:border-emerald-500/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                {/* Left: Token Badge, Name, Symbol, and Price */}
                <div className="flex items-center gap-3.5 min-w-[200px]">
                  {/* Icon / Symbol Badge */}
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-md overflow-hidden bg-black/10 dark:bg-black/30 border border-zinc-200 dark:border-zinc-800">
                    {getTokenIcon(token.symbol, 28)}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-white">{token.name}</span>
                      <span className="text-xs font-mono font-medium text-zinc-400">
                        {token.symbol}
                      </span>
                      {token.isNative ? (
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/40 text-emerald-300">
                          NATIVE
                        </span>
                      ) : (
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                          SPL
                        </span>
                      )}
                    </div>

                    {/* Price and 24h PnL */}
                    <div className="flex items-center gap-2 text-xs font-mono mt-0.5">
                      <span className="text-zinc-400">
                        ${token.tokenPriceUsd < 0.01
                          ? token.tokenPriceUsd.toFixed(7)
                          : token.tokenPriceUsd.toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: token.tokenPriceUsd > 10 ? 2 : 4,
                            })}
                      </span>

                      <span
                        className={`flex items-center gap-0.5 text-[11px] ${
                          isPositive ? 'text-emerald-400' : 'text-red-400'
                        }`}
                      >
                        {isPositive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                        <span>
                          {isPositive ? '+' : ''}
                          {token.change24hPercent}%
                        </span>
                      </span>

                      {/* Solscan explorer link for token mint */}
                      <a
                        href={solscanUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-zinc-500 hover:text-cyan-400 ml-1 transition"
                        title="View Token on Solscan"
                      >
                        <ExternalLink size={11} />
                      </a>
                    </div>
                  </div>
                </div>

                {/* Middle: Balance & USD Fiat Value */}
                <div className="sm:text-right font-mono">
                  <div className="text-base sm:text-lg font-bold text-white tracking-tight">
                    {token.balance}{' '}
                    <span className="text-xs text-zinc-400 font-normal">{token.symbol}</span>
                  </div>
                  <div className="text-xs text-zinc-400">
                    ≈ ${token.fiatValueUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
                    USD
                  </div>
                </div>

                {/* Right: One-click Send / Receive Actions */}
                <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#1A1D28] self-stretch sm:self-auto justify-end">
                  <button
                    onClick={() => onSendToken(token)}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-semibold bg-[#161924] hover:bg-emerald-500 hover:text-black text-zinc-200 border border-[#272B3C] transition cursor-pointer"
                    title={`Send ${token.symbol}`}
                  >
                    <ArrowUpRight size={13} className="text-[#14F195] group-hover:text-black" />
                    <span>Send</span>
                  </button>

                  <button
                    onClick={() => onReceiveToken(token)}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-semibold bg-[#161924] hover:bg-zinc-800 text-zinc-200 border border-[#272B3C] transition cursor-pointer"
                    title={`Receive ${token.symbol}`}
                  >
                    <ArrowDownLeft size={13} className="text-emerald-400" />
                    <span>Receive</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer ATA note */}
      <div className="mt-5 pt-4 border-t border-[#1E2230] flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-zinc-500 font-mono">
        <div>
          SPL Token standard allows automatic Associated Token Accounts (ATAs).
        </div>
        <div className="text-emerald-400/80">
          Zero rent for initialized accounts
        </div>
      </div>
    </div>
  );
}
