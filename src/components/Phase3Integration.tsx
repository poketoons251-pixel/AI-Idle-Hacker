import React, { useState, useEffect } from 'react';
import { Play, Users, Brain, BookOpen, Settings, Activity, Zap, Target } from 'lucide-react';
import { EpisodicContentDelivery } from './EpisodicContentDelivery';
import { CampaignEpisodeViewer } from './CampaignEpisodeViewer';
import { AIPersonalitySystem } from './AIPersonalitySystem';
import { RelationshipDynamicsPanel } from './RelationshipDynamicsPanel';
import { IdleOptimizationSystem } from './IdleOptimizationSystem';

interface Phase3IntegrationProps {
  className?: string;
}

interface SystemStatus {
  episodic_campaigns: boolean;
  ai_personalities: boolean;
  relationship_dynamics: boolean;
  idle_optimization: boolean;
}

interface IntegrationMetrics {
  active_episodes: number;
  partner_relationships: number;
  automation_efficiency: number;
  story_progression: number;
  total_interactions: number;
}

export const Phase3Integration: React.FC<Phase3IntegrationProps> = ({
  className = ''
}) => {
  const [activeSystem, setActiveSystem] = useState<'overview' | 'episodes' | 'partners' | 'optimization'>('overview');
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    episodic_campaigns: false,
    ai_personalities: false,
    relationship_dynamics: false,
    idle_optimization: false
  });
  const [metrics, setMetrics] = useState<IntegrationMetrics>({
    active_episodes: 0,
    partner_relationships: 0,
    automation_efficiency: 0,
    story_progression: 0,
    total_interactions: 0
  });
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    initializePhase3Systems();
    loadIntegrationMetrics();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      updateSystemStatus();
      loadIntegrationMetrics();
    }, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, []);

  const initializePhase3Systems = async () => {
    try {
      // Initialize episodic campaign system
      const campaignResponse = await fetch('/api/campaigns/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      // Initialize AI personality system
      const personalityResponse = await fetch('/api/ai-partners/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      // Initialize relationship dynamics
      const relationshipResponse = await fetch('/api/ai-partners/relationships/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      setSystemStatus({
        episodic_campaigns: campaignResponse.ok,
        ai_personalities: personalityResponse.ok,
        relationship_dynamics: relationshipResponse.ok,
        idle_optimization: true // Always available
      });
      
      setIsInitialized(true);
    } catch (error) {
      console.error('Error initializing Phase 3 systems:', error);
    }
  };

  const updateSystemStatus = async () => {
    try {
      const statusResponse = await fetch('/api/system/phase3-status');
      if (statusResponse.ok) {
        const status = await statusResponse.json();
        setSystemStatus(status);
      }
    } catch (error) {
      console.error('Error updating system status:', error);
    }
  };

  const loadIntegrationMetrics = async () => {
    try {
      const metricsResponse = await fetch('/api/system/phase3-metrics');
      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json();
        setMetrics(metricsData);
      }
    } catch (error) {
      console.error('Error loading integration metrics:', error);
    }
  };

  const getSystemHealthColor = (isHealthy: boolean) => {
    return isHealthy ? 'text-green-400' : 'text-red-400';
  };

  const getSystemHealthBg = (isHealthy: boolean) => {
    return isHealthy ? 'bg-green-600/20' : 'bg-red-600/20';
  };

  if (!isInitialized) {
    return (
      <div className={`bg-gray-900 border border-cyan-500/30 rounded-lg p-6 ${className}`}>
        <div className="flex items-center justify-center space-y-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
            <h3 className="text-xl font-bold text-cyan-400 mb-2">Initializing Phase 3 Systems</h3>
            <p className="text-gray-400">Setting up episodic campaigns, AI personalities, and optimization systems...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-900 border border-cyan-500/30 rounded-lg ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-cyan-600/20 rounded-lg">
              <Zap className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-cyan-400">Phase 3: Enhanced Experience</h3>
              <p className="text-gray-400 text-sm">Episodic Campaigns & AI Personalities</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {Object.entries(systemStatus).map(([system, status]) => (
              <div
                key={system}
                className={`w-3 h-3 rounded-full ${
                  status ? 'bg-green-400 animate-pulse' : 'bg-red-400'
                }`}
                title={`${system.replace('_', ' ')}: ${status ? 'Online' : 'Offline'}`}
              ></div>
            ))}
          </div>
        </div>
        
        {/* System Navigation */}
        <div className="flex space-x-1 bg-gray-800 rounded-lg p-1">
          {[
            { id: 'overview', label: 'Overview', icon: Activity },
            { id: 'episodes', label: 'Episodes', icon: BookOpen },
            { id: 'partners', label: 'AI Partners', icon: Users },
            { id: 'optimization', label: 'Optimization', icon: Settings }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSystem(tab.id as any)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                  activeSystem === tab.id
                    ? 'bg-cyan-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Overview */}
        {activeSystem === 'overview' && (
          <div className="space-y-6">
            {/* System Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  title: 'Episodic Campaigns',
                  status: systemStatus.episodic_campaigns,
                  metric: metrics.active_episodes,
                  label: 'Active Episodes',
                  icon: BookOpen
                },
                {
                  title: 'AI Personalities',
                  status: systemStatus.ai_personalities,
                  metric: metrics.partner_relationships,
                  label: 'Partner Relations',
                  icon: Brain
                },
                {
                  title: 'Relationship Dynamics',
                  status: systemStatus.relationship_dynamics,
                  metric: metrics.total_interactions,
                  label: 'Total Interactions',
                  icon: Users
                },
                {
                  title: 'Idle Optimization',
                  status: systemStatus.idle_optimization,
                  metric: metrics.automation_efficiency,
                  label: 'Efficiency %',
                  icon: Target
                }
              ].map(system => {
                const Icon = system.icon;
                return (
                  <div key={system.title} className={`bg-gray-800 rounded-lg p-4 border-l-4 ${
                    system.status ? 'border-green-400' : 'border-red-400'
                  }`}>
                    <div className="flex items-center justify-between mb-3">
                      <Icon className={`w-5 h-5 ${getSystemHealthColor(system.status)}`} />
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        getSystemHealthBg(system.status)
                      } ${getSystemHealthColor(system.status)}`}>
                        {system.status ? 'Online' : 'Offline'}
                      </div>
                    </div>
                    
                    <h4 className="font-medium text-white text-sm mb-1">{system.title}</h4>
                    <div className="text-2xl font-bold text-cyan-400 mb-1">{system.metric}</div>
                    <div className="text-xs text-gray-400">{system.label}</div>
                  </div>
                );
              })}
            </div>
            
            {/* Integration Health */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h5 className="text-sm font-medium text-cyan-400 mb-3">System Integration Health</h5>
              <div className="space-y-3">
                {[
                  { name: 'Story-AI Integration', health: 95, description: 'AI partners respond to story choices' },
                  { name: 'Idle-Campaign Sync', health: 88, description: 'Episodes progress during idle time' },
                  { name: 'Relationship-Story Link', health: 92, description: 'Partner relationships affect story outcomes' },
                  { name: 'Automation Efficiency', health: metrics.automation_efficiency, description: 'Overall system automation performance' }
                ].map(integration => (
                  <div key={integration.name}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-white text-sm font-medium">{integration.name}</span>
                      <span className={`text-sm ${
                        integration.health >= 90 ? 'text-green-400' :
                        integration.health >= 70 ? 'text-yellow-400' :
                        'text-red-400'
                      }`}>
                        {integration.health}%
                      </span>
                    </div>
                    
                    <div className="bg-gray-700 rounded-full h-2 mb-1">
                      <div 
                        className={`h-2 rounded-full ${
                          integration.health >= 90 ? 'bg-green-400' :
                          integration.health >= 70 ? 'bg-yellow-400' :
                          'bg-red-400'
                        }`}
                        style={{ width: `${integration.health}%` }}
                      ></div>
                    </div>
                    
                    <p className="text-xs text-gray-400">{integration.description}</p>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Quick Actions */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h5 className="text-sm font-medium text-cyan-400 mb-3">Quick Actions</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { label: 'Start New Episode', action: () => setActiveSystem('episodes'), color: 'cyan' },
                  { label: 'Check Partners', action: () => setActiveSystem('partners'), color: 'green' },
                  { label: 'Optimize Systems', action: () => setActiveSystem('optimization'), color: 'purple' },
                  { label: 'View Analytics', action: () => {}, color: 'yellow' }
                ].map(action => (
                  <button
                    key={action.label}
                    onClick={action.action}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      action.color === 'cyan' ? 'bg-cyan-600/20 text-cyan-400 hover:bg-cyan-600/30' :
                      action.color === 'green' ? 'bg-green-600/20 text-green-400 hover:bg-green-600/30' :
                      action.color === 'purple' ? 'bg-purple-600/20 text-purple-400 hover:bg-purple-600/30' :
                      'bg-yellow-600/20 text-yellow-400 hover:bg-yellow-600/30'
                    }`}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Episodes System */}
        {activeSystem === 'episodes' && (
          <div className="space-y-6">
            <EpisodicContentDelivery campaignId="shadow_protocol" />
            <CampaignEpisodeViewer 
              episodeId="ep_001" 
              campaignId="shadow_protocol" 
              onClose={() => setActiveSystem('overview')} 
              onComplete={(choices, timeSpent) => {
                console.log('Episode completed:', { choices, timeSpent });
                setActiveSystem('overview');
              }}
            />
          </div>
        )}

        {/* AI Partners System */}
        {activeSystem === 'partners' && (
          <div className="space-y-6">
            <AIPersonalitySystem />
            <RelationshipDynamicsPanel partnerId="ai_partner_001" />
          </div>
        )}

        {/* Optimization System */}
        {activeSystem === 'optimization' && (
          <IdleOptimizationSystem />
        )}
      </div>
    </div>
  );
};

export default Phase3Integration;