import React from 'react';
import {
  LayoutDashboard,
  Monitor,
  Database,
  Code2,
  ChevronLeft,
  ChevronRight,
  Terminal
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from './ui/Library';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, collapsed, setCollapsed }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'endpoints', label: 'Endpoints', icon: Monitor },
    { id: 'claude', label: 'Claude', icon: Code2 },
    { id: 'capsules', label: 'Vault', icon: Database },
  ];

  return (
    <motion.div
      animate={{ width: collapsed ? 80 : 260 }}
      className="hidden md:flex h-screen bg-app-bg border-r border-app-border flex-col relative z-50 shadow-2xl transition-all"
    >
      <div className="h-16 flex items-center px-6 border-b border-app-border">
        <div className="w-8 h-8 rounded-lg bg-app-teal-accent flex items-center justify-center shadow-[0_0_20px_rgba(52,211,153,0.2)]">
          <Terminal size={18} className="text-black" />
        </div>
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="ml-3 font-bold text-sm tracking-widest uppercase"
          >
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
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group relative overflow-hidden",
              activeTab === item.id
                ? "bg-app-teal-accent/10 text-app-teal-accent border border-app-teal-accent/20"
                : "text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.02] border border-transparent"
            )}
          >
            <item.icon size={20} className={cn(activeTab === item.id ? "text-app-teal-accent" : "text-zinc-500 group-hover:text-zinc-300")} />
            {!collapsed && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm font-bold">
                {item.label}
              </motion.span>
            )}
            {activeTab === item.id && (
              <motion.div layoutId="sidebar-active" className="absolute left-0 top-0 bottom-0 w-[3px] bg-app-teal-accent rounded-r-full" />
            )}
          </button>
        ))}
      </nav>

      <button
        onClick={() => setCollapsed(!collapsed)}
        className="h-12 border-t border-app-border flex items-center justify-center text-zinc-600 hover:text-zinc-300 transition-colors"
      >
        {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
      </button>
    </motion.div>
  );
};
