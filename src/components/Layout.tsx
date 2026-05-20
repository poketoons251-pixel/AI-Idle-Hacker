import React, { useEffect } from 'react';
import { Navigation } from './Navigation';
import { NotificationSystem } from './NotificationSystem';
import { HudBar } from './HudBar';
import { useGameStore } from '../store/gameStore';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Removed duplicate energy regeneration interval - this is now handled by useIdleProgression hook

  return (
    <div className="min-h-screen bg-cyber-dark text-cyber-primary">
      {/* Matrix background effect */}
      <div className="fixed inset-0 opacity-5 pointer-events-none">
        <div className="matrix-bg" />
      </div>
      
      <Navigation />
      <HudBar />
      
      <main className="relative z-10 container mx-auto px-4 pt-4 pb-8">
        {children}
      </main>
      
      <NotificationSystem />
    </div>
  );
};