/**
 * DOT Crypto Engine - dot1 Envelope Format
 * 
 * Versioned envelope for secure vault storage and air-gapped backups.
 * 
 * Specification:
 * - Prefix: `dot1_`
 * - Encoding: Base58Check (double-SHA256 checksum)
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
 * - Memory zeroization: All sensitive plaintext and derived keys wiped after use.
 * - KDF boundary validation: Hard bounds against brute-force and OOM DoS attacks.
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

// Instantiate Base58Check encoder with SHA-256 (computes 4-byte double-SHA256 checksum)
const b58check = base58check(sha256);

/**
 * Explicit memory zeroization helper for sensitive plaintext buffers and derived keys.
 */
export function wipeBytes(...buffers: (Uint8Array | undefined | null)[]): void {
  for (const buf of buffers) {
    if (buf && buf instanceof Uint8Array) {
      buf.fill(0);
    }
  }
}

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
 * Cryptographic KDF parameter boundary validation.
 * Enforces safe minimums to protect against brute-force attacks and maximums to prevent browser tab crash (OOM / DoS).
 */
export function validateKdfParams(
  kdfType: KdfTypeCode,
  saltLen: number,
  params: {
    pbkdf2Iterations?: number;
    argon2Time?: number;
    argon2Memory?: number;
    argon2Parallelism?: number;
    scryptN?: number;
    scryptR?: number;
    scryptP?: number;
  }
): void {
  switch (kdfType) {
    case KdfTypeCode.NONE: {
      if (saltLen !== 0) {
        throw new Error(`Invalid salt length for direct key (KDF=NONE): expected 0, got ${saltLen}`);
      }
      break;
    }
    case KdfTypeCode.PBKDF2: {
      if (saltLen < 16 || saltLen > 64) {
        throw new Error(`Insecure PBKDF2 salt length: expected 16-64 bytes, got ${saltLen}`);
      }
      const iterations = params.pbkdf2Iterations ?? 100_000;
      if (!Number.isInteger(iterations) || iterations < 1_000) {
        throw new Error(`Insecure PBKDF2 iterations: ${iterations} is dangerously low (minimum 1,000 for tests, 100,000 standard)`);
      }
      if (iterations > 5_000_000) {
        throw new Error(`PBKDF2 iteration count too high: ${iterations} (exceeds 5,000,000 maximum, CPU DoS risk)`);
      }
      break;
    }
    case KdfTypeCode.ARGON2ID: {
      if (saltLen < 16 || saltLen > 64) {
        throw new Error(`Insecure Argon2id salt length: expected 16-64 bytes, got ${saltLen}`);
      }
      const time = params.argon2Time ?? 2;
      const mem = params.argon2Memory ?? 19456;
      const p = params.argon2Parallelism ?? 1;

      if (!Number.isInteger(time) || time < 1 || time > 10) {
        throw new Error(`Invalid Argon2id time cost: ${time} (must be integer between 1 and 10)`);
      }
      if (!Number.isInteger(mem) || mem < 8192 || mem > 131072) {
        throw new Error(`Invalid Argon2id memory cost: ${mem} KiB (must be between 8 MiB and 128 MiB to prevent browser tab crash)`);
      }
      if (!Number.isInteger(p) || p < 1 || p > 8) {
        throw new Error(`Invalid Argon2id parallelism: ${p} (must be integer between 1 and 8)`);
      }
      break;
    }
    case KdfTypeCode.SCRYPT: {
      if (saltLen < 16 || saltLen > 64) {
        throw new Error(`Insecure Scrypt salt length: expected 16-64 bytes, got ${saltLen}`);
      }
      const N = params.scryptN ?? 32768;
      const r = params.scryptR ?? 8;
      const p = params.scryptP ?? 1;

      if (!Number.isInteger(N) || N < 1024 || N > 131072 || (N & (N - 1)) !== 0) {
        throw new Error(`Invalid Scrypt N parameter: ${N} (must be a power of 2 between 1024 and 131072)`);
      }
      if (!Number.isInteger(r) || r < 1 || r > 16) {
        throw new Error(`Invalid Scrypt r parameter: ${r} (must be integer between 1 and 16)`);
      }
      if (!Number.isInteger(p) || p < 1 || p > 8) {
        throw new Error(`Invalid Scrypt p parameter: ${p} (must be integer between 1 and 8)`);
      }
      break;
    }
    default:
      throw new Error(`Unsupported KDF type code: 0x${(kdfType as number).toString(16)}`);
  }
}

/**
 * Derives a 32-byte key from password/secret and salt according to KDF type and parameters.
 * Wipes intermediate buffers on exit.
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
  // Enforce parameter boundaries before executing expensive derivation
  validateKdfParams(kdfType, salt.length, params);

  const isStringSecret = typeof secretKeyOrPassword === 'string';
  const secretBytes = isStringSecret
    ? utf8ToBytes(secretKeyOrPassword)
    : secretKeyOrPassword;

  let baseKey: Uint8Array | undefined;

  try {
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
        const iterations = params.pbkdf2Iterations ?? 100_000;
        baseKey = pbkdf2(sha256, secretBytes, salt, { c: iterations, dkLen: 32 });
        break;
      }
      case KdfTypeCode.ARGON2ID: {
        const t = params.argon2Time ?? 2;
        const m = params.argon2Memory ?? 19456;
        const p = params.argon2Parallelism ?? 1;
        baseKey = argon2id(secretBytes, salt, { t, m, p, dkLen: 32 });
        break;
      }
      case KdfTypeCode.SCRYPT: {
        const N = params.scryptN ?? 32768;
        const r = params.scryptR ?? 8;
        const p = params.scryptP ?? 1;
        baseKey = scrypt(secretBytes, salt, { N, r, p, dkLen: 32 });
        break;
      }
      default:
        throw new Error(`Unsupported KDF type code: 0x${(kdfType as number).toString(16)}`);
    }

    // If additional WebAuthn PRF entropy is provided, combine it using HKDF-SHA256
    if (prfEntropy && prfEntropy.length > 0) {
      const derived = hkdf(sha256, prfEntropy, baseKey, utf8ToBytes('DOT_PRF_DUAL_FACTOR_V1'), 32);
      wipeBytes(baseKey);
      return derived;
    }

    return baseKey;
  } finally {
    if (isStringSecret) {
      wipeBytes(secretBytes);
    }
  }
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

  let derivedKey: Uint8Array | undefined;
  try {
    // 4. Derive 256-bit AES Key
    derivedKey = deriveKey(
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
  } finally {
    wipeBytes(derivedKey, plaintextBytes);
  }
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

  // 1. Base58Check decode (strictly validates 4-byte double-SHA256 checksum)
  let binaryEnvelope: Uint8Array;
  try {
    binaryEnvelope = b58check.decode(rawBase58);
  } catch (err) {
    throw new Error(`Envelope checksum or base58 decode error: ${(err as Error).message}`);
  }

  // Minimum envelope structure:
  // 1 (ver) + 1 (kdf) + 8 (params) + 1 (saltLen) + 0 (salt) + 1 (ivLen) + 12 (iv) + 16 (tag) + 1 (ciphertext) = 41 bytes
  if (binaryEnvelope.length < 41) {
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
  // Boundary check: ensure envelope has enough bytes for salt, ivLen, iv, and tag
  if (binaryEnvelope.length < offset + saltLen + 1 + 12 + 16) {
    throw new Error('Envelope truncated while reading salt/IV');
  }

  // Enforce KDF parameter boundaries
  validateKdfParams(kdfType, saltLen, {
    pbkdf2Iterations,
    argon2Time,
    argon2Memory,
    argon2Parallelism,
    scryptN,
    scryptR,
    scryptP,
  });

  const salt = binaryEnvelope.subarray(offset, offset + saltLen);
  offset += saltLen;

  const ivLen = binaryEnvelope[offset++];
  if (ivLen !== 12) {
    throw new Error(`Invalid IV length: expected 12 bytes for AES-GCM, got ${ivLen}`);
  }

  const iv = binaryEnvelope.subarray(offset, offset + ivLen);
  offset += ivLen;

  const ciphertextAndTag = binaryEnvelope.subarray(offset);
  if (ciphertextAndTag.length < 17) {
    throw new Error('Ciphertext is too short: missing ciphertext data or AES-GCM authentication tag');
  }

  let derivedKey: Uint8Array | undefined;
  let decryptedBytes: Uint8Array | undefined;

  try {
    // 3. Derive 256-bit Key
    derivedKey = deriveKey(
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

    // 4. Decrypt with AES-256-GCM (verifies 16-byte authentication tag in constant time)
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
      if (parsed && typeof parsed.seedHex === 'string') {
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
      seed: new Uint8Array(decryptedBytes),
      metadata: undefined,
    };
  } finally {
    wipeBytes(derivedKey, decryptedBytes);
  }
}

/**
 * Decrypts a structured JSON backup envelope (format compatible with Dot1BackupEnvelope).
 */
interface JsonBackupPayload {
  format?: string;
  version?: number;
  kdf?: {
    algorithm?: string;
    iterations?: number;
    memory?: number;
    parallelism?: number;
    saltHex?: string;
    n?: number;
    r?: number;
    p?: number;
    scryptN?: number;
    scryptR?: number;
    scryptP?: number;
  };
  cipher?: {
    algorithm?: string;
    ivHex?: string;
    authTagHex?: string;
  };
  ciphertextHex?: string;
  checksum?: string;
  chains?: string[];
}

async function decryptJsonBackupEnvelope(
  jsonStr: string,
  passwordOrSecret: string | Uint8Array,
  prfEntropy?: Uint8Array
): Promise<DecryptedDot1Vault> {
  let obj: JsonBackupPayload;
  try {
    obj = JSON.parse(jsonStr) as JsonBackupPayload;
  } catch {
    throw new Error('Failed to decrypt JSON backup: Malformed JSON string');
  }

  if (obj.format !== 'dot1' || obj.version !== 1) {
    throw new Error('Unsupported JSON envelope format or version');
  }

  const kdfAlgo = obj.kdf?.algorithm;
  let kdfType: KdfTypeCode = KdfTypeCode.PBKDF2;
  if (kdfAlgo === 'argon2id') kdfType = KdfTypeCode.ARGON2ID;
  else if (kdfAlgo === 'scrypt') kdfType = KdfTypeCode.SCRYPT;
  else if (kdfAlgo === 'none') kdfType = KdfTypeCode.NONE;

  if (!obj.cipher || typeof obj.cipher !== 'object') {
    throw new Error('Invalid JSON backup: missing cipher configuration');
  }
  if (!obj.ciphertextHex || typeof obj.ciphertextHex !== 'string') {
    throw new Error('Invalid JSON backup: missing ciphertextHex');
  }

  const salt = obj.kdf?.saltHex ? hexToBytes(obj.kdf.saltHex) : new Uint8Array(0);
  const iv = hexToBytes(obj.cipher.ivHex || '');
  const ciphertext = hexToBytes(obj.ciphertextHex);
  const authTag = hexToBytes(obj.cipher.authTagHex || '');

  // Strict structural validations
  if (iv.length !== 12) {
    throw new Error(`Invalid IV length in JSON backup: expected 12 bytes, got ${iv.length}`);
  }
  if (authTag.length !== 16) {
    throw new Error(`Invalid Auth Tag length in JSON backup: expected 16 bytes, got ${authTag.length}`);
  }
  if (ciphertext.length === 0) {
    throw new Error('Invalid JSON backup: ciphertext is empty');
  }

  // Strict outer SHA-256 checksum verification if present
  if (obj.checksum && typeof obj.checksum === 'string') {
    const computedChecksum = bytesToHex(sha256(ciphertext));
    if (obj.checksum.toLowerCase() !== computedChecksum.toLowerCase()) {
      throw new Error('JSON backup envelope checksum mismatch: Ciphertext corrupted or tampered');
    }
  }

  // Concatenate ciphertext and authTag for noble-ciphers
  const ciphertextAndTag = new Uint8Array(ciphertext.length + authTag.length);
  ciphertextAndTag.set(ciphertext, 0);
  ciphertextAndTag.set(authTag, ciphertext.length);

  let derivedKey: Uint8Array | undefined;
  let decryptedBytes: Uint8Array | undefined;

  try {
    derivedKey = deriveKey(
      passwordOrSecret,
      salt,
      kdfType,
      {
        pbkdf2Iterations: obj.kdf?.iterations,
        argon2Time: obj.kdf?.iterations,
        argon2Memory: obj.kdf?.memory,
        argon2Parallelism: obj.kdf?.parallelism,
        scryptN: obj.kdf?.n ?? obj.kdf?.scryptN,
        scryptR: obj.kdf?.r ?? obj.kdf?.scryptR,
        scryptP: obj.kdf?.p ?? obj.kdf?.scryptP,
      },
      prfEntropy
    );

    try {
      const cipher = gcm(derivedKey, iv);
      decryptedBytes = cipher.decrypt(ciphertextAndTag);
    } catch {
      throw new Error('Failed to decrypt JSON backup: Incorrect password or corrupted data');
    }

    try {
      const jsonParsed = JSON.parse(new TextDecoder().decode(decryptedBytes)) as InternalPayload;
      if (jsonParsed && jsonParsed.seedHex) {
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
      seed: new Uint8Array(decryptedBytes),
      metadata: { chains: obj.chains },
    };
  } finally {
    wipeBytes(derivedKey, decryptedBytes);
  }
}

/**
 * Creates a structured JSON backup envelope conforming to Dot1BackupEnvelope.
 */
export async function createDot1JsonBackup(
  plaintextSeed: Uint8Array | string,
  passwordFallback: string | Uint8Array,
  options?: {
    kdf?: KdfAlgorithm;
    scryptN?: number;
    metadata?: Record<string, unknown>;
  }
): Promise<string> {
  const kdfAlgo = options?.kdf || (passwordFallback instanceof Uint8Array ? 'none' : 'argon2id');
  const salt = kdfAlgo === 'none' ? new Uint8Array(0) : secureRandomBytes(32);
  const iv = secureRandomBytes(12);

  const memory = 19456;
  const iterations = 2;
  const parallelism = 1;
  const scryptN = options?.scryptN ?? 32768;
  const scryptR = 8;
  const scryptP = 1;

  let kdfType: KdfTypeCode;
  if (kdfAlgo === 'argon2id') kdfType = KdfTypeCode.ARGON2ID;
  else if (kdfAlgo === 'scrypt') kdfType = KdfTypeCode.SCRYPT;
  else if (kdfAlgo === 'none') kdfType = KdfTypeCode.NONE;
  else kdfType = KdfTypeCode.PBKDF2;

  let derivedKey: Uint8Array | undefined;
  let plaintextBytes: Uint8Array | undefined;

  try {
    derivedKey = deriveKey(
      passwordFallback,
      salt,
      kdfType,
      {
        argon2Memory: memory,
        argon2Time: iterations,
        argon2Parallelism: parallelism,
        pbkdf2Iterations: 100_000,
        scryptN,
        scryptR,
        scryptP,
      }
    );

    let rawBytes: Uint8Array;
    if (typeof plaintextSeed === 'string') {
      const trimmed = plaintextSeed.trim();
      if (trimmed.includes(' ') && validateMnemonic(trimmed, wordlist)) {
        rawBytes = mnemonicToSeedSync(trimmed);
      } else {
        rawBytes = utf8ToBytes(trimmed);
      }
    } else {
      rawBytes = plaintextSeed;
    }

    // Clean metadata to avoid duplicate mnemonic if already structured
    const cleanMetadata = options?.metadata ? { ...options.metadata } : undefined;
    if (cleanMetadata && 'mnemonic' in cleanMetadata) {
      delete cleanMetadata.mnemonic;
    }

    const payload: InternalPayload = {
      v: 1,
      seedHex: bytesToHex(rawBytes),
      mnemonic: typeof options?.metadata?.mnemonic === 'string'
        ? options.metadata.mnemonic
        : typeof plaintextSeed === 'string' && plaintextSeed.trim().includes(' ')
        ? plaintextSeed.trim()
        : undefined,
      metadata: cleanMetadata,
      createdAt: Date.now(),
    };

    plaintextBytes = utf8ToBytes(JSON.stringify(payload));
    const cipher = gcm(derivedKey, iv);
    const encryptedAndTag = cipher.encrypt(plaintextBytes);

    // Split ciphertext and 16-byte tag
    const ciphertextBytes = encryptedAndTag.subarray(0, encryptedAndTag.length - 16);
    const authTagBytes = encryptedAndTag.subarray(encryptedAndTag.length - 16);

    const checksum = bytesToHex(sha256(ciphertextBytes));

    const kdfConfig: Record<string, unknown> = {
      algorithm: kdfAlgo,
      saltHex: bytesToHex(salt),
    };

    if (kdfAlgo === 'argon2id') {
      kdfConfig.memory = memory;
      kdfConfig.iterations = iterations;
      kdfConfig.parallelism = parallelism;
    } else if (kdfAlgo === 'scrypt') {
      kdfConfig.n = scryptN;
      kdfConfig.r = scryptR;
      kdfConfig.p = scryptP;
    } else if (kdfAlgo === 'pbkdf2') {
      kdfConfig.iterations = 100_000;
    }

    const envelope = {
      format: 'dot1',
      version: 1,
      kdf: kdfConfig,
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
  } finally {
    wipeBytes(derivedKey, plaintextBytes);
  }
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
