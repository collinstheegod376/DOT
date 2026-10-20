import assert from 'node:assert';
import { SUPPORTED_CHAINS, INITIAL_CHAINS, KNOWN_SPL_TOKENS, KNOWN_SPL_TOKENS_BY_MINT } from '../src/lib/constants';
import {
  deriveSolanaPrivateKey,
  deriveSolanaAccount,
  validateSolanaAddress,
  isSolanaAddressOnCurve,
} from '../src/lib/chains/sol';
import { formatSplAmount, TOKEN_PROGRAM_ID } from '../src/lib/chains/spl';
import { fetchSolanaAndSplPrices } from '../src/lib/rpc/balance';
import { base58 } from '@scure/base';
import { ed25519 } from '@noble/curves/ed25519.js';

console.log('================================================================');
console.log('  Agent 2 Solana Core & SPL Engine Verification Suite');
console.log('================================================================\n');

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void | Promise<void>) {
  return Promise.resolve()
    .then(fn)
    .then(() => {
      console.log(`  [PASS] ${name}`);
      passed++;
    })
    .catch((err) => {
      console.error(`  [FAIL] ${name}`);
      console.error(`         ${err.message}`);
      failed++;
    });
}

async function runTests() {
  // 1. Re-scope DOT to Solana-only & Known SPL Tokens
  await test('Supported chains restricted to Solana and initial chains has only Solana', () => {
    assert.deepStrictEqual(INITIAL_CHAINS, ['solana']);
    assert.strictEqual(SUPPORTED_CHAINS.solana.id, 'solana');
    assert.strictEqual(SUPPORTED_CHAINS.solana.curve, 'ed25519');
    assert.strictEqual(SUPPORTED_CHAINS.solana.derivationPath, "m/44'/501'/0'/0'");
  });

  await test('Known SPL tokens configured with exact mints and decimals', () => {
    const expected = [
      { symbol: 'USDC', mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', decimals: 6 },
      { symbol: 'USDT', mint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', decimals: 6 },
      { symbol: 'JUP', mint: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN', decimals: 6 },
      { symbol: 'RAY', mint: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R', decimals: 6 },
      { symbol: 'BONK', mint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', decimals: 5 },
      { symbol: 'PYTH', mint: 'HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3', decimals: 6 },
    ];

    for (const token of expected) {
      const found = KNOWN_SPL_TOKENS_BY_MINT[token.mint];
      assert(found, `Mint ${token.mint} not found in KNOWN_SPL_TOKENS_BY_MINT`);
      assert.strictEqual(found.symbol, token.symbol);
      assert.strictEqual(found.decimals, token.decimals);
    }
  });

  // 2. SLIP-0010 Hardened Derivation
  await test('SLIP-0010 derives valid 32-byte Ed25519 private key for hardened path', () => {
    const seed = new Uint8Array(64);
    seed.fill(42);
    const priv = deriveSolanaPrivateKey(seed, "m/44'/501'/0'/0'");
    assert.strictEqual(priv.length, 32);

    const account = deriveSolanaAccount(seed, 0);
    assert.strictEqual(account.privateKey.length, 32);
    assert.strictEqual(account.publicKeyBytes.length, 32);
    assert(account.address.length >= 32);
    assert(validateSolanaAddress(account.address), 'Derived address must be valid on-curve address');
  });

  await test('SLIP-0010 rejects non-hardened path segments', () => {
    const seed = new Uint8Array(64);
    seed.fill(42);
    assert.throws(
      () => deriveSolanaPrivateKey(seed, "m/44'/501'/0/0"),
      /strictly requires hardened path segments/
    );
  });

  await test('SLIP-0010 rejects out-of-bounds index (>= 0x80000000)', () => {
    const seed = new Uint8Array(64);
    seed.fill(42);
    assert.throws(
      () => deriveSolanaPrivateKey(seed, "m/44'/501'/2147483648'/0'"),
      /Derivation index out of bounds/
    );
  });

  // 3. Curve Point Validation
  await test('validateSolanaAddress verifies point lies on Ed25519 curve', () => {
    // Valid on-curve address
    const validOnCurve = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
    assert.strictEqual(validateSolanaAddress(validOnCurve), true);
    assert.strictEqual(isSolanaAddressOnCurve(validOnCurve), true);

    // Invalid length / garbage
    assert.strictEqual(validateSolanaAddress(''), false);
    assert.strictEqual(validateSolanaAddress('invalid'), false);
    assert.strictEqual(validateSolanaAddress('0x1234'), false);

    // 32-byte sequence that does NOT lie on the Ed25519 curve
    const invalidBytes = new Uint8Array(32);
    invalidBytes.fill(0xff);
    const invalidAddress = base58.encode(invalidBytes);
    assert.strictEqual(validateSolanaAddress(invalidAddress), false, 'Must reject off-curve 32-byte address');
    assert.strictEqual(validateSolanaAddress(invalidAddress, true), true, 'Must allow off-curve only when allowOffCurve=true');
  });

  // 4. SPL Token Utilities
  await test('formatSplAmount formats base integer amounts with correct decimals', () => {
    assert.strictEqual(formatSplAmount('1000000', 6), '1');
    assert.strictEqual(formatSplAmount('1500000', 6), '1.5');
    assert.strictEqual(formatSplAmount('123456', 6), '0.123456');
    assert.strictEqual(formatSplAmount('0', 6), '0.00');
    assert.strictEqual(formatSplAmount('2500000000', 5), '25000');
    assert.strictEqual(TOKEN_PROGRAM_ID, 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
  });

  // 5. Price Engine & Valuation
  await test('fetchSolanaAndSplPrices returns SOL and SPL token prices (stablecoins = $1.00)', async () => {
    const prices = await fetchSolanaAndSplPrices();
    assert(prices.solana.priceUsd > 0, 'Solana price should be > 0');
    assert.strictEqual(prices.USDC.priceUsd, 1.0, 'USDC price must be $1.00');
    assert.strictEqual(prices.USDT.priceUsd, 1.0, 'USDT price must be $1.00');
    assert(prices.JUP.priceUsd > 0, 'JUP price should be > 0');
    assert(prices.RAY.priceUsd > 0, 'RAY price should be > 0');
    assert(prices.BONK.priceUsd > 0, 'BONK price should be > 0');
    assert(prices.PYTH.priceUsd > 0, 'PYTH price should be > 0');
  });

  console.log('\n================================================================');
  console.log(`  Tests Completed: ${passed} Passed, ${failed} Failed`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
