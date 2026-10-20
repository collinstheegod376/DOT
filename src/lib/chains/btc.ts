import { HDKey } from '@scure/bip32';
import { sha256 } from '@noble/hashes/sha2.js';
import { ripemd160 } from '@noble/hashes/legacy.js';
import { bech32 } from '@scure/base';

/**
 * Bitcoin BIP-84 Native SegWit (P2WPKH Bech32) Key Derivation & Address Generation
 * Mainnet Path: m/84'/0'/0'/0/x
 * Testnet Path: m/84'/1'/0'/0/x
 */

export type BtcNetwork = 'mainnet' | 'testnet';

export interface BtcAccount {
  address: string; // Native SegWit Bech32 (e.g. bc1q... or tb1q...)
  publicKey: string; // 33-byte compressed hex string
  publicKeyBytes: Uint8Array;
  privateKeyBytes: Uint8Array;
  privateKeyWif: string; // WIF format (compressed)
  derivationPath: string;
  network: BtcNetwork;
}

// Base58Check encoding for WIF
const B58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

function base58Encode(source: Uint8Array): string {
  if (source.length === 0) return '';
  const digits = [0];
  for (let i = 0; i < source.length; i++) {
    let carry = source[i];
    for (let j = 0; j < digits.length; j++) {
      carry += digits[j] << 8;
      digits[j] = carry % 58;
      carry = (carry / 58) | 0;
    }
    while (carry > 0) {
      digits.push(carry % 58);
      carry = (carry / 58) | 0;
    }
  }
  let leader = 0;
  for (let i = 0; i < source.length && source[i] === 0; i++) {
    leader++;
  }
  let result = '';
  for (let i = 0; i < leader; i++) {
    result += '1';
  }
  for (let i = digits.length - 1; i >= 0; i--) {
    result += B58_ALPHABET[digits[i]];
  }
  return result;
}

function base58CheckEncode(payload: Uint8Array): string {
  const hash1 = sha256(payload);
  const hash2 = sha256(hash1);
  const checksum = hash2.slice(0, 4);
  const combined = new Uint8Array(payload.length + 4);
  combined.set(payload, 0);
  combined.set(checksum, payload.length);
  return base58Encode(combined);
}

/**
 * Convert raw 32-byte private key into Bitcoin WIF (Wallet Import Format)
 */
export function privateKeyToWif(
  privateKey: Uint8Array,
  network: BtcNetwork = 'mainnet',
  compressed = true
): string {
  if (privateKey.length !== 32) {
    throw new Error('Private key must be 32 bytes');
  }
  const prefix = network === 'mainnet' ? 0x80 : 0xef;
  const length = compressed ? 34 : 33;
  const payload = new Uint8Array(length);
  payload[0] = prefix;
  payload.set(privateKey, 1);
  if (compressed) {
    payload[33] = 0x01;
  }
  return base58CheckEncode(payload);
}

/**
 * Hash public key (HASH160 = RIPEMD160(SHA256(pubkey)))
 */
export function hash160(data: Uint8Array): Uint8Array {
  return ripemd160(sha256(data));
}

/**
 * Derive P2WPKH Bech32 address from compressed public key
 */
export function publicKeyToP2WPKH(publicKey: Uint8Array, network: BtcNetwork = 'mainnet'): string {
  if (publicKey.length !== 33) {
    throw new Error('Public key must be 33-byte compressed format');
  }
  const hrp = network === 'mainnet' ? 'bc' : 'tb';
  const pubKeyHash = hash160(publicKey);
  const words = [0].concat(bech32.toWords(pubKeyHash));
  return bech32.encode(hrp, words);
}

function bytesToHex(bytes: Uint8Array): string {
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
}

/**
 * Derives a Bitcoin account from master seed using BIP-84 (Native SegWit)
 * Path: m/84'/0'/0'/0/{index} (mainnet) or m/84'/1'/0'/0/{index} (testnet)
 */
export function deriveBtcAccount(
  seed: Uint8Array,
  accountIndex = 0,
  network: BtcNetwork = 'mainnet'
): BtcAccount {
  const coinType = network === 'mainnet' ? "0'" : "1'";
  const path = `m/84'/${coinType}/0'/0/${accountIndex}`;

  const master = HDKey.fromMasterSeed(seed);
  const child = master.derive(path);

  if (!child.privateKey || !child.publicKey) {
    throw new Error(`Failed to derive Bitcoin key at path: ${path}`);
  }

  const privateKeyBytes = child.privateKey;
  const publicKeyBytes = child.publicKey;
  const address = publicKeyToP2WPKH(publicKeyBytes, network);
  const privateKeyWif = privateKeyToWif(privateKeyBytes, network, true);
  const publicKeyHex = bytesToHex(publicKeyBytes);

  return {
    address,
    publicKey: publicKeyHex,
    publicKeyBytes,
    privateKeyBytes,
    privateKeyWif,
    derivationPath: path,
    network,
  };
}

/**
 * Validates a Bech32 Native SegWit Bitcoin address (bc1q... or tb1q...)
 */
export function validateBtcAddress(address: string, network: BtcNetwork = 'mainnet'): boolean {
  if (!address || typeof address !== 'string') return false;
  const expectedHrp = network === 'mainnet' ? 'bc' : 'tb';
  try {
    const decoded = bech32.decode(address as `${string}1${string}`);
    if (decoded.prefix !== expectedHrp) return false;
    const words = decoded.words;
    if (words.length === 0) return false;
    // Witness version 0 for P2WPKH/P2WSH
    const witnessVersion = words[0];
    if (witnessVersion !== 0) return false;
    const program = bech32.fromWords(words.slice(1));
    // P2WPKH is 20 bytes, P2WSH is 32 bytes
    return program.length === 20 || program.length === 32;
  } catch {
    return false;
  }
}
