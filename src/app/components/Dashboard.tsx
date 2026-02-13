import React, { useState, useEffect } from 'react';
import {
  Database,
  Activity,
  ShieldCheck,
  Clock,
  HardDrive,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { StatsCard, PanelCard, cn } from './ui/Library';
import { getStatus, getHealth, getInfo, hasTenantKey } from '../../api/client';

export const Dashboard: React.FC = () => {
  const [status, setStatus] = useState<any>(null);
  const [health, setHealth] = useState<any>(null);
  const [info, setInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    const [healthRes, infoRes] = await Promise.all([getHealth(), getInfo()]);
    if (healthRes.ok) setHealth(healthRes.data);
    if (infoRes.ok) setInfo(infoRes.data);

    if (hasTenantKey()) {
      const statusRes = await getStatus();
      if (statusRes.ok) setStatus(statusRes.data);
      else setError(statusRes.error);
    }

    setLoading(false);
    setLastRefresh(new Date());
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatTimeSince = (isoString: string | null) => {
    if (!isoString) return 'Never';
    const diff = Date.now() - new Date(isoString).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins / 60)}h ago`;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h1>Console Overview</h1>
          <p className="mt-2">Live operational intelligence from the Black Box backend.</p>
        </div>
        <button onClick={fetchData} className="flex items-center gap-2 text-xs text-zinc-500 hover:text-app-teal-accent transition-colors">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Last: {lastRefresh.toLocaleTimeString()}
        </button>
      </div>

      {!hasTenantKey() && (
        <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 flex gap-3 items-center">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
          <p className="text-sm text-amber-500/80">No tenant API key configured. Set one in <span className="font-bold">Settings</span> to see capsule stats.</p>
        </div>
      )}

      <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-4 lg:gap-6">
        <div className="col-span-4 md:col-span-3 lg:col-span-3">
          <StatsCard label="Capsules Stored" value={status ? status.capsule_count.toLocaleString() : '—'} icon={Database} />
        </div>
        <div className="col-span-4 md:col-span-3 lg:col-span-3">
          <StatsCard label="Total Storage" value={status ? `${status.total_storage_mb} MB` : '—'} icon={HardDrive} />
        </div>
        <div className="col-span-4 md:col-span-3 lg:col-span-3">
          <StatsCard label="Total Events" value={status ? status.total_events.toLocaleString() : '—'} icon={ShieldCheck} />
        </div>
        <div className="col-span-4 md:col-span-3 lg:col-span-3">
          <StatsCard label="Last Seal" value={status ? formatTimeSince(status.auto_seal?.last_seal) : '—'} icon={Clock} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          <PanelCard title="Server Status" icon={Activity}>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-app-border/50">
                <span className="text-sm text-zinc-500">Health</span>
                <span className={cn("font-mono text-sm font-bold", health?.status === 'healthy' ? 'text-app-teal-accent' : 'text-app-red-alert')}>
                  {health?.status || 'Unknown'}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-app-border/50">
                <span className="text-sm text-zinc-500">Version</span>
                <span className="font-mono text-sm text-zinc-200">{info?.version || '—'}</span>
              </div>
              {status && (
                <>
                  <div className="flex justify-between items-center py-2 border-b border-app-border/50">
                    <span className="text-sm text-zinc-500">Storage Provider</span>
                    <span className="font-mono text-sm text-zinc-200">{status.storage_provider}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-app-border/50">
                    <span className="text-sm text-zinc-500">Format</span>
                    <span className="font-mono text-sm text-zinc-200">{status.format} ({status.compression})</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-app-border/50">
                    <span className="text-sm text-zinc-500">Buffer Events</span>
                    <span className="font-mono text-sm text-zinc-200">{status.buffer_events}</span>
                  </div>
                </>
              )}
            </div>
          </PanelCard>

          {status?.auto_seal && (
            <PanelCard title="Auto-Seal Configuration" icon={ShieldCheck}>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-app-border/50">
                  <span className="text-sm text-zinc-500">Enabled</span>
                  <span className={cn("font-mono text-sm font-bold", status.auto_seal.enabled ? 'text-app-teal-accent' : 'text-zinc-500')}>
                    {status.auto_seal.enabled ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-app-border/50">
                  <span className="text-sm text-zinc-500">Interval</span>
                  <span className="font-mono text-sm text-zinc-200">{status.auto_seal.interval_seconds}s</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-app-border/50">
                  <span className="text-sm text-zinc-500">Event Threshold</span>
                  <span className="font-mono text-sm text-zinc-200">{status.auto_seal.event_threshold.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-app-border/50">
                  <span className="text-sm text-zinc-500">Total Auto-Seals</span>
                  <span className="font-mono text-sm text-zinc-200">{status.auto_seal.total_seals}</span>
                </div>
              </div>
            </PanelCard>
          )}
        </div>

        <div className="lg:col-span-4">
          <PanelCard title="Connection">
            <div className="space-y-4">
              <div className="flex gap-4 p-3 rounded-xl bg-white/5">
                <div className={cn("w-2 h-2 rounded-full mt-1.5", health?.status === 'healthy' ? 'bg-app-teal-accent animate-pulse' : 'bg-app-red-alert')} />
                <div>
                  <p className="text-sm font-medium text-app-text-primary">{health?.status === 'healthy' ? 'Backend Online' : 'Backend Unreachable'}</p>
                  <p className="text-[10px] text-app-text-secondary font-mono mt-1">blackbox.ghostlogic.tech</p>
                </div>
              </div>
              <div className="flex gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors">
                <div className={cn("w-2 h-2 rounded-full mt-1.5", hasTenantKey() ? 'bg-app-teal-accent' : 'bg-zinc-500')} />
                <div>
                  <p className="text-sm font-medium text-app-text-primary">{hasTenantKey() ? 'Tenant Key Active' : 'No Tenant Key'}</p>
                  <p className="text-[10px] text-app-text-secondary font-mono mt-1">{hasTenantKey() ? 'Authenticated' : 'Set in Settings'}</p>
                </div>
              </div>
              {error && (
                <div className="flex gap-4 p-3 rounded-xl bg-app-red-alert/5">
                  <div className="w-2 h-2 rounded-full mt-1.5 bg-app-red-alert" />
                  <div>
                    <p className="text-sm font-medium text-app-red-alert">Error</p>
                    <p className="text-[10px] text-zinc-500 mt-1">{error}</p>
                  </div>
                </div>
              )}
            </div>
          </PanelCard>
        </div>
      </div>
    </div>
  );
};
