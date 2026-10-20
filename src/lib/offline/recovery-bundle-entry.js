import * as bip39 from '@scure/bip39';
import { wordlist as englishWordlist } from '@scure/bip39/wordlists/english.js';
import { HDKey } from '@scure/bip32';
import { secp256k1 } from '@noble/curves/secp256k1.js';
import { ed25519 } from '@noble/curves/ed25519.js';
import { keccak_256 } from '@noble/hashes/sha3.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { ripemd160 } from '@noble/hashes/legacy.js';
import { pbkdf2 } from '@noble/hashes/pbkdf2.js';
import { base58, base58check, hex, base64, bech32, bech32m, utf8 } from '@scure/base';

const globalTarget = typeof window !== 'undefined' ? window : globalThis;

globalTarget.DOT_CRYPTO = {
  bip39,
  englishWordlist,
  HDKey,
  secp256k1,
  ed25519,
  keccak_256,
  sha256,
  ripemd160,
  pbkdf2,
  base58,
  base58check,
  hex,
  base64,
  bech32,
  bech32m,
  utf8,
};

export default globalTarget.DOT_CRYPTO;
