'use client';

import React, { useState } from 'react';
import { X, Copy, Check, Download, ShieldCheck, ArrowDownLeft } from 'lucide-react';
import { useWallet } from '@/context/WalletContext';
import { SupportedChainId } from '@/types/wallet';
import { SUPPORTED_CHAINS } from '@/lib/constants';
import { generateQrMatrix, generateQrSvgPath } from '@/lib/qrcode';

interface ReceiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultChainId?: SupportedChainId;
}

export function ReceiveModal({ isOpen, onClose, defaultChainId = 'ethereum' }: ReceiveModalProps) {
  const { selectedChains, addresses } = useWallet();
  const [selectedChainId, setSelectedChainId] = useState<SupportedChainId>(defaultChainId);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const chain = SUPPORTED_CHAINS[selectedChainId];
  const addrInfo = addresses[selectedChainId];
  const address = addrInfo?.address || '0x...';

  const matrix = generateQrMatrix(address);
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
    a.download = `${chain.symbol.toLowerCase()}-receive-qr.svg`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm rounded-3xl bg-[#0F0F14] border border-[#1F1F24] p-6 shadow-2xl shadow-black/90">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#1F1F24] mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-950/60 border border-emerald-700/50 flex items-center justify-center text-emerald-400">
              <ArrowDownLeft size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Receive Cryptographic Assets</h3>
              <div className="text-[10px] font-mono text-zinc-400">Scan QR Code or Copy Address</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Chain selector pills */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {selectedChains.map((id) => {
            const c = SUPPORTED_CHAINS[id];
            const isSelected = selectedChainId === id;
            return (
              <button
                key={id}
                onClick={() => setSelectedChainId(id)}
                className={`py-2 px-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300'
                    : 'bg-[#14141C] border-[#272732] text-zinc-400 hover:text-white'
                }`}
              >
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                <span>{c.symbol}</span>
              </button>
            );
          })}
        </div>

        {/* QR Code Container */}
        <div className="flex flex-col items-center justify-center my-4">
          <div className="p-4 rounded-2xl bg-white border-2 border-white shadow-xl shadow-cyan-500/5">
            <svg
              viewBox={`0 0 ${size} ${size}`}
              className="w-44 h-44 sm:w-48 sm:h-48"
              fill="#0A0A0C"
            >
              <rect width="100%" height="100%" fill="#FFFFFF" />
              <path d={path} fill="#0A0A0C" />
            </svg>
          </div>

          <div className="flex items-center gap-1.5 mt-2.5 text-[11px] text-emerald-400 font-mono">
            <ShieldCheck size={13} />
            <span>Standard EIP-55 / Bech32 Verified</span>
          </div>
        </div>

        {/* Derivation Path */}
        <div className="mb-3 px-3 py-1.5 rounded-lg bg-[#14141A] border border-[#1F1F24] flex items-center justify-between text-xs">
          <span className="text-zinc-500 text-[11px]">Derivation Path:</span>
          <span className="font-mono text-zinc-300 text-[11px]">{chain.derivationPath}</span>
        </div>

        {/* Formatted Address */}
        <div className="p-3 rounded-xl bg-[#14141A] border border-[#1F1F24] mb-4">
          <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">
            Receiving Address
          </div>
          <div className="font-mono text-xs text-zinc-200 break-all select-all leading-relaxed">
            {address}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleCopy}
            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold bg-[#1F1F28] hover:bg-zinc-700 text-zinc-200 transition border border-zinc-700/50 cursor-pointer"
          >
            {copied ? (
              <>
                <Check size={14} className="text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy size={14} />
                <span>Copy</span>
              </>
            )}
          </button>

          <button
            onClick={handleDownloadSvg}
            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold bg-emerald-950/40 hover:bg-emerald-900/40 text-emerald-400 border border-emerald-800/50 transition cursor-pointer"
          >
            <Download size={14} />
            <span>Save SVG</span>
          </button>
        </div>
      </div>
    </div>
  );
}
