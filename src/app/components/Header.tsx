import React, { useState, useRef, useEffect } from 'react';
import { User, ChevronDown, Terminal, ShieldAlert, Settings, LogOut } from 'lucide-react';
import { cn } from './ui/Library';

interface HeaderProps {
  isAdmin: boolean;
  onNavigate: (tab: string) => void;
  onClearKey: () => void;
}

export const Header: React.FC<HeaderProps> = ({ isAdmin, onNavigate, onClearKey }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-14 md:h-16 border-b border-app-border bg-app-bg flex items-center justify-between px-4 md:px-8 flex-shrink-0">
      <div className="flex items-center gap-3">
        <div className="md:hidden w-7 h-7 rounded-lg bg-app-teal-accent flex items-center justify-center shadow-[0_0_16px_rgba(52,211,153,0.2)]">
          <Terminal size={14} className="text-black" />
        </div>
        <span className="md:hidden font-bold text-sm tracking-widest uppercase">GhostLogic</span>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-2 text-[10px] font-mono text-zinc-600">
          <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-500">Ctrl+K</kbd>
          <span>Command</span>
        </div>

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-app-surface-2 border border-app-border hover:border-zinc-600 transition-all"
          >
            <div className="w-6 h-6 rounded-full bg-app-teal-accent/10 flex items-center justify-center">
              <User size={14} className="text-app-teal-accent" />
            </div>
            <ChevronDown size={14} className="text-zinc-500" />
          </button>

          {showDropdown && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-app-surface border border-app-border rounded-xl shadow-2xl overflow-hidden z-50">
              <button
                onClick={() => { onNavigate('settings'); setShowDropdown(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-zinc-400 hover:text-white hover:bg-white/[0.03] transition-colors"
              >
                <Settings size={15} /> Settings
              </button>
              {isAdmin && (
                <button
                  onClick={() => { onNavigate('admin'); setShowDropdown(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-rose-400 hover:text-rose-300 hover:bg-white/[0.03] transition-colors"
                >
                  <ShieldAlert size={15} /> Admin
                </button>
              )}
              <div className="border-t border-app-border" />
              <button
                onClick={() => { onClearKey(); setShowDropdown(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-zinc-500 hover:text-white hover:bg-white/[0.03] transition-colors"
              >
                <LogOut size={15} /> Disconnect
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
