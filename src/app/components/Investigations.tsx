import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  Activity,
  AlertTriangle,
  Clock,
  Code2,
  FileSearch,
  RefreshCw,
  Server,
  TerminalSquare,
} from 'lucide-react';
import { getEndpoints, getRecentEvents, hasTenantKey } from '../../api/client';
import { Badge, StatsCard, cn } from './ui/Library';

type Endpoint = {
  endpoint_name: string;
  agent_id: string;
  first_seen?: string;
  last_seen: string;
  event_count: number;
  latest: Record<string, unknown>;
};

type RecentEvent = {
  event_type: string;
  endpoint: string;
  agent_id: string;
  timestamp: string;
  ingested_at: string;
  data?: Record<string, unknown>;
};

type TimelineItem = RecentEvent & {
  sourceLabel: string;
  sessionId: string;
  summary: string;
  eventTime: string;
};

const POLL_MS = 5000;

function formatAbsolute(value?: string): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function relativeTime(value?: string): string {
  if (!value) return '-';
  const date = new Date(value).getTime();
  if (Number.isNaN(date)) return '-';
  const seconds = Math.max(0, Math.round((Date.now() - date) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function firstString(data: Record<string, unknown> | undefined, keys: string[]): string {
  if (!data || typeof data !== 'object') return '';
  for (const key of keys) {
    const value = data[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  }
  return '';
}

function detectSource(event: RecentEvent): string {
  const data = event.data && typeof event.data === 'object' ? event.data : {};
  const raw = [
    firstString(data, ['source', 'adapter', 'tool', 'client', 'app']),
    event.event_type,
  ].join(' ').toLowerCase();

  if (raw.includes('codex')) return 'Codex';
  if (raw.includes('claude')) return 'Claude Code';
  if (event.agent_id === 'logicd') return 'Agent Watchdog';
  return event.agent_id || 'Unknown';
}

function summarizeEvent(event: RecentEvent): string {
  const data = event.data && typeof event.data === 'object' ? event.data : {};
  const direct = firstString(data, [
    'summary',
    'title',
    'action',
    'command',
    'operation',
    'message',
    'prompt',
    'path',
    'file',
  ]);

  if (direct) return direct.length > 180 ? `${direct.slice(0, 177)}...` : direct;
  return event.event_type || 'Telemetry event';
}

function normalizeTimeline(events: RecentEvent[]): TimelineItem[] {
  return (Array.isArray(events) ? events : [])
    .filter((event) => {
      const source = detectSource(event).toLowerCase();
      let searchable = '';
      try {
        searchable = JSON.stringify(event.data || {}).toLowerCase();
      } catch {
        searchable = '';
      }
      return event.agent_id === 'logicd'
        || source.includes('claude')
        || source.includes('codex')
        || searchable.includes('claude')
        || searchable.includes('codex');
    })
    .map((event) => ({
      ...event,
      sourceLabel: detectSource(event),
      sessionId: firstString(
        event.data && typeof event.data === 'object' ? event.data : undefined,
        ['session_id', 'session', 'conversation_id', 'trace_id', 'run_id'],
      ),
      summary: summarizeEvent(event),
      eventTime: event.ingested_at || event.timestamp || '',
    }))
    .sort((a, b) => {
      const aTime = new Date(a.eventTime).getTime();
      const bTime = new Date(b.eventTime).getTime();
      return (Number.isNaN(bTime) ? 0 : bTime) - (Number.isNaN(aTime) ? 0 : aTime);
    });
}

export const Investigations: React.FC = () => {
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [events, setEvents] = useState<RecentEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  const fetchTimeline = useCallback(async (silent = false) => {
    if (!hasTenantKey()) {
      setLoading(false);
      setError('No tenant API key configured. Set it in Settings.');
      return;
    }

    if (!silent) setRefreshing(true);
    const [endpointsRes, eventsRes] = await Promise.all([
      getEndpoints(),
      getRecentEvents(250),
    ]);

    if (endpointsRes.ok && endpointsRes.data) {
      setEndpoints(Array.isArray(endpointsRes.data.endpoints) ? endpointsRes.data.endpoints : []);
    }
    if (eventsRes.ok && eventsRes.data) {
      setEvents(Array.isArray(eventsRes.data.events) ? eventsRes.data.events : []);
    }

    const message = endpointsRes.error || eventsRes.error;
    setError(message || null);
    setLoading(false);
    if (!silent) setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchTimeline();
    const timer = window.setInterval(() => fetchTimeline(true), POLL_MS);
    return () => window.clearInterval(timer);
  }, [fetchTimeline, refreshTick]);

  const timeline = useMemo(() => normalizeTimeline(events), [events]);
  const logicdEndpoints = useMemo(
    () => endpoints.filter((endpoint) => endpoint.agent_id === 'logicd'),
    [endpoints],
  );
  const sessionCount = useMemo(
    () => new Set(timeline.map((event) => event.sessionId).filter(Boolean)).size,
    [timeline],
  );
  const lastEvent = timeline[0]?.eventTime;
  const sourceCounts = useMemo(() => {
    return timeline.reduce<Record<string, number>>((acc, event) => {
      acc[event.sourceLabel] = (acc[event.sourceLabel] || 0) + 1;
      return acc;
    }, {});
  }, [timeline]);

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-app-teal-accent/10 border border-app-teal-accent/30 flex items-center justify-center">
              <FileSearch size={18} className="text-app-teal-accent" />
            </div>
            <div>
              <h1 className="text-2xl md:text-4xl font-bold tracking-tight">Investigation Timeline</h1>
              <p className="mt-1 text-sm md:text-base text-app-text-secondary">
                Claude Code and Codex activity captured by the GhostLogic Agent Watchdog.
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={() => setRefreshTick((tick) => tick + 1)}
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-app-border bg-app-surface px-4 py-2.5 text-sm font-bold text-zinc-300 hover:border-app-teal-accent/40 hover:text-app-teal-accent transition-all disabled:opacity-60"
        >
          <RefreshCw size={16} className={cn(refreshing && 'animate-spin')} />
          Refresh Timeline
        </button>
      </div>

      {error && (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 flex gap-3 items-center">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
          <p className="text-sm text-amber-500/80">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatsCard icon={Server} label="watchdog endpoints" value={loading ? '...' : String(logicdEndpoints.length)} />
        <StatsCard icon={Activity} label="timeline events" value={loading ? '...' : timeline.length.toLocaleString()} />
        <StatsCard icon={TerminalSquare} label="sessions" value={loading ? '...' : String(sessionCount)} />
        <StatsCard icon={Clock} label="last event" value={loading ? '...' : relativeTime(lastEvent)} />
      </div>

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="rounded-2xl border border-app-border bg-app-surface overflow-hidden card-shadow"
      >
        <div className="border-b border-app-border px-5 md:px-8 py-5 md:py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-lg md:text-xl font-bold text-white">Claude &amp; Codex Timeline</h2>
            <p className="text-sm text-zinc-500 mt-1">
              {timeline.length
                ? `${timeline.length.toLocaleString()} recent watchdog events from Blackbox telemetry.`
                : 'No Claude or Codex timeline events yet.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(sourceCounts).map(([source, count]) => (
              <Badge key={source} variant="neutral">{source}: {count}</Badge>
            ))}
          </div>
        </div>

        <div className="p-5 md:p-8">
          {timeline.length === 0 ? (
            <div className="min-h-[260px] flex flex-col items-center justify-center text-center border border-dashed border-app-border rounded-2xl bg-app-bg/30 px-6">
              <Code2 className="w-12 h-12 text-zinc-700 mb-4" />
              <p className="text-base font-semibold text-zinc-300">No investigation timeline has been captured yet.</p>
              <p className="text-sm text-zinc-600 mt-2 max-w-md">
                Once Agent Watchdog sends Claude Code or Codex telemetry, the latest events will appear here automatically.
              </p>
            </div>
          ) : (
            <ol className="relative border-l border-app-border ml-2 space-y-5">
              {timeline.slice(0, 100).map((event, index) => (
                <TimelineRow key={`${event.eventTime}-${event.endpoint}-${index}`} event={event} />
              ))}
            </ol>
          )}
        </div>
      </motion.section>
    </div>
  );
};

const TimelineRow: React.FC<{ event: TimelineItem }> = ({ event }) => (
  <li className="relative pl-6">
    <span className="absolute -left-[5px] top-2 h-2.5 w-2.5 rounded-full bg-app-teal-accent shadow-[0_0_16px_rgba(52,211,153,0.45)]" />
    <div className="rounded-xl border border-app-border bg-app-bg/40 p-4 hover:border-app-teal-accent/30 transition-colors">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={event.sourceLabel === 'Codex' || event.sourceLabel === 'Claude Code' ? 'success' : 'neutral'}>
              {event.sourceLabel}
            </Badge>
            <span className="rounded bg-app-teal-accent/10 border border-app-teal-accent/20 px-2 py-0.5 text-xs font-mono text-app-teal-accent">
              {event.event_type}
            </span>
          </div>
          <p className="mt-3 text-sm text-zinc-200 leading-relaxed break-words">{event.summary}</p>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
            <span>Endpoint: <code className="text-zinc-300">{event.endpoint || '-'}</code></span>
            <span>Session: <code className="text-zinc-300">{event.sessionId ? `${event.sessionId.slice(0, 18)}...` : '-'}</code></span>
          </div>
        </div>
        <div className="lg:text-right flex-shrink-0">
          <p className="font-mono text-xs text-zinc-400">{relativeTime(event.eventTime)}</p>
          <p className="mt-1 font-mono text-[11px] text-zinc-600">{formatAbsolute(event.eventTime)}</p>
        </div>
      </div>
    </div>
  </li>
);
