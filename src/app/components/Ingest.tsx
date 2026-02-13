import React, { useState } from 'react';
import { Terminal, Send, CheckCircle2, RefreshCw, Code2, ClipboardList, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { ingestEvents, hasTenantKey } from '../../api/client';

const DEFAULT_PAYLOAD = `{
  "events": [
    {
      "event_type": "USER_LOGIN",
      "timestamp": "${new Date().toISOString()}",
      "source": "192.168.1.105",
      "severity": "LOW",
      "metadata": {
        "user": "sysadmin",
        "action": "access_database",
        "status": "granted"
      }
    }
  ],
  "agent_id": "console-manual",
  "endpoint_name": "blackbox-console"
}`;

export const Ingest: React.FC = () => {
  const [jsonInput, setJsonInput] = useState(DEFAULT_PAYLOAD);
  const [isIngesting, setIsIngesting] = useState(false);
  const [response, setResponse] = useState<any>(null);

  const handleFormat = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      setJsonInput(JSON.stringify(parsed, null, 2));
      toast.success('JSON formatted');
    } catch {
      toast.error('Invalid JSON — cannot format');
    }
  };

  const handleIngest = async () => {
    if (!hasTenantKey()) {
      toast.error('No tenant API key. Set one in Settings first.');
      return;
    }

    let payload: any;
    try {
      payload = JSON.parse(jsonInput);
    } catch {
      toast.error('Invalid JSON format');
      return;
    }

    setIsIngesting(true);
    setResponse(null);

    const events = payload.events || [payload];
    const res = await ingestEvents(events, {
      agent_id: payload.agent_id,
      source_id: payload.source_id,
      endpoint_name: payload.endpoint_name,
    });

    setIsIngesting(false);

    if (res.ok) {
      setResponse(res.data);
      toast.success(`${res.data!.accepted} event(s) ingested`);
    } else {
      toast.error(res.error || 'Ingestion failed');
      setResponse({ error: res.error });
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 md:pb-0">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Ingest Events</h1>
        <p className="text-zinc-500 mt-1 md:mt-2 text-sm">Commit raw forensic events to immutable storage via POST /api/v1/ingest.</p>
      </div>

      {!hasTenantKey() && (
        <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 flex gap-3 items-center">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
          <p className="text-sm text-amber-500/80">No tenant API key. Set one in <span className="font-bold">Settings</span>.</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] md:text-sm font-bold text-zinc-400 flex items-center gap-2 uppercase tracking-widest">
              <Code2 className="w-4 h-4 text-teal-500" /> Event JSON Editor
            </h3>
            <button onClick={handleFormat} className="text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors uppercase font-bold px-2 py-1 rounded bg-zinc-800">Format</button>
          </div>

          <div className="relative group">
            <div className="absolute -inset-[1px] bg-gradient-to-r from-teal-500/20 to-transparent rounded-2xl blur-sm opacity-50 group-hover:opacity-100 transition-opacity" />
            <div className="relative bg-[#09090b] border border-zinc-800 rounded-2xl overflow-hidden min-h-[300px] md:min-h-[400px]">
              <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border-b border-zinc-800">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                  <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                </div>
                <div className="text-[10px] font-mono text-zinc-500 ml-4">event_payload.json</div>
              </div>
              <textarea
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                className="w-full h-full min-h-[260px] md:min-h-[360px] bg-transparent text-teal-400 font-mono text-sm p-4 md:p-6 focus:outline-none resize-none leading-relaxed"
                spellCheck={false}
              />
            </div>
          </div>

          <button
            onClick={handleIngest}
            disabled={isIngesting || !hasTenantKey()}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-teal-500 text-black font-bold hover:bg-teal-400 transition-all shadow-[0_0_30px_rgba(45,212,191,0.2)] disabled:opacity-50 group"
          >
            {isIngesting ? <RefreshCw size={18} className="animate-spin" /> : <Send size={18} />}
            {isIngesting ? 'Ingesting...' : 'Send to /ingest'}
          </button>
        </div>

        <div className="space-y-4">
          <h3 className="text-[10px] md:text-sm font-bold text-zinc-400 flex items-center gap-2 uppercase tracking-widest">
            <ClipboardList className="w-4 h-4 text-teal-500" /> Response Panel
          </h3>

          <div className="bg-[#121214] border border-zinc-800 rounded-2xl p-4 md:p-6 min-h-[300px] md:min-h-[400px] relative overflow-hidden flex flex-col items-center justify-center">
            <AnimatePresence mode="wait">
              {response && !response.error ? (
                <motion.div key="response" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full space-y-4 md:space-y-6">
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-teal-500/5 border border-teal-500/20">
                    <CheckCircle2 className="w-8 h-8 text-teal-500 flex-shrink-0" />
                    <div>
                      <h4 className="font-bold text-white text-sm">Ingestion Successful</h4>
                      <p className="text-[10px] text-zinc-500">{response.accepted} event(s) committed to buffer. Buffer size: {response.buffer_size}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                    <div className="p-3 md:p-4 rounded-xl bg-zinc-900 border border-zinc-800">
                      <p className="text-[8px] md:text-[10px] text-zinc-500 uppercase font-bold tracking-widest mb-1">Request ID</p>
                      <p className="font-mono text-xs md:text-sm text-zinc-200">{response.request_id}</p>
                    </div>
                    <div className="p-3 md:p-4 rounded-xl bg-zinc-900 border border-zinc-800">
                      <p className="text-[8px] md:text-[10px] text-zinc-500 uppercase font-bold tracking-widest mb-1">Events Accepted</p>
                      <p className="font-mono text-xs md:text-sm text-teal-400 font-bold">{response.accepted}</p>
                    </div>
                  </div>
                  <div className="p-3 md:p-4 rounded-xl bg-zinc-900 border border-zinc-800">
                    <p className="text-[8px] md:text-[10px] text-zinc-500 uppercase font-bold tracking-widest mb-1">Server Time</p>
                    <p className="font-mono text-[10px] md:text-xs text-zinc-400 truncate">{response.server_time}</p>
                  </div>
                </motion.div>
              ) : response?.error ? (
                <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full p-4 rounded-xl bg-red-500/5 border border-red-500/20">
                  <p className="text-sm text-red-400 font-bold">Error</p>
                  <p className="text-xs text-zinc-500 mt-1">{response.error}</p>
                </motion.div>
              ) : (
                <div className="text-center space-y-4">
                  <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto">
                    <Terminal size={24} className="text-zinc-700" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs md:text-sm font-medium text-zinc-400 uppercase tracking-widest">Awaiting Command</p>
                    <p className="text-[10px] md:text-xs text-zinc-600">Response will appear here.</p>
                  </div>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};
