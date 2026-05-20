import React, { useEffect, useState } from 'react';
import { Navigation } from './Navigation';
import { NotificationSystem } from './NotificationSystem';
import { HudBar } from './HudBar';
import { UpgradePanel } from './UpgradePanel';
import { useGameStore } from '../store/gameStore';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [upgradePanelOpen, setUpgradePanelOpen] = useState(false);
  // Removed duplicate energy regeneration interval - this is now handled by useIdleProgression hook

  return (
    <div className="min-h-screen bg-cyber-dark text-cyber-primary">
      {/* Matrix background effect */}
      <div className="fixed inset-0 opacity-5 pointer-events-none">
        <div className="matrix-bg" />
      </div>
      
      <Navigation />
      <HudBar />
      
      <div className="flex">
        <main className="flex-1 relative z-10 container mx-auto px-4 pt-4 pb-8">
          {children}
        </main>
        <UpgradePanel isOpen={upgradePanelOpen} onToggle={() => setUpgradePanelOpen(!upgradePanelOpen)} />
      </div>
      
      <NotificationSystem />
    </div>
  );
};