import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Copy, X, Terminal, CheckCheck, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from './ui/Library';

/**
 * Modal that sends operators back to the public self-serve installer request.
 * Browser UI never displays install tokens or permanent agent keys.
 */

interface AttachAgentWatchdogProps {
  open: boolean;
  onClose: () => void;
}

const WHEELS_URL = 'https://pypi.org/project/ghostlogic-agent-watchdog/';
const REPO_URL = 'https://github.com/adam-scott-thomas/ghostlogic-agent-watchdog';

const STEPS = [
  {
    label: '1. Request link',
    cmd: 'Open the front page and send yourself a Windows install link.',
    note: 'The link is sent by email, expires after 24 hours, and contains a one-time enrollment token.',
  },
  {
    label: '2. Enroll locally',
    cmd: 'Open PowerShell as Administrator, then run: python -m pip install --upgrade ghostlogic-agent-watchdog; logicd enroll --token <gl_enroll token> --endpoint-name $env:COMPUTERNAME --agent-id logicd',
    note: 'Enrollment must happen before install. It writes C:\\ProgramData\\GhostLogic\\agents\\logicd.toml locally.',
  },
  {
    label: '3. Install service',
    cmd: 'logicd install',
    note: 'If enrollment fails, request a fresh token. After install, return to Endpoints and verify telemetry.',
  },
];

export const AttachAgentWatchdog: React.FC<AttachAgentWatchdogProps> = ({ open, onClose }) => {
  const [copied, setCopied] = useState<number | null>(null);

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard?.writeText(text);
    setCopied(idx);
    toast.success('Copied — paste into your terminal', { duration: 3000 });
    window.setTimeout(() => setCopied(null), 1500);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 16, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="w-full max-w-xl rounded-2xl border border-app-border bg-app-bg shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-app-border bg-app-surface-2/30">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-app-teal-accent/10 border border-app-teal-accent/30 flex items-center justify-center">
                  <Terminal size={16} className="text-app-teal-accent" />
                </div>
                <div>
                  <h2 className="text-base font-semibold">Attach Agent Watchdog</h2>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Capture Claude Code &amp; Codex sessions on a new device.
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-app-surface-2 transition-all"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">
              <p className="text-sm text-zinc-400">
                Send an install link from the public front page, then run the emailed
                PowerShell commands from an Administrator PowerShell window on the
                Windows device you want to capture from.
              </p>

              {STEPS.map((step, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                      {step.label}
                    </span>
                    <button
                      onClick={() => handleCopy(step.cmd, i)}
                      className="text-xs text-zinc-500 hover:text-app-teal-accent transition-all flex items-center gap-1"
                    >
                      {copied === i ? (
                        <>
                          <CheckCheck size={12} /> copied
                        </>
                      ) : (
                        <>
                          <Copy size={12} /> copy
                        </>
                      )}
                    </button>
                  </div>
                  <code
                    className={cn(
                      'block w-full rounded-lg border bg-black/40 px-3 py-2.5 font-mono text-xs',
                      copied === i
                        ? 'border-app-teal-accent/50 text-app-teal-accent'
                        : 'border-app-border text-zinc-200',
                    )}
                  >
                    {step.cmd}
                  </code>
                  <p className="text-xs text-zinc-500 leading-relaxed">{step.note}</p>
                </div>
              ))}

              <div className="rounded-lg border border-amber-900/40 bg-amber-950/20 p-3 mt-2">
                <p className="text-xs text-amber-200/90">
                  <strong>Safety:</strong> the browser never shows install tokens or
                  permanent agent keys. The scoped agent key is created only during
                  local enrollment on the device. Tokens are one-time use; request a
                  fresh link if enrollment fails.
                </p>
              </div>

              <div className="flex items-center justify-between pt-2">
                <a
                  href={WHEELS_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-zinc-500 hover:text-app-teal-accent transition-all flex items-center gap-1.5"
                >
                  <ExternalLink size={12} /> PyPI: ghostlogic-agent-watchdog
                </a>
                <a
                  href={REPO_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-zinc-500 hover:text-app-teal-accent transition-all flex items-center gap-1.5"
                >
                  <ExternalLink size={12} /> GitHub
                </a>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
