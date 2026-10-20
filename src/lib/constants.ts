import { ChainConfig, SupportedChainId } from '@/types/wallet';

export const SUPPORTED_CHAINS: Record<SupportedChainId, ChainConfig> = {
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

export const INITIAL_CHAINS: SupportedChainId[] = ['ethereum', 'bitcoin', 'solana'];

export const STORAGE_KEYS = {
  VAULT_INITIALIZED: 'dot_vault_initialized',
  VAULT_METADATA: 'dot_vault_metadata',
  VAULT_ENVELOPE: 'dot1_envelope_blob',
  TRANSACTION_HISTORY: 'dot_tx_history',
  SELECTED_CHAINS: 'dot_selected_chains',
  ACTIVE_NETWORK: 'dot_active_network',
};

export const SAMPLE_INITIAL_BALANCES = {
  ethereum: {
    balance: '2.458',
    tokenPriceUsd: 3120.40,
    fiatValueUsd: 7670.02,
    change24hPercent: 3.42,
  },
  bitcoin: {
    balance: '0.1420',
    tokenPriceUsd: 68450.00,
    fiatValueUsd: 9719.90,
    change24hPercent: 1.85,
  },
  solana: {
    balance: '18.75',
    tokenPriceUsd: 154.20,
    fiatValueUsd: 2891.25,
    change24hPercent: -0.65,
  },
};
