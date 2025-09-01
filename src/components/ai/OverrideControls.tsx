import React, { useState, useEffect } from 'react';
import { useGameStore } from '../../store/gameStore';
import { Shield, AlertTriangle, Play, Pause, RotateCcw, Zap, Settings, Lock, Unlock, Clock, Target } from 'lucide-react';

interface OverrideAction {
  id: string;
  type: 'pause' | 'resume' | 'stop' | 'force_operation' | 'emergency_stop' | 'reset_ai';
  label: string;
  description: string;
  icon: React.ReactNode;
  severity: 'low' | 'medium' | 'high' | 'critical';
  requiresConfirmation: boolean;
}

interface EmergencyCondition {
  id: string;
  condition: string;
  threshold: number;
  current: number;
  active: boolean;
  action: string;
}

export const OverrideControls: React.FC = () => {
  const { 
    player, 
    aiActive, 
    aiConfig, 
    aiAnalytics,
    aiLastDecision,
    toggleAI, 
    resetAIAnalytics,
    updateAIConfig,
    recordAIDecision
  } = useGameStore();
  
  const [overrideLocked, setOverrideLocked] = useState(false);
  const [confirmAction, setConfirmAction] = useState<string | null>(null);
  const [emergencyConditions, setEmergencyConditions] = useState<EmergencyCondition[]>([]);
  const [manualOverrideActive, setManualOverrideActive] = useState(false);
  const [overrideTimer, setOverrideTimer] = useState<number>(0);
  const [lastOverrideTime, setLastOverrideTime] = useState<Date | null>(null);

  // Define available override actions
  const overrideActions: OverrideAction[] = [
    {
      id: 'pause_ai',
      type: 'pause',
      label: aiActive ? 'Pause AI' : 'Resume AI',
      description: aiActive ? 'Temporarily pause AI decision making' : 'Resume AI automation',
      icon: aiActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />,
      severity: 'low',
      requiresConfirmation: false
    },
    {
      id: 'emergency_stop',
      type: 'emergency_stop',
      label: 'Emergency Stop',
      description: 'Immediately halt all AI operations and lock controls',
      icon: <Shield className="w-4 h-4" />,
      severity: 'critical',
      requiresConfirmation: true
    },
    {
      id: 'reset_ai',
      type: 'reset_ai',
      label: 'Reset AI Analytics',
      description: 'Clear all AI performance data and restart learning',
      icon: <RotateCcw className="w-4 h-4" />,
      severity: 'medium',
      requiresConfirmation: true
    },
    {
      id: 'force_conservative',
      type: 'force_operation',
      label: 'Force Conservative Mode',
      description: 'Override AI to use conservative strategy temporarily',
      icon: <Settings className="w-4 h-4" />,
      severity: 'medium',
      requiresConfirmation: false
    }
  ];

  // Monitor emergency conditions
  useEffect(() => {
    const conditions: EmergencyCondition[] = [
      {
        id: 'low_success_rate',
        condition: 'Success Rate Below Threshold',
        threshold: 30,
        current: aiAnalytics.successRate,
        active: aiAnalytics.successRate < 30 && aiAnalytics.decisionsCount > 10,
        action: 'Switch to conservative mode'
      },
      {
        id: 'rapid_credit_loss',
        condition: 'Rapid Credit Loss',
        threshold: 1000,
        current: Math.max(0, (aiAnalytics.creditsEarned || 0) * -1),
        active: (aiAnalytics.creditsEarned || 0) < -1000,
        action: 'Pause AI operations'
      },
      {
        id: 'low_energy',
        condition: 'Critical Energy Level',
        threshold: 10,
        current: player.energy,
        active: player.energy < 10 && aiActive,
        action: 'Enable energy conservation mode'
      },
      {
        id: 'excessive_risk',
        condition: 'High Risk Operations',
        threshold: 80,
        current: aiConfig.riskTolerance * 100,
        active: aiConfig.riskTolerance > 0.8 && aiAnalytics.successRate < 50,
        action: 'Reduce risk tolerance'
      }
    ];
    
    setEmergencyConditions(conditions);
    
    // Auto-trigger emergency actions if conditions are met
    const activeEmergencies = conditions.filter(c => c.active);
    if (activeEmergencies.length > 0 && aiActive && !manualOverrideActive) {
      handleEmergencyAction(activeEmergencies[0]);
    }
  }, [player, aiAnalytics, aiConfig, aiActive]);

  // Handle override timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (manualOverrideActive && overrideTimer > 0) {
      interval = setInterval(() => {
        setOverrideTimer(prev => {
          if (prev <= 1) {
            setManualOverrideActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [manualOverrideActive, overrideTimer]);

  // Handle emergency actions
  const handleEmergencyAction = (condition: EmergencyCondition) => {
    setManualOverrideActive(true);
    setLastOverrideTime(new Date());
    
    switch (condition.id) {
      case 'low_success_rate':
        updateAIConfig({ riskTolerance: Math.max(0.2, aiConfig.riskTolerance - 0.3) });
        recordAIDecision({
          type: 'emergency_override',
          targetId: 'risk_tolerance',
          reasoning: 'Low success rate detected',
          confidence: 90,
          timestamp: new Date(),
          description: 'Reduced risk tolerance due to low success rate'
        }, 'success');
        break;
      case 'rapid_credit_loss':
        toggleAI();
        recordAIDecision({
          type: 'emergency_override',
          targetId: 'ai_pause',
          reasoning: 'Rapid credit loss detected',
          confidence: 95,
          timestamp: new Date(),
          description: 'Paused AI due to rapid credit loss'
        }, 'success');
        break;
      case 'low_energy':
        updateAIConfig({ 
          autoEnergyManagement: true,
          priorities: { ...aiConfig.priorities, operations: Math.max(0.1, aiConfig.priorities.operations - 0.2) }
        });
        break;
      case 'excessive_risk':
        updateAIConfig({ riskTolerance: 0.4 });
        break;
    }
    
    setOverrideTimer(300); // 5 minutes override
  };

  // Execute override action
  const executeOverrideAction = (action: OverrideAction) => {
    if (action.requiresConfirmation && confirmAction !== action.id) {
      setConfirmAction(action.id);
      return;
    }
    
    setConfirmAction(null);
    setLastOverrideTime(new Date());
    
    switch (action.type) {
      case 'pause':
      case 'resume':
        toggleAI();
        break;
      case 'emergency_stop':
        toggleAI();
        setOverrideLocked(true);
        setManualOverrideActive(true);
        setOverrideTimer(600); // 10 minutes lock
        break;
      case 'reset_ai':
        resetAIAnalytics();
        break;
      case 'force_operation':
        if (action.id === 'force_conservative') {
          updateAIConfig({ 
            riskTolerance: 0.3,
            priorities: {
              operations: 0.2,
              upgrades: 0.4,
              skills: 0.3,
              equipment: 0.1
            }
          });
          setManualOverrideActive(true);
          setOverrideTimer(180); // 3 minutes
        }
        break;
    }
    
    recordAIDecision({
      type: 'start_operation',
      targetId: 'manual_override',
      reasoning: 'Manual override - forced operation start',
      confidence: 100,
      timestamp: new Date(),
      description: 'Manually started operation via override',
    }, 'success');
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'border-cyber-primary/30 text-cyber-primary hover:bg-green-900/20';
      case 'medium': return 'border-cyber-warning/30 text-cyber-warning hover:bg-yellow-900/20';
      case 'high': return 'border-cyber-accent/30 text-cyber-accent hover:bg-orange-900/20';
      case 'critical': return 'border-cyber-danger/30 text-cyber-danger hover:bg-red-900/20';
      default: return 'border-gray-500/30 text-gray-400 hover:bg-gray-900/20';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Status */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-cyber-danger flex items-center space-x-2">
          <Shield className="w-5 h-5" />
          <span>Override Controls</span>
        </h3>
        
        <div className="flex items-center space-x-4">
          {manualOverrideActive && (
            <div className="flex items-center space-x-2 px-3 py-1 bg-yellow-900/30 border border-cyber-warning/30 rounded-lg">
              <Clock className="w-4 h-4 text-cyber-warning" />
              <span className="text-sm text-cyber-warning">
                Override: {Math.floor(overrideTimer / 60)}:{(overrideTimer % 60).toString().padStart(2, '0')}
              </span>
            </div>
          )}
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-400">Safety Lock:</span>
            <button
              onClick={() => setOverrideLocked(!overrideLocked)}
              className={`p-1 rounded transition-colors ${
                overrideLocked ? 'text-red-400 hover:text-red-300' : 'text-green-400 hover:text-green-300'
              }`}
            >
              {overrideLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* AI Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <div className={`w-3 h-3 rounded-full ${
              aiActive ? 'bg-green-400 animate-pulse' : 'bg-red-400'
            }`}></div>
            <span className="text-sm text-gray-400">AI Status</span>
          </div>
          <div className="text-lg font-semibold text-white">
            {aiActive ? 'Active' : 'Inactive'}
          </div>
          <div className="text-sm text-gray-400">
            {aiActive ? 'Making automated decisions' : 'Manual control active'}
          </div>
        </div>
        
        <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Target className="w-4 h-4 text-cyan-400" />
            <span className="text-sm text-gray-400">Last Decision</span>
          </div>
          <div className="text-lg font-semibold text-white">
            {aiLastDecision ? aiLastDecision.action : 'None'}
          </div>
          <div className="text-sm text-gray-400">
            {aiLastDecision ? aiLastDecision.timestamp.toLocaleTimeString() : 'No recent activity'}
          </div>
        </div>
        
        <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
            <span className="text-sm text-gray-400">Emergency Conditions</span>
          </div>
          <div className="text-lg font-semibold text-white">
            {emergencyConditions.filter(c => c.active).length}
          </div>
          <div className="text-sm text-gray-400">
            Active alerts
          </div>
        </div>
      </div>

      {/* Emergency Conditions */}
      {emergencyConditions.some(c => c.active) && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
          <h4 className="text-lg font-semibold text-red-400 mb-3 flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5" />
            <span>Emergency Conditions Detected</span>
          </h4>
          
          <div className="space-y-3">
            {emergencyConditions.filter(c => c.active).map(condition => (
              <div key={condition.id} className="bg-red-900/30 border border-red-500/20 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-red-300">{condition.condition}</span>
                  <span className="text-sm text-red-400">
                    {condition.current.toFixed(1)} / {condition.threshold}
                  </span>
                </div>
                <div className="text-sm text-gray-300 mb-2">
                  Recommended Action: {condition.action}
                </div>
                <div className="w-full bg-red-900/50 rounded-full h-2">
                  <div 
                    className="bg-red-500 h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${Math.min(100, (condition.current / condition.threshold) * 100)}%` 
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Override Actions */}
      <div>
        <h4 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
          <Settings className="w-5 h-5 text-red-400" />
          <span>Manual Override Actions</span>
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {overrideActions.map(action => {
            const isDisabled = overrideLocked && action.severity === 'critical';
            const needsConfirmation = confirmAction === action.id;
            
            return (
              <div key={action.id} className="relative">
                <button
                  onClick={() => executeOverrideAction(action)}
                  disabled={isDisabled}
                  className={`w-full border rounded-lg p-4 text-left transition-all duration-200 ${
                    isDisabled 
                      ? 'border-gray-600 text-gray-500 cursor-not-allowed opacity-50'
                      : getSeverityColor(action.severity)
                  } ${
                    needsConfirmation ? 'ring-2 ring-yellow-500/50 animate-pulse' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3 mb-2">
                    {action.icon}
                    <span className="font-semibold">{action.label}</span>
                    {action.requiresConfirmation && !needsConfirmation && (
                      <span className="text-xs px-2 py-1 bg-yellow-900/30 text-yellow-400 rounded-full">
                        CONFIRM
                      </span>
                    )}
                  </div>
                  
                  <p className="text-sm opacity-80 mb-2">{action.description}</p>
                  
                  <div className="flex items-center justify-between">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      action.severity === 'low' ? 'bg-green-900/30 text-green-400' :
                      action.severity === 'medium' ? 'bg-yellow-900/30 text-yellow-400' :
                      action.severity === 'high' ? 'bg-orange-900/30 text-orange-400' :
                      'bg-red-900/30 text-red-400'
                    }`}>
                      {action.severity.toUpperCase()}
                    </span>
                    
                    {needsConfirmation && (
                      <span className="text-xs text-yellow-400 animate-pulse">
                        Click again to confirm
                      </span>
                    )}
                  </div>
                </button>
                
                {needsConfirmation && (
                  <button
                    onClick={() => setConfirmAction(null)}
                    className="absolute top-2 right-2 text-gray-400 hover:text-white"
                  >
                    ×
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Override History */}
      <div>
        <h4 className="text-lg font-semibold text-white mb-4">Recent Override Activity</h4>
        
        <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
          {lastOverrideTime ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Last Override:</span>
                <span className="text-sm text-white">{lastOverrideTime.toLocaleString()}</span>
              </div>
              
              {manualOverrideActive && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Override Duration:</span>
                  <span className="text-sm text-yellow-400">
                    {Math.floor(overrideTimer / 60)}:{(overrideTimer % 60).toString().padStart(2, '0')} remaining
                  </span>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Status:</span>
                <span className={`text-sm ${
                  manualOverrideActive ? 'text-yellow-400' : 'text-green-400'
                }`}>
                  {manualOverrideActive ? 'Override Active' : 'Normal Operation'}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-4">
              <Shield className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No override actions performed</p>
              <p className="text-sm">AI is operating normally</p>
            </div>
          )}
        </div>
      </div>

      {/* Safety Notice */}
      <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-500/30 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-2">
          <Shield className="w-5 h-5 text-blue-400" />
          <span className="font-semibold text-blue-400">Safety Information</span>
        </div>
        <p className="text-sm text-gray-300">
          Override controls allow manual intervention in AI operations. Use emergency stops only when necessary, 
          as they may disrupt ongoing operations. The safety lock prevents accidental activation of critical overrides.
        </p>
      </div>
    </div>
  );
};