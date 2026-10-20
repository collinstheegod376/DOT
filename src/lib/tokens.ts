import { TokenAsset } from '@/types/wallet';

/**
 * Known default Solana Mainnet tokens
 * Strict Rule: Initial wallet balances always start at '0.00' and $0.00 fiat valuation
 */
export const DEFAULT_SOLANA_TOKENS: TokenAsset[] = [
  {
    symbol: 'SOL',
    name: 'Solana',
    mint: 'native',
    decimals: 9,
    balance: '0.00',
    tokenPriceUsd: 154.20,
    fiatValueUsd: 0.00,
    change24hPercent: 3.42,
    color: '#14F195',
    isNative: true,
  },
  {
    symbol: 'USDC',
    name: 'USD Coin',
    mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    decimals: 6,
    balance: '0.00',
    tokenPriceUsd: 1.00,
    fiatValueUsd: 0.00,
    change24hPercent: 0.01,
    color: '#2775CA',
  },
  {
    symbol: 'USDT',
    name: 'Tether USD',
    mint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
    decimals: 6,
    balance: '0.00',
    tokenPriceUsd: 1.00,
    fiatValueUsd: 0.00,
    change24hPercent: -0.02,
    color: '#26A17B',
  },
  {
    symbol: 'JUP',
    name: 'Jupiter',
    mint: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
    decimals: 6,
    balance: '0.00',
    tokenPriceUsd: 0.88,
    fiatValueUsd: 0.00,
    change24hPercent: 5.14,
    color: '#00BE88',
  },
  {
    symbol: 'RAY',
    name: 'Raydium',
    mint: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
    decimals: 6,
    balance: '0.00',
    tokenPriceUsd: 2.15,
    fiatValueUsd: 0.00,
    change24hPercent: 1.87,
    color: '#5E6BE4',
  },
  {
    symbol: 'BONK',
    name: 'Bonk',
    mint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
    decimals: 5,
    balance: '0.00',
    tokenPriceUsd: 0.0000214,
    fiatValueUsd: 0.00,
    change24hPercent: -1.25,
    color: '#F08E2D',
  },
];

const SOLANA_RPC_ENDPOINTS = [
  'https://api.mainnet-beta.solana.com',
  'https://rpc.ankr.com/solana',
  'https://solana-rpc.publicnode.com',
];

const TOKEN_PROGRAM_ID = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';

// In-memory price cache (30s TTL)
let tokenPriceCache: {
  timestamp: number;
  data: Record<string, { priceUsd: number; change24hPercent: number }>;
} | null = null;

const CACHE_TTL_MS = 30_000;

/**
 * Fetch SPL token account balances for a given Solana owner address
 */
export async function fetchSolanaTokenAccounts(
  address: string
): Promise<Record<string, { balance: string; decimals: number }>> {
  if (!address || address.length < 32 || typeof window === 'undefined' && !address) {
    return {};
  }

  for (const rpcUrl of SOLANA_RPC_ENDPOINTS) {
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
          method: 'getTokenAccountsByOwner',
          params: [
            address,
            { programId: TOKEN_PROGRAM_ID },
            { encoding: 'jsonParsed' },
          ],
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const json = await res.json();
        const accounts = json?.result?.value;
        const balancesByMint: Record<string, { balance: string; decimals: number }> = {};

        if (Array.isArray(accounts)) {
          for (const acc of accounts) {
            const parsedInfo = acc?.account?.data?.parsed?.info;
            const mint = parsedInfo?.mint;
            const tokenAmount = parsedInfo?.tokenAmount;
            if (mint && tokenAmount) {
              balancesByMint[mint] = {
                balance: tokenAmount.uiAmountString || '0.00',
                decimals: tokenAmount.decimals || 0,
              };
            }
          }
        }

        return balancesByMint;
      }
    } catch {
      // Continue to fallback
    }
  }

  return {};
}

/**
 * Fetch live token prices via CoinGecko with fallback to static estimates
 */
export async function fetchSolanaTokenPrices(): Promise<
  Record<string, { priceUsd: number; change24hPercent: number }>
> {
  const now = Date.now();
  if (tokenPriceCache && now - tokenPriceCache.timestamp < CACHE_TTL_MS) {
    return tokenPriceCache.data;
  }

  const defaultPrices: Record<string, { priceUsd: number; change24hPercent: number }> = {
    SOL: { priceUsd: 154.20, change24hPercent: 3.42 },
    USDC: { priceUsd: 1.00, change24hPercent: 0.01 },
    USDT: { priceUsd: 1.00, change24hPercent: -0.02 },
    JUP: { priceUsd: 0.88, change24hPercent: 5.14 },
    RAY: { priceUsd: 2.15, change24hPercent: 1.87 },
    BONK: { priceUsd: 0.0000214, change24hPercent: -1.25 },
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=solana,usd-coin,tether,jupiter-exchange-solana,raydium,bonk&vs_currencies=usd&include_24hr_change=true',
      {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      }
    );

    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const updated: Record<string, { priceUsd: number; change24hPercent: number }> = {
        SOL: {
          priceUsd: Number(data.solana?.usd) || defaultPrices.SOL.priceUsd,
          change24hPercent: Number(data.solana?.usd_24h_change?.toFixed(2)) || defaultPrices.SOL.change24hPercent,
        },
        USDC: {
          priceUsd: Number(data['usd-coin']?.usd) || defaultPrices.USDC.priceUsd,
          change24hPercent: Number(data['usd-coin']?.usd_24h_change?.toFixed(2)) || defaultPrices.USDC.change24hPercent,
        },
        USDT: {
          priceUsd: Number(data.tether?.usd) || defaultPrices.USDT.priceUsd,
          change24hPercent: Number(data.tether?.usd_24h_change?.toFixed(2)) || defaultPrices.USDT.change24hPercent,
        },
        JUP: {
          priceUsd: Number(data['jupiter-exchange-solana']?.usd) || defaultPrices.JUP.priceUsd,
          change24hPercent: Number(data['jupiter-exchange-solana']?.usd_24h_change?.toFixed(2)) || defaultPrices.JUP.change24hPercent,
        },
        RAY: {
          priceUsd: Number(data.raydium?.usd) || defaultPrices.RAY.priceUsd,
          change24hPercent: Number(data.raydium?.usd_24h_change?.toFixed(2)) || defaultPrices.RAY.change24hPercent,
        },
        BONK: {
          priceUsd: Number(data.bonk?.usd) || defaultPrices.BONK.priceUsd,
          change24hPercent: Number(data.bonk?.usd_24h_change?.toFixed(2)) || defaultPrices.BONK.change24hPercent,
        },
      };

      tokenPriceCache = { timestamp: now, data: updated };
      return updated;
    }
  } catch {
    // Return fallback on network error
  }

  return tokenPriceCache ? tokenPriceCache.data : defaultPrices;
}

/**
 * Formats a crypto balance cleanly
 */
export function formatTokenBalance(val: string | number): string {
  const num = typeof val === 'string' ? parseFloat(val) : val;
  if (isNaN(num) || num <= 0) return '0.00';
  if (num < 0.000001) return num.toExponential(4);
  const str = num.toFixed(6);
  return str.replace(/\.?0+$/, '') || '0.00';
}

/**
 * Builds the comprehensive token assets list by merging on-chain balances with live market data
 */
export async function getLiveTokenAssets(
  solanaAddress: string,
  nativeSolBalance = '0.00',
  solPrice?: number,
  solChange?: number
): Promise<TokenAsset[]> {
  const [tokenAccounts, prices] = await Promise.all([
    fetchSolanaTokenAccounts(solanaAddress),
    fetchSolanaTokenPrices(),
  ]);

  return DEFAULT_SOLANA_TOKENS.map((token) => {
    let balance = '0.00';
    if (token.isNative) {
      balance = nativeSolBalance || '0.00';
    } else if (tokenAccounts[token.mint]) {
      balance = tokenAccounts[token.mint].balance;
    }

    const priceInfo = prices[token.symbol] || {
      priceUsd: token.isNative && solPrice ? solPrice : token.tokenPriceUsd,
      change24hPercent: token.isNative && solChange !== undefined ? solChange : token.change24hPercent,
    };

    const numBalance = parseFloat(balance) || 0;
    const fiatValueUsd = Math.round(numBalance * priceInfo.priceUsd * 100) / 100;

    return {
      ...token,
      balance,
      tokenPriceUsd: priceInfo.priceUsd,
      change24hPercent: priceInfo.change24hPercent,
      fiatValueUsd,
    };
  });
}
