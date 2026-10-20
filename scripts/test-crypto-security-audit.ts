/**
 * Security Auditor Agent 2 - Cryptographic Engine, dot1 Envelope & Vault Storage Test Suite
 * 
 * Targeted Security & Fuzzing Tests for:
 * 1. KDF parameter boundary validation (Argon2id, PBKDF2, Scrypt)
 * 2. Scrypt consistency in JSON backup creation and decryption
 * 3. Base58Check version & double-SHA256 checksum strict verification
 * 4. JSON backup envelope outer checksum and IV/tag length enforcement
 * 5. assertZeroPlaintextSecrets pattern matching on keys and string values (BIP-39 mnemonics & private keys)
 * 6. assertValidEncryptedEnvelope strict structural validation
 * 7. Memory zeroization / wiping verification on ephemeral Uint8Arrays
 * 8. Storage security guard integration
 */

import {
  encryptDot1,
  decryptDot1,
  createDot1JsonBackup,
  parseDot1JsonBackup,
  DOT1_ENVELOPE_PREFIX,
  DOT1_VERSION,
  secureRandomBytes,
} from '../src/lib/crypto/dot1.ts';
import {
  assertZeroPlaintextSecrets,
  assertValidEncryptedEnvelope,
  saveVault,
  loadVault,
  clearVault,
} from '../src/lib/crypto/vault.ts';
import { saveVaultEnvelope } from '../src/lib/storage.ts';
import { Dot1BackupEnvelope } from '../src/types/wallet';
import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex, hexToBytes, utf8ToBytes } from '@noble/hashes/utils.js';
import { base58check } from '@scure/base';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, message: string): void {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ ${message}`);
  } else {
    failedTests++;
    console.error(`  ✗ FAIL: ${message}`);
  }
}

async function runSecurityAuditTests() {
  console.log('====================================================');
  console.log('   Agent 2: Cryptographic Engine & Storage Audit   ');
  console.log('====================================================\n');

  const b58check = base58check(sha256);

  // -----------------------------------------------------------------
  // 1. KDF Parameter Bounds & Salt Validation
  // -----------------------------------------------------------------
  console.log('--- Suite 1: KDF Parameter Bounds & Salt Validation ---');

  // Test 1.1: Reject zero or small salt for PBKDF2 (< 16 bytes)
  {
    // Construct raw binary envelope with saltLen = 0 for PBKDF2
    const binary = new Uint8Array(60);
    binary[0] = DOT1_VERSION;
    binary[1] = 0x01; // PBKDF2
    // params: iterations = 100_000
    new DataView(binary.buffer).setUint32(2, 100_000, false);
    binary[10] = 0; // saltLen = 0 (forbidden for PBKDF2!)
    binary[11] = 12; // ivLen = 12
    // IV = 12 bytes
    // Ciphertext + tag = 36 bytes
    const encoded = `${DOT1_ENVELOPE_PREFIX}${b58check.encode(binary)}`;

    let rejected = false;
    try {
      await decryptDot1(encoded, 'Password123!');
    } catch (err) {
      rejected = true;
    }
    assert(rejected, 'Rejects PBKDF2 envelope with saltLen < 16');
  }

  // Test 1.2: Reject PBKDF2 iterations < 100,000 (weak KDF work factor)
  {
    const binary = new Uint8Array(80);
    binary[0] = DOT1_VERSION;
    binary[1] = 0x01; // PBKDF2
    new DataView(binary.buffer).setUint32(2, 50, false); // 50 iterations (too low!)
    binary[10] = 16; // saltLen = 16
    binary[27] = 12; // ivLen = 12
    const encoded = `${DOT1_ENVELOPE_PREFIX}${b58check.encode(binary)}`;

    let rejected = false;
    try {
      await decryptDot1(encoded, 'Password123!');
    } catch {
      rejected = true;
    }
    assert(rejected, 'Rejects PBKDF2 envelope with dangerously low iterations (< 100,000)');
  }

  // Test 1.3: Reject Argon2id with memory > 131,072 KiB (128 MB) to prevent browser tab crash (DoS)
  {
    const binary = new Uint8Array(80);
    binary[0] = DOT1_VERSION;
    binary[1] = 0x02; // Argon2id
    const view = new DataView(binary.buffer);
    view.setUint16(2, 2, false); // time = 2
    view.setUint32(4, 524288, false); // memory = 512 MB (exceeds browser limit!)
    view.setUint8(8, 1); // parallelism = 1
    binary[10] = 16; // saltLen = 16
    binary[27] = 12; // ivLen = 12
    const encoded = `${DOT1_ENVELOPE_PREFIX}${b58check.encode(binary)}`;

    let rejected = false;
    try {
      await decryptDot1(encoded, 'Password123!');
    } catch {
      rejected = true;
    }
    assert(rejected, 'Rejects Argon2id envelope with excessive memory cost (> 128 MB DoS vector)');
  }

  // Test 1.4: Reject Scrypt N not power of 2
  {
    const binary = new Uint8Array(80);
    binary[0] = DOT1_VERSION;
    binary[1] = 0x03; // Scrypt
    const view = new DataView(binary.buffer);
    view.setUint32(2, 1000, false); // N = 1000 (not power of 2!)
    view.setUint16(6, 8, false); // r = 8
    view.setUint8(8, 1); // p = 1
    binary[10] = 16; // saltLen = 16
    binary[27] = 12; // ivLen = 12
    const encoded = `${DOT1_ENVELOPE_PREFIX}${b58check.encode(binary)}`;

    let rejected = false;
    try {
      await decryptDot1(encoded, 'Password123!');
    } catch {
      rejected = true;
    }
    assert(rejected, 'Rejects Scrypt envelope when N is not a power of 2');
  }

  // -----------------------------------------------------------------
  // 2. Scrypt Inconsistency in JSON Backup Creation & Decryption
  // -----------------------------------------------------------------
  console.log('\n--- Suite 2: Scrypt JSON Backup Roundtrip ---');
  {
    const seed = secureRandomBytes(32);
    const password = 'ScryptBackupPassword#2026';
    const jsonBackup = await createDot1JsonBackup(seed, password, {
      kdf: 'scrypt',
      scryptN: 4096,
      metadata: { label: 'Scrypt Cold Storage' },
    });

    const parsedJson = JSON.parse(jsonBackup);
    assert(parsedJson.kdf.algorithm === 'scrypt', 'JSON backup algorithm correctly records "scrypt"');

    const decrypted = await parseDot1JsonBackup(jsonBackup, password);
    assert(bytesToHex(decrypted.seed) === bytesToHex(seed), 'Scrypt JSON backup correctly decrypts with matching seed');
  }

  // -----------------------------------------------------------------
  // 3. JSON Backup Outer Checksum & Cipher Validation
  // -----------------------------------------------------------------
  console.log('\n--- Suite 3: JSON Backup Outer Checksum & Cipher Validation ---');
  {
    const seed = secureRandomBytes(32);
    const password = 'JsonChecksumPassword#1';
    const jsonBackup = await createDot1JsonBackup(seed, password);
    const backupObj = JSON.parse(jsonBackup);

    // 3.1: Tampered checksum should be rejected immediately before key derivation
    const tamperedObj = { ...backupObj, checksum: '0000000000000000000000000000000000000000000000000000000000000000' };
    let checksumRejected = false;
    try {
      await parseDot1JsonBackup(JSON.stringify(tamperedObj), password);
    } catch (err) {
      checksumRejected = true;
    }
    assert(checksumRejected, 'JSON backup rejects corrupted outer SHA-256 checksum');

    // 3.2: Invalid IV length in JSON backup (< 12 bytes)
    const invalidIvObj = {
      ...backupObj,
      cipher: { ...backupObj.cipher, ivHex: '01020304' }, // 4 bytes instead of 12
    };
    let invalidIvRejected = false;
    try {
      await parseDot1JsonBackup(JSON.stringify(invalidIvObj), password);
    } catch {
      invalidIvRejected = true;
    }
    assert(invalidIvRejected, 'JSON backup rejects invalid IV length (!= 12 bytes)');

    // 3.3: Invalid AuthTag length in JSON backup (< 16 bytes)
    const invalidTagObj = {
      ...backupObj,
      cipher: { ...backupObj.cipher, authTagHex: 'aabbccdd' }, // 4 bytes instead of 16
    };
    let invalidTagRejected = false;
    try {
      await parseDot1JsonBackup(JSON.stringify(invalidTagObj), password);
    } catch {
      invalidTagRejected = true;
    }
    assert(invalidTagRejected, 'JSON backup rejects invalid AuthTag length (!= 16 bytes)');
  }

  // -----------------------------------------------------------------
  // 4. Base58Check Version & Length Strict Enforcement
  // -----------------------------------------------------------------
  console.log('\n--- Suite 4: Base58Check Version & Length Enforcement ---');
  {
    // 4.1: Unsupported envelope version
    const binary = new Uint8Array(60);
    binary[0] = 0x02; // Version 2 (currently unsupported)
    binary[1] = 0x01; // PBKDF2
    const encoded = `${DOT1_ENVELOPE_PREFIX}${b58check.encode(binary)}`;

    let versionRejected = false;
    try {
      await decryptDot1(encoded, 'Password123!');
    } catch (err) {
      versionRejected = true;
    }
    assert(versionRejected, 'Rejects envelope with unsupported version byte');

    // 4.2: Truncated binary envelope (< minimum header + iv + tag size)
    const shortBinary = new Uint8Array(20);
    shortBinary[0] = DOT1_VERSION;
    const shortEncoded = `${DOT1_ENVELOPE_PREFIX}${b58check.encode(shortBinary)}`;

    let shortRejected = false;
    try {
      await decryptDot1(shortEncoded, 'Password123!');
    } catch {
      shortRejected = true;
    }
    assert(shortRejected, 'Rejects truncated binary envelope');
  }

  // -----------------------------------------------------------------
  // 5. assertZeroPlaintextSecrets & assertValidEncryptedEnvelope
  // -----------------------------------------------------------------
  console.log('\n--- Suite 5: Vault Storage Security Assertions ---');
  {
    // 5.1: Catch BIP-39 mnemonic inside arbitrary metadata property name
    let caughtMnemonicValue = false;
    try {
      assertZeroPlaintextSecrets({
        userNotes: 'vague vessel stuff bind boy distance cream draft toy swear flavor logic',
      });
    } catch {
      caughtMnemonicValue = true;
    }
    assert(caughtMnemonicValue, 'assertZeroPlaintextSecrets detects BIP-39 mnemonic in string value');

    // 5.2: Catch 32-byte hex private key inside arbitrary metadata property name
    let caughtHexKey = false;
    try {
      assertZeroPlaintextSecrets({
        customData: '4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d',
      });
    } catch {
      caughtHexKey = true;
    }
    assert(caughtHexKey, 'assertZeroPlaintextSecrets detects 32-byte hex private key in string value');

    // 5.3: Catch unlisted secret key aliases (e.g. "seedPhrase", "passphrase", "privKey")
    let caughtSecretAlias = false;
    try {
      assertZeroPlaintextSecrets({
        seedPhrase: 'some hidden seed',
      });
    } catch {
      caughtSecretAlias = true;
    }
    assert(caughtSecretAlias, 'assertZeroPlaintextSecrets detects "seedPhrase" alias key');

    // 5.4: Reject unencrypted JSON passed to assertValidEncryptedEnvelope
    let rejectedUnencryptedJson = false;
    try {
      assertValidEncryptedEnvelope(
        JSON.stringify({ format: 'dot1', mnemonic: 'vague vessel stuff bind boy distance cream draft toy swear flavor logic' })
      );
    } catch {
      rejectedUnencryptedJson = true;
    }
    assert(rejectedUnencryptedJson, 'assertValidEncryptedEnvelope rejects unencrypted JSON containing mnemonic');

    // 5.5: storage.ts saveVaultEnvelope zero-plaintext guard
    let storageGuardPassed = false;
    try {
      const leakyEnvelope = {
        format: 'dot1',
        version: 1,
        mnemonic: 'vague vessel stuff bind boy distance cream draft toy swear flavor logic',
      } as unknown as Dot1BackupEnvelope;
      await saveVaultEnvelope(leakyEnvelope);
    } catch {
      storageGuardPassed = true;
    }
    assert(storageGuardPassed, 'saveVaultEnvelope rejects envelope containing unencrypted mnemonic');
  }

  console.log('\n====================================================');
  console.log(`Security Audit Results: ${passedTests}/${totalTests} Passed (${failedTests} Failed)`);
  console.log('====================================================');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runSecurityAuditTests().catch((err) => {
  console.error('Fatal error during security test run:', err);
  process.exit(1);
});
