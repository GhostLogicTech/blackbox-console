import React, { useEffect, useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { MobileNav } from './components/MobileNav';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { Ingest } from './components/Ingest';
import { Seal } from './components/Seal';
import { Capsules } from './components/Capsules';
import { Admin } from './components/Admin';
import { Settings } from './components/Settings';
import { CapsuleDetail } from './components/CapsuleDetail';
import { Agent } from './components/Agent';
import { CommandPalette } from './components/CommandPalette';
import { Onboarding } from './components/Onboarding';
import { Toaster } from 'sonner';
import { AnimatePresence, motion } from 'motion/react';
import { hasTenantKey } from '../api/client';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [collapsed, setCollapsed] = useState(false);
  const [selectedCapsuleId, setSelectedCapsuleId] = useState<string | null>(null);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [authenticated, setAuthenticated] = useState(hasTenantKey());

  useEffect(() => {
    document.documentElement.classList.add('dark');

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleSelectCapsule = (id: string) => {
    setSelectedCapsuleId(id);
    setActiveTab('capsule-detail');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'ingest': return <Ingest />;
      case 'seal': return <Seal />;
      case 'capsules': return <Capsules onSelectCapsule={handleSelectCapsule} />;
      case 'admin': return <Admin />;
      case 'settings': return <Settings />;
      case 'agent': return <Agent onNavigate={setActiveTab} />;
      case 'capsule-detail':
        return <CapsuleDetail id={selectedCapsuleId || ''} onBack={() => setActiveTab('capsules')} />;
      default: return <Dashboard />;
    }
  };

  if (!authenticated) {
    return (
      <>
        <Toaster theme="dark" position="top-right" />
        <Onboarding onComplete={() => setAuthenticated(true)} />
      </>
    );
  }

  return (
    <div className="flex h-screen bg-app-bg text-app-text-primary overflow-hidden font-sans selection:bg-app-teal-accent/30 selection:text-app-teal-accent">
      <Toaster theme="dark" position="top-right" />

      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelect={(id) => { setActiveTab(id); setIsCommandPaletteOpen(false); }}
      />

      <Sidebar
        activeTab={activeTab === 'capsule-detail' ? 'capsules' : activeTab}
        setActiveTab={setActiveTab}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />

      <div className="flex-1 flex flex-col relative z-10 overflow-hidden">
        <Header />

        <main className="flex-1 overflow-y-auto overflow-x-hidden px-4 md:px-8 py-6 md:py-8 scrollbar-hide">
          <div className="max-w-7xl mx-auto h-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab === 'capsule-detail' ? `detail-${selectedCapsuleId}` : activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="h-full"
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>

        <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} />

        <footer className="hidden sm:flex h-8 border-t border-app-border bg-app-bg items-center justify-between px-8 text-[9px] text-app-text-secondary font-mono tracking-widest uppercase">
          <div className="flex gap-4">
            <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-app-teal-accent" /> System Operational</span>
          </div>
          <div className="flex items-center gap-6">
            <span>blackbox.ghostlogic.tech</span>
            <span>v2.1.0</span>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default App;
