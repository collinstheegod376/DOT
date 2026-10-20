import {
  generateMnemonic as scureGenerateMnemonic,
  validateMnemonic as scureValidateMnemonic,
  mnemonicToSeed as scureMnemonicToSeed,
  mnemonicToSeedSync as scureMnemonicToSeedSync,
} from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english.js';
import { HDKey } from '@scure/bip32';
import { deriveEvmAccountFromSeed, type EvmAccount } from './evm';
import { deriveBtcAccount, type BtcAccount } from './btc';
import { deriveSolanaAccount, type SolAccount } from './sol';

/**
 * Multi-Chain Key Derivation
 * Standard BIP-44 / BIP-84 / SLIP-0010 Derivation Paths:
 * - EVM (Ethereum / Arbitrum / Optimism / Polygon / Base): m/44'/60'/0'/0/x
 * - Bitcoin (Native SegWit Bech32): m/84'/0'/0'/0/x
 * - Solana (Ed25519-HD): m/44'/501'/0'/0' (or m/44'/501'/x'/0')
 */

export const DERIVATION_PATHS = {
  EVM: "m/44'/60'/0'/0/{index}",
  BTC_NATIVE_SEGWIT: "m/84'/0'/0'/0/{index}",
  SOLANA: "m/44'/501'/{index}'/0'",
} as const;

export type SupportedChain =
  | 'ethereum'
  | 'arbitrum'
  | 'optimism'
  | 'polygon'
  | 'base'
  | 'bsc'
  | 'avalanche'
  | 'bitcoin'
  | 'btc'
  | 'solana'
  | 'sol';

export interface DerivedChainAccount {
  chain: string;
  chainFamily: 'evm' | 'bitcoin' | 'solana' | 'unknown';
  address: string; // Strictly EIP-55 for EVM, Bech32 for BTC, Base58 for Solana
  derivationPath: string;
  publicKey: string;
  privateKey: string; // Internal safe container; never logged or exposed to network
  accountIndex: number;
}

/**
 * Generate a new cryptographically secure BIP-39 mnemonic
 * @param strength Bit strength: 128 (12 words) or 256 (24 words). Defaults to 128.
 */
export function generateMnemonic(strength: 128 | 256 = 128): string {
  return scureGenerateMnemonic(wordlist, strength);
}

/**
 * Validate a BIP-39 mnemonic phrase against the English wordlist and checksum
 */
export function validateMnemonic(mnemonic: string): boolean {
  if (!mnemonic || typeof mnemonic !== 'string') return false;
  const normalized = mnemonic.trim().replace(/\s+/g, ' ');
  return scureValidateMnemonic(normalized, wordlist);
}

/**
 * Asynchronously derives a 64-byte master seed from a BIP-39 mnemonic phrase
 */
export async function mnemonicToSeed(mnemonic: string, passphrase = ''): Promise<Uint8Array> {
  const normalized = mnemonic.trim().replace(/\s+/g, ' ');
  if (!validateMnemonic(normalized)) {
    throw new Error('Invalid BIP-39 mnemonic phrase');
  }
  return scureMnemonicToSeed(normalized, passphrase);
}

/**
 * Synchronously derives a 64-byte master seed from a BIP-39 mnemonic phrase
 */
export function mnemonicToSeedSync(mnemonic: string, passphrase = ''): Uint8Array {
  const normalized = mnemonic.trim().replace(/\s+/g, ' ');
  if (!validateMnemonic(normalized)) {
    throw new Error('Invalid BIP-39 mnemonic phrase');
  }
  return scureMnemonicToSeedSync(normalized, passphrase);
}

/**
 * Creates an HDKey instance from master seed for secp256k1 derivation
 */
export function getMasterHDKey(seed: Uint8Array): HDKey {
  return HDKey.fromMasterSeed(seed);
}

/**
 * Resolve chain name to family
 */
export function getChainFamily(chainName: string): 'evm' | 'bitcoin' | 'solana' | 'unknown' {
  const lower = chainName.toLowerCase().trim();
  switch (lower) {
    case 'ethereum':
    case 'eth':
    case 'arbitrum':
    case 'optimism':
    case 'polygon':
    case 'matic':
    case 'base':
    case 'bsc':
    case 'binance':
    case 'avalanche':
    case 'avax':
    case 'evm':
      return 'evm';
    case 'bitcoin':
    case 'btc':
      return 'bitcoin';
    case 'solana':
    case 'sol':
      return 'solana';
    default:
      return 'unknown';
  }
}

/**
 * Returns the exact derivation path for a given chain and account index
 */
export function getDerivationPathForChain(chain: string, accountIndex = 0): string {
  const family = getChainFamily(chain);
  switch (family) {
    case 'evm':
      return DERIVATION_PATHS.EVM.replace('{index}', accountIndex.toString());
    case 'bitcoin':
      return DERIVATION_PATHS.BTC_NATIVE_SEGWIT.replace('{index}', accountIndex.toString());
    case 'solana':
      return DERIVATION_PATHS.SOLANA.replace('{index}', accountIndex.toString());
    default:
      return `m/44'/0'/0'/0/${accountIndex}`;
  }
}

/**
 * Derives active chain accounts given a seed (or mnemonic) and chain list.
 *
 * @param seed - Master seed as Uint8Array (or valid BIP-39 mnemonic string)
 * @param chains - Array of chain identifiers (e.g. ['ethereum', 'arbitrum', 'bitcoin', 'solana'])
 * @param accountIndex - Account derivation index (defaults to 0)
 * @returns Array of DerivedChainAccount objects containing strictly validated addresses
 */
export function deriveAccounts(
  seed: Uint8Array | string,
  chains: string[] = ['ethereum', 'bitcoin', 'solana'],
  accountIndex = 0
): DerivedChainAccount[] {
  let masterSeed: Uint8Array;

  if (typeof seed === 'string') {
    masterSeed = mnemonicToSeedSync(seed);
  } else {
    masterSeed = seed;
  }

  if (!masterSeed || masterSeed.length < 16) {
    throw new Error('Seed must be at least 16 bytes');
  }

  // Cache family derivations to avoid redundant computation for multi-EVM requests
  let cachedEvm: EvmAccount | null = null;
  let cachedBtc: BtcAccount | null = null;
  let cachedSol: SolAccount | null = null;

  const results: DerivedChainAccount[] = [];

  for (const chain of chains) {
    const family = getChainFamily(chain);

    if (family === 'evm') {
      if (!cachedEvm) {
        cachedEvm = deriveEvmAccountFromSeed(masterSeed, accountIndex);
      }
      results.push({
        chain,
        chainFamily: 'evm',
        address: cachedEvm.address, // Guaranteed EIP-55
        derivationPath: cachedEvm.derivationPath,
        publicKey: cachedEvm.publicKey,
        privateKey: cachedEvm.privateKey,
        accountIndex,
      });
    } else if (family === 'bitcoin') {
      if (!cachedBtc) {
        cachedBtc = deriveBtcAccount(masterSeed, accountIndex, 'mainnet');
      }
      results.push({
        chain,
        chainFamily: 'bitcoin',
        address: cachedBtc.address, // Bech32 Native SegWit
        derivationPath: cachedBtc.derivationPath,
        publicKey: cachedBtc.publicKey,
        privateKey: cachedBtc.privateKeyWif,
        accountIndex,
      });
    } else if (family === 'solana') {
      if (!cachedSol) {
        cachedSol = deriveSolanaAccount(masterSeed, accountIndex);
      }
      // Encode private key as hex for uniform string representation
      let privHex = '';
      for (let i = 0; i < cachedSol.privateKey.length; i++) {
        privHex += cachedSol.privateKey[i].toString(16).padStart(2, '0');
      }

      results.push({
        chain,
        chainFamily: 'solana',
        address: cachedSol.address, // Base58 public key
        derivationPath: cachedSol.derivationPath,
        publicKey: cachedSol.publicKey,
        privateKey: privHex,
        accountIndex,
      });
    } else {
      // Default to EVM derivation for unknown custom EVM testnets/chains
      if (!cachedEvm) {
        cachedEvm = deriveEvmAccountFromSeed(masterSeed, accountIndex);
      }
      results.push({
        chain,
        chainFamily: 'unknown',
        address: cachedEvm.address,
        derivationPath: cachedEvm.derivationPath,
        publicKey: cachedEvm.publicKey,
        privateKey: cachedEvm.privateKey,
        accountIndex,
      });
    }
  }

  return results;
}
