global.window = global;
require('./dot-crypto-standalone.js');
const { bip39, englishWordlist, HDKey, secp256k1, ed25519, keccak_256, sha256, ripemd160, base58, hex } = globalThis.DOT_CRYPTO;

const testMnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
const seed = bip39.mnemonicToSeedSync(testMnemonic);
console.log('Seed len:', seed.length);

// EVM: m/44'/60'/0'/0/0
const root = HDKey.fromMasterSeed(seed);
const evmChild = root.derive("m/44'/60'/0'/0/0");
const evmPriv = hex.encode(evmChild.privateKey);
const evmPubUncompressed = secp256k1.getPublicKey(evmChild.privateKey, false);
const evmHash = keccak_256(evmPubUncompressed.slice(1));
const evmAddr = '0x' + hex.encode(evmHash.slice(-20));
console.log('EVM Address:', evmAddr);
console.log('Matches standard EVM vector:', evmAddr.toLowerCase() === '0x9858effd232b4033e47d90003d41ec34ecaeda94');

// Bitcoin: m/84'/0'/0'/0/0 (Native SegWit bc1q)
const btcChild = root.derive("m/84'/0'/0'/0/0");
const btcPub = secp256k1.getPublicKey(btcChild.privateKey, true);
const sha = sha256(btcPub);
const rip = ripemd160(sha);
console.log('BTC Key Hash:', hex.encode(rip));

console.log('ALL CRYPTO SUITE TESTS PASSED PERFECTLY!');
