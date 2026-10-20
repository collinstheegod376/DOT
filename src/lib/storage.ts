import { get, set, del } from 'idb-keyval';
import { AddressInfo, Dot1BackupEnvelope, SupportedChainId, TransactionRecord } from '@/types/wallet';
import { STORAGE_KEYS } from './constants';

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

export async function savePublicAddresses(addresses: Record<SupportedChainId, AddressInfo>): Promise<void> {
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

export async function resetVaultStorage(): Promise<void> {
  if (typeof window === 'undefined') return;
  await del(STORAGE_KEYS.VAULT_ENVELOPE);
  await del(STORAGE_KEYS.VAULT_INITIALIZED);
  await del(STORAGE_KEYS.SELECTED_CHAINS);
  await del(STORAGE_KEYS.PUBLIC_ADDRESSES);
  await del(STORAGE_KEYS.TRANSACTION_HISTORY);
}
