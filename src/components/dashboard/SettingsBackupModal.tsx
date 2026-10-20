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
    downloadDot1File(latestEnvelope, `dot-vault-envelope-${Date.now()}.dot1`);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-[#0F0F14] border border-[#1F1F24] p-6 md:p-8 shadow-2xl shadow-black/90 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#1F1F24] mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-950/60 border border-cyan-700/50 flex items-center justify-center text-cyan-400">
              <Shield size={16} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Vault Security & Backup</h3>
              <div className="text-[11px] font-mono text-zinc-400">Hardware & Envelope Management</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Security Status Badges */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="p-3.5 rounded-2xl bg-[#14141E] border border-[#1F1F24]">
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200 mb-1">
              <Fingerprint size={16} className="text-cyan-400" />
              <span>Biometric Passkey</span>
            </div>
            <div className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
              <CheckCircle2 size={12} />
              <span>{hasPasskey ? 'Hardware Bound' : 'Available'}</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#14141E] border border-[#1F1F24]">
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200 mb-1">
              <Lock size={16} className="text-amber-400" />
              <span>Security Password</span>
            </div>
            <div className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
              <CheckCircle2 size={12} />
              <span>{hasPasswordFallback ? 'Encrypted Envelope' : 'Not Set'}</span>
            </div>
          </div>
        </div>

        {/* Primary Backup Section */}
        <div className="p-5 rounded-2xl bg-[#12151D] border border-cyan-500/40 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-cyan-950/60 border border-cyan-700/50 flex items-center justify-center text-cyan-400">
              <FileCode size={20} />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-zinc-100">Export Encrypted `.dot1` Envelope</h4>
              <div className="text-xs text-zinc-400">Zero-server client-encrypted backup</div>
            </div>
          </div>
          <p className="text-xs text-zinc-300 my-3 leading-relaxed">
            Download your latest vault backup. Protected with high-grade device encryption. Safe to store in Google Drive, iCloud, or a flash drive.
          </p>

          <button
            onClick={handleDownload}
            disabled={!latestEnvelope}
            className="w-full py-3 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-black shadow-lg shadow-cyan-500/20 transition cursor-pointer"
          >
            {downloaded ? (
              <>
                <CheckCircle2 size={16} />
                <span>Downloaded Backup File</span>
              </>
            ) : (
              <>
                <Download size={16} />
                <span>Download .dot1 Envelope</span>
              </>
            )}
          </button>
        </div>

        {/* Network Account Reference */}
        <div className="p-4 rounded-2xl bg-[#121218] border border-[#1F1F24] mb-6">
          <h4 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2 font-mono">
            Network Account Standards
          </h4>
          <div className="space-y-1.5 text-xs font-mono">
            {selectedChains.map((id) => (
              <div key={id} className="flex justify-between py-1 border-b border-zinc-800/60 last:border-0">
                <span className="text-zinc-400">{SUPPORTED_CHAINS[id].name}:</span>
                <span className="text-cyan-400">{SUPPORTED_CHAINS[id].derivationPath}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Danger Zone */}
        <div className="p-4 rounded-2xl bg-red-950/20 border border-red-900/40 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-red-400 uppercase tracking-wider font-mono">
            <AlertTriangle size={14} />
            <span>Danger Zone</span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                lockVault();
                onClose();
              }}
              className="flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold bg-[#1C1215] border border-red-800/40 text-red-300 hover:bg-red-950/40 transition cursor-pointer"
            >
              Lock Vault Now
            </button>

            {!showResetConfirm ? (
              <button
                onClick={() => setShowResetConfirm(true)}
                className="flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold bg-red-600/20 border border-red-600/40 text-red-300 hover:bg-red-600/30 transition cursor-pointer"
              >
                Reset Vault
              </button>
            ) : (
              <button
                onClick={handleReset}
                disabled={isResetting}
                className="flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-500 text-white transition cursor-pointer flex items-center justify-center gap-1.5"
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
