'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  QrCode, 
  Camera, 
  Check, 
  Copy, 
  Download, 
  Upload, 
  AlertTriangle, 
  ShieldCheck, 
  Wifi, 
  WifiOff, 
  ArrowRight, 
  Play, 
  Pause, 
  X,
  FileCode,
  Layers,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { DotTx, serializeDotTx, deserializeDotTx, signDotTx, isDotTxExpired } from '../../lib/offline/dot-tx';
import { chunkPayload, parseChunkFrame, QrChunkAccumulator, qrToSvg } from '../../lib/offline/airgap-qr';
import { enqueueTx } from '../../lib/offline/queue';

export type AirGapMode = 'export_unsigned' | 'offline_sign' | 'import_signed';

interface AirGapModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTx?: DotTx | null;
  mode?: AirGapMode;
  onTxEnqueued?: (tx: DotTx) => void;
}

export function AirGapModal({
  isOpen,
  onClose,
  initialTx = null,
  mode = 'export_unsigned',
  onTxEnqueued,
}: AirGapModalProps) {
  const [activeTab, setActiveTab] = useState<AirGapMode>(mode);
  const [prevMode, setPrevMode] = useState<AirGapMode>(mode);
  if (mode !== prevMode) {
    setPrevMode(mode);
    setActiveTab(mode);
  }

  const [currentTx, setCurrentTx] = useState<DotTx | null>(initialTx);
  const [prevInitialTx, setPrevInitialTx] = useState<DotTx | null>(initialTx);
  if (initialTx !== prevInitialTx) {
    setPrevInitialTx(initialTx);
    setCurrentTx(initialTx);
  }

  const [copied, setCopied] = useState(false);

  // Derived frames using useMemo
  const frames = useMemo(() => {
    if (!currentTx) return [];
    const raw = serializeDotTx(currentTx, false);
    return chunkPayload(raw, 180);
  }, [currentTx]);

  // Multi-frame playback state
  const [currentFrameIdx, setCurrentFrameIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [fps, setFps] = useState(3); // frames per second

  // Scanning state
  const [scanInputText, setScanInputText] = useState('');
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
  const [scanMessage, setScanMessage] = useState('');
  const [scanProgress, setScanProgress] = useState(0);
  const accumulatorRef = useRef(new QrChunkAccumulator());

  // Camera video ref
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  // Animation timer for multi-frame QR
  useEffect(() => {
    if (!isPlaying || frames.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentFrameIdx((prev) => (prev + 1) % frames.length);
    }, 1000 / fps);

    return () => clearInterval(interval);
  }, [isPlaying, frames.length, fps]);

  // Handle camera stream cleanup
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  useEffect(() => {
    if (!isOpen && streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setCameraActive(false);
    }
  }, [isOpen]);

  // Start Camera
  const startCamera = async () => {
    setScanStatus('scanning');
    setScanMessage('Initializing offline camera...');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
      setScanMessage('Point camera at QR code. Multi-frame codes are assembled automatically.');

      // Try BarcodeDetector if available
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const anyWin = window as any;
      if ('BarcodeDetector' in anyWin) {
        const barcodeDetector = new anyWin.BarcodeDetector({ formats: ['qr_code'] });
        const scanInterval = setInterval(async () => {
          if (!videoRef.current || !streamRef.current) {
            clearInterval(scanInterval);
            return;
          }
          try {
            const barcodes = await barcodeDetector.detect(videoRef.current);
            if (barcodes.length > 0) {
              const rawVal = barcodes[0].rawValue;
              handleChunkScanned(rawVal);
            }
          } catch {
            // Ignore frame detect errors
          }
        }, 200);
      }
    } catch {
      setCameraActive(false);
      setScanStatus('idle');
      setScanMessage('Camera unavailable or permission denied. Please paste text or upload file.');
    }
  };

  const handleChunkScanned = (chunkStr: string) => {
    const res = accumulatorRef.current.addFrame(chunkStr.trim());
    setScanProgress(res.progress);

    if (res.error) {
      setScanStatus('error');
      setScanMessage(res.error);
      return;
    }

    if (res.completed && res.payload) {
      stopCamera();
      const parsed = deserializeDotTx(res.payload);
      if (!parsed.valid || !parsed.tx) {
        setScanStatus('error');
        setScanMessage(parsed.error || 'Invalid transaction payload');
        return;
      }

      setCurrentTx(parsed.tx);
      setScanStatus('success');
      setScanMessage(`Successfully imported transaction: ${parsed.tx.tx_id.slice(0, 10)}...`);
      accumulatorRef.current.reset();

      if (activeTab === 'import_signed') {
        enqueueTx(parsed.tx).then((enqueued) => {
          onTxEnqueued?.(enqueued);
        });
      }
    } else {
      setScanStatus('scanning');
      setScanMessage(`Scanning chunks: ${res.progress}% complete...`);
    }
  };

  const handleManualImport = () => {
    if (!scanInputText.trim()) return;
    handleChunkScanned(scanInputText.trim());
    setScanInputText('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        handleChunkScanned(text.trim());
      }
    };
    reader.readAsText(file);
  };

  const copyPayload = () => {
    if (!currentTx) return;
    const text = serializeDotTx(currentTx, true);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadDotTxFile = () => {
    if (!currentTx) return;
    const text = serializeDotTx(currentTx, true);
    const blob = new Blob([text], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tx-${currentTx.tx_id.slice(2, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSimulatedSign = () => {
    if (!currentTx) return;
    const randomBytes = new Uint8Array(8);
    crypto.getRandomValues(randomBytes);
    const hex = Array.from(randomBytes).map((b) => b.toString(16).padStart(2, '0')).join('');
    // Sign offline with air-gap mock/key
    const signed = signDotTx(currentTx, {
      signer: currentTx.decoded_intent.from,
      signature: `0xairgap_sig_${Date.now()}_${hex}`,
      type: currentTx.chain === 'sol' ? 'ed25519' : 'secp256k1',
      signed_at: Date.now(),
    });
    setCurrentTx(signed);
    setActiveTab('export_unsigned'); // Switch to display signed QR for scanning back
  };

  if (!isOpen) return null;

  const currentFrameText = frames[currentFrameIdx] || '';
  const currentQrSvg = currentFrameText ? qrToSvg(currentFrameText, { size: 260 }) : '';
  const frameInfo = parseChunkFrame(currentFrameText);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-none border border-black dark:border-[#353536] bg-white dark:bg-[#0F0F10] text-black dark:text-white overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-black/10 dark:border-[#353536] px-6 py-4 bg-[#F7F7F7] dark:bg-[#1D1D1E]">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-none bg-black text-white dark:bg-white dark:text-black border border-black dark:border-white">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-sans font-black tracking-tight text-black dark:text-white uppercase flex items-center gap-2">
                AIR-GAP SOVEREIGN RELAY
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-none border border-black dark:border-[#353536] text-black dark:text-white uppercase">
                  OFFLINE ISOLATION
                </span>
              </h2>
              <p className="text-xs text-zinc-500 font-mono">Zero-network hardware isolated transaction signing</p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="rounded-none p-2 text-zinc-500 hover:text-black dark:hover:text-white border border-transparent hover:border-black dark:hover:border-white transition cursor-pointer"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-3 border-b border-black/10 dark:border-[#353536] text-xs font-sans font-black uppercase tracking-wider bg-[#F7F7F7] dark:bg-[#1D1D1E]">
          <button
            onClick={() => {
              stopCamera();
              setActiveTab('export_unsigned');
            }}
            className={`py-3 px-2 flex items-center justify-center gap-2 border-b-2 transition cursor-pointer ${
              activeTab === 'export_unsigned'
                ? 'border-black dark:border-white text-black dark:text-white bg-black/5 dark:bg-white/5 font-black'
                : 'border-transparent text-zinc-500 hover:text-black dark:hover:text-white'
            }`}
          >
            <QrCode className="h-4 w-4" />
            1. EXPORT TRANSACTION
          </button>
          <button
            onClick={() => {
              setActiveTab('offline_sign');
            }}
            className={`py-3 px-2 flex items-center justify-center gap-2 border-b-2 transition cursor-pointer ${
              activeTab === 'offline_sign'
                ? 'border-black dark:border-white text-black dark:text-white bg-black/5 dark:bg-white/5 font-black'
                : 'border-transparent text-zinc-500 hover:text-black dark:hover:text-white'
            }`}
          >
            <WifiOff className="h-4 w-4" />
            2. OFFLINE SIGN
          </button>
          <button
            onClick={() => {
              setActiveTab('import_signed');
            }}
            className={`py-3 px-2 flex items-center justify-center gap-2 border-b-2 transition cursor-pointer ${
              activeTab === 'import_signed'
                ? 'border-black dark:border-white text-black dark:text-white bg-black/5 dark:bg-white/5 font-black'
                : 'border-transparent text-zinc-500 hover:text-black dark:hover:text-white'
            }`}
          >
            <Wifi className="h-4 w-4" />
            3. IMPORT SIGNED
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: EXPORT QR */}
          {activeTab === 'export_unsigned' && (
            <div className="space-y-6">
              {!currentTx ? (
                <div className="rounded-none border border-dashed border-black/20 dark:border-[#353536] p-8 text-center space-y-3 bg-[#F7F7F7]/60 dark:bg-[#1D1D1E]/40">
                  <FileCode className="h-10 w-10 text-zinc-400 mx-auto" />
                  <p className="text-xs font-mono font-bold text-black dark:text-white uppercase tracking-wider">
                    NO TRANSACTION LOADED FOR EXPORT
                  </p>
                  <button
                    onClick={() => setActiveTab('offline_sign')}
                    className="px-4 py-2 text-xs font-sans font-black uppercase tracking-wider rounded-none bg-black text-white dark:bg-white dark:text-black border border-black dark:border-white transition cursor-pointer"
                  >
                    IMPORT OR CREATE TRANSACTION
                  </button>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-6 items-center">
                  {/* QR Display Card */}
                  <div className="flex flex-col items-center bg-[#F7F7F7] dark:bg-[#1D1D1E] rounded-none p-5 border border-black/10 dark:border-[#353536]">
                    <div 
                      className="bg-white p-3 rounded-none border border-black dark:border-[#353536]"
                      dangerouslySetInnerHTML={{ __html: currentQrSvg }}
                    />

                    {/* Chunking / Carousel Controls */}
                    {frames.length > 1 && (
                      <div className="w-full mt-4 space-y-2">
                        <div className="flex items-center justify-between text-xs font-mono text-zinc-500">
                          <span className="flex items-center gap-1 font-bold">
                            <Layers className="h-3.5 w-3.5 text-black dark:text-white" />
                            FRAME {frameInfo?.index || currentFrameIdx + 1} OF {frames.length}
                          </span>
                          <span className="font-bold">{fps} FPS</span>
                        </div>
                        {/* Progress Bar */}
                        <div className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-none overflow-hidden">
                          <div 
                            className="h-full bg-black dark:bg-white transition-all duration-200 rounded-none"
                            style={{ width: `${(((currentFrameIdx + 1) / frames.length) * 100)}%` }}
                          />
                        </div>
                        {/* Controls */}
                        <div className="flex items-center justify-center gap-3 pt-1">
                          <button
                            onClick={() => setCurrentFrameIdx((prev) => (prev - 1 + frames.length) % frames.length)}
                            className="p-1 rounded-none border border-black/20 dark:border-[#353536] bg-white dark:bg-[#0F0F10] text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition cursor-pointer"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setIsPlaying(!isPlaying)}
                            className="p-1.5 rounded-none bg-black text-white dark:bg-white dark:text-black border border-black dark:border-white font-bold transition cursor-pointer"
                          >
                            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                          </button>
                          <button
                            onClick={() => setCurrentFrameIdx((prev) => (prev + 1) % frames.length)}
                            className="p-1 rounded-none border border-black/20 dark:border-[#353536] bg-white dark:bg-[#0F0F10] text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition cursor-pointer"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>
                          <select
                            value={fps}
                            onChange={(e) => setFps(Number(e.target.value))}
                            className="text-xs bg-white dark:bg-[#0F0F10] border border-black dark:border-[#353536] rounded-none px-2 py-1 text-black dark:text-white font-mono"
                          >
                            <option value={1}>1 fps</option>
                            <option value={3}>3 fps (Normal)</option>
                            <option value={5}>5 fps (Fast)</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {frames.length === 1 && (
                      <p className="text-[11px] text-zinc-500 mt-3 font-mono uppercase font-bold">Single frame optical payload</p>
                    )}
                  </div>

                  {/* Intent & Actions */}
                  <div className="space-y-4">
                    <div className="rounded-none bg-[#F7F7F7] dark:bg-[#1D1D1E] border border-black/10 dark:border-[#353536] p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs uppercase font-sans font-black tracking-wider text-black dark:text-white">
                          TRANSACTION INTENT
                        </span>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-none border border-black dark:border-white text-black dark:text-white uppercase">
                          {currentTx.signatures.length > 0 ? 'SIGNED' : 'UNSIGNED'}
                        </span>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between border-b border-black/10 dark:border-[#353536] pb-1.5">
                          <span className="text-zinc-500 font-mono uppercase text-[10px]">Network:</span>
                          <span className="font-mono text-black dark:text-white font-bold uppercase">{currentTx.chain} (Cluster {currentTx.network_id})</span>
                        </div>
                        <div className="flex justify-between border-b border-black/10 dark:border-[#353536] pb-1.5">
                          <span className="text-zinc-500 font-mono uppercase text-[10px]">Amount:</span>
                          <span className="font-mono font-bold text-black dark:text-white">{currentTx.decoded_intent.amount} {currentTx.decoded_intent.symbol}</span>
                        </div>
                        <div className="flex justify-between border-b border-black/10 dark:border-[#353536] pb-1.5">
                          <span className="text-zinc-500 font-mono uppercase text-[10px]">Recipient:</span>
                          <span className="font-mono text-black dark:text-white font-bold truncate max-w-[170px]" title={currentTx.decoded_intent.to}>
                            {currentTx.decoded_intent.to}
                          </span>
                        </div>
                        <div className="flex justify-between border-b border-black/10 dark:border-[#353536] pb-1.5">
                          <span className="text-zinc-500 font-mono uppercase text-[10px]">Sender:</span>
                          <span className="font-mono text-zinc-600 dark:text-zinc-400 truncate max-w-[170px]" title={currentTx.decoded_intent.from}>
                            {currentTx.decoded_intent.from}
                          </span>
                        </div>
                        {currentTx.expires_at && (
                          <div className="flex justify-between text-zinc-500 font-mono">
                            <span className="uppercase text-[10px]">Status:</span>
                            <span className={isDotTxExpired(currentTx) ? 'text-zinc-500 font-bold' : 'text-black dark:text-white font-bold'}>
                              {isDotTxExpired(currentTx) ? 'EXPIRED' : 'VALID'}
                            </span>
                          </div>
                        )}
                      </div>

                      {currentTx.decoded_intent.warnings && currentTx.decoded_intent.warnings.length > 0 && (
                        <div className="rounded-none bg-[#F7F7F7] dark:bg-[#1D1D1E] border border-black/20 dark:border-[#353536] p-2 flex items-start gap-2 text-[11px] text-black dark:text-white font-mono">
                          <AlertTriangle className="h-4 w-4 shrink-0 text-black dark:text-white mt-0.5" />
                          <div>{currentTx.decoded_intent.warnings.join(', ')}</div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2">
                      <button
                        onClick={copyPayload}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-none bg-black text-white dark:bg-white dark:text-black text-xs font-sans font-black uppercase tracking-wider border border-black dark:border-white transition cursor-pointer"
                      >
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        {copied ? 'COPIED' : 'COPY PAYLOAD'}
                      </button>
                      <button
                        onClick={downloadDotTxFile}
                        className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-none bg-white dark:bg-[#0F0F10] text-black dark:text-white text-xs font-sans font-black uppercase tracking-wider border border-black dark:border-[#353536] hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition cursor-pointer"
                      >
                        <Download className="h-4 w-4" />
                        DOWNLOAD JSON
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: OFFLINE SIGN (AIR-GAPPED DEVICE) */}
          {activeTab === 'offline_sign' && (
            <div className="space-y-6">
              <div className="rounded-none bg-[#F7F7F7] dark:bg-[#1D1D1E] border border-black/10 dark:border-[#353536] p-3 flex items-center gap-3 text-xs text-black dark:text-white font-mono">
                <WifiOff className="h-5 w-5 text-black dark:text-white shrink-0" />
                <div>
                  <span className="font-bold uppercase">AIR-GAP SECURITY PROTOCOL:</span> Maintain isolated hardware offline state. Keys remain strictly in local memory.
                </div>
              </div>

              {!currentTx ? (
                <div className="space-y-4">
                  {/* Scanner / Upload Area */}
                  <div className="rounded-none border-2 border-dashed border-black/20 dark:border-[#353536] p-6 text-center space-y-4 bg-[#F7F7F7]/60 dark:bg-[#1D1D1E]/40">
                    {cameraActive ? (
                      <div className="space-y-3">
                        <div className="relative mx-auto w-64 h-64 rounded-none overflow-hidden border border-black dark:border-white bg-black">
                          <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
                          <div className="absolute inset-0 border border-dashed border-white/40 pointer-events-none" />
                        </div>
                        <button
                          onClick={stopCamera}
                          className="px-4 py-2 rounded-none bg-black text-white dark:bg-white dark:text-black text-xs font-sans font-black uppercase tracking-wider border border-black dark:border-white cursor-pointer"
                        >
                          STOP CAMERA
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Camera className="h-10 w-10 text-black dark:text-white mx-auto" />
                        <h3 className="text-sm font-sans font-black text-black dark:text-white uppercase tracking-wider">
                          SCAN UNSIGNED TRANSACTION
                        </h3>
                        <p className="text-xs text-zinc-500 font-mono max-w-sm mx-auto">
                          Use device optics to scan animated transaction frames from connected terminal.
                        </p>
                        <div className="flex justify-center gap-3">
                          <button
                            onClick={startCamera}
                            className="px-4 py-2.5 rounded-none bg-black text-white dark:bg-white dark:text-black font-sans font-black text-xs uppercase tracking-wider flex items-center gap-2 border border-black dark:border-white cursor-pointer"
                          >
                            <Camera className="h-4 w-4" />
                            START CAMERA
                          </button>
                          <label className="cursor-pointer px-4 py-2.5 rounded-none bg-white dark:bg-[#0F0F10] text-black dark:text-white font-sans font-black text-xs uppercase tracking-wider flex items-center gap-2 border border-black dark:border-[#353536] hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition">
                            <Upload className="h-4 w-4" />
                            UPLOAD TRANSACTION FILE
                            <input type="file" accept=".json,.txt" onChange={handleFileUpload} className="hidden" />
                          </label>
                        </div>
                      </div>
                    )}

                    {/* Progress / Scan messages */}
                    {scanStatus !== 'idle' && (
                      <div className="pt-2 text-xs font-mono font-bold">
                        <span className="text-black dark:text-white uppercase">
                          {scanMessage}
                        </span>
                        {scanProgress > 0 && scanProgress < 100 && (
                          <div className="w-48 mx-auto mt-2 h-1 bg-zinc-200 dark:bg-zinc-800 rounded-none overflow-hidden">
                            <div className="h-full bg-black dark:bg-white" style={{ width: `${scanProgress}%` }} />
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Manual Paste fallback */}
                  <div className="rounded-none border border-black/10 dark:border-[#353536] p-4 space-y-2 bg-[#F7F7F7] dark:bg-[#1D1D1E]">
                    <label className="text-[10px] font-mono text-zinc-600 dark:text-zinc-400 font-bold uppercase tracking-wider">
                      OR PASTE TRANSACTION DATA:
                    </label>
                    <textarea
                      value={scanInputText}
                      onChange={(e) => setScanInputText(e.target.value)}
                      placeholder='Paste {"version": 1, ...} or DOT1:1:3:a8f0:... frame chunk'
                      rows={3}
                      className="w-full rounded-none bg-white dark:bg-[#0F0F10] border border-black/10 dark:border-[#353536] p-3 text-xs font-mono text-black dark:text-white focus:outline-none focus:border-black dark:focus:border-white"
                    />
                    <div className="flex justify-end">
                      <button
                        onClick={handleManualImport}
                        disabled={!scanInputText.trim()}
                        className="px-4 py-2 rounded-none bg-black text-white dark:bg-white dark:text-black text-xs font-sans font-black uppercase tracking-wider hover:opacity-90 disabled:opacity-40 border border-black dark:border-white transition cursor-pointer"
                      >
                        PROCESS PAYLOAD
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Intent Verification and Sign Screen */
                <div className="space-y-5">
                  <div className="rounded-none border border-black/10 dark:border-[#353536] bg-[#F7F7F7] dark:bg-[#1D1D1E] p-5 space-y-4">
                    <h3 className="text-sm font-sans font-black text-black dark:text-white uppercase tracking-wider flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5" />
                      VERIFY INTENT BEFORE AIR-GAP SIGNING
                    </h3>

                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div className="p-3 rounded-none bg-white dark:bg-[#0F0F10] border border-black/10 dark:border-[#353536]">
                        <span className="text-zinc-500 font-mono uppercase text-[10px]">Destination:</span>
                        <p className="font-mono text-black dark:text-white font-bold mt-1 break-all">{currentTx.decoded_intent.to}</p>
                      </div>
                      <div className="p-3 rounded-none bg-white dark:bg-[#0F0F10] border border-black/10 dark:border-[#353536]">
                        <span className="text-zinc-500 font-mono uppercase text-[10px]">Amount & Asset:</span>
                        <p className="font-mono text-black dark:text-white font-black text-base mt-1">
                          {currentTx.decoded_intent.amount} {currentTx.decoded_intent.symbol}
                        </p>
                      </div>
                    </div>

                    <div className="p-3 rounded-none bg-white dark:bg-[#0F0F10] border border-black/10 dark:border-[#353536] text-xs space-y-1">
                      <div className="text-zinc-500 font-mono uppercase text-[10px]">Signing Account (From):</div>
                      <div className="font-mono text-zinc-700 dark:text-zinc-300 break-all">{currentTx.decoded_intent.from}</div>
                      <div className="text-[11px] text-zinc-500 mt-2 font-mono">Deduplication ID: <span className="font-mono text-black dark:text-white font-bold">{currentTx.tx_id}</span></div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <button
                        onClick={() => setCurrentTx(null)}
                        className="text-xs font-sans font-black uppercase tracking-wider text-zinc-500 hover:text-black dark:hover:text-white cursor-pointer"
                      >
                        CANCEL / RESET
                      </button>

                      <button
                        onClick={handleSimulatedSign}
                        className="px-6 py-3 rounded-none bg-black text-white dark:bg-white dark:text-black font-sans font-black text-xs uppercase tracking-wider flex items-center gap-2 border border-black dark:border-white hover:opacity-90 transition cursor-pointer"
                      >
                        <ShieldCheck className="h-4 w-4" />
                        SIGN TRANSACTION OFFLINE
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: IMPORT SIGNED (ONLINE BROADCASTER) */}
          {activeTab === 'import_signed' && (
            <div className="space-y-6">
              <div className="rounded-none bg-[#F7F7F7] dark:bg-[#1D1D1E] border border-black/10 dark:border-[#353536] p-3 flex items-center gap-3 text-xs text-black dark:text-white font-mono">
                <Wifi className="h-5 w-5 text-black dark:text-white shrink-0" />
                <div>
                  <span className="font-bold uppercase">CONNECTED RELAY IMPORT:</span> Scan the signed signature from your offline hardware. The transaction will be dispatched on-chain.
                </div>
              </div>

              {/* Scanner Area */}
              <div className="rounded-none border-2 border-dashed border-black/20 dark:border-[#353536] p-6 text-center space-y-4 bg-[#F7F7F7]/60 dark:bg-[#1D1D1E]/40">
                {cameraActive ? (
                  <div className="space-y-3">
                    <div className="relative mx-auto w-64 h-64 rounded-none overflow-hidden border border-black dark:border-white bg-black">
                      <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
                      <div className="absolute inset-0 border border-dashed border-white/40 pointer-events-none" />
                    </div>
                    <button
                      onClick={stopCamera}
                      className="px-4 py-2 rounded-none bg-black text-white dark:bg-white dark:text-black text-xs font-sans font-black uppercase tracking-wider border border-black dark:border-white cursor-pointer"
                    >
                      STOP CAMERA
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <QrCode className="h-10 w-10 text-black dark:text-white mx-auto" />
                    <h3 className="text-sm font-sans font-black text-black dark:text-white uppercase tracking-wider">
                      SCAN SIGNED QR FROM AIR-GAP DEVICE
                    </h3>
                    <div className="flex justify-center gap-3">
                      <button
                        onClick={startCamera}
                        className="px-4 py-2.5 rounded-none bg-black text-white dark:bg-white dark:text-black font-sans font-black text-xs uppercase tracking-wider flex items-center gap-2 border border-black dark:border-white cursor-pointer"
                      >
                        <Camera className="h-4 w-4" />
                        START CAMERA
                      </button>
                      <label className="cursor-pointer px-4 py-2.5 rounded-none bg-white dark:bg-[#0F0F10] text-black dark:text-white font-sans font-black text-xs uppercase tracking-wider flex items-center gap-2 border border-black dark:border-[#353536] hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition">
                        <Upload className="h-4 w-4" />
                        UPLOAD SIGNED TRANSACTION
                        <input type="file" accept=".json,.txt" onChange={handleFileUpload} className="hidden" />
                      </label>
                    </div>
                  </div>
                )}

                {scanStatus !== 'idle' && (
                  <div className="pt-2 text-xs font-mono font-bold text-black dark:text-white uppercase">
                    <span>{scanMessage}</span>
                  </div>
                )}
              </div>

              {/* Manual Input Fallback */}
              <div className="rounded-none border border-black/10 dark:border-[#353536] p-4 space-y-2 bg-[#F7F7F7] dark:bg-[#1D1D1E]">
                <label className="text-[10px] font-mono text-zinc-600 dark:text-zinc-400 font-bold uppercase tracking-wider">
                  OR PASTE SIGNED TRANSACTION:
                </label>
                <textarea
                  value={scanInputText}
                  onChange={(e) => setScanInputText(e.target.value)}
                  placeholder="Paste signed transaction JSON here..."
                  rows={3}
                  className="w-full rounded-none bg-white dark:bg-[#0F0F10] border border-black/10 dark:border-[#353536] p-3 text-xs font-mono text-black dark:text-white focus:outline-none focus:border-black dark:focus:border-white"
                />
                <div className="flex justify-end">
                  <button
                    onClick={handleManualImport}
                    disabled={!scanInputText.trim()}
                    className="px-4 py-2 rounded-none bg-black text-white dark:bg-white dark:text-black font-sans font-black text-xs uppercase tracking-wider hover:opacity-90 disabled:opacity-40 border border-black dark:border-white transition cursor-pointer"
                  >
                    IMPORT & QUEUE BROADCAST
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-black/10 dark:border-[#353536] px-6 py-3 bg-[#F7F7F7] dark:bg-[#1D1D1E] flex items-center justify-between text-xs text-zinc-500 font-mono">
          <div>
            <span className="font-bold text-[11px] uppercase">SOVEREIGN AIR-GAP RELAY: ZERO NETWORK EXPOSURE</span>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="text-black dark:text-white uppercase font-sans font-black text-xs hover:underline cursor-pointer"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
}
