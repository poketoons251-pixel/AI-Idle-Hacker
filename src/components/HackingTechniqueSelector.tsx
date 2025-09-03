import React, { useState, useEffect } from 'react';
import { Zap, Shield, Wifi, Lock, Database, Bug, Clock, Target, Settings } from 'lucide-react';

interface HackingTechnique {
  id: string;
  name: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  success_rate: number;
  base_reward: number;
  execution_time: number;
  required_level: number;
  category: string;
}

interface HackingTechniqueSelectorProps {
  techniques: HackingTechnique[];
  selectedTechnique: HackingTechnique | null;
  onTechniqueSelect: (technique: HackingTechnique) => void;
  onExecute: (technique: HackingTechnique, target?: string) => void;
  isExecuting?: boolean;
  playerLevel?: number;
  className?: string;
}

const HackingTechniqueSelector: React.FC<HackingTechniqueSelectorProps> = ({
  techniques,
  selectedTechnique,
  onTechniqueSelect,
  onExecute,
  isExecuting = false,
  playerLevel = 1,
  className = ''
}) => {
  const [selectedTarget, setSelectedTarget] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const mockTargets = [
    { id: '1', name: 'Corporate Server', ip: '192.168.1.100', difficulty: 'medium' },
    { id: '2', name: 'Database Node', ip: '10.0.0.50', difficulty: 'hard' },
    { id: '3', name: 'IoT Device', ip: '172.16.0.25', difficulty: 'easy' },
    { id: '4', name: 'Government Portal', ip: '203.0.113.10', difficulty: 'expert' }
  ];

  const getTechniqueIcon = (name: string) => {
    const iconMap: { [key: string]: React.ReactNode } = {
      'Man-in-the-Middle': <Wifi className="w-5 h-5" />,
      'Brute Force': <Lock className="w-5 h-5" />,
      'Network Jamming': <Shield className="w-5 h-5" />,
      'Social Engineering': <Target className="w-5 h-5" />,
      'SQL Injection': <Database className="w-5 h-5" />,
      'Zero-Day Exploit': <Bug className="w-5 h-5" />
    };
    return iconMap[name] || <Zap className="w-5 h-5" />;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-400 border-green-400/30 bg-green-400/10';
      case 'medium': return 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10';
      case 'hard': return 'text-orange-400 border-orange-400/30 bg-orange-400/10';
      case 'expert': return 'text-red-400 border-red-400/30 bg-red-400/10';
      default: return 'text-gray-400 border-gray-400/30 bg-gray-400/10';
    }
  };

  const isUnlocked = (technique: HackingTechnique) => {
    return playerLevel >= technique.required_level;
  };

  const handleExecute = () => {
    if (selectedTechnique) {
      onExecute(selectedTechnique, selectedTarget);
    }
  };

  return (
    <div className={`bg-gray-900 border border-cyan-500/30 rounded-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Zap className="w-6 h-6 text-cyan-400" />
          <h3 className="text-xl font-bold text-cyan-400">Hacking Techniques</h3>
        </div>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 px-3 py-1 bg-gray-800 border border-gray-600 rounded text-gray-300 hover:text-cyan-400 transition-colors"
        >
          <Settings className="w-4 h-4" />
          Advanced
        </button>
      </div>

      {/* Techniques Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {techniques.map((technique) => {
          const unlocked = isUnlocked(technique);
          const isSelected = selectedTechnique?.id === technique.id;
          
          return (
            <div
              key={technique.id}
              onClick={() => unlocked && onTechniqueSelect(technique)}
              className={`
                p-4 rounded-lg border cursor-pointer transition-all duration-200
                ${isSelected 
                  ? 'border-cyan-400 bg-cyan-400/10 shadow-lg shadow-cyan-400/20' 
                  : unlocked 
                    ? 'border-gray-600 bg-gray-800/50 hover:border-cyan-500/50 hover:bg-gray-800' 
                    : 'border-gray-700 bg-gray-800/30 opacity-50 cursor-not-allowed'
                }
              `}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded ${unlocked ? 'text-cyan-400' : 'text-gray-500'}`}>
                    {getTechniqueIcon(technique.name)}
                  </div>
                  <div>
                    <h4 className={`font-semibold ${unlocked ? 'text-white' : 'text-gray-500'}`}>
                      {technique.name}
                    </h4>
                    <span className={`text-xs px-2 py-1 rounded border ${getDifficultyColor(technique.difficulty)}`}>
                      {technique.difficulty.toUpperCase()}
                    </span>
                  </div>
                </div>
                {!unlocked && (
                  <div className="text-xs text-gray-500">
                    Lv.{technique.required_level}
                  </div>
                )}
              </div>
              
              <p className={`text-sm mb-3 ${unlocked ? 'text-gray-300' : 'text-gray-500'}`}>
                {technique.description}
              </p>
              
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className={unlocked ? 'text-green-400' : 'text-gray-500'}>
                  Success: {technique.success_rate}%
                </div>
                <div className={unlocked ? 'text-yellow-400' : 'text-gray-500'}>
                  Reward: {technique.base_reward}
                </div>
                <div className={unlocked ? 'text-blue-400' : 'text-gray-500'}>
                  <Clock className="w-3 h-3 inline mr-1" />
                  {technique.execution_time}s
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Target Selection */}
      {selectedTechnique && (
        <div className="border-t border-gray-700 pt-6">
          <h4 className="text-lg font-semibold text-cyan-400 mb-4">Target Selection</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            {mockTargets.map((target) => (
              <div
                key={target.id}
                onClick={() => setSelectedTarget(target.id)}
                className={`
                  p-3 rounded border cursor-pointer transition-all
                  ${selectedTarget === target.id 
                    ? 'border-cyan-400 bg-cyan-400/10' 
                    : 'border-gray-600 bg-gray-800/50 hover:border-cyan-500/50'
                  }
                `}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-white">{target.name}</div>
                    <div className="text-sm text-gray-400">{target.ip}</div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded border ${getDifficultyColor(target.difficulty)}`}>
                    {target.difficulty.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Advanced Options */}
          {showAdvanced && (
            <div className="bg-gray-800/50 rounded-lg p-4 mb-4">
              <h5 className="text-sm font-semibold text-cyan-400 mb-3">Advanced Configuration</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Stealth Mode</label>
                  <select className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white">
                    <option value="normal">Normal</option>
                    <option value="stealth">High Stealth</option>
                    <option value="aggressive">Aggressive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Retry Attempts</label>
                  <input 
                    type="number" 
                    min="1" 
                    max="5" 
                    defaultValue="3"
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Execute Button */}
          <button
            onClick={handleExecute}
            disabled={!selectedTarget || isExecuting}
            className={`
              w-full py-3 px-6 rounded-lg font-semibold transition-all duration-200
              ${!selectedTarget || isExecuting
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-400 hover:to-blue-400 shadow-lg shadow-cyan-500/25'
              }
            `}
          >
            {isExecuting ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                Executing {selectedTechnique.name}...
              </div>
            ) : (
              `Execute ${selectedTechnique.name}`
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default HackingTechniqueSelector;