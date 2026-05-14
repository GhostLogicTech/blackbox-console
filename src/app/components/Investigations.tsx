import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  FileJson,
  FileSearch,
  FileText,
  Loader2,
  Play,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  downloadInvestigationResult,
  getInvestigation,
  hasTenantKey,
  InvestigationResultType,
  InvestigationStatus,
  runInvestigation,
} from '../../api/client';
import { Badge, Button, cn } from './ui/Library';

const LATEST_INVESTIGATION_KEY = 'blackbox_latest_investigation_job_id';
const POLL_MS = 3000;

type NormalizedInvestigation = {
  jobId: string;
  status: string;
  createdAt?: string;
  completedAt?: string;
  totalEvents?: number;
  capsuleId?: string;
  error?: string;
  progressMessage?: string;
  availableResultTypes?: Set<string>;
};

const RESULT_TYPES: Array<{
  type: InvestigationResultType;
  label: string;
  icon: React.ElementType;
  filename: (jobId: string) => string;
}> = [
  { type: 'json', label: 'JSON', icon: FileJson, filename: (jobId) => `${jobId}-timeline.json` },
  { type: 'report', label: 'Report', icon: FileText, filename: (jobId) => `${jobId}-report.txt` },
  { type: 'summary', label: 'Summary', icon: FileText, filename: (jobId) => `${jobId}-summary.txt` },
  { type: 'affidavit', label: 'Affidavit', icon: ShieldCheck, filename: (jobId) => `${jobId}-affidavit.txt` },
  { type: 'executive_pdf', label: 'Executive PDF', icon: FileText, filename: (jobId) => `${jobId}-executive.pdf` },
  { type: 'timeline_pdf', label: 'Timeline PDF', icon: FileText, filename: (jobId) => `${jobId}-timeline.pdf` },
];

function normalizeInvestigation(data: InvestigationStatus | null, fallbackJobId = ''): NormalizedInvestigation | null {
  if (!data && !fallbackJobId) return null;
  const rawStatus = String(data?.status || 'pending').toLowerCase();
  const totalEvents =
    typeof data?.total_events === 'number'
      ? data.total_events
      : typeof data?.event_count === 'number'
        ? data.event_count
        : typeof data?.report?.total_events === 'number'
          ? data.report.total_events
          : typeof data?.report?.event_count === 'number'
            ? data.report.event_count
            : undefined;

  return {
    jobId: String(data?.job_id || data?.id || fallbackJobId),
    status: rawStatus,
    createdAt: data?.created_at || data?.submitted_at,
    completedAt: data?.completed_at,
    totalEvents,
    capsuleId: data?.capsule_id ? String(data.capsule_id) : undefined,
    error: data?.error_message || data?.error,
    progressMessage: data?.progress_message,
    availableResultTypes: data?.downloads ? new Set(Object.keys(data.downloads)) : undefined,
  };
}

function statusVariant(status: string): 'success' | 'warning' | 'danger' | 'neutral' {
  if (status === 'completed' || status === 'complete') return 'success';
  if (status === 'failed' || status === 'error') return 'danger';
  if (status === 'pending' || status === 'running' || status === 'sending') return 'warning';
  return 'neutral';
}

function stateMessage(status?: string): string {
  if (!status) return 'No investigation has been run yet.';
  if (status === 'completed' || status === 'complete') return 'Investigation complete. Reports are ready.';
  if (status === 'failed' || status === 'error') return 'Investigation failed. Review service logs or retry.';
  return 'Inspector is analyzing sealed Blackbox evidence.';
}

function formatDate(value?: string): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function isTerminal(status: string): boolean {
  return ['completed', 'complete', 'failed', 'error'].includes(status);
}

export const Investigations: React.FC = () => {
  const [latestJobId, setLatestJobId] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem(LATEST_INVESTIGATION_KEY) || '';
  });
  const [investigation, setInvestigation] = useState<NormalizedInvestigation | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [polling, setPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<InvestigationResultType | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const completed = investigation?.status === 'completed' || investigation?.status === 'complete';

  const persistLatestJob = useCallback((jobId: string) => {
    setLatestJobId(jobId);
    localStorage.setItem(LATEST_INVESTIGATION_KEY, jobId);
  }, []);

  const pollJob = useCallback(async (jobId: string, silent = false) => {
    if (!jobId) return;
    if (!silent) setPolling(true);
    const res = await getInvestigation(jobId);
    if (!isMounted.current) return;
    if (res.ok) {
      setError(null);
      setInvestigation(normalizeInvestigation(res.data, jobId));
    } else {
      setError(res.error || 'Could not load investigation status.');
    }
    if (!silent) setPolling(false);
  }, []);

  useEffect(() => {
    if (!latestJobId) return;
    pollJob(latestJobId);
  }, [latestJobId, pollJob]);

  useEffect(() => {
    if (!latestJobId || isTerminal(investigation?.status || '')) return;
    const timer = window.setInterval(() => pollJob(latestJobId, true), POLL_MS);
    return () => window.clearInterval(timer);
  }, [investigation?.status, latestJobId, pollJob]);

  const handleRunInvestigation = async () => {
    if (!hasTenantKey()) {
      setError('No tenant API key configured. Set it in Settings.');
      toast.error('No tenant API key configured');
      return;
    }

    setSubmitting(true);
    setError(null);
    const res = await runInvestigation();
    setSubmitting(false);

    if (!res.ok || !res.data?.job_id) {
      const message = res.error || 'Could not submit investigation.';
      setError(message);
      toast.error(message);
      return;
    }

    const normalized = normalizeInvestigation(res.data, res.data.job_id);
    setInvestigation(normalized);
    persistLatestJob(res.data.job_id);
    toast.success(`Investigation submitted: ${res.data.job_id}`);
  };

  const handleDownload = async (resultType: InvestigationResultType) => {
    if (!investigation?.jobId) return;
    setDownloading(resultType);
    const res = await downloadInvestigationResult(investigation.jobId, resultType);
    setDownloading(null);

    if (!res.ok) {
      toast.error(res.error || 'Download failed');
      return;
    }

    const item = RESULT_TYPES.find((r) => r.type === resultType);
    const url = URL.createObjectURL(res.blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = item?.filename(investigation.jobId) || `${investigation.jobId}-${resultType}`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success(`${item?.label || resultType} download started`);
  };

  const statusCopy = useMemo(() => stateMessage(investigation?.status), [investigation?.status]);
  const resultTypes = useMemo(() => {
    if (!investigation?.availableResultTypes?.size) return RESULT_TYPES;
    return RESULT_TYPES.filter((item) => investigation.availableResultTypes?.has(item.type));
  }, [investigation?.availableResultTypes]);

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-4xl font-bold tracking-tight">Investigations</h1>
          <p className="mt-2 text-sm md:text-base text-app-text-secondary">
            Run Inspector analysis against sealed Blackbox evidence and retrieve generated reports.
          </p>
        </div>
        <Button onClick={handleRunInvestigation} disabled={submitting || !hasTenantKey()} size="md">
          {submitting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Play size={16} />
              Run Investigation
            </>
          )}
        </Button>
      </div>

      {!hasTenantKey() && (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 flex gap-3 items-center">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
          <p className="text-sm text-amber-500/80">No tenant API key. Set one in Settings before running an investigation.</p>
        </div>
      )}

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="rounded-2xl border border-app-border bg-app-surface overflow-hidden card-shadow"
      >
        <div className="border-b border-app-border px-5 md:px-8 py-5 md:py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={cn(
              'w-10 h-10 rounded-xl border flex items-center justify-center',
              completed
                ? 'bg-app-teal-accent/10 border-app-teal-accent/20 text-app-teal-accent'
                : 'bg-app-surface-2 border-app-border text-zinc-400',
            )}>
              {polling || submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : completed ? <CheckCircle2 className="w-5 h-5" /> : <FileSearch className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold text-white">Inspector Report Pipeline</h2>
              <p className="text-sm text-zinc-500 mt-1">{statusCopy}</p>
            </div>
          </div>
          {investigation?.status && (
            <Badge variant={statusVariant(investigation.status)}>{investigation.status}</Badge>
          )}
        </div>

        <div className="p-5 md:p-8">
          {!investigation ? (
            <div className="min-h-[260px] flex flex-col items-center justify-center text-center border border-dashed border-app-border rounded-2xl bg-app-bg/30 px-6">
              <FileSearch className="w-12 h-12 text-zinc-700 mb-4" />
              <p className="text-base font-semibold text-zinc-300">No investigation has been run yet.</p>
              <p className="text-sm text-zinc-600 mt-2 max-w-md">
                Start a run to submit sealed Blackbox evidence to the local Inspector service through the Blackbox API.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                <InfoTile label="Job ID" value={investigation.jobId} mono />
                <InfoTile label="Capsule ID" value={investigation.capsuleId || '-'} mono />
                <InfoTile label="Total Events" value={investigation.totalEvents?.toLocaleString() || '-'} />
                <InfoTile label="Submitted" value={formatDate(investigation.createdAt)} icon={Clock} />
                <InfoTile label="Completed" value={formatDate(investigation.completedAt)} icon={Clock} />
                <InfoTile label="Status Detail" value={investigation.progressMessage || stateMessage(investigation.status)} />
              </div>

              {error && (
                <div className="rounded-xl border border-app-red-alert/20 bg-app-red-alert/5 px-4 py-3 flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 text-app-red-alert mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-app-red-alert/90">{error}</p>
                </div>
              )}

              {(investigation.status === 'failed' || investigation.status === 'error') && (
                <div className="rounded-xl border border-app-red-alert/20 bg-app-red-alert/5 px-4 py-3">
                  <p className="text-sm text-app-red-alert/90">
                    {investigation.error || 'Investigation failed. Review service logs or retry.'}
                  </p>
                </div>
              )}

              {completed && (
                <div className="rounded-2xl border border-app-teal-accent/20 bg-app-teal-accent/[0.04] p-4 md:p-5">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                      <p className="text-sm font-bold text-white">Investigation complete. Reports are ready.</p>
                      <p className="text-xs text-zinc-500 mt-1">Download generated Inspector artifacts through the Blackbox API.</p>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:flex gap-2">
                      {resultTypes.map((item) => (
                        <button
                          key={item.type}
                          onClick={() => handleDownload(item.type)}
                          disabled={downloading === item.type}
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-app-border bg-app-surface px-3 py-2 text-xs font-bold text-zinc-300 hover:border-app-teal-accent/40 hover:text-app-teal-accent transition-all disabled:opacity-50"
                        >
                          {downloading === item.type ? <Loader2 size={14} className="animate-spin" /> : <item.icon size={14} />}
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.section>
    </div>
  );
};

const InfoTile: React.FC<{
  label: string;
  value: string;
  mono?: boolean;
  icon?: React.ElementType;
}> = ({ label, value, mono, icon: Icon }) => (
  <div className="rounded-xl border border-app-border bg-app-bg/40 p-4 min-h-[92px]">
    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-600">
      {Icon && <Icon size={12} />}
      {label}
    </div>
    <p className={cn(
      'mt-3 text-sm text-zinc-200 break-words leading-relaxed',
      mono && 'font-mono text-xs',
    )}>
      {value}
    </p>
  </div>
);
