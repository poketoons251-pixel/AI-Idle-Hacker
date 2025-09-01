import React, { useEffect, useState, useMemo } from 'react';
import { useGameStore } from '../../store/gameStore';
import { BarChart3, TrendingUp, TrendingDown, Activity, Clock, Zap, Target, DollarSign } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  trend?: 'up' | 'down' | 'neutral';
  subtitle?: string;
}

const MetricCard: React.FC<MetricCardProps> = React.memo(({ title, value, icon, color, trend, subtitle }) => (
  <div className={`bg-gray-900/50 border border-${color}-500/30 rounded-lg p-4 relative overflow-hidden`}>
    <div className={`absolute inset-0 bg-gradient-to-br from-${color}-500/5 to-transparent`}></div>
    <div className="relative z-10">
      <div className="flex items-center justify-between mb-2">
        <div className={`text-${color}-400`}>{icon}</div>
        {trend && (
          <div className={`text-${trend === 'up' ? 'green' : trend === 'down' ? 'red' : 'gray'}-400`}>
            {trend === 'up' ? <TrendingUp className="w-4 h-4" /> : 
             trend === 'down' ? <TrendingDown className="w-4 h-4" /> : 
             <Activity className="w-4 h-4" />}
          </div>
        )}
      </div>
      <div className={`text-2xl font-bold text-${color}-400 mb-1`}>{value}</div>
      <div className="text-sm text-gray-400">{title}</div>
      {subtitle && <div className="text-xs text-gray-500 mt-1">{subtitle}</div>}
    </div>
  </div>
));

MetricCard.displayName = 'MetricCard';

interface ProgressBarProps {
  label: string;
  value: number;
  max: number;
  color: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ label, value, max, color }) => {
  const percentage = Math.min((value / max) * 100, 100);
  
  return (
    <div className="mb-4">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-300">{label}</span>
        <span className={`text-${color}-400`}>{value.toFixed(1)}/{max}</span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-2">
        <div 
          className={`bg-${color}-500 h-2 rounded-full transition-all duration-500 relative overflow-hidden`}
          style={{ width: `${percentage}%` }}
        >
          <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-${color}-300/50 to-transparent animate-pulse`}></div>
        </div>
      </div>
    </div>
  );
};

export const PerformanceAnalytics: React.FC = React.memo(() => {
  const { aiAnalytics, aiActive, aiLastDecision } = useGameStore();
  const [matrixData, setMatrixData] = useState<string[]>([]);
  const [recentActions, setRecentActions] = useState<string[]>([]);

  // Matrix-style scrolling data effect - optimized to reduce frequency
  useEffect(() => {
    const interval = setInterval(() => {
      const newData = [
        `[${new Date().toLocaleTimeString()}] AI_SCAN: ${Math.floor(Math.random() * 1000)}ms`,
        `[${new Date().toLocaleTimeString()}] DECISION_TREE: ${Math.floor(Math.random() * 100)}%`,
        `[${new Date().toLocaleTimeString()}] RISK_CALC: ${(Math.random() * 10).toFixed(2)}`,
        `[${new Date().toLocaleTimeString()}] EFFICIENCY: ${(Math.random() * 100).toFixed(1)}%`,
        `[${new Date().toLocaleTimeString()}] NEURAL_NET: ACTIVE`,
      ];
      
      setMatrixData(prev => {
        const updated = [...prev, ...newData].slice(-15); // Reduced from 20 to 15 entries
        return updated;
      });
    }, 5000); // Increased from 2000ms to 5000ms to reduce CPU usage

    return () => clearInterval(interval);
  }, []);

  // Update recent actions when AI makes decisions
  useEffect(() => {
    if (aiLastDecision) {
      const actionText = `${aiLastDecision.type.toUpperCase()}: ${aiLastDecision.description}`;
      setRecentActions(prev => [actionText, ...prev.slice(0, 9)]); // Keep last 10 actions
    }
  }, [aiLastDecision]);

  // Memoize expensive calculations
  const performanceMetrics = useMemo(() => ({
    successRatePercentage: (aiAnalytics.successRate * 100).toFixed(1),
    efficiencyPercentage: (aiAnalytics.efficiencyScore * 100).toFixed(0),
    successTrend: aiAnalytics.successRate > 0.7 ? 'up' : aiAnalytics.successRate > 0.4 ? 'neutral' : 'down',
    efficiencyTrend: aiAnalytics.efficiencyScore > 0.8 ? 'up' : aiAnalytics.efficiencyScore > 0.5 ? 'neutral' : 'down'
  }), [aiAnalytics.successRate, aiAnalytics.efficiencyScore]);

  return (
    <div className="space-y-6">
      {/* Real-time Status */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-cyber-accent flex items-center space-x-2">
          <Activity className="w-5 h-5" />
          <span>AI Performance Analytics</span>
        </h3>
        <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${
          aiActive ? 'bg-cyber-primary/30 text-cyber-primary' : 'bg-gray-900/30 text-gray-400'
        }`}>
          <div className={`w-2 h-2 rounded-full ${
            aiActive ? 'bg-cyber-primary animate-pulse' : 'bg-gray-400'
          }`}></div>
          <span className="text-sm font-medium">
            {aiActive ? 'AI ACTIVE' : 'AI INACTIVE'}
          </span>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Decisions Made"
          value={aiAnalytics.decisionsMade.toLocaleString()}
          icon={<Target className="w-5 h-5" />}
          color="cyber-accent"
          trend="up"
        />
        
        <MetricCard
          title="Success Rate"
          value={`${performanceMetrics.successRatePercentage}%`}
          icon={<TrendingUp className="w-5 h-5" />}
          color="cyber-primary"
          trend={performanceMetrics.successTrend as 'up' | 'down' | 'neutral'}
        />
        
        <MetricCard
          title="Credits Earned"
          value={aiAnalytics.creditsEarned.toLocaleString()}
          icon={<DollarSign className="w-5 h-5" />}
          color="cyber-warning"
          trend="up"
          subtitle="by AI automation"
        />
        
        <MetricCard
          title="Efficiency Score"
          value={`${performanceMetrics.efficiencyPercentage}%`}
          icon={<Zap className="w-5 h-5" />}
          color="cyber-secondary"
          trend={performanceMetrics.efficiencyTrend as 'up' | 'down' | 'neutral'}
        />
      </div>

      {/* Performance Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Performance */}
        <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-cyber-accent" />
            <span>Performance Metrics</span>
          </h4>
          
          <div className="space-y-4">
            <ProgressBar
              label="Decision Accuracy"
              value={aiAnalytics.successRate * 100}
              max={100}
              color="cyber-primary"
            />
            
            <ProgressBar
              label="Resource Efficiency"
              value={aiAnalytics.efficiencyScore * 100}
              max={100}
              color="cyber-accent"
            />
            
            <ProgressBar
              label="Risk Management"
              value={85} // Mock data for now
              max={100}
              color="cyber-warning"
            />
            
            <ProgressBar
              label="Automation Level"
              value={92} // Mock data for now
              max={100}
              color="cyber-secondary"
            />
          </div>
        </div>

        {/* Matrix-style Data Stream */}
        <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
            <Activity className="w-5 h-5 text-cyber-primary" />
            <span>AI Data Stream</span>
          </h4>
          
          <div className="bg-black/50 rounded-lg p-4 h-64 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/80 z-10"></div>
            <div className="font-mono text-xs space-y-1 text-cyber-primary overflow-y-auto h-full">
              {matrixData.map((line, index) => (
                <div 
                  key={index} 
                  className={`opacity-${Math.max(20, 100 - (matrixData.length - index) * 5)} transition-opacity duration-1000`}
                  style={{ 
                    opacity: Math.max(0.2, 1 - (matrixData.length - index) * 0.05)
                  }}
                >
                  {line}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent AI Actions */}
      <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
          <Clock className="w-5 h-5 text-cyber-accent" />
          <span>Recent AI Actions</span>
        </h4>
        
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {recentActions.length > 0 ? (
            recentActions.map((action, index) => (
              <div 
                key={index}
                className={`bg-gray-800/50 border-l-4 border-cyber-accent p-3 text-sm transition-all duration-300 ${
                  index === 0 ? 'bg-cyber-accent/20 border-cyber-accent' : 'border-gray-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">{action}</span>
                  <span className="text-xs text-gray-500">
                    {index === 0 ? 'Just now' : `${index + 1}m ago`}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500 py-8">
              <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No AI actions recorded yet</p>
              <p className="text-sm">Activate AI to see decision history</p>
            </div>
          )}
        </div>
      </div>

      {/* Performance Summary */}
      <div className="bg-gradient-to-r from-gray-900/50 to-cyber-accent/20 border border-cyber-accent/30 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-cyber-accent mb-4">AI Performance Summary</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-white mb-1">
              {aiAnalytics.decisionsMade > 0 ? 
                `${((aiAnalytics.creditsEarned / aiAnalytics.decisionsMade) || 0).toFixed(0)}` : '0'
              }
            </div>
            <div className="text-sm text-gray-400">Avg Credits per Decision</div>
          </div>
          
          <div>
            <div className="text-2xl font-bold text-white mb-1">
              {aiAnalytics.decisionsMade > 0 ? 
                `${(aiAnalytics.decisionsMade / Math.max(1, Math.floor(Date.now() / 60000))).toFixed(1)}` : '0'
              }
            </div>
            <div className="text-sm text-gray-400">Decisions per Minute</div>
          </div>
          
          <div>
            <div className="text-2xl font-bold text-white mb-1">
              {(aiAnalytics.efficiencyScore * aiAnalytics.successRate * 100).toFixed(0)}%
            </div>
            <div className="text-sm text-gray-400">Overall Performance</div>
          </div>
        </div>
      </div>
    </div>
  );
});

PerformanceAnalytics.displayName = 'PerformanceAnalytics';