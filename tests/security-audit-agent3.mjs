import assert from 'node:assert/strict';
import { decodeEvmTransaction, checkAddressPoisoning, checkGasSanity, decodeBtcTransaction, decodeSolanaTransaction } from '../src/lib/chains/decoder.ts';
import { validateSolanaAddress, deriveSolanaPrivateKey } from '../src/lib/chains/sol.ts';
import { validateBtcAddress } from '../src/lib/chains/btc.ts';
import { isChecksumAddress } from '../src/lib/chains/evm.ts';
import { base58 } from '@scure/base';
import { ed25519 } from '@noble/curves/ed25519.js';

console.log('--- STARTING AGENT 3 SECURITY VERIFICATION TESTS ---');

// 1. Crash on malformed calldata hex
let crashOccurred = false;
try {
  decodeEvmTransaction({
    to: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    data: '0xa9059cbb' + '000000000000000000000000zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz' + '0000000000000000000000000000000000000000000000000000000000000001',
  });
} catch (e) {
  crashOccurred = true;
  console.log('✓ Verified Bug 1: Decoder crashes with uncaught error on malformed hex in calldata:', e.name);
}
assert.ok(crashOccurred, 'Expected uncaught crash on malformed hex');

// 2. Spending cap bypass on ERC-20 transfers
const erc20CapTest = decodeEvmTransaction({
  to: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  data: '0xa9059cbb' + '000000000000000000000000d8dA6BF26964aF9D7eEd9e03E53415D37aA96045' + '000000000000000000000000000000000000000000000000000000e8d4a51000',
  value: 0n,
}, {
  spendingCapWei: 1000000000000000000n, // 1 ETH limit
  tokenSymbol: 'USDC',
  tokenDecimals: 6,
});
console.log('✓ Verified Bug 2: ERC-20 token transfer bypassed spending cap:', {
  withinCap: erc20CapTest.spendingCapCheck.withinCap,
  transferredAmountWei: erc20CapTest.spendingCapCheck.transferredAmountWei.toString(),
});
assert.equal(erc20CapTest.spendingCapCheck.transferredAmountWei, 0n);

// 3. Exceeded spending cap does NOT block transaction
const nativeCapTest = decodeEvmTransaction({
  to: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
  value: 10000000000000000000n,
}, {
  spendingCapWei: 1000000000000000000n,
});
console.log('✓ Verified Bug 3: Native transfer exceeding spending cap is NOT blocked:', {
  withinCap: nativeCapTest.spendingCapCheck.withinCap,
  allowed: nativeCapTest.allowed,
});
assert.equal(nativeCapTest.allowed, true);

// 4. Burn address transfer does NOT block transaction
const burnTest = decodeEvmTransaction({
  to: '0x0000000000000000000000000000000000000000',
  value: 1000000000000000000n,
});
console.log('✓ Verified Bug 4: Burn address transfer is NOT blocked:', {
  status: burnTest.addressPoisoningCheck.status,
  allowed: burnTest.allowed,
});
assert.equal(burnTest.allowed, true);

// 5. Unlimited token approval is NOT blocked
const approveTest = decodeEvmTransaction({
  to: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  data: '0x095ea7b3' + '000000000000000000000000d8dA6BF26964aF9D7eEd9e03E53415D37aA96045' + 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
});
console.log('✓ Verified Bug 5: Unlimited token approval is NOT blocked:', {
  isUnlimitedApproval: approveTest.isUnlimitedApproval,
  allowed: approveTest.allowed,
});
assert.equal(approveTest.allowed, true);

// 6. Address poisoning false positive on Bitcoin Bech32 addresses
const poisonBtc = checkAddressPoisoning(
  'bc1q99999999999999999999999999999999v8f3t4',
  ['bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4']
);
console.log('✓ Verified Bug 6: Address poisoning false positive on BTC Bech32:', poisonBtc.status);
assert.equal(poisonBtc.status, 'POTENTIAL_POISONING_ATTACK');

// 7. Bitcoin and Solana decoders allow completely invalid recipient addresses
const btcInvalid = decodeBtcTransaction({ recipient: 'not_a_bitcoin_address', satoshis: 1000n });
const solInvalid = decodeSolanaTransaction({ recipient: 'not_a_solana_address', lamports: 1000n });
console.log('✓ Verified Bug 7: BTC & SOL decoders allow invalid addresses:', {
  btcAllowed: btcInvalid.allowed,
  solAllowed: solInvalid.allowed,
});
assert.equal(btcInvalid.allowed, true);
assert.equal(solInvalid.allowed, true);

// 8. Solana address validator accepts off-curve / invalid points
const invalidCurveBytes = new Uint8Array(32).fill(0xff);
const invalidSolAddress = base58.encode(invalidCurveBytes);
const solValidResult = validateSolanaAddress(invalidSolAddress);
let noblePointValid = true;
try {
  ed25519.Point.fromBytes(invalidCurveBytes);
} catch {
  noblePointValid = false;
}
console.log('✓ Verified Bug 8: Solana address validator accepted off-curve point:', {
  solValidResult,
  noblePointValid,
});
assert.equal(solValidResult, true);
assert.equal(noblePointValid, false);

// 9. SLIP-0010 ignores unhardened derivation markers and accepts negative indices
const seed = Buffer.from('000102030405060708090a0b0c0d0e0f', 'hex');
let unhardenedDerived = false;
try {
  deriveSolanaPrivateKey(seed, 'm/44/501/0/0');
  unhardenedDerived = true;
} catch {}
console.log('✓ Verified Bug 9: SLIP-0010 derived unhardened path without error:', unhardenedDerived);
assert.equal(unhardenedDerived, true);

console.log('--- ALL 9 AGENT 3 VERIFICATION TESTS COMPLETED AND CONFIRMED ---');
