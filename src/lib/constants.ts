import { ChainConfig, DeprecatedChainId, SplTokenConfig, SupportedChainId } from '@/types/wallet';

export const SUPPORTED_CHAINS: Record<SupportedChainId, ChainConfig> = {
  solana: {
    id: 'solana',
    name: 'Solana',
    symbol: 'SOL',
    badge: 'SVM',
    derivationPath: "m/44'/501'/0'/0'",
    defaultRpc: 'https://api.mainnet-beta.solana.com',
    color: '#14F195',
    curve: 'ed25519',
  },
};

/**
 * Deprecated non-Solana chains for graceful migration / backward compatibility
 */
export const DEPRECATED_CHAINS: Record<DeprecatedChainId, Omit<ChainConfig, 'id'> & { id: string }> = {
  ethereum: {
    id: 'ethereum',
    name: 'Ethereum / EVM',
    symbol: 'ETH',
    badge: 'EVM',
    derivationPath: "m/44'/60'/0'/0/0",
    defaultRpc: 'https://eth.llamarpc.com',
    color: '#627EEA',
    curve: 'secp256k1',
  },
  bitcoin: {
    id: 'bitcoin',
    name: 'Bitcoin Native SegWit',
    symbol: 'BTC',
    badge: 'SegWit',
    derivationPath: "m/84'/0'/0'/0/0",
    defaultRpc: 'https://mempool.space/api',
    color: '#F7931A',
    curve: 'secp256k1',
  },
};

export const INITIAL_CHAINS: SupportedChainId[] = ['solana'];

/**
 * Official Solana Mainnet SPL Tokens
 */
export const KNOWN_SPL_TOKENS: SplTokenConfig[] = [
  {
    mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    coingeckoId: 'usd-coin',
    color: '#2775CA',
  },
  {
    mint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6,
    coingeckoId: 'tether',
    color: '#26A17B',
  },
  {
    mint: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
    symbol: 'JUP',
    name: 'Jupiter',
    decimals: 6,
    coingeckoId: 'jupiter-exchange-solana',
    color: '#00BEA0',
  },
  {
    mint: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
    symbol: 'RAY',
    name: 'Raydium',
    decimals: 6,
    coingeckoId: 'raydium',
    color: '#3A78FF',
  },
  {
    mint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
    symbol: 'BONK',
    name: 'Bonk',
    decimals: 5,
    coingeckoId: 'bonk',
    color: '#FFA500',
  },
  {
    mint: 'HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3',
    symbol: 'PYTH',
    name: 'Pyth Network',
    decimals: 6,
    coingeckoId: 'pyth-network',
    color: '#E6DAFE',
  },
];

export const KNOWN_SPL_TOKENS_BY_MINT: Record<string, SplTokenConfig> = Object.fromEntries(
  KNOWN_SPL_TOKENS.map((token) => [token.mint, token])
);

export const STORAGE_KEYS = {
  VAULT_INITIALIZED: 'dot_vault_initialized',
  VAULT_METADATA: 'dot_vault_metadata',
  VAULT_ENVELOPE: 'dot1_envelope_blob',
  TRANSACTION_HISTORY: 'dot_tx_history',
  SELECTED_CHAINS: 'dot_selected_chains',
  ACTIVE_NETWORK: 'dot_active_network',
  PUBLIC_ADDRESSES: 'dot_public_addresses',
  PASSKEY_CREDENTIAL_ID: 'dot_passkey_credential_id',
  PRF_VAULT_ENVELOPE: 'dot_prf_vault_envelope',
};

export const SAMPLE_INITIAL_BALANCES: Record<SupportedChainId, {
  balance: string;
  tokenPriceUsd: number;
  fiatValueUsd: number;
  change24hPercent: number;
}> = {
  solana: {
    balance: '0.0000',
    tokenPriceUsd: 154.20,
    fiatValueUsd: 0.00,
    change24hPercent: 0.0,
  },
};
