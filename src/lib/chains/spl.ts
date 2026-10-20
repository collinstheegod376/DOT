import { SplTokenBalance, SplTokenConfig } from '@/types/wallet';
import { KNOWN_SPL_TOKENS, KNOWN_SPL_TOKENS_BY_MINT } from '@/lib/constants';

/**
 * Solana SPL Token Client-Side RPC Engine
 * Standard SPL Token Program ID: TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA
 */

export const TOKEN_PROGRAM_ID = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
export const ASSOCIATED_TOKEN_PROGRAM_ID = 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL';

export const SOLANA_RPC_FALLBACKS = [
  'https://api.mainnet-beta.solana.com',
  'https://rpc.ankr.com/solana',
  'https://solana-rpc.publicnode.com',
];

export const SOLANA_CLUSTER_RPCS: Record<string, string[]> = {
  'Solana Devnet': ['https://api.devnet.solana.com'],
  'Solana Testnet': ['https://api.testnet.solana.com'],
  'Solana Mainnet-Beta': SOLANA_RPC_FALLBACKS,
};

function resolveClusterRpcEndpoints(networkOrUrl?: string): string[] {
  if (!networkOrUrl) return SOLANA_RPC_FALLBACKS;
  if (SOLANA_CLUSTER_RPCS[networkOrUrl]) {
    return SOLANA_CLUSTER_RPCS[networkOrUrl];
  }
  if (networkOrUrl.includes('Devnet')) {
    return SOLANA_CLUSTER_RPCS['Solana Devnet'];
  }
  if (networkOrUrl.includes('Testnet')) {
    return SOLANA_CLUSTER_RPCS['Solana Testnet'];
  }
  if (networkOrUrl.startsWith('http://') || networkOrUrl.startsWith('https://')) {
    return [networkOrUrl];
  }
  return SOLANA_RPC_FALLBACKS;
}

interface RpcParsedTokenAmount {
  amount?: string;
  decimals?: number;
  uiAmount?: number | null;
  uiAmountString?: string;
}

interface RpcParsedTokenInfo {
  isNative?: boolean;
  mint?: string;
  owner?: string;
  state?: string;
  tokenAmount?: RpcParsedTokenAmount;
}

interface RpcTokenAccountData {
  parsed?: {
    info?: RpcParsedTokenInfo;
    type?: string;
  };
  program?: string;
  space?: number;
}

interface RpcTokenAccountItem {
  pubkey: string;
  account: {
    data: RpcTokenAccountData;
    executable: boolean;
    lamports: number;
    owner: string;
    rentEpoch: number;
  };
}

/**
 * Formats a raw token amount according to its decimals into a clean UI string
 */
export function formatSplAmount(rawAmount: string | bigint, decimals: number): string {
  try {
    const rawBig = BigInt(rawAmount.toString());
    if (rawBig === 0n) return '0.00';

    const divisor = 10n ** BigInt(decimals);
    const integerPart = rawBig / divisor;
    const remainder = rawBig % divisor;

    if (remainder === 0n) {
      return integerPart.toString();
    }

    const remainderStr = remainder.toString().padStart(decimals, '0');
    // Trim trailing zeroes but keep at least 2 decimal places for sub-integers
    const trimmed = remainderStr.replace(/0+$/, '');
    const formatted = `${integerPart.toString()}.${trimmed}`;
    return formatted;
  } catch {
    return '0.00';
  }
}

/**
 * Queries on-chain SPL token accounts owned by the given address using JSON-RPC `getTokenAccountsByOwner`
 * with ProgramId `TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA` and `jsonParsed` encoding.
 */
export async function queryOnChainSplAccounts(
  ownerAddress: string,
  networkOrRpcUrl?: string
): Promise<SplTokenBalance[]> {
  if (!ownerAddress || ownerAddress.length < 32) {
    return [];
  }

  const rpcList = resolveClusterRpcEndpoints(networkOrRpcUrl);

  for (const rpcUrl of rpcList) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);

      const res = await fetch(rpcUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getTokenAccountsByOwner',
          params: [
            ownerAddress,
            { programId: TOKEN_PROGRAM_ID },
            {
              encoding: 'jsonParsed',
              commitment: 'confirmed',
            },
          ],
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        continue;
      }

      const json = await res.json();
      if (!json || !json.result || !Array.isArray(json.result.value)) {
        continue;
      }

      const items: RpcTokenAccountItem[] = json.result.value;
      const parsedBalances: SplTokenBalance[] = [];

      for (const item of items) {
        const info = item.account?.data?.parsed?.info;
        if (!info || !info.mint) continue;

        const mint = info.mint;
        const decimals = info.tokenAmount?.decimals ?? 0;
        const rawAmount = info.tokenAmount?.amount || '0';
        const uiAmountString =
          info.tokenAmount?.uiAmountString ||
          (info.tokenAmount?.uiAmount !== undefined && info.tokenAmount?.uiAmount !== null
            ? String(info.tokenAmount.uiAmount)
            : formatSplAmount(rawAmount, decimals));

        const knownMeta = KNOWN_SPL_TOKENS_BY_MINT[mint];

        parsedBalances.push({
          mint,
          symbol: knownMeta?.symbol || `${mint.slice(0, 4)}...${mint.slice(-4)}`,
          name: knownMeta?.name || `SPL Token (${mint.slice(0, 4)}...${mint.slice(-4)})`,
          decimals: knownMeta?.decimals ?? decimals,
          balance: uiAmountString === '0' ? '0.00' : uiAmountString,
          rawAmount,
          tokenAccountAddress: item.pubkey,
          tokenPriceUsd: 0, // Populated by price engine
          fiatValueUsd: 0,
          change24hPercent: 0,
          icon: knownMeta?.icon,
        });
      }

      return parsedBalances;
    } catch (err) {
      console.warn(`[DOT SPL Engine] RPC ${rpcUrl} getTokenAccountsByOwner failed:`, err);
    }
  }

  return [];
}

/**
 * Fetches all SPL token accounts for an owner address, and optionally merges
 * the known tokens (USDC, USDT, JUP, RAY, BONK, PYTH) so that
 * fresh vaults display zero balances for standard tokens.
 * On Devnet/Testnet, if known SPL tokens don't exist, handles gracefully returning 0 balances without error.
 */
export async function fetchSplTokenBalances(
  ownerAddress: string,
  includeKnownZeroBalances = true,
  activeNetworkOrRpc?: string
): Promise<SplTokenBalance[]> {
  try {
    const onChainAccounts = await queryOnChainSplAccounts(ownerAddress, activeNetworkOrRpc);

    if (!includeKnownZeroBalances) {
      return onChainAccounts;
    }

    // Create lookup of found accounts by mint
    const onChainByMint = new Map<string, SplTokenBalance>();
    for (const acc of onChainAccounts) {
      onChainByMint.set(acc.mint, acc);
    }

    const result: SplTokenBalance[] = [];

    // 1. Ensure all known tokens exist in list
    for (const known of KNOWN_SPL_TOKENS) {
      const existing = onChainByMint.get(known.mint);
      if (existing) {
        result.push(existing);
        onChainByMint.delete(known.mint);
      } else {
        // Clean zero balance representation
        result.push({
          mint: known.mint,
          symbol: known.symbol,
          name: known.name,
          decimals: known.decimals,
          balance: '0.00',
          rawAmount: '0',
          tokenPriceUsd: 0,
          fiatValueUsd: 0,
          change24hPercent: 0,
          icon: known.icon,
        });
      }
    }

    // 2. Append any extra unknown on-chain SPL tokens held by user
    for (const remaining of onChainByMint.values()) {
      result.push(remaining);
    }

    return result;
  } catch (err) {
    console.warn(`[DOT SPL Engine] fetchSplTokenBalances error on ${activeNetworkOrRpc}:`, err);
    // Graceful fallback on Devnet/Testnet
    return KNOWN_SPL_TOKENS.map((known) => ({
      mint: known.mint,
      symbol: known.symbol,
      name: known.name,
      decimals: known.decimals,
      balance: '0.00',
      rawAmount: '0',
      tokenPriceUsd: 0,
      fiatValueUsd: 0,
      change24hPercent: 0,
      icon: known.icon,
    }));
  }
}
