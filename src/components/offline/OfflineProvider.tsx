'use client';

import React, { useEffect, useState } from 'react';
import { Wifi, WifiOff, ArrowUpRight } from 'lucide-react';
import { registerServiceWorker } from '../../lib/offline/sw-register';
import { registerOnlineSync, getPendingTxs } from '../../lib/offline/queue';
import { DotTx } from '../../lib/offline/dot-tx';

export function OfflineProvider({ children }: { children: React.ReactNode }) {
  const [isOffline, setIsOffline] = useState(() => {
    return typeof navigator !== 'undefined' ? !navigator.onLine : false;
  });
  const [pendingTxs, setPendingTxs] = useState<DotTx[]>([]);
  const [showSyncPrompt, setShowSyncPrompt] = useState(false);

  useEffect(() => {
    // Register Service Worker
    registerServiceWorker();

    const handleOnline = () => {
      setIsOffline(false);
    };

    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Register offline queue sync prompt
    const unregisterSync = registerOnlineSync((pending) => {
      setPendingTxs(pending);
      setShowSyncPrompt(true);
    });

    // Check pending txs initially
    getPendingTxs().then((pending) => {
      if (pending.length > 0 && navigator.onLine) {
        setPendingTxs(pending);
      }
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unregisterSync();
    };
  }, []);

  return (
    <>
      {children}

      {/* Offline Status Pill */}
      {isOffline && (
        <div className="fixed bottom-4 left-4 z-40 flex items-center gap-2 rounded-full bg-red-950/90 border border-red-500/30 px-3.5 py-1.5 text-xs text-red-200 shadow-xl backdrop-blur-md animate-fade-in">
          <WifiOff className="h-3.5 w-3.5 text-red-400" />
          <span className="font-medium">Air-Gap / Offline Mode Active</span>
        </div>
      )}

      {/* Online Sync Auto-Prompt */}
      {showSyncPrompt && pendingTxs.length > 0 && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-2xl bg-zinc-950 border border-amber-500/40 p-4 text-xs text-zinc-100 shadow-2xl backdrop-blur-md max-w-sm">
          <div className="rounded-xl bg-amber-500/10 p-2 text-amber-400 border border-amber-500/20 shrink-0">
            <Wifi className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-white flex items-center gap-1.5">
              Connection Restored
              <span className="rounded-full bg-amber-500/20 text-amber-300 px-1.5 py-0.2 text-[10px] font-mono">
                {pendingTxs.length} Queued
              </span>
            </h4>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              You have {pendingTxs.length} offline signed transaction{pendingTxs.length > 1 ? 's' : ''} ready to broadcast.
            </p>
            <div className="mt-2.5 flex items-center gap-2">
              <button
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('dot:open-queue'));
                  setShowSyncPrompt(false);
                }}
                className="rounded-lg bg-amber-500 px-3 py-1 font-semibold text-black hover:bg-amber-400 text-xs flex items-center gap-1"
              >
                Review & Broadcast
                <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setShowSyncPrompt(false)}
                className="text-zinc-500 hover:text-zinc-300 text-xs"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
