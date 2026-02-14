import React, { useState, useEffect } from 'react';
import {
  Database,
  Activity,
  ShieldCheck,
  Clock,
  HardDrive,
  AlertTriangle,
  RefreshCw,
  Monitor,
  Cpu,
  MemoryStick,
  Network,
  Globe,
  Server,
  Disc,
  Radio,
} from 'lucide-react';
import { StatsCard, PanelCard, Badge, cn } from './ui/Library';
import { getStatus, getHealth, getInfo, getEndpoints, hasTenantKey } from '../../api/client';

// ── Helpers ──

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(i > 1 ? 1 : 0)} ${sizes[i]}`;
}

function formatUptime(secs: number): string {
  const d = Math.floor(secs / 86400);
  const h = Math.floor((secs % 86400) / 3600);
  if (d > 0) return `${d}d ${h}h`;
  const m = Math.floor((secs % 3600) / 60);
  return `${h}h ${m}m`;
}

function formatTimeSince(isoString: string | null): string {
  if (!isoString) return 'Never';
  const diff = Date.now() - new Date(isoString).getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 5) return 'Just now';
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

function pctColor(pct: number): string {
  if (pct >= 90) return 'text-app-red-alert';
  if (pct >= 70) return 'text-amber-500';
  return 'text-app-teal-accent';
}

function pctBarColor(pct: number): string {
  if (pct >= 90) return 'bg-app-red-alert';
  if (pct >= 70) return 'bg-amber-500';
  return 'bg-app-teal-accent';
}

// ── Endpoint System Card ──

const EndpointCard: React.FC<{ ep: any }> = ({ ep }) => {
  const sys = ep.latest?.system || {};
  const disk = ep.latest?.disk_usage || {};
  const ports = ep.latest?.open_ports || {};
  const procs = ep.latest?.processes || {};
  const net = ep.latest?.network || {};

  const hostname = sys.hostname || ep.endpoint_name || 'Unknown';
  const os = sys.os || '—';
  const osVersion = sys.os_version || sys.os_release || '';
  const cpuModel = sys.cpu_model || '';
  const cpuCores = sys.cpu_cores || '';
  const ramPct = sys.ram_percent ?? sys.memory_percent ?? 0;
  const memory = sys.memory || {};
  const totalMem = memory.total_bytes || sys.total_memory_gb ? (sys.total_memory_gb ? sys.total_memory_gb * 1073741824 : memory.total_bytes) : 0;
  const uptimeSecs = sys.uptime_secs ?? (sys.uptime_hours ? sys.uptime_hours * 3600 : 0);
  const cpuPct = sys.cpu_percent ?? 0;
  const volumes = disk.volumes || [];
  const portCount = ports.count ?? 0;
  const procCount = procs.count ?? 0;
  const netSummary = net.summary?.[0] || {};

  return (
    <div className="bg-app-surface border border-app-border rounded-2xl p-6 card-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 border-b border-app-border pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-app-teal-accent/10 border border-app-teal-accent/20">
            <Monitor className="w-6 h-6 text-app-teal-accent" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-app-text-primary">{hostname}</h2>
            <p className="text-xs text-app-text-secondary font-mono mt-0.5">
              {os} {osVersion} {sys.machine ? `(${sys.machine})` : ''}
            </p>
          </div>
        </div>
        <div className="text-right">
          <Badge variant="success">Online</Badge>
          <p className="text-[10px] text-app-text-secondary mt-1">
            {formatTimeSince(ep.last_seen)}
          </p>
        </div>
      </div>

      {/* System metrics grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {/* CPU */}
        <div className="bg-app-surface-2 rounded-xl p-4 border border-app-border/50">
          <div className="flex items-center gap-2 mb-2">
            <Cpu className="w-4 h-4 text-app-text-secondary" />
            <span className="text-[10px] uppercase tracking-widest text-app-text-secondary font-bold">CPU</span>
          </div>
          <p className={cn("text-2xl font-bold", pctColor(cpuPct))}>{cpuPct}%</p>
          <p className="text-[10px] text-app-text-secondary mt-1 truncate" title={cpuModel}>
            {cpuCores ? `${cpuCores} cores` : ''}{cpuModel ? ` · ${cpuModel}` : ''}
          </p>
        </div>

        {/* Memory */}
        <div className="bg-app-surface-2 rounded-xl p-4 border border-app-border/50">
          <div className="flex items-center gap-2 mb-2">
            <MemoryStick className="w-4 h-4 text-app-text-secondary" />
            <span className="text-[10px] uppercase tracking-widest text-app-text-secondary font-bold">Memory</span>
          </div>
          <p className={cn("text-2xl font-bold", pctColor(ramPct))}>{ramPct.toFixed(1)}%</p>
          <p className="text-[10px] text-app-text-secondary mt-1">
            {totalMem ? formatBytes(totalMem) + ' total' : ''}
          </p>
        </div>

        {/* Uptime */}
        <div className="bg-app-surface-2 rounded-xl p-4 border border-app-border/50">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-app-text-secondary" />
            <span className="text-[10px] uppercase tracking-widest text-app-text-secondary font-bold">Uptime</span>
          </div>
          <p className="text-2xl font-bold text-app-text-primary">{uptimeSecs ? formatUptime(uptimeSecs) : '—'}</p>
          <p className="text-[10px] text-app-text-secondary mt-1">
            {sys.username ? `User: ${sys.username}` : ''}
          </p>
        </div>

        {/* Network */}
        <div className="bg-app-surface-2 rounded-xl p-4 border border-app-border/50">
          <div className="flex items-center gap-2 mb-2">
            <Network className="w-4 h-4 text-app-text-secondary" />
            <span className="text-[10px] uppercase tracking-widest text-app-text-secondary font-bold">Network</span>
          </div>
          <p className="text-2xl font-bold text-app-text-primary">{netSummary.established ?? '—'}</p>
          <p className="text-[10px] text-app-text-secondary mt-1">
            Established · {netSummary.listening ?? 0} listening
          </p>
        </div>
      </div>

      {/* Disk volumes + Ports row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Disk volumes */}
        {volumes.length > 0 && (
          <div className="lg:col-span-8">
            <div className="flex items-center gap-2 mb-3">
              <Disc className="w-4 h-4 text-app-text-secondary" />
              <span className="text-xs font-bold text-app-text-secondary uppercase tracking-wider">Storage Volumes</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {volumes.map((v: any, i: number) => {
                const pct = v.percent || 0;
                return (
                  <div key={i} className="bg-app-surface-2 rounded-xl p-3 border border-app-border/50">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-mono text-app-text-primary font-bold">{v.mount}</span>
                      <span className={cn("text-xs font-bold", pctColor(pct))}>{pct}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div className={cn("h-full rounded-full transition-all", pctBarColor(pct))} style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-[10px] text-app-text-secondary mt-1.5">
                      {formatBytes(v.used_bytes || 0)} / {formatBytes(v.total_bytes || 0)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Quick stats */}
        <div className={cn("space-y-3", volumes.length > 0 ? "lg:col-span-4" : "lg:col-span-12")}>
          <div className="flex items-center gap-2 mb-3">
            <Radio className="w-4 h-4 text-app-text-secondary" />
            <span className="text-xs font-bold text-app-text-secondary uppercase tracking-wider">Telemetry</span>
          </div>
          <div className="bg-app-surface-2 rounded-xl p-3 border border-app-border/50 flex justify-between items-center">
            <span className="text-xs text-app-text-secondary">Open Ports</span>
            <span className="text-sm font-bold text-app-text-primary font-mono">{portCount}</span>
          </div>
          <div className="bg-app-surface-2 rounded-xl p-3 border border-app-border/50 flex justify-between items-center">
            <span className="text-xs text-app-text-secondary">Processes</span>
            <span className="text-sm font-bold text-app-text-primary font-mono">{procCount}</span>
          </div>
          <div className="bg-app-surface-2 rounded-xl p-3 border border-app-border/50 flex justify-between items-center">
            <span className="text-xs text-app-text-secondary">Events Collected</span>
            <span className="text-sm font-bold text-app-text-primary font-mono">{ep.event_count?.toLocaleString() ?? 0}</span>
          </div>
          <div className="bg-app-surface-2 rounded-xl p-3 border border-app-border/50 flex justify-between items-center">
            <span className="text-xs text-app-text-secondary">Agent ID</span>
            <span className="text-[10px] font-mono text-app-text-secondary truncate ml-2 max-w-[140px]" title={ep.agent_id}>{ep.agent_id?.slice(0, 8) || '—'}...</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Dashboard ──

export const Dashboard: React.FC = () => {
  const [status, setStatus] = useState<any>(null);
  const [health, setHealth] = useState<any>(null);
  const [info, setInfo] = useState<any>(null);
  const [endpoints, setEndpoints] = useState<any[]>([]);
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
      const [statusRes, endpointsRes] = await Promise.all([getStatus(), getEndpoints()]);
      if (statusRes.ok) setStatus(statusRes.data);
      else setError(statusRes.error);
      if (endpointsRes.ok) setEndpoints(endpointsRes.data?.endpoints || []);
    }

    setLoading(false);
    setLastRefresh(new Date());
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
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

      {/* No tenant key warning */}
      {!hasTenantKey() && (
        <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 flex gap-3 items-center">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
          <p className="text-sm text-amber-500/80">No tenant API key configured. Set one in <span className="font-bold">Settings</span> to see capsule stats.</p>
        </div>
      )}

      {/* ── ENDPOINT SYSTEM INFO HERO ── */}
      {endpoints.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-app-teal-accent" />
            <h2 className="text-lg font-bold text-app-text-primary">Connected Endpoints</h2>
            <Badge variant="success">{endpoints.length}</Badge>
          </div>
          {endpoints.map((ep, i) => (
            <EndpointCard key={ep.endpoint_name || i} ep={ep} />
          ))}
        </div>
      )}

      {/* No endpoints placeholder */}
      {hasTenantKey() && endpoints.length === 0 && !loading && (
        <div className="bg-app-surface border border-app-border rounded-2xl p-8 text-center card-shadow">
          <Server className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
          <p className="text-sm text-app-text-secondary">No endpoints reporting yet. Start the agent to see system information here.</p>
        </div>
      )}

      {/* ── STATS BAR ── */}
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

      {/* ── SERVER + CONNECTION ── */}
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
                  <p className="text-[10px] text-app-text-secondary font-mono mt-1">api.ghostlogic.tech</p>
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
