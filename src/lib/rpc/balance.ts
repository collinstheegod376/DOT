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
import { SupportedChainId, ChainBalance } from '@/types/wallet';

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

// ============================================================================
// Live Fiat Price Fetching (CoinGecko with Binance Fallback)
// ============================================================================

/**
 * Fetches live USD prices for ETH, BTC, and SOL.
 * Primary: CoinGecko Free API
 * Fallback: Binance 24hr ticker API
 */
export async function fetchCryptoPrices(): Promise<Record<string, TokenPriceData>> {
  const now = Date.now();
  if (priceCache && now - priceCache.timestamp < PRICE_CACHE_TTL_MS) {
    return priceCache.data;
  }

  const defaultPrices: Record<string, TokenPriceData> = {
    ethereum: { priceUsd: 0, change24hPercent: 0 },
    bitcoin: { priceUsd: 0, change24hPercent: 0 },
    solana: { priceUsd: 0, change24hPercent: 0 },
  };

  if (isClientOffline()) {
    return priceCache ? priceCache.data : defaultPrices;
  }

  // 1. Try CoinGecko
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=ethereum,bitcoin,solana&vs_currencies=usd&include_24hr_change=true',
      {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      }
    );

    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && data.ethereum && data.bitcoin && data.solana) {
        const result: Record<string, TokenPriceData> = {
          ethereum: {
            priceUsd: Number(data.ethereum.usd) || 0,
            change24hPercent: Number(data.ethereum.usd_24h_change?.toFixed(2)) || 0,
          },
          bitcoin: {
            priceUsd: Number(data.bitcoin.usd) || 0,
            change24hPercent: Number(data.bitcoin.usd_24h_change?.toFixed(2)) || 0,
          },
          solana: {
            priceUsd: Number(data.solana.usd) || 0,
            change24hPercent: Number(data.solana.usd_24h_change?.toFixed(2)) || 0,
          },
        };

        priceCache = { timestamp: now, data: result };
        return result;
      }
    }
  } catch (error) {
    console.warn('[DOT RPC] CoinGecko price fetch failed, trying Binance fallback...', error);
  }

  // 2. Try Binance fallback tickers
  try {
    const symbols = [
      { id: 'ethereum', symbol: 'ETHUSDT' },
      { id: 'bitcoin', symbol: 'BTCUSDT' },
      { id: 'solana', symbol: 'SOLUSDT' },
    ];

    const binanceData: Record<string, TokenPriceData> = {};

    await Promise.all(
      symbols.map(async ({ id, symbol }) => {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 4000);

          const res = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`, {
            signal: controller.signal,
            headers: { Accept: 'application/json' },
          });

          clearTimeout(timeoutId);

          if (res.ok) {
            const ticker = await res.json();
            binanceData[id] = {
              priceUsd: parseFloat(ticker.lastPrice) || 0,
              change24hPercent: parseFloat(parseFloat(ticker.priceChangePercent || '0').toFixed(2)),
            };
          }
        } catch {
          // Ignore individual ticker failures
        }
      })
    );

    if (binanceData.ethereum && binanceData.bitcoin && binanceData.solana) {
      priceCache = { timestamp: now, data: binanceData };
      return binanceData;
    }
  } catch (error) {
    console.warn('[DOT RPC] Binance price fallback failed:', error);
  }

  return priceCache ? priceCache.data : defaultPrices;
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
 * Unified live multi-chain balance and fiat valuation fetcher.
 * Queries real public RPCs directly from the client browser.
 * Every newly generated or empty address returns genuine "0.00" balance.
 *
 * @param addresses Map of chain ID -> address string or AddressInfo
 * @param existingBalances Optional existing balances map to fall back on if network is unreachable
 * @returns Map of chain ID -> { chainId, balance, tokenPriceUsd, fiatValueUsd, change24hPercent }
 */
export async function fetchLiveChainBalances(
  addresses: Record<string, string | { address?: string } | undefined>,
  existingBalances?: Record<string, any>
): Promise<Record<SupportedChainId, ChainBalance>> {
  const result: Record<string, ChainBalance> = {};
  const chainIds = Object.keys(addresses);

  // If no addresses provided, initialize with clean defaults
  const targetChains: SupportedChainId[] = ['ethereum', 'bitcoin', 'solana'];
  for (const c of targetChains) {
    const existing = existingBalances?.[c];
    result[c] = {
      chainId: c,
      balance: existing?.balance || '0.00',
      tokenPriceUsd: existing?.tokenPriceUsd || 0,
      fiatValueUsd: existing?.fiatValueUsd || 0,
      change24hPercent: existing?.change24hPercent || 0,
    };
  }

  if (chainIds.length === 0) {
    return result as Record<SupportedChainId, ChainBalance>;
  }

  // Fetch prices in parallel with balances
  const [prices] = await Promise.all([
    fetchCryptoPrices(),
  ]);

  // Query on-chain balances for each address concurrently
  await Promise.all(
    chainIds.map(async (chainId) => {
      const raw = addresses[chainId];
      const address = typeof raw === 'string' ? raw : raw?.address || '';
      const normalizedChain = chainId.toLowerCase();

      let balanceRes: { balance: string; status: 'online' | 'offline' | 'rate_limited' | 'error' } = {
        balance: '0.00',
        status: 'online',
      };

      if (!address || address === '0x...' || address.length < 10) {
        balanceRes = { balance: '0.00', status: 'online' };
      } else if (
        normalizedChain === 'ethereum' ||
        normalizedChain === 'arbitrum' ||
        normalizedChain === 'optimism' ||
        normalizedChain === 'base' ||
        normalizedChain === 'polygon' ||
        address.startsWith('0x')
      ) {
        balanceRes = await fetchEvmBalance(address, normalizedChain);
      } else if (
        normalizedChain === 'bitcoin' ||
        address.startsWith('bc1') ||
        address.startsWith('1') ||
        address.startsWith('3')
      ) {
        balanceRes = await fetchBitcoinBalance(address);
      } else if (normalizedChain === 'solana') {
        balanceRes = await fetchSolanaBalance(address);
      }

      // Map prices: match by chain name or fallback to existing or 0
      const existing = existingBalances?.[chainId];
      const priceInfo = prices[normalizedChain] || {
        priceUsd: existing?.tokenPriceUsd || 0,
        change24hPercent: existing?.change24hPercent || 0,
      };

      const numericBalance = parseFloat(balanceRes.balance) || 0;
      const fiatValueUsd = Math.round(numericBalance * priceInfo.priceUsd * 100) / 100;

      const typedChainId = (
        targetChains.includes(chainId as SupportedChainId)
          ? chainId
          : 'ethereum'
      ) as SupportedChainId;

      result[chainId] = {
        chainId: typedChainId,
        balance: balanceRes.balance,
        tokenPriceUsd: priceInfo.priceUsd,
        fiatValueUsd,
        change24hPercent: priceInfo.change24hPercent,
      };
    })
  );

  return result as Record<SupportedChainId, ChainBalance>;
}
