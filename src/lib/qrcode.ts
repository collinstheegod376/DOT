/**
 * Pure TypeScript Standalone QR Code Generator
 * Generates ISO/IEC 18004 compliant QR Code SVG without external dependencies.
 */

// Error correction levels
export type QrEcc = 'L' | 'M' | 'Q' | 'H';

// Galois field tables for GF(256)
const EXP: number[] = new Array(512);
const LOG: number[] = new Array(256);

(function initGaloisField() {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP[i] = x;
    LOG[x] = i;
    x <<= 1;
    if (x & 256) {
      x ^= 0x11d;
    }
  }
  for (let i = 255; i < 512; i++) {
    EXP[i] = EXP[i - 255];
  }
})();

function gfMultiply(x: number, y: number): number {
  if (x === 0 || y === 0) return 0;
  return EXP[LOG[x] + LOG[y]];
}

function polyMultiply(p1: number[], p2: number[]): number[] {
  const result = new Array(p1.length + p2.length - 1).fill(0);
  for (let i = 0; i < p1.length; i++) {
    for (let j = 0; j < p2.length; j++) {
      result[i + j] ^= gfMultiply(p1[i], p2[j]);
    }
  }
  return result;
}

function getGeneratorPoly(degree: number): number[] {
  let g = [1];
  for (let i = 0; i < degree; i++) {
    g = polyMultiply(g, [1, EXP[i]]);
  }
  return g;
}

function calculateEcc(data: number[], eccCount: number): number[] {
  const gen = getGeneratorPoly(eccCount);
  const extended = [...data, ...new Array(eccCount).fill(0)];
  for (let i = 0; i < data.length; i++) {
    const factor = extended[i];
    if (factor !== 0) {
      for (let j = 0; j < gen.length; j++) {
        extended[i + j] ^= gfMultiply(gen[j], factor);
      }
    }
  }
  return extended.slice(data.length);
}

// Version configs for byte mode QR (Capacity, EC codewords per block, blocks)
interface VersionConfig {
  version: number;
  totalCodewords: number;
  ecCodewordsPerBlock: number;
  blocks: number;
  alignmentPatterns: number[];
}

const VERSION_CONFIGS: VersionConfig[] = [
  { version: 1, totalCodewords: 26, ecCodewordsPerBlock: 7, blocks: 1, alignmentPatterns: [] },
  { version: 2, totalCodewords: 44, ecCodewordsPerBlock: 10, blocks: 1, alignmentPatterns: [6, 18] },
  { version: 3, totalCodewords: 70, ecCodewordsPerBlock: 15, blocks: 1, alignmentPatterns: [6, 22] },
  { version: 4, totalCodewords: 100, ecCodewordsPerBlock: 20, blocks: 1, alignmentPatterns: [6, 26] },
  { version: 5, totalCodewords: 134, ecCodewordsPerBlock: 26, blocks: 1, alignmentPatterns: [6, 30] },
  { version: 6, totalCodewords: 172, ecCodewordsPerBlock: 18, blocks: 2, alignmentPatterns: [6, 34] },
  { version: 7, totalCodewords: 196, ecCodewordsPerBlock: 20, blocks: 2, alignmentPatterns: [6, 22, 38] },
  { version: 8, totalCodewords: 242, ecCodewordsPerBlock: 24, blocks: 2, alignmentPatterns: [6, 24, 42] },
];

export function generateQrMatrix(text: string): boolean[][] {
  const encoder = new TextEncoder();
  const utf8 = encoder.encode(text);
  const dataLen = utf8.length;

  // Find minimum version that fits data
  let config: VersionConfig = VERSION_CONFIGS[VERSION_CONFIGS.length - 1];
  for (const cfg of VERSION_CONFIGS) {
    const maxDataBytes = cfg.totalCodewords - cfg.ecCodewordsPerBlock * cfg.blocks - 2; // header overhead
    if (dataLen <= maxDataBytes) {
      config = cfg;
      break;
    }
  }

  const { version, totalCodewords, ecCodewordsPerBlock, blocks, alignmentPatterns } = config;
  const dataCapacity = totalCodewords - ecCodewordsPerBlock * blocks;

  // Bit buffer creation
  const bitArray: number[] = [];
  function pushBits(val: number, length: number) {
    for (let i = length - 1; i >= 0; i--) {
      bitArray.push((val >>> i) & 1);
    }
  }

  // 1. Mode indicator (0100 for Byte mode)
  pushBits(0b0100, 4);

  // 2. Character count indicator (8 bits for versions 1-9 in byte mode)
  pushBits(dataLen, 8);

  // 3. Data bytes
  for (const b of utf8) {
    pushBits(b, 8);
  }

  // 4. Terminator (up to 4 zeros)
  const maxBits = dataCapacity * 8;
  const termLen = Math.min(4, maxBits - bitArray.length);
  for (let i = 0; i < termLen; i++) bitArray.push(0);

  // 5. Pad to byte boundary
  while (bitArray.length % 8 !== 0) bitArray.push(0);

  // Convert bits to bytes
  const dataBytes: number[] = [];
  for (let i = 0; i < bitArray.length; i += 8) {
    let byteVal = 0;
    for (let j = 0; j < 8; j++) {
      byteVal = (byteVal << 1) | bitArray[i + j];
    }
    dataBytes.push(byteVal);
  }

  // 6. Pad codewords (0xEC, 0x11 alternate)
  const padBytes = [0xec, 0x11];
  let padIdx = 0;
  while (dataBytes.length < dataCapacity) {
    dataBytes.push(padBytes[padIdx % 2]);
    padIdx++;
  }

  // Error Correction calculation
  const dataPerBlock = Math.floor(dataCapacity / blocks);
  const dataBlockList: number[][] = [];
  const eccBlockList: number[][] = [];

  for (let b = 0; b < blocks; b++) {
    const blockData = dataBytes.slice(b * dataPerBlock, (b + 1) * dataPerBlock);
    dataBlockList.push(blockData);
    eccBlockList.push(calculateEcc(blockData, ecCodewordsPerBlock));
  }

  // Interleave data and ECC
  const finalCodewords: number[] = [];
  for (let i = 0; i < dataPerBlock; i++) {
    for (let b = 0; b < blocks; b++) {
      finalCodewords.push(dataBlockList[b][i]);
    }
  }
  for (let i = 0; i < ecCodewordsPerBlock; i++) {
    for (let b = 0; b < blocks; b++) {
      finalCodewords.push(eccBlockList[b][i]);
    }
  }

  // Matrix construction
  const size = 17 + 4 * version;
  const matrix: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));
  const isFunction: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  function setFunctionModule(r: number, c: number, val: boolean) {
    if (r >= 0 && r < size && c >= 0 && c < size) {
      matrix[r][c] = val;
      isFunction[r][c] = true;
    }
  }

  // Draw 7x7 Finder pattern
  function drawFinder(row: number, col: number) {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const mr = row + r;
        const mc = col + c;
        if (mr >= 0 && mr < size && mc >= 0 && mc < size) {
          const isCore = r >= 1 && r <= 5 && c >= 1 && c <= 5;
          const isCenter = r >= 2 && r <= 4 && c >= 2 && c <= 4;
          const isOuter = r === 0 || r === 6 || c === 0 || c === 6;
          const val = (isOuter || isCenter) && !(!isCenter && isCore);
          setFunctionModule(mr, mc, val);
        }
      }
    }
  }

  drawFinder(0, 0);
  drawFinder(0, size - 7);
  drawFinder(size - 7, 0);

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    setFunctionModule(6, i, i % 2 === 0);
    setFunctionModule(i, 6, i % 2 === 0);
  }

  // Alignment patterns for version >= 2
  if (alignmentPatterns.length > 0) {
    for (const r of alignmentPatterns) {
      for (const c of alignmentPatterns) {
        // Skip finders
        if ((r <= 8 && c <= 8) || (r <= 8 && c >= size - 8) || (r >= size - 8 && c <= 8)) {
          continue;
        }
        for (let dr = -2; dr <= 2; dr++) {
          for (let dc = -2; dc <= 2; dc++) {
            const isBorder = Math.abs(dr) === 2 || Math.abs(dc) === 2;
            const isCenter = dr === 0 && dc === 0;
            setFunctionModule(r + dr, c + dc, isBorder || isCenter);
          }
        }
      }
    }
  }

  // Reserve format information areas
  for (let i = 0; i < 9; i++) {
    if (i !== 6) setFunctionModule(8, i, false);
    if (i !== 6) setFunctionModule(i, 8, false);
  }
  for (let i = 0; i < 8; i++) {
    setFunctionModule(8, size - 1 - i, false);
    setFunctionModule(size - 1 - i, 8, false);
  }
  setFunctionModule(size - 8, 8, true); // Dark module

  // Place codewords in zigzag
  let bitIdx = 0;
  const totalBits = finalCodewords.length * 8;
  let right = size - 1;
  let upward = true;

  while (right > 0) {
    if (right === 6) right--; // Skip vertical timing column
    const rows = upward ? Array.from({ length: size }, (_, i) => size - 1 - i) : Array.from({ length: size }, (_, i) => i);

    for (const row of rows) {
      for (let colOffset = 0; colOffset < 2; colOffset++) {
        const col = right - colOffset;
        if (!isFunction[row][col]) {
          let bit = false;
          if (bitIdx < totalBits) {
            const byte = finalCodewords[Math.floor(bitIdx / 8)];
            const bitOffset = 7 - (bitIdx % 8);
            bit = ((byte >>> bitOffset) & 1) === 1;
            bitIdx++;
          }
          // Apply standard mask pattern 0: (row + col) % 2 === 0
          if ((row + col) % 2 === 0) {
            bit = !bit;
          }
          matrix[row][col] = bit;
        }
      }
    }
    right -= 2;
    upward = !upward;
  }

  // Format info: Mask 0, ECC Level L -> standard format bits (0x77c4 with mask 0x5412 = 0x23d6)
  const formatBits = [1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 0, 0, 1, 0, 0];
  for (let i = 0; i < 15; i++) {
    const bit = formatBits[i] === 1;
    // Top-left
    if (i < 6) matrix[8][i] = bit;
    else if (i === 6) matrix[8][7] = bit;
    else if (i === 7) matrix[8][8] = bit;
    else if (i === 8) matrix[7][8] = bit;
    else matrix[14 - i][8] = bit;

    // Split around other edges
    if (i < 8) {
      matrix[size - 1 - i][8] = bit;
    } else {
      matrix[8][size - 15 + i] = bit;
    }
  }

  return matrix;
}

export function generateQrSvgPath(matrix: boolean[][], cellSize = 8): { path: string; size: number } {
  const count = matrix.length;
  const padding = 2; // modules
  const totalCells = count + padding * 2;
  const totalPx = totalCells * cellSize;

  let path = '';
  for (let r = 0; r < count; r++) {
    for (let c = 0; c < count; c++) {
      if (matrix[r][c]) {
        const x = (c + padding) * cellSize;
        const y = (r + padding) * cellSize;
        path += `M${x},${y}h${cellSize}v${cellSize}h-${cellSize}z `;
      }
    }
  }

  return { path, size: totalPx };
}
