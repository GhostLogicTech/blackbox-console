import React, { useState, useEffect, useRef } from 'react';
import {
  Terminal as TerminalIcon, Key, Download, ShieldCheck, Cpu, Activity,
  ChevronRight, Copy, Check, Server, Wifi, ArrowRight,
  ExternalLink, Monitor, HardDrive, Clock, Network, Globe, Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button, cn } from './ui/Library';
import { toast } from 'sonner';
import { setTenantKey, setAdminKey, getMe, getEndpoints } from '../../api/client';

interface SetupProtocolProps {
  onComplete: () => void;
}

export const SetupProtocol: React.FC<SetupProtocolProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [apiKey, setApiKey] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const [tenantInfo, setTenantInfo] = useState<{ tenant_id: string; name: string } | null>(null);
  const [endpointData, setEndpointData] = useState<any[]>([]);
  const [isPolling, setIsPolling] = useState(false);
  const [copiedInstall, setCopiedInstall] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const handleCopyInstall = () => {
    navigator.clipboard.writeText('pip install ghostlogic-agent && ghostlogic-agent');
    setCopiedInstall(true);
    setTimeout(() => setCopiedInstall(false), 2000);
  };

  const handleVerifyKey = async () => {
    if (!apiKey.trim()) return;
    setIsVerifying(true);
    setVerifyError('');

    // Determine if this is an admin or tenant key
    if (apiKey.startsWith('glk_admin_')) {
      setAdminKey(apiKey.trim());
    }
    setTenantKey(apiKey.trim());

    const res = await getMe();
    if (res.ok && res.data) {
      setTenantInfo({ tenant_id: res.data.tenant_id, name: res.data.name });
      toast.success(`Connected as ${res.data.name}`);
      setStep(3);
      // Start polling for endpoints
      startEndpointPolling();
    } else {
      setVerifyError(res.error || 'Invalid key');
      toast.error('Key verification failed');
    }
    setIsVerifying(false);
  };

  const startEndpointPolling = () => {
    setIsPolling(true);
    const poll = async () => {
      const res = await getEndpoints();
      if (res.ok && res.data && res.data.endpoints.length > 0) {
        setEndpointData(res.data.endpoints);
      }
    };
    poll();
    pollRef.current = setInterval(poll, 5000);
  };

  const handleComplete = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    onComplete();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-[100] bg-app-bg flex items-center justify-center p-4"
    >
      <div className="w-full max-w-2xl">
        {/* Progress */}
        <div className="flex items-center gap-4 mb-10">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-3 flex-1">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border transition-all",
                step >= s
                  ? "bg-app-teal-accent text-black border-app-teal-accent"
                  : "bg-app-surface-2 text-zinc-500 border-app-border"
              )}>
                {step > s ? <Check size={14} /> : s}
              </div>
              <span className={cn(
                "text-xs font-bold uppercase tracking-widest hidden sm:inline",
                step >= s ? "text-app-teal-accent" : "text-zinc-600"
              )}>
                {s === 1 ? 'Install' : s === 2 ? 'Connect' : 'Verify'}
              </span>
              {s < 3 && <div className={cn("flex-1 h-px", step > s ? "bg-app-teal-accent" : "bg-app-border")} />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Install Agent */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Install the Agent</h1>
                <p className="mt-3 text-zinc-500 text-lg">Run the GhostLogic agent on any machine you want to monitor.</p>
              </div>

              <div className="bg-app-surface border border-app-border rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <TerminalIcon size={18} className="text-app-teal-accent" />
                  <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Quick Install</span>
                </div>
                <div className="bg-black rounded-xl p-4 font-mono text-sm text-app-teal-accent flex items-center justify-between">
                  <code>pip install ghostlogic-agent && ghostlogic-agent</code>
                  <button onClick={handleCopyInstall} className="p-2 text-zinc-500 hover:text-white transition-colors">
                    {copiedInstall ? <Check size={16} className="text-app-teal-accent" /> : <Copy size={16} />}
                  </button>
                </div>
                <p className="text-xs text-zinc-600">The agent auto-registers with api.ghostlogic.tech and prints your API key on first run.</p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-app-surface-2 border border-app-border rounded-xl p-4 text-center">
                  <Monitor size={20} className="mx-auto text-zinc-500 mb-2" />
                  <p className="text-[10px] font-bold text-zinc-500 uppercase">Windows</p>
                </div>
                <div className="bg-app-surface-2 border border-app-border rounded-xl p-4 text-center">
                  <Server size={20} className="mx-auto text-zinc-500 mb-2" />
                  <p className="text-[10px] font-bold text-zinc-500 uppercase">Linux</p>
                </div>
                <div className="bg-app-surface-2 border border-app-border rounded-xl p-4 text-center">
                  <Globe size={20} className="mx-auto text-zinc-500 mb-2" />
                  <p className="text-[10px] font-bold text-zinc-500 uppercase">macOS</p>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => setStep(2)}>
                  I have my key <ChevronRight size={16} />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Paste Key */}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Connect Your Key</h1>
                <p className="mt-3 text-zinc-500 text-lg">Paste the API key that the agent printed when it first ran.</p>
              </div>

              <div className="bg-app-surface border border-app-border rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <Key size={18} className="text-app-teal-accent" />
                  <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">API Key</span>
                </div>
                <input
                  type="text"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleVerifyKey()}
                  placeholder="glk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  className="w-full bg-black border border-app-border rounded-xl px-4 py-3 font-mono text-sm text-white placeholder:text-zinc-700 focus:outline-none focus:border-app-teal-accent/50"
                />
                {verifyError && (
                  <p className="text-sm text-red-400">{verifyError}</p>
                )}
                <p className="text-xs text-zinc-600">
                  This calls <code className="text-app-teal-accent/50">GET /api/v1/me</code> to verify your key and retrieve your tenant identity.
                </p>
              </div>

              <div className="flex justify-between">
                <Button variant="secondary" onClick={() => setStep(1)}>Back</Button>
                <Button onClick={handleVerifyKey} disabled={isVerifying || !apiKey.trim()}>
                  {isVerifying ? 'Verifying...' : 'Verify & Connect'} <ArrowRight size={16} />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Verify Connection */}
          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Console Online</h1>
                <p className="mt-3 text-zinc-500 text-lg">
                  Connected as <span className="text-app-teal-accent font-bold">{tenantInfo?.name || 'Unknown'}</span>
                </p>
              </div>

              {/* Tenant info */}
              <div className="bg-app-surface border border-app-teal-accent/20 rounded-2xl p-6 space-y-3">
                <div className="flex items-center gap-3 mb-2">
                  <ShieldCheck size={18} className="text-app-teal-accent" />
                  <span className="text-[11px] font-bold text-app-teal-accent uppercase tracking-widest">Verified</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-[10px] text-zinc-600 uppercase">Tenant</p>
                    <p className="text-white font-mono mt-1">{tenantInfo?.name}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-600 uppercase">Tenant ID</p>
                    <p className="text-zinc-400 font-mono mt-1 text-xs">{tenantInfo?.tenant_id}</p>
                  </div>
                </div>
              </div>

              {/* Live endpoints */}
              {endpointData.length > 0 ? (
                <div className="bg-app-surface border border-app-border rounded-2xl p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-app-teal-accent animate-pulse" />
                    <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Live Endpoints Detected</span>
                  </div>
                  {endpointData.map((ep: any) => (
                    <div key={ep.endpoint_name} className="p-4 bg-app-bg border border-app-border rounded-xl">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-white">{ep.endpoint_name}</span>
                        <span className="text-[10px] font-mono text-zinc-600">{ep.event_count?.toLocaleString()} events</span>
                      </div>
                      {ep.latest?.system && (
                        <div className="flex gap-4 mt-2 text-xs font-mono text-zinc-500">
                          <span>CPU: {ep.latest.system.cpu_percent}%</span>
                          <span>RAM: {ep.latest.system.ram_percent}%</span>
                          <span>{ep.latest.system.os} {ep.latest.system.machine}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-app-surface border border-app-border rounded-2xl p-6 text-center">
                  <div className="flex items-center justify-center gap-3 mb-3">
                    <Wifi size={18} className="text-zinc-500 animate-pulse" />
                    <span className="text-sm text-zinc-500">Waiting for agent telemetry...</span>
                  </div>
                  <p className="text-xs text-zinc-600">Run the agent on a machine and it will appear here automatically.</p>
                </div>
              )}

              <div className="flex justify-end">
                <Button onClick={handleComplete}>
                  Open Console <ArrowRight size={16} />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
