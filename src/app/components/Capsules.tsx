import React, { useState, useEffect } from 'react';
import { Badge, Button } from './ui/Library';
import { Search, Layers, Download, Calendar, ShieldCheck, Lock, Minimize2, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { listCapsules, sealCapsule, verifyCapsule, downloadCapsule, getStatus } from '../../api/client';
import { ChevronLeft, ChevronRight } from 'lucide-react';

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 ** 3)).toFixed(1)} GB`;
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 ** 2)).toFixed(1)} MB`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

function formatStorageMB(mb: number): string {
  if (mb >= 1024 * 1024) return `${(mb / (1024 * 1024)).toFixed(1)} TB`;
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
  return `${mb.toFixed(1)} MB`;
}

interface CapsuleItem {
  capsule_id: string;
  event_count: number;
  sealed_at: string;
  size_bytes: number;
  file_sha256: string;
}

interface CapsulesProps {
  onSelectCapsule: (id: string) => void;
}

const PAGE_SIZE = 50;

export const Capsules: React.FC<CapsulesProps> = ({ onSelectCapsule }) => {
  const [capsules, setCapsules] = useState<CapsuleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSealing, setIsSealing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const [totalStorageMB, setTotalStorageMB] = useState(0);
  const [page, setPage] = useState(0);

  const fetchCapsules = async (pageNum: number = page) => {
    const [capsRes, statusRes] = await Promise.all([
      listCapsules(PAGE_SIZE, pageNum * PAGE_SIZE),
      pageNum === 0 ? getStatus() : Promise.resolve(null),
    ]);
    if (capsRes.ok && capsRes.data) {
      setCapsules(capsRes.data.capsules);
      setTotalCount(capsRes.data.total);
    }
    if (statusRes && 'ok' in statusRes && statusRes.ok && statusRes.data) {
      setTotalStorageMB(parseFloat(statusRes.data.total_storage_mb || '0'));
    }
    setLoading(false);
  };

  useEffect(() => { fetchCapsules(0); }, []);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    setLoading(true);
    fetchCapsules(newPage);
  };

  const handleSealBuffer = async () => {
    setIsSealing(true);
    const res = await sealCapsule(true);
    setIsSealing(false);
    if (res.ok && res.data) {
      const d = res.data as any;
      if (d.status === 'sealed') {
        toast.success(`Sealed capsule ${d.capsule_id?.slice(0, 8)}...`);
        fetchCapsules();
      } else {
        toast.info(d.message || 'Nothing to seal');
      }
    } else {
      toast.error(res.error || 'Seal failed');
    }
  };

  const handleVerify = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    toast.info(`Verifying ${id.slice(0, 12)}...`);
    const res = await verifyCapsule(id);
    if (res.ok && res.data) {
      if (res.data.integrity) {
        toast.success(`${id.slice(0, 12)}... integrity verified`);
      } else {
        toast.error(`${id.slice(0, 12)}... INTEGRITY FAILED`);
      }
    } else {
      toast.error(res.error || 'Verification failed');
    }
  };

  const handleDownload = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    toast.info(`Downloading ${id.slice(0, 12)}...`);
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

  const filtered = capsules.filter(c => c.capsule_id.toLowerCase().includes(searchTerm.toLowerCase()));
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-app-teal-accent/30 border-t-app-teal-accent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h1 className="text-2xl md:text-4xl font-bold tracking-tight">Capsule Vault</h1>
          <p className="mt-2 text-sm md:text-base">Sealed forensic capsules from <code className="text-app-teal-accent/60 bg-app-teal-accent/5 px-1.5 py-0.5 rounded text-[11px]">GET /api/v1/capsules</code></p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleSealBuffer} disabled={isSealing} size="sm">
            {isSealing ? (<><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full" /> Sealing...</>) : (<><Lock size={16} /> Seal Evidence Now</>)}
          </Button>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search IDs..." className="bg-app-surface border border-app-border rounded-xl pl-10 pr-4 py-2 text-sm text-app-text-primary focus:outline-none focus:border-app-teal-accent/50 w-full md:w-64" />
          </div>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="relative overflow-hidden rounded-2xl border border-app-teal-accent/20 bg-app-teal-accent/[0.04] p-5 md:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-xl bg-app-teal-accent/10 border border-app-teal-accent/20">
              <Minimize2 className="w-5 h-5 md:w-6 md:h-6 text-app-teal-accent" />
            </div>
            <div>
              <p className="text-[10px] md:text-[11px] font-bold text-app-teal-accent uppercase tracking-widest flex items-center gap-1.5"><CheckCircle2 size={12} /> Capsule Storage</p>
            </div>
          </div>
          <div className="flex items-baseline gap-3 sm:gap-6">
            <div>
              <span className="text-3xl md:text-5xl font-bold text-white font-mono tracking-tight">{totalCount.toLocaleString()}</span>
              <span className="text-sm md:text-base text-zinc-500 ml-2">capsules</span>
            </div>
            <div className="h-8 w-px bg-zinc-800 hidden sm:block" />
            <div className="hidden sm:block">
              <span className="text-2xl md:text-3xl font-bold text-app-teal-accent font-mono">{formatStorageMB(totalStorageMB)}</span>
              <span className="text-sm text-zinc-500 ml-2">total</span>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="hidden lg:block bg-app-surface border border-app-border rounded-2xl overflow-hidden card-shadow">
        <table className="w-full text-left">
          <thead className="bg-app-surface-2 border-b border-app-border">
            <tr>
              <th className="px-8 py-6 text-[11px] font-bold text-app-text-secondary uppercase tracking-[0.2em]">Capsule ID</th>
              <th className="px-8 py-6 text-[11px] font-bold text-app-text-secondary uppercase tracking-[0.2em]">Sealed At</th>
              <th className="px-8 py-6 text-[11px] font-bold text-app-text-secondary uppercase tracking-[0.2em] text-center">Events</th>
              <th className="px-8 py-6 text-[11px] font-bold text-app-text-secondary uppercase tracking-[0.2em] text-right">Size</th>
              <th className="px-8 py-6 text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-app-border/30">
            {filtered.map((capsule) => (
              <tr key={capsule.capsule_id} onClick={() => onSelectCapsule(capsule.capsule_id)} className="group hover:bg-white/[0.03] cursor-pointer transition-colors">
                <td className="px-8 py-6"><div className="flex items-center gap-4"><Layers size={18} className="text-zinc-600 group-hover:text-app-teal-accent transition-colors" /><span className="font-mono font-bold text-sm text-zinc-300 group-hover:text-white transition-colors">{capsule.capsule_id.slice(0, 12)}...</span></div></td>
                <td className="px-8 py-6 text-[13px] text-app-text-secondary"><div className="flex items-center gap-2.5"><Calendar size={14} className="opacity-50" /> {new Date(capsule.sealed_at).toLocaleString()}</div></td>
                <td className="px-8 py-6 text-center font-mono text-[13px] text-zinc-400">{capsule.event_count.toLocaleString()}</td>
                <td className="px-8 py-6 text-right font-mono text-[13px] text-zinc-300">{formatBytes(capsule.size_bytes)}</td>
                <td className="px-8 py-6 text-right">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => handleVerify(capsule.capsule_id, e)} className="p-2.5 text-zinc-500 hover:text-app-teal-accent hover:bg-app-teal-accent/10 rounded-lg transition-all" title="Verify integrity"><ShieldCheck size={16} /></button>
                    <button onClick={(e) => handleDownload(capsule.capsule_id, e)} className="p-2.5 text-zinc-500 hover:text-app-teal-accent hover:bg-app-teal-accent/10 rounded-lg transition-all" title="Download"><Download size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="py-12 text-center text-zinc-600">No capsules found</div>}
      </div>

      <div className="lg:hidden space-y-4">
        {filtered.map((capsule) => (
          <motion.div key={capsule.capsule_id} whileTap={{ scale: 0.98 }} onClick={() => onSelectCapsule(capsule.capsule_id)} className="bg-app-surface border border-app-border rounded-2xl p-6 space-y-5">
            <div className="flex justify-between items-start">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-2xl bg-app-surface-2 border border-app-border flex items-center justify-center text-app-teal-accent shadow-inner"><Layers size={24} /></div>
                <div>
                  <h3 className="font-mono text-base font-bold text-white">{capsule.capsule_id.slice(0, 12)}...</h3>
                  <p className="text-[11px] font-mono mt-1 text-zinc-500">{new Date(capsule.sealed_at).toLocaleString()}</p>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold text-zinc-500">{capsule.event_count.toLocaleString()} events</span>
            </div>
            <div className="grid grid-cols-2 gap-3 py-3 border-t border-app-border/30">
              <div><p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Size</p><p className="text-sm font-mono text-zinc-300 mt-0.5">{formatBytes(capsule.size_bytes)}</p></div>
              <div><p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Events</p><p className="text-sm font-mono text-zinc-300 mt-0.5">{capsule.event_count.toLocaleString()}</p></div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={(e) => handleVerify(capsule.capsule_id, e)} className="p-2 text-zinc-500 hover:text-app-teal-accent rounded-lg transition-all"><ShieldCheck size={16} /></button>
              <button onClick={(e) => handleDownload(capsule.capsule_id, e)} className="p-2 text-zinc-500 hover:text-app-teal-accent rounded-lg transition-all"><Download size={16} /></button>
            </div>
          </motion.div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-zinc-500 font-mono">
            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, totalCount)} of {totalCount.toLocaleString()}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 0}
              className="p-2 rounded-lg bg-app-surface border border-app-border text-zinc-400 hover:text-white hover:border-zinc-600 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-mono text-zinc-500 px-2">
              {page + 1} / {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages - 1}
              className="p-2 rounded-lg bg-app-surface border border-app-border text-zinc-400 hover:text-white hover:border-zinc-600 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
