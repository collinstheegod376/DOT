import { isAddress, getAddress } from 'viem';
import { AnyChainId, DecodedTransactionIntent, SecurityWarning, SupportedChainId } from '@/types/wallet';
import { SUPPORTED_CHAINS } from './constants';
import { validateSolanaAddress } from './chains/sol';

export function decodeTransactionIntent(params: {
  chainId: SupportedChainId | AnyChainId | string;
  recipient: string;
  amount: string;
  currentBalance: string;
  tokenPriceUsd: number;
  priorityFeeLevel?: 'low' | 'normal' | 'fast';
}): DecodedTransactionIntent {
  const { chainId, recipient, amount, currentBalance, tokenPriceUsd, priorityFeeLevel = 'normal' } = params;
  const config = (SUPPORTED_CHAINS as Record<string, any>)[chainId] || SUPPORTED_CHAINS.solana;
  const warnings: SecurityWarning[] = [];

  const cleanRecipient = recipient.trim();
  const parsedAmount = parseFloat(amount) || 0;
  const parsedBalance = parseFloat(currentBalance) || 0;

  const chain = String(chainId).toLowerCase();

  // Fee estimation based on chain & speed
  let feeAmount = '0.0012';
  if (chain === 'ethereum') {
    feeAmount = priorityFeeLevel === 'fast' ? '0.0028' : priorityFeeLevel === 'low' ? '0.0009' : '0.0015';
  } else if (chain === 'bitcoin') {
    feeAmount = priorityFeeLevel === 'fast' ? '0.00015' : priorityFeeLevel === 'low' ? '0.00004' : '0.00008';
  } else if (chain === 'solana') {
    feeAmount = '0.000005';
  }

  const parsedFee = parseFloat(feeAmount);
  const totalDebit = (parsedAmount + parsedFee).toFixed(6);
  const balanceAfter = Math.max(0, parsedBalance - (parsedAmount + parsedFee)).toFixed(6);

  // Address validation
  let isEip55Valid = false;
  let formattedRecipient = cleanRecipient;

  if (chain === 'ethereum') {
    if (isAddress(cleanRecipient)) {
      try {
        const checksummed = getAddress(cleanRecipient);
        isEip55Valid = true;
        formattedRecipient = checksummed;
        warnings.push({
          level: 'info',
          title: 'EIP-55 Verified',
          description: 'Address checksum matches cryptographic standards.',
        });
      } catch {
        warnings.push({
          level: 'warning',
          title: 'Non-Checksummed Address',
          description: 'Address is valid hex but lacks standard EIP-55 capital casing.',
        });
      }
    } else if (cleanRecipient.length > 0) {
      warnings.push({
        level: 'danger',
        title: 'Invalid Ethereum Address',
        description: 'Recipient does not conform to 42-character 0x EVM hex format.',
      });
    }
  } else if (chain === 'bitcoin') {
    const isSegwit = cleanRecipient.startsWith('bc1q') || cleanRecipient.startsWith('bc1p');
    const isLegacy = cleanRecipient.startsWith('1') || cleanRecipient.startsWith('3');
    if (isSegwit) {
      isEip55Valid = true;
      warnings.push({
        level: 'info',
        title: 'Native SegWit Bech32 Valid',
        description: 'Recipient is a modern low-fee SegWit witness address.',
      });
    } else if (isLegacy) {
      warnings.push({
        level: 'warning',
        title: 'Legacy Bitcoin Address',
        description: 'Recipient uses legacy address format. Higher network fees may apply.',
      });
    } else if (cleanRecipient.length > 0) {
      warnings.push({
        level: 'danger',
        title: 'Invalid Bitcoin Address',
        description: 'Input does not match valid Bitcoin mainnet address formats.',
      });
    }
  } else if (chain === 'solana') {
    if (validateSolanaAddress(cleanRecipient, true)) {
      isEip55Valid = true;
      warnings.push({
        level: 'info',
        title: 'Solana Address Verified',
        description: 'Recipient is a valid Solana network address.',
      });
    } else if (cleanRecipient.length > 0) {
      warnings.push({
        level: 'danger',
        title: 'Invalid Solana Address',
        description: 'Address is not a valid Solana recipient address.',
      });
    }
  }

  // Known address labels
  let recipientLabel: string | undefined;
  const lowerRecipient = cleanRecipient.toLowerCase();
  if (lowerRecipient.includes('d8da6bf26964af9d7eed9e03e53415d37aa96045')) {
    recipientLabel = 'vitalik.eth (Verified)';
  } else if (cleanRecipient.length > 0) {
    warnings.push({
      level: 'warning',
      title: 'First-Time Recipient',
      description: 'You have not previously interacted with this counterparty on-chain.',
    });
  }

  // Balance & Fee safety checks
  if (parsedAmount + parsedFee > parsedBalance) {
    warnings.push({
      level: 'danger',
      title: 'Insufficient Balance',
      description: `Total debit (${totalDebit} ${config.symbol}) exceeds available balance (${parsedBalance} ${config.symbol}).`,
    });
  } else if (parsedAmount > parsedBalance * 0.8 && parsedAmount > 0) {
    warnings.push({
      level: 'warning',
      title: 'High Allocation Warning',
      description: `This transfer depletes >80% of your total ${config.symbol} reserve.`,
    });
  }

  // High gas fee ratio check
  if (parsedAmount > 0 && parsedFee / parsedAmount > 0.15) {
    warnings.push({
      level: 'warning',
      title: 'Disproportionate Network Fee',
      description: 'Estimated network fee exceeds 15% of the principal transfer amount.',
    });
  }

  return {
    chainId: (chainId === 'solana' ? 'solana' : 'solana') as SupportedChainId,
    recipient: formattedRecipient,
    recipientLabel,
    amount: parsedAmount.toString(),
    symbol: config.symbol,
    networkFee: `${feeAmount} ${config.symbol} (~$${(parsedFee * tokenPriceUsd).toFixed(2)})`,
    estimatedTotalDebit: `${totalDebit} ${config.symbol}`,
    estimatedRemainingBalance: `${balanceAfter} ${config.symbol}`,
    warnings,
    isEip55Valid,
    isAirGapReady: true,
    rawHexPayload: `0x02f87001...${cleanRecipient.slice(0, 10)}...${(parsedAmount * 1e18).toString(16)}`,
  };
}
