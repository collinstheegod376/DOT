'use client';

import React, { useState } from 'react';
import { Fingerprint, Lock, RefreshCw, AlertTriangle, ArrowRight } from 'lucide-react';
import { useWallet } from '@/context/WalletContext';

export function UnlockModal() {
  const { isLocked, unlockWithPasskey, unlockWithPassword, resetVault } = useWallet();
  const [password, setPassword] = useState('');
  const [isUnlockingPasskey, setIsUnlockingPasskey] = useState(false);
  const [isUnlockingPassword, setIsUnlockingPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isLocked) return null;

  const handlePasskeyUnlock = async () => {
    setError(null);
    setIsUnlockingPasskey(true);
    try {
      const ok = await unlockWithPasskey();
      if (!ok) {
        setError('Passkey verification failed or was cancelled. Try security password fallback.');
      }
    } catch {
      setError('Biometric authentication failed.');
    } finally {
      setIsUnlockingPasskey(false);
    }
  };

  const handlePasswordUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    setError(null);
    setIsUnlockingPassword(true);
    try {
      const ok = await unlockWithPassword(password);
      if (!ok) {
        setError('Incorrect password or unable to decrypt Offline Vault.');
      }
    } catch {
      setError('Failed to unlock Offline Vault.');
    } finally {
      setIsUnlockingPassword(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-none bg-white dark:bg-[#16161E] border border-black dark:border-[#353536] p-6 md:p-8 shadow-none text-center">
        {/* Emblem */}
        <div className="w-14 h-14 mx-auto mb-4 rounded-none border border-black dark:border-white bg-black dark:bg-white text-white dark:text-black flex items-center justify-center">
          <Lock size={24} />
        </div>

        <h2 className="text-2xl font-sans font-[900] tracking-tighter uppercase text-black dark:text-white mb-2">
          Offline Vault Locked
        </h2>
        <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-6 max-w-xs mx-auto leading-relaxed">
          Cryptographic keys are purged from session memory. Authenticate with your Passkey or Security Password.
        </p>

        {/* Primary Biometric Unlock */}
        <div className="space-y-4 mb-6">
          <button
            onClick={handlePasskeyUnlock}
            disabled={isUnlockingPasskey}
            className="w-full flex items-center justify-center gap-2 bg-black text-white dark:bg-white dark:text-black border border-black dark:border-white h-12 uppercase font-sans font-bold text-xs tracking-wider rounded-none hover:opacity-85 transition cursor-pointer disabled:opacity-40"
          >
            {isUnlockingPasskey ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                <span>Verifying Biometric Passkey...</span>
              </>
            ) : (
              <>
                <Fingerprint size={18} />
                <span>Unlock with Biometric Passkey</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-3 my-4 text-xs text-zinc-400">
            <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800" />
            <span className="font-sans font-bold text-[10px] tracking-widest uppercase">
              OR FALLBACK
            </span>
            <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800" />
          </div>

          {/* Fallback Password Input */}
          <form onSubmit={handlePasswordUnlock} className="space-y-3">
            <div className="text-left">
              <label className="block text-xs uppercase font-sans font-bold tracking-wider text-black dark:text-white mb-2">
                Security Password
              </label>
              <input
                type="password"
                placeholder="Enter security password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 h-12 rounded-none bg-transparent border border-black dark:border-white text-black dark:text-white font-mono text-xs focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
              />
            </div>

            <button
              type="submit"
              disabled={isUnlockingPassword || !password}
              className="w-full flex items-center justify-center gap-2 bg-transparent text-black dark:text-white border border-black dark:border-white h-12 uppercase font-sans font-bold text-xs tracking-wider rounded-none hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition cursor-pointer disabled:opacity-40"
            >
              {isUnlockingPassword ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Unlocking Offline Vault...</span>
                </>
              ) : (
                <>
                  <span>Unlock with Password</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>
        </div>

        {error && (
          <div className="p-3.5 rounded-none bg-red-50 dark:bg-red-950/20 border border-red-600 flex items-center gap-2 text-xs font-mono text-red-600 dark:text-red-400 text-left mb-4">
            <AlertTriangle size={16} className="text-red-600 dark:text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Reset option */}
        <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <button
            onClick={resetVault}
            className="text-xs font-sans font-bold uppercase tracking-wider text-zinc-500 hover:text-red-600 dark:hover:text-red-400 transition cursor-pointer"
          >
            Forgot Password? Reset and Restore from Backup
          </button>
        </div>
      </div>
    </div>
  );
}
