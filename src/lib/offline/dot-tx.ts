/**
 * DOT Offline Transaction Specification (.dot-tx)
 * 
 * Provides a deterministic, transparent JSON format for offline transaction interchange,
 * air-gap QR serialization, and resilient queue storage.
 * 
 * Principles:
 * 1. Zero external network dependencies.
 * 2. Deterministic deduplication ID (`tx_id`) generated via canonical SHA-256 hash.
 * 3. Human-readable `decoded_intent` verification before signing.
 * 4. Multi-chain support (EVM, Bitcoin, Solana) with expiration handling.
 */

import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex, utf8ToBytes } from '@noble/hashes/utils.js';

export type ChainType = 'evm' | 'btc' | 'sol';

export type DotTxStatus = 
  | 'queued' 
  | 'broadcasting' 
  | 'broadcast' 
  | 'confirmed' 
  | 'failed' 
  | 'expired';

export interface DecodedIntent {
  to: string;
  from: string;
  amount: string;
  symbol: string;
  contractCall?: {
    method?: string;
    params?: Record<string, unknown>;
    target?: string;
  };
  warnings?: string[];
}

export interface DotSignature {
  signer: string;
  signature: string; // Hex or Base58 depending on chain
  type?: 'secp256k1' | 'ed25519' | 'schnorr';
  signed_at: number;
}

export interface DotTx {
  version: number;
  tx_id: string; // Deterministic hash
  chain: ChainType;
  network_id: number | string;
  decoded_intent: DecodedIntent;
  unsigned_payload: string; // Hex / Base64 encoded raw payload
  signatures: DotSignature[];
  status: DotTxStatus;
  created_at: number;
  expires_at?: number; // Crucial for Solana recentBlockhash (typically valid ~60-90s)
  broadcast_hash?: string; // Set when successfully broadcast to mempool
  error?: string; // Failure reason if status === 'failed'
}

export interface CreateDotTxParams {
  chain: ChainType;
  network_id: number | string;
  decoded_intent: DecodedIntent;
  unsigned_payload: string;
  expires_at?: number;
}

/**
 * Calculates a deterministic transaction ID from the invariant transaction parameters.
 * Canonicalizes keys to ensure hash reproducibility regardless of key insertion order.
 */
export function calculateTxId(params: {
  version: number;
  chain: ChainType;
  network_id: number | string;
  unsigned_payload: string;
  decoded_intent: DecodedIntent;
  created_at: number;
}): string {
  const canonicalObject = {
    version: params.version,
    chain: params.chain,
    network_id: String(params.network_id),
    unsigned_payload: params.unsigned_payload.toLowerCase(),
    decoded_intent: {
      to: params.decoded_intent.to.toLowerCase(),
      from: params.decoded_intent.from.toLowerCase(),
      amount: params.decoded_intent.amount,
      symbol: params.decoded_intent.symbol.toUpperCase(),
      contractCall: params.decoded_intent.contractCall || null,
    },
    created_at: params.created_at,
  };

  const canonicalString = JSON.stringify(canonicalObject, Object.keys(canonicalObject).sort());
  const hashBytes = sha256(utf8ToBytes(canonicalString));
  return `0x${bytesToHex(hashBytes)}`;
}

/**
 * Creates a brand new .dot-tx object ready for air-gap export or local queue.
 */
export function createDotTx(params: CreateDotTxParams): DotTx {
  const version = 1;
  const created_at = Date.now();

  const tx_id = calculateTxId({
    version,
    chain: params.chain,
    network_id: params.network_id,
    unsigned_payload: params.unsigned_payload,
    decoded_intent: params.decoded_intent,
    created_at,
  });

  return {
    version,
    tx_id,
    chain: params.chain,
    network_id: params.network_id,
    decoded_intent: params.decoded_intent,
    unsigned_payload: params.unsigned_payload,
    signatures: [],
    status: 'queued',
    created_at,
    expires_at: params.expires_at,
  };
}

/**
 * Checks if a .dot-tx has passed its validity window.
 */
export function isDotTxExpired(tx: DotTx): boolean {
  if (!tx.expires_at) return false;
  return Date.now() > tx.expires_at;
}

/**
 * Attaches a signature to a .dot-tx, transitioning its state if needed.
 */
export function signDotTx(tx: DotTx, signature: DotSignature): DotTx {
  const existing = tx.signatures.some(
    s => s.signer.toLowerCase() === signature.signer.toLowerCase()
  );

  const updatedSignatures = existing
    ? tx.signatures.map(s => (s.signer.toLowerCase() === signature.signer.toLowerCase() ? signature : s))
    : [...tx.signatures, signature];

  return {
    ...tx,
    signatures: updatedSignatures,
    status: isDotTxExpired(tx) ? 'expired' : 'queued',
  };
}

/**
 * Validates a parsed or received .dot-tx structure and recalculates the deterministic ID.
 */
export function validateDotTx(data: unknown): { valid: boolean; error?: string; tx?: DotTx } {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Invalid payload: expected an object.' };
  }

  const obj = data as Record<string, unknown>;

  if (typeof obj.version !== 'number') {
    return { valid: false, error: 'Invalid or missing version number.' };
  }

  if (typeof obj.tx_id !== 'string' || !obj.tx_id.startsWith('0x')) {
    return { valid: false, error: 'Invalid or missing tx_id format.' };
  }

  if (!['evm', 'btc', 'sol'].includes(obj.chain as string)) {
    return { valid: false, error: `Unsupported chain: ${String(obj.chain)}` };
  }

  if (typeof obj.unsigned_payload !== 'string' || obj.unsigned_payload.length === 0) {
    return { valid: false, error: 'Missing or empty unsigned_payload.' };
  }

  if (!obj.decoded_intent || typeof obj.decoded_intent !== 'object') {
    return { valid: false, error: 'Missing or invalid decoded_intent.' };
  }

  const intent = obj.decoded_intent as Record<string, unknown>;
  if (typeof intent.to !== 'string' || typeof intent.from !== 'string' || typeof intent.amount !== 'string') {
    return { valid: false, error: 'decoded_intent must include to, from, and amount fields.' };
  }

  if (!Array.isArray(obj.signatures)) {
    return { valid: false, error: 'signatures field must be an array.' };
  }

  if (typeof obj.created_at !== 'number') {
    return { valid: false, error: 'Missing or invalid created_at timestamp.' };
  }

  const tx = obj as unknown as DotTx;

  // Re-verify deterministic tx_id
  const expectedTxId = calculateTxId({
    version: tx.version,
    chain: tx.chain,
    network_id: tx.network_id,
    unsigned_payload: tx.unsigned_payload,
    decoded_intent: tx.decoded_intent,
    created_at: tx.created_at,
  });

  if (expectedTxId !== tx.tx_id) {
    return { 
      valid: false, 
      error: `tx_id mismatch. Stated: ${tx.tx_id}, Calculated: ${expectedTxId}` 
    };
  }

  return { valid: true, tx };
}

/**
 * Serializes a .dot-tx to formatted JSON string.
 */
export function serializeDotTx(tx: DotTx, pretty = true): string {
  return JSON.stringify(tx, null, pretty ? 2 : undefined);
}

/**
 * Deserializes and validates a JSON string into a DotTx.
 */
export function deserializeDotTx(jsonString: string): { valid: boolean; error?: string; tx?: DotTx } {
  try {
    const parsed = JSON.parse(jsonString);
    return validateDotTx(parsed);
  } catch (err) {
    return { valid: false, error: `JSON Parse error: ${err instanceof Error ? err.message : String(err)}` };
  }
}
