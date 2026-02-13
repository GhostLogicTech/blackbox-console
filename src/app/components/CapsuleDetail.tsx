import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ShieldCheck,
  Clock,
  HardDrive,
  CheckCircle2,
  Download,
  Lock,
  RefreshCw,
  XCircle
} from 'lucide-react';
import { motion } from 'motion/react';
import { HashDisplay } from './HashDisplay';
import { getCapsule, verifyCapsule, downloadCapsule, hasTenantKey } from '../../api/client';
import { toast } from 'sonner';

interface CapsuleDetailProps {
  id: string;
  onBack: () => void;
}

export const CapsuleDetail: React.FC<CapsuleDetailProps> = ({ id, onBack }) => {
  const [manifest, setManifest] = useState<any>(null);
  const [verification, setVerification] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (!hasTenantKey()) { setLoading(false); return; }
    getCapsule(id).then(res => {
      if (res.ok) setManifest(res.data);
      else toast.error(res.error || 'Failed to load capsule');
      setLoading(false);
    });
  }, [id]);

  const handleVerify = async () => {
    setVerifying(true);
    const res = await verifyCapsule(id);
    setVerifying(false);
    if (res.ok) {
      setVerification(res.data);
      if (res.data!.integrity) toast.success('Integrity verified');
      else toast.error('Integrity check FAILED');
    } else {
      toast.error(res.error || 'Verification failed');
    }
  };

  const handleDownload = async () => {
    toast.info('Downloading...');
    const blob = await downloadCapsule(id);
    if (blob) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${id}.glcf.gz`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Downloaded');
    } else {
      toast.error('Download failed');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="w-8 h-8 text-zinc-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="flex items-center gap-4 flex-wrap">
        <button onClick={onBack} className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 transition-all">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl md:text-3xl font-bold text-white font-mono truncate">{id}</h1>
          <p className="text-zinc-500 text-sm mt-1">Forensic Capsule Detail & Integrity</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleDownload} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800 text-white font-bold text-sm border border-zinc-700 hover:bg-zinc-700 transition-all">
            <Download size={16} /> Download
          </button>
          <button
            onClick={handleVerify}
            disabled={verifying}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-500 text-black font-bold text-sm hover:bg-teal-400 transition-all shadow-[0_0_20px_rgba(45,212,191,0.2)] disabled:opacity-50"
          >
            {verifying ? <RefreshCw size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
            Verify Integrity
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Integrity Section */}
          <section className="p-6 rounded-2xl bg-[#121214] border border-zinc-800 space-y-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Lock className="w-5 h-5 text-teal-400" /> Cryptographic Integrity
            </h3>
            {manifest?.hashes ? (
              <div className="space-y-4">
                <HashDisplay label="Content SHA-256" hash={manifest.hashes.content_sha256} verified={verification?.content_integrity} />
                <HashDisplay label="File SHA-256" hash={manifest.hashes.file_sha256} verified={verification?.file_integrity} />
              </div>
            ) : (
              <p className="text-zinc-500 text-sm">No hash data available.</p>
            )}

            {verification && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div className={`p-4 rounded-xl flex items-center gap-4 ${verification.integrity ? 'bg-teal-500/5 border border-teal-500/10' : 'bg-red-500/5 border border-red-500/10'}`}>
                  {verification.integrity ? <CheckCircle2 className="w-8 h-8 text-teal-500" /> : <XCircle className="w-8 h-8 text-red-500" />}
                  <div>
                    <p className="text-[10px] text-zinc-500 uppercase font-bold">Verification</p>
                    <p className={`text-sm font-bold uppercase ${verification.integrity ? 'text-teal-400' : 'text-red-400'}`}>
                      {verification.integrity ? 'Passed' : 'FAILED'}
                    </p>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center gap-4">
                  <HardDrive className="w-8 h-8 text-zinc-500" />
                  <div>
                    <p className="text-[10px] text-zinc-500 uppercase font-bold">On-Disk Size</p>
                    <p className="text-sm font-bold text-zinc-200">{verification.size_bytes?.toLocaleString()} bytes</p>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Sizes */}
          {manifest?.sizes && (
            <section className="p-6 rounded-2xl bg-[#121214] border border-zinc-800">
              <h3 className="text-lg font-bold text-white mb-6">Size Breakdown</h3>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-zinc-800/50">
                  <span className="text-sm text-zinc-500">Raw JSON</span>
                  <span className="font-mono text-sm text-zinc-200">{manifest.sizes.raw_json_bytes?.toLocaleString()} bytes</span>
                </div>
                <div className="flex justify-between py-2 border-b border-zinc-800/50">
                  <span className="text-sm text-zinc-500">Binary (GLCF)</span>
                  <span className="font-mono text-sm text-zinc-200">{manifest.sizes.binary_bytes?.toLocaleString()} bytes</span>
                </div>
                <div className="flex justify-between py-2 border-b border-zinc-800/50">
                  <span className="text-sm text-zinc-500">Compressed (.gz)</span>
                  <span className="font-mono text-sm text-zinc-200">{manifest.sizes.compressed_bytes?.toLocaleString()} bytes</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-sm text-zinc-500">Compression Ratio</span>
                  <span className="font-mono text-sm text-teal-400 font-bold">{manifest.sizes.compression_ratio}</span>
                </div>
              </div>
            </section>
          )}
        </div>

        <div className="space-y-8">
          <section className="p-6 rounded-2xl bg-[#121214] border border-zinc-800">
            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-6">Technical Specs</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-zinc-800/50">
                <span className="flex items-center gap-2 text-sm text-zinc-500"><Clock size={14} /> Sealed At</span>
                <span className="font-mono text-xs text-zinc-300">{manifest?.sealed_at ? new Date(manifest.sealed_at).toLocaleString() : '—'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-zinc-800/50">
                <span className="flex items-center gap-2 text-sm text-zinc-500"><HardDrive size={14} /> Compressed</span>
                <span className="font-mono text-sm text-white font-bold">{manifest?.sizes?.compressed_bytes?.toLocaleString() || '—'} B</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-zinc-800/50">
                <span className="text-sm text-zinc-500">Event Count</span>
                <span className="font-mono text-sm text-white font-bold">{manifest?.event_count?.toLocaleString() || '—'}</span>
              </div>
              {manifest?.time_start && (
                <div className="flex justify-between items-center py-2 border-b border-zinc-800/50">
                  <span className="text-sm text-zinc-500">Time Range</span>
                  <span className="font-mono text-[10px] text-zinc-400">
                    {new Date(manifest.time_start).toLocaleTimeString()} - {new Date(manifest.time_end).toLocaleTimeString()}
                  </span>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
