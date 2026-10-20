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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm sm:max-w-md rounded-3xl bg-[#0F1118] border border-[#232736] p-6 shadow-2xl shadow-black/90">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-[#1E2230] mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center text-[#14F195]">
              <ArrowDownLeft size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Receive Solana Assets</h3>
              <div className="text-[10px] font-mono text-zinc-400">
                Native SOL & SPL Tokens
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Asset Selector Pills */}
        <div className="mb-4">
          <div className="text-[11px] font-mono text-zinc-400 mb-1.5">
            Asset to Receive:
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
            {tokens.map((t) => {
              const isSelected = selectedSymbol.toUpperCase() === t.symbol.toUpperCase();
              return (
                <button
                  key={t.symbol}
                  onClick={() => setSelectedSymbol(t.symbol)}
                  className={`py-1.5 px-2 rounded-xl border text-[11px] font-semibold flex items-center justify-center gap-1 transition cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 font-bold'
                      : 'bg-[#141722] border-[#222736] text-zinc-400 hover:text-white'
                  }`}
                >
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: t.color || '#14F195' }}
                  />
                  <span>{t.symbol}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* QR Code Container */}
        <div className="flex flex-col items-center justify-center my-3">
          <div className="p-3.5 rounded-2xl bg-white border-2 border-white shadow-xl shadow-emerald-500/5">
            <svg
              viewBox={`0 0 ${size} ${size}`}
              className="w-40 h-40 sm:w-44 sm:h-44"
              fill="#0A0A0C"
            >
              <rect width="100%" height="100%" fill="#FFFFFF" />
              <path d={path} fill="#0A0A0C" />
            </svg>
          </div>

          <div className="flex items-center gap-1.5 mt-2.5 text-[11px] text-emerald-400 font-mono">
            <ShieldCheck size={13} />
            <span>Solana Network Verified</span>
          </div>
        </div>

        {/* Formatted Address Box */}
        <div className="p-3 rounded-2xl bg-[#090A0E] border border-[#1E2230] mb-3">
          <div className="flex items-center justify-between text-[10px] text-zinc-500 uppercase tracking-wider mb-1">
            <span>Solana Receiving Address</span>
            <span className="font-mono text-emerald-400">Solana Mainnet</span>
          </div>
          <div className="font-mono text-xs text-zinc-200 break-all select-all leading-relaxed">
            {solAddress}
          </div>
        </div>

        {/* Notice for SPL tokens */}
        {!activeToken?.isNative && (
          <div className="mb-3.5 px-3 py-2 rounded-xl bg-emerald-950/20 border border-emerald-800/30 flex items-center justify-between text-[11px] text-zinc-300">
            <span className="flex items-center gap-1.5">
              <Coins size={13} className="text-[#14F195]" />
              <span>Sends directly to your {activeToken?.symbol} token account</span>
            </span>
            <span className="font-mono text-zinc-500">Same Address</span>
          </div>
        )}

        {/* Explorer Link Bar */}
        <div className="mb-4 text-center">
          <a
            href={`https://solscan.io/account/${solAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-[#14F195] hover:underline"
          >
            <span>View Account on Solscan Explorer</span>
            <ExternalLink size={13} />
          </a>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={handleCopy}
            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold bg-[#1F2433] hover:bg-zinc-700 text-zinc-200 transition border border-zinc-700/50 cursor-pointer"
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
            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold bg-emerald-950/40 hover:bg-emerald-900/40 text-emerald-400 border border-emerald-800/50 transition cursor-pointer"
          >
            <Download size={14} />
            <span>Save SVG QR</span>
          </button>
        </div>
      </div>
    </div>
  );
}
