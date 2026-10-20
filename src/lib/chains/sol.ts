import { hmac } from '@noble/hashes/hmac.js';
import { sha512 } from '@noble/hashes/sha2.js';
import { ed25519 } from '@noble/curves/ed25519.js';
import { base58 } from '@scure/base';

/**
 * Solana SLIP-0010 Hardened Ed25519 HD Key Derivation
 * Standard derivation path: m/44'/501'/0'/0' (Phantom / Solana CLI standard)
 */

const ED25519_SEED = new TextEncoder().encode('ed25519 seed');

export interface SolAccount {
  address: string; // Base58 encoded public key
  publicKey: string; // Base58 encoded public key
  publicKeyBytes: Uint8Array;
  privateKey: Uint8Array; // 32-byte Ed25519 secret seed
  derivationPath: string;
}

/**
 * Derives child private key from seed using SLIP-0010 (Ed25519 hardened derivation)
 * All path components must be hardened (e.g. 44', 501', 0', 0')
 */
export function deriveSolanaPrivateKey(seed: Uint8Array, path = "m/44'/501'/0'/0'"): Uint8Array {
  if (!seed || seed.length < 16) {
    throw new Error('Seed must be at least 16 bytes');
  }

  // Master key derivation: HMAC-SHA512("ed25519 seed", seed)
  let I = hmac(sha512, ED25519_SEED, seed);
  let k = I.slice(0, 32);
  let c = I.slice(32);

  const cleanPath = path.trim().replace(/^m\/?/, '');
  if (!cleanPath) {
    return k;
  }

  const segments = cleanPath.split('/');
  for (const segment of segments) {
    const isHardened = segment.endsWith("'") || segment.endsWith('h');
    const indexStr = isHardened ? segment.slice(0, -1) : segment;
    const indexNum = parseInt(indexStr, 10);

    if (isNaN(indexNum)) {
      throw new Error(`Invalid path segment: ${segment}`);
    }

    // Ed25519 only supports hardened derivation
    const hardenedIndex = (indexNum + 0x80000000) >>> 0;

    // Buffer: 0x00 || 32-byte private key || 4-byte big-endian index
    const data = new Uint8Array(1 + 32 + 4);
    data[0] = 0x00;
    data.set(k, 1);
    const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
    view.setUint32(33, hardenedIndex, false);

    I = hmac(sha512, c, data);
    k = I.slice(0, 32);
    c = I.slice(32);
  }

  return k;
}

/**
 * Derive a Solana account from a master seed and account index
 * Path: m/44'/501'/{accountIndex}'/0'
 */
export function deriveSolanaAccount(seed: Uint8Array, accountIndex = 0): SolAccount {
  const path = `m/44'/501'/${accountIndex}'/0'`;
  const privateKey = deriveSolanaPrivateKey(seed, path);
  const publicKeyBytes = ed25519.getPublicKey(privateKey);
  const address = base58.encode(publicKeyBytes);

  return {
    address,
    publicKey: address,
    publicKeyBytes,
    privateKey,
    derivationPath: path,
  };
}

/**
 * Create a Solana account from an existing 32-byte Ed25519 private key
 */
export function solanaAccountFromPrivateKey(privateKey: Uint8Array): SolAccount {
  if (privateKey.length !== 32) {
    throw new Error('Solana Ed25519 private key seed must be 32 bytes');
  }
  const publicKeyBytes = ed25519.getPublicKey(privateKey);
  const address = base58.encode(publicKeyBytes);

  return {
    address,
    publicKey: address,
    publicKeyBytes,
    privateKey,
    derivationPath: 'custom',
  };
}

/**
 * Validates whether a given string is a valid Solana Base58 public key / address
 */
export function validateSolanaAddress(address: string): boolean {
  if (!address || typeof address !== 'string') return false;
  try {
    const bytes = base58.decode(address);
    return bytes.length === 32;
  } catch {
    return false;
  }
}

/**
 * Offline message signing for Solana
 */
export function signSolanaMessage(privateKey: Uint8Array, message: Uint8Array): Uint8Array {
  return ed25519.sign(message, privateKey);
}
