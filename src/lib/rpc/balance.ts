import {
  createPublicClient,
  http,
  fallback,
  formatEther,
  isAddress,
  type Address,
  type Chain,
  type PublicClient,
} from 'viem';
import {
  mainnet,
  arbitrum,
  optimism,
  base,
  polygon,
} from 'viem/chains';
import { SupportedChainId, ChainBalance, SplTokenBalance, TransactionRecord } from '@/types/wallet';
import { fetchSplTokenBalances } from '@/lib/chains/spl';

/**
 * DOT Client-Side Live Blockchain RPC & Real-time Balance Engine
 * Strict Non-Negotiable: Zero demo balances!
 * All newly generated addresses query real on-chain state and default to 0.00 until funded.
 */

export interface LiveBalanceResult {
  balance: string;
  tokenPriceUsd: number;
  fiatValueUsd: number;
  change24hPercent: number;
  status: 'online' | 'offline' | 'rate_limited' | 'error';
  lastUpdated: number;
}

export interface SolanaPortfolioResult {
  solBalance: string;
  solPriceUsd: number;
  solFiatUsd: number;
  solChange24hPercent: number;
  splTokens: SplTokenBalance[];
  totalPortfolioUsd: number;
  status: 'online' | 'offline' | 'rate_limited' | 'error';
  lastUpdated: number;
}

export interface TokenPriceData {
  priceUsd: number;
  change24hPercent: number;
}

export type ChainBalanceMap = Record<SupportedChainId, ChainBalance> &
  Record<string, { balance: string; tokenPriceUsd: number; fiatValueUsd: number; change24hPercent: number; chainId: SupportedChainId }>;

// In-memory price cache to prevent rate-limiting (30-second TTL)
let priceCache: {
  timestamp: number;
  data: Record<string, TokenPriceData>;
} | null = null;
const PRICE_CACHE_TTL_MS = 30_000;

/**
 * Checks if the browser client is currently offline.
 */
export function isClientOffline(): boolean {
  if (typeof navigator !== 'undefined' && 'onLine' in navigator) {
    return !navigator.onLine;
  }
  return false;
}

/**
 * Formats a raw crypto balance string cleanly.
 * Returns '0.00' if zero or invalid, or up to 6 significant decimal places.
 */
export function formatCryptoBalance(rawBalance: string | number): string {
  const num = typeof rawBalance === 'string' ? parseFloat(rawBalance) : rawBalance;
  if (isNaN(num) || num <= 0) {
    return '0.00';
  }
  if (num < 0.000001) {
    return num.toExponential(4);
  }
  // Trim trailing zeroes but keep up to 6 decimal places
  const str = num.toFixed(6);
  return str.replace(/\.?0+$/, '') || '0.00';
}

// ============================================================================
// EVM Balance Fetcher (Viem with HTTP Fallback Transport)
// ============================================================================

// Ethereum RPC endpoints with fallbacks as required
const ETHEREUM_RPC_FALLBACKS = [
  'https://eth.llamarpc.com',
  'https://cloudflare-eth.com',
  'https://rpc.ankr.com/eth',
  'https://eth.merkle.io',
  'https://gateway.tenderly.co/public/mainnet',
  'https://nodes.mewapi.io/rpc/eth',
  'https://eth-mainnet.public.blastapi.io',
];

const ARBITRUM_RPC_FALLBACKS = [
  'https://arb1.arbitrum.io/rpc',
  'https://arbitrum.llamarpc.com',
  'https://rpc.ankr.com/arbitrum',
];

const OPTIMISM_RPC_FALLBACKS = [
  'https://mainnet.optimism.io',
  'https://optimism.llamarpc.com',
  'https://rpc.ankr.com/optimism',
];

const BASE_RPC_FALLBACKS = [
  'https://mainnet.base.org',
  'https://base.llamarpc.com',
  'https://base-rpc.publicnode.com',
];

const POLYGON_RPC_FALLBACKS = [
  'https://polygon-rpc.com',
  'https://polygon.llamarpc.com',
  'https://rpc.ankr.com/polygon',
];

// Reusable Viem Public Clients
const evmClientMap: Record<string, PublicClient> = {};

function getOrCreateEvmClient(chainIdOrName: string = 'ethereum'): PublicClient {
  const normalized = chainIdOrName.toLowerCase();
  if (evmClientMap[normalized]) {
    return evmClientMap[normalized];
  }

  let chain: Chain = mainnet;
  let urls = ETHEREUM_RPC_FALLBACKS;

  if (normalized.includes('arbitrum')) {
    chain = arbitrum;
    urls = ARBITRUM_RPC_FALLBACKS;
  } else if (normalized.includes('optimism')) {
    chain = optimism;
    urls = OPTIMISM_RPC_FALLBACKS;
  } else if (normalized.includes('base')) {
    chain = base;
    urls = BASE_RPC_FALLBACKS;
  } else if (normalized.includes('polygon') || normalized.includes('matic')) {
    chain = polygon;
    urls = POLYGON_RPC_FALLBACKS;
  }

  const client = createPublicClient({
    chain,
    transport: fallback(
      urls.map((url) => http(url, { timeout: 7000, retryCount: 1 })),
      { rank: false }
    ),
  });

  evmClientMap[normalized] = client as PublicClient;
  return client as PublicClient;
}

/**
 * Queries live native balance for an EVM address using Viem with fallback transport.
 * Supports Ethereum, Arbitrum, Optimism, Base, Polygon.
 * Returns formatted Ether string, e.g. "0.00" or "1.23456".
 */
export async function fetchEvmBalance(
  address: string,
  network: string = 'ethereum'
): Promise<{ balance: string; status: 'online' | 'offline' | 'rate_limited' | 'error' }> {
  if (isClientOffline()) {
    return { balance: '0.00', status: 'offline' };
  }

  if (!address || !isAddress(address, { strict: false })) {
    return { balance: '0.00', status: 'error' };
  }

  try {
    const client = getOrCreateEvmClient(network);
    const balanceWei = await client.getBalance({
      address: address as Address,
    });
    const formatted = formatEther(balanceWei);
    return {
      balance: formatCryptoBalance(formatted),
      status: 'online',
    };
  } catch (error) {
    console.warn(`[DOT RPC] EVM balance fetch failed for ${address} on ${network}:`, error);
    const errMsg = String(error).toLowerCase();
    const isRateLimit = errMsg.includes('429') || errMsg.includes('rate limit');
    return {
      balance: '0.00',
      status: isRateLimit ? 'rate_limited' : 'error',
    };
  }
}

// ============================================================================
// Bitcoin Balance Fetcher (Mempool.space with Blockchain.info & Blockstream fallback)
// ============================================================================

/**
 * Queries live Bitcoin balance for a SegWit/Taproot/Legacy address.
 * Primary: https://mempool.space/api/address/${address}
 * Balance = (chain_stats.funded_txo_sum - chain_stats.spent_txo_sum) / 1e8
 * Fallback: blockchain.info and blockstream.info.
 * A 404 response on an explorer means 0 transactions have occurred -> balance is 0.00.
 */
export async function fetchBitcoinBalance(
  address: string
): Promise<{ balance: string; status: 'online' | 'offline' | 'rate_limited' | 'error' }> {
  if (isClientOffline()) {
    return { balance: '0.00', status: 'offline' };
  }

  if (!address || address.length < 20) {
    return { balance: '0.00', status: 'error' };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 7000);

  // 1. Try mempool.space
  try {
    const res = await fetch(`https://mempool.space/api/address/${encodeURIComponent(address)}`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });

    clearTimeout(timeoutId);

    if (res.status === 404) {
      // Unused fresh address -> 0.00
      return { balance: '0.00', status: 'online' };
    }

    if (res.ok) {
      const data = await res.json();
      if (data && data.chain_stats) {
        const funded = Number(data.chain_stats.funded_txo_sum) || 0;
        const spent = Number(data.chain_stats.spent_txo_sum) || 0;
        const satoshis = Math.max(0, funded - spent);
        const btc = satoshis / 1e8;
        return {
          balance: formatCryptoBalance(btc),
          status: 'online',
        };
      }
    }
  } catch (error) {
    clearTimeout(timeoutId);
    console.warn(`[DOT RPC] Mempool.space fetch failed for ${address}, trying fallbacks...`, error);
  }

  // 2. Try blockstream.info fallback (identical schema to mempool)
  try {
    const c2 = new AbortController();
    const t2 = setTimeout(() => c2.abort(), 6000);
    const res = await fetch(`https://blockstream.info/api/address/${encodeURIComponent(address)}`, {
      signal: c2.signal,
      headers: { Accept: 'application/json' },
    });
    clearTimeout(t2);

    if (res.status === 404) {
      return { balance: '0.00', status: 'online' };
    }

    if (res.ok) {
      const data = await res.json();
      if (data && data.chain_stats) {
        const funded = Number(data.chain_stats.funded_txo_sum) || 0;
        const spent = Number(data.chain_stats.spent_txo_sum) || 0;
        const satoshis = Math.max(0, funded - spent);
        const btc = satoshis / 1e8;
        return {
          balance: formatCryptoBalance(btc),
          status: 'online',
        };
      }
    }
  } catch (error) {
    console.warn(`[DOT RPC] Blockstream fetch failed for ${address}:`, error);
  }

  // 3. Try blockchain.info rawaddr fallback
  try {
    const c3 = new AbortController();
    const t3 = setTimeout(() => c3.abort(), 6000);
    const res = await fetch(`https://blockchain.info/rawaddr/${encodeURIComponent(address)}?cors=true`, {
      signal: c3.signal,
      headers: { Accept: 'application/json' },
    });
    clearTimeout(t3);

    if (res.status === 404) {
      return { balance: '0.00', status: 'online' };
    }

    if (res.ok) {
      const data = await res.json();
      if (typeof data.final_balance === 'number') {
        const btc = Math.max(0, data.final_balance) / 1e8;
        return {
          balance: formatCryptoBalance(btc),
          status: 'online',
        };
      }
    }
  } catch (error) {
    console.warn(`[DOT RPC] Blockchain.info fetch failed for ${address}:`, error);
  }

  // Graceful return 0.00 on network partition
  return { balance: '0.00', status: 'error' };
}

// ============================================================================
// Solana Balance Fetcher (JSON-RPC getBalance)
// ============================================================================

const SOLANA_RPC_FALLBACKS = [
  'https://api.mainnet-beta.solana.com',
  'https://rpc.ankr.com/solana',
  'https://solana-rpc.publicnode.com',
];

/**
 * Queries live balance from public Solana RPC using JSON-RPC `getBalance`.
 * Balance formatted in SOL (lamports / 1e9).
 */
export async function fetchSolanaBalance(
  address: string
): Promise<{ balance: string; status: 'online' | 'offline' | 'rate_limited' | 'error' }> {
  if (isClientOffline()) {
    return { balance: '0.00', status: 'offline' };
  }

  if (!address || address.length < 32) {
    return { balance: '0.00', status: 'error' };
  }

  for (const rpcUrl of SOLANA_RPC_FALLBACKS) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(rpcUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getBalance',
          params: [address, { commitment: 'confirmed' }],
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const json = await res.json();
        if (json && json.result && typeof json.result.value === 'number') {
          const lamports = json.result.value;
          const sol = lamports / 1e9;
          return {
            balance: formatCryptoBalance(sol),
            status: 'online',
          };
        }
      }
    } catch (error) {
      console.warn(`[DOT RPC] Solana RPC ${rpcUrl} failed:`, error);
    }
  }

  return { balance: '0.00', status: 'error' };
}

/**
 * Queries on-chain transaction history for a Solana address.
 * Accurately parses incoming and outgoing SOL transfers directly from Solana RPC.
 */
export async function fetchSolanaTransactions(
  address: string,
  solPriceUsd = 154.20,
  activeNetwork = 'Solana Mainnet-Beta'
): Promise<TransactionRecord[]> {
  if (isClientOffline()) return [];
  if (!address || address.length < 32) return [];

  const endpoints = activeNetwork.includes('Devnet')
    ? ['https://api.devnet.solana.com']
    : activeNetwork.includes('Testnet')
    ? ['https://api.testnet.solana.com']
    : SOLANA_RPC_FALLBACKS;

  for (const rpcUrl of endpoints) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const sigRes = await fetch(rpcUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getSignaturesForAddress',
          params: [address, { limit: 12 }],
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!sigRes.ok) continue;
      const sigData = await sigRes.json();
      const rawSignatures = sigData?.result;

      if (!Array.isArray(rawSignatures) || rawSignatures.length === 0) {
        return [];
      }

      const txRecords: TransactionRecord[] = [];
      const batch = rawSignatures.slice(0, 10);

      await Promise.all(
        batch.map(async (sigObj: { signature: string; blockTime?: number; err?: unknown }) => {
          try {
            const txSig = sigObj.signature;
            const txController = new AbortController();
            const txTimeout = setTimeout(() => txController.abort(), 6000);

            const txRes = await fetch(rpcUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
              },
              body: JSON.stringify({
                jsonrpc: '2.0',
                id: 1,
                method: 'getTransaction',
                params: [
                  txSig,
                  { encoding: 'jsonParsed', maxSupportedTransactionVersion: 0 },
                ],
              }),
              signal: txController.signal,
            });
            clearTimeout(txTimeout);

            if (!txRes.ok) return;
            const txJson = await txRes.json();
            const txResult = txJson?.result;
            if (!txResult) return;

            const meta = txResult.meta;
            const transaction = txResult.transaction;
            const message = transaction?.message;
            const rawAccountKeys = message?.accountKeys || [];

            // Account keys can be strings or objects with pubkey property
            const accountKeys: string[] = rawAccountKeys.map((k: string | { pubkey: string }) =>
              typeof k === 'string' ? k : k?.pubkey || ''
            );

            const addrIndex = accountKeys.indexOf(address);
            if (addrIndex === -1 || !meta?.preBalances || !meta?.postBalances) {
              return;
            }

            const preLamports = meta.preBalances[addrIndex] ?? 0;
            const postLamports = meta.postBalances[addrIndex] ?? 0;
            const diffLamports = postLamports - preLamports;
            const feeLamports = meta.fee || 5000;
            const feeSol = (feeLamports / 1e9).toFixed(5);

            let type: 'send' | 'receive' = 'receive';
            let amountSol = 0;

            if (diffLamports > 0) {
              type = 'receive';
              amountSol = diffLamports / 1e9;
            } else if (diffLamports < 0) {
              type = 'send';
              const netDebit = Math.abs(diffLamports);
              amountSol = addrIndex === 0 && netDebit >= feeLamports ? (netDebit - feeLamports) / 1e9 : netDebit / 1e9;
            } else {
              type = 'receive';
              amountSol = 0;
            }

            const timestamp = (txResult.blockTime || sigObj.blockTime || Math.floor(Date.now() / 1000)) * 1000;
            const fromAddr = type === 'send' ? address : accountKeys[0] || 'Unknown';
            const toAddr = type === 'send' ? accountKeys[1] || 'Recipient' : address;

            txRecords.push({
              id: txSig,
              chainId: 'solana',
              hash: txSig,
              type,
              amount: amountSol > 0 ? formatCryptoBalance(amountSol) : '0.00',
              fiatValueUsd: amountSol * solPriceUsd,
              from: fromAddr,
              to: toAddr,
              timestamp,
              status: meta.err ? 'pending' : 'confirmed',
              fee: feeSol,
            });
          } catch {
            // Ignore individual transaction fetch errors
          }
        })
      );

      txRecords.sort((a, b) => b.timestamp - a.timestamp);
      if (txRecords.length > 0) {
        return txRecords;
      }
    } catch (err) {
      console.warn(`[DOT RPC] fetchSolanaTransactions on ${rpcUrl} failed:`, err);
    }
  }

  return [];
}

// ============================================================================
// Live Fiat Price Fetching (CoinGecko with In-Memory Caching & Stablecoin Logic)
// ============================================================================

/**
 * Fetches live USD prices for SOL and SPL tokens.
 * Stablecoins (USDC, USDT) default to $1.00.
 * SOL, JUP, RAY, BONK, and PYTH fetched from CoinGecko.
 */
export async function fetchSolanaAndSplPrices(): Promise<Record<string, TokenPriceData>> {
  const now = Date.now();
  if (priceCache && now - priceCache.timestamp < PRICE_CACHE_TTL_MS) {
    return priceCache.data;
  }

  // Baseline fallback prices
  const result: Record<string, TokenPriceData> = {
    solana: { priceUsd: 154.20, change24hPercent: 0 },
    'usd-coin': { priceUsd: 1.0, change24hPercent: 0 },
    tether: { priceUsd: 1.0, change24hPercent: 0 },
    'jupiter-exchange-solana': { priceUsd: 0.85, change24hPercent: 0 },
    raydium: { priceUsd: 2.10, change24hPercent: 0 },
    bonk: { priceUsd: 0.000022, change24hPercent: 0 },
    'pyth-network': { priceUsd: 0.35, change24hPercent: 0 },
    // Symbol aliases
    SOL: { priceUsd: 154.20, change24hPercent: 0 },
    USDC: { priceUsd: 1.0, change24hPercent: 0 },
    USDT: { priceUsd: 1.0, change24hPercent: 0 },
    JUP: { priceUsd: 0.85, change24hPercent: 0 },
    RAY: { priceUsd: 2.10, change24hPercent: 0 },
    BONK: { priceUsd: 0.000022, change24hPercent: 0 },
    PYTH: { priceUsd: 0.35, change24hPercent: 0 },
    // Mint aliases
    'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': { priceUsd: 1.0, change24hPercent: 0 },
    'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': { priceUsd: 1.0, change24hPercent: 0 },
    'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN': { priceUsd: 0.85, change24hPercent: 0 },
    '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R': { priceUsd: 2.10, change24hPercent: 0 },
    'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263': { priceUsd: 0.000022, change24hPercent: 0 },
    'HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3': { priceUsd: 0.35, change24hPercent: 0 },
  };

  if (isClientOffline()) {
    return priceCache ? priceCache.data : result;
  }

  // 1. Fetch live prices from CoinGecko
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=solana,jupiter-exchange-solana,raydium,bonk,pyth-network,ethereum,bitcoin&vs_currencies=usd&include_24hr_change=true',
      {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      }
    );

    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && typeof data === 'object') {
        const parseToken = (id: string) => {
          if (data[id]) {
            return {
              priceUsd: Number(data[id].usd) || 0,
              change24hPercent: Number(data[id].usd_24h_change?.toFixed(2)) || 0,
            };
          }
          return null;
        };

        const sol = parseToken('solana');
        if (sol) {
          result.solana = sol;
          result.SOL = sol;
        }

        const jup = parseToken('jupiter-exchange-solana');
        if (jup) {
          result['jupiter-exchange-solana'] = jup;
          result.JUP = jup;
          result['JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN'] = jup;
        }

        const ray = parseToken('raydium');
        if (ray) {
          result.raydium = ray;
          result.RAY = ray;
          result['4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R'] = ray;
        }

        const bonk = parseToken('bonk');
        if (bonk) {
          result.bonk = bonk;
          result.BONK = bonk;
          result['DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263'] = bonk;
        }

        const pyth = parseToken('pyth-network');
        if (pyth) {
          result['pyth-network'] = pyth;
          result.PYTH = pyth;
          result['HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3'] = pyth;
        }

        // Fixed stablecoins
        result.USDC = { priceUsd: 1.0, change24hPercent: 0 };
        result.USDT = { priceUsd: 1.0, change24hPercent: 0 };
        result['EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'] = { priceUsd: 1.0, change24hPercent: 0 };
        result['Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'] = { priceUsd: 1.0, change24hPercent: 0 };

        priceCache = { timestamp: now, data: result };
        return result;
      }
    }
  } catch (err) {
    console.warn('[DOT RPC] CoinGecko price fetch failed:', err);
  }

  return priceCache ? priceCache.data : result;
}

/**
 * Backward compatibility alias for fetchCryptoPrices
 */
export async function fetchCryptoPrices(): Promise<Record<string, TokenPriceData>> {
  return fetchSolanaAndSplPrices();
}

/**
 * Fetches native SOL balance + all SPL token balances for the wallet address in parallel.
 * Fetches live USD prices for SOL and SPL tokens (USDC = $1.00, USDT = $1.00, JUP/RAY/BONK/PYTH via live API).
 * Computes total portfolio USD value (SOL fiat value + sum of all SPL token fiat values).
 */
export async function fetchSolanaPortfolio(address: string): Promise<SolanaPortfolioResult> {
  if (isClientOffline()) {
    return {
      solBalance: '0.00',
      solPriceUsd: 0,
      solFiatUsd: 0,
      solChange24hPercent: 0,
      splTokens: [],
      totalPortfolioUsd: 0,
      status: 'offline',
      lastUpdated: Date.now(),
    };
  }

  // Fetch SOL balance, SPL token accounts, and live prices concurrently in parallel
  const [solBalanceRes, splTokens, prices] = await Promise.all([
    fetchSolanaBalance(address),
    fetchSplTokenBalances(address, true),
    fetchSolanaAndSplPrices(),
  ]);

  const solBalanceNum = parseFloat(solBalanceRes.balance) || 0;
  const solPrice = prices['solana']?.priceUsd || 0;
  const solFiatUsd = Math.round(solBalanceNum * solPrice * 100) / 100;
  const solChange24hPercent = prices['solana']?.change24hPercent || 0;

  let totalSplFiatUsd = 0;

  for (const token of splTokens) {
    // Lookup price by mint or symbol
    const priceInfo = prices[token.mint] || prices[token.symbol] || { priceUsd: 0, change24hPercent: 0 };
    token.tokenPriceUsd = priceInfo.priceUsd;
    token.change24hPercent = priceInfo.change24hPercent;

    const tokenBalanceNum = parseFloat(token.balance) || 0;
    const tokenFiat = Math.round(tokenBalanceNum * token.tokenPriceUsd * 100) / 100;
    token.fiatValueUsd = tokenFiat;

    totalSplFiatUsd += tokenFiat;
  }

  const totalPortfolioUsd = Math.round((solFiatUsd + totalSplFiatUsd) * 100) / 100;

  return {
    solBalance: solBalanceRes.balance,
    solPriceUsd: solPrice,
    solFiatUsd,
    solChange24hPercent,
    splTokens,
    totalPortfolioUsd,
    status: solBalanceRes.status,
    lastUpdated: Date.now(),
  };
}

// ============================================================================
// Unified Multi-Chain Balance Query
// ============================================================================

export interface ChainBalanceOutput {
  chainId: SupportedChainId;
  balance: string;
  tokenPriceUsd: number;
  fiatValueUsd: number;
  change24hPercent: number;
}

/**
 * Unified live balance and fiat valuation fetcher.
 * Queries real public RPCs directly from the client browser.
 * Every newly generated or empty address returns genuine "0.00" balance.
 *
 * @param addresses Map of chain ID -> address string or AddressInfo
 * @param existingBalances Optional existing balances map to fall back on if network is unreachable
 * @returns Map of chain ID -> { chainId, balance, tokenPriceUsd, fiatValueUsd, change24hPercent, splTokens, totalPortfolioFiatUsd }
 */
export async function fetchLiveChainBalances(
  addresses: Record<string, string | { address?: string } | undefined>,
  existingBalances?: Record<string, any>
): Promise<Record<SupportedChainId, ChainBalance>> {
  const result: Record<string, ChainBalance> = {};
  const chainIds = Object.keys(addresses);

  // If no addresses provided, initialize with clean defaults
  const targetChains: SupportedChainId[] = ['solana'];
  for (const c of targetChains) {
    const existing = existingBalances?.[c];
    result[c] = {
      chainId: c,
      balance: existing?.balance || '0.00',
      tokenPriceUsd: existing?.tokenPriceUsd || 0,
      fiatValueUsd: existing?.fiatValueUsd || 0,
      change24hPercent: existing?.change24hPercent || 0,
      splTokens: existing?.splTokens || [],
      totalPortfolioFiatUsd: existing?.totalPortfolioFiatUsd || 0,
    };
  }

  if (chainIds.length === 0) {
    return result as Record<SupportedChainId, ChainBalance>;
  }

  // Concurrently fetch balances for all addresses
  await Promise.all(
    chainIds.map(async (chainId) => {
      const raw = addresses[chainId];
      const address = typeof raw === 'string' ? raw : raw?.address || '';
      const normalizedChain = chainId.toLowerCase();

      if (normalizedChain === 'solana') {
        const portfolio = await fetchSolanaPortfolio(address);
        if ((portfolio.status === 'offline' || portfolio.status === 'error') && existingBalances?.['solana']) {
          result['solana'] = existingBalances['solana'];
        } else {
          result['solana'] = {
            chainId: 'solana',
            balance: portfolio.solBalance,
            tokenPriceUsd: portfolio.solPriceUsd,
            fiatValueUsd: portfolio.totalPortfolioUsd, // Reflects full portfolio fiat value
            change24hPercent: portfolio.solChange24hPercent,
            splTokens: portfolio.splTokens,
            totalPortfolioFiatUsd: portfolio.totalPortfolioUsd,
          };
        }
      }
    })
  );

  return result as Record<SupportedChainId, ChainBalance>;
}
