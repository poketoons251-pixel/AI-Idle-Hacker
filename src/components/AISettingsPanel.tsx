import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { Settings, X } from 'lucide-react';

/**
 * AISettingsPanel — Configuration panel for AI auto-play behavior.
 *
 * Controls:
 * - Risk Tolerance slider (0-100%, default 60%)
 * - Credit Reserve slider (0-50%, default 20%) — per D-04
 * - Priority sliders: Operations, Upgrades, Skills, Equipment
 *
 * Styling: Cyberpunk theme matching existing UI (dark background, neon accents).
 * Panel is toggleable via settings button in AIToggle component.
 */
export const AISettingsPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  // Zustand selectors for individual AIConfig fields (avoid unnecessary re-renders)
  const riskTolerance = useGameStore((s) => s.aiConfig.riskTolerance);
  const reserve = useGameStore((s) => s.aiConfig.resourceAllocation.reserve);
  const priorities = useGameStore((s) => s.aiConfig.priorities);
  const updateAIConfig = useGameStore((s) => s.updateAIConfig);

  // Local state for slider values (synced from store)
  const [localRisk, setLocalRisk] = useState(Math.round(riskTolerance * 100));
  const [localReserve, setLocalReserve] = useState(Math.round(reserve * 100));
  const [localPriorities, setLocalPriorities] = useState({
    operations: Math.round(priorities.operations * 100),
    upgrades: Math.round(priorities.upgrades * 100),
    skills: Math.round(priorities.skills * 100),
    equipment: Math.round(priorities.equipment * 100),
  });

  // Sync local state when store changes (e.g., after page refresh)
  useEffect(() => {
    setLocalRisk(Math.round(riskTolerance * 100));
    setLocalReserve(Math.round(reserve * 100));
    setLocalPriorities({
      operations: Math.round(priorities.operations * 100),
      upgrades: Math.round(priorities.upgrades * 100),
      skills: Math.round(priorities.skills * 100),
      equipment: Math.round(priorities.equipment * 100),
    });
  }, [riskTolerance, reserve, priorities]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) setIsOpen(false);
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  // Close on outside click
  const panelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (isOpen && panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleRiskChange = (value: number) => {
    setLocalRisk(value);
    updateAIConfig({ riskTolerance: value / 100 });
  };

  const handleReserveChange = (value: number) => {
    setLocalReserve(value);
    updateAIConfig({
      resourceAllocation: {
        ...useGameStore.getState().aiConfig.resourceAllocation,
        reserve: value / 100,
      },
    });
  };

  const handlePriorityChange = (key: keyof typeof priorities, value: number) => {
    const newPriorities = { ...localPriorities, [key]: value };
    setLocalPriorities(newPriorities);
    updateAIConfig({
      priorities: {
        operations: newPriorities.operations / 100,
        upgrades: newPriorities.upgrades / 100,
        skills: newPriorities.skills / 100,
        equipment: newPriorities.equipment / 100,
      },
    });
  };

  return (
    <>
      {/* Settings button — placed next to AI toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-7 h-7 rounded border border-cyber-gray/50 bg-cyber-gray/10 text-cyber-gray-lighter hover:text-cyber-primary hover:border-cyber-primary/50 transition-all duration-200"
        title="AI Settings"
      >
        <Settings className="w-3.5 h-3.5" />
      </button>

      {/* Settings panel overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div
            ref={panelRef}
            className="relative w-full max-w-md mx-4 bg-cyber-dark border border-cyber-primary/30 rounded-lg shadow-[0_0_20px_rgba(0,255,65,0.15)]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-cyber-primary/20">
              <h2 className="font-cyber text-sm tracking-wider text-cyber-primary cyber-text-glow">
                AI SETTINGS
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-cyber-gray-lighter hover:text-cyber-primary transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Controls */}
            <div className="p-4 space-y-5">
              {/* Risk Tolerance */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-mono text-cyber-gray-lighter">
                    Risk Tolerance
                  </label>
                  <span className="text-xs font-mono text-cyber-accent">
                    {localRisk}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={localRisk}
                  onChange={(e) => handleRiskChange(Number(e.target.value))}
                  className="w-full h-1.5 bg-cyber-gray rounded-full appearance-none cursor-pointer
                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyber-accent [&::-webkit-slider-thumb]:shadow-[0_0_6px_rgba(0,255,136,0.5)]
                    [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-cyber-accent [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-[0_0_6px_rgba(0,255,136,0.5)]"
                />
                <div className="flex justify-between text-[10px] text-cyber-gray mt-1">
                  <span>Conservative</span>
                  <span>Aggressive</span>
                </div>
              </div>

              {/* Credit Reserve */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-mono text-cyber-gray-lighter">
                    Credit Reserve
                  </label>
                  <span className="text-xs font-mono text-cyber-warning">
                    {localReserve}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={localReserve}
                  onChange={(e) => handleReserveChange(Number(e.target.value))}
                  className="w-full h-1.5 bg-cyber-gray rounded-full appearance-none cursor-pointer
                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyber-warning [&::-webkit-slider-thumb]:shadow-[0_0_6px_rgba(255,200,0,0.5)]
                    [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-cyber-warning [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-[0_0_6px_rgba(255,200,0,0.5)]"
                />
                <div className="flex justify-between text-[10px] text-cyber-gray mt-1">
                  <span>Spend All</span>
                  <span>Save 50%</span>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-cyber-gray/30" />

              {/* Priority: Operations */}
              <PrioritySlider
                label="Operations"
                value={localPriorities.operations}
                onChange={(v) => handlePriorityChange('operations', v)}
                color="cyber-primary"
              />

              {/* Priority: Upgrades */}
              <PrioritySlider
                label="Upgrades"
                value={localPriorities.upgrades}
                onChange={(v) => handlePriorityChange('upgrades', v)}
                color="cyber-accent"
              />

              {/* Priority: Skills */}
              <PrioritySlider
                label="Skills"
                value={localPriorities.skills}
                onChange={(v) => handlePriorityChange('skills', v)}
                color="cyber-secondary"
              />

              {/* Priority: Equipment */}
              <PrioritySlider
                label="Equipment"
                value={localPriorities.equipment}
                onChange={(v) => handlePriorityChange('equipment', v)}
                color="cyber-warning"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

/**
 * Reusable priority slider component.
 */
interface PrioritySliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  color: string;
}

const PrioritySlider: React.FC<PrioritySliderProps> = ({ label, value, onChange, color }) => {
  const colorMap: Record<string, string> = {
    'cyber-primary': 'bg-cyber-primary shadow-[0_0_6px_rgba(0,255,65,0.5)]',
    'cyber-accent': 'bg-cyber-accent shadow-[0_0_6px_rgba(0,255,136,0.5)]',
    'cyber-secondary': 'bg-cyber-secondary shadow-[0_0_6px_rgba(0,200,255,0.5)]',
    'cyber-warning': 'bg-cyber-warning shadow-[0_0_6px_rgba(255,200,0,0.5)]',
  };

  const thumbClass = colorMap[color] || colorMap['cyber-primary'];

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs font-mono text-cyber-gray-lighter">
          Priority: {label}
        </label>
        <span className="text-xs font-mono text-cyber-gray-lighter">
          {value}%
        </span>
      </div>
      <input
        type="range"
        min="0"
        max="100"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`w-full h-1.5 bg-cyber-gray rounded-full appearance-none cursor-pointer
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:${thumbClass}
          [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:${thumbClass} [&::-moz-range-thumb]:border-0`}
      />
    </div>
  );
};

export default AISettingsPanel;
