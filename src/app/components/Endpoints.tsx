import React, { useState, useEffect } from 'react';
import { Monitor, Cpu, HardDrive, Network, Clock, Activity, ChevronRight, ArrowLeft, Wifi, Globe, Layers, Code2, Radio } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Badge, cn } from './ui/Library';
import { getEndpoints, getRecentEvents } from '../../api/client';

const EVENT_TYPE_COLORS: Record<string, string> = {
  system: 'text-app-teal-accent bg-app-teal-accent/10 border-app-teal-accent/20',
  processes: 'text-app-teal-accent bg-app-teal-accent/10 border-app-teal-accent/20',
  network: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  disk_usage: 'text-app-teal-accent bg-app-teal-accent/10 border-app-teal-accent/20',
  open_ports: 'text-red-400 bg-red-400/10 border-red-400/20',
};

interface EndpointsProps {
  onNavigate: (tab: string) => void;
}

export const Endpoints: React.FC<EndpointsProps> = ({ onNavigate }) => {
  const [activeSubTab, setActiveSubTab] = useState<'list' | 'stream'>('list');
  const [selectedEndpoint, setSelectedEndpoint] = useState<any | null>(null);
  const [endpointsList, setEndpointsList] = useState<any[]>([]);
  const [liveEvents, setLiveEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const res = await getEndpoints();
      if (res.ok && res.data) setEndpointsList(res.data.endpoints);
      setLoading(false);
    };
    fetch();
    const interval = setInterval(async () => {
      const res = await getEndpoints();
      if (res.ok && res.data) {
        setEndpointsList(res.data.endpoints);
        if (selectedEndpoint) {
          const updated = res.data.endpoints.find((e: any) => e.endpoint_name === selectedEndpoint.endpoint_name);
          if (updated) setSelectedEndpoint(updated);
        }
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [selectedEndpoint?.endpoint_name]);

  useEffect(() => {
    if (activeSubTab !== 'stream') return;
    const fetchRecent = async () => {
      const res = await getRecentEvents(50);
      if (res.ok && res.data) setLiveEvents(res.data.events);
    };
    fetchRecent();
    const interval = setInterval(fetchRecent, 5000);
    return () => clearInterval(interval);
  }, [activeSubTab]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-app-teal-accent/30 border-t-app-teal-accent rounded-full animate-spin" />
      </div>
    );
  }

  if (selectedEndpoint) {
    const ep = selectedEndpoint;
    const sys = ep.latest?.system || {};
    const net = ep.latest?.network?.summary?.[0] || { listening: 0, established: 0 };
    const diskVolumes = ep.latest?.disk_usage?.volumes || [];
    const processes = ep.latest?.processes?.top || [];
    const ports = ep.latest?.open_ports?.ports || [];

    return (
      <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
        <div className="flex items-center gap-3 md:gap-4">
          <button onClick={() => setSelectedEndpoint(null)} className="p-2 md:p-2.5 rounded-xl bg-app-surface-2 border border-app-border text-zinc-400 hover:text-white hover:border-zinc-600 transition-all">
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 md:gap-3">
              <h1 className="text-xl md:text-3xl font-bold text-white truncate">{sys.hostname || ep.endpoint_name}</h1>
              <Badge variant="success">Online</Badge>
            </div>
            <p className="text-xs md:text-sm font-mono text-zinc-500 mt-1 truncate">
              {sys.os} {sys.os_version} {sys.os_release ? `(Release ${sys.os_release})` : ''} · {sys.machine} · User: {sys.username}
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono text-zinc-500 flex-shrink-0">
            <Clock size={13} className="text-zinc-600" />
            {getTimeAgo(ep.last_seen)}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-5">
          <VitalCard icon={Cpu} label="CPU" value={`${sys.cpu_percent ?? 0}%`} barPercent={sys.cpu_percent || 0} />
          <VitalCard icon={Layers} label="Memory" value={`${sys.memory?.percent ?? sys.ram_percent ?? 0}%`} barPercent={sys.memory?.percent || sys.ram_percent || 0} sub={sys.memory ? `${formatBytes(sys.memory.used_bytes)} / ${formatBytes(sys.memory.total_bytes)}` : undefined} />
          <VitalCard icon={Clock} label="Uptime" value={sys.uptime_secs ? formatUptime(sys.uptime_secs) : '—'} />
          <VitalCard icon={Network} label="Network" value={`${net.established + net.listening}`} sub={`${net.established} est · ${net.listening} listen`} />
          <VitalCard icon={Globe} label="Open Ports" value={String(ep.latest?.open_ports?.count || ports.length)} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-app-surface border border-app-border rounded-2xl p-7 card-shadow">
            <div className="flex items-center gap-3 mb-6">
              <HardDrive size={18} className="text-app-teal-accent" />
              <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Storage Volumes</span>
              <span className="ml-auto text-[10px] font-mono text-zinc-600">{diskVolumes.length} volumes</span>
            </div>
            <div className="space-y-5">
              {diskVolumes.map((vol: any) => (
                <div key={vol.mount} className="flex items-center gap-5">
                  <span className="text-sm font-mono font-bold text-zinc-400 w-10 flex-shrink-0">{vol.mount}</span>
                  <div className="flex-1">
                    <div className="w-full bg-app-bg rounded-full h-2.5 overflow-hidden border border-app-border">
                      <div className={cn("h-full rounded-full transition-all duration-700", vol.percent > 75 ? "bg-amber-500" : "bg-app-teal-accent")} style={{ width: `${vol.percent}%` }} />
                    </div>
                  </div>
                  <span className={cn("text-sm font-bold w-14 text-right flex-shrink-0", vol.percent > 75 ? "text-amber-500" : "text-app-teal-accent")}>{vol.percent}%</span>
                  <span className="text-[11px] font-mono text-zinc-600 w-44 text-right flex-shrink-0 hidden sm:block">{formatBytes(vol.used_bytes)} / {formatBytes(vol.total_bytes)}</span>
                </div>
              ))}
              {diskVolumes.length === 0 && <p className="text-sm text-zinc-600">No disk data yet</p>}
            </div>
          </div>

          <div className="bg-app-surface border border-app-border rounded-2xl p-7 card-shadow">
            <div className="flex items-center gap-3 mb-6">
              <Activity size={18} className="text-app-teal-accent" />
              <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Top Processes</span>
              <span className="ml-auto text-[10px] font-mono text-zinc-600">{ep.latest?.processes?.count || processes.length} total</span>
            </div>
            <div className="space-y-1">
              <div className="flex items-center text-[10px] font-bold text-zinc-600 uppercase tracking-widest px-4 py-2">
                <span className="w-16">PID</span>
                <span className="flex-1">Name</span>
                <span className="w-20 text-right">{processes[0]?.cpu_percent !== undefined ? 'CPU %' : 'Mem (KB)'}</span>
              </div>
              {processes.map((proc: any) => (
                <div key={proc.pid} className="flex items-center font-mono text-[12px] px-4 py-3 rounded-lg hover:bg-white/[0.02] transition-colors">
                  <span className="w-16 text-zinc-600">{proc.pid}</span>
                  <span className={cn("flex-1", proc.name?.includes('ghostlogic') ? "text-app-teal-accent" : "text-zinc-400")}>{proc.name}</span>
                  <span className="w-20 text-right text-zinc-500">{proc.cpu_percent !== undefined ? proc.cpu_percent : (proc.mem_kb?.toLocaleString() || '—')}</span>
                </div>
              ))}
              {processes.length === 0 && <p className="text-sm text-zinc-600 px-4">No process data yet</p>}
            </div>
          </div>
        </div>

        {ports.length > 0 && (
          <div className="bg-app-surface border border-app-border rounded-2xl p-7 card-shadow">
            <div className="flex items-center gap-3 mb-6">
              <Radio size={18} className="text-app-teal-accent" />
              <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Listening Ports</span>
              <span className="ml-auto text-[10px] font-mono text-zinc-600">{ep.latest?.open_ports?.count || ports.length} total</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {ports.map((p: any, i: number) => (
                <div key={i} className="bg-app-bg border border-app-border rounded-xl p-4 font-mono text-[12px]">
                  <p className="text-app-teal-accent font-bold">:{p.port}</p>
                  <p className="text-zinc-600 mt-1">{p.proto} · {p.address}</p>
                  <p className="text-zinc-700 text-[10px] mt-1 uppercase">{p.state}</p>
                  {p.pid && <p className="text-zinc-700 text-[10px]">PID: {p.pid}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between p-5 rounded-xl bg-app-surface-2 border border-app-border">
          <div className="flex items-center gap-3">
            <Code2 size={16} className="text-zinc-500" />
            <span className="text-sm text-zinc-400">Manual event ingestion via <code className="text-app-teal-accent/60 bg-app-teal-accent/5 px-1 rounded text-[11px]">POST /api/v1/ingest</code></span>
          </div>
          <button onClick={() => onNavigate('ingest')} className="text-[11px] font-bold text-app-teal-accent hover:text-white transition-colors uppercase tracking-widest flex items-center gap-1.5">
            Developer Tools <ChevronRight size={14} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h1 className="text-2xl md:text-4xl font-bold tracking-tight">Endpoints</h1>
          <p className="mt-2 text-app-text-secondary text-sm md:text-base">Live telemetry from <code className="text-app-teal-accent/60 bg-app-teal-accent/5 px-1.5 py-0.5 rounded text-[11px]">GET /api/v1/endpoints</code></p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-app-surface border border-app-border rounded-xl overflow-hidden">
            <button onClick={() => setActiveSubTab('list')} className={cn("px-4 py-2 text-sm font-bold transition-all", activeSubTab === 'list' ? "bg-app-teal-accent/10 text-app-teal-accent" : "text-zinc-500 hover:text-zinc-300")}>
              <Monitor size={16} className="inline mr-2" />Endpoints
            </button>
            <button onClick={() => setActiveSubTab('stream')} className={cn("px-4 py-2 text-sm font-bold transition-all", activeSubTab === 'stream' ? "bg-app-teal-accent/10 text-app-teal-accent" : "text-zinc-500 hover:text-zinc-300")}>
              <Wifi size={16} className="inline mr-2" />Live Stream
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeSubTab === 'list' ? (
          <motion.div key="list" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">
            {endpointsList.length === 0 ? (
              <div className="bg-app-surface border border-app-border rounded-2xl p-12 text-center">
                <Monitor size={32} className="mx-auto text-zinc-600 mb-4" />
                <p className="text-zinc-500">No endpoints reporting yet. Run the agent on a machine to see it here.</p>
              </div>
            ) : endpointsList.map((ep) => {
              const sys = ep.latest?.system || {};
              const net = ep.latest?.network?.summary?.[0] || { listening: 0, established: 0 };
              const diskVolumes = ep.latest?.disk_usage?.volumes || [];
              const avgDisk = diskVolumes.length > 0 ? diskVolumes.reduce((a: number, v: any) => a + v.percent, 0) / diskVolumes.length : 0;
              return (
                <div key={ep.agent_id || ep.endpoint_name} onClick={() => setSelectedEndpoint(ep)} className="bg-app-surface border border-app-border rounded-2xl p-6 card-shadow hover-glow cursor-pointer group transition-all">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-xl bg-app-teal-accent/10 border border-app-teal-accent/20 flex items-center justify-center flex-shrink-0">
                        <Monitor size={22} className="text-app-teal-accent" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <p className="text-lg font-bold text-white group-hover:text-app-teal-accent transition-colors">{sys.hostname || ep.endpoint_name}</p>
                          <Badge variant="success">Online</Badge>
                        </div>
                        <p className="text-sm font-mono text-zinc-500 mt-0.5">{sys.os} {sys.os_version} ({sys.machine})</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 lg:gap-6">
                      <MiniStat label="CPU" value={`${sys.cpu_percent ?? '—'}%`} />
                      <MiniStat label="RAM" value={`${sys.memory?.percent ?? sys.ram_percent ?? '—'}%`} />
                      <MiniStat label="Disk" value={`${avgDisk.toFixed(0)}%`} />
                      <MiniStat label="Ports" value={String(ep.latest?.open_ports?.count || 0)} />
                      <MiniStat label="Events" value={ep.event_count?.toLocaleString() || '0'} />
                      <div className="hidden lg:flex items-center gap-2 text-[11px] font-mono text-zinc-600">
                        <Clock size={13} />{getTimeAgo(ep.last_seen)}
                      </div>
                      <ChevronRight size={18} className="text-zinc-700 group-hover:text-app-teal-accent transition-colors hidden lg:block" />
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="flex items-center justify-between p-5 rounded-xl bg-app-surface-2 border border-app-border">
              <div className="flex items-center gap-3">
                <Code2 size={16} className="text-zinc-500" />
                <span className="text-sm text-zinc-400">Manual event ingestion &amp; developer tools</span>
              </div>
              <button onClick={() => onNavigate('ingest')} className="text-[11px] font-bold text-app-teal-accent hover:text-white transition-colors uppercase tracking-widest flex items-center gap-1.5">
                Open Ingest <ChevronRight size={14} />
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div key="stream" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">
            <div className="bg-app-surface border border-app-border rounded-2xl card-shadow overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-app-border bg-app-surface-2">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-app-teal-accent animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.4)]" />
                  <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">GET /api/v1/buffer/recent?limit=50</span>
                </div>
                <span className="text-[11px] font-mono text-zinc-600">{liveEvents.length} events</span>
              </div>
              <div className="divide-y divide-app-border/30 max-h-[600px] overflow-y-auto">
                <AnimatePresence initial={false}>
                  {liveEvents.map((evt, i) => (
                    <motion.div key={`${evt.timestamp}-${evt.event_type}-${i}`} initial={{ opacity: 0, x: -10, height: 0 }} animate={{ opacity: 1, x: 0, height: 'auto' }} className="flex flex-col sm:flex-row sm:items-center gap-3 px-6 py-4 hover:bg-white/[0.02] transition-colors">
                      <span className={cn("text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md border w-fit", EVENT_TYPE_COLORS[evt.event_type] || 'text-zinc-400 bg-zinc-800 border-zinc-700')}>{evt.event_type}</span>
                      <span className="text-sm text-zinc-400 flex-1">{evt.endpoint}</span>
                      <span className="text-[10px] font-mono text-zinc-700 flex-shrink-0">{new Date(evt.timestamp).toLocaleTimeString([], { hour12: false })}</span>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const MiniStat: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="text-center min-w-[50px]">
    <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">{label}</p>
    <p className="text-sm font-bold text-white font-mono mt-0.5">{value}</p>
  </div>
);

const VitalCard: React.FC<{ icon: React.ElementType; label: string; value: string; barPercent?: number; sub?: string }> = ({ icon: Icon, label, value, barPercent, sub }) => (
  <div className="bg-app-surface border border-app-border rounded-2xl p-6 card-shadow space-y-3">
    <div className="flex items-center gap-2">
      <Icon size={15} className="text-app-teal-accent" />
      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{label}</span>
    </div>
    <p className="text-2xl font-bold text-white">{value}</p>
    {sub && <p className="text-[11px] font-mono text-zinc-600">{sub}</p>}
    {barPercent !== undefined && (
      <div className="w-full bg-app-bg rounded-full h-1.5 overflow-hidden">
        <div className="h-full rounded-full bg-app-teal-accent shadow-[0_0_6px_rgba(52,211,153,0.3)] transition-all duration-700" style={{ width: `${Math.max(barPercent, 2)}%` }} />
      </div>
    )}
  </div>
);

function formatBytes(bytes: number): string {
  const gb = bytes / (1024 ** 3);
  return gb >= 1 ? `${gb.toFixed(1)} GB` : `${(bytes / (1024 ** 2)).toFixed(1)} MB`;
}

function formatUptime(secs: number): string {
  const d = Math.floor(secs / 86400);
  const h = Math.floor((secs % 86400) / 3600);
  return `${d}d ${h}h`;
}

function getTimeAgo(iso: string): string {
  const diff = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 5) return 'just now';
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
