import React, { useEffect } from 'react';
import { 
  User, 
  Zap, 
  DollarSign, 
  Star, 
  Target, 
  Clock,
  TrendingUp,
  Shield,
  Cpu,
  Activity
} from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { ProgressionPanel } from '../components/progression/ProgressionPanel';
import EnhancedQuestSystem from '../components/quest/EnhancedQuestSystem';
import NarrativeQuestSystem from '../components/narrative/NarrativeQuestSystem';
import DynamicQuestGenerator from '../components/quest/QuestGenerator';
import { IdleOptimizationSystem } from '../components/IdleOptimizationSystem';
import { Phase3Integration } from '../components/Phase3Integration';

const ResourceCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ComponentType<any>;
  color: string;
  subtitle?: string;
}> = ({ title, value, icon: Icon, color, subtitle }) => {
  return (
    <div className="cyber-card">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <Icon className={`w-5 h-5 ${color}`} />
          <h3 className="font-mono text-sm uppercase tracking-wider text-cyber-primary/80">
            {title}
          </h3>
        </div>
      </div>
      <div className="space-y-1">
        <p className={`text-2xl font-bold ${color} cyber-text-glow`}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </p>
        {subtitle && (
          <p className="text-xs text-cyber-primary/60 font-mono">{subtitle}</p>
        )}
      </div>
    </div>
  );
};

const ProgressBar: React.FC<{
  current: number;
  max: number;
  color: string;
  label: string;
}> = ({ current, max, color, label }) => {

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="font-mono text-sm text-cyber-primary/80">{label}</span>
        <span className="font-mono text-xs text-cyber-primary/60">
          {current}/{max}
        </span>
      </div>
      <div className="resource-bar">
        <div 
          className="resource-fill bg-gradient-to-r from-cyber-warning to-cyber-accent transition-all duration-300"
          style={{ width: `${(current / max) * 100}%` }}
        />
      </div>
    </div>
  );
};

const ActiveOperation: React.FC<{ operation: any }> = ({ operation }) => {
  const { updateOperation, completeOperation } = useGameStore();
  
  useEffect(() => {
    if (operation.status !== 'active') return;
    
    const interval = setInterval(() => {
       const now = Date.now();
       const elapsed = now - operation.startTime;
       const newProgress = Math.min((elapsed / operation.duration) * 100, 100);
       
       updateOperation(operation.id, { progress: newProgress });
       
       if (newProgress >= 100) {
         completeOperation(operation.id);
       }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [operation, updateOperation, completeOperation]);
  
  const timeRemaining = Math.max(0, operation.duration - (Date.now() - operation.startTime));
  const minutes = Math.floor(timeRemaining / 60000);
  const seconds = Math.floor((timeRemaining % 60000) / 1000);
  
  return (
    <div className="cyber-card">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Target className="w-4 h-4 text-cyber-accent" />
          <span className="font-mono text-sm text-cyber-primary">
            {operation.type.replace('_', ' ').toUpperCase()}
          </span>
        </div>
        <div className="flex items-center space-x-1 text-cyber-warning">
          <Clock className="w-3 h-3" />
          <span className="font-mono text-xs">
            {minutes}:{seconds.toString().padStart(2, '0')}
          </span>
        </div>
      </div>
      
      <ProgressBar 
        current={operation.progress} 
        max={100} 
        color="text-cyber-accent" 
        label="Progress" 
      />
      
      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
        <div className="text-center">
          <p className="text-cyber-primary/60">Credits</p>
          <p className="text-cyber-accent font-mono">+{operation.rewards.credits}</p>
        </div>
        <div className="text-center">
          <p className="text-cyber-primary/60">XP</p>
          <p className="text-cyber-secondary font-mono">+{operation.rewards.experience}</p>
        </div>
        <div className="text-center">
          <p className="text-cyber-primary/60">Rep</p>
          <p className="text-cyber-warning font-mono">+{operation.rewards.reputation}</p>
        </div>
      </div>
    </div>
  );
};

export const Dashboard: React.FC = () => {
  const { player, skills, operations } = useGameStore();
  
  // Show loading state if data is not ready
  if (!player || !skills) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyber-primary mx-auto"></div>
          <p className="text-cyber-primary/60 font-mono">Loading neural interface...</p>
        </div>
      </div>
    );
  }
  
  const activeOperations = operations.filter(op => op.status === 'active');
  const completedOperations = operations.filter(op => op.status === 'completed');
  
  const totalSkillLevel = Object.values(skills).reduce((sum, level) => sum + level, 0);
  const avgSkillLevel = (totalSkillLevel / Object.keys(skills).length).toFixed(1);
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-cyber font-bold text-cyber-primary cyber-text-glow">
          NEURAL INTERFACE
        </h1>
        <p className="text-cyber-primary/60 font-mono">
          Welcome back, {player.username}
        </p>
      </div>
      
      {/* Resource Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <ResourceCard 
          title="Credits" 
          value={player.credits} 
          icon={DollarSign} 
          color="text-cyber-accent"
        />
        <ResourceCard 
          title="Level" 
          value={player.level} 
          icon={Star} 
          color="text-cyber-secondary"
          subtitle={`${player.experience}/${player.experienceToNext} XP`}
        />
        <ResourceCard 
          title="Reputation" 
          value={player.reputation} 
          icon={TrendingUp} 
          color="text-cyber-warning"
        />
        <ResourceCard 
          title="Avg Skill" 
          value={avgSkillLevel} 
          icon={Cpu} 
          color="text-cyber-primary"
        />
      </div>
      
      {/* Progression Panel */}
      <ProgressionPanel />
      
      {/* Progress Bars */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="cyber-card space-y-4">
          <h2 className="text-lg font-cyber font-bold text-cyber-primary flex items-center space-x-2">
            <User className="w-5 h-5" />
            <span>Character Progress</span>
          </h2>
          
          <ProgressBar 
            current={player.experience} 
            max={player.experienceToNext} 
            color="text-cyber-secondary" 
            label="Experience" 
          />
          
          <ProgressBar 
            current={player.energy} 
            max={player.maxEnergy} 
            color="text-cyber-warning" 
            label="Energy" 
          />
        </div>
        
        <div className="cyber-card space-y-4">
          <h2 className="text-lg font-cyber font-bold text-cyber-primary flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <span>Skill Overview</span>
          </h2>
          
          {Object.entries(skills).map(([skill, level]) => (
            <ProgressBar 
              key={skill}
              current={level}
              max={10}
              color="text-cyber-primary"
              label={skill.charAt(0).toUpperCase() + skill.slice(1)}
            />
          ))}
        </div>
      </div>
      
      {/* Active Operations */}
      {activeOperations.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-cyber font-bold text-cyber-primary flex items-center space-x-2">
            <Activity className="w-6 h-6" />
            <span>Active Operations</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeOperations.map((operation) => (
              <ActiveOperation key={operation.id} operation={operation} />
            ))}
          </div>
        </div>
      )}
      
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="cyber-card text-center">
          <h3 className="font-mono text-sm uppercase tracking-wider text-cyber-primary/80 mb-2">
            Operations Completed
          </h3>
          <p className="text-3xl font-bold text-cyber-primary cyber-text-glow">
            {completedOperations.length}
          </p>
        </div>
        
        <div className="cyber-card text-center">
          <h3 className="font-mono text-sm uppercase tracking-wider text-cyber-primary/80 mb-2">
            Total Earnings
          </h3>
          <p className="text-3xl font-bold text-cyber-accent cyber-text-glow">
            {completedOperations.reduce((sum, op) => sum + op.rewards.credits, 0).toLocaleString()}
          </p>
        </div>
        
        <div className="cyber-card text-center">
          <h3 className="font-mono text-sm uppercase tracking-wider text-cyber-primary/80 mb-2">
            Success Rate
          </h3>
          <p className="text-3xl font-bold text-cyber-secondary cyber-text-glow">
            {operations.length > 0 
              ? Math.round((completedOperations.length / operations.length) * 100)
              : 0}%
          </p>
        </div>
      </div>
      
      {/* Enhanced Narrative Quest System */}
      <div className="bg-gray-800 rounded-lg p-6">
        <NarrativeQuestSystem />
      </div>

      {/* Dynamic Quest Generator */}
      <div className="bg-gray-800 rounded-lg p-6">
        <DynamicQuestGenerator />
      </div>

      {/* Enhanced Quest System with Twists & Memorable Elements */}
      <div className="bg-gray-800 rounded-lg p-6">
        <EnhancedQuestSystem />
      </div>

      {/* Phase 3: Enhanced Experience Integration */}
      <Phase3Integration className="col-span-1 lg:col-span-2" />


    </div>
  );
};