import React, { useState, useEffect } from 'react';
import { Badge, Button, PanelCard } from './ui/Library';
import { Search, Layers, Download, Calendar, RefreshCw, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';
import { listCapsules, downloadCapsule, hasTenantKey } from '../../api/client';
import { toast } from 'sonner';

interface CapsulesProps {
  onSelectCapsule: (id: string) => void;
}

export const Capsules: React.FC<CapsulesProps> = ({ onSelectCapsule }) => {
  const [capsules, setCapsules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');

  const fetchCapsules = async () => {
    if (!hasTenantKey()) { setLoading(false); return; }
    setLoading(true);
    const res = await listCapsules(100, 0);
    if (res.ok && res.data) {
      setCapsules(res.data.capsules);
      setTotal(res.data.total);
    }
    setLoading(false);
  };

  useEffect(() => { fetchCapsules(); }, []);

  const handleDownload = async (e: React.MouseEvent, capsuleId: string) => {
    e.stopPropagation();
    toast.info('Downloading...');
    const blob = await downloadCapsule(capsuleId);
    if (blob) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${capsuleId}.glcf.gz`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Downloaded');
    } else {
      toast.error('Download failed');
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  const filtered = capsules.filter(c =>
    c.capsule_id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 md:pb-0">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h1>Stored Capsules</h1>
          <p className="mt-2">Browse sealed forensic capsules. {total > 0 && `${total} total.`}</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search IDs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-app-surface border border-app-border rounded-xl pl-10 pr-4 py-2 text-sm text-app-text-primary focus:outline-none focus:border-app-teal-accent/50 w-full md:w-64"
            />
          </div>
          <Button variant="secondary" size="sm" onClick={fetchCapsules}>
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </Button>
        </div>
      </div>

      {!hasTenantKey() && (
        <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 flex gap-3 items-center">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
          <p className="text-sm text-amber-500/80">No tenant API key. Set one in <span className="font-bold">Settings</span>.</p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="w-8 h-8 text-zinc-600 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Layers className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
          <p className="text-zinc-500">{capsules.length === 0 ? 'No capsules yet. Ingest events and seal to create one.' : 'No capsules match your search.'}</p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden lg:block bg-app-surface border border-app-border rounded-2xl overflow-hidden card-shadow">
            <table className="w-full text-left">
              <thead className="bg-app-surface-2 border-b border-app-border">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-bold text-app-text-secondary uppercase tracking-widest">Capsule ID</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-app-text-secondary uppercase tracking-widest">Sealed At</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-app-text-secondary uppercase tracking-widest text-center">Events</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-app-text-secondary uppercase tracking-widest text-center">Size</th>
                  <th className="px-6 py-4 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-app-border/50">
                {filtered.map((capsule) => (
                  <tr
                    key={capsule.capsule_id}
                    onClick={() => onSelectCapsule(capsule.capsule_id)}
                    className="group hover:bg-white/5 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Layers size={16} className="text-zinc-600 group-hover:text-app-teal-accent" />
                        <span className="font-mono font-bold text-sm">{capsule.capsule_id.substring(0, 8)}...</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-app-text-secondary">
                      <div className="flex items-center gap-2">
                        <Calendar size={12} /> {new Date(capsule.sealed_at).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center font-mono text-xs">{capsule.event_count}</td>
                    <td className="px-6 py-4 text-center font-mono text-xs">{formatSize(capsule.size_bytes)}</td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={(e) => handleDownload(e, capsule.capsule_id)} className="p-2 text-zinc-600 hover:text-app-text-primary">
                        <Download size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Grid */}
          <div className="lg:hidden grid grid-cols-4 gap-4">
            {filtered.map((capsule) => (
              <motion.div
                key={capsule.capsule_id}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSelectCapsule(capsule.capsule_id)}
                className="col-span-4 bg-app-surface border border-app-border rounded-2xl p-4 space-y-4"
              >
                <div className="flex justify-between items-start">
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-xl bg-app-surface-2 border border-app-border flex items-center justify-center text-app-teal-accent">
                      <Layers size={20} />
                    </div>
                    <div>
                      <h3 className="font-mono text-sm">{capsule.capsule_id.substring(0, 8)}...</h3>
                      <p className="text-[10px] font-mono mt-1">{new Date(capsule.sealed_at).toLocaleString()}</p>
                    </div>
                  </div>
                  <Badge variant="success">{capsule.event_count} events</Badge>
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-app-border/50">
                  <span className="text-[10px] font-mono text-zinc-500">{formatSize(capsule.size_bytes)}</span>
                  <Button variant="secondary" size="sm">View Detail</Button>
                </div>
              </motion.div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
