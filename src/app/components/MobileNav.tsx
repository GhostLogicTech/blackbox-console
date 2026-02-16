import React from 'react';
import { LayoutDashboard, Monitor, Database } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from './ui/Library';

interface MobileNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ activeTab, setActiveTab }) => {
  const items = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'endpoints', label: 'Endpoints', icon: Monitor },
    { id: 'capsules', label: 'Vault', icon: Database },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-app-bg border-t border-app-border px-6 py-2">
      <div className="flex justify-around items-center relative">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "flex flex-col items-center gap-1 py-2 px-4 rounded-xl transition-all relative",
              activeTab === item.id ? "text-app-teal-accent" : "text-zinc-600"
            )}
          >
            <item.icon size={20} />
            <span className="text-[9px] font-bold uppercase tracking-widest">{item.label}</span>
            {activeTab === item.id && (
              <motion.div
                layoutId="mobile-active"
                className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-app-teal-accent rounded-full"
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
