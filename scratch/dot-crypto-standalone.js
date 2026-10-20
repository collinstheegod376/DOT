/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	// The require scope
/******/ 	var __webpack_require__ = {};
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  "default": () => (/* binding */ recovery_bundle_entry)
});

// NAMESPACE OBJECT: ./node_modules/@scure/bip39/index.js
var bip39_namespaceObject = {};
__webpack_require__.r(bip39_namespaceObject);
__webpack_require__.d(bip39_namespaceObject, {
  entropyToMnemonic: () => (entropyToMnemonic),
  generateMnemonic: () => (generateMnemonic),
  mnemonicToEntropy: () => (mnemonicToEntropy),
  mnemonicToSeed: () => (mnemonicToSeed),
  mnemonicToSeedSync: () => (mnemonicToSeedSync),
  mnemonicToSeedWebcrypto: () => (mnemonicToSeedWebcrypto),
  validateMnemonic: () => (validateMnemonic)
});

;// ./node_modules/@noble/hashes/utils.js
/**
 * Checks if something is Uint8Array. Be careful: nodejs Buffer will return true.
 * @param a - value to test
 * @returns `true` when the value is a Uint8Array-compatible view.
 * @example
 * Check whether a value is a Uint8Array-compatible view.
 * ```ts
 * isBytes(new Uint8Array([1, 2, 3]));
 * ```
 */
function utils_isBytes(a) {
    // Plain `instanceof Uint8Array` is too strict for some Buffer / proxy / cross-realm cases.
    // The fallback still requires a real ArrayBuffer view, so plain
    // JSON-deserialized `{ constructor: ... }` spoofing is rejected, and
    // `BYTES_PER_ELEMENT === 1` keeps the fallback on byte-oriented views.
    return (a instanceof Uint8Array ||
        (ArrayBuffer.isView(a) &&
            a.constructor.name === 'Uint8Array' &&
            'BYTES_PER_ELEMENT' in a &&
            a.BYTES_PER_ELEMENT === 1));
}
// Shared error-message prefix builder. Only called on throw paths, so assert
// success paths never pay for the string concatenation.
const atitle = (title) => (title ? `"${title}" ` : '');
/**
 * Asserts something is a non-negative integer.
 * @param n - number to validate
 * @param title - label included in thrown errors
 * @returns The validated number.
 * @throws On wrong argument types. {@link TypeError}
 * @throws On wrong argument ranges or values. {@link RangeError}
 * @example
 * Validate a non-negative integer option.
 * ```ts
 * anumber(32, 'length');
 * ```
 */
function utils_anumber(n, title = '') {
    if (typeof n !== 'number')
        throw new TypeError(atitle(title) + 'expected number, got ' + typeof n);
    if (!Number.isSafeInteger(n) || n < 0)
        throw new RangeError(atitle(title) + 'expected integer >= 0, got ' + n);
    return n;
}
/**
 * Asserts something is a boolean.
 * @param value - value to validate
 * @param title - label included in thrown errors
 * @returns The validated boolean.
 * @throws On wrong argument types. {@link TypeError}
 * @example
 * Validate a boolean option.
 * ```ts
 * abool(true, 'enableXOF');
 * ```
 */
function abool(value, title = '') {
    if (typeof value !== 'boolean')
        throw new TypeError(atitle(title) + 'expected boolean, got type=' + typeof value);
    return value;
}
/**
 * Asserts something is Uint8Array.
 * @param value - value to validate
 * @param length - optional exact length constraint
 * @param title - label included in thrown errors
 * @returns The validated byte array.
 * @throws On wrong argument types. {@link TypeError}
 * @throws On wrong argument ranges or values. {@link RangeError}
 * @example
 * Validate that a value is a byte array.
 * ```ts
 * abytes(new Uint8Array([1, 2, 3]));
 * ```
 */
function utils_abytes(value, length, title = '') {
    // Success path first: this runs at the start of every update() / digestInto(), and the
    // common `abytes(data)` form must not pay for length handling it does not use.
    if (utils_isBytes(value) && (length === undefined || value.length === length))
        return value;
    // Error path: recompute freely to build the exact message.
    if (length !== undefined)
        utils_anumber(length, 'length');
    const bytes = utils_isBytes(value);
    const ofLen = length !== undefined ? ` of length ${length}` : '';
    const got = bytes ? `length=${value.length}` : `type=${typeof value}`;
    const message = atitle(title) + 'expected Uint8Array' + ofLen + ', got ' + got;
    if (!bytes)
        throw new TypeError(message);
    throw new RangeError(message);
}
/**
 * Copies bytes into a fresh Uint8Array.
 * Buffer-style slices can alias the same backing store, so callers that need ownership should copy.
 * @param bytes - source bytes to clone
 * @returns Freshly allocated copy of `bytes`.
 * @throws On wrong argument types. {@link TypeError}
 * @example
 * Clone a byte array before mutating it.
 * ```ts
 * const copy = copyBytes(new Uint8Array([1, 2, 3]));
 * ```
 */
function utils_copyBytes(bytes) {
    // `Uint8Array.from(...)` would also accept arrays / other typed arrays. Keep this helper strict
    // because callers use it at byte-validation boundaries before mutating the detached copy.
    return Uint8Array.from(utils_abytes(bytes));
}
/**
 * Asserts something is a wrapped hash constructor.
 * @param h - hash constructor to validate
 * @throws On wrong argument types or invalid hash wrapper shape. {@link TypeError}
 * @throws On invalid hash metadata ranges or values. {@link RangeError}
 * @throws If the hash metadata allows empty outputs or block sizes. {@link Error}
 * @example
 * Validate a callable hash wrapper.
 * ```ts
 * import { ahash } from '@noble/hashes/utils.js';
 * import { sha256 } from '@noble/hashes/sha2.js';
 * ahash(sha256);
 * ```
 */
function ahash(h) {
    if (typeof h !== 'function' || typeof h.create !== 'function')
        throw new TypeError('expected hash wrapped by utils.createHasher');
    utils_anumber(h.outputLen);
    utils_anumber(h.blockLen);
    // HMAC and KDF callers treat these as real byte lengths; allowing zero lets fake wrappers pass
    // validation and can produce empty outputs instead of failing fast.
    if (h.outputLen < 1 || h.blockLen < 1)
        throw new Error('hash blockLen / outputLen must be >= 1');
}
const aobject = (value, label) => {
    if (value === null || typeof value !== 'object' || Array.isArray(value))
        throw new TypeError((label === 'object' ? '' : `"${label}" `) + 'expected object, got type=' + typeof value);
};
const aopts = (value, label) => {
    aobject(value, label);
    const proto = Object.getPrototypeOf(value);
    if (proto !== Object.prototype && proto !== null)
        throw new TypeError(`"${label}" expected plain object`);
    // Object.assign() treats an own "__proto__" source key as a write to the target's legacy
    // prototype setter. Reject it before merging so inherited option values cannot be injected.
    if (Object.hasOwn(value, '__proto__'))
        throw new TypeError(`"${label}.__proto__" is not allowed`);
};
/**
 * Asserts a hash instance has not been destroyed or finished.
 * @param instance - hash instance to validate
 * @param checkFinished - whether to reject finalized instances
 * @throws If the hash instance has already been destroyed or finalized. {@link Error}
 * @example
 * Validate that a hash instance is still usable.
 * ```ts
 * import { aexists } from '@noble/hashes/utils.js';
 * import { sha256 } from '@noble/hashes/sha2.js';
 * const hash = sha256.create();
 * aexists(hash);
 * ```
 */
function aexists(instance, checkFinished = true) {
    // Runs on every update()/digestInto(); the flags are library-owned booleans, so only their
    // truthiness is checked - re-validating their type per call was pure hot-path overhead.
    if (instance.destroyed)
        throw new Error('hash was destroyed');
    if (checkFinished && instance.finished)
        throw new Error('digest() was already called');
}
/**
 * Asserts output is a sufficiently-sized byte array.
 * @param out - destination buffer
 * @param instance - hash instance providing output length
 * Oversized buffers are allowed; downstream code only promises to fill the first `outputLen` bytes.
 * @throws On wrong argument types. {@link TypeError}
 * @throws On wrong argument ranges or values. {@link RangeError}
 * @example
 * Validate a caller-provided digest buffer.
 * ```ts
 * import { aoutput } from '@noble/hashes/utils.js';
 * import { sha256 } from '@noble/hashes/sha2.js';
 * const hash = sha256.create();
 * aoutput(new Uint8Array(hash.outputLen), hash);
 * ```
 */
function aoutput(out, instance) {
    utils_abytes(out, undefined, 'output');
    // `outputLen` is a library-owned readonly number; the negated comparison keeps failing fast
    // when it is missing/NaN (comparisons with undefined/NaN are false) without an anumber() call.
    const min = instance.outputLen;
    if (!(out.length >= min)) {
        throw new RangeError('"output" expected length >= ' + min);
    }
}
/**
 * Casts a typed array view to Uint8Array.
 * @param arr - source typed array
 * @returns Uint8Array view over the same buffer.
 * @example
 * Reinterpret a typed array as bytes.
 * ```ts
 * u8(new Uint32Array([1, 2]));
 * ```
 */
function u8(arr) {
    return new Uint8Array(arr.buffer, arr.byteOffset, arr.byteLength);
}
/**
 * Casts a typed array view to Uint32Array.
 * `arr.byteOffset` must already be 4-byte aligned or the platform
 * Uint32Array constructor will throw.
 * @param arr - source typed array
 * @returns Uint32Array view over the same buffer.
 * @example
 * Reinterpret a byte array as 32-bit words.
 * ```ts
 * u32(new Uint8Array(8));
 * ```
 */
function u32(arr) {
    return new Uint32Array(arr.buffer, arr.byteOffset, Math.floor(arr.byteLength / 4));
}
/**
 * Zeroizes typed arrays in place. Warning: JS provides no guarantees.
 * @param arrays - arrays to overwrite with zeros
 * @example
 * Zeroize sensitive buffers in place.
 * ```ts
 * clean(new Uint8Array([1, 2, 3]));
 * ```
 */
function utils_clean(...arrays) {
    for (let i = 0; i < arrays.length; i++) {
        arrays[i].fill(0);
    }
}
/**
 * Creates a DataView for byte-level manipulation.
 * @param arr - source typed array
 * @returns DataView over the same buffer region.
 * @example
 * Create a DataView over an existing buffer.
 * ```ts
 * createView(new Uint8Array(4));
 * ```
 */
function createView(arr) {
    return new DataView(arr.buffer, arr.byteOffset, arr.byteLength);
}
/**
 * Rotate-right operation for uint32 values.
 * @param word - source word
 * @param shift - shift amount in bits
 * @returns Rotated word.
 * @example
 * Rotate a 32-bit word to the right.
 * ```ts
 * rotr(0x12345678, 8);
 * ```
 */
function rotr(word, shift) {
    return (word << (32 - shift)) | (word >>> shift);
}
/**
 * Rotate-left operation for uint32 values.
 * @param word - source word
 * @param shift - shift amount in bits
 * @returns Rotated word.
 * @example
 * Rotate a 32-bit word to the left.
 * ```ts
 * rotl(0x12345678, 8);
 * ```
 */
function rotl(word, shift) {
    return (word << shift) | ((word >>> (32 - shift)) >>> 0);
}
/** Whether the current platform is little-endian. */
const isLE = /* @__PURE__ */ (() => new Uint8Array(new Uint32Array([0x11223344]).buffer)[0] === 0x44)();
/**
 * Byte-swap operation for uint32 values.
 * @param word - source word
 * @returns Word with reversed byte order.
 * @example
 * Reverse the byte order of a 32-bit word.
 * ```ts
 * byteSwap(0x11223344);
 * ```
 */
function byteSwap(word) {
    return (((word << 24) & 0xff000000) |
        ((word << 8) & 0xff0000) |
        ((word >>> 8) & 0xff00) |
        ((word >>> 24) & 0xff));
}
/**
 * Conditionally byte-swaps one 32-bit word on big-endian platforms.
 * @param n - source word
 * @returns Original or byte-swapped word depending on platform endianness.
 * @example
 * Normalize a 32-bit word for host endianness.
 * ```ts
 * swap8IfBE(0x11223344);
 * ```
 */
const swap8IfBE = (/* unused pure expression or super */ null && (isLE
    ? (n) => n
    : (n) => byteSwap(n) >>> 0));
/**
 * Byte-swaps every word of a Uint32Array in place.
 * @param arr - array to mutate
 * @returns The same array after mutation; callers pass live state arrays here.
 * @example
 * Reverse the byte order of every word in place.
 * ```ts
 * byteSwap32(new Uint32Array([0x11223344]));
 * ```
 */
function byteSwap32(arr) {
    for (let i = 0; i < arr.length; i++) {
        arr[i] = byteSwap(arr[i]);
    }
    return arr;
}
/**
 * Conditionally byte-swaps a Uint32Array on big-endian platforms.
 * @param u - array to normalize for host endianness
 * @returns Original or byte-swapped array depending on platform endianness.
 *   On big-endian runtimes this mutates `u` in place via `byteSwap32(...)`.
 * @example
 * Normalize a word array for host endianness.
 * ```ts
 * swap32IfBE(new Uint32Array([0x11223344]));
 * ```
 */
const swap32IfBE = isLE
    ? (u) => u
    : byteSwap32;
// Built-in hex conversion https://caniuse.com/mdn-javascript_builtins_uint8array_fromhex
const hasHexBuiltin = /* @__PURE__ */ (() => 
// @ts-ignore
typeof Uint8Array.from([]).toHex === 'function' && typeof Uint8Array.fromHex === 'function')();
// Array where index 0xf0 (240) is mapped to string 'f0'
const hexes = /* @__PURE__ */ Array.from({ length: 256 }, (_, i) => i.toString(16).padStart(2, '0'));
/**
 * Convert byte array to hex string.
 * Uses the built-in function when available and assumes it matches the tested
 * fallback semantics.
 * @param bytes - bytes to encode
 * @returns Lowercase hexadecimal string.
 * @throws On wrong argument types. {@link TypeError}
 * @example
 * Convert bytes to lowercase hexadecimal.
 * ```ts
 * bytesToHex(Uint8Array.from([0xca, 0xfe, 0x01, 0x23])); // 'cafe0123'
 * ```
 */
function bytesToHex(bytes) {
    utils_abytes(bytes);
    // @ts-ignore
    if (hasHexBuiltin)
        return bytes.toHex();
    // pre-caching improves the speed 6x
    let hex = '';
    for (let i = 0; i < bytes.length; i++) {
        hex += hexes[bytes[i]];
    }
    return hex;
}
// Strict ASCII nibble parser: non-ASCII hex lookalikes are rejected as undefined.
// ASCII codes: '0'..'9' = 48..57, 'A'..'F' = 65..70, 'a'..'f' = 97..102.
// prettier-ignore
function asciiToBase16(ch) {
    return ch >= 48 && ch <= 57 ? ch - 48 // '2' => 50-48
        : ch >= 65 && ch <= 70 ? ch - (65 - 10) // 'B' => 66-(65-10)
            : ch >= 97 && ch <= 102 ? ch - (97 - 10) // 'b' => 98-(97-10)
                : undefined;
}
/**
 * Convert hex string to byte array. Uses built-in function, when available.
 * @param hex - hexadecimal string to decode
 * @returns Decoded bytes.
 * @throws On wrong argument types. {@link TypeError}
 * @throws On wrong argument ranges or values. {@link RangeError}
 * @example
 * Decode lowercase hexadecimal into bytes.
 * ```ts
 * hexToBytes('cafe0123'); // Uint8Array.from([0xca, 0xfe, 0x01, 0x23])
 * ```
 */
function hexToBytes(hex) {
    if (typeof hex !== 'string')
        throw new TypeError('hex string expected, got ' + typeof hex);
    if (hasHexBuiltin) {
        try {
            return Uint8Array.fromHex(hex);
        }
        catch (error) {
            if (error instanceof SyntaxError)
                throw new RangeError(error.message);
            throw error;
        }
    }
    const hl = hex.length;
    const al = hl / 2;
    if (hl % 2)
        throw new RangeError('hex string expected, got unpadded hex of length ' + hl);
    const array = new Uint8Array(al);
    for (let ai = 0, hi = 0; ai < al; ai++, hi += 2) {
        const n1 = asciiToBase16(hex.charCodeAt(hi)); // parse first char, multiply it by 16
        const n2 = asciiToBase16(hex.charCodeAt(hi + 1)); // parse second char
        if (n1 === undefined || n2 === undefined) {
            const char = hex[hi] + hex[hi + 1];
            throw new RangeError('hex string expected, got non-hex character "' + char + '" at index ' + hi);
        }
        array[ai] = n1 * 16 + n2; // example: 'A9' => 10*16 + 9
    }
    return array;
}
/**
 * Yields to the host task scheduler so timers, I/O, and rendering can make progress.
 * Uses the Web Scheduling API when available or `setTimeout` as a cross-platform fallback.
 * Host-task yields are much slower than microtasks (roughly 1ms with the timer fallback), so
 * async loops should use `asyncTick >= 10` to amortize scheduling overhead to about 10% while
 * still allowing other event-loop work to proceed.
 * @param onReject - optional cleanup invoked only if the host yield fails
 * @example
 * Yield to the next scheduler tick.
 * ```ts
 * await nextTick();
 * ```
 */
function nextTick(onReject) {
    const host = globalThis;
    if (typeof host.scheduler?.yield === 'function') {
        const promise = host.scheduler.yield();
        // Keep the original scheduler rejection; this handler exists only for cleanup.
        if (onReject)
            promise.catch(onReject);
        return promise;
    }
    return new Promise((resolve) => host.setTimeout(resolve, 0));
}
/**
 * Returns control to the host event loop every `tick` milliseconds to avoid blocking long loops.
 * @param iters - number of loop iterations to run
 * @param tick - maximum time slice in milliseconds
 * @param cb - callback executed on each iteration
 * @param onReject - optional cleanup invoked only if a host yield fails
 * @throws On wrong argument types. {@link TypeError}
 * @throws On wrong argument ranges or values. {@link RangeError}
 * @example
 * Run a loop that periodically yields back to the event loop.
 * ```ts
 * await asyncLoop(2, 0, () => {});
 * ```
 */
async function asyncLoop(iters, tick, cb, onReject) {
    utils_anumber(iters, 'iters');
    utils_anumber(tick, 'tick');
    if (typeof cb !== 'function')
        throw new TypeError('callback must be a function');
    // Callback is synchronous by contract; asyncLoop only yields between sync work windows.
    let ts = Date.now();
    for (let i = 0; i < iters; i++) {
        cb(i);
        // Date.now() is not monotonic, so in case if clock goes backwards we return return control too
        const diff = Date.now() - ts;
        if (diff >= 0 && diff < tick)
            continue;
        await nextTick(onReject);
        // Track only synchronous work time; scheduler delay after yielding is outside our budget.
        ts = Date.now();
    }
}
/**
 * Converts string to bytes using UTF8 encoding.
 * Built-in doesn't validate input to be string: we do the check.
 * Non-ASCII details are delegated to the platform `TextEncoder`.
 * @param str - string to encode
 * @returns UTF-8 encoded bytes.
 * @throws On wrong argument types. {@link TypeError}
 * @example
 * Encode a string as UTF-8 bytes.
 * ```ts
 * utf8ToBytes('abc'); // Uint8Array.from([97, 98, 99])
 * ```
 */
function utf8ToBytes(str) {
    if (typeof str !== 'string')
        throw new TypeError('string expected');
    const encoded = new TextEncoder().encode(str);
    try {
        // Copy into the current realm for Firefox extension contexts. Callers that own the returned
        // buffer can then wipe it independently of TextEncoder's temporary result.
        return new Uint8Array(encoded); // https://bugzil.la/1681809
    }
    finally {
        utils_clean(encoded);
    }
}
/**
 * Helper for KDFs: consumes Uint8Array or string.
 * String inputs are UTF-8 encoded; byte-array inputs stay aliased to the caller buffer.
 * @param data - user-provided KDF input
 * @param errorTitle - label included in thrown errors
 * @returns Byte representation of the input.
 * @throws On wrong argument types. {@link TypeError}
 * @example
 * Normalize KDF input to bytes.
 * ```ts
 * kdfInputToBytes('password');
 * ```
 */
function kdfInputToBytes(data, errorTitle = '') {
    if (typeof data === 'string')
        return utf8ToBytes(data);
    return utils_abytes(data, undefined, errorTitle);
}
/**
 * Copies several Uint8Arrays into one.
 * @param arrays - arrays to concatenate
 * @returns Concatenated byte array.
 * @throws On wrong argument types. {@link TypeError}
 * @example
 * Concatenate multiple byte arrays.
 * ```ts
 * concatBytes(new Uint8Array([1]), new Uint8Array([2]));
 * ```
 */
function utils_concatBytes(...arrays) {
    let sum = 0;
    for (let i = 0; i < arrays.length; i++) {
        const a = arrays[i];
        utils_abytes(a);
        sum += a.length;
    }
    const res = new Uint8Array(sum);
    for (let i = 0, pad = 0; i < arrays.length; i++) {
        const a = arrays[i];
        res.set(a, pad);
        pad += a.length;
    }
    return res;
}
/**
 * Validates declared required and optional field types on a plain object.
 * This walks field schemas and formats detailed errors, so avoid it on hot paths; use direct
 * one-line guards such as `abytes()`, `abool()`, or `anumber()` instead.
 * @param object - object to validate
 * @param fields - map of required field names to expected types
 * @param optFields - map of optional field names to expected types
 * @param title - label included in thrown errors
 * @throws On wrong argument types. {@link TypeError}
 * @example
 * Validate required and optional option fields.
 * ```ts
 * validateObject({ N: 1024, dkLen: 32 }, { N: 'number' }, { dkLen: 'number' });
 * ```
 */
const utils_validateObject = (object, fields = {}, optFields = {}, title = 'object') => {
    aobject(object, title);
    aobject(fields, 'fields');
    aobject(optFields, 'optFields');
    function checkField(fieldName, expectedType, isOpt) {
        const label = title === 'object' ? `param "${String(fieldName)}"` : `"${title}.${String(fieldName)}"`;
        // Config fields must be explicit own properties. Optional inherited values are rejected too
        // because callers keep reading the same options object after validation.
        const val = object[fieldName];
        // Runtime objects such as Field instances intentionally satisfy required method slots
        // via their shared prototype.
        if (!Object.hasOwn(object, fieldName) &&
            (isOpt ? val !== undefined : expectedType !== 'function')) {
            throw new TypeError(`${label} is invalid: expected own property`);
        }
        if (isOpt && val === undefined)
            return;
        const current = typeof val;
        if (current !== expectedType || val === null)
            throw new TypeError(`${label} is invalid: expected ${expectedType}, got ${current}`);
    }
    const iter = (f, isOpt) => Object.entries(f).forEach(([k, v]) => checkField(k, v, isOpt));
    iter(fields, false);
    iter(optFields, true);
};
/**
 * Merges default options and passed options.
 * @param defaults - base option object
 * @param opts - user overrides
 * @param title - label included in thrown override errors
 * @returns Fresh merged option object with a null prototype.
 * @throws On wrong argument types. {@link TypeError}
 * @example
 * Merge user overrides onto default options.
 * ```ts
 * checkOpts({ dkLen: 32 }, { asyncTick: 10 });
 * ```
 */
function utils_checkOpts(defaults, opts, title = 'opts') {
    aopts(defaults, 'defaults');
    if (opts !== undefined)
        aopts(opts, title);
    // Callers read optional fields directly, so omitted values must not fall through to ambient
    // Object.prototype pollution (for example a forged `dkLen` changing SHAKE's default output).
    const merged = Object.assign(Object.create(null), defaults, opts);
    return merged;
}
/**
 * Creates a callable hash function from a stateful class constructor.
 * @param hashCons - hash constructor or factory
 * @param info - optional metadata such as DER OID
 * @returns Frozen callable hash wrapper with `.create()`.
 *   Wrapper construction eagerly calls `hashCons(undefined)` once to read
 *   `outputLen` / `blockLen`, so constructor side effects happen at module
 *   init time.
 * @throws On wrong argument types. {@link TypeError}
 * @example
 * Wrap a stateful hash constructor into a callable helper.
 * ```ts
 * import { createHasher } from '@noble/hashes/utils.js';
 * import { sha256 } from '@noble/hashes/sha2.js';
 * const wrapped = createHasher(sha256.create, { oid: sha256.oid });
 * wrapped(new Uint8Array([1]));
 * ```
 */
function utils_createHasher(hashCons, info = {}) {
    if (typeof hashCons !== 'function')
        throw new TypeError('"hashCons" expected function, got type=' + typeof hashCons);
    info = utils_checkOpts({}, info, 'info');
    const hashC = (msg, opts) => hashCons(opts)
        .update(msg)
        .digest();
    const tmp = hashCons(undefined);
    hashC.outputLen = tmp.outputLen;
    hashC.blockLen = tmp.blockLen;
    hashC.canXOF = tmp.canXOF;
    hashC.create = (opts) => hashCons(opts);
    Object.assign(hashC, info);
    return Object.freeze(hashC);
}
/**
 * Cryptographically secure PRNG backed by `crypto.getRandomValues`.
 * @param bytesLength - number of random bytes to generate
 * @returns Random bytes.
 * The platform `getRandomValues()` implementation still defines any
 * single-call length cap, and this helper rejects oversize requests
 * with a stable library `RangeError` instead of host-specific errors.
 * @throws On wrong argument types. {@link TypeError}
 * @throws On wrong argument ranges or values. {@link RangeError}
 * @throws If the current runtime does not provide `crypto.getRandomValues`. {@link Error}
 * @example
 * Generate a fresh random key or nonce.
 * ```ts
 * const key = randomBytes(16);
 * ```
 */
function utils_randomBytes(bytesLength = 32) {
    // Match the repo's other length-taking helpers instead of relying on Uint8Array coercion.
    utils_anumber(bytesLength, 'bytesLength');
    const cr = typeof globalThis === 'object' ? globalThis.crypto : null;
    if (typeof cr?.getRandomValues !== 'function')
        throw new Error('crypto.getRandomValues must be defined');
    // Web Cryptography API Level 2 §10.1.1:
    // if `byteLength > 65536`, throw `QuotaExceededError`.
    // Keep the guard explicit so callers can see the quota in code
    // instead of discovering it by reading the spec or host errors.
    // This wrapper surfaces the same quota as a stable library RangeError.
    if (bytesLength > 65536)
        throw new RangeError(`"bytesLength" expected <= 65536, got ${bytesLength}`);
    return cr.getRandomValues(new Uint8Array(bytesLength));
}
/**
 * Creates OID metadata for NIST hashes with prefix `06 09 60 86 48 01 65 03 04 02`.
 * @param suffix - final OID byte for the selected hash.
 *   The helper accepts any byte even though only the documented NIST hash
 *   suffixes are meaningful downstream.
 * @returns Object containing the DER-encoded OID.
 * @example
 * Build OID metadata for a NIST hash.
 * ```ts
 * oidNist(0x01);
 * ```
 */
const utils_oidNist = (suffix) => ({
    // Current NIST hashAlgs suffixes used here fit in one DER subidentifier octet.
    // Larger suffix values would need base-128 OID encoding and a different length byte.
    oid: Uint8Array.from([0x06, 0x09, 0x60, 0x86, 0x48, 0x01, 0x65, 0x03, 0x04, 0x02, suffix]),
});

;// ./node_modules/@noble/hashes/hmac.js
/**
 * HMAC: RFC2104 message authentication code.
 * @module
 */

/**
 * Internal class for HMAC.
 * Accepts any byte key, although RFC 2104 §3 recommends keys at least
 * `HashLen` bytes long.
 */
class _HMAC {
    oHash;
    iHash;
    blockLen;
    outputLen;
    canXOF = false;
    finished = false;
    destroyed = false;
    constructor(hash, key) {
        ahash(hash);
        utils_abytes(key, undefined, 'key');
        this.iHash = hash.create();
        if (typeof this.iHash.update !== 'function')
            throw new Error('expected Hash instance');
        this.blockLen = this.iHash.blockLen;
        this.outputLen = this.iHash.outputLen;
        const blockLen = this.blockLen;
        const pad = new Uint8Array(blockLen);
        // blockLen can be bigger than outputLen
        pad.set(key.length > blockLen ? hash.create().update(key).digest() : key);
        for (let i = 0; i < pad.length; i++)
            pad[i] ^= 0x36;
        this.iHash.update(pad);
        // By doing update (processing of the first block) of the outer hash here,
        // we can re-use it between multiple calls via clone.
        this.oHash = hash.create();
        // Undo internal XOR && apply outer XOR
        for (let i = 0; i < pad.length; i++)
            pad[i] ^= 0x36 ^ 0x5c;
        this.oHash.update(pad);
        utils_clean(pad);
    }
    update(buf) {
        aexists(this);
        this.iHash.update(buf);
        return this;
    }
    digestInto(out) {
        aexists(this);
        aoutput(out, this);
        this.finished = true;
        const buf = out.subarray(0, this.outputLen);
        // Reuse the first outputLen bytes for the inner digest; the outer hash consumes them before
        // overwriting that same prefix with the final tag, leaving any oversized tail untouched.
        this.iHash.digestInto(buf);
        this.oHash.update(buf);
        this.oHash.digestInto(buf);
        this.destroy();
    }
    digest() {
        const out = new Uint8Array(this.oHash.outputLen);
        this.digestInto(out);
        return out;
    }
    _cloneInto(to) {
        // Create new instance without calling constructor since the key
        // is already in state and we don't know it.
        to ||= Object.create(Object.getPrototypeOf(this), {});
        const { oHash, iHash, finished, destroyed, blockLen, outputLen, canXOF } = this;
        to = to;
        to.finished = finished;
        to.destroyed = destroyed;
        to.blockLen = blockLen;
        to.outputLen = outputLen;
        to.canXOF = canXOF;
        to.oHash = oHash._cloneInto(to.oHash);
        to.iHash = iHash._cloneInto(to.iHash);
        return to;
    }
    clone() {
        return this._cloneInto();
    }
    destroy() {
        this.destroyed = true;
        this.oHash.destroy();
        this.iHash.destroy();
    }
}
const hmac_hmac = /* @__PURE__ */ (() => {
    const hmac_ = ((hash, key, message) => new _HMAC(hash, key).update(message).digest());
    hmac_.create = (hash, key) => new _HMAC(hash, key);
    return hmac_;
})();

;// ./node_modules/@noble/hashes/pbkdf2.js
/**
 * PBKDF (RFC 2898). Can be used to create a key from password and salt.
 * @module
 */

// prettier-ignore

// Common validation and per-call state setup for sync/async functions.
function pbkdf2Init(hash, _password, _salt, _opts) {
    ahash(hash);
    const opts = utils_checkOpts({ dkLen: 32, asyncTick: 10 }, _opts);
    const { c, dkLen, asyncTick } = opts;
    utils_anumber(c, 'c');
    utils_anumber(dkLen, 'dkLen');
    utils_anumber(asyncTick, 'asyncTick');
    if (c < 1)
        throw new Error('"c" (iterations) must be >= 1');
    // RFC 8018 §5.2 defines `dkLen` as "a positive integer".
    if (dkLen < 1)
        throw new Error('"dkLen" must be >= 1');
    // RFC 8018 §5.2 step 1 requires rejecting oversize `dkLen`
    // before allocating the destination buffer.
    if (dkLen > (2 ** 32 - 1) * hash.outputLen)
        throw new Error('derived key too long');
    const p = kdfInputToBytes(_password, 'password');
    try {
        const s = kdfInputToBytes(_salt, 'salt');
        try {
            // DK = PBKDF2(PRF, Password, Salt, c, dkLen);
            const DK = new Uint8Array(dkLen);
            const { iHash, oHash, outputLen } = hmac_hmac.create(hash, p);
            // Drive keyed hashes directly; the wrapper is only needed to initialize their HMAC midstates.
            const u = new Uint8Array(outputLen);
            const eng = pbkdf2Engine(iHash, oHash, s, u);
            return { c, dkLen, asyncTick, DK, outputLen, eng };
        }
        finally {
            // Uint8Array inputs belong to the caller; only wipe our UTF-8 conversion.
            if (typeof _salt === 'string')
                utils_clean(s);
        }
    }
    finally {
        if (typeof _password === 'string')
            utils_clean(p);
    }
}
// Per-call PRF driver writes U1 into both `u` and `Ti`, then later digests into `u`;
// shared by the sync and async variants.
function pbkdf2Engine(iHash, oHash, salt, u) {
    const counter = new Uint8Array(4);
    const view = createView(counter);
    // Full clones retain tree/config state; absorb salt before async yields without cloning input.
    const salted = iHash._cloneInto().update(salt);
    // u1() overwrites the worker before reading it. Seed from the outer midstate so a long salt
    // cannot pre-populate a tree stack that the first reset would abandon without wiping.
    const work = oHash._cloneInto();
    const iClone = iHash._cloneInto; // Capture before mixed feedback can materialize state tuples.
    const oClone = oHash._cloneInto;
    return {
        u1: (ti, Ti) => {
            view.setInt32(0, ti, false);
            salted._cloneInto(work).update(counter).digestInto(u);
            oHash._cloneInto(work).update(u).digestInto(u);
            Ti.set(u.subarray(0, Ti.length));
        },
        // Whole `F` inner loop for the sync variant: one optimized function owns the hot loop.
        rounds: (c, Ti) => {
            for (let ui = 1; ui < c; ui++) {
                iClone.call(iHash, work).update(u).digestInto(u);
                oClone.call(oHash, work).update(u).digestInto(u);
                for (let i = 0; i < Ti.length; i++)
                    Ti[i] ^= u[i];
            }
        },
        output: (DK) => {
            // Keyed templates and derived worker states are secret material.
            iHash.destroy();
            oHash.destroy();
            salted.destroy();
            work.destroy();
            // Shared sync/async cleanup point: wipe transient PRF state
            // while preserving the derived key buffer.
            utils_clean(u);
            return DK;
        },
    };
}
/**
 * PBKDF2-HMAC: RFC 8018 key derivation function.
 * @param hash - hash function that would be used e.g. sha256
 * @param password - password from which a derived key is generated;
 *   JS string inputs are UTF-8 encoded first
 * @param salt - cryptographic salt; JS string inputs are UTF-8 encoded first
 * @param opts - PBKDF2 work factor and output settings. `dkLen`, if provided,
 *   must be `>= 1` per RFC 8018 §5.2. See {@link Pbkdf2Opt}.
 * @returns Derived key bytes.
 * @throws If the PBKDF2 iteration count or derived-key settings are invalid. {@link Error}
 * @example
 * PBKDF2-HMAC: RFC 2898 key derivation function.
 * ```ts
 * import { pbkdf2 } from '@noble/hashes/pbkdf2.js';
 * import { sha256 } from '@noble/hashes/sha2.js';
 * const key = pbkdf2(sha256, 'password', 'salt', { dkLen: 32, c: Math.pow(2, 18) });
 * ```
 */
function pbkdf2(hash, password, salt, opts) {
    const { c, dkLen, DK, outputLen, eng } = pbkdf2Init(hash, password, salt, opts);
    // DK = T1 + T2 + ⋯ + Tdklen/hlen
    for (let ti = 1, pos = 0; pos < dkLen; ti++, pos += outputLen) {
        // Ti = F(Password, Salt, c, i)
        // The last Ti view can be shorter than hLen, which applies
        // RFC 8018 §5.2 step 4's T_l<0..r-1> truncation without extra copies.
        const Ti = DK.subarray(pos, pos + outputLen);
        // F(Password, Salt, c, i) = U1 ^ U2 ^ ⋯ ^ Uc
        // U1 = PRF(Password, Salt + INT_32_BE(i))
        eng.u1(ti, Ti);
        // Uc = PRF(Password, Uc−1); Ti ^= Uc
        eng.rounds(c, Ti);
    }
    return eng.output(DK);
}
/**
 * PBKDF2-HMAC: RFC 8018 key derivation function. Async version.
 * @param hash - hash function that would be used e.g. sha256
 * @param password - password from which a derived key is generated;
 *   JS string inputs are UTF-8 encoded first
 * @param salt - cryptographic salt; JS string inputs are UTF-8 encoded first
 * @param opts - PBKDF2 work factor and output settings. `dkLen`, if provided,
 *   must be `>= 1` per RFC 8018 §5.2. `asyncTick` is only a local
 *   scheduler-yield knob for this JS wrapper, not part of RFC 8018.
 *   See {@link Pbkdf2Opt}.
 * @returns Promise resolving to derived key bytes.
 * @throws If the PBKDF2 iteration count or derived-key settings are invalid. {@link Error}
 * @example
 * PBKDF2-HMAC: RFC 2898 key derivation function.
 * ```ts
 * import { pbkdf2Async } from '@noble/hashes/pbkdf2.js';
 * import { sha256 } from '@noble/hashes/sha2.js';
 * const key = await pbkdf2Async(sha256, 'password', 'salt', { dkLen: 32, c: 500_000 });
 * ```
 * @example
 * Tune the async PBKDF2 scheduler for short UI tasks.
 * ```ts
 * import { pbkdf2Async } from '@noble/hashes/pbkdf2.js';
 * import { sha256 } from '@noble/hashes/sha2.js';
 * const key = await pbkdf2Async(sha256, 'password', 'salt', {
 *   dkLen: 32,
 *   c: 32,
 *   asyncTick: 1,
 * });
 * ```
 */
async function pbkdf2Async(hash, password, salt, opts) {
    const { c, dkLen, asyncTick, DK, outputLen, eng } = pbkdf2Init(hash, password, salt, opts);
    // Reuse normal state destruction, then wipe the incomplete output if a host yield aborts.
    const abort = () => {
        eng.output(DK);
        utils_clean(DK);
    };
    // DK = T1 + T2 + ⋯ + Tdklen/hlen
    for (let ti = 1, pos = 0; pos < dkLen; ti++, pos += outputLen) {
        // Ti = F(Password, Salt, c, i)
        // The last Ti view can be shorter than hLen, which applies
        // RFC 8018 §5.2 step 4's T_l<0..r-1> truncation without extra copies.
        const Ti = DK.subarray(pos, pos + outputLen);
        // F(Password, Salt, c, i) = U1 ^ U2 ^ ⋯ ^ Uc
        // U1 = PRF(Password, Salt + INT_32_BE(i))
        eng.u1(ti, Ti);
        await asyncLoop(c - 1, asyncTick, () => {
            // Uc = PRF(Password, Uc−1)
            eng.rounds(2, Ti); // c=2 runs exactly one PRF iteration per callback.
        }, abort);
    }
    return eng.output(DK);
}

;// ./node_modules/@noble/hashes/_u64.js
const U32_MASK64 = /* @__PURE__ */ (() => BigInt(2 ** 32 - 1))();
const _32n = /* @__PURE__ */ BigInt(32);
// Split bigint into two 32-bit halves. With `le=true`, returned fields become `{ h: low, l: high
// }` to match little-endian word order rather than the property names.
function fromBig(n, le = false) {
    if (le)
        return { h: Number(n & U32_MASK64), l: Number((n >> _32n) & U32_MASK64) };
    return { h: Number((n >> _32n) & U32_MASK64) | 0, l: Number(n & U32_MASK64) | 0 };
}
// Split bigint list into `[highWords, lowWords]` when `le=false`; with `le=true`, the first array
// holds the low halves because `fromBig(...)` swaps the semantic meaning of `h` and `l`.
function split(lst, le = false) {
    const len = lst.length;
    let Ah = new Uint32Array(len);
    let Al = new Uint32Array(len);
    for (let i = 0; i < len; i++) {
        const { h, l } = fromBig(lst[i], le);
        [Ah[i], Al[i]] = [h, l];
    }
    return [Ah, Al];
}
// Combine explicit `(high, low)` 32-bit halves into a bigint; `>>> 0` normalizes signed JS
// bitwise results back to uint32 first, and little-endian callers must swap.
const toBig = (h, l) => (BigInt(h >>> 0) << _32n) | BigInt(l >>> 0);
// Split a JS number into u32 halves without a BigInt allocation. Exact only for integers
// `0 <= n < 2**53`; callers use it on byte / bit counters, which JS length math caps far below
// that (an ArrayBuffer cannot exceed 2**53 - 1 bytes).
const fromNumH = (n) => (n / 2 ** 32) | 0;
const fromNumL = (n) => n >>> 0;
// Drop-in replacement for `view.setBigUint64(byteOffset, BigInt(n), isLE)` without the per-call
// BigInt allocation. Same `n < 2**53` precondition as `fromNumH`/`fromNumL`.
function setU64FromNum(view, byteOffset, n, isLE) {
    const h = fromNumH(n);
    const l = fromNumL(n);
    view.setUint32(byteOffset, isLE ? l : h, isLE);
    view.setUint32(byteOffset + 4, isLE ? h : l, isLE);
}
// High 32-bit half of a 64-bit logical right shift for `s` in `0..31`.
const shrSH = (h, _l, s) => h >>> s;
// Low 32-bit half of a 64-bit logical right shift, valid for `s` in `1..31`.
const shrSL = (h, l, s) => (h << (32 - s)) | (l >>> s);
// High 32-bit half of a 64-bit right rotate, valid for `s` in `1..31`.
const rotrSH = (h, l, s) => (h >>> s) | (l << (32 - s));
// Low 32-bit half of a 64-bit right rotate, valid for `s` in `1..31`.
const rotrSL = (h, l, s) => (h << (32 - s)) | (l >>> s);
// High 32-bit half of a 64-bit right rotate, valid for `s` in `33..63`; `32` uses `rotr32*`.
const rotrBH = (h, l, s) => (h << (64 - s)) | (l >>> (s - 32));
// Low 32-bit half of a 64-bit right rotate, valid for `s` in `33..63`; `32` uses `rotr32*`.
const rotrBL = (h, l, s) => (h >>> (s - 32)) | (l << (64 - s));
// High 32-bit half of a 64-bit right rotate for `s === 32`; this is just the swapped low half.
const rotr32H = (_h, l) => l;
// Low 32-bit half of a 64-bit right rotate for `s === 32`; this is just the swapped high half.
const rotr32L = (h, _l) => h;
// 64-bit left rotates (rotl*) are not defined here: sha3.ts, their only consumer, keeps
// local copies so V8 inlines them into keccakP.
// Add two split 64-bit words and return the split `{ h, l }` sum.
// JS uses 32-bit signed integers for bitwise operations, so we cannot simply shift the carry out
// of the low sum and instead use division.
function add(Ah, Al, Bh, Bl) {
    const l = (Al >>> 0) + (Bl >>> 0);
    return { h: (Ah + Bh + ((l / 2 ** 32) | 0)) | 0, l: l | 0 };
}
// Addition with more than 2 elements
// Unmasked low-word accumulator for 3-way addition; pass the raw result into `add3H(...)`.
const add3L = (Al, Bl, Cl) => (Al >>> 0) + (Bl >>> 0) + (Cl >>> 0);
// High-word finalize step for 3-way addition; `low` must be the untruncated output of `add3L(...)`.
const add3H = (low, Ah, Bh, Ch) => (Ah + Bh + Ch + ((low / 2 ** 32) | 0)) | 0;
// Unmasked low-word accumulator for 4-way addition; pass the raw result into `add4H(...)`.
const add4L = (Al, Bl, Cl, Dl) => (Al >>> 0) + (Bl >>> 0) + (Cl >>> 0) + (Dl >>> 0);
// High-word finalize step for 4-way addition; `low` must be the untruncated output of `add4L(...)`.
const add4H = (low, Ah, Bh, Ch, Dh) => (Ah + Bh + Ch + Dh + ((low / 2 ** 32) | 0)) | 0;
// Unmasked low-word accumulator for 5-way addition; pass the raw result into `add5H(...)`.
const add5L = (Al, Bl, Cl, Dl, El) => (Al >>> 0) + (Bl >>> 0) + (Cl >>> 0) + (Dl >>> 0) + (El >>> 0);
// High-word finalize step for 5-way addition; `low` must be the untruncated output of `add5L(...)`.
const add5H = (low, Ah, Bh, Ch, Dh, Eh) => (Ah + Bh + Ch + Dh + Eh + ((low / 2 ** 32) | 0)) | 0;
// prettier-ignore


;// ./node_modules/@noble/hashes/_md.js
/**
 * Internal Merkle-Damgard hash utils.
 * @module
 */


/**
 * Shared 32-bit conditional boolean primitive reused by SHA-256, SHA-1, and MD5 `F`.
 * Returns bits from `b` when `a` is set, otherwise from `c`.
 * The XOR form is equivalent to MD5's `F(X,Y,Z) = XY v not(X)Z` because the masked terms never
 * set the same bit.
 * @param a - selector word
 * @param b - word chosen when selector bit is set
 * @param c - word chosen when selector bit is clear
 * @returns Mixed 32-bit word.
 * @example
 * Combine three words with the shared 32-bit choice primitive.
 * ```ts
 * Chi(0xffffffff, 0x12345678, 0x87654321);
 * ```
 */
function Chi(a, b, c) {
    return (a & b) ^ (~a & c);
}
/**
 * Shared 32-bit majority primitive reused by SHA-256 and SHA-1.
 * Returns bits shared by at least two inputs.
 * @param a - first input word
 * @param b - second input word
 * @param c - third input word
 * @returns Mixed 32-bit word.
 * @example
 * Combine three words with the shared 32-bit majority primitive.
 * ```ts
 * Maj(0xffffffff, 0x12345678, 0x87654321);
 * ```
 */
function Maj(a, b, c) {
    return (a & b) ^ (a & c) ^ (b & c);
}
/**
 * Merkle-Damgard hash construction base class.
 * Could be used to create MD5, RIPEMD, SHA1, SHA2.
 * Accepts only byte-aligned `Uint8Array` input, even when the underlying spec describes bit
 * strings with partial-byte tails.
 * @param blockLen - internal block size in bytes
 * @param outputLen - digest size in bytes
 * @param padOffset - trailing length field size in bytes
 * @param isLE - whether length and state words are encoded in little-endian
 * @example
 * Use a concrete subclass to get the shared Merkle-Damgard update/digest flow.
 * ```ts
 * import { _SHA1 } from '@noble/hashes/legacy.js';
 * const hash = new _SHA1();
 * hash.update(new Uint8Array([97, 98, 99]));
 * hash.digest();
 * ```
 */
class HashMD {
    blockLen;
    outputLen;
    canXOF = false;
    padOffset;
    isLE;
    // For partial updates less than block size
    buffer;
    view;
    finished = false;
    length = 0;
    pos = 0;
    destroyed = false;
    constructor(blockLen, outputLen, padOffset, isLE) {
        this.blockLen = blockLen;
        this.outputLen = outputLen;
        this.padOffset = padOffset;
        this.isLE = isLE;
        this.buffer = new Uint8Array(blockLen);
        this.view = createView(this.buffer);
    }
    update(data) {
        aexists(this);
        utils_abytes(data);
        const { view, buffer, blockLen } = this;
        const len = data.length;
        let processed = false;
        for (let pos = 0; pos < len;) {
            const take = Math.min(blockLen - this.pos, len - pos);
            // Fast path only when there is no buffered partial block: `take === blockLen` implies
            // `this.pos === 0`, so we can process full blocks directly from the input view.
            if (take === blockLen) {
                const dataView = createView(data);
                for (; blockLen <= len - pos; pos += blockLen)
                    this.process(dataView, pos);
                processed = true;
                continue;
            }
            // When the whole input is buffered in one go (common for short messages), passing `data`
            // directly avoids allocating a subarray view.
            buffer.set(pos === 0 && take === len ? data : data.subarray(pos, pos + take), this.pos);
            this.pos += take;
            pos += take;
            if (this.pos === blockLen) {
                this.process(view, 0);
                this.pos = 0;
                processed = true;
            }
        }
        this.length += data.length;
        // Shared schedule buffers only pick up input-derived words inside process(); if everything
        // was buffered without processing, there is nothing to zero.
        if (processed)
            this.roundClean();
        return this;
    }
    digestInto(out) {
        aexists(this);
        aoutput(out, this);
        this.finished = true;
        // Padding
        // We can avoid allocation of buffer for padding completely if it
        // was previously not allocated here. But it won't change performance.
        const { buffer, view, blockLen, isLE } = this;
        let { pos } = this;
        // append the bit '1' to the message, then zero-pad the rest of the block
        buffer[pos++] = 0b10000000;
        buffer.fill(0, pos);
        // we have less than padOffset left in buffer, so we cannot put length in
        // current block, need process it and pad again
        if (this.padOffset > blockLen - pos) {
            this.process(view, 0);
            buffer.fill(0);
        }
        // `padOffset` reserves the whole length field. For SHA-384/512 the high 64 bits stay zero from
        // the padding fill above, and JS will overflow before user input can make that half non-zero.
        // So we only need to write the low 64 bits here (`length * 8` only scales the exponent of an
        // integer below 2**53, so the split inside the helper stays exact).
        setU64FromNum(view, blockLen - 8, this.length * 8, isLE);
        this.process(view, 0);
        // The final block above is processed outside update(), so the shared message-schedule
        // buffers (e.g. SHA256_W) would otherwise retain input-derived words after digest().
        this.roundClean();
        // digest() passes our own `buffer` as `out`; reuse its cached view instead of allocating one.
        const oview = out === buffer ? view : createView(out);
        const len = this.outputLen;
        // NOTE: we do division by 4 later, which must be fused in single op with modulo by JIT
        const outLen = len / 4;
        const state = this.get();
        // Subclass-misconfiguration invariant: outputLen must be 32-bit aligned and fit the state.
        if (len % 4 || outLen > state.length)
            throw new Error('invalid outputLen');
        for (let i = 0; i < outLen; i++)
            oview.setUint32(4 * i, state[i], isLE);
    }
    digest() {
        const { buffer, outputLen } = this;
        this.digestInto(buffer);
        // Copy before destroy(): subclasses wipe `buffer` during cleanup, but `digest()` must return
        // fresh bytes to the caller.
        const res = buffer.slice(0, outputLen);
        this.destroy();
        return res;
    }
    _cloneIntoMeta(to) {
        const { buffer, length, finished, destroyed, pos } = this;
        to.destroyed = destroyed;
        to.finished = finished;
        to.length = length;
        to.pos = pos;
        // Only partial-block bytes need copying: when `length % blockLen === 0`, `pos === 0` and
        // later `update()` / `digestInto()` overwrite `to.buffer` from the start before reading it.
        if (pos)
            to.buffer.set(buffer); // Avoid a hot modulo guard.
        return to;
    }
    clone() {
        return this._cloneInto();
    }
}
/**
 * Initial SHA-2 state: fractional parts of square roots of first 16 primes 2..53.
 * Check out `test/misc/sha2-gen-iv.js` for recomputation guide.
 */
/** Initial SHA256 state from RFC 6234 §6.1: the first 32 bits of the fractional parts of the
 * square roots of the first eight prime numbers. Exported as a shared table; callers must treat
 * it as read-only because constructors copy words from it by index. */
const SHA256_IV = /* @__PURE__ */ Uint32Array.from([
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
]);
/** Initial SHA224 state `H(0)` from RFC 6234 §6.1. Exported as a shared table; callers must
 * treat it as read-only because constructors copy words from it by index. */
const SHA224_IV = /* @__PURE__ */ Uint32Array.from([
    0xc1059ed8, 0x367cd507, 0x3070dd17, 0xf70e5939, 0xffc00b31, 0x68581511, 0x64f98fa7, 0xbefa4fa4,
]);
/** Initial SHA384 state from RFC 6234 §6.3: eight RFC 64-bit `H(0)` words stored as sixteen
 * big-endian 32-bit halves. Derived from the fractional parts of the square roots of the ninth
 * through sixteenth prime numbers. Exported as a shared table; callers must treat it as read-only
 * because constructors copy halves from it by index. */
const SHA384_IV = /* @__PURE__ */ Uint32Array.from([
    0xcbbb9d5d, 0xc1059ed8, 0x629a292a, 0x367cd507, 0x9159015a, 0x3070dd17, 0x152fecd8, 0xf70e5939,
    0x67332667, 0xffc00b31, 0x8eb44a87, 0x68581511, 0xdb0c2e0d, 0x64f98fa7, 0x47b5481d, 0xbefa4fa4,
]);
/** Initial SHA512 state from RFC 6234 §6.3: eight RFC 64-bit `H(0)` words stored as sixteen
 * big-endian 32-bit halves. Derived from the fractional parts of the square roots of the first
 * eight prime numbers. Exported as a shared table; callers must treat it as read-only because
 * constructors copy halves from it by index. */
const SHA512_IV = /* @__PURE__ */ Uint32Array.from([
    0x6a09e667, 0xf3bcc908, 0xbb67ae85, 0x84caa73b, 0x3c6ef372, 0xfe94f82b, 0xa54ff53a, 0x5f1d36f1,
    0x510e527f, 0xade682d1, 0x9b05688c, 0x2b3e6c1f, 0x1f83d9ab, 0xfb41bd6b, 0x5be0cd19, 0x137e2179,
]);

;// ./node_modules/@noble/hashes/sha2.js
/**
 * SHA2 hash function. A.k.a. sha256, sha384, sha512, sha512_224, sha512_256.
 * SHA256 is the fastest hash implementable in JS, even faster than Blake3.
 * Check out {@link https://www.rfc-editor.org/rfc/rfc4634 | RFC 4634} and
 * {@link https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.180-4.pdf | FIPS 180-4}.
 * @module
 */



/**
 * SHA-224 / SHA-256 round constants from RFC 6234 §5.1: the first 32 bits
 * of the cube roots of the first 64 primes (2..311).
 */
// prettier-ignore
const SHA256_K = /* @__PURE__ */ Uint32Array.from([
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
]);
/** Reusable SHA-224 / SHA-256 message schedule buffer `W_t` from RFC 6234 §6.2 step 1. */
const SHA256_W = /* @__PURE__ */ new Uint32Array(64);
/** Internal SHA-224 / SHA-256 compression engine from RFC 6234 §6.2. */
class SHA2_32B extends HashMD {
    // We cannot use array here since array allows indexing by variable
    // which means optimizer/compiler cannot use registers.
    // Numeric initializers matter: starting the fields as `undefined` changes
    // V8's field representation and makes sha256 3x slower (measured).
    A = 0;
    B = 0;
    C = 0;
    D = 0;
    E = 0;
    F = 0;
    G = 0;
    H = 0;
    constructor(outputLen, IV) {
        super(64, outputLen, 8, false);
        this.A = IV[0] | 0;
        this.B = IV[1] | 0;
        this.C = IV[2] | 0;
        this.D = IV[3] | 0;
        this.E = IV[4] | 0;
        this.F = IV[5] | 0;
        this.G = IV[6] | 0;
        this.H = IV[7] | 0;
    }
    get() {
        const { A, B, C, D, E, F, G, H } = this;
        return [A, B, C, D, E, F, G, H];
    }
    // prettier-ignore
    set(A, B, C, D, E, F, G, H) {
        this.A = A | 0;
        this.B = B | 0;
        this.C = C | 0;
        this.D = D | 0;
        this.E = E | 0;
        this.F = F | 0;
        this.G = G | 0;
        this.H = H | 0;
    }
    _cloneInto(to) {
        (to ||= new this.constructor()).set(...this.get());
        return this._cloneIntoMeta(to);
    }
    process(view, offset) {
        // Extend the first 16 words into the remaining 48 words w[16..63] of the message schedule array
        for (let i = 0; i < 16; i++, offset += 4)
            SHA256_W[i] = view.getUint32(offset, false);
        for (let i = 16; i < 64; i++) {
            const W15 = SHA256_W[i - 15];
            const W2 = SHA256_W[i - 2];
            const s0 = rotr(W15, 7) ^ rotr(W15, 18) ^ (W15 >>> 3);
            const s1 = rotr(W2, 17) ^ rotr(W2, 19) ^ (W2 >>> 10);
            SHA256_W[i] = (s1 + SHA256_W[i - 7] + s0 + SHA256_W[i - 16]) | 0;
        }
        // Compression function main loop, 64 rounds
        let { A, B, C, D, E, F, G, H } = this;
        for (let i = 0; i < 64; i++) {
            const sigma1 = rotr(E, 6) ^ rotr(E, 11) ^ rotr(E, 25);
            const T1 = (H + sigma1 + Chi(E, F, G) + SHA256_K[i] + SHA256_W[i]) | 0;
            const sigma0 = rotr(A, 2) ^ rotr(A, 13) ^ rotr(A, 22);
            const T2 = (sigma0 + Maj(A, B, C)) | 0;
            H = G;
            G = F;
            F = E;
            E = (D + T1) | 0;
            D = C;
            C = B;
            B = A;
            A = (T1 + T2) | 0;
        }
        // Add the compressed chunk to the current hash value
        A = (A + this.A) | 0;
        B = (B + this.B) | 0;
        C = (C + this.C) | 0;
        D = (D + this.D) | 0;
        E = (E + this.E) | 0;
        F = (F + this.F) | 0;
        G = (G + this.G) | 0;
        H = (H + this.H) | 0;
        this.set(A, B, C, D, E, F, G, H);
    }
    roundClean() {
        utils_clean(SHA256_W);
    }
    destroy() {
        // HashMD callers route post-destroy usability through `destroyed`; zeroizing alone still leaves
        // update()/digest() callable on reused instances.
        this.destroyed = true;
        this.set(0, 0, 0, 0, 0, 0, 0, 0);
        utils_clean(this.buffer);
    }
}
/** Internal SHA-256 hash class grounded in RFC 6234 §6.2. */
class _SHA256 extends SHA2_32B {
    constructor() {
        super(32, SHA256_IV);
    }
}
/** Internal SHA-224 hash class grounded in RFC 6234 §6.2 and §8.5. */
class _SHA224 extends SHA2_32B {
    constructor() {
        super(28, SHA224_IV);
    }
}
// SHA2-512 is slower than sha256 in js because u64 operations are slow.
// SHA-384 / SHA-512 round constants from RFC 6234 §5.2:
// 80 full 64-bit words split into high/low halves.
// prettier-ignore
const K512 = /* @__PURE__ */ (() => split([
    '0x428a2f98d728ae22', '0x7137449123ef65cd', '0xb5c0fbcfec4d3b2f', '0xe9b5dba58189dbbc',
    '0x3956c25bf348b538', '0x59f111f1b605d019', '0x923f82a4af194f9b', '0xab1c5ed5da6d8118',
    '0xd807aa98a3030242', '0x12835b0145706fbe', '0x243185be4ee4b28c', '0x550c7dc3d5ffb4e2',
    '0x72be5d74f27b896f', '0x80deb1fe3b1696b1', '0x9bdc06a725c71235', '0xc19bf174cf692694',
    '0xe49b69c19ef14ad2', '0xefbe4786384f25e3', '0x0fc19dc68b8cd5b5', '0x240ca1cc77ac9c65',
    '0x2de92c6f592b0275', '0x4a7484aa6ea6e483', '0x5cb0a9dcbd41fbd4', '0x76f988da831153b5',
    '0x983e5152ee66dfab', '0xa831c66d2db43210', '0xb00327c898fb213f', '0xbf597fc7beef0ee4',
    '0xc6e00bf33da88fc2', '0xd5a79147930aa725', '0x06ca6351e003826f', '0x142929670a0e6e70',
    '0x27b70a8546d22ffc', '0x2e1b21385c26c926', '0x4d2c6dfc5ac42aed', '0x53380d139d95b3df',
    '0x650a73548baf63de', '0x766a0abb3c77b2a8', '0x81c2c92e47edaee6', '0x92722c851482353b',
    '0xa2bfe8a14cf10364', '0xa81a664bbc423001', '0xc24b8b70d0f89791', '0xc76c51a30654be30',
    '0xd192e819d6ef5218', '0xd69906245565a910', '0xf40e35855771202a', '0x106aa07032bbd1b8',
    '0x19a4c116b8d2d0c8', '0x1e376c085141ab53', '0x2748774cdf8eeb99', '0x34b0bcb5e19b48a8',
    '0x391c0cb3c5c95a63', '0x4ed8aa4ae3418acb', '0x5b9cca4f7763e373', '0x682e6ff3d6b2b8a3',
    '0x748f82ee5defb2fc', '0x78a5636f43172f60', '0x84c87814a1f0ab72', '0x8cc702081a6439ec',
    '0x90befffa23631e28', '0xa4506cebde82bde9', '0xbef9a3f7b2c67915', '0xc67178f2e372532b',
    '0xca273eceea26619c', '0xd186b8c721c0c207', '0xeada7dd6cde0eb1e', '0xf57d4f7fee6ed178',
    '0x06f067aa72176fba', '0x0a637dc5a2c898a6', '0x113f9804bef90dae', '0x1b710b35131c471b',
    '0x28db77f523047d84', '0x32caab7b40c72493', '0x3c9ebe0a15c9bebc', '0x431d67c49c100d4c',
    '0x4cc5d4becb3e42b6', '0x597f299cfc657e2a', '0x5fcb6fab3ad6faec', '0x6c44198c4a475817'
].map(n => BigInt(n))))();
const SHA512_Kh = /* @__PURE__ */ (() => K512[0])();
const SHA512_Kl = /* @__PURE__ */ (() => K512[1])();
// Reusable high-half schedule buffer for the RFC 6234 §6.4 64-bit `W_t` words.
const SHA512_W_H = /* @__PURE__ */ new Uint32Array(80);
// Reusable low-half schedule buffer for the RFC 6234 §6.4 64-bit `W_t` words.
const SHA512_W_L = /* @__PURE__ */ new Uint32Array(80);
/** Internal SHA-384 / SHA-512 compression engine from RFC 6234 §6.4. */
class SHA2_64B extends HashMD {
    // We cannot use array here since array allows indexing by variable
    // which means optimizer/compiler cannot use registers.
    // h -- high 32 bits, l -- low 32 bits
    // Numeric initializers matter: starting the fields as `undefined` changes
    // V8's field representation and slows hashing down (measured on sha256).
    Ah = 0;
    Al = 0;
    Bh = 0;
    Bl = 0;
    Ch = 0;
    Cl = 0;
    Dh = 0;
    Dl = 0;
    Eh = 0;
    El = 0;
    Fh = 0;
    Fl = 0;
    Gh = 0;
    Gl = 0;
    Hh = 0;
    Hl = 0;
    constructor(outputLen, IV) {
        super(128, outputLen, 16, false);
        this.Ah = IV[0] | 0;
        this.Al = IV[1] | 0;
        this.Bh = IV[2] | 0;
        this.Bl = IV[3] | 0;
        this.Ch = IV[4] | 0;
        this.Cl = IV[5] | 0;
        this.Dh = IV[6] | 0;
        this.Dl = IV[7] | 0;
        this.Eh = IV[8] | 0;
        this.El = IV[9] | 0;
        this.Fh = IV[10] | 0;
        this.Fl = IV[11] | 0;
        this.Gh = IV[12] | 0;
        this.Gl = IV[13] | 0;
        this.Hh = IV[14] | 0;
        this.Hl = IV[15] | 0;
    }
    // prettier-ignore
    get() {
        const { Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl } = this;
        return [Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl];
    }
    // prettier-ignore
    set(Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl) {
        this.Ah = Ah | 0;
        this.Al = Al | 0;
        this.Bh = Bh | 0;
        this.Bl = Bl | 0;
        this.Ch = Ch | 0;
        this.Cl = Cl | 0;
        this.Dh = Dh | 0;
        this.Dl = Dl | 0;
        this.Eh = Eh | 0;
        this.El = El | 0;
        this.Fh = Fh | 0;
        this.Fl = Fl | 0;
        this.Gh = Gh | 0;
        this.Gl = Gl | 0;
        this.Hh = Hh | 0;
        this.Hl = Hl | 0;
    }
    _cloneInto(to) {
        (to ||= new this.constructor()).set(...this.get());
        return this._cloneIntoMeta(to);
    }
    process(view, offset) {
        // Extend the first 16 words into the remaining 64 words w[16..79] of the message schedule array
        for (let i = 0; i < 16; i++, offset += 4) {
            SHA512_W_H[i] = view.getUint32(offset);
            SHA512_W_L[i] = view.getUint32((offset += 4));
        }
        for (let i = 16; i < 80; i++) {
            // s0 := (w[i-15] rightrotate 1) xor (w[i-15] rightrotate 8) xor (w[i-15] rightshift 7)
            const W15h = SHA512_W_H[i - 15] | 0;
            const W15l = SHA512_W_L[i - 15] | 0;
            const s0h = rotrSH(W15h, W15l, 1) ^ rotrSH(W15h, W15l, 8) ^ shrSH(W15h, W15l, 7);
            const s0l = rotrSL(W15h, W15l, 1) ^ rotrSL(W15h, W15l, 8) ^ shrSL(W15h, W15l, 7);
            // s1 := (w[i-2] rightrotate 19) xor (w[i-2] rightrotate 61) xor (w[i-2] rightshift 6)
            const W2h = SHA512_W_H[i - 2] | 0;
            const W2l = SHA512_W_L[i - 2] | 0;
            const s1h = rotrSH(W2h, W2l, 19) ^ rotrBH(W2h, W2l, 61) ^ shrSH(W2h, W2l, 6);
            const s1l = rotrSL(W2h, W2l, 19) ^ rotrBL(W2h, W2l, 61) ^ shrSL(W2h, W2l, 6);
            // SHA512_W[i] = s0 + s1 + SHA512_W[i - 7] + SHA512_W[i - 16];
            const SUMl = add4L(s0l, s1l, SHA512_W_L[i - 7], SHA512_W_L[i - 16]);
            const SUMh = add4H(SUMl, s0h, s1h, SHA512_W_H[i - 7], SHA512_W_H[i - 16]);
            SHA512_W_H[i] = SUMh | 0;
            SHA512_W_L[i] = SUMl | 0;
        }
        let { Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl } = this;
        // Compression function main loop, 80 rounds
        for (let i = 0; i < 80; i++) {
            // S1 := (e rightrotate 14) xor (e rightrotate 18) xor (e rightrotate 41)
            const sigma1h = rotrSH(Eh, El, 14) ^ rotrSH(Eh, El, 18) ^ rotrBH(Eh, El, 41);
            const sigma1l = rotrSL(Eh, El, 14) ^ rotrSL(Eh, El, 18) ^ rotrBL(Eh, El, 41);
            //const T1 = (H + sigma1 + Chi(E, F, G) + SHA256_K[i] + SHA256_W[i]) | 0;
            const CHIh = (Eh & Fh) ^ (~Eh & Gh);
            const CHIl = (El & Fl) ^ (~El & Gl);
            // T1 = H + sigma1 + Chi(E, F, G) + SHA512_K[i] + SHA512_W[i]
            // prettier-ignore
            const T1ll = add5L(Hl, sigma1l, CHIl, SHA512_Kl[i], SHA512_W_L[i]);
            const T1h = add5H(T1ll, Hh, sigma1h, CHIh, SHA512_Kh[i], SHA512_W_H[i]);
            const T1l = T1ll | 0;
            // S0 := (a rightrotate 28) xor (a rightrotate 34) xor (a rightrotate 39)
            const sigma0h = rotrSH(Ah, Al, 28) ^ rotrBH(Ah, Al, 34) ^ rotrBH(Ah, Al, 39);
            const sigma0l = rotrSL(Ah, Al, 28) ^ rotrBL(Ah, Al, 34) ^ rotrBL(Ah, Al, 39);
            const MAJh = (Ah & Bh) ^ (Ah & Ch) ^ (Bh & Ch);
            const MAJl = (Al & Bl) ^ (Al & Cl) ^ (Bl & Cl);
            Hh = Gh | 0;
            Hl = Gl | 0;
            Gh = Fh | 0;
            Gl = Fl | 0;
            Fh = Eh | 0;
            Fl = El | 0;
            ({ h: Eh, l: El } = add(Dh | 0, Dl | 0, T1h | 0, T1l | 0));
            Dh = Ch | 0;
            Dl = Cl | 0;
            Ch = Bh | 0;
            Cl = Bl | 0;
            Bh = Ah | 0;
            Bl = Al | 0;
            const All = add3L(T1l, sigma0l, MAJl);
            Ah = add3H(All, T1h, sigma0h, MAJh);
            Al = All | 0;
        }
        // Add the compressed chunk to the current hash value
        ({ h: Ah, l: Al } = add(this.Ah | 0, this.Al | 0, Ah | 0, Al | 0));
        ({ h: Bh, l: Bl } = add(this.Bh | 0, this.Bl | 0, Bh | 0, Bl | 0));
        ({ h: Ch, l: Cl } = add(this.Ch | 0, this.Cl | 0, Ch | 0, Cl | 0));
        ({ h: Dh, l: Dl } = add(this.Dh | 0, this.Dl | 0, Dh | 0, Dl | 0));
        ({ h: Eh, l: El } = add(this.Eh | 0, this.El | 0, Eh | 0, El | 0));
        ({ h: Fh, l: Fl } = add(this.Fh | 0, this.Fl | 0, Fh | 0, Fl | 0));
        ({ h: Gh, l: Gl } = add(this.Gh | 0, this.Gl | 0, Gh | 0, Gl | 0));
        ({ h: Hh, l: Hl } = add(this.Hh | 0, this.Hl | 0, Hh | 0, Hl | 0));
        this.set(Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl);
    }
    roundClean() {
        utils_clean(SHA512_W_H, SHA512_W_L);
    }
    destroy() {
        // HashMD callers route post-destroy usability through `destroyed`; zeroizing alone still leaves
        // update()/digest() callable on reused instances.
        this.destroyed = true;
        utils_clean(this.buffer);
        this.set(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
    }
}
/** Internal SHA-512 hash class grounded in RFC 6234 §6.3 and §6.4. */
class _SHA512 extends SHA2_64B {
    constructor() {
        super(64, SHA512_IV);
    }
}
/** Internal SHA-384 hash class grounded in RFC 6234 §6.3 and §6.4. */
class _SHA384 extends SHA2_64B {
    constructor() {
        super(48, SHA384_IV);
    }
}
/**
 * Truncated SHA512/256 and SHA512/224.
 * SHA512_IV is XORed with 0xa5a5a5a5a5a5a5a5, then used as "intermediary" IV of SHA512/t.
 * Then t hashes string to produce result IV.
 * See the repo-side derivation recipe in `test/misc/sha2-gen-iv.js`.
 * These IV literals are checked against that script rather than a dedicated
 * local RFC section.
 */
/** SHA-512/224 IV derived by the SHA-512/t recipe in `test/misc/sha2-gen-iv.js` and
 * stored as sixteen big-endian 32-bit halves. */
const T224_IV = /* @__PURE__ */ Uint32Array.from([
    0x8c3d37c8, 0x19544da2, 0x73e19966, 0x89dcd4d6, 0x1dfab7ae, 0x32ff9c82, 0x679dd514, 0x582f9fcf,
    0x0f6d2b69, 0x7bd44da8, 0x77e36f73, 0x04c48942, 0x3f9d85a8, 0x6a1d36c8, 0x1112e6ad, 0x91d692a1,
]);
/** SHA-512/256 IV derived by the SHA-512/t recipe in `test/misc/sha2-gen-iv.js` and
 * stored as sixteen big-endian 32-bit halves. */
const T256_IV = /* @__PURE__ */ Uint32Array.from([
    0x22312194, 0xfc2bf72c, 0x9f555fa3, 0xc84c64c2, 0x2393b86b, 0x6f53b151, 0x96387719, 0x5940eabd,
    0x96283ee2, 0xa88effe3, 0xbe5e1e25, 0x53863992, 0x2b0199fc, 0x2c85b8aa, 0x0eb72ddc, 0x81c52ca2,
]);
/** Internal SHA-512/224 hash class using the derived `T224_IV` and the shared
 * RFC 6234 §6.4 compression engine. */
class _SHA512_224 extends SHA2_64B {
    constructor() {
        super(28, T224_IV);
    }
}
/** Internal SHA-512/256 hash class using the derived `T256_IV` and the shared
 * RFC 6234 §6.4 compression engine. */
class _SHA512_256 extends SHA2_64B {
    constructor() {
        super(32, T256_IV);
    }
}
/**
 * SHA2-256 hash function from RFC 4634. In JS it's the fastest: even faster than Blake3. Some info:
 *
 * - Trying 2^128 hashes would get 50% chance of collision, using birthday attack.
 * - BTC network is doing 2^70 hashes/sec (2^95 hashes/year) as per 2025.
 * - Each sha256 hash is executing 2^18 bit operations.
 * - Good 2024 ASICs can do 200Th/sec with 3500 watts of power, corresponding to 2^36 hashes/joule.
 * @param msg - message bytes to hash
 * @param opts - Reserved hash options.
 * @returns Digest bytes.
 * @example
 * Hash a message with SHA2-256.
 * ```ts
 * sha256(new Uint8Array([97, 98, 99]));
 * ```
 */
const sha2_sha256 = /* @__PURE__ */ utils_createHasher(() => new _SHA256(), 
/* @__PURE__ */ utils_oidNist(0x01));
/**
 * SHA2-224 hash function from RFC 4634.
 * @param msg - message bytes to hash
 * @param opts - Reserved hash options.
 * @returns Digest bytes.
 * @example
 * Hash a message with SHA2-224.
 * ```ts
 * sha224(new Uint8Array([97, 98, 99]));
 * ```
 */
const sha224 = /* @__PURE__ */ (/* unused pure expression or super */ null && (createHasher(() => new _SHA224(), 
/* @__PURE__ */ oidNist(0x04))));
/**
 * SHA2-512 hash function from RFC 4634.
 * @param msg - message bytes to hash
 * @param opts - Reserved hash options.
 * @returns Digest bytes.
 * @example
 * Hash a message with SHA2-512.
 * ```ts
 * sha512(new Uint8Array([97, 98, 99]));
 * ```
 */
const sha2_sha512 = /* @__PURE__ */ utils_createHasher(() => new _SHA512(), 
/* @__PURE__ */ utils_oidNist(0x03));
/**
 * SHA2-384 hash function from RFC 4634.
 * @param msg - message bytes to hash
 * @param opts - Reserved hash options.
 * @returns Digest bytes.
 * @example
 * Hash a message with SHA2-384.
 * ```ts
 * sha384(new Uint8Array([97, 98, 99]));
 * ```
 */
const sha384 = /* @__PURE__ */ (/* unused pure expression or super */ null && (createHasher(() => new _SHA384(), 
/* @__PURE__ */ oidNist(0x02))));
/**
 * SHA2-512/256 "truncated" hash function, with improved resistance to length extension attacks.
 * See the paper on {@link https://eprint.iacr.org/2010/548.pdf | truncated SHA512}.
 * @param msg - message bytes to hash
 * @param opts - Reserved hash options.
 * @returns Digest bytes.
 * @example
 * Hash a message with SHA2-512/256.
 * ```ts
 * sha512_256(new Uint8Array([97, 98, 99]));
 * ```
 */
const sha512_256 = /* @__PURE__ */ (/* unused pure expression or super */ null && (createHasher(() => new _SHA512_256(), 
/* @__PURE__ */ oidNist(0x06))));
/**
 * SHA2-512/224 "truncated" hash function, with improved resistance to length extension attacks.
 * See the paper on {@link https://eprint.iacr.org/2010/548.pdf | truncated SHA512}.
 * @param msg - message bytes to hash
 * @param opts - Reserved hash options.
 * @returns Digest bytes.
 * @example
 * Hash a message with SHA2-512/224.
 * ```ts
 * sha512_224(new Uint8Array([97, 98, 99]));
 * ```
 */
const sha512_224 = /* @__PURE__ */ (/* unused pure expression or super */ null && (createHasher(() => new _SHA512_224(), 
/* @__PURE__ */ oidNist(0x05))));

;// ./node_modules/@noble/hashes/webcrypto.js


function _subtle() {
    const cr = typeof globalThis === 'object' ? globalThis.crypto : null;
    const sb = cr?.subtle;
    if (typeof sb === 'object' && sb != null)
        return sb;
    throw new Error('crypto.subtle must be defined');
}
function createWebHash(name, blockLen, outputLen) {
    const hashC = async (msg) => {
        utils_abytes(msg);
        const crypto = _subtle();
        return new Uint8Array(await crypto.digest(name, msg));
    };
    hashC.webCryptoName = name; // make sure it won't interfere with function name
    hashC.outputLen = outputLen;
    hashC.blockLen = blockLen;
    hashC.create = () => {
        // Present only so this async wrapper satisfies the shared
        // hash-wrapper shape checked by `ahashWeb()`.
        throw new Error('not implemented');
    };
    // Later WebCrypto HMAC/HKDF/PBKDF2 calls read descriptor metadata directly, so freezing prevents
    // callers from retargeting a `sha256` wrapper into a different backend digest by mutation.
    return Object.freeze(hashC);
}
function ahashWeb(hash) {
    ahash(hash);
    const name = hash.webCryptoName;
    if (typeof name !== 'string')
        throw new Error('non-web hash');
    return name;
}
/** WebCrypto SHA1 (RFC 3174) legacy hash function. It was cryptographically broken. */
// export const sha1: WebHash = createHash('SHA-1', 64, 20);
/**
 * WebCrypto SHA2-256 hash function from RFC 6234.
 * @param msg - message bytes to hash
 * @returns Promise resolving to digest bytes.
 * @example
 * Hash a message with WebCrypto SHA2-256.
 * ```ts
 * await sha256(new Uint8Array([97, 98, 99]));
 * ```
 */
const webcrypto_sha256 = /* @__PURE__ */ (/* unused pure expression or super */ null && (createWebHash('SHA-256', 64, 32)));
/**
 * WebCrypto SHA2-384 hash function from RFC 6234.
 * @param msg - message bytes to hash
 * @returns Promise resolving to digest bytes.
 * @example
 * Hash a message with WebCrypto SHA2-384.
 * ```ts
 * await sha384(new Uint8Array([97, 98, 99]));
 * ```
 */
const webcrypto_sha384 = /* @__PURE__ */ (/* unused pure expression or super */ null && (createWebHash('SHA-384', 128, 48)));
/**
 * WebCrypto SHA2-512 hash function from RFC 6234.
 * @param msg - message bytes to hash
 * @returns Promise resolving to digest bytes.
 * @example
 * Hash a message with WebCrypto SHA2-512.
 * ```ts
 * await sha512(new Uint8Array([97, 98, 99]));
 * ```
 */
const webcrypto_sha512 = /* @__PURE__ */ createWebHash('SHA-512', 128, 64);
/**
 * WebCrypto HMAC: RFC2104 message authentication code.
 * @param hash - function that would be used e.g. sha256. Webcrypto version.
 * @param key - authentication key bytes
 * @param message - message bytes to authenticate
 * @returns Promise resolving to authentication tag bytes.
 * `.create()` exists only to mirror the synchronous API surface
 * and always throws `not implemented`.
 * @example
 * Compute an RFC 2104 HMAC with WebCrypto.
 * ```ts
 * import { hmac, sha256 } from '@noble/hashes/webcrypto.js';
 * const key = new Uint8Array([1, 2, 3]);
 * const message = new Uint8Array([4, 5, 6]);
 * const mac = await hmac(sha256, key, message);
 * ```
 */
const hmac = /* @__PURE__ */ (/* unused pure expression or super */ null && ((() => {
    const hmac_ = async (hash, key, message) => {
        const crypto = _subtle();
        abytes(key, undefined, 'key');
        abytes(message, undefined, 'message');
        const hashName = ahashWeb(hash);
        // importKey() snapshots key synchronously, but message is not passed to sign() until after
        // importKey() resolves. Keep the wrapper's inputs stable across that await.
        const _message = copyBytes(message);
        try {
            // WebCrypto keys can't be zeroized
            // prettier-ignore
            const wkey = await crypto.importKey('raw', key, { name: 'HMAC', hash: hashName }, false, ['sign']);
            return new Uint8Array(await crypto.sign('HMAC', wkey, _message));
        }
        finally {
            clean(_message);
        }
    };
    hmac_.create = (_hash, _key) => {
        throw new Error('not implemented');
    };
    return hmac_;
})()));
/**
 * WebCrypto HKDF (RFC 5869): derive keys from an initial input.
 * Combines hkdf_extract + hkdf_expand in one step
 * @param hash - hash function that would be used (e.g. sha256). Webcrypto version.
 * @param ikm - input keying material, the initial key
 * @param salt - optional salt value (a non-secret random value)
 * @param info - optional context and application specific information bytes
 * @param length - length of output keying material in bytes.
 *   RFC 5869 §2.3 allows `0..255*HashLen`, so `0` requests an empty OKM.
 * @returns Promise resolving to derived key bytes.
 * The RFC `L <= 255 * HashLen` bound is enforced before calling WebCrypto.
 * @throws If the current runtime does not provide `crypto.subtle`. {@link Error}
 * @example
 * WebCrypto HKDF (RFC 5869): derive keys from an initial input.
 * ```ts
 * import { hkdf, sha256 } from '@noble/hashes/webcrypto.js';
 * import { randomBytes, utf8ToBytes } from '@noble/hashes/utils.js';
 * const inputKey = randomBytes(32);
 * const salt = randomBytes(32);
 * const info = utf8ToBytes('application-key');
 * const okm = await hkdf(sha256, inputKey, salt, info, 32);
 * ```
 */
async function hkdf(hash, ikm, salt, info, length) {
    const crypto = _subtle();
    const hashName = ahashWeb(hash);
    const hashOutputLen = hash.outputLen;
    abytes(ikm, undefined, 'ikm');
    anumber(length, 'length');
    if (length > 255 * hashOutputLen)
        throw new Error('Length must be <= 255*HashLen');
    if (salt !== undefined)
        abytes(salt, undefined, 'salt');
    if (info !== undefined)
        abytes(info, undefined, 'info');
    // salt and info reach deriveBits() only after importKey() resolves, so snapshot them now.
    const _salt = salt === undefined ? new Uint8Array(0) : copyBytes(salt);
    const _info = info === undefined ? new Uint8Array(0) : copyBytes(info);
    try {
        const wkey = await crypto.importKey('raw', ikm, 'HKDF', false, ['deriveBits']);
        const opts = { name: 'HKDF', hash: hashName, salt: _salt, info: _info };
        const out = new Uint8Array(await crypto.deriveBits(opts, wkey, 8 * length));
        if (out.length !== length) {
            clean(out);
            throw new Error('WebCrypto returned an invalid derived key length');
        }
        return out;
    }
    finally {
        clean(_salt, _info);
    }
}
/**
 * WebCrypto PBKDF2-HMAC: RFC 8018 key derivation function.
 * @param hash - hash function that would be used e.g. sha256. Webcrypto version.
 * @param password - password from which a derived key is generated; string
 *   inputs are normalized through `kdfInputToBytes()`, i.e. UTF-8
 * @param salt - cryptographic salt; string inputs are normalized through
 *   `kdfInputToBytes()`, i.e. UTF-8
 * @param opts - PBKDF2 work factor and output settings. `dkLen`, if provided,
 *   must be `>= 1` per RFC 8018 §5.2. See {@link Pbkdf2Opt}.
 * @returns Promise resolving to derived key bytes.
 * Positive-iteration enforcement is currently delegated to backend
 * `deriveBits()` rejection (for example `c = 0`), not a dedicated
 * library-side guard. Values above the signed 32-bit backend range are rejected locally.
 * @throws If the current runtime does not provide `crypto.subtle`. {@link Error}
 * @example
 * WebCrypto PBKDF2-HMAC: RFC 2898 key derivation function.
 * ```ts
 * import { pbkdf2, sha256 } from '@noble/hashes/webcrypto.js';
 * const key = await pbkdf2(sha256, 'password', 'salt', { dkLen: 32, c: Math.pow(2, 18) });
 * ```
 */
async function webcrypto_pbkdf2(hash, password, salt, opts) {
    const crypto = _subtle();
    const hashName = ahashWeb(hash);
    const _opts = utils_checkOpts({ dkLen: 32 }, opts);
    const { c, dkLen } = _opts;
    utils_anumber(c, 'c');
    utils_anumber(dkLen, 'dkLen');
    // Node's native WebCrypto PBKDF2 binding accepts only a signed 32-bit iteration count and aborts
    // the process on larger values instead of returning a rejected promise.
    if (c > 0x7fffffff)
        throw new Error('"c" exceeds WebCrypto backend limit');
    // RFC 8018 §5.2 defines dkLen as a positive integer.
    if (dkLen < 1)
        throw new Error('"dkLen" must be >= 1');
    // SubtleCrypto.deriveBits() accepts an unsigned-long bit count. Byte lengths at or above
    // 2^29 would wrap after multiplication by eight instead of requesting the intended length.
    if (dkLen >= 2 ** 29)
        throw new Error('derived key too long');
    const _password = kdfInputToBytes(password, 'password');
    try {
        const saltBytes = kdfInputToBytes(salt, 'salt');
        // String conversion already returns an owned array. Caller-owned byte salts need a snapshot
        // because deriveBits() does not receive them until after importKey() resolves.
        const _salt = typeof salt === 'string' ? saltBytes : utils_copyBytes(saltBytes);
        try {
            const key = await crypto.importKey('raw', _password, 'PBKDF2', false, [
                'deriveBits',
            ]);
            const deriveOpts = { name: 'PBKDF2', salt: _salt, iterations: c, hash: hashName };
            const out = new Uint8Array(await crypto.deriveBits(deriveOpts, key, 8 * dkLen));
            if (out.length !== dkLen) {
                utils_clean(out);
                throw new Error('WebCrypto returned an invalid derived key length');
            }
            return out;
        }
        finally {
            utils_clean(_salt);
        }
    }
    finally {
        if (typeof password === 'string')
            utils_clean(_password);
    }
}

;// ./node_modules/@scure/bip39/index.js
/*! scure-bip39 - MIT License (c) 2022 Patricio Palladino, Paul Miller (paulmillr.com) */




// Japanese wordlist
// The canonical BIP-39 Japanese wordlist starts with あいこくしん.
// Use that sentinel so generated phrases use U+3000 ideographic spaces.
const isJapanese = (wordlist) => wordlist[0] === '\u3042\u3044\u3053\u304f\u3057\u3093';
// JavaScript strings can contain unpaired UTF-16 surrogates, which cannot be encoded as UTF-8.
function isWellFormedUnicode(value) {
    for (let i = 0; i < value.length; i++) {
        const current = value.charCodeAt(i);
        if (current >= 0xd800 && current <= 0xdbff) {
            if (i + 1 >= value.length)
                return false;
            const next = value.charCodeAt(++i);
            if (next < 0xdc00 || next > 0xdfff)
                return false;
        }
        else if (current >= 0xdc00 && current <= 0xdfff) {
            return false;
        }
    }
    return true;
}
// Normalization replaces equivalent sequences of characters
// so that any two texts that are equivalent will be reduced
// to the same sequence of code points, called the normal form of the original text.
// https://tonsky.me/blog/unicode/#why-is-a----
// BIP-39 requires UTF-8 NFKD for localized wordlists and mnemonic sentences.
// It also applies NFKD to the "mnemonic" + passphrase salt.
function nfkd(str) {
    if (typeof str !== 'string')
        throw new TypeError('invalid mnemonic type: ' + typeof str);
    if (!isWellFormedUnicode(str))
        throw new TypeError('expected well-formed Unicode string');
    return str.normalize('NFKD');
}
// BIP-39 mnemonics are consumed in NFKD form.
// They must contain 12, 15, 18, 21, or 24 words before checksum validation.
function normalize(str) {
    const norm = nfkd(str);
    const words = norm.split(' ');
    if (![12, 15, 18, 21, 24].includes(words.length))
        throw new Error('Invalid mnemonic');
    return { nfkd: norm, words };
}
// BIP-39 entropy payloads are 128-256 bits in 32-bit increments, i.e. 16/20/24/28/32 bytes.
function aentropy(ent) {
    utils_abytes(ent);
    if (![16, 20, 24, 28, 32].includes(ent.length))
        throw new RangeError('invalid entropy length');
}
/**
 * Generate x random words. Uses Cryptographically-Secure Random Number Generator.
 * @param wordlist - Imported wordlist for a specific language.
 * @param strength - Mnemonic strength, from 128 to 256 bits.
 * @returns 12-24 word mnemonic phrase.
 * @throws On wrong argument types. {@link TypeError}
 * @throws On wrong argument ranges or values. {@link RangeError}
 * @example
 * Generate a new English mnemonic.
 * ```ts
 * import { generateMnemonic } from '@scure/bip39';
 * import { wordlist } from '@scure/bip39/wordlists/english.js';
 * const mnemonic = generateMnemonic(wordlist, 128);
 * // 'legal winner thank year wave sausage worth useful legal winner thank yellow'
 * ```
 */
function generateMnemonic(wordlist, strength = 128) {
    utils_anumber(strength);
    if (strength % 32 !== 0 || strength > 256)
        throw new RangeError('Invalid entropy');
    return entropyToMnemonic(utils_randomBytes(strength / 8), wordlist);
}
// BIP-39 checksum is the first ENT/32 bits of SHA-256(entropy).
// Returned as a byte with checksum bits on the left and zeroes on the right.
const calcChecksum = (entropy) => {
    // Checksum is ent.length/4 bits long
    const bitsLeft = 8 - entropy.length / 4;
    // Zero rightmost "bitsLeft" bits in byte
    // For example: bitsLeft=4 val=10111101 -> 10110000
    return (sha2_sha256(entropy)[0] >> bitsLeft) << bitsLeft;
};
function awordlist(wordlist) {
    if (!Array.isArray(wordlist) || wordlist.length !== 2048 || typeof wordlist[0] !== 'string')
        throw new TypeError('Wordlist: expected array of 2048 strings');
    wordlist.forEach((i) => {
        if (typeof i !== 'string')
            throw new TypeError('wordlist: non-string element: ' + i);
        // Wordlists become mnemonic output, so apply the same lossless UTF-8 boundary as input phrases.
        if (!isWellFormedUnicode(i))
            throw new TypeError('wordlist: expected well-formed Unicode string');
    });
}
// BIP-39 appends checksum bits to entropy,
// then splits the bitstream into 11-bit indexes for a 2048-word list.
function encodeWords(entropy, wordlist) {
    awordlist(wordlist);
    const bytes = new Uint8Array(entropy.length + 1); // entropy || checksum byte
    bytes.set(entropy);
    bytes[entropy.length] = calcChecksum(entropy);
    const words = [];
    let carry = 0; // bit accumulator, holds < 19 bits
    let bits = 0;
    for (const byte of bytes) {
        carry = (carry << 8) | byte;
        bits += 8;
        if (bits >= 11) {
            bits -= 11;
            words.push(wordlist[(carry >>> bits) & 0x7ff]);
            carry &= (1 << bits) - 1;
        }
    }
    // Bits still in carry are the zero right bits of the checksum byte; drop them.
    return words;
}
// Reverse of encodeWords: repacks 11-bit indexes into bytes and verifies checksum.
function decodeWords(words, wordlist) {
    awordlist(wordlist);
    const entLen = (words.length / 3) * 4; // every 3 words hold 32 entropy bits + 1 checksum bit
    const bytes = new Uint8Array(entLen + 1); // entropy || checksum byte
    let carry = 0; // bit accumulator, holds < 19 bits
    let bits = 0;
    let pos = 0;
    for (const word of words) {
        const index = wordlist.indexOf(word);
        if (index === -1)
            throw new Error('Unknown word: ' + word);
        carry = (carry << 11) | index;
        bits += 11;
        while (bits >= 8) {
            bits -= 8;
            bytes[pos++] = (carry >>> bits) & 0xff;
        }
        carry &= (1 << bits) - 1;
    }
    // Left-align leftover checksum bits, matching calcChecksum output.
    if (bits > 0)
        bytes[pos] = carry << (8 - bits);
    const entropy = bytes.subarray(0, entLen);
    if (bytes[entLen] !== calcChecksum(entropy))
        throw new Error('Invalid checksum');
    return Uint8Array.from(entropy);
}
/**
 * Reversible: Converts mnemonic string to raw entropy in form of byte array.
 * @param mnemonic - 12-24 words.
 * @param wordlist - Imported wordlist for a specific language.
 * @returns Raw entropy bytes.
 * @throws If the mnemonic shape or checksum is invalid. {@link Error}
 * @throws On wrong argument types. {@link TypeError}
 * @throws On wrong argument ranges or values. {@link RangeError}
 * @example
 * Decode a mnemonic back into its original entropy bytes.
 * ```ts
 * import { mnemonicToEntropy } from '@scure/bip39';
 * import { wordlist } from '@scure/bip39/wordlists/english.js';
 * const mnem = 'legal winner thank year wave sausage worth useful legal winner thank yellow';
 * const entropy = mnemonicToEntropy(mnem, wordlist);
 * // Produces the original 16-byte entropy payload.
 * new Uint8Array([
 *   0x7f, 0x7f, 0x7f, 0x7f, 0x7f, 0x7f, 0x7f, 0x7f,
 *   0x7f, 0x7f, 0x7f, 0x7f, 0x7f, 0x7f, 0x7f, 0x7f
 * ])
 * ```
 */
function mnemonicToEntropy(mnemonic, wordlist) {
    const { words } = normalize(mnemonic);
    const entropy = decodeWords(words, wordlist);
    aentropy(entropy);
    return entropy;
}
/**
 * Reversible: Converts raw entropy in form of byte array to mnemonic string.
 * @param entropy - Byte array.
 * @param wordlist - Imported wordlist for a specific language.
 * @returns 12-24 words.
 * @throws On wrong argument types. {@link TypeError}
 * @throws On wrong argument ranges or values. {@link RangeError}
 * @example
 * Convert raw entropy into an English mnemonic.
 * ```ts
 * import { entropyToMnemonic } from '@scure/bip39';
 * import { wordlist } from '@scure/bip39/wordlists/english.js';
 * const ent = new Uint8Array([
 *   0x7f, 0x7f, 0x7f, 0x7f, 0x7f, 0x7f, 0x7f, 0x7f,
 *   0x7f, 0x7f, 0x7f, 0x7f, 0x7f, 0x7f, 0x7f, 0x7f
 * ]);
 * const mnemonic = entropyToMnemonic(ent, wordlist);
 * // 'legal winner thank year wave sausage worth useful legal winner thank yellow'
 * ```
 */
function entropyToMnemonic(entropy, wordlist) {
    aentropy(entropy);
    const words = encodeWords(entropy, wordlist);
    return words.join(isJapanese(wordlist) ? '\u3000' : ' ');
}
/**
 * Validates mnemonic for being 12-24 words contained in `wordlist`.
 * @param mnemonic - 12-24 words.
 * @param wordlist - Imported wordlist for a specific language.
 * @returns `true` when mnemonic checksum and words are valid.
 * @example
 * Validate one English mnemonic.
 * ```ts
 * import { validateMnemonic } from '@scure/bip39';
 * import { wordlist } from '@scure/bip39/wordlists/english.js';
 * const ok = validateMnemonic(
 *   'legal winner thank year wave sausage worth useful legal winner thank yellow',
 *   wordlist
 * );
 * // => true
 * ```
 */
function validateMnemonic(mnemonic, wordlist) {
    try {
        mnemonicToEntropy(mnemonic, wordlist);
    }
    catch (e) {
        return false;
    }
    return true;
}
// BIP-39 salts PBKDF2 with the UTF-8 NFKD string "mnemonic" + passphrase.
const psalt = (passphrase) => {
    if (typeof passphrase !== 'string')
        throw new TypeError('invalid passphrase type: ' + typeof passphrase);
    return nfkd('mnemonic' + passphrase);
};
/**
 * Irreversible: Uses KDF to derive 64 bytes of key data from mnemonic + optional password.
 * @param mnemonic - 12-24 words.
 * @param passphrase - String that will additionally protect the key.
 * @returns 64 bytes of key data.
 * @throws If the mnemonic shape is invalid. {@link Error}
 * @throws On wrong argument types. {@link TypeError}
 * @example
 * Derive a seed from a mnemonic with the async PBKDF2 helper.
 * ```ts
 * const mnem = 'legal winner thank year wave sausage worth useful legal winner thank yellow';
 * const seed = await mnemonicToSeed(mnem, 'password');
 * // => new Uint8Array([...64 bytes])
 * ```
 */
// BIP-39 seed derivation is independent from mnemonic generation.
// These helpers normalize the phrase but do not verify checksum or wordlist membership.
function mnemonicToSeed(mnemonic, passphrase = '') {
    return pbkdf2Async(sha2_sha512, normalize(mnemonic).nfkd, psalt(passphrase), {
        c: 2048,
        dkLen: 64,
    });
}
/**
 * Irreversible: Uses KDF to derive 64 bytes of key data from mnemonic + optional password.
 * @param mnemonic - 12-24 words.
 * @param passphrase - String that will additionally protect the key.
 * @returns 64 bytes of key data.
 * @throws If the mnemonic shape is invalid. {@link Error}
 * @throws On wrong argument types. {@link TypeError}
 * @example
 * Derive a seed from a mnemonic with the sync PBKDF2 helper.
 * ```ts
 * const mnem = 'legal winner thank year wave sausage worth useful legal winner thank yellow';
 * const seed = mnemonicToSeedSync(mnem, 'password');
 * // => new Uint8Array([...64 bytes])
 * ```
 */
function mnemonicToSeedSync(mnemonic, passphrase = '') {
    return pbkdf2(sha2_sha512, normalize(mnemonic).nfkd, psalt(passphrase), {
        c: 2048,
        dkLen: 64,
    });
}
/**
 * Uses native, built-in functionality, provided by globalThis.crypto.
 * Irreversible: Uses KDF to derive 64 bytes of key data from mnemonic + optional password.
 * @param mnemonic - 12-24 words.
 * @param passphrase - String that will additionally protect the key.
 * @returns 64 bytes of key data.
 * @throws If the mnemonic shape is invalid. {@link Error}
 * @throws On wrong argument types. {@link TypeError}
 * @example
 * Derive a seed with the native WebCrypto PBKDF2 helper.
 * ```ts
 * const mnem = 'legal winner thank year wave sausage worth useful legal winner thank yellow';
 * const seed = await mnemonicToSeedWebcrypto(mnem, 'password');
 * // => new Uint8Array([...64 bytes])
 * ```
 */
function mnemonicToSeedWebcrypto(mnemonic, passphrase = '') {
    return webcrypto_pbkdf2(webcrypto_sha512, normalize(mnemonic).nfkd, psalt(passphrase), {
        c: 2048,
        dkLen: 64,
    });
}

;// ./node_modules/@scure/bip39/wordlists/english.js
/** English BIP39 wordlist. */
const wordlist = /* @__PURE__ */ Object.freeze(`abandon
ability
able
about
above
absent
absorb
abstract
absurd
abuse
access
accident
account
accuse
achieve
acid
acoustic
acquire
across
act
action
actor
actress
actual
adapt
add
addict
address
adjust
admit
adult
advance
advice
aerobic
affair
afford
afraid
again
age
agent
agree
ahead
aim
air
airport
aisle
alarm
album
alcohol
alert
alien
all
alley
allow
almost
alone
alpha
already
also
alter
always
amateur
amazing
among
amount
amused
analyst
anchor
ancient
anger
angle
angry
animal
ankle
announce
annual
another
answer
antenna
antique
anxiety
any
apart
apology
appear
apple
approve
april
arch
arctic
area
arena
argue
arm
armed
armor
army
around
arrange
arrest
arrive
arrow
art
artefact
artist
artwork
ask
aspect
assault
asset
assist
assume
asthma
athlete
atom
attack
attend
attitude
attract
auction
audit
august
aunt
author
auto
autumn
average
avocado
avoid
awake
aware
away
awesome
awful
awkward
axis
baby
bachelor
bacon
badge
bag
balance
balcony
ball
bamboo
banana
banner
bar
barely
bargain
barrel
base
basic
basket
battle
beach
bean
beauty
because
become
beef
before
begin
behave
behind
believe
below
belt
bench
benefit
best
betray
better
between
beyond
bicycle
bid
bike
bind
biology
bird
birth
bitter
black
blade
blame
blanket
blast
bleak
bless
blind
blood
blossom
blouse
blue
blur
blush
board
boat
body
boil
bomb
bone
bonus
book
boost
border
boring
borrow
boss
bottom
bounce
box
boy
bracket
brain
brand
brass
brave
bread
breeze
brick
bridge
brief
bright
bring
brisk
broccoli
broken
bronze
broom
brother
brown
brush
bubble
buddy
budget
buffalo
build
bulb
bulk
bullet
bundle
bunker
burden
burger
burst
bus
business
busy
butter
buyer
buzz
cabbage
cabin
cable
cactus
cage
cake
call
calm
camera
camp
can
canal
cancel
candy
cannon
canoe
canvas
canyon
capable
capital
captain
car
carbon
card
cargo
carpet
carry
cart
case
cash
casino
castle
casual
cat
catalog
catch
category
cattle
caught
cause
caution
cave
ceiling
celery
cement
census
century
cereal
certain
chair
chalk
champion
change
chaos
chapter
charge
chase
chat
cheap
check
cheese
chef
cherry
chest
chicken
chief
child
chimney
choice
choose
chronic
chuckle
chunk
churn
cigar
cinnamon
circle
citizen
city
civil
claim
clap
clarify
claw
clay
clean
clerk
clever
click
client
cliff
climb
clinic
clip
clock
clog
close
cloth
cloud
clown
club
clump
cluster
clutch
coach
coast
coconut
code
coffee
coil
coin
collect
color
column
combine
come
comfort
comic
common
company
concert
conduct
confirm
congress
connect
consider
control
convince
cook
cool
copper
copy
coral
core
corn
correct
cost
cotton
couch
country
couple
course
cousin
cover
coyote
crack
cradle
craft
cram
crane
crash
crater
crawl
crazy
cream
credit
creek
crew
cricket
crime
crisp
critic
crop
cross
crouch
crowd
crucial
cruel
cruise
crumble
crunch
crush
cry
crystal
cube
culture
cup
cupboard
curious
current
curtain
curve
cushion
custom
cute
cycle
dad
damage
damp
dance
danger
daring
dash
daughter
dawn
day
deal
debate
debris
decade
december
decide
decline
decorate
decrease
deer
defense
define
defy
degree
delay
deliver
demand
demise
denial
dentist
deny
depart
depend
deposit
depth
deputy
derive
describe
desert
design
desk
despair
destroy
detail
detect
develop
device
devote
diagram
dial
diamond
diary
dice
diesel
diet
differ
digital
dignity
dilemma
dinner
dinosaur
direct
dirt
disagree
discover
disease
dish
dismiss
disorder
display
distance
divert
divide
divorce
dizzy
doctor
document
dog
doll
dolphin
domain
donate
donkey
donor
door
dose
double
dove
draft
dragon
drama
drastic
draw
dream
dress
drift
drill
drink
drip
drive
drop
drum
dry
duck
dumb
dune
during
dust
dutch
duty
dwarf
dynamic
eager
eagle
early
earn
earth
easily
east
easy
echo
ecology
economy
edge
edit
educate
effort
egg
eight
either
elbow
elder
electric
elegant
element
elephant
elevator
elite
else
embark
embody
embrace
emerge
emotion
employ
empower
empty
enable
enact
end
endless
endorse
enemy
energy
enforce
engage
engine
enhance
enjoy
enlist
enough
enrich
enroll
ensure
enter
entire
entry
envelope
episode
equal
equip
era
erase
erode
erosion
error
erupt
escape
essay
essence
estate
eternal
ethics
evidence
evil
evoke
evolve
exact
example
excess
exchange
excite
exclude
excuse
execute
exercise
exhaust
exhibit
exile
exist
exit
exotic
expand
expect
expire
explain
expose
express
extend
extra
eye
eyebrow
fabric
face
faculty
fade
faint
faith
fall
false
fame
family
famous
fan
fancy
fantasy
farm
fashion
fat
fatal
father
fatigue
fault
favorite
feature
february
federal
fee
feed
feel
female
fence
festival
fetch
fever
few
fiber
fiction
field
figure
file
film
filter
final
find
fine
finger
finish
fire
firm
first
fiscal
fish
fit
fitness
fix
flag
flame
flash
flat
flavor
flee
flight
flip
float
flock
floor
flower
fluid
flush
fly
foam
focus
fog
foil
fold
follow
food
foot
force
forest
forget
fork
fortune
forum
forward
fossil
foster
found
fox
fragile
frame
frequent
fresh
friend
fringe
frog
front
frost
frown
frozen
fruit
fuel
fun
funny
furnace
fury
future
gadget
gain
galaxy
gallery
game
gap
garage
garbage
garden
garlic
garment
gas
gasp
gate
gather
gauge
gaze
general
genius
genre
gentle
genuine
gesture
ghost
giant
gift
giggle
ginger
giraffe
girl
give
glad
glance
glare
glass
glide
glimpse
globe
gloom
glory
glove
glow
glue
goat
goddess
gold
good
goose
gorilla
gospel
gossip
govern
gown
grab
grace
grain
grant
grape
grass
gravity
great
green
grid
grief
grit
grocery
group
grow
grunt
guard
guess
guide
guilt
guitar
gun
gym
habit
hair
half
hammer
hamster
hand
happy
harbor
hard
harsh
harvest
hat
have
hawk
hazard
head
health
heart
heavy
hedgehog
height
hello
helmet
help
hen
hero
hidden
high
hill
hint
hip
hire
history
hobby
hockey
hold
hole
holiday
hollow
home
honey
hood
hope
horn
horror
horse
hospital
host
hotel
hour
hover
hub
huge
human
humble
humor
hundred
hungry
hunt
hurdle
hurry
hurt
husband
hybrid
ice
icon
idea
identify
idle
ignore
ill
illegal
illness
image
imitate
immense
immune
impact
impose
improve
impulse
inch
include
income
increase
index
indicate
indoor
industry
infant
inflict
inform
inhale
inherit
initial
inject
injury
inmate
inner
innocent
input
inquiry
insane
insect
inside
inspire
install
intact
interest
into
invest
invite
involve
iron
island
isolate
issue
item
ivory
jacket
jaguar
jar
jazz
jealous
jeans
jelly
jewel
job
join
joke
journey
joy
judge
juice
jump
jungle
junior
junk
just
kangaroo
keen
keep
ketchup
key
kick
kid
kidney
kind
kingdom
kiss
kit
kitchen
kite
kitten
kiwi
knee
knife
knock
know
lab
label
labor
ladder
lady
lake
lamp
language
laptop
large
later
latin
laugh
laundry
lava
law
lawn
lawsuit
layer
lazy
leader
leaf
learn
leave
lecture
left
leg
legal
legend
leisure
lemon
lend
length
lens
leopard
lesson
letter
level
liar
liberty
library
license
life
lift
light
like
limb
limit
link
lion
liquid
list
little
live
lizard
load
loan
lobster
local
lock
logic
lonely
long
loop
lottery
loud
lounge
love
loyal
lucky
luggage
lumber
lunar
lunch
luxury
lyrics
machine
mad
magic
magnet
maid
mail
main
major
make
mammal
man
manage
mandate
mango
mansion
manual
maple
marble
march
margin
marine
market
marriage
mask
mass
master
match
material
math
matrix
matter
maximum
maze
meadow
mean
measure
meat
mechanic
medal
media
melody
melt
member
memory
mention
menu
mercy
merge
merit
merry
mesh
message
metal
method
middle
midnight
milk
million
mimic
mind
minimum
minor
minute
miracle
mirror
misery
miss
mistake
mix
mixed
mixture
mobile
model
modify
mom
moment
monitor
monkey
monster
month
moon
moral
more
morning
mosquito
mother
motion
motor
mountain
mouse
move
movie
much
muffin
mule
multiply
muscle
museum
mushroom
music
must
mutual
myself
mystery
myth
naive
name
napkin
narrow
nasty
nation
nature
near
neck
need
negative
neglect
neither
nephew
nerve
nest
net
network
neutral
never
news
next
nice
night
noble
noise
nominee
noodle
normal
north
nose
notable
note
nothing
notice
novel
now
nuclear
number
nurse
nut
oak
obey
object
oblige
obscure
observe
obtain
obvious
occur
ocean
october
odor
off
offer
office
often
oil
okay
old
olive
olympic
omit
once
one
onion
online
only
open
opera
opinion
oppose
option
orange
orbit
orchard
order
ordinary
organ
orient
original
orphan
ostrich
other
outdoor
outer
output
outside
oval
oven
over
own
owner
oxygen
oyster
ozone
pact
paddle
page
pair
palace
palm
panda
panel
panic
panther
paper
parade
parent
park
parrot
party
pass
patch
path
patient
patrol
pattern
pause
pave
payment
peace
peanut
pear
peasant
pelican
pen
penalty
pencil
people
pepper
perfect
permit
person
pet
phone
photo
phrase
physical
piano
picnic
picture
piece
pig
pigeon
pill
pilot
pink
pioneer
pipe
pistol
pitch
pizza
place
planet
plastic
plate
play
please
pledge
pluck
plug
plunge
poem
poet
point
polar
pole
police
pond
pony
pool
popular
portion
position
possible
post
potato
pottery
poverty
powder
power
practice
praise
predict
prefer
prepare
present
pretty
prevent
price
pride
primary
print
priority
prison
private
prize
problem
process
produce
profit
program
project
promote
proof
property
prosper
protect
proud
provide
public
pudding
pull
pulp
pulse
pumpkin
punch
pupil
puppy
purchase
purity
purpose
purse
push
put
puzzle
pyramid
quality
quantum
quarter
question
quick
quit
quiz
quote
rabbit
raccoon
race
rack
radar
radio
rail
rain
raise
rally
ramp
ranch
random
range
rapid
rare
rate
rather
raven
raw
razor
ready
real
reason
rebel
rebuild
recall
receive
recipe
record
recycle
reduce
reflect
reform
refuse
region
regret
regular
reject
relax
release
relief
rely
remain
remember
remind
remove
render
renew
rent
reopen
repair
repeat
replace
report
require
rescue
resemble
resist
resource
response
result
retire
retreat
return
reunion
reveal
review
reward
rhythm
rib
ribbon
rice
rich
ride
ridge
rifle
right
rigid
ring
riot
ripple
risk
ritual
rival
river
road
roast
robot
robust
rocket
romance
roof
rookie
room
rose
rotate
rough
round
route
royal
rubber
rude
rug
rule
run
runway
rural
sad
saddle
sadness
safe
sail
salad
salmon
salon
salt
salute
same
sample
sand
satisfy
satoshi
sauce
sausage
save
say
scale
scan
scare
scatter
scene
scheme
school
science
scissors
scorpion
scout
scrap
screen
script
scrub
sea
search
season
seat
second
secret
section
security
seed
seek
segment
select
sell
seminar
senior
sense
sentence
series
service
session
settle
setup
seven
shadow
shaft
shallow
share
shed
shell
sheriff
shield
shift
shine
ship
shiver
shock
shoe
shoot
shop
short
shoulder
shove
shrimp
shrug
shuffle
shy
sibling
sick
side
siege
sight
sign
silent
silk
silly
silver
similar
simple
since
sing
siren
sister
situate
six
size
skate
sketch
ski
skill
skin
skirt
skull
slab
slam
sleep
slender
slice
slide
slight
slim
slogan
slot
slow
slush
small
smart
smile
smoke
smooth
snack
snake
snap
sniff
snow
soap
soccer
social
sock
soda
soft
solar
soldier
solid
solution
solve
someone
song
soon
sorry
sort
soul
sound
soup
source
south
space
spare
spatial
spawn
speak
special
speed
spell
spend
sphere
spice
spider
spike
spin
spirit
split
spoil
sponsor
spoon
sport
spot
spray
spread
spring
spy
square
squeeze
squirrel
stable
stadium
staff
stage
stairs
stamp
stand
start
state
stay
steak
steel
stem
step
stereo
stick
still
sting
stock
stomach
stone
stool
story
stove
strategy
street
strike
strong
struggle
student
stuff
stumble
style
subject
submit
subway
success
such
sudden
suffer
sugar
suggest
suit
summer
sun
sunny
sunset
super
supply
supreme
sure
surface
surge
surprise
surround
survey
suspect
sustain
swallow
swamp
swap
swarm
swear
sweet
swift
swim
swing
switch
sword
symbol
symptom
syrup
system
table
tackle
tag
tail
talent
talk
tank
tape
target
task
taste
tattoo
taxi
teach
team
tell
ten
tenant
tennis
tent
term
test
text
thank
that
theme
then
theory
there
they
thing
this
thought
three
thrive
throw
thumb
thunder
ticket
tide
tiger
tilt
timber
time
tiny
tip
tired
tissue
title
toast
tobacco
today
toddler
toe
together
toilet
token
tomato
tomorrow
tone
tongue
tonight
tool
tooth
top
topic
topple
torch
tornado
tortoise
toss
total
tourist
toward
tower
town
toy
track
trade
traffic
tragic
train
transfer
trap
trash
travel
tray
treat
tree
trend
trial
tribe
trick
trigger
trim
trip
trophy
trouble
truck
true
truly
trumpet
trust
truth
try
tube
tuition
tumble
tuna
tunnel
turkey
turn
turtle
twelve
twenty
twice
twin
twist
two
type
typical
ugly
umbrella
unable
unaware
uncle
uncover
under
undo
unfair
unfold
unhappy
uniform
unique
unit
universe
unknown
unlock
until
unusual
unveil
update
upgrade
uphold
upon
upper
upset
urban
urge
usage
use
used
useful
useless
usual
utility
vacant
vacuum
vague
valid
valley
valve
van
vanish
vapor
various
vast
vault
vehicle
velvet
vendor
venture
venue
verb
verify
version
very
vessel
veteran
viable
vibrant
vicious
victory
video
view
village
vintage
violin
virtual
virus
visa
visit
visual
vital
vivid
vocal
voice
void
volcano
volume
vote
voyage
wage
wagon
wait
walk
wall
walnut
want
warfare
warm
warrior
wash
wasp
waste
water
wave
way
wealth
weapon
wear
weasel
weather
web
wedding
weekend
weird
welcome
west
wet
whale
what
wheat
wheel
when
where
whip
whisper
wide
width
wife
wild
will
win
window
wine
wing
wink
winner
winter
wire
wisdom
wise
wish
witness
wolf
woman
wonder
wood
wool
word
work
world
worry
worth
wrap
wreck
wrestle
wrist
write
wrong
yard
year
yellow
you
young
youth
zebra
zero
zone
zoo`.split('\n'));

;// ./node_modules/@noble/curves/utils.js
/**
 * Hex, bytes and number utilities.
 * @module
 */
/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */

/**
 * Validates that a value is an array, optionally validating each element.
 * @param item - Value to validate.
 * @param title - Label included in thrown errors.
 * @param inner - Optional per-element validator, called with the element and its label.
 * @returns The validated array.
 * @example
 * Validate an array of points before batch processing.
 *
 * ```ts
 * aarray([1n, 2n], 'scalars');
 * ```
 */
function utils_aarray(item, title, inner = () => { }) {
    if (!Array.isArray(item))
        throw new TypeError(`"${title}" expected array, got type=${typeof item}`);
    for (let i = 0; i < item.length; i++)
        inner(item[i], `${title}[${i}]`);
    return item;
}
/**
 * Validates that a value is a byte array.
 * @param value - Value to validate.
 * @param length - Optional exact byte length.
 * @param title - Optional field name.
 * @returns Original byte array.
 * @example
 * Reject non-byte input before passing data into curve code.
 *
 * ```ts
 * abytes(new Uint8Array(1));
 * ```
 */
const curves_utils_abytes = (value, length, title) => utils_abytes(value, length, title);
/**
 * Validates that a value is a non-negative safe integer.
 * @param n - Value to validate.
 * @param title - Optional field name.
 * @returns The validated number.
 * @example
 * Validate a numeric length before allocating buffers.
 *
 * ```ts
 * anumber(1);
 * ```
 */
const curves_utils_anumber = utils_anumber;
/**
 * Asserts something is a string.
 * @param value - Value to validate.
 * @param title - Label included in thrown errors.
 * @returns The validated string.
 * @throws On wrong argument types. {@link TypeError}
 * @example
 * Validate a label string.
 *
 * ```ts
 * astring('example', 'label');
 * ```
 */
function astring(value, title = '') {
    if (typeof value !== 'string') {
        const prefix = title && `"${title}" `;
        throw new TypeError(prefix + 'expected string, got type=' + typeof value);
    }
    return value;
}
/**
 * Asserts something is a plain object-ish value, not null or array.
 * @param value - Value to validate.
 * @param title - Label included in thrown errors.
 * @returns The validated object.
 * @throws On wrong argument types. {@link TypeError}
 * @example
 * Validate an options object before checking fields.
 *
 * ```ts
 * aobject({ flag: true });
 * ```
 */
function utils_aobject(value, title = 'object') {
    if (value === null || typeof value !== 'object' || Array.isArray(value))
        throw new TypeError(title === 'object'
            ? 'expected valid options object'
            : `"${title}" expected object, got type=${typeof value}`);
    return value;
}
/**
 * Asserts something is a function.
 * @param value - Value to validate.
 * @param title - Label included in thrown errors.
 * @returns The validated function.
 * @throws On wrong argument types. {@link TypeError}
 * @example
 * Validate a required method before calling it.
 *
 * ```ts
 * afunction(() => true, 'predicate');
 * ```
 */
function afunction(value, title) {
    if (typeof value !== 'function')
        throw new TypeError(`"${title}" is invalid: expected function, got ${typeof value}`);
    return value;
}
/**
 * Encodes bytes as lowercase hex.
 * @param bytes - Bytes to encode.
 * @returns Lowercase hex string.
 * @example
 * Serialize bytes as hex for logging or fixtures.
 *
 * ```ts
 * bytesToHex(Uint8Array.of(1, 2, 3));
 * ```
 */
const utils_bytesToHex = bytesToHex;
/**
 * Concatenates byte arrays.
 * @param arrays - Byte arrays to join.
 * @returns Concatenated bytes.
 * @example
 * Join domain-separated chunks into one buffer.
 *
 * ```ts
 * concatBytes(Uint8Array.of(1), Uint8Array.of(2));
 * ```
 */
const curves_utils_concatBytes = (...arrays) => utils_concatBytes(...arrays);
/**
 * Decodes lowercase or uppercase hex into bytes.
 * @param hex - Hex string to decode.
 * @returns Decoded bytes.
 * @example
 * Parse fixture hex into bytes before hashing.
 *
 * ```ts
 * hexToBytes('0102');
 * ```
 */
const utils_hexToBytes = (hex) => hexToBytes(hex);
/**
 * Checks whether a value is a Uint8Array.
 * @param a - Value to inspect.
 * @returns `true` when `a` is a Uint8Array.
 * @example
 * Branch on byte input before decoding it.
 *
 * ```ts
 * isBytes(new Uint8Array(1));
 * ```
 */
const curves_utils_isBytes = utils_isBytes;
/**
 * Reads random bytes from the platform CSPRNG.
 * @param bytesLength - Number of random bytes to read.
 * @returns Fresh random bytes.
 * @example
 * Generate a random seed for a keypair.
 *
 * ```ts
 * randomBytes(2);
 * ```
 */
const curves_utils_randomBytes = (bytesLength) => utils_randomBytes(bytesLength);
const _0n = /* @__PURE__ */ BigInt(0);
const _1n = /* @__PURE__ */ BigInt(1);
// Shared error-message prefix builder. Only called on throw paths, so assert
// success paths never pay for the string concatenation.
const utils_atitle = (title) => (title ? `"${title}" ` : '');
/**
 * Validates that a flag is boolean.
 * @param value - Value to validate.
 * @param title - Optional field name.
 * @returns Original value.
 * @throws On wrong argument types. {@link TypeError}
 * @example
 * Reject non-boolean option flags early.
 *
 * ```ts
 * abool(true);
 * ```
 */
function utils_abool(value, title = '') {
    if (typeof value !== 'boolean')
        throw new TypeError(utils_atitle(title) + 'expected boolean, got type=' + typeof value);
    return value;
}
/**
 * Validates that a value is a non-negative bigint or safe integer.
 * @param n - Value to validate.
 * @returns The same validated value.
 * @throws On wrong argument ranges or values. {@link RangeError}
 * @example
 * Validate one integer-like value before serializing it.
 *
 * ```ts
 * abignumber(1n);
 * ```
 */
function abignumber(n) {
    if (typeof n === 'bigint') {
        if (!isPosBig(n))
            throw new RangeError('positive bigint expected, got ' + n);
    }
    else
        curves_utils_anumber(n);
    return n;
}
/**
 * Validates that a value is a safe integer.
 * @param value - Integer to validate.
 * @param title - Optional field name.
 * @throws On wrong argument types. {@link TypeError}
 * @throws On wrong argument ranges or values. {@link RangeError}
 * @example
 * Validate a window size before scalar arithmetic uses it.
 *
 * ```ts
 * asafenumber(1);
 * ```
 */
function utils_asafenumber(value, title = '') {
    if (typeof value !== 'number') {
        const prefix = title && `"${title}" `;
        throw new TypeError(prefix + 'expected number, got type=' + typeof value);
    }
    if (!Number.isSafeInteger(value)) {
        const prefix = title && `"${title}" `;
        throw new RangeError(prefix + 'expected safe integer, got ' + value);
    }
}
/**
 * Encodes a bigint into even-length big-endian hex.
 * The historical "unpadded" name only means "no fixed-width field padding"; odd-length hex still
 * gets one leading zero nibble so the result always represents whole bytes.
 * @param num - Number to encode.
 * @returns Big-endian hex string.
 * @throws On wrong argument ranges or values. {@link RangeError}
 * @example
 * Encode a scalar into hex without a `0x` prefix.
 *
 * ```ts
 * numberToHexUnpadded(255n);
 * ```
 */
function numberToHexUnpadded(num) {
    const hex = abignumber(num).toString(16);
    return hex.length & 1 ? '0' + hex : hex;
}
/**
 * Parses a big-endian hex string into bigint.
 * Accepts odd-length hex through the native `BigInt('0x' + hex)` parser and currently surfaces the
 * same native `SyntaxError` for malformed hex instead of wrapping it in a library-specific error.
 * @param hex - Hex string without `0x`.
 * @returns Parsed bigint value.
 * @throws On wrong argument types. {@link TypeError}
 * @example
 * Parse a scalar from fixture hex.
 *
 * ```ts
 * hexToNumber('ff');
 * ```
 */
function hexToNumber(hex) {
    if (typeof hex !== 'string')
        throw new TypeError('hex string expected, got ' + typeof hex);
    return hex === '' ? _0n : BigInt('0x' + hex); // Big Endian
}
// BE: Big Endian, LE: Little Endian
/**
 * Parses big-endian bytes into bigint.
 * @param bytes - Bytes in big-endian order.
 * @returns Parsed bigint value.
 * @throws On wrong argument types. {@link TypeError}
 * @example
 * Read a scalar encoded in network byte order.
 *
 * ```ts
 * bytesToNumberBE(Uint8Array.of(1, 0));
 * ```
 */
function utils_bytesToNumberBE(bytes) {
    return hexToNumber(bytesToHex(bytes));
}
/**
 * Parses little-endian bytes into bigint.
 * @param bytes - Bytes in little-endian order.
 * @returns Parsed bigint value.
 * @throws On wrong argument types. {@link TypeError}
 * @example
 * Read a scalar encoded in little-endian form.
 *
 * ```ts
 * bytesToNumberLE(Uint8Array.of(1, 0));
 * ```
 */
function bytesToNumberLE(bytes) {
    return hexToNumber(bytesToHex(curves_utils_copyBytes(utils_abytes(bytes)).reverse()));
}
/**
 * Encodes a bigint into fixed-length big-endian bytes.
 * @param n - Number to encode.
 * @param len - Output length in bytes. Must be greater than zero.
 * @returns Big-endian byte array.
 * @throws On wrong argument ranges or values. {@link RangeError}
 * @throws If a documented runtime validation or state check fails. {@link Error}
 * @example
 * Serialize a scalar into a 32-byte field element.
 *
 * ```ts
 * numberToBytesBE(255n, 2);
 * ```
 */
function numberToBytesBE(n, len) {
    utils_anumber(len);
    if (len === 0)
        throw new Error('zero output length is invalid');
    n = abignumber(n);
    const expectedLen = len * 2;
    const hex = n.toString(16);
    // Detect overflow before hex parsing so oversized values don't leak the shared odd-hex error.
    if (hex.length > expectedLen)
        throw new RangeError('number is too large');
    return hexToBytes(hex.padStart(expectedLen, '0'));
}
/**
 * Encodes a bigint into fixed-length little-endian bytes.
 * @param n - Number to encode.
 * @param len - Output length in bytes.
 * @returns Little-endian byte array.
 * @throws On wrong argument ranges or values. {@link RangeError}
 * @throws If a documented runtime validation or state check fails. {@link Error}
 * @example
 * Serialize a scalar for little-endian protocols.
 *
 * ```ts
 * numberToBytesLE(255n, 2);
 * ```
 */
function numberToBytesLE(n, len) {
    return numberToBytesBE(n, len).reverse();
}
// Unpadded, rarely used
/**
 * Encodes a bigint into variable-length big-endian bytes.
 * @param n - Number to encode.
 * @returns Variable-length big-endian bytes.
 * @throws On wrong argument ranges or values. {@link RangeError}
 * @example
 * Serialize a bigint without fixed-width padding.
 *
 * ```ts
 * numberToVarBytesBE(255n);
 * ```
 */
function numberToVarBytesBE(n) {
    return hexToBytes_(numberToHexUnpadded(abignumber(n)));
}
// Compares 2 u8a-s in kinda constant time
/**
 * Compares two byte arrays in constant-ish time.
 * @param a - Left byte array.
 * @param b - Right byte array.
 * @returns `true` when bytes match.
 * @example
 * Compare two encoded points without early exit.
 *
 * ```ts
 * equalBytes(Uint8Array.of(1), Uint8Array.of(1));
 * ```
 */
function equalBytes(a, b) {
    a = curves_utils_abytes(a);
    b = curves_utils_abytes(b);
    if (a.length !== b.length)
        return false;
    let diff = 0;
    for (let i = 0; i < a.length; i++)
        diff |= a[i] ^ b[i];
    return diff === 0;
}
/**
 * Copies Uint8Array. We can't use u8a.slice(), because u8a can be Buffer,
 * and Buffer#slice creates mutable copy. Never use Buffers!
 * @param bytes - Bytes to copy.
 * @returns Detached copy.
 * @example
 * Make an isolated copy before mutating serialized bytes.
 *
 * ```ts
 * copyBytes(Uint8Array.of(1, 2, 3));
 * ```
 */
function curves_utils_copyBytes(bytes) {
    // `Uint8Array.from(...)` would also accept arrays / other typed arrays. Keep this helper strict
    // because callers use it at byte-validation boundaries before mutating the detached copy.
    return Uint8Array.from(curves_utils_abytes(bytes));
}
/**
 * Decodes 7-bit ASCII string to Uint8Array, throws on non-ascii symbols
 * Should be safe to use for things expected to be ASCII.
 * Returns exact same result as `TextEncoder` for ASCII or throws.
 * @param ascii - ASCII input text.
 * @returns Encoded bytes.
 * @throws On wrong argument types. {@link TypeError}
 * @example
 * Encode an ASCII domain-separation tag.
 *
 * ```ts
 * asciiToBytes('ABC');
 * ```
 */
function utils_asciiToBytes(ascii) {
    if (typeof ascii !== 'string')
        throw new TypeError('ascii string expected, got ' + typeof ascii);
    return Uint8Array.from(ascii, (c, i) => {
        const charCode = c.charCodeAt(0);
        if (c.length !== 1 || charCode > 127) {
            throw new RangeError(`string contains non-ASCII character "${ascii[i]}" with code ${charCode} at position ${i}`);
        }
        return charCode;
    });
}
/**
 * Checks whether n is non-negative bigint. Historical name.
 * @param n - candidate value
 * @returns `true` when the value is bigint and 0 or larger
 * @example
 * Check a candidate scalar before range validation.
 *
 * ```ts
 * isPosBig(2n);
 * ```
 */
function isPosBig(n) {
    return typeof n === 'bigint' && _0n <= n;
}
/**
 * Checks whether a bigint lies inside a half-open range.
 * @param n - Candidate value.
 * @param min - Inclusive lower bound.
 * @param max - Exclusive upper bound.
 * @returns `true` when the value is inside the range.
 * @example
 * Check whether a candidate scalar fits the field order.
 *
 * ```ts
 * inRange(2n, 1n, 3n);
 * ```
 */
function inRange(n, min, max) {
    return isPosBig(n) && isPosBig(min) && isPosBig(max) && min <= n && n < max;
}
/**
 * Asserts `min <= n < max`. NOTE: upper bound is exclusive.
 * @param title - Value label for error messages.
 * @param n - Candidate value.
 * @param min - Inclusive lower bound.
 * @param max - Exclusive upper bound.
 * Wrong-type inputs are not separated from out-of-range values here: they still flow through the
 * shared `RangeError` path because this is only a throwing wrapper around `inRange(...)`.
 * @throws On wrong argument ranges or values. {@link RangeError}
 * @example
 * Assert that a bigint stays within one half-open range.
 *
 * ```ts
 * aInRange('x', 2n, 1n, 256n);
 * ```
 */
function aInRange(title, n, min, max) {
    // Why min <= n < max and not a (min < n < max) OR b (min <= n <= max)?
    // consider P=256n, min=0n, max=P
    // - a for min=0 would require -1:          `inRange('x', x, -1n, P)`
    // - b would commonly require subtraction:  `inRange('x', x, 0n, P - 1n)`
    // - our way is the cleanest:               `inRange('x', x, 0n, P)
    if (!inRange(n, min, max))
        throw new RangeError('expected valid ' + title + ': ' + min + ' <= n < ' + max + ', got ' + n);
}
// Bit operations
/**
 * Calculates amount of bits in a bigint.
 * Same as `n.toString(2).length`
 * TODO: merge with nLength in modular
 * @param n - Value to inspect.
 * @returns Bit length.
 * @throws If the value is negative. {@link Error}
 * @example
 * Measure the bit length of a scalar before serialization.
 *
 * ```ts
 * bitLen(8n);
 * ```
 */
function utils_bitLen(n) {
    // Size callers in this repo only use non-negative orders / scalars, so negative inputs are a
    // contract bug and must not silently collapse to zero bits.
    if (n < _0n)
        throw new Error('expected non-negative bigint, got ' + n);
    // Native radix conversion beats a shift loop at every size, and the loop is quadratic in bits.
    return n === _0n ? 0 : n.toString(2).length;
}
/**
 * Gets single bit at position.
 * NOTE: first bit position is 0 (same as arrays)
 * Same as `!!+Array.from(n.toString(2)).reverse()[pos]`
 * @param n - Source value.
 * @param pos - Bit position. Negative positions are passed through to raw
 *   bigint shift semantics; because the mask is built as `1n << pos`,
 *   they currently collapse to `0n` and make the helper a no-op.
 * @returns Bit as bigint.
 * @example
 * Gets single bit at position.
 *
 * ```ts
 * bitGet(5n, 0);
 * ```
 */
function bitGet(n, pos) {
    if (typeof n !== 'bigint')
        throw new TypeError('"n" expected bigint, got type=' + typeof n);
    utils_asafenumber(pos, 'pos');
    return (n >> BigInt(pos)) & _1n;
}
/**
 * Sets single bit at position.
 * @param n - Source value.
 * @param pos - Bit position. Negative positions are passed through to raw bigint shift semantics,
 *   so they currently behave like left shifts.
 * @param value - Whether the bit should be set.
 * @returns Updated bigint.
 * @example
 * Sets single bit at position.
 *
 * ```ts
 * bitSet(0n, 1, true);
 * ```
 */
function bitSet(n, pos, value) {
    if (typeof n !== 'bigint')
        throw new TypeError('"n" expected bigint, got type=' + typeof n);
    utils_asafenumber(pos, 'pos');
    utils_abool(value, 'value');
    const mask = _1n << BigInt(pos);
    // Clearing needs AND-not here; OR with zero leaves an already-set bit untouched.
    return value ? n | mask : n & ~mask;
}
/**
 * Calculate mask for N bits. Not using ** operator with bigints because of old engines.
 * Same as BigInt(`0b${Array(i).fill('1').join('')}`)
 * @param n - Number of bits. Negative widths are currently passed through to raw bigint shift
 *   semantics and therefore produce `-1n`.
 * @returns Bitmask value.
 * @example
 * Calculate mask for N bits.
 *
 * ```ts
 * bitMask(4);
 * ```
 */
const utils_bitMask = (n) => {
    utils_asafenumber(n, 'n');
    return (_1n << BigInt(n)) - _1n;
};
/**
 * Minimal HMAC-DRBG from NIST 800-90 for RFC6979 sigs.
 * @param hashLen - Hash output size in bytes. Callers are expected to pass a positive length; `0`
 *   is not rejected here and would make the internal generate loop non-progressing.
 * @param qByteLen - Requested output size in bytes. Callers are expected to pass a positive length.
 * @param hmacFn - HMAC implementation.
 * @returns Function that will call DRBG until the predicate returns anything
 *   other than `undefined`.
 * @throws On wrong argument types. {@link TypeError}
 * @example
 * Build a deterministic nonce generator for RFC6979-style signing.
 *
 * ```ts
 * import { createHmacDrbg } from '@noble/curves/utils.js';
 * import { hmac } from '@noble/hashes/hmac.js';
 * import { sha256 } from '@noble/hashes/sha2.js';
 * const hmacFn = (key: Uint8Array, msg: Uint8Array) => hmac(sha256, key, msg);
 * const drbg = createHmacDrbg(32, 32, hmacFn);
 * const seed = new Uint8Array(32);
 * drbg(seed, (bytes) => bytes);
 * ```
 */
function createHmacDrbg(hashLen, qByteLen, hmacFn) {
    utils_anumber(hashLen, 'hashLen');
    utils_anumber(qByteLen, 'qByteLen');
    if (typeof hmacFn !== 'function')
        throw new TypeError('hmacFn must be a function');
    // creates Uint8Array
    const u8n = (len) => new Uint8Array(len);
    const NULL = Uint8Array.of();
    const byte0 = Uint8Array.of(0x00);
    const byte1 = Uint8Array.of(0x01);
    const _maxDrbgIters = 1000;
    // Step B, Step C: set hashLen to 8*ceil(hlen/8).
    // Minimal non-full-spec HMAC-DRBG from NIST 800-90 for RFC6979 signatures.
    let v = u8n(hashLen);
    // Steps B and C of RFC6979 3.2.
    let k = u8n(hashLen);
    let i = 0; // Iterations counter, will throw when over 1000
    const reset = () => {
        v.fill(1);
        k.fill(0);
        i = 0;
    };
    // hmac(k)(v, ...values)
    const h = (...msgs) => hmacFn(k, curves_utils_concatBytes(v, ...msgs));
    const reseed = (seed = NULL) => {
        // HMAC-DRBG reseed() function. Steps D-G
        k = h(byte0, seed); // k = hmac(k || v || 0x00 || seed)
        v = h(); // v = hmac(k || v)
        if (seed.length === 0)
            return;
        k = h(byte1, seed); // k = hmac(k || v || 0x01 || seed)
        v = h(); // v = hmac(k || v)
    };
    const gen = () => {
        // HMAC-DRBG generate() function
        if (i++ >= _maxDrbgIters)
            throw new Error('drbg: tried max amount of iterations');
        let len = 0;
        const out = [];
        while (len < qByteLen) {
            v = h();
            const sl = v.slice();
            out.push(sl);
            len += v.length;
        }
        return curves_utils_concatBytes(...out);
    };
    const genUntil = (seed, pred) => {
        reset();
        reseed(seed); // Steps D-G
        let res = undefined; // Step H: grind until the predicate accepts a candidate.
        // Falsy values like 0 are valid outputs.
        while ((res = pred(gen())) === undefined)
            reseed();
        reset();
        return res;
    };
    return genUntil;
}
/**
 * Validates declared required and optional field types on a plain object.
 * Extra keys are intentionally ignored because many callers validate only the subset they use from
 * richer option bags or runtime objects.
 * This walks field schemas and formats detailed errors, so avoid it on hot paths; use direct
 * one-line guards such as `aobject()`, `afunction()`, `abool()`, or `asafenumber()` instead.
 * @param object - Object to validate.
 * @param fields - Required field types.
 * @param optFields - Optional field types.
 * @param title - Object label included in thrown errors.
 * @throws On wrong argument types. {@link TypeError}
 * @example
 * Check user options before building a curve helper.
 *
 * ```ts
 * validateObject({ flag: true }, { flag: 'boolean' });
 * ```
 */
function curves_utils_validateObject(object, fields = {}, optFields = {}, title = 'object') {
    utils_aobject(object, title);
    utils_aobject(fields, 'fields');
    utils_aobject(optFields, 'optFields');
    function checkField(fieldName, expectedType, isOpt) {
        const label = title === 'object' ? `param "${String(fieldName)}"` : `"${title}.${String(fieldName)}"`;
        // Config fields must be explicit own properties. Optional inherited values are rejected too
        // because callers keep reading the same options object after validation.
        const val = object[fieldName];
        // Runtime objects such as Field instances intentionally satisfy required method slots
        // via their shared prototype.
        if (!Object.hasOwn(object, fieldName) &&
            (isOpt ? val !== undefined : expectedType !== 'function')) {
            throw new TypeError(`${label} is invalid: expected own property`);
        }
        if (isOpt && val === undefined)
            return;
        const current = typeof val;
        if (current !== expectedType || val === null)
            throw new TypeError(`${label} is invalid: expected ${expectedType}, got ${current}`);
    }
    const iter = (f, isOpt) => Object.entries(f).forEach(([k, v]) => checkField(k, v, isOpt));
    iter(fields, false);
    iter(optFields, true);
}
/**
 * Throws not implemented error.
 * @returns Never returns.
 * @throws If the unfinished code path is reached. {@link Error}
 * @example
 * Surface the placeholder error from an unfinished code path.
 *
 * ```ts
 * try {
 *   notImplemented();
 * } catch {}
 * ```
 */
const notImplemented = () => {
    throw new Error('not implemented');
};

;// ./node_modules/@noble/curves/abstract/modular.js
/**
 * Utils for modular division and fields.
 * Field over 11 is a finite (Galois) field is integer number operations `mod 11`.
 * There is no division: it is replaced by modular multiplicative inverse.
 * @module
 */
/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */

// Numbers aren't used in x25519 / x448 builds
// prettier-ignore
const modular_0n = /* @__PURE__ */ BigInt(0), modular_1n = /* @__PURE__ */ BigInt(1), _2n = /* @__PURE__ */ BigInt(2);
// prettier-ignore
const _3n = /* @__PURE__ */ BigInt(3), _4n = /* @__PURE__ */ BigInt(4), _5n = /* @__PURE__ */ BigInt(5);
// prettier-ignore
const _7n = /* @__PURE__ */ BigInt(7), _8n = /* @__PURE__ */ BigInt(8), _9n = /* @__PURE__ */ BigInt(9);
const _15n = /* @__PURE__ */ BigInt(15), _16n = /* @__PURE__ */ BigInt(16);
// 2^64: exponents below this use plain square-and-multiply in pow()/FpPow(); the windowed path's
// table build (14 multiplications) only pays off for longer exponents (break-even ~50 bits).
const POW_WINDOWED_MIN = /* @__PURE__ */ BigInt('0x10000000000000000');
/**
 * @param a - Dividend value.
 * @param b - Positive modulus.
 * @returns Reduced value in `[0, b)` only when `b` is positive.
 * @throws If the modulus is not positive. {@link Error}
 * @example
 * Normalize a bigint into one field residue.
 *
 * ```ts
 * mod(-1n, 5n);
 * ```
 */
function modular_mod(a, b) {
    if (b <= modular_0n)
        throw new Error('mod: expected positive modulus, got ' + b);
    const result = a % b;
    return result >= modular_0n ? result : b + result;
}
/**
 * Efficiently raise num to a power with modular reduction.
 * Unsafe in some contexts: uses ladder, so can expose bigint bits.
 * Low-level helper: callers that need canonical residues must pass a valid `num` for the chosen
 * modulus instead of relying on the `power===0/1` fast paths to normalize it.
 * @param num - Base value.
 * @param power - Exponent value.
 * @param modulo - Reduction modulus.
 * @returns Modular exponentiation result.
 * @throws If the modulus or exponent is invalid. {@link Error}
 * @example
 * Raise one bigint to a modular power.
 *
 * ```ts
 * pow(2n, 6n, 11n) // 64n % 11n == 9n
 * ```
 */
function pow(num, power, modulo) {
    if (modulo <= modular_1n)
        throw new Error('pow: expected modulus > 1, got ' + modulo);
    // Non-bigint exponents coerce every comparison below to false and would silently return 1.
    if (typeof power !== 'bigint')
        throw new TypeError('invalid exponent: expected bigint, got ' + typeof power);
    if (power < modular_0n)
        throw new Error('invalid exponent, negatives unsupported');
    if (power === modular_0n)
        return modular_1n;
    if (power === modular_1n)
        return num;
    let d = num % modulo;
    if (d < modular_0n)
        d += modulo;
    // Control flow in both branches below depends only on the exponent, never on `num` — invertCt()
    // relies on that for its (public-exponent) secret-independence guarantee.
    if (power < POW_WINDOWED_MIN) {
        // Square-and-multiply: cheaper than the windowed path for short exponents.
        let p = modular_1n;
        while (power > modular_0n) {
            if (power & modular_1n)
                p = (p * d) % modulo;
            d = (d * d) % modulo;
            power >>= modular_1n;
        }
        return p;
    }
    // Fixed 4-bit windows, MSB-first: a 14-multiplication table drops per-window cost to <1
    // multiplication (vs ~2 per window for square-and-multiply), ~25-30% faster for the dense
    // 256-bit exponents of sqrt / Legendre / invertCt.
    const digits = [];
    while (power > modular_0n) {
        digits.push(Number(power & _15n));
        power >>= _4n;
    }
    const table = new Array(16);
    table[0] = modular_1n;
    table[1] = d;
    for (let i = 2; i < 16; i++)
        table[i] = (table[i - 1] * d) % modulo;
    let p = table[digits[digits.length - 1]]; // top digit is nonzero: the loop above stops on 0
    for (let w = digits.length - 2; w >= 0; w--) {
        p = (p * p) % modulo;
        p = (p * p) % modulo;
        p = (p * p) % modulo;
        p = (p * p) % modulo;
        const digit = digits[w];
        if (digit !== 0)
            p = (p * table[digit]) % modulo;
    }
    return p;
}
/**
 * Does `x^(2^power)` mod p. `pow2(30, 4)` == `30^(2^4)`.
 * Low-level helper: callers that need canonical residues must pass a valid `x` for the chosen
 * modulus; the `power===0` fast path intentionally returns the input unchanged.
 * @param x - Base value.
 * @param power - Number of squarings.
 * @param modulo - Reduction modulus.
 * @returns Repeated-squaring result.
 * @throws If the exponent is negative. {@link Error}
 * @example
 * Apply repeated squaring inside one field.
 *
 * ```ts
 * pow2(3n, 2n, 11n);
 * ```
 */
function modular_pow2(x, power, modulo) {
    if (modulo <= modular_1n)
        throw new Error('pow2: expected modulus > 1, got ' + modulo);
    if (power < modular_0n)
        throw new Error('pow2: expected non-negative exponent, got ' + power);
    let res = x;
    while (power-- > modular_0n) {
        res *= res;
        res %= modulo;
    }
    return res;
}
/**
 * Inverses number over modulo.
 * Implemented using the {@link https://brilliant.org/wiki/extended-euclidean-algorithm/ | extended Euclidean algorithm}.
 * @param number - Value to invert.
 * @param modulo - Modulus greater than 1.
 * @returns Multiplicative inverse.
 * @throws If the modulus is invalid or the inverse does not exist. {@link Error}
 * @example
 * Compute one modular inverse with the extended Euclidean algorithm.
 *
 * ```ts
 * invert(3n, 11n);
 * ```
 */
function invert(number, modulo) {
    if (number === modular_0n)
        throw new Error('invert: expected non-zero number');
    // modulo = 1 is the zero ring: gcd(x, 1) = 1 makes the loop below "succeed" and return the
    // useless inverse 0. Reject it like pow() and invertCt() do.
    if (modulo <= modular_1n)
        throw new Error('invert: expected modulus > 1, got ' + modulo);
    // This is variable-time: the loop count depends on `number`. For a secret-independent
    // (Fermat) alternative over a prime modulus, see {@link invertCt} (~4x slower).
    let a = modular_mod(number, modulo);
    let b = modulo;
    // Only the Bézout coefficient of `number` (x/u chain) is tracked; the coefficient of `modulo`
    // never affects the output, so it is not computed.
    // prettier-ignore
    let x = modular_0n, u = modular_1n;
    while (a !== modular_0n) {
        const q = b / a;
        const r = b - a * q;
        const m = x - u * q;
        // prettier-ignore
        b = a, a = r, x = u, u = m;
    }
    const gcd = b;
    if (gcd !== modular_1n)
        throw new Error('invert: does not exist');
    return modular_mod(x, modulo);
}
/**
 * Inverses number over modulo using Fermat's little theorem: `a^(p-2) ≡ a⁻¹ (mod p)`.
 *
 * Unlike {@link invert} (extended Euclidean), the exponent `p-2` is a public constant, so the
 * underlying square-and-multiply has the same control flow for every secret `a`: there is no
 * data-dependent branching or loop count that could leak `a` through timing (e.g. Minerva-style
 * ECDSA nonce-inversion attacks). This is only "algorithmically" constant-time — JS bigint
 * multiplication/reduction is still value-dependent — and it is roughly 4x slower than
 * {@link invert}.
 *
 * REQUIRES a prime modulus; Fermat's theorem does not hold otherwise. The result is verified to be
 * a real inverse, so a non-prime modulus (or a non-invertible input) fails closed with an error
 * instead of returning a wrong value.
 * @param a - Value to invert.
 * @param prime - Prime modulus.
 * @returns Multiplicative inverse in `[1, prime)`.
 * @throws If the modulus is below 2, the input reduces to zero, or the inverse does not exist.
 *   {@link Error}
 * @example
 * Compute one modular inverse without secret-dependent branching.
 *
 * ```ts
 * invertCt(3n, 11n); // 4n, since 3 * 4 = 12 ≡ 1 (mod 11)
 * ```
 */
function invertCt(a, prime) {
    if (prime <= modular_1n)
        throw new Error('invertCt: expected prime modulus > 1, got ' + prime);
    const an = modular_mod(a, prime);
    if (an === modular_0n)
        throw new Error('invertCt: expected non-zero number');
    // Exponent (prime - 2) is public, so FpPow's square-and-multiply is secret-independent.
    const inverse = pow(an, prime - _2n, prime);
    // O(1) safety net: verifies the inverse and rejects composite moduli where a^(p-2) is not one.
    if (modular_mod(an * inverse, prime) !== modular_1n)
        throw new Error('invertCt: does not exist');
    return inverse;
}
function assertIsSquare(Fp, root, n) {
    const F = Fp;
    if (!F.eql(F.sqr(root), n))
        throw new Error('Cannot find square root');
}
// The Legendre symbol and every sqrt variant here are only defined over an odd (prime) modulus.
// An even ORDER makes their integer divisions — (p-1)/2, (p+1)/4, (p-5)/8, (p+7)/16 — truncate and
// silently return a wrong result, so reject it explicitly at the entry points instead. This is a
// cheap necessary-condition check, not a primality test (composite odd moduli are caught later by
// the Legendre-result / assertIsSquare checks).
function aoddModulus(order, fnName) {
    if ((order & modular_1n) === modular_0n)
        throw new Error(fnName + ': expected odd modulus, got ' + order);
}
// Not all roots are possible! Example which will throw:
// const NUM =
// n = 72057594037927816n;
// Fp = Field(BigInt('0x1a0111ea397fe69a4b1ba7b6434bacd764774b84f38512bf6730d2a0f6b0f6241eabfffeb153ffffb9feffffffffaaab'));
function sqrt3mod4(Fp, n) {
    const F = Fp;
    const p1div4 = (F.ORDER + modular_1n) / _4n;
    const root = F.pow(n, p1div4);
    assertIsSquare(F, root, n);
    return root;
}
// Equivalent `q = 5 (mod 8)` square-root formula (Atkin-style), not the RFC Appendix I.2 CMOV
// pseudocode verbatim.
function sqrt5mod8(Fp, n) {
    const F = Fp;
    const p5div8 = (F.ORDER - _5n) / _8n;
    const n2 = F.mul(n, _2n);
    const v = F.pow(n2, p5div8);
    const nv = F.mul(n, v);
    const i = F.mul(F.mul(nv, _2n), v);
    const root = F.mul(nv, F.sub(i, F.ONE));
    assertIsSquare(F, root, n);
    return root;
}
// Based on RFC9380, Kong algorithm
// prettier-ignore
function sqrt9mod16(P) {
    const Fp_ = Field(P);
    const tn = tonelliShanks(P);
    const c1 = tn(Fp_, Fp_.neg(Fp_.ONE)); //  1. c1 = sqrt(-1) in F, i.e., (c1^2) == -1 in F
    const c2 = tn(Fp_, c1); //  2. c2 = sqrt(c1) in F, i.e., (c2^2) == c1 in F
    const c3 = tn(Fp_, Fp_.neg(c1)); //  3. c3 = sqrt(-c1) in F, i.e., (c3^2) == -c1 in F
    const c4 = (P + _7n) / _16n; //  4. c4 = (q + 7) / 16        # Integer arithmetic
    return ((Fp, n) => {
        const F = Fp;
        let tv1 = F.pow(n, c4); //  1. tv1 = x^c4
        let tv2 = F.mul(tv1, c1); //  2. tv2 = c1 * tv1
        const tv3 = F.mul(tv1, c2); //  3. tv3 = c2 * tv1
        const tv4 = F.mul(tv1, c3); //  4. tv4 = c3 * tv1
        const e1 = F.eql(F.sqr(tv2), n); //  5.  e1 = (tv2^2) == x
        const e2 = F.eql(F.sqr(tv3), n); //  6.  e2 = (tv3^2) == x
        tv1 = F.cmov(tv1, tv2, e1); //  7. tv1 = CMOV(tv1, tv2, e1)  # Select tv2 if (tv2^2) == x
        tv2 = F.cmov(tv4, tv3, e2); //  8. tv2 = CMOV(tv4, tv3, e2)  # Select tv3 if (tv3^2) == x
        const e3 = F.eql(F.sqr(tv2), n); //  9.  e3 = (tv2^2) == x
        const root = F.cmov(tv1, tv2, e3); // 10.  z = CMOV(tv1, tv2, e3)   # Select sqrt from tv1 & tv2
        assertIsSquare(F, root, n);
        return root;
    });
}
/**
 * Tonelli-Shanks square root search algorithm.
 * This implementation is variable-time: it searches data-dependently for the first non-residue `Z`
 * and for the smallest `i` in the main loop, unlike RFC 9380 Appendix I.4's constant-time shape.
 * 1. {@link https://eprint.iacr.org/2012/685.pdf | eprint 2012/685}, page 12
 * 2. Square Roots from 1; 24, 51, 10 to Dan Shanks
 * @param P - field order
 * @returns function that takes field Fp (created from P) and number n
 * @throws If the field is too small, non-prime, or the square root does not exist. {@link Error}
 * @example
 * Construct a square-root helper for primes that need Tonelli-Shanks.
 *
 * ```ts
 * import { Field, tonelliShanks } from '@noble/curves/abstract/modular.js';
 * const Fp = Field(17n);
 * const sqrt = tonelliShanks(17n)(Fp, 4n);
 * ```
 */
function tonelliShanks(P) {
    // Initialization (precomputation).
    // Caching initialization could boost perf by 7%.
    if (P < _3n)
        throw new Error('sqrt is not defined for small field');
    aoddModulus(P, 'tonelliShanks');
    // Factor P - 1 = Q * 2^S, where Q is odd
    let Q = P - modular_1n;
    let S = 0;
    while (Q % _2n === modular_0n) {
        Q /= _2n;
        S++;
    }
    // Find the first quadratic non-residue Z >= 2
    let Z = _2n;
    const _Fp = Field(P);
    while (FpLegendre(_Fp, Z) === 1) {
        // Basic primality test for P. After x iterations, chance of
        // not finding quadratic non-residue is 2^x, so 2^1000.
        if (Z++ > 1000)
            throw new Error('Cannot find square root: probably non-prime P');
    }
    // Fast-path; usually done before Z, but we do "primality test".
    if (S === 1)
        return sqrt3mod4;
    // Slow-path
    // TODO: test on Fp2 and others
    let cc = _Fp.pow(Z, Q); // c = z^Q
    const Q1div2 = (Q + modular_1n) / _2n;
    return function tonelliSlow(Fp, n) {
        const F = Fp;
        if (F.is0(n))
            return n;
        // Check if n is a quadratic residue using Legendre symbol
        if (FpLegendre(F, n) !== 1)
            throw new Error('Cannot find square root');
        // Initialize variables for the main loop
        let M = S;
        let c = F.mul(F.ONE, cc); // c = z^Q, move cc from field _Fp into field Fp
        let t = F.pow(n, Q); // t = n^Q, first guess at the fudge factor
        let R = F.pow(n, Q1div2); // R = n^((Q+1)/2), first guess at the square root
        // Main loop
        // while t != 1
        while (!F.eql(t, F.ONE)) {
            // Unreachable over a genuine field (no zero divisors; n=0 already returned above). A zero t
            // means composite ORDER, where a fabricated root would be wrong: fail closed instead.
            if (F.is0(t))
                throw new Error('Cannot find square root: probably non-prime P');
            let i = 1;
            // Find the smallest i >= 1 such that t^(2^i) ≡ 1 (mod P)
            let t_tmp = F.sqr(t); // t^(2^1)
            while (!F.eql(t_tmp, F.ONE)) {
                i++;
                t_tmp = F.sqr(t_tmp); // t^(2^2)...
                if (i === M)
                    throw new Error('Cannot find square root');
            }
            // Calculate the exponent for b: 2^(M - i - 1)
            const exponent = modular_1n << BigInt(M - i - 1); // bigint is important
            const b = F.pow(c, exponent); // b = 2^(M - i - 1)
            // Update variables
            M = i;
            c = F.sqr(b); // c = b^2
            t = F.mul(t, c); // t = (t * b^2)
            R = F.mul(R, b); // R = R*b
        }
        return R;
    };
}
/**
 * Square root for a finite field. Will try optimized versions first:
 *
 * 1. P ≡ 3 (mod 4)
 * 2. P ≡ 5 (mod 8)
 * 3. P ≡ 9 (mod 16)
 * 4. Tonelli-Shanks algorithm
 *
 * Different algorithms can give different roots, it is up to user to decide which one they want.
 * For example there is FpSqrtOdd/FpSqrtEven to choose a root by oddness
 * (used for hash-to-curve).
 * @param P - Field order.
 * @returns Square-root helper. The generic fallback inherits Tonelli-Shanks' variable-time
 *   behavior and this selector assumes prime-field-style integer moduli.
 * @throws If the field is unsupported or the square root does not exist. {@link Error}
 * @example
 * Choose the square-root helper appropriate for one field modulus.
 *
 * ```ts
 * import { Field, FpSqrt } from '@noble/curves/abstract/modular.js';
 * const Fp = Field(17n);
 * const sqrt = FpSqrt(17n)(Fp, 4n);
 * ```
 */
function FpSqrt(P) {
    aoddModulus(P, 'Fp.sqrt');
    // P ≡ 3 (mod 4) => √n = n^((P+1)/4)
    if (P % _4n === _3n)
        return sqrt3mod4;
    // P ≡ 5 (mod 8) => Atkin algorithm, page 10 of https://eprint.iacr.org/2012/685.pdf
    if (P % _8n === _5n)
        return sqrt5mod8;
    // P ≡ 9 (mod 16) => Kong algorithm, page 11 of https://eprint.iacr.org/2012/685.pdf (algorithm 4)
    if (P % _16n === _9n)
        return sqrt9mod16(P);
    // Tonelli-Shanks algorithm
    return tonelliShanks(P);
}
/**
 * @param num - Value to inspect.
 * @param modulo - Field modulus.
 * @returns `true` when the least-significant little-endian bit is set.
 * @throws If the modulus is invalid for `mod(...)`. {@link Error}
 * @example
 * Inspect the low bit used by little-endian sign conventions.
 *
 * ```ts
 * isNegativeLE(3n, 11n);
 * ```
 */
const isNegativeLE = (num, modulo) => (modular_mod(num, modulo) & modular_1n) === modular_1n;
// prettier-ignore
// Arithmetic-only subset checked by validateField(). This is intentionally not the full runtime
// IField contract: helpers like `isValidNot0`, `invertBatch`, `toBytes`, `fromBytes`, `cmov`, and
// field-specific extras like `isOdd` are left to the callers that actually need them.
const FIELD_FIELDS = [
    'create', 'isValid', 'is0', 'neg', 'inv', 'sqrt', 'sqr',
    'eql', 'add', 'sub', 'mul', 'pow', 'div',
    'addN', 'subN', 'mulN', 'sqrN'
];
/**
 * @param field - Field implementation.
 * @returns Validated field. This only checks the arithmetic subset needed by generic helpers; it
 *   does not guarantee full runtime-method coverage for serialization, batching, `cmov`, or
 *   field-specific extras beyond positive `BYTES` / `BITS`.
 * @throws If the field shape or numeric metadata are invalid. {@link Error}
 * @example
 * Check that a field implementation exposes the operations curve code expects.
 *
 * ```ts
 * import { Field, validateField } from '@noble/curves/abstract/modular.js';
 * const Fp = validateField(Field(17n));
 * ```
 */
function modular_validateField(field) {
    utils_aobject(field, 'field');
    if (typeof field.ORDER !== 'bigint')
        throw new TypeError('param "ORDER" is invalid: expected bigint, got ' + typeof field.ORDER);
    // Runtime field implementations must expose real integer byte/bit sizes; fractional / NaN /
    // infinite metadata breaks encoders and caches.
    utils_asafenumber(field.BYTES, 'BYTES');
    utils_asafenumber(field.BITS, 'BITS');
    for (const name of FIELD_FIELDS)
        afunction(field[name], 'field.' + name);
    // Runtime field implementations must expose positive byte/bit sizes; zero leaks through the
    // numeric shape checks above but still breaks encoding helpers and cached-length assumptions.
    if (field.BYTES < 1 || field.BITS < 1)
        throw new Error('invalid field: expected BYTES/BITS > 0');
    if (field.ORDER <= modular_1n)
        throw new Error('invalid field: expected ORDER > 1, got ' + field.ORDER);
    return field;
}
// Generic field functions
/**
 * Same as `pow` but for Fp: non-constant-time.
 * Unsafe in some contexts: uses ladder, so can expose bigint bits.
 * @param Fp - Field implementation.
 * @param num - Base value.
 * @param power - Exponent value.
 * @returns Powered field element.
 * @throws If the exponent is negative. {@link Error}
 * @example
 * Raise one field element to a public exponent.
 *
 * ```ts
 * import { Field, FpPow } from '@noble/curves/abstract/modular.js';
 * const Fp = Field(17n);
 * const x = FpPow(Fp, 3n, 5n);
 * ```
 */
function FpPow(Fp, num, power) {
    modular_validateField(Fp);
    const F = Fp;
    // Non-bigint exponents (e.g. an accidental field element) coerce every comparison below to
    // false and would silently return ONE.
    if (typeof power !== 'bigint')
        throw new TypeError('invalid exponent: expected bigint, got ' + typeof power);
    if (power < modular_0n)
        throw new Error('invalid exponent, negatives unsupported');
    if (power === modular_0n)
        return F.ONE;
    if (power === modular_1n)
        return num;
    if (power < POW_WINDOWED_MIN) {
        // Square-and-multiply: cheaper than the windowed path for short exponents (e.g. poseidon
        // sbox x^5), which would waste the 14-multiplication table build.
        let p = F.ONE;
        let d = num;
        while (power > modular_0n) {
            if (power & modular_1n)
                p = F.mul(p, d);
            d = F.sqr(d);
            power >>= modular_1n;
        }
        return p;
    }
    // Fixed 4-bit windows, MSB-first — same shape as pow() above, over generic field ops.
    // Speeds up dense long exponents (extension-field sqrt / Legendre, e.g. Fp2 decompression).
    const digits = [];
    while (power > modular_0n) {
        digits.push(Number(power & _15n));
        power >>= _4n;
    }
    const table = new Array(16);
    table[0] = F.ONE;
    table[1] = num;
    for (let i = 2; i < 16; i++)
        table[i] = F.mul(table[i - 1], num);
    let p = table[digits[digits.length - 1]]; // top digit is nonzero: the loop above stops on 0
    for (let w = digits.length - 2; w >= 0; w--) {
        p = F.sqr(F.sqr(F.sqr(F.sqr(p))));
        const digit = digits[w];
        if (digit !== 0)
            p = F.mul(p, table[digit]);
    }
    return p;
}
function modular_FpInvertBatch(Fp, nums, passZero = false) {
    modular_validateField(Fp);
    utils_aarray(nums, 'nums');
    utils_abool(passZero, 'passZero');
    const F = Fp;
    const inverted = new Array(nums.length).fill(passZero ? F.ZERO : undefined);
    // Walk from first to last, multiply them by each other MOD p
    const multipliedAcc = nums.reduce((acc, num, i) => {
        if (F.is0(num))
            return acc;
        inverted[i] = acc;
        return F.mul(acc, num);
    }, F.ONE);
    // Invert last element
    const invertedAcc = F.inv(multipliedAcc);
    // Walk from last to first, multiply them by inverted each other MOD p
    nums.reduceRight((acc, num, i) => {
        if (F.is0(num))
            return acc;
        // Non-zero `num` means the forward pass already stored a defined prefix product at index i.
        inverted[i] = F.mul(acc, inverted[i]);
        return F.mul(acc, num);
    }, invertedAcc);
    return inverted;
}
/**
 * @param Fp - Field implementation.
 * @param lhs - Dividend value.
 * @param rhs - Divisor value.
 * @returns Division result.
 * @throws If the divisor is non-invertible. {@link Error}
 * @example
 * Divide one field element by another.
 *
 * ```ts
 * import { Field, FpDiv } from '@noble/curves/abstract/modular.js';
 * const Fp = Field(17n);
 * const x = FpDiv(Fp, 6n, 3n);
 * ```
 */
function FpDiv(Fp, lhs, rhs) {
    modular_validateField(Fp);
    const F = Fp;
    return F.mul(lhs, typeof rhs === 'bigint' ? invert(rhs, F.ORDER) : F.inv(rhs));
}
/**
 * Legendre symbol.
 * Legendre constant is used to calculate Legendre symbol (a | p)
 * which denotes the value of a^((p-1)/2) (mod p).
 *
 * * (a | p) ≡ 1    if a is a square (mod p), quadratic residue
 * * (a | p) ≡ -1   if a is not a square (mod p), quadratic non residue
 * * (a | p) ≡ 0    if a ≡ 0 (mod p)
 * @param Fp - Field implementation.
 * @param n - Value to inspect.
 * @returns Legendre symbol.
 * @throws If the powered value does not match a valid Legendre symbol. {@link Error}
 * @example
 * Compute the Legendre symbol of one field element.
 *
 * ```ts
 * import { Field, FpLegendre } from '@noble/curves/abstract/modular.js';
 * const Fp = Field(17n);
 * const symbol = FpLegendre(Fp, 4n);
 * ```
 */
function FpLegendre(Fp, n) {
    modular_validateField(Fp);
    const F = Fp;
    aoddModulus(F.ORDER, 'FpLegendre');
    // We can use 3rd argument as optional cache of this value
    // but seems unneeded for now. The operation is very fast.
    const p1mod2 = (F.ORDER - modular_1n) / _2n;
    const powered = F.pow(n, p1mod2);
    const yes = F.eql(powered, F.ONE);
    const zero = F.eql(powered, F.ZERO);
    const no = F.eql(powered, F.neg(F.ONE));
    if (!yes && !zero && !no)
        throw new Error('invalid Legendre symbol result');
    return yes ? 1 : zero ? 0 : -1;
}
/**
 * @param Fp - Field implementation.
 * @param n - Value to inspect.
 * @returns `true` when `Fp.sqrt(n)` exists. This includes `0`, even though strict "quadratic
 *   residue" terminology often reserves that name for the non-zero square class.
 * @throws If the field returns an invalid Legendre symbol value. {@link Error}
 * @example
 * Check whether one field element has a square root in the field.
 *
 * ```ts
 * import { Field, FpIsSquare } from '@noble/curves/abstract/modular.js';
 * const Fp = Field(17n);
 * const isSquare = FpIsSquare(Fp, 4n);
 * ```
 */
function modular_FpIsSquare(Fp, n) {
    const l = FpLegendre(Fp, n);
    // Zero is a square too: 0 = 0^2, and Fp.sqrt(0) already returns 0.
    return l !== -1;
}
/**
 * @param n - Curve order. Callers are expected to pass a positive order.
 * @param nBitLength - Optional cached bit length. Callers are expected to pass a positive cached
 *   value when overriding the derived bit length.
 * @returns Byte and bit lengths.
 * @throws If the order or cached bit length is invalid. {@link Error}
 * @example
 * Measure the encoding sizes needed for one modulus.
 *
 * ```ts
 * nLength(255n);
 * ```
 */
function nLength(n, nBitLength) {
    // Bit size, byte size of CURVE.n
    if (nBitLength !== undefined)
        curves_utils_anumber(nBitLength);
    if (n <= modular_0n)
        throw new Error('invalid n length: expected positive n, got ' + n);
    if (nBitLength !== undefined && nBitLength < 1)
        throw new Error('invalid n length: expected positive bit length, got ' + nBitLength);
    const bits = utils_bitLen(n);
    // Cached bit lengths smaller than ORDER would truncate serialized scalars/elements and poison
    // any math that relies on the derived field metadata.
    if (nBitLength !== undefined && nBitLength < bits)
        throw new Error(`invalid n length: expected nBitLength (${nBitLength}) >= bitLen(n) (${bits})`);
    const _nBitLength = nBitLength !== undefined ? nBitLength : bits;
    const nByteLength = Math.ceil(_nBitLength / 8);
    return { nBitLength: _nBitLength, nByteLength };
}
// Keep the lazy sqrt cache off-instance so Field(...) can return a frozen object. Otherwise the
// cached helper write would keep the field surface externally mutable.
const FIELD_SQRT = new WeakMap();
class _Field {
    ORDER;
    BITS;
    BYTES;
    isLE;
    ZERO = modular_0n;
    ONE = modular_1n;
    _lengths;
    _mod;
    constructor(ORDER, opts = {}) {
        // ORDER <= 1 is degenerate: ONE would not be a valid field element and helpers like pow/inv
        // would stop modeling field arithmetic.
        if (ORDER <= modular_1n)
            throw new Error('invalid field: expected ORDER > 1, got ' + ORDER);
        let _nbitLength = undefined;
        this.isLE = false;
        if (opts != null && typeof opts === 'object') {
            // Cached bit lengths are trusted here and should already be positive / consistent with ORDER.
            if (typeof opts.BITS === 'number')
                _nbitLength = opts.BITS;
            if (typeof opts.sqrt === 'function')
                // `_Field.prototype` is frozen below, so custom sqrt hooks must become own properties
                // explicitly instead of relying on writable prototype shadowing via assignment.
                Object.defineProperty(this, 'sqrt', { value: opts.sqrt, enumerable: true });
            if (typeof opts.isLE === 'boolean')
                this.isLE = opts.isLE;
            if (opts.allowedLengths)
                this._lengths = Object.freeze(opts.allowedLengths.slice());
            if (typeof opts.modFromBytes === 'boolean')
                this._mod = opts.modFromBytes;
        }
        const { nBitLength, nByteLength } = nLength(ORDER, _nbitLength);
        if (nByteLength > 2048)
            throw new Error('invalid field: expected ORDER of <= 2048 bytes');
        this.ORDER = ORDER;
        this.BITS = nBitLength;
        this.BYTES = nByteLength;
        Object.freeze(this);
    }
    create(num) {
        return modular_mod(num, this.ORDER);
    }
    isValid(num) {
        if (typeof num !== 'bigint')
            throw new TypeError('invalid field element: expected bigint, got ' + typeof num);
        return modular_0n <= num && num < this.ORDER; // 0 is valid element, but it's not invertible
    }
    is0(num) {
        return num === modular_0n;
    }
    // is valid and invertible
    isValidNot0(num) {
        return !this.is0(num) && this.isValid(num);
    }
    isOdd(num) {
        return (num & modular_1n) === modular_1n;
    }
    neg(num) {
        return modular_mod(-num, this.ORDER);
    }
    eql(lhs, rhs) {
        return lhs === rhs;
    }
    sqr(num) {
        return modular_mod(num * num, this.ORDER);
    }
    add(lhs, rhs) {
        return modular_mod(lhs + rhs, this.ORDER);
    }
    sub(lhs, rhs) {
        return modular_mod(lhs - rhs, this.ORDER);
    }
    mul(lhs, rhs) {
        return modular_mod(lhs * rhs, this.ORDER);
    }
    pow(num, power) {
        return pow(num, power, this.ORDER);
    }
    div(lhs, rhs) {
        return modular_mod(lhs * invert(rhs, this.ORDER), this.ORDER);
    }
    // Same as above, but doesn't normalize
    sqrN(num) {
        return num * num;
    }
    addN(lhs, rhs) {
        return lhs + rhs;
    }
    subN(lhs, rhs) {
        return lhs - rhs;
    }
    mulN(lhs, rhs) {
        return lhs * rhs;
    }
    inv(num) {
        return invert(num, this.ORDER);
    }
    sqrt(num) {
        // Caching sqrt helpers speeds up sqrt9mod16 by 5x and Tonelli-Shanks by about 10% without keeping
        // the field instance itself mutable.
        let sqrt = FIELD_SQRT.get(this);
        if (!sqrt)
            FIELD_SQRT.set(this, (sqrt = FpSqrt(this.ORDER)));
        return sqrt(this, num);
    }
    toBytes(num) {
        // Serialize fixed-width limbs without re-validating the field range. Callers that need a
        // canonical encoding must pass a valid element; some protocols intentionally serialize raw
        // residues here and reduce or validate them elsewhere.
        return this.isLE ? numberToBytesLE(num, this.BYTES) : numberToBytesBE(num, this.BYTES);
    }
    fromBytes(bytes, skipValidation = false) {
        curves_utils_abytes(bytes);
        const { _lengths: allowedLengths, BYTES, isLE, ORDER, _mod: modFromBytes } = this;
        if (allowedLengths) {
            // `allowedLengths` must list real positive byte lengths; otherwise empty input would get
            // padded into zero and silently decode as a field element.
            if (bytes.length < 1 || !allowedLengths.includes(bytes.length) || bytes.length > BYTES) {
                throw new Error('Field.fromBytes: expected ' + allowedLengths + ' bytes, got ' + bytes.length);
            }
            const padded = new Uint8Array(BYTES);
            // isLE add 0 to right, !isLE to the left.
            padded.set(bytes, isLE ? 0 : padded.length - bytes.length);
            bytes = padded;
        }
        if (bytes.length !== BYTES)
            throw new Error('Field.fromBytes: expected ' + BYTES + ' bytes, got ' + bytes.length);
        let scalar = isLE ? bytesToNumberLE(bytes) : utils_bytesToNumberBE(bytes);
        if (modFromBytes)
            scalar = modular_mod(scalar, ORDER);
        if (!skipValidation)
            if (!this.isValid(scalar))
                throw new Error('invalid field element: outside of range 0..ORDER');
        // Range validation is optional here because some protocols intentionally decode raw residues
        // and reduce or validate them elsewhere.
        return scalar;
    }
    // TODO: we don't need it here, move out to separate fn
    invertBatch(lst) {
        // `passZero` keeps the `bigint[]` contract honest: zero inputs map to `0` instead of leaking
        // `undefined` into a `bigint[]`. Callers that must distinguish non-invertible inputs should use
        // `FpInvertBatch` directly, whose default omits `passZero` and returns `(bigint | undefined)[]`.
        return modular_FpInvertBatch(this, lst, true);
    }
    // We can't move this out because Fp6, Fp12 implement it
    // and it's unclear what to return in there.
    cmov(a, b, condition) {
        // Field elements have `isValid(...)`; the CMOV branch bit is a direct runtime input, so reject
        // non-boolean selectors here instead of letting JS truthiness silently change arithmetic.
        utils_abool(condition, 'condition');
        return condition ? b : a;
    }
}
/**
 * Creates a finite field. Major performance optimizations:
 * * 1. Denormalized operations like mulN instead of mul.
 * * 2. Identical object shape: never add or remove keys.
 * * 3. Frozen stable object shape; the lazy sqrt cache lives in a module-level `WeakMap`.
 * Fragile: always run a benchmark on a change.
 * Security note: operations and low-level serializers like `toBytes` don't check `isValid` for
 * all elements for performance and protocol-flexibility reasons; callers are responsible for
 * supplying valid elements when they need canonical field behavior.
 * This is low-level code, please make sure you know what you're doing.
 *
 * Note about field properties:
 * * CHARACTERISTIC p = prime number, number of elements in main subgroup.
 * * ORDER q = similar to cofactor in curves, may be composite `q = p^m`.
 *
 * @param ORDER - field order, probably prime, or could be composite
 * @param opts - Field options such as bit length or endianness. See {@link FieldOpts}.
 * @returns Frozen field instance with a stable object shape. This wrapper forwards `opts` straight
 *   into `_Field`, so it inherits `_Field`'s assumptions about cached sizes and `allowedLengths`.
 * @example
 * Construct one prime field with optional overrides.
 *
 * ```ts
 * Field(11n);
 * ```
 */
function Field(ORDER, opts = {}) {
    // Freeze the shared method surface before any instance is reachable; otherwise callers can
    // poison every Field instance by monkey-patching `_Field.prototype` even if each instance is
    // frozen. Freezing here instead of module scope keeps `_Field` tree-shakeable for importers
    // that never construct a field; the call is idempotent and cheap.
    Object.freeze(_Field.prototype);
    return new _Field(ORDER, opts);
}
/**
 * @param Fp - Field implementation.
 * @param elm - Value to square-root.
 * @returns Odd square root when two roots exist. The special case `elm = 0` still returns `0`,
 *   which is the only square root but is not odd.
 * @throws If the field lacks oddness checks or the square root does not exist. {@link Error}
 * @example
 * Select the odd square root when two roots exist.
 *
 * ```ts
 * import { Field, FpSqrtOdd } from '@noble/curves/abstract/modular.js';
 * const Fp = Field(17n);
 * const root = FpSqrtOdd(Fp, 4n);
 * ```
 */
function FpSqrtOdd(Fp, elm) {
    modular_validateField(Fp);
    const F = Fp;
    if (!F.isOdd)
        throw new Error("Field doesn't have isOdd");
    const root = F.sqrt(elm);
    return F.isOdd(root) ? root : F.neg(root);
}
/**
 * @param Fp - Field implementation.
 * @param elm - Value to square-root.
 * @returns Even square root.
 * @throws If the field lacks oddness checks or the square root does not exist. {@link Error}
 * @example
 * Select the even square root when two roots exist.
 *
 * ```ts
 * import { Field, FpSqrtEven } from '@noble/curves/abstract/modular.js';
 * const Fp = Field(17n);
 * const root = FpSqrtEven(Fp, 4n);
 * ```
 */
function modular_FpSqrtEven(Fp, elm) {
    modular_validateField(Fp);
    const F = Fp;
    if (!F.isOdd)
        throw new Error("Field doesn't have isOdd");
    const root = F.sqrt(elm);
    return F.isOdd(root) ? F.neg(root) : root;
}
/**
 * Returns total number of bytes consumed by the field element.
 * For example, 32 bytes for usual 256-bit weierstrass curve.
 * @param fieldOrder - number of field elements, usually CURVE.n. Callers are expected to pass an
 *   order greater than 1.
 * @returns byte length of field
 * @throws If the field order is not a bigint. {@link Error}
 * @example
 * Read the fixed-width byte length of one field.
 *
 * ```ts
 * getFieldBytesLength(255n);
 * ```
 */
function getFieldBytesLength(fieldOrder) {
    if (typeof fieldOrder !== 'bigint')
        throw new Error('field order must be bigint');
    // Valid field elements are in 0..ORDER-1, so ORDER <= 1 would make the encoded range degenerate.
    if (fieldOrder <= modular_1n)
        throw new Error('field order must be greater than 1');
    // Valid field elements are < ORDER, so the maximal encoded element is ORDER - 1.
    const bitLength = utils_bitLen(fieldOrder - modular_1n);
    return Math.ceil(bitLength / 8);
}
/**
 * Returns minimal amount of bytes that can be safely reduced
 * by field order.
 * Should be 2^-128 for 128-bit curve such as P256.
 * This is the reduction / modulo-bias lower bound; higher-level helpers may still impose a larger
 * absolute floor for policy reasons.
 * @param fieldOrder - number of field elements greater than 1, usually CURVE.n.
 * @returns byte length of target hash
 * @throws If the field order is invalid. {@link Error}
 * @example
 * Compute the minimum hash length needed for field reduction.
 *
 * ```ts
 * getMinHashLength(255n);
 * ```
 */
function getMinHashLength(fieldOrder) {
    const length = getFieldBytesLength(fieldOrder);
    return length + Math.ceil(length / 2);
}
/**
 * "Constant-time" private key generation utility.
 * Can take (n + n/2) or more bytes of uniform input e.g. from CSPRNG or KDF
 * and convert them into private scalar, with the modulo bias being negligible.
 * Needs at least 48 bytes of input for 32-byte private key. The implementation also keeps a hard
 * 16-byte minimum even when `getMinHashLength(...)` is smaller, so toy-small inputs do not look
 * accidentally acceptable for real scalar derivation.
 * See {@link https://research.kudelskisecurity.com/2020/07/28/the-definitive-guide-to-modulo-bias-and-how-to-avoid-it/ | Kudelski's modulo-bias guide},
 * {@link https://csrc.nist.gov/publications/detail/fips/186/5/final | FIPS 186-5 appendix A.2}, and
 * {@link https://www.rfc-editor.org/rfc/rfc9380#section-5 | RFC 9380 section 5}. Unlike RFC 9380
 * `hash_to_field`, this helper intentionally maps into the non-zero private-scalar range `1..n-1`.
 * @param key - Uniform input bytes.
 * @param fieldOrder - Size of subgroup.
 * @param isLE - interpret hash bytes as LE num
 * @returns valid private scalar
 * @throws If the hash length or field order is invalid for scalar reduction. {@link Error}
 * @example
 * Map hash output into a private scalar range.
 *
 * ```ts
 * mapHashToField(new Uint8Array(48).fill(1), 255n);
 * ```
 */
function modular_mapHashToField(key, fieldOrder, isLE = false) {
    curves_utils_abytes(key);
    const len = key.length;
    const fieldLen = getFieldBytesLength(fieldOrder);
    const minLen = Math.max(getMinHashLength(fieldOrder), 16);
    // No toy-small inputs: the helper is for real scalar derivation, not tiny test curves. No huge
    // inputs: easier to reason about JS timing / allocation behavior.
    if (len < minLen || len > 1024)
        throw new Error('expected ' + minLen + '-1024 bytes of input, got ' + len);
    const num = isLE ? bytesToNumberLE(key) : utils_bytesToNumberBE(key);
    // Map into the non-zero scalar range [1, fieldOrder-1]: reduce mod (fieldOrder-1) to land in
    // [0, fieldOrder-2], then add 1. This shifts the range off zero; it is NOT equal to
    // `mod(num, fieldOrder)` (which spans [0, fieldOrder-1] and can be 0). A residual modulo bias
    // remains but is negligible (~2^-(nBits/2), e.g. ~2^-128 for a 256-bit order) because `key` is
    // required to be at least `getMinHashLength(fieldOrder)` (~1.5x field size) bytes of input.
    const reduced = modular_mod(num, fieldOrder - modular_1n) + modular_1n;
    return isLE ? numberToBytesLE(reduced, fieldLen) : numberToBytesBE(reduced, fieldLen);
}

;// ./node_modules/@noble/curves/abstract/curve.js
/**
 * Methods for elliptic curve multiplication by scalars.
 * Contains wNAF-based ScalarMultiplier, pippenger.
 * @module
 */
/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */


const curve_0n = /* @__PURE__ */ BigInt(0);
const curve_1n = /* @__PURE__ */ BigInt(1);
const curve_4n = /* @__PURE__ */ BigInt(4);
const BLIND_BYTES = 16;
const BLIND_BITS = 128;
// Fixed-window width for the constant-time multiply of un-precomputed points (W===1).
// A flat 2^FW_WINDOW table has a small, scalar-independent build cost that amortizes over a single
// multiply, unlike the larger per-point wNAF tables that only pay off when cached.
const FW_WINDOW = 5;
// Precompute tables are capped at ~2 GiB of estimated heap. Rejecting larger windows up front
// turns a typo'd window size into an immediate error instead of a multi-GB allocation (or an
// effective hang) when the lazy table is built on first multiply.
const TABLE_BYTES_MAX = /* @__PURE__ */ (() => 2 ** 31)();
/**
 * Validates the static surface of a point constructor.
 * This is only a cheap sanity check for the constructor hooks and fields consumed by generic
 * factories; it does not certify `BASE`/`ZERO` semantics or prove the curve implementation itself.
 * @param Point - Runtime point constructor.
 * @throws On missing constructor hooks or malformed field metadata. {@link TypeError}
 * @example
 * Check that one point constructor exposes the static hooks generic helpers need.
 *
 * ```ts
 * import { ed25519 } from '@noble/curves/ed25519.js';
 * import { validatePointCons } from '@noble/curves/abstract/curve.js';
 * validatePointCons(ed25519.Point);
 * ```
 */
function validatePointCons(Point) {
    const pc = Point;
    if (typeof pc !== 'function')
        throw new TypeError('"Point" expected constructor, got type=' + typeof Point);
    afunction(pc.fromAffine, 'Point.fromAffine');
    afunction(pc.fromBytes, 'Point.fromBytes');
    afunction(pc.fromHex, 'Point.fromHex');
    // Generic helpers (ScalarMultiplier, normalizeZ, MSM) dereference BASE / ZERO:
    // fail here with a typed error instead of an `undefined` access later.
    utils_aobject(pc.BASE, 'Point.BASE');
    utils_aobject(pc.ZERO, 'Point.ZERO');
    modular_validateField(pc.Fp);
    modular_validateField(pc.Fn);
}
/**
 * Takes a bunch of Projective Points but executes only one
 * inversion on all of them. Inversion is very slow operation,
 * so this improves performance massively.
 * Optimization: converts a list of projective points to a list of identical points with Z=1.
 * Input points are left unchanged; the normalized points are returned as fresh instances.
 * @param c - Point constructor.
 * @param points - Projective points.
 * @returns Fresh projective points reconstructed from normalized affine coordinates.
 * @example
 * Batch-normalize projective points with a single shared inversion.
 *
 * ```ts
 * import { normalizeZ } from '@noble/curves/abstract/curve.js';
 * import { p256 } from '@noble/curves/nist.js';
 * const points = normalizeZ(p256.Point, [p256.Point.BASE, p256.Point.BASE.double()]);
 * ```
 */
function normalizeZ(c, points) {
    // Match MSM helpers: reject malformed public inputs before reading projective internals.
    validatePointCons(c);
    validateMSMPoints(points, c);
    // Identity points (Z=0) rely on an implicit contract: FpInvertBatch without `passZero`
    // yields `undefined` for zero inputs, and `toAffine(undefined)` falls back to its internal
    // is0 handling instead of using the batch inverse.
    const invertedZs = modular_FpInvertBatch(c.Fp, points.map((p) => p.Z));
    return points.map((p, i) => c.fromAffine(p.toAffine(invertedZs[i])));
}
function validateW(W, bits, min = 1) {
    if (!Number.isSafeInteger(W) || W < min || W > bits)
        throw new Error('invalid window size, expected [' + min + '..' + bits + '], got W=' + W);
}
// Rough per-point heap estimate for the {@link TABLE_BYTES_MAX} cap: up to 4 projective/extended
// coordinates of Fp.BYTES each, plus bigint/object overhead. Callers pass the point count of the
// largest table the checked parameters can produce.
function validateTableBytes(numPoints, fpBytes) {
    const bytes = numPoints * (4 * fpBytes + 128);
    if (bytes > TABLE_BYTES_MAX)
        throw new Error('invalid window size: table would need ~' +
            Math.ceil(bytes / 2 ** 20) +
            ' MiB, max ' +
            TABLE_BYTES_MAX / 2 ** 20 +
            ' MiB');
}
/**
 * Probes an RNG once, at construction time: returns `undefined` when it is unavailable —
 * throws or returns malformed bytes — so callers can downgrade to their unblinded /
 * deterministic constant-time fallback. Blinding is defense-in-depth (DPA/template
 * hardening), not a correctness or key-secrecy requirement, so availability-based
 * downgrade is acceptable.
 *
 * The downgrade decision is deliberately static. After a successful probe the RNG becomes
 * part of the trusted contract: later misbehavior must fail closed in per-call validation
 * (throw), never downgrade — a dynamic fallback would let a tampered RNG silently strip
 * blinding on demand. A probe can only ever classify broken environments, not adversarial
 * RNGs: a stateful RNG can always behave while probed and misbehave later.
 * @param randomBytes - RNG to probe, or `undefined` when the environment provides none.
 * @param length - Byte length requested from the probe call.
 * @returns The RNG when the probe produced `length` valid bytes; `undefined` otherwise.
 * @example
 * Probe an RNG once before enabling scalar blinding.
 *
 * ```ts
 * import { probeRandomBytes } from '@noble/curves/abstract/curve.js';
 * import { randomBytes } from '@noble/hashes/utils.js';
 * const rng = probeRandomBytes(randomBytes, 16);
 * ```
 */
function probeRandomBytes(randomBytes, length) {
    if (randomBytes === undefined)
        return undefined;
    afunction(randomBytes, 'randomBytes');
    try {
        const probe = randomBytes(length);
        if (!curves_utils_isBytes(probe) || probe.length !== length)
            return undefined;
    }
    catch {
        return undefined;
    }
    return randomBytes;
}
function validateMSMPoints(points, c) {
    utils_aarray(points, 'points');
    points.forEach((p, i) => {
        if (!(p instanceof c))
            throw new Error('invalid point at index ' + i);
    });
}
// Default bound is field membership (0 <= s < field.ORDER); a `maxScalar` override widens it
// to 0 <= s < maxScalar for callers that accept oversized scalars.
function validateMSMScalars(scalars, field, maxScalar) {
    if (!Array.isArray(scalars))
        throw new Error('array of scalars expected');
    scalars.forEach((s, i) => {
        const ok = maxScalar === undefined ? field.isValid(s) : isPosBig(s) && s < maxScalar;
        if (!ok)
            throw new Error('invalid scalar at index ' + i);
    });
}
const pointWindowSizes = new WeakMap();
function getWindowSize(P) {
    // `1` is the uncached sentinel: use the non-precomputed (wNAF / fixed-window) path.
    return pointWindowSizes.get(P) || 1;
}
/** Table of odd multiples [1P, 3P, ..., (2⋅size−1)P]; width-W wNAF uses size = 2^(W−2). */
function oddMultiples(p, size) {
    const dbl = p.double();
    const t = [p];
    for (let j = 1; j < size; j++)
        t.push(t[j - 1].add(dbl));
    return t;
}
/**
 * Width-W wNAF signed-digit recoding (W >= 2), LSB-first: digits are 0 or odd with
 * |digit| < 2^(W−1); nonzero density ~1/(W+1) (a nonzero digit is followed by W−1 zeros).
 */
function wnafDigits(n, W) {
    const size = 2 ** W;
    const half = size / 2;
    const mask = BigInt(size - 1);
    const d = [];
    while (n > curve_0n) {
        let w = 0;
        if (n & curve_1n) {
            w = Number(n & mask); // n mod 2^W, odd
            if (w >= half)
                w -= size; // signed residue
            n -= BigInt(w); // n - w ≡ 0 mod 2^W: next W−1 digits are zero
        }
        d.push(w);
        n >>= curve_1n;
    }
    return d;
}
/**
 * Fixed-position signed-window recoding for precomputed wNAF: `n = Σ digits[w]⋅2^(w⋅W)` with
 * digits in `[−2^(W−1)+1, 2^(W−1)]`. Digit count is fixed by `windows` (callers reserve one
 * extra window for the final carry), so recoding length does not depend on the scalar.
 */
function signedWindowDigits(n, W, windows) {
    const size = 2 ** W;
    const half = size / 2;
    const mask = BigInt(size - 1);
    const shiftBy = BigInt(W);
    const d = [];
    for (let w = 0; w < windows; w++) {
        let v = Number(n & mask);
        n >>= shiftBy;
        if (v > half) {
            v -= size; // negative digit, carry into the next window
            n += curve_1n;
        }
        d.push(v);
    }
    // Internal invariant: leftover bits mean the window count did not cover the scalar.
    if (n !== curve_0n)
        throw new Error('invalid wnaf');
    return d;
}
/**
 * Shared vartime walk over per-scalar wNAF digit streams: one doubling of a single shared
 * accumulator per bit position of the longest recoding, one signed table addition per
 * nonzero digit. `tables[i]` must hold the odd multiples of the i-th point.
 */
function wnafWalk(zero, tables, digits) {
    let max = 0;
    for (const d of digits)
        max = Math.max(max, d.length);
    let acc = zero;
    for (let bit = max - 1; bit >= 0; bit--) {
        if (bit !== max - 1)
            acc = acc.double();
        for (let i = 0; i < digits.length; i++) {
            const w = digits[i][bit]; // reads past shorter recodings yield undefined, skipped below
            if (w) {
                const item = tables[i][(Math.abs(w) - 1) >> 1];
                acc = acc.add(w < 0 ? item.negate() : item);
            }
        }
    }
    return acc;
}
/**
 * Elliptic curve multiplication of Point by scalar.
 * Routes between cached-table, fixed-window, and one-shot wNAF paths; entry points validate
 * their own scalars (`mulCT`/`mulCTBlinded`: `1 <= s < Fn.ORDER`; `mulUnsafe`: up to the
 * `Fn.ORDER^4` DoS cap via {@link mulAddUnsafe}).
 * Table generation is expensive and happens on first call of `multiply()`
 * (or eagerly via `precompute(W, false)`). By default, `BASE` point is precomputed.
 *
 * Cached algorithm is signed fixed-window wNAF:
 * - table stores, for every window w, the multiples `[1..2^(W−1)]⋅2^(w⋅W)⋅P` — all doublings
 *   are baked in, so a multiplication is exactly one table addition per window
 * - window count is fixed (`ceil(bits/W) + 1`), so the point-operation count is scalar-independent
 *   (basis of the constant-time path)
 * - for a 256-bit curve and W=6: 44⋅32 = 1408 table points, 44 additions per multiply
 * - secret scalars are additionally blinded (see {@link ScalarMultiplier.mulCTBlinded}), which
 *   widens tables by 128 bits
 * @param Point - Point constructor.
 * @param randomBytes - RNG used for scalar blinding; required by the blinded secret path.
 * @example
 * Elliptic curve multiplication of Point by scalar.
 *
 * ```ts
 * import { ScalarMultiplier } from '@noble/curves/abstract/curve.js';
 * import { p256 } from '@noble/curves/nist.js';
 * const mul = new ScalarMultiplier(p256.Point);
 * ```
 */
class ScalarMultiplier {
    Point;
    BASE;
    ZERO;
    randomBytes;
    wnafPrecomputes = new WeakMap();
    baseCanBeBlinded;
    bits;
    // Parametrized with a given Point class (not individual point)
    constructor(Point, randomBytes) {
        validatePointCons(Point);
        // Probe the RNG once (see {@link probeRandomBytes}): in environments without working
        // randomness (e.g. no WebCrypto), shouldBlind() then routes secret multiplication to the
        // unblinded constant-time path instead of throwing on every multiply(). The shape of
        // returned bytes is still validated on every blinded call, where breakage fails closed.
        this.randomBytes = probeRandomBytes(randomBytes, BLIND_BYTES);
        this.Point = Point;
        this.BASE = Point.BASE;
        this.ZERO = Point.ZERO;
        this.bits = Point.Fn.BITS;
    }
    /**
     * Creates a signed fixed-window wNAF precomputation table: for every window w, the
     * multiples `[1..2^(W−1)]⋅2^(w⋅W)⋅P`, flattened. All doublings are baked into the table,
     * so cached multiplication is additions-only. `windows = ceil(bits/W) + 1`: the extra
     * window absorbs the final carry of signed-digit recoding.
     * For a 256-bit curve and W=6, the table is 44⋅32 = 1408 points.
     * @param point - Point instance
     * @param W - window size
     * @param bits - scalar bitlength the table must cover
     */
    buildWnafTable(point, W, bits) {
        // W needs no re-validation: its only source is setWindowSize(), which enforces
        // 1 <= W <= Fn.BITS <= bits (the blinded path only ever widens bits) and caps the
        // resulting table at ~2 GiB (sized against the wider blinded layout).
        const windows = Math.ceil(bits / W) + 1;
        const half = 2 ** (W - 1);
        const comp = [];
        let base = point;
        for (let w = 0; w < windows; w++) {
            let acc = base;
            for (let i = 0; i < half; i++) {
                comp.push(acc);
                acc = acc.add(base);
            }
            base = comp[comp.length - 1].double(); // 2⋅(2^(W−1)⋅base) = next window's base
        }
        return { W, bits, windows, comp };
    }
    /**
     * Implements ec multiplication using precomputed signed fixed-window wNAF tables.
     * Constant-time: fixed window count with one table addition per window — zero digits feed
     * the fake accumulator — and no doublings; the lookup scans the whole window slice.
     * Scalar bounds are validated by the public entry points ({@link ScalarMultiplier.mulCT},
     * {@link ScalarMultiplier.mulCTBlinded}, {@link ScalarMultiplier.mulUnsafe});
     * signedWindowDigits throws if `n` exceeds the table.
     * @returns real and fake (for const-time) points
     */
    wnafCachedCT(precomputes, n) {
        const { W, windows, comp } = precomputes;
        const half = 2 ** (W - 1);
        const digits = signedWindowDigits(n, W, windows);
        let p = this.ZERO;
        let f = this.BASE;
        for (let w = 0; w < windows; w++) {
            const digit = digits[w];
            const start = w * half;
            // Data-oblivious select: touch every entry of the window before the digit branch.
            const idx = Math.abs(digit) - 1; // -1 for zero digits: matches nothing, `sel` unused
            let sel = comp[start];
            for (let i = 1; i < half; i++)
                sel = i === idx ? comp[start + i] : sel;
            const neg = sel.negate(); // compute both signs; the digit only picks one
            if (digit === 0)
                f = f.add(comp[start]);
            else
                p = p.add(digit < 0 ? neg : sel);
        }
        return { p, f };
    }
    // Cache key is point identity plus (W, bits); at most two entries exist per point (public-width
    // `Fn.BITS` and blinded `Fn.BITS + BLIND_BITS`). Callers must not reuse the same point with
    // incompatible `transform(...)` layouts and expect a separate cache entry.
    getWnafPrecomputes(W, point, bits, transform) {
        let entries = this.wnafPrecomputes.get(point);
        let comp = entries?.find((entry) => entry.W === W && entry.bits === bits);
        if (!comp) {
            comp = this.buildWnafTable(point, W, bits);
            if (typeof transform === 'function')
                comp = { ...comp, comp: transform(comp.comp) };
            if (!entries) {
                entries = [];
                this.wnafPrecomputes.set(point, entries);
            }
            entries.push(comp);
        }
        return comp;
    }
    assertPoint(point) {
        if (!(point instanceof this.Point))
            throw new TypeError('"point" expected Point instance, got type=' + typeof point);
    }
    // Shared prologue of the constant-time entry points. Rejects scalar 0: in key/signature-style
    // callers a zero scalar means broken upstream plumbing, and concrete Points already reject it.
    // Uses inRange instead of Fn.isValidNot0: validateField() only certifies the arithmetic subset.
    validateMulInput(point, scalar) {
        this.assertPoint(point);
        if (!inRange(scalar, curve_1n, this.Point.Fn.ORDER))
            throw new Error('invalid scalar');
    }
    // Constant-time dispatch shared by mulCT / mulCTBlinded. Un-precomputed points (W===1, e.g.
    // ECDH peer keys) skip building a throwaway cached table in favor of a small fixed-window
    // multiply. `n` must be < 2^bits.
    runCT(point, n, bits, transform) {
        const W = getWindowSize(point);
        if (W === 1)
            return this.fixedWindowCT(point, n, bits);
        return this.wnafCachedCT(this.getWnafPrecomputes(W, point, bits, transform), n);
    }
    mulCT(point, scalar, transform) {
        this.validateMulInput(point, scalar);
        return this.runCT(point, scalar, this.bits, transform);
    }
    mulCTBlinded(point, scalar, transform) {
        this.validateMulInput(point, scalar);
        // Blinding computes n = scalar + blind*Fn.ORDER, then n*P via a constant-time multiply. This
        // equals scalar*P only when Fn.ORDER*P == O; callers guarantee that via shouldBlind() (always
        // for cofactor-1 curves; for cofactored curves only BASE, and only after checking BASE*n == O).
        // Fail before building the (large) precompute table if randomness is unavailable.
        if (this.randomBytes === undefined)
            throw new Error('randomBytes is required for scalar blinding');
        const bits = this.Point.Fn.BITS + BLIND_BITS;
        const blind = this.randomBytes(BLIND_BYTES);
        if (!curves_utils_isBytes(blind) || blind.length !== BLIND_BYTES)
            throw new Error('randomBytes returned invalid byte array');
        // Force the top two bits of the 128-bit blind to 10xxxxxx, so blind is in [2^127, 1.5*2^127):
        // * `| 0x80` (bit 127 = 1) is the load-bearing part: it guarantees blind >= 2^127, so the blind
        //   is always a full-width, nonzero factor and the scalar is masked even with a degenerate RNG.
        // * `& 0x3f` (bit 126 = 0) is a safety margin: it caps blind < 1.5*2^127, keeping
        //   blind*Fn.ORDER + scalar < 0.75*2^(nBits+128), i.e. ~half a window below the 2^(nBits+128)
        //   ceiling. Not strictly required for the bound (see below), but it reserves headroom so the
        //   guarantee does not rest on the tight `Fn.ORDER < 2^Fn.BITS` fact and the final carry window
        //   only ever holds a small carry, never a full digit.
        blind[0] = (blind[0] & 0x3f) | 0x80;
        // Even at the extreme (blind < 2^128, scalar < Fn.ORDER < 2^nBits): n <= 2^128*Fn.ORDER - 1 <
        // 2^(nBits+128), so n stays below 2^bits and within the blinded table's
        // window count. Both cached CT kernels run a fixed number of windows/rows with one point-add
        // each, so the add count is independent of scalar (constant-time).
        const n = scalar + utils_bytesToNumberBE(blind) * this.Point.Fn.ORDER;
        return this.runCT(point, n, bits, transform);
    }
    /**
     * Constant-time multiplication `n*point` for an un-precomputed point, via a small fixed window.
     * A cached wNAF table only pays off when reused; a flat 2^FW_WINDOW table (`size-1` adds) is
     * far cheaper to build for a single use. The point-operation sequence is independent of `n`:
     * build the table, then per window exactly FW_WINDOW doublings, a data-oblivious scan over
     * every table entry, and one addition (adds the identity when the window digit is 0 — never
     * skipped).
     *
     * `n` must be `< 2^bits`. Assumes complete addition (adding the identity costs the same as any
     * add), which holds for the Weierstrass/Edwards point types used here. The table is left in
     * projective form (no normalizeZ): normalizing this small a table costs more than the
     * mixed-add savings it would buy for a single multiply.
     * @returns real point `p`; `f` duplicates it only to match {@link wnafCachedCT}'s return shape
     * (this path needs no fake accumulator — its op-count is already scalar-independent).
     */
    fixedWindowCT(point, n, bits) {
        const W = FW_WINDOW;
        const size = 1 << W;
        const mask = utils_bitMask(W);
        // Flat table [O, point, 2*point, ..., (size-1)*point].
        const table = new Array(size);
        table[0] = this.ZERO;
        for (let i = 1; i < size; i++)
            table[i] = table[i - 1].add(point);
        // Horner MSB->LSB. windows*W >= bits and n < 2^bits, so every bit of n is consumed.
        const windows = Math.ceil(bits / W);
        let acc = this.ZERO;
        for (let window = windows - 1; window >= 0; window--) {
            // W doublings per window; skipped for the first (topmost) window, where acc is still the
            // identity. The skip is scalar-independent: it depends only on the loop index.
            if (window !== windows - 1)
                for (let d = 0; d < W; d++)
                    acc = acc.double();
            const digit = Number((n >> BigInt(window * W)) & mask);
            // Data-oblivious select: touch every entry, same as wnafCachedCT.
            let sel = table[0];
            for (let i = 1; i < size; i++)
                sel = i === digit ? table[i] : sel;
            acc = acc.add(sel); // one add per window, even for digit 0
        }
        return { p: acc, f: acc };
    }
    shouldBlind(point, cofactor) {
        // No usable RNG (probed in the constructor): blinding is impossible, use the plain CT path.
        if (this.randomBytes === undefined)
            return false;
        if (cofactor === curve_1n)
            return true;
        if (point !== this.BASE)
            return false;
        if (this.baseCanBeBlinded === undefined)
            this.baseCanBeBlinded = this.mulUnsafe(this.BASE, this.Point.Fn.ORDER).is0();
        return this.baseCanBeBlinded;
    }
    mulSecret(point, scalar, cofactor, transform) {
        return this.shouldBlind(point, cofactor)
            ? this.mulCTBlinded(point, scalar, transform)
            : this.mulCT(point, scalar, transform);
    }
    mulUnsafe(point, scalar, transform) {
        this.assertPoint(point);
        if (!isPosBig(scalar))
            throw new Error('invalid scalar');
        const W = getWindowSize(point);
        // W === 1 (un-precomputed): one-shot width-4 wNAF via {@link mulAddUnsafe} with L=1 —
        // a cached table would be thrown away after one use. `allowOversized` swaps the
        // `s < Fn.ORDER` check for mulAddUnsafe's `Fn.ORDER^4` DoS cap.
        //
        // Oversized scalar could happen when:
        // a) user passes large scalar on their own (rare)
        // b) `assertValidity()` calls `isTorsionFree()`, which multiplies point by `Fn.ORDER`
        if (W === 1 || scalar >= this.Point.Fn.ORDER)
            return mulAddUnsafe(this.Point, [point], [scalar], true);
        // Precomputed points reuse the CT kernel (fake accumulator discarded): with W=6 only
        // ~1/64 of window-adds are skippable, so a dedicated vartime kernel saved just ~6% on
        // this path while doubling the cached-table code surface.
        const precomputes = this.getWnafPrecomputes(W, point, this.bits, transform);
        return this.wnafCachedCT(precomputes, scalar).p;
    }
    // Remembers the window size used for precomputed wNAF multiplication of the given point
    // and drops any previously built tables. Usually only the base point is precomputed.
    // W=1 resets the point to the un-precomputed (table-less) paths.
    // W is additionally capped so tables stay under ~2 GiB ({@link TABLE_BYTES_MAX}).
    setWindowSize(point, W) {
        this.assertPoint(point);
        validateW(W, this.bits);
        // Size against the widest table this W can produce: the blinded path adds BLIND_BITS.
        const windows = Math.ceil((this.bits + BLIND_BITS) / W) + 1;
        validateTableBytes(windows * 2 ** (W - 1), this.Point.Fp.BYTES);
        pointWindowSizes.set(point, W);
        this.wnafPrecomputes.delete(point);
    }
    // True when a window size is set: tables themselves are built lazily on first multiply.
    hasWindowSize(point) {
        return getWindowSize(point) !== 1;
    }
}
/**
 * Combined multi-scalar multiplication `Σ scalars[i]⋅points[i]` via interleaved width-4 wNAF
 * (Strauss–Shamir). Every input gets its own table of odd multiples `[1P, 3P, 5P, 7P]` and
 * signed-digit recoding, but all walks share one doubling chain, so total cost is
 * `~bits` doublings + `L⋅bits/5` additions instead of `L⋅bits` doublings for separate
 * multiplications. Intended for the 2-4 point shapes of signature verification
 * (`R = u1⋅G + u2⋅P`); use {@link pippenger} for larger batches.
 *
 * Not constant-time: only for public inputs. Scalars must satisfy `0 <= s < Fn.ORDER`;
 * fold negative signs into the points before calling.
 * @param c - Point constructor.
 * @param points - Array of curve points.
 * @param scalars - Array of non-negative scalars, same length as points.
 * @param allowOversized - Replace the `s < Fn.ORDER` scalar check with a `Fn.ORDER^4` DoS cap.
 *   Off by default. For scalars that must NOT be reduced mod ORDER: torsion checks
 *   (`Fn.ORDER⋅P ≟ O`) and cofactor-clearing multiples. Walk length grows with `bitLen(s)`.
 * @returns Combined multiplication result; identity for empty input.
 * @throws If the point set or scalar set is invalid. {@link Error}
 * @example
 * Combined multi-scalar multiplication via Strauss–Shamir.
 *
 * ```ts
 * import { mulAddUnsafe } from '@noble/curves/abstract/curve.js';
 * import { p256 } from '@noble/curves/nist.js';
 * const G = p256.Point.BASE;
 * const R = mulAddUnsafe(p256.Point, [G, G.double()], [2n, 3n]); // 2⋅G + 3⋅(2⋅G)
 * ```
 */
function mulAddUnsafe(c, points, scalars, allowOversized = false) {
    validatePointCons(c);
    validateMSMPoints(points, c);
    utils_abool(allowOversized, 'allowOversized');
    // Oversized cap is ORDER^4: hard bound to mitigate DoS, walk length grows with bitLen(s).
    validateMSMScalars(scalars, c.Fn, allowOversized ? c.Fn.ORDER ** curve_4n : undefined);
    if (points.length !== scalars.length)
        throw new Error('arrays of points and scalars must have equal length');
    const tables = points.map((p) => oddMultiples(p, 4));
    const digits = scalars.map((n) => wnafDigits(n, 4));
    return wnafWalk(c.ZERO, tables, digits);
}
/**
 * Pippenger algorithm for multi-scalar multiplication (MSM, Pa + Qb + Rc + ...).
 * 30x faster vs naive addition on L=4096, 10x faster than precomputes.
 * For N=254bit, L=1, it does: 1024 ADD + 254 DBL. For L=5: 1536 ADD + 254 DBL.
 * Point-operation count is scalar-independent (for same L), even when 1 point + scalar, or when
 * scalar = 0 — but bucket indices are scalar windows, so the memory-access pattern is
 * scalar-dependent: do not rely on this for secret scalars.
 *
 * A repaired LFG bucket-set variant from ePrint 2024/750 was benchmarked on BLS12-381 G1
 * against this implementation: ~1.4x faster at 2048 points and ~1.1-1.25x faster at
 * 4096-32768 points, at the cost of extra recoding and multiplier-table complexity.
 * @param c - Curve Point constructor
 * @param points - array of L curve points
 * @param scalars - array of L scalars (aka secret keys / bigints)
 * @returns MSM result point. Empty input is accepted and returns the identity.
 * @throws If the point set, scalar set, or MSM sizing is invalid. {@link Error}
 * @example
 * Pippenger algorithm for multi-scalar multiplication (MSM, Pa + Qb + Rc + ...).
 *
 * ```ts
 * import { pippenger } from '@noble/curves/abstract/curve.js';
 * import { p256 } from '@noble/curves/nist.js';
 * const point = pippenger(p256.Point, [p256.Point.BASE, p256.Point.BASE.double()], [2n, 3n]);
 * ```
 */
function pippenger(c, points, scalars) {
    // 0 is accepted in scalars
    validatePointCons(c);
    const fieldN = c.Fn;
    validateMSMPoints(points, c);
    validateMSMScalars(scalars, fieldN);
    const plength = points.length;
    const slength = scalars.length;
    if (plength !== slength)
        throw new Error('arrays of points and scalars must have equal length');
    const zero = c.ZERO;
    // Without this, the window loop below would still run ~Fn.BITS doublings of ZERO.
    if (plength === 0)
        return zero;
    const wbits = bitLen(BigInt(plength));
    let windowSize = 1; // bits
    if (wbits > 12)
        windowSize = wbits - 3;
    else if (wbits > 4)
        windowSize = wbits - 2;
    else if (wbits > 0)
        windowSize = 2;
    const MASK = bitMask(windowSize);
    const buckets = new Array(Number(MASK) + 1).fill(zero); // +1 for zero array
    const lastBits = Math.floor((fieldN.BITS - 1) / windowSize) * windowSize;
    let sum = zero;
    for (let i = lastBits; i >= 0; i -= windowSize) {
        buckets.fill(zero);
        for (let j = 0; j < slength; j++) {
            const scalar = scalars[j];
            const wbits = Number((scalar >> BigInt(i)) & MASK);
            buckets[wbits] = buckets[wbits].add(points[j]);
        }
        let resI = zero; // not using this will do small speed-up, but will lose ct
        // Skip first bucket, because it is zero
        for (let j = buckets.length - 1, sumI = zero; j > 0; j--) {
            sumI = sumI.add(buckets[j]);
            resI = resI.add(sumI);
        }
        sum = sum.add(resI);
        if (i !== 0)
            for (let j = 0; j < windowSize; j++)
                sum = sum.double();
    }
    return sum;
}
/**
 * Interleaved wNAF multi-scalar multiplication (MSM, Pa + Qb + Rc + ...) over a FIXED set
 * of points: each point gets a one-time table of odd multiples
 * `[1P, 3P, ..., (2^(W−1)−1)P]`, and the returned closure evaluates MSMs against those
 * tables. All scalars share one doubling chain (Straus 1964) — one doubling per scalar bit
 * plus one signed table addition per nonzero width-W wNAF digit (density ~1/(W+1)) — the
 * "interleaving" method of Möller, "Algorithms for multi-exponentiation" (SAC 2001).
 *
 * Table memory is `L⋅2^(W−2)` points, capped at ~2 GiB. Prefer this over {@link pippenger}
 * when the same points are reused across many MSMs (fixed-base commitments etc.) and up to a
 * few hundred points; prefer pippenger for one-shot MSMs or thousands of points, where
 * bucketing beats per-point tables.
 *
 * Not constant-time (zero digits are skipped): public inputs only.
 * @param c - Curve Point constructor
 * @param points - array of L curve points, captured by the returned closure
 * @param windowSize - window width W in bits, from 2 to Fn.BITS; also capped so the
 *   per-closure tables stay under ~2 GiB
 * @returns Function which multiplies points with scalars. The closure accepts at most
 *   `points.length` scalars, and omitted trailing scalars are treated as zero.
 * @throws If the point set or precompute window is invalid. {@link Error}
 * @example
 * Interleaved wNAF multi-scalar multiplication (MSM, Pa + Qb + Rc + ...).
 *
 * ```ts
 * import { interleavedMSMUnsafe } from '@noble/curves/abstract/curve.js';
 * import { p256 } from '@noble/curves/nist.js';
 * const msm = interleavedMSMUnsafe(p256.Point, [p256.Point.BASE], 4);
 * const point = msm([3n]);
 * ```
 */
function interleavedMSMUnsafe(c, points, windowSize) {
    validatePointCons(c);
    const fieldN = c.Fn;
    // Signed odd digits need at least width 2 (W=2 is plain NAF with a single-entry table).
    validateW(windowSize, fieldN.BITS, 2);
    validateMSMPoints(points, c);
    validateTableBytes(points.length * 2 ** (windowSize - 2), c.Fp.BYTES);
    const tables = points.map((p) => oddMultiples(p, 2 ** (windowSize - 2)));
    return (scalars) => {
        validateMSMScalars(scalars, fieldN);
        if (scalars.length > points.length)
            throw new Error('array of scalars must not be larger than array of points');
        return wnafWalk(c.ZERO, tables, scalars.map((n) => wnafDigits(n, windowSize)));
    };
}
function createField(order, field, isLE) {
    if (field) {
        // Reuse supplied field overrides as-is; `isLE` only affects freshly constructed fallback
        // fields, and validateField() below only checks the arithmetic subset, not full byte/cmov
        // behavior.
        if (field.ORDER !== order)
            throw new Error('Field.ORDER must match order: Fp == p, Fn == n');
        modular_validateField(field);
        return field;
    }
    else {
        return Field(order, { isLE });
    }
}
/**
 * Validates basic CURVE shape and field membership, then creates fields.
 * This does not prove that the generator is on-curve, that subgroup/order data are consistent, or
 * that the curve equation itself is otherwise sane.
 * @param type - Curve family.
 * @param CURVE - Curve parameters.
 * @param curveOpts - Optional field overrides. See {@link FpFn}:
 *   - `Fp` (optional): Optional base-field override.
 *   - `Fn` (optional): Optional scalar-field override.
 * @param FpFnLE - Whether field encoding is little-endian.
 * @returns Frozen curve parameters and fields.
 * @throws If the curve parameters or field overrides are invalid. {@link Error}
 * @example
 * Build curve fields from raw constants before constructing a curve instance.
 *
 * ```ts
 * const curve = createCurveFields('weierstrass', {
 *   p: 17n,
 *   n: 19n,
 *   h: 1n,
 *   a: 2n,
 *   b: 2n,
 *   Gx: 5n,
 *   Gy: 1n,
 * });
 * ```
 */
function createCurveFields(type, CURVE, curveOpts = {}, FpFnLE) {
    if (type !== 'weierstrass' && type !== 'edwards')
        throw new Error('expected curve type "weierstrass" or "edwards"');
    if (FpFnLE === undefined)
        FpFnLE = type === 'edwards';
    if (!CURVE || typeof CURVE !== 'object')
        throw new Error(`expected valid ${type} CURVE object`);
    // Validate before reading Fp/Fn so explicit null fails with an options-object error.
    curves_utils_validateObject(curveOpts);
    for (const p of ['p', 'n', 'h']) {
        const val = CURVE[p];
        if (!(isPosBig(val) && val !== curve_0n))
            throw new Error(`CURVE.${p} must be positive bigint`);
    }
    const Fp = createField(CURVE.p, curveOpts.Fp, FpFnLE);
    const Fn = createField(CURVE.n, curveOpts.Fn, FpFnLE);
    const _b = type === 'weierstrass' ? 'b' : 'd';
    const params = ['Gx', 'Gy', 'a', _b];
    for (const p of params) {
        // @ts-ignore
        if (!Fp.isValid(CURVE[p]))
            throw new Error(`CURVE.${p} must be valid field element of CURVE.Fp`);
    }
    CURVE = Object.freeze(Object.assign({}, CURVE));
    return { CURVE, Fp, Fn };
}
/**
 * @param randomSecretKey - Secret-key generator.
 * @param getPublicKey - Public-key derivation helper.
 * @returns Keypair generator.
 * @example
 * Build a `keygen()` helper from existing secret-key and public-key primitives.
 *
 * ```ts
 * import { createKeygen } from '@noble/curves/abstract/curve.js';
 * import { p256 } from '@noble/curves/nist.js';
 * const keygen = createKeygen(p256.utils.randomSecretKey, p256.getPublicKey);
 * const pair = keygen();
 * ```
 */
function curve_createKeygen(randomSecretKey, getPublicKey) {
    return function keygen(seed) {
        const secretKey = randomSecretKey(seed);
        return { secretKey, publicKey: getPublicKey(secretKey) };
    };
}

;// ./node_modules/@noble/curves/abstract/der.js
/**
 * ASN.1 DER (Distinguished Encoding Rules) helpers for ECDSA signatures.
 * Only implements the tiny subset needed for `SEQUENCE(INTEGER r, INTEGER s)`.
 * @module
 */
/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */

const der_0n = /* @__PURE__ */ BigInt(0);
/**
 * @param m - Error message.
 * @example
 * Throw a DER-specific error when signature parsing encounters invalid bytes.
 *
 * ```ts
 * new DERErr('bad der');
 * ```
 */
class DERErr extends Error {
    constructor(m = '') {
        super(m);
    }
}
// Plain const so the freezes can live inside the pure initializer of the `DER` export below:
// bare top-level `Object.freeze(...)` calls would defeat tree-shaking for every importer.
const _DER = {
    // asn.1 DER encoding utils
    Err: DERErr,
    // Basic building block is TLV (Tag-Length-Value)
    _tlv: {
        encode: (tag, data) => {
            const { Err: E } = _DER;
            utils_asafenumber(tag, 'tag');
            if (tag < 0 || tag > 255)
                throw new E('tlv.encode: wrong tag');
            astring(data, 'data');
            // Internal helper: callers hand this already-validated hex payload, so we only enforce
            // byte alignment here instead of re-validating every nibble.
            if (data.length & 1)
                throw new E('tlv.encode: unpadded data');
            const dataLen = data.length / 2;
            const len = numberToHexUnpadded(dataLen);
            if ((len.length / 2) & 0b1000_0000)
                throw new E('tlv.encode: long form length too big');
            // length of length with long form flag
            const lenLen = dataLen > 127 ? numberToHexUnpadded((len.length / 2) | 0b1000_0000) : '';
            const t = numberToHexUnpadded(tag);
            return t + lenLen + len + data;
        },
        // v - value, l - left bytes (unparsed)
        decode(tag, data) {
            const { Err: E } = _DER;
            data = curves_utils_abytes(data, undefined, 'DER data');
            let pos = 0;
            if (tag < 0 || tag > 255)
                throw new E('tlv.decode: wrong tag');
            if (data.length < 2 || data[pos++] !== tag)
                throw new E('tlv.decode: wrong tlv');
            const first = data[pos++];
            // First bit of first length byte is the short/long form flag.
            const isLong = !!(first & 0b1000_0000);
            let length = 0;
            if (!isLong)
                length = first;
            else {
                // Long form: [longFlag(1bit), lengthLength(7bit), length (BE)]
                const lenLen = first & 0b0111_1111;
                if (!lenLen)
                    throw new E('tlv.decode(long): indefinite length not supported');
                // This would overflow u32 in JS.
                if (lenLen > 4)
                    throw new E('tlv.decode(long): byte length is too big');
                const lengthBytes = data.subarray(pos, pos + lenLen);
                if (lengthBytes.length !== lenLen)
                    throw new E('tlv.decode: length bytes not complete');
                if (lengthBytes[0] === 0)
                    throw new E('tlv.decode(long): zero leftmost byte');
                for (const b of lengthBytes)
                    length = (length << 8) | b;
                pos += lenLen;
                if (length < 128)
                    throw new E('tlv.decode(long): not minimal encoding');
            }
            const v = data.subarray(pos, pos + length);
            if (v.length !== length)
                throw new E('tlv.decode: wrong value length');
            return { v, l: data.subarray(pos + length) };
        },
    },
    // https://crypto.stackexchange.com/a/57734 Leftmost bit of first byte is 'negative' flag,
    // since we always use positive integers here. It must always be empty:
    // - add zero byte if exists
    // - if next byte doesn't have a flag, leading zero is not allowed (minimal encoding)
    _int: {
        encode(num) {
            const { Err: E } = _DER;
            abignumber(num);
            if (num < der_0n)
                throw new E('integer: negative integers are not allowed');
            let hex = numberToHexUnpadded(num);
            // Pad with zero byte if negative flag is present
            if (Number.parseInt(hex[0], 16) & 0b1000)
                hex = '00' + hex;
            if (hex.length & 1)
                throw new E('unexpected DER parsing assertion: unpadded hex');
            return hex;
        },
        decode(data) {
            const { Err: E } = _DER;
            if (data.length < 1)
                throw new E('invalid signature integer: empty');
            if (data[0] & 0b1000_0000)
                throw new E('invalid signature integer: negative');
            // Single-byte zero `00` is the canonical DER INTEGER encoding for zero.
            if (data.length > 1 && data[0] === 0x00 && !(data[1] & 0b1000_0000))
                throw new E('invalid signature integer: unnecessary leading zero');
            return utils_bytesToNumberBE(data);
        },
    },
    toSig(bytes, maxScalarBytes) {
        // parse DER signature
        const { Err: E, _int: int, _tlv: tlv } = _DER;
        if (maxScalarBytes !== undefined) {
            utils_asafenumber(maxScalarBytes, 'maxScalarBytes');
            if (maxScalarBytes < 1)
                throw new E('invalid signature: maxScalarBytes must be positive');
        }
        const data = curves_utils_abytes(bytes, undefined, 'signature');
        const { v: seqBytes, l: seqLeftBytes } = tlv.decode(0x30, data);
        if (seqLeftBytes.length)
            throw new E('invalid signature: left bytes after parsing');
        const { v: rBytes, l: rLeftBytes } = tlv.decode(0x02, seqBytes);
        const { v: sBytes, l: sLeftBytes } = tlv.decode(0x02, rLeftBytes);
        if (sLeftBytes.length)
            throw new E('invalid signature: left bytes after parsing');
        // Enforce curve-provided bounds before bytes-to-hex-to-BigInt conversion can amplify memory.
        if (maxScalarBytes !== undefined &&
            (rBytes.length > maxScalarBytes || sBytes.length > maxScalarBytes))
            throw new E('invalid signature: integer too large');
        return { r: int.decode(rBytes), s: int.decode(sBytes) };
    },
    hexFromSig(sig) {
        const { _tlv: tlv, _int: int } = _DER;
        curves_utils_validateObject(sig, { r: 'bigint', s: 'bigint' }, {}, 'sig');
        const rs = tlv.encode(0x02, int.encode(sig.r));
        const ss = tlv.encode(0x02, int.encode(sig.s));
        const seq = rs + ss;
        return tlv.encode(0x30, seq);
    },
};
/**
 * ASN.1 DER encoding utilities. ASN is very complex & fragile. Format:
 *
 *     [0x30 (SEQUENCE), bytelength, 0x02 (INTEGER), intLength, R, 0x02 (INTEGER), intLength, S]
 *
 * Docs: {@link https://letsencrypt.org/docs/a-warm-welcome-to-asn1-and-der/ | Let's Encrypt ASN.1 guide} and
 * {@link https://luca.ntop.org/Teaching/Appunti/asn1.html | Luca Deri's ASN.1 notes}.
 * @example
 * ASN.1 DER encoding utilities.
 *
 * ```ts
 * const der = DER.hexFromSig({ r: 1n, s: 2n });
 * ```
 */
const DER = /* @__PURE__ */ (() => {
    Object.freeze(_DER._tlv);
    Object.freeze(_DER._int);
    return Object.freeze(_DER);
})();

;// ./node_modules/@noble/curves/abstract/weierstrass.js
/**
 * Short Weierstrass curve methods. The formula is: y² = x³ + ax + b.
 *
 * ### Design rationale for types
 *
 * * Interaction between classes from different curves should fail:
 *   `k256.Point.BASE.add(p256.Point.BASE)`
 * * For this purpose we want to use `instanceof` operator, which is fast and works during runtime
 * * Different calls of `curve()` would return different classes -
 *   `curve(params) !== curve(params)`: if somebody decided to monkey-patch their curve,
 *   it won't affect others
 *
 * TypeScript can't infer types for classes created inside a function. Classes is one instance
 * of nominative types in TypeScript and interfaces only check for shape, so it's hard to create
 * unique type for every function call.
 *
 * We can use generic types via some param, like curve opts, but that would:
 *     1. Enable interaction between `curve(params)` and `curve(params)` (curves of same params)
 *     which is hard to debug.
 *     2. Params can be generic and we can't enforce them to be constant value:
 *     if somebody creates curve from non-constant params,
 *     it would be allowed to interact with other curves with non-constant params
 *
 * @todo https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-7.html#unique-symbol
 * @module
 */
/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */






// DER codec lives in der.ts; re-exported here because ECDSA signatures are its main consumer.

// We construct the basis so `den` is always positive and equals `n`,
// but the `num` sign depends on the basis, not on the secret value.
// Exact half-way cases round away from zero, which keeps the split symmetric
// around the reduced-basis boundaries used by endomorphism decomposition.
const divNearest = (num, den) => (num + (num >= 0 ? den : -den) / weierstrass_2n) / den;
/** Splits scalar for GLV endomorphism. */
function _splitEndoScalar(k, basis, n) {
    // Split scalar into two such that part is ~half bits: `abs(part) < sqrt(N)`
    // Since part can be negative, we need to do this on point.
    // Callers must provide a reduced GLV basis whose vectors satisfy
    // `a + b * lambda ≡ 0 (mod n)`; this helper only sees the basis and `n`.
    // Reject unreduced scalars instead of silently treating them mod n.
    aInRange('scalar', k, weierstrass_0n, n);
    // TODO: verifyScalar function which consumes lambda
    const [[a1, b1], [a2, b2]] = basis;
    const c1 = divNearest(b2 * k, n);
    const c2 = divNearest(-b1 * k, n);
    // |k1|/|k2| is < sqrt(N), but can be negative.
    // If we do `k1 mod N`, we'll get big scalar (`> sqrt(N)`): so, we do cheaper negation instead.
    let k1 = k - c1 * a1 - c2 * a2;
    let k2 = -c1 * b1 - c2 * b2;
    const k1neg = k1 < weierstrass_0n;
    const k2neg = k2 < weierstrass_0n;
    if (k1neg)
        k1 = -k1;
    if (k2neg)
        k2 = -k2;
    // Double check that resulting scalar is less than half bits of N: the wNAF pair walk
    // relies on the halves being short. This should only happen on wrong bases.
    // Also, the math inside is complex enough that this guard is worth keeping.
    const MAX_NUM = utils_bitMask(Math.ceil(utils_bitLen(n) / 2)) + weierstrass_1n; // Half bits of N
    if (k1 < weierstrass_0n || k1 >= MAX_NUM || k2 < weierstrass_0n || k2 >= MAX_NUM) {
        throw new Error('splitScalar (endomorphism): failed for k');
    }
    return { k1neg, k1, k2neg, k2 };
}
function validateSigFormat(format) {
    if (!['compact', 'recovered', 'der'].includes(format))
        throw new Error('Signature format must be "compact", "recovered", or "der"');
    return format;
}
function validateSigOpts(opts, def) {
    curves_utils_validateObject(opts);
    const optsn = {};
    // Normalize only the declared option subset from `def`; unknown keys are
    // intentionally ignored so shared / superset option bags stay valid here too.
    // `extraEntropy` stays an opaque payload until the signing path consumes it.
    for (let optName of Object.keys(def)) {
        // @ts-ignore
        optsn[optName] = opts[optName] === undefined ? def[optName] : opts[optName];
    }
    utils_abool(optsn.lowS, 'lowS');
    utils_abool(optsn.prehash, 'prehash');
    if (optsn.format !== undefined)
        validateSigFormat(optsn.format);
    return optsn;
}
// Be friendly to bad ECMAScript parsers by not using bigint literals
// prettier-ignore
const weierstrass_0n = /* @__PURE__ */ BigInt(0), weierstrass_1n = /* @__PURE__ */ BigInt(1), weierstrass_2n = /* @__PURE__ */ BigInt(2), weierstrass_3n = /* @__PURE__ */ BigInt(3), weierstrass_4n = /* @__PURE__ */ BigInt(4);
/**
 * Creates weierstrass Point constructor, based on specified curve options.
 *
 * See {@link WeierstrassOpts}.
 * @param params - Curve parameters. See {@link WeierstrassOpts}.
 * @param extraOpts - Optional helpers and overrides. See {@link WeierstrassExtraOpts}.
 * @returns Weierstrass point constructor.
 * @throws If the curve parameters, overrides, or point codecs are invalid. {@link Error}
 *
 * @example
 * Construct a point type from explicit Weierstrass curve parameters.
 *
 * ```js
 * const opts = {
 *   p: 0xfffffffffffffffffffffffffffffffeffffac73n,
 *   n: 0x100000000000000000001b8fa16dfab9aca16b6b3n,
 *   h: 1n,
 *   a: 0n,
 *   b: 7n,
 *   Gx: 0x3b4c382ce37aa192a4019e763036f4f5dd4d7ebbn,
 *   Gy: 0x938cf935318fdced6bc28286531733c3f03c4feen,
 * };
 * const secp160k1_Point = weierstrass(opts);
 * ```
 */
function weierstrass(params, extraOpts = {}) {
    const validated = createCurveFields('weierstrass', params, extraOpts);
    const Fp = validated.Fp;
    const Fn = validated.Fn;
    let CURVE = validated.CURVE;
    const { h: cofactor, n: CURVE_ORDER } = CURVE;
    curves_utils_validateObject(extraOpts, {}, {
        allowInfinityPoint: 'boolean',
        clearCofactor: 'function',
        isTorsionFree: 'function',
        fromBytes: 'function',
        toBytes: 'function',
        endo: 'object',
        randomBytes: 'function',
    });
    // Snapshot every hook and take an owned copy of nested GLV configuration. Later mutations of
    // the caller's options must not change arithmetic, subgroup, or codec policy.
    const { endo: endoOpts, allowInfinityPoint, clearCofactor, isTorsionFree, fromBytes, toBytes, } = extraOpts;
    const randomBytes = extraOpts.randomBytes === undefined ? curves_utils_randomBytes : extraOpts.randomBytes;
    if (endoOpts) {
        if (!Fp.is0(CURVE.a) || typeof endoOpts.beta !== 'bigint' || !Array.isArray(endoOpts.basises)) {
            throw new Error('invalid endo: expected "beta": bigint and "basises": array');
        }
    }
    const endo = endoOpts
        ? {
            beta: endoOpts.beta,
            basises: endoOpts.basises.map((basis) => [...basis]),
        }
        : undefined;
    const lengths = getWLengths(Fp, Fn);
    function assertCompressionIsSupported() {
        if (!Fp.isOdd)
            throw new Error('compression is not supported: Field does not have .isOdd()');
    }
    // Implements IEEE P1363 point encoding
    function pointToBytes(_c, point, isCompressed) {
        // Handle infinity before toAffine(), which maps ZERO to (0, 0) silently: without this the
        // encoder would emit an all-zero byte string that decodes back as a different point. Only
        // curves that opt into infinity as a public point value get the SEC 1 byte form.
        if (point.is0()) {
            if (!allowInfinityPoint)
                throw new Error('bad point: ZERO');
            return Uint8Array.of(0); // SEC 1 v2.0 §2.3.3
        }
        const { x, y } = point.toAffine();
        const bx = Fp.toBytes(x);
        utils_abool(isCompressed, 'isCompressed');
        if (isCompressed) {
            assertCompressionIsSupported();
            const hasEvenY = !Fp.isOdd(y);
            return curves_utils_concatBytes(pprefix(hasEvenY), bx);
        }
        else {
            return curves_utils_concatBytes(Uint8Array.of(0x04), bx, Fp.toBytes(y));
        }
    }
    function pointFromBytes(bytes) {
        curves_utils_abytes(bytes, undefined, 'Point');
        const { publicKey: comp, publicKeyUncompressed: uncomp } = lengths; // e.g. for 32-byte: 33, 65
        const length = bytes.length;
        const head = bytes[0];
        const tail = bytes.subarray(1);
        // SEC 1 v2.0 §2.3.4 decodes 0x00 as infinity, but §3.2.2 rejects infinity as a public key.
        // Leaving 0x00 undecodable by default makes that rejection structural rather than a check:
        // callers reuse this parser as the strict key boundary, and infinity is simply not
        // expressible. Curves where infinity is a real wire value opt into the codec instead.
        // secp256k1 crosstests show OpenSSL raw point codecs accept 0x00 too.
        if (allowInfinityPoint && length === 1 && head === 0x00)
            return { x: Fp.ZERO, y: Fp.ZERO };
        // No actual validation is done here: use .assertValidity()
        if (length === comp && (head === 0x02 || head === 0x03)) {
            const x = Fp.fromBytes(tail);
            if (!Fp.isValid(x))
                throw new Error('bad point: is not on curve, wrong x');
            const y2 = weierstrassEquation(x); // y² = x³ + ax + b
            let y;
            try {
                y = Fp.sqrt(y2); // y = y² ^ (p+1)/4
            }
            catch (sqrtError) {
                const err = sqrtError instanceof Error ? ': ' + sqrtError.message : '';
                throw new Error('bad point: is not on curve, sqrt error' + err);
            }
            assertCompressionIsSupported();
            const evenY = Fp.isOdd(y);
            const evenH = (head & 1) === 1; // ECDSA-specific
            if (evenH !== evenY)
                y = Fp.neg(y);
            return { x, y };
        }
        else if (length === uncomp && head === 0x04) {
            // TODO: more checks
            const L = Fp.BYTES;
            const x = Fp.fromBytes(tail.subarray(0, L));
            const y = Fp.fromBytes(tail.subarray(L, L * 2));
            if (!isValidXY(x, y))
                throw new Error('bad point: is not on curve');
            return { x, y };
        }
        else {
            throw new Error(`bad point: got length ${length}, expected compressed=${comp} or uncompressed=${uncomp}`);
        }
    }
    const encodePoint = toBytes === undefined ? pointToBytes : toBytes;
    const decodePoint = fromBytes === undefined ? pointFromBytes : fromBytes;
    // Hoisted from double() / add(): curve params never change after construction.
    // Koblitz curves (a=0, e.g. secp256k1) skip the three a-multiplications per operation;
    // the selection depends only on public curve constants.
    const b3 = Fp.mul(CURVE.b, weierstrass_3n);
    const mulA = Fp.is0(CURVE.a) ? (_) => Fp.ZERO : (x) => Fp.mul(CURVE.a, x);
    function weierstrassEquation(x) {
        const x2 = Fp.sqr(x);
        const x3 = Fp.mul(x2, x);
        return Fp.add(Fp.add(x3, Fp.mul(x, CURVE.a)), CURVE.b); // x³ + a * x + b
    }
    // TODO: move top-level
    /** Checks whether equation holds for given x, y: y² == x³ + ax + b */
    function isValidXY(x, y) {
        const left = Fp.sqr(y);
        const right = weierstrassEquation(x); // x³ + ax + b
        return Fp.eql(left, right);
    }
    // Keep constructor-time generator validation cheap: callers are responsible for supplying the
    // correct prime-order base point, while eager subgroup checks here would slow heavy module imports.
    // Test 1: equation y² = x³ + ax + b should work for generator point.
    if (!isValidXY(CURVE.Gx, CURVE.Gy))
        throw new Error('bad curve params: generator point');
    // Test 2: discriminant Δ part should be non-zero: 4a³ + 27b² != 0.
    // Guarantees curve is genus-1, smooth (non-singular).
    const _4a3 = Fp.mul(Fp.pow(CURVE.a, weierstrass_3n), weierstrass_4n);
    const _27b2 = Fp.mul(Fp.sqr(CURVE.b), BigInt(27));
    if (Fp.is0(Fp.add(_4a3, _27b2)))
        throw new Error('bad curve params: a or b');
    /** Asserts coordinate is valid: 0 <= n < Fp.ORDER. */
    function acoord(title, n, banZero = false) {
        if (!Fp.isValid(n) || (banZero && Fp.is0(n)))
            throw new Error(`bad point coordinate ${title}`);
        // Extension-field elements are objects. Keep point coordinates detached from caller-owned
        // objects so their mutation cannot invalidate cached on-curve / subgroup checks. Primitive
        // field elements (bigints in shipped prime fields) are already immutable values.
        return typeof n === 'object' && n !== null ? Fp.create(n) : n;
    }
    function aprjpoint(other) {
        if (!(other instanceof Point))
            throw new Error('Weierstrass Point expected');
    }
    function splitEndoScalarN(k) {
        if (!endo || !endo.basises)
            throw new Error('no endo');
        return _splitEndoScalar(k, endo.basises, Fn.ORDER);
    }
    /**
     * Appends a (point, scalar) pair to the inputs of a vartime wNAF walk
     * ({@link mulAddUnsafe}). With GLV endomorphism the scalar is split into two half-width
     * pairs against P and ψ(P) = (β⋅x, y), halving the walk's shared doubling chain;
     * split signs fold into the points.
     */
    function pushWnafPair(points, scalars, p, k) {
        if (!Fn.isValid(k))
            throw new RangeError('invalid scalar: out of range'); // 0 is valid
        if (endo) {
            const { k1neg, k1, k2neg, k2 } = splitEndoScalarN(k);
            const psi = new Point(Fp.mul(p.X, endo.beta), p.Y, p.Z);
            points.push(k1neg ? p.negate() : p, k2neg ? psi.negate() : psi);
            scalars.push(k1, k2);
        }
        else {
            points.push(p);
            scalars.push(k);
        }
    }
    // Successful assertValidity() results are cached: Point instances are frozen at construction,
    // so on-curve + subgroup facts cannot change afterwards. Only success is cached — invalid
    // points re-throw on every call. This matters most for pairing curves, where subgroup checks
    // cost a scalar multiplication and the same instance is re-validated across layers
    // (signature fromBytes, pairingBatch) or across repeated verifies with a cached public key.
    const validityCache = new WeakSet();
    /**
     * Projective Point works in 3d / projective (homogeneous) coordinates:(X, Y, Z) ∋ (x=X/Z, y=Y/Z).
     * Default Point works in 2d / affine coordinates: (x, y).
     * We're doing calculations in projective, because its operations don't require costly inversion.
     */
    class Point {
        static BASE = new Point(CURVE.Gx, CURVE.Gy, Fp.ONE);
        static ZERO = new Point(Fp.ZERO, Fp.ONE, Fp.ZERO);
        static Fp = Fp;
        static Fn = Fn;
        X;
        Y;
        Z;
        /** Does NOT validate if the point is valid. Use `.assertValidity()`. */
        constructor(X, Y, Z) {
            this.X = acoord('x', X);
            // This is not just about ZERO / infinity: ambient curves can have real
            // finite points with y=0. Those points are 2-torsion, so they cannot lie
            // in the odd prime-order subgroups this point type is meant to represent.
            this.Y = acoord('y', Y, true);
            this.Z = acoord('z', Z);
            Object.freeze(this);
        }
        static CURVE() {
            return CURVE;
        }
        /** Does NOT validate if the point is valid. Use `.assertValidity()`. */
        static fromAffine(p) {
            const { x, y } = p || {};
            if (!p || !Fp.isValid(x) || !Fp.isValid(y))
                throw new Error('invalid affine point');
            if (p instanceof Point)
                throw new Error('projective point not allowed');
            // (0, 0) would've produced (0, 0, 1) - instead, we need (0, 1, 0)
            if (Fp.is0(x) && Fp.is0(y))
                return Point.ZERO;
            return new Point(x, y, Fp.ONE);
        }
        static fromBytes(bytes) {
            const P = Point.fromAffine(decodePoint(curves_utils_abytes(bytes, undefined, 'point')));
            P.assertValidity();
            return P;
        }
        static fromHex(hex) {
            return Point.fromBytes(utils_hexToBytes(hex));
        }
        get x() {
            return this.toAffine().x;
        }
        get y() {
            return this.toAffine().y;
        }
        /**
         * @param isLazy - true will defer table computation until the first multiplication
         */
        precompute(windowSize = 6, isLazy = true) {
            wnaf.setWindowSize(this, windowSize);
            if (!isLazy)
                this.multiply(weierstrass_3n); // random number
            return this;
        }
        // TODO: return `this`
        /** A point on curve is valid if it conforms to equation. */
        assertValidity() {
            const p = this;
            if (p.is0()) {
                // (0, 1, 0) aka ZERO is invalid in most contexts.
                // In BLS, ZERO can be serialized, so we allow it.
                // Keep the accepted infinity encoding canonical: projective-equivalent (X, Y, 0) points
                // like (1, 1, 0) compare equal to ZERO, but only (0, 1, 0) should pass this guard.
                if (allowInfinityPoint && Fp.is0(p.X) && Fp.eql(p.Y, Fp.ONE) && Fp.is0(p.Z))
                    return;
                throw new Error('bad point: ZERO');
            }
            if (validityCache.has(p))
                return;
            // Some 3rd-party test vectors require different wording between here & `fromCompressedHex`
            const { x, y } = p.toAffine();
            if (!Fp.isValid(x) || !Fp.isValid(y))
                throw new Error('bad point: x or y not field elements');
            if (!isValidXY(x, y))
                throw new Error('bad point: equation left != right');
            if (!p.isTorsionFree())
                throw new Error('bad point: not in prime-order subgroup');
            validityCache.add(p);
        }
        hasEvenY() {
            const { y } = this.toAffine();
            if (!Fp.isOdd)
                throw new Error("Field doesn't support isOdd");
            return !Fp.isOdd(y);
        }
        /** Compare one point to another. */
        equals(other) {
            aprjpoint(other);
            const { X: X1, Y: Y1, Z: Z1 } = this;
            const { X: X2, Y: Y2, Z: Z2 } = other;
            const U1 = Fp.eql(Fp.mul(X1, Z2), Fp.mul(X2, Z1));
            const U2 = Fp.eql(Fp.mul(Y1, Z2), Fp.mul(Y2, Z1));
            return U1 && U2;
        }
        /** Flips point to one corresponding to (x, -y) in Affine coordinates. */
        negate() {
            return new Point(this.X, Fp.neg(this.Y), this.Z);
        }
        // Renes-Costello-Batina exception-free doubling formula.
        // There is 30% faster Jacobian formula, but it is not complete.
        // https://eprint.iacr.org/2015/1060, algorithm 3
        // Cost: 8M + 3S + 3*a + 2*b3 + 15add.
        double() {
            const { X: X1, Y: Y1, Z: Z1 } = this;
            let X3 = Fp.ZERO, Y3 = Fp.ZERO, Z3 = Fp.ZERO; // prettier-ignore
            let t0 = Fp.mul(X1, X1); // step 1
            let t1 = Fp.mul(Y1, Y1);
            let t2 = Fp.mul(Z1, Z1);
            let t3 = Fp.mul(X1, Y1);
            t3 = Fp.add(t3, t3); // step 5
            Z3 = Fp.mul(X1, Z1);
            Z3 = Fp.add(Z3, Z3);
            X3 = mulA(Z3);
            Y3 = Fp.mul(b3, t2);
            Y3 = Fp.add(X3, Y3); // step 10
            X3 = Fp.sub(t1, Y3);
            Y3 = Fp.add(t1, Y3);
            Y3 = Fp.mul(X3, Y3);
            X3 = Fp.mul(t3, X3);
            Z3 = Fp.mul(b3, Z3); // step 15
            t2 = mulA(t2);
            t3 = Fp.sub(t0, t2);
            t3 = mulA(t3);
            t3 = Fp.add(t3, Z3);
            Z3 = Fp.add(t0, t0); // step 20
            t0 = Fp.add(Z3, t0);
            t0 = Fp.add(t0, t2);
            t0 = Fp.mul(t0, t3);
            Y3 = Fp.add(Y3, t0);
            t2 = Fp.mul(Y1, Z1); // step 25
            t2 = Fp.add(t2, t2);
            t0 = Fp.mul(t2, t3);
            X3 = Fp.sub(X3, t0);
            Z3 = Fp.mul(t2, t1);
            Z3 = Fp.add(Z3, Z3); // step 30
            Z3 = Fp.add(Z3, Z3);
            return new Point(X3, Y3, Z3);
        }
        // Renes-Costello-Batina exception-free addition formula.
        // There is 30% faster Jacobian formula, but it is not complete.
        // https://eprint.iacr.org/2015/1060, algorithm 1
        // Cost: 12M + 0S + 3*a + 3*b3 + 23add.
        add(other) {
            aprjpoint(other);
            const { X: X1, Y: Y1, Z: Z1 } = this;
            const { X: X2, Y: Y2, Z: Z2 } = other;
            let X3 = Fp.ZERO, Y3 = Fp.ZERO, Z3 = Fp.ZERO; // prettier-ignore
            let t0 = Fp.mul(X1, X2); // step 1
            let t1 = Fp.mul(Y1, Y2);
            let t2 = Fp.mul(Z1, Z2);
            let t3 = Fp.add(X1, Y1);
            let t4 = Fp.add(X2, Y2); // step 5
            t3 = Fp.mul(t3, t4);
            t4 = Fp.add(t0, t1);
            t3 = Fp.sub(t3, t4);
            t4 = Fp.add(X1, Z1);
            let t5 = Fp.add(X2, Z2); // step 10
            t4 = Fp.mul(t4, t5);
            t5 = Fp.add(t0, t2);
            t4 = Fp.sub(t4, t5);
            t5 = Fp.add(Y1, Z1);
            X3 = Fp.add(Y2, Z2); // step 15
            t5 = Fp.mul(t5, X3);
            X3 = Fp.add(t1, t2);
            t5 = Fp.sub(t5, X3);
            Z3 = mulA(t4);
            X3 = Fp.mul(b3, t2); // step 20
            Z3 = Fp.add(X3, Z3);
            X3 = Fp.sub(t1, Z3);
            Z3 = Fp.add(t1, Z3);
            Y3 = Fp.mul(X3, Z3);
            t1 = Fp.add(t0, t0); // step 25
            t1 = Fp.add(t1, t0);
            t2 = mulA(t2);
            t4 = Fp.mul(b3, t4);
            t1 = Fp.add(t1, t2);
            t2 = Fp.sub(t0, t2); // step 30
            t2 = mulA(t2);
            t4 = Fp.add(t4, t2);
            t0 = Fp.mul(t1, t4);
            Y3 = Fp.add(Y3, t0);
            t0 = Fp.mul(t5, t4); // step 35
            X3 = Fp.mul(t3, X3);
            X3 = Fp.sub(X3, t0);
            t0 = Fp.mul(t3, t1);
            Z3 = Fp.mul(t5, Z3);
            Z3 = Fp.add(Z3, t0); // step 40
            return new Point(X3, Y3, Z3);
        }
        subtract(other) {
            // Validate before calling `negate()` so wrong inputs fail with the point guard
            // instead of leaking a foreign `negate()` error.
            aprjpoint(other);
            return this.add(other.negate());
        }
        is0() {
            return this.equals(Point.ZERO);
        }
        /**
         * Constant time multiplication.
         * Uses precomputed tables (signed fixed-window wNAF) when available.
         * Uses scalar blinding and avoids endomorphism splitting in the secret-scalar path.
         * @param scalar - by which the point would be multiplied
         * @returns New point
         */
        multiply(scalar) {
            // Keep the subgroup-scalar contract strict instead of reducing 0 / n to ZERO.
            // In key/signature-style callers, those values usually mean broken hash/scalar plumbing,
            // and failing closed is safer than silently producing the identity point.
            if (!Fn.isValidNot0(scalar))
                throw new RangeError('invalid scalar: out of range'); // 0 is invalid
            const { p, f } = wnaf.mulSecret(this, scalar, cofactor, normalize);
            return normalize([p, f])[0];
        }
        /**
         * Non-constant-time multiplication. Uses width-4 wNAF with GLV endomorphism splitting
         * when available (two half-width scalars sharing one halved doubling chain).
         * It's faster, but should only be used when you don't care about
         * an exposed secret key e.g. sig verification, which works over *public* keys.
         */
        multiplyUnsafe(scalar) {
            const p = this;
            const sc = scalar;
            // Public-scalar callers may need 0, but n and larger values stay rejected here too.
            // Reducing them mod n would turn bad caller input into an accidental identity point.
            if (!Fn.isValid(sc))
                throw new RangeError('invalid scalar: out of range'); // 0 is valid
            if (sc === weierstrass_0n || p.is0())
                return Point.ZERO;
            if (sc === weierstrass_1n)
                return p;
            if (wnaf.hasWindowSize(this))
                return wnaf.mulUnsafe(p, sc, normalize); // precomputes
            const points = [];
            const scalars = [];
            pushWnafPair(points, scalars, p, sc);
            return mulAddUnsafe(Point, points, scalars);
        }
        /**
         * Non-constant-time double-scalar multiplication `a⋅this + b⋅other` (Strauss–Shamir).
         * Both walks share one doubling chain via {@link mulAddUnsafe}, and GLV endomorphism
         * (when available) halves the chain again by splitting each scalar into two half-width
         * parts. Used by ECDSA verification and public-key recovery for `R = u1⋅G + u2⋅P`.
         * Only for public scalars.
         */
        mulAddUnsafe(a, other, b) {
            aprjpoint(other);
            const points = [];
            const scalars = [];
            pushWnafPair(points, scalars, this, a);
            pushWnafPair(points, scalars, other, b);
            return mulAddUnsafe(Point, points, scalars);
        }
        /**
         * Converts Projective point to affine (x, y) coordinates.
         * (X, Y, Z) ∋ (x=X/Z, y=Y/Z).
         * @param invertedZ - Z^-1 (inverted zero) - optional, precomputation is useful for invertBatch
         */
        toAffine(invertedZ) {
            const p = this;
            let iz = invertedZ;
            if (iz != null && !Fp.isValid(iz))
                throw new RangeError('"invertedZ" expected valid field element');
            const { X, Y, Z } = p;
            // Fast-path for normalized points
            if (Fp.eql(Z, Fp.ONE))
                return { x: X, y: Y };
            const is0 = p.is0();
            // If invZ was 0, we return zero point. However we still want to execute
            // all operations, so we replace invZ with a random number, 1.
            if (iz == null)
                iz = is0 ? Fp.ONE : Fp.inv(Z);
            const x = Fp.mul(X, iz);
            const y = Fp.mul(Y, iz);
            const zz = Fp.mul(Z, iz);
            if (is0)
                return { x: Fp.ZERO, y: Fp.ZERO };
            if (!Fp.eql(zz, Fp.ONE))
                throw new Error('invZ was invalid');
            return { x, y };
        }
        /**
         * Checks whether Point is free of torsion elements (is in prime subgroup).
         * Always torsion-free for cofactor=1 curves.
         */
        isTorsionFree() {
            if (cofactor === weierstrass_1n)
                return true;
            if (isTorsionFree)
                return isTorsionFree(Point, this);
            // unsafe() will use the uncached wNAF path internally, since CURVE_ORDER >= Fn.ORDER
            return wnaf.mulUnsafe(this, CURVE_ORDER).is0();
        }
        clearCofactor() {
            if (cofactor === weierstrass_1n)
                return this; // Fast-path
            if (clearCofactor)
                return clearCofactor(Point, this);
            // Default fallback assumes the cofactor fits the usual subgroup-scalar
            // multiplyUnsafe() contract. Curves with larger / structured cofactors
            // should define a clearCofactor override anyway (e.g. psi/Frobenius maps).
            return this.multiplyUnsafe(cofactor);
        }
        isSmallOrder() {
            if (cofactor === weierstrass_1n)
                return this.is0(); // Fast-path
            return this.clearCofactor().is0();
        }
        toBytes(isCompressed = true) {
            utils_abool(isCompressed, 'isCompressed');
            // assertValidity() covers on-curve and subgroup membership. The encoder below repeats the
            // infinity check rather than relying on this call, so it stays correct for any caller.
            this.assertValidity();
            return encodePoint(Point, this, isCompressed);
        }
        toHex(isCompressed = true) {
            return utils_bytesToHex(this.toBytes(isCompressed));
        }
        toString() {
            return `<Point ${this.is0() ? 'ZERO' : this.toHex()}>`;
        }
    }
    const normalize = (points) => normalizeZ(Point, points);
    const wnaf = new ScalarMultiplier(Point, randomBytes);
    // Enable W=6 wNAF precomputes. Slows down first publicKey computation.
    // Disable for tiny toy curves, with scalar fields < 6 bits.
    if (wnaf.bits >= 6)
        Point.BASE.precompute(6);
    Object.freeze(Point.prototype);
    Object.freeze(Point);
    return Point;
}
// Points start with byte 0x02 when y is even; otherwise 0x03
function pprefix(hasEvenY) {
    return Uint8Array.of(hasEvenY ? 0x02 : 0x03);
}
function getWLengths(Fp, Fn) {
    return {
        secretKey: Fn.BYTES,
        publicKey: 1 + Fp.BYTES,
        publicKeyUncompressed: 1 + 2 * Fp.BYTES,
        publicKeyHasPrefix: true,
        // Raw compact `(r || s)` signature width; DER and recovered signatures use
        // different lengths outside this helper.
        signature: 2 * Fn.BYTES,
    };
}
/**
 * Sometimes users only need getPublicKey, getSharedSecret, and secret key handling.
 * This helper ensures no signature functionality is present. Less code, smaller bundle size.
 * @param Point - Weierstrass point constructor.
 * @param ecdhOpts - Optional randomness helpers:
 *   - `randomBytes` (optional): Optional RNG override.
 * @returns ECDH helper namespace.
 * @example
 * Sometimes users only need getPublicKey, getSharedSecret, and secret key handling.
 *
 * ```ts
 * import { ecdh } from '@noble/curves/abstract/weierstrass.js';
 * import { p256 } from '@noble/curves/nist.js';
 * const dh = ecdh(p256.Point);
 * const alice = dh.keygen();
 * const shared = dh.getSharedSecret(alice.secretKey, alice.publicKey);
 * ```
 */
function ecdh(Point, ecdhOpts = {}) {
    validatePointCons(Point);
    const { Fn } = Point;
    const randomBytes_ = ecdhOpts.randomBytes === undefined ? curves_utils_randomBytes : ecdhOpts.randomBytes;
    // Keep the advertised seed length aligned with mapHashToField(), which keeps a hard 16-byte
    // minimum even on toy curves.
    const lengths = Object.assign(getWLengths(Point.Fp, Fn), {
        seed: Math.max(getMinHashLength(Fn.ORDER), 16),
    });
    function isValidSecretKey(secretKey) {
        try {
            const num = Fn.fromBytes(secretKey);
            return Fn.isValidNot0(num);
        }
        catch (error) {
            return false;
        }
    }
    function isValidPublicKey(publicKey, isCompressed) {
        const { publicKey: comp, publicKeyUncompressed } = lengths;
        try {
            const l = publicKey.length;
            if (isCompressed === true && l !== comp)
                return false;
            if (isCompressed === false && l !== publicKeyUncompressed)
                return false;
            // SEC 1 §3.2.2: the identity is never a valid public key, even on curves whose codec
            // can decode it.
            return !Point.fromBytes(publicKey).is0();
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Produces cryptographically secure secret key from random of size
     * (groupLen + ceil(groupLen / 2)) with modulo bias being negligible.
     */
    function randomSecretKey(seed) {
        seed = seed === undefined ? randomBytes_(lengths.seed) : seed;
        return modular_mapHashToField(curves_utils_abytes(seed, lengths.seed, 'seed'), Fn.ORDER);
    }
    /**
     * Computes public key for a secret key. Checks for validity of the secret key.
     * @param isCompressed - whether to return compact (default), or full key
     * @returns Public key, full when isCompressed=false; short when isCompressed=true
     */
    function getPublicKey(secretKey, isCompressed = true) {
        return Point.BASE.multiply(Fn.fromBytes(secretKey)).toBytes(isCompressed);
    }
    /**
     * Quick and dirty check for item being public key. Does not validate hex, or being on-curve.
     */
    function isProbPub(item) {
        const { secretKey, publicKey, publicKeyUncompressed } = lengths;
        const allowedLengths = Fn._lengths;
        if (!curves_utils_isBytes(item))
            return undefined;
        const l = curves_utils_abytes(item, undefined, 'key').length;
        const isPub = l === publicKey || l === publicKeyUncompressed;
        const isSec = l === secretKey || !!allowedLengths?.includes(l);
        // P-521 accepts both 65- and 66-byte secret keys, so overlapping lengths stay ambiguous.
        if (isPub && isSec)
            return undefined;
        return isPub;
    }
    /**
     * ECDH (Elliptic Curve Diffie Hellman).
     * Computes encoded shared point from secret key A and public key B.
     * Checks: 1) secret key validity 2) shared key is on-curve.
     * Does NOT hash the result or expose the SEC 1 x-coordinate-only `z`.
     * Returns the encoded shared point on purpose: callers that need `x_P`
     * can derive it from the encoded point, but `x_P` alone cannot recover the
     * point/parity back.
     * This helper only exposes the fully validated public-key path, not cofactor DH.
     * @param isCompressed - whether to return compact (default), or full key
     * @returns shared point encoding
     */
    function getSharedSecret(secretKeyA, publicKeyB, isCompressed = true) {
        if (isProbPub(secretKeyA) === true)
            throw new Error('first arg must be private key');
        if (isProbPub(publicKeyB) === false)
            throw new Error('second arg must be public key');
        const s = Fn.fromBytes(secretKeyA);
        const b = Point.fromBytes(publicKeyB); // checks for being on-curve
        if (b.is0())
            throw new Error('invalid public key: point at infinity');
        return b.multiply(s).toBytes(isCompressed);
    }
    const utils = {
        isValidSecretKey,
        isValidPublicKey,
        randomSecretKey,
    };
    const keygen = curve_createKeygen(randomSecretKey, getPublicKey);
    Object.freeze(utils);
    Object.freeze(lengths);
    return Object.freeze({ getPublicKey, getSharedSecret, keygen, Point, utils, lengths });
}
/**
 * Creates ECDSA signing interface for given elliptic curve `Point` and `hash` function.
 *
 * @param Point - created using {@link weierstrass} function
 * @param hash - used for 1) message prehash-ing 2) k generation in `sign`, using hmac_drbg(hash)
 * @param ecdsaOpts - rarely needed, see {@link ECDSAOpts}:
 *   - `lowS`: Default low-S policy.
 *   - `hmac`: HMAC implementation used by RFC6979 DRBG.
 *   - `randomBytes`: Optional RNG override.
 *   - `bits2int`: Optional hash-to-int conversion override.
 *   - `bits2int_modN`: Optional hash-to-int-mod-n conversion override.
 *
 * @returns ECDSA helper namespace.
 * @example
 * Create an ECDSA signer/verifier bundle for one curve implementation.
 *
 * ```ts
 * import { ecdsa } from '@noble/curves/abstract/weierstrass.js';
 * import { p256 } from '@noble/curves/nist.js';
 * import { sha256 } from '@noble/hashes/sha2.js';
 * const p256ecdsa = ecdsa(p256.Point, sha256);
 * const { secretKey, publicKey } = p256ecdsa.keygen();
 * const msg = new TextEncoder().encode('hello noble');
 * const sig = p256ecdsa.sign(msg, secretKey);
 * const isValid = p256ecdsa.verify(sig, msg, publicKey);
 * ```
 */
function ecdsa(Point, hash, ecdsaOpts = {}) {
    validatePointCons(Point);
    // Custom hash / bits2int hooks are treated as pure functions over validated caller-owned bytes.
    const hash_ = hash;
    ahash(hash_);
    curves_utils_validateObject(ecdsaOpts, {}, {
        hmac: 'function',
        lowS: 'boolean',
        randomBytes: 'function',
        bits2int: 'function',
        bits2int_modN: 'function',
    });
    const opts = Object.assign({}, ecdsaOpts);
    const randomBytes = opts.randomBytes === undefined ? curves_utils_randomBytes : opts.randomBytes;
    const hmac = opts.hmac === undefined
        ? (key, msg) => hmac_hmac(hash_, key, msg)
        : opts.hmac;
    const { Fp, Fn } = Point;
    const { ORDER: CURVE_ORDER, BITS: fnBits } = Fn;
    // Nonce-inversion blinding in k2sig draws `getMinHashLength(n)` bytes per sign. Probe the RNG
    // once (see {@link probeRandomBytes}, shared with ScalarMultiplier): in environments without
    // working randomness, signing downgrades to Fermat inversion (invertCt) instead of throwing on
    // every sign(). The shape of returned bytes is still validated (by mapHashToField) on every
    // blinded call, where breakage fails closed.
    const blindLength = getMinHashLength(CURVE_ORDER);
    const csprng = probeRandomBytes(randomBytes, blindLength);
    const { keygen, getPublicKey, getSharedSecret, utils, lengths } = ecdh(Point, opts);
    const defaultSigOpts = {
        prehash: true,
        lowS: typeof opts.lowS === 'boolean' ? opts.lowS : true,
        format: 'compact',
        extraEntropy: false,
    };
    // SEC 1 4.1.6 public-key recovery tries x = r + jn for j = 0..h. Our recovered-signature
    // format only stores one overflow bit, so it can only distinguish q.x = r from q.x = r + n.
    // A third lift would have the form q.x = r + 2n. Since valid ECDSA r is in 1..n-1, the
    // smallest such lift is 1 + 2n, not 2n.
    const hasLargeRecoveryLifts = CURVE_ORDER * weierstrass_2n + weierstrass_1n < Fp.ORDER;
    function isBiggerThanHalfOrder(number) {
        const HALF = CURVE_ORDER >> weierstrass_1n;
        return number > HALF;
    }
    function validateRS(title, num) {
        if (!Fn.isValidNot0(num))
            throw new Error(`invalid signature ${title}: out of range 1..Point.Fn.ORDER`);
        return num;
    }
    function assertFieldSignIsSupported() {
        if (!Fp.isOdd)
            throw new Error("Field doesn't support isOdd");
    }
    // Recovery id of an affine point (x, y) whose x reduces to signature `r` mod n:
    // bit 0 = y parity, bit 1 = x overflowed the group order (x = r + n).
    function getRecoveryBit(x, y, r) {
        assertFieldSignIsSupported();
        return (x === r ? 0 : 2) | Number(Fp.isOdd(y));
    }
    function assertRecoverableCurve() {
        // ECDSA recovery only supports curves where the current recovery id can distinguish
        // q.x = r and q.x = r + n; larger lifts may need additional `r + n*i` branches.
        // SEC 1 4.1.6 recovers candidates via x = r + jn, but this format only encodes j = 0 or 1.
        // The next possible candidate is q.x = r + 2n, and its smallest valid value is 1 + 2n.
        // To easily get i, we either need to:
        // a. increase amount of valid recid values (4, 5...); OR
        // b. prohibit recovered signatures for those curves.
        if (hasLargeRecoveryLifts)
            throw new Error('"recovered" sig type is not supported for cofactor >2 curves');
    }
    function validateSigLength(bytes, format) {
        validateSigFormat(format);
        const size = lengths.signature;
        const sizer = format === 'compact' ? size : format === 'recovered' ? size + 1 : undefined;
        return curves_utils_abytes(bytes, sizer);
    }
    /**
     * ECDSA signature with its (r, s) properties. Supports compact, recovered & DER representations.
     */
    class Signature {
        r;
        s;
        recovery;
        constructor(r, s, recovery) {
            this.r = validateRS('r', r); // r in [1..N-1];
            this.s = validateRS('s', s); // s in [1..N-1];
            if (recovery != null) {
                assertRecoverableCurve();
                if (![0, 1, 2, 3].includes(recovery))
                    throw new Error('invalid recovery id');
                this.recovery = recovery;
            }
            Object.freeze(this);
        }
        static fromBytes(bytes, format = defaultSigOpts.format) {
            validateSigLength(bytes, format);
            let recid;
            if (format === 'der') {
                // Valid scalar INTEGERs use at most Fn.BYTES plus one DER sign-padding byte. Keep the
                // total bound conservative so malformed inputs are rejected before parsing any INTEGER.
                if (bytes.length > 2 * Fn.BYTES + 16)
                    throw new DER.Err('invalid signature: DER signature too long');
                const { r, s } = DER.toSig(curves_utils_abytes(bytes), Fn.BYTES + 1);
                return new Signature(r, s);
            }
            if (format === 'recovered') {
                recid = bytes[0];
                format = 'compact';
                bytes = bytes.subarray(1);
            }
            const L = lengths.signature / 2;
            const r = bytes.subarray(0, L);
            const s = bytes.subarray(L, L * 2);
            return new Signature(Fn.fromBytes(r), Fn.fromBytes(s), recid);
        }
        static fromHex(hex, format) {
            return this.fromBytes(utils_hexToBytes(hex), format);
        }
        assertRecovery() {
            const { recovery } = this;
            if (recovery == null)
                throw new Error('invalid recovery id: must be present');
            return recovery;
        }
        addRecoveryBit(recovery) {
            return new Signature(this.r, this.s, recovery);
        }
        // Unlike the top-level helper below, this method expects a digest that has
        // already been hashed to the curve's message representative.
        recoverPublicKey(messageHash) {
            const { r, s } = this;
            const recovery = this.assertRecovery();
            const radj = recovery === 2 || recovery === 3 ? r + CURVE_ORDER : r;
            if (!Fp.isValid(radj))
                throw new Error('invalid recovery id: sig.r+curve.n != R.x');
            const x = Fp.toBytes(radj);
            const R = Point.fromBytes(curves_utils_concatBytes(pprefix((recovery & 1) === 0), x));
            const ir = Fn.inv(radj); // r^-1
            const h = bits2int_modN(curves_utils_abytes(messageHash, undefined, 'msgHash')); // Truncate hash
            const u1 = Fn.create(-h * ir); // -hr^-1
            const u2 = Fn.create(s * ir); // sr^-1
            // (sr^-1)R-(hr^-1)G = -(hr^-1)G + (sr^-1). unsafe is fine: there is no private data.
            const Q = Point.BASE.mulAddUnsafe(u1, R, u2);
            if (Q.is0())
                throw new Error('invalid recovery: point at infinify');
            Q.assertValidity();
            return Q;
        }
        // Signatures should be low-s, to prevent malleability.
        hasHighS() {
            return isBiggerThanHalfOrder(this.s);
        }
        toBytes(format = defaultSigOpts.format) {
            validateSigFormat(format);
            if (format === 'der')
                return utils_hexToBytes(DER.hexFromSig(this));
            const { r, s } = this;
            const rb = Fn.toBytes(r);
            const sb = Fn.toBytes(s);
            if (format === 'recovered') {
                assertRecoverableCurve();
                return curves_utils_concatBytes(Uint8Array.of(this.assertRecovery()), rb, sb);
            }
            return curves_utils_concatBytes(rb, sb);
        }
        toHex(format) {
            return utils_bytesToHex(this.toBytes(format));
        }
    }
    Object.freeze(Signature.prototype);
    Object.freeze(Signature);
    // RFC6979: ensure ECDSA msg is X bytes and < N. RFC suggests optional truncating via bits2octets.
    // FIPS 186-4 4.6 suggests the leftmost min(nBitLen, outLen) bits, which matches bits2int.
    // bits2int can produce res>N, we can do mod(res, N) since the bitLen is the same.
    // int2octets can't be used; pads small msgs with 0: unacceptatble for trunc as per RFC vectors
    const bits2int = opts.bits2int === undefined
        ? function bits2int_def(bytes) {
            // Our custom check "just in case", for protection against DoS
            if (bytes.length > 8192)
                throw new Error('input is too large');
            // For curves with nBitLength % 8 !== 0: bits2octets(bits2octets(m)) !== bits2octets(m)
            // for some cases, since bytes.length * 8 is not actual bitLength.
            const num = utils_bytesToNumberBE(bytes); // check for == u8 done here
            const delta = bytes.length * 8 - fnBits; // truncate to nBitLength leftmost bits
            return delta > 0 ? num >> BigInt(delta) : num;
        }
        : opts.bits2int;
    const bits2int_modN = opts.bits2int_modN === undefined
        ? function bits2int_modN_def(bytes) {
            return Fn.create(bits2int(bytes)); // can't use bytesToNumberBE here
        }
        : opts.bits2int_modN;
    const ORDER_MASK = utils_bitMask(fnBits);
    // Pads output with zero as per spec.
    /** Converts to bytes. Checks if num in `[0..ORDER_MASK-1]` e.g.: `[0..2^256-1]`. */
    function int2octets(num) {
        aInRange('num < 2^' + fnBits, num, weierstrass_0n, ORDER_MASK);
        return Fn.toBytes(num);
    }
    function validateMsgAndHash(message, prehash) {
        curves_utils_abytes(message, undefined, 'message');
        return (prehash ? curves_utils_abytes(hash_(message), undefined, 'prehashed message') : message);
    }
    /**
     * Steps A, D of RFC6979 3.2.
     * Creates RFC6979 seed; converts msg/privKey to numbers.
     * Used only in sign, not in verify.
     *
     * Warning: we cannot assume here that message has same amount of bytes as curve order,
     * this will be invalid at least for P521. Also it can be bigger for P224 + SHA256.
     */
    function prepSig(message, secretKey, opts) {
        const { lowS, prehash, extraEntropy } = validateSigOpts(opts, defaultSigOpts);
        message = validateMsgAndHash(message, prehash); // RFC6979 3.2 A: h1 = H(m)
        // We can't later call bits2octets, since nested bits2int is broken for curves
        // with fnBits % 8 !== 0. Because of that, we unwrap it here as int2octets call.
        // const bits2octets = (bits) => int2octets(bits2int_modN(bits))
        const h1int = bits2int_modN(message);
        const d = Fn.fromBytes(secretKey); // validate secret key, convert to bigint
        if (!Fn.isValidNot0(d))
            throw new Error('invalid private key');
        const seedArgs = [int2octets(d), int2octets(h1int)];
        // extraEntropy. RFC6979 3.6: additional k' (optional).
        if (extraEntropy != null && extraEntropy !== false) {
            // K = HMAC_K(V || 0x00 || int2octets(x) || bits2octets(h1) || k')
            // gen random bytes OR pass as-is
            const e = extraEntropy === true ? randomBytes(lengths.secretKey) : extraEntropy;
            seedArgs.push(curves_utils_abytes(e, undefined, 'extraEntropy')); // check for being bytes
        }
        const seed = curves_utils_concatBytes(...seedArgs); // Step D of RFC6979 3.2
        const m = h1int; // no need to call bits2int second time here, it is inside truncateHash!
        // Converts signature params into point w r/s, checks result for validity.
        // To transform k => Signature:
        // q = k⋅G
        // r = q.x mod n
        // s = k^-1(m + rd) mod n
        // The nonce inversion is blinded: with random b ∈ [1,n−1], s = (bk)^-1(bm + bdr) per
        // https://tches.iacr.org/index.php/TCHES/article/view/7337/6509. Fn.inv()'s extended-Euclidean
        // loop count depends on its input (cf. Minerva), but here it only ever sees b·k — uniformly
        // random, independent of k — so its timing reveals nothing about the nonce; b also masks d in
        // the products. Without a CSPRNG (probed in ecdsa()) we fall back to Fermat inversion
        // (invertCt), whose control flow is data-independent, at ~4x the inversion cost.
        function k2sig(kBytes) {
            // RFC 6979 Section 3.2, step 3: k = bits2int(T)
            // Important: all mod() calls here must be done over N
            const k = bits2int(kBytes); // Cannot use fields methods, since it is group element
            if (!Fn.isValidNot0(k))
                return; // Valid scalars (including k) must be in 1..N-1
            const q = Point.BASE.multiply(k).toAffine(); // q = k⋅G
            const r = Fn.create(q.x); // r = q.x mod n
            if (r === weierstrass_0n)
                return;
            let s;
            if (csprng !== undefined) {
                // mapHashToField maps 1.5x-order-length uniform bytes into [1, n-1], negligible bias.
                const b = utils_bytesToNumberBE(modular_mapHashToField(csprng(blindLength), CURVE_ORDER));
                const ibk = Fn.inv(Fn.mul(b, k)); // (bk)^-1: inversion input is decorrelated from k
                const bm = Fn.mul(b, m);
                const bd = Fn.mul(b, d);
                s = Fn.create(ibk * Fn.create(bm + bd * r)); // s = (bk)^-1(bm + bdr) = k^-1(m + rd) mod n
            }
            else {
                const ik = invertCt(k, CURVE_ORDER); // k^-1 mod n with data-independent control flow
                s = Fn.create(ik * Fn.create(m + r * d)); // s = k^-1(m + rd) mod n
            }
            if (s === weierstrass_0n)
                return;
            let recovery = getRecoveryBit(q.x, q.y, r); // recovery bit (2 or 3 when q.x>n)
            let normS = s;
            if (lowS && isBiggerThanHalfOrder(s)) {
                normS = Fn.neg(s); // if lowS was passed, ensure s is always in the bottom half of N
                recovery ^= 1;
            }
            return new Signature(r, normS, hasLargeRecoveryLifts ? undefined : recovery);
        }
        return { seed, k2sig };
    }
    /**
     * Signs a message or message hash with a secret key.
     * With the default `prehash: true`, raw message bytes are hashed internally;
     * only `{ prehash: false }` expects a caller-supplied digest.
     *
     * ```
     * sign(m, d) where
     *   k = rfc6979_hmac_drbg(m, d)
     *   (x, y) = G × k
     *   r = x mod n
     *   s = (m + dr) / k mod n
     * ```
     */
    function sign(message, secretKey, opts = {}) {
        const { seed, k2sig } = prepSig(message, secretKey, opts); // Steps A, D of RFC6979 3.2.
        const drbg = createHmacDrbg(hash_.outputLen, Fn.BYTES, hmac);
        const sig = drbg(seed, k2sig); // Steps B, C, D, E, F, G
        return sig.toBytes(opts.format);
    }
    /**
     * Verifies a signature against message and public key.
     * Rejects lowS signatures by default: see {@link ECDSAVerifyOpts}.
     * Implements section 4.1.4 from https://www.secg.org/sec1-v2.pdf:
     *
     * ```
     * verify(r, s, h, P) where
     *   u1 = hs^-1 mod n
     *   u2 = rs^-1 mod n
     *   R = u1⋅G + u2⋅P
     *   mod(R.x, n) == r
     * ```
     */
    function verify(signature, message, publicKey, opts = {}) {
        const { lowS, prehash, format } = validateSigOpts(opts, defaultSigOpts);
        publicKey = curves_utils_abytes(publicKey, undefined, 'publicKey');
        message = validateMsgAndHash(message, prehash);
        if (!curves_utils_isBytes(signature)) {
            const end = signature instanceof Signature ? ', use sig.toBytes()' : '';
            throw new Error('verify expects Uint8Array signature' + end);
        }
        validateSigLength(signature, format); // execute this twice because we want loud error
        try {
            const sig = Signature.fromBytes(signature, format);
            const P = Point.fromBytes(publicKey);
            // SEC 1 verification keys must not be the identity, even when the generic point decoder
            // permits infinity for another protocol (for example, a pairing curve).
            if (P.is0())
                return false;
            if (lowS && sig.hasHighS())
                return false;
            const { r, s } = sig;
            const h = bits2int_modN(message); // mod n, not mod p
            const is = Fn.inv(s); // s^-1 mod n
            const u1 = Fn.create(h * is); // u1 = hs^-1 mod n
            const u2 = Fn.create(r * is); // u2 = rs^-1 mod n
            const R = Point.BASE.mulAddUnsafe(u1, P, u2); // u1⋅G + u2⋅P, joint Strauss–Shamir
            if (R.is0())
                return false;
            const q = R.toAffine();
            const v = Fn.create(q.x); // v = R.x mod n
            if (v !== r)
                return false;
            // R is the exact point `recoverPublicKey(r, recid)` reconstructs (sR = hG + rP),
            // so binding the signature to its recovery id only needs R's parity/overflow bits.
            if (format === 'recovered' && sig.recovery !== getRecoveryBit(q.x, q.y, r))
                return false;
            return true;
        }
        catch (e) {
            return false;
        }
    }
    function recoverPublicKey(signature, message, opts = {}) {
        // Top-level recovery mirrors `sign()` / `verify()`: it hashes raw message
        // bytes first unless the caller passes `{ prehash: false }`.
        const { prehash } = validateSigOpts(opts, defaultSigOpts);
        message = validateMsgAndHash(message, prehash);
        return Signature.fromBytes(signature, 'recovered').recoverPublicKey(message).toBytes();
    }
    // utils.isValidPublicKey() already rejects the identity, so ECDSA needs no shadow copy.
    return Object.freeze({
        keygen,
        getPublicKey,
        getSharedSecret,
        utils,
        lengths,
        Point,
        sign,
        verify,
        recoverPublicKey,
        Signature,
        hash: hash_,
    });
}

;// ./node_modules/@noble/curves/secp256k1.js
/**
 * SECG secp256k1. See [pdf](https://www.secg.org/sec2-v2.pdf).
 *
 * Belongs to Koblitz curves: it has efficiently-computable GLV endomorphism ψ,
 * check out {@link EndomorphismOpts}. Seems to be rigid (not backdoored).
 * @module
 */
/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */








// Seems like generator was produced from some seed:
// `Pointk1.BASE.multiply(Pointk1.Fn.inv(2n, N)).toAffine().x`
// // gives short x 0x3b78ce563f89a0ed9414f5aa28ad0d96d6795f9c63n
const secp256k1_CURVE = {
    p: BigInt('0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc2f'),
    n: BigInt('0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141'),
    h: BigInt(1),
    a: BigInt(0),
    b: BigInt(7),
    Gx: BigInt('0x79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798'),
    Gy: BigInt('0x483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8'),
};
const secp256k1_ENDO = {
    beta: BigInt('0x7ae96a2b657c07106e64479eac3434e99cf0497512f58995c1396c28719501ee'),
    basises: [
        [BigInt('0x3086d221a7d46bcde86c90e49284eb15'), -BigInt('0xe4437ed6010e88286f547fa90abfe4c3')],
        [BigInt('0x114ca50f7a8e2f3f657c1108d9d44cfd8'), BigInt('0x3086d221a7d46bcde86c90e49284eb15')],
    ],
};
const secp256k1_0n = /* @__PURE__ */ BigInt(0);
const secp256k1_2n = /* @__PURE__ */ BigInt(2);
/**
 * √n = n^((p+1)/4) for fields p = 3 mod 4. We unwrap the loop and multiply bit-by-bit.
 * (P+1n/4n).toString(2) would produce bits [223x 1, 0, 22x 1, 4x 0, 11, 00]
 */
function sqrtMod(y) {
    const P = secp256k1_CURVE.p;
    // prettier-ignore
    const _3n = BigInt(3), _6n = BigInt(6), _11n = BigInt(11), _22n = BigInt(22);
    // prettier-ignore
    const _23n = BigInt(23), _44n = BigInt(44), _88n = BigInt(88);
    const b2 = (y * y * y) % P; // x^3, 11
    const b3 = (b2 * b2 * y) % P; // x^7
    const b6 = (modular_pow2(b3, _3n, P) * b3) % P;
    const b9 = (modular_pow2(b6, _3n, P) * b3) % P;
    const b11 = (modular_pow2(b9, secp256k1_2n, P) * b2) % P;
    const b22 = (modular_pow2(b11, _11n, P) * b11) % P;
    const b44 = (modular_pow2(b22, _22n, P) * b22) % P;
    const b88 = (modular_pow2(b44, _44n, P) * b44) % P;
    const b176 = (modular_pow2(b88, _88n, P) * b88) % P;
    const b220 = (modular_pow2(b176, _44n, P) * b44) % P;
    const b223 = (modular_pow2(b220, _3n, P) * b3) % P;
    const t1 = (modular_pow2(b223, _23n, P) * b22) % P;
    const t2 = (modular_pow2(t1, _6n, P) * b2) % P;
    const root = modular_pow2(t2, secp256k1_2n, P);
    if (!Fpk1.eql(Fpk1.sqr(root), y))
        throw new Error('Cannot find square root');
    return root;
}
const Fpk1 = /* @__PURE__ */ Field(secp256k1_CURVE.p, { sqrt: sqrtMod });
const Pointk1 = /* @__PURE__ */ weierstrass(secp256k1_CURVE, {
    Fp: Fpk1,
    endo: secp256k1_ENDO,
});
/**
 * secp256k1 curve: ECDSA and ECDH methods.
 *
 * Uses sha256 to hash messages. To use a different hash,
 * pass `{ prehash: false }` to sign / verify.
 *
 * @example
 * Generate one secp256k1 keypair, sign a message, and verify it.
 *
 * ```js
 * import { secp256k1 } from '@noble/curves/secp256k1.js';
 * const { secretKey, publicKey } = secp256k1.keygen();
 * // const publicKey = secp256k1.getPublicKey(secretKey);
 * const msg = new TextEncoder().encode('hello noble');
 * const sig = secp256k1.sign(msg, secretKey);
 * const isValid = secp256k1.verify(sig, msg, publicKey);
 * // const sigKeccak = secp256k1.sign(keccak256(msg), secretKey, { prehash: false });
 * ```
 */
const secp256k1 = /* @__PURE__ */ ecdsa(Pointk1, sha2_sha256);
// Schnorr signatures are superior to ECDSA from above. Below is Schnorr-specific BIP0340 code.
// https://github.com/bitcoin/bips/blob/master/bip-0340.mediawiki
/** An object mapping tags to their tagged hash prefix of [SHA256(tag) | SHA256(tag)] */
const TAGGED_HASH_PREFIXES = Object.create(null);
// BIP-340 phrases tags as UTF-8, but all current standardized names here are 7-bit ASCII.
function taggedHash(tag, ...messages) {
    let tagP = TAGGED_HASH_PREFIXES[tag];
    if (tagP === undefined) {
        const tagH = sha2_sha256(utils_asciiToBytes(tag));
        tagP = curves_utils_concatBytes(tagH, tagH);
        TAGGED_HASH_PREFIXES[tag] = tagP;
    }
    return sha2_sha256(curves_utils_concatBytes(tagP, ...messages));
}
// ECDSA compact points are 33-byte. Schnorr is 32: we strip first byte 0x02 or 0x03
const pointToBytes = (point) => point.toBytes(true).slice(1);
const affineXToBytes = ({ x }) => Fpk1.toBytes(x);
const hasEven = (y) => !Fpk1.isOdd(y);
// Calculate point, scalar and bytes
function schnorrGetExtPubKey(priv) {
    const { Fn, BASE } = Pointk1;
    const d_ = Fn.fromBytes(abytes(priv, 32, 'secretKey'));
    const p = BASE.multiply(d_); // P = d'⋅G; 0 < d' < n check is done inside
    const affine = p.toAffine();
    const scalar = hasEven(affine.y) ? d_ : Fn.neg(d_);
    return { scalar, bytes: affineXToBytes(affine) };
}
/**
 * lift_x from BIP340. Convert 32-byte x coordinate to elliptic curve point.
 * @returns valid point checked for being on-curve
 */
function lift_x(x) {
    const Fp = Fpk1;
    if (!Fp.isValidNot0(x))
        throw new Error('invalid x: Fail if x ≥ p');
    const xx = Fp.sqr(x);
    const c = Fp.add(Fp.mulN(xx, x), BigInt(7)); // Let c = x³ + 7 mod p.
    let y = Fp.sqrt(c); // Let y = c^(p+1)/4 mod p. Same as sqrt().
    // Return the unique point P such that x(P) = x and
    // y(P) = y if y mod 2 = 0 or y(P) = p-y otherwise.
    if (!hasEven(y))
        y = Fp.neg(y);
    const p = Pointk1.fromAffine({ x, y });
    p.assertValidity();
    return p;
}
// BIP-340 callers still need to supply canonical 32-byte inputs where required; this alias only
// parses big-endian bytes and does not enforce the fixed-width contract itself.
const num = (/* unused pure expression or super */ null && (bytesToNumberBE));
/** Create tagged hash, convert it to bigint, reduce modulo-n. */
function challenge(...args) {
    return Pointk1.Fn.create(num(taggedHash('BIP0340/challenge', ...args)));
}
/** Schnorr public key is just `x` coordinate of Point as per BIP340. */
function schnorrGetPublicKey(secretKey) {
    return schnorrGetExtPubKey(secretKey).bytes; // d'=int(sk). Fail if d'=0 or d'≥n. Ret bytes(d'⋅G)
}
/**
 * Creates Schnorr signature as per BIP340. Verifies itself before returning anything.
 * `auxRand` is optional and is not the sole source of `k` generation: bad CSPRNG output will not
 * be catastrophic, but BIP-340 still recommends fresh auxiliary randomness when available to harden
 * deterministic signing against side-channel and fault-injection attacks.
 */
function schnorrSign(message, secretKey, auxRand = randomBytes(32)) {
    const { Fn, BASE } = Pointk1;
    // Snapshot once: nonce, challenge, and self-verification must use one transcript.
    const m = copyBytes(abytes(message, undefined, 'message'));
    const { bytes: px, scalar: d } = schnorrGetExtPubKey(secretKey); // checks for isWithinCurveOrder
    const a = abytes(auxRand, 32, 'auxRand'); // Auxiliary random data a: a 32-byte array
    // Let t be the byte-wise xor of bytes(d) and hash/aux(a).
    const t = Fn.toBytes(d ^ num(taggedHash('BIP0340/aux', a)));
    const rand = taggedHash('BIP0340/nonce', t, px, m); // Let rand = hash/nonce(t || bytes(P) || m)
    // BIP340 defines k' = int(rand) mod n. We can't reuse schnorrGetExtPubKey(rand)
    // here: that helper parses canonical secret keys and rejects rand >= n instead
    // of reducing the nonce hash modulo the group order.
    const k_ = Fn.create(num(rand));
    // BIP-340: "Let k' = int(rand) mod n. Fail if k' = 0. Let R = k'⋅G."
    if (k_ === secp256k1_0n)
        throw new Error('sign failed: k is zero');
    const p = BASE.multiply(k_); // Rejects zero; only the raw nonce hash needs reduction.
    const affine = p.toAffine();
    const k = hasEven(affine.y) ? k_ : Fn.neg(k_);
    const rx = affineXToBytes(affine);
    const e = challenge(rx, px, m); // Let e = int(hash/challenge(bytes(R) || bytes(P) || m)) mod n.
    const sig = new Uint8Array(64); // Let sig = bytes(R) || bytes((k + ed) mod n).
    sig.set(rx, 0);
    sig.set(Fn.toBytes(Fn.create(k + e * d)), 32);
    // If Verify(bytes(P), m, sig) (see below) returns failure, abort
    if (!schnorrVerify(sig, m, px))
        throw new Error('sign: Invalid signature produced');
    return sig;
}
/**
 * Verifies Schnorr signature.
 * Will swallow errors & return false except for initial type validation of arguments.
 */
function schnorrVerify(signature, message, publicKey) {
    const { Fp, Fn, BASE } = Pointk1;
    const sig = abytes(signature, 64, 'signature');
    const m = abytes(message, undefined, 'message');
    const pub = abytes(publicKey, 32, 'publicKey');
    try {
        const P = lift_x(num(pub)); // P = lift_x(int(pk)); fail if that fails
        const rBytes = sig.subarray(0, 32);
        const r = num(rBytes); // Let r = int(sig[0:32]); fail if r ≥ p.
        if (!Fp.isValidNot0(r))
            return false;
        const s = num(sig.subarray(32, 64)); // Let s = int(sig[32:64]); fail if s ≥ n.
        // Stricter than BIP-340/libsecp256k1, which only reject s >= n. Honest signing reaches
        // s = 0 only with negligible probability (k + e*d ≡ 0 mod n), so treat zero-s inputs as
        // crafted edge cases and fail closed instead of carrying that extra verification surface.
        if (!Fn.isValidNot0(s))
            return false;
        // int(challenge(bytes(r) || bytes(P) || m)) % n
        const e = challenge(rBytes, pointToBytes(P), m);
        // R = s⋅G - e⋅P, where -eP == (n-e)P
        const R = BASE.mulAddUnsafe(s, P, Fn.neg(e)); // s⋅G + (-e)⋅P, joint Strauss–Shamir
        const { x, y } = R.toAffine();
        // Fail if is_infinite(R) / not has_even_y(R) / x(R) ≠ r.
        if (R.is0() || !hasEven(y) || !Fp.eql(x, r))
            return false;
        return true;
    }
    catch (error) {
        return false;
    }
}
const __TEST = /* @__PURE__ */ Object.freeze({ lift_x, frostTweakPublic, frostTweakSecret });
/**
 * Schnorr signatures over secp256k1.
 * See {@link https://github.com/bitcoin/bips/blob/master/bip-0340.mediawiki | BIP 340}.
 * @example
 * Generate one BIP340 Schnorr keypair, sign a message, and verify it.
 *
 * ```js
 * import { schnorr } from '@noble/curves/secp256k1.js';
 * const { secretKey, publicKey } = schnorr.keygen();
 * // const publicKey = schnorr.getPublicKey(secretKey);
 * const msg = new TextEncoder().encode('hello');
 * const sig = schnorr.sign(msg, secretKey);
 * const isValid = schnorr.verify(sig, msg, publicKey);
 * ```
 */
const schnorr = /* @__PURE__ */ (/* unused pure expression or super */ null && ((() => {
    const size = 32;
    const seedLength = 48;
    const randomSecretKey = (seed) => {
        seed = seed === undefined ? randomBytes(seedLength) : seed;
        return mapHashToField(abytes(seed, seedLength, 'seed'), secp256k1_CURVE.n);
    };
    return Object.freeze({
        keygen: createKeygen(randomSecretKey, schnorrGetPublicKey),
        getPublicKey: schnorrGetPublicKey,
        sign: schnorrSign,
        verify: schnorrVerify,
        Point: Pointk1,
        utils: Object.freeze({
            randomSecretKey,
            taggedHash,
            lift_x,
            pointToBytes,
        }),
        lengths: Object.freeze({
            secretKey: size,
            publicKey: size,
            publicKeyHasPrefix: false,
            signature: size * 2,
            seed: seedLength,
        }),
    });
})()));
// RFC 9380 Appendix E.1 3-isogeny coefficients for secp256k1, stored in ascending degree order.
// The final `1` in each denominator array is the explicit monic leading term.
const isoMap = /* @__PURE__ */ (/* unused pure expression or super */ null && ((() => isogenyMap(Fpk1, [
    // xNum
    [
        '0x8e38e38e38e38e38e38e38e38e38e38e38e38e38e38e38e38e38e38daaaaa8c7',
        '0x7d3d4c80bc321d5b9f315cea7fd44c5d595d2fc0bf63b92dfff1044f17c6581',
        '0x534c328d23f234e6e2a413deca25caece4506144037c40314ecbd0b53d9dd262',
        '0x8e38e38e38e38e38e38e38e38e38e38e38e38e38e38e38e38e38e38daaaaa88c',
    ],
    // xDen
    [
        '0xd35771193d94918a9ca34ccbb7b640dd86cd409542f8487d9fe6b745781eb49b',
        '0xedadc6f64383dc1df7c4b2d51b54225406d36b641f5e41bbc52a56612a8c6d14',
        '0x0000000000000000000000000000000000000000000000000000000000000001', // LAST 1
    ],
    // yNum
    [
        '0x4bda12f684bda12f684bda12f684bda12f684bda12f684bda12f684b8e38e23c',
        '0xc75e0c32d5cb7c0fa9d0a54b12a0a6d5647ab046d686da6fdffc90fc201d71a3',
        '0x29a6194691f91a73715209ef6512e576722830a201be2018a765e85a9ecee931',
        '0x2f684bda12f684bda12f684bda12f684bda12f684bda12f684bda12f38e38d84',
    ],
    // yDen
    [
        '0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffefffff93b',
        '0x7a06534bb8bdb49fd5e9e6632722c2989467c1bfc8e8d978dfb425d2685c2573',
        '0x6484aa716545ca2cf3a70c3fa8fe337e0a3d21162f0d6299a7bf8192bfd2a76f',
        '0x0000000000000000000000000000000000000000000000000000000000000001', // LAST 1
    ],
].map((i) => i.map((j) => BigInt(j)))))()));
// RFC 9380 §8.7 secp256k1 E' parameters for the SWU-to-isogeny pipeline below.
let mapSWU;
const getMapSWU = () => mapSWU ||
    (mapSWU = mapToCurveSimpleSWU(Fpk1, {
        // Building the SWU sqrt-ratio helper eagerly adds noticeable `secp256k1.js` import cost, so
        // defer it to first use; after that the cached mapper is reused directly.
        A: BigInt('0x3f8731abdd661adca08a5558f0f5d272e953d363cb6f0e5d405447c01a444533'),
        B: BigInt('1771'),
        Z: Fpk1.create(BigInt('-11')),
    }));
/**
 * Hashing / encoding to secp256k1 points / field. RFC 9380 methods.
 * @example
 * Hash one message onto secp256k1.
 *
 * ```ts
 * const point = secp256k1_hasher.hashToCurve(new TextEncoder().encode('hello noble'));
 * ```
 */
const secp256k1_hasher = /* @__PURE__ */ (/* unused pure expression or super */ null && ((() => createHasher(Pointk1, (scalars) => {
    const { x, y } = getMapSWU()(Fpk1.create(scalars[0]));
    return isoMap(x, y);
}, {
    DST: 'secp256k1_XMD:SHA-256_SSWU_RO_',
    encodeDST: 'secp256k1_XMD:SHA-256_SSWU_NU_',
    p: Fpk1.ORDER,
    m: 1,
    k: 128,
    expand: 'xmd',
    hash: sha256,
}))()));
/**
 * FROST threshold signatures over secp256k1. RFC 9591.
 * @example
 * Create one trusted-dealer package for 2-of-3 secp256k1 signing.
 *
 * ```ts
 * const alice = secp256k1_FROST.Identifier.derive('alice@example.com');
 * const bob = secp256k1_FROST.Identifier.derive('bob@example.com');
 * const carol = secp256k1_FROST.Identifier.derive('carol@example.com');
 * const deal = secp256k1_FROST.trustedDealer({ min: 2, max: 3 }, [alice, bob, carol]);
 * ```
 */
const secp256k1_FROST = /* @__PURE__ */ (/* unused pure expression or super */ null && ((() => createFROST({
    name: 'FROST-secp256k1-SHA256-v1',
    Point: Pointk1,
    hashToScalar: secp256k1_hasher.hashToScalar,
    hash: sha256,
}))()));
// Taproot utils
// `undefined` means "disable TapTweak entirely"; callers that want the BIP-341/BIP-386 empty
// merkle root must pass `new Uint8Array(0)` explicitly.
function tweak(point, merkleRoot) {
    if (merkleRoot === undefined)
        return secp256k1_0n;
    const x = pointToBytes(point);
    const t = utils_bytesToNumberBE(taggedHash('TapTweak', x, merkleRoot));
    // BIP-341 taproot_tweak_pubkey/taproot_tweak_seckey: "if t >= SECP256K1_ORDER:
    // raise ValueError". TapTweak must reject overflow instead of reducing modulo n.
    if (!Pointk1.Fn.isValid(t))
        throw new Error('invalid TapTweak hash');
    return t;
}
function frostPubToEvenY(pub) {
    const VK = Pointk1.fromBytes(pub.commitments[0]);
    // Keep aliasing on the already-even path so wrapper callers can skip unnecessary cloning.
    if (hasEven(VK.y))
        return pub;
    return {
        signers: { min: pub.signers.min, max: pub.signers.max },
        commitments: pub.commitments.map((i) => Pointk1.fromBytes(i).negate().toBytes()),
        verifyingShares: Object.fromEntries(Object.entries(pub.verifyingShares).map(([k, v]) => [
            k,
            Pointk1.fromBytes(v).negate().toBytes(),
        ])),
    };
}
function frostSecretToEvenY(s, pub) {
    const VK = Pointk1.fromBytes(pub.commitments[0]);
    // Keep aliasing on the already-even path so wrapper callers can preserve package identity.
    if (hasEven(VK.y))
        return s;
    const Fn = Pointk1.Fn;
    return {
        ...s,
        signingShare: Fn.toBytes(Fn.neg(Fn.fromBytes(s.signingShare))),
    };
}
function frostNoncesToEvenY(groupCommitment, nonces) {
    if (hasEven(groupCommitment.y))
        return nonces;
    const Fn = Pointk1.Fn;
    return {
        binding: Fn.toBytes(Fn.neg(Fn.fromBytes(nonces.binding))),
        hiding: Fn.toBytes(Fn.neg(Fn.fromBytes(nonces.hiding))),
    };
}
function frostTweakSecret(s, pub, merkleRoot) {
    const Fn = Pointk1.Fn;
    const keyPackage = frostSecretToEvenY(s, pub);
    const evenPub = frostPubToEvenY(pub);
    const t = tweak(Pointk1.fromBytes(evenPub.commitments[0]), merkleRoot);
    const signingShare = Fn.toBytes(Fn.add(Fn.fromBytes(keyPackage.signingShare), t));
    return {
        identifier: keyPackage.identifier,
        signingShare,
    };
}
function frostTweakPublic(pub, merkleRoot) {
    const PKPackage = frostPubToEvenY(pub);
    const t = tweak(Pointk1.fromBytes(PKPackage.commitments[0]), merkleRoot);
    // Disabled TapTweak (t=0): return the even-Y-normalized package as-is. multiply() rejects
    // zero scalars, and adding [0]G would be a no-op anyway.
    if (t === secp256k1_0n)
        return PKPackage;
    const tp = Pointk1.BASE.multiply(t);
    const commitments = PKPackage.commitments.map((c, i) => (i === 0 ? Pointk1.fromBytes(c).add(tp) : Pointk1.fromBytes(c)).toBytes());
    const verifyingShares = {};
    for (const k in PKPackage.verifyingShares) {
        verifyingShares[k] = Pointk1.fromBytes(PKPackage.verifyingShares[k]).add(tp).toBytes();
    }
    return {
        signers: { min: PKPackage.signers.min, max: PKPackage.signers.max },
        commitments,
        verifyingShares,
    };
}
/**
 * FROST threshold signatures over secp256k1-schnorr-taproot. RFC 9591.
 * DKG outputs are auto-tweaked with the empty Taproot merkle root for compatibility, while
 * `trustedDealer()` outputs stay untweaked unless callers apply the Taproot tweak themselves.
 * @example
 * Create one trusted-dealer package for Taproot-compatible FROST signing.
 *
 * ```ts
 * const alice = schnorr_FROST.Identifier.derive('alice@example.com');
 * const bob = schnorr_FROST.Identifier.derive('bob@example.com');
 * const carol = schnorr_FROST.Identifier.derive('carol@example.com');
 * const deal = schnorr_FROST.trustedDealer({ min: 2, max: 3 }, [alice, bob, carol]);
 * ```
 */
const schnorr_FROST = /* @__PURE__ */ (/* unused pure expression or super */ null && ((() => createFROST({
    name: 'FROST-secp256k1-SHA256-TR-v1',
    Point: Pointk1,
    hashToScalar: secp256k1_hasher.hashToScalar,
    hash: sha256,
    // Taproot related hacks
    parsePublicKey(publicKey) {
        // External Taproot keys are x-only, but local key packages still use compressed points.
        if (publicKey.length === 32)
            return lift_x(bytesToNumberBE(publicKey));
        if (publicKey.length === 33)
            return Pointk1.fromBytes(publicKey);
        throw new Error(`expected x-only or compressed public key, got length=${publicKey.length}`);
    },
    adjustScalar(n) {
        const PK = Pointk1.BASE.multiply(n);
        return hasEven(PK.y) ? n : Pointk1.Fn.neg(n);
    },
    adjustPoint: (p) => (hasEven(p.y) ? p : p.negate()),
    challenge(R, PK, msg) {
        return challenge(pointToBytes(R), pointToBytes(PK), msg);
    },
    adjustNonces: frostNoncesToEvenY,
    adjustGroupCommitmentShare: (GC, GCShare) => (!hasEven(GC.y) ? GCShare.negate() : GCShare),
    adjustPublic: frostPubToEvenY,
    adjustSecret: frostSecretToEvenY,
    adjustTx: {
        // Compat with official implementation
        encode: (tx) => tx.subarray(1),
        decode: (tx) => concatBytes(Uint8Array.of(0x02), tx),
    },
    adjustDKG: (k) => {
        // Compatibility with frost-secp256k1-tr: DKG output is auto-tweaked with the
        // empty Taproot merkle root, while dealer-generated keys stay untweaked.
        const merkleRoot = new Uint8Array(0);
        return {
            public: frostTweakPublic(k.public, merkleRoot),
            secret: frostTweakSecret(k.secret, k.public, merkleRoot),
        };
    },
}))()));

;// ./node_modules/@noble/hashes/legacy.js
/**

SHA1 (RFC 3174), MD5 (RFC 1321), and RIPEMD160 legacy, weak hash functions.
RFC 2286 only covers HMAC-RIPEMD160 wrapper material and test vectors,
not the base RIPEMD-160 compression spec.
Don't use them in a new protocol. What "weak" means:

- Collisions can be made with 2^18 effort in MD5, 2^60 in SHA1, 2^80 in RIPEMD160.
- No practical pre-image attacks (only theoretical, 2^123.4)
- HMAC seems kinda ok: https://www.rfc-editor.org/rfc/rfc6151
 * @module
 */


/** Initial SHA-1 state from RFC 3174 §6.1. */
const SHA1_IV = /* @__PURE__ */ Uint32Array.from([
    0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476, 0xc3d2e1f0,
]);
// Reusable 80-word SHA-1 message schedule buffer.
const SHA1_W = /* @__PURE__ */ new Uint32Array(80);
/** Internal SHA1 legacy hash class. */
class _SHA1 extends HashMD {
    A = SHA1_IV[0] | 0;
    B = SHA1_IV[1] | 0;
    C = SHA1_IV[2] | 0;
    D = SHA1_IV[3] | 0;
    E = SHA1_IV[4] | 0;
    constructor() {
        super(64, 20, 8, false);
    }
    get() {
        const { A, B, C, D, E } = this;
        return [A, B, C, D, E];
    }
    set(A, B, C, D, E) {
        this.A = A | 0;
        this.B = B | 0;
        this.C = C | 0;
        this.D = D | 0;
        this.E = E | 0;
    }
    _cloneInto(to) {
        (to ||= new this.constructor()).set(...this.get());
        return this._cloneIntoMeta(to);
    }
    process(view, offset) {
        for (let i = 0; i < 16; i++, offset += 4)
            SHA1_W[i] = view.getUint32(offset, false);
        for (let i = 16; i < 80; i++)
            SHA1_W[i] = rotl(SHA1_W[i - 3] ^ SHA1_W[i - 8] ^ SHA1_W[i - 14] ^ SHA1_W[i - 16], 1);
        // Compression function main loop, 80 rounds
        let { A, B, C, D, E } = this;
        for (let i = 0; i < 80; i++) {
            let F, K;
            if (i < 20) {
                F = Chi(B, C, D);
                K = 0x5a827999;
            }
            else if (i < 40) {
                F = B ^ C ^ D;
                K = 0x6ed9eba1;
            }
            else if (i < 60) {
                F = Maj(B, C, D);
                K = 0x8f1bbcdc;
            }
            else {
                F = B ^ C ^ D;
                K = 0xca62c1d6;
            }
            const T = (rotl(A, 5) + F + E + K + SHA1_W[i]) | 0;
            E = D;
            D = C;
            C = rotl(B, 30);
            B = A;
            A = T;
        }
        // Add the compressed chunk to the current hash value
        A = (A + this.A) | 0;
        B = (B + this.B) | 0;
        C = (C + this.C) | 0;
        D = (D + this.D) | 0;
        E = (E + this.E) | 0;
        this.set(A, B, C, D, E);
    }
    roundClean() {
        utils_clean(SHA1_W);
    }
    destroy() {
        // HashMD callers route post-destroy usability through `destroyed`; zeroizing alone still leaves
        // update()/digest() callable on reused instances.
        this.destroyed = true;
        this.set(0, 0, 0, 0, 0);
        utils_clean(this.buffer);
    }
}
/**
 * SHA1 (RFC 3174) legacy hash function. It was cryptographically broken.
 * @param msg - message bytes to hash
 * @param opts - Reserved hash options.
 * @returns Digest bytes.
 * @example
 * Hash a message with SHA1.
 * ```ts
 * sha1(new Uint8Array([97, 98, 99]));
 * ```
 */
const sha1 = /* @__PURE__ */ (/* unused pure expression or super */ null && (createHasher(() => new _SHA1())));
/** RFC 1321 `T[i]` uses `floor(2^32 * abs(sin(i)))`; this is the shared `2^32` scale factor. */
const p32 = /* @__PURE__ */ Math.pow(2, 32);
/** RFC 1321 `T[1..64]` table. */
const K = /* @__PURE__ */ Array.from({ length: 64 }, (_, i) => Math.floor(p32 * Math.abs(Math.sin(i + 1))));
/** MD5 initial state from RFC 1321, stored as 4 u32 words. */
const MD5_IV = /* @__PURE__ */ SHA1_IV.slice(0, 4);
// Reusable 16-word MD5 message block buffer.
const MD5_W = /* @__PURE__ */ new Uint32Array(16);
// RFC 1321 §3.4 per-round rotate amounts, flattened to 64 entries so the round loop
// avoids allocating a 4-element array literal every round (measured ~5% of md5).
const MD5_SHIFTS = /* @__PURE__ */ (() => {
    const S = [
        [7, 12, 17, 22],
        [5, 9, 14, 20],
        [4, 11, 16, 23],
        [6, 10, 15, 21],
    ];
    return Uint8Array.from({ length: 64 }, (_, i) => S[Math.floor(i / 16)][i % 4]);
})();
/** Internal MD5 legacy hash class. */
class _MD5 extends HashMD {
    A = MD5_IV[0] | 0;
    B = MD5_IV[1] | 0;
    C = MD5_IV[2] | 0;
    D = MD5_IV[3] | 0;
    constructor() {
        super(64, 16, 8, true);
    }
    get() {
        const { A, B, C, D } = this;
        return [A, B, C, D];
    }
    set(A, B, C, D) {
        this.A = A | 0;
        this.B = B | 0;
        this.C = C | 0;
        this.D = D | 0;
    }
    _cloneInto(to) {
        (to ||= new this.constructor()).set(...this.get());
        return this._cloneIntoMeta(to);
    }
    process(view, offset) {
        for (let i = 0; i < 16; i++, offset += 4)
            MD5_W[i] = view.getUint32(offset, true);
        // Compression function main loop, 64 rounds
        let { A, B, C, D } = this;
        for (let i = 0; i < 64; i++) {
            let F, g;
            if (i < 16) {
                F = Chi(B, C, D);
                g = i;
            }
            else if (i < 32) {
                // RFC 1321 round 2 uses G(B,C,D) = (B & D) | (C & ~D), which is `Chi(D, B, C)`.
                F = Chi(D, B, C);
                g = (5 * i + 1) % 16;
            }
            else if (i < 48) {
                F = B ^ C ^ D;
                g = (3 * i + 5) % 16;
            }
            else {
                F = C ^ (B | ~D);
                g = (7 * i) % 16;
            }
            F = F + A + K[i] + MD5_W[g];
            A = D;
            D = C;
            C = B;
            B = B + rotl(F, MD5_SHIFTS[i]);
        }
        // Add the compressed chunk to the current hash value
        A = (A + this.A) | 0;
        B = (B + this.B) | 0;
        C = (C + this.C) | 0;
        D = (D + this.D) | 0;
        this.set(A, B, C, D);
    }
    roundClean() {
        utils_clean(MD5_W);
    }
    destroy() {
        // HashMD callers route post-destroy usability through `destroyed`; zeroizing alone still leaves
        // update()/digest() callable on reused instances.
        this.destroyed = true;
        this.set(0, 0, 0, 0);
        utils_clean(this.buffer);
    }
}
/**
 * MD5 (RFC 1321) legacy hash function. It was cryptographically broken.
 * MD5 architecture is similar to SHA1, with some differences:
 * - Reduced output length: 16 bytes (128 bit) instead of 20
 * - 64 rounds, instead of 80
 * - Little-endian: could be faster, but will require more code
 * - Non-linear index selection: huge speed-up for unroll
 * - Per round constants: more memory accesses, additional speed-up for unroll
 * @param msg - message bytes to hash
 * @param opts - Reserved hash options.
 * @returns Digest bytes.
 * @example
 * Hash a message with MD5.
 * ```ts
 * md5(new Uint8Array([97, 98, 99]));
 * ```
 */
const md5 = /* @__PURE__ */ (/* unused pure expression or super */ null && (createHasher(() => new _MD5())));
// RIPEMD-160
// Permutation repeatedly applied to derive the later RIPEMD-160 message-order tables.
const Rho160 = /* @__PURE__ */ Uint8Array.from([
    7, 4, 13, 1, 10, 6, 15, 3, 12, 0, 9, 5, 2, 14, 11, 8,
]);
const Id160 = /* @__PURE__ */ (() => Uint8Array.from(new Array(16).fill(0).map((_, i) => i)))();
const Pi160 = /* @__PURE__ */ (() => Id160.map((i) => (9 * i + 5) % 16))();
// Five left/right message-word orderings for the RIPEMD-160 dual-lane rounds.
const idxLR = /* @__PURE__ */ (() => {
    const L = [Id160];
    const R = [Pi160];
    const res = [L, R];
    for (let i = 0; i < 4; i++)
        for (let j of res)
            j.push(j[i].map((k) => Rho160[k]));
    return res;
})();
const idxL = /* @__PURE__ */ (() => idxLR[0])();
const idxR = /* @__PURE__ */ (() => idxLR[1])();
// const [idxL, idxR] = idxLR;
// Base per-group shift table before the left/right message-order permutations are applied.
const shifts160 = /* @__PURE__ */ [
    [11, 14, 15, 12, 5, 8, 7, 9, 11, 13, 14, 15, 6, 7, 9, 8],
    [12, 13, 11, 15, 6, 9, 9, 7, 12, 15, 11, 13, 7, 8, 7, 7],
    [13, 15, 14, 11, 7, 7, 6, 8, 13, 14, 13, 12, 5, 5, 6, 9],
    [14, 11, 12, 14, 8, 6, 5, 5, 15, 12, 15, 14, 9, 9, 8, 6],
    [15, 12, 13, 13, 9, 5, 8, 6, 14, 11, 12, 11, 8, 6, 5, 5],
].map((i) => Uint8Array.from(i));
const shiftsL160 = /* @__PURE__ */ idxL.map((idx, i) => idx.map((j) => shifts160[i][j]));
const shiftsR160 = /* @__PURE__ */ idxR.map((idx, i) => idx.map((j) => shifts160[i][j]));
// Five left-lane additive constants for RIPEMD-160.
const Kl160 = /* @__PURE__ */ Uint32Array.from([
    0x00000000, 0x5a827999, 0x6ed9eba1, 0x8f1bbcdc, 0xa953fd4e,
]);
// Five right-lane additive constants for RIPEMD-160.
const Kr160 = /* @__PURE__ */ Uint32Array.from([
    0x50a28be6, 0x5c4dd124, 0x6d703ef3, 0x7a6d76e9, 0x00000000,
]);
// Called `f()` in the spec; valid `group` values are 0..4, and out-of-range
// inputs currently fall through to the group-4 branch.
function ripemd_f(group, x, y, z) {
    if (group === 0)
        return x ^ y ^ z;
    if (group === 1)
        return (x & y) | (~x & z);
    if (group === 2)
        return (x | ~y) ^ z;
    if (group === 3)
        return (x & z) | (y & ~z);
    return x ^ (y | ~z);
}
// Reusable 16-word RIPEMD-160 message block buffer.
const BUF_160 = /* @__PURE__ */ new Uint32Array(16);
/**
 * Internal RIPEMD-160 legacy hash class.
 * RFC 2286 only adds HMAC-RIPEMD160 material, not the core hash specification.
 */
class _RIPEMD160 extends HashMD {
    h0 = 0x67452301 | 0;
    h1 = 0xefcdab89 | 0;
    h2 = 0x98badcfe | 0;
    h3 = 0x10325476 | 0;
    h4 = 0xc3d2e1f0 | 0;
    constructor() {
        super(64, 20, 8, true);
    }
    get() {
        const { h0, h1, h2, h3, h4 } = this;
        return [h0, h1, h2, h3, h4];
    }
    set(h0, h1, h2, h3, h4) {
        this.h0 = h0 | 0;
        this.h1 = h1 | 0;
        this.h2 = h2 | 0;
        this.h3 = h3 | 0;
        this.h4 = h4 | 0;
    }
    _cloneInto(to) {
        (to ||= new this.constructor()).set(...this.get());
        return this._cloneIntoMeta(to);
    }
    process(view, offset) {
        for (let i = 0; i < 16; i++, offset += 4)
            BUF_160[i] = view.getUint32(offset, true);
        // prettier-ignore
        let al = this.h0 | 0, ar = al, bl = this.h1 | 0, br = bl, cl = this.h2 | 0, cr = cl, dl = this.h3 | 0, dr = dl, el = this.h4 | 0, er = el;
        // Instead of iterating 0 to 80, we split it into 5 groups
        // And use the groups in constants, functions, etc. Much simpler
        for (let group = 0; group < 5; group++) {
            const rGroup = 4 - group;
            const hbl = Kl160[group], hbr = Kr160[group]; // prettier-ignore
            const rl = idxL[group], rr = idxR[group]; // prettier-ignore
            const sl = shiftsL160[group], sr = shiftsR160[group]; // prettier-ignore
            for (let i = 0; i < 16; i++) {
                const tl = (rotl(al + ripemd_f(group, bl, cl, dl) + BUF_160[rl[i]] + hbl, sl[i]) + el) | 0;
                al = el, el = dl, dl = rotl(cl, 10) | 0, cl = bl, bl = tl; // prettier-ignore
            }
            // 2 loops are 10% faster
            for (let i = 0; i < 16; i++) {
                const tr = (rotl(ar + ripemd_f(rGroup, br, cr, dr) + BUF_160[rr[i]] + hbr, sr[i]) + er) | 0;
                ar = er, er = dr, dr = rotl(cr, 10) | 0, cr = br, br = tr; // prettier-ignore
            }
        }
        // Add the compressed chunk to the current hash value
        // Final recombination cross-adds the left/right lane accumulators into the next h0..h4 order.
        this.set((this.h1 + cl + dr) | 0, (this.h2 + dl + er) | 0, (this.h3 + el + ar) | 0, (this.h4 + al + br) | 0, (this.h0 + bl + cr) | 0);
    }
    roundClean() {
        utils_clean(BUF_160);
    }
    destroy() {
        this.destroyed = true;
        utils_clean(this.buffer);
        this.set(0, 0, 0, 0, 0);
    }
}
/**
 * RIPEMD-160 - a legacy hash function from 1990s.
 * RFC 2286 only covers HMAC-RIPEMD160 test material; the links below point
 * at the base RIPEMD-160 references.
 * * {@link https://homes.esat.kuleuven.be/~bosselae/ripemd160.html}
 * * {@link https://homes.esat.kuleuven.be/~bosselae/ripemd160/pdf/AB-9601/AB-9601.pdf}
 * @param msg - message bytes to hash
 * @param opts - Reserved hash options.
 * @returns Digest bytes.
 * @example
 * Hash a message with RIPEMD-160.
 * ```ts
 * ripemd160(new Uint8Array([97, 98, 99]));
 * ```
 */
const ripemd160 = /* @__PURE__ */ utils_createHasher(() => new _RIPEMD160());

;// ./node_modules/@scure/base/index.js
/*! scure-base - MIT License (c) 2022 Paul Miller (paulmillr.com) */
// Freeze the result of a thunk. `/* @__PURE__ */ freeze(() => expr)` keeps the whole
// initializer tree-shakable: the annotated call's only argument is a function literal,
// so bundlers drop everything (inner chain()/alphabet() calls included) when unused.
const freeze = (fn) => Object.freeze(fn());
function base_isBytes(a) {
    // Plain `instanceof Uint8Array` is too strict for some Buffer / proxy / cross-realm cases. The
    // fallback still requires a real ArrayBuffer view, so plain JSON-deserialized
    // `{ constructor: ... }` spoofing is rejected. `BYTES_PER_ELEMENT === 1` keeps the
    // fallback on byte-oriented views.
    return (a instanceof Uint8Array ||
        (ArrayBuffer.isView(a) &&
            a.constructor.name === 'Uint8Array' &&
            'BYTES_PER_ELEMENT' in a &&
            a.BYTES_PER_ELEMENT === 1));
}
/** Asserts something is Uint8Array. */
function base_abytes(b) {
    if (!base_isBytes(b))
        throw new TypeError('Uint8Array expected');
}
function isArrayOf(isString, arr) {
    if (!Array.isArray(arr))
        return false;
    if (arr.length === 0)
        return true;
    if (isString) {
        return arr.every((item) => typeof item === 'string');
    }
    else {
        return arr.every((item) => Number.isSafeInteger(item));
    }
}
function afn(input) {
    if (typeof input !== 'function')
        throw new TypeError('function expected');
    return true;
}
function astr(label, input) {
    if (typeof input !== 'string')
        throw new TypeError(`${label}: string expected`);
    return true;
}
function base_anumber(n, title = 'number') {
    if (typeof n !== 'number')
        throw new TypeError(`${title}: expected number, got ${typeof n}`);
    if (!Number.isSafeInteger(n))
        throw new RangeError(`${title}: expected safe integer, got ${n}`);
}
function anumArr(label, input) {
    if (!isArrayOf(false, input))
        throw new TypeError(`${label}: array of numbers expected`);
}
function chain(...args) {
    const id = (a) => a;
    // Wrap call in closure so JIT can inline calls
    const wrap = (a, b) => (c) => a(b(c));
    // Construct chain of args[-1].encode(args[-2].encode([...]))
    const encode = args.map((x) => x.encode).reduceRight(wrap, id);
    // Construct chain of args[0].decode(args[1].decode(...))
    const decode = args.map((x) => x.decode).reduce(wrap, id);
    return { encode, decode };
}
function base_normalize(fn) {
    afn(fn);
    return { encode: (from) => from, decode: (to) => fn(to) };
}
const powers = /* @__PURE__ */ (() => {
    let res = [];
    for (let i = 0; i < 40; i++)
        res.push(2 ** i);
    return res;
})();
// Indexed copy loops instead of Array.from / Uint8Array.from: those go through the
// iterator protocol on typed arrays, which is ~10x slower and would swamp the fast
// links' gains on the conversion boundaries.
function u8ToNumArr(u8, len = u8.length) {
    const res = new Array(len);
    for (let i = 0; i < len; i++)
        res[i] = u8[i];
    return res;
}
// UTF-8 TextDecoder builds a string from ASCII codes 2x faster than `TextDecoder('latin1')`
// (4x on freshly allocated, our exact case).
// All codes here are < 128 (range is validated elsewhere): UTF-8 agrees with ASCII byte-for-byte.
// UTF-8 needs no ICU, so the probe only guards runtimes without TextDecoder at all (Hermes).
const asciiDecoder = /* @__PURE__ */ (() => {
    try {
        const decoder = new TextDecoder();
        // Self-check on the domain we use (codes < 128): reject broken polyfills at
        // probe time instead of producing corrupted codec output later.
        return decoder.decode(Uint8Array.of(0x41, 0x30, 0x2b, 0x7f)) === 'A0+\x7f'
            ? decoder
            : undefined;
    }
    catch (e) {
        return undefined;
    }
})();
const B2S_CHUNK = 8192; // char codes per String.fromCharCode call, avoids arg-count limits
function charcodesToString(codes) {
    const len = codes.length;
    // Measured crossover: the TextDecoder's per-call setup dominates below ~12 chars,
    // where String.fromCharCode wins (bech32 checksums, base58xmr blocks).
    if (asciiDecoder !== undefined && len >= 12)
        return asciiDecoder.decode(codes);
    if (len <= B2S_CHUNK)
        return String.fromCharCode.apply(null, codes);
    let res = '';
    for (let i = 0; i < len; i += B2S_CHUNK)
        res += String.fromCharCode.apply(null, codes.subarray(i, i + B2S_CHUNK));
    return res;
}
/**
 * Linear 8 <-> bits regrouping (radix2Slow semantics), with Uint8Array digits and
 * preallocated output.
 */
function radix2(bits) {
    base_anumber(bits);
    if (bits <= 0 || bits > 8)
        throw new RangeError('radix2: bits should be in (0..8]');
    const mask = powers[bits] - 1;
    return {
        encode: (bytes) => {
            base_abytes(bytes);
            const len = bytes.length;
            // 8->bits with zero-bit padding of the last digit, like convertRadix2(padding=true)
            const res = new Uint8Array(Math.ceil((len * 8) / bits));
            let carry = 0;
            let pos = 0;
            let j = 0;
            for (let i = 0; i < len;) {
                // At most 7 residual bits plus 24 new bits fit in the signed 32-bit carry.
                if (i + 2 < len) {
                    carry = (carry << 24) | (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];
                    pos += 24;
                    i += 3;
                }
                else {
                    // Constant mask instead of convertRadix2's exact powers[pos]-1 cleanup: with
                    // bits <= 8 the residual is pos <= 7 bits, so carry needs at most pos + 8 <= 15
                    // meaningful bits. Stale bits in [pos, 16) shift to >= bits on extraction and
                    // are removed by `& mask` there and in the tail below.
                    carry = ((carry << 8) | bytes[i]) & 0xffff;
                    pos += 8;
                    i++;
                }
                // Each input adds at least `bits`, so the first extraction is unconditional.
                for (;;) {
                    pos -= bits;
                    res[j++] = (carry >> pos) & mask;
                    if (pos < bits)
                        break;
                }
            }
            if (pos > 0)
                res[j] = (carry << (bits - pos)) & mask;
            return res;
        },
        decode: (digits) => {
            // bits->8, strict canonical form, like convertRadix2(padding=false):
            // rejects leftover whole input words and non-zero pad bits.
            const len = digits.length;
            const res = new Uint8Array(Math.floor((len * bits) / 8));
            let carry = 0;
            let pos = 0;
            let j = 0;
            for (let i = 0; i < len; i++) {
                // Same constant-mask carry bound as encode: pos <= 7 residual plus bits <= 8
                // incoming keeps meaningful carry within 15 bits; stale bits above pos are
                // masked out on extraction and in the tail check below.
                carry = ((carry << bits) | digits[i]) & 0xffff;
                pos += bits;
                for (; pos >= 8; pos -= 8)
                    res[j++] = (carry >> (pos - 8)) & 0xff;
            }
            carry = (carry << (8 - pos)) & 0xff;
            if (pos >= bits)
                throw new Error('Excess padding');
            if (carry > 0)
                throw new Error(`Non-zero padding: ${carry}`);
            return res;
        },
    };
}
/**
 * Digit <-> letter mapping fused with string join (chain(alphabetSlow(letters), join(''))
 * semantics), via char-code lookup tables.
 */
function alphabet(letters, aliases) {
    const len = letters.length;
    // Larger indexes would wrap in the Int8Array reverse table and decode to wrong digits.
    if (len > 128)
        throw new Error('alphabet: max 128 letters');
    const encTable = new Uint8Array(len);
    const decTable = new Int8Array(128).fill(-1);
    for (let i = 0; i < len; i++) {
        const code = letters.charCodeAt(i);
        if (letters.codePointAt(i) !== code || code > 127)
            throw new Error('alphabet: single-char ASCII letters only');
        encTable[i] = code;
        decTable[code] = i;
    }
    // Aliases decode like their canonical letter (e.g. hex case-folding), without a
    // separate normalization pass over the input string.
    if (aliases !== undefined) {
        for (const alias of Object.keys(aliases)) {
            const code = alias.charCodeAt(0);
            const target = decTable[aliases[alias].charCodeAt(0)];
            if (alias.length !== 1 || code > 127 || target === undefined || target === -1)
                throw new Error(`alphabet: invalid alias ${alias}`);
            decTable[code] = target;
        }
    }
    return {
        encode: (digits) => {
            const codes = new Uint8Array(digits.length);
            for (let i = 0; i < digits.length; i++) {
                const d = digits[i];
                const code = encTable[d];
                // Reuse the table lookup's bounds result for the required per-digit range check.
                // Chained radix2 always emits digits < 2**bits === len; check anyway so a
                // mismatched chain throws (like alphabetSlow) instead of silently emitting letter 0.
                if (code === undefined)
                    throw new Error(`alphabet.encode: invalid digit ${d}`);
                codes[i] = code;
            }
            return charcodesToString(codes);
        },
        decode: (input) => {
            // Uniform label: this is the decode entry link for nopad codecs, padding for padded
            // ones. Keeps "decode: string expected" identical across all built-in codecs
            // (released 2.x said "join.decode: string expected").
            astr('decode', input);
            const slen = input.length;
            const digits = new Uint8Array(slen);
            for (let i = 0; i < slen; i++) {
                const code = input.charCodeAt(i);
                const digit = code < 128 ? decTable[code] : -1;
                if (digit === -1)
                    throw new Error(`Unknown letter "${input[i]}". Allowed: ${letters}`);
                digits[i] = digit;
            }
            return digits;
        },
    };
}
/**
 * Pad / unpad (paddingSlow semantics), on the joined string.
 */
function padding(bits, chr = '=') {
    base_anumber(bits);
    astr('padding', chr);
    return {
        encode(data) {
            while ((data.length * bits) % 8)
                data += chr;
            return data;
        },
        decode(input) {
            // Uniform label, see alphabet.decode above.
            astr('decode', input);
            let end = input.length;
            if ((end * bits) % 8)
                throw new Error('padding: invalid length');
            for (; end > 0 && input[end - 1] === chr; end--) {
                const byte = (end - 1) * bits;
                if (byte % 8 === 0)
                    throw new Error('padding: excess padding');
            }
            return input.slice(0, end);
        },
    };
}
function unsafeWrapper(fn) {
    afn(fn);
    return function (...args) {
        // Only for *Unsafe APIs that intentionally collapse validation failures to `undefined`.
        // Do not wrap code that needs to preserve exception details.
        try {
            return fn.apply(null, args);
        }
        catch (e) { }
    };
}
function checksum(len, fn) {
    base_anumber(len);
    // Reject degenerate zero-byte checksums up front so callers don't accidentally
    // build a no-op checksum stage.
    if (len <= 0)
        throw new RangeError(`checksum length must be positive: ${len}`);
    afn(fn);
    const _fn = fn;
    // Uses the first `len` bytes of fn(data) in both directions.
    // Current call sites rely on `len > 0` and checksum functions that return at least that many bytes.
    return {
        encode(data) {
            base_abytes(data);
            const sum = _fn(data).slice(0, len);
            const res = new Uint8Array(data.length + len);
            res.set(data);
            res.set(sum, data.length);
            return res;
        },
        decode(data) {
            base_abytes(data);
            const payload = data.slice(0, -len);
            const oldChecksum = data.slice(-len);
            const newChecksum = _fn(payload).slice(0, len);
            for (let i = 0; i < len; i++)
                if (newChecksum[i] !== oldChecksum[i])
                    throw new Error('Invalid checksum');
            return payload;
        },
    };
}
// RFC 4648 aka RFC 3548
// ---------------------
/**
 * base16 encoding from RFC 4648.
 * This codec uses RFC 4648 Table 5's uppercase alphabet directly.
 * RFC 4648 §8 calls base16 "case-insensitive hex encoding", but we intentionally do not case-fold decode input here.
 * Use `hex` for case-insensitive hex decoding.
 * @example
 * ```js
 * base16.encode(Uint8Array.from([0x12, 0xab]));
 * // => '12AB'
 * ```
 */
const base16 = /* @__PURE__ */ (/* unused pure expression or super */ null && (freeze(() => chain(radix2(4), alphabet('0123456789ABCDEF')))));
/**
 * base32 encoding from RFC 4648. Has padding.
 * RFC 4648 §6 Table 3 uses uppercase letters, and RFC 4648 §3.4 allows applications to choose
 * upper- or lowercase alphabets. We keep the published uppercase table and do not case-fold decode input.
 * Use `base32nopad` for unpadded version.
 * Also check out `base32hex`, `base32hexnopad`, `base32crockford`.
 * @example
 * ```js
 * base32.encode(Uint8Array.from([0x12, 0xab]));
 * // => 'CKVQ===='
 * base32.decode('CKVQ====');
 * // => Uint8Array.from([0x12, 0xab])
 * ```
 */
const base32 = /* @__PURE__ */ (/* unused pure expression or super */ null && (freeze(() => chain(radix2(5), alphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'), padding(5)))));
/**
 * base32 encoding from RFC 4648. No padding.
 * This variant inherits RFC 4648 base32's uppercase table and intentionally does not case-fold decode input.
 * Use `base32` for padded version.
 * Also check out `base32hex`, `base32hexnopad`, `base32crockford`.
 * @example
 * ```js
 * base32nopad.encode(Uint8Array.from([0x12, 0xab]));
 * // => 'CKVQ'
 * base32nopad.decode('CKVQ');
 * // => Uint8Array.from([0x12, 0xab])
 * ```
 */
const base32nopad = /* @__PURE__ */ (/* unused pure expression or super */ null && (freeze(() => chain(radix2(5), alphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ234567')))));
/**
 * base32 encoding from RFC 4648. Padded. Compared to ordinary `base32`, slightly different alphabet.
 * RFC 4648 §7 Table 4 uses uppercase letters, and we intentionally keep that table without case-folding decode input.
 * Use `base32hexnopad` for unpadded version.
 * @example
 * ```js
 * base32hex.encode(Uint8Array.from([0x12, 0xab]));
 * // => '2ALG===='
 * base32hex.decode('2ALG====');
 * // => Uint8Array.from([0x12, 0xab])
 * ```
 */
const base32hex = /* @__PURE__ */ (/* unused pure expression or super */ null && (freeze(() => chain(radix2(5), alphabet('0123456789ABCDEFGHIJKLMNOPQRSTUV'), padding(5)))));
/**
 * base32 encoding from RFC 4648. No padding. Compared to ordinary `base32`, slightly different alphabet.
 * This variant inherits RFC 4648 base32hex's uppercase table and intentionally does not case-fold decode input.
 * Use `base32hex` for padded version.
 * @example
 * ```js
 * base32hexnopad.encode(Uint8Array.from([0x12, 0xab]));
 * // => '2ALG'
 * base32hexnopad.decode('2ALG');
 * // => Uint8Array.from([0x12, 0xab])
 * ```
 */
const base32hexnopad = /* @__PURE__ */ (/* unused pure expression or super */ null && (freeze(() => chain(radix2(5), alphabet('0123456789ABCDEFGHIJKLMNOPQRSTUV')))));
const BASE32_CROCKFORD_ASCII = /^[\x00-\x7f]*$/;
/**
 * base32 encoding from RFC 4648. Doug Crockford's version.
 * See {@link https://www.crockford.com/base32.html | Douglas Crockford's Base32}.
 * @example
 * ```js
 * base32crockford.encode(Uint8Array.from([0x12, 0xab]));
 * // => '2ANG'
 * base32crockford.decode('2ANG');
 * // => Uint8Array.from([0x12, 0xab])
 * ```
 */
const base32crockford = /* @__PURE__ */ (/* unused pure expression or super */ null && (freeze(() => chain(radix2(5), alphabet('0123456789ABCDEFGHJKMNPQRSTVWXYZ'), base_normalize((s) => {
    astr('base32crockford.decode', s);
    const upper = s.toUpperCase();
    if (s !== upper && !BASE32_CROCKFORD_ASCII.test(s))
        throw new Error('base32crockford.decode: ASCII expected');
    return upper.replace(/O/g, '0').replace(/[IL]/g, '1');
})))));
// Built-in base64 conversion https://caniuse.com/mdn-javascript_builtins_uint8array_frombase64
// Require both directions before taking the native fast path, so base64/base64url don't mix native and JS behavior.
// prettier-ignore
const hasBase64Builtin = /* @__PURE__ */ (() => typeof Uint8Array.from([]).toBase64 === 'function' &&
    typeof Uint8Array.fromBase64 === 'function')();
// Native `Uint8Array.fromBase64()` accepts these ASCII whitespace chars.
// Reject them first so the native base64 path still follows RFC 4648 §3.3.
// ASCII whitespace is U+0009 TAB, U+000A LF, U+000C FF, U+000D CR, or U+0020 SPACE
const ASCII_WHITESPACE = /[\t\n\f\r ]/;
const decodeBase64Builtin = (s, isUrl) => {
    astr('base64', s);
    const alphabet = isUrl ? 'base64url' : 'base64';
    // Per spec, .fromBase64 already throws on any other non-alphabet symbols except ASCII whitespace
    // And checking just for whitespace makes decoding about 3x faster than a full range check.
    // lastChunkHandling: 'strict' rejects loose tails and non-zero pad bits so native decoding stays canonical.
    if (s.length > 0 && ASCII_WHITESPACE.test(s))
        throw new Error('invalid base64');
    return Uint8Array.fromBase64(s, { alphabet, lastChunkHandling: 'strict' });
};
/** base64 from RFC 4648. Padded. Pure JS version */
const base64Fallback = /* @__PURE__ */ freeze(() => chain(radix2(6), alphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'), padding(6)));
/** base64url from RFC 4648. Padded. Pure JS version */
const base64urlFallback = /* @__PURE__ */ (/* unused pure expression or super */ null && (freeze(() => chain(radix2(6), alphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'), padding(6)))));
/**
 * base64 from RFC 4648. Padded.
 * Alternative variants: `base64nopad`, `base64url`, `base64urlnopad`.
 * Utilizes native `Uint8Array.fromBase64` builtin, otherwise falls back to `base64fallback` when it's unavailable.
 * @example
 * ```js
 * base64.encode(Uint8Array.from([0x12, 0xab]));
 * // => 'Eqs='
 * base64.decode('Eqs=');
 * // => Uint8Array.from([0x12, 0xab])
 * ```
 */
// prettier-ignore
const base64 = /* @__PURE__ */ freeze(() => hasBase64Builtin ? {
    encode(b) { base_abytes(b); return b.toBase64(); },
    decode(s) { return decodeBase64Builtin(s, false); },
} : base64Fallback);
/**
 * base64 from RFC 4648. No padding.
 * Use `base64` for padded version.
 * @example
 * ```js
 * base64nopad.encode(Uint8Array.from([0x12, 0xab]));
 * // => 'Eqs'
 * base64nopad.decode('Eqs');
 * // => Uint8Array.from([0x12, 0xab])
 * ```
 */
const base64nopad = /* @__PURE__ */ (/* unused pure expression or super */ null && (freeze(() => chain(radix2(6), alphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/')))));
/**
 * base64 from RFC 4648, using URL-safe alphabet. Padded.
 * Use `base64urlnopad` for unpadded version.
 * Falls back to built-in function, when available.
 * @example
 * ```js
 * base64url.encode(Uint8Array.from([0x12, 0xab]));
 * // => 'Eqs='
 * base64url.decode('Eqs=');
 * // => Uint8Array.from([0x12, 0xab])
 * ```
 */
// prettier-ignore
const base64url = /* @__PURE__ */ (/* unused pure expression or super */ null && (freeze(() => hasBase64Builtin ? {
    encode(b) { base_abytes(b); return b.toBase64({ alphabet: 'base64url' }); },
    decode(s) { return decodeBase64Builtin(s, true); },
} : base64urlFallback)));
/**
 * base64 from RFC 4648, using URL-safe alphabet. No padding.
 * Use `base64url` for padded version.
 * @example
 * ```js
 * base64urlnopad.encode(Uint8Array.from([0x12, 0xab]));
 * // => 'Eqs'
 * base64urlnopad.decode('Eqs');
 * // => Uint8Array.from([0x12, 0xab])
 * ```
 */
const base64urlnopad = /* @__PURE__ */ (/* unused pure expression or super */ null && (freeze(() => chain(radix2(6), alphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_')))));
// baseN radix code (base58, base36)
// ---------------------------------
// Base conversion 256 <-> BASE done on 16-bit limbs, five baseN digits (one divmod by
// BASE**5) per pass, ~10x fewer inner-loop iterations than digit-at-a-time conversion.
// Exactness: every intermediate is a non-negative integer below 2**53, so float64
// arithmetic (including Math.floor of the quotients) is exact for any GROUP = BASE**5 < 2**30:
// - encode: carry * 2**16 + limb < BASE**5 * 2**16 < 2**46
// - decode: limb * BASE**5 + carry < 2**16 * BASE**5 + 2**30 < 2**46
// Still O(n^2) overall like any positional-base conversion — see the base58 DoS note.
// GROUP literals (not `BASE ** 5`) so bundlers can drop unused coders as dead code.
const B58_GROUP = 656356768; // 58**5 < 2**30
const B36_GROUP = 60466176; // 36**5 < 2**26
const RADIX_BASE_N_MAX_LENGTH = 65536;
const BASE_N_MAX_BYTES = 2048;
const BASE_N_MAX_CHARS = 4096;
const radixBaseN = (BASE, GROUP) => ({
    encode: (bytes) => {
        base_abytes(bytes);
        const blen = bytes.length;
        if (blen === 0)
            return new Uint8Array(0);
        if (blen >= RADIX_BASE_N_MAX_LENGTH)
            throw new Error('invalid length');
        // Leading zero bytes map 1:1 to leading zero digits (at most blen-1 explicit zeros;
        // an all-zero value still contributes one digit below).
        let zeros = 0;
        while (zeros < blen - 1 && bytes[zeros] === 0)
            zeros++;
        // Pack big-endian 16-bit limbs; odd length makes the top limb a single byte.
        const nlimbs = Math.ceil(blen / 2);
        const limbs = new Uint16Array(nlimbs);
        const odd = blen & 1;
        if (odd)
            limbs[0] = bytes[0];
        for (let i = odd, j = odd; i < blen; i += 2, j++)
            limbs[j] = (bytes[i] << 8) | bytes[i + 1];
        // Repeated divmod by BASE**5; each pass emits one 5-digit group, least significant
        // first. No carry-overflow guard like convertRadix had: that one faced arbitrary
        // caller-chosen bases, while these bounds are static and proven exact above.
        const groups = [];
        let pos = 0; // limbs before pos are known zero
        while (pos < nlimbs) {
            let carry = 0;
            for (let i = pos; i < nlimbs; i++) {
                const cur = carry * 0x10000 + limbs[i];
                const q = Math.floor(cur / GROUP);
                carry = cur - q * GROUP;
                limbs[i] = q;
                if (q === 0 && i === pos)
                    pos++;
            }
            groups.push(carry);
        }
        // The top group is nonzero unless the whole value is zero, so total significant
        // digit count is 5 per full group plus the top group's own width. (Writing 5 digits
        // per group and trimming via subarray is smaller code, but the offset view slows
        // encode ~25% and base58xmr 2x — measured.)
        const top = groups.length - 1;
        let sig = top * 5;
        for (let v = groups[top];; v = Math.floor(v / BASE)) {
            sig++;
            if (v < BASE)
                break;
        }
        const res = new Uint8Array(zeros + sig); // leading zero digits are already 0
        let j = res.length - 1;
        for (let g = 0; g < top; g++) {
            let v = groups[g];
            for (let k = 0; k < 5; k++) {
                res[j--] = v % BASE;
                v = Math.floor(v / BASE);
            }
        }
        for (let v = groups[top]; j >= zeros; v = Math.floor(v / BASE))
            res[j--] = v % BASE;
        return res;
    },
    decode: (digits) => {
        base_abytes(digits);
        const dlen = digits.length;
        if (dlen === 0)
            return new Uint8Array(0);
        if (dlen >= RADIX_BASE_N_MAX_LENGTH)
            throw new Error('invalid length');
        let zeros = 0;
        while (zeros < dlen - 1 && digits[zeros] === 0)
            zeros++;
        // Multiply-accumulate 16-bit limbs (little-endian, `used` live) group by group,
        // most significant group first; the first group may be shorter than 5 digits, and
        // its BASE**group factor falls out of the digit fold.
        const limbs = new Uint16Array(Math.ceil((dlen * 6) / 16) + 1);
        let used = 0;
        let i = 0;
        let group = dlen % 5 || 5;
        while (i < dlen) {
            let gval = 0;
            let factor = 1;
            for (const end = i + group; i < end; i++) {
                const d = digits[i];
                // Unreachable through the public chain (alphabet emits digits < BASE); guards
                // internal misuse from silently corrupting output.
                if (d >= BASE)
                    throw new Error(`invalid integer: ${d}`);
                gval = gval * BASE + d;
                factor *= BASE;
            }
            group = 5;
            let carry = gval;
            for (let k = 0; k < used; k++) {
                const cur = limbs[k] * factor + carry;
                carry = Math.floor(cur / 0x10000);
                limbs[k] = cur - carry * 0x10000;
            }
            for (; carry > 0; carry = Math.floor(carry / 0x10000))
                limbs[used++] = carry % 0x10000;
        }
        // used === 0 means the value is zero: it still contributes one byte, like a lone
        // zero digit does.
        const valueBytes = used === 0 ? 1 : used * 2 - (limbs[used - 1] < 256 ? 1 : 0);
        const res = new Uint8Array(zeros + valueBytes); // leading zero bytes are already 0
        let j = res.length - 1;
        for (let k = 0; k < used; k++) {
            const limb = limbs[k];
            res[j--] = limb & 0xff;
            if (j >= zeros)
                res[j--] = limb >> 8;
        }
        return res;
    },
});
const genBaseN = (radix, abc) => {
    const letters = alphabet(abc);
    return {
        encode(bytes) {
            base_abytes(bytes);
            if (bytes.length > BASE_N_MAX_BYTES)
                throw new Error('invalid length');
            return letters.encode(radix.encode(bytes));
        },
        decode(str) {
            astr('baseN.decode', str);
            if (str.length > BASE_N_MAX_CHARS)
                throw new Error('invalid length');
            return radix.decode(letters.decode(str));
        },
    };
};
const radix58 = /* @__PURE__ */ radixBaseN(58, B58_GROUP);
/**
 * base36: lowercase alphanumeric, big-endian positional (multibase `k` payload,
 * used by e.g. IPNS/CID addresses). Leading zero bytes map to leading `0` digits.
 * Quadratic (O(n^2)) - so, can't be used on large inputs.
 * @example
 * ```js
 * const text = base36.encode(Uint8Array.from([0, 1, 2]));
 * base36.decode(text);
 * // => Uint8Array.from([0, 1, 2])
 * ```
 */
const base36 = /* @__PURE__ */ (/* unused pure expression or super */ null && (freeze(() => genBaseN(radixBaseN(36, B36_GROUP), '0123456789abcdefghijklmnopqrstuvwxyz'))));
const genBase58 = (abc) => genBaseN(radix58, abc);
/**
 * base58: base64 without ambigous characters +, /, 0, O, I, l.
 * Quadratic (O(n^2)) - so, can't be used on large inputs.
 * @example
 * ```js
 * const text = base58.encode(Uint8Array.from([0, 1, 2]));
 * base58.decode(text);
 * // => Uint8Array.from([0, 1, 2])
 * ```
 */
const base58 = /* @__PURE__ */ freeze(() => genBase58('123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'));
/**
 * base58: flickr version. Check out `base58`.
 * @example
 * Round-trip bytes with the Flickr alphabet.
 * ```ts
 * const text = base58flickr.encode(Uint8Array.from([0, 1, 2]));
 * base58flickr.decode(text);
 * ```
 */
const base58flickr = /* @__PURE__ */ (/* unused pure expression or super */ null && (freeze(() => genBase58('123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ'))));
/**
 * base58: XRP version. Check out `base58`.
 * @example
 * Round-trip bytes with the XRP alphabet.
 * ```ts
 * const text = base58xrp.encode(Uint8Array.from([0, 1, 2]));
 * base58xrp.decode(text);
 * ```
 */
const base58xrp = /* @__PURE__ */ (/* unused pure expression or super */ null && (freeze(() => genBase58('rpshnaf39wBUDNEGHJKLM4PQRST7VWXYZ2bcdeCg65jkm8oFqi1tuvAxyz'))));
// Data len (index) -> encoded block len.
// Monero pads each 1..8-byte block to this fixed base58 width so decode can recover the tail length.
const XMR_BLOCK_LEN = (/* unused pure expression or super */ null && ([0, 2, 3, 5, 6, 7, 9, 10, 11]));
/**
 * base58: XMR version. Check out `base58`.
 * Done in 8-byte blocks (which equals 11 chars in decoding). Last (non-full) block padded with '1' to size in XMR_BLOCK_LEN.
 * Block encoding significantly reduces quadratic complexity of base58.
 * @example
 * Round-trip bytes with the Monero block codec.
 * ```ts
 * const text = base58xmr.encode(Uint8Array.from([0, 1, 2]));
 * base58xmr.decode(text);
 * ```
 */
const base58xmr = /* @__PURE__ */ (/* unused pure expression or super */ null && (freeze(() => ({
    encode(data) {
        base_abytes(data);
        let res = '';
        for (let i = 0; i < data.length; i += 8) {
            const block = data.subarray(i, i + 8);
            res += base58.encode(block).padStart(XMR_BLOCK_LEN[block.length], '1');
        }
        return res;
    },
    decode(str) {
        astr('base58xmr.decode', str);
        const strLen = str.length;
        // Only the last block may be short, and only to one of the XMR_BLOCK_LEN widths —
        // so the output length is known up front and blocks write into place. Growing a
        // number[] via concat per block was quadratic; this keeps decode linear like the
        // block encoding always intended.
        const tailChars = strLen % 11;
        const tailBytes = tailChars === 0 ? 0 : XMR_BLOCK_LEN.indexOf(tailChars);
        if (tailBytes === -1)
            throw new Error(`base58xmr: invalid block length ${tailChars}`);
        const res = new Uint8Array(Math.floor(strLen / 11) * 8 + tailBytes);
        let w = 0;
        for (let i = 0; i < strLen; i += 11) {
            const slice = str.slice(i, i + 11);
            const blockLen = slice.length === 11 ? 8 : tailBytes;
            const block = base58.decode(slice);
            for (let j = 0; j < block.length - blockLen; j++) {
                if (block[j] !== 0)
                    throw new Error('base58xmr: wrong padding');
            }
            for (let j = block.length - blockLen; j < block.length; j++)
                res[w++] = block[j];
        }
        return res;
    },
}))));
/**
 * Method, which creates base58check encoder.
 * Requires function, calculating sha256.
 * Callers must include any version bytes in `data`; this helper only applies the
 * 4-byte double-SHA256 checksum used by Bitcoin Base58Check.
 * @param sha256 - Function used to calculate the checksum hash.
 * @returns base58check codec using 4 checksum bytes.
 * @throws On wrong argument types. {@link TypeError}
 * @example
 * Create a base58check codec from a SHA-256 implementation.
 * ```ts
 * import { createBase58check } from '@scure/base';
 * import { sha256 } from '@noble/hashes/sha2.js';
 * const coder = createBase58check(sha256);
 * coder.encode(Uint8Array.from([1, 2, 3]));
 * ```
 */
const createBase58check = (sha256) => {
    // Validate the hash function at construction time so wrong inputs fail before returning a coder.
    afn(sha256);
    const _sha256 = sha256;
    return chain(checksum(4, (data) => _sha256(_sha256(data))), base58);
};
/**
 * Use `createBase58check` instead.
 * @deprecated Use {@link createBase58check} instead.
 * Callers must include any version bytes in `data`; this alias keeps the same
 * 4-byte double-SHA256 checksum behavior as `createBase58check`.
 * @param sha256 - Function used to calculate the checksum hash.
 * @returns base58check codec using 4 checksum bytes.
 * @example
 * Create a base58check codec with the deprecated alias.
 * ```ts
 * import { base58check } from '@scure/base';
 * import { sha256 } from '@noble/hashes/sha2.js';
 * const coder = base58check(sha256);
 * coder.encode(Uint8Array.from([1, 2, 3]));
 * ```
 */
const base58check = createBase58check;
// BIP 173 character table.
// Callers adapt the public number[] words API to Uint8Array at the edges (wordsToU8 below):
// feeding number[] into alphabet.encode would work at runtime, but it turns the shared
// hot loop polymorphic and measurably slows the RFC 4648 codecs using the same literal.
const BECH_ALPHABET = /* @__PURE__ */ alphabet('qpzry9x8gf2tvdw0s3jn54khce6mua7l');
const BECH_UPPERCASE_PRINTABLE = /^[\x21-\x60\x7b-\x7e]+$/;
function assertBech32Printable(label, value) {
    for (let i = 0; i < value.length; i++) {
        const c = value.charCodeAt(i);
        if (c < 33 || c > 126)
            throw new Error(`${label}: printable ASCII expected`);
    }
}
// Range-checks while packing: a plain copy would silently wrap out-of-range words
// (256 -> 0 would encode to a valid letter). Same message the old slow alphabet threw.
function wordsToU8(words) {
    const len = words.length;
    const res = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        const w = words[i];
        if (w < 0 || w >= 32)
            throw new Error(`alphabet.encode: invalid digit ${w}`);
        res[i] = w;
    }
    return res;
}
// BIP 173 `bech32_polymod` GEN coefficients.
const POLYMOD_GENERATORS = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];
// BIP 173 step split: this applies the polymod state transition before callers xor in the next 5-bit value.
function bech32Polymod(pre) {
    const b = pre >> 25;
    let chk = (pre & 0x1ffffff) << 5;
    for (let i = 0; i < POLYMOD_GENERATORS.length; i++) {
        if (((b >> i) & 1) === 1)
            chk ^= POLYMOD_GENERATORS[i];
    }
    return chk;
}
function bechChecksum(prefix, words, encodingConst = 1) {
    const len = prefix.length;
    let chk = 1;
    for (let i = 0; i < len; i++) {
        const c = prefix.charCodeAt(i);
        if (c < 33 || c > 126)
            throw new Error(`Invalid prefix (${prefix})`);
        chk = bech32Polymod(chk) ^ (c >> 5);
    }
    chk = bech32Polymod(chk);
    for (let i = 0; i < len; i++)
        chk = bech32Polymod(chk) ^ (prefix.charCodeAt(i) & 0x1f);
    for (let v of words)
        chk = bech32Polymod(chk) ^ v;
    for (let i = 0; i < 6; i++)
        chk = bech32Polymod(chk);
    // BIP 173/BIP 350: xor the final checksum constant, then emit the 30-bit state as six 5-bit symbols.
    chk ^= encodingConst;
    const sum = new Uint8Array(6);
    for (let i = 0; i < 6; i++)
        sum[i] = (chk >>> (5 * (5 - i))) & 31;
    return BECH_ALPHABET.encode(sum);
}
function genBech32(encoding) {
    // BIP 173 uses final xor constant 1; BIP 350 swaps in 0x2bc830a3 for Bech32m.
    const ENCODING_CONST = encoding === 'bech32' ? 1 : 0x2bc830a3;
    // Public API words are number[], so adapt the fast radix2's Uint8Array protocol at the edge.
    const _words = radix2(5);
    const toWords = (from) => {
        base_abytes(from);
        // Dedicated 8->5 regrouping (radix2(5).encode semantics) writing the public number[]
        // directly; encode-into-Uint8Array plus a copy loop measurably regressed this hot path.
        const len = from.length;
        const res = new Array(Math.ceil((len * 8) / 5));
        let carry = 0;
        let pos = 0;
        let j = 0;
        for (let i = 0; i < len; i++) {
            // No carry cleanup needed: stale bits sit above pos and every extraction (including
            // the tail below) masks with `& 31`, so they never reach the output. Masking carry
            // here measurably slowed the loop.
            carry = (carry << 8) | from[i];
            pos += 8;
            for (; pos >= 5; pos -= 5)
                res[j++] = (carry >> (pos - 5)) & 31;
        }
        if (pos > 0)
            res[j] = (carry << (5 - pos)) & 31;
        return res;
    };
    const fromWords = (to) => {
        anumArr('radix2.decode', to);
        // Range-check while packing into the byte buffer: a plain copy would silently
        // truncate out-of-range words. Rejecting negatives is a deliberate fix — the old
        // convertRadix2 path silently corrupted output for them.
        const len = to.length;
        const digits = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            const w = to[i];
            if (w < 0 || w >= 32)
                throw new Error(`convertRadix2: invalid word=${w}`);
            digits[i] = w;
        }
        return _words.decode(digits);
    };
    const fromWordsUnsafe = unsafeWrapper(fromWords);
    function encode(prefix, words, limit = 90) {
        astr('bech32.encode prefix', prefix);
        if (limit !== false)
            base_anumber(limit, 'limit');
        if (base_isBytes(words))
            words = u8ToNumArr(words);
        anumArr('bech32.encode', words);
        const plen = prefix.length;
        if (plen === 0)
            throw new TypeError(`Invalid prefix length ${plen}`);
        // Total output is hrp + `1` separator + payload words + 6 checksum chars.
        const actualLength = plen + 7 + words.length;
        if (limit !== false && actualLength > limit)
            throw new TypeError(`Length ${actualLength} exceeds limit ${limit}`);
        assertBech32Printable('bech32.encode prefix', prefix);
        const lowered = prefix.toLowerCase();
        const sum = bechChecksum(lowered, words, ENCODING_CONST);
        return `${lowered}1${BECH_ALPHABET.encode(wordsToU8(words))}${sum}`;
    }
    function decode(str, limit = 90) {
        astr('bech32.decode input', str);
        if (limit !== false)
            base_anumber(limit, 'limit');
        const slen = str.length;
        // Minimum length is 1-char hrp + `1` separator + 6-char checksum.
        if (slen < 8 || (limit !== false && slen > limit))
            throw new TypeError(`invalid string length ${slen}, expected (8..${limit})`);
        // don't allow mixed case
        const lowered = str.toLowerCase();
        if (str !== lowered) {
            // Case folding is the only way a non-ASCII input can become valid: unchanged
            // characters are rejected by the prefix and alphabet checks below.
            if (!BECH_UPPERCASE_PRINTABLE.test(str)) {
                assertBech32Printable('bech32.decode input', str);
                throw new Error(`mixed-case string not allowed`);
            }
        }
        const sepIndex = lowered.lastIndexOf('1');
        if (sepIndex === 0 || sepIndex === -1)
            throw new Error(`invalid separator "1"`);
        const prefix = lowered.slice(0, sepIndex);
        const data = lowered.slice(sepIndex + 1);
        if (data.length < 6)
            throw new Error('invalid data length');
        const digits = BECH_ALPHABET.decode(data);
        const words = u8ToNumArr(digits, digits.length - 6);
        const sum = bechChecksum(prefix, words, ENCODING_CONST);
        if (!data.endsWith(sum))
            throw new Error(`Invalid checksum in ${str}`);
        return { prefix, words };
    }
    const decodeUnsafe = unsafeWrapper(decode);
    function decodeToBytes(str, limit = 90) {
        const { prefix, words } = decode(str, limit);
        return {
            prefix,
            words,
            bytes: fromWords(words),
        };
    }
    function encodeFromBytes(prefix, bytes) {
        // Keep the convenience wrapper on encode()'s default 90-char cap; custom limits should call encode(prefix, toWords(bytes), limit).
        return encode(prefix, toWords(bytes));
    }
    return {
        encode,
        decode,
        encodeFromBytes,
        decodeToBytes,
        decodeUnsafe,
        fromWords,
        fromWordsUnsafe,
        toWords,
    };
}
/**
 * bech32 from BIP 173. Operates on words.
 * For high-level helpers, check out {@link https://github.com/paulmillr/scure-btc-signer | scure-btc-signer}.
 * @example
 * Convert bytes to words, encode them, then decode back.
 * ```ts
 * const words = bech32.toWords(Uint8Array.from([1, 2, 3]));
 * const text = bech32.encode('bc', words);
 * bech32.decode(text);
 * ```
 */
const bech32 = /* @__PURE__ */ freeze(() => genBech32('bech32'));
/**
 * bech32m from BIP 350. Operates on words.
 * It was to mitigate `bech32` weaknesses.
 * For high-level helpers, check out {@link https://github.com/paulmillr/scure-btc-signer | scure-btc-signer}.
 * @example
 * Convert bytes to words, encode them with bech32m, then decode back.
 * ```ts
 * const words = bech32m.toWords(Uint8Array.from([1, 2, 3]));
 * const text = bech32m.encode('bc', words);
 * bech32m.decode(text);
 * ```
 */
const bech32m = /* @__PURE__ */ freeze(() => genBech32('bech32m'));
/**
 * ASCII-to-byte decoder. Rejects non-ASCII text and bytes instead of doing UTF-8 replacement.
 * Method names follow `BytesCoder`, so `encode(bytes)` returns a string and `decode(string)` returns bytes.
 * @example
 * ```js
 * const b = ascii.decode("ABC"); // => new Uint8Array([ 65, 66, 67 ])
 * const str = ascii.encode(b); // "ABC"
 * ```
 */
const ascii = /* @__PURE__ */ (/* unused pure expression or super */ null && (freeze(() => ({
    encode(data) {
        base_abytes(data);
        for (let i = 0; i < data.length; i++) {
            const byte = data[i];
            // ASCII is 7-bit; reject bytes outside 0x00..0x7f instead of silently widening to
            // Latin-1/UTF-8. Validating up front keeps the error position exact while the
            // string itself is built in bulk (~3x faster at 1KB than per-char concat).
            if (byte > 127)
                throw new RangeError(`non-ASCII byte ${byte} at ${i}`);
        }
        return charcodesToString(data);
    },
    decode(str) {
        if (typeof str !== 'string')
            throw new TypeError('ascii string expected, got ' + typeof str);
        const res = new Uint8Array(str.length);
        for (let i = 0; i < str.length; i++) {
            // Indexed access is much faster than Uint8Array.from(str, mapFn) here and keeps
            // exact error positions.
            const charCode = str.charCodeAt(i);
            if (charCode > 127)
                throw new RangeError(`non-ASCII char "${str[i]}" (${charCode}) at ${i}`);
            res[i] = charCode;
        }
        return res;
    },
}))));
const _isWellFormedShim = (str) => {
    // encodeURI rejects malformed UTF-16, giving a compact fallback that matches native
    // isWellFormed on our tests/fuzz corpus.
    try {
        return encodeURI(str) !== null;
    }
    catch {
        return false;
    }
};
const _isWellFormed = /* @__PURE__ */ (() => 
// Pick the native check once so utf8.decode doesn't re-probe String.prototype on every call.
typeof ''.isWellFormed === 'function'
    ? (str) => str.isWellFormed()
    : _isWellFormedShim)();
// This fallback stays small because strict UTF-8 only needs fatal decoding plus well-formed
// UTF-16 checks, not the replacement, streaming, or legacy-encoding behavior of full platform
// text codecs.
const utf8err = (i) => new TypeError(`invalid utf8 at byte ${i}`);
const utf8Fallback = /* @__PURE__ */ freeze(() => ({
    encode(data) {
        base_abytes(data);
        let res = '';
        for (let i = 0; i < data.length;) {
            const a = data[i++];
            if (a < 0b1000_0000) {
                res += String.fromCharCode(a);
                continue;
            }
            if (a < 0b1100_0010 || i >= data.length)
                throw utf8err(i - 1);
            const b = data[i++];
            if ((b & 0b1100_0000) !== 0b1000_0000)
                throw utf8err(i - 1);
            let cp = ((a & 0b0001_1111) << 6) | (b & 0b0011_1111);
            if (a >= 0b1110_0000) {
                if (i >= data.length)
                    throw utf8err(i - 1);
                const c = data[i++];
                if ((c & 0b1100_0000) !== 0b1000_0000 ||
                    (a === 0b1110_0000 && b < 0b1010_0000) ||
                    (a === 0xed && b >= 0b1010_0000))
                    throw utf8err(i - 1);
                cp = ((a & 0b0000_1111) << 12) | ((b & 0b0011_1111) << 6) | (c & 0b0011_1111);
                if (a >= 0b1111_0000) {
                    if (i >= data.length)
                        throw utf8err(i - 1);
                    const d = data[i++];
                    if (a > 0b1111_0100 ||
                        (d & 0b1100_0000) !== 0b1000_0000 ||
                        (a === 0b1111_0000 && b < 0b1001_0000) ||
                        (a === 0b1111_0100 && b >= 0b1001_0000))
                        throw utf8err(i - 1);
                    cp =
                        ((a & 7) << 18) |
                            ((b & 0b0011_1111) << 12) |
                            ((c & 0b0011_1111) << 6) |
                            (d & 0b0011_1111);
                }
            }
            if (cp < 0x10000)
                res += String.fromCharCode(cp);
            else {
                cp -= 0x10000;
                res += String.fromCharCode((cp >> 10) + 0xd800, (cp & 0x3ff) + 0xdc00);
            }
        }
        return res;
    },
    decode(str) {
        astr('utf8', str);
        if (!_isWellFormed(str))
            throw new TypeError('utf8 expected well-formed string');
        // Direct Uint8Array writes are much faster than number[] + Uint8Array.from on Hermes and
        // large Node inputs.
        const res = new Uint8Array(str.length * 3);
        let pos = 0;
        for (let i = 0; i < str.length; i++) {
            let c = str.charCodeAt(i);
            if (c < 0b1000_0000) {
                res[pos++] = c;
                continue;
            }
            if (c >= 0xd800 && c <= 0xdfff) {
                const d = str.charCodeAt(++i);
                c = 0x10000 + ((c - 0xd800) << 10) + d - 0xdc00;
            }
            if (c >= 0x10000) {
                res[pos++] = (c >> 18) | 0b1111_0000;
                res[pos++] = ((c >> 12) & 0b0011_1111) | 0b1000_0000;
            }
            else if (c >= 0x800)
                res[pos++] = (c >> 12) | 0b1110_0000;
            else
                res[pos++] = (c >> 6) | 0b1100_0000;
            if (c >= 0x800)
                res[pos++] = ((c >> 6) & 0b0011_1111) | 0b1000_0000;
            res[pos++] = (c & 0b0011_1111) | 0b1000_0000;
        }
        return res.subarray(0, pos);
    },
}));
/**
 * Strict UTF-8-to-byte decoder. Uses built-in TextDecoder / TextEncoder when available.
 * Method names follow `BytesCoder`, so `encode(bytes)` returns a string and
 * `decode(string)` returns bytes.
 * `encode(bytes)` requires Uint8Array input, preserves an explicit leading BOM, and
 *   throws on invalid UTF-8 bytes.
 * `decode(string)` requires a primitive string and throws on malformed UTF-16 strings with
 *   lone surrogates.
 * @example
 * ```js
 * const b = utf8.decode("hey"); // => new Uint8Array([ 104, 101, 121 ])
 * const str = utf8.encode(b); // "hey"
 * ```
 */
const utf8 = /* @__PURE__ */ freeze(() => {
    let _utf8Encoder;
    let _utf8Decoder;
    const utf8Builtin = {
        // ignoreBOM preserves an explicit leading U+FEFF;
        // fatal rejects invalid UTF-8 bytes instead of replacing them.
        encode(data) {
            base_abytes(data);
            return (_utf8Decoder || (_utf8Decoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true }))).decode(data);
        },
        decode(str) {
            astr('utf8', str);
            if (!_isWellFormed(str))
                throw new TypeError('utf8 expected well-formed string');
            return (_utf8Encoder || (_utf8Encoder = new TextEncoder())).encode(str);
        },
    };
    return {
        // Select each direction once at module init, since
        // TextEncoder and TextDecoder can exist independently.
        encode: typeof TextDecoder === 'function' ? utf8Builtin.encode : utf8Fallback.encode,
        decode: typeof TextEncoder === 'function' ? utf8Builtin.decode : utf8Fallback.decode,
    };
});
/** Lowercase hex with case-insensitive decoding. Pure JS version. */
const hexFallback = /* @__PURE__ */ freeze(() => chain(radix2(4), 
// Case-insensitive decode via table aliases instead of a toLowerCase pass.
alphabet('0123456789abcdef', { A: 'a', B: 'b', C: 'c', D: 'd', E: 'e', F: 'f' }), base_normalize((s) => {
    // astr first: same non-string message as the native path, and no `s.length`
    // access on null / undefined while building the error.
    astr('hex', s);
    if (s.length % 2 !== 0)
        throw new TypeError(`hex.decode: odd-length string (${s.length})`);
    return s;
})));
// Keep internal parity probes behind a test-only export.
const __TESTS = /* @__PURE__ */ (/* unused pure expression or super */ null && (freeze(() => ({
    alphabet: alphabet,
    base64Fallback: base64Fallback,
    base64urlFallback: base64urlFallback,
    hexFallback: hexFallback,
    radix2: radix2,
    radix58: radix58,
    checksum: checksum,
    utf8Fallback: utf8Fallback,
    _isWellFormedShim: _isWellFormedShim,
}))));
// Built-in hex conversion https://caniuse.com/mdn-javascript_builtins_uint8array_fromhex
// prettier-ignore
const base_hasHexBuiltin = /* @__PURE__ */ (() => 
// Require both directions before enabling the native hex path so encode/decode stay symmetric.
typeof Uint8Array.from([]).toHex === 'function' &&
    typeof Uint8Array.fromHex === 'function')();
// prettier-ignore
const hexBuiltin = {
    // Keep local type guards so the native path preserves library-level input errors.
    // Native toHex emits lowercase hex, matching the fallback alphabet and Node's hex strings.
    encode(data) { base_abytes(data); return data.toHex(); },
    // Native fromHex accepts either hex case and rejects odd-length / non-hex syntax.
    decode(s) { astr('hex', s); return Uint8Array.fromHex(s); },
};
/**
 * hex string decoder. Uses built-in function, when available.
 * Lowercase codec; unlike `base16`, this variant accepts either hex case and emits lowercase.
 * @example
 * ```js
 * const b = hex.decode("0102ff"); // => new Uint8Array([ 1, 2, 255 ])
 * const str = hex.encode(b); // "0102ff"
 * ```
 */
const hex = /* @__PURE__ */ freeze(() => base_hasHexBuiltin ? hexBuiltin : hexFallback);

;// ./node_modules/@scure/bip32/index.js
/**
 * BIP32 hierarchical deterministic (HD) wallets over secp256k1.
 * @module
 * @example
 * ```js
 * import { HDKey } from "@scure/bip32";
 * import { sha256 } from '@noble/hashes/sha2.js';
 * import { randomBytes } from '@noble/hashes/utils.js';
 * const seed = randomBytes(32);
 * const root = HDKey.fromMasterSeed(seed);
 * const base58key = root.privateExtendedKey;
 * const restored = HDKey.fromExtendedKey(base58key);
 * const fromJson = HDKey.fromJSON({ xpriv: base58key });
 * const child = fromJson.derive("m/0/2147483647'/1");
 * const msgHash = sha256(new TextEncoder().encode('hello scure-bip32'));
 *
 * // props
 * [root.depth, root.index, root.chainCode];
 * [restored.privateKey, restored.publicKey];
 * const sig = child.sign(msgHash);
 * child.verify(msgHash, sig);
 * ```
 */
/*! scure-bip32 - MIT License (c) 2022 Patricio Palladino, Paul Miller (paulmillr.com) */






const Point = /* @__PURE__ */ (() => secp256k1.Point)();
const Fn = /* @__PURE__ */ (() => Point.Fn)();
const bip32_base58check = /* @__PURE__ */ createBase58check(sha2_sha256);
const MASTER_SECRET = /* @__PURE__ */ (() => {
    return Uint8Array.from('Bitcoin seed'.split(''), (char) => char.charCodeAt(0));
})();
const BITCOIN_VERSIONS = { private: 0x0488ade4, public: 0x0488b21e };
/** Hardened child index offset from BIP32. */
const HARDENED_OFFSET = 0x80000000;
const MAX_DEPTH = 0xff;
const hash160 = (data) => ripemd160(sha2_sha256(data));
const fromU32 = (data) => createView(data).getUint32(0, false);
const toU32 = (n, title = 'number') => {
    if (typeof n !== 'number')
        throw new TypeError(`"${title}" expected number, got type=${typeof n}`);
    if (!Number.isSafeInteger(n) || n < 0 || n > 2 ** 32 - 1)
        throw new RangeError(`"${title}" expected integer in range 0..2**32-1, got ${n}`);
    const buf = new Uint8Array(4);
    createView(buf).setUint32(0, n, false);
    return buf;
};
const validateVersions = (versions, title = 'versions') => {
    if (!(typeof versions === 'object' && versions !== null))
        throw new Error('versions must be an object');
    toU32(versions.private, `${title}.private`);
    toU32(versions.public, `${title}.public`);
    return versions;
};
/**
 * HDKey from BIP32
 * @param opt - Node fields used to construct one HDKey instance.
 * @example
 * ```js
 * import { HDKey } from '@scure/bip32';
 * import { randomBytes } from '@noble/hashes/utils.js';
 *
 * const seed = randomBytes(32);
 * const root = HDKey.fromMasterSeed(seed);
 * const account0 = root.derive("m/0/1'");
 * account0.publicKey;
 * ```
 */
class HDKey {
    get fingerprint() {
        if (!this._pubHash) {
            throw new Error('No publicKey set!');
        }
        return fromU32(this._pubHash);
    }
    get identifier() {
        return this._pubHash ? Uint8Array.from(this._pubHash) : undefined;
    }
    get pubKeyHash() {
        return this._pubHash ? Uint8Array.from(this._pubHash) : undefined;
    }
    get privateKey() {
        return this._privateKey ? Uint8Array.from(this._privateKey) : null;
    }
    get publicKey() {
        return this._publicKey ? Uint8Array.from(this._publicKey) : null;
    }
    get chainCode() {
        return this._chainCode ? Uint8Array.from(this._chainCode) : null;
    }
    get privateExtendedKey() {
        const priv = this._privateKey;
        if (!priv) {
            throw new Error('No private key');
        }
        return bip32_base58check.encode(this.serialize(this.versions.private, utils_concatBytes(Uint8Array.of(0), priv)));
    }
    get publicExtendedKey() {
        if (!this._publicKey) {
            throw new Error('No public key');
        }
        return bip32_base58check.encode(this.serialize(this.versions.public, this._publicKey));
    }
    static fromMasterSeed(seed, versions = BITCOIN_VERSIONS) {
        utils_abytes(seed);
        versions = validateVersions(versions);
        if (8 * seed.length < 128 || 8 * seed.length > 512) {
            throw new RangeError('HDKey: seed length must be between 128 and 512 bits; 256 bits is advised, got ' +
                seed.length);
        }
        const I = hmac_hmac(sha2_sha512, MASTER_SECRET, seed);
        const privateKey = I.slice(0, 32);
        const chainCode = I.slice(32);
        return new HDKey({ versions, chainCode, privateKey });
    }
    static fromExtendedKey(base58key, versions = BITCOIN_VERSIONS) {
        versions = validateVersions(versions);
        // => version(4) || depth(1) || fingerprint(4) || index(4) || chain(32) || key(33)
        const keyBuffer = bip32_base58check.decode(base58key);
        if (keyBuffer.length !== 78) {
            throw new Error(`HDKey: invalid extended key length: expected 78 bytes, got ${keyBuffer.length}`);
        }
        const keyView = createView(keyBuffer);
        const version = keyView.getUint32(0, false);
        const opt = {
            versions,
            depth: keyBuffer[4],
            parentFingerprint: keyView.getUint32(5, false),
            index: keyView.getUint32(9, false),
            chainCode: keyBuffer.slice(13, 45),
        };
        const key = keyBuffer.slice(45);
        const isPriv = key[0] === 0;
        if (version !== versions[isPriv ? 'private' : 'public']) {
            throw new Error('Version mismatch');
        }
        if (isPriv) {
            return new HDKey({ ...opt, privateKey: key.slice(1) });
        }
        else {
            return new HDKey({ ...opt, publicKey: key });
        }
    }
    static fromJSON(json) {
        return HDKey.fromExtendedKey('xpriv' in json ? json.xpriv : json.xpub);
    }
    versions;
    depth = 0;
    index = 0;
    parentFingerprint = 0;
    _chainCode = null;
    _privateKey;
    _publicKey;
    _pubHash;
    constructor(opt) {
        if (!opt || typeof opt !== 'object') {
            throw new Error('HDKey.constructor must not be called directly');
        }
        const depth = opt.depth ?? 0;
        const index = opt.index ?? 0;
        const parentFingerprint = opt.parentFingerprint ?? 0;
        if (!Number.isSafeInteger(depth) || depth < 0 || depth > MAX_DEPTH) {
            throw new RangeError('HDKey: depth must be an integer in range 0..255');
        }
        toU32(index, 'index');
        toU32(parentFingerprint, 'parentFingerprint');
        if (depth === 0 && (index !== 0 || parentFingerprint !== 0)) {
            throw new Error('HDKey: zero depth with non-zero index/parent fingerprint');
        }
        this.versions = opt.versions ? validateVersions(opt.versions) : BITCOIN_VERSIONS;
        this.depth = depth;
        if (opt.chainCode)
            utils_abytes(opt.chainCode, 32);
        this._chainCode = opt.chainCode ? Uint8Array.from(opt.chainCode) : null;
        this.index = index;
        this.parentFingerprint = parentFingerprint;
        if (opt.publicKey && opt.privateKey) {
            throw new Error('HDKey: publicKey and privateKey at same time.');
        }
        if (opt.privateKey) {
            if (!secp256k1.utils.isValidSecretKey(opt.privateKey))
                throw new Error('Invalid private key');
            // Don't alias caller-owned secret buffers.
            this._privateKey = Uint8Array.from(opt.privateKey);
            this._publicKey = secp256k1.getPublicKey(this._privateKey, true);
        }
        else if (opt.publicKey) {
            this._publicKey = Point.fromBytes(opt.publicKey).toBytes(true); // force compressed point
        }
        else {
            throw new Error('HDKey: no public or private key provided');
        }
        this._pubHash = hash160(this._publicKey);
    }
    derive(path) {
        if (!/^[mM]'?/.test(path)) {
            throw new Error('Path must start with "m" or "M"');
        }
        if (/^[mM]'?$/.test(path)) {
            return this;
        }
        const parts = path.replace(/^[mM]'?\//, '').split('/');
        if (parts.length > MAX_DEPTH - this.depth) {
            throw new Error('HDKey: path exceeds the serializable depth 255');
        }
        // tslint:disable-next-line
        let child = this;
        for (const c of parts) {
            const m = /^(\d+)('?)$/.exec(c);
            const m1 = m && m[1];
            if (!m || m.length !== 3 || typeof m1 !== 'string')
                throw new Error('invalid child index: ' + c);
            let idx = +m1;
            if (!Number.isSafeInteger(idx) || idx >= HARDENED_OFFSET) {
                throw new Error('Invalid index');
            }
            // hardened key
            if (m[2] === "'") {
                idx += HARDENED_OFFSET;
            }
            child = child.deriveChild(idx);
        }
        return child;
    }
    deriveChild(index) {
        return this._deriveChild(index);
    }
    /** Test-only implementation seam. Production callers must use deriveChild(). */
    _deriveChild(index, _I) {
        if (!this._publicKey || !this._chainCode) {
            throw new Error('No publicKey or chainCode set');
        }
        let data = toU32(index, 'index');
        if (index >= HARDENED_OFFSET) {
            // Hardened
            const priv = this._privateKey;
            if (!priv) {
                throw new Error('Could not derive hardened child key');
            }
            // Hardened child: 0x00 || ser256(kpar) || ser32(index)
            data = utils_concatBytes(Uint8Array.of(0), priv, data);
        }
        else {
            // Normal child: serP(point(kpar)) || ser32(index)
            data = utils_concatBytes(this._publicKey, data);
        }
        const out = _I || hmac_hmac(sha2_sha512, this._chainCode, data);
        utils_abytes(out, 64);
        const childTweak = out.slice(0, 32);
        const chainCode = out.slice(32);
        const opt = {
            versions: this.versions,
            chainCode,
            depth: this.depth + 1,
            parentFingerprint: this.fingerprint,
            index,
        };
        // Fail early instead of re-trying different index
        if (opt.depth > MAX_DEPTH) {
            throw new Error('HDKey: depth exceeds the serializable value 255');
        }
        const retry = () => {
            // Public derivation cannot cross into the hardened index range.
            const maxIndex = this._privateKey ? 2 ** 32 - 1 : HARDENED_OFFSET - 1;
            if (index >= maxIndex) {
                throw new Error(`HDKey: cannot retry child derivation at index ${index}`);
            }
            return this.deriveChild(index + 1);
        };
        // Decode without reducing: BIP-32 requires a retry when parse256(I_L) >= n.
        const ctweak = Fn.fromBytes(childTweak, true);
        if (!Fn.isValid(ctweak))
            return retry();
        // I_L = 0 is valid unless it produces an invalid child below.
        if (this._privateKey) {
            const added = Fn.create(Fn.fromBytes(this._privateKey) + ctweak);
            if (!Fn.isValidNot0(added))
                return retry();
            opt.privateKey = Fn.toBytes(added);
        }
        else {
            const point = Point.fromBytes(this._publicKey);
            const added = ctweak === 0n ? point : point.add(Point.BASE.multiply(ctweak));
            // Cryptographically impossible: HMAC-SHA512 would need to produce the scalar -P.
            if (added.equals(Point.ZERO))
                return retry();
            opt.publicKey = added.toBytes(true);
        }
        return new HDKey(opt);
    }
    sign(hash) {
        if (!this._privateKey) {
            throw new Error('No privateKey set!');
        }
        utils_abytes(hash, 32);
        return secp256k1.sign(hash, this._privateKey, { prehash: false });
    }
    verify(hash, signature) {
        utils_abytes(hash, 32);
        utils_abytes(signature, 64);
        if (!this._publicKey) {
            throw new Error('No publicKey set!');
        }
        return secp256k1.verify(signature, hash, this._publicKey, { prehash: false });
    }
    wipePrivateData() {
        if (this._privateKey) {
            this._privateKey.fill(0);
            this._privateKey = undefined;
        }
        return this;
    }
    // TODO(v3): Make automatic JSON serialization public-only so JSON.stringify cannot expose xpriv.
    toJSON() {
        return this.toPrivateJSON();
    }
    /**
     * Explicitly exports private key material. Treat the returned value as a secret.
     */
    toPrivateJSON() {
        return {
            xpriv: this.privateExtendedKey,
            xpub: this.publicExtendedKey,
        };
    }
    serialize(version, key) {
        if (!this._chainCode) {
            throw new Error('No chainCode set');
        }
        utils_abytes(key, 33);
        // version(4) || depth(1) || fingerprint(4) || index(4) || chain(32) || key(33)
        return utils_concatBytes(toU32(version, 'version'), new Uint8Array([this.depth]), toU32(this.parentFingerprint, 'parentFingerprint'), toU32(this.index, 'index'), this._chainCode, key);
    }
}

;// ./node_modules/@noble/curves/abstract/edwards.js
/**
 * Twisted Edwards curve. The formula is: ax² + y² = 1 + dx²y².
 * For design rationale of types / exports, see weierstrass module documentation.
 * Untwisted Edwards curves exist, but they aren't used in real-world protocols.
 * @module
 */
/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */



// Be friendly to bad ECMAScript parsers by not using bigint literals
// prettier-ignore
const edwards_0n = /* @__PURE__ */ BigInt(0), edwards_1n = /* @__PURE__ */ BigInt(1), edwards_2n = /* @__PURE__ */ BigInt(2), edwards_4n = /* @__PURE__ */ BigInt(4), edwards_8n = /* @__PURE__ */ BigInt(8);
// Affine Edwards-equation check only; this does not prove subgroup membership, canonical
// encoding, prime-order base-point requirements, or identity exclusion.
function isEdValidXY(Fp, CURVE, x, y) {
    const x2 = Fp.sqr(x);
    const y2 = Fp.sqr(y);
    const left = Fp.add(Fp.mul(CURVE.a, x2), y2);
    const right = Fp.add(Fp.ONE, Fp.mul(CURVE.d, Fp.mul(x2, y2)));
    return Fp.eql(left, right);
}
/**
 * @param params - Curve parameters. See {@link EdwardsOpts}.
 * @param extraOpts - Optional helpers and overrides. See {@link EdwardsExtraOpts}.
 * @returns Edwards point constructor. Generator validation here only checks
 *   that `(Gx, Gy)` satisfies the affine Edwards equation.
 *   RFC 8032 base-point constraints like `B != (0,1)` and `[L]B = 0`
 *   are left to the caller's chosen parameters, since eager subgroup
 *   validation here adds about 10-15ms to heavyweight imports like ed448.
 *   The returned constructor also eagerly marks `Point.BASE` for W=6
 *   precompute caching. Some code paths still assume
 *   `Fp.BYTES === Fn.BYTES`, so mismatched byte lengths are not fully audited here.
 * @throws If the curve parameters or Edwards overrides are invalid. {@link Error}
 * @example
 * ```ts
 * import { edwards } from '@noble/curves/abstract/edwards.js';
 * import { jubjub } from '@noble/curves/misc.js';
 * // Build a point constructor from explicit curve parameters, then use its base point.
 * const Point = edwards(jubjub.Point.CURVE());
 * Point.BASE.toHex();
 * ```
 */
function edwards(params, extraOpts = {}) {
    curves_utils_validateObject(extraOpts, {}, {}, 'extraOpts');
    const opts = extraOpts;
    const validated = createCurveFields('edwards', params, opts, opts.FpFnLE);
    const { Fp, Fn } = validated;
    let CURVE = validated.CURVE;
    const { h: cofactor } = CURVE;
    // The unified add-2008-hwcd formulas (see EdwardsPoint.add/double) are complete —
    // exception-free for every input pair — only when a is a square and d a non-square in Fp
    // (Bernstein–Birkner–Joye–Lange–Peters, "Twisted Edwards curves", thm 3.3). The constant-time
    // kernels in curve.ts assume completeness, so an incomplete curve could silently produce
    // wrong results on exceptional inputs. Fail construction instead.
    if (FpLegendre(Fp, CURVE.a) !== 1)
        throw new Error('edwards: CURVE.a must be a square in Fp for complete addition formulas');
    if (FpLegendre(Fp, CURVE.d) !== -1)
        throw new Error('edwards: CURVE.d must be a non-square in Fp for complete addition formulas');
    curves_utils_validateObject(opts, {}, { uvRatio: 'function', randomBytes: 'function' });
    const randomBytes = opts.randomBytes === undefined ? curves_utils_randomBytes : opts.randomBytes;
    // Coordinate and ZIP-215 bounds follow the base-field byte container, not scalar bytes.
    const MASK = edwards_2n << (BigInt(Fp.BYTES * 8) - edwards_1n);
    function isOdd(n) {
        if (!Fp.isOdd)
            throw new Error('Field does not have .isOdd()');
        return Fp.isOdd(n);
    }
    // sqrt(u/v)
    const uvRatio = opts.uvRatio === undefined
        ? (u, v) => {
            try {
                return { isValid: true, value: Fp.sqrt(Fp.div(u, v)) };
            }
            catch (e) {
                return { isValid: false, value: edwards_0n };
            }
        }
        : opts.uvRatio;
    // Validate whether the passed curve params are valid.
    // equation ax² + y² = 1 + dx²y² should work for generator point.
    if (!isEdValidXY(Fp, CURVE, CURVE.Gx, CURVE.Gy))
        throw new Error('bad curve params: generator point');
    // Multiplication by param `a` sits on the double() / add() hot paths. For the common twists
    // a=-1 (ed25519, jubjub) and a=1 (ed448) the full field multiplication is replaced with
    // negation / identity. Selection depends only on public curve constants.
    const mulA = Fp.eql(CURVE.a, Fp.neg(Fp.ONE)) ? (x) => Fp.neg(x)
        : Fp.eql(CURVE.a, Fp.ONE) ? (x) => x
            : (x) => Fp.mul(CURVE.a, x); // prettier-ignore
    /**
     * Asserts coordinate is valid: 0 <= n < MASK.
     * Coordinates >= Fp.ORDER are allowed for zip215.
     */
    function acoord(title, n, banZero = false) {
        const min = banZero ? edwards_1n : edwards_0n;
        aInRange('coordinate ' + title, n, min, MASK);
        return n;
    }
    function aedpoint(other) {
        if (!(other instanceof Point))
            throw new Error('EdwardsPoint expected');
    }
    // Extended Point works in extended coordinates: (X, Y, Z, T) ∋ (x=X/Z, y=Y/Z, T=xy).
    // https://en.wikipedia.org/wiki/Twisted_Edwards_curve#Extended_coordinates
    class Point {
        static BASE = new Point(CURVE.Gx, CURVE.Gy, Fp.ONE, Fp.mul(CURVE.Gx, CURVE.Gy));
        static ZERO = new Point(Fp.ZERO, Fp.ONE, Fp.ONE, Fp.ZERO);
        static Fp = Fp;
        static Fn = Fn;
        X;
        Y;
        Z;
        T;
        constructor(X, Y, Z, T) {
            this.X = acoord('x', X);
            this.Y = acoord('y', Y);
            this.Z = acoord('z', Z, true);
            this.T = acoord('t', T);
            Object.freeze(this);
        }
        static CURVE() {
            return CURVE;
        }
        /**
         * Create one extended Edwards point from affine coordinates.
         * Does NOT validate that the point is on-curve or torsion-free.
         * Use `.assertValidity()` on adversarial inputs.
         */
        static fromAffine(p) {
            if (p instanceof Point)
                throw new Error('extended point not allowed');
            const { x, y } = p || {};
            acoord('x', x);
            acoord('y', y);
            return new Point(x, y, Fp.ONE, Fp.mul(x, y));
        }
        // Uses algo from RFC8032 5.1.3.
        static fromBytes(bytes, zip215 = false) {
            const len = Fp.BYTES;
            const { a, d } = CURVE;
            bytes = curves_utils_copyBytes(curves_utils_abytes(bytes, len, 'point'));
            utils_abool(zip215, 'zip215');
            const normed = curves_utils_copyBytes(bytes); // copy again, we'll manipulate it
            const lastByte = bytes[len - 1]; // select last byte
            normed[len - 1] = lastByte & ~0x80; // clear last bit
            const y = bytesToNumberLE(normed);
            // zip215=true is good for consensus-critical apps. =false follows RFC8032 / NIST186-5.
            // RFC8032 prohibits >= p, but ZIP215 doesn't
            // zip215=true:  0 <= y < MASK (2^256 for ed25519)
            // zip215=false: 0 <= y < P (2^255-19 for ed25519)
            const max = zip215 ? MASK : Fp.ORDER;
            aInRange('point.y', y, edwards_0n, max);
            // Ed25519: x² = (y²-1)/(dy²+1) mod p. Ed448: x² = (y²-1)/(dy²-1) mod p. Generic case:
            // ax²+y²=1+dx²y² => y²-1=dx²y²-ax² => y²-1=x²(dy²-a) => x²=(y²-1)/(dy²-a)
            const y2 = Fp.sqr(y); // denominator is always non-0 mod p.
            const u = Fp.sub(y2, Fp.ONE); // u = y² - 1
            const v = Fp.sub(Fp.mulN(d, y2), a); // v = d y² - a.
            let { isValid, value: x } = uvRatio(u, v); // √(u/v)
            if (!isValid)
                throw new Error('bad point: invalid y coordinate');
            const isXOdd = isOdd(x); // There are 2 square roots. Use x_0 bit to select proper
            const isLastByteOdd = (lastByte & 0x80) !== 0; // x_0, last bit
            if (!zip215 && Fp.is0(x) && isLastByteOdd)
                // if x=0 and x_0 = 1, fail
                throw new Error('bad point: x=0 and x_0=1');
            if (isLastByteOdd !== isXOdd)
                x = Fp.neg(x); // if x_0 != x mod 2, set x = p-x
            return Point.fromAffine({ x, y });
        }
        static fromHex(hex, zip215 = false) {
            return Point.fromBytes(utils_hexToBytes(hex), zip215);
        }
        get x() {
            return this.toAffine().x;
        }
        get y() {
            return this.toAffine().y;
        }
        precompute(windowSize = 6, isLazy = true) {
            wnaf.setWindowSize(this, windowSize);
            if (!isLazy)
                this.multiply(edwards_2n); // random number
            return this;
        }
        // Useful in fromAffine() - not for fromBytes(), which always created valid points.
        assertValidity() {
            const p = this;
            const { a, d } = CURVE;
            // Keep generic Edwards validation fail-closed on the neutral point.
            // Even though ZERO is algebraically valid and can roundtrip through encodings, higher-level
            // callers often reach it only through broken hash/scalar plumbing; rejecting it here avoids
            // silently treating that degenerate state as an ordinary public point.
            if (p.is0())
                throw new Error('bad point: ZERO'); // TODO: optimize, with vars below?
            // Equation in affine coordinates: ax² + y² = 1 + dx²y²
            // Equation in projective coordinates (X/Z, Y/Z, Z):  (aX² + Y²)Z² = Z⁴ + dX²Y²
            const { X, Y, Z, T } = p;
            const X2 = Fp.sqr(X); // X²
            const Y2 = Fp.sqr(Y); // Y²
            const Z2 = Fp.sqr(Z); // Z²
            const Z4 = Fp.sqr(Z2); // Z⁴
            const aX2 = Fp.mul(X2, a); // aX²
            const left = Fp.mul(Fp.add(aX2, Y2), Z2); // (aX² + Y²)Z²
            const right = Fp.add(Z4, Fp.mul(d, Fp.mul(X2, Y2))); // Z⁴ + dX²Y²
            if (!Fp.eql(left, right))
                throw new Error('bad point: equation left != right (1)');
            // In Extended coordinates we also have T, which is x*y=T/Z: check X*Y == Z*T
            const XY = Fp.mul(X, Y);
            const ZT = Fp.mul(Z, T);
            if (!Fp.eql(XY, ZT))
                throw new Error('bad point: equation left != right (2)');
        }
        // Compare one point to another.
        equals(other) {
            aedpoint(other);
            const { X: X1, Y: Y1, Z: Z1 } = this;
            const { X: X2, Y: Y2, Z: Z2 } = other;
            const X1Z2 = Fp.mul(X1, Z2);
            const X2Z1 = Fp.mul(X2, Z1);
            const Y1Z2 = Fp.mul(Y1, Z2);
            const Y2Z1 = Fp.mul(Y2, Z1);
            return Fp.eql(X1Z2, X2Z1) && Fp.eql(Y1Z2, Y2Z1);
        }
        is0() {
            return this.equals(Point.ZERO);
        }
        negate() {
            // Flips point sign to a negative one (-x, y in affine coords)
            return new Point(Fp.neg(this.X), this.Y, this.Z, Fp.neg(this.T));
        }
        // Fast algo for doubling Extended Point.
        // https://hyperelliptic.org/EFD/g1p/auto-twisted-extended.html#doubling-dbl-2008-hwcd
        // Cost: 4M + 4S + 1*a + 6add + 1*2.
        double() {
            const { X: X1, Y: Y1, Z: Z1 } = this;
            const A = Fp.sqr(X1); // A = X12
            const B = Fp.sqr(Y1); // B = Y12
            const C = Fp.mul(Fp.sqr(Z1), edwards_2n); // C = 2*Z12
            const D = mulA(A); // D = a*A
            const x1y1 = Fp.addN(X1, Y1);
            const E = Fp.sub(Fp.subN(Fp.sqr(x1y1), A), B); // E = (X1+Y1)2-A-B
            const G = Fp.addN(D, B); // G = D+B
            const F = Fp.subN(G, C); // F = G-C
            const H = Fp.subN(D, B); // H = D-B
            const X3 = Fp.mul(E, F); // X3 = E*F
            const Y3 = Fp.mul(G, H); // Y3 = G*H
            const T3 = Fp.mul(E, H); // T3 = E*H
            const Z3 = Fp.mul(F, G); // Z3 = F*G
            return new Point(X3, Y3, Z3, T3);
        }
        // Fast algo for adding 2 Extended Points.
        // https://hyperelliptic.org/EFD/g1p/auto-twisted-extended.html#addition-add-2008-hwcd
        // Cost: 9M + 1*a + 1*d + 7add.
        add(other) {
            aedpoint(other);
            const { d } = CURVE;
            const { X: X1, Y: Y1, Z: Z1, T: T1 } = this;
            const { X: X2, Y: Y2, Z: Z2, T: T2 } = other;
            const A = Fp.mul(X1, X2); // A = X1*X2
            const B = Fp.mul(Y1, Y2); // B = Y1*Y2
            const C = Fp.mul(Fp.mulN(T1, d), T2); // C = T1*d*T2
            const D = Fp.mul(Z1, Z2); // D = Z1*Z2
            // E = (X1+Y1)*(X2+Y2)-A-B
            const E = Fp.sub(Fp.subN(Fp.mulN(Fp.addN(X1, Y1), Fp.addN(X2, Y2)), A), B);
            const F = Fp.subN(D, C); // F = D-C
            const G = Fp.addN(D, C); // G = D+C
            const H = Fp.sub(B, mulA(A)); // H = B-a*A
            const X3 = Fp.mul(E, F); // X3 = E*F
            const Y3 = Fp.mul(G, H); // Y3 = G*H
            const T3 = Fp.mul(E, H); // T3 = E*H
            const Z3 = Fp.mul(F, G); // Z3 = F*G
            return new Point(X3, Y3, Z3, T3);
        }
        subtract(other) {
            // Validate before calling `negate()` so wrong inputs fail with the point guard
            // instead of leaking a foreign `negate()` error.
            aedpoint(other);
            return this.add(other.negate());
        }
        // Constant-time multiplication.
        multiply(scalar) {
            // 1 <= scalar < L
            // Keep the subgroup-scalar contract strict instead of reducing 0 / n to ZERO.
            // In keygen/signing-style callers, those values usually mean broken hash/scalar plumbing,
            // and failing closed is safer than silently producing the identity point.
            if (!Fn.isValidNot0(scalar))
                throw new RangeError('invalid scalar: expected 1 <= sc < curve.n');
            const { p, f } = wnaf.mulSecret(this, scalar, cofactor, normalize);
            return normalize([p, f])[0];
        }
        // Non-constant-time multiplication. Uses double-and-add algorithm.
        // It's faster, but should only be used when you don't care about
        // an exposed private key e.g. sig verification.
        // Keeps the same subgroup-scalar contract: 0 is allowed for public-scalar callers, but
        // n and larger values are rejected instead of being reduced mod n to the identity point.
        multiplyUnsafe(scalar) {
            // 0 <= scalar < L
            if (!Fn.isValid(scalar))
                throw new RangeError('invalid scalar: expected 0 <= sc < curve.n');
            if (scalar === edwards_0n)
                return Point.ZERO;
            if (this.is0() || scalar === edwards_1n)
                return this;
            return wnaf.mulUnsafe(this, scalar, normalize);
        }
        // Checks if point is of small order.
        // If you add something to small order point, you will have "dirty"
        // point with torsion component.
        // Clears cofactor and checks if the result is 0.
        isSmallOrder() {
            return this.clearCofactor().is0();
        }
        // Multiplies point by curve order and checks if the result is 0.
        // Returns `false` is the point is dirty.
        isTorsionFree() {
            return wnaf.mulUnsafe(this, CURVE.n).is0();
        }
        // Converts Extended point to default (x, y) coordinates.
        // Can accept precomputed Z^-1 - for example, from invertBatch.
        toAffine(invertedZ) {
            const p = this;
            let iz = invertedZ;
            if (iz != null && typeof iz !== 'bigint')
                throw new TypeError('"invertedZ" expected bigint, got type=' + typeof iz);
            const { X, Y, Z } = p;
            const is0 = p.is0();
            if (iz == null)
                iz = is0 ? Fp.create(edwards_8n) : Fp.inv(Z);
            const x = Fp.mul(X, iz);
            const y = Fp.mul(Y, iz);
            const zz = Fp.mul(Z, iz);
            if (is0)
                return { x: Fp.ZERO, y: Fp.ONE };
            if (!Fp.eql(zz, Fp.ONE))
                throw new Error('invZ was invalid');
            return { x, y };
        }
        clearCofactor() {
            if (cofactor === edwards_1n)
                return this;
            // 2.8-3.8x speed-up vs naive
            if (cofactor === edwards_2n)
                return this.double();
            if (cofactor === edwards_4n)
                return this.double().double();
            if (cofactor === edwards_8n)
                return this.double().double().double();
            return this.multiplyUnsafe(cofactor);
        }
        toBytes() {
            const { x, y } = this.toAffine();
            // Fp.toBytes() allows non-canonical encoding of y (>= p).
            const bytes = Fp.toBytes(y);
            // Each y has 2 valid points: (x, y), (x,-y).
            // When compressing, it's enough to store y and use the last byte to encode sign of x
            bytes[bytes.length - 1] |= isOdd(x) ? 0x80 : 0;
            return bytes;
        }
        toHex() {
            return utils_bytesToHex(this.toBytes());
        }
        toString() {
            return `<Point ${this.is0() ? 'ZERO' : this.toHex()}>`;
        }
    }
    // Keep constructor work cheap: subgroup/generator validation belongs to the caller's curve
    // parameters, and doing the extra checks here adds about 10-15ms to heavy module imports.
    // Callers that construct custom curves are responsible for supplying the correct base point.
    // try {
    //   Point.BASE.assertValidity();
    //   if (!Point.BASE.isTorsionFree()) throw new Error('bad point: not in prime-order subgroup');
    // } catch {
    //   throw new Error('bad curve params: generator point');
    // }
    const normalize = (points) => normalizeZ(Point, points);
    const wnaf = new ScalarMultiplier(Point, randomBytes);
    // Enable W=6 wNAF precomputes. Slows down first publicKey computation.
    // Disable for tiny toy curves, with scalar fields < 6 bits.
    if (wnaf.bits >= 6)
        Point.BASE.precompute(6);
    Object.freeze(Point.prototype);
    Object.freeze(Point);
    return Point;
}
/**
 * Base class for prime-order points like Ristretto255 and Decaf448.
 * These points eliminate cofactor issues by representing equivalence classes
 * of Edwards curve points. Multiple Edwards representatives can describe the
 * same abstract wrapper element, so wrapper validity is not the same thing as
 * the hidden representative being torsion-free.
 * @param ep - Backing Edwards point.
 * @example
 * Base class for prime-order points like Ristretto255 and Decaf448.
 *
 * ```ts
 * import { ristretto255 } from '@noble/curves/ed25519.js';
 * const point = ristretto255.Point.BASE.multiply(2n);
 * ```
 */
class PrimeEdwardsPoint {
    static BASE;
    static ZERO;
    static Fp;
    static Fn;
    ep;
    /**
     * Wrap one internal Edwards representative directly.
     * This is not a canonical encoding boundary: alternate Edwards
     * representatives may still describe the same abstract wrapper element.
     */
    constructor(ep) {
        this.ep = ep;
    }
    // Static methods that must be implemented by subclasses
    static fromBytes(_bytes) {
        notImplemented();
    }
    static fromHex(_hex) {
        notImplemented();
    }
    get x() {
        return this.toAffine().x;
    }
    get y() {
        return this.toAffine().y;
    }
    // Common implementations
    clearCofactor() {
        // no-op for the abstract prime-order wrapper group; this is about the
        // wrapper element, not the hidden Edwards representative.
        return this;
    }
    assertValidity() {
        // Keep wrapper validity at the abstract-group boundary. Canonical decode
        // may choose Edwards representatives that differ by small torsion, so
        // checking `this.ep.isTorsionFree()` here would reject valid wrapper points.
        this.ep.assertValidity();
    }
    /**
     * Return affine coordinates of the current internal Edwards representative.
     * This is a convenience helper, not a canonical Ristretto/Decaf encoding.
     * Equal abstract elements may expose different `x` / `y`; use
     * `toBytes()` / `fromBytes()` for canonical roundtrips.
     */
    toAffine(invertedZ) {
        return this.ep.toAffine(invertedZ);
    }
    toHex() {
        return utils_bytesToHex(this.toBytes());
    }
    toString() {
        return this.toHex();
    }
    isTorsionFree() {
        // Abstract Ristretto/Decaf elements are already prime-order even when the
        // hidden Edwards representative is not torsion-free.
        return true;
    }
    isSmallOrder() {
        return false;
    }
    add(other) {
        this.assertSame(other);
        return this.init(this.ep.add(other.ep));
    }
    subtract(other) {
        this.assertSame(other);
        return this.init(this.ep.subtract(other.ep));
    }
    multiply(scalar) {
        return this.init(this.ep.multiply(scalar));
    }
    multiplyUnsafe(scalar) {
        return this.init(this.ep.multiplyUnsafe(scalar));
    }
    double() {
        return this.init(this.ep.double());
    }
    negate() {
        return this.init(this.ep.negate());
    }
    precompute(windowSize, isLazy) {
        this.ep.precompute(windowSize, isLazy);
        // Keep the wrapper identity stable like the backing Edwards API instead of
        // allocating a fresh wrapper around the same cached point.
        return this;
    }
}
/**
 * Initializes EdDSA signatures over given Edwards curve.
 * @param Point - Edwards point constructor.
 * @param cHash - Hash function.
 * @param eddsaOpts - Optional signature helpers. See {@link EdDSAOpts}.
 * @returns EdDSA helper namespace.
 * @throws If the hash function, options, or derived point operations are invalid. {@link Error}
 * @example
 * Initializes EdDSA signatures over given Edwards curve.
 *
 * ```ts
 * import { eddsa } from '@noble/curves/abstract/edwards.js';
 * import { jubjub } from '@noble/curves/misc.js';
 * import { sha512 } from '@noble/hashes/sha2.js';
 * const sigs = eddsa(jubjub.Point, sha512);
 * const { secretKey, publicKey } = sigs.keygen();
 * const msg = new TextEncoder().encode('hello noble');
 * const sig = sigs.sign(msg, secretKey);
 * const isValid = sigs.verify(sig, msg, publicKey);
 * ```
 */
function eddsa(Point, cHash, eddsaOpts = {}) {
    validatePointCons(Point);
    if (typeof cHash !== 'function')
        throw new Error('"hash" function param is required');
    const hash = cHash;
    const opts = eddsaOpts;
    curves_utils_validateObject(opts, {}, {
        adjustScalarBytes: 'function',
        randomBytes: 'function',
        domain: 'function',
        prehash: 'function',
        zip215: 'boolean',
        mapToCurve: 'function',
        toMontgomery: 'function',
        toMontgomerySecret: 'function',
    });
    const { prehash } = opts;
    const { BASE, Fp, Fn } = Point;
    const outputLen = hash.outputLen;
    const expectedLen = 2 * Fp.BYTES;
    // When hash metadata is available, reject incompatible EdDSA wrappers at construction time
    // instead of deferring the mismatch until the first keygen/sign call.
    if (outputLen !== undefined) {
        utils_asafenumber(outputLen, 'hash.outputLen');
        if (outputLen !== expectedLen)
            throw new Error(`hash.outputLen must be ${expectedLen}, got ${outputLen}`);
    }
    const randomBytes = opts.randomBytes === undefined ? curves_utils_randomBytes : opts.randomBytes;
    const toMontgomery = opts.toMontgomery;
    const toMontgomerySecret = opts.toMontgomerySecret;
    const adjustScalarBytes = opts.adjustScalarBytes === undefined
        ? (bytes) => bytes
        : opts.adjustScalarBytes;
    const domain = opts.domain === undefined
        ? (data, ctx, phflag) => {
            utils_abool(phflag, 'phflag');
            if (ctx.length || phflag)
                throw new Error('Contexts/pre-hash are not supported');
            return data;
        }
        : opts.domain; // NOOP
    // Parse an EdDSA digest as a little-endian integer and reduce it modulo the scalar field order.
    function modN_LE(hash) {
        return Fn.create(bytesToNumberLE(hash)); // Not Fn.fromBytes: it has length limit
    }
    // Get the hashed private scalar per RFC8032 5.1.5
    function getPrivateScalar(key) {
        const len = lengths.secretKey;
        curves_utils_abytes(key, lengths.secretKey, 'secretKey');
        // Hash private key with curve's hash function to produce uniformingly random input
        // Check byte lengths: ensure(64, h(ensure(32, key)))
        const hashed = curves_utils_abytes(hash(key), 2 * len, 'hashedSecretKey');
        // Slice before clamping so in-place adjustors don't corrupt the prefix half.
        const head = adjustScalarBytes(hashed.slice(0, len)); // clear first half bits, produce FE
        const prefix = hashed.slice(len, 2 * len); // second half is called key prefix (5.1.6)
        const scalar = modN_LE(head); // The actual private scalar
        return { head, prefix, scalar };
    }
    /** Convenience method that creates public key from scalar. RFC8032 5.1.5
     * Also exposes the derived scalar/prefix tuple and point form reused by sign().
     */
    function getExtendedPublicKey(secretKey) {
        const { head, prefix, scalar } = getPrivateScalar(secretKey);
        const point = BASE.multiply(scalar); // Point on Edwards curve aka public key
        const pointBytes = point.toBytes();
        return { head, prefix, scalar, point, pointBytes };
    }
    /** Calculates EdDSA pub key. RFC8032 5.1.5. */
    function getPublicKey(secretKey) {
        return getExtendedPublicKey(secretKey).pointBytes;
    }
    // Hash domain-separated chunks into a little-endian scalar modulo the group order.
    function hashDomainToScalar(context = Uint8Array.of(), ...msgs) {
        const msg = curves_utils_concatBytes(...msgs);
        return modN_LE(hash(domain(msg, curves_utils_abytes(context, undefined, 'context'), !!prehash)));
    }
    /** Signs message with secret key. RFC8032 5.1.6 */
    function sign(msg, secretKey, options = {}) {
        curves_utils_validateObject(options, {}, {}, 'options');
        // Snapshot once: nonce and challenge must use the same invocation-time message bytes.
        msg = curves_utils_copyBytes(curves_utils_abytes(msg, undefined, 'message'));
        if (prehash)
            msg = prehash(msg); // for ed25519ph etc.
        const { prefix, scalar, pointBytes } = getExtendedPublicKey(secretKey);
        const r = hashDomainToScalar(options.context, prefix, msg); // r = dom2(F, C) || prefix || PH(M)
        // RFC 8032 5.1.6 allows r mod L = 0, and SUPERCOP ref10 accepts the resulting identity-point
        // signature.
        // We intentionally keep the safe multiply() rejection here so a miswired all-zero hash provider
        // fails loudly instead of silently producing a degenerate signature.
        const R = BASE.multiply(r).toBytes(); // R = rG
        const k = hashDomainToScalar(options.context, R, pointBytes, msg); // R || A || PH(M)
        const s = Fn.create(r + k * scalar); // S = (r + k * s) mod L
        if (!Fn.isValid(s))
            throw new Error('sign failed: invalid s'); // 0 <= s < L
        const rs = curves_utils_concatBytes(R, Fn.toBytes(s));
        return curves_utils_abytes(rs, lengths.signature, 'result');
    }
    // Keep the shared helper strict by default: RFC 8032 / NIST-style wrappers should reject
    // non-canonical encodings unless they explicitly opt into ZIP-215's more permissive decode rules.
    const verifyOpts = {
        zip215: opts.zip215,
    };
    /**
     * Verifies EdDSA signature against message and public key. RFC 8032 §§5.1.7 and 5.2.7.
     * A cofactored verification equation is checked.
     */
    function verify(sig, msg, publicKey, options = verifyOpts) {
        // Validate before destructuring so explicit null follows the standard options error.
        curves_utils_validateObject(options);
        // Preserve the wrapper-selected default for `{}` / `{ zip215: undefined }`, not just omitted opts.
        const { context } = options;
        const zip215 = options.zip215 === undefined ? !!verifyOpts.zip215 : options.zip215;
        const len = lengths.signature;
        sig = curves_utils_abytes(sig, len, 'signature');
        msg = curves_utils_abytes(msg, undefined, 'message');
        publicKey = curves_utils_abytes(publicKey, lengths.publicKey, 'publicKey');
        if (zip215 !== undefined)
            utils_abool(zip215, 'zip215');
        if (prehash)
            msg = prehash(msg); // for ed25519ph, etc
        const mid = len / 2;
        const r = sig.subarray(0, mid);
        const s = bytesToNumberLE(sig.subarray(mid, len));
        let A, R, SB;
        try {
            // ZIP-215 is more permissive than RFC 8032 / NIST186-5. Use it only for wrappers that
            // explicitly want consensus-style unreduced encoding acceptance.
            // zip215=true:  0 <= y < MASK (2^256 for ed25519)
            // zip215=false: 0 <= y < P (2^255-19 for ed25519)
            A = Point.fromBytes(publicKey, zip215);
            R = Point.fromBytes(r, zip215);
            SB = BASE.multiplyUnsafe(s); // 0 <= s < l is done inside
        }
        catch (error) {
            return false;
        }
        // RFC 8032 §§5.1.7/5.2.7 and FIPS 186-5 §§7.7.2/7.8.2 only decode A' and check the cofactored
        // verification equation; they do not add a separate low-order-public-key rejection here.
        // Strict mode still rejects small-order A' intentionally for SBS-style non-repudiation and to
        // avoid ambiguous verification outcomes where unusual low-order keys can make distinct
        // key/signature/message combinations verify.
        if (!zip215 && A.isSmallOrder())
            return false;
        // ZIP-215 accepts noncanonical / unreduced point encodings, so the challenge hash must use the
        // exact signature/public-key bytes rather than canonicalized re-encodings of the decoded points.
        const k = hashDomainToScalar(context, r, publicKey, msg);
        const RkA = R.add(A.multiplyUnsafe(k));
        // Check the cofactored verification equation via the curve cofactor h.
        // [h][S]B = [h]R + [h][k]A'
        return RkA.subtract(SB).clearCofactor().is0();
    }
    const _size = Fp.BYTES; // 32 for ed25519, 57 for ed448
    const lengths = {
        secretKey: _size,
        publicKey: _size,
        signature: 2 * _size,
        seed: _size,
    };
    function randomSecretKey(seed) {
        seed = seed === undefined ? randomBytes(lengths.seed) : seed;
        return curves_utils_abytes(seed, lengths.seed, 'seed');
    }
    function isValidSecretKey(key) {
        return curves_utils_isBytes(key) && key.length === lengths.secretKey;
    }
    function isValidPublicKey(key, zip215) {
        try {
            // Preserve the wrapper-selected default for omitted / `undefined` ZIP-215 flags here too.
            return !!Point.fromBytes(key, zip215 === undefined ? verifyOpts.zip215 : zip215);
        }
        catch (error) {
            return false;
        }
    }
    const utils = {
        getExtendedPublicKey,
        randomSecretKey,
        isValidSecretKey,
        isValidPublicKey,
        /** Converts an Edwards public key to a companion Montgomery public key. */
        toMontgomery(publicKey) {
            if (toMontgomery === undefined)
                throw new Error('Montgomery conversion is not supported for this curve');
            return toMontgomery(Point.fromBytes(publicKey));
        },
        toMontgomerySecret(secretKey) {
            if (toMontgomerySecret === undefined)
                throw new Error('Montgomery conversion is not supported for this curve');
            return toMontgomerySecret(secretKey);
        },
    };
    Object.freeze(lengths);
    Object.freeze(utils);
    return Object.freeze({
        keygen: curve_createKeygen(randomSecretKey, getPublicKey),
        getPublicKey,
        sign,
        verify,
        utils,
        Point,
        lengths,
    });
}

;// ./node_modules/@noble/curves/abstract/hash-to-curve.js


// prettier-ignore
const hash_to_curve_0n = /* @__PURE__ */ (/* unused pure expression or super */ null && (BigInt(0))), hash_to_curve_1n = /* @__PURE__ */ (/* unused pure expression or super */ null && (BigInt(1))), hash_to_curve_2n = /* @__PURE__ */ (/* unused pure expression or super */ null && (BigInt(2))), hash_to_curve_3n = /* @__PURE__ */ (/* unused pure expression or super */ null && (BigInt(3))), hash_to_curve_4n = /* @__PURE__ */ (/* unused pure expression or super */ null && (BigInt(4)));
// Octet Stream to Integer. "spec" implementation of os2ip is 2.5x slower vs bytesToNumberBE.
const os2ip = (/* unused pure expression or super */ null && (bytesToNumberBE));
// Integer to Octet Stream (numberToBytesBE).
function i2osp(value, length) {
    utils_asafenumber(value);
    utils_asafenumber(length);
    // This helper stays on the JS bitwise/u32 fast-path. Callers that need wider encodings should
    // use bigint + numberToBytesBE instead of routing large widths through this small helper.
    if (length < 0 || length > 4)
        throw new Error('invalid I2OSP length: ' + length);
    if (value < 0 || value > 2 ** (8 * length) - 1)
        throw new Error('invalid I2OSP input: ' + value);
    const res = Array.from({ length }).fill(0);
    for (let i = length - 1; i >= 0; i--) {
        res[i] = value & 0xff;
        value >>>= 8;
    }
    return new Uint8Array(res);
}
// RFC 9380 only applies strxor() to equal-length strings; callers must preserve that invariant.
function strxor(a, b) {
    const arr = new Uint8Array(a.length);
    for (let i = 0; i < a.length; i++) {
        arr[i] = a[i] ^ b[i];
    }
    return arr;
}
// User can always use utf8 if they want, by passing Uint8Array.
// If string is passed, we treat it as ASCII: other formats are likely a mistake.
function normDST(DST) {
    if (!curves_utils_isBytes(DST) && typeof DST !== 'string')
        throw new Error('DST must be Uint8Array or ascii string');
    const dst = typeof DST === 'string' ? utils_asciiToBytes(DST) : DST;
    // RFC 9380 §3.1 requirement 2: tags "MUST have nonzero length".
    if (dst.length === 0)
        throw new Error('DST must be non-empty');
    return dst;
}
/**
 * Produces a uniformly random byte string using a cryptographic hash
 * function H that outputs b bits.
 * See {@link https://www.rfc-editor.org/rfc/rfc9380#section-5.3.1 | RFC 9380 section 5.3.1}.
 * @param msg - Input message.
 * @param DST - Domain separation tag. This helper normalizes DST, rejects empty DSTs, and
 *   oversize-hashes DST when needed.
 * @param lenInBytes - Output length.
 * @param H - Hash function.
 * @returns Uniform byte string.
 * @throws If the message, DST, hash, or output length is invalid. {@link Error}
 * @example
 * Expand one message into uniform bytes with the XMD construction.
 *
 * ```ts
 * import { expand_message_xmd } from '@noble/curves/abstract/hash-to-curve.js';
 * import { sha256 } from '@noble/hashes/sha2.js';
 * const uniform = expand_message_xmd(new TextEncoder().encode('hello noble'), 'DST', 32, sha256);
 * ```
 */
function expand_message_xmd(msg, DST, lenInBytes, H) {
    curves_utils_abytes(msg);
    utils_asafenumber(lenInBytes);
    if (typeof H !== 'function')
        throw new Error('expand_message_xmd: expected hash function');
    utils_asafenumber(H.outputLen, 'hash.outputLen');
    utils_asafenumber(H.blockLen, 'hash.blockLen');
    DST = normDST(DST);
    // https://www.rfc-editor.org/rfc/rfc9380#section-5.3.3
    if (DST.length > 255)
        DST = H(curves_utils_concatBytes(utils_asciiToBytes('H2C-OVERSIZE-DST-'), DST));
    const { outputLen: b_in_bytes, blockLen: r_in_bytes } = H;
    const ell = Math.ceil(lenInBytes / b_in_bytes);
    if (lenInBytes > 65535 || ell > 255)
        throw new Error('expand_message_xmd: invalid lenInBytes');
    const DST_prime = curves_utils_concatBytes(DST, i2osp(DST.length, 1));
    const Z_pad = new Uint8Array(r_in_bytes); // RFC 9380: Z_pad = I2OSP(0, s_in_bytes)
    const l_i_b_str = i2osp(lenInBytes, 2); // len_in_bytes_str
    const b = new Array(ell);
    const b_0 = H(curves_utils_concatBytes(Z_pad, msg, l_i_b_str, i2osp(0, 1), DST_prime));
    b[0] = H(curves_utils_concatBytes(b_0, i2osp(1, 1), DST_prime));
    // `b[0]` already stores RFC `b_1`, so only derive `b_2..b_ell` here. The old `<= ell`
    // loop computed one extra tail block, which was usually sliced away but broke at max `ell=255`
    // by reaching `I2OSP(256, 1)`.
    for (let i = 1; i < ell; i++) {
        const args = [strxor(b_0, b[i - 1]), i2osp(i + 1, 1), DST_prime];
        b[i] = H(curves_utils_concatBytes(...args));
    }
    const pseudo_random_bytes = curves_utils_concatBytes(...b);
    return pseudo_random_bytes.slice(0, lenInBytes);
}
/**
 * Produces a uniformly random byte string using an extendable-output function (XOF) H.
 * 1. The collision resistance of H MUST be at least k bits.
 * 2. H MUST be an XOF that has been proved indifferentiable from
 *    a random oracle under a reasonable cryptographic assumption.
 * See {@link https://www.rfc-editor.org/rfc/rfc9380#section-5.3.2 | RFC 9380 section 5.3.2}.
 * @param msg - Input message.
 * @param DST - Domain separation tag. This helper normalizes DST, rejects empty DSTs, and
 *   oversize-hashes DST when needed.
 * @param lenInBytes - Output length.
 * @param k - Target security level.
 * @param H - XOF hash function.
 * @returns Uniform byte string.
 * @throws If the message, DST, XOF, or output length is invalid. {@link Error}
 * @example
 * Expand one message into uniform bytes with the XOF construction.
 *
 * ```ts
 * import { expand_message_xof } from '@noble/curves/abstract/hash-to-curve.js';
 * import { shake256 } from '@noble/hashes/sha3.js';
 * const uniform = expand_message_xof(
 *   new TextEncoder().encode('hello noble'),
 *   'DST',
 *   32,
 *   128,
 *   shake256
 * );
 * ```
 */
function expand_message_xof(msg, DST, lenInBytes, k, H) {
    abytes(msg);
    asafenumber(lenInBytes);
    asafenumber(k, 'k');
    if (k < 0)
        throw new Error('expand_message_xof: invalid k');
    if (typeof H !== 'function')
        throw new Error('expand_message_xof: expected XOF function');
    if (typeof H.create !== 'function')
        throw new Error('expand_message_xof: expected XOF create');
    DST = normDST(DST);
    if (lenInBytes < 0 || lenInBytes > 65535)
        throw new Error('expand_message_xof: invalid lenInBytes');
    // https://www.rfc-editor.org/rfc/rfc9380#section-5.3.3
    // RFC 9380 §5.3.3: DST = H("H2C-OVERSIZE-DST-" || a_very_long_DST, ceil(2 * k / 8)).
    if (DST.length > 255) {
        const dkLen = Math.ceil((2 * k) / 8);
        DST = H.create({ dkLen }).update(asciiToBytes('H2C-OVERSIZE-DST-')).update(DST).digest();
    }
    // Oversize DSTs are compressed above; fail closed if a custom XOF still returns one
    // (possible when k > 1020 makes the compression dkLen itself exceed 255 bytes).
    if (DST.length > 255)
        throw new Error('expand_message_xof: invalid DST');
    return (H.create({ dkLen: lenInBytes })
        .update(msg)
        .update(i2osp(lenInBytes, 2))
        // 2. DST_prime = DST || I2OSP(len(DST), 1)
        .update(DST)
        .update(i2osp(DST.length, 1))
        .digest());
}
/**
 * Hashes arbitrary-length byte strings to a list of one or more elements of a finite field F.
 * See {@link https://www.rfc-editor.org/rfc/rfc9380#section-5.2 | RFC 9380 section 5.2}.
 * @param msg - Input message bytes.
 * @param count - Number of field elements to derive. Must be `>= 1`.
 * @param options - RFC 9380 options. See {@link H2COpts}. `m` must be `>= 1`.
 * @returns `[u_0, ..., u_(count - 1)]`, a list of field elements.
 * @throws If the expander choice or RFC 9380 options are invalid. {@link Error}
 * @example
 * Hash one message into field elements before mapping it onto a curve.
 *
 * ```ts
 * import { hash_to_field } from '@noble/curves/abstract/hash-to-curve.js';
 * import { sha256 } from '@noble/hashes/sha2.js';
 * const scalars = hash_to_field(new TextEncoder().encode('hello noble'), 2, {
 *   DST: 'DST',
 *   p: 17n,
 *   m: 1,
 *   k: 128,
 *   expand: 'xmd',
 *   hash: sha256,
 * });
 * ```
 */
function hash_to_field(msg, count, options) {
    validateObject(options, {
        p: 'bigint',
        m: 'number',
        k: 'number',
        hash: 'function',
    });
    const { p, k, m, hash, expand, DST } = options;
    asafenumber(hash.outputLen, 'valid hash');
    abytes(msg);
    asafenumber(count);
    asafenumber(m, 'm');
    asafenumber(k, 'k');
    // RFC 9380 §5.2 defines hash_to_field over a list of one or more field elements and an integer
    // extension degree `m >= 1`; rejecting here avoids degenerate `[]` / `[[]]` helper outputs.
    // The RFC also treats `p` as a finite-field characteristic; bad values degenerate log2/mod.
    if (p <= BigInt(1))
        throw new Error('hash_to_field: expected valid field characteristic');
    if (count < 1)
        throw new Error('hash_to_field: expected count >= 1');
    if (m < 1)
        throw new Error('hash_to_field: expected m >= 1');
    if (k < 0)
        throw new Error('hash_to_field: invalid k');
    const log2p = p.toString(2).length;
    const L = Math.ceil((log2p + k) / 8); // section 5.1 of ietf draft link above
    const len_in_bytes = count * m * L;
    let prb; // pseudo_random_bytes
    if (expand === 'xmd') {
        prb = expand_message_xmd(msg, DST, len_in_bytes, hash);
    }
    else if (expand === 'xof') {
        prb = expand_message_xof(msg, DST, len_in_bytes, k, hash);
    }
    else if (expand === '_internal_pass') {
        // for internal tests only: msg is used as the uniform bytes directly. Short msg is allowed
        // on purpose (subarray() slices are short): zkcrypto map_scalar vectors feed empty okm.
        prb = msg;
    }
    else {
        throw new Error('expand must be "xmd" or "xof"');
    }
    const u = new Array(count);
    for (let i = 0; i < count; i++) {
        const e = new Array(m);
        for (let j = 0; j < m; j++) {
            const elm_offset = L * (j + i * m);
            const tv = prb.subarray(elm_offset, elm_offset + L);
            e[j] = mod(os2ip(tv), p);
        }
        u[i] = e;
    }
    return u;
}
/**
 * @param field - Field implementation.
 * @param map - Isogeny coefficients.
 * @returns Isogeny mapping helper.
 * @example
 * Build one rational isogeny map, then apply it to affine x/y coordinates.
 *
 * ```ts
 * import { isogenyMap } from '@noble/curves/abstract/hash-to-curve.js';
 * import { Field } from '@noble/curves/abstract/modular.js';
 * const Fp = Field(17n);
 * const iso = isogenyMap(Fp, [[0n, 1n], [1n], [1n], [1n]]);
 * const point = iso(3n, 5n);
 * ```
 */
function hash_to_curve_isogenyMap(field, map) {
    validateField(field);
    // Make same order as in spec
    aarray(map, 'map');
    const coeff = map.map((i, row) => {
        aarray(i, 'map[' + row + ']');
        if (i.length < 1)
            throw new Error('isogenyMap: expected non-empty coefficients');
        return Array.from(i).reverse();
    });
    return (x, y) => {
        const [xn, xd, yn, yd] = coeff.map((val) => val.reduce((acc, i) => field.add(field.mul(acc, x), i)));
        const isZero = field.is0(xd) || field.is0(yd);
        // Shipped Weierstrass consumers encode that affine identity as all-zero
        // coordinates, so `passZero=true` intentionally collapses zero
        // denominators to `{ x: 0, y: 0 }`.
        const [xd_inv, yd_inv] = FpInvertBatch(field, [xd, yd], true);
        x = field.mul(xn, xd_inv); // xNum / xDen
        y = field.mul(y, field.mul(yn, yd_inv)); // y * (yNum / yDev)
        // RFC 9380 §6.6.3: if the denominator of either isogeny rational function is
        // zero, the exceptional case must return the identity point on E.
        return isZero ? { x: field.ZERO, y: field.ZERO } : { x, y };
    };
}
// Keep the shared DST removable when the selected bundle never hashes to scalar.
// Callers that need protocol-specific scalar domain separation must override this generic default.
// RFC 9497 §§4.1-4.5 use this ASCII prefix before appending the ciphersuite context string.
// Export a string instead of mutable bytes so callers cannot poison default hash-to-scalar behavior
// by mutating a shared Uint8Array in place.
const _DST_scalar = 'HashToScalar-';
/**
 * Creates hash-to-curve methods from EC Point and mapToCurve function. See {@link H2CHasher}.
 * @param Point - Point constructor.
 * @param mapToCurve - Map-to-curve function.
 * @param defaults - Default hash-to-curve options. A frozen detached snapshot is reused as the
 *   shared defaults bundle for the returned helpers.
 * @returns Hash-to-curve helper namespace.
 * @throws If the map-to-curve callback or default hash-to-curve options are invalid. {@link Error}
 * @example
 * Bundle hash-to-curve, hash-to-scalar, and encode-to-curve helpers for one curve.
 *
 * ```ts
 * import { createHasher } from '@noble/curves/abstract/hash-to-curve.js';
 * import { p256 } from '@noble/curves/nist.js';
 * import { sha256 } from '@noble/hashes/sha2.js';
 * const hasher = createHasher(p256.Point, () => p256.Point.BASE.toAffine(), {
 *   DST: 'P256_XMD:SHA-256_SSWU_RO_',
 *   encodeDST: 'P256_XMD:SHA-256_SSWU_NU_',
 *   p: p256.Point.Fp.ORDER,
 *   m: 1,
 *   k: 128,
 *   expand: 'xmd',
 *   hash: sha256,
 * });
 * const point = hasher.encodeToCurve(new TextEncoder().encode('hello noble'));
 * ```
 */
function hash_to_curve_createHasher(Point, mapToCurve, defaults) {
    if (typeof mapToCurve !== 'function')
        throw new Error('mapToCurve() must be defined');
    validateObject(defaults);
    // `Point` is intentionally not shape-validated eagerly here: point constructors vary across
    // curve families, so this helper only checks the hooks it can validate cheaply. Misconfigured
    // suites fail later when hashing first touches Point.fromAffine / Point.ZERO / clearCofactor().
    const snapshot = (src) => Object.freeze({
        ...src,
        DST: isBytes(src.DST) ? copyBytes(src.DST) : src.DST,
        ...(src.encodeDST === undefined
            ? {}
            : { encodeDST: isBytes(src.encodeDST) ? copyBytes(src.encodeDST) : src.encodeDST }),
    });
    // Keep one private defaults snapshot for actual hashing and expose fresh
    // detached snapshots via the public getter.
    // Otherwise a caller could mutate `hasher.defaults.DST` in place and poison
    // the singleton hasher for every other consumer in the same process.
    const safeDefaults = snapshot(defaults);
    // Per-call options are H2CDSTOpts: only DST may be overridden. Copying just that key keeps
    // off-type option objects from silently replacing suite parameters (p/m/k/hash/expand) at
    // runtime — same pinning hashToScalar always did for p/m.
    const dstOverride = (options) => options && options.DST !== undefined ? { DST: options.DST } : undefined;
    function map(num) {
        return Point.fromAffine(mapToCurve(num));
    }
    function clear(initial) {
        const P = initial.clearCofactor();
        // Keep ZERO as the algebraic cofactor-clearing result here; strict public point-validity
        // surfaces may still reject it later, but createHasher.clear() itself is not that boundary.
        if (P.equals(Point.ZERO))
            return Point.ZERO;
        P.assertValidity();
        return P;
    }
    return Object.freeze({
        get defaults() {
            return snapshot(safeDefaults);
        },
        Point,
        hashToCurve(msg, options) {
            const opts = Object.assign({}, safeDefaults, dstOverride(options));
            const u = hash_to_field(msg, 2, opts);
            const u0 = map(u[0]);
            const u1 = map(u[1]);
            return clear(u0.add(u1));
        },
        encodeToCurve(msg, options) {
            const optsDst = safeDefaults.encodeDST === undefined ? {} : { DST: safeDefaults.encodeDST };
            const opts = Object.assign({}, safeDefaults, optsDst, dstOverride(options));
            const u = hash_to_field(msg, 1, opts);
            const u0 = map(u[0]);
            return clear(u0);
        },
        /** See {@link H2CHasher} */
        mapToCurve(scalars) {
            // Curves with m=1 accept only single scalar
            if (safeDefaults.m === 1) {
                if (typeof scalars !== 'bigint')
                    throw new Error('expected bigint (m=1)');
                return clear(map([scalars]));
            }
            if (!Array.isArray(scalars))
                throw new Error('expected array of bigints');
            // RFC 9380 represents one GF(p^m) element as exactly m base-field scalars.
            if (scalars.length !== safeDefaults.m)
                throw new Error(`expected array of ${safeDefaults.m} bigints`);
            for (const i of scalars)
                if (typeof i !== 'bigint')
                    throw new Error('expected array of bigints');
            return clear(map(scalars));
        },
        // hash_to_scalar can produce 0: https://www.rfc-editor.org/errata/eid8393
        // RFC 9380, draft-irtf-cfrg-bbs-signatures-08. Default scalar DST is the shared generic
        // `HashToScalar-` prefix above unless the caller overrides it per invocation.
        hashToScalar(msg, options) {
            // @ts-ignore
            const N = Point.Fn.ORDER;
            const opts = Object.assign({}, safeDefaults, { DST: _DST_scalar }, dstOverride(options), {
                p: N,
                m: 1,
            });
            return hash_to_field(msg, 1, opts)[0][0];
        },
    });
}
/**
 * Implementation of the Shallue and van de Woestijne method for any weierstrass curve.
 * TODO: check if there is a way to merge this with uvRatio in Edwards; move to modular.
 * b = True and y = sqrt(u / v) if (u / v) is square in F, and
 * b = False and y = sqrt(Z * (u / v)) otherwise.
 * RFC 9380 expects callers to provide `v != 0`; this helper does not enforce it.
 * @param Fp - Field implementation.
 * @param Z - Simplified SWU map parameter.
 * @returns Square-root ratio helper.
 * @example
 * Build the square-root ratio helper used by SWU map implementations.
 *
 * ```ts
 * import { SWUFpSqrtRatio } from '@noble/curves/abstract/hash-to-curve.js';
 * import { Field } from '@noble/curves/abstract/modular.js';
 * const Fp = Field(17n);
 * const sqrtRatio = SWUFpSqrtRatio(Fp, 3n);
 * const out = sqrtRatio(4n, 1n);
 * ```
 */
function SWUFpSqrtRatio(Fp, Z) {
    // Fail with the usual field-shape error before touching pow/cmov on malformed field shims.
    const F = validateField(Fp);
    // Generic implementation
    const q = F.ORDER;
    let l = hash_to_curve_0n;
    for (let o = q - hash_to_curve_1n; o % hash_to_curve_2n === hash_to_curve_0n; o /= hash_to_curve_2n)
        l += hash_to_curve_1n;
    const c1 = l; // 1. c1, the largest integer such that 2^c1 divides q - 1.
    // We need 2n ** c1 and 2n ** (c1-1). We can't use **; but we can use <<.
    // 2n ** c1 == 2n << (c1-1)
    const _2n_pow_c1_1 = hash_to_curve_2n << (c1 - hash_to_curve_1n - hash_to_curve_1n);
    const _2n_pow_c1 = _2n_pow_c1_1 * hash_to_curve_2n;
    const c2 = (q - hash_to_curve_1n) / _2n_pow_c1; // 2. c2 = (q - 1) / (2^c1)  # Integer arithmetic
    const c3 = (c2 - hash_to_curve_1n) / hash_to_curve_2n; // 3. c3 = (c2 - 1) / 2            # Integer arithmetic
    const c4 = _2n_pow_c1 - hash_to_curve_1n; // 4. c4 = 2^c1 - 1                # Integer arithmetic
    const c5 = _2n_pow_c1_1; // 5. c5 = 2^(c1 - 1)                  # Integer arithmetic
    const c6 = F.pow(Z, c2); // 6. c6 = Z^c2
    const c7 = F.pow(Z, (c2 + hash_to_curve_1n) / hash_to_curve_2n); // 7. c7 = Z^((c2 + 1) / 2)
    // RFC 9380 Appendix F.2.1.1 defines sqrt_ratio(u, v) only for v != 0.
    // We keep v=0 on the regular result path with isValid=false instead of
    // throwing so the helper stays closer to the RFC's fixed control flow.
    let sqrtRatio = (u, v) => {
        let tv1 = c6; // 1. tv1 = c6
        let tv2 = F.pow(v, c4); // 2. tv2 = v^c4
        let tv3 = F.sqr(tv2); // 3. tv3 = tv2^2
        tv3 = F.mul(tv3, v); // 4. tv3 = tv3 * v
        let tv5 = F.mul(u, tv3); // 5. tv5 = u * tv3
        tv5 = F.pow(tv5, c3); // 6. tv5 = tv5^c3
        tv5 = F.mul(tv5, tv2); // 7. tv5 = tv5 * tv2
        tv2 = F.mul(tv5, v); // 8. tv2 = tv5 * v
        tv3 = F.mul(tv5, u); // 9. tv3 = tv5 * u
        let tv4 = F.mul(tv3, tv2); // 10. tv4 = tv3 * tv2
        tv5 = F.pow(tv4, c5); // 11. tv5 = tv4^c5
        let isQR = F.eql(tv5, F.ONE); // 12. isQR = tv5 == 1
        tv2 = F.mul(tv3, c7); // 13. tv2 = tv3 * c7
        tv5 = F.mul(tv4, tv1); // 14. tv5 = tv4 * tv1
        tv3 = F.cmov(tv2, tv3, isQR); // 15. tv3 = CMOV(tv2, tv3, isQR)
        tv4 = F.cmov(tv5, tv4, isQR); // 16. tv4 = CMOV(tv5, tv4, isQR)
        // 17. for i in (c1, c1 - 1, ..., 2):
        for (let i = c1; i > hash_to_curve_1n; i--) {
            let tv5 = i - hash_to_curve_2n; // 18.    tv5 = i - 2
            tv5 = hash_to_curve_2n << (tv5 - hash_to_curve_1n); // 19.    tv5 = 2^tv5
            let tvv5 = F.pow(tv4, tv5); // 20.    tv5 = tv4^tv5
            const e1 = F.eql(tvv5, F.ONE); // 21.    e1 = tv5 == 1
            tv2 = F.mul(tv3, tv1); // 22.    tv2 = tv3 * tv1
            tv1 = F.mul(tv1, tv1); // 23.    tv1 = tv1 * tv1
            tvv5 = F.mul(tv4, tv1); // 24.    tv5 = tv4 * tv1
            tv3 = F.cmov(tv2, tv3, e1); // 25.    tv3 = CMOV(tv2, tv3, e1)
            tv4 = F.cmov(tvv5, tv4, e1); // 26.    tv4 = CMOV(tv5, tv4, e1)
        }
        // RFC 9380 Appendix F.2.1.1 defines sqrt_ratio(u, v) for v != 0.
        // When u = 0 and v != 0, u / v = 0 is square and the computed root is
        // still 0, so widen only the final flag and keep the full control flow.
        return { isValid: !F.is0(v) && (isQR || F.is0(u)), value: tv3 };
    };
    if (F.ORDER % hash_to_curve_4n === hash_to_curve_3n) {
        // sqrt_ratio_3mod4(u, v)
        const c1 = (F.ORDER - hash_to_curve_3n) / hash_to_curve_4n; // 1. c1 = (q - 3) / 4     # Integer arithmetic
        const c2 = F.sqrt(F.neg(Z)); // 2. c2 = sqrt(-Z)
        sqrtRatio = (u, v) => {
            let tv1 = F.sqr(v); // 1. tv1 = v^2
            const tv2 = F.mul(u, v); // 2. tv2 = u * v
            tv1 = F.mul(tv1, tv2); // 3. tv1 = tv1 * tv2
            let y1 = F.pow(tv1, c1); // 4. y1 = tv1^c1
            y1 = F.mul(y1, tv2); // 5. y1 = y1 * tv2
            const y2 = F.mul(y1, c2); // 6. y2 = y1 * c2
            const tv3 = F.mul(F.sqr(y1), v); // 7. tv3 = y1^2; 8. tv3 = tv3 * v
            const isQR = F.eql(tv3, u); // 9. isQR = tv3 == u
            let y = F.cmov(y2, y1, isQR); // 10. y = CMOV(y2, y1, isQR)
            return { isValid: !F.is0(v) && isQR, value: y }; // 11. return (isQR, y) isQR ? y : y*c2
        };
    }
    // No curves uses that
    // if (Fp.ORDER % _8n === _5n) // sqrt_ratio_5mod8
    return sqrtRatio;
}
/**
 * Simplified Shallue-van de Woestijne-Ulas Method
 * See {@link https://www.rfc-editor.org/rfc/rfc9380#section-6.6.2 | RFC 9380 section 6.6.2}.
 * @param Fp - Field implementation.
 * @param opts - SWU parameters:
 *   - `A`: Curve parameter `A`.
 *   - `B`: Curve parameter `B`.
 *   - `Z`: Simplified SWU map parameter.
 * @returns Deterministic map-to-curve function.
 * @throws If the SWU parameters are invalid or the field lacks the required helpers. {@link Error}
 * @example
 * Map one field element to a Weierstrass curve point with the SWU recipe.
 *
 * ```ts
 * import { mapToCurveSimpleSWU } from '@noble/curves/abstract/hash-to-curve.js';
 * import { Field } from '@noble/curves/abstract/modular.js';
 * const Fp = Field(17n);
 * const map = mapToCurveSimpleSWU(Fp, { A: 1n, B: 2n, Z: 3n });
 * const point = map(5n);
 * ```
 */
function hash_to_curve_mapToCurveSimpleSWU(Fp, opts) {
    const F = validateField(Fp);
    validateObject(opts, {}, {}, 'opts');
    const { A, B, Z } = opts;
    if (!F.isValidNot0(A) || !F.isValidNot0(B) || !F.isValid(Z))
        throw new Error('mapToCurveSimpleSWU: invalid opts');
    // RFC 9380 §6.6.2 and Appendix H.2 require:
    // 1. Z is non-square in F
    // 2. Z != -1 in F
    // 3. g(x) - Z is irreducible over F
    // 4. g(B / (Z * A)) is square in F
    // We can enforce 1, 2, and 4 with the current field API.
    // Criterion 3 is not checked here because generic `IField<T>` does not expose
    // polynomial-ring / irreducibility operations, and this helper is used for
    // both prime and extension fields.
    if (F.eql(Z, F.neg(F.ONE)) || FpIsSquare(F, Z))
        throw new Error('mapToCurveSimpleSWU: invalid opts');
    // RFC 9380 Appendix H.2 criterion 4: g(B / (Z * A)) is square in F.
    // x = B / (Z * A)
    const x = F.mul(B, F.inv(F.mul(Z, A)));
    // g(x) = x^3 + A*x + B
    const gx = F.add(F.add(F.mul(F.sqr(x), x), F.mul(A, x)), B);
    if (!FpIsSquare(F, gx))
        throw new Error('mapToCurveSimpleSWU: invalid opts');
    const sqrtRatio = SWUFpSqrtRatio(F, Z);
    if (!F.isOdd)
        throw new Error('Field does not have .isOdd()');
    // Input: u, an element of F.
    // Output: (x, y), a point on E.
    return (u) => {
        // prettier-ignore
        let tv1, tv2, tv3, tv4, tv5, tv6, x, y;
        tv1 = F.sqr(u); // 1.  tv1 = u^2
        tv1 = F.mul(tv1, Z); // 2.  tv1 = Z * tv1
        tv2 = F.sqr(tv1); // 3.  tv2 = tv1^2
        tv2 = F.add(tv2, tv1); // 4.  tv2 = tv2 + tv1
        tv3 = F.add(tv2, F.ONE); // 5.  tv3 = tv2 + 1
        tv3 = F.mul(tv3, B); // 6.  tv3 = B * tv3
        tv4 = F.cmov(Z, F.neg(tv2), !F.eql(tv2, F.ZERO)); // 7.  tv4 = CMOV(Z, -tv2, tv2 != 0)
        tv4 = F.mul(tv4, A); // 8.  tv4 = A * tv4
        tv2 = F.sqr(tv3); // 9.  tv2 = tv3^2
        tv6 = F.sqr(tv4); // 10. tv6 = tv4^2
        tv5 = F.mul(tv6, A); // 11. tv5 = A * tv6
        tv2 = F.add(tv2, tv5); // 12. tv2 = tv2 + tv5
        tv2 = F.mul(tv2, tv3); // 13. tv2 = tv2 * tv3
        tv6 = F.mul(tv6, tv4); // 14. tv6 = tv6 * tv4
        tv5 = F.mul(tv6, B); // 15. tv5 = B * tv6
        tv2 = F.add(tv2, tv5); // 16. tv2 = tv2 + tv5
        x = F.mul(tv1, tv3); // 17.   x = tv1 * tv3
        const { isValid, value } = sqrtRatio(tv2, tv6); // 18. (is_gx1_square, y1) = sqrt_ratio(tv2, tv6)
        y = F.mul(tv1, u); // 19.   y = tv1 * u  -> Z * u^3 * y1
        y = F.mul(y, value); // 20.   y = y * y1
        x = F.cmov(x, tv3, isValid); // 21.   x = CMOV(x, tv3, is_gx1_square)
        y = F.cmov(y, value, isValid); // 22.   y = CMOV(y, y1, is_gx1_square)
        const e1 = F.isOdd(u) === F.isOdd(y); // 23.  e1 = sgn0(u) == sgn0(y)
        y = F.cmov(F.neg(y), y, e1); // 24.   y = CMOV(-y, y, e1)
        const tv4_inv = FpInvertBatch(F, [tv4], true)[0];
        x = F.mul(x, tv4_inv); // 25.   x = x / tv4
        return { x, y };
    };
}

;// ./node_modules/@noble/curves/ed25519.js
/**
 * ed25519 Twisted Edwards curve with following addons:
 * - X25519 ECDH
 * - Ristretto cofactor elimination
 * - Elligator hash-to-group / point indistinguishability
 * @module
 */
/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */










// prettier-ignore
const ed25519_0n = /* @__PURE__ */ (/* unused pure expression or super */ null && (BigInt(0))), ed25519_1n = /* @__PURE__ */ BigInt(1), ed25519_2n = /* @__PURE__ */ BigInt(2), ed25519_3n = /* @__PURE__ */ (/* unused pure expression or super */ null && (BigInt(3)));
// prettier-ignore
const ed25519_5n = /* @__PURE__ */ BigInt(5), ed25519_8n = /* @__PURE__ */ BigInt(8);
// P = 2n**255n - 19n
const ed25519_CURVE_p = /* @__PURE__ */ BigInt('0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffed');
// N = 2n**252n + 27742317777372353535851937790883648493n
// a = Fp.create(BigInt(-1))
// d = -121665/121666 a.k.a. Fp.neg(121665 * Fp.inv(121666))
const ed25519_CURVE = /* @__PURE__ */ (() => ({
    p: ed25519_CURVE_p,
    n: BigInt('0x1000000000000000000000000000000014def9dea2f79cd65812631a5cf5d3ed'),
    h: ed25519_8n,
    a: BigInt('0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffec'),
    d: BigInt('0x52036cee2b6ffe738cc740797779e89800700a4d4141d8ab75eb4dca135978a3'),
    Gx: BigInt('0x216936d3cd6e53fec0a4e231fdd6dc5c692cc7609525a7b2c9562d608f25d51a'),
    Gy: BigInt('0x6666666666666666666666666666666666666666666666666666666666666658'),
}))();
function ed25519_pow_2_252_3(x) {
    // prettier-ignore
    const _10n = BigInt(10), _20n = BigInt(20), _40n = BigInt(40), _80n = BigInt(80);
    const P = ed25519_CURVE_p;
    const x2 = (x * x) % P;
    const b2 = (x2 * x) % P; // x^3, 11
    const b4 = (modular_pow2(b2, ed25519_2n, P) * b2) % P; // x^15, 1111
    const b5 = (modular_pow2(b4, ed25519_1n, P) * x) % P; // x^31
    const b10 = (modular_pow2(b5, ed25519_5n, P) * b5) % P;
    const b20 = (modular_pow2(b10, _10n, P) * b10) % P;
    const b40 = (modular_pow2(b20, _20n, P) * b20) % P;
    const b80 = (modular_pow2(b40, _40n, P) * b40) % P;
    const b160 = (modular_pow2(b80, _80n, P) * b80) % P;
    const b240 = (modular_pow2(b160, _80n, P) * b80) % P;
    const b250 = (modular_pow2(b240, _10n, P) * b10) % P;
    const pow_p_5_8 = (modular_pow2(b250, ed25519_2n, P) * x) % P;
    // ^ This is x^((p-5)/8); multiply by x once more to get x^((p+3)/8).
    return { pow_p_5_8, b2 };
}
// Mutates and returns the provided 32-byte buffer in place.
function adjustScalarBytes(bytes) {
    // Section 5: For X25519, in order to decode 32 random bytes as an integer scalar,
    // set the three least significant bits of the first byte
    bytes[0] &= 248; // 0b1111_1000
    // and the most significant bit of the last to zero,
    bytes[31] &= 127; // 0b0111_1111
    // set the second most significant bit of the last byte to 1
    bytes[31] |= 64; // 0b0100_0000
    return bytes;
}
// √(-1) aka √(a) aka 2^((p-1)/4)
// Fp.sqrt(Fp.neg(1))
const ED25519_SQRT_M1 = /* @__PURE__ */ BigInt('19681161376707505956807079304988542015446066515923890162744021073123829784752');
// sqrt(u/v). Returns `{ isValid, value }`; on non-squares `value` is still a
// dummy root-shaped field element so callers can stay constant-time.
function uvRatio(u, v) {
    const P = ed25519_CURVE_p;
    const v3 = modular_mod(v * v * v, P); // v³
    const v7 = modular_mod(v3 * v3 * v, P); // v⁷
    // (p+3)/8 and (p-5)/8
    const pow = ed25519_pow_2_252_3(u * v7).pow_p_5_8;
    let x = modular_mod(u * v3 * pow, P); // (uv³)(uv⁷)^(p-5)/8
    const vx2 = modular_mod(v * x * x, P); // vx²
    const root1 = x; // First root candidate
    const root2 = modular_mod(x * ED25519_SQRT_M1, P); // Second root candidate
    const useRoot1 = vx2 === u; // If vx² = u (mod p), x is a square root
    const useRoot2 = vx2 === modular_mod(-u, P); // If vx² = -u, set x <-- x * 2^((p-1)/4)
    const noRoot = vx2 === modular_mod(-u * ED25519_SQRT_M1, P); // There is no valid root, vx² = -u√(-1)
    if (useRoot1)
        x = root1;
    if (useRoot2 || noRoot)
        x = root2; // We return root2 anyway, for const-time
    if (isNegativeLE(x, P))
        x = modular_mod(-x, P);
    return { isValid: useRoot1 || useRoot2, value: x };
}
const ed25519_Point = /* @__PURE__ */ edwards(ed25519_CURVE, { uvRatio });
// Public field alias stays stricter than the RFC 8032 Appendix A sample code:
// `Fp.inv(0)` throws instead of returning `0`.
const Fp = /* @__PURE__ */ (() => ed25519_Point.Fp)();
function toMontgomery(point) {
    // Birational map from Ed25519 to Curve25519 / X25519:
    //   (u, v) = ((1 + y) / (1 - y), sqrt(-486664) * u / x)
    //   (x, y) = (sqrt(-486664) * u / v, (u - 1) / (u + 1))
    const { y } = point;
    return Fp.toBytes(Fp.div(ed25519_1n + y, ed25519_1n - y));
}
function toMontgomerySecret(secretKey) {
    const size = ed25519_Point.Fp.BYTES;
    utils_abytes(secretKey, size);
    return adjustScalarBytes(sha2_sha512(secretKey.subarray(0, size))).subarray(0, size);
}
const ed25519_Fn = /* @__PURE__ */ (() => ed25519_Point.Fn)();
// RFC 8032 `dom2` helper for ctx/ph variants only. Plain Ed25519 keeps the
// empty-domain path in `ed()` and would be wrong if routed through this helper.
function ed25519_domain(data, ctx, phflag) {
    if (ctx.length > 255)
        throw new Error('Context is too big');
    return utils_concatBytes(utils_asciiToBytes('SigEd25519 no Ed25519 collisions'), new Uint8Array([phflag ? 1 : 0, ctx.length]), ctx, data);
}
function ed(opts) {
    // Ed25519 keeps ZIP-215 default verification semantics for consensus compatibility.
    return eddsa(ed25519_Point, sha2_sha512, Object.assign({ adjustScalarBytes, toMontgomery, toMontgomerySecret, zip215: true }, opts));
}
/**
 * ed25519 curve with EdDSA signatures.
 * Seeded `keygen(seed)` / `utils.randomSecretKey(seed)` reuse the provided
 * 32-byte seed buffer instead of copying it.
 * @example
 * Generate one Ed25519 keypair, sign a message, and verify it.
 *
 * ```js
 * import { ed25519 } from '@noble/curves/ed25519.js';
 * const { secretKey, publicKey } = ed25519.keygen();
 * // const publicKey = ed25519.getPublicKey(secretKey);
 * const msg = new TextEncoder().encode('hello noble');
 * const sig = ed25519.sign(msg, secretKey);
 * const isValid = ed25519.verify(sig, msg, publicKey); // ZIP215
 * // RFC8032 / FIPS 186-5
 * const isValid2 = ed25519.verify(sig, msg, publicKey, { zip215: false });
 * ```
 */
const ed25519 = /* @__PURE__ */ ed({});
/**
 * Context version of ed25519 (ctx for domain separation). See {@link ed25519}
 * Seeded `keygen(seed)` / `utils.randomSecretKey(seed)` reuse the provided
 * 32-byte seed buffer instead of copying it.
 * @example
 * Sign and verify with Ed25519ctx under one explicit context.
 *
 * ```ts
 * const context = new TextEncoder().encode('docs');
 * const { secretKey, publicKey } = ed25519ctx.keygen();
 * const msg = new TextEncoder().encode('hello noble');
 * const sig = ed25519ctx.sign(msg, secretKey, { context });
 * const isValid = ed25519ctx.verify(sig, msg, publicKey, { context });
 * ```
 */
const ed25519ctx = /* @__PURE__ */ ed({ domain: ed25519_domain });
/**
 * Prehashed version of ed25519. See {@link ed25519}
 * Seeded `keygen(seed)` / `utils.randomSecretKey(seed)` reuse the provided
 * 32-byte seed buffer instead of copying it.
 * @example
 * Use the prehashed Ed25519 variant for one message.
 *
 * ```ts
 * const { secretKey, publicKey } = ed25519ph.keygen();
 * const msg = new TextEncoder().encode('hello noble');
 * const sig = ed25519ph.sign(msg, secretKey);
 * const isValid = ed25519ph.verify(sig, msg, publicKey);
 * ```
 */
const ed25519ph = /* @__PURE__ */ ed({ domain: ed25519_domain, prehash: sha2_sha512 });
/**
 * FROST threshold signatures over ed25519. RFC 9591.
 * @example
 * Create one trusted-dealer package for 2-of-3 ed25519 signing.
 *
 * ```ts
 * const alice = ed25519_FROST.Identifier.derive('alice@example.com');
 * const bob = ed25519_FROST.Identifier.derive('bob@example.com');
 * const carol = ed25519_FROST.Identifier.derive('carol@example.com');
 * const deal = ed25519_FROST.trustedDealer({ min: 2, max: 3 }, [alice, bob, carol]);
 * ```
 */
const ed25519_FROST = /* @__PURE__ */ (/* unused pure expression or super */ null && ((() => createFROST({
    name: 'FROST-ED25519-SHA512-v1',
    Point: ed25519_Point,
    validatePoint: (p) => {
        p.assertValidity();
        if (!p.isTorsionFree())
            throw new Error('bad point: not torsion-free');
    },
    hash: sha512,
    // RFC 9591 keeps H2 undecorated here for RFC 8032 compatibility. In createFROST(),
    // `H2: ''` becomes an empty DST prefix; the built-in hashToScalar fallback treats
    // that the same as omitted DST, even though custom hooks can still observe the empty bag.
    H2: '',
}))()));
/**
 * ECDH using curve25519 aka x25519.
 * `getSharedSecret()` rejects low-order peer inputs by default, and seeded
 * `keygen(seed)` reuses the provided 32-byte seed buffer instead of copying it.
 * @example
 * Derive one shared secret between two X25519 peers.
 *
 * ```js
 * import { x25519 } from '@noble/curves/ed25519.js';
 * const alice = x25519.keygen();
 * const bob = x25519.keygen();
 * const alicePublic = x25519.getPublicKey(alice.secretKey);
 * const shared = x25519.getSharedSecret(alice.secretKey, bob.publicKey);
 * ```
 */
const x25519 = /* @__PURE__ */ (/* unused pure expression or super */ null && ((() => {
    const P = ed25519_CURVE_p;
    const powPminus2 = (x) => {
        // x^(p-2) aka x^(2^255-21)
        const { pow_p_5_8, b2 } = ed25519_pow_2_252_3(x);
        return mod(pow2(pow_p_5_8, ed25519_3n, P) * b2, P);
    };
    return montgomery({
        P,
        type: 'x25519',
        powPminus2,
        adjustScalarBytes,
        // ~3x faster fixed-base: [k]B on the birationally-equivalent Edwards curve using cached
        // base tables, mapped back via u = (1+y)/(1-y) = (Z+Y)/(Z-Y) with one Fermat inversion.
        // Same construction as libsodium's crypto_scalarmult_curve25519_base.
        scalarMultBase: (k) => {
            // Clamped k (≈2^254) exceeds n, but B has prime order n, so [k]B == [k mod n]B.
            const kn = mod(k, ed25519_Point.Fn.ORDER);
            // k ≡ 0 (mod n): [k]B is the point at infinity, whose u is 0 in the x-only ladder;
            // returning 0 makes montgomery() reject it exactly like the ladder path.
            if (kn === ed25519_0n)
                return ed25519_0n;
            const p = ed25519_Point.BASE.multiply(kn);
            // Z-Y == 0 only at the identity, which kn != 0 excludes.
            return mod((p.Z + p.Y) * powPminus2(mod(p.Z - p.Y, P)), P);
        },
    });
})()));
// Hash To Curve Elligator2 Map (NOTE: different from ristretto255 elligator)
// RFC 9380 Appendix G.2.2 / Err4730 requires `sgn0(c1) = 0` for the Edwards
// map constant below, so use the even root explicitly.
// 1. c1 = (q + 3) / 8 # Integer arithmetic
const ELL2_C1 = /* @__PURE__ */ (/* unused pure expression or super */ null && ((() => (ed25519_CURVE_p + ed25519_3n) / ed25519_8n)()));
const ELL2_C2 = /* @__PURE__ */ (/* unused pure expression or super */ null && ((() => Fp.pow(ed25519_2n, ELL2_C1))())); // 2. c2 = 2^c1
const ELL2_C3 = /* @__PURE__ */ (/* unused pure expression or super */ null && ((() => Fp.sqrt(Fp.neg(Fp.ONE)))())); // 3. c3 = sqrt(-1)
const ELL2_J = /* @__PURE__ */ (/* unused pure expression or super */ null && (BigInt(486662)));
/**
 * RFC 9380 method `map_to_curve_elligator2_curve25519`. Experimental name: may be renamed later.
 * @private
 */
// prettier-ignore
function _map_to_curve_elligator2_curve25519(u) {
    // 4. c4 = (q - 5) / 8: tv2^c4 below reuses the ed25519_pow_2_252_3 addition chain,
    // whose pow_p_5_8 output is exactly x^((p-5)/8).
    let tv1 = Fp.sqr(u); //  1.  tv1 = u^2
    tv1 = Fp.mul(tv1, ed25519_2n); //  2.  tv1 = 2 * tv1
    // 3. xd = tv1 + 1 # Nonzero: -1 is square (mod p), tv1 is not
    let xd = Fp.add(tv1, Fp.ONE);
    let x1n = Fp.neg(ELL2_J); //  4.  x1n = -J              # x1 = x1n / xd = -J / (1 + 2 * u^2)
    let tv2 = Fp.sqr(xd); //  5.  tv2 = xd^2
    let gxd = Fp.mul(tv2, xd); //  6.  gxd = tv2 * xd        # gxd = xd^3
    let gx1 = Fp.mul(tv1, ELL2_J); //  7.  gx1 = J * tv1         # x1n + J * xd
    gx1 = Fp.mul(gx1, x1n); //  8.  gx1 = gx1 * x1n       # x1n^2 + J * x1n * xd
    gx1 = Fp.add(gx1, tv2); //  9.  gx1 = gx1 + tv2       # x1n^2 + J * x1n * xd + xd^2
    gx1 = Fp.mul(gx1, x1n); //  10. gx1 = gx1 * x1n       # x1n^3 + J * x1n^2 * xd + x1n * xd^2
    let tv3 = Fp.sqr(gxd); //  11. tv3 = gxd^2
    tv2 = Fp.sqr(tv3); //  12. tv2 = tv3^2           # gxd^4
    tv3 = Fp.mul(tv3, gxd); //  13. tv3 = tv3 * gxd       # gxd^3
    tv3 = Fp.mul(tv3, gx1); //  14. tv3 = tv3 * gx1       # gx1 * gxd^3
    tv2 = Fp.mul(tv2, tv3); //  15. tv2 = tv2 * tv3       # gx1 * gxd^7
    let y11 = ed25519_pow_2_252_3(tv2).pow_p_5_8; //  16. y11 = tv2^c4  # (gx1 * gxd^7)^((p - 5) / 8)
    y11 = Fp.mul(y11, tv3); //  17. y11 = y11 * tv3       # gx1*gxd^3*(gx1*gxd^7)^((p-5)/8)
    let y12 = Fp.mul(y11, ELL2_C3); //  18. y12 = y11 * c3
    tv2 = Fp.sqr(y11); //  19. tv2 = y11^2
    tv2 = Fp.mul(tv2, gxd); //  20. tv2 = tv2 * gxd
    let e1 = Fp.eql(tv2, gx1); //  21.  e1 = tv2 == gx1
    // 22. y1 = CMOV(y12, y11, e1) # If g(x1) is square, this is its sqrt
    let y1 = Fp.cmov(y12, y11, e1);
    let x2n = Fp.mul(x1n, tv1); //  23. x2n = x1n * tv1       # x2 = x2n / xd = 2 * u^2 * x1n / xd
    let y21 = Fp.mul(y11, u); //  24. y21 = y11 * u
    y21 = Fp.mul(y21, ELL2_C2); //  25. y21 = y21 * c2
    let y22 = Fp.mul(y21, ELL2_C3); //  26. y22 = y21 * c3
    let gx2 = Fp.mul(gx1, tv1); //  27. gx2 = gx1 * tv1       # g(x2) = gx2 / gxd = 2 * u^2 * g(x1)
    tv2 = Fp.sqr(y21); //  28. tv2 = y21^2
    tv2 = Fp.mul(tv2, gxd); //  29. tv2 = tv2 * gxd
    let e2 = Fp.eql(tv2, gx2); //  30.  e2 = tv2 == gx2
    // 31. y2 = CMOV(y22, y21, e2) # If g(x2) is square, this is its sqrt
    let y2 = Fp.cmov(y22, y21, e2);
    tv2 = Fp.sqr(y1); //  32. tv2 = y1^2
    tv2 = Fp.mul(tv2, gxd); //  33. tv2 = tv2 * gxd
    let e3 = Fp.eql(tv2, gx1); //  34.  e3 = tv2 == gx1
    let xn = Fp.cmov(x2n, x1n, e3); //  35.  xn = CMOV(x2n, x1n, e3)  # If e3, x = x1, else x = x2
    let y = Fp.cmov(y2, y1, e3); //  36.   y = CMOV(y2, y1, e3)    # If e3, y = y1, else y = y2
    let e4 = Fp.isOdd(y); //  37.  e4 = sgn0(y) == 1        # Fix sign of y
    y = Fp.cmov(y, Fp.neg(y), e3 !== e4); //  38.   y = CMOV(y, -y, e3 XOR e4)
    return { xMn: xn, xMd: xd, yMn: y, yMd: ed25519_1n }; //  39. return (xn, xd, y, 1)
}
// sgn0(c1) MUST equal 0
const ELL2_C1_EDWARDS = /* @__PURE__ */ (/* unused pure expression or super */ null && ((() => FpSqrtEven(Fp, Fp.neg(BigInt(486664))))()));
function map_to_curve_elligator2_edwards25519(u) {
    // 1. (xMn, xMd, yMn, yMd) = map_to_curve_elligator2_curve25519(u)
    const { xMn, xMd, yMn, yMd } = _map_to_curve_elligator2_curve25519(u);
    // map_to_curve_elligator2_curve25519(u)
    let xn = Fp.mul(xMn, yMd); //  2.  xn = xMn * yMd
    xn = Fp.mul(xn, ELL2_C1_EDWARDS); //  3.  xn = xn * c1
    let xd = Fp.mul(xMd, yMn); //  4.  xd = xMd * yMn    # xn / xd = c1 * xM / yM
    let yn = Fp.sub(xMn, xMd); //  5.  yn = xMn - xMd
    // 6. yd = xMn + xMd # (n / d - 1) / (n / d + 1) = (n - d) / (n + d)
    let yd = Fp.add(xMn, xMd);
    let tv1 = Fp.mul(xd, yd); //  7. tv1 = xd * yd
    let e = Fp.eql(tv1, Fp.ZERO); //  8.   e = tv1 == 0
    xn = Fp.cmov(xn, Fp.ZERO, e); //  9.  xn = CMOV(xn, 0, e)
    xd = Fp.cmov(xd, Fp.ONE, e); //  10. xd = CMOV(xd, 1, e)
    yn = Fp.cmov(yn, Fp.ONE, e); //  11. yn = CMOV(yn, 1, e)
    yd = Fp.cmov(yd, Fp.ONE, e); //  12. yd = CMOV(yd, 1, e)
    const [xd_inv, yd_inv] = FpInvertBatch(Fp, [xd, yd], true); // batch division
    // Noble normalizes the RFC rational representation to affine `{ x, y }`
    // before returning from the internal helper.
    return { x: Fp.mul(xn, xd_inv), y: Fp.mul(yn, yd_inv) }; //  13. return (xn, xd, yn, yd)
}
/**
 * Hashing to ed25519 points / field. RFC 9380 methods.
 * Public `mapToCurve()` returns the cofactor-cleared subgroup point; the
 * internal map callback below consumes one field element bigint, not `[bigint]`.
 * @example
 * Hash one message onto the ed25519 curve.
 *
 * ```ts
 * const point = ed25519_hasher.hashToCurve(new TextEncoder().encode('hello noble'));
 * ```
 */
const ed25519_hasher = /* @__PURE__ */ (/* unused pure expression or super */ null && ((() => createHasher(ed25519_Point, (scalars) => map_to_curve_elligator2_edwards25519(scalars[0]), {
    DST: 'edwards25519_XMD:SHA-512_ELL2_RO_',
    encodeDST: 'edwards25519_XMD:SHA-512_ELL2_NU_',
    p: ed25519_CURVE_p,
    m: 1,
    k: 128,
    expand: 'xmd',
    hash: sha512,
}))()));
// √(-1) aka √(a) aka 2^((p-1)/4)
const SQRT_M1 = ED25519_SQRT_M1;
// √(ad - 1)
const SQRT_AD_MINUS_ONE = /* @__PURE__ */ BigInt('25063068953384623474111414158702152701244531502492656460079210482610430750235');
// 1 / √(a-d)
const INVSQRT_A_MINUS_D = /* @__PURE__ */ BigInt('54469307008909316920995813868745141605393597292927456921205312896311721017578');
// 1-d²
const ONE_MINUS_D_SQ = /* @__PURE__ */ BigInt('1159843021668779879193775521855586647937357759715417654439879720876111806838');
// (d-1)²
const D_MINUS_ONE_SQ = /* @__PURE__ */ BigInt('40440834346308536858101042469323190826248399146238708352240133220865137265952');
// `SQRT_RATIO_M1(1, number)` specialization. Returns `{ isValid, value }`,
// where non-squares get the nonnegative `sqrt(SQRT_M1 / number)` branch.
const invertSqrt = (number) => uvRatio(ed25519_1n, number);
const MAX_255B = /* @__PURE__ */ BigInt('0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');
// RFC 9496 §4.3.4 MAP parser: masks bit 255 and reduces modulo p for element
// derivation. The decode path has the opposite contract and rejects that bit.
const bytes255ToNumberLE = (bytes) => Fp.create(bytesToNumberLE(bytes) & MAX_255B);
/**
 * Computes Elligator map for Ristretto255.
 * Primary formula source is RFC 9496 §4.3.4 MAP; RFC 9380 Appendix B builds
 * `hash_to_ristretto255` on top of this helper.
 * Returns an internal Edwards representative, not a public `_RistrettoPoint`.
 */
function calcElligatorRistrettoMap(r0) {
    const { d } = ed25519_CURVE;
    const r = Fp.mul(Fp.mulN(SQRT_M1, r0), r0); // 1
    const Ns = Fp.mul(Fp.addN(r, ed25519_1n), ONE_MINUS_D_SQ); // 2
    let c = BigInt(-1); // 3
    const D = Fp.mul(Fp.subN(c, Fp.mulN(d, r)), Fp.add(r, d)); // 4
    let { isValid: Ns_D_is_sq, value: s } = uvRatio(Ns, D); // 5
    let s_ = Fp.mul(s, r0); // 6
    if (!Fp.isOdd(s_))
        s_ = Fp.neg(s_);
    if (!Ns_D_is_sq)
        s = s_; // 7
    if (!Ns_D_is_sq)
        c = r; // 8
    const Nt = Fp.sub(Fp.mulN(Fp.mulN(c, Fp.subN(r, ed25519_1n)), D_MINUS_ONE_SQ), D); // 9
    const s2 = Fp.sqrN(s);
    const W0 = Fp.mul(Fp.addN(s, s), D); // 10
    const W1 = Fp.mul(Nt, SQRT_AD_MINUS_ONE); // 11
    const W2 = Fp.sub(ed25519_1n, s2); // 12
    const W3 = Fp.add(ed25519_1n, s2); // 13
    return new ed25519_Point(Fp.mul(W0, W3), Fp.mul(W2, W1), Fp.mul(W1, W3), Fp.mul(W0, W2));
}
/**
 * Wrapper over Edwards Point for ristretto255.
 *
 * Each ed25519/EdwardsPoint has 8 different equivalent points. This can be
 * a source of bugs for protocols like ring signatures. Ristretto was created to solve this.
 * Ristretto point operates in X:Y:Z:T extended coordinates like EdwardsPoint,
 * but it should work in its own namespace: do not combine those two.
 * See [RFC9496](https://www.rfc-editor.org/rfc/rfc9496).
 */
class _RistrettoPoint extends PrimeEdwardsPoint {
    // Do NOT change syntax: the following gymnastics is done,
    // because typescript strips comments, which makes bundlers disable tree-shaking.
    // prettier-ignore
    static BASE = 
    /* @__PURE__ */ (() => new _RistrettoPoint(ed25519_Point.BASE))();
    // prettier-ignore
    static ZERO = 
    /* @__PURE__ */ (() => new _RistrettoPoint(ed25519_Point.ZERO))();
    // prettier-ignore
    static Fp = 
    /* @__PURE__ */ (() => Fp)();
    // prettier-ignore
    static Fn = 
    /* @__PURE__ */ (() => ed25519_Fn)();
    constructor(ep) {
        super(ep);
    }
    /**
     * Create one Ristretto255 point from affine Edwards coordinates.
     * This wraps the internal Edwards representative directly and is not a
     * canonical ristretto255 decoding path.
     * Use `toBytes()` / `fromBytes()` if canonical ristretto255 bytes matter.
     */
    static fromAffine(ap) {
        return new _RistrettoPoint(ed25519_Point.fromAffine(ap));
    }
    assertSame(other) {
        if (!(other instanceof _RistrettoPoint))
            throw new Error('RistrettoPoint expected');
    }
    init(ep) {
        return new _RistrettoPoint(ep);
    }
    static fromBytes(bytes) {
        utils_abytes(bytes, 32);
        const { a, d } = ed25519_CURVE;
        const s = bytes255ToNumberLE(bytes);
        // 1. Check that s_bytes is the canonical encoding of a field element, or else abort.
        // 3. Check that s is non-negative, or else abort
        if (!equalBytes(Fp.toBytes(s), bytes) || Fp.isOdd(s))
            throw new Error('invalid ristretto255 encoding 1');
        const s2 = Fp.sqr(s);
        const u1 = Fp.add(ed25519_1n, Fp.mulN(a, s2)); // 4 (a is -1)
        const u2 = Fp.sub(ed25519_1n, Fp.mulN(a, s2)); // 5
        const u1_2 = Fp.sqr(u1);
        const u2_2 = Fp.sqr(u2);
        const v = Fp.sub(Fp.mulN(Fp.mulN(a, d), u1_2), u2_2); // 6
        const { isValid, value: I } = invertSqrt(Fp.mul(v, u2_2)); // 7
        const Dx = Fp.mul(I, u2); // 8
        const Dy = Fp.mul(Fp.mulN(I, Dx), v); // 9
        let x = Fp.mul(Fp.addN(s, s), Dx); // 10
        if (Fp.isOdd(x))
            x = Fp.neg(x); // 10
        const y = Fp.mul(u1, Dy); // 11
        const t = Fp.mul(x, y); // 12
        if (!isValid || Fp.isOdd(t) || Fp.is0(y))
            throw new Error('invalid ristretto255 encoding 2');
        return new _RistrettoPoint(new ed25519_Point(x, y, Fp.ONE, t));
    }
    /**
     * Converts ristretto-encoded string to ristretto point.
     * Described in [RFC9496](https://www.rfc-editor.org/rfc/rfc9496#name-decode).
     * @param hex - Ristretto-encoded 32 bytes. Not every 32-byte string is valid ristretto encoding
     */
    static fromHex(hex) {
        return _RistrettoPoint.fromBytes(hexToBytes(hex));
    }
    /**
     * Encodes ristretto point to Uint8Array.
     * Described in [RFC9496](https://www.rfc-editor.org/rfc/rfc9496#name-encode).
     */
    toBytes() {
        let { X, Y, Z, T } = this.ep;
        const u1 = Fp.mul(Fp.add(Z, Y), Fp.sub(Z, Y)); // 1
        const u2 = Fp.mul(X, Y); // 2
        // Square root always exists
        const u2sq = Fp.sqr(u2);
        const { value: invsqrt } = invertSqrt(Fp.mul(u1, u2sq)); // 3
        const D1 = Fp.mul(invsqrt, u1); // 4
        const D2 = Fp.mul(invsqrt, u2); // 5
        const zInv = Fp.mul(Fp.mulN(D1, D2), T); // 6
        let D; // 7
        if (Fp.isOdd(Fp.mul(T, zInv))) {
            let _x = Fp.mul(Y, SQRT_M1);
            let _y = Fp.mul(X, SQRT_M1);
            X = _x;
            Y = _y;
            D = Fp.mul(D1, INVSQRT_A_MINUS_D);
        }
        else {
            D = D2; // 8
        }
        if (Fp.isOdd(Fp.mul(X, zInv)))
            Y = Fp.neg(Y); // 9
        let s = Fp.mul(Fp.subN(Z, Y), D); // 10 (check footer's note, no sqrt(-a))
        if (Fp.isOdd(s))
            s = Fp.neg(s);
        return Fp.toBytes(s); // 11
    }
    /**
     * Compares two Ristretto points.
     * Described in [RFC9496](https://www.rfc-editor.org/rfc/rfc9496#name-equals).
     */
    equals(other) {
        this.assertSame(other);
        const { X: X1, Y: Y1 } = this.ep;
        const { X: X2, Y: Y2 } = other.ep;
        // (x1 * y2 == y1 * x2) | (y1 * y2 == x1 * x2)
        const one = Fp.eql(Fp.mul(X1, Y2), Fp.mul(Y1, X2));
        const two = Fp.eql(Fp.mul(Y1, Y2), Fp.mul(X1, X2));
        return one || two;
    }
    is0() {
        return this.equals(_RistrettoPoint.ZERO);
    }
}
/** Prime-order Ristretto255 group bundle. */
const ristretto255 = /* @__PURE__ */ (/* unused pure expression or super */ null && ((() => {
    Object.freeze(_RistrettoPoint.BASE);
    Object.freeze(_RistrettoPoint.ZERO);
    Object.freeze(_RistrettoPoint.prototype);
    Object.freeze(_RistrettoPoint);
    return Object.freeze({ Point: _RistrettoPoint });
})()));
/**
 * Hashing to ristretto255 points / field. RFC 9380 methods.
 * `hashToCurve()` is RFC 9380 Appendix B, `deriveToCurve()` is the RFC 9496
 * §4.3.4 element-derivation building block, and `hashToScalar()` is a
 * library-specific helper for OPRF-style use.
 * @example
 * Hash one message onto ristretto255.
 *
 * ```ts
 * const point = ristretto255_hasher.hashToCurve(new TextEncoder().encode('hello noble'));
 * ```
 */
const ristretto255_hasher = 
/* @__PURE__ */ Object.freeze({
    Point: _RistrettoPoint,
    /**
  * Spec: https://www.rfc-editor.org/rfc/rfc9380.html#name-hashing-to-ristretto255. Caveats:
  * * There are no test vectors
  * * encodeToCurve / mapToCurve is undefined
  * * mapToCurve would be `calcElligatorRistrettoMap(scalars[0])`, not ristretto255_map!
  * * hashToScalar is undefined too, so we just use OPRF implementation
  * * We cannot re-use 'createHasher', because ristretto255_map is different algorithm/RFC
    (os2ip -> bytes255ToNumberLE)
  * * mapToCurve == calcElligatorRistrettoMap, hashToCurve == ristretto255_map
  * * hashToScalar is undefined in RFC9380 for ristretto, so we use the OPRF
    version here. Using `bytes255ToNumblerLE` will create a different result
    if we use `bytes255ToNumberLE` as os2ip
  * * current version is closest to spec.
  */
    hashToCurve(msg, options) {
        // == 'hash_to_ristretto255'
        // Preserve explicit empty/invalid DST overrides so expand_message_xmd() can reject them.
        const DST = options?.DST === undefined ? 'ristretto255_XMD:SHA-512_R255MAP_RO_' : options.DST;
        const xmd = expand_message_xmd(msg, DST, 64, sha2_sha512);
        // NOTE: RFC 9380 incorrectly calls this function `ristretto255_map`.
        // In RFC 9496, `map` was the per-point function inside the construction.
        // That also led to confusion that `ristretto255_map` is `mapToCurve`.
        // It is not: it is the older hash-to-curve construction.
        return ristretto255_hasher.deriveToCurve(xmd);
    },
    hashToScalar(msg, options) {
        const DST = options?.DST === undefined ? _DST_scalar : options.DST;
        const xmd = expand_message_xmd(msg, DST, 64, sha2_sha512);
        return ed25519_Fn.create(bytesToNumberLE(xmd));
    },
    /**
     * HashToCurve-like construction based on RFC 9496 (Element Derivation).
     * Converts 64 uniform random bytes into a curve point.
     *
     * WARNING: This represents an older hash-to-curve construction from before
     * RFC 9380 was finalized.
     * It was later reused as a component in the newer
     * `hash_to_ristretto255` function defined in RFC 9380.
     */
    deriveToCurve(bytes) {
        // https://www.rfc-editor.org/rfc/rfc9496.html#name-element-derivation
        utils_abytes(bytes, 64);
        const r1 = bytes255ToNumberLE(bytes.subarray(0, 32));
        const R1 = calcElligatorRistrettoMap(r1);
        const r2 = bytes255ToNumberLE(bytes.subarray(32, 64));
        const R2 = calcElligatorRistrettoMap(r2);
        return new _RistrettoPoint(R1.add(R2));
    },
});
/**
 * ristretto255 OPRF/VOPRF/POPRF bundle, defined in RFC 9497.
 * @example
 * Run one blind/evaluate/finalize OPRF round over ristretto255.
 *
 * ```ts
 * const input = new TextEncoder().encode('hello noble');
 * const keys = ristretto255_oprf.oprf.generateKeyPair();
 * const blind = ristretto255_oprf.oprf.blind(input);
 * const evaluated = ristretto255_oprf.oprf.blindEvaluate(keys.secretKey, blind.blinded);
 * const output = ristretto255_oprf.oprf.finalize(input, blind.blind, evaluated);
 * ```
 */
const ristretto255_oprf = /* @__PURE__ */ (/* unused pure expression or super */ null && ((() => createOPRF({
    name: 'ristretto255-SHA512',
    Point: _RistrettoPoint,
    hash: sha512,
    hashToGroup: ristretto255_hasher.hashToCurve,
    hashToScalar: ristretto255_hasher.hashToScalar,
}))()));
/**
 * FROST threshold signatures over ristretto255. RFC 9591.
 * @example
 * Create one trusted-dealer package for 2-of-3 ristretto255 signing.
 *
 * ```ts
 * const alice = ristretto255_FROST.Identifier.derive('alice@example.com');
 * const bob = ristretto255_FROST.Identifier.derive('bob@example.com');
 * const carol = ristretto255_FROST.Identifier.derive('carol@example.com');
 * const deal = ristretto255_FROST.trustedDealer({ min: 2, max: 3 }, [alice, bob, carol]);
 * ```
 */
const ristretto255_FROST = /* @__PURE__ */ (/* unused pure expression or super */ null && ((() => createFROST({
    name: 'FROST-RISTRETTO255-SHA512-v1',
    Point: _RistrettoPoint,
    validatePoint: (p) => {
        // Prime-order wrappers are torsion-free at the abstract-group level.
        p.assertValidity();
    },
    hash: sha512,
}))()));
/**
 * Weird / bogus points, useful for debugging.
 * All 8 ed25519 points of 8-torsion subgroup can be generated from the point
 * T = `26e8958fc2b227b045c3f489f2ef98f0d5dfac05d3c63339b13802886d53fc05`.
 * The subgroup generated by `T` is `{ O, T, 2T, 3T, 4T, 5T, 6T, 7T }`; the
 * array below is that set, not the powers in that exact index order.
 * @example
 * Decode one known torsion point for debugging.
 *
 * ```ts
 * import { ED25519_TORSION_SUBGROUP, ed25519 } from '@noble/curves/ed25519.js';
 * const point = ed25519.Point.fromHex(ED25519_TORSION_SUBGROUP[1]);
 * ```
 */
const ED25519_TORSION_SUBGROUP = /* @__PURE__ */ (/* unused pure expression or super */ null && (Object.freeze([
    '0100000000000000000000000000000000000000000000000000000000000000',
    'c7176a703d4dd84fba3c0b760d10670f2a2053fa2c39ccc64ec7fd7792ac037a',
    '0000000000000000000000000000000000000000000000000000000000000080',
    '26e8958fc2b227b045c3f489f2ef98f0d5dfac05d3c63339b13802886d53fc05',
    'ecffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff7f',
    '26e8958fc2b227b045c3f489f2ef98f0d5dfac05d3c63339b13802886d53fc85',
    '0000000000000000000000000000000000000000000000000000000000000000',
    'c7176a703d4dd84fba3c0b760d10670f2a2053fa2c39ccc64ec7fd7792ac03fa',
])));

;// ./node_modules/@noble/hashes/sha3.js
/**
 * SHA3 (keccak) hash function, based on a new "Sponge function" design.
 * Different from older hashes, the internal state is bigger than output size.
 *
 * Check out
 * {@link https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.202.pdf | FIPS-202},
 * {@link https://keccak.team/keccak.html | Website}, and
 * {@link https://crypto.stackexchange.com/q/15727 | the differences between
 * SHA-3 and Keccak}.
 *
 * Check out `sha3-addons` module for cSHAKE, k12, and others.
 * @module
 */

// prettier-ignore

// No __PURE__ annotations in sha3 header:
// EVERYTHING is in fact used on every export.
// Various per round constants calculations
const sha3_0n = BigInt(0);
const sha3_1n = BigInt(1);
const sha3_2n = BigInt(2);
const sha3_7n = BigInt(7);
const _256n = BigInt(256);
// FIPS 202 Algorithm 5 rc(): when the outgoing bit is 1, the 8-bit LFSR xors
// taps 0, 4, 5, and 6, which compresses to the feedback mask `0x71`.
const _0x71n = BigInt(0x71);
const SHA3_PI = [];
const SHA3_ROTL = [];
const _SHA3_IOTA = []; // no pure annotation: var is always used
for (let round = 0, R = sha3_1n, x = 1, y = 0; round < 24; round++) {
    // Pi
    [x, y] = [y, (2 * x + 3 * y) % 5];
    SHA3_PI.push(2 * (5 * y + x));
    // Rotational
    SHA3_ROTL.push((((round + 1) * (round + 2)) / 2) % 64);
    // Iota
    let t = sha3_0n;
    for (let j = 0; j < 7; j++) {
        R = ((R << sha3_1n) ^ ((R >> sha3_7n) * _0x71n)) % _256n;
        if (R & sha3_2n)
            t ^= sha3_1n << ((sha3_1n << BigInt(j)) - sha3_1n);
    }
    _SHA3_IOTA.push(t);
}
const IOTAS = split(_SHA3_IOTA, true);
// `split(..., true)` keeps the local little-endian lane-word layout used by
// `state32`, so these `H` / `L` tables follow the file's first-word /
// second-word lane slots rather than `_u64.ts`'s usual high/low naming.
const SHA3_IOTA_H = IOTAS[0];
const SHA3_IOTA_L = IOTAS[1];
// 64-bit left rotates as u32 pairs. Inlined here (not imported from _u64) so V8 can
// inline them into keccakP — the import path costs ~24% on sha3_256. SHA3 is the only
// consumer of left-rotates; other hashes use right-rotates from _u64.
// Valid for s in 1..31 (SH/SL) and 33..63 (BH/BL); keccak never rotates by 0/32/64.
const rotlSH = (h, l, s) => (h << s) | (l >>> (32 - s));
const rotlSL = (h, l, s) => (l << s) | (h >>> (32 - s));
const rotlBH = (h, l, s) => (l << (s - 32)) | (h >>> (64 - s));
const rotlBL = (h, l, s) => (h << (s - 32)) | (l >>> (64 - s));
const rotlH = (h, l, s) => (s > 32 ? rotlBH(h, l, s) : rotlSH(h, l, s));
const rotlL = (h, l, s) => (s > 32 ? rotlBL(h, l, s) : rotlSL(h, l, s));
// Reused Theta scratch buffer (column parities), same pattern as SHA256_W in sha2.
// keccakP never calls user code, so the shared buffer cannot be observed mid-permutation.
const B = new Uint32Array(5 * 2);
/**
 * `keccakf1600` internal permutation, additionally allows adjusting the round count.
 * @param s - 5x5 Keccak state encoded as 25 lanes split into 50 uint32 words
 *   in this file's local little-endian lane-word order
 * @param rounds - number of rounds to execute
 * @throws On wrong argument types. {@link TypeError}
 * @throws On wrong argument ranges or values. {@link RangeError}
 * @throws If `rounds` is outside the supported `1..24` range. {@link Error}
 * @example
 * Permute a Keccak state with the default 24 rounds.
 * ```ts
 * keccakP(new Uint32Array(50));
 * ```
 */
function keccakP(s, rounds = 24) {
    if (!(s instanceof Uint32Array))
        throw new TypeError('"s" expected Uint32Array(50), got type=' + typeof s);
    if (s.length !== 50)
        throw new RangeError('"s" expected Uint32Array(50), got length=' + s.length);
    utils_anumber(rounds, 'rounds');
    // This implementation precomputes only the standard Keccak-f[1600] 24-round Iota table.
    if (rounds < 1 || rounds > 24)
        throw new Error('"rounds" expected integer 1..24');
    // NOTE: all indices are x2 since we store state as u32 instead of u64 (bigints to slow in js)
    for (let round = 24 - rounds; round < 24; round++) {
        // Theta θ
        for (let x = 0; x < 10; x++)
            B[x] = s[x] ^ s[x + 10] ^ s[x + 20] ^ s[x + 30] ^ s[x + 40];
        for (let x = 0; x < 10; x += 2) {
            const idx1 = (x + 8) % 10;
            const idx0 = (x + 2) % 10;
            const B0 = B[idx0];
            const B1 = B[idx0 + 1];
            const Th = rotlH(B0, B1, 1) ^ B[idx1];
            const Tl = rotlL(B0, B1, 1) ^ B[idx1 + 1];
            for (let y = 0; y < 50; y += 10) {
                s[x + y] ^= Th;
                s[x + y + 1] ^= Tl;
            }
        }
        // Rho (ρ) and Pi (π)
        let curH = s[2];
        let curL = s[3];
        for (let t = 0; t < 24; t++) {
            const shift = SHA3_ROTL[t];
            const Th = rotlH(curH, curL, shift);
            const Tl = rotlL(curH, curL, shift);
            const PI = SHA3_PI[t];
            curH = s[PI];
            curL = s[PI + 1];
            s[PI] = Th;
            s[PI + 1] = Tl;
        }
        // Chi (χ)
        // Same as:
        // for (let x = 0; x < 10; x++) B[x] = s[y + x];
        // for (let x = 0; x < 10; x++) s[y + x] ^= ~B[(x + 2) % 10] & B[(x + 4) % 10];
        for (let y = 0; y < 50; y += 10) {
            const b0 = s[y], b1 = s[y + 1], b2 = s[y + 2], b3 = s[y + 3];
            s[y] ^= ~s[y + 2] & s[y + 4];
            s[y + 1] ^= ~s[y + 3] & s[y + 5];
            s[y + 2] ^= ~s[y + 4] & s[y + 6];
            s[y + 3] ^= ~s[y + 5] & s[y + 7];
            s[y + 4] ^= ~s[y + 6] & s[y + 8];
            s[y + 5] ^= ~s[y + 7] & s[y + 9];
            s[y + 6] ^= ~s[y + 8] & b0;
            s[y + 7] ^= ~s[y + 9] & b1;
            s[y + 8] ^= ~b0 & b2;
            s[y + 9] ^= ~b1 & b3;
        }
        // Iota (ι)
        s[0] ^= SHA3_IOTA_H[round];
        s[1] ^= SHA3_IOTA_L[round];
    }
    utils_clean(B);
}
/**
 * Keccak sponge function.
 * @param blockLen - absorb/squeeze rate in bytes
 * @param suffix - domain separation suffix byte
 * @param outputLen - default digest length in bytes. This base sponge only
 *   requires a non-negative integer; wrappers that need positive output
 *   lengths must enforce that themselves.
 * @param enableXOF - whether XOF output is allowed
 * @param rounds - number of Keccak-f rounds
 * @example
 * Build a sponge state, absorb bytes, then finalize a digest.
 * ```ts
 * const hash = new Keccak(136, 0x06, 32);
 * hash.update(new Uint8Array([1, 2, 3]));
 * hash.digest();
 * ```
 */
class Keccak {
    state;
    pos = 0;
    posOut = 0;
    finished = false;
    state32;
    destroyed = false;
    blockLen;
    suffix;
    outputLen;
    canXOF;
    enableXOF = false;
    rounds;
    // NOTE: we accept arguments in bytes instead of bits here.
    constructor(blockLen, suffix, outputLen, enableXOF = false, rounds = 24) {
        utils_anumber(blockLen, 'blockLen');
        utils_anumber(suffix, 'suffix');
        utils_anumber(rounds, 'rounds');
        abool(enableXOF, 'enableXOF');
        this.blockLen = blockLen;
        this.suffix = suffix;
        this.outputLen = outputLen;
        this.enableXOF = enableXOF;
        this.canXOF = enableXOF;
        this.rounds = rounds;
        // Can be passed from user as dkLen
        utils_anumber(outputLen, 'outputLen');
        // Only keccak-f1600 is supported: 1600 bits (5x5 matrix of 64bit) === 200 bytes of state.
        if (!(0 < blockLen && blockLen < 200))
            throw new Error('"blockLen" must be 1..199');
        this.state = new Uint8Array(200);
        this.state32 = u32(this.state);
    }
    clone() {
        return this._cloneInto();
    }
    keccak() {
        swap32IfBE(this.state32);
        keccakP(this.state32, this.rounds);
        swap32IfBE(this.state32);
        this.posOut = 0;
        this.pos = 0;
    }
    update(data) {
        aexists(this);
        utils_abytes(data);
        const { blockLen, state, state32 } = this;
        const len = data.length;
        // Absorb full blocks with u32 XORs when both sides are 4-byte aligned.
        // XOR of same-position words equals XOR of same-position bytes, so this is endianness-safe.
        const canUseU32 = blockLen % 4 === 0 && data.byteOffset % 4 === 0;
        const blockLen32 = blockLen / 4;
        const data32 = canUseU32 && len >= blockLen ? u32(data) : undefined;
        for (let pos = 0; pos < len;) {
            if (data32 !== undefined && this.pos === 0 && pos % 4 === 0 && len - pos >= blockLen) {
                for (let i = 0, o = pos / 4; i < blockLen32; i++)
                    state32[i] ^= data32[o + i];
                pos += blockLen;
                // Subclasses (_KeccakPRG) read `this.pos` inside their `keccak()` override,
                // so it must reflect the fully-absorbed block before the permutation fires.
                this.pos = blockLen;
                this.keccak();
                continue;
            }
            const take = Math.min(blockLen - this.pos, len - pos);
            for (let i = 0; i < take; i++)
                state[this.pos++] ^= data[pos++];
            if (this.pos === blockLen)
                this.keccak();
        }
        return this;
    }
    finish() {
        if (this.finished)
            return;
        this.finished = true;
        const { state, suffix, pos, blockLen } = this;
        // FIPS 202 appends the SHA3/SHAKE domain-separation suffix before pad10*1.
        // These byte values already include the first padding bit, while the
        // final `0x80` below supplies the closing `1` bit in the last rate byte.
        state[pos] ^= suffix;
        // If that combined suffix lands in the last rate byte and already sets
        // bit 7, absorb it first so the final pad10*1 bit can be xored into a
        // fresh block.
        if ((suffix & 0x80) !== 0 && pos === blockLen - 1)
            this.keccak();
        state[blockLen - 1] ^= 0x80;
        this.keccak();
    }
    writeInto(out) {
        aexists(this, false);
        utils_abytes(out);
        this.finish();
        const bufferOut = this.state;
        const { blockLen } = this;
        for (let pos = 0, len = out.length; pos < len;) {
            if (this.posOut >= blockLen)
                this.keccak();
            const take = Math.min(blockLen - this.posOut, len - pos);
            out.set(bufferOut.subarray(this.posOut, this.posOut + take), pos);
            this.posOut += take;
            pos += take;
        }
        return out;
    }
    xofInto(out) {
        // Plain SHA3/Keccak usage with XOF is probably a mistake, but this base
        // class is also reused by SHAKE/cSHAKE/KMAC/TupleHash/ParallelHash/
        // TurboSHAKE/KangarooTwelve wrappers that intentionally enable XOF.
        if (!this.enableXOF)
            throw new Error('XOF is not enabled');
        return this.writeInto(out);
    }
    xof(bytes) {
        utils_anumber(bytes);
        return this.xofInto(new Uint8Array(bytes));
    }
    digestInto(out) {
        aoutput(out, this);
        if (this.finished)
            throw new Error('digest() was already called');
        // `aoutput(...)` allows oversized buffers; digestInto() must fill only the advertised digest.
        this.writeInto(out.length === this.outputLen ? out : out.subarray(0, this.outputLen));
        this.destroy();
    }
    digest() {
        const out = new Uint8Array(this.outputLen);
        this.digestInto(out);
        return out;
    }
    destroy() {
        this.destroyed = true;
        utils_clean(this.state);
    }
    _cloneInto(to) {
        const { blockLen, suffix, outputLen, rounds, enableXOF } = this;
        to ||= new Keccak(blockLen, suffix, outputLen, enableXOF, rounds);
        // Reused destinations can come from a different rate/capacity variant, so clone must rewrite
        // the sponge geometry as well as the state words.
        to.blockLen = blockLen;
        to.state32.set(this.state32);
        // Sponge padding and XOF output are positional, so both offsets are part of the clone state.
        to.pos = this.pos;
        to.posOut = this.posOut;
        to.finished = this.finished;
        to.rounds = rounds;
        // Suffix can change in cSHAKE
        to.suffix = suffix;
        to.outputLen = outputLen;
        to.enableXOF = enableXOF;
        // Clones must preserve the public capability bit too; `_KMAC` reuses this path and deep clone
        // tests compare instance fields directly, so leaving `canXOF` behind makes the clone lie.
        to.canXOF = this.canXOF;
        to.destroyed = this.destroyed;
        return to;
    }
}
const genKeccak = (suffix, blockLen, outputLen, info = {}) => utils_createHasher(() => new Keccak(blockLen, suffix, outputLen), info);
/**
 * SHA3-224 hash function.
 * @param msg - message bytes to hash
 * @param opts - Reserved hash options.
 * @returns Digest bytes.
 * @example
 * Hash a message with SHA3-224.
 * ```ts
 * sha3_224(new Uint8Array([97, 98, 99]));
 * ```
 */
const sha3_224 = /* @__PURE__ */ (/* unused pure expression or super */ null && (genKeccak(0x06, 144, 28, 
/* @__PURE__ */ oidNist(0x07))));
/**
 * SHA3-256 hash function. Different from keccak-256.
 * @param msg - message bytes to hash
 * @param opts - Reserved hash options.
 * @returns Digest bytes.
 * @example
 * Hash a message with SHA3-256.
 * ```ts
 * sha3_256(new Uint8Array([97, 98, 99]));
 * ```
 */
const sha3_256 = /* @__PURE__ */ (/* unused pure expression or super */ null && (genKeccak(0x06, 136, 32, 
/* @__PURE__ */ oidNist(0x08))));
/**
 * SHA3-384 hash function.
 * @param msg - message bytes to hash
 * @param opts - Reserved hash options.
 * @returns Digest bytes.
 * @example
 * Hash a message with SHA3-384.
 * ```ts
 * sha3_384(new Uint8Array([97, 98, 99]));
 * ```
 */
const sha3_384 = /* @__PURE__ */ (/* unused pure expression or super */ null && (genKeccak(0x06, 104, 48, 
/* @__PURE__ */ oidNist(0x09))));
/**
 * SHA3-512 hash function.
 * @param msg - message bytes to hash
 * @param opts - Reserved hash options.
 * @returns Digest bytes.
 * @example
 * Hash a message with SHA3-512.
 * ```ts
 * sha3_512(new Uint8Array([97, 98, 99]));
 * ```
 */
const sha3_512 = /* @__PURE__ */ (/* unused pure expression or super */ null && (genKeccak(0x06, 72, 64, 
/* @__PURE__ */ oidNist(0x0a))));
/**
 * Keccak-224 hash function.
 * @param msg - message bytes to hash
 * @param opts - Reserved hash options.
 * @returns Digest bytes.
 * @example
 * Hash a message with Keccak-224.
 * ```ts
 * keccak_224(new Uint8Array([97, 98, 99]));
 * ```
 */
const keccak_224 = /* @__PURE__ */ (/* unused pure expression or super */ null && (genKeccak(0x01, 144, 28)));
/**
 * Keccak-256 hash function. Different from SHA3-256.
 * @param msg - message bytes to hash
 * @param opts - Reserved hash options.
 * @returns Digest bytes.
 * @example
 * Hash a message with Keccak-256.
 * ```ts
 * keccak_256(new Uint8Array([97, 98, 99]));
 * ```
 */
const keccak_256 = /* @__PURE__ */ genKeccak(0x01, 136, 32);
/**
 * Keccak-384 hash function.
 * @param msg - message bytes to hash
 * @param opts - Reserved hash options.
 * @returns Digest bytes.
 * @example
 * Hash a message with Keccak-384.
 * ```ts
 * keccak_384(new Uint8Array([97, 98, 99]));
 * ```
 */
const keccak_384 = /* @__PURE__ */ (/* unused pure expression or super */ null && (genKeccak(0x01, 104, 48)));
/**
 * Keccak-512 hash function.
 * @param msg - message bytes to hash
 * @param opts - Reserved hash options.
 * @returns Digest bytes.
 * @example
 * Hash a message with Keccak-512.
 * ```ts
 * keccak_512(new Uint8Array([97, 98, 99]));
 * ```
 */
const keccak_512 = /* @__PURE__ */ (/* unused pure expression or super */ null && (genKeccak(0x01, 72, 64)));
const genShake = (suffix, blockLen, outputLen, info = {}) => createHasher((opts = {}) => {
    opts = checkOpts({}, opts);
    return new Keccak(blockLen, suffix, opts.dkLen === undefined ? outputLen : opts.dkLen, true);
}, info);
/**
 * SHAKE128 XOF with 128-bit security and a 16-byte default output.
 * @param msg - message bytes to hash
 * @param opts - Optional output-length override. See {@link ShakeOpts}.
 * @returns Digest bytes.
 * @example
 * Hash a message with SHAKE128.
 * ```ts
 * shake128(new Uint8Array([97, 98, 99]), { dkLen: 32 });
 * ```
 */
const shake128 = 
/* @__PURE__ */
(/* unused pure expression or super */ null && (genShake(0x1f, 168, 16, /* @__PURE__ */ oidNist(0x0b))));
/**
 * SHAKE256 XOF with 256-bit security and a 32-byte default output.
 * @param msg - message bytes to hash
 * @param opts - Optional output-length override. See {@link ShakeOpts}.
 * @returns Digest bytes.
 * @example
 * Hash a message with SHAKE256.
 * ```ts
 * shake256(new Uint8Array([97, 98, 99]), { dkLen: 64 });
 * ```
 */
const shake256 = 
/* @__PURE__ */
(/* unused pure expression or super */ null && (genShake(0x1f, 136, 32, /* @__PURE__ */ oidNist(0x0c))));
/**
 * SHAKE128 XOF with 256-bit output (NIST version).
 * @param msg - message bytes to hash
 * @param opts - Optional output-length override. See {@link ShakeOpts}.
 * @returns Digest bytes.
 * @example
 * Hash a message with SHAKE128 using a 32-byte default output.
 * ```ts
 * shake128_32(new Uint8Array([97, 98, 99]), { dkLen: 32 });
 * ```
 */
const shake128_32 = 
/* @__PURE__ */
(/* unused pure expression or super */ null && (genShake(0x1f, 168, 32, /* @__PURE__ */ oidNist(0x0b))));
/**
 * SHAKE256 XOF with 512-bit output (NIST version).
 * @param msg - message bytes to hash
 * @param opts - Optional output-length override. See {@link ShakeOpts}.
 * @returns Digest bytes.
 * @example
 * Hash a message with SHAKE256 using a 64-byte default output.
 * ```ts
 * shake256_64(new Uint8Array([97, 98, 99]), { dkLen: 64 });
 * ```
 */
const shake256_64 = 
/* @__PURE__ */
(/* unused pure expression or super */ null && (genShake(0x1f, 136, 64, /* @__PURE__ */ oidNist(0x0c))));

;// ./src/lib/offline/recovery-bundle-entry.js











const globalTarget = typeof window !== 'undefined' ? window : globalThis;

globalTarget.DOT_CRYPTO = {
  bip39: bip39_namespaceObject,
  englishWordlist: wordlist,
  HDKey: HDKey,
  secp256k1: secp256k1,
  ed25519: ed25519,
  keccak_256: keccak_256,
  sha256: sha2_sha256,
  ripemd160: ripemd160,
  pbkdf2: pbkdf2,
  base58: base58,
  base58check: base58check,
  hex: hex,
  base64: base64,
  bech32: bech32,
  bech32m: bech32m,
  utf8: utf8,
};

/* harmony default export */ const recovery_bundle_entry = (globalTarget.DOT_CRYPTO);

window.DOT_CRYPTO_STANDALONE = __webpack_exports__;
/******/ })()
;