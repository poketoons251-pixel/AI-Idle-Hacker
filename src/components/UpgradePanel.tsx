import React from 'react';
import { useGameStore } from '../store/gameStore';
import { Cpu, Code, ChevronLeft, ChevronRight, Zap } from 'lucide-react';

interface UpgradePanelProps {
  isOpen: boolean;
  onToggle: () => void;
}

export const UpgradePanel: React.FC<UpgradePanelProps> = ({ isOpen, onToggle }) => {
  const equipment = useGameStore((s) => s.equipment);
  const credits = useGameStore((s) => s.player?.credits ?? 0);
  const upgradeEquipment = useGameStore((s) => s.upgradeEquipment);

  const hardware = equipment.filter(e => e.type === 'hardware');
  const software = equipment.filter(e => e.type === 'software');

  const handleUpgrade = (eqId: string) => {
    upgradeEquipment(eqId);
  };

  return (
    <div className={`relative transition-all duration-300 ${isOpen ? 'w-80' : 'w-10'}`}>
      {/* Toggle button */}
      <button
        onClick={onToggle}
        className="absolute -left-3 top-4 z-20 w-6 h-6 bg-cyber-dark border border-cyber-accent/30 rounded-full flex items-center justify-center text-cyber-accent hover:bg-cyber-accent/20"
      >
        {isOpen ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>

      {isOpen && (
        <div className="h-full bg-cyber-darker border-l border-cyber-accent/30 overflow-y-auto p-4">
          <h2 className="font-cyber font-bold text-cyber-accent mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5" />
            UPGRADES
          </h2>

          <p className="text-xs text-cyber-gray-lighter mb-4 font-mono">
            Credits: {credits.toLocaleString()}
          </p>

          {/* Hardware section */}
          <div className="mb-4">
            <h3 className="text-xs uppercase tracking-wider text-cyber-primary/60 font-mono mb-2 flex items-center gap-1">
              <Cpu className="w-3 h-3" /> Hardware
            </h3>
            {hardware.map(eq => (
              <EquipmentCard key={eq.id} eq={eq} credits={credits} onUpgrade={handleUpgrade} />
            ))}
          </div>

          {/* Software section */}
          <div>
            <h3 className="text-xs uppercase tracking-wider text-cyber-primary/60 font-mono mb-2 flex items-center gap-1">
              <Code className="w-3 h-3" /> Software
            </h3>
            {software.map(eq => (
              <EquipmentCard key={eq.id} eq={eq} credits={credits} onUpgrade={handleUpgrade} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

interface EquipmentCardProps {
  eq: { id: string; name: string; level: number; bonus: number; upgradeCost: number; equipped: boolean };
  credits: number;
  onUpgrade: (id: string) => void;
}

const EquipmentCard: React.FC<EquipmentCardProps> = ({ eq, credits, onUpgrade }) => {
  const canAfford = credits >= eq.upgradeCost;

  return (
    <div className="mb-2 p-2 bg-cyber-dark/50 rounded border border-cyber-primary/20">
      <div className="flex items-center justify-between mb-1">
        <span className="font-mono text-sm text-cyber-primary">{eq.name}</span>
        <span className="text-xs text-cyber-accent font-mono">Lv.{eq.level}</span>
      </div>
      <div className="flex items-center justify-between text-xs font-mono mb-2">
        <span className="text-cyber-secondary">+{eq.bonus}/sec</span>
        <span className={canAfford ? 'text-cyber-accent' : 'text-cyber-danger'}>
          {eq.upgradeCost.toLocaleString()} cr
        </span>
      </div>
      <button
        onClick={() => onUpgrade(eq.id)}
        disabled={!canAfford}
        className={`w-full py-1 px-2 rounded text-xs font-mono transition-colors ${
          canAfford
            ? 'bg-cyber-accent/20 text-cyber-accent hover:bg-cyber-accent/30 border border-cyber-accent/40'
            : 'bg-cyber-dark text-cyber-primary/30 cursor-not-allowed border border-cyber-primary/10'
        }`}
      >
        {eq.equipped ? 'UPGRADE' : 'BUY'}
      </button>
    </div>
  );
};
