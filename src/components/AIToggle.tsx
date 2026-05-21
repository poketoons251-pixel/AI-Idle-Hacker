import React from 'react';
import { useGameStore } from '../store/gameStore';
import { AISettingsPanel } from './AISettingsPanel';

/**
 * AIToggle component — HUD button to toggle AI auto-play on/off.
 * Shows green circle (✓) when active, gray circle (○) when inactive.
 * Includes settings button for AI configuration.
 */
export const AIToggle: React.FC = () => {
  const aiActive = useGameStore((s) => s.aiActive);
  const toggleAI = useGameStore((s) => s.toggleAI);

  const isActive = aiActive;

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={toggleAI}
        className={`
          flex items-center gap-2 px-3 py-1.5 rounded border transition-all duration-200
          font-mono text-xs tracking-wider
          ${isActive
            ? 'border-cyber-primary/50 bg-cyber-primary/10 text-cyber-primary hover:bg-cyber-primary/20'
            : 'border-cyber-gray/50 bg-cyber-gray/10 text-cyber-gray-lighter hover:bg-cyber-gray/20'
          }
        `}
        title={isActive ? 'AI Auto-Play: Active (click to disable)' : 'AI Auto-Play: Inactive (click to enable)'}
      >
        {/* Status indicator circle */}
        <span
          className={`
            inline-block w-2.5 h-2.5 rounded-full transition-colors duration-200
            ${isActive ? 'bg-cyber-primary shadow-[0_0_6px_rgba(0,255,65,0.6)]' : 'bg-cyber-gray'}
          `}
        />
        {/* Label */}
        <span>AI Auto-Play</span>
        {/* Status text */}
        <span className={isActive ? 'text-cyber-primary' : 'text-cyber-gray-lighter'}>
          {isActive ? 'Active' : 'Inactive'}
        </span>
      </button>

      {/* AI Settings button */}
      <AISettingsPanel />
    </div>
  );
};
