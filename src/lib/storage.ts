import { get, set, del } from 'idb-keyval';
import { AddressInfo, Dot1BackupEnvelope, SupportedChainId, TransactionRecord } from '@/types/wallet';
import { STORAGE_KEYS } from './constants';
import { assertZeroPlaintextSecrets, assertValidEncryptedEnvelope } from './crypto/vault';

export async function isVaultInitialized(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  try {
    const val = await get(STORAGE_KEYS.VAULT_INITIALIZED);
    return Boolean(val);
  } catch {
    return false;
  }
}

export async function saveVaultEnvelope(envelope: Dot1BackupEnvelope): Promise<void> {
  // Enforce zero plaintext secrets and structural validity regardless of environment
  assertZeroPlaintextSecrets(envelope, 'vaultEnvelope');
  assertValidEncryptedEnvelope(typeof envelope === 'string' ? envelope : JSON.stringify(envelope));

  if (typeof window === 'undefined') return;
  await set(STORAGE_KEYS.VAULT_ENVELOPE, envelope);
  await set(STORAGE_KEYS.VAULT_INITIALIZED, true);
  await set(STORAGE_KEYS.SELECTED_CHAINS, envelope.chains);
}

export async function loadVaultEnvelope(): Promise<Dot1BackupEnvelope | null> {
  if (typeof window === 'undefined') return null;
  try {
    const data = await get<Dot1BackupEnvelope>(STORAGE_KEYS.VAULT_ENVELOPE);
    return data || null;
  } catch {
    return null;
  }
}

export async function saveSelectedChains(chains: SupportedChainId[]): Promise<void> {
  if (typeof window === 'undefined') return;
  await set(STORAGE_KEYS.SELECTED_CHAINS, chains);
}

export async function loadSelectedChains(): Promise<SupportedChainId[] | null> {
  if (typeof window === 'undefined') return null;
  try {
    const chains = await get<SupportedChainId[]>(STORAGE_KEYS.SELECTED_CHAINS);
    return chains || null;
  } catch {
    return null;
  }
}

export async function saveActiveNetwork(networkId: string): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_NETWORK, networkId);
  } catch {}
  await set(STORAGE_KEYS.ACTIVE_NETWORK, networkId);
}

export async function loadActiveNetwork(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  try {
    const fromLocal = localStorage.getItem(STORAGE_KEYS.ACTIVE_NETWORK);
    if (fromLocal) return fromLocal;
  } catch {}
  try {
    const net = await get<string>(STORAGE_KEYS.ACTIVE_NETWORK);
    return net || null;
  } catch {
    return null;
  }
}

export async function savePublicAddresses(addresses: Record<SupportedChainId, AddressInfo>): Promise<void> {
  assertZeroPlaintextSecrets(addresses, 'publicAddresses');
  if (typeof window === 'undefined') return;
  await set(STORAGE_KEYS.PUBLIC_ADDRESSES, addresses);
}

export async function loadPublicAddresses(): Promise<Record<SupportedChainId, AddressInfo> | null> {
  if (typeof window === 'undefined') return null;
  try {
    const addrs = await get<Record<SupportedChainId, AddressInfo>>(STORAGE_KEYS.PUBLIC_ADDRESSES);
    return addrs || null;
  } catch {
    return null;
  }
}

export async function saveTransactions(txs: TransactionRecord[]): Promise<void> {
  assertZeroPlaintextSecrets(txs, 'transactions');
  if (typeof window === 'undefined') return;
  await set(STORAGE_KEYS.TRANSACTION_HISTORY, txs);
}

export async function loadTransactions(): Promise<TransactionRecord[]> {
  if (typeof window === 'undefined') return [];
  try {
    const list = await get<TransactionRecord[]>(STORAGE_KEYS.TRANSACTION_HISTORY);
    return list || [];
  } catch {
    return [];
  }
}

export async function savePasskeyCredentialId(credentialId: string): Promise<void> {
  if (typeof window === 'undefined') return;
  await set(STORAGE_KEYS.PASSKEY_CREDENTIAL_ID, credentialId);
}

export async function loadPasskeyCredentialId(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  try {
    const id = await get<string>(STORAGE_KEYS.PASSKEY_CREDENTIAL_ID);
    return id || null;
  } catch {
    return null;
  }
}

export async function savePrfVaultEnvelope(envelope: Dot1BackupEnvelope): Promise<void> {
  assertZeroPlaintextSecrets(envelope, 'prfVaultEnvelope');
  assertValidEncryptedEnvelope(typeof envelope === 'string' ? envelope : JSON.stringify(envelope));
  if (typeof window === 'undefined') return;
  await set(STORAGE_KEYS.PRF_VAULT_ENVELOPE, envelope);
}

export async function loadPrfVaultEnvelope(): Promise<Dot1BackupEnvelope | null> {
  if (typeof window === 'undefined') return null;
  try {
    const data = await get<Dot1BackupEnvelope>(STORAGE_KEYS.PRF_VAULT_ENVELOPE);
    return data || null;
  } catch {
    return null;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function saveCachedBalances(balances: Record<string, any>): Promise<void> {
  assertZeroPlaintextSecrets(balances, 'cachedBalances');
  if (typeof window === 'undefined') return;
  await set(STORAGE_KEYS.CACHED_BALANCES, balances);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function loadCachedBalances(): Promise<Record<string, any> | null> {
  if (typeof window === 'undefined') return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = await get<Record<string, any>>(STORAGE_KEYS.CACHED_BALANCES);
    return data || null;
  } catch {
    return null;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function saveCachedTokens(tokens: any[]): Promise<void> {
  assertZeroPlaintextSecrets(tokens, 'cachedTokens');
  if (typeof window === 'undefined') return;
  await set(STORAGE_KEYS.CACHED_TOKENS, tokens);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function loadCachedTokens(): Promise<any[] | null> {
  if (typeof window === 'undefined') return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = await get<any[]>(STORAGE_KEYS.CACHED_TOKENS);
    return data || null;
  } catch {
    return null;
  }
}

export async function resetVaultStorage(): Promise<void> {
  if (typeof window === 'undefined') return;
  await del(STORAGE_KEYS.VAULT_ENVELOPE);
  await del(STORAGE_KEYS.VAULT_INITIALIZED);
  await del(STORAGE_KEYS.SELECTED_CHAINS);
  await del(STORAGE_KEYS.PUBLIC_ADDRESSES);
  await del(STORAGE_KEYS.TRANSACTION_HISTORY);
  await del(STORAGE_KEYS.PASSKEY_CREDENTIAL_ID);
  await del(STORAGE_KEYS.PRF_VAULT_ENVELOPE);
  await del(STORAGE_KEYS.CACHED_BALANCES);
  await del(STORAGE_KEYS.CACHED_TOKENS);
}
