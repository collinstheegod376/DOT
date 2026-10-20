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
  loadPublicAddresses,
  loadSelectedChains,
  loadTransactions,
  loadVaultEnvelope,
  resetVaultStorage,
  savePublicAddresses,
  saveSelectedChains,
  saveTransactions,
  saveVaultEnvelope,
} from '@/lib/storage';
import { fetchLiveChainBalances } from '@/lib/rpc/balance';

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
  isRefreshingBalances: boolean;
  // Actions
  refreshBalances: () => Promise<void>;
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
  const [isRefreshingBalances, setIsRefreshingBalances] = useState<boolean>(false);

  // Clean Balances state (defaults to 0.0000)
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
          const loadedAddresses = await loadPublicAddresses();
          if (loadedAddresses) {
            setAddresses(loadedAddresses);
          }
          const loadedTxs = await loadTransactions();
          setTransactions(loadedTxs || []);
        } else {
          setTransactions([]);
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

  // Live balance fetcher
  const refreshBalances = useCallback(async () => {
    const effectiveOnline = isOnline && !isAirGapSimulated;
    if (!effectiveOnline) return;
    if (Object.keys(addresses).length === 0) return;

    setIsRefreshingBalances(true);
    try {
      const updated = await fetchLiveChainBalances(addresses, balances);
      setBalances(updated);
    } catch (err) {
      console.warn('[WalletContext] refreshBalances error:', err);
    } finally {
      setIsRefreshingBalances(false);
    }
  }, [isOnline, isAirGapSimulated, addresses, balances]);

  // Trigger live balance fetching when wallet initialized, unlocked, or addresses change
  useEffect(() => {
    if (!isInitialized || isLocked) return;
    const effectiveOnline = isOnline && !isAirGapSimulated;
    if (!effectiveOnline) return;
    if (Object.keys(addresses).length === 0) return;

    let isMounted = true;
    fetchLiveChainBalances(addresses, balances)
      .then((updated) => {
        if (isMounted) {
          setBalances(updated);
        }
      })
      .catch((err) => {
        console.warn('[WalletContext] Auto-fetch balances error:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [isInitialized, isLocked, addresses, isOnline, isAirGapSimulated]);

  // Auto-refresh interval (every 30 seconds when window is active and wallet is online)
  useEffect(() => {
    if (!isInitialized || isLocked) return;
    const effectiveOnline = isOnline && !isAirGapSimulated;
    if (!effectiveOnline) return;
    if (Object.keys(addresses).length === 0) return;

    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) {
        return; // Pause auto-refresh when tab is not focused/visible
      }
      refreshBalances();
    }, 30000);

    return () => clearInterval(interval);
  }, [isInitialized, isLocked, isOnline, isAirGapSimulated, addresses, refreshBalances]);

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
      await savePublicAddresses(derived);
      await saveTransactions([]);

      setLatestEnvelope(envelope);
      setAddresses(derived);
      setMnemonicPhrase(mnemonic);
      setPrivateKeys(derivedPriv);
      setSelectedChainsState(chains);
      setHasPasskey(passkeyRegistered);
      setHasPasswordFallback(true);
      setIsInitialized(true);
      setIsLocked(false);
      setTransactions([]);
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
        if (Object.keys(addresses).length === 0) {
          const loaded = await loadPublicAddresses();
          if (loaded) {
            setAddresses(loaded);
          } else {
            const sampleMnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
            const derived = deriveAddressesFromMnemonic(sampleMnemonic, selectedChains);
            setAddresses(derived);
          }
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
        await savePublicAddresses(derived);
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
    setTransactions([]);
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

      // Refresh on-chain balances shortly after sending if online
      if (effectiveOnline) {
        setTimeout(() => {
          refreshBalances();
        }, 3000);
      }

      return newTx;
    },
    [isOnline, isAirGapSimulated, transactions, refreshBalances]
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
        isRefreshingBalances,
        refreshBalances,
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
