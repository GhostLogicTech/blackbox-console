import React, { useState, useEffect } from 'react';
import { ShieldAlert, Users, BarChart3, Database, Key, RefreshCw, Layers, Calendar, Trash2, AlertTriangle } from 'lucide-react';
import { Badge } from './ui/Library';
import { adminGetStats, adminListCapsules, adminListKeys, adminCreateKey, adminRevokeKey, hasAdminKey } from '../../api/client';
import { toast } from 'sonner';

export const Admin: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [capsules, setCapsules] = useState<any[]>([]);
  const [keys, setKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKey, setNewKey] = useState<string | null>(null);

  const fetchAll = async () => {
    if (!hasAdminKey()) { setLoading(false); return; }
    setLoading(true);
    const [statsRes, capsRes, keysRes] = await Promise.all([
      adminGetStats(),
      adminListCapsules(20, 0),
      adminListKeys(),
    ]);
    if (statsRes.ok) setStats(statsRes.data);
    if (capsRes.ok) setCapsules(capsRes.data!.capsules);
    if (keysRes.ok) setKeys(keysRes.data!.keys);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) { toast.error('Enter a key name'); return; }
    const res = await adminCreateKey(newKeyName.trim());
    if (res.ok && res.data) {
      setNewKey(res.data.api_key);
      toast.success(`Key created: ${res.data.name}`);
      setNewKeyName('');
      fetchAll();
    } else {
      toast.error(res.error || 'Failed to create key');
    }
  };

  const handleRevoke = async (keyId: string) => {
    const res = await adminRevokeKey(keyId);
    if (res.ok) { toast.success('Key revoked'); fetchAll(); }
    else toast.error(res.error || 'Failed to revoke');
  };

  if (!hasAdminKey()) {
    return (
      <div className="h-full flex flex-col items-center justify-center space-y-6 animate-in fade-in duration-700">
        <div className="w-20 h-20 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
          <ShieldAlert className="w-10 h-10 text-zinc-600" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-xl font-bold text-white">Admin Access Required</h2>
          <p className="text-sm text-zinc-500 max-w-md">Set an admin API key in <span className="font-bold text-zinc-300">Settings</span> to access this panel.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center gap-4 p-4 rounded-2xl bg-rose-500/5 border border-rose-500/20">
        <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-bold text-rose-500">Admin Panel</h2>
          <p className="text-sm text-rose-500/70">Cross-tenant stats, capsule listing, and key management.</p>
        </div>
        <button onClick={fetchAll} className="p-2 text-zinc-500 hover:text-white transition-colors">
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="p-6 rounded-2xl bg-[#121214] border border-zinc-800 space-y-4">
            <div className="flex justify-between items-center">
              <Users className="w-6 h-6 text-teal-400" />
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Tenants</span>
            </div>
            <h3 className="text-3xl font-bold text-white">{stats.tenant_count}</h3>
          </div>
          <div className="p-6 rounded-2xl bg-[#121214] border border-zinc-800 space-y-4">
            <div className="flex justify-between items-center">
              <Database className="w-6 h-6 text-teal-400" />
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Capsules</span>
            </div>
            <h3 className="text-3xl font-bold text-white">{stats.capsule_count}</h3>
          </div>
          <div className="p-6 rounded-2xl bg-[#121214] border border-zinc-800 space-y-4">
            <div className="flex justify-between items-center">
              <BarChart3 className="w-6 h-6 text-teal-400" />
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Events</span>
            </div>
            <h3 className="text-3xl font-bold text-white">{stats.total_events.toLocaleString()}</h3>
          </div>
          <div className="p-6 rounded-2xl bg-[#121214] border border-zinc-800 space-y-4">
            <div className="flex justify-between items-center">
              <Layers className="w-6 h-6 text-teal-400" />
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Storage</span>
            </div>
            <h3 className="text-3xl font-bold text-white">{stats.total_storage_mb} MB</h3>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* All Capsules */}
        <div className="bg-[#121214] border border-zinc-800 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <Database className="w-5 h-5 text-teal-400" /> All Capsules (Cross-Tenant)
          </h3>
          <div className="space-y-3 max-h-[400px] overflow-y-auto scrollbar-hide">
            {capsules.length === 0 ? (
              <p className="text-sm text-zinc-500 text-center py-8">No capsules found.</p>
            ) : capsules.map((c) => (
              <div key={c.capsule_id} className="flex items-center justify-between p-4 rounded-xl bg-zinc-900 border border-zinc-800">
                <div>
                  <p className="font-mono text-sm text-zinc-200">{c.capsule_id.substring(0, 8)}...</p>
                  <p className="text-[10px] text-zinc-500 font-mono mt-1">tenant: {c.tenant_id.substring(0, 8)}... | {c.event_count} events</p>
                </div>
                <span className="text-[10px] text-zinc-500 font-mono">{new Date(c.sealed_at).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Key Management */}
        <div className="bg-[#121214] border border-zinc-800 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <Key className="w-5 h-5 text-teal-400" /> API Key Management
          </h3>

          {/* Create Key */}
          <div className="flex gap-2 mb-6">
            <input
              type="text"
              placeholder="New key name..."
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-teal-500/50"
            />
            <button onClick={handleCreateKey} className="px-4 py-2 rounded-xl bg-teal-500 text-black font-bold text-sm hover:bg-teal-400 transition-all">
              Create
            </button>
          </div>

          {newKey && (
            <div className="p-4 rounded-xl bg-teal-500/5 border border-teal-500/20 mb-6">
              <p className="text-[10px] text-teal-400 uppercase font-bold mb-2">New Key (copy now — shown only once)</p>
              <p className="font-mono text-sm text-teal-300 break-all select-all">{newKey}</p>
            </div>
          )}

          <div className="space-y-3 max-h-[300px] overflow-y-auto scrollbar-hide">
            {keys.map((k) => (
              <div key={k.key_id} className="flex items-center justify-between p-4 rounded-xl bg-zinc-900 border border-zinc-800">
                <div>
                  <p className="text-sm font-bold text-zinc-200">{k.name}</p>
                  <p className="text-[10px] text-zinc-500 font-mono mt-1">
                    {k.key_id.substring(0, 8)}... | tenant: {k.tenant_id.substring(0, 8)}...
                  </p>
                  <p className="text-[10px] text-zinc-600 mt-1">
                    Created: {new Date(k.created_at).toLocaleDateString()} | Last used: {k.last_used_at ? new Date(k.last_used_at).toLocaleDateString() : 'Never'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={k.active ? 'success' : 'danger'}>{k.active ? 'Active' : 'Revoked'}</Badge>
                  {k.active && (
                    <button onClick={() => handleRevoke(k.key_id)} className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
