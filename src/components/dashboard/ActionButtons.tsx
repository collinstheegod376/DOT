'use client';

import React from 'react';
import { ArrowUpRight, ArrowDownLeft, Radio, Shield, HardDrive } from 'lucide-react';

interface ActionButtonsProps {
  onOpenSend: () => void;
  onOpenReceive: () => void;
  onOpenAirGap: () => void;
  onOpenSettings: () => void;
}

export function ActionButtons({
  onOpenSend,
  onOpenReceive,
  onOpenAirGap,
  onOpenSettings,
}: ActionButtonsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {/* Send */}
      <button
        onClick={onOpenSend}
        className="flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-2xl font-semibold text-xs bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black shadow-lg shadow-cyan-500/15 transition cursor-pointer"
      >
        <ArrowUpRight size={17} strokeWidth={2.5} />
        <span>Send Funds</span>
      </button>

      {/* Receive */}
      <button
        onClick={onOpenReceive}
        className="flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-2xl font-semibold text-xs bg-[#14141E] hover:bg-[#1A1A28] text-white border border-[#272736] transition cursor-pointer"
      >
        <ArrowDownLeft size={17} className="text-emerald-400" strokeWidth={2.5} />
        <span>Receive Assets</span>
      </button>

      {/* Air-Gap Sign */}
      <button
        onClick={onOpenAirGap}
        className="flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-2xl font-semibold text-xs bg-cyan-950/30 hover:bg-cyan-900/40 text-cyan-300 border border-cyan-800/50 shadow-md shadow-cyan-500/5 transition cursor-pointer"
      >
        <Radio size={17} className="text-cyan-400" />
        <span>Air-Gap Sign</span>
      </button>

      {/* Settings / Backup */}
      <button
        onClick={onOpenSettings}
        className="flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-2xl font-semibold text-xs bg-[#14141E] hover:bg-[#1A1A28] text-zinc-300 border border-[#272736] transition cursor-pointer"
      >
        <Shield size={17} className="text-amber-400" />
        <span>Backup Vault</span>
      </button>
    </div>
  );
}
