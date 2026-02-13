import React, { useState, useEffect } from 'react';
import {
  Key,
  Eye,
  EyeOff,
  Save,
  Server,
  Trash2,
  CheckCircle2,
  Plus,
  Copy,
  Check,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import {
  getTenantKey, setTenantKey,
  clearKeys, hasTenantKey, hasAdminKey,
  getMe, getInfo, adminCreateKey, BASE_URL
} from '../../api/client';

export const Settings: React.FC = () => {
  const [tenantKeyInput, setTenantKeyInput] = useState('');
  const [showTenantKey, setShowTenantKey] = useState(false);
  const [tenantInfo, setTenantInfo] = useState<any>(null);
  const [serverInfo, setServerInfo] = useState<any>(null);
  const [generating, setGenerating] = useState(false);
  const [genKeyName, setGenKeyName] = useState('');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setTenantKeyInput(getTenantKey() || '');

    getInfo().then(res => {
      if (res.ok) setServerInfo(res.data);
    });

    if (hasTenantKey()) {
      getMe().then(res => {
        if (res.ok) setTenantInfo(res.data);
      });
    }
  }, []);

  const handleSaveTenantKey = () => {
    const key = tenantKeyInput.trim();
    if (!key) {
      localStorage.removeItem('blackbox_tenant_key');
      setTenantInfo(null);
      toast.success('Tenant key cleared');
      return;
    }
    setTenantKey(key);
    toast.success('Tenant key saved');

    getMe().then(res => {
      if (res.ok) {
        setTenantInfo(res.data);
        toast.success(`Authenticated as: ${res.data!.name}`);
      } else {
        toast.error(`Key validation failed: ${res.error}`);
        setTenantInfo(null);
      }
    });
  };

  const handleGenerateKey = async () => {
    if (!hasAdminKey()) {
      toast.error('Key generation unavailable');
      return;
    }
    const name = genKeyName.trim() || 'default';
    setGenerating(true);
    const res = await adminCreateKey(name);
    setGenerating(false);
    if (res.ok && res.data) {
      const newKey = res.data.api_key;
      setGeneratedKey(newKey);
      setTenantKeyInput(newKey);
      setTenantKey(newKey);
      toast.success(`Key "${res.data.name}" created and activated`);
      setGenKeyName('');

      getMe().then(meRes => {
        if (meRes.ok) setTenantInfo(meRes.data);
      });
    } else {
      toast.error(res.error || 'Failed to generate key');
    }
  };

  const handleCopyKey = () => {
    if (generatedKey) {
      navigator.clipboard.writeText(generatedKey);
      setCopied(true);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClearAll = () => {
    clearKeys();
    setTenantKeyInput('');
    setTenantInfo(null);
    setGeneratedKey(null);
    toast.success('All keys cleared');
  };

  const showGenerate = hasAdminKey();

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24 md:pb-0">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Settings</h1>
        <p className="text-zinc-500 mt-2 text-sm md:text-base">Configure your API key and connection settings.</p>
      </div>

      <div className="w-full space-y-8">

        {/* ── GENERATE KEY — hero section (only visible with admin key in localStorage) ── */}
        {showGenerate && (
          <section className="p-6 md:p-8 rounded-2xl bg-gradient-to-br from-teal-500/10 via-[#121214] to-[#121214] border border-teal-500/30 space-y-6 shadow-[0_0_40px_rgba(45,212,191,0.08)]">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-teal-500/10 border border-teal-500/20">
                <Sparkles className="w-7 h-7 text-teal-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Generate API Key</h3>
                <p className="text-sm text-zinc-400 mt-1">Create a new tenant key. It will be automatically saved and activated.</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={genKeyName}
                onChange={(e) => setGenKeyName(e.target.value)}
                placeholder="Key name (e.g. my-project)"
                className="flex-1 min-w-0 bg-black/40 border border-teal-500/20 rounded-xl px-4 py-3.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500/40"
              />
              <button
                onClick={handleGenerateKey}
                disabled={generating}
                className="flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-teal-500 text-black font-bold text-sm hover:bg-teal-400 transition-all disabled:opacity-50 shrink-0 shadow-[0_0_20px_rgba(45,212,191,0.3)]"
              >
                <Plus size={18} /> {generating ? 'Generating...' : 'Generate Key'}
              </button>
            </div>

            {generatedKey && (
              <div className="p-5 rounded-xl bg-teal-500/5 border border-teal-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-teal-400 uppercase font-bold tracking-widest">New Key — copy now, shown only once</p>
                  <button
                    onClick={handleCopyKey}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-500/10 text-teal-400 text-xs font-bold hover:bg-teal-500/20 transition-all"
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <p className="font-mono text-sm text-teal-300 break-all select-all bg-black/40 p-4 rounded-lg border border-teal-500/10">{generatedKey}</p>
              </div>
            )}
          </section>
        )}

        {/* ── Tenant API Key ── */}
        <section className="p-6 md:p-8 rounded-2xl bg-[#121214] border border-zinc-800 space-y-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 pb-4 border-b border-zinc-800/50">
            <Key className="w-5 h-5 text-teal-400 shrink-0" /> API Key
          </h3>
          <p className="text-xs text-zinc-500">Your tenant key for all capsule operations (ingest, seal, verify, list).</p>

          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1 relative min-w-0">
                <input
                  type={showTenantKey ? 'text' : 'password'}
                  value={tenantKeyInput}
                  onChange={(e) => setTenantKeyInput(e.target.value)}
                  placeholder="glk_..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-200 font-mono focus:outline-none focus:ring-1 focus:ring-teal-500/50 pr-10"
                />
                <button
                  onClick={() => setShowTenantKey(!showTenantKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                >
                  {showTenantKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <button
                onClick={handleSaveTenantKey}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-teal-500 text-black font-bold text-sm hover:bg-teal-400 transition-all shrink-0"
              >
                <Save size={16} /> <span className="sm:hidden">Save</span>
              </button>
            </div>

            {tenantInfo && (
              <div className="p-4 rounded-xl bg-teal-500/5 border border-teal-500/20 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-teal-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-teal-400">{tenantInfo.name}</p>
                  <p className="text-[10px] text-zinc-500 font-mono truncate">Tenant: {tenantInfo.tenant_id} | Key: {tenantInfo.key_id}</p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ── Connection Info ── */}
        <section className="p-6 md:p-8 rounded-2xl bg-[#121214] border border-zinc-800 space-y-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 pb-4 border-b border-zinc-800/50">
            <Server className="w-5 h-5 text-teal-400 shrink-0" /> Connection
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-zinc-800/50 gap-4">
              <span className="text-sm text-zinc-500 shrink-0">Backend URL</span>
              <span className="font-mono text-xs text-zinc-300 truncate">{BASE_URL}</span>
            </div>
            {serverInfo && (
              <>
                <div className="flex justify-between items-center py-2 border-b border-zinc-800/50">
                  <span className="text-sm text-zinc-500">Version</span>
                  <span className="font-mono text-sm text-zinc-200">{serverInfo.version}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-zinc-800/50">
                  <span className="text-sm text-zinc-500">Status</span>
                  <span className="font-mono text-sm text-teal-400">{serverInfo.status}</span>
                </div>
              </>
            )}
          </div>
        </section>

        {/* ── Danger Zone ── */}
        <section className="p-6 md:p-8 rounded-2xl bg-zinc-900/50 border border-red-500/10 space-y-4">
          <h3 className="text-sm font-bold text-red-400 uppercase tracking-widest">Danger Zone</h3>
          <button
            onClick={handleClearAll}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-bold hover:bg-red-500/20 transition-all"
          >
            <Trash2 size={16} /> Clear All Keys
          </button>
        </section>
      </div>
    </div>
  );
};
