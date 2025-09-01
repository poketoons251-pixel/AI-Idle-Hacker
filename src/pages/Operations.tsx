import React, { useEffect } from 'react';
import { 
  Target, 
  Shield, 
  DollarSign, 
  Star, 
  TrendingUp, 
  Lock, 
  Unlock,
  Zap,
  Clock,
  AlertTriangle,
  Activity,
  Terminal,
  Wifi,
  Database,
  Eye,
  Skull
} from 'lucide-react';
import { useGameStore } from '../store/gameStore';

const operationTypes = [
  {
    id: 'data_breach',
    name: 'Data Breach',
    description: 'Extract sensitive information from target systems',
    icon: Target,
    color: 'text-cyber-accent',
  },
  {
    id: 'crypto_mining',
    name: 'Crypto Mining',
    description: 'Use target resources for cryptocurrency mining',
    icon: DollarSign,
    color: 'text-cyber-warning',
  },
  {
    id: 'ddos',
    name: 'DDoS Attack',
    description: 'Overwhelm target systems with traffic',
    icon: Zap,
    color: 'text-cyber-danger',
  },
  {
    id: 'social_engineering',
    name: 'Social Engineering',
    description: 'Manipulate human targets for access',
    icon: Shield,
    color: 'text-cyber-secondary',
  },
];

const getOperationStatus = (operationType: string, progress: number) => {
  const statusMap = {
    data_breach: {
      0: { status: 'Initializing breach protocols...', icon: Activity },
      10: { status: 'Scanning target network topology...', icon: Wifi },
      25: { status: 'Bypassing firewall defenses...', icon: Shield },
      40: { status: 'Exploiting system vulnerabilities...', icon: AlertTriangle },
      60: { status: 'Accessing restricted databases...', icon: Database },
      80: { status: 'Extracting sensitive data packets...', icon: Eye },
      95: { status: 'Cleaning traces and finalizing...', icon: Terminal }
    },
    crypto_mining: {
      0: { status: 'Deploying mining payload...', icon: Activity },
      15: { status: 'Hijacking system resources...', icon: Zap },
      30: { status: 'Establishing mining pool connection...', icon: Wifi },
      50: { status: 'Mining cryptocurrency blocks...', icon: DollarSign },
      70: { status: 'Optimizing hash rate performance...', icon: TrendingUp },
      90: { status: 'Transferring mined coins...', icon: Database }
    },
    ddos: {
      0: { status: 'Assembling botnet army...', icon: Activity },
      20: { status: 'Coordinating attack vectors...', icon: Target },
      40: { status: 'Flooding target with requests...', icon: Zap },
      60: { status: 'Overwhelming server capacity...', icon: AlertTriangle },
      80: { status: 'Target systems failing...', icon: Skull },
      95: { status: 'Mission accomplished...', icon: Terminal }
    },
    social_engineering: {
      0: { status: 'Researching target personnel...', icon: Eye },
      20: { status: 'Crafting convincing personas...', icon: Shield },
      40: { status: 'Initiating contact protocols...', icon: Wifi },
      60: { status: 'Building trust and rapport...', icon: Activity },
      80: { status: 'Extracting access credentials...', icon: Database },
      95: { status: 'Infiltration successful...', icon: Terminal }
    }
  };

  const typeStatuses = statusMap[operationType as keyof typeof statusMap] || statusMap.data_breach;
  const thresholds = Object.keys(typeStatuses).map(Number).sort((a, b) => b - a);
  const threshold = thresholds.find(t => progress >= t) || 0;
  
  return typeStatuses[threshold as keyof typeof typeStatuses] || { status: 'Operation in progress...', icon: Activity };
};



const ProgressBar: React.FC<{
  current: number;
  max: number;
  color: string;
  label: string;
}> = ({ current, max, color, label }) => (
  <div className="space-y-2">
    <div className="flex justify-between items-center">
      <span className="font-mono text-sm text-cyber-primary/80">{label}</span>
      <span className="font-mono text-xs text-cyber-primary/60">
        {current.toFixed(1)}%
      </span>
    </div>
    <div className="resource-bar">
      <div 
        className={`resource-fill ${color}`}
        style={{ width: `${(current / max) * 100}%` }}
      />
    </div>
  </div>
);

const DetailedActiveOperation: React.FC<{ operation: any }> = ({ operation }) => {
  const { updateOperation, completeOperation, targets } = useGameStore();
  
  useEffect(() => {
    if (operation.status !== 'active') return;
    
    const interval = setInterval(() => {
      const elapsed = Date.now() - operation.startTime;
      const progress = Math.min((elapsed / operation.duration) * 100, 100);
      
      updateOperation(operation.id, { progress });
      
      if (progress >= 100) {
        completeOperation(operation.id);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [operation, updateOperation, completeOperation]);
  
  const timeRemaining = Math.max(0, operation.duration - (Date.now() - operation.startTime));
  const minutes = Math.floor(timeRemaining / 60000);
  const seconds = Math.floor((timeRemaining % 60000) / 1000);
  
  const target = targets.find(t => t.id === operation.targetId);
  const currentStatus = getOperationStatus(operation.type, operation.progress);
  const StatusIcon = currentStatus.icon;
  
  const getOperationTypeIcon = (type: string) => {
    const typeIcons = {
      data_breach: Target,
      crypto_mining: DollarSign,
      ddos: Zap,
      social_engineering: Shield
    };
    return typeIcons[type as keyof typeof typeIcons] || Target;
  };
  
  const OperationIcon = getOperationTypeIcon(operation.type);
  
  return (
    <div className="cyber-card border-cyber-accent/30 bg-gradient-to-br from-cyber-dark/50 to-cyber-accent/5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <OperationIcon className="w-5 h-5 text-cyber-accent" />
          <div>
            <h3 className="font-cyber font-bold text-cyber-primary">
              {operation.type.replace('_', ' ').toUpperCase()}
            </h3>
            <p className="text-xs text-cyber-primary/60 font-mono">
              Target: {target?.name || 'Unknown'}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center space-x-1 text-cyber-warning mb-1">
            <Clock className="w-4 h-4" />
            <span className="font-mono text-sm font-bold">
              {minutes}:{seconds.toString().padStart(2, '0')}
            </span>
          </div>
          <p className="text-xs text-cyber-primary/60 font-mono">
            {operation.progress.toFixed(1)}% Complete
          </p>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="mb-4">
        <ProgressBar 
          current={operation.progress} 
          max={100} 
          color="text-cyber-accent" 
          label="Operation Progress" 
        />
      </div>
      
      {/* Live Status */}
      <div className="mb-4 p-3 bg-cyber-dark/40 rounded border border-cyber-primary/20">
        <div className="flex items-center space-x-2 mb-2">
          <Terminal className="w-4 h-4 text-cyber-secondary" />
          <span className="font-mono text-xs uppercase tracking-wider text-cyber-secondary">
            Live Status Feed
          </span>
        </div>
        <div className="flex items-center space-x-3">
          <StatusIcon className="w-4 h-4 text-cyber-accent animate-pulse" />
          <span className="font-mono text-sm text-cyber-primary">
            {currentStatus.status}
          </span>
        </div>
        <div className="mt-2 flex items-center space-x-2">
          <div className="w-2 h-2 bg-cyber-accent rounded-full animate-pulse"></div>
          <span className="font-mono text-xs text-cyber-primary/60">
            Connection: SECURE | Trace: MASKED | Status: ACTIVE
          </span>
        </div>
      </div>
      
      {/* Target Info */}
      <div className="mb-4 grid grid-cols-2 gap-3 text-xs">
        <div className="space-y-1">
          <p className="text-cyber-primary/60 font-mono uppercase">Target Info</p>
          <div className="flex items-center space-x-1">
            <Shield className="w-3 h-3 text-cyber-warning" />
            <span className="text-cyber-warning font-mono">SEC LVL {target?.securityLevel || 'N/A'}</span>
          </div>
          <div className="flex items-center space-x-1">
            <AlertTriangle className="w-3 h-3 text-cyber-danger" />
            <span className="text-cyber-danger font-mono">DIFF {target?.difficulty || 'N/A'}</span>
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-cyber-primary/60 font-mono uppercase">Risk Level</p>
          <div className="flex items-center space-x-1">
            <Eye className="w-3 h-3 text-cyber-secondary" />
            <span className="text-cyber-secondary font-mono">
              {operation.progress < 50 ? 'LOW' : operation.progress < 80 ? 'MEDIUM' : 'HIGH'}
            </span>
          </div>
        </div>
      </div>
      
      {/* Expected Rewards */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="text-center p-2 bg-cyber-dark/30 rounded border border-cyber-accent/20">
          <DollarSign className="w-4 h-4 text-cyber-accent mx-auto mb-1" />
          <p className="text-cyber-accent font-mono font-bold">+{operation.rewards.credits}</p>
          <p className="text-cyber-primary/60 font-mono">Credits</p>
        </div>
        <div className="text-center p-2 bg-cyber-dark/30 rounded border border-cyber-secondary/20">
          <Star className="w-4 h-4 text-cyber-secondary mx-auto mb-1" />
          <p className="text-cyber-secondary font-mono font-bold">+{operation.rewards.experience}</p>
          <p className="text-cyber-primary/60 font-mono">XP</p>
        </div>
        <div className="text-center p-2 bg-cyber-dark/30 rounded border border-cyber-warning/20">
          <TrendingUp className="w-4 h-4 text-cyber-warning mx-auto mb-1" />
          <p className="text-cyber-warning font-mono font-bold">+{operation.rewards.reputation}</p>
          <p className="text-cyber-primary/60 font-mono">Rep</p>
        </div>
      </div>
    </div>
  );
};

const TargetCard: React.FC<{ target: any }> = ({ target }) => {
  const { startOperation, player, operations } = useGameStore();
  
  const hasActiveOperation = operations.some(
    op => op.targetId === target.id && op.status === 'active'
  );
  
  const canAfford = player.energy >= 20; // Operations cost 20 energy
  
  const handleStartOperation = (operationType: string) => {
    if (!target.unlocked || hasActiveOperation || !canAfford) return;
    
    startOperation(target.id, operationType as any);
  };
  
  const getDifficultyColor = (difficulty: number) => {
    if (difficulty <= 2) return 'text-cyber-primary';
    if (difficulty <= 4) return 'text-cyber-warning';
    return 'text-cyber-danger';
  };
  
  const getTypeColor = (type: string) => {
    const colors = {
      corporation: 'text-cyber-accent',
      government: 'text-cyber-danger',
      individual: 'text-cyber-primary',
      criminal: 'text-cyber-secondary',
    };
    return colors[type as keyof typeof colors] || 'text-cyber-primary';
  };
  
  return (
    <div className={`cyber-card ${!target.unlocked ? 'opacity-50' : ''}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            {target.unlocked ? (
              <Unlock className="w-4 h-4 text-cyber-primary" />
            ) : (
              <Lock className="w-4 h-4 text-cyber-primary/50" />
            )}
            <h3 className="font-cyber font-bold text-cyber-primary">
              {target.name}
            </h3>
          </div>
          
          <div className="flex items-center space-x-4 text-xs font-mono mb-3">
            <span className={`${getTypeColor(target.type)} uppercase`}>
              {target.type}
            </span>
            <span className={`${getDifficultyColor(target.difficulty)} flex items-center space-x-1`}>
              <Shield className="w-3 h-3" />
              <span>LVL {target.difficulty}</span>
            </span>
            <span className="text-cyber-warning flex items-center space-x-1">
              <AlertTriangle className="w-3 h-3" />
              <span>SEC {target.securityLevel}</span>
            </span>
          </div>
          
          {hasActiveOperation && (
            <div className="flex items-center space-x-2 text-cyber-accent text-xs font-mono mb-3">
              <Clock className="w-3 h-3 animate-pulse" />
              <span>OPERATION IN PROGRESS</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Rewards */}
      <div className="grid grid-cols-3 gap-2 mb-4 text-xs">
        <div className="text-center p-2 bg-cyber-dark/30 rounded">
          <DollarSign className="w-4 h-4 text-cyber-accent mx-auto mb-1" />
          <p className="text-cyber-accent font-mono">{target.rewards.credits}</p>
        </div>
        <div className="text-center p-2 bg-cyber-dark/30 rounded">
          <Star className="w-4 h-4 text-cyber-secondary mx-auto mb-1" />
          <p className="text-cyber-secondary font-mono">{target.rewards.experience}</p>
        </div>
        <div className="text-center p-2 bg-cyber-dark/30 rounded">
          <TrendingUp className="w-4 h-4 text-cyber-warning mx-auto mb-1" />
          <p className="text-cyber-warning font-mono">{target.rewards.reputation}</p>
        </div>
      </div>
      
      {/* Operation Types */}
      {target.unlocked && (
        <div className="space-y-2">
          <h4 className="font-mono text-xs uppercase tracking-wider text-cyber-primary/80">
            Available Operations
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {operationTypes.map((opType) => {
              const Icon = opType.icon;
              const disabled = hasActiveOperation || !canAfford;
              
              return (
                <button
                  key={opType.id}
                  onClick={() => handleStartOperation(opType.id)}
                  disabled={disabled}
                  className={`
                    flex items-center space-x-2 p-2 rounded border transition-all duration-300
                    ${disabled 
                      ? 'border-cyber-primary/20 text-cyber-primary/40 cursor-not-allowed'
                      : 'border-cyber-primary/30 text-cyber-primary hover:border-cyber-primary hover:bg-cyber-primary/10 cyber-button'
                    }
                  `}
                >
                  <Icon className={`w-3 h-3 ${disabled ? 'text-cyber-primary/40' : opType.color}`} />
                  <span className="font-mono text-xs">{opType.name}</span>
                </button>
              );
            })}
          </div>
          
          {!canAfford && (
            <p className="text-cyber-danger text-xs font-mono mt-2">
              Insufficient energy (20 required)
            </p>
          )}
        </div>
      )}
      
      {!target.unlocked && (
        <div className="text-center py-4">
          <Lock className="w-8 h-8 text-cyber-primary/30 mx-auto mb-2" />
          <p className="text-cyber-primary/60 font-mono text-sm">
            Complete previous targets to unlock
          </p>
        </div>
      )}
    </div>
  );
};

export const Operations: React.FC = () => {
  const { targets, operations, player } = useGameStore();
  
  console.log('🎯 Operations Component: Store data:', {
    targets,
    targetCount: targets?.length || 0,
    unlockedTargets: targets?.filter(t => t.unlocked).length || 0,
    operations,
    operationCount: operations?.length || 0,
    player: player ? { username: player.username, energy: player.energy } : null
  });
  
  // Debug: Show data directly in UI
  if (!targets || targets.length === 0) {
    return (
      <div className="p-4 bg-red-900/50 border border-red-500 rounded">
        <h2 className="text-red-400 font-bold mb-2">DEBUG: No Targets Data</h2>
        <pre className="text-xs text-red-300">
          {JSON.stringify({ 
            targets: targets?.length || 0, 
            player: !!player, 
            operations: operations?.length || 0 
          }, null, 2)}
        </pre>
      </div>
    );
  }
  
  const activeOperations = operations.filter(op => op.status === 'active');
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-cyber font-bold text-cyber-primary cyber-text-glow">
          OPERATION CENTER
        </h1>
        <p className="text-cyber-primary/60 font-mono">
          Select your targets and execute operations
        </p>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="cyber-card text-center">
          <h3 className="font-mono text-sm uppercase tracking-wider text-cyber-primary/80 mb-2">
            Active Ops
          </h3>
          <p className="text-2xl font-bold text-cyber-accent cyber-text-glow">
            {activeOperations.length}
          </p>
        </div>
        
        <div className="cyber-card text-center">
          <h3 className="font-mono text-sm uppercase tracking-wider text-cyber-primary/80 mb-2">
            Energy
          </h3>
          <p className="text-2xl font-bold text-cyber-warning cyber-text-glow">
            {player.energy}/{player.maxEnergy}
          </p>
        </div>
        
        <div className="cyber-card text-center">
          <h3 className="font-mono text-sm uppercase tracking-wider text-cyber-primary/80 mb-2">
            Success Rate
          </h3>
          <p className="text-2xl font-bold text-cyber-secondary cyber-text-glow">
            {operations.length > 0 
              ? Math.round((operations.filter(op => op.status === 'completed').length / operations.length) * 100)
              : 0}%
          </p>
        </div>
        
        <div className="cyber-card text-center">
          <h3 className="font-mono text-sm uppercase tracking-wider text-cyber-primary/80 mb-2">
            Targets Unlocked
          </h3>
          <p className="text-2xl font-bold text-cyber-primary cyber-text-glow">
            {targets.filter(t => t.unlocked).length}/{targets.length}
          </p>
        </div>
      </div>
      
      {/* Operation Types Legend */}
      <div className="cyber-card">
        <h2 className="text-lg font-cyber font-bold text-cyber-primary mb-4">
          Operation Types
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {operationTypes.map((opType) => {
            const Icon = opType.icon;
            return (
              <div key={opType.id} className="flex items-start space-x-3">
                <Icon className={`w-5 h-5 ${opType.color} flex-shrink-0 mt-0.5`} />
                <div>
                  <h3 className="font-mono text-sm font-bold text-cyber-primary">
                    {opType.name}
                  </h3>
                  <p className="text-xs text-cyber-primary/60">
                    {opType.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Active Operations */}
      {activeOperations.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-cyber font-bold text-cyber-primary flex items-center space-x-2">
            <Activity className="w-6 h-6" />
            <span>Active Operations</span>
            <span className="text-sm font-mono text-cyber-accent bg-cyber-accent/20 px-2 py-1 rounded">
              {activeOperations.length} Running
            </span>
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {activeOperations.map((operation) => (
              <DetailedActiveOperation key={operation.id} operation={operation} />
            ))}
          </div>
        </div>
      )}
      
      {/* Targets */}
      <div className="space-y-4">
        <h2 className="text-xl font-cyber font-bold text-cyber-primary flex items-center space-x-2">
          <Target className="w-6 h-6" />
          <span>Available Targets</span>
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {targets.map((target) => (
            <TargetCard key={target.id} target={target} />
          ))}
        </div>
      </div>
    </div>
  );
};