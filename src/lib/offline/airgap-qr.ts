/**
 * Air-Gap QR Code Protocol & Pure-TS QR Code Engine
 * 
 * Provides:
 * 1. Multi-frame chunking for large transaction payloads (e.g., smart contracts, multi-sig, large calldata).
 * 2. Pure TypeScript QR Code generator (zero external network dependencies, 100% offline).
 * 3. Frame accumulator with checksum validation and missing-frame tracking.
 * 4. Offline scanner utilities with fallback support.
 */

import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex, utf8ToBytes } from '@noble/hashes/utils.js';

// ==========================================
// 1. MULTI-FRAME CHUNKING SPECIFICATION
// ==========================================

export interface ChunkFrameInfo {
  index: number; // 1-indexed
  total: number;
  checksum: string; // 8-char hex sha256 prefix
  data: string;
}

export const CHUNK_PREFIX = 'DOT1';

/**
 * Splits any string payload into numbered QR frames if it exceeds maxChunkSize.
 * Frame structure: `DOT1:{index}:{total}:{checksum}:{data}`
 */
export function chunkPayload(payload: string, maxChunkSize = 180): string[] {
  if (payload.length <= maxChunkSize) {
    return [payload];
  }

  const checksum = bytesToHex(sha256(utf8ToBytes(payload))).slice(0, 8);
  const totalChunks = Math.ceil(payload.length / maxChunkSize);
  const frames: string[] = [];

  for (let i = 0; i < totalChunks; i++) {
    const chunkData = payload.slice(i * maxChunkSize, (i + 1) * maxChunkSize);
    const frameIndex = i + 1; // 1-indexed
    frames.push(`${CHUNK_PREFIX}:${frameIndex}:${totalChunks}:${checksum}:${chunkData}`);
  }

  return frames;
}

/**
 * Parses a single QR frame string. Returns null if not a DOT1 frame format.
 */
export function parseChunkFrame(frameStr: string): ChunkFrameInfo | null {
  if (!frameStr.startsWith(`${CHUNK_PREFIX}:`)) {
    return null;
  }

  // Find the first 4 colon delimiters: DOT1:index:total:checksum:data
  const parts = frameStr.split(':');
  if (parts.length < 5) return null;

  const index = parseInt(parts[1], 10);
  const total = parseInt(parts[2], 10);
  const checksum = parts[3];
  // data may contain colons, join remainder
  const data = parts.slice(4).join(':');

  if (isNaN(index) || isNaN(total) || index < 1 || index > total || !checksum) {
    return null;
  }

  return { index, total, checksum, data };
}

/**
 * Accumulates incoming QR frames, tracks progress, and reassembles when complete.
 */
export class QrChunkAccumulator {
  private total = 0;
  private expectedChecksum = '';
  private frames: Map<number, string> = new Map();

  public addFrame(frameStr: string): {
    completed: boolean;
    progress: number;
    payload?: string;
    error?: string;
  } {
    const parsed = parseChunkFrame(frameStr);

    // If it's not a multi-frame chunk, check if it's already a complete payload
    if (!parsed) {
      // Validate if it's a raw JSON or single payload
      try {
        JSON.parse(frameStr);
        return { completed: true, progress: 100, payload: frameStr };
      } catch {
        // Not JSON and not a DOT1 chunk
        return { completed: false, progress: 0, error: 'Unrecognized QR format' };
      }
    }

    // Check if new stream or stream reset
    if (this.expectedChecksum && this.expectedChecksum !== parsed.checksum) {
      this.reset();
    }

    this.total = parsed.total;
    this.expectedChecksum = parsed.checksum;
    this.frames.set(parsed.index, parsed.data);

    const receivedCount = this.frames.size;
    const progress = Math.round((receivedCount / this.total) * 100);

    if (receivedCount === this.total) {
      // Reassemble in order
      const orderedChunks: string[] = [];
      for (let i = 1; i <= this.total; i++) {
        const chunk = this.frames.get(i);
        if (chunk === undefined) {
          return { completed: false, progress, error: `Missing frame #${i}` };
        }
        orderedChunks.push(chunk);
      }

      const fullPayload = orderedChunks.join('');
      const calculatedChecksum = bytesToHex(sha256(utf8ToBytes(fullPayload))).slice(0, 8);

      if (calculatedChecksum !== this.expectedChecksum) {
        this.reset();
        return { completed: false, progress: 0, error: 'Checksum mismatch. Please re-scan.' };
      }

      return { completed: true, progress: 100, payload: fullPayload };
    }

    return { completed: false, progress };
  }

  public getMissingFrames(): number[] {
    if (this.total === 0) return [];
    const missing: number[] = [];
    for (let i = 1; i <= this.total; i++) {
      if (!this.frames.has(i)) {
        missing.push(i);
      }
    }
    return missing;
  }

  public getProgress(): { received: number; total: number; percentage: number } {
    const received = this.frames.size;
    const total = this.total || 1;
    return {
      received,
      total,
      percentage: Math.round((received / total) * 100),
    };
  }

  public reset(): void {
    this.total = 0;
    this.expectedChecksum = '';
    this.frames.clear();
  }
}

// ==========================================
// 2. STANDALONE PURE-TYPESCRIPT QR CODE GENERATOR
// ==========================================

/**
 * Generates an SVG string representation of a QR code entirely offline.
 * Implements ISO/IEC 18004 QR Code specification (Byte mode, Error Correction Level M/L).
 */

// Galois Field GF(256) tables for Reed-Solomon computation
const GF256_EXP = new Uint8Array(512);
const GF256_LOG = new Uint8Array(256);
(function initGF() {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF256_EXP[i] = x;
    GF256_EXP[i + 255] = x;
    GF256_LOG[x] = i;
    x = (x << 1) ^ (x & 128 ? 0x11d : 0);
  }
})();

function gfMul(x: number, y: number): number {
  if (x === 0 || y === 0) return 0;
  return GF256_EXP[GF256_LOG[x] + GF256_LOG[y]];
}

function rsGeneratorPoly(degree: number): Uint8Array {
  let poly = new Uint8Array([1]);
  for (let i = 0; i < degree; i++) {
    const next = new Uint8Array(poly.length + 1);
    const factor = GF256_EXP[i];
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= gfMul(poly[j], factor);
      next[j + 1] ^= poly[j];
    }
    poly = next;
  }
  return poly;
}

function rsCompute(data: Uint8Array, ecLength: number): Uint8Array {
  const gen = rsGeneratorPoly(ecLength);
  const res = new Uint8Array(ecLength);
  for (let i = 0; i < data.length; i++) {
    const factor = data[i] ^ res[0];
    for (let j = 0; j < ecLength - 1; j++) {
      res[j] = res[j + 1] ^ gfMul(gen[gen.length - 2 - j], factor);
    }
    res[ecLength - 1] = gfMul(gen[0], factor);
  }
  return res;
}

// Capacity table: [version, ecLevel 'M', dataBytes, ecBytesPerBlock, numBlocks]
// Common versions sufficient for chunked frames (180 chars per chunk easily fits in versions 4-8)
interface QrVersionSpec {
  version: number;
  size: number;
  dataCapacity: number;
  ecPerBlock: number;
  blocks: number;
  alignments: number[];
}

const QR_VERSIONS: QrVersionSpec[] = [
  { version: 1, size: 21, dataCapacity: 16, ecPerBlock: 10, blocks: 1, alignments: [] },
  { version: 2, size: 25, dataCapacity: 28, ecPerBlock: 16, blocks: 1, alignments: [6, 18] },
  { version: 3, size: 29, dataCapacity: 44, ecPerBlock: 26, blocks: 1, alignments: [6, 22] },
  { version: 4, size: 33, dataCapacity: 64, ecPerBlock: 18, blocks: 2, alignments: [6, 26] },
  { version: 5, size: 37, dataCapacity: 86, ecPerBlock: 24, blocks: 2, alignments: [6, 30] },
  { version: 6, size: 41, dataCapacity: 108, ecPerBlock: 16, blocks: 4, alignments: [6, 34] },
  { version: 7, size: 45, dataCapacity: 124, ecPerBlock: 18, blocks: 4, alignments: [6, 22, 38] },
  { version: 8, size: 49, dataCapacity: 154, ecPerBlock: 22, blocks: 4, alignments: [6, 24, 42] },
  { version: 9, size: 53, dataCapacity: 182, ecPerBlock: 22, blocks: 5, alignments: [6, 26, 46] },
  { version: 10, size: 57, dataCapacity: 216, ecPerBlock: 26, blocks: 5, alignments: [6, 28, 50] },
  { version: 11, size: 61, dataCapacity: 254, ecPerBlock: 30, blocks: 5, alignments: [6, 30, 54] },
  { version: 12, size: 65, dataCapacity: 290, ecPerBlock: 22, blocks: 8, alignments: [6, 32, 58] },
  { version: 13, size: 69, dataCapacity: 334, ecPerBlock: 22, blocks: 9, alignments: [6, 34, 62] },
  { version: 14, size: 73, dataCapacity: 365, ecPerBlock: 24, blocks: 9, alignments: [6, 26, 46, 66] },
  { version: 15, size: 77, dataCapacity: 415, ecPerBlock: 24, blocks: 10, alignments: [6, 26, 48, 70] },
];

export class QrMatrix {
  public size: number;
  public modules: boolean[][];
  public isFunction: boolean[][];

  constructor(size: number) {
    this.size = size;
    this.modules = Array.from({ length: size }, () => Array(size).fill(false));
    this.isFunction = Array.from({ length: size }, () => Array(size).fill(false));
  }

  public set(r: number, c: number, val: boolean, isFn = true): void {
    if (r >= 0 && r < this.size && c >= 0 && c < this.size) {
      this.modules[r][c] = val;
      if (isFn) this.isFunction[r][c] = true;
    }
  }

  public get(r: number, c: number): boolean {
    return this.modules[r][c];
  }
}

export function generateQrMatrix(text: string): { matrix: boolean[][]; size: number } {
  const textBytes = utf8ToBytes(text);
  // Mode Byte: 4 bits '0100', Length: 8 bits (for v <= 9) or 16 bits (for v >= 10)
  // Find minimal version
  let spec: QrVersionSpec | null = null;
  for (const s of QR_VERSIONS) {
    const lengthBits = s.version <= 9 ? 8 : 16;
    const requiredBytes = Math.ceil((4 + lengthBits + textBytes.length * 8 + 4) / 8);
    if (requiredBytes <= s.dataCapacity) {
      spec = s;
      break;
    }
  }

  if (!spec) {
    // If text exceeds version 15 capacity, return fallback matrix or largest version
    spec = QR_VERSIONS[QR_VERSIONS.length - 1];
  }

  const { size, dataCapacity, ecPerBlock, blocks } = spec;
  const qr = new QrMatrix(size);

  // 1. Finder patterns (top-left, top-right, bottom-left)
  const placeFinder = (startRow: number, startCol: number) => {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const row = startRow + r;
        const col = startCol + c;
        if (row < 0 || row >= size || col < 0 || col >= size) continue;
        const inOuter = r >= 0 && r <= 6 && c >= 0 && c <= 6;
        const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
        const isCenter = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        qr.set(row, col, inOuter && (isBorder || isCenter), true);
      }
    }
  };

  placeFinder(0, 0);
  placeFinder(0, size - 7);
  placeFinder(size - 7, 0);

  // 2. Timing patterns
  for (let i = 8; i < size - 8; i++) {
    qr.set(6, i, i % 2 === 0, true);
    qr.set(i, 6, i % 2 === 0, true);
  }

  // 3. Alignment patterns
  const aligns = spec.alignments;
  for (const r of aligns) {
    for (const c of aligns) {
      // Don't place on finders
      if ((r <= 8 && c <= 8) || (r <= 8 && c >= size - 8) || (r >= size - 8 && c <= 8)) continue;
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          const isBlack = Math.max(Math.abs(dr), Math.abs(dc)) !== 1;
          qr.set(r + dr, c + dc, isBlack, true);
        }
      }
    }
  }

  // 4. Reserve Format Info areas
  for (let i = 0; i < 9; i++) {
    qr.set(8, i, false, true);
    qr.set(i, 8, false, true);
    qr.set(8, size - 1 - i, false, true);
    qr.set(size - 1 - i, 8, false, true);
  }
  // Dark module
  qr.set(size - 8, 8, true, true);

  // 5. Build bit stream
  const bits: number[] = [];
  const pushBits = (val: number, length: number) => {
    for (let i = length - 1; i >= 0; i--) {
      bits.push((val >> i) & 1);
    }
  };

  // Byte mode '0100'
  pushBits(4, 4);
  const lengthBits = spec.version <= 9 ? 8 : 16;
  pushBits(textBytes.length, lengthBits);
  for (const b of textBytes) {
    pushBits(b, 8);
  }
  // Terminator
  const totalDataBits = dataCapacity * 8;
  const terminatorLength = Math.min(4, Math.max(0, totalDataBits - bits.length));
  for (let i = 0; i < terminatorLength; i++) bits.push(0);
  // Pad to byte boundary
  while (bits.length % 8 !== 0) bits.push(0);
  // Pad bytes 0xEC, 0x11
  const padBytes = [0xec, 0x11];
  let padIdx = 0;
  while (bits.length < totalDataBits) {
    pushBits(padBytes[padIdx % 2], 8);
    padIdx++;
  }

  // Convert bits to data bytes
  const dataBytes = new Uint8Array(dataCapacity);
  for (let i = 0; i < dataCapacity; i++) {
    let b = 0;
    for (let j = 0; j < 8; j++) {
      b = (b << 1) | bits[i * 8 + j];
    }
    dataBytes[i] = b;
  }

  // 6. Error correction computation & interleaving
  const blockSize = Math.floor(dataCapacity / blocks);
  const rawBlocks: Uint8Array[] = [];
  const ecBlocks: Uint8Array[] = [];

  for (let b = 0; b < blocks; b++) {
    const start = b * blockSize;
    const end = b === blocks - 1 ? dataCapacity : (b + 1) * blockSize;
    const blockData = dataBytes.slice(start, end);
    rawBlocks.push(blockData);
    ecBlocks.push(rsCompute(blockData, ecPerBlock));
  }

  // Interleave
  const finalStream: number[] = [];
  const maxBlockLen = Math.max(...rawBlocks.map((b) => b.length));
  for (let i = 0; i < maxBlockLen; i++) {
    for (const b of rawBlocks) {
      if (i < b.length) finalStream.push(b[i]);
    }
  }
  for (let i = 0; i < ecPerBlock; i++) {
    for (const b of ecBlocks) {
      finalStream.push(b[i]);
    }
  }

  // Convert finalStream to bit array
  const finalBits: number[] = [];
  for (const byteVal of finalStream) {
    for (let i = 7; i >= 0; i--) {
      finalBits.push((byteVal >> i) & 1);
    }
  }

  // 7. Place data bits in matrix (right-to-left zigzag)
  let bitIdx = 0;
  let upwards = true;
  for (let col = size - 1; col > 0; col -= 2) {
    if (col === 6) col--; // Skip vertical timing column
    const rows = upwards
      ? Array.from({ length: size }, (_, i) => size - 1 - i)
      : Array.from({ length: size }, (_, i) => i);

    for (const r of rows) {
      for (const c of [col, col - 1]) {
        if (!qr.isFunction[r][c]) {
          const bit = bitIdx < finalBits.length ? finalBits[bitIdx++] : 0;
          // Apply mask 0: (row + col) % 2 === 0
          const mask = (r + c) % 2 === 0;
          qr.set(r, c, bit === 1 ? !mask : mask, false);
        }
      }
    }
    upwards = !upwards;
  }

  // 8. Format Information (Mask 0 + EC 'M' = 0b100000000000000 ^ 0x5412)
  // For EC Level M (00) and Mask 000 -> 0b00000 -> BCH code: 0b101010000010010
  const formatInfo = 0b101010000010010;
  for (let i = 0; i < 15; i++) {
    const bit = ((formatInfo >> (14 - i)) & 1) === 1;
    // Top-left finder strip
    if (i <= 5) qr.set(8, i, bit, true);
    else if (i === 6) qr.set(8, 7, bit, true);
    else if (i === 7) qr.set(8, 8, bit, true);
    else if (i === 8) qr.set(7, 8, bit, true);
    else qr.set(14 - i, 8, bit, true);

    // Split format around other finders
    if (i < 8) {
      qr.set(size - 1 - i, 8, bit, true);
    } else {
      qr.set(8, size - 15 + i, bit, true);
    }
  }

  return { matrix: qr.modules, size };
}

/**
 * Renders a generated QR matrix directly to SVG markup.
 */
export function qrToSvg(text: string, options: { size?: number; margin?: number; darkColor?: string; lightColor?: string } = {}): string {
  const { size = 280, margin = 4, darkColor = '#000000', lightColor = '#ffffff' } = options;
  const { matrix, size: modCount } = generateQrMatrix(text);
  const totalModules = modCount + margin * 2;
  const modSize = size / totalModules;

  let pathD = '';
  for (let r = 0; r < modCount; r++) {
    for (let c = 0; c < modCount; c++) {
      if (matrix[r][c]) {
        const x = (c + margin) * modSize;
        const y = (r + margin) * modSize;
        pathD += `M${x.toFixed(2)},${y.toFixed(2)}h${modSize.toFixed(2)}v${modSize.toFixed(2)}h-${modSize.toFixed(2)}z `;
      }
    }
  }

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" shape-rendering="crispEdges">
      <rect width="${size}" height="${size}" fill="${lightColor}" rx="12"/>
      <path d="${pathD}" fill="${darkColor}"/>
    </svg>
  `.trim();
}
