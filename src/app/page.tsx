'use client';

import React, { useState } from 'react';
import { WalletProvider, useWallet } from '@/context/WalletContext';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { BalanceCards } from '@/components/dashboard/BalanceCards';
import { ActionButtons } from '@/components/dashboard/ActionButtons';
import { TransactionList } from '@/components/dashboard/TransactionList';
import { SendModal } from '@/components/dashboard/SendModal';
import { ReceiveModal } from '@/components/dashboard/ReceiveModal';
import { SettingsBackupModal } from '@/components/dashboard/SettingsBackupModal';
import { UnlockModal } from '@/components/dashboard/UnlockModal';
import { AirGapModal } from '@/components/airgap/AirGapModal';
import { QrModal } from '@/components/common/QrModal';
import { SupportedChainId } from '@/types/wallet';
import { SUPPORTED_CHAINS } from '@/lib/constants';

function WalletAppContent() {
  const { isInitialized } = useWallet();

  // Modal States
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [receiveModalOpen, setReceiveModalOpen] = useState(false);
  const [airGapModalOpen, setAirGapModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [activeModalChain, setActiveModalChain] = useState<SupportedChainId>('ethereum');

  // QR Modal State
  const [qrModalData, setQrModalData] = useState<{
    isOpen: boolean;
    chainId: SupportedChainId;
    address: string;
    derivationPath: string;
  } | null>(null);

  const handleOpenSend = (chainId: SupportedChainId = 'ethereum') => {
    setActiveModalChain(chainId);
    setSendModalOpen(true);
  };

  const handleOpenReceive = (chainId: SupportedChainId = 'ethereum') => {
    setActiveModalChain(chainId);
    setReceiveModalOpen(true);
  };

  const handleViewQr = (chainId: SupportedChainId, address: string) => {
    setQrModalData({
      isOpen: true,
      chainId,
      address,
      derivationPath: SUPPORTED_CHAINS[chainId].derivationPath,
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
        {/* Balances Section */}
        <BalanceCards
          onSend={handleOpenSend}
          onReceive={handleOpenReceive}
          onViewQr={handleViewQr}
        />

        {/* Primary Action Buttons */}
        <ActionButtons
          onOpenSend={() => handleOpenSend(activeModalChain)}
          onOpenReceive={() => handleOpenReceive(activeModalChain)}
          onOpenAirGap={() => setAirGapModalOpen(true)}
          onOpenSettings={() => setSettingsModalOpen(true)}
        />

        {/* Transaction & Activity Feed */}
        <TransactionList />
      </main>

      {/* Modals */}
      <SendModal
        isOpen={sendModalOpen}
        onClose={() => setSendModalOpen(false)}
        defaultChainId={activeModalChain}
      />

      <ReceiveModal
        isOpen={receiveModalOpen}
        onClose={() => setReceiveModalOpen(false)}
        defaultChainId={activeModalChain}
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
            DOT Sovereign Vault • Client-Side Silicon Cryptography
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Zero Server Footprint</span>
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
