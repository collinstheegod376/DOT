/**
 * DOT Crypto Engine - dot1 Envelope Format
 * 
 * Versioned envelope for secure vault storage and air-gapped backups.
 * 
 * Specification:
 * - Prefix: `dot1_`
 * - Encoding: Base58Check (SHA-256 checksum)
 * - Binary Payload Layout:
 *   [0]:       Version byte (0x01)
 *   [1]:       KDF Type (0x01 = PBKDF2-SHA256, 0x02 = Argon2id, 0x03 = Scrypt, 0x00 = Direct/PRF)
 *   [2..9]:    KDF Parameters (8 bytes big-endian)
 *              - PBKDF2: uint32 iterations, 4 bytes padding
 *              - Argon2id: uint16 time, uint32 memory (KiB), uint8 parallelism, 1 byte padding
 *              - Scrypt: uint32 N, uint16 r, uint8 p, 1 byte padding
 *              - Direct: 8 bytes 0x00
 *   [10]:      Salt Length (uint8, e.g. 16 or 32; 0 if direct)
 *   [11..N]:   Salt bytes
 *   [N+1]:     IV Length (uint8, 12 bytes for AES-GCM)
 *   [N+2..M]:  IV / Nonce bytes
 *   [M+1..]:   AES-256-GCM Ciphertext + 16-byte Auth Tag
 * 
 * Strictly follows DOT non-negotiables:
 * - CSPRNG: only `crypto.getRandomValues()`, never `Math.random()`.
 * - Authenticated Encryption: AES-256-GCM with constant-time verification.
 */

import { gcm } from '@noble/ciphers/aes.js';
import { pbkdf2 } from '@noble/hashes/pbkdf2.js';
import { argon2id } from '@noble/hashes/argon2.js';
import { scrypt } from '@noble/hashes/scrypt.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { hkdf } from '@noble/hashes/hkdf.js';
import { bytesToHex, hexToBytes, utf8ToBytes } from '@noble/hashes/utils.js';
import { base58check } from '@scure/base';
import { mnemonicToSeedSync, validateMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english.js';

export const DOT1_ENVELOPE_PREFIX = 'dot1_';
export const DOT1_VERSION = 1;

export type KdfAlgorithm = 'pbkdf2' | 'argon2id' | 'scrypt' | 'none';

export const KdfTypeCode = {
  NONE: 0x00,
  PBKDF2: 0x01,
  ARGON2ID: 0x02,
  SCRYPT: 0x03,
} as const;

export type KdfTypeCode = (typeof KdfTypeCode)[keyof typeof KdfTypeCode];

export interface Dot1EncryptOptions {
  kdf?: KdfAlgorithm;
  pbkdf2Iterations?: number; // default: 100_000 (standard web security & responsive UX)
  argon2Time?: number;       // default: 2
  argon2Memory?: number;     // default: 19456 (19 MB)
  argon2Parallelism?: number;// default: 1
  scryptN?: number;          // default: 32768
  scryptR?: number;          // default: 8
  scryptP?: number;          // default: 1
  prfEntropy?: Uint8Array;   // Optional WebAuthn PRF entropy for dual-factor key derivation
}

export interface DecryptedDot1Vault {
  seed: Uint8Array;
  mnemonic?: string;
  metadata?: Record<string, unknown>;
}

interface InternalPayload {
  v: number;
  seedHex: string;
  mnemonic?: string;
  metadata?: Record<string, unknown>;
  createdAt: number;
}

// Instantiate Base58Check encoder with SHA-256
const b58check = base58check(sha256);

/**
 * Generate cryptographically secure random bytes using CSPRNG.
 * Non-negotiable: Never uses Math.random().
 */
export function secureRandomBytes(length: number): Uint8Array {
  if (length <= 0) return new Uint8Array(0);
  const bytes = new Uint8Array(length);
  if (typeof globalThis.crypto !== 'undefined' && typeof globalThis.crypto.getRandomValues === 'function') {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    throw new Error('Secure CSPRNG (crypto.getRandomValues) is not available in this environment');
  }
  return bytes;
}

/**
 * Derives a 32-byte key from password/secret and salt according to KDF type and parameters.
 */
function deriveKey(
  secretKeyOrPassword: string | Uint8Array,
  salt: Uint8Array,
  kdfType: KdfTypeCode,
  params: {
    pbkdf2Iterations?: number;
    argon2Time?: number;
    argon2Memory?: number;
    argon2Parallelism?: number;
    scryptN?: number;
    scryptR?: number;
    scryptP?: number;
  },
  prfEntropy?: Uint8Array
): Uint8Array {
  const secretBytes = typeof secretKeyOrPassword === 'string'
    ? utf8ToBytes(secretKeyOrPassword)
    : secretKeyOrPassword;

  let baseKey: Uint8Array;

  switch (kdfType) {
    case KdfTypeCode.NONE: {
      if (secretBytes.length === 32) {
        baseKey = new Uint8Array(secretBytes);
      } else {
        // Deterministically hash to 32 bytes using SHA-256 if not already 32 bytes
        baseKey = sha256(secretBytes);
      }
      break;
    }
    case KdfTypeCode.PBKDF2: {
      const iterations = params.pbkdf2Iterations || 100_000;
      baseKey = pbkdf2(sha256, secretBytes, salt, { c: iterations, dkLen: 32 });
      break;
    }
    case KdfTypeCode.ARGON2ID: {
      const t = params.argon2Time || 2;
      const m = params.argon2Memory || 19456;
      const p = params.argon2Parallelism || 1;
      baseKey = argon2id(secretBytes, salt, { t, m, p, dkLen: 32 });
      break;
    }
    case KdfTypeCode.SCRYPT: {
      const N = params.scryptN || 32768;
      const r = params.scryptR || 8;
      const p = params.scryptP || 1;
      baseKey = scrypt(secretBytes, salt, { N, r, p, dkLen: 32 });
      break;
    }
    default:
      throw new Error(`Unsupported KDF type code: 0x${(kdfType as number).toString(16)}`);
  }

  // If additional WebAuthn PRF entropy is provided, combine it using HKDF-SHA256
  if (prfEntropy && prfEntropy.length > 0) {
    return hkdf(sha256, prfEntropy, baseKey, utf8ToBytes('DOT_PRF_DUAL_FACTOR_V1'), 32);
  }

  return baseKey;
}

/**
 * Encrypts a plaintext seed or mnemonic into a versioned `dot1` envelope.
 * 
 * @param plaintextSeed BIP-39 mnemonic string, hex seed string, or raw Uint8Array
 * @param secretKeyOrPassword Password string or direct 32-byte secret
 * @param metadata Optional non-sensitive metadata (chains, creation date, label)
 * @param options KDF algorithms, work factors, and WebAuthn PRF entropy
 * @returns Serialized `dot1_...` envelope string
 */
export async function encryptDot1(
  plaintextSeed: Uint8Array | string,
  secretKeyOrPassword: string | Uint8Array,
  metadata?: Record<string, unknown>,
  options: Dot1EncryptOptions = {}
): Promise<string> {
  if (!plaintextSeed || (typeof plaintextSeed === 'string' && plaintextSeed.trim().length === 0)) {
    throw new Error('Cannot encrypt empty plaintext seed');
  }
  if (!secretKeyOrPassword || (typeof secretKeyOrPassword === 'string' && secretKeyOrPassword.length === 0)) {
    throw new Error('Encryption requires a non-empty password or secret key');
  }

  // 1. Process plaintext seed & mnemonic
  let seedBytes: Uint8Array;
  let mnemonicPhrase: string | undefined = undefined;

  if (typeof plaintextSeed === 'string') {
    const trimmed = plaintextSeed.trim();
    // Check if it's a valid BIP-39 mnemonic phrase
    if (trimmed.includes(' ') && validateMnemonic(trimmed, wordlist)) {
      mnemonicPhrase = trimmed;
      seedBytes = mnemonicToSeedSync(trimmed);
    } else if (/^(0x)?[0-9a-fA-F]+$/.test(trimmed) && trimmed.length >= 32) {
      // Hex-encoded seed
      const cleanHex = trimmed.startsWith('0x') ? trimmed.slice(2) : trimmed;
      seedBytes = hexToBytes(cleanHex);
    } else {
      // General UTF-8 seed / secret
      seedBytes = utf8ToBytes(trimmed);
    }
  } else {
    seedBytes = plaintextSeed;
  }

  // Check if mnemonic is explicitly provided in metadata
  if (!mnemonicPhrase && metadata && typeof (metadata as Record<string, unknown>).mnemonic === 'string') {
    mnemonicPhrase = (metadata as Record<string, unknown>).mnemonic as string;
  }

  // Clean metadata to avoid duplicate mnemonic if already structured
  const cleanMetadata = metadata ? { ...metadata } : undefined;
  if (cleanMetadata && 'mnemonic' in cleanMetadata) {
    delete cleanMetadata.mnemonic;
  }

  // 2. Prepare inner JSON payload
  const innerPayload: InternalPayload = {
    v: 1,
    seedHex: bytesToHex(seedBytes),
    mnemonic: mnemonicPhrase,
    metadata: cleanMetadata,
    createdAt: Date.now(),
  };

  const plaintextBytes = utf8ToBytes(JSON.stringify(innerPayload));

  // 3. Determine KDF algorithm and parameters
  let kdfType: KdfTypeCode;
  const kdfChoice = options.kdf;

  if (kdfChoice === 'none' || (!kdfChoice && secretKeyOrPassword instanceof Uint8Array && secretKeyOrPassword.length === 32)) {
    kdfType = KdfTypeCode.NONE;
  } else if (kdfChoice === 'argon2id') {
    kdfType = KdfTypeCode.ARGON2ID;
  } else if (kdfChoice === 'scrypt') {
    kdfType = KdfTypeCode.SCRYPT;
  } else {
    // Default to PBKDF2-HMAC-SHA256
    kdfType = KdfTypeCode.PBKDF2;
  }

  // Generate Salt & IV using CSPRNG
  const salt = kdfType === KdfTypeCode.NONE ? new Uint8Array(0) : secureRandomBytes(32);
  const iv = secureRandomBytes(12); // Standard 96-bit nonce for AES-GCM

  // 4. Derive 256-bit AES Key
  const derivedKey = deriveKey(
    secretKeyOrPassword,
    salt,
    kdfType,
    {
      pbkdf2Iterations: options.pbkdf2Iterations ?? 100_000,
      argon2Time: options.argon2Time ?? 2,
      argon2Memory: options.argon2Memory ?? 19456,
      argon2Parallelism: options.argon2Parallelism ?? 1,
      scryptN: options.scryptN ?? 32768,
      scryptR: options.scryptR ?? 8,
      scryptP: options.scryptP ?? 1,
    },
    options.prfEntropy
  );

  // 5. Encrypt with AES-256-GCM (appends 16-byte authentication tag)
  const cipher = gcm(derivedKey, iv);
  const ciphertextAndTag = cipher.encrypt(plaintextBytes);

  // 6. Build Binary Header
  // [0]: Version (1)
  // [1]: KdfType (1)
  // [2..9]: KdfParams (8)
  // [10]: SaltLen (1)
  // [11..N]: Salt
  // [N+1]: IvLen (1)
  // [N+2..M]: IV
  // [M+1..]: Ciphertext + Tag
  const headerParams = new Uint8Array(8);
  const view = new DataView(headerParams.buffer, headerParams.byteOffset, headerParams.byteLength);

  if (kdfType === KdfTypeCode.PBKDF2) {
    view.setUint32(0, options.pbkdf2Iterations ?? 100_000, false);
  } else if (kdfType === KdfTypeCode.ARGON2ID) {
    view.setUint16(0, options.argon2Time ?? 2, false);
    view.setUint32(2, options.argon2Memory ?? 19456, false);
    view.setUint8(6, options.argon2Parallelism ?? 1);
  } else if (kdfType === KdfTypeCode.SCRYPT) {
    view.setUint32(0, options.scryptN ?? 32768, false);
    view.setUint16(4, options.scryptR ?? 8, false);
    view.setUint8(6, options.scryptP ?? 1);
  }

  const saltLen = salt.length;
  const ivLen = iv.length;
  const totalLength = 1 + 1 + 8 + 1 + saltLen + 1 + ivLen + ciphertextAndTag.length;

  const binaryEnvelope = new Uint8Array(totalLength);
  let offset = 0;

  binaryEnvelope[offset++] = DOT1_VERSION;
  binaryEnvelope[offset++] = kdfType;
  binaryEnvelope.set(headerParams, offset);
  offset += 8;

  binaryEnvelope[offset++] = saltLen;
  if (saltLen > 0) {
    binaryEnvelope.set(salt, offset);
    offset += saltLen;
  }

  binaryEnvelope[offset++] = ivLen;
  binaryEnvelope.set(iv, offset);
  offset += ivLen;

  binaryEnvelope.set(ciphertextAndTag, offset);

  // 7. Base58Check encode and prefix
  const encodedPayload = b58check.encode(binaryEnvelope);
  return `${DOT1_ENVELOPE_PREFIX}${encodedPayload}`;
}

/**
 * Decrypts a `dot1` envelope string using the provided password or secret key.
 * Enforces strict tag verification and checksum validation.
 * 
 * @param envelopeStr Envelope string starting with `dot1_` (or compatible JSON backup envelope)
 * @param passwordOrSecret Password string or direct 32-byte secret key
 * @param prfEntropy Optional WebAuthn PRF entropy if used during encryption
 * @returns Decrypted seed bytes, optional mnemonic, and metadata
 */
export async function decryptDot1(
  envelopeStr: string,
  passwordOrSecret: string | Uint8Array,
  prfEntropy?: Uint8Array
): Promise<DecryptedDot1Vault> {
  if (!envelopeStr || typeof envelopeStr !== 'string') {
    throw new Error('Invalid envelope: must be a non-empty string');
  }
  if (!passwordOrSecret || (typeof passwordOrSecret === 'string' && passwordOrSecret.length === 0)) {
    throw new Error('Decryption requires a non-empty password or secret key');
  }

  const trimmed = envelopeStr.trim();

  // Handle JSON backup envelope if passed
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    return decryptJsonBackupEnvelope(trimmed, passwordOrSecret, prfEntropy);
  }

  // Standard `dot1_...` envelope
  if (!trimmed.startsWith(DOT1_ENVELOPE_PREFIX)) {
    throw new Error(`Invalid envelope prefix: expected "${DOT1_ENVELOPE_PREFIX}"`);
  }

  const rawBase58 = trimmed.slice(DOT1_ENVELOPE_PREFIX.length);
  if (!rawBase58) {
    throw new Error('Envelope payload is empty');
  }

  // 1. Base58Check decode (validates SHA-256 checksum)
  let binaryEnvelope: Uint8Array;
  try {
    binaryEnvelope = b58check.decode(rawBase58);
  } catch (err) {
    throw new Error(`Envelope checksum or base58 decode error: ${(err as Error).message}`);
  }

  if (binaryEnvelope.length < 24) {
    throw new Error('Envelope is malformed or truncated');
  }

  // 2. Parse binary header
  let offset = 0;
  const version = binaryEnvelope[offset++];
  if (version !== DOT1_VERSION) {
    throw new Error(`Unsupported envelope version: ${version} (expected ${DOT1_VERSION})`);
  }

  const kdfType = binaryEnvelope[offset++] as KdfTypeCode;
  const headerParams = binaryEnvelope.subarray(offset, offset + 8);
  offset += 8;
  const view = new DataView(headerParams.buffer, headerParams.byteOffset, headerParams.byteLength);

  let pbkdf2Iterations: number | undefined;
  let argon2Time: number | undefined;
  let argon2Memory: number | undefined;
  let argon2Parallelism: number | undefined;
  let scryptN: number | undefined;
  let scryptR: number | undefined;
  let scryptP: number | undefined;

  if (kdfType === KdfTypeCode.PBKDF2) {
    pbkdf2Iterations = view.getUint32(0, false);
  } else if (kdfType === KdfTypeCode.ARGON2ID) {
    argon2Time = view.getUint16(0, false);
    argon2Memory = view.getUint32(2, false);
    argon2Parallelism = view.getUint8(6);
  } else if (kdfType === KdfTypeCode.SCRYPT) {
    scryptN = view.getUint32(0, false);
    scryptR = view.getUint16(4, false);
    scryptP = view.getUint8(6);
  }

  const saltLen = binaryEnvelope[offset++];
  if (binaryEnvelope.length < offset + saltLen + 1 + 12 + 16) {
    throw new Error('Envelope truncated while reading salt/IV');
  }

  const salt = binaryEnvelope.subarray(offset, offset + saltLen);
  offset += saltLen;

  const ivLen = binaryEnvelope[offset++];
  if (ivLen !== 12) {
    throw new Error(`Invalid IV length: expected 12 bytes for AES-GCM, got ${ivLen}`);
  }

  const iv = binaryEnvelope.subarray(offset, offset + ivLen);
  offset += ivLen;

  const ciphertextAndTag = binaryEnvelope.subarray(offset);
  if (ciphertextAndTag.length < 16) {
    throw new Error('Ciphertext is too short: missing AES-GCM authentication tag');
  }

  // 3. Derive 256-bit Key
  const derivedKey = deriveKey(
    passwordOrSecret,
    salt,
    kdfType,
    {
      pbkdf2Iterations,
      argon2Time,
      argon2Memory,
      argon2Parallelism,
      scryptN,
      scryptR,
      scryptP,
    },
    prfEntropy
  );

  // 4. Decrypt with AES-256-GCM (verifies 16-byte authentication tag)
  let decryptedBytes: Uint8Array;
  try {
    const cipher = gcm(derivedKey, iv);
    decryptedBytes = cipher.decrypt(ciphertextAndTag);
  } catch {
    throw new Error('Failed to decrypt envelope: Incorrect password/key or corrupted ciphertext (MAC check failed)');
  }

  // 5. Unpack payload
  try {
    const jsonStr = new TextDecoder().decode(decryptedBytes);
    const parsed = JSON.parse(jsonStr) as InternalPayload;
    if (parsed.seedHex) {
      return {
        seed: hexToBytes(parsed.seedHex),
        mnemonic: parsed.mnemonic,
        metadata: parsed.metadata,
      };
    }
  } catch {
    // If not JSON, return as raw decrypted seed
  }

  return {
    seed: decryptedBytes,
    metadata: undefined,
  };
}

/**
 * Decrypts a structured JSON backup envelope (format compatible with Dot1BackupEnvelope).
 */
async function decryptJsonBackupEnvelope(
  jsonStr: string,
  passwordOrSecret: string | Uint8Array,
  prfEntropy?: Uint8Array
): Promise<DecryptedDot1Vault> {
  const obj = JSON.parse(jsonStr);
  if (obj.format !== 'dot1' || obj.version !== 1) {
    throw new Error('Unsupported JSON envelope format or version');
  }

  const kdfAlgo = obj.kdf?.algorithm;
  let kdfType: KdfTypeCode = KdfTypeCode.PBKDF2;
  if (kdfAlgo === 'argon2id') kdfType = KdfTypeCode.ARGON2ID;
  else if (kdfAlgo === 'scrypt') kdfType = KdfTypeCode.SCRYPT;
  else if (kdfAlgo === 'none') kdfType = KdfTypeCode.NONE;

  const salt = obj.kdf?.saltHex ? hexToBytes(obj.kdf.saltHex) : new Uint8Array(0);
  const iv = hexToBytes(obj.cipher.ivHex);
  const ciphertext = hexToBytes(obj.ciphertextHex);
  const authTag = hexToBytes(obj.cipher.authTagHex);

  // Concatenate ciphertext and authTag for noble-ciphers
  const ciphertextAndTag = new Uint8Array(ciphertext.length + authTag.length);
  ciphertextAndTag.set(ciphertext, 0);
  ciphertextAndTag.set(authTag, ciphertext.length);

  const derivedKey = deriveKey(
    passwordOrSecret,
    salt,
    kdfType,
    {
      pbkdf2Iterations: obj.kdf?.iterations,
      argon2Time: obj.kdf?.iterations,
      argon2Memory: obj.kdf?.memory,
      argon2Parallelism: obj.kdf?.parallelism,
    },
    prfEntropy
  );

  let decryptedBytes: Uint8Array;
  try {
    const cipher = gcm(derivedKey, iv);
    decryptedBytes = cipher.decrypt(ciphertextAndTag);
  } catch {
    throw new Error('Failed to decrypt JSON backup: Incorrect password or corrupted data');
  }

  try {
    const jsonParsed = JSON.parse(new TextDecoder().decode(decryptedBytes)) as InternalPayload;
    if (jsonParsed.seedHex) {
      return {
        seed: hexToBytes(jsonParsed.seedHex),
        mnemonic: jsonParsed.mnemonic,
        metadata: jsonParsed.metadata,
      };
    }
  } catch {
    // fallback to raw bytes
  }

  return {
    seed: decryptedBytes,
    metadata: { chains: obj.chains },
  };
}

/**
 * Creates a structured JSON backup envelope conforming to Dot1BackupEnvelope.
 */
export async function createDot1JsonBackup(
  plaintextSeed: Uint8Array | string,
  passwordFallback: string,
  options?: {
    kdf?: KdfAlgorithm;
    metadata?: Record<string, unknown>;
  }
): Promise<string> {
  const kdfAlgo = options?.kdf || 'argon2id';
  const salt = secureRandomBytes(32);
  const iv = secureRandomBytes(12);

  const memory = 19456;
  const iterations = 2;
  const parallelism = 1;

  const derivedKey = deriveKey(
    passwordFallback,
    salt,
    kdfAlgo === 'argon2id' ? KdfTypeCode.ARGON2ID : KdfTypeCode.PBKDF2,
    {
      argon2Memory: memory,
      argon2Time: iterations,
      argon2Parallelism: parallelism,
      pbkdf2Iterations: 100_000,
    }
  );

  let rawBytes: Uint8Array;
  if (typeof plaintextSeed === 'string') {
    rawBytes = utf8ToBytes(plaintextSeed);
  } else {
    rawBytes = plaintextSeed;
  }

  const payload: InternalPayload = {
    v: 1,
    seedHex: bytesToHex(rawBytes),
    mnemonic: typeof options?.metadata?.mnemonic === 'string' ? options.metadata.mnemonic : undefined,
    metadata: options?.metadata,
    createdAt: Date.now(),
  };

  const plaintextBytes = utf8ToBytes(JSON.stringify(payload));
  const cipher = gcm(derivedKey, iv);
  const encryptedAndTag = cipher.encrypt(plaintextBytes);

  // Split ciphertext and 16-byte tag
  const ciphertextBytes = encryptedAndTag.subarray(0, encryptedAndTag.length - 16);
  const authTagBytes = encryptedAndTag.subarray(encryptedAndTag.length - 16);

  const checksum = bytesToHex(sha256(ciphertextBytes));

  const envelope = {
    format: 'dot1',
    version: 1,
    kdf: {
      algorithm: kdfAlgo,
      memory,
      iterations,
      parallelism,
      saltHex: bytesToHex(salt),
    },
    cipher: {
      algorithm: 'aes-256-gcm',
      ivHex: bytesToHex(iv),
      authTagHex: bytesToHex(authTagBytes),
    },
    ciphertextHex: bytesToHex(ciphertextBytes),
    createdAt: (options?.metadata?.createdAt as string) || new Date().toISOString(),
    chains: (options?.metadata?.chains as ('ethereum' | 'bitcoin' | 'solana')[]) || ['ethereum', 'bitcoin', 'solana'],
    checksum,
  };

  return JSON.stringify(envelope, null, 2);
}

/**
 * Parses and verifies a structured JSON backup envelope conforming to Dot1BackupEnvelope.
 */
export async function parseDot1JsonBackup(
  jsonStr: string,
  passwordFallback: string
): Promise<DecryptedDot1Vault> {
  return decryptDot1(jsonStr, passwordFallback);
}
