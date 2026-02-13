import React, { useState } from 'react';
import {
  Key,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  Plus,
  Copy,
  Check,
  Shield
} from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import {
  setTenantKey, hasAdminKey,
  getMe, adminCreateKey
} from '../../api/client';

interface OnboardingProps {
  onComplete: () => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [keyInput, setKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [genName, setGenName] = useState('');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const canGenerate = hasAdminKey();

  const handlePasteKey = async () => {
    const key = keyInput.trim();
    if (!key) {
      toast.error('Paste your API key first');
      return;
    }
    setSaving(true);
    setTenantKey(key);
    const res = await getMe();
    setSaving(false);
    if (res.ok) {
      toast.success(`Welcome, ${res.data!.name}`);
      onComplete();
    } else {
      toast.error('Invalid key — check and try again');
    }
  };

  const handleGenerate = async () => {
    const name = genName.trim() || 'default';
    setGenerating(true);
    const res = await adminCreateKey(name);
    setGenerating(false);
    if (res.ok && res.data) {
      const newKey = res.data.api_key;
      setGeneratedKey(newKey);
      setKeyInput(newKey);
      setTenantKey(newKey);
      toast.success(`Key "${res.data.name}" created`);
      setGenName('');
    } else {
      toast.error(res.error || 'Failed to generate key');
    }
  };

  const handleCopy = () => {
    if (generatedKey) {
      navigator.clipboard.writeText(generatedKey);
      setCopied(true);
      toast.success('Copied');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleContinue = async () => {
    if (generatedKey) {
      const res = await getMe();
      if (res.ok) {
        toast.success(`Welcome, ${res.data!.name}`);
      }
      onComplete();
    }
  };

  return (
    <div className="min-h-screen bg-app-bg flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg space-y-8"
      >
        {/* Logo & title */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-teal-500/10 border border-teal-500/20 mx-auto">
            <Shield className="w-8 h-8 text-teal-400" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">GhostLogic Black Box</h1>
          <p className="text-zinc-500 text-sm">Forensic evidence capsule system. Enter your API key to get started.</p>
        </div>

        {/* Generate section — only if admin key exists */}
        {canGenerate && !generatedKey && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-2xl bg-gradient-to-br from-teal-500/10 via-[#121214] to-[#121214] border border-teal-500/30 space-y-5 shadow-[0_0_40px_rgba(45,212,191,0.08)]"
          >
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-teal-400" />
              <h2 className="text-lg font-bold text-white">Generate a New Key</h2>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={genName}
                onChange={(e) => setGenName(e.target.value)}
                placeholder="Key name (e.g. my-project)"
                className="flex-1 min-w-0 bg-black/40 border border-teal-500/20 rounded-xl px-4 py-3.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-teal-500/40"
              />
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-teal-500 text-black font-bold text-sm hover:bg-teal-400 transition-all disabled:opacity-50 shrink-0 shadow-[0_0_20px_rgba(45,212,191,0.3)]"
              >
                <Plus size={18} /> {generating ? 'Generating...' : 'Generate'}
              </button>
            </div>
          </motion.div>
        )}

        {/* Generated key display */}
        {generatedKey && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-2xl bg-teal-500/5 border border-teal-500/20 space-y-4"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs text-teal-400 uppercase font-bold tracking-widest">Your new key — copy it now</p>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-500/10 text-teal-400 text-xs font-bold hover:bg-teal-500/20 transition-all"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <p className="font-mono text-sm text-teal-300 break-all select-all bg-black/40 p-4 rounded-lg border border-teal-500/10">{generatedKey}</p>
            <button
              onClick={handleContinue}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-teal-500 text-black font-bold text-sm hover:bg-teal-400 transition-all shadow-[0_0_20px_rgba(45,212,191,0.3)]"
            >
              Continue to Console <ArrowRight size={16} />
            </button>
          </motion.div>
        )}

        {/* Divider — only if generate is shown */}
        {canGenerate && !generatedKey && (
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-zinc-800" />
            <span className="text-xs text-zinc-600 uppercase tracking-widest font-bold">or paste existing key</span>
            <div className="flex-1 h-px bg-zinc-800" />
          </div>
        )}

        {/* Paste key section */}
        {!generatedKey && (
          <div className="p-6 rounded-2xl bg-[#121214] border border-zinc-800 space-y-5">
            <div className="flex items-center gap-3">
              <Key className="w-5 h-5 text-teal-400" />
              <h2 className="text-lg font-bold text-white">Enter API Key</h2>
            </div>

            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handlePasteKey()}
                placeholder="glk_..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3.5 text-sm text-zinc-200 font-mono focus:outline-none focus:ring-2 focus:ring-teal-500/40 pr-10"
              />
              <button
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
              >
                {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <button
              onClick={handlePasteKey}
              disabled={saving || !keyInput.trim()}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-teal-500 text-black font-bold text-sm hover:bg-teal-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saving ? 'Validating...' : 'Connect'} <ArrowRight size={16} />
            </button>
          </div>
        )}

        <p className="text-center text-[10px] text-zinc-700 font-mono uppercase tracking-widest">blackbox.ghostlogic.tech · v2.1.0</p>
      </motion.div>
    </div>
  );
};
