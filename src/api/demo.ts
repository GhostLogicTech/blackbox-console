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

export interface DemoEndpoint {
  endpoint_id: string;
  endpoint_name: string;
  hostname?: string;
  last_seen: string; // ISO-8601
  events_total?: number;
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

export function getDemoStatus(signal?: AbortSignal) {
  return getJson<DemoStatus>('/api/v1/demo/status', signal);
}

export function getDemoEndpoints(signal?: AbortSignal) {
  return getJson<DemoEndpoint[]>('/api/v1/demo/endpoints', signal);
}

export function getDemoRecentEvents(limit = 25, signal?: AbortSignal) {
  return getJson<DemoEvent[]>(`/api/v1/demo/buffer/recent?limit=${limit}`, signal);
}

// Exposed for tests + diagnostics. NOT a credential — just the URL base.
export const DEMO_API_BASE_URL = DEMO_API_BASE;
