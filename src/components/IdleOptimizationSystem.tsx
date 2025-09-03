import React, { useState, useEffect } from 'react';
import { Play, Pause, Settings, Zap, Clock, TrendingUp, Users, Brain, Heart, Target, CheckCircle, AlertCircle } from 'lucide-react';
import { useGameStore } from '../store/gameStore';

interface IdleSettings {
  auto_episode_progression: boolean;
  auto_partner_interactions: boolean;
  auto_relationship_maintenance: boolean;
  auto_skill_training: boolean;
  auto_intelligence_gathering: boolean;
  interaction_frequency: number;
  progression_speed: number;
  resource_allocation: {
    episodes: number;
    relationships: number;
    skills: number;
    intelligence: number;
  };
  priority_partners: string[];
  preferred_interaction_types: string[];
}

interface IdleProgress {
  episodes_completed: number;
  interactions_performed: number;
  relationships_improved: number;
  skills_trained: number;
  intelligence_gathered: number;
  total_experience_gained: number;
  time_active: number;
  efficiency_rating: number;
}

interface AutomationRule {
  id: string;
  name: string;
  condition: string;
  action: string;
  priority: number;
  is_active: boolean;
  cooldown: number;
  last_executed: string;
}

interface IdleOptimizationSystemProps {
  className?: string;
}

export const IdleOptimizationSystem: React.FC<IdleOptimizationSystemProps> = ({
  className = ''
}) => {
  const [isIdleActive, setIsIdleActive] = useState(false);
  const [settings, setSettings] = useState<IdleSettings>({
    auto_episode_progression: true,
    auto_partner_interactions: true,
    auto_relationship_maintenance: true,
    auto_skill_training: false,
    auto_intelligence_gathering: true,
    interaction_frequency: 3,
    progression_speed: 1,
    resource_allocation: {
      episodes: 40,
      relationships: 30,
      skills: 15,
      intelligence: 15
    },
    priority_partners: [],
    preferred_interaction_types: ['conversation', 'cooperation', 'support']
  });
  const [progress, setProgress] = useState<IdleProgress>({
    episodes_completed: 0,
    interactions_performed: 0,
    relationships_improved: 0,
    skills_trained: 0,
    intelligence_gathered: 0,
    total_experience_gained: 0,
    time_active: 0,
    efficiency_rating: 0
  });
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'settings' | 'rules' | 'analytics'>('overview');
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  
  const { player } = useGameStore();
  const { level, credits, experience } = player;

  useEffect(() => {
    loadIdleSettings();
    loadAutomationRules();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isIdleActive) {
      interval = setInterval(() => {
        performIdleOperations();
        updateProgress();
      }, 5000); // Execute every 5 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isIdleActive, settings]);

  const loadIdleSettings = async () => {
    try {
      const savedSettings = localStorage.getItem('idle_settings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('Error loading idle settings:', error);
    }
  };

  const saveIdleSettings = async (newSettings: IdleSettings) => {
    try {
      localStorage.setItem('idle_settings', JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Error saving idle settings:', error);
    }
  };

  const loadAutomationRules = async () => {
    try {
      const defaultRules: AutomationRule[] = [
        {
          id: 'auto_episode_unlock',
          name: 'Auto Episode Unlock',
          condition: 'episode_requirements_met',
          action: 'unlock_next_episode',
          priority: 1,
          is_active: true,
          cooldown: 60,
          last_executed: ''
        },
        {
          id: 'relationship_maintenance',
          name: 'Relationship Maintenance',
          condition: 'trust_level < 70',
          action: 'perform_trust_building_interaction',
          priority: 2,
          is_active: true,
          cooldown: 300,
          last_executed: ''
        },
        {
          id: 'intelligence_auto_gather',
          name: 'Auto Intelligence Gathering',
          condition: 'intelligence_points < 100',
          action: 'gather_intelligence',
          priority: 3,
          is_active: true,
          cooldown: 180,
          last_executed: ''
        },
        {
          id: 'partner_mood_check',
          name: 'Partner Mood Check',
          condition: 'partner_mood == frustrated',
          action: 'perform_mood_improvement_action',
          priority: 1,
          is_active: true,
          cooldown: 120,
          last_executed: ''
        }
      ];
      
      setAutomationRules(defaultRules);
    } catch (error) {
      console.error('Error loading automation rules:', error);
    }
  };

  const performIdleOperations = async () => {
    if (!isIdleActive) return;
    
    const operations = [];
    
    // Episode Progression
    if (settings.auto_episode_progression) {
      operations.push(performEpisodeProgression());
    }
    
    // Partner Interactions
    if (settings.auto_partner_interactions) {
      operations.push(performPartnerInteractions());
    }
    
    // Relationship Maintenance
    if (settings.auto_relationship_maintenance) {
      operations.push(performRelationshipMaintenance());
    }
    
    // Intelligence Gathering
    if (settings.auto_intelligence_gathering) {
      operations.push(performIntelligenceGathering());
    }
    
    // Execute automation rules
    operations.push(executeAutomationRules());
    
    try {
      await Promise.all(operations);
    } catch (error) {
      console.error('Error performing idle operations:', error);
    }
  };

  const performEpisodeProgression = async () => {
    try {
      const response = await fetch('/api/campaigns/auto-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          speed_multiplier: settings.progression_speed,
          resource_allocation: settings.resource_allocation.episodes
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setProgress(prev => ({
          ...prev,
          episodes_completed: prev.episodes_completed + (data.episodes_progressed || 0)
        }));
      }
    } catch (error) {
      console.error('Error in episode progression:', error);
    }
  };

  const performPartnerInteractions = async () => {
    try {
      const response = await fetch('/api/ai-partners/auto-interact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          frequency: settings.interaction_frequency,
          priority_partners: settings.priority_partners,
          interaction_types: settings.preferred_interaction_types,
          resource_allocation: settings.resource_allocation.relationships
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setProgress(prev => ({
          ...prev,
          interactions_performed: prev.interactions_performed + (data.interactions_count || 0)
        }));
      }
    } catch (error) {
      console.error('Error in partner interactions:', error);
    }
  };

  const performRelationshipMaintenance = async () => {
    try {
      const response = await fetch('/api/ai-partners/auto-maintain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maintenance_level: settings.resource_allocation.relationships,
          priority_partners: settings.priority_partners
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setProgress(prev => ({
          ...prev,
          relationships_improved: prev.relationships_improved + (data.relationships_maintained || 0)
        }));
      }
    } catch (error) {
      console.error('Error in relationship maintenance:', error);
    }
  };

  const performIntelligenceGathering = async () => {
    try {
      const response = await fetch('/api/intelligence/auto-gather', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resource_allocation: settings.resource_allocation.intelligence,
          auto_research: true
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setProgress(prev => ({
          ...prev,
          intelligence_gathered: prev.intelligence_gathered + (data.intelligence_points || 0)
        }));
      }
    } catch (error) {
      console.error('Error in intelligence gathering:', error);
    }
  };

  const executeAutomationRules = async () => {
    const now = new Date();
    
    for (const rule of automationRules.filter(r => r.is_active)) {
      const lastExecuted = rule.last_executed ? new Date(rule.last_executed) : new Date(0);
      const timeSinceLastExecution = (now.getTime() - lastExecuted.getTime()) / 1000;
      
      if (timeSinceLastExecution >= rule.cooldown) {
        try {
          await executeRule(rule);
          rule.last_executed = now.toISOString();
        } catch (error) {
          console.error(`Error executing rule ${rule.name}:`, error);
        }
      }
    }
  };

  const executeRule = async (rule: AutomationRule) => {
    // This would contain the actual rule execution logic
    // For now, we'll simulate the execution
    console.log(`Executing rule: ${rule.name}`);
  };

  const updateProgress = () => {
    if (sessionStartTime) {
      const now = new Date();
      const timeActive = (now.getTime() - sessionStartTime.getTime()) / 1000 / 60; // minutes
      
      setProgress(prev => {
        const totalActions = prev.episodes_completed + prev.interactions_performed + 
                           prev.relationships_improved + prev.intelligence_gathered;
        const efficiency = timeActive > 0 ? (totalActions / timeActive) * 100 : 0;
        
        return {
          ...prev,
          time_active: timeActive,
          efficiency_rating: Math.min(efficiency, 100)
        };
      });
    }
  };

  const toggleIdleMode = () => {
    if (!isIdleActive) {
      setSessionStartTime(new Date());
      setProgress({
        episodes_completed: 0,
        interactions_performed: 0,
        relationships_improved: 0,
        skills_trained: 0,
        intelligence_gathered: 0,
        total_experience_gained: 0,
        time_active: 0,
        efficiency_rating: 0
      });
    } else {
      setSessionStartTime(null);
    }
    
    setIsIdleActive(!isIdleActive);
  };

  const updateResourceAllocation = (category: keyof IdleSettings['resource_allocation'], value: number) => {
    const newAllocation = { ...settings.resource_allocation };
    const oldValue = newAllocation[category];
    newAllocation[category] = value;
    
    // Redistribute remaining resources
    const total = Object.values(newAllocation).reduce((sum, val) => sum + val, 0);
    if (total !== 100) {
      const difference = 100 - total;
      const otherCategories = Object.keys(newAllocation).filter(k => k !== category) as Array<keyof typeof newAllocation>;
      const perCategory = difference / otherCategories.length;
      
      otherCategories.forEach(cat => {
        newAllocation[cat] = Math.max(0, Math.min(100, newAllocation[cat] + perCategory));
      });
    }
    
    saveIdleSettings({ ...settings, resource_allocation: newAllocation });
  };

  return (
    <div className={`bg-gray-900 border border-cyan-500/30 rounded-lg ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-cyan-400">Idle Optimization System</h3>
          
          <div className="flex items-center space-x-3">
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${
              isIdleActive ? 'bg-green-600/20 text-green-400' : 'bg-gray-600/20 text-gray-400'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                isIdleActive ? 'bg-green-400 animate-pulse' : 'bg-gray-400'
              }`}></div>
              <span className="text-sm font-medium">
                {isIdleActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            
            <button
              onClick={toggleIdleMode}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                isIdleActive
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {isIdleActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isIdleActive ? 'Stop' : 'Start'} Idle Mode</span>
            </button>
          </div>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-800 rounded-lg p-1">
          {[
            { id: 'overview', label: 'Overview', icon: TrendingUp },
            { id: 'settings', label: 'Settings', icon: Settings },
            { id: 'rules', label: 'Automation', icon: Zap },
            { id: 'analytics', label: 'Analytics', icon: Brain }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                  activeTab === tab.id
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
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Current Session Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Episodes', value: progress.episodes_completed, icon: Target, color: 'cyan' },
                { label: 'Interactions', value: progress.interactions_performed, icon: Users, color: 'green' },
                { label: 'Relationships', value: progress.relationships_improved, icon: Heart, color: 'pink' },
                { label: 'Intelligence', value: progress.intelligence_gathered, icon: Brain, color: 'purple' }
              ].map(stat => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className="bg-gray-800 rounded-lg p-4 text-center">
                    <Icon className={`w-6 h-6 mx-auto mb-2 ${
                      stat.color === 'cyan' ? 'text-cyan-400' :
                      stat.color === 'green' ? 'text-green-400' :
                      stat.color === 'pink' ? 'text-pink-400' :
                      'text-purple-400'
                    }`} />
                    <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                    <div className="text-xs text-gray-400">{stat.label}</div>
                  </div>
                );
              })}
            </div>
            
            {/* Efficiency Metrics */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h5 className="text-sm font-medium text-cyan-400 mb-3">Session Performance</h5>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-lg font-semibold text-white">{progress.time_active.toFixed(1)}m</div>
                  <div className="text-xs text-gray-400">Time Active</div>
                </div>
                
                <div className="text-center">
                  <div className="text-lg font-semibold text-white">{progress.efficiency_rating.toFixed(1)}%</div>
                  <div className="text-xs text-gray-400">Efficiency</div>
                </div>
                
                <div className="text-center">
                  <div className="text-lg font-semibold text-white">
                    {(progress.episodes_completed + progress.interactions_performed + 
                      progress.relationships_improved + progress.intelligence_gathered)}
                  </div>
                  <div className="text-xs text-gray-400">Total Actions</div>
                </div>
              </div>
            </div>
            
            {/* Active Automations */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h5 className="text-sm font-medium text-cyan-400 mb-3">Active Automations</h5>
              <div className="space-y-2">
                {[
                  { name: 'Episode Progression', active: settings.auto_episode_progression },
                  { name: 'Partner Interactions', active: settings.auto_partner_interactions },
                  { name: 'Relationship Maintenance', active: settings.auto_relationship_maintenance },
                  { name: 'Intelligence Gathering', active: settings.auto_intelligence_gathering }
                ].map(automation => (
                  <div key={automation.name} className="flex items-center justify-between">
                    <span className="text-gray-300 text-sm">{automation.name}</span>
                    <div className="flex items-center space-x-1">
                      {automation.active ? (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-gray-500" />
                      )}
                      <span className={`text-xs ${
                        automation.active ? 'text-green-400' : 'text-gray-500'
                      }`}>
                        {automation.active ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            {/* Automation Toggles */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h5 className="text-sm font-medium text-cyan-400 mb-3">Automation Settings</h5>
              <div className="space-y-3">
                {[
                  { key: 'auto_episode_progression', label: 'Auto Episode Progression', description: 'Automatically progress through story episodes when requirements are met' },
                  { key: 'auto_partner_interactions', label: 'Auto Partner Interactions', description: 'Perform regular interactions with AI partners' },
                  { key: 'auto_relationship_maintenance', label: 'Auto Relationship Maintenance', description: 'Maintain and improve partner relationships automatically' },
                  { key: 'auto_intelligence_gathering', label: 'Auto Intelligence Gathering', description: 'Continuously gather intelligence and research information' }
                ].map(setting => (
                  <div key={setting.key} className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="text-white text-sm font-medium">{setting.label}</div>
                      <div className="text-gray-400 text-xs">{setting.description}</div>
                    </div>
                    <button
                      onClick={() => saveIdleSettings({
                        ...settings,
                        [setting.key]: !settings[setting.key as keyof IdleSettings]
                      })}
                      className={`ml-3 relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings[setting.key as keyof IdleSettings]
                          ? 'bg-cyan-600'
                          : 'bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings[setting.key as keyof IdleSettings]
                            ? 'translate-x-6'
                            : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Resource Allocation */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h5 className="text-sm font-medium text-cyan-400 mb-3">Resource Allocation</h5>
              <div className="space-y-4">
                {Object.entries(settings.resource_allocation).map(([category, value]) => (
                  <div key={category}>
                    <div className="flex justify-between mb-2">
                      <span className="text-white text-sm capitalize">{category}</span>
                      <span className="text-cyan-400 text-sm">{value}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={value}
                      onChange={(e) => updateResourceAllocation(
                        category as keyof IdleSettings['resource_allocation'],
                        parseInt(e.target.value)
                      )}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                    />
                  </div>
                ))}
              </div>
            </div>
            
            {/* Performance Settings */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h5 className="text-sm font-medium text-cyan-400 mb-3">Performance Settings</h5>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-white text-sm">Interaction Frequency</span>
                    <span className="text-cyan-400 text-sm">{settings.interaction_frequency}/hour</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={settings.interaction_frequency}
                    onChange={(e) => saveIdleSettings({
                      ...settings,
                      interaction_frequency: parseInt(e.target.value)
                    })}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>
                
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-white text-sm">Progression Speed</span>
                    <span className="text-cyan-400 text-sm">{settings.progression_speed}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="3"
                    step="0.1"
                    value={settings.progression_speed}
                    onChange={(e) => saveIdleSettings({
                      ...settings,
                      progression_speed: parseFloat(e.target.value)
                    })}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Rules Tab */}
        {activeTab === 'rules' && (
          <div className="space-y-4">
            {automationRules.map(rule => (
              <div key={rule.id} className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      rule.is_active ? 'bg-green-400' : 'bg-gray-500'
                    }`}></div>
                    <div>
                      <h6 className="font-medium text-white">{rule.name}</h6>
                      <p className="text-xs text-gray-400">Priority: {rule.priority}</p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => {
                      const updatedRules = automationRules.map(r => 
                        r.id === rule.id ? { ...r, is_active: !r.is_active } : r
                      );
                      setAutomationRules(updatedRules);
                    }}
                    className={`px-3 py-1 rounded text-xs font-medium ${
                      rule.is_active
                        ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30'
                        : 'bg-green-600/20 text-green-400 hover:bg-green-600/30'
                    }`}
                  >
                    {rule.is_active ? 'Disable' : 'Enable'}
                  </button>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-400">Condition:</span>
                    <span className="text-gray-300 ml-2">{rule.condition}</span>
                  </div>
                  
                  <div>
                    <span className="text-gray-400">Action:</span>
                    <span className="text-gray-300 ml-2">{rule.action}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <div>
                      <span className="text-gray-400">Cooldown:</span>
                      <span className="text-gray-300 ml-2">{rule.cooldown}s</span>
                    </div>
                    
                    <div>
                      <span className="text-gray-400">Last Executed:</span>
                      <span className="text-gray-300 ml-2">
                        {rule.last_executed ? new Date(rule.last_executed).toLocaleTimeString() : 'Never'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Performance Chart Placeholder */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h5 className="text-sm font-medium text-cyan-400 mb-3">Performance Over Time</h5>
              <div className="h-32 bg-gray-700 rounded flex items-center justify-center">
                <span className="text-gray-500 text-sm">Performance analytics chart would go here</span>
              </div>
            </div>
            
            {/* Efficiency Breakdown */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h5 className="text-sm font-medium text-cyan-400 mb-3">Efficiency Breakdown</h5>
              <div className="space-y-3">
                {[
                  { category: 'Episode Progression', efficiency: 85, color: 'cyan' },
                  { category: 'Partner Relations', efficiency: 92, color: 'green' },
                  { category: 'Intelligence Ops', efficiency: 78, color: 'purple' },
                  { category: 'Resource Management', efficiency: 88, color: 'yellow' }
                ].map(item => (
                  <div key={item.category}>
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-300 text-sm">{item.category}</span>
                      <span className="text-white text-sm">{item.efficiency}%</span>
                    </div>
                    <div className="bg-gray-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          item.color === 'cyan' ? 'bg-cyan-400' :
                          item.color === 'green' ? 'bg-green-400' :
                          item.color === 'purple' ? 'bg-purple-400' :
                          'bg-yellow-400'
                        }`}
                        style={{ width: `${item.efficiency}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IdleOptimizationSystem;