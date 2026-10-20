'use client';

import React, { useState } from 'react';
import { TrendingUp, TrendingDown, Copy, Check, ArrowUpRight, ArrowDownLeft, QrCode } from 'lucide-react';
import { useWallet } from '@/context/WalletContext';
import { SUPPORTED_CHAINS } from '@/lib/constants';
import { SupportedChainId } from '@/types/wallet';

interface BalanceCardsProps {
  onSend: (chainId: SupportedChainId) => void;
  onReceive: (chainId: SupportedChainId) => void;
  onViewQr: (chainId: SupportedChainId, address: string) => void;
}

export function BalanceCards({ onSend, onReceive, onViewQr }: BalanceCardsProps) {
  const { selectedChains, balances, totalFiatBalance, addresses } = useWallet();
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

          <div className="flex items-center gap-2 self-start sm:self-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-950/40 border border-emerald-800/40 text-emerald-400 text-xs font-mono">
              <TrendingUp size={14} />
              <span>+2.45% (24h)</span>
            </div>
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
                    {bal?.balance || '0.00'} <span className="text-xs text-zinc-400 font-normal">{chain.symbol}</span>
                  </div>
                  <div className="text-xs text-zinc-400 font-mono mt-0.5">
                    ≈ ${bal?.fiatValueUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'} USD
                  </div>
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
    </div>
  );
}
