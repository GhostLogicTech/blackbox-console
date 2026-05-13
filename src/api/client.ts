const BASE_URL = (
  import.meta.env.VITE_API_BASE
  || import.meta.env.VITE_BLACKBOX_URL
  || 'https://api.ghostlogic.tech'
).replace(/\/$/, '');
const MOCK_ENROLLMENT_REQUEST = import.meta.env.DEV && import.meta.env.VITE_MOCK_ENROLLMENT_REQUEST === 'true';

export function getTenantKey(): string | null {
  return localStorage.getItem('blackbox_tenant_key');
}

export function getAdminKey(): string | null {
  return localStorage.getItem('blackbox_admin_key');
}

export function setTenantKey(key: string) {
  localStorage.setItem('blackbox_tenant_key', key);
}

export function setAdminKey(key: string) {
  localStorage.setItem('blackbox_admin_key', key);
}

export function clearKeys() {
  localStorage.removeItem('blackbox_tenant_key');
  localStorage.removeItem('blackbox_admin_key');
}

export function hasAdminKey(): boolean {
  return !!getAdminKey();
}

export function hasTenantKey(): boolean {
  return !!getTenantKey();
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  auth: 'tenant' | 'admin' | 'none' = 'none'
): Promise<{ ok: boolean; status: number; data: T | null; error: string | null }> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (auth === 'tenant') {
    const key = getTenantKey();
    if (!key) return { ok: false, status: 0, data: null, error: 'No tenant API key configured. Set it in Settings.' };
    headers['Authorization'] = `Bearer ${key}`;
  } else if (auth === 'admin') {
    const key = getAdminKey();
    if (!key) return { ok: false, status: 0, data: null, error: 'No admin API key configured. Set it in Settings.' };
    headers['Authorization'] = `Bearer ${key}`;
  }

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers,
    });

    if (!res.ok) {
      let errorMsg = `HTTP ${res.status}`;
      try {
        const body = await res.json();
        errorMsg = body?.detail?.detail || body?.detail || body?.message || errorMsg;
      } catch { /* ignore parse error */ }
      return { ok: false, status: res.status, data: null, error: errorMsg };
    }

    // Handle non-JSON responses (like file downloads)
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await res.json();
      return { ok: true, status: res.status, data: data as T, error: null };
    }

    return { ok: true, status: res.status, data: null, error: null };
  } catch (err) {
    return { ok: false, status: 0, data: null, error: `Network error: ${err instanceof Error ? err.message : String(err)}` };
  }
}

// ── Public endpoints (no auth) ──

export async function getRoot() {
  return request<{ service: string; version: string; status: string }>('/');
}

export async function getHealth() {
  return request<{ status: string }>('/health');
}

export async function getInfo() {
  return request<{ service: string; version: string; status: string }>('/api/v1/info');
}

export type EnrollmentRequestPayload = {
  email: string;
  company?: string;
  device_label?: string;
};

export type EnrollmentRequestResult =
  | { ok: true; status: number; message: string }
  | { ok: false; status: number; error: 'invalid_email' | 'rate_limited' | 'unavailable' | 'generic'; message: string };

export async function requestEnrollmentInstallLink(
  payload: EnrollmentRequestPayload,
): Promise<EnrollmentRequestResult> {
  const trimmedEmail = payload.email.trim();
  const body = {
    email: trimmedEmail,
    company: payload.company?.trim() || undefined,
    device_label: payload.device_label?.trim() || undefined,
  };

  if (MOCK_ENROLLMENT_REQUEST) {
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      ok: true,
      status: 200,
      message: 'Check your email for your one-time install link.',
    };
  }

  try {
    const res = await fetch(`${BASE_URL}/api/v1/enrollment/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      let message = 'Check your email for your one-time install link.';
      try {
        const data = await res.json();
        if (typeof data?.message === 'string' && data.message.trim()) {
          message = data.message;
        }
      } catch { /* success without JSON still counts */ }
      return { ok: true, status: res.status, message };
    }

    if (res.status === 400 || res.status === 422) {
      return { ok: false, status: res.status, error: 'invalid_email', message: 'Enter a valid email address.' };
    }
    if (res.status === 429) {
      return { ok: false, status: res.status, error: 'rate_limited', message: 'Too many requests. Try again later.' };
    }
    if (res.status === 404 || res.status >= 500) {
      return { ok: false, status: res.status, error: 'unavailable', message: 'Enrollment service is unavailable right now.' };
    }

    return { ok: false, status: res.status, error: 'generic', message: 'Could not send install link. Try again.' };
  } catch {
    return { ok: false, status: 0, error: 'unavailable', message: 'Enrollment service is unavailable right now.' };
  }
}

// ── Tenant endpoints ──

export async function getMe() {
  return request<{ tenant_id: string; key_id: string; name: string }>('/api/v1/me', {}, 'tenant');
}

export async function getStatus() {
  return request<{
    status: string;
    version: string;
    format: string;
    compression: string;
    storage_provider: string;
    capsule_count: number;
    total_storage_mb: string;
    total_events: number;
    buffer_events: number;
    auto_seal: {
      enabled: boolean;
      interval_seconds: number;
      event_threshold: number;
      last_seal: string | null;
      total_seals: number;
    };
  }>('/api/v1/status', {}, 'tenant');
}

export async function ingestEvents(events: Record<string, unknown>[], options?: {
  agent_id?: string;
  source_id?: string;
  endpoint_name?: string;
}) {
  return request<{
    status: string;
    request_id: string;
    server_time: string;
    event_count: number;
    accepted: number;
    rejected: number;
    buffer_size: number;
  }>('/api/v1/ingest', {
    method: 'POST',
    body: JSON.stringify({
      events,
      ...options,
    }),
  }, 'tenant');
}

export async function sealCapsule(force: boolean = true) {
  return request<{
    status: string;
    capsule_id: string;
    tenant_id: string;
    event_count: number;
    sealed_at: string;
    time_start: string;
    time_end: string;
    sizes: {
      raw_json_bytes: number;
      binary_bytes: number;
      compressed_bytes: number;
      compression_ratio: string;
    };
    hashes: {
      content_sha256: string;
      file_sha256: string;
    };
  } | { status: string; message: string }>('/api/v1/seal', {
    method: 'POST',
    body: JSON.stringify({ force }),
  }, 'tenant');
}

export async function listCapsules(limit: number = 100, offset: number = 0) {
  return request<{
    capsules: Array<{
      capsule_id: string;
      event_count: number;
      sealed_at: string;
      size_bytes: number;
      file_sha256: string;
    }>;
    count: number;
    total: number;
    limit: number;
    offset: number;
  }>(`/api/v1/capsules?limit=${limit}&offset=${offset}`, {}, 'tenant');
}

export async function getCapsule(capsuleId: string) {
  return request<{
    capsule_id: string;
    tenant_id: string;
    event_count: number;
    sealed_at: string;
    time_start: string;
    time_end: string;
    sizes: {
      raw_json_bytes: number;
      binary_bytes: number;
      compressed_bytes: number;
      compression_ratio: string;
    };
    hashes: {
      content_sha256: string;
      file_sha256: string;
    };
  }>(`/api/v1/capsules/${capsuleId}`, {}, 'tenant');
}

export async function verifyCapsule(capsuleId: string) {
  return request<{
    capsule_id: string;
    tenant_id: string;
    integrity: boolean;
    status: string;
    file_sha256_stored: string;
    file_sha256_computed: string;
    file_integrity: boolean;
    content_sha256_stored?: string;
    content_sha256_computed?: string;
    content_integrity?: boolean;
    event_count?: number;
    size_bytes: number;
  }>('/api/v1/verify', {
    method: 'POST',
    body: JSON.stringify({ capsule_id: capsuleId }),
  }, 'tenant');
}

export function getCapsuleDownloadUrl(capsuleId: string): string {
  return `${BASE_URL}/api/v1/capsules/${capsuleId}/download`;
}

export async function downloadCapsule(capsuleId: string): Promise<Blob | null> {
  const key = getTenantKey();
  if (!key) return null;

  try {
    const res = await fetch(`${BASE_URL}/api/v1/capsules/${capsuleId}/download`, {
      headers: { 'Authorization': `Bearer ${key}` },
    });
    if (!res.ok) return null;
    return await res.blob();
  } catch {
    return null;
  }
}

// ── Live telemetry endpoints ──

export async function getEndpoints() {
  return request<{
    endpoints: Array<{
      endpoint_name: string;
      agent_id: string;
      first_seen: string;
      last_seen: string;
      event_count: number;
      latest: Record<string, Record<string, unknown>>;
    }>;
    count: number;
  }>('/api/v1/endpoints', {}, 'tenant');
}

export async function getRecentEvents(limit: number = 50) {
  return request<{
    events: Array<{
      event_type: string;
      endpoint: string;
      agent_id: string;
      timestamp: string;
      ingested_at: string;
      data: Record<string, unknown>;
    }>;
    count: number;
  }>(`/api/v1/buffer/recent?limit=${limit}`, {}, 'tenant');
}

// ── Admin endpoints ──

export async function adminListCapsules(limit: number = 100, offset: number = 0) {
  return request<{
    capsules: Array<{
      capsule_id: string;
      tenant_id: string;
      event_count: number;
      sealed_at: string;
      size_bytes: number;
      file_sha256: string;
    }>;
    count: number;
    total: number;
    limit: number;
    offset: number;
  }>(`/api/v1/admin/capsules?limit=${limit}&offset=${offset}`, {}, 'admin');
}

export async function adminGetStats() {
  return request<{
    capsule_count: number;
    total_storage_bytes: number;
    total_storage_mb: string;
    total_events: number;
    tenant_count: number;
  }>('/api/v1/admin/stats', {}, 'admin');
}

export async function adminListKeys() {
  return request<{
    keys: Array<{
      key_id: string;
      tenant_id: string;
      name: string;
      created_at: string;
      last_used_at: string | null;
      active: boolean;
    }>;
  }>('/api/v1/keys', {}, 'admin');
}

export async function adminCreateKey(name: string) {
  return request<{
    api_key: string;
    key_id: string;
    tenant_id: string;
    name: string;
    created_at: string;
  }>('/api/v1/keys', {
    method: 'POST',
    body: JSON.stringify({ name }),
  }, 'admin');
}

export async function adminRevokeKey(keyId: string) {
  return request<{ status: string; key_id: string }>(`/api/v1/keys/${keyId}`, {
    method: 'DELETE',
  }, 'admin');
}

export async function adminRotateKey(keyId: string) {
  return request<{
    api_key: string;
    key_id: string;
    tenant_id: string;
    name: string;
    created_at: string;
  }>(`/api/v1/keys/${keyId}/rotate`, {
    method: 'POST',
  }, 'admin');
}

export async function adminListKeysForTenant(tenantId: string) {
  return request<{
    keys: Array<{
      key_id: string;
      tenant_id: string;
      name: string;
      created_at: string;
      last_used_at: string | null;
      active: boolean;
    }>;
    tenant_id: string;
  }>(`/api/v1/keys/tenant/${tenantId}`, {}, 'admin');
}

// ── Registration (no auth) ──

export async function registerAgent(name: string) {
  return request<{
    api_key: string;
    key_id: string;
    tenant_id: string;
    name: string;
    created_at: string;
  }>('/api/v1/register', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export { BASE_URL };
