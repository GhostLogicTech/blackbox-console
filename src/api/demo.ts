// Demo API client — read-only, public, never sends Authorization.
//
// Calls the backend-proxy /api/v1/demo/* endpoints which the API server
// gates by hardcoded `tenant_id == "ghostlogic-demo"` on the server side.
// The dashboard never holds a key for the demo path; the server holds a
// scoped read-only key (or hardcoded tenant filter) and exposes the
// pre-filtered data. See docs/DEMO_TENANT_SERVER_SPEC.md.
//
// VITE_DEMO_API_BASE defaults to VITE_BLACKBOX_URL. Override only if
// the demo proxy lives on a different host (e.g. a Cloudflare Worker).

const PROD_API = (import.meta.env.VITE_BLACKBOX_URL || 'https://api.ghostlogic.tech').replace(
  /\/$/,
  '',
);
const DEMO_API_BASE = (import.meta.env.VITE_DEMO_API_BASE || PROD_API).replace(/\/$/, '');

export interface DemoStatus {
  tenant: string;
  endpoints_active: number;
  events_last_hour: number;
  server_time?: string;
}

// All fields optional — server response shape isn't fully stable. The
// renderer guards each access. Known fields documented; unknown fields
// pass through via the index signature.
export interface DemoEndpoint {
  endpoint_id?: string;
  endpoint_name?: string;
  hostname?: string;
  agent_id?: string;
  tenant_id?: string;
  first_seen?: string;
  last_seen?: string;
  events_total?: number;
  [k: string]: unknown;
}

export interface DemoEvent {
  timestamp: string; // ISO-8601
  source_id?: string;
  endpoint_name?: string;
  event_type?: string;
  // The server is responsible for redacting any field that could leak
  // across tenants. Anything else surfaces as-is for display.
  [k: string]: unknown;
}

async function getJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  // Explicit headers — NO Authorization. The server gates by tenant
  // filter, not by client-supplied credentials.
  const r = await fetch(`${DEMO_API_BASE}${path}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    signal,
  });
  if (!r.ok) {
    throw new Error(`demo API ${path} → HTTP ${r.status}`);
  }
  return (await r.json()) as T;
}

// Adapters — the production server's response shapes differ from the
// originally-documented spec. The shipped server returns wrapped
// objects (`{endpoints: [...]}`, `{events: [...]}`) and uses
// snake_case field names (`tenant_id`, `endpoint_count`,
// `recent_events_size`). We accept BOTH the documented shape AND the
// wrapped shape so the dashboard works against whichever is live.

function unwrapArray<T>(raw: unknown, key: string): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (raw && typeof raw === 'object' && Array.isArray((raw as Record<string, unknown>)[key])) {
    return (raw as Record<string, T[]>)[key];
  }
  return [];
}

function asInt(v: unknown): number {
  const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : 0;
  return Number.isFinite(n) ? n : 0;
}

export async function getDemoStatus(signal?: AbortSignal): Promise<DemoStatus> {
  const raw = (await getJson<Record<string, unknown>>('/api/v1/demo/status', signal)) ?? {};
  return {
    tenant:
      (typeof raw.tenant === 'string' && raw.tenant) ||
      (typeof raw.tenant_id === 'string' && raw.tenant_id) ||
      'ghostlogic-demo',
    endpoints_active: asInt(raw.endpoints_active ?? raw.endpoint_count),
    events_last_hour: asInt(
      raw.events_last_hour ?? raw.recent_events_size ?? raw.buffer_events,
    ),
    server_time: typeof raw.server_time === 'string' ? raw.server_time : undefined,
  };
}

export async function getDemoEndpoints(signal?: AbortSignal): Promise<DemoEndpoint[]> {
  const raw = await getJson<unknown>('/api/v1/demo/endpoints', signal);
  return unwrapArray<DemoEndpoint>(raw, 'endpoints');
}

export async function getDemoRecentEvents(
  limit = 25,
  signal?: AbortSignal,
): Promise<DemoEvent[]> {
  const raw = await getJson<unknown>(
    `/api/v1/demo/buffer/recent?limit=${limit}`,
    signal,
  );
  return unwrapArray<DemoEvent>(raw, 'events');
}

// Exposed for tests + diagnostics. NOT a credential — just the URL base.
export const DEMO_API_BASE_URL = DEMO_API_BASE;
