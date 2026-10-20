import {
  getAddress,
  isAddress,
  type Address,
  type Hex,
  type TransactionSerializable,
  type TypedData,
  type TypedDataDefinition,
} from 'viem';
import { privateKeyToAccount, type PrivateKeyAccount } from 'viem/accounts';
import { HDKey } from '@scure/bip32';

/**
 * EVM Key Derivation, EIP-55 Address Generation, and Offline Signing
 * Standard EVM Derivation Path: m/44'/60'/0'/0/x
 * Strict DOT non-negotiable: All addresses MUST use EIP-55 checksum casing.
 */

export interface EvmAccount {
  address: Address; // EIP-55 checksummed (0x...)
  publicKey: Hex;
  privateKey: Hex; // 0x-prefixed 32-byte hex
  derivationPath: string;
}

function bytesToHex(bytes: Uint8Array): Hex {
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return `0x${hex}` as Hex;
}

function normalizePrivateKey(key: Hex | Uint8Array): Hex {
  if (key instanceof Uint8Array) {
    if (key.length !== 32) {
      throw new Error('EVM private key must be exactly 32 bytes');
    }
    return bytesToHex(key);
  }
  const clean = key.startsWith('0x') ? key : (`0x${key}` as Hex);
  if (clean.length !== 66) {
    throw new Error('EVM private key must be a 32-byte hex string (64 characters + 0x)');
  }
  return clean;
}

/**
 * Converts any valid EVM address to its strict EIP-55 checksummed representation.
 * Throws an error if the address is not a valid 20-byte EVM address.
 */
export function toChecksumAddress(address: string): Address {
  if (!isAddress(address, { strict: false })) {
    throw new Error(`Invalid EVM address format: ${address}`);
  }
  return getAddress(address);
}

/**
 * Validates whether an address is a valid EVM address
 */
export function validateEvmAddress(address: string): boolean {
  return isAddress(address, { strict: false });
}

/**
 * Checks if an address conforms strictly to EIP-55 casing
 */
export function isChecksumAddress(address: string): boolean {
  if (!isAddress(address, { strict: false })) return false;
  try {
    return address === getAddress(address);
  } catch {
    return false;
  }
}

/**
 * Derives an EvmAccount from a raw private key (Hex or Uint8Array)
 */
export function deriveEvmAccount(
  privateKeyInput: Hex | Uint8Array,
  derivationPath = 'custom'
): EvmAccount {
  const privateKey = normalizePrivateKey(privateKeyInput);
  const account = privateKeyToAccount(privateKey);

  // account.address from viem is guaranteed EIP-55 checksummed
  return {
    address: account.address,
    publicKey: account.publicKey,
    privateKey,
    derivationPath,
  };
}

/**
 * Derives an EVM account from master seed using BIP-44 standard EVM path
 * Path: m/44'/60'/0'/0/{accountIndex}
 */
export function deriveEvmAccountFromSeed(seed: Uint8Array, accountIndex = 0): EvmAccount {
  const path = `m/44'/60'/0'/0/${accountIndex}`;
  const master = HDKey.fromMasterSeed(seed);
  const child = master.derive(path);

  if (!child.privateKey) {
    throw new Error(`Failed to derive EVM private key at path ${path}`);
  }

  const privateKeyHex = bytesToHex(child.privateKey);
  return deriveEvmAccount(privateKeyHex, path);
}

/**
 * Offline Message Signing using viem
 * Signs a personal sign message (EIP-191) offline without network access.
 */
export async function signOfflineMessage(
  privateKey: Hex | Uint8Array,
  message: string | { raw: Hex | Uint8Array }
): Promise<Hex> {
  const normalizedKey = normalizePrivateKey(privateKey);
  const account = privateKeyToAccount(normalizedKey);
  return account.signMessage({ message });
}

/**
 * Offline Transaction Signing using viem
 * Signs a standard EVM transaction (EIP-1559, Legacy, EIP-2930) offline without network access.
 */
export async function signOfflineTransaction<
  TTransactionSerializable extends TransactionSerializable = TransactionSerializable,
>(
  privateKey: Hex | Uint8Array,
  transaction: TTransactionSerializable
): Promise<Hex> {
  const normalizedKey = normalizePrivateKey(privateKey);
  const account = privateKeyToAccount(normalizedKey);
  return account.signTransaction(transaction);
}

/**
 * Offline EIP-712 Typed Data Signing using viem
 */
export async function signOfflineTypedData<
  const TTypedData extends TypedData | Record<string, unknown>,
  TPrimaryType extends keyof TTypedData | 'EIP712Domain' = keyof TTypedData,
>(
  privateKey: Hex | Uint8Array,
  parameters: TypedDataDefinition<TTypedData, TPrimaryType>
): Promise<Hex> {
  const normalizedKey = normalizePrivateKey(privateKey);
  const account = privateKeyToAccount(normalizedKey);
  return account.signTypedData(parameters);
}

/**
 * Helper to get a Viem LocalAccount instance for offline operations
 */
export function getLocalAccount(privateKey: Hex | Uint8Array): PrivateKeyAccount {
  const normalizedKey = normalizePrivateKey(privateKey);
  return privateKeyToAccount(normalizedKey);
}
