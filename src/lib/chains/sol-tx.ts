import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  Keypair,
  ComputeBudgetProgram,
} from '@solana/web3.js';
import { ed25519 } from '@noble/curves/ed25519.js';
import { base58 } from '@scure/base';

export interface BroadcastSolanaTxParams {
  senderAddress: string;
  recipientAddress: string;
  amountSol: number;
  privateKeyHexOrBytes: string | Uint8Array;
  activeNetwork: string; // 'Solana Mainnet-Beta' | 'Solana Devnet' | 'Solana Testnet'
  priorityFeeTier?: 'normal' | 'turbo' | 'ultra';
}

export interface BroadcastSolanaTxResult {
  signature: string;
  feeSol: string;
}

/**
 * Resolves the public RPC URL for the specified Solana cluster.
 */
export function resolveSolanaRpcUrl(activeNetwork: string): string {
  const normalized = (activeNetwork || '').toLowerCase();
  if (normalized.includes('devnet')) {
    return 'https://api.devnet.solana.com';
  }
  if (normalized.includes('testnet')) {
    return 'https://api.testnet.solana.com';
  }
  return 'https://api.mainnet-beta.solana.com';
}

/**
 * Decodes a private key input (hex string, base58 string, or Uint8Array) into a Solana Keypair.
 * If a 32-byte seed is provided, Keypair.fromSeed is used.
 * If a 64-byte secret key is provided, Keypair.fromSecretKey is used.
 */
export async function resolveSolanaKeypair(
  privateKeyHexOrBytes: string | Uint8Array
): Promise<Keypair> {
  let rawBytes: Uint8Array;

  if (typeof privateKeyHexOrBytes === 'string') {
    const clean = privateKeyHexOrBytes.trim().replace(/^0x/i, '');
    if (/^[0-9a-fA-F]+$/.test(clean) && (clean.length === 64 || clean.length === 128)) {
      rawBytes = new Uint8Array(clean.length / 2);
      for (let i = 0; i < clean.length; i += 2) {
        rawBytes[i / 2] = parseInt(clean.substring(i, i + 2), 16);
      }
    } else {
      try {
        rawBytes = base58.decode(clean);
      } catch {
        throw new Error(
          'Invalid Solana private key string format: must be 32-byte hex or base58 encoded seed.'
        );
      }
    }
  } else if (privateKeyHexOrBytes instanceof Uint8Array) {
    rawBytes = privateKeyHexOrBytes;
  } else {
    throw new Error('Unsupported private key type: expected hex string or Uint8Array.');
  }

  if (rawBytes.length === 32) {
    return await (Keypair.fromSeed(rawBytes) as Promise<Keypair> | Keypair);
  } else if (rawBytes.length === 64) {
    return await (Keypair.fromSecretKey(rawBytes) as Promise<Keypair> | Keypair);
  } else {
    throw new Error(
      `Invalid Solana private key length: expected 32 or 64 bytes, received ${rawBytes.length} bytes.`
    );
  }
}

/**
 * Builds, cryptographically signs with Ed25519, and broadcasts a real on-chain
 * Solana SOL transfer transaction.
 */
export async function buildAndBroadcastSolanaTransfer(
  params: BroadcastSolanaTxParams
): Promise<BroadcastSolanaTxResult> {
  const {
    senderAddress,
    recipientAddress,
    amountSol,
    privateKeyHexOrBytes,
    activeNetwork,
    priorityFeeTier = 'normal',
  } = params;

  if (!senderAddress) {
    throw new Error('Sender address is required.');
  }
  if (!recipientAddress) {
    throw new Error('Recipient address is required.');
  }
  if (typeof amountSol !== 'number' || isNaN(amountSol) || amountSol <= 0) {
    throw new Error(`Invalid transfer amount: ${amountSol} SOL. Amount must be a positive number.`);
  }

  // 1. Resolve RPC endpoint URL
  const rpcUrl = resolveSolanaRpcUrl(activeNetwork);

  // 2. Create Connection with commitment 'confirmed'
  const connection = new Connection(rpcUrl, 'confirmed');

  // 3. Instantiate transaction
  const tx = new Transaction();

  // 4. Add compute unit price if priority fee is 'turbo' or 'ultra'
  if (priorityFeeTier === 'turbo') {
    tx.add(ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 50_000 }));
  } else if (priorityFeeTier === 'ultra') {
    tx.add(ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 250_000 }));
  }

  // 5. Add SystemProgram.transfer instruction
  const fromPubkey = new PublicKey(senderAddress);
  const toPubkey = new PublicKey(recipientAddress);
  const lamports = BigInt(Math.round(amountSol * 1e9));

  tx.add(
    SystemProgram.transfer({
      fromPubkey,
      toPubkey,
      lamports,
    })
  );

  // 6. Fetch latest blockhash with 'confirmed' commitment
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
  tx.recentBlockhash = blockhash;
  tx.feePayer = fromPubkey;

  // 7. Resolve Keypair & verify Ed25519 cryptographic alignment
  const keypair = await resolveSolanaKeypair(privateKeyHexOrBytes);
  if (keypair.publicKey.toBase58() !== fromPubkey.toBase58()) {
    console.warn(
      `[sol-tx] Signing keypair public key (${keypair.publicKey.toBase58()}) does not match senderAddress (${fromPubkey.toBase58()}).`
    );
  }

  // Double check Ed25519 curve verification if 32-byte seed
  if (
    typeof privateKeyHexOrBytes === 'object' &&
    privateKeyHexOrBytes instanceof Uint8Array &&
    privateKeyHexOrBytes.length === 32
  ) {
    const derivedPub = ed25519.getPublicKey(privateKeyHexOrBytes);
    const pubBase58 = base58.encode(derivedPub);
    if (pubBase58 !== keypair.publicKey.toBase58()) {
      console.warn(`[sol-tx] noble ed25519 mismatch with keypair: ${pubBase58} vs ${keypair.publicKey.toBase58()}`);
    }
  }

  // Estimate / query transaction fee
  let feeSol = '0.000005';
  try {
    const feeInfo = await connection.getFeeForMessage(tx.compileMessage(), 'confirmed');
    if (feeInfo?.value != null) {
      feeSol = (Number(feeInfo.value) / 1e9).toFixed(6);
    }
  } catch {
    if (priorityFeeTier === 'turbo') {
      feeSol = '0.000015';
    } else if (priorityFeeTier === 'ultra') {
      feeSol = '0.000045';
    }
  }

  // 8. Sign transaction using sender's Ed25519 secret key
  await (tx.sign(keypair) as Promise<void> | void);

  // 9. Send raw transaction
  const serializedTx = await (tx.serialize() as Promise<Uint8Array> | Uint8Array);
  const signature = await connection.sendRawTransaction(serializedTx, {
    skipPreflight: false,
    preflightCommitment: 'confirmed',
  });

  // 10. Confirm transaction
  const confirmation = await connection.confirmTransaction(
    {
      signature,
      blockhash,
      lastValidBlockHeight,
    },
    'confirmed'
  );

  if (confirmation?.value?.err) {
    throw new Error(
      `Solana transaction failed on-chain: ${JSON.stringify(confirmation.value.err)} (Signature: ${signature})`
    );
  }

  return {
    signature,
    feeSol,
  };
}
