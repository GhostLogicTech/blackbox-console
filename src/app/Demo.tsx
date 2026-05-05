import React, { useEffect, useRef, useState } from 'react';
import {
  getDemoEndpoints,
  getDemoRecentEvents,
  getDemoStatus,
  type DemoEndpoint,
  type DemoEvent,
  type DemoStatus,
} from '../api/demo';
import {
  eventToEntry,
  formatActivityLine,
  groupByEndpoint,
  type TimelineEntry,
} from '../lib/timeline';

// =============================================================================
// /demo route shell — independent of App.tsx.
// =============================================================================
// Hard rules baked into this shell:
//   1. NEVER imports from ../api/client. The production tenant/admin
//      key flow is a different code path; this shell must not be able
//      to read or write those keys even if it wanted to.
//   2. NEVER sends Authorization headers (the demo client doesn't take
//      a key, ever).
//   3. Persistent "Demo Mode" banner at the top of every viewport —
//      not a toast, not dismissible, not a one-shot.
//   4. Read-only. No buttons that mutate state, no admin UI, no
//      capsule download — just live endpoints + recent events.
// =============================================================================

const REFRESH_MS = 5_000;

const DemoBanner: React.FC<{ tenant?: string }> = ({ tenant }) => (
  <div
    role="alert"
    aria-label="Demo Mode banner"
    style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      background: 'linear-gradient(90deg, #f59e0b, #fb923c)',
      color: '#1f2937',
      fontWeight: 600,
      padding: '12px 24px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottom: '2px solid #b45309',
      fontFamily:
        'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto',
    }}
  >
    <span>
      <span aria-hidden style={{ marginRight: 8 }}>⚠</span>
      Demo Mode — read-only view of the {tenant || 'ghostlogic-demo'} tenant. No live customer
      data is shown here. For your own forensic dashboard, run{' '}
      <code style={{ background: '#fef3c7', padding: '2px 6px', borderRadius: 3 }}>
        python -m logicd enroll
      </code>
      .
    </span>
    <a
      href="https://blackbox.ghostlogic.tech"
      style={{ color: '#1f2937', textDecoration: 'underline' }}
    >
      Sign up →
    </a>
  </div>
);

const Card: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section
    style={{
      background: '#1f2937',
      borderRadius: 8,
      padding: 16,
      margin: 12,
      border: '1px solid #374151',
    }}
  >
    <h2
      style={{
        margin: 0,
        marginBottom: 12,
        fontSize: 14,
        textTransform: 'uppercase',
        letterSpacing: 1,
        color: '#9ca3af',
      }}
    >
      {title}
    </h2>
    {children}
  </section>
);

function fmtRelative(ts: string): string {
  const t = Date.parse(ts);
  if (Number.isNaN(t)) return ts;
  const ago = Math.max(0, Date.now() - t);
  if (ago < 60_000) return `${Math.floor(ago / 1000)}s ago`;
  if (ago < 3_600_000) return `${Math.floor(ago / 60_000)}m ago`;
  if (ago < 86_400_000) return `${Math.floor(ago / 3_600_000)}h ago`;
  return `${Math.floor(ago / 86_400_000)}d ago`;
}

const StatusStrip: React.FC<{ status: DemoStatus | null; error: string | null }> = ({
  status,
  error,
}) => (
  <div
    style={{
      display: 'flex',
      gap: 24,
      padding: '12px 24px',
      background: '#111827',
      borderBottom: '1px solid #374151',
      color: '#e5e7eb',
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo',
      fontSize: 13,
    }}
  >
    {error ? (
      <span style={{ color: '#fca5a5' }}>demo-api unreachable: {error}</span>
    ) : status ? (
      <>
        <span>tenant=<strong>{status.tenant}</strong></span>
        <span>endpoints_active=<strong>{status.endpoints_active}</strong></span>
        <span>events_last_hour=<strong>{status.events_last_hour}</strong></span>
      </>
    ) : (
      <span>loading…</span>
    )}
  </div>
);

const EndpointList: React.FC<{ endpoints: DemoEndpoint[] }> = ({ endpoints }) => {
  if (endpoints.length === 0) {
    return (
      <p style={{ color: '#9ca3af', fontStyle: 'italic' }}>
        No demo endpoints reporting yet. Run <code>python -m logicd demo-dog</code> on a host to
        join.
      </p>
    );
  }
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', color: '#e5e7eb', fontSize: 13 }}>
      <thead>
        <tr style={{ borderBottom: '1px solid #374151', color: '#9ca3af', textAlign: 'left' }}>
          <th style={{ padding: '6px 8px' }}>endpoint</th>
          <th style={{ padding: '6px 8px' }}>id</th>
          <th style={{ padding: '6px 8px' }}>last seen</th>
          <th style={{ padding: '6px 8px', textAlign: 'right' }}>events</th>
        </tr>
      </thead>
      <tbody>
        {endpoints.map((e, idx) => {
          // Server may omit endpoint_id; use a stable fallback for the
          // React key + a "—" display. Don't crash on .slice of undefined.
          const idVal: string = e.endpoint_id ?? e.agent_id ?? '';
          const idDisplay = idVal ? `${idVal.slice(0, 12)}…` : '—';
          const reactKey = idVal || e.endpoint_name || `endpoint-${idx}`;
          return (
          <tr key={reactKey} style={{ borderBottom: '1px solid #1f2937' }}>
            <td style={{ padding: '6px 8px' }}>{e.endpoint_name ?? '—'}</td>
            <td
              style={{
                padding: '6px 8px',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo',
                color: '#9ca3af',
              }}
            >
              {idDisplay}
            </td>
            <td style={{ padding: '6px 8px', color: '#9ca3af' }}>
              {e.last_seen ? fmtRelative(e.last_seen) : '—'}
            </td>
            <td style={{ padding: '6px 8px', textAlign: 'right' }}>
              {e.events_total ?? '—'}
            </td>
          </tr>
          );
        })}
      </tbody>
    </table>
  );
};

const STATUS_COLOR: Record<string, string> = {
  ok: '#34d399',
  pass: '#34d399',
  green: '#34d399',
  success: '#34d399',
  warn: '#fbbf24',
  warning: '#fbbf24',
  error: '#fca5a5',
  fail: '#fca5a5',
  failed: '#fca5a5',
  red: '#fca5a5',
};

const StatusPill: React.FC<{ status?: string }> = ({ status }) => {
  if (!status) return null;
  const color = STATUS_COLOR[status.toLowerCase()] ?? '#9ca3af';
  return (
    <span
      data-testid="timeline-status-pill"
      style={{
        marginLeft: 8,
        padding: '1px 6px',
        borderRadius: 999,
        background: `${color}22`,
        border: `1px solid ${color}55`,
        color,
        fontSize: 11,
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo',
      }}
    >
      {status}
    </span>
  );
};

const TimelineGroup: React.FC<{ endpoint: string; entries: TimelineEntry[] }> = ({
  endpoint,
  entries,
}) => (
  <div data-testid="timeline-group" data-endpoint={endpoint} style={{ marginBottom: 20 }}>
    <h3
      style={{
        margin: 0,
        marginBottom: 6,
        fontSize: 12,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        color: '#a78bfa',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo',
      }}
    >
      {endpoint}
    </h3>
    <ol
      data-testid="timeline-entries"
      style={{
        listStyle: 'none',
        padding: 0,
        margin: 0,
        position: 'relative',
        borderLeft: '2px solid #374151',
        paddingLeft: 18,
      }}
    >
      {entries.map((e, i) => (
        <li
          key={`${e.timestamp}-${i}`}
          data-testid="timeline-entry"
          style={{
            position: 'relative',
            padding: '6px 0',
            color: '#e5e7eb',
            fontSize: 13,
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo',
          }}
        >
          <span
            aria-hidden
            style={{
              position: 'absolute',
              left: -24,
              top: 11,
              width: 10,
              height: 10,
              borderRadius: 999,
              background: '#a78bfa',
              border: '2px solid #030712',
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
            <span style={{ color: '#9ca3af', minWidth: 80 }}>{fmtRelative(e.timestamp)}</span>
            <span>{formatActivityLine(e)}</span>
            <StatusPill status={e.status} />
          </div>
        </li>
      ))}
    </ol>
  </div>
);

const ActivityTimeline: React.FC<{ events: DemoEvent[] }> = ({ events }) => {
  if (events.length === 0) {
    return (
      <p style={{ color: '#9ca3af', fontStyle: 'italic' }}>
        Waiting for demo activity. Once a demo agent ships events you'll see Claude Code
        edits, Codex reviews, test runs, capture &amp; seal events here.
      </p>
    );
  }
  const grouped = groupByEndpoint(events.map(eventToEntry));
  const groupArray = Array.from(grouped.entries());
  return (
    <div data-testid="activity-timeline">
      {groupArray.map(([endpoint, entries]) => (
        <TimelineGroup key={endpoint} endpoint={endpoint} entries={entries} />
      ))}
    </div>
  );
};

const EventStream: React.FC<{ events: DemoEvent[] }> = ({ events }) => {
  if (events.length === 0) {
    return (
      <p style={{ color: '#9ca3af', fontStyle: 'italic' }}>No recent events from demo tenant.</p>
    );
  }
  return (
    <ol
      style={{
        listStyle: 'none',
        padding: 0,
        margin: 0,
        maxHeight: 360,
        overflowY: 'auto',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo',
        fontSize: 12,
        color: '#e5e7eb',
      }}
    >
      {events.map((ev, idx) => (
        <li
          key={idx}
          style={{
            padding: '6px 8px',
            borderBottom: '1px solid #1f2937',
            display: 'grid',
            gridTemplateColumns: '160px 140px 1fr',
            gap: 12,
          }}
        >
          <span style={{ color: '#9ca3af' }}>{fmtRelative(ev.timestamp)}</span>
          <span style={{ color: '#fbbf24' }}>{ev.event_type ?? 'event'}</span>
          <span>{ev.endpoint_name ?? ev.source_id ?? '(unattributed)'}</span>
        </li>
      ))}
    </ol>
  );
};

const Demo: React.FC = () => {
  const [status, setStatus] = useState<DemoStatus | null>(null);
  const [endpoints, setEndpoints] = useState<DemoEndpoint[]>([]);
  const [events, setEvents] = useState<DemoEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    document.documentElement.classList.add('dark');
    document.title = 'GhostLogic — Demo Mode';

    let cancelled = false;
    async function refresh() {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      try {
        const [s, eps, evs] = await Promise.all([
          getDemoStatus(ctrl.signal),
          getDemoEndpoints(ctrl.signal),
          getDemoRecentEvents(25, ctrl.signal),
        ]);
        if (cancelled) return;
        setStatus(s);
        setEndpoints(eps);
        setEvents(evs);
        setError(null);
      } catch (e: unknown) {
        if ((e as { name?: string })?.name === 'AbortError') return;
        if (cancelled) return;
        setError(e instanceof Error ? e.message : String(e));
      }
    }
    refresh();
    const id = window.setInterval(refresh, REFRESH_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
      abortRef.current?.abort();
    };
  }, []);

  return (
    <div
      style={{
        // Hard-cover the viewport so any production fixed-position
        // overlay that somehow leaked into the DOM cannot paint above
        // Demo. The amber DemoBanner inside has its own zIndex: 100,
        // so it stays above this baseline.
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        overflowY: 'auto',
        background: '#030712',
        color: '#e5e7eb',
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto',
      }}
      data-demo-shell
    >
      <DemoBanner tenant={status?.tenant} />
      <StatusStrip status={status} error={error} />
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <Card title="Live endpoints">
          <EndpointList endpoints={endpoints} />
        </Card>
        <Card title="Agent activity timeline">
          <ActivityTimeline events={events} />
        </Card>
        <Card title="Recent events">
          <EventStream events={events} />
        </Card>
        <p style={{ textAlign: 'center', color: '#6b7280', fontSize: 12, padding: 16 }}>
          Read-only · refreshes every {REFRESH_MS / 1000}s · ghostlogic-demo tenant only
        </p>
      </div>
    </div>
  );
};

export default Demo;
