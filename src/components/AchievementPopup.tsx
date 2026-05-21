import React, { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';

interface ActiveAchievement {
  id: string;
  name: string;
  description: string;
}

export const AchievementPopup: React.FC = () => {
  const [active, setActive] = useState<ActiveAchievement | null>(null);
  const { addNotification } = useGameStore();

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      setActive(detail);

      // Write to terminal via notification system
      addNotification(`🏆 Achievement Unlocked: ${detail.name}!`, 'success');

      // Auto-dismiss after 4 seconds
      setTimeout(() => setActive(null), 4000);
    };

    window.addEventListener('achievement-unlocked', handler);
    return () => window.removeEventListener('achievement-unlocked', handler);
  }, [addNotification]);

  if (!active) return null;

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in">
      <div className="cyber-card border-cyber-accent bg-cyber-dark/95 p-4 max-w-sm">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">🏆</span>
          <div>
            <h3 className="text-cyber-accent font-cyber font-bold text-sm">
              Achievement Unlocked!
            </h3>
            <p className="text-cyber-primary font-mono text-xs">{active.name}</p>
            <p className="text-cyber-primary/60 text-xs">{active.description}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
