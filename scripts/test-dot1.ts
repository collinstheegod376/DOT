/**
 * DOT Crypto Engine & Key Vault - Comprehensive Test Suite
 * 
 * Verifies:
 * 1. PBKDF2-HMAC-SHA256 encrypt/decrypt roundtrip with BIP-39 mnemonic.
 * 2. Argon2id encrypt/decrypt roundtrip with configurable work factors.
 * 3. Scrypt encrypt/decrypt roundtrip.
 * 4. Direct 32-byte secret (WebAuthn PRF direct key) encrypt/decrypt.
 * 5. Dual-factor WebAuthn PRF entropy + password mixing.
 * 6. Tamper resistance: 1-bit ciphertext modification triggers MAC/tag failure.
 * 7. Wrong password rejection.
 * 8. Base58Check checksum corruption detection.
 * 9. WebAuthn PRF deterministic key derivation via HKDF.
 * 10. Vault storage security guards (zero plaintext in metadata).
 */

import {
  encryptDot1,
  decryptDot1,
  DOT1_ENVELOPE_PREFIX,
  secureRandomBytes,
} from '../src/lib/crypto/dot1.ts';
import {
  deriveKeyFromPrf,
  getDefaultPrfSalt,
} from '../src/lib/crypto/webauthn-prf.ts';
import {
  assertZeroPlaintextSecrets,
  assertValidEncryptedEnvelope,
} from '../src/lib/crypto/vault.ts';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils.js';
import { mnemonicToSeedSync } from '@scure/bip39';

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

async function runTestSuite() {
  console.log('====================================================');
  console.log('   DOT Crypto Engine & Key Vault Test Suite        ');
  console.log('====================================================\n');

  // Test 1: PBKDF2 with BIP-39 Mnemonic
  console.log('Test 1: PBKDF2 with BIP-39 Mnemonic');
  {
    const testMnemonic = 'vague vessel stuff bind boy distance cream draft toy swear flavor logic';
    const testPassword = 'SuperSecretWalletPassword!2026';
    const expectedSeed = mnemonicToSeedSync(testMnemonic);
    const metadata = { label: 'Primary Test Vault', chains: ['ethereum', 'solana'] };

    const envelope = await encryptDot1(testMnemonic, testPassword, metadata, {
      kdf: 'pbkdf2',
      pbkdf2Iterations: 10_000, // fast iterations for test runner
    });

    assert(envelope.startsWith(DOT1_ENVELOPE_PREFIX), `Envelope starts with "${DOT1_ENVELOPE_PREFIX}"`);
    assert(envelope.length > 50, 'Envelope has valid length');

    const decrypted = await decryptDot1(envelope, testPassword);
    const meta = decrypted.metadata as Record<string, unknown> | undefined;
    assert(decrypted.mnemonic === testMnemonic, 'Decrypted mnemonic exactly matches original');
    assert(bytesToHex(decrypted.seed) === bytesToHex(expectedSeed), 'Decrypted seed matches BIP-39 seed');
    assert(meta?.label === 'Primary Test Vault', 'Metadata label preserved');
    assert(Array.isArray(meta?.chains), 'Metadata chains preserved');
  }

  // Test 2: Argon2id with raw seed bytes
  console.log('\nTest 2: Argon2id with raw 32-byte seed');
  {
    const rawSeed = secureRandomBytes(32);
    const testPassword = 'Argon2idVaultPassword_99';
    const metadata = { creationType: 'hardware-airgap' };

    const envelope = await encryptDot1(rawSeed, testPassword, metadata, {
      kdf: 'argon2id',
      argon2Time: 2,
      argon2Memory: 16384, // 16 MB
      argon2Parallelism: 1,
    });

    assert(envelope.startsWith(DOT1_ENVELOPE_PREFIX), 'Argon2id envelope generated successfully');

    const decrypted = await decryptDot1(envelope, testPassword);
    const meta2 = decrypted.metadata as Record<string, unknown> | undefined;
    assert(bytesToHex(decrypted.seed) === bytesToHex(rawSeed), 'Decrypted seed matches raw bytes');
    assert(meta2?.creationType === 'hardware-airgap', 'Argon2id metadata preserved');
  }

  // Test 3: Scrypt encryption & decryption
  console.log('\nTest 3: Scrypt encryption and decryption');
  {
    const rawSeed = secureRandomBytes(32);
    const testPassword = 'ScryptPassword#42';

    const envelope = await encryptDot1(rawSeed, testPassword, undefined, {
      kdf: 'scrypt',
      scryptN: 4096,
      scryptR: 8,
      scryptP: 1,
    });

    const decrypted = await decryptDot1(envelope, testPassword);
    assert(bytesToHex(decrypted.seed) === bytesToHex(rawSeed), 'Scrypt decrypted seed matches original');
  }

  // Test 4: Direct 32-byte Secret Key (WebAuthn PRF Direct Key)
  console.log('\nTest 4: Direct 32-byte Secret Key (WebAuthn PRF Direct)');
  {
    const rawSeed = secureRandomBytes(32);
    const directPrfKey = secureRandomBytes(32);

    const envelope = await encryptDot1(rawSeed, directPrfKey, { authType: 'webauthn-prf' }, {
      kdf: 'none',
    });

    const decrypted = await decryptDot1(envelope, directPrfKey);
    const meta4 = decrypted.metadata as Record<string, unknown> | undefined;
    assert(bytesToHex(decrypted.seed) === bytesToHex(rawSeed), 'Direct PRF key decrypted seed matches original');
    assert(meta4?.authType === 'webauthn-prf', 'Direct PRF metadata preserved');
  }

  // Test 5: Dual-Factor WebAuthn PRF Entropy + Password Mixing
  console.log('\nTest 5: Dual-Factor PRF Entropy + Password Mixing');
  {
    const testMnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
    const password = 'DualFactorPassword!';
    const prfEntropy = secureRandomBytes(32);

    const envelope = await encryptDot1(testMnemonic, password, undefined, {
      kdf: 'pbkdf2',
      pbkdf2Iterations: 10_000,
      prfEntropy,
    });

    // Decrypt with correct password AND correct PRF entropy
    const decrypted = await decryptDot1(envelope, password, prfEntropy);
    assert(decrypted.mnemonic === testMnemonic, 'Dual-factor decryption succeeds with matching PRF entropy');

    // Decrypt with correct password but WRONG PRF entropy must fail
    const wrongPrfEntropy = secureRandomBytes(32);
    let wrongPrfFailed = false;
    try {
      await decryptDot1(envelope, password, wrongPrfEntropy);
    } catch {
      wrongPrfFailed = true;
    }
    assert(wrongPrfFailed, 'Decryption with incorrect PRF entropy fails MAC tag verification');

    // Decrypt without PRF entropy must fail
    let missingPrfFailed = false;
    try {
      await decryptDot1(envelope, password);
    } catch {
      missingPrfFailed = true;
    }
    assert(missingPrfFailed, 'Decryption without required PRF entropy fails');
  }

  // Test 6: Tamper Resistance (Ciphertext Modification MAC Failure)
  console.log('\nTest 6: Tamper Resistance (MAC check)');
  {
    const testMnemonic = 'vague vessel stuff bind boy distance cream draft toy swear flavor logic';
    const password = 'TamperTestPassword';

    const envelope = await encryptDot1(testMnemonic, password, undefined, {
      kdf: 'pbkdf2',
      pbkdf2Iterations: 5_000,
    });

    // Modify a character near the end of the base58 string to tamper with ciphertext/tag
    const prefix = envelope.slice(0, DOT1_ENVELOPE_PREFIX.length);
    const body = envelope.slice(DOT1_ENVELOPE_PREFIX.length);
    // Replace body's 10th char with a different valid Base58 char
    const charToSwap = body[10] === 'a' ? 'b' : 'a';
    const tamperedEnvelope = `${prefix}${body.slice(0, 10)}${charToSwap}${body.slice(11)}`;

    let tamperCaught = false;
    try {
      await decryptDot1(tamperedEnvelope, password);
    } catch {
      tamperCaught = true;
    }
    assert(tamperCaught, 'Tampered envelope rejected by checksum or MAC verification');
  }

  // Test 7: Wrong Password Rejection
  console.log('\nTest 7: Wrong Password Rejection');
  {
    const testMnemonic = 'vague vessel stuff bind boy distance cream draft toy swear flavor logic';
    const password = 'CorrectPassword_123';
    const wrongPassword = 'IncorrectPassword_999';

    const envelope = await encryptDot1(testMnemonic, password, undefined, {
      kdf: 'pbkdf2',
      pbkdf2Iterations: 5_000,
    });

    let failedAsExpected = false;
    try {
      await decryptDot1(envelope, wrongPassword);
    } catch {
      failedAsExpected = true;
    }
    assert(failedAsExpected, 'Decryption with incorrect password failed');
  }

  // Test 8: Base58Check Checksum Corruption Detection
  console.log('\nTest 8: Base58Check Checksum Verification');
  {
    const testSeed = secureRandomBytes(32);
    const envelope = await encryptDot1(testSeed, 'MyPassword');

    // Corrupt last character (in checksum area)
    const corruptedEnvelope = envelope.slice(0, -1) + (envelope.endsWith('z') ? 'y' : 'z');
    let checksumFailed = false;
    try {
      await decryptDot1(corruptedEnvelope, 'MyPassword');
    } catch {
      checksumFailed = true;
    }
    assert(checksumFailed, 'Corrupted base58 checksum rejected');
  }

  // Test 9: WebAuthn PRF Deterministic Key Derivation
  console.log('\nTest 9: WebAuthn PRF Deterministic Key Derivation');
  {
    const defaultSalt = getDefaultPrfSalt();
    assert(defaultSalt.length === 32, 'Default PRF salt is 32 bytes');

    const mockPrfOutput = hexToBytes('0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef');
    const key1 = deriveKeyFromPrf(mockPrfOutput);
    const key2 = deriveKeyFromPrf(mockPrfOutput);

    assert(key1.length === 32, 'Derived PRF key is 32 bytes (256 bits)');
    assert(bytesToHex(key1) === bytesToHex(key2), 'PRF key derivation is 100% deterministic');

    // Different PRF output produces different key
    const differentPrfOutput = hexToBytes('ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');
    const key3 = deriveKeyFromPrf(differentPrfOutput);
    assert(bytesToHex(key1) !== bytesToHex(key3), 'Different PRF output produces unique key');
  }

  // Test 10: Vault Storage Security Guards
  console.log('\nTest 10: Vault Storage Security Guards (Zero Plaintext Secrets)');
  {
    // 10a: Reject plaintext mnemonic in metadata
    let caughtMnemonicLeak = false;
    try {
      assertZeroPlaintextSecrets({
        label: 'My Vault',
        mnemonic: 'apple banana cherry ...',
      });
    } catch {
      caughtMnemonicLeak = true;
    }
    assert(caughtMnemonicLeak, 'assertZeroPlaintextSecrets caught "mnemonic" in metadata');

    // 10b: Reject plaintext private key in nested metadata
    let caughtPrivateKeyLeak = false;
    try {
      assertZeroPlaintextSecrets({
        nested: {
          privateKeyHex: '0x1234...',
        },
      });
    } catch {
      caughtPrivateKeyLeak = true;
    }
    assert(caughtPrivateKeyLeak, 'assertZeroPlaintextSecrets caught nested "privateKeyHex"');

    // 10c: Accept safe metadata
    let safePassed = true;
    try {
      assertZeroPlaintextSecrets({
        vaultName: 'Main Wallet',
        chains: ['ethereum', 'solana', 'bitcoin'],
        createdAt: 1770000000,
        settings: { colorTheme: 'dark' },
      });
    } catch {
      safePassed = false;
    }
    assert(safePassed, 'Safe metadata passed assertion cleanly');

    // 10d: Reject non-encrypted envelope
    let unencryptedEnvelopeCaught = false;
    try {
      assertValidEncryptedEnvelope('apple banana cherry draft toy swear flavor logic');
    } catch {
      unencryptedEnvelopeCaught = true;
    }
    assert(unencryptedEnvelopeCaught, 'assertValidEncryptedEnvelope rejected raw mnemonic string');

    // 10e: Accept valid dot1_ envelope
    let validEnvelopePassed = true;
    try {
      assertValidEncryptedEnvelope('dot1_9xK87sY...');
    } catch {
      validEnvelopePassed = false;
    }
    assert(validEnvelopePassed, 'assertValidEncryptedEnvelope accepted valid dot1_ string');
  }

  console.log('\n====================================================');
  console.log(`Test Results: ${passedTests}/${totalTests} Passed (${failedTests} Failed)`);
  console.log('====================================================');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Fatal error during test run:', err);
  process.exit(1);
});
