export type SupportedChainId = 'solana';
export type DeprecatedChainId = 'ethereum' | 'bitcoin';
export type AnyChainId = SupportedChainId | DeprecatedChainId;

export interface SplTokenConfig {
  mint: string;
  symbol: string;
  name: string;
  decimals: number;
  icon?: string;
  coingeckoId?: string;
  color?: string;
}

export interface SplTokenBalance {
  mint: string;
  symbol: string;
  name: string;
  decimals: number;
  balance: string;
  rawAmount: string;
  tokenAccountAddress?: string;
  tokenPriceUsd: number;
  fiatValueUsd: number;
  change24hPercent?: number;
  icon?: string;
}

export interface ChainConfig {
  id: SupportedChainId;
  name: string;
  symbol: string;
  badge: string;
  derivationPath: string;
  defaultRpc: string;
  color: string;
  curve: 'secp256k1' | 'ed25519';
}

export interface AddressInfo {
  chainId: SupportedChainId;
  address: string;
  derivationPath: string;
  publicKeyHex?: string;
}

export interface ChainBalance {
  chainId: SupportedChainId;
  balance: string;
  fiatValueUsd: number;
  tokenPriceUsd: number;
  change24hPercent: number;
  splTokens?: SplTokenBalance[];
  totalPortfolioFiatUsd?: number;
}

export interface TokenAsset {
  symbol: string;
  name: string;
  mint: string;
  decimals: number;
  balance: string;
  tokenPriceUsd: number;
  fiatValueUsd: number;
  change24hPercent: number;
  icon?: string;
  color?: string;
  isNative?: boolean;
}

export type TransactionStatus = 'confirmed' | 'pending' | 'queued_offline';

export interface TransactionRecord {
  id: string;
  chainId: SupportedChainId;
  hash: string;
  type: 'send' | 'receive' | 'contract_call';
  amount: string;
  fiatValueUsd: number;
  from: string;
  to: string;
  timestamp: number;
  status: TransactionStatus;
  fee: string;
  note?: string;
  rawPayload?: string;
  priorityFeeTier?: 'normal' | 'turbo' | 'ultra';
}

export interface SecurityWarning {
  level: 'info' | 'warning' | 'danger';
  title: string;
  description: string;
}

export interface DecodedTransactionIntent {
  chainId: SupportedChainId;
  recipient: string;
  recipientLabel?: string;
  amount: string;
  symbol: string;
  networkFee: string;
  estimatedTotalDebit: string;
  estimatedRemainingBalance: string;
  warnings: SecurityWarning[];
  isEip55Valid: boolean;
  isAirGapReady: boolean;
  rawHexPayload?: string;
}

export interface Dot1BackupEnvelope {
  format: 'dot1';
  version: 1;
  kdf: {
    algorithm: 'argon2id';
    memory: number; // in KB, e.g. 65536
    iterations: number; // e.g. 3
    parallelism: number; // e.g. 1
    saltHex: string;
  };
  cipher: {
    algorithm: 'aes-256-gcm';
    ivHex: string;
    authTagHex: string;
  };
  ciphertextHex: string;
  createdAt: string;
  chains: SupportedChainId[];
  checksum: string;
}

export interface WalletVaultState {
  isInitialized: boolean;
  isLocked: boolean;
  hasPasskey: boolean;
  hasPasswordFallback: boolean;
  selectedChains: SupportedChainId[];
  addresses: Record<SupportedChainId, AddressInfo>;
  mnemonicPhrase?: string; // Only populated in memory during active onboarding/reveal ceremony
  privateKeys?: Record<SupportedChainId, string>; // In-memory only
}
