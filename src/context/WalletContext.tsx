'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  AddressInfo,
  ChainBalance,
  Dot1BackupEnvelope,
  SupportedChainId,
  TransactionRecord,
} from '@/types/wallet';
import { INITIAL_CHAINS, SAMPLE_INITIAL_BALANCES, SUPPORTED_CHAINS } from '@/lib/constants';
import {
  createDot1Envelope,
  decryptDot1Envelope,
  deriveAddressesFromMnemonic,
  derivePrivateKeys,
  registerPasskeyWithPrf,
} from '@/lib/crypto';
import {
  isVaultInitialized,
  loadSelectedChains,
  loadTransactions,
  loadVaultEnvelope,
  resetVaultStorage,
  saveSelectedChains,
  saveTransactions,
  saveVaultEnvelope,
} from '@/lib/storage';

interface WalletContextType {
  isInitialized: boolean;
  isLocked: boolean;
  isOnline: boolean;
  isAirGapSimulated: boolean;
  activeNetwork: string;
  selectedChains: SupportedChainId[];
  addresses: Record<SupportedChainId, AddressInfo>;
  mnemonicPhrase: string | null;
  privateKeys: Record<SupportedChainId, string> | null;
  hasPasskey: boolean;
  hasPasswordFallback: boolean;
  balances: Record<SupportedChainId, ChainBalance>;
  totalFiatBalance: number;
  transactions: TransactionRecord[];
  latestEnvelope: Dot1BackupEnvelope | null;
  // Actions
  toggleAirGapMode: () => void;
  setActiveNetwork: (net: string) => void;
  setSelectedChains: (chains: SupportedChainId[]) => void;
  initializeNewVault: (
    mnemonic: string,
    passwordFallback: string,
    chains: SupportedChainId[],
    passkeyRegistered: boolean
  ) => Promise<void>;
  restoreVaultFromMnemonic: (
    mnemonic: string,
    passwordFallback: string,
    chains: SupportedChainId[]
  ) => Promise<void>;
  restoreVaultFromEnvelope: (
    envelope: Dot1BackupEnvelope,
    passwordFallback: string
  ) => Promise<boolean>;
  lockVault: () => void;
  unlockWithPasskey: () => Promise<boolean>;
  unlockWithPassword: (password: string) => Promise<boolean>;
  resetVault: () => Promise<void>;
  sendTransaction: (tx: Omit<TransactionRecord, 'id' | 'timestamp' | 'status'>) => Promise<TransactionRecord>;
}

const WalletContext = createContext<WalletContextType | null>(null);

const DEFAULT_SAMPLE_TXS: TransactionRecord[] = [
  {
    id: 'tx-evm-1',
    chainId: 'ethereum',
    hash: '0x3a9f0291e7c5b1284d7a86f7b19810a9cf18e7e17cb95a3ecf48201ad84c19a8',
    type: 'send',
    amount: '0.45 ETH',
    fiatValueUsd: 1404.18,
    from: '0x71C...4982',
    to: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    timestamp: Date.now() - 3600 * 1000 * 2, // 2h ago
    status: 'confirmed',
    fee: '0.0018 ETH',
    note: 'Vitalik donation / Gitcoin grant',
  },
  {
    id: 'tx-btc-1',
    chainId: 'bitcoin',
    hash: '4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b',
    type: 'receive',
    amount: '0.05 BTC',
    fiatValueUsd: 3422.50,
    from: 'bc1q9x...92kd',
    to: 'bc1q7y...39lk',
    timestamp: Date.now() - 3600 * 1000 * 7, // 7h ago
    status: 'confirmed',
    fee: '0.00004 BTC',
    note: 'Inbound settlement',
  },
  {
    id: 'tx-offline-1',
    chainId: 'ethereum',
    hash: '0xpending...queued',
    type: 'contract_call',
    amount: '0.10 ETH',
    fiatValueUsd: 312.04,
    from: '0x71C...4982',
    to: '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640',
    timestamp: Date.now() - 1000 * 60 * 15, // 15m ago
    status: 'queued_offline',
    fee: '0.0022 ETH',
    note: 'Uniswap V3 Swap Intent (Signed Air-Gap)',
  },
];

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isAirGapSimulated, setIsAirGapSimulated] = useState<boolean>(false);
  const [activeNetwork, setActiveNetwork] = useState<string>('Ethereum Mainnet');
  const [selectedChains, setSelectedChainsState] = useState<SupportedChainId[]>(INITIAL_CHAINS);
  const [addresses, setAddresses] = useState<Record<SupportedChainId, AddressInfo>>(
    {} as Record<SupportedChainId, AddressInfo>
  );
  const [mnemonicPhrase, setMnemonicPhrase] = useState<string | null>(null);
  const [privateKeys, setPrivateKeys] = useState<Record<SupportedChainId, string> | null>(null);
  const [hasPasskey, setHasPasskey] = useState<boolean>(false);
  const [hasPasswordFallback, setHasPasswordFallback] = useState<boolean>(false);
  const [latestEnvelope, setLatestEnvelope] = useState<Dot1BackupEnvelope | null>(null);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);

  // Balances state
  const [balances, setBalances] = useState<Record<SupportedChainId, ChainBalance>>(() => {
    const map = {} as Record<SupportedChainId, ChainBalance>;
    for (const id of INITIAL_CHAINS) {
      map[id] = {
        chainId: id,
        ...SAMPLE_INITIAL_BALANCES[id],
      };
    }
    return map;
  });

  // Track online/offline status
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    setIsOnline(navigator.onLine);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Hydrate from IndexedDB on startup
  useEffect(() => {
    async function loadStorage() {
      try {
        const initialized = await isVaultInitialized();
        if (initialized) {
          setIsInitialized(true);
          setIsLocked(true); // Locked on initial session load
          const env = await loadVaultEnvelope();
          if (env) {
            setLatestEnvelope(env);
            setSelectedChainsState(env.chains);
            setHasPasswordFallback(true);
            setHasPasskey(true);
          }
          const loadedTxs = await loadTransactions();
          setTransactions(loadedTxs.length > 0 ? loadedTxs : DEFAULT_SAMPLE_TXS);
        } else {
          setTransactions(DEFAULT_SAMPLE_TXS);
        }
      } catch (err) {
        console.error('Error loading vault storage:', err);
      }
    }
    loadStorage();
  }, []);

  // Compute aggregate total fiat
  const totalFiatBalance = Object.values(balances).reduce((sum, b) => {
    if (selectedChains.includes(b.chainId)) {
      return sum + b.fiatValueUsd;
    }
    return sum;
  }, 0);

  const toggleAirGapMode = useCallback(() => {
    setIsAirGapSimulated((prev) => !prev);
  }, []);

  const setSelectedChains = useCallback((chains: SupportedChainId[]) => {
    setSelectedChainsState(chains);
    saveSelectedChains(chains);
  }, []);

  const initializeNewVault = useCallback(
    async (
      mnemonic: string,
      passwordFallback: string,
      chains: SupportedChainId[],
      passkeyRegistered: boolean
    ) => {
      const derived = deriveAddressesFromMnemonic(mnemonic, chains);
      const derivedPriv = derivePrivateKeys(mnemonic, chains);
      const envelope = await createDot1Envelope(mnemonic, passwordFallback, chains);

      await saveVaultEnvelope(envelope);
      await saveSelectedChains(chains);
      await saveTransactions(DEFAULT_SAMPLE_TXS);

      setLatestEnvelope(envelope);
      setAddresses(derived);
      setMnemonicPhrase(mnemonic);
      setPrivateKeys(derivedPriv);
      setSelectedChainsState(chains);
      setHasPasskey(passkeyRegistered);
      setHasPasswordFallback(true);
      setIsInitialized(true);
      setIsLocked(false);
      setTransactions(DEFAULT_SAMPLE_TXS);
    },
    []
  );

  const restoreVaultFromMnemonic = useCallback(
    async (mnemonic: string, passwordFallback: string, chains: SupportedChainId[]) => {
      await initializeNewVault(mnemonic, passwordFallback, chains, false);
    },
    [initializeNewVault]
  );

  const restoreVaultFromEnvelope = useCallback(
    async (envelope: Dot1BackupEnvelope, passwordFallback: string): Promise<boolean> => {
      const decrypted = await decryptDot1Envelope(envelope, passwordFallback);
      if (!decrypted) return false;

      await initializeNewVault(decrypted.mnemonic, passwordFallback, decrypted.chains, true);
      return true;
    },
    [initializeNewVault]
  );

  const lockVault = useCallback(() => {
    setIsLocked(true);
    setMnemonicPhrase(null);
    setPrivateKeys(null);
  }, []);

  const unlockWithPasskey = useCallback(async (): Promise<boolean> => {
    try {
      const result = await registerPasskeyWithPrf();
      if (result.credentialId) {
        setIsLocked(false);
        // If addresses aren't loaded yet, reconstruct mock addresses from constants
        if (Object.keys(addresses).length === 0) {
          const sampleMnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
          const derived = deriveAddressesFromMnemonic(sampleMnemonic, selectedChains);
          setAddresses(derived);
        }
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [addresses, selectedChains]);

  const unlockWithPassword = useCallback(
    async (password: string): Promise<boolean> => {
      if (!latestEnvelope) {
        setIsLocked(false);
        return true;
      }
      const decrypted = await decryptDot1Envelope(latestEnvelope, password);
      if (decrypted) {
        const derived = deriveAddressesFromMnemonic(decrypted.mnemonic, decrypted.chains);
        const derivedPriv = derivePrivateKeys(decrypted.mnemonic, decrypted.chains);
        setAddresses(derived);
        setMnemonicPhrase(decrypted.mnemonic);
        setPrivateKeys(derivedPriv);
        setIsLocked(false);
        return true;
      }
      return false;
    },
    [latestEnvelope]
  );

  const resetVault = useCallback(async () => {
    await resetVaultStorage();
    setIsInitialized(false);
    setIsLocked(false);
    setMnemonicPhrase(null);
    setPrivateKeys(null);
    setLatestEnvelope(null);
    setAddresses({} as Record<SupportedChainId, AddressInfo>);
    setSelectedChainsState(INITIAL_CHAINS);
  }, []);

  const sendTransaction = useCallback(
    async (txInput: Omit<TransactionRecord, 'id' | 'timestamp' | 'status'>): Promise<TransactionRecord> => {
      const effectiveOnline = isOnline && !isAirGapSimulated;
      const status = effectiveOnline ? 'confirmed' : 'queued_offline';

      const newTx: TransactionRecord = {
        ...txInput,
        id: 'tx-' + Date.now(),
        timestamp: Date.now(),
        status,
      };

      const updated = [newTx, ...transactions];
      setTransactions(updated);
      await saveTransactions(updated);

      // Decrement simulated balance
      const parsedAmount = parseFloat(txInput.amount) || 0;
      setBalances((prev) => {
        const current = prev[txInput.chainId];
        if (!current) return prev;
        const newBal = Math.max(0, parseFloat(current.balance) - parsedAmount);
        return {
          ...prev,
          [txInput.chainId]: {
            ...current,
            balance: newBal.toFixed(4),
            fiatValueUsd: newBal * current.tokenPriceUsd,
          },
        };
      });

      return newTx;
    },
    [isOnline, isAirGapSimulated, transactions]
  );

  return (
    <WalletContext.Provider
      value={{
        isInitialized,
        isLocked,
        isOnline: isOnline && !isAirGapSimulated,
        isAirGapSimulated,
        activeNetwork,
        selectedChains,
        addresses,
        mnemonicPhrase,
        privateKeys,
        hasPasskey,
        hasPasswordFallback,
        balances,
        totalFiatBalance,
        transactions,
        latestEnvelope,
        toggleAirGapMode,
        setActiveNetwork,
        setSelectedChains,
        initializeNewVault,
        restoreVaultFromMnemonic,
        restoreVaultFromEnvelope,
        lockVault,
        unlockWithPasskey,
        unlockWithPassword,
        resetVault,
        sendTransaction,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
