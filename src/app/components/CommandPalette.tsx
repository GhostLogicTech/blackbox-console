import React, { useState, useEffect } from 'react';
import { Search, Command, Zap, Database, ShieldCheck, Terminal, Settings, Cpu } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (id: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, onSelect }) => {
  const [search, setSearch] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        isOpen ? onClose() : onClose(); // Toggle handled by parent
      }
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const actions = [
    { id: 'dashboard', label: 'Go to Overview', icon: Database, category: 'Navigation' },
    { id: 'ingest', label: 'Ingest New Event', icon: Zap, category: 'Actions' },
    { id: 'seal', label: 'Seal Current Buffer', icon: ShieldCheck, category: 'Actions' },
    { id: 'capsules', label: 'Browse All Capsules', icon: Terminal, category: 'Navigation' },
    { id: 'agent', label: 'Download Agent', icon: Cpu, category: 'Navigation' },
    { id: 'settings', label: 'System Settings', icon: Settings, category: 'Admin' },
  ].filter(a => a.label.toLowerCase().includes(search.toLowerCase()));

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-[#09090b]/80 backdrop-blur-sm" 
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          className="w-full max-w-xl bg-[#121214] border border-teal-500/20 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden relative z-10"
        >
          <div className="flex items-center px-4 py-4 border-b border-zinc-800">
            <Search className="w-5 h-5 text-zinc-500" />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search actions, capsules, or commands..."
              className="flex-1 bg-transparent border-none outline-none px-4 text-sm text-zinc-200 placeholder:text-zinc-600 font-medium"
            />
            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-zinc-800 border border-zinc-700">
              <span className="text-[10px] font-bold text-zinc-500">ESC</span>
            </div>
          </div>

          <div className="max-h-[400px] overflow-y-auto p-2 scrollbar-hide">
            {actions.length > 0 ? (
              <div className="space-y-4 py-2">
                {['Navigation', 'Actions', 'Admin'].map(cat => {
                  const catActions = actions.filter(a => a.category === cat);
                  if (catActions.length === 0) return null;
                  return (
                    <div key={cat} className="space-y-1">
                      <p className="px-3 text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-1">{cat}</p>
                      {catActions.map(action => (
                        <button
                          key={action.id}
                          onClick={() => {
                            onSelect(action.id);
                            onClose();
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-400 hover:text-teal-400 hover:bg-teal-500/5 transition-all group"
                        >
                          <action.icon size={18} className="group-hover:scale-110 transition-transform" />
                          <span className="text-sm font-medium">{action.label}</span>
                        </button>
                      ))}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 text-center">
                <p className="text-sm text-zinc-600">No results found for "{search}"</p>
              </div>
            )}
          </div>
          
          <div className="px-4 py-3 bg-[#09090b]/50 border-t border-zinc-800 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="flex items-center justify-center w-4 h-4 rounded bg-zinc-800 border border-zinc-700 text-[10px] text-zinc-500">↵</div>
                <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-wider">Select</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="flex items-center justify-center w-4 h-4 rounded bg-zinc-800 border border-zinc-700 text-[10px] text-zinc-500">↑↓</div>
                <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-wider">Navigate</span>
              </div>
            </div>
            <div className="text-[10px] font-mono text-teal-500/50 uppercase">GHOSTLOGIC v4.2</div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
