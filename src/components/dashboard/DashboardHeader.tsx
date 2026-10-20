'use client';

import React, { useState } from 'react';
import {
  Shield,
  Wifi,
  WifiOff,
  Lock,
  Settings,
  ChevronDown,
  Check,
  Radio,
} from 'lucide-react';
import { useWallet } from '@/context/WalletContext';

interface DashboardHeaderProps {
  onOpenSettings: () => void;
}

const NETWORKS = [
  { id: 'Ethereum Mainnet', name: 'Ethereum Mainnet', badge: 'EVM', color: '#627EEA' },
  { id: 'Arbitrum One', name: 'Arbitrum One', badge: 'L2', color: '#28A0F0' },
  { id: 'Base', name: 'Base', badge: 'L2', color: '#0052FF' },
  { id: 'Optimism', name: 'Optimism', badge: 'L2', color: '#FF0420' },
  { id: 'Bitcoin Mainnet', name: 'Bitcoin Mainnet', badge: 'SegWit', color: '#F7931A' },
  { id: 'Solana Mainnet', name: 'Solana Mainnet', badge: 'SVM', color: '#14F195' },
];

export function DashboardHeader({ onOpenSettings }: DashboardHeaderProps) {
  const { isOnline, isAirGapSimulated, toggleAirGapMode, activeNetwork, setActiveNetwork, lockVault } = useWallet();
  const [networkDropdownOpen, setNetworkDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 w-full backdrop-blur-xl bg-[#0A0A0C]/85 border-b border-[#1F1F24] px-4 py-3 md:py-4">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
        {/* Logo and Brand */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-gradient-to-tr from-cyan-950 via-[#12121A] to-emerald-950 border border-cyan-500/30 flex items-center justify-center glow-cyan">
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-white text-base md:text-lg">DOT</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-800/40 text-cyan-300 hidden sm:inline-block">
                VAULT 1.0
              </span>
            </div>
            <div className="text-[10px] font-mono text-zinc-500 hidden sm:block">
              Zero-Server • Hardware Bound
            </div>
          </div>
        </div>

        {/* Right Action Cluster */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Network Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setNetworkDropdownOpen(!networkDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#14141C] border border-[#272732] hover:border-zinc-700 text-xs font-medium text-zinc-200 transition cursor-pointer"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="max-w-[100px] sm:max-w-[140px] truncate">{activeNetwork}</span>
              <ChevronDown size={14} className="text-zinc-400" />
            </button>

            {networkDropdownOpen && (
              <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-[#0F0F14] border border-[#272732] shadow-2xl p-1.5 z-50 animate-in fade-in duration-150">
                <div className="text-[10px] font-mono text-zinc-500 px-2 py-1 uppercase tracking-wider">
                  Active Network
                </div>
                {NETWORKS.map((net) => (
                  <button
                    key={net.id}
                    onClick={() => {
                      setActiveNetwork(net.id);
                      setNetworkDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition cursor-pointer ${
                      activeNetwork === net.id
                        ? 'bg-cyan-500/15 text-cyan-300 font-semibold'
                        : 'text-zinc-300 hover:bg-[#1A1A24]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: net.color }} />
                      <span>{net.name}</span>
                    </div>
                    {activeNetwork === net.id && <Check size={14} className="text-cyan-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Online / Air-Gap Mode Badge (Interactive test toggle) */}
          <button
            onClick={toggleAirGapMode}
            title={
              isOnline
                ? 'Wallet is ONLINE. Click to toggle Air-Gap Offline mode for testing.'
                : 'Wallet is OFFLINE / AIR-GAP. Transactions will be queued offline.'
            }
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-mono transition cursor-pointer ${
              isOnline
                ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-400 hover:bg-emerald-900/30'
                : 'bg-cyan-950/40 border-cyan-500/50 text-cyan-300 shadow-[0_0_12px_rgba(0,240,255,0.15)]'
            }`}
          >
            {isOnline ? (
              <>
                <Wifi size={13} />
                <span className="hidden sm:inline">Online</span>
              </>
            ) : (
              <>
                <Radio size={13} className="text-cyan-400 animate-pulse" />
                <span className="hidden sm:inline">Air-Gap Mode</span>
              </>
            )}
          </button>

          {/* Lock Vault Button */}
          <button
            onClick={lockVault}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#14141C] border border-[#272732] hover:border-zinc-700 text-zinc-300 text-xs font-medium transition cursor-pointer"
            title="Lock Vault (Clears secrets from session memory)"
          >
            <Lock size={14} className="text-amber-400" />
            <span className="hidden md:inline">Lock</span>
          </button>

          {/* Settings / Backup Button */}
          <button
            onClick={onOpenSettings}
            className="p-1.5 rounded-xl bg-[#14141C] border border-[#272732] hover:border-zinc-700 text-zinc-300 hover:text-white transition cursor-pointer"
            title="Settings & Backup"
          >
            <Settings size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
