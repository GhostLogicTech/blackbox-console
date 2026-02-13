import React from 'react';
import {
  LayoutDashboard,
  Upload,
  ShieldCheck,
  Database,
  Settings,
  ChevronLeft,
  ChevronRight,
  Terminal,
  Lock
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from './ui/Library';
import { hasAdminKey } from '../../api/client';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, collapsed, setCollapsed }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'ingest', label: 'Ingest Events', icon: Upload },
    { id: 'seal', label: 'Seal Capsule', icon: ShieldCheck },
    { id: 'capsules', label: 'Capsule Vault', icon: Database },
    ...(hasAdminKey() ? [{ id: 'admin', label: 'Admin Panel', icon: Lock }] : []),
    { id: 'settings', label: 'System Settings', icon: Settings },
  ];

  return (
    <motion.div
      animate={{ width: collapsed ? 80 : 260 }}
      className="hidden md:flex h-screen bg-app-bg border-r border-app-border flex-col relative z-50 shadow-2xl transition-all"
    >
      <div className="h-16 flex items-center px-6 border-b border-app-border">
        <div className="w-8 h-8 rounded-lg bg-app-teal-accent flex items-center justify-center shadow-[0_0_20px_rgba(45,212,191,0.3)]">
          <Terminal size={18} className="text-black" />
        </div>
        {!collapsed && (
          <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="ml-3 font-bold text-sm tracking-widest uppercase">
            GhostLogic
          </motion.span>
        )}
      </div>

      <nav className="flex-1 py-6 px-4 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group",
              activeTab === item.id
                ? "bg-app-teal-accent/10 text-app-teal-accent border border-app-teal-accent/20"
                : "text-app-text-secondary hover:text-app-text-primary hover:bg-white/5 border border-transparent"
            )}
          >
            <item.icon size={20} className={cn("transition-transform group-hover:scale-110", activeTab === item.id ? "text-app-teal-accent" : "text-zinc-500")} />
            {!collapsed && <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-app-border">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center p-2 rounded-xl bg-app-surface-2 border border-app-border text-zinc-500 hover:text-white transition-all"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>
    </motion.div>
  );
};
