'use client';

import React, { useState } from 'react';
import {
  Shield,
  Wifi,
  Lock,
  Settings,
  ChevronDown,
  Check,
  Radio,
  RefreshCw,
  Sun,
  Moon,
} from 'lucide-react';
import { useWallet } from '@/context/WalletContext';
import { useTheme } from '@/context/ThemeContext';

interface DashboardHeaderProps {
  onOpenSettings: () => void;
}

const SOLANA_NETWORKS = [
  {
    id: 'Solana Mainnet-Beta',
    name: 'Solana Mainnet-Beta',
    badge: 'Mainnet',
    color: '#14F195',
    description: 'Production SVM ledger',
  },
  {
    id: 'Solana Devnet',
    name: 'Solana Devnet',
    badge: 'Devnet',
    color: '#A855F7',
    description: 'Developer test network',
  },
  {
    id: 'Solana Testnet',
    name: 'Solana Testnet',
    badge: 'Testnet',
    color: '#06B6D4',
    description: 'Validator stress testbed',
  },
];

export function DashboardHeader({ onOpenSettings }: DashboardHeaderProps) {
  const {
    isOnline,
    isAirGapSimulated,
    toggleAirGapMode,
    activeNetwork,
    setActiveNetwork,
    lockVault,
    isRefreshingBalances,
    refreshBalances,
  } = useWallet();
  const { theme, toggleTheme, isDark } = useTheme();
  const [networkDropdownOpen, setNetworkDropdownOpen] = useState(false);

  const currentNet =
    SOLANA_NETWORKS.find((n) => n.id === activeNetwork) || SOLANA_NETWORKS[0];

  return (
    <header className="sticky top-0 z-30 w-full backdrop-blur-xl bg-[var(--header-bg)] border-b border-[var(--header-border)] px-4 py-3 md:py-3.5 transition-colors">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
        {/* Logo and Brand */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-gradient-to-tr from-emerald-950 via-[#12141C] to-cyan-950 border border-emerald-500/30 flex items-center justify-center shadow-[0_0_12px_rgba(20,241,149,0.15)]">
            <div className="w-2.5 h-2.5 rounded-full bg-[#14F195] shadow-[0_0_8px_#14F195]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-white text-base md:text-lg">DOT</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-800/40 text-emerald-300 hidden sm:inline-block">
                SOLANA VAULT
              </span>
            </div>
            <div className="text-[10px] font-mono text-zinc-500 hidden sm:block">
              Self-Custodial • Device Protected
            </div>
          </div>
        </div>

        {/* Right Action Cluster */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Solana Network Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setNetworkDropdownOpen(!networkDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#14141C] border border-[#272732] hover:border-zinc-700 text-xs font-medium text-zinc-200 transition cursor-pointer"
            >
              <div
                className="w-2 h-2 rounded-full shadow-[0_0_6px_currentColor]"
                style={{ backgroundColor: currentNet.color, color: currentNet.color }}
              />
              <span className="max-w-[110px] sm:max-w-[150px] truncate">{currentNet.name}</span>
              <ChevronDown size={14} className="text-zinc-400" />
            </button>

            {networkDropdownOpen && (
              <div className="absolute right-0 mt-2 w-60 rounded-2xl bg-[#0F0F14] border border-[#272732] shadow-2xl p-1.5 z-50 animate-in fade-in duration-150">
                <div className="text-[10px] font-mono text-zinc-500 px-2 py-1 uppercase tracking-wider">
                  Solana Cluster
                </div>
                {SOLANA_NETWORKS.map((net) => (
                  <button
                    key={net.id}
                    onClick={() => {
                      setActiveNetwork(net.id);
                      setNetworkDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition cursor-pointer ${
                      activeNetwork === net.id
                        ? 'bg-emerald-500/15 text-emerald-300 font-semibold'
                        : 'text-zinc-300 hover:bg-[#1A1A24]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 text-left">
                      <div
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: net.color }}
                      />
                      <div>
                        <div className="font-medium text-xs text-white">{net.name}</div>
                        <div className="text-[10px] text-zinc-500">{net.description}</div>
                      </div>
                    </div>
                    {activeNetwork === net.id && <Check size={14} className="text-[#14F195]" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Refresh Balances Button */}
          <button
            onClick={refreshBalances}
            disabled={isRefreshingBalances || !isOnline}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#14141C] border border-[#272732] hover:border-zinc-700 text-zinc-300 hover:text-white text-xs font-medium transition cursor-pointer disabled:opacity-50"
            title={isOnline ? 'Refresh On-Chain Balances & Token Rates' : 'Wallet offline'}
          >
            <RefreshCw
              size={13}
              className={isRefreshingBalances ? 'animate-spin text-[#14F195]' : 'text-zinc-400'}
            />
            <span className="hidden lg:inline">{isRefreshingBalances ? 'Syncing...' : 'Sync'}</span>
          </button>

          {/* Online / Air-Gap Mode Badge */}
          <button
            onClick={toggleAirGapMode}
            title={
              isOnline
                ? 'Wallet is ONLINE. Click to toggle Air-Gap Offline mode for simulation.'
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
                <span className="hidden sm:inline">Air-Gap</span>
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

          {/* Theme Toggle Button (Light/Dark Mode) */}
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] hover:border-zinc-500 text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-medium transition cursor-pointer shadow-sm"
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle Theme"
          >
            {isDark ? (
              <>
                <Sun size={15} className="text-amber-400" />
                <span className="hidden xl:inline ml-1.5 text-[11px] font-mono">Light</span>
              </>
            ) : (
              <>
                <Moon size={15} className="text-blue-500" />
                <span className="hidden xl:inline ml-1.5 text-[11px] font-mono">Dark</span>
              </>
            )}
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
