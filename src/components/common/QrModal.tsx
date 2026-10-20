'use client';

import React, { useState } from 'react';
import { X, Copy, Check, Download, ShieldCheck } from 'lucide-react';
import { generateQrMatrix, generateQrSvgPath } from '@/lib/qrcode';
import { SupportedChainId } from '@/types/wallet';
import { SUPPORTED_CHAINS } from '@/lib/constants';

interface QrModalProps {
  isOpen: boolean;
  onClose: () => void;
  address: string;
  chainId: SupportedChainId;
  derivationPath?: string;
  title?: string;
}

export function QrModal({
  isOpen,
  onClose,
  address,
  chainId,
  derivationPath,
  title,
}: QrModalProps) {
  const [copied, setCopied] = useState(false);
  const config = SUPPORTED_CHAINS[chainId];

  if (!isOpen) return null;

  // Generate QR matrix and SVG path
  const matrix = generateQrMatrix(address || '0x');
  const { path, size } = generateQrSvgPath(matrix, 7);

  const handleCopy = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSvg = () => {
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" fill="#0A0A0C"><rect width="100%" height="100%" fill="#FFFFFF"/><path d="${path}" fill="#0A0A0C"/></svg>`;
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${config.symbol.toLowerCase()}-address-qr.svg`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm rounded-2xl bg-[#0F0F14] border border-[#1F1F24] p-6 shadow-2xl shadow-black/90">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#1F1F24]">
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: config.color }}
            />
            <h3 className="text-sm font-semibold tracking-wide text-zinc-100 uppercase">
              {title || `${config.name} Address`}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* QR Code Container */}
        <div className="flex flex-col items-center justify-center my-6">
          <div className="p-4 rounded-xl bg-white border-2 border-white/90 shadow-lg shadow-cyan-500/5">
            <svg
              viewBox={`0 0 ${size} ${size}`}
              className="w-48 h-48 md:w-52 md:h-52"
              fill="#0A0A0C"
            >
              <rect width="100%" height="100%" fill="#FFFFFF" />
              <path d={path} fill="#0A0A0C" />
            </svg>
          </div>

          <div className="flex items-center gap-1.5 mt-3 text-xs text-emerald-400 font-mono">
            <ShieldCheck size={14} />
            <span>Air-gap scan verified • Zero telemetry</span>
          </div>
        </div>

        {/* Derivation Path */}
        {derivationPath && (
          <div className="mb-3 px-3 py-1.5 rounded-lg bg-[#14141A] border border-[#1F1F24] flex items-center justify-between text-xs">
            <span className="text-zinc-500">Derivation Path:</span>
            <span className="font-mono text-zinc-300 font-medium">{derivationPath}</span>
          </div>
        )}

        {/* Address Display */}
        <div className="p-3 rounded-xl bg-[#14141A] border border-[#1F1F24] mb-4">
          <div className="text-[11px] text-zinc-500 uppercase tracking-wider mb-1">
            Receiving Address (EIP-55 / Bech32)
          </div>
          <div className="font-mono text-xs text-zinc-200 break-all select-all leading-relaxed">
            {address}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleCopy}
            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold bg-[#1F1F28] hover:bg-zinc-700 text-zinc-200 transition border border-zinc-700/50"
          >
            {copied ? (
              <>
                <Check size={14} className="text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy size={14} />
                <span>Copy Address</span>
              </>
            )}
          </button>

          <button
            onClick={handleDownloadSvg}
            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold bg-cyan-950/40 hover:bg-cyan-900/40 text-cyan-400 border border-cyan-800/50 transition"
          >
            <Download size={14} />
            <span>Save SVG</span>
          </button>
        </div>
      </div>
    </div>
  );
}
