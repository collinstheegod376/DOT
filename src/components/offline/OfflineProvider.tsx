'use client';

import React, { useEffect, useState } from 'react';
import { Wifi, ArrowUpRight } from 'lucide-react';
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

      {/* Online Sync Auto-Prompt */}
      {showSyncPrompt && pendingTxs.length > 0 && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-none bg-white border border-black p-4 text-xs text-black shadow-2xl max-w-sm font-sans">
          <div className="rounded-none bg-[#F7F7F7] p-2 text-black border border-black shrink-0">
            <Wifi className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h4 className="font-sans font-black text-black text-xs uppercase flex items-center gap-1.5 tracking-wider">
              CONNECTION RESTORED
              <span className="rounded-none bg-black text-white px-1.5 py-0.5 text-[10px] font-mono">
                {pendingTxs.length} QUEUED
              </span>
            </h4>
            <p className="text-[11px] text-zinc-600 font-mono mt-0.5">
              You have {pendingTxs.length} offline signed transaction{pendingTxs.length > 1 ? 's' : ''} ready to broadcast.
            </p>
            <div className="mt-2.5 flex items-center gap-2">
              <button
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('dot:open-queue'));
                  setShowSyncPrompt(false);
                }}
                className="rounded-none bg-black px-3 py-1.5 font-sans font-black text-white hover:opacity-90 text-xs flex items-center gap-1 border border-black uppercase tracking-wider cursor-pointer transition"
              >
                <span>Review & Broadcast</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setShowSyncPrompt(false)}
                className="text-zinc-500 hover:text-black text-xs font-mono uppercase cursor-pointer transition"
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
