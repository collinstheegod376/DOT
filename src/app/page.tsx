'use client';

import React, { useState } from 'react';
import { WalletProvider, useWallet } from '@/context/WalletContext';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { HeroPortfolio } from '@/components/dashboard/HeroPortfolio';
import { TokenList } from '@/components/dashboard/TokenList';
import { TransactionList } from '@/components/dashboard/TransactionList';
import { SendModal } from '@/components/dashboard/SendModal';
import { ReceiveModal } from '@/components/dashboard/ReceiveModal';
import { SettingsBackupModal } from '@/components/dashboard/SettingsBackupModal';
import { UnlockModal } from '@/components/dashboard/UnlockModal';
import { AirGapModal } from '@/components/airgap/AirGapModal';
import { QrModal } from '@/components/common/QrModal';
import { SupportedChainId } from '@/types/wallet';

function WalletAppContent() {
  const { isInitialized } = useWallet();

  // Modal States
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [receiveModalOpen, setReceiveModalOpen] = useState(false);
  const [airGapModalOpen, setAirGapModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [activeAssetSymbol, setActiveAssetSymbol] = useState<string>('SOL');

  // QR Modal State
  const [qrModalData, setQrModalData] = useState<{
    isOpen: boolean;
    chainId: SupportedChainId;
    address: string;
    derivationPath: string;
  } | null>(null);

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
    <div className="flex-1 flex flex-col min-h-screen">
      {/* Header */}
      <DashboardHeader onOpenSettings={() => setSettingsModalOpen(true)} />

      {/* Main Dashboard Body */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 md:py-8 space-y-6">
        {/* Hero Portfolio Section */}
        <HeroPortfolio
          onSend={handleOpenSend}
          onReceive={handleOpenReceive}
          onOpenAirGap={() => setAirGapModalOpen(true)}
          onViewQr={handleViewQr}
        />

        {/* Tokens & SPL Assets Section */}
        <TokenList
          onSendToken={(token) => handleOpenSend(token.symbol)}
          onReceiveToken={(token) => handleOpenReceive(token.symbol)}
        />

        {/* Transaction & Activity Feed */}
        <TransactionList />
      </main>

      {/* Modals */}
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

      {/* Unlock Screen Modal (Triggered automatically when vault is locked) */}
      <UnlockModal />

      {/* Footer */}
      <footer className="w-full border-t border-[#1F1F24] py-6 px-4 text-center">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-500 font-mono">
          <div>
            DOT Sovereign Solana Vault • Client-Side Silicon Cryptography
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#14F195]" />
            <span>Zero Server Footprint • SLIP-0010 Ed25519</span>
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
