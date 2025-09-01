import React from 'react';
import { 
  User, 
  Zap, 
  Shield, 
  Users, 
  Cpu, 
  Brain, 
  Plus,
  Star,
  TrendingUp,
  Award
} from 'lucide-react';
import { useGameStore } from '../store/gameStore';

const skillIcons = {
  hacking: Zap,
  stealth: Shield,
  social: Users,
  hardware: Cpu,
  ai: Brain,
};

const skillDescriptions = {
  hacking: 'Improves success rate and rewards for digital operations',
  stealth: 'Reduces detection risk and operation time',
  social: 'Enhances social engineering effectiveness',
  hardware: 'Increases equipment efficiency and unlocks advanced gear',
  ai: 'Boosts AI companion abilities and automation',
};

const SkillCard: React.FC<{ skillName: string; level: number }> = ({ skillName, level }) => {
  const { player, spendCredits, updateSkills, addNotification } = useGameStore();
  const Icon = skillIcons[skillName as keyof typeof skillIcons];
  const description = skillDescriptions[skillName as keyof typeof skillDescriptions];
  
  const upgradeCost = level * 100;
  const canUpgrade = player.credits >= upgradeCost && level < 10;
  
  const handleUpgrade = () => {
    if (canUpgrade && spendCredits(upgradeCost)) {
      updateSkills({ [skillName]: level + 1 });
      addNotification(`${skillName.toUpperCase()} upgraded to level ${level + 1}!`, 'success');
    }
  };
  
  return (
    <div className="cyber-card">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-cyber-primary/20 rounded-lg">
            <Icon className="w-6 h-6 text-cyber-primary" />
          </div>
          <div>
            <h3 className="font-cyber font-bold text-cyber-primary capitalize">
              {skillName}
            </h3>
            <p className="text-xs text-cyber-primary/60 font-mono">
              Level {level}/10
            </p>
          </div>
        </div>
        
        <div className="text-right">
          <div className="flex items-center space-x-1 text-cyber-secondary">
            {[...Array(level)].map((_, i) => (
              <Star key={i} className="w-3 h-3 fill-current" />
            ))}
            {[...Array(10 - level)].map((_, i) => (
              <Star key={i + level} className="w-3 h-3 text-cyber-primary/20" />
            ))}
          </div>
        </div>
      </div>
      
      <p className="text-sm text-cyber-primary/70 mb-4">
        {description}
      </p>
      
      {level < 10 && (
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-cyber-primary/80 font-mono">Upgrade Cost:</span>
            <span className="text-cyber-accent font-mono">{upgradeCost} credits</span>
          </div>
          
          <button
            onClick={handleUpgrade}
            disabled={!canUpgrade}
            className={`
              w-full flex items-center justify-center space-x-2 p-2 rounded border transition-all duration-300
              ${canUpgrade 
                ? 'border-cyber-primary text-cyber-primary hover:bg-cyber-primary hover:text-cyber-dark cyber-button'
                : 'border-cyber-primary/20 text-cyber-primary/40 cursor-not-allowed'
              }
            `}
          >
            <Plus className="w-4 h-4" />
            <span className="font-mono text-sm uppercase">Upgrade</span>
          </button>
        </div>
      )}
      
      {level >= 10 && (
        <div className="text-center py-2">
          <Award className="w-6 h-6 text-cyber-warning mx-auto mb-1" />
          <p className="text-cyber-warning font-mono text-sm">MAX LEVEL</p>
        </div>
      )}
    </div>
  );
};

const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ComponentType<any>;
  color: string;
  description: string;
}> = ({ title, value, icon: Icon, color, description }) => (
  <div className="cyber-card text-center">
    <Icon className={`w-8 h-8 ${color} mx-auto mb-2`} />
    <h3 className="font-mono text-sm uppercase tracking-wider text-cyber-primary/80 mb-1">
      {title}
    </h3>
    <p className={`text-2xl font-bold ${color} cyber-text-glow mb-2`}>
      {typeof value === 'number' ? value.toLocaleString() : value}
    </p>
    <p className="text-xs text-cyber-primary/60">
      {description}
    </p>
  </div>
);

export const Character: React.FC = () => {
  const { player, skills } = useGameStore();
  
  const totalSkillPoints = Object.values(skills).reduce((sum, level) => sum + level, 0);
  const skillProgress = (totalSkillPoints / 50) * 100; // Max 50 skill points (5 skills × 10 levels)
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-cyber font-bold text-cyber-primary cyber-text-glow">
          CHARACTER PROFILE
        </h1>
        <p className="text-cyber-primary/60 font-mono">
          Enhance your abilities and track your progress
        </p>
      </div>
      
      {/* Character Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Level" 
          value={player.level} 
          icon={User} 
          color="text-cyber-secondary"
          description={`${player.experience}/${player.experienceToNext} XP to next level`}
        />
        <StatCard 
          title="Reputation" 
          value={player.reputation} 
          icon={TrendingUp} 
          color="text-cyber-warning"
          description="Your standing in the hacker community"
        />
        <StatCard 
          title="Total Skills" 
          value={totalSkillPoints} 
          icon={Brain} 
          color="text-cyber-primary"
          description={`${skillProgress.toFixed(1)}% of maximum potential`}
        />
        <StatCard 
          title="Energy" 
          value={`${player.energy}/${player.maxEnergy}`} 
          icon={Zap} 
          color="text-cyber-accent"
          description="Required for operations and activities"
        />
      </div>
      
      {/* Experience Progress */}
      <div className="cyber-card">
        <h2 className="text-lg font-cyber font-bold text-cyber-primary mb-4 flex items-center space-x-2">
          <Star className="w-5 h-5" />
          <span>Experience Progress</span>
        </h2>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="font-mono text-sm text-cyber-primary/80">
              Level {player.level} Progress
            </span>
            <span className="font-mono text-xs text-cyber-primary/60">
              {player.experience}/{player.experienceToNext} XP
            </span>
          </div>
          <div className="resource-bar">
            <div 
              className="resource-fill text-cyber-secondary"
              style={{ width: `${(player.experience / player.experienceToNext) * 100}%` }}
            />
          </div>
          <p className="text-xs text-cyber-primary/60 font-mono">
            Next level unlocks new targets and increases passive income
          </p>
        </div>
      </div>
      
      {/* Skills */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-cyber font-bold text-cyber-primary flex items-center space-x-2">
            <Brain className="w-6 h-6" />
            <span>Skill Tree</span>
          </h2>
          <div className="text-right">
            <p className="text-sm text-cyber-primary/80 font-mono">
              Available Credits: {player.credits.toLocaleString()}
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(skills).map(([skillName, level]) => (
            <SkillCard key={skillName} skillName={skillName} level={level} />
          ))}
        </div>
      </div>
      
      {/* Skill Bonuses */}
      <div className="cyber-card">
        <h2 className="text-lg font-cyber font-bold text-cyber-primary mb-4 flex items-center space-x-2">
          <Award className="w-5 h-5" />
          <span>Active Bonuses</span>
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h3 className="font-mono text-sm uppercase tracking-wider text-cyber-accent">
              Operation Bonuses
            </h3>
            <ul className="space-y-1 text-sm text-cyber-primary/70">
              <li>• Hacking: +{skills.hacking * 5}% success rate</li>
              <li>• Stealth: -{skills.stealth * 2}% detection risk</li>
              <li>• Social: +{skills.social * 3}% social engineering effectiveness</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-mono text-sm uppercase tracking-wider text-cyber-accent">
              System Bonuses
            </h3>
            <ul className="space-y-1 text-sm text-cyber-primary/70">
              <li>• Hardware: +{skills.hardware * 2}% equipment efficiency</li>
              <li>• AI: +{skills.ai * 4}% automation speed</li>
              <li>• Total: +{totalSkillPoints}% passive income</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};