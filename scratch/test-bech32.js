global.window = global;
require('./dot-crypto-standalone.js');
const { HDKey, secp256k1, sha256, ripemd160, base58check, hex, bech32 } = globalThis.DOT_CRYPTO;

const seed = globalThis.DOT_CRYPTO.bip39.mnemonicToSeedSync('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about');
const root = HDKey.fromMasterSeed(seed);

// 1. EVM: m/44'/60'/0'/0/0
const evmChild = root.derive("m/44'/60'/0'/0/0");
const evmPub = secp256k1.getPublicKey(evmChild.privateKey, false);
const evmHash = globalThis.DOT_CRYPTO.keccak_256(evmPub.slice(1));
const evmAddr = '0x' + hex.encode(evmHash.slice(-20));
console.log('EVM Address:', evmAddr);

// 2. Bitcoin Native SegWit: m/84'/0'/0'/0/0
const btc84Child = root.derive("m/84'/0'/0'/0/0");
const btcPub = secp256k1.getPublicKey(btc84Child.privateKey, true);
const pkh = ripemd160(sha256(btcPub));
const words = bech32.toWords(pkh);
const wordsWithVersion = new Uint8Array([0, ...words]);
const bc1Addr = bech32.encode('bc', wordsWithVersion);
console.log('BTC Native SegWit (bc1q):', bc1Addr);
console.log('Matches test vector:', bc1Addr === 'bc1qcr8te4kr609gc2deflh53mm463nr8a6ytnvydw');

// 3. Bitcoin Legacy: m/44'/0'/0'/0/0
const btc44Child = root.derive("m/44'/0'/0'/0/0");
const btc44Pub = secp256k1.getPublicKey(btc44Child.privateKey, true);
const pkh44 = ripemd160(sha256(btc44Pub));
const btcLegacyAddr = base58check(sha256).encode(new Uint8Array([0x00, ...pkh44]));
console.log('BTC Legacy (1...):', btcLegacyAddr);

// 4. Solana: SLIP-0010 Ed25519 or Seed
// Path m/44'/501'/0'/0'
const solPub = globalThis.DOT_CRYPTO.ed25519.getPublicKey(sha256(seed).slice(0, 32));
console.log('Solana Pub Base58:', globalThis.DOT_CRYPTO.base58.encode(solPub));
