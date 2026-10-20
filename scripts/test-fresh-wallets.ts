import { generateMnemonic, mnemonicToSeedSync } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english.js';
import { deriveSolanaAccount } from '../src/lib/chains/sol.ts';
import { deriveBtcAccount } from '../src/lib/chains/btc.ts';
import { deriveEvmAccountFromSeed } from '../src/lib/chains/evm.ts';

async function testFreshWallets() {
  console.log('====================================================');
  console.log('   DOT Fresh Wallet Generation & RPC Audit          ');
  console.log('====================================================\n');

  for (let i = 1; i <= 3; i++) {
    const mnemonic = generateMnemonic(wordlist, 128);
    const seed = mnemonicToSeedSync(mnemonic);

    const evm = deriveEvmAccountFromSeed(seed, 0);
    const btc = deriveBtcAccount(seed, 0);
    const sol = deriveSolanaAccount(seed, 0);

    console.log(`[Wallet #${i}]`);
    console.log(`- Mnemonic: ${mnemonic}`);
    console.log(`- EVM Address: ${evm.address}`);
    console.log(`- BTC SegWit:  ${btc.address}`);
    console.log(`- SOL Base58:  ${sol.address}`);

    // Query live Solana balance
    try {
      const res = await fetch('https://api.mainnet-beta.solana.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getBalance',
          params: [sol.address],
        }),
      });
      const data = await res.json();
      const solBal = data.result ? data.result.value / 1e9 : 0;
      console.log(`  -> Solana On-Chain Balance: ${solBal} SOL ${solBal === 0 ? '✓ (Clean 0.00)' : '⚠️ HAS BALANCE'}`);
    } catch (e: any) {
      console.log(`  -> Solana RPC: offline/fallback (0 SOL)`);
    }

    // Query live Bitcoin balance
    try {
      const res = await fetch(`https://mempool.space/api/address/${btc.address}`);
      if (res.status === 404) {
        console.log(`  -> Bitcoin On-Chain Balance: 0 BTC ✓ (Unseen on-chain, Clean 0.00)`);
      } else {
        const data = await res.json();
        const btcBal = (data.chain_stats.funded_txo_sum - data.chain_stats.spent_txo_sum) / 1e8;
        console.log(`  -> Bitcoin On-Chain Balance: ${btcBal} BTC ${btcBal === 0 ? '✓ (Clean 0.00)' : '⚠️ HAS BALANCE'}`);
      }
    } catch (e: any) {
      console.log(`  -> Bitcoin RPC: offline/fallback (0 BTC)`);
    }

    console.log('');
  }
}

testFreshWallets();
