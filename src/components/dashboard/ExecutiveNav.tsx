'use client';

import React, { useState, useEffect } from 'react';
import {
  Copy,
  Check,
  QrCode,
  ExternalLink,
  ChevronDown,
  Lock,
  Shield,
  Settings,
} from 'lucide-react';
import { useWallet } from '@/context/WalletContext';

interface ExecutiveNavProps {
  activeTab?: string;
  onSelectTab?: (tab: string) => void;
  onOpenSettings?: () => void;
  onViewQr?: (address: string) => void;
}

const NAV_ITEMS: { id: string; label: string }[] = [];

const SOL_CLUSTERS = [
  { id: 'Solana Mainnet-Beta', label: 'SOLANA MAINNET', desc: 'Production Network' },
  { id: 'Solana Devnet', label: 'SOLANA DEVNET', desc: 'Testing Environment' },
  { id: 'Solana Testnet', label: 'SOLANA TESTNET', desc: 'Validator Testbed' },
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

  const [copied, setCopied] = useState(false);
  const [clusterDropdownOpen, setClusterDropdownOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Close open dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target?.closest?.('[data-nav-dropdown]')) {
        setClusterDropdownOpen(false);
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const solAddress = addresses.solana?.address || '';
  const truncatedAddress =
    solAddress.length > 12
      ? `${solAddress.slice(0, 4)}...${solAddress.slice(-4)}`
      : solAddress || '8x...Vault';

  const currentCluster =
    SOL_CLUSTERS.find((c) => c.id === activeNetwork) || {
      id: activeNetwork,
      label: activeNetwork ? activeNetwork.toUpperCase() : 'SOLANA MAINNET',
      desc: '',
    };

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
    <header className="sticky top-0 z-40 w-full backdrop-blur-md border-b transition-colors duration-150 bg-white/95 border-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* LEFT: Brand Logo "DOT" + DM Sans Uppercase Navigation Links */}
        <div className="flex items-center gap-6 lg:gap-8">
          {/* Brand Logo: Clean, beautifully positioned text "DOT" (DM Sans 900 font-black, uppercase, tracked) */}
          <div
            onClick={() => onSelectTab?.('Dashboard')}
            className="flex items-center cursor-pointer select-none"
            title="DOT Dashboard"
          >
            <span className="font-sans font-black tracking-widest text-xl sm:text-2xl text-black uppercase">
              DOT
            </span>
          </div>

          {/* DM Sans Uppercase Navigation Links */}
          {NAV_ITEMS.length > 0 && (
            <nav className="hidden md:flex items-center gap-1">
              {NAV_ITEMS.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`px-3 py-1.5 rounded-none text-xs font-sans font-bold tracking-wider uppercase transition-colors cursor-pointer border ${
                      isActive
                        ? 'bg-black text-white border-black'
                        : 'text-zinc-600 border-transparent hover:border-black hover:text-black'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </nav>
          )}
        </div>

        {/* RIGHT: Status Pill (SOLANA MAINNET/DEVNET/TESTNET), Address Button with Copy & QR, User Menu */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Clean Status Pill: Cluster Switcher */}
          <div className="relative" data-nav-dropdown="cluster">
            <button
              onClick={() => {
                setClusterDropdownOpen((prev) => !prev);
                setUserMenuOpen(false);
              }}
              className="h-10 flex items-center gap-2 px-3 rounded-none bg-white border border-black hover:bg-black/5 text-xs font-mono font-medium text-black transition-colors cursor-pointer select-none"
              aria-expanded={clusterDropdownOpen}
              aria-haspopup="listbox"
            >
              <span className="font-mono tracking-wide uppercase text-[11px] font-bold">
                {currentCluster.label}
              </span>
              <ChevronDown
                size={13}
                className={`text-zinc-500 transition-transform duration-150 ${
                  clusterDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Cluster Switcher Dropdown */}
            {clusterDropdownOpen && (
              <div className="absolute right-0 mt-1 w-56 rounded-none bg-white border border-black p-1 z-50 animate-in fade-in duration-100 shadow-none">
                <div className="text-[10px] font-mono text-zinc-500 px-2.5 py-1 uppercase tracking-wider font-bold border-b border-black/10 mb-1">
                  Network Cluster
                </div>
                {SOL_CLUSTERS.map((net) => {
                  const isSelected = activeNetwork === net.id;
                  return (
                    <button
                      key={net.id}
                      onClick={() => {
                        setActiveNetwork(net.id);
                        setClusterDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-none text-xs transition-colors cursor-pointer border ${
                        isSelected
                          ? 'bg-black text-white border-black font-bold'
                          : 'border-transparent text-zinc-800 hover:bg-[#F7F7F7]'
                      }`}
                    >
                      <div className="text-left font-mono">
                        <div className="text-xs font-bold uppercase">{net.label}</div>
                        <div
                          className={`text-[10px] ${
                            isSelected ? 'text-zinc-300' : 'text-zinc-500'
                          }`}
                        >
                          {net.desc}
                        </div>
                      </div>
                      {isSelected && <Check size={14} className="text-white shrink-0 ml-2" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Clean User Address Button with Copy & QR */}
          <div className="relative" data-nav-dropdown="user">
            <div
              onClick={() => {
                setUserMenuOpen((prev) => !prev);
                setClusterDropdownOpen(false);
              }}
              className="h-10 flex items-center gap-2 px-2.5 rounded-none bg-white border border-black hover:bg-black/5 transition-colors cursor-pointer select-none"
            >
              {/* Truncated address */}
              <span className="text-xs font-mono font-semibold text-black">
                {truncatedAddress}
              </span>

              {/* Copy trigger button */}
              <button
                type="button"
                onClick={handleCopy}
                className="p-1 rounded-none text-zinc-400 hover:text-black transition-colors cursor-pointer"
                title={copied ? 'Copied!' : 'Copy Address'}
                aria-label="Copy Address"
              >
                {copied ? (
                  <Check size={13} className="text-black" />
                ) : (
                  <Copy size={13} />
                )}
              </button>

              {/* QR trigger button */}
              <button
                type="button"
                onClick={handleQrClick}
                className="p-1 rounded-none text-zinc-400 hover:text-black transition-colors cursor-pointer hidden sm:inline-flex"
                title="View QR Code"
                aria-label="View QR Code"
              >
                <QrCode size={13} />
              </button>
            </div>

            {/* User Menu Dropdown */}
            {userMenuOpen && (
              <div className="absolute right-0 mt-1 w-64 rounded-none bg-white border border-black p-2 z-50 animate-in fade-in duration-100 shadow-none">
                <div className="p-2 border border-black/10 bg-[#F7F7F7] mb-2 font-mono text-[11px] break-all select-all text-zinc-800">
                  {solAddress || 'No address loaded'}
                </div>

                <button
                  onClick={() => {
                    handleQrClick({ stopPropagation: () => {} } as React.MouseEvent);
                    setUserMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-none text-xs text-black hover:bg-[#F7F7F7] transition-colors cursor-pointer font-sans uppercase font-bold tracking-wider"
                >
                  <QrCode size={14} />
                  <span>SHOW ADDRESS QR</span>
                </button>

                {solAddress && (
                  <a
                    href={`https://solscan.io/account/${solAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-none text-xs text-black hover:bg-[#F7F7F7] transition-colors font-sans uppercase font-bold tracking-wider"
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
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-none text-xs text-black hover:bg-[#F7F7F7] transition-colors cursor-pointer font-sans uppercase font-bold tracking-wider"
                  >
                    <Shield size={14} />
                    <span>BACKUP & SECURITY</span>
                  </button>
                )}

                <div className="border-t border-black/10 my-1" />

                <button
                  onClick={() => {
                    lockVault();
                    setUserMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-none text-xs text-black hover:bg-black hover:text-white transition-colors cursor-pointer font-sans uppercase font-black tracking-wider"
                >
                  <Lock size={14} />
                  <span>LOCK VAULT</span>
                </button>
              </div>
            )}
          </div>

          {onOpenSettings && (
            <button
              type="button"
              onClick={onOpenSettings}
              className="h-10 w-10 flex items-center justify-center rounded-none bg-white border border-black hover:bg-black hover:text-white text-black transition-colors cursor-pointer select-none"
              title="Settings & Backup"
              aria-label="Settings"
            >
              <Settings size={16} />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
