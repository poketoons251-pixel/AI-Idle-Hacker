import React, { useMemo } from 'react';
import { 
  Cpu, 
  Shield, 
  Zap, 
  Wifi, 
  HardDrive, 
  Monitor, 
  Smartphone, 
  Router,
  Plus,
  TrendingUp,
  Lock,
  CheckCircle
} from 'lucide-react';
import { useGameStore } from '../store/gameStore';

const equipmentTypes = {
  processor: {
    icon: Cpu,
    name: 'Processor',
    description: 'Increases hacking speed and success rate',
    basePrice: 500,
    priceMultiplier: 1.5,
    bonusPerLevel: 10,
    bonusType: 'Hacking Power'
  },
  security: {
    icon: Shield,
    name: 'Security Suite',
    description: 'Reduces detection risk and protects from counter-attacks',
    basePrice: 750,
    priceMultiplier: 1.6,
    bonusPerLevel: 8,
    bonusType: 'Stealth'
  },
  power: {
    icon: Zap,
    name: 'Power Supply',
    description: 'Increases energy capacity and regeneration rate',
    basePrice: 300,
    priceMultiplier: 1.4,
    bonusPerLevel: 5,
    bonusType: 'Energy Efficiency'
  },
  network: {
    icon: Wifi,
    name: 'Network Card',
    description: 'Improves connection speed and bandwidth for operations',
    basePrice: 400,
    priceMultiplier: 1.45,
    bonusPerLevel: 7,
    bonusType: 'Network Speed'
  },
  storage: {
    icon: HardDrive,
    name: 'Storage Drive',
    description: 'Increases data capacity and processing efficiency',
    basePrice: 250,
    priceMultiplier: 1.3,
    bonusPerLevel: 6,
    bonusType: 'Data Processing'
  },
  display: {
    icon: Monitor,
    name: 'Display System',
    description: 'Enhances visual analysis and pattern recognition',
    basePrice: 600,
    priceMultiplier: 1.55,
    bonusPerLevel: 9,
    bonusType: 'Analysis Speed'
  }
};

interface EquipmentCardProps {
  equipmentId: string;
  equipment: any;
  equipmentType: any;
}

const EquipmentCard: React.FC<EquipmentCardProps> = React.memo(({ 
  equipmentId, 
  equipment, 
  equipmentType 
}) => {
  const { player, spendCredits, upgradeEquipment, addNotification } = useGameStore();
  const Icon = equipmentType.icon;
  
  const currentLevel = equipment?.level || 0;
  const isOwned = currentLevel > 0;
  
  // Memoize calculations to prevent unnecessary recalculations
  const { upgradeCost, canUpgrade, totalBonus } = useMemo(() => {
    const cost = Math.floor(
      equipmentType.basePrice * Math.pow(equipmentType.priceMultiplier, currentLevel)
    );
    const canAfford = player.credits >= cost && currentLevel < 20;
    const bonus = currentLevel * equipmentType.bonusPerLevel;
    
    return {
      upgradeCost: cost,
      canUpgrade: canAfford,
      totalBonus: bonus
    };
  }, [equipmentType.basePrice, equipmentType.priceMultiplier, equipmentType.bonusPerLevel, currentLevel, player.credits]);
  
  const handleUpgrade = () => {
    if (canUpgrade && spendCredits(upgradeCost)) {
      upgradeEquipment(equipmentId);
      const action = currentLevel === 0 ? 'purchased' : 'upgraded';
      addNotification(`${equipmentType.name} ${action} to level ${currentLevel + 1}!`, 'success');
    }
  };
  

  
  return (
    <div className={`cyber-card transition-all duration-300 ${
      isOwned ? 'border-cyber-primary' : 'border-cyber-primary/30'
    }`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`p-3 rounded-lg ${
            isOwned ? 'bg-cyber-primary/20' : 'bg-cyber-primary/10'
          }`}>
            <Icon className={`w-6 h-6 ${
              isOwned ? 'text-cyber-primary' : 'text-cyber-primary/50'
            }`} />
          </div>
          <div>
            <h3 className="font-cyber font-bold text-cyber-primary">
              {equipmentType.name}
            </h3>
            <p className="text-xs text-cyber-primary/60 font-mono">
              {isOwned ? `Level ${currentLevel}/20` : 'Not Owned'}
            </p>
          </div>
        </div>
        
        {isOwned && (
          <div className="text-right">
            <CheckCircle className="w-5 h-5 text-cyber-secondary mb-1" />
            <p className="text-xs text-cyber-secondary font-mono">ACTIVE</p>
          </div>
        )}
        
        {!isOwned && currentLevel === 0 && (
          <Lock className="w-5 h-5 text-cyber-primary/30" />
        )}
      </div>
      
      <p className="text-sm text-cyber-primary/70 mb-4">
        {equipmentType.description}
      </p>
      
      {isOwned && (
        <div className="mb-4 p-3 bg-cyber-primary/5 rounded border border-cyber-primary/20">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-cyber-accent font-mono">
              {equipmentType.bonusType}
            </span>
            <span className="text-sm text-cyber-secondary font-mono font-bold">
              +{totalBonus}%
            </span>
          </div>
          <div className="resource-bar h-2">
            <div 
              className="resource-fill bg-cyber-secondary"
              style={{ width: `${(currentLevel / 20) * 100}%` }}
            />
          </div>
        </div>
      )}
      
      {currentLevel < 20 && (
        <div className="space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-cyber-primary/80 font-mono">
              {currentLevel === 0 ? 'Purchase Cost:' : 'Upgrade Cost:'}
            </span>
            <span className="text-cyber-accent font-mono font-bold">
              {upgradeCost.toLocaleString()} credits
            </span>
          </div>
          
          {currentLevel > 0 && (
            <div className="flex justify-between items-center text-xs">
              <span className="text-cyber-primary/60 font-mono">Next Bonus:</span>
              <span className="text-cyber-secondary font-mono">
                +{equipmentType.bonusPerLevel}% {equipmentType.bonusType}
              </span>
            </div>
          )}
          
          <button
            onClick={handleUpgrade}
            disabled={!canUpgrade}
            className={`
              w-full flex items-center justify-center space-x-2 p-3 rounded border transition-all duration-300
              ${canUpgrade 
                ? 'border-cyber-primary text-cyber-primary hover:bg-cyber-primary hover:text-cyber-dark cyber-button'
                : 'border-cyber-primary/20 text-cyber-primary/40 cursor-not-allowed'
              }
            `}
          >
            <Plus className="w-4 h-4" />
            <span className="font-mono text-sm uppercase">
              {currentLevel === 0 ? 'Purchase' : 'Upgrade'}
            </span>
          </button>
        </div>
      )}
      
      {currentLevel >= 20 && (
        <div className="text-center py-3 bg-cyber-warning/10 rounded border border-cyber-warning/30">
          <TrendingUp className="w-6 h-6 text-cyber-warning mx-auto mb-1" />
          <p className="text-cyber-warning font-mono text-sm font-bold">MAX LEVEL</p>
          <p className="text-xs text-cyber-warning/70">Peak performance achieved</p>
        </div>
      )}
    </div>
  );
});

EquipmentCard.displayName = 'EquipmentCard';

const StatsSummary: React.FC = React.memo(() => {
  const { equipment } = useGameStore();
  
  // Memoize expensive calculations to prevent unnecessary recalculations
  const { totalBonuses, totalValue } = useMemo(() => {
    const bonuses = Object.entries(equipmentTypes).reduce((acc, [id, type]) => {
      const level = equipment[id]?.level || 0;
      const bonus = level * type.bonusPerLevel;
      acc[type.bonusType] = (acc[type.bonusType] || 0) + bonus;
      return acc;
    }, {} as Record<string, number>);
    
    const value = Object.entries(equipmentTypes).reduce((acc, [id, type]) => {
      const level = equipment[id]?.level || 0;
      let cost = 0;
      for (let i = 0; i < level; i++) {
        cost += Math.floor(type.basePrice * Math.pow(type.priceMultiplier, i));
      }
      return acc + cost;
    }, 0);
    
    return { totalBonuses: bonuses, totalValue: value };
  }, [equipment]);
  
  return (
    <div className="cyber-card">
      <h2 className="text-lg font-cyber font-bold text-cyber-primary mb-4 flex items-center space-x-2">
        <TrendingUp className="w-5 h-5" />
        <span>Equipment Summary</span>
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <h3 className="font-mono text-sm uppercase tracking-wider text-cyber-accent">
            Active Bonuses
          </h3>
          <div className="space-y-2">
            {Object.entries(totalBonuses).map(([bonusType, value]) => (
              <div key={bonusType} className="flex justify-between items-center">
                <span className="text-sm text-cyber-primary/70">{bonusType}:</span>
                <span className="text-sm text-cyber-secondary font-mono font-bold">+{value}%</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="space-y-3">
          <h3 className="font-mono text-sm uppercase tracking-wider text-cyber-accent">
            Investment Stats
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-cyber-primary/70">Total Value:</span>
              <span className="text-sm text-cyber-warning font-mono font-bold">
                {totalValue.toLocaleString()} credits
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-cyber-primary/70">Equipment Count:</span>
              <span className="text-sm text-cyber-primary font-mono">
                {Object.values(equipment).filter(eq => eq?.level > 0).length}/6
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

StatsSummary.displayName = 'StatsSummary';

export const Equipment: React.FC = () => {
  const { player, equipment } = useGameStore();
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-cyber font-bold text-cyber-primary cyber-text-glow">
          EQUIPMENT LAB
        </h1>
        <p className="text-cyber-primary/60 font-mono">
          Upgrade your hardware to enhance performance
        </p>
        <div className="flex justify-center items-center space-x-4 mt-4">
          <div className="flex items-center space-x-2">
            <Cpu className="w-5 h-5 text-cyber-accent" />
            <span className="font-mono text-cyber-accent">
              Available: {player.credits.toLocaleString()} credits
            </span>
          </div>
        </div>
      </div>
      
      {/* Stats Summary */}
      <StatsSummary />
      
      {/* Equipment Grid */}
      <div className="space-y-4">
        <h2 className="text-xl font-cyber font-bold text-cyber-primary flex items-center space-x-2">
          <HardDrive className="w-6 h-6" />
          <span>Hardware Components</span>
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(equipmentTypes).map(([equipmentId, equipmentType]) => (
            <EquipmentCard 
              key={equipmentId}
              equipmentId={equipmentId}
              equipment={equipment[equipmentId]}
              equipmentType={equipmentType}
            />
          ))}
        </div>
      </div>
      
      {/* Tips */}
      <div className="cyber-card bg-cyber-primary/5">
        <h3 className="font-cyber font-bold text-cyber-accent mb-3 flex items-center space-x-2">
          <Monitor className="w-5 h-5" />
          <span>Equipment Tips</span>
        </h3>
        <ul className="space-y-2 text-sm text-cyber-primary/70">
          <li>• Higher level equipment provides exponentially better bonuses</li>
          <li>• Balanced upgrades across all equipment types yield the best results</li>
          <li>• Equipment bonuses stack with skill bonuses for maximum effectiveness</li>
          <li>• Upgrade costs increase exponentially - plan your investments wisely</li>
        </ul>
      </div>
    </div>
  );
};