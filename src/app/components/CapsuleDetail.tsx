import React, { useState, useEffect } from 'react';
import { ArrowLeft, ShieldCheck, Download, Calendar, Layers, Hash, Clock, FileText } from 'lucide-react';
import { motion } from 'motion/react';
import { Button, Badge, cn } from './ui/Library';
import { HashDisplay } from './HashDisplay';
import { toast } from 'sonner';
import { getCapsule, verifyCapsule, downloadCapsule } from '../../api/client';

interface CapsuleDetailProps {
  id: string;
  onBack: () => void;
}

export const CapsuleDetail: React.FC<CapsuleDetailProps> = ({ id, onBack }) => {
  const [capsule, setCapsule] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [verifyResult, setVerifyResult] = useState<any>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const res = await getCapsule(id);
      if (res.ok && res.data) setCapsule(res.data);
      setLoading(false);
    };
    fetch();
  }, [id]);

  const handleVerify = async () => {
    setIsVerifying(true);
    const res = await verifyCapsule(id);
    if (res.ok && res.data) {
      setVerifyResult(res.data);
      if (res.data.integrity) {
        toast.success('Integrity verified');
      } else {
        toast.error('INTEGRITY CHECK FAILED');
      }
    } else {
      toast.error(res.error || 'Verification failed');
    }
    setIsVerifying(false);
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
      toast.success('Download complete');
    } else {
      toast.error('Download failed');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-app-teal-accent/30 border-t-app-teal-accent rounded-full animate-spin" />
      </div>
    );
  }

  if (!capsule) {
    return (
      <div className="space-y-6">
        <button onClick={onBack} className="p-2.5 rounded-xl bg-app-surface-2 border border-app-border text-zinc-400 hover:text-white transition-all"><ArrowLeft size={18} /></button>
        <p className="text-zinc-500">Capsule not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-3 md:gap-4">
        <button onClick={onBack} className="p-2 md:p-2.5 rounded-xl bg-app-surface-2 border border-app-border text-zinc-400 hover:text-white hover:border-zinc-600 transition-all"><ArrowLeft size={18} /></button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="text-xl md:text-3xl font-bold text-white truncate font-mono">{capsule.capsule_id.slice(0, 16)}...</h1>
            {verifyResult && <Badge variant={verifyResult.integrity ? 'success' : 'danger'}>{verifyResult.integrity ? 'Verified' : 'Failed'}</Badge>}
          </div>
          <p className="text-xs md:text-sm font-mono text-zinc-500 mt-1">Sealed {new Date(capsule.sealed_at).toLocaleString()}</p>
        </div>
      </div>

      <div className="flex gap-3">
        <Button onClick={handleVerify} variant="secondary" disabled={isVerifying}><ShieldCheck size={16} /> {isVerifying ? 'Verifying...' : 'Verify Integrity'}</Button>
        <Button onClick={handleDownload} variant="secondary"><Download size={16} /> Download .glcf.gz</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-app-surface border border-app-border rounded-2xl p-6 card-shadow">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Events</p>
          <p className="text-2xl font-bold text-white font-mono">{capsule.event_count?.toLocaleString()}</p>
        </div>
        {capsule.sizes && (
          <>
            <div className="bg-app-surface border border-app-border rounded-2xl p-6 card-shadow">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Raw Size</p>
              <p className="text-2xl font-bold text-white font-mono">{formatBytes(capsule.sizes.raw_json_bytes)}</p>
            </div>
            <div className="bg-app-surface border border-app-border rounded-2xl p-6 card-shadow">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Compressed</p>
              <p className="text-2xl font-bold text-app-teal-accent font-mono">{formatBytes(capsule.sizes.compressed_bytes)}</p>
            </div>
            <div className="bg-app-surface border border-app-border rounded-2xl p-6 card-shadow">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Ratio</p>
              <p className="text-2xl font-bold text-app-teal-accent font-mono">{capsule.sizes.compression_ratio}</p>
            </div>
          </>
        )}
      </div>

      {capsule.time_start && capsule.time_end && (
        <div className="bg-app-surface border border-app-border rounded-2xl p-6 card-shadow">
          <h3 className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2"><Clock size={14} className="text-app-teal-accent" /> Time Range</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><p className="text-[10px] text-zinc-600 uppercase">Start</p><p className="text-sm font-mono text-zinc-300 mt-1">{new Date(capsule.time_start).toLocaleString()}</p></div>
            <div><p className="text-[10px] text-zinc-600 uppercase">End</p><p className="text-sm font-mono text-zinc-300 mt-1">{new Date(capsule.time_end).toLocaleString()}</p></div>
          </div>
        </div>
      )}

      {capsule.hashes && (
        <div className="bg-app-surface border border-app-border rounded-2xl p-6 card-shadow space-y-4">
          <h3 className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2"><Hash size={14} className="text-app-teal-accent" /> Integrity Hashes</h3>
          <div className="space-y-3">
            <div><p className="text-[10px] text-zinc-600 uppercase mb-1">Content SHA-256</p><HashDisplay hash={capsule.hashes.content_sha256} /></div>
            <div><p className="text-[10px] text-zinc-600 uppercase mb-1">File SHA-256</p><HashDisplay hash={capsule.hashes.file_sha256} /></div>
          </div>
        </div>
      )}

      {verifyResult && (
        <div className={cn("border rounded-2xl p-6 card-shadow", verifyResult.integrity ? "bg-app-teal-accent/5 border-app-teal-accent/20" : "bg-red-500/5 border-red-500/20")}>
          <h3 className="text-[11px] font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
            <ShieldCheck size={14} className={verifyResult.integrity ? "text-app-teal-accent" : "text-red-400"} />
            <span className={verifyResult.integrity ? "text-app-teal-accent" : "text-red-400"}>Verification Result</span>
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div><p className="text-[10px] text-zinc-600 uppercase">File Integrity</p><p className={cn("font-bold mt-1", verifyResult.file_integrity ? "text-app-teal-accent" : "text-red-400")}>{verifyResult.file_integrity ? 'PASS' : 'FAIL'}</p></div>
            {verifyResult.content_integrity !== undefined && <div><p className="text-[10px] text-zinc-600 uppercase">Content Integrity</p><p className={cn("font-bold mt-1", verifyResult.content_integrity ? "text-app-teal-accent" : "text-red-400")}>{verifyResult.content_integrity ? 'PASS' : 'FAIL'}</p></div>}
            <div><p className="text-[10px] text-zinc-600 uppercase">Overall</p><p className={cn("font-bold mt-1", verifyResult.integrity ? "text-app-teal-accent" : "text-red-400")}>{verifyResult.integrity ? 'VERIFIED' : 'FAILED'}</p></div>
          </div>
        </div>
      )}
    </div>
  );
};

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 ** 3)).toFixed(1)} GB`;
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 ** 2)).toFixed(1)} MB`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}
