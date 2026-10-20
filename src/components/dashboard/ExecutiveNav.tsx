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
  Radio,
  Wifi,
  Shield,
  Layers,
} from 'lucide-react';
import { useWallet } from '@/context/WalletContext';
import { useTheme } from '@/context/ThemeContext';

interface ExecutiveNavProps {
  activeTab?: string;
  onSelectTab?: (tab: string) => void;
  onOpenSettings?: () => void;
  onViewQr?: (address: string) => void;
}

const NAV_PILLS = ['Dashboard', 'Portfolio', 'Prices', 'Sovereign Vault'];

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
    isOnline,
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

  // Generate deterministic avatar gradient colors from address
  const avatarGradient = solAddress
    ? `linear-gradient(135deg, #${solAddress.slice(2, 8)} 0%, #${solAddress.slice(8, 14)} 100%)`
    : 'linear-gradient(135deg, #14F195 0%, #00F0FF 100%)';

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl border-b transition-colors duration-200 bg-[var(--header-bg)] border-[var(--header-border)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* LEFT: Brand Logo + Nav Pills */}
        <div className="flex items-center gap-6 lg:gap-8">
          {/* Brand Logo */}
          <div className="flex items-center gap-2.5 cursor-pointer select-none">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 p-[1.5px] shadow-[0_0_14px_rgba(20,241,149,0.25)]">
              <div className="w-full h-full rounded-[10px] bg-[#0A0A0E] flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-[#14F195] shadow-[0_0_8px_#14F195]" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-extrabold tracking-tight text-lg sm:text-xl font-mono text-[var(--text-primary)]">
                DOT
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold hidden sm:inline-block">
                SOLANA
              </span>
            </div>
          </div>

          {/* Navigation Pills */}
          <nav className="hidden md:flex items-center gap-1.5">
            {NAV_PILLS.map((pill) => {
              const isActive = activeTab === pill;
              return (
                <button
                  key={pill}
                  onClick={() => onSelectTab?.(pill)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-[0_0_12px_rgba(20,241,149,0.12)]'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--panel-hover)]'
                  }`}
                >
                  {pill}
                </button>
              );
            })}
          </nav>
        </div>

        {/* RIGHT: Notifications, Cluster, Theme, Avatar Badge */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Notifications Icon */}
          <div className="relative">
            <button
              onClick={() => {
                setNotificationsOpen(!notificationsOpen);
                setClusterDropdownOpen(false);
                setUserMenuOpen(false);
              }}
              className="p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--panel-hover)] transition cursor-pointer relative"
              title="Notifications"
            >
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#14F195] ring-2 ring-[var(--card-bg)]" />
            </button>

            {/* Notifications Popover */}
            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-[var(--card-border)]">
                  <span className="text-xs font-bold font-mono text-[var(--text-primary)]">
                    NOTIFICATIONS
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    ALL CLEAR
                  </span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-[var(--panel-hover)] flex items-start gap-2.5">
                    <Shield size={16} className="text-[#14F195] shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-[var(--text-primary)]">Sovereign Vault Active</div>
                      <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                        Ed25519 silicon keys derived locally. Zero server retention.
                      </div>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[var(--panel-hover)] flex items-start gap-2.5">
                    <Wifi size={16} className="text-cyan-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-[var(--text-primary)]">Solana Mainnet Linked</div>
                      <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                        Real-time SPL account synchronization enabled.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Cluster Indicator: Solana Mainnet */}
          <div className="relative">
            <button
              onClick={() => {
                setClusterDropdownOpen(!clusterDropdownOpen);
                setNotificationsOpen(false);
                setUserMenuOpen(false);
              }}
              className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-[var(--panel-bg)] border border-[var(--card-border)] hover:border-emerald-500/40 text-xs font-medium text-[var(--text-primary)] transition cursor-pointer shadow-sm"
            >
              <div className="w-2 h-2 rounded-full bg-[#14F195] shadow-[0_0_8px_#14F195] animate-pulse shrink-0" />
              <span className="hidden sm:inline font-mono font-medium">Solana Mainnet</span>
              <span className="sm:hidden font-mono font-medium">Mainnet</span>
              <ChevronDown size={13} className="text-[var(--text-muted)]" />
            </button>

            {/* Cluster Switcher Dropdown */}
            {clusterDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] shadow-2xl p-1.5 z-50 animate-in fade-in duration-150">
                <div className="text-[10px] font-mono text-[var(--text-muted)] px-2.5 py-1 uppercase tracking-wider">
                  SVM Cluster
                </div>
                {[
                  { id: 'Solana Mainnet-Beta', label: 'Solana Mainnet', color: '#14F195', desc: 'Production SVM' },
                  { id: 'Solana Devnet', label: 'Solana Devnet', color: '#A855F7', desc: 'Testing cluster' },
                  { id: 'Solana Testnet', label: 'Solana Testnet', color: '#06B6D4', desc: 'Validator testbed' },
                ].map((net) => (
                  <button
                    key={net.id}
                    onClick={() => {
                      setActiveNetwork(net.id);
                      setClusterDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition cursor-pointer ${
                      activeNetwork === net.id
                        ? 'bg-emerald-500/15 text-emerald-400 font-semibold'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--panel-hover)]'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-left">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: net.color }}
                      />
                      <div>
                        <div>{net.label}</div>
                        <div className="text-[10px] text-[var(--text-muted)]">{net.desc}</div>
                      </div>
                    </div>
                    {activeNetwork === net.id && <Check size={14} className="text-[#14F195]" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Theme Toggle Button (Sun / Moon) */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--panel-hover)] border border-[var(--card-border)] transition-all cursor-pointer shadow-sm"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun size={17} className="text-amber-400 transition-transform duration-200 hover:rotate-45" />
            ) : (
              <Moon size={17} className="text-indigo-600 transition-transform duration-200 hover:-rotate-12" />
            )}
          </button>

          {/* User Address Avatar Badge */}
          <div className="relative">
            <div
              onClick={() => {
                setUserMenuOpen(!userMenuOpen);
                setNotificationsOpen(false);
                setClusterDropdownOpen(false);
              }}
              className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-2xl bg-[var(--panel-bg)] border border-[var(--card-border)] hover:border-emerald-500/40 transition cursor-pointer select-none shadow-sm"
            >
              {/* Avatar circle */}
              <div
                className="w-7 h-7 rounded-xl flex items-center justify-center font-bold text-[11px] text-white shadow-sm shrink-0 border border-white/20"
                style={{ background: avatarGradient }}
              >
                {solAddress ? solAddress.slice(0, 2).toUpperCase() : 'VA'}
              </div>

              {/* Truncated address */}
              <span className="text-xs font-mono font-medium text-[var(--text-primary)]">
                {truncatedAddress}
              </span>

              {/* Copy trigger button */}
              <button
                onClick={handleCopy}
                className="p-1 rounded-lg text-[var(--text-muted)] hover:text-emerald-400 hover:bg-[var(--panel-hover)] transition cursor-pointer"
                title="Copy Address"
              >
                {copied ? (
                  <Check size={13} className="text-emerald-400" />
                ) : (
                  <Copy size={13} />
                )}
              </button>

              {/* QR trigger button */}
              <button
                onClick={handleQrClick}
                className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[#14F195] hover:bg-[var(--panel-hover)] transition cursor-pointer hidden sm:inline-flex"
                title="View QR Code"
              >
                <QrCode size={13} />
              </button>
            </div>

            {/* User Menu Dropdown */}
            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] shadow-2xl p-2 z-50 animate-in fade-in duration-150">
                <div className="p-2.5 rounded-xl bg-[var(--panel-hover)] mb-2 font-mono text-[11px] break-all select-all text-[var(--text-secondary)]">
                  {solAddress || 'No address derived'}
                </div>

                <button
                  onClick={() => {
                    handleQrClick({ stopPropagation: () => {} } as React.MouseEvent);
                    setUserMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-[var(--text-primary)] hover:bg-[var(--panel-hover)] transition cursor-pointer"
                >
                  <QrCode size={15} className="text-[#14F195]" />
                  <span>Show Address QR</span>
                </button>

                {solAddress && (
                  <a
                    href={`https://solscan.io/account/${solAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-[var(--text-primary)] hover:bg-[var(--panel-hover)] transition"
                  >
                    <ExternalLink size={15} className="text-cyan-400" />
                    <span>View on Solscan</span>
                  </a>
                )}

                {onOpenSettings && (
                  <button
                    onClick={() => {
                      onOpenSettings();
                      setUserMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-[var(--text-primary)] hover:bg-[var(--panel-hover)] transition cursor-pointer"
                  >
                    <Shield size={15} className="text-emerald-400" />
                    <span>Backup & Settings</span>
                  </button>
                )}

                <div className="border-t border-[var(--card-border)] my-1" />

                <button
                  onClick={() => {
                    lockVault();
                    setUserMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-amber-400 hover:bg-amber-500/10 transition cursor-pointer"
                >
                  <Lock size={15} />
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
