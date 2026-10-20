'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  AddressInfo,
  ChainBalance,
  Dot1BackupEnvelope,
  SupportedChainId,
  TokenAsset,
  TransactionRecord,
} from '@/types/wallet';
import { INITIAL_CHAINS, SAMPLE_INITIAL_BALANCES, SUPPORTED_CHAINS } from '@/lib/constants';
import { DEFAULT_SOLANA_TOKENS, getLiveTokenAssets } from '@/lib/tokens';
import {
  createDot1Envelope,
  decryptDot1Envelope,
  deriveAddressesFromMnemonic,
  derivePrivateKeys,
  registerPasskeyWithPrf,
  authenticatePasskeyWithPrf,
} from '@/lib/crypto';
import {
  isVaultInitialized,
  loadCachedBalances,
  loadCachedTokens,
  loadPasskeyCredentialId,
  loadPrfVaultEnvelope,
  loadPublicAddresses,
  loadSelectedChains,
  loadTransactions,
  loadVaultEnvelope,
  resetVaultStorage,
  saveCachedBalances,
  saveCachedTokens,
  savePublicAddresses,
  saveSelectedChains,
  saveTransactions,
  saveVaultEnvelope,
} from '@/lib/storage';
import { fetchLiveChainBalances, fetchSolanaTransactions } from '@/lib/rpc/balance';

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
  tokens: TokenAsset[];
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
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [isAirGapSimulated, setIsAirGapSimulated] = useState<boolean>(false);
  const [activeNetwork, setActiveNetwork] = useState<string>('Solana Mainnet-Beta');
  const [tokens, setTokens] = useState<TokenAsset[]>(DEFAULT_SOLANA_TOKENS);
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
        const [cachedBal, cachedTok] = await Promise.all([
          loadCachedBalances(),
          loadCachedTokens(),
        ]);
        if (cachedBal && Object.keys(cachedBal).length > 0) {
          setBalances(cachedBal as Record<SupportedChainId, ChainBalance>);
        }
        if (cachedTok && cachedTok.length > 0) {
          setTokens(cachedTok);
        }

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

  // Compute aggregate total fiat from balances or tokens
  const totalFiatBalance =
    balances.solana?.totalPortfolioFiatUsd !== undefined && balances.solana?.totalPortfolioFiatUsd > 0
      ? balances.solana.totalPortfolioFiatUsd
      : tokens.reduce((sum, t) => sum + (t.fiatValueUsd || 0), 0);

  // Live balance fetcher
  const refreshBalances = useCallback(async () => {
    const effectiveOnline = isOnline && !isAirGapSimulated;
    if (!effectiveOnline) return;
    if (Object.keys(addresses).length === 0) return;

    setIsRefreshingBalances(true);
    try {
      const updated = await fetchLiveChainBalances(addresses, balances);
      setBalances(updated);
      await saveCachedBalances(updated);

      if (updated.solana?.splTokens && updated.solana.splTokens.length > 0) {
        const solToken: TokenAsset = {
          symbol: 'SOL',
          name: 'Solana',
          mint: 'native',
          decimals: 9,
          balance: updated.solana.balance,
          tokenPriceUsd: updated.solana.tokenPriceUsd,
          fiatValueUsd: (parseFloat(updated.solana.balance) || 0) * updated.solana.tokenPriceUsd,
          change24hPercent: updated.solana.change24hPercent,
          color: '#14F195',
          isNative: true,
        };
        const splMapped: TokenAsset[] = updated.solana.splTokens.map((t) => ({
          symbol: t.symbol,
          name: t.name,
          mint: t.mint,
          decimals: t.decimals,
          balance: t.balance,
          tokenPriceUsd: t.tokenPriceUsd,
          fiatValueUsd: t.fiatValueUsd,
          change24hPercent: t.change24hPercent || 0,
          icon: t.icon,
          color:
            t.symbol === 'USDC'
              ? '#2775CA'
              : t.symbol === 'USDT'
              ? '#26A17B'
              : t.symbol === 'JUP'
              ? '#00BEA0'
              : t.symbol === 'RAY'
              ? '#3A78FF'
              : t.symbol === 'BONK'
              ? '#FFA500'
              : '#E6DAFE',
          isNative: false,
        }));
        const nextTokens = [solToken, ...splMapped];
        setTokens(nextTokens);
        await saveCachedTokens(nextTokens);
      } else {
        const solAddr = addresses.solana?.address || '';
        const solBal = updated.solana?.balance || balances.solana?.balance || '0.00';
        const solPrice = updated.solana?.tokenPriceUsd;
        const solChange = updated.solana?.change24hPercent;
        const updatedTokens = await getLiveTokenAssets(solAddr, solBal, solPrice, solChange);
        setTokens(updatedTokens);
        await saveCachedTokens(updatedTokens);
      }

      // Sync on-chain transactions for Solana address
      const solAddr = addresses.solana?.address || '';
      if (solAddr) {
        fetchSolanaTransactions(solAddr, updated.solana?.tokenPriceUsd || 154.20, activeNetwork)
          .then((onChainTxs) => {
            if (onChainTxs && onChainTxs.length > 0) {
              setTransactions((prev) => {
                const map = new Map<string, TransactionRecord>();
                for (const t of onChainTxs) {
                  map.set(t.hash, t);
                }
                for (const t of prev) {
                  if (t.status === 'queued_offline' && !map.has(t.hash)) {
                    map.set(t.hash, t);
                  }
                }
                const merged = Array.from(map.values()).sort((a, b) => b.timestamp - a.timestamp);
                saveTransactions(merged).catch(() => {});
                return merged;
              });
            }
          })
          .catch((err) => console.warn('[WalletContext] Failed to fetch on-chain transactions:', err));
      }
    } catch (err) {
      console.warn('[WalletContext] refreshBalances error:', err);
    } finally {
      setIsRefreshingBalances(false);
    }
  }, [isOnline, isAirGapSimulated, addresses, balances, activeNetwork]);

  // Trigger live balance fetching when wallet initialized, unlocked, or addresses change
  useEffect(() => {
    if (!isInitialized || isLocked) return;
    const effectiveOnline = isOnline && !isAirGapSimulated;
    if (!effectiveOnline) return;
    if (Object.keys(addresses).length === 0) return;

    let isMounted = true;
    fetchLiveChainBalances(addresses, balances)
      .then(async (updated) => {
        if (isMounted) {
          setBalances(updated);
          await saveCachedBalances(updated);
          if (updated.solana?.splTokens && updated.solana.splTokens.length > 0) {
            const solToken: TokenAsset = {
              symbol: 'SOL',
              name: 'Solana',
              mint: 'native',
              decimals: 9,
              balance: updated.solana.balance,
              tokenPriceUsd: updated.solana.tokenPriceUsd,
              fiatValueUsd: (parseFloat(updated.solana.balance) || 0) * updated.solana.tokenPriceUsd,
              change24hPercent: updated.solana.change24hPercent,
              color: '#14F195',
              isNative: true,
            };
            const splMapped: TokenAsset[] = updated.solana.splTokens.map((t) => ({
              symbol: t.symbol,
              name: t.name,
              mint: t.mint,
              decimals: t.decimals,
              balance: t.balance,
              tokenPriceUsd: t.tokenPriceUsd,
              fiatValueUsd: t.fiatValueUsd,
              change24hPercent: t.change24hPercent || 0,
              icon: t.icon,
              color:
                t.symbol === 'USDC'
                  ? '#2775CA'
                  : t.symbol === 'USDT'
                  ? '#26A17B'
                  : t.symbol === 'JUP'
                  ? '#00BEA0'
                  : t.symbol === 'RAY'
                  ? '#3A78FF'
                  : t.symbol === 'BONK'
                  ? '#FFA500'
                  : '#E6DAFE',
              isNative: false,
            }));
            if (isMounted) {
              const nextTokens = [solToken, ...splMapped];
              setTokens(nextTokens);
              await saveCachedTokens(nextTokens);
            }
          } else {
            const solAddr = addresses.solana?.address || '';
            const solBal = updated.solana?.balance || '0.00';
            const solPrice = updated.solana?.tokenPriceUsd;
            const solChange = updated.solana?.change24hPercent;
            const updatedTokens = await getLiveTokenAssets(solAddr, solBal, solPrice, solChange);
            if (isMounted) {
              setTokens(updatedTokens);
              await saveCachedTokens(updatedTokens);
            }
          }

          // Also trigger on-chain transaction sync
          const solAddr = addresses.solana?.address || '';
          if (solAddr) {
            fetchSolanaTransactions(solAddr, updated.solana?.tokenPriceUsd || 154.20, activeNetwork)
              .then((onChainTxs) => {
                if (isMounted && onChainTxs && onChainTxs.length > 0) {
                  setTransactions((prev) => {
                    const map = new Map<string, TransactionRecord>();
                    for (const t of onChainTxs) {
                      map.set(t.hash, t);
                    }
                    for (const t of prev) {
                      if (t.status === 'queued_offline' && !map.has(t.hash)) {
                        map.set(t.hash, t);
                      }
                    }
                    const merged = Array.from(map.values()).sort((a, b) => b.timestamp - a.timestamp);
                    saveTransactions(merged).catch(() => {});
                    return merged;
                  });
                }
              })
              .catch(() => {});
          }
        }
      })
      .catch((err) => {
        console.warn('[WalletContext] Auto-fetch balances error:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [isInitialized, isLocked, addresses, isOnline, isAirGapSimulated, activeNetwork]);

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
      const storedCredentialId = await loadPasskeyCredentialId();
      const authResult = await authenticatePasskeyWithPrf({
        credentialId: storedCredentialId || undefined,
      });

      if (!authResult.success) {
        return false;
      }

      // Retrieve encrypted envelopes from session or IndexedDB storage
      const envelopeToDecrypt = latestEnvelope || (await loadVaultEnvelope());
      const prfEnvelope = await loadPrfVaultEnvelope();

      let decrypted: { mnemonic: string; chains: SupportedChainId[] } | null = null;

      // 1. Try decrypting PRF-dedicated envelope with derived PRF secret key
      if (authResult.secretKey && prfEnvelope) {
        decrypted = await decryptDot1Envelope(prfEnvelope, authResult.secretKey);
      }

      // 2. Try decrypting the primary backup envelope with derived PRF secret key
      if (!decrypted && authResult.secretKey && envelopeToDecrypt) {
        decrypted = await decryptDot1Envelope(envelopeToDecrypt, authResult.secretKey);
      }

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

      // If PRF did not yield decrypted vault, fail cleanly without insecure fallbacks
      return false;
    } catch (err) {
      console.warn('[WalletContext] unlockWithPasskey error:', err);
      return false;
    }
  }, [latestEnvelope]);

  const unlockWithPassword = useCallback(
    async (password: string): Promise<boolean> => {
      const envelopeToDecrypt = latestEnvelope || (await loadVaultEnvelope());
      if (!envelopeToDecrypt) {
        setIsLocked(false);
        return true;
      }
      const decrypted = await decryptDot1Envelope(envelopeToDecrypt, password);
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
    setBalances(() => {
      const map = {} as Record<SupportedChainId, ChainBalance>;
      for (const id of INITIAL_CHAINS) {
        map[id] = {
          chainId: id,
          ...SAMPLE_INITIAL_BALANCES[id],
        };
      }
      return map;
    });
    setTokens(DEFAULT_SOLANA_TOKENS);
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
        const nextBalances = {
          ...prev,
          [txInput.chainId]: {
            ...current,
            balance: newBal.toFixed(4),
            fiatValueUsd: newBal * current.tokenPriceUsd,
          },
        };
        saveCachedBalances(nextBalances).catch((err) =>
          console.warn('[WalletContext] Failed to cache balance after send:', err)
        );
        return nextBalances;
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
        tokens,
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
