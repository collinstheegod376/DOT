/**
 * DOT Crypto Engine - Key Vault Storage Wrapper
 * 
 * Provides an isolated, tamper-evident IndexedDB storage wrapper using `idb-keyval`.
 * 
 * Strict DOT Security Non-Negotiables:
 * - Stores ONLY encrypted ciphertext / `dot1` envelopes.
 * - ZERO plaintext secrets in localStorage, sessionStorage, or unencrypted DB.
 * - Runtime assertion guards against accidental leakage of mnemonics, seeds, or private keys.
 */

import { get, set, del, createStore } from 'idb-keyval';
import type { UseStore } from 'idb-keyval';
import { DOT1_ENVELOPE_PREFIX } from './dot1.ts';

export const VAULT_DB_NAME = 'dot_vault_db';
export const VAULT_STORE_NAME = 'dot_vault_store';
export const VAULT_STORAGE_KEY = 'dot1_active_envelope';

export interface StoredVaultRecord {
  envelope: string;
  metadata: Record<string, unknown>;
  updatedAt: number;
  version: number;
}

export interface VaultData {
  envelope: string;
  metadata: Record<string, unknown>;
}

// Dedicated IndexedDB store for DOT Vault
let vaultStoreInstance: UseStore | null = null;

function getVaultStore(): UseStore | null {
  if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
    return null;
  }
  if (!vaultStoreInstance) {
    vaultStoreInstance = createStore(VAULT_DB_NAME, VAULT_STORE_NAME);
  }
  return vaultStoreInstance;
}

/**
 * Forbidden keys that must NEVER be placed in unencrypted metadata or database records.
 */
const FORBIDDEN_SECRET_KEYS = [
  'seed',
  'seedhex',
  'mnemonic',
  'mnemonicphrase',
  'privatekey',
  'privatekeyhex',
  'secret',
  'secretkey',
  'password',
  'entropy',
];

/**
 * Validates that an object contains zero plaintext secrets.
 * Throws a SecurityError if any sensitive field is detected.
 */
export function assertZeroPlaintextSecrets(obj: unknown, path = 'metadata'): void {
  if (!obj || typeof obj !== 'object') return;

  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      assertZeroPlaintextSecrets(obj[i], `${path}[${i}]`);
    }
    return;
  }

  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    const normalizedKey = key.toLowerCase().replace(/[-_]/g, '');
    if (FORBIDDEN_SECRET_KEYS.includes(normalizedKey)) {
      throw new Error(
        `[SECURITY VIOLATION] Attempted to store plaintext secret "${path}.${key}" in unencrypted storage! ` +
        `DOT enforces zero plaintext secrets in IndexedDB or metadata.`
      );
    }
    if (typeof value === 'object' && value !== null) {
      assertZeroPlaintextSecrets(value, `${path}.${key}`);
    }
  }
}

/**
 * Validates that an envelope string is a valid encrypted envelope (starts with dot1_ or valid dot1 JSON backup).
 */
export function assertValidEncryptedEnvelope(envelope: string): void {
  if (!envelope || typeof envelope !== 'string') {
    throw new Error('Invalid vault envelope: Must be a non-empty string.');
  }

  const trimmed = envelope.trim();
  const isPrefixEnvelope = trimmed.startsWith(DOT1_ENVELOPE_PREFIX);
  const isJsonEnvelope = trimmed.startsWith('{') && trimmed.includes('"format":"dot1"');

  if (!isPrefixEnvelope && !isJsonEnvelope) {
    throw new Error(
      `Invalid vault envelope format: Envelope must start with "${DOT1_ENVELOPE_PREFIX}" ` +
      `or be a valid encrypted dot1 backup JSON.`
    );
  }
}

/**
 * Saves an encrypted `dot1` envelope and optional safe metadata into IndexedDB.
 * Enforces strict zero-plaintext assertions on both the envelope and metadata.
 */
export async function saveVault(
  encryptedEnvelope: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  // 1. Strict security assertions
  assertValidEncryptedEnvelope(encryptedEnvelope);
  if (metadata) {
    assertZeroPlaintextSecrets(metadata);
  }

  // 2. Obtain isolated IndexedDB store
  const store = getVaultStore();
  if (!store) {
    throw new Error('IndexedDB is not available in the current environment.');
  }

  const record: StoredVaultRecord = {
    envelope: encryptedEnvelope.trim(),
    metadata: metadata ? { ...metadata } : {},
    updatedAt: Date.now(),
    version: 1,
  };

  await set(VAULT_STORAGE_KEY, record, store);
}

/**
 * Loads the active encrypted vault from IndexedDB.
 * Returns null if no vault has been created.
 */
export async function loadVault(): Promise<VaultData | null> {
  const store = getVaultStore();
  if (!store) {
    return null;
  }

  const record = (await get(VAULT_STORAGE_KEY, store)) as StoredVaultRecord | undefined;
  if (!record || !record.envelope) {
    return null;
  }

  return {
    envelope: record.envelope,
    metadata: record.metadata || {},
  };
}

/**
 * Checks whether an encrypted vault currently exists in IndexedDB.
 */
export async function hasVault(): Promise<boolean> {
  const data = await loadVault();
  return data !== null;
}

/**
 * Clears the active encrypted vault and all vault metadata from IndexedDB.
 */
export async function clearVault(): Promise<void> {
  const store = getVaultStore();
  if (!store) return;

  await del(VAULT_STORAGE_KEY, store);
}
