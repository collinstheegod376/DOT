/**
 * Offline Broadcast Queue stored in IndexedDB.
 * 
 * Provides:
 * - Persistent storage with deduplication by deterministic `tx_id`.
 * - Status transitions: queued -> broadcasting -> broadcast / failed / expired.
 * - Reactive listeners and auto-sync triggers for window 'online' / 'offline' events.
 * - Multi-tab synchronization via BroadcastChannel / CustomEvent.
 */

import { DotTx, DotTxStatus, isDotTxExpired } from './dot-tx';
import { Connection, Transaction, PublicKey } from '@solana/web3.js';
import { base58 } from '@scure/base';
import { buildAndBroadcastSolanaTransfer, resolveSolanaRpcUrl } from '../chains/sol-tx';

const DB_NAME = 'dot_offline_vault';
const DB_VERSION = 1;
const STORE_NAME = 'transactions';

let dbPromise: Promise<IDBDatabase> | null = null;
const queueListeners: Set<(txs: DotTx[]) => void> = new Set();
let broadcastChannel: BroadcastChannel | null = null;

if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    broadcastChannel = new BroadcastChannel('dot_queue_sync');
    broadcastChannel.onmessage = (event) => {
      if (event.data?.type === 'QUEUE_UPDATED') {
        notifyListeners();
      }
    };
  } catch (err) {
    console.warn('[DOT Queue] BroadcastChannel initialization failed:', err);
  }
}

function getDB(): Promise<IDBDatabase> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('IndexedDB is only available in browser environments'));
  }

  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'tx_id' });
          store.createIndex('chain', 'chain', { unique: false });
          store.createIndex('status', 'status', { unique: false });
          store.createIndex('created_at', 'created_at', { unique: false });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  return dbPromise;
}

async function notifyListeners(): Promise<void> {
  if (queueListeners.size === 0) return;
  try {
    const currentQueue = await getAllTxs();
    for (const listener of queueListeners) {
      try {
        listener(currentQueue);
      } catch (err) {
        console.error('[DOT Queue] Listener error:', err);
      }
    }
  } catch (err) {
    console.error('[DOT Queue] Failed to fetch queue for listener notification:', err);
  }
}

function broadcastQueueChange(): void {
  notifyListeners();
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage({ type: 'QUEUE_UPDATED', timestamp: Date.now() });
    } catch {
      // Ignore broadcast channel errors in restricted environments
    }
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('dot:queue-updated'));
  }
}

/**
 * Enqueues or updates a transaction in the offline store.
 * Automatically checks for expiration.
 */
export async function enqueueTx(tx: DotTx): Promise<DotTx> {
  const db = await getDB();
  const txToStore: DotTx = {
    ...tx,
    status: isDotTxExpired(tx) ? 'expired' : tx.status,
  };

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    // Read existing to preserve history if already broadcast
    const getReq = store.get(txToStore.tx_id);

    getReq.onsuccess = () => {
      const existing = getReq.result as DotTx | undefined;
      if (existing && (existing.status === 'confirmed' || existing.status === 'broadcast')) {
        // Do not downgrade an already confirmed or broadcast tx unless status is forced
        resolve(existing);
        return;
      }

      const putReq = store.put(txToStore);
      putReq.onsuccess = () => {
        broadcastQueueChange();
        resolve(txToStore);
      };
      putReq.onerror = () => reject(putReq.error);
    };

    getReq.onerror = () => reject(getReq.error);
  });
}

/**
 * Retrieves all stored transactions, auto-reaping expired items.
 */
export async function getAllTxs(): Promise<DotTx[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      const items = (request.result as DotTx[]) || [];
      const updatedItems: DotTx[] = [];
      let hasMutations = false;

      // Check expiration for queued/broadcasting items
      for (const item of items) {
        if ((item.status === 'queued' || item.status === 'broadcasting') && isDotTxExpired(item)) {
          const expiredItem = { ...item, status: 'expired' as DotTxStatus, error: 'Transaction expired before broadcast' };
          store.put(expiredItem);
          updatedItems.push(expiredItem);
          hasMutations = true;
        } else {
          updatedItems.push(item);
        }
      }

      // Sort newest first
      updatedItems.sort((a, b) => b.created_at - a.created_at);

      if (hasMutations) {
        // Schedule broadcast in microtask to not block current read
        Promise.resolve().then(broadcastQueueChange);
      }

      resolve(updatedItems);
    };

    request.onerror = () => reject(request.error);
  });
}

/**
 * Retrieves only pending transactions that are ready to broadcast (`queued`).
 */
export async function getPendingTxs(): Promise<DotTx[]> {
  const all = await getAllTxs();
  return all.filter((tx) => tx.status === 'queued' && !isDotTxExpired(tx));
}

/**
 * Retrieves a single transaction by its `tx_id`.
 */
export async function getTx(txId: string): Promise<DotTx | null> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(txId);

    request.onsuccess = () => {
      const tx = request.result as DotTx | undefined;
      resolve(tx || null);
    };

    request.onerror = () => reject(request.error);
  });
}

/**
 * Updates transaction status with transitions:
 * queued -> broadcasting -> broadcast / failed / expired
 */
export async function updateTxStatus(
  txId: string,
  newStatus: DotTxStatus,
  extra?: { broadcast_hash?: string; error?: string }
): Promise<DotTx | null> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const getReq = store.get(txId);

    getReq.onsuccess = () => {
      const tx = getReq.result as DotTx | undefined;
      if (!tx) {
        resolve(null);
        return;
      }

      const updated: DotTx = {
        ...tx,
        status: newStatus,
        broadcast_hash: extra?.broadcast_hash ?? tx.broadcast_hash,
        error: extra?.error ?? tx.error,
      };

      const putReq = store.put(updated);
      putReq.onsuccess = () => {
        broadcastQueueChange();
        resolve(updated);
      };
      putReq.onerror = () => reject(putReq.error);
    };

    getReq.onerror = () => reject(getReq.error);
  });
}

/**
 * Removes a transaction by ID.
 */
export async function removeTx(txId: string): Promise<boolean> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(txId);

    request.onsuccess = () => {
      broadcastQueueChange();
      resolve(true);
    };

    request.onerror = () => reject(request.error);
  });
}

/**
 * Clears all transactions from the queue.
 */
export async function clearQueue(): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => {
      broadcastQueueChange();
      resolve();
    };

    request.onerror = () => reject(request.error);
  });
}

/**
 * Subscribes to real-time changes in the transaction queue.
 */
export function subscribeToQueue(callback: (txs: DotTx[]) => void): () => void {
  queueListeners.add(callback);
  // Initial fire
  getAllTxs()
    .then((txs) => callback(txs))
    .catch((err) => console.error('[DOT Queue] Initial subscribe read failed:', err));

  return () => {
    queueListeners.delete(callback);
  };
}

/**
 * Checks if the browser currently reports online connectivity.
 */
export function isOnline(): boolean {
  if (typeof navigator !== 'undefined' && 'onLine' in navigator) {
    return navigator.onLine;
  }
  return true;
}

export type OnlinePromptHandler = (pendingTxs: DotTx[]) => void;

/**
 * Registers an online listener that triggers a prompt or callback when connection is restored.
 */
export function registerOnlineSync(onPrompt: OnlinePromptHandler): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleOnline = async () => {
    try {
      const pending = await getPendingTxs();
      if (pending.length > 0) {
        onPrompt(pending);
      }
    } catch (err) {
      console.error('[DOT Queue] Online sync check failed:', err);
    }
  };

  window.addEventListener('online', handleOnline);

  return () => {
    window.removeEventListener('online', handleOnline);
  };
}

/**
 * Broadcasts a queued offline transaction to the live network.
 * 
 * For Solana (`tx.chain === 'sol'`):
 * - Resolves the cluster RPC endpoint based on `activeNetwork`.
 *   (Devnet: 'https://api.devnet.solana.com', Testnet: 'https://api.testnet.solana.com', Mainnet: 'https://api.mainnet-beta.solana.com')
 * - If `tx.unsigned_payload` contains a serialized transaction, broadcasts via `Connection.sendRawTransaction`.
 * - If raw broadcast fails or if the payload is an intent/instruction requiring reconstruction,
 *   reconstructs and broadcasts via `buildAndBroadcastSolanaTransfer`.
 * - Updates `tx.status` to `'broadcast'` and sets `broadcast_hash` to the real on-chain transaction signature.
 */
export async function broadcastQueuedTx(
  tx: DotTx,
  activeNetwork: string,
  privateKey?: string
): Promise<{ signature: string; feeSol: string }> {
  if (isDotTxExpired(tx)) {
    await updateTxStatus(tx.tx_id, 'expired', { error: 'Blockhash expired before broadcast' });
    throw new Error('Transaction expired before broadcast. Solana blockhash validity window exceeded.');
  }

  await updateTxStatus(tx.tx_id, 'broadcasting');

  try {
    let signature = '';
    let feeSol = '0.000005';

    if (tx.chain === 'sol') {
      const rpcUrl = resolveSolanaRpcUrl(activeNetwork);
      const connection = new Connection(rpcUrl, 'confirmed');

      let rawTxBytes: Uint8Array | null = null;
      const payloadStr = tx.unsigned_payload?.trim() || '';

      // Check if unsigned_payload can be decoded as binary (hex, base64, or base58)
      if (payloadStr) {
        if (/^[0-9a-fA-F]+$/.test(payloadStr) && payloadStr.length % 2 === 0) {
          try {
            const buf = new Uint8Array(payloadStr.length / 2);
            for (let i = 0; i < payloadStr.length; i += 2) {
              buf[i / 2] = parseInt(payloadStr.substring(i, i + 2), 16);
            }
            rawTxBytes = buf;
          } catch {}
        } else {
          try {
            // Try base64
            const binStr = atob(payloadStr);
            const buf = new Uint8Array(binStr.length);
            for (let i = 0; i < binStr.length; i++) {
              buf[i] = binStr.charCodeAt(i);
            }
            rawTxBytes = buf;
          } catch {
            try {
              // Try base58
              rawTxBytes = base58.decode(payloadStr);
            } catch {}
          }
        }
      }

      let sentViaRaw = false;

      // 1. If valid serialized transaction bytes exist, attempt broadcast via Connection.sendRawTransaction
      if (rawTxBytes && rawTxBytes.length > 50) {
        try {
          let txBuffer: Uint8Array = rawTxBytes;
          try {
            const parsedTx = Transaction.from(rawTxBytes);
            if (tx.signatures && tx.signatures.length > 0) {
              for (const sig of tx.signatures) {
                try {
                  const sigBytes = base58.decode(sig.signature);
                  const pubkey = new PublicKey(sig.signer);
                  parsedTx.addSignature(pubkey, Buffer.from(sigBytes));
                } catch {}
              }
              const serialized = await parsedTx.serialize();
              txBuffer = serialized;
            }
          } catch {
            // Buffer may be versioned transaction or already serialized
          }

          signature = await connection.sendRawTransaction(txBuffer, {
            skipPreflight: false,
            preflightCommitment: 'confirmed',
          });

          const confirmation = await connection.confirmTransaction(signature, 'confirmed');
          if (confirmation?.value?.err) {
            throw new Error(`On-chain transaction execution error: ${JSON.stringify(confirmation.value.err)}`);
          }
          sentViaRaw = true;
        } catch (rawErr) {
          console.warn('[DOT Queue] Raw transaction dispatch error, falling back to reconstruction:', rawErr);
        }
      }

      // 2. Fallback: reconstruct using buildAndBroadcastSolanaTransfer
      if (!sentViaRaw) {
        const amountNum = parseFloat(tx.decoded_intent.amount);
        if (isNaN(amountNum) || amountNum <= 0) {
          throw new Error(`Invalid transfer amount: ${tx.decoded_intent.amount}`);
        }

        if (!privateKey) {
          throw new Error(
            'Broadcasting this queued transaction requires your wallet key to reconstruct with a fresh blockhash. Please unlock your wallet.'
          );
        }

        const result = await buildAndBroadcastSolanaTransfer({
          senderAddress: tx.decoded_intent.from,
          recipientAddress: tx.decoded_intent.to,
          amountSol: amountNum,
          privateKeyHexOrBytes: privateKey,
          activeNetwork,
        });

        signature = result.signature;
        feeSol = result.feeSol;
      }
    } else {
      throw new Error(`On-chain broadcast for ${tx.chain.toUpperCase()} is not supported on this cluster.`);
    }

    // Update status to 'broadcast' and set broadcast_hash
    await updateTxStatus(tx.tx_id, 'broadcast', { broadcast_hash: signature });

    return { signature, feeSol };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    await updateTxStatus(tx.tx_id, 'failed', { error: errorMsg });
    throw err;
  }
}

