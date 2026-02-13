import React from 'react';
import { Search, Bell, User, ChevronDown, Globe, Terminal, ShieldAlert } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="h-16 border-b border-teal-500/10 bg-[#09090b]/80 backdrop-blur-md flex items-center justify-between px-4 md:px-8 sticky top-0 z-40">
      <div className="flex items-center gap-3 md:gap-6">
        <div className="md:hidden w-8 h-8 rounded bg-teal-500 flex items-center justify-center shadow-[0_0_15px_rgba(45,212,191,0.5)] flex-shrink-0">
          <Terminal className="w-5 h-5 text-black" />
        </div>
        
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-500/5 border border-teal-500/20">
          <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse shadow-[0_0_8px_rgba(45,212,191,0.8)]" />
          <span className="text-xs font-semibold text-teal-400 uppercase tracking-wider">Forensic-Alpha</span>
        </div>
        
        <div className="flex items-center gap-2 group cursor-pointer max-w-[150px] md:max-w-none">
          <Globe className="w-4 h-4 text-zinc-500 group-hover:text-teal-400 transition-colors flex-shrink-0" />
          <span className="text-xs md:text-sm font-medium text-zinc-300 truncate">CyberForensics_Global</span>
          <ChevronDown className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors flex-shrink-0" />
        </div>
      </div>

      <div className="flex items-center gap-3 md:gap-6">
        <div className="hidden lg:relative group lg:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-teal-400 transition-colors" />
          <input 
            type="text" 
            placeholder="Search capsules..."
            className="bg-zinc-900/50 border border-zinc-800 rounded-lg pl-10 pr-4 py-1.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-teal-500/50 focus:border-teal-500/50 w-48 transition-all"
          />
        </div>

        <button className="relative p-2 text-zinc-400 hover:text-white transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-teal-500 rounded-full border-2 border-[#09090b]" />
        </button>

        <div className="flex items-center gap-3 md:pl-6 md:border-l md:border-zinc-800">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-white leading-none">Richards</p>
            <p className="text-[10px] text-zinc-500 font-mono mt-1">ID: GR-7729-F</p>
          </div>
          <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400 overflow-hidden ring-2 ring-teal-500/10 hover:ring-teal-500/30 transition-all cursor-pointer">
            <User className="w-5 h-5" />
          </div>
        </div>
      </div>
    </header>
  );
};
