'use client';

import React, { useState } from 'react';
import {
  ArrowUpRight,
  ArrowDownLeft,
  FileCode,
  Radio,
  CheckCircle2,
  Clock,
  ExternalLink,
  Copy,
  Check,
  Layers,
} from 'lucide-react';
import { useWallet } from '@/context/WalletContext';
import { TransactionRecord, TransactionStatus } from '@/types/wallet';
import { SUPPORTED_CHAINS } from '@/lib/constants';

export function TransactionList() {
  const { transactions } = useWallet();
  const [filter, setFilter] = useState<'all' | TransactionStatus>('all');
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const filtered = transactions.filter((tx) => {
    if (filter === 'all') return true;
    return tx.status === filter;
  });

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const formatTime = (ts: number) => {
    const diff = Math.floor((Date.now() - ts) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div className="crypto-panel rounded-3xl p-5 md:p-7">
      {/* Header and Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1F1F24] mb-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Layers size={18} className="text-cyan-400" />
            <span>Activity & Signatures</span>
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Cryptographic transactions, settlements, and queued air-gap payloads.
          </p>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex rounded-xl bg-[#14141C] p-1 border border-[#272732] self-start sm:self-center">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
              filter === 'all'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            All ({transactions.length})
          </button>
          <button
            onClick={() => setFilter('confirmed')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
              filter === 'confirmed'
                ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Confirmed
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
              filter === 'pending'
                ? 'bg-amber-950/60 text-amber-400 border border-amber-800/40'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter('queued_offline')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
              filter === 'queued_offline'
                ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-800/40'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Queued Offline
          </button>
        </div>
      </div>

      {/* Transaction List */}
      {filtered.length === 0 ? (
        <div className="py-12 text-center text-zinc-500 font-mono text-xs">
          No transactions found for this filter.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((tx) => {
            const chain = SUPPORTED_CHAINS[tx.chainId];
            const isSend = tx.type === 'send';
            const isContract = tx.type === 'contract_call';

            return (
              <div
                key={tx.id}
                className="p-4 rounded-2xl bg-[#121218] border border-[#1F1F24] hover:border-zinc-700 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                {/* Left: Direction Icon + Info */}
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isSend
                        ? 'bg-cyan-950/40 border border-cyan-800/50 text-cyan-400'
                        : isContract
                        ? 'bg-purple-950/40 border border-purple-800/50 text-purple-400'
                        : 'bg-emerald-950/40 border border-emerald-800/50 text-emerald-400'
                    }`}
                  >
                    {isSend ? (
                      <ArrowUpRight size={18} />
                    ) : isContract ? (
                      <FileCode size={18} />
                    ) : (
                      <ArrowDownLeft size={18} />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-zinc-200">
                        {isSend ? 'Sent' : isContract ? 'Air-Gap Interaction' : 'Received'}{' '}
                        {chain?.symbol || 'Crypto'}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                        {chain?.badge || 'Chain'}
                      </span>
                      {tx.note && (
                        <span className="text-[11px] text-zinc-400 italic hidden md:inline">
                          • {tx.note}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-1 text-xs font-mono text-zinc-500">
                      <span>{formatTime(tx.timestamp)}</span>
                      <span>•</span>
                      <span className="truncate max-w-[120px] sm:max-w-[180px]">
                        {isSend ? `To: ${tx.to}` : `From: ${tx.from}`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Amount & Status Badge */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-zinc-800/60">
                  <div className="font-mono text-sm font-bold text-white">
                    {isSend ? '-' : '+'}
                    {tx.amount}
                  </div>
                  <div className="text-[11px] font-mono text-zinc-500">
                    ≈ ${tx.fiatValueUsd.toFixed(2)} USD
                  </div>

                  {/* Status Badge */}
                  <div className="mt-1.5">
                    {tx.status === 'confirmed' && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-emerald-950/40 text-emerald-400 border border-emerald-800/40">
                        <CheckCircle2 size={11} /> Confirmed
                      </span>
                    )}
                    {tx.status === 'pending' && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-amber-950/40 text-amber-400 border border-amber-800/40 animate-pulse">
                        <Clock size={11} /> Pending
                      </span>
                    )}
                    {tx.status === 'queued_offline' && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-cyan-950/60 text-cyan-300 border border-cyan-600/50">
                        <Radio size={11} className="text-cyan-400" /> Queued Offline
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
