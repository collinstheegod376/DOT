'use client';

import React, { useState } from 'react';
import {
  Bell,
  Sun,
  Moon,
  Copy,
  Check,
  QrCode,
  ExternalLink,
  ChevronDown,
  Lock,
  Wifi,
  Shield,
} from 'lucide-react';
import { useWallet } from '@/context/WalletContext';
import { useTheme } from '@/context/ThemeContext';

interface ExecutiveNavProps {
  activeTab?: string;
  onSelectTab?: (tab: string) => void;
  onOpenSettings?: () => void;
  onViewQr?: (address: string) => void;
}

const NAV_ITEMS = [
  { id: 'Dashboard', label: 'DASHBOARD' },
  { id: 'Portfolio', label: 'PORTFOLIO' },
  { id: 'Prices', label: 'PRICES' },
  { id: 'Settings', label: 'SETTINGS' },
];

export function ExecutiveNav({
  activeTab = 'Dashboard',
  onSelectTab,
  onOpenSettings,
  onViewQr,
}: ExecutiveNavProps) {
  const {
    addresses,
    activeNetwork,
    setActiveNetwork,
    lockVault,
  } = useWallet();

  const { theme, toggleTheme } = useTheme();

  const [copied, setCopied] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [clusterDropdownOpen, setClusterDropdownOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const solAddress = addresses.solana?.address || '';
  const truncatedAddress =
    solAddress.length > 12
      ? `${solAddress.slice(0, 4)}...${solAddress.slice(-4)}`
      : solAddress || '8x...Vault';

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!solAddress) return;
    navigator.clipboard.writeText(solAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleQrClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (solAddress && onViewQr) {
      onViewQr(solAddress);
    }
  };

  const handleNavClick = (itemId: string) => {
    if (itemId === 'Settings') {
      onOpenSettings?.();
    } else {
      onSelectTab?.(itemId);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md border-b transition-colors duration-150 bg-white/90 dark:bg-black/90 border-zinc-200 dark:border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* LEFT: Monochromatic Brand Logo + DM Sans Uppercase Links */}
        <div className="flex items-center gap-6 lg:gap-8">
          {/* Rednit Brand Logo */}
          <div
            onClick={() => onSelectTab?.('Dashboard')}
            className="flex items-center gap-2.5 cursor-pointer select-none"
          >
            <div className="w-8 h-8 rounded-none border border-black dark:border-white bg-black dark:bg-white flex items-center justify-center">
              <span className="font-sans font-black text-xs text-white dark:text-black tracking-tighter">
                DOT
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-sans font-extrabold tracking-tight text-base sm:text-lg text-black dark:text-white uppercase">
                DOT
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-none border border-zinc-300 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 uppercase tracking-widest hidden sm:inline-block">
                SOLANA
              </span>
            </div>
          </div>

          {/* DM Sans Uppercase Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`px-3 py-1.5 rounded-none text-xs font-sans font-bold tracking-wider uppercase transition-colors cursor-pointer border ${
                    isActive
                      ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white'
                      : 'text-zinc-600 dark:text-zinc-400 border-transparent hover:border-zinc-300 dark:hover:border-zinc-800 hover:text-black dark:hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* RIGHT: Status Pill ("SOLANA MAINNET"), Theme Toggle, Address Button */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Notifications Icon (Sharp Rednit) */}
          <div className="relative">
            <button
              onClick={() => {
                setNotificationsOpen(!notificationsOpen);
                setClusterDropdownOpen(false);
                setUserMenuOpen(false);
              }}
              className="p-2 h-10 w-10 flex items-center justify-center rounded-none border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:border-black dark:hover:border-white transition-colors cursor-pointer relative"
              title="Notifications"
            >
              <Bell size={16} />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-none bg-emerald-500" />
            </button>

            {/* Notifications Popover */}
            {notificationsOpen && (
              <div className="absolute right-0 mt-1 w-72 sm:w-80 rounded-none bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 p-3 z-50 animate-in fade-in duration-100">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-200 dark:border-zinc-800">
                  <span className="text-xs font-bold font-sans tracking-wider text-black dark:text-white uppercase">
                    NOTIFICATIONS
                  </span>
                  <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded-none border border-emerald-500/30">
                    ALL CLEAR
                  </span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-none border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex items-start gap-2.5">
                    <Shield size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-black dark:text-white font-sans">Self-Custodial Vault Active</div>
                      <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 font-mono">
                        Keys generated and stored on your device. Zero server access.
                      </div>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-none border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex items-start gap-2.5">
                    <Wifi size={16} className="text-cyan-500 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-black dark:text-white font-sans">Solana Mainnet Linked</div>
                      <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 font-mono">
                        Real-time on-chain balance synchronization active.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Clean Status Pill: "SOLANA MAINNET" */}
          <div className="relative">
            <button
              onClick={() => {
                setClusterDropdownOpen(!clusterDropdownOpen);
                setNotificationsOpen(false);
                setUserMenuOpen(false);
              }}
              className="h-10 flex items-center gap-2 px-3 rounded-none bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 hover:border-black dark:hover:border-white text-xs font-mono font-medium text-black dark:text-white transition-colors cursor-pointer"
            >
              <div className="w-2 h-2 rounded-none bg-emerald-500 shrink-0" />
              <span className="font-mono tracking-wide uppercase text-[11px]">SOLANA MAINNET</span>
              <ChevronDown size={13} className="text-zinc-400" />
            </button>

            {/* Cluster Switcher Dropdown */}
            {clusterDropdownOpen && (
              <div className="absolute right-0 mt-1 w-56 rounded-none bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 p-1 z-50 animate-in fade-in duration-100">
                <div className="text-[10px] font-mono text-zinc-500 px-2.5 py-1 uppercase tracking-wider">
                  Network Cluster
                </div>
                {[
                  { id: 'Solana Mainnet-Beta', label: 'SOLANA MAINNET', desc: 'Production Network' },
                  { id: 'Solana Devnet', label: 'SOLANA DEVNET', desc: 'Testing Environment' },
                  { id: 'Solana Testnet', label: 'SOLANA TESTNET', desc: 'Validator Testbed' },
                ].map((net) => (
                  <button
                    key={net.id}
                    onClick={() => {
                      setActiveNetwork(net.id);
                      setClusterDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-none text-xs transition-colors cursor-pointer border ${
                      activeNetwork === net.id
                        ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white font-bold'
                        : 'border-transparent text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900'
                    }`}
                  >
                    <div className="text-left font-mono">
                      <div className="text-xs">{net.label}</div>
                      <div className="text-[10px] text-zinc-400">{net.desc}</div>
                    </div>
                    {activeNetwork === net.id && <Check size={14} />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Theme Toggle Button (Light / Dark) */}
          <button
            onClick={toggleTheme}
            className="h-10 w-10 flex items-center justify-center rounded-none border border-zinc-200 dark:border-zinc-800 hover:border-black dark:hover:border-white text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun size={16} className="text-zinc-300" />
            ) : (
              <Moon size={16} className="text-zinc-700" />
            )}
          </button>

          {/* Clean User Address Button with Copy */}
          <div className="relative">
            <div
              onClick={() => {
                setUserMenuOpen(!userMenuOpen);
                setNotificationsOpen(false);
                setClusterDropdownOpen(false);
              }}
              className="h-10 flex items-center gap-2 px-2.5 rounded-none bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 hover:border-black dark:hover:border-white transition-colors cursor-pointer select-none"
            >
              {/* Address initials block */}
              <div className="w-5 h-5 rounded-none bg-black text-white dark:bg-white dark:text-black flex items-center justify-center font-mono font-bold text-[10px]">
                {solAddress ? solAddress.slice(0, 2).toUpperCase() : 'VA'}
              </div>

              {/* Truncated address */}
              <span className="text-xs font-mono font-semibold text-black dark:text-white">
                {truncatedAddress}
              </span>

              {/* Copy trigger button */}
              <button
                onClick={handleCopy}
                className="p-1 rounded-none text-zinc-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
                title="Copy Address"
              >
                {copied ? (
                  <Check size={13} className="text-emerald-500" />
                ) : (
                  <Copy size={13} />
                )}
              </button>

              {/* QR trigger button */}
              <button
                onClick={handleQrClick}
                className="p-1 rounded-none text-zinc-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer hidden sm:inline-flex"
                title="View QR Code"
              >
                <QrCode size={13} />
              </button>
            </div>

            {/* User Menu Dropdown */}
            {userMenuOpen && (
              <div className="absolute right-0 mt-1 w-64 rounded-none bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 p-2 z-50 animate-in fade-in duration-100">
                <div className="p-2 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 mb-2 font-mono text-[11px] break-all select-all text-zinc-700 dark:text-zinc-300">
                  {solAddress || 'No address loaded'}
                </div>

                <button
                  onClick={() => {
                    handleQrClick({ stopPropagation: () => {} } as React.MouseEvent);
                    setUserMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-none text-xs text-black dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer font-sans"
                >
                  <QrCode size={14} />
                  <span>Show Address QR</span>
                </button>

                {solAddress && (
                  <a
                    href={`https://solscan.io/account/${solAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-none text-xs text-black dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors font-sans"
                  >
                    <ExternalLink size={14} />
                    <span>View on Solscan</span>
                  </a>
                )}

                {onOpenSettings && (
                  <button
                    onClick={() => {
                      onOpenSettings();
                      setUserMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-none text-xs text-black dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer font-sans"
                  >
                    <Shield size={14} />
                    <span>Backup & Security</span>
                  </button>
                )}

                <div className="border-t border-zinc-200 dark:border-zinc-800 my-1" />

                <button
                  onClick={() => {
                    lockVault();
                    setUserMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-none text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors cursor-pointer font-sans font-bold"
                >
                  <Lock size={14} />
                  <span>Lock Vault</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
