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
  subscribeToQueue 
} from '../../lib/offline/queue';
import { AirGapModal } from './AirGapModal';

export function QueueViewer() {
  const [txs, setTxs] = useState<DotTx[]>([]);
  const [selectedTx, setSelectedTx] = useState<DotTx | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'export_unsigned' | 'offline_sign' | 'import_signed'>('export_unsigned');
  const [broadcastingId, setBroadcastingId] = useState<string | null>(null);

  useEffect(() => {
    // Initial fetch & subscribe
    const unsubscribe = subscribeToQueue((updatedTxs) => {
      setTxs(updatedTxs);
    });

    const handleCustomOpen = () => {
      // If triggered by online sync
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
        network_id: 'mainnet-beta',
        unsigned_payload: 'AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA...sample_sol_tx',
        decoded_intent: {
          to: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
          from: '6vZh5wgHqmS4o7UKPREhmB4ekxAjQ3ARjAJumbQD1eEE',
          amount: '12.5',
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
    await updateTxStatus(tx.tx_id, 'broadcasting');

    // Simulate network broadcast
    setTimeout(async () => {
      const randomBytes = new Uint8Array(8);
      crypto.getRandomValues(randomBytes);
      const hex = Array.from(randomBytes).map((b) => b.toString(16).padStart(2, '0')).join('');
      const mockHash = `0xhash_${Date.now()}_${hex}`;
      await updateTxStatus(tx.tx_id, 'broadcast', { broadcast_hash: mockHash });
      setBroadcastingId(null);
    }, 1500);
  };

  const openAirGap = (tx: DotTx, mode: 'export_unsigned' | 'offline_sign' | 'import_signed') => {
    setSelectedTx(tx);
    setModalMode(mode);
    setModalOpen(true);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 backdrop-blur-md">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Layers className="h-5 w-5 text-amber-400" />
            Offline Broadcast Queue
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300">
              {txs.length} total
            </span>
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            IndexedDB persistent queue with deterministic deduplication & auto-sync.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => handleCreateSampleTx('evm')}
            className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 flex items-center gap-1.5 transition"
          >
            <PlusCircle className="h-3.5 w-3.5 text-blue-400" />
            + EVM Tx
          </button>
          <button
            onClick={() => handleCreateSampleTx('sol')}
            className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 flex items-center gap-1.5 transition"
          >
            <PlusCircle className="h-3.5 w-3.5 text-purple-400" />
            + SOL Tx (Expiring)
          </button>
          <button
            onClick={() => handleCreateSampleTx('btc')}
            className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 flex items-center gap-1.5 transition"
          >
            <PlusCircle className="h-3.5 w-3.5 text-orange-400" />
            + BTC Tx
          </button>
          <button
            onClick={() => {
              setSelectedTx(null);
              setModalMode('offline_sign');
              setModalOpen(true);
            }}
            className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold flex items-center gap-1.5 transition shadow-lg shadow-amber-500/10"
          >
            <QrCode className="h-3.5 w-3.5" />
            Air-Gap Relay
          </button>
        </div>
      </div>

      {/* Transaction List */}
      {txs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-800 p-12 text-center space-y-3 bg-zinc-950/40">
          <Layers className="h-10 w-10 text-zinc-600 mx-auto" />
          <h3 className="text-sm font-semibold text-zinc-300">Transaction Queue is Empty</h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            Transactions signed offline or prepared while disconnected are held safely in your browser&apos;s IndexedDB until broadcast.
          </p>
          <button
            onClick={() => handleCreateSampleTx('evm')}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 inline-flex items-center gap-2"
          >
            <PlusCircle className="h-4 w-4 text-amber-400" />
            Create Sample Offline Transaction
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
                className="bg-zinc-900/40 border border-zinc-800/80 hover:border-zinc-700 rounded-2xl p-4 transition space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800/60 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-md font-bold ${
                      tx.chain === 'evm' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                      tx.chain === 'sol' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                      'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                    }`}>
                      {tx.chain}
                    </span>
                    <span className="font-mono text-xs font-semibold text-zinc-300">
                      {tx.tx_id.slice(0, 10)}...{tx.tx_id.slice(-8)}
                    </span>
                    <span className="text-[11px] text-zinc-500">
                      Net: {tx.network_id}
                    </span>
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center gap-2">
                    {tx.status === 'queued' && (
                      <span className="flex items-center gap-1 text-[11px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full font-medium">
                        <Clock className="h-3 w-3" />
                        Queued
                      </span>
                    )}
                    {tx.status === 'broadcasting' && (
                      <span className="flex items-center gap-1 text-[11px] text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full font-medium">
                        <RefreshCw className="h-3 w-3 animate-spin" />
                        Broadcasting
                      </span>
                    )}
                    {tx.status === 'broadcast' && (
                      <span className="flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-medium">
                        <CheckCircle2 className="h-3 w-3" />
                        Broadcast
                      </span>
                    )}
                    {tx.status === 'expired' && (
                      <span className="flex items-center gap-1 text-[11px] text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full font-medium">
                        <XCircle className="h-3 w-3" />
                        Expired
                      </span>
                    )}

                    <span className={`text-[10px] px-2 py-0.5 rounded-md font-mono ${
                      isSigned ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-800 text-zinc-400'
                    }`}>
                      {isSigned ? 'Signed' : 'Unsigned'}
                    </span>
                  </div>
                </div>

                {/* Intent Details */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-2.5 rounded-xl bg-black/40 border border-zinc-800/60">
                    <span className="text-zinc-500 text-[11px]">Transfer Amount</span>
                    <p className="font-mono font-bold text-white mt-0.5">
                      {tx.decoded_intent.amount} {tx.decoded_intent.symbol}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-black/40 border border-zinc-800/60 sm:col-span-2 truncate">
                    <span className="text-zinc-500 text-[11px]">Recipient</span>
                    <p className="font-mono text-zinc-300 mt-0.5 truncate" title={tx.decoded_intent.to}>
                      {tx.decoded_intent.to}
                    </p>
                  </div>
                </div>

                {/* Broadcast hash or expiration details */}
                {tx.broadcast_hash && (
                  <div className="text-[11px] font-mono text-emerald-400/90 bg-emerald-500/5 p-2 rounded-lg border border-emerald-500/10 flex items-center justify-between">
                    <span>Mempool Hash: {tx.broadcast_hash}</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openAirGap(tx, 'export_unsigned')}
                      className="px-3 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold flex items-center gap-1.5"
                    >
                      <QrCode className="h-3.5 w-3.5 text-amber-400" />
                      Air-Gap QR
                    </button>
                    {!isSigned && (
                      <button
                        onClick={() => openAirGap(tx, 'offline_sign')}
                        className="px-3 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 text-xs font-semibold"
                      >
                        Sign Offline
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {tx.status === 'queued' && (
                      <button
                        onClick={() => handleSimulateBroadcast(tx)}
                        disabled={broadcastingId === tx.tx_id || isExpired}
                        className="px-3.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold flex items-center gap-1.5 disabled:opacity-40"
                      >
                        <Send className="h-3.5 w-3.5" />
                        Broadcast
                      </button>
                    )}
                    <button
                      onClick={() => removeTx(tx.tx_id)}
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10"
                      title="Delete from Queue"
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
              className="text-xs text-zinc-500 hover:text-red-400 flex items-center gap-1 transition"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear Entire Queue
            </button>
          </div>
        </div>
      )}

      {/* AirGap Modal Component */}
      <AirGapModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        initialTx={selectedTx}
        mode={modalMode}
        onTxEnqueued={() => {
          getAllTxs().then(setTxs);
        }}
      />
    </div>
  );
}
