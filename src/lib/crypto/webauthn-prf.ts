/**
 * DOT Crypto Engine - WebAuthn PRF (Pseudo-Random Function) Extension
 * 
 * Provides hardware-backed key derivation using WebAuthn Level 3 PRF extension
 * (Touch ID, Face ID, Windows Hello, YubiKey).
 * 
 * Features:
 * - Deterministic 32-byte master key derivation from WebAuthn assertion PRF evaluation.
 * - Graceful fallback detection when browser/authenticator lacks PRF support.
 * - Non-negotiable CSPRNG: crypto.getRandomValues().
 */

import { hkdf } from '@noble/hashes/hkdf.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { utf8ToBytes } from '@noble/hashes/utils.js';
import { base64urlnopad } from '@scure/base';
import { secureRandomBytes } from './dot1.ts';

export const DEFAULT_PRF_INFO = 'DOT_VAULT_KEY_DERIVATION_V1';
export const DEFAULT_PRF_SALT_STRING = 'DOT_VAULT_PRF_SALT_V1';

/**
 * Standard 32-byte PRF input salt deterministically derived from application salt string.
 */
export function getDefaultPrfSalt(): Uint8Array {
  return sha256(utf8ToBytes(DEFAULT_PRF_SALT_STRING));
}

export class PrfNotSupportedError extends Error {
  constructor(message = 'WebAuthn PRF extension is not supported by this browser or authenticator.') {
    super(message);
    this.name = 'PrfNotSupportedError';
  }
}

export interface PasskeyRegistrationOptions {
  rpName?: string;
  rpId?: string;
  userName?: string;
  userDisplayName?: string;
  userId?: Uint8Array;
  challenge?: Uint8Array;
  timeout?: number;
  requirePrf?: boolean;
}

export interface PasskeyRegistrationResult {
  credentialId: string; // Base64URL encoded
  rawId: Uint8Array;
  prfEnabled: boolean;
  prfSupported: boolean;
  transports?: string[];
}

export interface PasskeyAuthOptions {
  credentialId?: string | Uint8Array;
  rpId?: string;
  challenge?: Uint8Array;
  salt?: Uint8Array;
  timeout?: number;
  requirePrf?: boolean;
}

export interface PasskeyAuthResult {
  success: boolean;
  credentialId: string;
  prfSupported: boolean;
  secretKey: Uint8Array | null; // 32-byte deterministic key if PRF supported
  rawPrfOutput?: Uint8Array;
}

/**
 * Checks if WebAuthn API is available in the current environment.
 */
export function isWebAuthnAvailable(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.navigator !== 'undefined' &&
    Boolean(window.navigator.credentials) &&
    typeof window.PublicKeyCredential !== 'undefined'
  );
}

/**
 * Checks if the platform authenticator is available.
 */
export async function isPlatformAuthenticatorAvailable(): Promise<boolean> {
  if (!isWebAuthnAvailable()) return false;
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

/**
 * Checks whether the browser client reports PRF support in capabilities.
 */
export async function isPrfClientSupported(): Promise<boolean> {
  if (!isWebAuthnAvailable()) return false;
  try {
    const pubKeyCred = PublicKeyCredential as unknown as {
      getClientCapabilities?: () => Promise<Record<string, boolean>>;
    };
    if (typeof pubKeyCred.getClientCapabilities === 'function') {
      const capabilities = await pubKeyCred.getClientCapabilities();
      return Boolean(capabilities?.prf);
    }
  } catch {
    // getClientCapabilities may not be implemented in all browsers
  }
  // If getClientCapabilities is not available, we return true as speculative capability
  // until actual credential creation/assertion reports extension results.
  return true;
}

/**
 * Derives a deterministic 32-byte secret key directly from WebAuthn assertion PRF results.
 * Uses HKDF-SHA256 to ensure uniform cryptographic entropy.
 */
export function deriveKeyFromPrf(
  prfOutput: Uint8Array | ArrayBuffer,
  info: string = DEFAULT_PRF_INFO
): Uint8Array {
  const prfBytes = prfOutput instanceof Uint8Array ? prfOutput : new Uint8Array(prfOutput);
  if (prfBytes.length !== 32) {
    throw new Error(`Invalid PRF output length: expected 32 bytes, got ${prfBytes.length}`);
  }
  return hkdf(sha256, prfBytes, undefined, utf8ToBytes(info), 32);
}

/**
 * Registers a new WebAuthn passkey credential with the PRF extension enabled.
 */
export async function registerPasskeyWithPrf(
  options: PasskeyRegistrationOptions = {}
): Promise<PasskeyRegistrationResult> {
  if (!isWebAuthnAvailable()) {
    throw new Error('WebAuthn is not supported in this browser or environment.');
  }

  const rpId = options.rpId || (typeof window !== 'undefined' ? window.location.hostname : 'localhost');
  const rpName = options.rpName || 'DOT Secure Wallet';
  const userName = options.userName || 'dot-vault-owner';
  const userDisplayName = options.userDisplayName || 'DOT Vault Owner';
  const userId = options.userId || secureRandomBytes(16);
  const challenge = options.challenge || secureRandomBytes(32);
  const timeout = options.timeout || 60_000;

  const creationOptions: PublicKeyCredentialCreationOptions = {
    challenge: challenge as unknown as BufferSource,
    rp: {
      name: rpName,
      id: rpId,
    },
    user: {
      id: userId as unknown as BufferSource,
      name: userName,
      displayName: userDisplayName,
    },
    pubKeyCredParams: [
      { alg: -7, type: 'public-key' },  // ES256 (standard platform authenticators)
      { alg: -257, type: 'public-key' }, // RS256 (Windows Hello fallback)
      { alg: -8, type: 'public-key' },   // Ed25519 (FIDO2.1 / security keys)
    ],
    authenticatorSelection: {
      authenticatorAttachment: 'platform',
      userVerification: 'required',
      residentKey: 'preferred',
    },
    timeout,
    extensions: {
      prf: {},
    } as unknown as AuthenticationExtensionsClientInputs,
  };

  const credential = (await navigator.credentials.create({
    publicKey: creationOptions,
  })) as PublicKeyCredential | null;

  if (!credential) {
    throw new Error('Failed to create passkey credential: user cancelled or timed out.');
  }

  const rawId = new Uint8Array(credential.rawId);
  const credentialId = base64urlnopad.encode(rawId);

  // Inspect PRF extension enablement result
  const extensionResults = credential.getClientExtensionResults() as unknown as {
    prf?: { enabled?: boolean };
  };
  const prfEnabled = Boolean(extensionResults?.prf?.enabled);

  if (options.requirePrf && !prfEnabled) {
    throw new PrfNotSupportedError(
      'The selected authenticator does not support the PRF extension for hardware encryption.'
    );
  }

  let transports: string[] | undefined;
  if (typeof (credential as unknown as { response?: { getTransports?: () => string[] } }).response?.getTransports === 'function') {
    transports = (credential as unknown as { response: { getTransports: () => string[] } }).response.getTransports();
  }

  return {
    credentialId,
    rawId,
    prfEnabled,
    prfSupported: prfEnabled,
    transports,
  };
}

/**
 * Authenticates with a WebAuthn passkey and evaluates the PRF extension.
 * Derives a deterministic 32-byte secret key directly from the PRF evaluation output.
 * If PRF is unsupported, returns `prfSupported: false` with `secretKey: null` for graceful fallback.
 */
export async function authenticatePasskeyWithPrf(
  options: PasskeyAuthOptions = {}
): Promise<PasskeyAuthResult> {
  if (!isWebAuthnAvailable()) {
    throw new Error('WebAuthn is not supported in this browser or environment.');
  }

  const rpId = options.rpId || (typeof window !== 'undefined' ? window.location.hostname : 'localhost');
  const challenge = options.challenge || secureRandomBytes(32);
  const prfSalt = options.salt || getDefaultPrfSalt();
  const timeout = options.timeout || 60_000;

  let rawCredentialId: Uint8Array | undefined;
  if (options.credentialId) {
    rawCredentialId = typeof options.credentialId === 'string'
      ? base64urlnopad.decode(options.credentialId)
      : options.credentialId;
  }

  const requestOptions: PublicKeyCredentialRequestOptions = {
    challenge: challenge as unknown as BufferSource,
    rpId,
    userVerification: 'required',
    timeout,
    allowCredentials: rawCredentialId
      ? [
          {
            id: rawCredentialId as unknown as BufferSource,
            type: 'public-key',
            transports: ['internal', 'hybrid'],
          },
        ]
      : undefined,
    extensions: {
      prf: {
        eval: {
          first: prfSalt as unknown as BufferSource,
        },
      },
    } as unknown as AuthenticationExtensionsClientInputs,
  };

  const assertion = (await navigator.credentials.get({
    publicKey: requestOptions,
  })) as PublicKeyCredential | null;

  if (!assertion) {
    throw new Error('Passkey authentication cancelled or timed out.');
  }

  const assertionId = base64urlnopad.encode(new Uint8Array(assertion.rawId));

  // Extract PRF evaluation results
  const extResults = assertion.getClientExtensionResults() as unknown as {
    prf?: {
      results?: {
        first?: ArrayBuffer | Uint8Array;
        second?: ArrayBuffer | Uint8Array;
      };
    };
  };

  const rawFirst = extResults?.prf?.results?.first;

  if (!rawFirst) {
    if (options.requirePrf) {
      throw new PrfNotSupportedError(
        'Authenticator authentication succeeded, but PRF output was not returned.'
      );
    }
    // Graceful fallback: PRF unsupported by this authenticator/platform
    return {
      success: true,
      credentialId: assertionId,
      prfSupported: false,
      secretKey: null,
    };
  }

  const prfOutput = new Uint8Array(rawFirst);
  const secretKey = deriveKeyFromPrf(prfOutput);

  return {
    success: true,
    credentialId: assertionId,
    prfSupported: true,
    secretKey,
    rawPrfOutput: prfOutput,
  };
}

/**
 * Alias for registerPasskeyWithPrf to support existing consumers.
 */
export const registerPasskeyPrfCredential = registerPasskeyWithPrf;

