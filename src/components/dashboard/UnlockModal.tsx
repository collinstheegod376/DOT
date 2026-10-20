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
        setError('Passkey verification failed or was cancelled. Try password fallback.');
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
        setError('Incorrect password or unable to decrypt envelope.');
      }
    } catch {
      setError('Failed to decrypt vault.');
    } finally {
      setIsUnlockingPassword(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl bg-[#0F0F14] border border-[#1F1F24] p-6 md:p-8 shadow-2xl shadow-cyan-500/10 text-center">
        {/* Emblem */}
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-tr from-cyan-950 via-[#12121E] to-emerald-950 border border-cyan-500/30 flex items-center justify-center text-cyan-400 glow-cyan">
          <Lock size={28} />
        </div>

        <h2 className="text-xl font-bold text-white mb-1">Vault Locked</h2>
        <p className="text-xs text-zinc-400 mb-6 max-w-xs mx-auto">
          Cryptographic keys are purged from session memory. Authenticate with your Passkey or Password.
        </p>

        {/* Primary Biometric Unlock */}
        <div className="space-y-4 mb-6">
          <button
            onClick={handlePasskeyUnlock}
            disabled={isUnlockingPasskey}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-xs font-semibold bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black shadow-lg shadow-cyan-500/20 transition cursor-pointer"
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

          <div className="flex items-center gap-3 text-xs text-zinc-500">
            <div className="flex-1 h-px bg-zinc-800" />
            <span className="font-mono text-[10px] uppercase">OR FALLBACK</span>
            <div className="flex-1 h-px bg-zinc-800" />
          </div>

          {/* Fallback Password Input */}
          <form onSubmit={handlePasswordUnlock} className="space-y-3">
            <input
              type="password"
              placeholder="Enter Argon2id fallback password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[#14141C] border border-[#272732] text-zinc-200 text-sm focus:outline-none focus:border-cyan-400 font-mono"
            />

            <button
              type="submit"
              disabled={isUnlockingPassword || !password}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold bg-[#1A1A26] hover:bg-[#222232] text-zinc-200 border border-[#272732] transition cursor-pointer disabled:opacity-40"
            >
              {isUnlockingPassword ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Decrypting Argon2id...</span>
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
          <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/50 flex items-center gap-2 text-xs text-red-300 text-left mb-4">
            <AlertTriangle size={16} className="text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Reset option */}
        <div className="pt-2 border-t border-[#1F1F24]">
          <button
            onClick={resetVault}
            className="text-[11px] font-mono text-zinc-500 hover:text-red-400 transition cursor-pointer"
          >
            Forgot Password? Reset and Restore from Backup
          </button>
        </div>
      </div>
    </div>
  );
}
