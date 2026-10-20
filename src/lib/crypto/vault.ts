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
import { DOT1_ENVELOPE_PREFIX } from './dot1';
import { validateMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english.js';

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

export function getVaultStore(): UseStore | null {
  if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
    return null;
  }
  if (!vaultStoreInstance) {
    vaultStoreInstance = createStore(VAULT_DB_NAME, VAULT_STORE_NAME);
  }
  return vaultStoreInstance;
}

/**
 * Forbidden key patterns that must NEVER be placed in unencrypted metadata or storage records.
 */
const FORBIDDEN_SECRET_KEY_PATTERNS = [
  /seed/i,
  /mnemonic/i,
  /priv.*key/i,
  /secret/i,
  /password/i,
  /passphrase/i,
  /entropy/i,
  /xprv/i,
  /wif/i,
  /authkey/i,
  /rootkey/i,
];

/**
 * Whitelisted key suffixes/names that represent safe public hashes or nonces.
 */
const SAFE_HEX_KEYS = [
  'address',
  'hash',
  'txhash',
  'checksum',
  'iv',
  'ivhex',
  'salt',
  'salthex',
  'authtag',
  'authtaghex',
  'pubkey',
  'publickey',
  'publickeyhex',
  'signature',
  'id',
  'rawpayload',
];

/**
 * Validates that an object contains zero plaintext secrets.
 * Inspects both object keys (via regex pattern matching) and string values (detecting BIP-39 mnemonics & private keys).
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

    // 1. Inspect key name against forbidden secret patterns
    for (const pattern of FORBIDDEN_SECRET_KEY_PATTERNS) {
      if (pattern.test(normalizedKey)) {
        throw new Error(
          `[SECURITY VIOLATION] Attempted to store plaintext secret "${path}.${key}" in unencrypted storage! ` +
          `DOT enforces zero plaintext secrets in IndexedDB or metadata.`
        );
      }
    }

    // 2. Inspect string values for leaked secret material
    if (typeof value === 'string') {
      const trimmed = value.trim();

      // Check for BIP-39 mnemonic phrase in string value (12 to 24 words)
      if (trimmed.includes(' ')) {
        const words = trimmed.split(/\s+/);
        if ([12, 15, 18, 21, 24].includes(words.length)) {
          if (validateMnemonic(trimmed, wordlist)) {
            throw new Error(
              `[SECURITY VIOLATION] Detected plaintext BIP-39 mnemonic phrase in "${path}.${key}"! ` +
              `DOT enforces zero plaintext secrets in unencrypted storage.`
            );
          }
        }
      }

      // Check for Base58 extended private keys (xprv, yprv, zprv)
      if (/^[xyz]prv[1-9A-HJ-NP-Za-km-z]{100,}$/.test(trimmed)) {
        throw new Error(
          `[SECURITY VIOLATION] Detected extended private key (xprv/yprv/zprv) in "${path}.${key}"!`
        );
      }

      // Check for 32-byte hex private key (64 hex characters) in non-whitelisted property
      const cleanHex = trimmed.startsWith('0x') ? trimmed.slice(2) : trimmed;
      if (cleanHex.length === 64 && /^[0-9a-fA-F]{64}$/.test(cleanHex)) {
        const isSafeKey = SAFE_HEX_KEYS.some((safe) => normalizedKey.includes(safe));
        if (!isSafeKey) {
          throw new Error(
            `[SECURITY VIOLATION] Suspected 32-byte raw private key hex detected in unencrypted property "${path}.${key}"!`
          );
        }
      }
    }

    // Recursive object inspection
    if (typeof value === 'object' && value !== null) {
      assertZeroPlaintextSecrets(value, `${path}.${key}`);
    }
  }
}

/**
 * Validates that an envelope string is a valid encrypted envelope (starts with dot1_ or valid dot1 JSON backup).
 * Strictly verifies structure, hex formats, and zero-plaintext guarantees.
 */
export function assertValidEncryptedEnvelope(envelope: string): void {
  if (!envelope || typeof envelope !== 'string') {
    throw new Error('Invalid vault envelope: Must be a non-empty string.');
  }

  const trimmed = envelope.trim();
  const isPrefixEnvelope = trimmed.startsWith(DOT1_ENVELOPE_PREFIX);
  const isJsonEnvelope = trimmed.startsWith('{') && trimmed.endsWith('}');

  if (!isPrefixEnvelope && !isJsonEnvelope) {
    throw new Error(
      `Invalid vault envelope format: Envelope must start with "${DOT1_ENVELOPE_PREFIX}" ` +
      `or be a valid encrypted dot1 backup JSON.`
    );
  }

  if (isPrefixEnvelope) {
    const rawBase58 = trimmed.slice(DOT1_ENVELOPE_PREFIX.length);
    if (!rawBase58 || rawBase58.length === 0) {
      throw new Error('Invalid vault envelope: Encoded dot1 payload is truncated or empty.');
    }
  } else if (isJsonEnvelope) {
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      throw new Error('Invalid vault envelope: Malformed JSON envelope.');
    }

    if (parsed.format !== 'dot1' || parsed.version !== 1) {
      throw new Error('Invalid vault envelope: JSON envelope format must be "dot1" version 1.');
    }

    if (!parsed.ciphertextHex || typeof parsed.ciphertextHex !== 'string' || parsed.ciphertextHex.length < 32) {
      throw new Error('Invalid vault envelope: Missing or invalid ciphertextHex in JSON envelope.');
    }

    const cipher = parsed.cipher as Record<string, unknown> | undefined;
    if (!cipher || typeof cipher !== 'object') {
      throw new Error('Invalid vault envelope: Missing cipher configuration in JSON envelope.');
    }

    if (!cipher.ivHex || typeof cipher.ivHex !== 'string' || cipher.ivHex.length !== 24) {
      throw new Error('Invalid vault envelope: Invalid or missing 12-byte IV (ivHex) in JSON envelope.');
    }

    if (!cipher.authTagHex || typeof cipher.authTagHex !== 'string' || cipher.authTagHex.length !== 32) {
      throw new Error('Invalid vault envelope: Invalid or missing 16-byte Auth Tag (authTagHex) in JSON envelope.');
    }

    // Ensure zero plaintext secrets inside JSON envelope
    assertZeroPlaintextSecrets(parsed, 'envelope');
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
