import React, { useState, useEffect } from 'react';
import { useGameStore } from '../../store/gameStore';
import { DollarSign, Zap, TrendingUp, Settings, AlertCircle, CheckCircle, BarChart3, Target } from 'lucide-react';

interface ResourceAllocation {
  category: string;
  current: number;
  recommended: number;
  efficiency: number;
  reasoning: string;
}

interface OptimizationSuggestion {
  type: 'upgrade' | 'equipment' | 'skill' | 'operation';
  item: string;
  cost: number;
  benefit: number;
  priority: number;
  description: string;
}

export const ResourceOptimizer: React.FC = () => {
  const { 
    player, 
    equipment, 
    aiConfig, 
    aiActive,
    updateAIConfig 
  } = useGameStore();
  
  const [allocations, setAllocations] = useState<ResourceAllocation[]>([]);
  const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>([]);
  const [autoOptimizeEnabled, setAutoOptimizeEnabled] = useState(true);
  const [lastOptimization, setLastOptimization] = useState<Date>(new Date());

  // Calculate optimal resource allocation
  const calculateOptimalAllocation = () => {
    // Safety check for player data
    if (!player) {
      return;
    }
    
    const totalCredits = player.credits;
    const reserveAmount = totalCredits * aiConfig.resourceAllocation.reserve;
    const availableCredits = totalCredits - reserveAmount;
    
    // Calculate efficiency scores for each category
    const operationsEfficiency = calculateOperationsEfficiency();
    const upgradesEfficiency = calculateUpgradesEfficiency();
    const equipmentEfficiency = calculateEquipmentEfficiency();
    
    // Generate recommendations based on efficiency and AI priorities
    const recommendations: ResourceAllocation[] = [
      {
        category: 'Operations',
        current: aiConfig.resourceAllocation.operations * 100,
        recommended: Math.max(10, Math.min(60, operationsEfficiency * aiConfig.priorities.operations * 100)),
        efficiency: operationsEfficiency,
        reasoning: operationsEfficiency > 0.7 ? 'High ROI from current operations' : 'Consider focusing on skill/equipment upgrades first'
      },
      {
        category: 'Upgrades',
        current: aiConfig.resourceAllocation.upgrades * 100,
        recommended: Math.max(20, Math.min(50, upgradesEfficiency * aiConfig.priorities.upgrades * 100)),
        efficiency: upgradesEfficiency,
        reasoning: upgradesEfficiency > 0.8 ? 'Upgrades will significantly improve performance' : 'Current upgrades may have diminishing returns'
      },
      {
        category: 'Equipment',
        current: aiConfig.resourceAllocation.equipment * 100,
        recommended: Math.max(10, Math.min(40, equipmentEfficiency * aiConfig.priorities.equipment * 100)),
        efficiency: equipmentEfficiency,
        reasoning: equipmentEfficiency > 0.6 ? 'Equipment upgrades available with good value' : 'Current equipment is adequate for now'
      },
      {
        category: 'Reserve',
        current: aiConfig.resourceAllocation.reserve * 100,
        recommended: Math.max(10, Math.min(30, 20 + (1 - aiConfig.riskTolerance) * 20)),
        efficiency: 1 - aiConfig.riskTolerance,
        reasoning: aiConfig.riskTolerance > 0.7 ? 'Low reserve for aggressive strategy' : 'Higher reserve for conservative approach'
      }
    ];
    
    // Normalize recommendations to sum to 100%
    const totalRecommended = recommendations.reduce((sum, rec) => sum + rec.recommended, 0);
    recommendations.forEach(rec => {
      rec.recommended = (rec.recommended / totalRecommended) * 100;
    });
    
    setAllocations(recommendations);
  };

  // Calculate efficiency scores
  const calculateOperationsEfficiency = (): number => {
    // Safety check for player and skills
    if (!player || !player.skills) {
      return 0.5; // Default efficiency when player data is not available
    }
    
    // Based on success rate, energy efficiency, and current skill levels
    const skillLevel = (player.skills.hacking + player.skills.stealth + player.skills.social) / 300;
    const energyEfficiency = player.maxEnergy > 50 ? 0.8 : 0.5;
    return Math.min(1, skillLevel * 0.6 + energyEfficiency * 0.4);
  };

  const calculateUpgradesEfficiency = (): number => {
    // Safety check for player and skills
    if (!player || !player.skills) {
      return 0.6; // Default efficiency when player data is not available
    }
    
    // Based on current skill levels and potential for improvement
    const avgSkill = (player.skills.hacking + player.skills.stealth + player.skills.social) / 3;
    const improvementPotential = (100 - avgSkill) / 100;
    return Math.min(1, improvementPotential * 0.8 + 0.2);
  };

  const calculateEquipmentEfficiency = (): number => {
    // Based on equipment quality and upgrade potential
    const equipmentCount = equipment.length;
    const avgQuality = equipmentCount > 0 ? equipment.reduce((sum, eq) => sum + eq.level, 0) / equipmentCount : 1;
    const upgradePotential = Math.max(0, (10 - avgQuality) / 10);
    return Math.min(1, upgradePotential * 0.7 + 0.3);
  };

  // Generate optimization suggestions
  const generateSuggestions = () => {
    // Safety check for player data
    if (!player || !player.skills) {
      setSuggestions([]);
      return;
    }
    
    const newSuggestions: OptimizationSuggestion[] = [];
    
    // Skill upgrade suggestions
    if (player.skills.hacking < 80) {
      newSuggestions.push({
        type: 'skill',
        item: 'Hacking Skill',
        cost: 200 + player.skills.hacking * 10,
        benefit: 15,
        priority: 0.8,
        description: 'Improve success rate for hacking operations'
      });
    }
    
    if (player.skills.stealth < 70) {
      newSuggestions.push({
        type: 'skill',
        item: 'Stealth Skill',
        cost: 150 + player.skills.stealth * 8,
        benefit: 12,
        priority: 0.7,
        description: 'Reduce detection risk in operations'
      });
    }
    
    // Equipment upgrade suggestions
    equipment.forEach(eq => {
      if (eq.level < 5) {
        newSuggestions.push({
          type: 'equipment',
          item: eq.name,
          cost: eq.upgradeCost || 300,
          benefit: 10 + eq.level * 2,
          priority: 0.6,
          description: `Upgrade ${eq.name} to level ${eq.level + 1}`
        });
      }
    });
    
    // Sort by priority and cost-benefit ratio
    newSuggestions.sort((a, b) => {
      const aRatio = (a.benefit / a.cost) * a.priority;
      const bRatio = (b.benefit / b.cost) * b.priority;
      return bRatio - aRatio;
    });
    
    setSuggestions(newSuggestions.slice(0, 8)); // Keep top 8 suggestions
  };

  // Auto-apply optimal allocation if enabled
  const applyOptimalAllocation = () => {
    if (autoOptimizeEnabled && aiActive) {
      const newAllocation = {
        operations: allocations.find(a => a.category === 'Operations')?.recommended || 30,
        upgrades: allocations.find(a => a.category === 'Upgrades')?.recommended || 35,
        equipment: allocations.find(a => a.category === 'Equipment')?.recommended || 20,
        reserve: allocations.find(a => a.category === 'Reserve')?.recommended || 15
      };
      
      // Normalize to ensure sum equals 100%
      const total = Object.values(newAllocation).reduce((sum, val) => sum + val, 0);
      Object.keys(newAllocation).forEach(key => {
        newAllocation[key as keyof typeof newAllocation] = newAllocation[key as keyof typeof newAllocation] / total;
      });
      
      updateAIConfig({ resourceAllocation: newAllocation });
      setLastOptimization(new Date());
    }
  };

  // Recalculate when relevant data changes
  useEffect(() => {
    calculateOptimalAllocation();
    generateSuggestions();
  }, [player, equipment, aiConfig]);

  const AllocationCard: React.FC<{ allocation: ResourceAllocation }> = ({ allocation }) => {
    const difference = allocation.recommended - allocation.current;
    const isOptimal = Math.abs(difference) < 5;
    
    return (
      <div className={`bg-gray-900/50 border rounded-lg p-4 ${
        isOptimal ? 'border-cyber-primary/30' : 'border-cyber-warning/30'
      }`}>
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-white">{allocation.category}</h4>
          {isOptimal ? (
            <CheckCircle className="w-5 h-5 text-cyber-primary" />
          ) : (
            <AlertCircle className="w-5 h-5 text-cyber-warning" />
          )}
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Current:</span>
            <span className="text-white">{allocation.current.toFixed(1)}%</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Recommended:</span>
            <span className={`font-semibold ${
              difference > 0 ? 'text-cyber-primary' : difference < 0 ? 'text-cyber-danger' : 'text-gray-400'
            }`}>
              {allocation.recommended.toFixed(1)}%
              {!isOptimal && (
                <span className="ml-1 text-xs">
                  ({difference > 0 ? '+' : ''}{difference.toFixed(1)}%)
                </span>
              )}
            </span>
          </div>
          
          <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
            <div className="relative h-2">
              <div 
                className="bg-gray-500 h-2 rounded-full absolute"
                style={{ width: `${allocation.current}%` }}
              ></div>
              <div 
                className={`h-2 rounded-full absolute opacity-60 ${
                  difference > 0 ? 'bg-cyber-primary' : 'bg-cyber-danger'
                }`}
                style={{ 
                  width: `${allocation.recommended}%`,
                  left: difference > 0 ? `${allocation.current}%` : `${allocation.recommended}%`
                }}
              ></div>
            </div>
          </div>
          
          <div className="text-xs text-gray-400">
            Efficiency: {(allocation.efficiency * 100).toFixed(0)}%
          </div>
          
          <p className="text-xs text-gray-500 italic">
            {allocation.reasoning}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-cyber-accent flex items-center space-x-2">
          <BarChart3 className="w-5 h-5" />
          <span>Resource Optimizer</span>
        </h3>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-400">Auto-Optimize:</span>
            <button
              onClick={() => setAutoOptimizeEnabled(!autoOptimizeEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                autoOptimizeEnabled ? 'bg-cyber-accent' : 'bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  autoOptimizeEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          
          <button
            onClick={applyOptimalAllocation}
            className="px-3 py-1 bg-cyber-primary hover:bg-cyber-primary/80 text-white rounded-lg text-sm transition-colors"
          >
            Apply Optimal
          </button>
        </div>
      </div>

      {/* Resource Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <DollarSign className="w-4 h-4 text-cyber-primary" />
            <span className="text-sm text-gray-400">Available Credits</span>
          </div>
          <div className="text-lg font-semibold text-white">
            {player.credits.toLocaleString()}
          </div>
          <div className="text-sm text-cyber-primary">
            Reserve: {(player.credits * aiConfig.resourceAllocation.reserve).toLocaleString()}
          </div>
        </div>
        
        <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp className="w-4 h-4 text-cyber-accent" />
            <span className="text-sm text-gray-400">Optimization Score</span>
          </div>
          <div className="text-lg font-semibold text-white">
            {Math.round(allocations.reduce((sum, a) => sum + a.efficiency, 0) / allocations.length * 100)}%
          </div>
          <div className="text-sm text-cyber-accent">
            Last updated: {lastOptimization.toLocaleTimeString()}
          </div>
        </div>
        
        <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Target className="w-4 h-4 text-cyber-secondary" />
            <span className="text-sm text-gray-400">Suggestions</span>
          </div>
          <div className="text-lg font-semibold text-white">
            {suggestions.length}
          </div>
          <div className="text-sm text-cyber-secondary">
            Optimization opportunities
          </div>
        </div>
      </div>

      {/* Resource Allocation */}
      <div>
        <h4 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
          <Settings className="w-5 h-5 text-cyber-accent" />
          <span>Resource Allocation Analysis</span>
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {allocations.map(allocation => (
            <AllocationCard key={allocation.category} allocation={allocation} />
          ))}
        </div>
      </div>

      {/* Optimization Suggestions */}
      <div>
        <h4 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
          <Target className="w-5 h-5 text-cyber-secondary" />
          <span>Optimization Suggestions</span>
        </h4>
        
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {suggestions.length > 0 ? (
            suggestions.map((suggestion, index) => {
              const costBenefitRatio = suggestion.benefit / suggestion.cost;
              const canAfford = player.credits >= suggestion.cost;
              
              return (
                <div 
                  key={index}
                  className={`border rounded-lg p-4 transition-all duration-300 ${
                    canAfford ? 'border-gray-600 bg-gray-800/30 hover:bg-gray-800/50' : 'border-gray-700 bg-gray-900/20 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-white">{suggestion.item}</span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        suggestion.type === 'skill' ? 'bg-cyber-accent/30 text-cyber-accent' :
                        suggestion.type === 'equipment' ? 'bg-cyber-warning/30 text-cyber-warning' :
                        'bg-cyber-primary/30 text-cyber-primary'
                      }`}>
                        {suggestion.type.toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-sm font-semibold text-cyber-primary">
                        +{suggestion.benefit}% efficiency
                      </div>
                      <div className="text-xs text-gray-400">
                        {costBenefitRatio.toFixed(2)} ROI
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm text-gray-400">
                      Cost: <span className={canAfford ? 'text-white' : 'text-cyber-danger'}>
                        {suggestion.cost.toLocaleString()} credits
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <span className="text-xs text-gray-400">Priority:</span>
                      <div className="w-16 bg-gray-700 rounded-full h-1">
                        <div 
                          className="bg-cyber-secondary h-1 rounded-full"
                          style={{ width: `${suggestion.priority * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-500">{suggestion.description}</p>
                </div>
              );
            })
          ) : (
            <div className="text-center text-gray-500 py-8">
              <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No optimization suggestions available</p>
              <p className="text-sm">Your resource allocation is already optimal</p>
            </div>
          )}
        </div>
      </div>

      {/* Auto-Optimization Status */}
      {aiActive && autoOptimizeEnabled && (
        <div className="bg-gradient-to-r from-cyber-primary/20 to-cyber-accent/20 border border-cyber-primary/30 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <CheckCircle className="w-5 h-5 text-cyber-primary" />
            <span className="font-semibold text-cyber-primary">Auto-Optimization Active</span>
          </div>
          <p className="text-sm text-gray-300">
            The AI will automatically adjust resource allocation based on performance analysis and changing conditions.
            Manual adjustments will be respected until the next optimization cycle.
          </p>
        </div>
      )}
    </div>
  );
};