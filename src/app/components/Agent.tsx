import React, { useState, useEffect, useRef } from 'react';
import {
  Download,
  Copy,
  Check,
  Terminal,
  Monitor,
  Server,
  Apple,
  ExternalLink,
  Cpu,
  Shield,
  Key,
} from 'lucide-react';
import { cn } from './ui/Library';

type Platform = 'linux' | 'windows' | 'macos';

interface AgentProps {
  onNavigate?: (tab: string) => void;
}

const REPO_URL = 'https://github.com/GhostLogicAI/blackbox-agent';
const RELEASE_URL = `${REPO_URL}/releases/latest`;
const ZIP_URL = `${REPO_URL}/archive/refs/heads/main.zip`;

const INSTALL_COMMANDS: Record<Platform, string> = {
  linux: `git clone ${REPO_URL}.git
cd blackbox-agent
sudo TENANT_KEY="YOUR_KEY" bash install/linux/install.sh`,
  windows: `git clone ${REPO_URL}.git
cd blackbox-agent
.\\install\\windows\\install.ps1 -TenantKey "YOUR_KEY"`,
  macos: `git clone ${REPO_URL}.git
cd blackbox-agent
TENANT_KEY="YOUR_KEY" bash install/mac/install.sh`,
};

const PLATFORM_INFO: Record<Platform, { label: string; icon: React.ElementType; supported: string }> = {
  linux: { label: 'Linux', icon: Server, supported: 'Ubuntu 22/24, Debian 12+' },
  windows: { label: 'Windows', icon: Monitor, supported: 'Windows 10/11' },
  macos: { label: 'macOS', icon: Apple, supported: 'macOS 12+' },
};

export const Agent: React.FC<AgentProps> = ({ onNavigate }) => {
  const [platform, setPlatform] = useState<Platform>('linux');
  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear timeout on unmount to prevent state update on unmounted component
  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  const handleCopy = async () => {
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    try {
      await navigator.clipboard.writeText(INSTALL_COMMANDS[platform]);
    } catch {
      // Clipboard API unavailable (e.g. non-HTTPS) — silently skip
    }
    setCopied(true);
    copyTimerRef.current = setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h1>Agent</h1>
          <p className="mt-2">Download and install the GhostLogic endpoint agent.</p>
        </div>
        <div className="flex gap-3">
          <a
            href={RELEASE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-app-teal-accent text-black font-bold text-sm hover:bg-app-teal-accent/90 transition-all"
          >
            <Download size={16} />
            GitHub Releases
          </a>
          <a
            href={ZIP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-app-surface-2 border border-app-border text-app-text-primary font-medium text-sm hover:bg-white/10 transition-all"
          >
            <Download size={16} />
            Download ZIP
          </a>
        </div>
      </div>

      {/* What it does */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-app-surface-2 border border-app-border space-y-3">
          <div className="w-10 h-10 rounded-xl bg-app-teal-accent/10 flex items-center justify-center">
            <Cpu size={20} className="text-app-teal-accent" />
          </div>
          <h3 className="text-sm font-bold text-app-text-primary">Lightweight Telemetry</h3>
          <p className="text-xs text-app-text-secondary leading-relaxed">
            Collects hostname, OS, processes, network, CPU, RAM every 5 seconds. No kernel hooks.
          </p>
        </div>
        <div className="p-5 rounded-2xl bg-app-surface-2 border border-app-border space-y-3">
          <div className="w-10 h-10 rounded-xl bg-app-teal-accent/10 flex items-center justify-center">
            <Shield size={20} className="text-app-teal-accent" />
          </div>
          <h3 className="text-sm font-bold text-app-text-primary">Evidence Sealing</h3>
          <p className="text-xs text-app-text-secondary leading-relaxed">
            Seals evidence capsules every 60 seconds via the Black Box API. Tamper-evident chain.
          </p>
        </div>
        <div className="p-5 rounded-2xl bg-app-surface-2 border border-app-border space-y-3">
          <div className="w-10 h-10 rounded-xl bg-app-teal-accent/10 flex items-center justify-center">
            <Terminal size={20} className="text-app-teal-accent" />
          </div>
          <h3 className="text-sm font-bold text-app-text-primary">Zero Dependencies</h3>
          <p className="text-xs text-app-text-secondary leading-relaxed">
            Python 3.10+ standard library only. No Docker, no pip packages, no build tools.
          </p>
        </div>
      </div>

      {/* Tenant Key */}
      <div className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20 flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
          <Key size={20} className="text-amber-500" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-amber-400">Tenant Key Required</h3>
          <p className="text-xs text-app-text-secondary">
            You need a tenant key to authenticate the agent.{' '}
            <button
              onClick={() => onNavigate?.('settings')}
              className="text-amber-400 hover:text-amber-300 underline underline-offset-2"
            >
              Go to Settings to generate one
            </button>
            .
          </p>
        </div>
      </div>

      {/* Install Instructions */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-app-text-primary">Install</h2>

        {/* Platform tabs */}
        <div className="flex gap-2" role="tablist" aria-label="Platform">
          {(Object.keys(PLATFORM_INFO) as Platform[]).map((p) => {
            const info = PLATFORM_INFO[p];
            return (
              <button
                key={p}
                role="tab"
                aria-selected={platform === p}
                onClick={() => setPlatform(p)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all border',
                  platform === p
                    ? 'bg-app-teal-accent/10 text-app-teal-accent border-app-teal-accent/20'
                    : 'bg-app-surface-2 text-app-text-secondary border-app-border hover:text-app-text-primary hover:bg-white/5'
                )}
              >
                <info.icon size={16} />
                {info.label}
              </button>
            );
          })}
        </div>

        {/* Code block */}
        <div className="rounded-2xl bg-app-bg border border-app-border overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-app-border">
            <div className="flex items-center gap-2">
              <Terminal size={14} className="text-app-text-secondary" />
              <span className="text-[11px] font-mono text-app-text-secondary uppercase tracking-wider">
                {PLATFORM_INFO[platform].label} — {PLATFORM_INFO[platform].supported}
              </span>
            </div>
            <button
              onClick={handleCopy}
              aria-label={copied ? 'Copied to clipboard' : 'Copy install command'}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all',
                copied
                  ? 'bg-app-teal-accent/10 text-app-teal-accent'
                  : 'bg-app-surface-2 text-app-text-secondary hover:text-app-text-primary hover:bg-white/10'
              )}
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <pre className="p-4 text-sm font-mono text-app-text-primary overflow-x-auto scrollbar-hide leading-relaxed">
            <code>{INSTALL_COMMANDS[platform]}</code>
          </pre>
        </div>
      </div>

      {/* Requirements */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-app-text-primary">Requirements</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-app-surface-2 border border-app-border">
            <h3 className="text-sm font-bold text-app-text-primary mb-2">All Platforms</h3>
            <ul className="space-y-1.5 text-xs text-app-text-secondary">
              <li>Python 3.10+</li>
              <li>Git (for clone install)</li>
              <li>Internet access to reach Black Box API</li>
            </ul>
          </div>
          <div className="p-4 rounded-2xl bg-app-surface-2 border border-app-border">
            <h3 className="text-sm font-bold text-app-text-primary mb-2">Service Setup</h3>
            <ul className="space-y-1.5 text-xs text-app-text-secondary">
              <li>Linux: systemd (auto-configured by installer)</li>
              <li>Windows: Scheduled Task (auto-configured by installer)</li>
              <li>macOS: launchd (auto-configured by installer)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Links */}
      <div className="flex flex-wrap gap-3 pt-2 pb-8">
        <a
          href={REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-app-surface-2 border border-app-border text-app-text-secondary text-sm hover:text-app-text-primary hover:bg-white/5 transition-all"
        >
          <ExternalLink size={14} />
          GitHub Repo
        </a>
        <a
          href={`${REPO_URL}/blob/main/README.md`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-app-surface-2 border border-app-border text-app-text-secondary text-sm hover:text-app-text-primary hover:bg-white/5 transition-all"
        >
          <ExternalLink size={14} />
          Full Documentation
        </a>
      </div>
    </div>
  );
};
