'use client';

import React, { useState } from 'react';
import {
  X,
  Shield,
  Download,
  Fingerprint,
  Lock,
  Trash2,
  FileCode,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { useWallet } from '@/context/WalletContext';
import { downloadDot1File } from '@/lib/crypto';
import { SUPPORTED_CHAINS } from '@/lib/constants';

interface SettingsBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsBackupModal({ isOpen, onClose }: SettingsBackupModalProps) {
  const {
    latestEnvelope,
    selectedChains,
    hasPasskey,
    hasPasswordFallback,
    lockVault,
    resetVault,
  } = useWallet();

  const [downloaded, setDownloaded] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  if (!isOpen) return null;

  const handleDownload = () => {
    if (!latestEnvelope) return;
    downloadDot1File(latestEnvelope, `dot-offline-vault-${Date.now()}.dot1`);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 3000);
  };

  const handleReset = async () => {
    setIsResetting(true);
    try {
      await resetVault();
      onClose();
    } catch (err) {
      console.error(err);
      setIsResetting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-none bg-white dark:bg-[#16161E] border border-black dark:border-[#353536] p-6 md:p-8 shadow-none max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-none border border-black dark:border-white bg-black dark:bg-white text-white dark:text-black flex items-center justify-center">
              <Shield size={16} />
            </div>
            <div>
              <h3 className="text-base font-sans font-[900] tracking-tighter uppercase text-black dark:text-white">
                Offline Vault Security & Backup
              </h3>
              <div className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Hardware & Offline Vault Management
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-none border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:border-black dark:border-zinc-800 dark:hover:border-white transition cursor-pointer"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Security Status Badges */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="p-4 rounded-none bg-white dark:bg-[#16161E] border border-black dark:border-[#353536]">
            <div className="flex items-center gap-2 text-xs font-sans font-bold uppercase tracking-wider text-black dark:text-white mb-2">
              <Fingerprint size={16} />
              <span>Biometric Passkey</span>
            </div>
            <div className="text-xs font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 font-bold uppercase">
              <span className="w-1.5 h-1.5 rounded-none bg-emerald-500" />
              <span>{hasPasskey ? 'Hardware Bound' : 'Available'}</span>
            </div>
          </div>

          <div className="p-4 rounded-none bg-white dark:bg-[#16161E] border border-black dark:border-[#353536]">
            <div className="flex items-center gap-2 text-xs font-sans font-bold uppercase tracking-wider text-black dark:text-white mb-2">
              <Lock size={16} />
              <span>Security Password</span>
            </div>
            <div className="text-xs font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 font-bold uppercase">
              <span className="w-1.5 h-1.5 rounded-none bg-emerald-500" />
              <span>{hasPasswordFallback ? 'Encrypted Vault Active' : 'Not Set'}</span>
            </div>
          </div>
        </div>

        {/* Primary Backup Section */}
        <div className="p-5 rounded-none bg-white dark:bg-[#16161E] border border-black dark:border-[#353536] mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-none border border-black dark:border-white bg-black dark:bg-white text-white dark:text-black flex items-center justify-center">
              <FileCode size={20} />
            </div>
            <div>
              <h4 className="text-sm font-sans font-[900] tracking-tighter uppercase text-black dark:text-white">
                Export Encrypted Backup File (.dot1)
              </h4>
              <div className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
                Zero-server client-encrypted Offline Vault
              </div>
            </div>
          </div>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 my-4 leading-relaxed font-sans">
            Download your latest Offline Vault backup. Protected with high-grade device encryption using your Security Password. Safe to store in Google Drive, iCloud, or a flash drive.
          </p>

          <button
            onClick={handleDownload}
            disabled={!latestEnvelope}
            className="w-full flex items-center justify-center gap-2 bg-black text-white dark:bg-white dark:text-black border border-black dark:border-white h-12 uppercase font-sans font-bold text-xs tracking-wider rounded-none hover:opacity-85 disabled:opacity-50 transition cursor-pointer"
          >
            {downloaded ? (
              <>
                <CheckCircle2 size={16} />
                <span>Downloaded Backup File (.dot1)</span>
              </>
            ) : (
              <>
                <Download size={16} />
                <span>Download Encrypted Backup (.dot1)</span>
              </>
            )}
          </button>
        </div>

        {/* Account Reference Standards */}
        <div className="p-4 rounded-none bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 mb-6">
          <h4 className="text-xs font-sans font-bold text-black dark:text-white uppercase tracking-wider mb-2">
            Solana Account Architecture
          </h4>
          <div className="space-y-1.5 text-xs font-mono">
            {selectedChains.map((id) => (
              <div
                key={id}
                className="flex justify-between py-1.5 border-b border-zinc-200 dark:border-zinc-800 last:border-0"
              >
                <span className="text-zinc-500 dark:text-zinc-400">{SUPPORTED_CHAINS[id]?.name || 'Solana'} Standard:</span>
                <span className="text-black dark:text-white font-bold">Solana Account</span>
              </div>
            ))}
          </div>
        </div>

        {/* Danger Zone */}
        <div className="p-4 rounded-none bg-red-50/50 dark:bg-red-950/20 border border-red-600 space-y-4">
          <div className="flex items-center gap-2 text-xs font-sans font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">
            <AlertTriangle size={14} />
            <span>Danger Zone</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => {
                lockVault();
                onClose();
              }}
              className="flex-1 h-12 flex items-center justify-center gap-2 bg-transparent text-black dark:text-white border border-black dark:border-white uppercase font-sans font-bold text-xs tracking-wider rounded-none hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition cursor-pointer"
            >
              Lock Vault Now
            </button>

            {!showResetConfirm ? (
              <button
                onClick={() => setShowResetConfirm(true)}
                className="flex-1 h-12 flex items-center justify-center gap-2 bg-transparent text-red-600 dark:text-red-400 border border-red-600 uppercase font-sans font-bold text-xs tracking-wider rounded-none hover:bg-red-600 hover:text-white dark:hover:bg-red-600 dark:hover:text-white transition cursor-pointer"
              >
                Reset Vault
              </button>
            ) : (
              <button
                onClick={handleReset}
                disabled={isResetting}
                className="flex-1 h-12 flex items-center justify-center gap-2 bg-red-600 text-white border border-red-600 uppercase font-sans font-bold text-xs tracking-wider rounded-none hover:opacity-85 transition cursor-pointer"
              >
                {isResetting ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <Trash2 size={14} />
                )}
                <span>Confirm Purge Storage</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
