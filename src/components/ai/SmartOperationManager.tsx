import React, { useState, useEffect } from 'react';
import { useGameStore } from '../../store/gameStore';
import { Zap, Target, Clock, DollarSign, Shield, TrendingUp, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface OperationRecommendation {
  id: string;
  name: string;
  difficulty: number;
  reward: number;
  energyCost: number;
  successProbability: number;
  riskLevel: 'low' | 'medium' | 'high';
  reasoning: string;
  priority: number;
}

export const SmartOperationManager: React.FC = () => {
  const { 
    player, 
    operations, 
    currentOperation, 
    aiConfig, 
    aiActive,
    startOperation,
    makeAIDecision,
    executeAIDecision 
  } = useGameStore();
  
  const [recommendations, setRecommendations] = useState<OperationRecommendation[]>([]);
  const [autoSelectEnabled, setAutoSelectEnabled] = useState(true);
  const [lastAnalysis, setLastAnalysis] = useState<Date>(new Date());

  // Calculate operation recommendations based on AI config and player stats
  const calculateRecommendations = () => {
    // Safety check for player skills
    if (!player.skills || typeof player.skills !== 'object') {
      setRecommendations([]);
      return;
    }

    const recs: OperationRecommendation[] = operations.map(op => {
      // Calculate success probability based on player skills and operation difficulty
      const skillBonus = (player.skills.hacking + player.skills.stealth + player.skills.social) / 300;
      const baseSuccess = Math.max(0.1, Math.min(0.95, 1 - (op.difficulty / 100) + skillBonus));
      
      // Adjust for AI risk tolerance
      const riskAdjustedSuccess = baseSuccess * (1 + (aiConfig.riskTolerance - 0.5) * 0.2);
      
      // Calculate priority based on AI priorities
      const rewardWeight = aiConfig.priorities.operations;
      const riskWeight = 1 - aiConfig.riskTolerance;
      const efficiencyWeight = aiConfig.priorities.upgrades; // Higher upgrade priority = prefer efficient ops
      
      const priority = (
        (op.baseReward / Math.max(1, op.energyCost)) * rewardWeight * 0.4 +
        riskAdjustedSuccess * riskWeight * 0.3 +
        (op.baseReward / 1000) * efficiencyWeight * 0.3
      );
      
      // Determine risk level
      let riskLevel: 'low' | 'medium' | 'high' = 'low';
      if (op.difficulty > 70) riskLevel = 'high';
      else if (op.difficulty > 40) riskLevel = 'medium';
      
      // Generate reasoning
      let reasoning = '';
      if (riskAdjustedSuccess > 0.8) {
        reasoning = 'High success probability with current skills';
      } else if (riskAdjustedSuccess > 0.6) {
        reasoning = 'Moderate success chance, good risk/reward ratio';
      } else if (op.baseReward > 500) {
        reasoning = 'High reward potential despite increased risk';
      } else {
        reasoning = 'Low priority due to high risk or low reward';
      }
      
      return {
        id: op.id,
        name: op.name,
        difficulty: op.difficulty,
        reward: op.baseReward,
        energyCost: op.energyCost,
        successProbability: riskAdjustedSuccess,
        riskLevel,
        reasoning,
        priority
      };
    });
    
    // Sort by priority (highest first)
    recs.sort((a, b) => b.priority - a.priority);
    setRecommendations(recs);
    setLastAnalysis(new Date());
  };

  // Recalculate recommendations when relevant data changes
  useEffect(() => {
    if (player.skills) {
      calculateRecommendations();
    }
  }, [player.skills, aiConfig, operations]);

  // Auto-select operation if AI is active and auto-select is enabled
  useEffect(() => {
    if (aiActive && autoSelectEnabled && !currentOperation && recommendations.length > 0 && player) {
      const bestOperation = recommendations[0];
      if (bestOperation.successProbability > 0.3 && player.energy >= bestOperation.energyCost) {
        const operation = operations.find(op => op.id === bestOperation.id);
        if (operation) {
          startOperation(operation.targetId, operation.type);
        }
      }
    }
  }, [aiActive, autoSelectEnabled, currentOperation, recommendations, player.energy]);

  const handleManualSelect = (operationId: string) => {
    const operation = operations.find(op => op.id === operationId);
    if (operation && player && player.energy >= operation.energyCost) {
      startOperation(operation.targetId, operation.type);
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'green';
      case 'medium': return 'yellow';
      case 'high': return 'red';
      default: return 'gray';
    }
  };

  const getSuccessIcon = (probability: number) => {
    if (probability > 0.7) return <CheckCircle className="w-4 h-4 text-cyber-primary" />;
    if (probability > 0.4) return <AlertTriangle className="w-4 h-4 text-cyber-warning" />;
    return <XCircle className="w-4 h-4 text-cyber-danger" />;
  };

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-cyber-accent flex items-center space-x-2">
          <Zap className="w-5 h-5" />
          <span>Smart Operation Manager</span>
        </h3>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-400">Auto-Select:</span>
            <button
              onClick={() => setAutoSelectEnabled(!autoSelectEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                autoSelectEnabled ? 'bg-cyan-600' : 'bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  autoSelectEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          
          <button
            onClick={calculateRecommendations}
            className="px-3 py-1 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm transition-colors"
          >
            Refresh Analysis
          </button>
        </div>
      </div>

      {/* Current Operation Status */}
      {currentOperation && (
        <div className="bg-gradient-to-r from-cyber-accent/30 to-cyber-primary/30 border border-cyber-accent/50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-cyber-accent mb-1">Currently Running</h4>
              <p className="text-white">{currentOperation.name}</p>
              <p className="text-sm text-gray-400">Progress: {currentOperation.progress}%</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-400">Time Remaining</div>
              <div className="text-cyan-400 font-mono">
                {Math.max(0, Math.ceil((currentOperation.duration - currentOperation.progress * currentOperation.duration / 100) / 1000))}s
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analysis Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Target className="w-4 h-4 text-cyan-400" />
            <span className="text-sm text-gray-400">Best Option</span>
          </div>
          <div className="text-lg font-semibold text-white">
            {recommendations[0]?.name || 'None Available'}
          </div>
          <div className="text-sm text-cyan-400">
            {recommendations[0] ? `${(recommendations[0].successProbability * 100).toFixed(0)}% success` : ''}
          </div>
        </div>
        
        <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Clock className="w-4 h-4 text-green-400" />
            <span className="text-sm text-gray-400">Last Analysis</span>
          </div>
          <div className="text-lg font-semibold text-white">
            {lastAnalysis.toLocaleTimeString()}
          </div>
          <div className="text-sm text-green-400">
            {recommendations.length} operations analyzed
          </div>
        </div>
        
        <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Shield className="w-4 h-4 text-yellow-400" />
            <span className="text-sm text-gray-400">Risk Level</span>
          </div>
          <div className="text-lg font-semibold text-white">
            {recommendations[0]?.riskLevel.toUpperCase() || 'N/A'}
          </div>
          <div className="text-sm text-yellow-400">
            Based on AI settings
          </div>
        </div>
      </div>

      {/* Operation Recommendations */}
      <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
          <TrendingUp className="w-5 h-5 text-cyan-400" />
          <span>Recommended Operations</span>
        </h4>
        
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {recommendations.length > 0 ? (
            recommendations.map((rec, index) => {
              const riskColor = getRiskColor(rec.riskLevel);
              const canAfford = player && player.energy >= rec.energyCost;
              
              return (
                <div 
                  key={rec.id}
                  className={`border rounded-lg p-4 transition-all duration-300 ${
                    index === 0 
                      ? 'border-cyan-500 bg-cyan-900/20' 
                      : 'border-gray-600 bg-gray-800/30'
                  } ${!canAfford ? 'opacity-50' : 'hover:bg-gray-800/50'}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-1">
                        <span className="font-semibold text-white">{rec.name}</span>
                        {index === 0 && (
                          <span className="px-2 py-1 bg-cyan-600 text-white text-xs rounded-full">
                            RECOMMENDED
                          </span>
                        )}
                      </div>
                      {getSuccessIcon(rec.successProbability)}
                    </div>
                    
                    <button
                      onClick={() => handleManualSelect(rec.id)}
                      disabled={!canAfford || !!currentOperation}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        canAfford && !currentOperation
                          ? 'bg-cyan-600 hover:bg-cyan-700 text-white'
                          : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {currentOperation ? 'Busy' : canAfford ? 'Start' : 'No Energy'}
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                    <div>
                      <div className="text-xs text-gray-400">Success Rate</div>
                      <div className="text-sm font-semibold text-white">
                        {(rec.successProbability * 100).toFixed(0)}%
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-xs text-gray-400">Reward</div>
                      <div className="text-sm font-semibold text-green-400 flex items-center space-x-1">
                        <DollarSign className="w-3 h-3" />
                        <span>{rec.reward}</span>
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-xs text-gray-400">Energy Cost</div>
                      <div className="text-sm font-semibold text-yellow-400">
                        {rec.energyCost}
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-xs text-gray-400">Risk Level</div>
                      <div className={`text-sm font-semibold text-${riskColor}-400`}>
                        {rec.riskLevel.toUpperCase()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-400 italic">
                    {rec.reasoning}
                  </div>
                  
                  {/* Priority indicator */}
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>AI Priority Score</span>
                      <span>{rec.priority.toFixed(2)}</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-1 mt-1">
                      <div 
                        className="bg-cyan-500 h-1 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, rec.priority * 20)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center text-gray-500 py-8">
              <Zap className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No operations available</p>
              <p className="text-sm">Complete current operations to unlock more</p>
            </div>
          )}
        </div>
      </div>

      {/* AI Decision Making Info */}
      {aiActive && (
        <div className="bg-gradient-to-r from-green-900/20 to-cyan-900/20 border border-green-500/30 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <span className="font-semibold text-green-400">AI Auto-Selection Active</span>
          </div>
          <p className="text-sm text-gray-300">
            The AI will automatically select and start the best available operation based on your configured priorities and risk tolerance.
            {autoSelectEnabled ? ' Auto-selection is enabled.' : ' Auto-selection is disabled - operations must be started manually.'}
          </p>
        </div>
      )}
    </div>
  );
};