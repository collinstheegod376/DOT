'use client';

import React, { useState } from 'react';
import {
  ArrowUpRight,
  ArrowDownLeft,
  Radio,
  ExternalLink,
  Clock,
  CheckCircle2,
  Inbox,
} from 'lucide-react';
import { useWallet } from '@/context/WalletContext';

type FilterType = 'all' | 'inbound' | 'outbound' | 'airgap';

export function RecentActivity() {
  const { transactions } = useWallet();
  const [filter, setFilter] = useState<FilterType>('all');

  const filteredTransactions = transactions.filter((tx) => {
    if (filter === 'all') return true;
    if (filter === 'inbound') return tx.type === 'receive';
    if (filter === 'outbound') return tx.type === 'send';
    if (filter === 'airgap') return tx.type === 'contract_call' || tx.status === 'queued_offline';
    return true;
  });

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();

    const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (isToday) {
      return `Today, ${timeStr}`;
    }
    return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${timeStr}`;
  };

  return (
    <div className="rounded-none p-6 sm:p-7 transition-colors duration-150 bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800">
      {/* Header and Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h2 className="text-sm font-sans font-black tracking-widest text-black dark:text-white uppercase">
            ACTIVITY
          </h2>
          <p className="text-xs text-zinc-500 font-mono mt-0.5 uppercase tracking-wider">
            Verified On-Chain & Offline Vault Signatures
          </p>
        </div>

        {/* Sharp Filter Tabs with black/white inversion */}
        <div className="flex rounded-none border border-zinc-200 dark:border-zinc-800 p-0.5 self-start sm:self-auto text-xs font-mono font-bold">
          {(
            [
              { id: 'all', label: 'ALL' },
              { id: 'inbound', label: 'INBOUND' },
              { id: 'outbound', label: 'OUTBOUND' },
              { id: 'airgap', label: 'OFFLINE' },
            ] as const
          ).map((item) => {
            const isActive = filter === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setFilter(item.id)}
                className={`px-3 py-1.5 rounded-none text-xs font-mono font-bold tracking-wider uppercase transition-colors cursor-pointer border ${
                  isActive
                    ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white'
                    : 'border-transparent text-zinc-500 hover:text-black dark:hover:text-white'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Transaction List or Clean Empty State (Screenshot 3 Purged) */}
      {filteredTransactions.length === 0 ? (
        <div className="py-12 sm:py-16 text-center flex flex-col items-center justify-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-none bg-zinc-50/50 dark:bg-zinc-950/30">
          <div className="w-12 h-12 rounded-none border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 flex items-center justify-center text-zinc-400 mb-3">
            <Inbox size={20} />
          </div>
          <p className="text-xs font-mono font-bold text-black dark:text-white uppercase tracking-wider">
            No transactions recorded yet
          </p>
          <p className="text-[11px] text-zinc-500 mt-1 font-mono uppercase tracking-wider">
            All transactions are verified on-chain
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredTransactions.map((tx) => {
            const isOutbound = tx.type === 'send';
            const isAirGap = tx.type === 'contract_call' || tx.status === 'queued_offline';

            const title = isAirGap
              ? 'Offline Signature'
              : isOutbound
              ? 'Sent Assets'
              : 'Received Assets';

            const solscanUrl = `https://solscan.io/tx/${tx.hash}`;

            return (
              <div
                key={tx.id}
                className="group p-4 rounded-none bg-zinc-50/50 dark:bg-zinc-950/40 hover:bg-zinc-100 dark:hover:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 transition-colors duration-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                {/* Left: Direction Icon + Title + Timestamp */}
                <div className="flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-none border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-black flex items-center justify-center shrink-0">
                    {isAirGap ? (
                      <Radio size={16} className="text-black dark:text-white" />
                    ) : isOutbound ? (
                      <ArrowUpRight size={16} className="text-black dark:text-white" />
                    ) : (
                      <ArrowDownLeft size={16} className="text-black dark:text-white" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-sans font-bold text-sm text-black dark:text-white uppercase tracking-wide">
                        {title}
                      </span>
                      {tx.note && (
                        <span className="text-[11px] font-mono text-zinc-400 hidden md:inline">
                          • {tx.note}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-0.5 text-xs font-mono text-zinc-500">
                      <span>{formatDate(tx.timestamp)}</span>
                      <span>•</span>
                      <span>Fee: {tx.fee} SOL</span>

                      <a
                        href={solscanUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-zinc-400 hover:text-black dark:hover:text-white transition-colors ml-1"
                        title="View on Solscan"
                      >
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  </div>
                </div>

                {/* Right: Amount in IBM Plex Mono + USD Value + Status Badge */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-zinc-200 dark:border-zinc-800">
                  <div className="font-mono text-sm sm:text-base font-bold text-black dark:text-white">
                    {isOutbound ? '-' : '+'}
                    {tx.amount} SOL
                  </div>

                  <div className="text-xs font-mono text-zinc-500">
                    ≈ ${tx.fiatValueUsd.toFixed(2)} USD
                  </div>

                  {/* Sharp Status Badge */}
                  <div className="mt-1">
                    {tx.status === 'confirmed' && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.2 rounded-none border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 uppercase">
                        <CheckCircle2 size={10} /> Confirmed
                      </span>
                    )}
                    {tx.status === 'pending' && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.2 rounded-none border border-amber-500/30 text-amber-600 dark:text-amber-400 uppercase">
                        <Clock size={10} /> Pending
                      </span>
                    )}
                    {tx.status === 'queued_offline' && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.2 rounded-none border border-zinc-400 text-zinc-600 dark:text-zinc-400 uppercase">
                        <Radio size={10} /> Offline Queued
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
