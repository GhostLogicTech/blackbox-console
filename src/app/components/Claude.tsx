import React, { useState, useEffect, useMemo } from 'react';
import {
  Code2, Activity, Clock, FileCode, Plus, Server, RefreshCw,
} from 'lucide-react';
import { motion } from 'motion/react';
import { StatsCard, cn } from './ui/Library';
import { getEndpoints, getRecentEvents } from '../../api/client';
import { AttachAgentWatchdog } from './AttachAgentWatchdog';

/**
 * Claude tab — focused view for AI-agent transcript ingestion (logicd).
 *
 * Filters the existing /api/v1/buffer/recent + /api/v1/endpoints feeds
 * to events shipped with agent_id="logicd" (the watchdog daemon). Codex
 * sessions land here too — they share the daemon. Surfaces last_seen,
 * event count, and the live tail. This view is read-only; ingest
 * happens via the daemon, not the dashboard.
 */

interface Endpoint {
  endpoint_name: string;
  agent_id: string;
  last_seen: string;
  event_count: number;
  latest: Record<string, any>;
}

interface RecentEvent {
  event_type: string;
  endpoint: string;
  agent_id: string;
  timestamp: string;
  ingested_at: string;
  data?: Record<string, any>;
}

const RELATIVE_THRESHOLDS: [number, string][] = [
  [60, 's'], [3600, 'm'], [86_400, 'h'], [Infinity, 'd'],
];

function relativeTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '—';
  const sec = Math.max(0, Math.round((Date.now() - t) / 1000));
  if (sec < 60) return `${sec}s ago`;
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 48) return `${hr}h ago`;
  return `${Math.round(hr / 24)}d ago`;
}

export const Claude: React.FC = () => {
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [events, setEvents] = useState<RecentEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAttach, setShowAttach] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const fetchAll = async () => {
      const [epRes, evRes] = await Promise.all([
        getEndpoints(),
        getRecentEvents(200),
      ]);
      if (cancelled) return;
      if (epRes.ok && epRes.data) setEndpoints(epRes.data.endpoints);
      if (evRes.ok && evRes.data) setEvents(evRes.data.events);
      setLoading(false);
    };
    fetchAll();
    const interval = setInterval(fetchAll, 5000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [refreshTick]);

  // Filter to logicd-shipped events. Codex + Claude Code both go through
  // logicd, so agent_id is the right discriminator (and the projection in
  // /buffer/recent doesn't include the source field).
  const logicdEndpoints = useMemo(
    () => endpoints.filter((e) => e.agent_id === 'logicd'),
    [endpoints],
  );
  const logicdEvents = useMemo(
    () => events.filter((e) => e.agent_id === 'logicd'),
    [events],
  );

  const totalEventsLogicd = logicdEndpoints.reduce(
    (acc, e) => acc + (e.event_count ?? 0), 0,
  );
  const lastSeen = logicdEndpoints
    .map((e) => e.last_seen)
    .filter(Boolean)
    .sort()
    .pop() ?? null;
  const distinctSessions = new Set(
    logicdEvents.map((e) => e.data?.session_id).filter(Boolean),
  ).size;

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-app-teal-accent/10 border border-app-teal-accent/30 flex items-center justify-center">
            <Code2 size={18} className="text-app-teal-accent" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">
              Claude &amp; Codex sessions
            </h1>
            <p className="text-sm text-zinc-400 mt-0.5">
              Forensic capture from <code className="font-mono text-app-teal-accent">logicd</code>{' '}
              — Claude Code and Codex CLI transcripts.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setRefreshTick((n) => n + 1)}
            className="p-2 rounded-lg border border-app-border text-zinc-400 hover:text-white hover:border-zinc-600 transition-all"
            title="Refresh"
          >
            <RefreshCw size={16} />
          </button>
          <button
            onClick={() => setShowAttach(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-app-teal-accent px-3.5 py-2 text-sm font-medium text-black hover:bg-app-teal-accent/90 transition-all shadow-[0_0_20px_rgba(52,211,153,0.15)]"
          >
            <Plus size={16} />
            Attach Agent Watchdog
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatsCard
          icon={Server}
          label="logicd endpoints"
          value={loading ? '…' : String(logicdEndpoints.length)}
        />
        <StatsCard
          icon={Activity}
          label="total events"
          value={loading ? '…' : totalEventsLogicd.toLocaleString()}
        />
        <StatsCard
          icon={FileCode}
          label="distinct sessions"
          value={loading ? '…' : String(distinctSessions)}
        />
        <StatsCard
          icon={Clock}
          label="last seen"
          value={loading ? '…' : relativeTime(lastSeen)}
        />
      </div>

      {/* Per-endpoint breakdown */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 mb-3">
          Devices
        </h2>
        <div className="rounded-xl border border-app-border overflow-hidden">
          {logicdEndpoints.length === 0 ? (
            <div className="p-6 text-sm text-zinc-500">
              {loading
                ? 'Loading…'
                : 'No logicd endpoints reporting yet. Click "Attach Agent Watchdog" to install on a device.'}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-app-surface-2/40 text-left text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-4 py-2.5">Hostname</th>
                  <th className="px-4 py-2.5">Agent</th>
                  <th className="px-4 py-2.5">Events</th>
                  <th className="px-4 py-2.5">Last seen</th>
                  <th className="px-4 py-2.5">First seen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-app-border">
                {logicdEndpoints.map((e) => (
                  <tr key={e.endpoint_name} className="hover:bg-app-surface-2/20">
                    <td className="px-4 py-3 font-medium">{e.endpoint_name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-400">{e.agent_id}</td>
                    <td className="px-4 py-3 font-mono">{(e.event_count ?? 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-zinc-400">{relativeTime(e.last_seen)}</td>
                    <td className="px-4 py-3 text-zinc-500 text-xs">
                      {(e as any).first_seen
                        ? new Date((e as any).first_seen).toISOString().slice(0, 19) + 'Z'
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Live tail */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 mb-3">
          Recent events
        </h2>
        <div className="rounded-xl border border-app-border overflow-hidden">
          {logicdEvents.length === 0 ? (
            <div className="p-6 text-sm text-zinc-500">
              No recent events from logicd.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-app-surface-2/40 text-left text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-4 py-2.5">When</th>
                  <th className="px-4 py-2.5">Endpoint</th>
                  <th className="px-4 py-2.5">Type</th>
                  <th className="px-4 py-2.5">Session</th>
                  <th className="px-4 py-2.5">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-app-border">
                {logicdEvents.slice(0, 50).map((e, i) => {
                  const session = e.data?.session_id ?? '';
                  const source = e.data?.source ?? e.data?.adapter ?? '';
                  return (
                    <tr key={`${e.timestamp}-${i}`} className="hover:bg-app-surface-2/20">
                      <td className="px-4 py-2.5 font-mono text-xs text-zinc-400">
                        {relativeTime(e.ingested_at)}
                      </td>
                      <td className="px-4 py-2.5">{e.endpoint}</td>
                      <td className="px-4 py-2.5">
                        <span className="rounded bg-app-teal-accent/10 border border-app-teal-accent/20 px-2 py-0.5 text-xs font-mono text-app-teal-accent">
                          {e.event_type}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 font-mono text-xs text-zinc-500">
                        {session ? session.slice(0, 8) + '…' : '—'}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-xs text-zinc-400">
                        {source || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <AttachAgentWatchdog
        open={showAttach}
        onClose={() => setShowAttach(false)}
      />
    </div>
  );
};
