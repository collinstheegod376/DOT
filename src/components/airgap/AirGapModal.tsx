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
        setScanMessage(parsed.error || 'Invalid .dot-tx payload');
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
    a.download = `tx-${currentTx.tx_id.slice(2, 10)}.dot-tx`;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-zinc-800 bg-zinc-950 text-zinc-100 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 px-6 py-4 bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                Air-Gap Sovereign Relay
                <span className="text-xs font-mono font-normal px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
                  v1 (.dot-tx)
                </span>
              </h2>
              <p className="text-xs text-zinc-400">Zero-network offline transaction exchange protocol</p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-3 border-b border-zinc-800 text-xs font-semibold bg-zinc-900/30">
          <button
            onClick={() => {
              stopCamera();
              setActiveTab('export_unsigned');
            }}
            className={`py-3 px-2 flex items-center justify-center gap-2 border-b-2 transition ${
              activeTab === 'export_unsigned'
                ? 'border-amber-500 text-amber-400 bg-amber-500/5'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <QrCode className="h-4 w-4" />
            1. Export QR (Online)
          </button>
          <button
            onClick={() => {
              setActiveTab('offline_sign');
            }}
            className={`py-3 px-2 flex items-center justify-center gap-2 border-b-2 transition ${
              activeTab === 'offline_sign'
                ? 'border-amber-500 text-amber-400 bg-amber-500/5'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <WifiOff className="h-4 w-4" />
            2. Sign (Air-Gapped)
          </button>
          <button
            onClick={() => {
              setActiveTab('import_signed');
            }}
            className={`py-3 px-2 flex items-center justify-center gap-2 border-b-2 transition ${
              activeTab === 'import_signed'
                ? 'border-amber-500 text-amber-400 bg-amber-500/5'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Wifi className="h-4 w-4" />
            3. Import Signed
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: EXPORT QR */}
          {activeTab === 'export_unsigned' && (
            <div className="space-y-6">
              {!currentTx ? (
                <div className="rounded-xl border border-dashed border-zinc-800 p-8 text-center space-y-3">
                  <FileCode className="h-10 w-10 text-zinc-600 mx-auto" />
                  <p className="text-sm text-zinc-400">No transaction is currently loaded for export.</p>
                  <button
                    onClick={() => setActiveTab('offline_sign')}
                    className="px-4 py-2 text-xs font-semibold rounded-lg bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
                  >
                    Import or Create a Transaction
                  </button>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-6 items-center">
                  {/* QR Display Card */}
                  <div className="flex flex-col items-center bg-zinc-900/80 rounded-2xl p-5 border border-zinc-800/80 shadow-inner">
                    <div 
                      className="bg-white p-3 rounded-xl shadow-lg"
                      dangerouslySetInnerHTML={{ __html: currentQrSvg }}
                    />

                    {/* Chunking / Carousel Controls */}
                    {frames.length > 1 && (
                      <div className="w-full mt-4 space-y-2">
                        <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
                          <span className="flex items-center gap-1">
                            <Layers className="h-3.5 w-3.5 text-amber-400" />
                            Frame {frameInfo?.index || currentFrameIdx + 1} of {frames.length}
                          </span>
                          <span>{fps} FPS</span>
                        </div>
                        {/* Progress Bar */}
                        <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-amber-500 transition-all duration-200"
                            style={{ width: `${(((currentFrameIdx + 1) / frames.length) * 100)}%` }}
                          />
                        </div>
                        {/* Controls */}
                        <div className="flex items-center justify-center gap-3 pt-1">
                          <button
                            onClick={() => setCurrentFrameIdx((prev) => (prev - 1 + frames.length) % frames.length)}
                            className="p-1 rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setIsPlaying(!isPlaying)}
                            className="p-1.5 rounded-lg bg-amber-500 text-black font-semibold hover:bg-amber-400"
                          >
                            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                          </button>
                          <button
                            onClick={() => setCurrentFrameIdx((prev) => (prev + 1) % frames.length)}
                            className="p-1 rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>
                          <select
                            value={fps}
                            onChange={(e) => setFps(Number(e.target.value))}
                            className="text-xs bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-zinc-300"
                          >
                            <option value={1}>1 fps</option>
                            <option value={3}>3 fps (Normal)</option>
                            <option value={5}>5 fps (Fast)</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {frames.length === 1 && (
                      <p className="text-[11px] text-zinc-500 mt-3 font-mono">Single frame payload (fits in 1 QR)</p>
                    )}
                  </div>

                  {/* Intent & Actions */}
                  <div className="space-y-4">
                    <div className="rounded-xl bg-zinc-900/60 border border-zinc-800 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs uppercase font-semibold text-zinc-400">Decoded Intent</span>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md ${
                          currentTx.signatures.length > 0 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {currentTx.signatures.length > 0 ? 'Signed' : 'Unsigned'}
                        </span>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between border-b border-zinc-800/60 pb-1.5">
                          <span className="text-zinc-500">Chain:</span>
                          <span className="font-mono text-zinc-200 uppercase">{currentTx.chain} (Net {currentTx.network_id})</span>
                        </div>
                        <div className="flex justify-between border-b border-zinc-800/60 pb-1.5">
                          <span className="text-zinc-500">Amount:</span>
                          <span className="font-mono font-bold text-white">{currentTx.decoded_intent.amount} {currentTx.decoded_intent.symbol}</span>
                        </div>
                        <div className="flex justify-between border-b border-zinc-800/60 pb-1.5">
                          <span className="text-zinc-500">Recipient:</span>
                          <span className="font-mono text-zinc-300 truncate max-w-[170px]" title={currentTx.decoded_intent.to}>
                            {currentTx.decoded_intent.to}
                          </span>
                        </div>
                        <div className="flex justify-between border-b border-zinc-800/60 pb-1.5">
                          <span className="text-zinc-500">Sender:</span>
                          <span className="font-mono text-zinc-300 truncate max-w-[170px]" title={currentTx.decoded_intent.from}>
                            {currentTx.decoded_intent.from}
                          </span>
                        </div>
                        {currentTx.expires_at && (
                          <div className="flex justify-between text-zinc-400">
                            <span>Status:</span>
                            <span className={isDotTxExpired(currentTx) ? 'text-red-400 font-bold' : 'text-emerald-400'}>
                              {isDotTxExpired(currentTx) ? 'EXPIRED' : 'Valid'}
                            </span>
                          </div>
                        )}
                      </div>

                      {currentTx.decoded_intent.warnings && currentTx.decoded_intent.warnings.length > 0 && (
                        <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-2 flex items-start gap-2 text-[11px] text-amber-300">
                          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
                          <div>{currentTx.decoded_intent.warnings.join(', ')}</div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2">
                      <button
                        onClick={copyPayload}
                        className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition"
                      >
                        {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                        {copied ? 'Copied JSON' : 'Copy .dot-tx'}
                      </button>
                      <button
                        onClick={downloadDotTxFile}
                        className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition"
                      >
                        <Download className="h-4 w-4" />
                        Download
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
              <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 flex items-center gap-3 text-xs text-red-300">
                <WifiOff className="h-5 w-5 text-red-400 shrink-0" />
                <div>
                  <span className="font-bold">Air-Gap Security Notice:</span> Keep this device strictly offline (Airplane Mode recommended). Private keys never leave memory.
                </div>
              </div>

              {!currentTx ? (
                <div className="space-y-4">
                  {/* Scanner / Upload Area */}
                  <div className="rounded-2xl border-2 border-dashed border-zinc-800 p-6 text-center space-y-4 bg-zinc-900/40">
                    {cameraActive ? (
                      <div className="space-y-3">
                        <div className="relative mx-auto w-64 h-64 rounded-xl overflow-hidden border-2 border-amber-500/60 bg-black">
                          <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
                          <div className="absolute inset-0 border border-dashed border-white/40 pointer-events-none" />
                        </div>
                        <button
                          onClick={stopCamera}
                          className="px-4 py-2 rounded-lg bg-zinc-800 text-xs font-semibold text-zinc-300 hover:bg-zinc-700"
                        >
                          Stop Camera
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Camera className="h-10 w-10 text-amber-400 mx-auto" />
                        <h3 className="text-sm font-semibold text-white">Scan Unsigned .dot-tx QR Code</h3>
                        <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                          Use the device camera to scan animated QR codes from your online device.
                        </p>
                        <div className="flex justify-center gap-3">
                          <button
                            onClick={startCamera}
                            className="px-4 py-2.5 rounded-xl bg-amber-500 text-black font-semibold text-xs hover:bg-amber-400 flex items-center gap-2"
                          >
                            <Camera className="h-4 w-4" />
                            Start Camera Scanner
                          </button>
                          <label className="cursor-pointer px-4 py-2.5 rounded-xl bg-zinc-800 text-zinc-200 font-semibold text-xs hover:bg-zinc-700 flex items-center gap-2">
                            <Upload className="h-4 w-4" />
                            Upload .dot-tx File
                            <input type="file" accept=".dot-tx,.json" onChange={handleFileUpload} className="hidden" />
                          </label>
                        </div>
                      </div>
                    )}

                    {/* Progress / Scan messages */}
                    {scanStatus !== 'idle' && (
                      <div className="pt-2 text-xs font-mono">
                        <span className={scanStatus === 'error' ? 'text-red-400' : 'text-amber-400'}>
                          {scanMessage}
                        </span>
                        {scanProgress > 0 && scanProgress < 100 && (
                          <div className="w-48 mx-auto mt-2 h-1 bg-zinc-800 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-500" style={{ width: `${scanProgress}%` }} />
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Manual Paste fallback */}
                  <div className="rounded-xl border border-zinc-800 p-4 space-y-2 bg-zinc-900/30">
                    <label className="text-xs text-zinc-400 font-semibold">Or Paste Raw .dot-tx JSON / Frame Chunk:</label>
                    <textarea
                      value={scanInputText}
                      onChange={(e) => setScanInputText(e.target.value)}
                      placeholder='Paste {"version": 1, ...} or DOT1:1:3:a8f0:... frame chunk'
                      rows={3}
                      className="w-full rounded-lg bg-black/60 border border-zinc-800 p-3 text-xs font-mono text-zinc-200 focus:outline-none focus:border-amber-500"
                    />
                    <div className="flex justify-end">
                      <button
                        onClick={handleManualImport}
                        disabled={!scanInputText.trim()}
                        className="px-4 py-1.5 rounded-lg bg-zinc-800 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 disabled:opacity-40"
                      >
                        Process Payload
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Intent Verification and Sign Screen */
                <div className="space-y-5">
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-4">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-amber-400" />
                      Verify Intent Before Air-Gap Signing
                    </h3>

                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div className="p-3 rounded-xl bg-black/40 border border-zinc-800">
                        <span className="text-zinc-500">Destination Address:</span>
                        <p className="font-mono text-amber-400 font-bold mt-1 break-all">{currentTx.decoded_intent.to}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-black/40 border border-zinc-800">
                        <span className="text-zinc-500">Amount & Asset:</span>
                        <p className="font-mono text-emerald-400 font-bold text-base mt-1">
                          {currentTx.decoded_intent.amount} {currentTx.decoded_intent.symbol}
                        </p>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-black/40 border border-zinc-800 text-xs space-y-1">
                      <div className="text-zinc-500">Signing Account (From):</div>
                      <div className="font-mono text-zinc-300 break-all">{currentTx.decoded_intent.from}</div>
                      <div className="text-[11px] text-zinc-500 mt-2">Deduplication tx_id: <span className="font-mono text-zinc-400">{currentTx.tx_id}</span></div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <button
                        onClick={() => setCurrentTx(null)}
                        className="text-xs text-zinc-400 hover:text-zinc-200"
                      >
                        Cancel / Reset
                      </button>

                      <button
                        onClick={handleSimulatedSign}
                        className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20"
                      >
                        <ShieldCheck className="h-4 w-4" />
                        Sign Transaction Offline
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
              <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 flex items-center gap-3 text-xs text-emerald-300">
                <Wifi className="h-5 w-5 text-emerald-400 shrink-0" />
                <div>
                  <span className="font-bold">Online Device Import:</span> Scan the signed QR from your offline device. The signed payload will be queued and broadcast.
                </div>
              </div>

              {/* Scanner Area */}
              <div className="rounded-2xl border-2 border-dashed border-zinc-800 p-6 text-center space-y-4 bg-zinc-900/40">
                {cameraActive ? (
                  <div className="space-y-3">
                    <div className="relative mx-auto w-64 h-64 rounded-xl overflow-hidden border-2 border-emerald-500/60 bg-black">
                      <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
                      <div className="absolute inset-0 border border-dashed border-white/40 pointer-events-none" />
                    </div>
                    <button
                      onClick={stopCamera}
                      className="px-4 py-2 rounded-lg bg-zinc-800 text-xs font-semibold text-zinc-300 hover:bg-zinc-700"
                    >
                      Stop Camera
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <QrCode className="h-10 w-10 text-emerald-400 mx-auto" />
                    <h3 className="text-sm font-semibold text-white">Scan Signed QR from Air-Gap Device</h3>
                    <div className="flex justify-center gap-3">
                      <button
                        onClick={startCamera}
                        className="px-4 py-2.5 rounded-xl bg-emerald-500 text-black font-semibold text-xs hover:bg-emerald-400 flex items-center gap-2"
                      >
                        <Camera className="h-4 w-4" />
                        Start Camera Scanner
                      </button>
                      <label className="cursor-pointer px-4 py-2.5 rounded-xl bg-zinc-800 text-zinc-200 font-semibold text-xs hover:bg-zinc-700 flex items-center gap-2">
                        <Upload className="h-4 w-4" />
                        Upload Signed .dot-tx
                        <input type="file" accept=".dot-tx,.json" onChange={handleFileUpload} className="hidden" />
                      </label>
                    </div>
                  </div>
                )}

                {scanStatus !== 'idle' && (
                  <div className="pt-2 text-xs font-mono">
                    <span className={scanStatus === 'error' ? 'text-red-400' : 'text-emerald-400'}>
                      {scanMessage}
                    </span>
                  </div>
                )}
              </div>

              {/* Manual Input Fallback */}
              <div className="rounded-xl border border-zinc-800 p-4 space-y-2 bg-zinc-900/30">
                <label className="text-xs text-zinc-400 font-semibold">Or Paste Signed .dot-tx JSON:</label>
                <textarea
                  value={scanInputText}
                  onChange={(e) => setScanInputText(e.target.value)}
                  placeholder="Paste signed transaction JSON here..."
                  rows={3}
                  className="w-full rounded-lg bg-black/60 border border-zinc-800 p-3 text-xs font-mono text-zinc-200 focus:outline-none focus:border-emerald-500"
                />
                <div className="flex justify-end">
                  <button
                    onClick={handleManualImport}
                    disabled={!scanInputText.trim()}
                    className="px-4 py-1.5 rounded-lg bg-emerald-500 text-black font-semibold text-xs hover:bg-emerald-400 disabled:opacity-40"
                  >
                    Import & Queue Broadcast
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-zinc-800 px-6 py-3 bg-zinc-900/50 flex items-center justify-between text-xs text-zinc-500">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Air-Gap Engine: 100% In-Browser Execution</span>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="text-zinc-400 hover:text-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
