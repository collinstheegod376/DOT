'use client';

import React, { useState } from 'react';
import {
  ArrowUpRight,
  ArrowDownLeft,
  Radio,
  FileCode,
  ExternalLink,
  Clock,
  CheckCircle2,
  Inbox,
} from 'lucide-react';
import { useWallet } from '@/context/WalletContext';
import { TransactionRecord } from '@/types/wallet';

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
    <div className="rounded-3xl p-5 sm:p-6 transition-colors duration-200 bg-[var(--card-bg)] border border-[var(--card-border)] shadow-[var(--card-shadow)]">
      {/* Header and Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-[var(--card-border)]">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-[var(--text-primary)]">
            Recent Transactions
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Confirmed SVM executions & offline air-gap signatures
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex rounded-xl bg-[var(--panel-hover)] p-1 border border-[var(--card-border)] self-start sm:self-auto text-xs font-semibold">
          {(
            [
              { id: 'all', label: 'All' },
              { id: 'inbound', label: 'Inbound' },
              { id: 'outbound', label: 'Outbound' },
              { id: 'airgap', label: 'Air-Gap' },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              onClick={() => setFilter(item.id)}
              className={`px-3 py-1.5 rounded-lg transition-all duration-150 cursor-pointer ${
                filter === item.id
                  ? 'bg-emerald-500 text-black shadow-sm font-bold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Transaction List or Clean Empty State */}
      {filteredTransactions.length === 0 ? (
        <div className="py-12 sm:py-16 text-center flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-2xl bg-[var(--panel-hover)] border border-[var(--card-border)] flex items-center justify-center text-[var(--text-muted)] mb-3 shadow-inner">
            <Inbox size={22} />
          </div>
          <p className="text-sm font-medium text-[var(--text-secondary)]">
            No transactions yet. Deposit funds to see on-chain activity.
          </p>
          <p className="text-xs text-[var(--text-muted)] mt-1 font-mono">
            Zero demo activity • Real Solana ledger updates stream live
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTransactions.map((tx) => {
            const isOutbound = tx.type === 'send';
            const isAirGap = tx.type === 'contract_call' || tx.status === 'queued_offline';

            const title = isAirGap
              ? 'Air-Gap Signature'
              : isOutbound
              ? 'Send Assets'
              : 'Receive Assets';

            const solscanUrl = `https://solscan.io/tx/${tx.hash}`;

            return (
              <div
                key={tx.id}
                className="group p-3.5 sm:p-4 rounded-2xl bg-[var(--panel-bg)] hover:bg-[var(--panel-hover)] border border-[var(--card-border)] hover:border-emerald-500/30 transition-all duration-150 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                {/* Left: Direction Icon + Title + Timestamp */}
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                      isAirGap
                        ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                        : isOutbound
                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    }`}
                  >
                    {isAirGap ? (
                      <Radio size={18} />
                    ) : isOutbound ? (
                      <ArrowUpRight size={18} />
                    ) : (
                      <ArrowDownLeft size={18} />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[var(--text-primary)]">
                        {title}
                      </span>
                      {tx.note && (
                        <span className="text-[11px] text-[var(--text-muted)] hidden md:inline">
                          • {tx.note}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-0.5 text-xs font-mono text-[var(--text-muted)]">
                      <span>{formatDate(tx.timestamp)}</span>
                      <span>•</span>
                      <span>Fee: {tx.fee} SOL</span>

                      <a
                        href={solscanUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[var(--text-muted)] hover:text-cyan-400 transition ml-1"
                        title="View on Solscan"
                      >
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  </div>
                </div>

                {/* Right: Amount + USD Value + Status Badge */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-[var(--card-border)]">
                  <div
                    className={`font-mono text-sm sm:text-base font-bold ${
                      isOutbound
                        ? 'text-amber-400'
                        : isAirGap
                        ? 'text-cyan-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {isOutbound ? '-' : '+'}
                    {tx.amount} SOL
                  </div>

                  <div className="text-xs font-mono text-[var(--text-muted)]">
                    ≈ ${tx.fiatValueUsd.toFixed(2)} USD
                  </div>

                  {/* Status Badge */}
                  <div className="mt-1">
                    {tx.status === 'confirmed' && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 size={10} /> Confirmed
                      </span>
                    )}
                    {tx.status === 'pending' && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">
                        <Clock size={10} /> Pending
                      </span>
                    )}
                    {tx.status === 'queued_offline' && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                        <Radio size={10} /> Queued Offline
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
