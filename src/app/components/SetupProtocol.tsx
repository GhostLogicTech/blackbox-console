import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Mail,
  MonitorCheck,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import {
  hasTenantKey,
  requestEnrollmentInstallLink,
  type EnrollmentRequestResult,
} from '../../api/client';

interface SetupProtocolProps {
  onComplete: () => void;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type SubmitState = 'idle' | 'loading' | 'success' | 'error';

const trustItems = [
  'No permanent API keys are shown in the browser.',
  'Install links are one-time use.',
  'Links expire after 24 hours.',
  'The agent key is created only during local enrollment.',
  'Open PowerShell as Administrator before enrolling the agent.',
];

const proofItems = [
  'Captures endpoint telemetry from agent workstations.',
  'Writes local config to C:\\ProgramData\\GhostLogic\\agents\\logicd.toml.',
  'Sends tamper-evident events into the Blackbox dashboard.',
];

export const SetupProtocol: React.FC<SetupProtocolProps> = ({ onComplete }) => {
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [deviceLabel, setDeviceLabel] = useState('');
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [message, setMessage] = useState('');
  const [servicePending, setServicePending] = useState(false);

  const canOpenDashboard = useMemo(() => hasTenantKey(), []);

  const setFailure = (result: Extract<EnrollmentRequestResult, { ok: false }>) => {
    setSubmitState('error');
    setMessage(result.message);
    setServicePending(result.error === 'unavailable');
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedEmail = email.trim();

    if (!EMAIL_RE.test(trimmedEmail)) {
      setSubmitState('error');
      setServicePending(false);
      setMessage('Enter a valid email address.');
      return;
    }

    setSubmitState('loading');
    setServicePending(false);
    setMessage('Sending install link...');

    const result = await requestEnrollmentInstallLink({
      email: trimmedEmail,
      company,
      device_label: deviceLabel,
    });

    if (result.ok) {
      setSubmitState('success');
      setServicePending(false);
      setMessage('Check your email. Your one-time Windows install link expires in 24 hours.');
      toast.success('Install link requested');
      return;
    }

    setFailure(result);
  };

  const handleDashboardClick = () => {
    if (canOpenDashboard) {
      onComplete();
      return;
    }
    toast.info('Dashboard opens after this browser has an existing session.');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="fixed inset-0 z-[100] bg-app-bg text-app-text-primary overflow-y-auto"
    >
      <main className="min-h-screen">
        <section className="relative isolate min-h-screen overflow-hidden border-b border-app-border">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_10%,rgba(52,211,153,0.16),transparent_34%),linear-gradient(135deg,#09090b_0%,#121214_58%,#06120f_100%)]" />
          <div className="absolute inset-y-0 right-0 -z-10 hidden w-1/2 border-l border-white/5 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0))] lg:block" />

          <div className="mx-auto grid min-h-screen w-full max-w-7xl grid-cols-1 gap-10 px-5 py-8 sm:px-8 lg:grid-cols-[1.02fr_0.98fr] lg:px-12">
            <div className="flex flex-col justify-center pb-4 pt-6 lg:py-16">
              <div className="mb-8 inline-flex w-fit items-center gap-2 border border-app-teal-accent/20 bg-app-teal-accent/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-app-teal-accent">
                <Sparkles size={14} />
                Agent onboarding
              </div>

              <h1 className="max-w-3xl text-5xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl">
                Install GhostLogic Agent
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-300 sm:text-xl">
                Start capturing tamper-evident endpoint telemetry in minutes. Enter your email and we&apos;ll send a one-time Windows install link. Open PowerShell as Administrator before running it.
              </p>

              <div className="mt-8 grid max-w-2xl gap-3 text-sm text-zinc-400 sm:grid-cols-2">
                {proofItems.map(item => (
                  <div key={item} className="flex items-start gap-3 border-l border-app-border pl-4">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-app-teal-accent" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={handleDashboardClick}
                className="mt-8 inline-flex w-fit items-center gap-2 text-sm font-bold text-zinc-400 transition-colors hover:text-white"
              >
                View Dashboard <ArrowRight size={15} />
              </button>
            </div>

            <div className="flex items-center pb-12 lg:py-16">
              <div className="w-full border border-app-border bg-app-surface/95 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.45)] sm:p-7">
                <div className="mb-6 flex items-center justify-between gap-4 border-b border-app-border pb-5">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-500">Windows installer</p>
                    <h2 className="mt-2 text-2xl font-bold text-white">Send Install Link</h2>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center bg-app-teal-accent text-black">
                    <Mail size={20} />
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                  <label className="block">
                    <span className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">Email</span>
                    <input
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={event => setEmail(event.target.value)}
                      placeholder="user@example.com"
                      className="w-full border border-app-border bg-black px-4 py-3 text-base text-white outline-none transition-colors placeholder:text-zinc-700 focus:border-app-teal-accent/70"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">Company</span>
                    <input
                      type="text"
                      autoComplete="organization"
                      value={company}
                      onChange={event => setCompany(event.target.value)}
                      placeholder="Acme Inc"
                      className="w-full border border-app-border bg-black px-4 py-3 text-base text-white outline-none transition-colors placeholder:text-zinc-700 focus:border-app-teal-accent/70"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">Device label</span>
                    <input
                      type="text"
                      value={deviceLabel}
                      onChange={event => setDeviceLabel(event.target.value)}
                      placeholder="Adam Laptop"
                      className="w-full border border-app-border bg-black px-4 py-3 text-base text-white outline-none transition-colors placeholder:text-zinc-700 focus:border-app-teal-accent/70"
                    />
                  </label>

                  <button
                    type="submit"
                    disabled={submitState === 'loading'}
                    className="flex w-full items-center justify-center gap-2 bg-app-teal-accent px-5 py-3.5 text-sm font-bold text-black transition-colors hover:bg-app-teal-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitState === 'loading' ? 'Sending install link...' : 'Send Install Link'}
                    <ArrowRight size={16} />
                  </button>

                  {message && (
                    <div
                      role="status"
                      className={[
                        'border px-4 py-3 text-sm',
                        submitState === 'success'
                          ? 'border-app-teal-accent/30 bg-app-teal-accent/10 text-app-teal-accent'
                          : submitState === 'error'
                            ? 'border-app-red-alert/30 bg-app-red-alert/10 text-red-300'
                            : 'border-app-border bg-black text-zinc-400',
                      ].join(' ')}
                    >
                      {message}
                      {servicePending && (
                        <span className="mt-2 block text-xs text-amber-300">
                          Backend endpoint pending: POST /api/v1/enrollment/request is not live yet.
                        </span>
                      )}
                    </div>
                  )}
                </form>

                <div className="mt-6 grid gap-3 border-t border-app-border pt-5">
                  {trustItems.map(item => (
                    <div key={item} className="flex items-start gap-3 text-sm text-zinc-400">
                      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-app-teal-accent" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-8 px-5 py-12 sm:px-8 lg:grid-cols-3 lg:px-12">
          <div className="lg:col-span-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-app-teal-accent">What happens next</p>
            <h2 className="mt-3 text-3xl font-bold text-white">Local enrollment, dashboard visibility.</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-3 lg:col-span-2">
            {[
              ['1', 'Email link', 'A one-time Windows install link is sent to the requested inbox. The token is one-time use.'],
              ['2', 'Enroll first', 'Run PowerShell as Administrator, enroll with the token, then run logicd install.'],
              ['3', 'Telemetry online', 'If enrollment fails, request a fresh token. Once installed, logicd sends endpoint events to the dashboard.'],
            ].map(([step, title, body]) => (
              <div key={step} className="border border-app-border bg-app-surface p-5">
                <div className="mb-4 flex h-9 w-9 items-center justify-center bg-app-surface-2 text-sm font-bold text-app-teal-accent">
                  {step}
                </div>
                <h3 className="text-lg font-bold text-white">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-zinc-500">{body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-app-border bg-app-surface/40">
          <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-8 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-12">
            <div className="flex items-center gap-3">
              <MonitorCheck className="h-5 w-5 text-app-teal-accent" />
              <p className="text-sm text-zinc-400">
                Existing browser sessions can open the dashboard directly. New installs start with the email link.
              </p>
            </div>
            <button
              type="button"
              onClick={handleDashboardClick}
              className="inline-flex items-center justify-center gap-2 border border-app-border px-4 py-2 text-sm font-bold text-white transition-colors hover:border-app-teal-accent/50"
            >
              View Dashboard <ArrowRight size={15} />
            </button>
          </div>
        </section>
      </main>
    </motion.div>
  );
};
