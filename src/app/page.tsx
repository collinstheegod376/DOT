'use client';

import React, { useState, useEffect } from 'react';
import { WalletProvider, useWallet } from '@/context/WalletContext';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';
import { ExecutiveNav } from '@/components/dashboard/ExecutiveNav';
import { HeroPortfolio } from '@/components/dashboard/HeroPortfolio';
import { PortfolioAssets } from '@/components/dashboard/PortfolioAssets';
import { QuickActionCard } from '@/components/dashboard/QuickActionCard';
import { MarketWatchlist } from '@/components/dashboard/MarketWatchlist';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { SendModal } from '@/components/dashboard/SendModal';
import { ReceiveModal } from '@/components/dashboard/ReceiveModal';
import { SettingsBackupModal } from '@/components/dashboard/SettingsBackupModal';
import { UnlockModal } from '@/components/dashboard/UnlockModal';
import { AirGapModal, AirGapMode } from '@/components/airgap/AirGapModal';
import { QrModal } from '@/components/common/QrModal';
import { SupportedChainId } from '@/types/wallet';
import {
  ArrowUpRight,
  ArrowDownLeft,
  QrCode,
  Radio,
  ShieldCheck,
} from 'lucide-react';

function WalletAppContent() {
  const { isInitialized, addresses, refreshBalances } = useWallet();

  // Active navigation pill
  const [activeNavTab, setActiveNavTab] = useState<string>('Dashboard');

  // Modal States
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [receiveModalOpen, setReceiveModalOpen] = useState(false);
  const [airGapModalOpen, setAirGapModalOpen] = useState(false);
  const [airGapMode, setAirGapMode] = useState<AirGapMode>('export_unsigned');
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [activeAssetSymbol, setActiveAssetSymbol] = useState<string>('SOL');

  // Listen to dot:open-queue to open AirGapModal on the Queue view
  useEffect(() => {
    const handleOpenQueue = () => {
      setAirGapMode('queue');
      setAirGapModalOpen(true);
    };

    window.addEventListener('dot:open-queue', handleOpenQueue);
    return () => {
      window.removeEventListener('dot:open-queue', handleOpenQueue);
    };
  }, []);

  const handleOpenAirGap = (mode: AirGapMode = 'export_unsigned') => {
    setAirGapMode(mode);
    setAirGapModalOpen(true);
  };

  // QR Modal State
  const [qrModalData, setQrModalData] = useState<{
    isOpen: boolean;
    chainId: SupportedChainId;
    address: string;
    derivationPath: string;
  } | null>(null);

  const solAddress = addresses.solana?.address || '';

  const handleOpenSend = (assetSymbol: string = 'SOL') => {
    setActiveAssetSymbol(assetSymbol);
    setSendModalOpen(true);
  };

  const handleOpenReceive = (assetSymbol: string = 'SOL') => {
    setActiveAssetSymbol(assetSymbol);
    setReceiveModalOpen(true);
  };

  const handleViewQr = (address: string) => {
    setQrModalData({
      isOpen: true,
      chainId: 'solana',
      address,
      derivationPath: "m/44'/501'/0'/0'",
    });
  };

  if (!isInitialized) {
    return (
      <main className="flex-1 flex items-center justify-center py-8">
        <OnboardingWizard />
      </main>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[var(--background)] text-[var(--text-primary)] transition-colors duration-200 pb-20 lg:pb-0">
      {/* 1. Top Executive Navigation Bar */}
      <ExecutiveNav
        activeTab={activeNavTab}
        onSelectTab={setActiveNavTab}
        onOpenSettings={() => setSettingsModalOpen(true)}
        onViewQr={handleViewQr}
      />

      {/* 2. Main Dashboard: Reference-Accurate 2-Column Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (Desktop 7 or 8 cols): Portfolio Balance & Chart + My Portfolio + Recent Activity */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">
            {/* Portfolio Balance & Chart Section */}
            <HeroPortfolio
              onSend={handleOpenSend}
              onReceive={handleOpenReceive}
              onOpenAirGap={() => handleOpenAirGap('export_unsigned')}
              onViewQr={handleViewQr}
            />

            {/* "My Portfolio" Asset Rows with Authentic Logos & Allocation Bars */}
            <PortfolioAssets
              onSendToken={(token) => handleOpenSend(token.symbol)}
              onReceiveToken={(token) => handleOpenReceive(token.symbol)}
              onSelectToken={(token) => handleOpenSend(token.symbol)}
            />

            {/* "Recent Transaction" Section with Direction & External Links */}
            <RecentActivity />
          </div>

          {/* Right Column (Desktop 5 or 4 cols): Floating Action Card + My Watchlist */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-6">
            {/* Quick Action Transfer Widget (Send / Receive / Air-Gap) */}
            <QuickActionCard
              onOpenAirGap={() => handleOpenAirGap('export_unsigned')}
              onViewQr={handleViewQr}
              onSendComplete={() => refreshBalances()}
            />

            {/* "My Watchlist" Live Solana Token Rates */}
            <MarketWatchlist onSelectToken={(token) => handleOpenSend(token.symbol)} />
          </div>
        </div>
      </main>

      {/* 3. Mobile Floating Bottom Action Bar */}
      <nav
        aria-label="Mobile Navigation Bar"
        className="fixed bottom-0 left-0 right-0 z-30 lg:hidden p-2 bg-white/95 backdrop-blur-xl border-t border-black"
      >
        <div className="max-w-md mx-auto grid grid-cols-4 gap-1.5">
          {/* Send */}
          <button
            onClick={() => handleOpenSend('SOL')}
            className="h-12 flex flex-col items-center justify-center rounded-none bg-black text-white font-sans font-black text-[11px] uppercase tracking-wider transition active:opacity-80 cursor-pointer border border-black"
          >
            <ArrowUpRight size={16} strokeWidth={2.5} />
            <span className="mt-0.5">SEND</span>
          </button>

          {/* Receive */}
          <button
            onClick={() => handleOpenReceive('SOL')}
            className="h-12 flex flex-col items-center justify-center rounded-none bg-[#F7F7F7] hover:bg-black hover:text-white text-black border border-black/10 font-sans font-black text-[11px] uppercase tracking-wider transition active:opacity-80 cursor-pointer"
          >
            <ArrowDownLeft size={16} strokeWidth={2.5} />
            <span className="mt-0.5">RECEIVE</span>
          </button>

          {/* QR */}
          <button
            onClick={() => solAddress && handleViewQr(solAddress)}
            className="h-12 flex flex-col items-center justify-center rounded-none bg-[#F7F7F7] hover:bg-black hover:text-white text-black border border-black/10 font-sans font-black text-[11px] uppercase tracking-wider transition active:opacity-80 cursor-pointer"
          >
            <QrCode size={16} />
            <span className="mt-0.5">QR</span>
          </button>

          {/* Air-Gap / Offline */}
          <button
            onClick={() => handleOpenAirGap('queue')}
            className="h-12 flex flex-col items-center justify-center rounded-none bg-[#F7F7F7] hover:bg-black hover:text-white text-black border border-black/10 font-sans font-black text-[11px] uppercase tracking-wider transition active:opacity-80 cursor-pointer"
          >
            <Radio size={16} />
            <span className="mt-0.5">OFFLINE</span>
          </button>
        </div>
      </nav>

      {/* 4. Modals */}
      <SendModal
        isOpen={sendModalOpen}
        onClose={() => setSendModalOpen(false)}
        defaultAssetSymbol={activeAssetSymbol}
      />

      <ReceiveModal
        isOpen={receiveModalOpen}
        onClose={() => setReceiveModalOpen(false)}
        defaultAssetSymbol={activeAssetSymbol}
      />

      <AirGapModal
        isOpen={airGapModalOpen}
        onClose={() => setAirGapModalOpen(false)}
        mode={airGapMode}
      />

      <SettingsBackupModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
      />

      {qrModalData && (
        <QrModal
          isOpen={qrModalData.isOpen}
          onClose={() => setQrModalData(null)}
          chainId={qrModalData.chainId}
          address={qrModalData.address}
          derivationPath={qrModalData.derivationPath}
        />
      )}

      {/* Unlock Modal (Automatic prompt when session locks) */}
      <UnlockModal />

      {/* 5. Desktop Footer */}
      <footer className="w-full border-t border-black py-6 px-4 text-center mt-12 bg-white">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-600 font-mono">
          <div className="flex items-center gap-2">
            <ShieldCheck size={14} className="text-black" />
            <span className="uppercase font-bold tracking-wider">DOT Sovereign Vault • Hardware-Isolated Client Security</span>
          </div>
          <div>
            <span className="uppercase font-bold tracking-wider">Self-Custodial • Solana Network Verified</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function Home() {
  return (
    <WalletProvider>
      <WalletAppContent />
    </WalletProvider>
  );
}
