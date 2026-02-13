import React, { useState } from 'react';
import { Copy, Check, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

interface HashDisplayProps {
  hash: string;
  label?: string;
  verified?: boolean;
}

export const HashDisplay: React.FC<HashDisplayProps> = ({ hash, label, verified = false }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(hash);
    setCopied(true);
    toast.success('Hash copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group relative">
      {label && <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1.5 ml-1">{label}</p>}
      <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900/50 border border-zinc-800 hover:border-teal-500/30 transition-all group-hover:bg-zinc-800/40">
        {verified && (
          <div className="flex-shrink-0">
            <ShieldCheck className="w-4 h-4 text-teal-500" />
          </div>
        )}
        <code className="text-xs font-mono text-zinc-300 break-all leading-relaxed flex-1">
          {hash}
        </code>
        <button 
          onClick={copyToClipboard}
          className="p-1.5 rounded-lg text-zinc-500 hover:text-teal-400 hover:bg-teal-500/10 transition-all flex-shrink-0"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
        </button>
      </div>
    </div>
  );
};
