'use client';

import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Copy,
  Check,
  ArrowUpRight,
  ArrowDownLeft,
  QrCode,
  RefreshCw,
} from 'lucide-react';
import { useWallet } from '@/context/WalletContext';
import { SUPPORTED_CHAINS } from '@/lib/constants';
import { SupportedChainId } from '@/types/wallet';

interface BalanceCardsProps {
  onSend: (chainId: SupportedChainId) => void;
  onReceive: (chainId: SupportedChainId) => void;
  onViewQr: (chainId: SupportedChainId, address: string) => void;
}

export function BalanceCards({ onSend, onReceive, onViewQr }: BalanceCardsProps) {
  const {
    selectedChains,
    balances,
    totalFiatBalance,
    addresses,
    isRefreshingBalances,
    refreshBalances,
    isOnline,
  } = useWallet();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Aggregate Portfolio Balance Card */}
      <div className="crypto-panel rounded-3xl p-6 md:p-8 relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute -top-24 -right-24 w-60 h-60 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 uppercase tracking-widest mb-1.5">
              <span>Total Vault Reserve</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            </div>

            <div className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight font-mono">
              ${totalFiatBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
            {/* Live Refresh Trigger Button */}
            <button
              onClick={refreshBalances}
              disabled={isRefreshingBalances || !isOnline}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-mono transition cursor-pointer disabled:opacity-50"
              title={isOnline ? 'Refresh On-Chain Balances' : 'Wallet offline'}
            >
              <RefreshCw
                size={13}
                className={isRefreshingBalances ? 'animate-spin text-cyan-400' : 'text-zinc-400'}
              />
              <span>{isRefreshingBalances ? 'Syncing...' : 'Refresh'}</span>
            </button>

            <div className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs font-mono">
              <span>{selectedChains.length} Chains Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Individual Chain Balances */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {selectedChains.map((id) => {
          const chain = SUPPORTED_CHAINS[id];
          const bal = balances[id];
          const addrInfo = addresses[id];
          const rawAddress = addrInfo?.address || '0x...';
          const truncated =
            rawAddress.length > 18
              ? `${rawAddress.slice(0, 8)}...${rawAddress.slice(-6)}`
              : rawAddress;
          const isZeroBalance = parseFloat(bal?.balance || '0') === 0;

          return (
            <div
              key={id}
              className="crypto-panel-interactive rounded-2xl p-5 flex flex-col justify-between"
            >
              {/* Top row: Symbol, Name & 24h change */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs text-white"
                      style={{ backgroundColor: `${chain.color}30`, border: `1px solid ${chain.color}` }}
                    >
                      {chain.symbol}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-zinc-200">{chain.name}</div>
                      <div className="text-[10px] font-mono text-zinc-500">
                        ${bal?.tokenPriceUsd.toLocaleString('en-US') || '0'}
                      </div>
                    </div>
                  </div>

                  <div
                    className={`text-xs font-mono flex items-center gap-0.5 ${
                      (bal?.change24hPercent || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {(bal?.change24hPercent || 0) >= 0 ? (
                      <TrendingUp size={13} />
                    ) : (
                      <TrendingDown size={13} />
                    )}
                    <span>
                      {(bal?.change24hPercent || 0) >= 0 ? '+' : ''}
                      {bal?.change24hPercent || 0}%
                    </span>
                  </div>
                </div>

                {/* Balance amounts */}
                <div className="my-3">
                  <div className="text-2xl font-bold font-mono text-white tracking-tight">
                    {bal?.balance || '0.0000'} <span className="text-xs text-zinc-400 font-normal">{chain.symbol}</span>
                  </div>
                  <div className="text-xs text-zinc-400 font-mono mt-0.5">
                    ≈ ${bal?.fiatValueUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'} USD
                  </div>

                  {/* Clean State Notice if Balance is 0.00 */}
                  {isZeroBalance && (
                    <div className="mt-2.5 text-[11px] text-cyan-300 bg-cyan-950/40 border border-cyan-800/40 rounded-xl px-2.5 py-1.5 font-mono flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                      <span>Vault active. Deposit funds to this address to get started.</span>
                    </div>
                  )}
                </div>

                {/* Truncated Address Bar with Copy & QR */}
                <div className="flex items-center justify-between p-2 rounded-xl bg-[#0A0A0E] border border-[#1A1A22] text-xs font-mono text-zinc-400 my-2">
                  <span className="truncate mr-1 text-[11px]">{truncated}</span>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => onViewQr(id, rawAddress)}
                      className="p-1 rounded hover:text-cyan-400 transition"
                      title="Show QR Code"
                    >
                      <QrCode size={13} />
                    </button>
                    <button
                      onClick={() => handleCopy(id, rawAddress)}
                      className="p-1 rounded hover:text-emerald-400 transition"
                      title="Copy Address"
                    >
                      {copiedId === id ? (
                        <Check size={13} className="text-emerald-400" />
                      ) : (
                        <Copy size={13} />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Bottom Quick Action buttons */}
              <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-[#1F1F24]">
                <button
                  onClick={() => onSend(id)}
                  className="flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-medium bg-[#14141C] hover:bg-[#1C1C28] text-zinc-200 border border-[#272732] transition cursor-pointer"
                >
                  <ArrowUpRight size={14} className="text-cyan-400" />
                  <span>Send</span>
                </button>
                <button
                  onClick={() => onReceive(id)}
                  className="flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-medium bg-[#14141C] hover:bg-[#1C1C28] text-zinc-200 border border-[#272732] transition cursor-pointer"
                >
                  <ArrowDownLeft size={14} className="text-emerald-400" />
                  <span>Receive</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* SPL Token Assets Showcase */}
      {balances.solana?.splTokens && balances.solana.splTokens.length > 0 && (
        <div className="crypto-panel rounded-3xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Solana SPL Token Assets
              </h3>
            </div>
            <span className="text-xs font-mono text-zinc-400">
              {balances.solana.splTokens.length} Tokens
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {balances.solana.splTokens.map((token) => (
              <div
                key={token.mint}
                className="p-3.5 rounded-2xl bg-[#0D0D12] border border-[#1A1A22] hover:border-[#272736] transition flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center font-bold text-xs text-white">
                    {token.symbol.slice(0, 4)}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold text-zinc-200">{token.symbol}</span>
                      <span className="text-[10px] font-mono text-zinc-500">${token.tokenPriceUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}</span>
                    </div>
                    <div className="text-[11px] text-zinc-400 truncate max-w-[120px]">{token.name}</div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-bold font-mono text-white">
                    {token.balance}
                  </div>
                  <div className="text-[11px] font-mono text-zinc-400">
                    ≈ ${token.fiatValueUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
