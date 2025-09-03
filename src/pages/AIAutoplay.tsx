import React, { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { StrategyConfigurator } from '../components/ai/StrategyConfigurator';
import { PerformanceAnalytics } from '../components/ai/PerformanceAnalytics';
import { SmartOperationManager } from '../components/ai/SmartOperationManager';
import { ResourceOptimizer } from '../components/ai/ResourceOptimizer';
import { OverrideControls } from '../components/ai/OverrideControls';
import { Brain, Activity, Settings, Zap, Shield, Play, Pause, RotateCcw, BarChart3 } from 'lucide-react';

export const AIAutoplay: React.FC = () => {
  const {
    aiConfig,
    aiAnalytics,
    aiActive,
    aiLastDecision,
    updateAIConfig,
    toggleAI,
    makeAIDecision,
    executeAIDecision,
    resetAIAnalytics,
  } = useGameStore();

  const [activeSection, setActiveSection] = useState<'strategy' | 'analytics' | 'operations' | 'resources' | 'controls'>('strategy');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [pulseActive, setPulseActive] = useState(false);

  // AI Decision Loop with pulse animation
  useEffect(() => {
    if (!aiActive) return;

    const interval = setInterval(() => {
        setPulseActive(true);
        const decision = makeAIDecision();
        if (decision) {
          executeAIDecision(decision);
        }
        setTimeout(() => setPulseActive(false), 500);
      }, 3000); // Make decisions every 3 seconds

    return () => clearInterval(interval);
  }, [aiActive, makeAIDecision, executeAIDecision]);

  // Section transition handler
  const handleSectionChange = (section: typeof activeSection) => {
    if (section === activeSection) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveSection(section);
      setIsTransitioning(false);
    }, 150);
  };

  const formatUptime = (timestamp?: number) => {
    if (!timestamp) return '00:00:00';
    const diff = Date.now() - timestamp;
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const sectionButtons = [
    { id: 'strategy', label: 'Strategy Config', icon: Settings },
    { id: 'analytics', label: 'Performance', icon: BarChart3 },
    { id: 'operations', label: 'Operations', icon: Zap },
    { id: 'resources', label: 'Resources', icon: Shield },
    { id: 'controls', label: 'Override', icon: Brain },
  ] as const;

  return (
    <div className="min-h-screen bg-black text-cyber-primary p-6 transition-all duration-300">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Brain className={`w-8 h-8 text-cyan-400 transition-all duration-300 ${
              pulseActive ? 'animate-pulse scale-110 text-cyan-300' : ''
            }`} />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyber-accent to-cyber-primary bg-clip-text text-transparent animate-pulse">
              AI AUTOPLAY SYSTEM
            </h1>
          </div>
          
          {/* AI Status & Toggle */}
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-sm text-gray-400">Status</div>
              <div className={`font-bold ${aiActive ? 'text-cyber-primary' : 'text-cyber-danger'}`}>
                {aiActive ? 'ACTIVE' : 'INACTIVE'}
              </div>
              {aiActive && (
                <div className="text-xs text-cyber-accent">
                  Uptime: {formatUptime(aiAnalytics.activeSince)}
                </div>
              )}
            </div>
            
            <button
              onClick={toggleAI}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-bold transition-all duration-300 transform hover:scale-105 active:scale-95 ${
                aiActive
                  ? 'bg-red-900/30 border-2 border-cyber-danger text-cyber-danger hover:bg-red-900/50 hover:shadow-lg hover:shadow-red-500/20'
                  : 'bg-green-900/30 border-2 border-cyber-primary text-cyber-primary hover:bg-green-900/50 hover:shadow-lg hover:shadow-cyan-500/20'
              }`}
            >
              {aiActive ? 
                <Pause className="w-5 h-5 animate-pulse" /> : 
                <Play className="w-5 h-5 transition-transform duration-300 hover:scale-110" />
              }
              <span>{aiActive ? 'DEACTIVATE' : 'ACTIVATE'}</span>
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-900/50 border border-cyber-accent/30 rounded-lg p-4 transition-all duration-300 hover:bg-gray-800/60 hover:border-cyber-accent/50 hover:shadow-lg hover:shadow-cyan-500/10 hover:scale-105">
            <div className="text-cyber-accent text-sm font-semibold">DECISIONS MADE</div>
            <div className="text-2xl font-bold text-white transition-all duration-300">{aiAnalytics.decisionsMade}</div>
          </div>
          <div className="bg-gray-900/50 border border-cyber-primary/30 rounded-lg p-4 transition-all duration-300 hover:bg-gray-800/60 hover:border-cyber-primary/50 hover:shadow-lg hover:shadow-cyan-400/10 hover:scale-105">
            <div className="text-cyber-primary text-sm font-semibold">SUCCESS RATE</div>
            <div className="text-2xl font-bold text-white transition-all duration-300">{(aiAnalytics.successRate * 100).toFixed(1)}%</div>
          </div>
          <div className="bg-gray-900/50 border border-cyber-warning/30 rounded-lg p-4 transition-all duration-300 hover:bg-gray-800/60 hover:border-cyber-warning/50 hover:shadow-lg hover:shadow-yellow-500/10 hover:scale-105">
            <div className="text-cyber-warning text-sm font-semibold">CREDITS EARNED</div>
            <div className="text-2xl font-bold text-white transition-all duration-300">{aiAnalytics.creditsEarned.toLocaleString()}</div>
          </div>
          <div className="bg-gray-900/50 border border-cyber-secondary/30 rounded-lg p-4 transition-all duration-300 hover:bg-gray-800/60 hover:border-cyber-secondary/50 hover:shadow-lg hover:shadow-purple-500/10 hover:scale-105">
            <div className="text-cyber-secondary text-sm font-semibold">EFFICIENCY</div>
            <div className="text-2xl font-bold text-white transition-all duration-300">{(aiAnalytics.efficiencyScore * 100).toFixed(1)}%</div>
          </div>
        </div>

        {/* Section Navigation */}
        <div className="flex space-x-2 mb-6">
          {sectionButtons.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => handleSectionChange(id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 transform hover:scale-105 active:scale-95 ${
                activeSection === id
                  ? 'bg-cyan-900/50 border-2 border-cyan-400 text-cyan-400 shadow-lg shadow-cyan-400/20'
                  : 'bg-gray-900/30 border border-gray-600 text-gray-400 hover:border-cyan-500 hover:text-cyan-400 hover:bg-gray-800/40 hover:shadow-md'
              }`}
            >
              <Icon className={`w-4 h-4 transition-all duration-300 ${
                activeSection === id ? 'animate-pulse' : ''
              }`} />
              <span className="font-semibold">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className={`bg-gray-900/30 border border-gray-700 rounded-lg p-6 transition-all duration-300 ${
        isTransitioning ? 'opacity-50 scale-98' : 'opacity-100 scale-100'
      }`}>
        {activeSection === 'strategy' && (
          <div className="animate-fade-in">
            <h2 className="text-xl font-bold text-cyan-400 mb-6 flex items-center space-x-2">
              <Settings className="w-6 h-6 animate-pulse" />
              <span>Strategy Configurator</span>
            </h2>
            <StrategyConfigurator />
          </div>
        )}

        {activeSection === 'analytics' && (
          <div className="animate-fade-in">
            <PerformanceAnalytics />
          </div>
        )}

        {activeSection === 'operations' && (
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 animate-fade-in">
            <SmartOperationManager />
          </div>
        )}

        {activeSection === 'resources' && (
          <div className="animate-fade-in">
            <ResourceOptimizer />
          </div>
        )}

        {activeSection === 'controls' && (
          <div className="animate-fade-in">
            <OverrideControls />
          </div>
        )}
      </div>

      {/* Last Decision Display */}
      {aiLastDecision && (
        <div className="mt-6 bg-gray-900/50 border border-yellow-500/30 rounded-lg p-4 animate-slide-up transition-all duration-500 hover:bg-gray-800/60 hover:border-yellow-400/50 hover:shadow-lg hover:shadow-yellow-500/10">
          <h3 className="text-yellow-400 font-semibold mb-2 flex items-center space-x-2">
            <Activity className="w-4 h-4 animate-pulse" />
            <span>Last AI Decision</span>
          </h3>
          <div className="text-sm text-gray-300 space-y-1">
            <div className="transition-all duration-300 hover:text-white">
              <span className="text-cyan-400 font-semibold">Action:</span> {aiLastDecision.action}
            </div>
            <div className="transition-all duration-300 hover:text-white">
              <span className="text-cyan-400 font-semibold">Reasoning:</span> {aiLastDecision.reasoning}
            </div>
            <div className="transition-all duration-300 hover:text-white">
              <span className="text-cyan-400 font-semibold">Confidence:</span> 
              <span className={`ml-1 font-bold ${
                aiLastDecision.confidence > 0.8 ? 'text-green-400' :
                aiLastDecision.confidence > 0.6 ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {(aiLastDecision.confidence * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        
        .animate-slide-up {
          animation: slide-up 0.4s ease-out;
        }
      `}</style>
    </div>
  );
};