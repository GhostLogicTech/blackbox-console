import React, { useState, useEffect, useRef } from 'react';
import {
  Terminal as TerminalIcon, Key, ShieldCheck,
  ChevronRight, Copy, Check, Server, Wifi, ArrowRight,
  Monitor, Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button, cn } from './ui/Library';
import { toast } from 'sonner';
import { setTenantKey, setAdminKey, getMe, getEndpoints } from '../../api/client';

interface SetupProtocolProps {
  onComplete: () => void;
}

type Platform = 'windows' | 'linux' | 'macos';

const installSteps: Record<Platform, { label: string; icon: typeof Monitor; steps: { desc: string; cmd: string }[] }> = {
  windows: {
    label: 'Windows',
    icon: Monitor,
    steps: [
      { desc: 'Clone the agent repo', cmd: 'git clone https://github.com/GhostLogicAI/blackbox-agent.git' },
      { desc: 'Enter the directory', cmd: 'cd blackbox-agent' },
      { desc: 'Run the installer (PowerShell as Admin)', cmd: '.\\install\\windows\\install.ps1' },
    ],
  },
  macos: {
    label: 'macOS',
    icon: Globe,
    steps: [
      { desc: 'Clone the agent repo', cmd: 'git clone https://github.com/GhostLogicAI/blackbox-agent.git' },
      { desc: 'Enter the directory', cmd: 'cd blackbox-agent' },
      { desc: 'Run the installer', cmd: 'bash install/mac/install.sh' },
    ],
  },
  linux: {
    label: 'Linux',
    icon: Server,
    steps: [
      { desc: 'Clone the agent repo', cmd: 'git clone https://github.com/GhostLogicAI/blackbox-agent.git' },
      { desc: 'Enter the directory', cmd: 'cd blackbox-agent' },
      { desc: 'Run the installer', cmd: 'sudo bash install/linux/install.sh' },
    ],
  },
};

export const SetupProtocol: React.FC<SetupProtocolProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [apiKey, setApiKey] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const [tenantInfo, setTenantInfo] = useState<{ tenant_id: string; name: string } | null>(null);
  const [endpointData, setEndpointData] = useState<any[]>([]);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [platform, setPlatform] = useState<Platform>(() => {
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes('win')) return 'windows';
    if (ua.includes('mac')) return 'macos';
    return 'linux';
  });
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const handleCopy = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(cmd);
    toast.success('Copied — paste into your terminal', { duration: 3000 });
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const handleVerifyKey = async () => {
    if (!apiKey.trim()) return;
    setIsVerifying(true);
    setVerifyError('');

    if (apiKey.startsWith('glk_admin_')) {
      setAdminKey(apiKey.trim());
    }
    setTenantKey(apiKey.trim());

    const res = await getMe();
    if (res.ok && res.data) {
      setTenantInfo({ tenant_id: res.data.tenant_id, name: res.data.name });
      toast.success(`Connected as ${res.data.name}`);
      setStep(3);
      startEndpointPolling();
    } else {
      setVerifyError(res.error || 'Invalid key');
      toast.error('Key verification failed');
    }
    setIsVerifying(false);
  };

  const startEndpointPolling = () => {
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

  const stepLabels = ['Install', 'Connect', 'Verify'];
  const currentPlatform = installSteps[platform];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-[100] bg-app-bg flex items-center justify-center p-4 overflow-y-auto"
    >
      <div className="w-full max-w-2xl my-auto">
        {/* Progress bar */}
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
                {stepLabels[s - 1]}
              </span>
              {s < 3 && <div className={cn("flex-1 h-px", step > s ? "bg-app-teal-accent" : "bg-app-border")} />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* ── Step 1: Install the Agent ── */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Install the Agent</h1>
                <p className="mt-3 text-zinc-500 text-lg">Run these commands on the machine you want to monitor. The agent will print your API key when it starts.</p>
              </div>

              {/* Platform tabs */}
              <div className="flex gap-2">
                {(Object.keys(installSteps) as Platform[]).map((p) => {
                  const Icon = installSteps[p].icon;
                  return (
                    <button
                      key={p}
                      onClick={() => setPlatform(p)}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all",
                        platform === p
                          ? "bg-app-teal-accent/10 text-app-teal-accent border-app-teal-accent/30"
                          : "bg-app-surface-2 text-zinc-500 border-app-border hover:text-zinc-300 hover:border-zinc-600"
                      )}
                    >
                      <Icon size={16} />
                      {installSteps[p].label}
                    </button>
                  );
                })}
              </div>

              {/* Commands */}
              <div className="bg-app-surface border border-app-border rounded-2xl p-4 sm:p-6 space-y-4">
                <div className="flex items-center gap-3 mb-1">
                  <TerminalIcon size={16} className="text-app-teal-accent" />
                  <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Open a terminal and run</span>
                </div>
                {currentPlatform.steps.map((s, i) => (
                  <div key={`${platform}-${i}`} className="space-y-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-app-teal-accent/15 flex items-center justify-center text-[10px] font-bold text-app-teal-accent shrink-0">
                        {i + 1}
                      </div>
                      <span className="text-xs text-zinc-400">{s.desc}</span>
                    </div>
                    <div className="bg-black rounded-lg p-3 font-mono text-xs sm:text-sm text-app-teal-accent flex items-center justify-between gap-2 ml-7">
                      <code className="overflow-x-auto whitespace-nowrap scrollbar-hide">{s.cmd}</code>
                      <button onClick={() => handleCopy(s.cmd)} className="shrink-0 p-1.5 text-zinc-500 hover:text-white transition-colors">
                        {copiedCmd === s.cmd ? <Check size={14} className="text-app-teal-accent" /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>
                ))}
                <p className="text-xs text-zinc-600 ml-7 pt-1">
                  The installer sets everything up. When it finishes, the agent prints your <code className="text-app-teal-accent/60">glk_</code> API key — copy it for the next step.
                </p>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => setStep(2)}>
                  I have my key <ChevronRight size={16} />
                </Button>
              </div>
            </motion.div>
          )}

          {/* ── Step 2: Paste key from terminal ── */}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Connect Your Key</h1>
                <p className="mt-3 text-zinc-500 text-lg">Paste the API key the agent printed in your terminal.</p>
              </div>

              <div className="bg-app-surface border border-app-border rounded-2xl p-4 sm:p-6 space-y-4">
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
                  autoFocus
                />
                {verifyError && (
                  <p className="text-sm text-red-400">{verifyError}</p>
                )}
                <p className="text-xs text-zinc-600">
                  This connects your browser to the data your agent is collecting.
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

          {/* ── Step 3: Verified / waiting for telemetry ── */}
          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Console Online</h1>
                <p className="mt-3 text-zinc-500 text-lg">
                  Connected as <span className="text-app-teal-accent font-bold">{tenantInfo?.name || 'Unknown'}</span>
                </p>
              </div>

              {/* Tenant info */}
              <div className="bg-app-surface border border-app-teal-accent/20 rounded-2xl p-4 sm:p-6 space-y-3">
                <div className="flex items-center gap-3 mb-2">
                  <ShieldCheck size={18} className="text-app-teal-accent" />
                  <span className="text-[11px] font-bold text-app-teal-accent uppercase tracking-widest">Verified</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
                  <div>
                    <p className="text-[10px] text-zinc-600 uppercase">Tenant</p>
                    <p className="text-white font-mono mt-1">{tenantInfo?.name}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-600 uppercase">Tenant ID</p>
                    <p className="text-zinc-400 font-mono mt-1 text-xs break-all">{tenantInfo?.tenant_id}</p>
                  </div>
                </div>
              </div>

              {/* Live endpoints */}
              {endpointData.length > 0 ? (
                <div className="bg-app-surface border border-app-border rounded-2xl p-4 sm:p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-app-teal-accent animate-pulse" />
                    <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Live Endpoints Detected</span>
                  </div>
                  {endpointData.map((ep: any) => (
                    <div key={ep.endpoint_name} className="p-3 sm:p-4 bg-app-bg border border-app-border rounded-xl">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-bold text-white truncate">{ep.endpoint_name}</span>
                        <span className="text-[10px] font-mono text-zinc-600 shrink-0">{ep.event_count?.toLocaleString()} events</span>
                      </div>
                      {ep.latest?.system && (
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs font-mono text-zinc-500">
                          <span>CPU: {ep.latest.system.cpu_percent}%</span>
                          <span>RAM: {ep.latest.system.ram_percent}%</span>
                          <span>{ep.latest.system.os} {ep.latest.system.machine}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-app-surface border border-app-border rounded-2xl p-4 sm:p-6 text-center">
                  <div className="flex items-center justify-center gap-3 mb-3">
                    <Wifi size={18} className="text-zinc-500 animate-pulse" />
                    <span className="text-sm text-zinc-500">Waiting for agent telemetry...</span>
                  </div>
                  <p className="text-xs text-zinc-600">Once the agent starts sending data, it will appear here.</p>
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
