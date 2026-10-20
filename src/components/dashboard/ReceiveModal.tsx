'use client';

import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  Download,
  ShieldCheck,
  ArrowDownLeft,
  ExternalLink,
  Coins,
} from 'lucide-react';
import { useWallet } from '@/context/WalletContext';
import { generateQrMatrix, generateQrSvgPath } from '@/lib/qrcode';

interface ReceiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultAssetSymbol?: string;
}

export function ReceiveModal({
  isOpen,
  onClose,
  defaultAssetSymbol = 'SOL',
}: ReceiveModalProps) {
  const { tokens, addresses } = useWallet();
  const [selectedSymbol, setSelectedSymbol] = useState<string>(defaultAssetSymbol);
  const [copied, setCopied] = useState(false);

  React.useEffect(() => {
    if (defaultAssetSymbol) {
      setSelectedSymbol(defaultAssetSymbol);
    }
  }, [defaultAssetSymbol]);

  if (!isOpen) return null;

  const solAddress = addresses.solana?.address || 'Solana Address Loading...';
  const activeToken =
    tokens.find((t) => t.symbol.toUpperCase() === selectedSymbol.toUpperCase()) ||
    tokens[0];

  const matrix = generateQrMatrix(solAddress);
  const { path, size } = generateQrSvgPath(matrix, 7);

  const handleCopy = () => {
    navigator.clipboard.writeText(solAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSvg = () => {
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" fill="#0A0A0C"><rect width="100%" height="100%" fill="#FFFFFF"/><path d="${path}" fill="#0A0A0C"/></svg>`;
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `solana-receive-${selectedSymbol.toLowerCase()}-qr.svg`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-sm sm:max-w-md rounded-none bg-white dark:bg-[#0F0F10] border border-black dark:border-[#353536] p-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-black/10 dark:border-[#353536] mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-none bg-black text-white dark:bg-white dark:text-black flex items-center justify-center">
              <ArrowDownLeft size={16} />
            </div>
            <div>
              <h3 className="text-sm font-sans font-black text-black dark:text-white uppercase tracking-wider">
                RECEIVE SOLANA ASSETS
              </h3>
              <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                NATIVE SOL & SPL TOKENS
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-none text-zinc-500 hover:text-black dark:hover:text-white border border-transparent hover:border-black dark:hover:border-white transition cursor-pointer"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Asset Selector Pills */}
        <div className="mb-4">
          <div className="text-[10px] font-mono font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-widest mb-1.5">
            ASSET TO RECEIVE:
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
            {tokens.map((t) => {
              const isSelected = selectedSymbol.toUpperCase() === t.symbol.toUpperCase();
              return (
                <button
                  key={t.symbol}
                  onClick={() => setSelectedSymbol(t.symbol)}
                  className={`py-1.5 px-2 rounded-none border text-[11px] font-mono font-bold flex items-center justify-center transition cursor-pointer ${
                    isSelected
                      ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white'
                      : 'bg-[#F7F7F7] dark:bg-[#1D1D1E] border-black/10 dark:border-[#353536] text-zinc-700 dark:text-zinc-300 hover:border-black dark:hover:border-white'
                  }`}
                >
                  <span>{t.symbol}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* QR Code Container */}
        <div className="flex flex-col items-center justify-center my-3">
          <div className="p-4 rounded-none bg-white border border-black dark:border-[#353536]">
            <svg
              viewBox={`0 0 ${size} ${size}`}
              className="w-40 h-40 sm:w-44 sm:h-44"
              fill="#000000"
            >
              <rect width="100%" height="100%" fill="#FFFFFF" />
              <path d={path} fill="#000000" />
            </svg>
          </div>

          <div className="flex items-center gap-1.5 mt-2.5 text-[11px] text-black dark:text-white font-mono uppercase font-bold">
            <ShieldCheck size={13} />
            <span>SOLANA ON-CHAIN VERIFIED</span>
          </div>
        </div>

        {/* Formatted Address Box */}
        <div className="p-3 rounded-none bg-[#F7F7F7] dark:bg-[#1D1D1E] border border-black/10 dark:border-[#353536] mb-3">
          <div className="flex items-center justify-between text-[10px] text-zinc-500 uppercase tracking-wider mb-1 font-mono font-bold">
            <span>RECEIVING ADDRESS</span>
            <span className="text-black dark:text-white">SOLANA MAINNET</span>
          </div>
          <div className="font-mono text-xs text-black dark:text-white break-all select-all leading-relaxed font-bold">
            {solAddress}
          </div>
        </div>

        {/* Notice for SPL tokens */}
        {!activeToken?.isNative && (
          <div className="mb-3.5 px-3 py-2 rounded-none bg-[#F7F7F7] dark:bg-[#1D1D1E] border border-black/10 dark:border-[#353536] flex items-center justify-between text-[11px] text-zinc-700 dark:text-zinc-300 font-mono">
            <span className="flex items-center gap-1.5">
              <Coins size={13} className="text-black dark:text-white" />
              <span>Direct dispatch to {activeToken?.symbol} token account</span>
            </span>
            <span className="font-bold text-black dark:text-white">SAME ADDRESS</span>
          </div>
        )}

        {/* Explorer Link Bar */}
        <div className="mb-4 text-center">
          <a
            href={`https://solscan.io/account/${solAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-black dark:text-white hover:underline uppercase font-bold"
          >
            <span>VIEW ON SOLSCAN EXPLORER</span>
            <ExternalLink size={13} />
          </a>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={handleCopy}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-none text-xs font-sans font-black uppercase tracking-wider bg-black text-white dark:bg-white dark:text-black hover:opacity-90 transition border border-black dark:border-white cursor-pointer"
          >
            {copied ? (
              <>
                <Check size={14} />
                <span>COPIED!</span>
              </>
            ) : (
              <>
                <Copy size={14} />
                <span>COPY ADDRESS</span>
              </>
            )}
          </button>

          <button
            onClick={handleDownloadSvg}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-none text-xs font-sans font-black uppercase tracking-wider bg-white dark:bg-[#0F0F10] text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black border border-black dark:border-[#353536] transition cursor-pointer"
          >
            <Download size={14} />
            <span>SAVE SVG QR</span>
          </button>
        </div>
      </div>
    </div>
  );
}
