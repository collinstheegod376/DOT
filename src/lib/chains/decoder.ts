import { getAddress, isAddress, formatEther, type Address } from 'viem';

/**
 * Offline Semantic Transaction Decoder
 *
 * Requirements:
 * 1. MUST decode transaction intent into clear, human-readable English BEFORE signing.
 * 2. Detect native transfer vs ERC-20 transfer vs ERC-20 approve (Flag unlimited token approvals with high severity warning!).
 * 3. Address poisoning check: compares recipient address with known contacts or flagged patterns
 *    (warns if first/last 4 match a scam pattern or unconfirmed address).
 * 4. Spending caps & gas limit sanity checks.
 * 5. Rejects blind signing attempts by default with explanatory reason.
 * 6. Strict DOT non-negotiable: EIP-55 casing on every EVM address.
 */

export type RiskSeverity = 'SAFE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type TransactionActionType =
  | 'native_transfer'
  | 'erc20_transfer'
  | 'erc20_approve'
  | 'erc20_increase_allowance'
  | 'erc20_decrease_allowance'
  | 'erc721_transfer'
  | 'erc721_set_approval_for_all'
  | 'contract_call'
  | 'blind_signing';

export interface AddressPoisoningReport {
  safe: boolean;
  status: 'VERIFIED_CONTACT' | 'UNCONFIRMED' | 'POTENTIAL_POISONING_ATTACK' | 'BURN_ADDRESS' | 'INVALID';
  matchedKnownAddress?: string;
  warning?: string;
  matchingPrefix?: string;
  matchingSuffix?: string;
}

export interface GasSanityReport {
  safe: boolean;
  estimatedMaxFeeWei?: bigint;
  estimatedMaxFeeFormatted?: string;
  warnings: string[];
}

export interface SpendingCapReport {
  withinCap: boolean;
  spendingCapWei?: bigint;
  spendingCapFormatted?: string;
  transferredAmountWei: bigint;
  transferredAmountFormatted: string;
  warning?: string;
}

export interface DecodedTransaction {
  chain: 'evm' | 'bitcoin' | 'solana';
  actionType: TransactionActionType;
  intent: string; // Clear human-readable English description of intent
  englishSummary: string; // Detailed breakdown of what will happen
  recipient?: string; // Strictly EIP-55 for EVM
  contractAddress?: string; // Strictly EIP-55 for EVM
  spender?: string; // Strictly EIP-55 for EVM (for approvals)
  amount?: string;
  amountRaw?: string;
  tokenSymbol?: string;
  isUnlimitedApproval: boolean;
  isBlindSigning: boolean;
  severity: RiskSeverity;
  allowed: boolean; // False if rejected by default (e.g. blind signing or critical risk)
  rejectionReason?: string;
  warnings: string[];
  addressPoisoningCheck: AddressPoisoningReport;
  gasSanityCheck: GasSanityReport;
  spendingCapCheck: SpendingCapReport;
  details: Record<string, unknown>;
}

export interface DecoderOptions {
  knownContacts?: string[]; // Array of known/saved user addresses
  spendingCapWei?: bigint; // Configurable spending limit in Wei / base units
  tokenDecimals?: number; // Decimals for token transfer (default 18)
  tokenSymbol?: string; // Token symbol (e.g. 'USDC', 'DAI')
  nativeSymbol?: string; // Native symbol (e.g. 'ETH', 'MATIC', 'BTC', 'SOL')
  allowBlindSigning?: boolean; // Default false (DOT rejects blind signing by default)
}

// Common ERC-20 / ERC-721 method signatures
const SELECTORS = {
  ERC20_TRANSFER: '0xa9059cbb', // transfer(address,uint256)
  ERC20_APPROVE: '0x095ea7b3', // approve(address,uint256)
  ERC20_TRANSFER_FROM: '0x23b872dd', // transferFrom(address,address,uint256)
  ERC20_INCREASE_ALLOWANCE: '0x39509351', // increaseAllowance(address,uint256)
  ERC20_DECREASE_ALLOWANCE: '0xa457c2d7', // decreaseAllowance(address,uint256)
  ERC721_SET_APPROVAL_FOR_ALL: '0xa22cb465', // setApprovalForAll(address,bool)
  ERC721_SAFE_TRANSFER_FROM: '0x42842e0e', // safeTransferFrom(address,address,uint256)
  ERC721_SAFE_TRANSFER_FROM_DATA: '0xb88d4fde', // safeTransferFrom(address,address,uint256,bytes)
} as const;

// 2^128 (0x100000000000000000000000000000000) represents unlimited approvals in DeFi
const UNLIMITED_APPROVAL_THRESHOLD = BigInt('0x100000000000000000000000000000000');
const MAX_UINT256 = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');

const BURN_ADDRESSES = new Set([
  '0x0000000000000000000000000000000000000000',
  '0x000000000000000000000000000000000000dead',
  '0x0000000000000000000000000000000000000001',
]);

function getPowerOfTen(decimals: number): bigint {
  return BigInt('1' + '0'.repeat(Math.max(0, decimals)));
}

/**
 * Validates and compares target address against known contacts to detect Address Poisoning.
 * Address poisoning creates vanity addresses sharing the first 4-6 and last 4 characters of a known contact.
 */
export function checkAddressPoisoning(
  targetAddress: string,
  knownContacts: string[] = []
): AddressPoisoningReport {
  if (!targetAddress || typeof targetAddress !== 'string') {
    return {
      safe: false,
      status: 'INVALID',
      warning: 'Target address is empty or not a string',
    };
  }

  const cleanTarget = targetAddress.trim().toLowerCase();

  // Check for burn/null address
  if (BURN_ADDRESSES.has(cleanTarget)) {
    return {
      safe: false,
      status: 'BURN_ADDRESS',
      warning: '⚠️ RECIPIENT IS A BURN / ZERO ADDRESS. Any funds sent here will be permanently destroyed and irretrievable.',
    };
  }

  // Exact match against known contact list
  const normalizedKnown = knownContacts.map((a) => a.trim().toLowerCase());
  const exactMatchIndex = normalizedKnown.indexOf(cleanTarget);
  if (exactMatchIndex !== -1) {
    const originalKnown = knownContacts[exactMatchIndex];
    return {
      safe: true,
      status: 'VERIFIED_CONTACT',
      matchedKnownAddress: isAddress(originalKnown) ? getAddress(originalKnown) : originalKnown,
    };
  }

  // Poisoning detection: compare prefix and suffix with known contacts
  // Target format: 0x [prefix: 4 chars] ... [suffix: 4 chars]
  const prefixLength = 4;
  const suffixLength = 4;

  const targetBody = cleanTarget.startsWith('0x') ? cleanTarget.slice(2) : cleanTarget;
  if (targetBody.length >= prefixLength + suffixLength) {
    const targetPrefix = targetBody.slice(0, prefixLength);
    const targetSuffix = targetBody.slice(-suffixLength);

    for (const known of normalizedKnown) {
      if (known === cleanTarget) continue;
      const knownBody = known.startsWith('0x') ? known.slice(2) : known;
      if (knownBody.length < prefixLength + suffixLength) continue;

      const knownPrefix = knownBody.slice(0, prefixLength);
      const knownSuffix = knownBody.slice(-suffixLength);

      if (targetPrefix === knownPrefix && targetSuffix === knownSuffix) {
        // Potential poisoning match found!
        const matchingPrefixStr = cleanTarget.startsWith('0x') ? `0x${targetPrefix}` : targetPrefix;
        return {
          safe: false,
          status: 'POTENTIAL_POISONING_ATTACK',
          matchedKnownAddress: known,
          matchingPrefix: matchingPrefixStr,
          matchingSuffix: targetSuffix,
          warning:
            `⚠️ CRITICAL ALERT: POTENTIAL ADDRESS POISONING DETECTED! ` +
            `The recipient address matches the first 4 characters ('${matchingPrefixStr}...') and last 4 characters ('...${targetSuffix}') ` +
            `of known contact '${known}', but the middle characters are DIFFERENT. ` +
            `Attackers generate lookalike addresses to trick you into copying from transaction history. ` +
            `Do NOT sign unless you have manually confirmed every single character!`,
        };
      }
    }
  }

  // Not in known contacts
  return {
    safe: true,
    status: 'UNCONFIRMED',
    warning: 'Unconfirmed counterparty: Recipient is not in your address book or saved contacts.',
  };
}

/**
 * Checks gas limits and gas price for sanity
 */
export function checkGasSanity(params: {
  gas?: bigint;
  gasPrice?: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
}): GasSanityReport {
  const warnings: string[] = [];
  let safe = true;

  const gas = params.gas;
  const effectiveGasPrice = params.maxFeePerGas ?? params.gasPrice;

  if (gas !== undefined) {
    if (gas < BigInt(21000)) {
      safe = false;
      warnings.push(`Gas limit (${gas}) is lower than the EVM base requirement of 21,000 gas. Transaction will fail.`);
    } else if (gas > BigInt(15000000)) {
      warnings.push(`Abnormally high gas limit (${gas.toString()}). Contract execution could consume excessive network fees.`);
    }
  }

  let estimatedMaxFeeWei: bigint | undefined;
  if (gas !== undefined && effectiveGasPrice !== undefined) {
    estimatedMaxFeeWei = gas * effectiveGasPrice;
    // Over 0.05 ETH in gas fee is abnormally high
    if (estimatedMaxFeeWei > BigInt('50000000000000000')) {
      warnings.push(`Estimated maximum network fee is unusually high: ${formatEther(estimatedMaxFeeWei)} ETH.`);
    }

    // 500 Gwei gas price check
    if (effectiveGasPrice > BigInt('500000000000')) {
      warnings.push(`Extreme gas price detected (${Number(effectiveGasPrice / BigInt(1000000000))} Gwei). Network congestion or fee overpayment risk.`);
    }
  }

  return {
    safe,
    estimatedMaxFeeWei,
    estimatedMaxFeeFormatted: estimatedMaxFeeWei ? `${formatEther(estimatedMaxFeeWei)} ETH` : undefined,
    warnings,
  };
}

/**
 * Decodes ABI parameters for 32-byte chunks
 */
function sliceCalldataWord(calldata: string, wordIndex: number): string {
  // calldata starts with 0x and 8 hex selector characters
  const start = 2 + 8 + wordIndex * 64;
  return calldata.slice(start, start + 64);
}

function wordToAddress(word: string): Address {
  const hex = word.slice(24); // Last 20 bytes (40 hex chars)
  return getAddress(`0x${hex}`);
}

function wordToBigInt(word: string): bigint {
  if (!word || word.length === 0) return BigInt(0);
  return BigInt(`0x${word}`);
}

export interface EvmTxInput {
  to?: string;
  from?: string;
  value?: bigint | string | number;
  data?: string;
  gas?: bigint | string | number;
  gasPrice?: bigint | string | number;
  maxFeePerGas?: bigint | string | number;
  maxPriorityFeePerGas?: bigint | string | number;
  chainId?: number;
}

/**
 * Decodes an EVM transaction offline into semantic human-readable English intent.
 * Evaluates spending caps, address poisoning, unlimited approvals, and gas limits.
 */
export function decodeEvmTransaction(
  tx: EvmTxInput,
  options: DecoderOptions = {}
): DecodedTransaction {
  const warnings: string[] = [];
  let severity: RiskSeverity = 'SAFE';
  let isUnlimitedApproval = false;
  let isBlindSigning = false;
  let allowed = true;
  let rejectionReason: string | undefined;

  const nativeSymbol = options.nativeSymbol || 'ETH';
  const tokenSymbol = options.tokenSymbol || 'TOKEN';
  const tokenDecimals = options.tokenDecimals ?? 18;
  const knownContacts = options.knownContacts || [];

  const rawValue = tx.value !== undefined ? BigInt(tx.value) : BigInt(0);
  const data = (tx.data || '0x').toLowerCase();
  const rawTo = tx.to?.trim();

  // Strict EIP-55 casing on destination address
  let targetAddress: Address | undefined;
  if (rawTo && isAddress(rawTo, { strict: false })) {
    targetAddress = getAddress(rawTo);
  }

  // 1. Gas sanity check
  const gasSanity = checkGasSanity({
    gas: tx.gas !== undefined ? BigInt(tx.gas) : undefined,
    gasPrice: tx.gasPrice !== undefined ? BigInt(tx.gasPrice) : undefined,
    maxFeePerGas: tx.maxFeePerGas !== undefined ? BigInt(tx.maxFeePerGas) : undefined,
    maxPriorityFeePerGas: tx.maxPriorityFeePerGas !== undefined ? BigInt(tx.maxPriorityFeePerGas) : undefined,
  });
  if (gasSanity.warnings.length > 0) {
    warnings.push(...gasSanity.warnings);
    if (!gasSanity.safe) {
      severity = 'HIGH';
    }
  }

  // 2. Spending cap check
  const spendingCap = options.spendingCapWei;
  const spendingCapCheck: SpendingCapReport = {
    withinCap: true,
    spendingCapWei: spendingCap,
    spendingCapFormatted: spendingCap ? `${formatEther(spendingCap)} ${nativeSymbol}` : undefined,
    transferredAmountWei: rawValue,
    transferredAmountFormatted: `${formatEther(rawValue)} ${nativeSymbol}`,
  };

  if (spendingCap && rawValue > spendingCap) {
    spendingCapCheck.withinCap = false;
    const warn = `Spending cap exceeded: Transfer amount (${formatEther(rawValue)} ${nativeSymbol}) exceeds your configured limit of ${formatEther(spendingCap)} ${nativeSymbol}.`;
    spendingCapCheck.warning = warn;
    warnings.push(warn);
    severity = 'HIGH';
  }

  // 3. Calldata parsing & Intent resolution
  let actionType: TransactionActionType = 'native_transfer';
  let intent = '';
  let englishSummary = '';
  let recipient: string | undefined;
  let spender: string | undefined;
  let contractAddress: string | undefined;
  let amountStr: string | undefined;
  let amountRawStr: string | undefined;

  const hasData = data !== '0x' && data.length > 2;

  if (!hasData) {
    // Pure Native Transfer (ETH / MATIC / etc.)
    actionType = 'native_transfer';
    recipient = targetAddress;
    amountRawStr = rawValue.toString();
    amountStr = `${formatEther(rawValue)} ${nativeSymbol}`;

    intent = `Send ${amountStr} to ${recipient || 'unknown'}`;
    englishSummary = `You are sending ${amountStr} directly to account ${recipient}.`;

    if (!targetAddress) {
      warnings.push('Destination address is missing or invalid.');
      severity = 'CRITICAL';
      allowed = false;
      rejectionReason = 'Cannot execute transaction: Invalid destination address.';
    }
  } else {
    // Contract Interaction
    contractAddress = targetAddress;
    const selector = data.slice(0, 10);

    if (selector === SELECTORS.ERC20_TRANSFER && data.length >= 138) {
      // transfer(address to, uint256 amount)
      actionType = 'erc20_transfer';
      const toWord = sliceCalldataWord(data, 0);
      const amountWord = sliceCalldataWord(data, 1);

      recipient = wordToAddress(toWord);
      const tokenAmount = wordToBigInt(amountWord);
      amountRawStr = tokenAmount.toString();

      // Format token amount
      const divisor = getPowerOfTen(tokenDecimals);
      const integerPart = tokenAmount / divisor;
      const remainderPart = tokenAmount % divisor;
      const formattedAmount = remainderPart === BigInt(0)
        ? integerPart.toString()
        : `${integerPart}.${remainderPart.toString().padStart(tokenDecimals, '0').slice(0, 4)}`;

      amountStr = `${formattedAmount} ${tokenSymbol}`;
      intent = `Transfer ${amountStr} to ${recipient}`;
      englishSummary = `You are transferring ${amountStr} of token contract ${contractAddress} to ${recipient}.`;

      if (rawValue > BigInt(0)) {
        warnings.push(`Transaction includes both ERC-20 token transfer and ${formatEther(rawValue)} ${nativeSymbol} native value.`);
      }
    } else if (selector === SELECTORS.ERC20_APPROVE && data.length >= 138) {
      // approve(address spender, uint256 amount)
      actionType = 'erc20_approve';
      const spenderWord = sliceCalldataWord(data, 0);
      const amountWord = sliceCalldataWord(data, 1);

      spender = wordToAddress(spenderWord);
      const tokenAmount = wordToBigInt(amountWord);
      amountRawStr = tokenAmount.toString();

      if (tokenAmount >= UNLIMITED_APPROVAL_THRESHOLD || tokenAmount === MAX_UINT256) {
        isUnlimitedApproval = true;
        severity = 'CRITICAL';
        amountStr = `UNLIMITED ${tokenSymbol}`;
        intent = `Approve UNLIMITED ${tokenSymbol} to ${spender}`;
        englishSummary = `You are granting contract ${spender} UNLIMITED access to transfer all ${tokenSymbol} tokens from your account.`;

        warnings.push(
          `⚠️ CRITICAL WARNING: Unlimited token approval detected! ` +
          `Spender contract ${spender} is granted permission to withdraw and spend UNLIMITED ${tokenSymbol} at any time. ` +
          `If this contract is malicious or ever exploited, all your ${tokenSymbol} can be drained instantly without further notice.`
        );
      } else if (tokenAmount === BigInt(0)) {
        amountStr = `0 ${tokenSymbol}`;
        intent = `Revoke ${tokenSymbol} approval for ${spender}`;
        englishSummary = `You are revoking allowance, setting permissions for ${spender} to 0 ${tokenSymbol}.`;
      } else {
        const divisor = getPowerOfTen(tokenDecimals);
        const integerPart = tokenAmount / divisor;
        amountStr = `${integerPart.toString()} ${tokenSymbol}`;
        intent = `Approve ${amountStr} to ${spender}`;
        englishSummary = `You are allowing ${spender} to spend up to ${amountStr} from your account.`;
      }
    } else if (selector === SELECTORS.ERC721_SET_APPROVAL_FOR_ALL && data.length >= 138) {
      // setApprovalForAll(address operator, bool approved)
      actionType = 'erc721_set_approval_for_all';
      const operatorWord = sliceCalldataWord(data, 0);
      const approvedWord = sliceCalldataWord(data, 1);

      spender = wordToAddress(operatorWord);
      const approved = wordToBigInt(approvedWord) !== BigInt(0);

      if (approved) {
        severity = 'CRITICAL';
        intent = `Grant full NFT operator access to ${spender}`;
        englishSummary = `You are authorizing ${spender} to manage and transfer ALL NFTs in contract ${contractAddress} on your behalf.`;
        warnings.push(`⚠️ CRITICAL WARNING: Operator approval requested. Spender will have full access to transfer ANY and ALL NFTs in this contract.`);
      } else {
        intent = `Revoke NFT operator access from ${spender}`;
        englishSummary = `You are revoking full operator permissions from ${spender} for contract ${contractAddress}.`;
      }
    } else {
      // Unrecognized calldata -> Blind Signing Attempt!
      actionType = 'blind_signing';
      isBlindSigning = true;
      severity = 'CRITICAL';
      intent = `Execute unrecognized contract call on ${contractAddress || 'unknown contract'}`;
      englishSummary = `Unknown method selector '${selector}' on contract ${contractAddress}. Data cannot be safely verified offline.`;

      const reason =
        `Blind signing rejected: Unknown contract calldata (method selector: ${selector}). ` +
        `DOT security policy strictly rejects unverified offline contract execution to prevent wallet draining.`;

      rejectionReason = reason;
      warnings.push(`⚠️ CRITICAL SECURITY WARNING: ${reason}`);

      // DOT policy: Reject blind signing attempts by default unless explicitly allowed
      if (!options.allowBlindSigning) {
        allowed = false;
      }
    }
  }

  // 4. Address Poisoning Check on counterparty (recipient or spender)
  const counterparty = recipient || spender || targetAddress || '';
  const poisoningCheck = checkAddressPoisoning(counterparty, knownContacts);

  if (poisoningCheck.status === 'POTENTIAL_POISONING_ATTACK') {
    severity = 'CRITICAL';
    allowed = false;
    rejectionReason = poisoningCheck.warning;
    if (poisoningCheck.warning) {
      warnings.unshift(poisoningCheck.warning);
    }
  } else if (poisoningCheck.status === 'BURN_ADDRESS') {
    severity = 'CRITICAL';
    if (poisoningCheck.warning) {
      warnings.unshift(poisoningCheck.warning);
    }
  } else if (poisoningCheck.warning && poisoningCheck.status === 'UNCONFIRMED') {
    warnings.push(poisoningCheck.warning);
    if (severity === 'SAFE') {
      severity = 'LOW';
    }
  }

  return {
    chain: 'evm',
    actionType,
    intent,
    englishSummary,
    recipient,
    contractAddress,
    spender,
    amount: amountStr,
    amountRaw: amountRawStr,
    tokenSymbol: isUnlimitedApproval ? 'UNLIMITED' : tokenSymbol,
    isUnlimitedApproval,
    isBlindSigning,
    severity,
    allowed,
    rejectionReason,
    warnings,
    addressPoisoningCheck: poisoningCheck,
    gasSanityCheck: gasSanity,
    spendingCapCheck,
    details: {
      chainId: tx.chainId,
      calldata: data,
      valueWei: rawValue.toString(),
    },
  };
}

export interface BtcTxInput {
  recipient: string;
  satoshis: bigint | number | string;
  feeSatoshis?: bigint | number | string;
}

/**
 * Decodes a Bitcoin Native SegWit transaction offline
 */
export function decodeBtcTransaction(
  tx: BtcTxInput,
  options: DecoderOptions = {}
): DecodedTransaction {
  const warnings: string[] = [];
  let severity: RiskSeverity = 'SAFE';

  const sats = BigInt(tx.satoshis);
  const btcAmount = (Number(sats) / 100000000).toFixed(8);
  const recipient = tx.recipient.trim();
  const knownContacts = options.knownContacts || [];

  const poisoningCheck = checkAddressPoisoning(recipient, knownContacts);
  if (poisoningCheck.status === 'POTENTIAL_POISONING_ATTACK') {
    severity = 'CRITICAL';
    if (poisoningCheck.warning) warnings.unshift(poisoningCheck.warning);
  } else if (poisoningCheck.warning) {
    warnings.push(poisoningCheck.warning);
  }

  const feeSats = tx.feeSatoshis !== undefined ? BigInt(tx.feeSatoshis) : BigInt(1000);
  const feeBtc = (Number(feeSats) / 100000000).toFixed(8);

  const intent = `Send ${btcAmount} BTC (${sats.toString()} sats) to ${recipient}`;
  const englishSummary = `You are sending ${btcAmount} BTC directly to Bitcoin address ${recipient} with an estimated fee of ${feeBtc} BTC.`;

  return {
    chain: 'bitcoin',
    actionType: 'native_transfer',
    intent,
    englishSummary,
    recipient,
    amount: `${btcAmount} BTC`,
    amountRaw: sats.toString(),
    tokenSymbol: 'BTC',
    isUnlimitedApproval: false,
    isBlindSigning: false,
    severity,
    allowed: poisoningCheck.status !== 'POTENTIAL_POISONING_ATTACK',
    rejectionReason: poisoningCheck.status === 'POTENTIAL_POISONING_ATTACK' ? poisoningCheck.warning : undefined,
    warnings,
    addressPoisoningCheck: poisoningCheck,
    gasSanityCheck: { safe: true, warnings: [] },
    spendingCapCheck: {
      withinCap: true,
      transferredAmountWei: sats,
      transferredAmountFormatted: `${btcAmount} BTC`,
    },
    details: {
      satoshis: sats.toString(),
      feeSatoshis: feeSats.toString(),
    },
  };
}

export interface SolTxInput {
  recipient: string;
  lamports: bigint | number | string;
  isTokenTransfer?: boolean;
  tokenMint?: string;
}

/**
 * Decodes a Solana transaction offline
 */
export function decodeSolanaTransaction(
  tx: SolTxInput,
  options: DecoderOptions = {}
): DecodedTransaction {
  const warnings: string[] = [];
  let severity: RiskSeverity = 'SAFE';

  const lamports = BigInt(tx.lamports);
  const solAmount = (Number(lamports) / 1000000000).toFixed(6);
  const recipient = tx.recipient.trim();
  const knownContacts = options.knownContacts || [];

  const poisoningCheck = checkAddressPoisoning(recipient, knownContacts);
  if (poisoningCheck.status === 'POTENTIAL_POISONING_ATTACK') {
    severity = 'CRITICAL';
    if (poisoningCheck.warning) warnings.unshift(poisoningCheck.warning);
  } else if (poisoningCheck.warning) {
    warnings.push(poisoningCheck.warning);
  }

  const intent = `Send ${solAmount} SOL to ${recipient}`;
  const englishSummary = `You are sending ${solAmount} SOL directly to Solana account ${recipient}.`;

  return {
    chain: 'solana',
    actionType: 'native_transfer',
    intent,
    englishSummary,
    recipient,
    amount: `${solAmount} SOL`,
    amountRaw: lamports.toString(),
    tokenSymbol: 'SOL',
    isUnlimitedApproval: false,
    isBlindSigning: false,
    severity,
    allowed: poisoningCheck.status !== 'POTENTIAL_POISONING_ATTACK',
    rejectionReason: poisoningCheck.status === 'POTENTIAL_POISONING_ATTACK' ? poisoningCheck.warning : undefined,
    warnings,
    addressPoisoningCheck: poisoningCheck,
    gasSanityCheck: { safe: true, warnings: [] },
    spendingCapCheck: {
      withinCap: true,
      transferredAmountWei: lamports,
      transferredAmountFormatted: `${solAmount} SOL`,
    },
    details: {
      lamports: lamports.toString(),
    },
  };
}
