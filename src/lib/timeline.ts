// Pure data helpers for the /demo Agent Activity Timeline.
//
// Reuses /api/v1/demo/buffer/recent events — the timeline is a different
// rendering of the same data, not a new server endpoint.
//
// Design notes:
//   - Server-side schema for individual events is intentionally loose
//     (the demo API can surface whatever the underlying agents are
//     emitting). These helpers normalise event records into a
//     timeline-friendly shape, picking the first non-empty value
//     from a list of likely field names for each axis.
//   - Missing fields fall through to compact, readable strings rather
//     than rendering blanks.
//   - Pure functions only — no fetch, no DOM, no React. Keeps the
//     timeline testable without spinning up jsdom.

import type { DemoEvent } from '../api/demo';

export interface TimelineEntry {
  /** ISO-8601 timestamp from the source event. */
  timestamp: string;
  /** Who/what did the thing. "unknown" if no candidate field is present. */
  actor: string;
  /** Tool name surface. "unknown" if no candidate field is present. */
  tool: string;
  /** Action verb. Falls back to "event" then event_type if needed. */
  action: string;
  /** Target file / path / object. undefined if not surfaced. */
  target?: string;
  /** Status / outcome string. undefined if not surfaced. */
  status?: string;
  /** Endpoint group label. "(no endpoint)" when the event has no
   *  endpoint_name and no source_id. Used for grouping. */
  endpoint_name: string;
  /** Original event for debugging. Not rendered. */
  raw: DemoEvent;
}

/** Pick the first non-empty string out of `values`. Anything that isn't
 *  a non-empty trimmed string is skipped — including numbers, nulls,
 *  arrays, and the literal "" or whitespace-only strings. */
function pickString(values: unknown[]): string | undefined {
  for (const v of values) {
    if (typeof v === 'string') {
      const trimmed = v.trim();
      if (trimmed.length > 0) return trimmed;
    }
  }
  return undefined;
}

/** Read `data.field` from an event, where `data` may itself be missing
 *  or non-object. The demo events on the wire commonly nest the
 *  interesting payload under `data` (per the agent's IngestPayload
 *  shape), but some emitters flatten it. We check both. */
function fieldFromEvent(ev: DemoEvent, key: string): unknown {
  if (key in ev) return (ev as unknown as Record<string, unknown>)[key];
  const data = (ev as unknown as Record<string, unknown>).data;
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    return (data as Record<string, unknown>)[key];
  }
  return undefined;
}

/** Map a single demo event into a timeline entry, picking the most
 *  informative field for each timeline axis with sane fallbacks. */
export function eventToEntry(ev: DemoEvent): TimelineEntry {
  const actor = pickString([
    fieldFromEvent(ev, 'actor'),
    fieldFromEvent(ev, 'actor_name'),
    fieldFromEvent(ev, 'user'),
    fieldFromEvent(ev, 'source_id'),
    fieldFromEvent(ev, 'endpoint_name'),
  ]) ?? 'unknown';

  const tool = pickString([
    fieldFromEvent(ev, 'tool'),
    fieldFromEvent(ev, 'tool_name'),
    fieldFromEvent(ev, 'event_type'),
  ]) ?? 'unknown';

  const action = pickString([
    fieldFromEvent(ev, 'action'),
    fieldFromEvent(ev, 'verb'),
    fieldFromEvent(ev, 'event_type'),
  ]) ?? 'event';

  const target = pickString([
    fieldFromEvent(ev, 'target'),
    fieldFromEvent(ev, 'target_path'),
    fieldFromEvent(ev, 'path'),
    fieldFromEvent(ev, 'file'),
    fieldFromEvent(ev, 'file_path'),
  ]);

  const status = pickString([
    fieldFromEvent(ev, 'status'),
    fieldFromEvent(ev, 'outcome'),
    fieldFromEvent(ev, 'result'),
  ]);

  const endpoint_name = pickString([
    fieldFromEvent(ev, 'endpoint_name'),
    fieldFromEvent(ev, 'source_id'),
  ]) ?? '(no endpoint)';

  return {
    timestamp: typeof ev.timestamp === 'string' ? ev.timestamp : '',
    actor,
    tool,
    action,
    target,
    status,
    endpoint_name,
    raw: ev,
  };
}

/** Group entries by endpoint_name. Within each group, sort newest
 *  first. The Map preserves insertion order; callers iterating the
 *  Map see groups in the order their first event arrived in the
 *  input array. */
export function groupByEndpoint(
  entries: TimelineEntry[],
): Map<string, TimelineEntry[]> {
  const grouped = new Map<string, TimelineEntry[]>();
  for (const e of entries) {
    const bucket = grouped.get(e.endpoint_name) ?? [];
    bucket.push(e);
    grouped.set(e.endpoint_name, bucket);
  }
  for (const [k, arr] of grouped.entries()) {
    arr.sort((a, b) => parseTime(b.timestamp) - parseTime(a.timestamp));
    grouped.set(k, arr);
  }
  return grouped;
}

function parseTime(ts: string): number {
  const t = Date.parse(ts);
  return Number.isNaN(t) ? 0 : t;
}

/** Compose a single human-readable line from a TimelineEntry — used
 *  by the renderer for the "actor + tool + action + target" middle
 *  column. Centralised so tests can lock the exact phrasing.
 *
 *  Rules:
 *    - Tool bracket renders only when the tool is meaningful
 *      (i.e. not "unknown") AND not redundant with the action.
 *    - Worst-case fallback (no actor / no tool / no action — only
 *      possible from a malformed event) renders "unknown [unknown] event"
 *      so operators looking at logs can see an outline rather than a
 *      blank entry.
 */
export function formatActivityLine(e: TimelineEntry): string {
  const parts: string[] = [];
  parts.push(e.actor);
  // Show the tool only when it's both meaningful AND not duplicative.
  // The worst-case "unknown / unknown / event" path shows "[unknown]"
  // explicitly so a malformed event is visibly weird instead of empty.
  const allMissing = e.actor === 'unknown' && e.tool === 'unknown' && e.action === 'event';
  const showTool = e.tool && e.tool !== e.action && (allMissing || e.tool !== 'unknown');
  if (showTool) parts.push(`[${e.tool}]`);
  parts.push(e.action);
  if (e.target) parts.push(e.target);
  return parts.join(' ');
}
