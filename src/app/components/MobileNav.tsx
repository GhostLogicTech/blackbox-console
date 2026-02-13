import React from 'react';
import { 
  LayoutDashboard, 
  Upload, 
  ShieldCheck, 
  Database, 
  Lock,
  Menu
} from 'lucide-react';
import { motion } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface MobileNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'ingest', label: 'Ingest', icon: Upload },
    { id: 'seal', label: 'Seal', icon: ShieldCheck },
    { id: 'capsules', label: 'Vault', icon: Database },
    { id: 'admin', label: 'Admin', icon: Lock },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#09090b]/90 backdrop-blur-xl border-t border-teal-500/20 px-4 pb-6 pt-2 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
      <div className="flex justify-between items-center max-w-md mx-auto">
        {menuItems.map((item) => {
          const isActive = activeTab === item.id || (activeTab === 'capsule-detail' && item.id === 'capsules');
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "flex flex-col items-center gap-1.5 p-2 transition-all relative",
                isActive ? "text-teal-400" : "text-zinc-500"
              )}
            >
              <div className={cn(
                "p-2 rounded-xl transition-all duration-300",
                isActive ? "bg-teal-500/10 scale-110" : "bg-transparent"
              )}>
                <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest">{item.label}</span>
              {isActive && (
                <motion.div 
                  layoutId="active-dot"
                  className="absolute -top-1 w-1 h-1 bg-teal-500 rounded-full shadow-[0_0_8px_rgba(45,212,191,1)]"
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
