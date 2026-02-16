import React, { useState, useEffect } from 'react';
import { Lock, ShieldAlert, Users, BarChart3, ArrowRight, Key, Trash2, RefreshCw, Plus, Database, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button, Badge, cn } from './ui/Library';
import { toast } from 'sonner';
import { adminGetStats, adminListKeys, adminCreateKey, adminRevokeKey, adminRotateKey } from '../../api/client';

function formatStorageMB(mb: number): string {
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
  return `${mb} MB`;
}

export const Admin: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'stats' | 'keys'>('stats');
  const [stats, setStats] = useState<any>(null);
  const [keys, setKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newKeyName, setNewKeyName] = useState('');
  const [showCreateInput, setShowCreateInput] = useState(false);

  const fetchData = async () => {
    const [statsRes, keysRes] = await Promise.all([adminGetStats(), adminListKeys()]);
    if (statsRes.ok && statsRes.data) setStats(statsRes.data);
    if (keysRes.ok && keysRes.data) setKeys(keysRes.data.keys);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleRevokeKey = async (keyId: string) => {
    const res = await adminRevokeKey(keyId);
    if (res.ok) {
      toast.success(`Key ${keyId} revoked`);
      fetchData();
    } else {
      toast.error(res.error || 'Failed to revoke key');
    }
  };

  const handleRotateKey = async (keyId: string) => {
    const res = await adminRotateKey(keyId);
    if (res.ok && res.data) {
      toast.success(`Key rotated. New key: ${res.data.api_key}`);
      fetchData();
    } else {
      toast.error(res.error || 'Failed to rotate key');
    }
  };

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) return;
    const res = await adminCreateKey(newKeyName.trim());
    if (res.ok && res.data) {
      toast.success(`Key created: ${res.data.api_key}`);
      setNewKeyName('');
      setShowCreateInput(false);
      fetchData();
    } else {
      toast.error(res.error || 'Failed to create key');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-app-teal-accent/30 border-t-app-teal-accent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center gap-4 p-4 rounded-2xl bg-rose-500/5 border border-rose-500/20 mb-4">
        <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-rose-500">Admin Access</h2>
          <p className="text-sm text-rose-500/70">Requires admin key. All actions are logged.</p>
        </div>
      </div>

      <div className="flex bg-app-surface border border-app-border rounded-xl overflow-hidden w-fit">
        <button onClick={() => setActiveSection('stats')} className={cn("px-5 py-2.5 text-sm font-bold transition-all flex items-center gap-2", activeSection === 'stats' ? "bg-app-teal-accent/10 text-app-teal-accent" : "text-zinc-500 hover:text-zinc-300")}>
          <BarChart3 size={16} /> Tenant Stats
        </button>
        <button onClick={() => setActiveSection('keys')} className={cn("px-5 py-2.5 text-sm font-bold transition-all flex items-center gap-2", activeSection === 'keys' ? "bg-app-teal-accent/10 text-app-teal-accent" : "text-zinc-500 hover:text-zinc-300")}>
          <Key size={16} /> API Keys
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeSection === 'stats' ? (
          <motion.div key="stats" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-2xl bg-[#121214] border border-zinc-800 space-y-4">
                <div className="flex justify-between items-center"><Users className="w-6 h-6 text-app-teal-accent" /><span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Tenants</span></div>
                <h3 className="text-3xl font-bold text-white">{stats?.tenant_count ?? 0}</h3>
              </div>
              <div className="p-6 rounded-2xl bg-[#121214] border border-zinc-800 space-y-4">
                <div className="flex justify-between items-center"><Database className="w-6 h-6 text-app-teal-accent" /><span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Total Capsules</span></div>
                <h3 className="text-3xl font-bold text-white">{stats?.capsule_count?.toLocaleString() ?? 0}</h3>
              </div>
              <div className="p-6 rounded-2xl bg-[#121214] border border-zinc-800 space-y-4">
                <div className="flex justify-between items-center"><Layers className="w-6 h-6 text-app-teal-accent" /><span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Total Storage</span></div>
                <h3 className="text-3xl font-bold text-white">{stats?.total_storage_mb ? formatStorageMB(parseFloat(stats.total_storage_mb)) : '0 MB'}</h3>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div key="keys" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2"><Key className="w-5 h-5 text-app-teal-accent" /> API Keys</h3>
              <Button size="sm" onClick={() => setShowCreateInput(!showCreateInput)}><Plus size={16} /> Create Key</Button>
            </div>

            {showCreateInput && (
              <div className="flex gap-3 p-4 bg-app-surface border border-app-border rounded-xl">
                <input type="text" value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleCreateKey()} placeholder="Key name (e.g. Production Agent)" className="flex-1 bg-black border border-app-border rounded-lg px-3 py-2 text-sm text-white font-mono placeholder:text-zinc-700 focus:outline-none focus:border-app-teal-accent/50" />
                <Button size="sm" onClick={handleCreateKey} disabled={!newKeyName.trim()}>Create</Button>
              </div>
            )}

            <div className="space-y-3">
              {keys.map((key) => (
                <div key={key.key_id} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-xl bg-[#121214] border border-zinc-800 hover:border-zinc-700 transition-all gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-zinc-200">{key.name}</p>
                      {!key.active && <Badge variant="danger">Revoked</Badge>}
                    </div>
                    <p className="text-[10px] text-zinc-500 font-mono mt-1">{key.key_id} · Tenant: {key.tenant_id}</p>
                    <p className="text-[10px] text-zinc-600 font-mono mt-0.5">Created: {new Date(key.created_at).toLocaleDateString()}{key.last_used_at ? ` · Last used: ${new Date(key.last_used_at).toLocaleDateString()}` : ''}</p>
                  </div>
                  {key.active !== false && (
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => handleRotateKey(key.key_id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white text-[11px] font-bold transition-all"><RefreshCw size={13} /> Rotate</button>
                      <button onClick={() => handleRevokeKey(key.key_id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/5 border border-red-500/20 text-red-400 hover:bg-red-500/10 text-[11px] font-bold transition-all"><Trash2 size={13} /> Revoke</button>
                    </div>
                  )}
                </div>
              ))}
              {keys.length === 0 && <p className="text-sm text-zinc-600 text-center py-8">No API keys found</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
