'use client';

import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  Send, 
  Trash2, 
  QrCode, 
  PlusCircle, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { DotTx, createDotTx, isDotTxExpired } from '../../lib/offline/dot-tx';
import { 
  getAllTxs, 
  enqueueTx, 
  updateTxStatus, 
  removeTx, 
  clearQueue, 
  subscribeToQueue,
  broadcastQueuedTx
} from '../../lib/offline/queue';
import { AirGapModal } from './AirGapModal';
import { useWallet } from '@/context/WalletContext';
import { buildAndBroadcastSolanaTransfer } from '@/lib/chains/sol-tx';

export interface QueueViewerProps {
  isEmbedded?: boolean;
  onSelectTx?: (tx: DotTx, mode: 'export_unsigned' | 'offline_sign' | 'import_signed') => void;
}

export function QueueViewer({ isEmbedded = false, onSelectTx }: QueueViewerProps) {
  const [txs, setTxs] = useState<DotTx[]>([]);
  const [selectedTx, setSelectedTx] = useState<DotTx | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'export_unsigned' | 'offline_sign' | 'import_signed'>('export_unsigned');
  const [broadcastingId, setBroadcastingId] = useState<string | null>(null);

  const { privateKeys, isOnline, activeNetwork, addresses, refreshBalances } = useWallet();

  useEffect(() => {
    // Initial fetch & subscribe
    const unsubscribe = subscribeToQueue((updatedTxs) => {
      setTxs(updatedTxs);
    });

    const handleCustomOpen = () => {
      getAllTxs().then(setTxs);
    };

    window.addEventListener('dot:open-queue', handleCustomOpen);

    return () => {
      unsubscribe();
      window.removeEventListener('dot:open-queue', handleCustomOpen);
    };
  }, []);

  const handleCreateSampleTx = async (chain: 'evm' | 'btc' | 'sol') => {
    let newTx: DotTx;

    if (chain === 'evm') {
      newTx = createDotTx({
        chain: 'evm',
        network_id: 1,
        unsigned_payload: '0x02f873018202...sample_evm_unsigned_hex',
        decoded_intent: {
          to: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
          from: '0x9858effd232b4033e47d90003d41ec34ecaeda94',
          amount: '0.25',
          symbol: 'ETH',
          contractCall: {
            method: 'transfer(address,uint256)',
            params: { recipient: 'vitalik.eth', amount: '250000000000000000' }
          }
        }
      });
    } else if (chain === 'sol') {
      // Solana with 90s expiration blockhash window
      newTx = createDotTx({
        chain: 'sol',
        network_id: activeNetwork || 'mainnet-beta',
        unsigned_payload: 'AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA...sample_sol_tx',
        decoded_intent: {
          to: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
          from: addresses.solana?.address || '6vZh5wgHqmS4o7UKPREhmB4ekxAjQ3ARjAJumbQD1eEE',
          amount: '0.05',
          symbol: 'SOL',
          warnings: ['Expires in 90 seconds (Solana Blockhash)']
        },
        expires_at: Date.now() + 90 * 1000 // 90 seconds
      });
    } else {
      newTx = createDotTx({
        chain: 'btc',
        network_id: 'mainnet',
        unsigned_payload: '0200000001...sample_psbt_payload',
        decoded_intent: {
          to: 'bc1qcr8te4kr609gcawutmrza0j4xv80jy8z306fyu',
          from: '1LqBGSKuX5yYUonjxT5qGfpUsXKYYWeabA',
          amount: '0.045',
          symbol: 'BTC'
        }
      });
    }

    await enqueueTx(newTx);
  };

  const handleSimulateBroadcast = async (tx: DotTx) => {
    if (isDotTxExpired(tx)) {
      await updateTxStatus(tx.tx_id, 'expired', { error: 'Blockhash expired before broadcast' });
      return;
    }

    setBroadcastingId(tx.tx_id);

    try {
      await broadcastQueuedTx(tx, activeNetwork, privateKeys?.solana);
      await refreshBalances();
    } catch (err) {
      console.error('[QueueViewer] broadcastQueuedTx error:', err);
    } finally {
      setBroadcastingId(null);
    }
  };

  const handleBroadcast = handleSimulateBroadcast;

  const handleOpenAirGapAction = (tx: DotTx, mode: 'export_unsigned' | 'offline_sign' | 'import_signed') => {
    if (onSelectTx) {
      onSelectTx(tx, mode);
    } else {
      setSelectedTx(tx);
      setModalMode(mode);
      setModalOpen(true);
    }
  };

  return (
    <div className="w-full space-y-4 font-sans text-black">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#FFFFFF] border border-black rounded-none p-4">
        <div>
          <h2 className="text-xs font-sans font-black text-black uppercase tracking-wider flex items-center gap-2">
            <Layers className="h-4 w-4" />
            <span>OFFLINE BROADCAST QUEUE</span>
            <span className="text-[10px] font-mono px-2 py-0.5 border border-black bg-[#F7F7F7] text-black">
              {txs.length} TOTAL
            </span>
          </h2>
          <p className="text-[10px] font-mono text-zinc-500 mt-0.5 uppercase tracking-wide">
            IndexedDB persistent queue • deterministic deduplication • auto-sync
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => handleCreateSampleTx('sol')}
            className="px-2.5 py-1.5 rounded-none bg-white hover:bg-black hover:text-white text-[11px] font-sans font-black uppercase tracking-wider text-black border border-black transition cursor-pointer flex items-center gap-1.5"
          >
            <PlusCircle className="h-3 w-3" />
            <span>+ SOL TX</span>
          </button>
          <button
            onClick={() => handleCreateSampleTx('evm')}
            className="px-2.5 py-1.5 rounded-none bg-white hover:bg-black hover:text-white text-[11px] font-sans font-black uppercase tracking-wider text-black border border-black transition cursor-pointer flex items-center gap-1.5"
          >
            <PlusCircle className="h-3 w-3" />
            <span>+ EVM TX</span>
          </button>
          <button
            onClick={() => handleCreateSampleTx('btc')}
            className="px-2.5 py-1.5 rounded-none bg-white hover:bg-black hover:text-white text-[11px] font-sans font-black uppercase tracking-wider text-black border border-black transition cursor-pointer flex items-center gap-1.5"
          >
            <PlusCircle className="h-3 w-3" />
            <span>+ BTC TX</span>
          </button>
        </div>
      </div>

      {/* Transaction List */}
      {txs.length === 0 ? (
        <div className="rounded-none border border-dashed border-black/20 p-10 text-center space-y-3 bg-[#FFFFFF]">
          <Layers className="h-10 w-10 text-zinc-400 mx-auto" />
          <h3 className="text-xs font-sans font-black text-black uppercase tracking-wider">
            TRANSACTION QUEUE IS EMPTY
          </h3>
          <p className="text-xs font-mono text-zinc-500 max-w-sm mx-auto">
            Transactions signed offline or prepared while disconnected are held safely in sovereign IndexedDB storage until broadcast.
          </p>
          <button
            onClick={() => handleCreateSampleTx('sol')}
            className="px-4 py-2 rounded-none bg-black text-white hover:opacity-90 text-xs font-sans font-black uppercase tracking-wider inline-flex items-center gap-2 border border-black transition cursor-pointer"
          >
            <PlusCircle className="h-4 w-4" />
            <span>CREATE SAMPLE OFFLINE TRANSACTION</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {txs.map((tx) => {
            const isExpired = isDotTxExpired(tx);
            const isSigned = tx.signatures.length > 0;

            return (
              <div 
                key={tx.tx_id}
                className="bg-[#FFFFFF] border border-black rounded-none p-4 space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-black/10 pb-3">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-none font-bold bg-black text-white border border-black">
                      {tx.chain}
                    </span>
                    <span className="font-mono text-xs font-bold text-black">
                      {tx.tx_id.slice(0, 10)}...{tx.tx_id.slice(-8)}
                    </span>
                    <span className="text-[11px] font-mono text-zinc-500">
                      NET: {tx.network_id}
                    </span>
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center gap-2">
                    {tx.status === 'queued' && (
                      <span className="flex items-center gap-1 text-[10px] font-mono uppercase text-black bg-[#F7F7F7] border border-black px-2 py-0.5 rounded-none font-bold">
                        <Clock className="h-3 w-3" />
                        QUEUED
                      </span>
                    )}
                    {tx.status === 'broadcasting' && (
                      <span className="flex items-center gap-1 text-[10px] font-mono uppercase text-black bg-[#F7F7F7] border border-black px-2 py-0.5 rounded-none font-bold">
                        <RefreshCw className="h-3 w-3 animate-spin" />
                        BROADCASTING
                      </span>
                    )}
                    {tx.status === 'broadcast' && (
                      <span className="flex items-center gap-1 text-[10px] font-mono uppercase text-white bg-black border border-black px-2 py-0.5 rounded-none font-bold">
                        <CheckCircle2 className="h-3 w-3" />
                        BROADCAST
                      </span>
                    )}
                    {tx.status === 'confirmed' && (
                      <span className="flex items-center gap-1 text-[10px] font-mono uppercase text-white bg-black border border-black px-2 py-0.5 rounded-none font-bold">
                        <CheckCircle2 className="h-3 w-3" />
                        CONFIRMED
                      </span>
                    )}
                    {tx.status === 'expired' && (
                      <span className="flex items-center gap-1 text-[10px] font-mono uppercase text-zinc-500 bg-[#F7F7F7] border border-black px-2 py-0.5 rounded-none font-bold line-through">
                        <XCircle className="h-3 w-3" />
                        EXPIRED
                      </span>
                    )}

                    <span className={`text-[10px] px-2 py-0.5 rounded-none font-mono uppercase font-bold border ${
                      isSigned ? 'bg-black text-white border-black' : 'bg-white text-zinc-500 border-black/20'
                    }`}>
                      {isSigned ? 'SIGNED' : 'UNSIGNED'}
                    </span>
                  </div>
                </div>

                {/* Intent Details */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-2.5 rounded-none bg-[#F7F7F7] border border-black/10">
                    <span className="text-zinc-500 font-mono uppercase text-[10px] font-bold">TRANSFER AMOUNT</span>
                    <p className="font-mono font-bold text-black mt-0.5">
                      {tx.decoded_intent.amount} {tx.decoded_intent.symbol}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-none bg-[#F7F7F7] border border-black/10 sm:col-span-2 truncate">
                    <span className="text-zinc-500 font-mono uppercase text-[10px] font-bold">RECIPIENT</span>
                    <p className="font-mono text-black mt-0.5 truncate text-xs" title={tx.decoded_intent.to}>
                      {tx.decoded_intent.to}
                    </p>
                  </div>
                </div>

                {/* Broadcast hash and live explorer link */}
                {tx.broadcast_hash && (
                  <div className="text-[11px] font-mono text-black bg-[#F7F7F7] p-2.5 rounded-none border border-black flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 truncate">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span className="truncate font-bold">TX SIGNATURE: {tx.broadcast_hash}</span>
                    </div>
                    {tx.chain === 'sol' ? (
                      <a
                        href={`https://solscan.io/tx/${tx.broadcast_hash}${
                          (activeNetwork || '').toLowerCase().includes('devnet')
                            ? '?cluster=devnet'
                            : (activeNetwork || '').toLowerCase().includes('testnet')
                            ? '?cluster=testnet'
                            : ''
                        }`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-black hover:underline font-bold uppercase shrink-0"
                      >
                        <span>VIEW ON SOLSCAN</span>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    ) : (
                      <span className="text-[10px] text-zinc-500 uppercase">{tx.chain} MEMPOOL</span>
                    )}
                  </div>
                )}

                {tx.error && (
                  <div className="text-[11px] font-mono text-red-600 bg-red-50 p-2.5 rounded-none border border-red-500 flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-600 shrink-0" />
                    <span className="truncate font-bold">ERROR: {tx.error}</span>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex items-center justify-between pt-1 border-t border-black/10">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenAirGapAction(tx, 'export_unsigned')}
                      className="px-3 py-1.5 rounded-none bg-white hover:bg-black hover:text-white text-black text-xs font-sans font-black uppercase tracking-wider border border-black flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <QrCode className="h-3.5 w-3.5" />
                      <span>AIR-GAP QR</span>
                    </button>
                    {!isSigned && (
                      <button
                        onClick={() => handleOpenAirGapAction(tx, 'offline_sign')}
                        className="px-3 py-1.5 rounded-none bg-[#F7F7F7] hover:bg-black hover:text-white text-black border border-black text-xs font-sans font-black uppercase tracking-wider transition cursor-pointer"
                      >
                        <span>SIGN OFFLINE</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {(tx.status === 'queued' || tx.status === 'broadcasting') && (
                      <button
                        onClick={() => handleBroadcast(tx)}
                        disabled={broadcastingId === tx.tx_id || isExpired}
                        className="px-3.5 py-1.5 rounded-none bg-black hover:opacity-90 text-white text-xs font-sans font-black uppercase tracking-wider flex items-center gap-1.5 disabled:opacity-40 border border-black transition cursor-pointer"
                      >
                        <Send className="h-3.5 w-3.5" />
                        <span>BROADCAST</span>
                      </button>
                    )}
                    <button
                      onClick={() => removeTx(tx.tx_id)}
                      className="p-1.5 rounded-none text-zinc-500 hover:text-black hover:bg-black/5 border border-transparent hover:border-black transition cursor-pointer"
                      title="Delete from Queue"
                      aria-label="Delete from Queue"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          <div className="flex justify-end pt-2">
            <button
              onClick={() => clearQueue()}
              className="text-xs font-mono uppercase text-zinc-500 hover:text-black flex items-center gap-1 transition cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>CLEAR ENTIRE QUEUE</span>
            </button>
          </div>
        </div>
      )}

      {/* AirGap Modal Component (only rendered if not embedded to avoid modal inception) */}
      {!isEmbedded && (
        <AirGapModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          initialTx={selectedTx}
          mode={modalMode}
          onTxEnqueued={() => {
            getAllTxs().then(setTxs);
          }}
        />
      )}
    </div>
  );
}
