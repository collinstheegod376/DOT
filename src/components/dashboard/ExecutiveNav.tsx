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
    <header className="sticky top-0 z-40 w-full backdrop-blur-md border-b transition-colors duration-150 bg-white/95 dark:bg-[#0F0F10]/95 border-black dark:border-[#353536]">
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
              <span className="font-sans font-black tracking-tight text-base sm:text-lg text-black dark:text-white uppercase">
                DOT
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-none border border-black dark:border-[#353536] text-black dark:text-white uppercase tracking-widest hidden sm:inline-block">
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
                      : 'text-zinc-600 dark:text-zinc-400 border-transparent hover:border-black dark:hover:border-[#353536] hover:text-black dark:hover:text-white'
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
              className="p-2 h-10 w-10 flex items-center justify-center rounded-none border border-black dark:border-[#353536] text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:border-black dark:hover:border-white transition-colors cursor-pointer relative"
              title="Notifications"
            >
              <Bell size={16} />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-none bg-black dark:bg-white" />
            </button>

            {/* Notifications Popover */}
            {notificationsOpen && (
              <div className="absolute right-0 mt-1 w-72 sm:w-80 rounded-none bg-white dark:bg-[#0F0F10] border border-black dark:border-[#353536] p-3 z-50 animate-in fade-in duration-100">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-black dark:border-[#353536]">
                  <span className="text-xs font-sans font-black tracking-wider text-black dark:text-white uppercase">
                    NOTIFICATIONS
                  </span>
                  <span className="text-[10px] font-mono text-black dark:text-white px-1.5 py-0.5 rounded-none border border-black dark:border-[#353536] uppercase tracking-wider font-bold">
                    SYSTEM SECURE
                  </span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-none border border-black/10 dark:border-[#353536] bg-[#F7F7F7] dark:bg-[#1D1D1E] flex items-start gap-2.5">
                    <Shield size={16} className="text-black dark:text-white shrink-0 mt-0.5" />
                    <div>
                      <div className="font-sans font-bold text-black dark:text-white uppercase tracking-wider text-[11px]">Sovereign Vault Active</div>
                      <div className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-0.5 font-mono">
                        Hardware-isolated keys stored on device. Zero external access.
                      </div>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-none border border-black/10 dark:border-[#353536] bg-[#F7F7F7] dark:bg-[#1D1D1E] flex items-start gap-2.5">
                    <Wifi size={16} className="text-black dark:text-white shrink-0 mt-0.5" />
                    <div>
                      <div className="font-sans font-bold text-black dark:text-white uppercase tracking-wider text-[11px]">Solana Mainnet Linked</div>
                      <div className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-0.5 font-mono">
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
              className="h-10 flex items-center gap-2 px-3 rounded-none bg-white dark:bg-[#0F0F10] border border-black dark:border-[#353536] hover:border-black dark:hover:border-white text-xs font-mono font-medium text-black dark:text-white transition-colors cursor-pointer"
            >
              <div className="w-2 h-2 rounded-none bg-black dark:bg-white shrink-0" />
              <span className="font-mono tracking-wide uppercase text-[11px] font-bold">SOLANA MAINNET</span>
              <ChevronDown size={13} className="text-zinc-400" />
            </button>

            {/* Cluster Switcher Dropdown */}
            {clusterDropdownOpen && (
              <div className="absolute right-0 mt-1 w-56 rounded-none bg-white dark:bg-[#0F0F10] border border-black dark:border-[#353536] p-1 z-50 animate-in fade-in duration-100">
                <div className="text-[10px] font-mono text-zinc-500 px-2.5 py-1 uppercase tracking-wider font-bold">
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
                        : 'border-transparent text-zinc-700 dark:text-zinc-300 hover:bg-[#F7F7F7] dark:hover:bg-[#1D1D1E]'
                    }`}
                  >
                    <div className="text-left font-mono">
                      <div className="text-xs font-bold">{net.label}</div>
                      <div className="text-[10px] text-zinc-500">{net.desc}</div>
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
            className="h-10 w-10 flex items-center justify-center rounded-none border border-black dark:border-[#353536] hover:border-black dark:hover:border-white text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer"
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
              className="h-10 flex items-center gap-2 px-2.5 rounded-none bg-white dark:bg-[#0F0F10] border border-black dark:border-[#353536] hover:border-black dark:hover:border-white transition-colors cursor-pointer select-none"
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
                  <Check size={13} className="text-black dark:text-white" />
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
              <div className="absolute right-0 mt-1 w-64 rounded-none bg-white dark:bg-[#0F0F10] border border-black dark:border-[#353536] p-2 z-50 animate-in fade-in duration-100">
                <div className="p-2 border border-black/10 dark:border-[#353536] bg-[#F7F7F7] dark:bg-[#1D1D1E] mb-2 font-mono text-[11px] break-all select-all text-zinc-800 dark:text-zinc-200">
                  {solAddress || 'No address loaded'}
                </div>

                <button
                  onClick={() => {
                    handleQrClick({ stopPropagation: () => {} } as React.MouseEvent);
                    setUserMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-none text-xs text-black dark:text-white hover:bg-[#F7F7F7] dark:hover:bg-[#1D1D1E] transition-colors cursor-pointer font-sans uppercase font-bold tracking-wider"
                >
                  <QrCode size={14} />
                  <span>SHOW ADDRESS QR</span>
                </button>

                {solAddress && (
                  <a
                    href={`https://solscan.io/account/${solAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-none text-xs text-black dark:text-white hover:bg-[#F7F7F7] dark:hover:bg-[#1D1D1E] transition-colors font-sans uppercase font-bold tracking-wider"
                  >
                    <ExternalLink size={14} />
                    <span>VIEW ON SOLSCAN</span>
                  </a>
                )}

                {onOpenSettings && (
                  <button
                    onClick={() => {
                      onOpenSettings();
                      setUserMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-none text-xs text-black dark:text-white hover:bg-[#F7F7F7] dark:hover:bg-[#1D1D1E] transition-colors cursor-pointer font-sans uppercase font-bold tracking-wider"
                  >
                    <Shield size={14} />
                    <span>BACKUP & SECURITY</span>
                  </button>
                )}

                <div className="border-t border-black/10 dark:border-[#353536] my-1" />

                <button
                  onClick={() => {
                    lockVault();
                    setUserMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-none text-xs text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors cursor-pointer font-sans uppercase font-black tracking-wider"
                >
                  <Lock size={14} />
                  <span>LOCK VAULT</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
