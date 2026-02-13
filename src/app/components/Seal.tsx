import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, HardDrive, Clock, AlertTriangle, Layers, Hammer } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { HashDisplay } from './HashDisplay';
import { toast } from 'sonner';
import { sealCapsule, getStatus, hasTenantKey } from '../../api/client';

export const Seal: React.FC = () => {
  const [isSealing, setIsSealing] = useState(false);
  const [isSealed, setIsSealed] = useState(false);
  const [capsuleData, setCapsuleData] = useState<any>(null);
  const [bufferInfo, setBufferInfo] = useState<{ events: number } | null>(null);

  useEffect(() => {
    if (hasTenantKey()) {
      getStatus().then(res => {
        if (res.ok && res.data) {
          setBufferInfo({ events: res.data.buffer_events });
        }
      });
    }
  }, []);

  const handleSeal = async () => {
    if (!hasTenantKey()) {
      toast.error('No tenant API key. Set one in Settings first.');
      return;
    }

    setIsSealing(true);
    const res = await sealCapsule(true);
    setIsSealing(false);

    if (res.ok && res.data) {
      const data = res.data as any;
      if (data.status === 'empty') {
        toast.error('No events in buffer to seal.');
        return;
      }
      setIsSealed(true);
      setCapsuleData(data);
      toast.success('Capsule sealed and stored');
    } else {
      toast.error(res.error || 'Seal failed');
    }
  };

  const handleReset = () => {
    setIsSealed(false);
    setCapsuleData(null);
    if (hasTenantKey()) {
      getStatus().then(res => {
        if (res.ok && res.data) setBufferInfo({ events: res.data.buffer_events });
      });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div>
        <h1 className="text-4xl font-bold text-white tracking-tight">Seal Capsule</h1>
        <p className="text-zinc-500 mt-2">Finalize current batch of events into an immutable forensic capsule via POST /api/v1/seal.</p>
      </div>

      {!hasTenantKey() && (
        <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 flex gap-3 items-center">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
          <p className="text-sm text-amber-500/80">No tenant API key. Set one in <span className="font-bold">Settings</span>.</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="p-6 rounded-2xl bg-[#121214] border border-zinc-800">
            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-6">Pending Buffer</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-zinc-800/50">
                <span className="text-sm text-zinc-500">Events in Buffer</span>
                <span className="font-mono text-white font-bold">{bufferInfo ? bufferInfo.events.toLocaleString() : '—'}</span>
              </div>
            </div>
            <div className="mt-8 p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 flex gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
              <p className="text-[10px] text-amber-500/80 leading-relaxed font-medium">
                Once sealed, these events cannot be modified or deleted.
              </p>
            </div>
          </div>

          {!isSealed && (
            <button
              onClick={handleSeal}
              disabled={isSealing || !hasTenantKey()}
              className="w-full flex items-center justify-center gap-3 px-6 py-5 rounded-2xl bg-white text-black font-bold hover:bg-zinc-200 transition-all shadow-[0_0_40px_rgba(255,255,255,0.1)] disabled:opacity-50 group overflow-hidden relative"
            >
              <AnimatePresence mode="wait">
                {isSealing ? (
                  <motion.div key="sealing" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="flex items-center gap-2">
                    <Hammer className="w-5 h-5 animate-bounce" /> Sealing...
                  </motion.div>
                ) : (
                  <motion.div key="seal" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="flex items-center gap-2">
                    <Lock className="w-5 h-5 group-hover:scale-110 transition-transform" /> Seal Buffer
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          )}

          {isSealed && (
            <button onClick={handleReset} className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-zinc-800 text-white font-bold hover:bg-zinc-700 transition-all">
              Seal Another
            </button>
          )}
        </div>

        <div className="lg:col-span-2 relative">
          <div className="h-full min-h-[500px] rounded-2xl bg-[#09090b] border border-zinc-800 flex flex-col items-center justify-center p-12 overflow-hidden relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-from)_0%,_transparent_70%)] from-teal-500/5 pointer-events-none" />

            {!isSealing && !isSealed && (
              <div className="text-center space-y-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto relative z-10">
                    <Layers className="w-10 h-10 text-zinc-700" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="text-xl font-bold text-white">Ready for Sealing</h4>
                  <p className="text-sm text-zinc-600 max-w-xs mx-auto">Click the seal button to generate an immutable forensic capsule with cryptographic proof.</p>
                </div>
              </div>
            )}

            {isSealing && (
              <div className="text-center space-y-12 w-full max-w-sm">
                <div className="relative flex justify-center">
                  <motion.div animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 180, 270, 360] }} transition={{ repeat: Infinity, duration: 4, ease: "linear" }} className="w-32 h-32 rounded-3xl border-2 border-teal-500/30 border-dashed" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <ShieldCheck className="w-12 h-12 text-teal-400 animate-pulse" />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="w-full bg-zinc-900 h-1 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ duration: 3 }} className="h-full bg-teal-500 shadow-[0_0_10px_rgba(45,212,191,1)]" />
                  </div>
                  <div className="flex justify-between text-[10px] font-mono uppercase tracking-widest text-zinc-500">
                    <span>Sealing Capsule</span>
                  </div>
                </div>
              </div>
            )}

            {isSealed && capsuleData && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full space-y-8">
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 rounded-full bg-teal-500 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(45,212,191,0.5)] mb-4">
                    <ShieldCheck className="w-8 h-8 text-black" />
                  </div>
                  <h4 className="text-2xl font-bold text-white uppercase tracking-tight">Capsule Sealed</h4>
                  <p className="text-xs font-mono text-teal-500 tracking-[0.2em]">{capsuleData.capsule_id}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <HashDisplay label="Content SHA-256" hash={capsuleData.hashes?.content_sha256 || '—'} verified />
                    <HashDisplay label="File SHA-256" hash={capsuleData.hashes?.file_sha256 || '—'} />
                  </div>
                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 flex flex-col justify-center gap-4">
                    <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4 text-zinc-500" />
                      <div>
                        <p className="text-[10px] text-zinc-500 uppercase font-bold">Sealed At</p>
                        <p className="text-sm font-mono text-zinc-200">{capsuleData.sealed_at}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <HardDrive className="w-4 h-4 text-zinc-500" />
                      <div>
                        <p className="text-[10px] text-zinc-500 uppercase font-bold">Events / Size</p>
                        <p className="text-sm font-mono text-zinc-200">{capsuleData.event_count} events / {capsuleData.sizes?.compressed_bytes || '—'} bytes</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
