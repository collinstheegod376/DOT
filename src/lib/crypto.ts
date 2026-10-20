import {
  generateMnemonic as bip39GenerateMnemonic,
  validateMnemonic as bip39ValidateMnemonic,
  deriveAccounts,
  DERIVATION_PATHS,
} from './chains/derivation';
import {
  createDot1JsonBackup,
  parseDot1JsonBackup,
  encryptDot1,
  decryptDot1,
} from './crypto/dot1';
import {
  registerPasskeyWithPrf as coreRegisterPasskey,
  authenticatePasskeyWithPrf,
  isPlatformAuthenticatorAvailable,
} from './crypto/webauthn-prf';
import { savePasskeyCredentialId } from './storage';
import { AddressInfo, Dot1BackupEnvelope, SupportedChainId } from '@/types/wallet';
import { utf8ToBytes } from '@noble/hashes/utils.js';

export {
  bip39GenerateMnemonic as generateNewMnemonic,
  bip39ValidateMnemonic as isValidMnemonic,
  authenticatePasskeyWithPrf,
};

/**
 * Derives public addresses for requested chains using Agent 2's derivation engine.
 */
export function deriveAddressesFromMnemonic(
  mnemonic: string,
  chains: SupportedChainId[]
): Record<SupportedChainId, AddressInfo> {
  const accounts = deriveAccounts(mnemonic, chains, 0);
  const result = {} as Record<SupportedChainId, AddressInfo>;

  for (const acc of accounts) {
    const chainId = acc.chain as SupportedChainId;
    result[chainId] = {
      chainId,
      address: acc.address,
      derivationPath: acc.derivationPath,
      publicKeyHex: acc.publicKey,
    };
  }

  return result;
}

/**
 * Derives raw private keys for display in key reveal escape hatch.
 */
export function derivePrivateKeys(
  mnemonic: string,
  chains: SupportedChainId[]
): Record<SupportedChainId, string> {
  const accounts = deriveAccounts(mnemonic, chains, 0);
  const keys = {} as Record<SupportedChainId, string>;

  for (const acc of accounts) {
    keys[acc.chain as SupportedChainId] = acc.privateKey;
  }

  return keys;
}

/**
 * Password strength evaluation.
 */
export interface PasswordStrengthResult {
  score: number; // 0 to 4
  label: 'Weak' | 'Fair' | 'Good' | 'Strong' | 'Cryptographic';
  color: string;
  hasLength: boolean;
  hasUpper: boolean;
  hasLower: boolean;
  hasNumber: boolean;
  hasSymbol: boolean;
}

export function evaluatePasswordStrength(password: string): PasswordStrengthResult {
  const hasLength = password.length >= 10;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);

  let score = 0;
  if (password.length >= 8) score++;
  if (hasLength) score++;
  if (hasUpper && hasLower) score++;
  if (hasNumber && hasSymbol) score++;
  if (password.length >= 14 && hasUpper && hasLower && hasNumber && hasSymbol) score++;

  score = Math.min(4, Math.max(0, score));

  const labels: PasswordStrengthResult['label'][] = ['Weak', 'Fair', 'Good', 'Strong', 'Cryptographic'];
  const colors = ['#EF4444', '#F97316', '#EAB308', '#10B981', '#05F292'];

  return {
    score,
    label: labels[score],
    color: colors[score],
    hasLength,
    hasUpper,
    hasLower,
    hasNumber,
    hasSymbol,
  };
}

/**
 * Encrypted dot1 envelope serialization.
 * Uses Agent 1's standard createDot1JsonBackup format.
 */
export async function createDot1Envelope(
  mnemonic: string,
  passwordFallback: string | Uint8Array,
  chains: SupportedChainId[]
): Promise<Dot1BackupEnvelope> {
  const secretBytes = utf8ToBytes(mnemonic.trim());
  const isKey = passwordFallback instanceof Uint8Array;
  const jsonBackupStr = await createDot1JsonBackup(secretBytes, passwordFallback, {
    kdf: isKey ? 'none' : 'argon2id',
    metadata: {
      mnemonic: mnemonic.trim(),
      chains,
      createdAt: new Date().toISOString(),
    },
  });

  return JSON.parse(jsonBackupStr) as Dot1BackupEnvelope;
}

/**
 * Parses and verifies a dot1 backup envelope using Agent 1's engine.
 */
export async function decryptDot1Envelope(
  envelope: Dot1BackupEnvelope,
  passwordFallback: string | Uint8Array
): Promise<{ mnemonic: string; chains: SupportedChainId[] } | null> {
  try {
    const jsonStr = typeof envelope === 'string' ? envelope : JSON.stringify(envelope);
    const decrypted = await parseDot1JsonBackup(jsonStr, passwordFallback as string);
    const mnemonic = (decrypted.mnemonic || decrypted.metadata?.mnemonic) as string;
    const chains = (decrypted.metadata?.chains as SupportedChainId[]) || envelope.chains;

    if (!mnemonic || !bip39ValidateMnemonic(mnemonic)) {
      return null;
    }
    return { mnemonic, chains };
  } catch {
    return null;
  }
}

/**
 * Triggers client-side download for .dot1 envelope file.
 */
export function downloadDot1File(envelope: Dot1BackupEnvelope | string, filename = 'dot-vault-backup.dot1') {
  const content = typeof envelope === 'string' ? envelope : JSON.stringify(envelope, null, 2);
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

/**
 * WebAuthn Passkey PRF registration ceremony.
 * Registers platform authenticator credential with PRF extension.
 * Throws real error if hardware is unavailable, user cancels, or ceremony fails.
 * NEVER proceeds with mock/fake credentials.
 */
export async function registerPasskeyWithPrf(
  username = 'dot-sovereign-vault'
): Promise<{ credentialId: string; prfSupported: boolean; secretKey?: Uint8Array | null }> {
  const isAvail = await isPlatformAuthenticatorAvailable();
  if (!isAvail) {
    throw new Error('Biometric platform authenticator (Touch ID, Face ID, Windows Hello) is not available.');
  }

  const reg = await coreRegisterPasskey({
    userName: username,
    userDisplayName: 'Dot Vault Sovereign Owner',
    requirePrf: false, // Allows graceful fallback if PRF unsupported
  });

  if (!reg || !reg.credentialId) {
    throw new Error('Passkey registration ceremony was cancelled or timed out.');
  }

  await savePasskeyCredentialId(reg.credentialId);

  return {
    credentialId: reg.credentialId,
    prfSupported: reg.prfSupported,
    secretKey: reg.secretKey || null,
  };
}
