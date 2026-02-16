import React, { useState, useEffect } from 'react';
import { Database, Activity, ShieldCheck, Clock, HardDrive, Wifi, Monitor, Cpu, Layers, Network } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { StatsCard, cn } from './ui/Library';
import { getStatus, getEndpoints, getRecentEvents } from '../../api/client';

interface StatusData {
  capsule_count: number;
  total_storage_mb: string;
  buffer_events: number;
  total_events: number;
  auto_seal: {
    enabled: boolean;
    interval_seconds: number;
    event_threshold: number;
    last_seal: string | null;
    total_seals: number;
  };
}

interface EndpointSummary {
  endpoint_name: string;
  agent_id: string;
  last_seen: string;
  event_count: number;
  latest: Record<string, any>;
}

interface RecentEvent {
  event_type: string;
  endpoint: string;
  timestamp: string;
  ingested_at: string;
}

export const Dashboard: React.FC = () => {
  const [status, setStatus] = useState<StatusData | null>(null);
  const [endpoints, setEndpoints] = useState<EndpointSummary[]>([]);
  const [liveStream, setLiveStream] = useState<RecentEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      const [statusRes, endpointsRes, recentRes] = await Promise.all([
        getStatus(),
        getEndpoints(),
        getRecentEvents(8),
      ]);
      if (statusRes.ok && statusRes.data) setStatus(statusRes.data);
      if (endpointsRes.ok && endpointsRes.data) setEndpoints(endpointsRes.data.endpoints);
      if (recentRes.ok && recentRes.data) setLiveStream(recentRes.data.events);
      setLoading(false);
    };
    fetchAll();
    const interval = setInterval(async () => {
      const [statusRes, endpointsRes, recentRes] = await Promise.all([
        getStatus(),
        getEndpoints(),
        getRecentEvents(8),
      ]);
      if (statusRes.ok && statusRes.data) setStatus(statusRes.data);
      if (endpointsRes.ok && endpointsRes.data) setEndpoints(endpointsRes.data.endpoints);
      if (recentRes.ok && recentRes.data) setLiveStream(recentRes.data.events);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-app-teal-accent/30 border-t-app-teal-accent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 md:gap-6 mb-2 md:mb-4">
        <div>
          <h1 className="text-2xl md:text-4xl font-bold tracking-tight">Console Overview</h1>
          <p className="mt-2 md:mt-3 text-app-text-secondary text-sm md:text-lg">Operational status from <code className="text-app-teal-accent/60 bg-app-teal-accent/5 px-1.5 py-0.5 rounded text-[11px] md:text-sm">GET /api/v1/status</code></p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        <StatsCard label="Capsules Sealed" value={status?.capsule_count?.toLocaleString() || '0'} icon={Database} />
        <StatsCard label="Total Storage" value={formatStorageMB(parseFloat(status?.total_storage_mb || '0'))} icon={HardDrive} />
        <StatsCard label="Unsealed Evidence" value={status?.buffer_events?.toLocaleString() || '0'} icon={Activity} />
        <StatsCard label="Last Seal" value={status?.auto_seal?.last_seal ? getTimeAgo(status.auto_seal.last_seal) : 'Never'} icon={Clock} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
        <div className="lg:col-span-8 space-y-4 md:space-y-6">
          <div className="bg-app-bg border border-app-border rounded-2xl p-4 md:p-6 overflow-hidden">
            <div className="flex items-center justify-between mb-4 md:mb-5">
              <h3 className="text-[10px] font-bold text-app-text-secondary uppercase tracking-[0.2em] flex items-center gap-2">
                <Wifi className="w-4 h-4 text-app-teal-accent" /> Unsealed Evidence Feed
              </h3>
              <span className="text-[10px] font-mono text-zinc-600 hidden sm:inline">GET /api/v1/buffer/recent</span>
            </div>
            <div className="space-y-1.5">
              <AnimatePresence initial={false}>
                {liveStream.length > 0 ? liveStream.map((log, i) => (
                  <motion.div
                    key={`${log.timestamp}-${log.event_type}-${i}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex flex-col sm:flex-row gap-2 sm:gap-4 py-2.5 border-b border-app-border last:border-0 font-mono text-[11px]"
                  >
                    <span className="text-zinc-600">[{new Date(log.timestamp).toLocaleTimeString([], { hour12: false })}]</span>
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-bold uppercase border w-fit",
                      EVENT_TYPE_STYLES[log.event_type] || "text-zinc-400 bg-zinc-800 border-zinc-700"
                    )}>
                      {log.event_type}
                    </span>
                    <span className="text-app-text-secondary flex-1">{log.endpoint}</span>
                  </motion.div>
                )) : (
                  <div className="py-8 text-center text-zinc-600 text-sm font-mono">Awaiting evidence events...</div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="bg-app-surface border border-app-border rounded-2xl md:rounded-[1.5rem] p-5 md:p-8 card-shadow">
            <div className="flex items-center gap-3 mb-5 md:mb-8 border-b border-app-border pb-4 md:pb-6">
              <Monitor className="w-5 h-5 md:w-6 md:h-6 text-app-teal-accent" />
              <h3 className="text-lg md:text-xl font-bold text-app-text-primary tracking-tight">Endpoints</h3>
              <span className="ml-auto text-[11px] font-mono font-bold text-app-teal-accent bg-app-teal-accent/10 border border-app-teal-accent/20 px-2.5 py-1 rounded-full">
                {endpoints.length}
              </span>
            </div>
            <div className="space-y-4">
              {endpoints.length === 0 ? (
                <div className="py-6 text-center text-zinc-600 text-sm">No endpoints reporting yet</div>
              ) : endpoints.map((ep) => (
                <div key={ep.agent_id} className="p-4 rounded-xl bg-app-bg border border-app-border space-y-4 hover:border-app-teal-accent/20 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-app-teal-accent animate-pulse" />
                      <span className="text-sm font-bold text-white">{ep.endpoint_name}</span>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-600">{getTimeAgo(ep.last_seen)}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center">
                      <Cpu size={13} className="mx-auto text-zinc-600 mb-1" />
                      <p className="text-[10px] text-zinc-600 uppercase">CPU</p>
                      <p className="text-sm font-bold text-white font-mono">{(ep.latest?.system as any)?.cpu_percent ?? '—'}%</p>
                    </div>
                    <div className="text-center">
                      <Layers size={13} className="mx-auto text-zinc-600 mb-1" />
                      <p className="text-[10px] text-zinc-600 uppercase">RAM</p>
                      <p className="text-sm font-bold text-white font-mono">{(ep.latest?.system as any)?.ram_percent ?? '—'}%</p>
                    </div>
                    <div className="text-center">
                      <Network size={13} className="mx-auto text-zinc-600 mb-1" />
                      <p className="text-[10px] text-zinc-600 uppercase">Events</p>
                      <p className="text-sm font-bold text-white font-mono">{(ep.event_count / 1000).toFixed(1)}k</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-app-surface border border-app-border rounded-2xl md:rounded-[1.5rem] p-5 md:p-8 card-shadow">
            <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-5 flex items-center gap-2">
              <ShieldCheck size={14} className="text-app-teal-accent" /> Auto-Seal Config
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-app-border/30">
                <span className="text-sm text-zinc-500">Enabled</span>
                <span className={cn("text-sm font-bold", status?.auto_seal?.enabled ? "text-app-teal-accent" : "text-zinc-600")}>
                  {status?.auto_seal?.enabled ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-app-border/30">
                <span className="text-sm text-zinc-500">Interval</span>
                <span className="text-sm font-mono font-bold text-white">{Math.floor((status?.auto_seal?.interval_seconds || 300) / 60)}m</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-zinc-500">Evidence Feed</span>
                <span className="text-sm font-mono font-bold text-white">{status?.buffer_events?.toLocaleString() || '0'} events</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const EVENT_TYPE_STYLES: Record<string, string> = {
  system: 'text-app-teal-accent bg-app-teal-accent/10 border-app-teal-accent/20',
  processes: 'text-app-teal-accent bg-app-teal-accent/10 border-app-teal-accent/20',
  network: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  disk_usage: 'text-app-teal-accent bg-app-teal-accent/10 border-app-teal-accent/20',
  open_ports: 'text-red-400 bg-red-400/10 border-red-400/20',
};

function formatStorageMB(mb: number): string {
  if (mb >= 1024 * 1024) return `${(mb / (1024 * 1024)).toFixed(1)} TB`;
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
  return `${mb.toFixed(1)} MB`;
}

function getTimeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
