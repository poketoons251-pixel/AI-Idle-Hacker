import React, { useState, useEffect, useCallback } from 'react';
import { Search, Target, Eye, Shield, Zap, TrendingUp, AlertTriangle, CheckCircle, Clock, Database } from 'lucide-react';
import { useGameStore } from '../store/gameStore';

interface InvestigationTarget {
  id: string;
  name: string;
  type: 'person' | 'organization' | 'system' | 'location' | 'event';
  difficulty: number; // 1-10
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'investigating' | 'completed' | 'failed';
  progress: number; // 0-100
  estimated_time: number; // minutes
  required_skills: string[];
  potential_rewards: {
    experience: number;
    credits: number;
    reputation: number;
    intelligence_points: number;
  };
  risk_factors: {
    detection_chance: number;
    retaliation_risk: number;
    legal_consequences: number;
  };
}

interface IntelligenceData {
  id: string;
  target_id: string;
  category: 'personal' | 'financial' | 'technical' | 'operational' | 'strategic';
  reliability: number; // 0-100
  value: number; // 1-10
  content: string;
  source: string;
  timestamp: string;
  verification_status: 'unverified' | 'partially_verified' | 'verified' | 'disputed';
}

interface AutomationRule {
  id: string;
  name: string;
  condition: string;
  action: string;
  priority_threshold: string;
  risk_tolerance: number;
  enabled: boolean;
}

interface SmartInvestigationSystemProps {
  className?: string;
  autoInvestigationEnabled?: boolean;
}

export const SmartInvestigationSystem: React.FC<SmartInvestigationSystemProps> = ({
  className = '',
  autoInvestigationEnabled = false
}) => {
  const [investigationTargets, setInvestigationTargets] = useState<InvestigationTarget[]>([]);
  const [intelligenceData, setIntelligenceData] = useState<IntelligenceData[]>([]);
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([]);
  const [activeInvestigations, setActiveInvestigations] = useState<string[]>([]);
  const [systemEfficiency, setSystemEfficiency] = useState(0.65);
  const [loading, setLoading] = useState(true);
  const [lastScanTime, setLastScanTime] = useState<Date | null>(null);
  
  const { player, skills } = useGameStore();

  useEffect(() => {
    initializeInvestigationSystem();
    const interval = setInterval(processAutomatedInvestigations, 20000); // Every 20 seconds
    return () => clearInterval(interval);
  }, []);

  const initializeInvestigationSystem = async () => {
    try {
      setLoading(true);
      
      // Fetch investigation targets
      const targetsResponse = await fetch('/api/investigation/targets');
      const targetsData = await targetsResponse.json();
      
      // Fetch intelligence data
      const intelResponse = await fetch('/api/investigation/intelligence');
      const intelData = await intelResponse.json();
      
      // Fetch automation rules
      const rulesResponse = await fetch('/api/investigation/automation-rules');
      const rulesData = await rulesResponse.json();
      
      setInvestigationTargets(targetsData.targets || []);
      setIntelligenceData(intelData.intelligence || []);
      setAutomationRules(rulesData.rules || []);
      
      // Calculate system efficiency based on player skills and equipment
      const investigationSkill = skills.ai || 0; // Use AI skill for investigation
      const hackingSkill = skills.hacking || 0;
      const socialSkill = skills.social || 0; // Use social skill instead of social_engineering
      
      const baseEfficiency = 0.65;
      const skillBonus = (investigationSkill + hackingSkill + socialSkill) * 0.002;
      const levelBonus = Math.floor(player.experience / 1000) * 0.01;
      
      setSystemEfficiency(Math.min(0.95, baseEfficiency + skillBonus + levelBonus));
      setLastScanTime(new Date());
    } catch (error) {
      console.error('Error initializing investigation system:', error);
    } finally {
      setLoading(false);
    }
  };

  const processAutomatedInvestigations = useCallback(async () => {
    if (!autoInvestigationEnabled) return;
    
    // Find suitable targets for automated investigation
    const suitableTargets = investigationTargets.filter(target => 
      target.status === 'pending' && 
      shouldAutoInvestigate(target)
    );
    
    for (const target of suitableTargets.slice(0, 2)) { // Limit to 2 concurrent investigations
      if (activeInvestigations.length < 3) {
        await startAutomatedInvestigation(target);
      }
    }
    
    // Process ongoing investigations
    await updateInvestigationProgress();
    
    // Analyze gathered intelligence
    await analyzeIntelligence();
    
    setLastScanTime(new Date());
  }, [autoInvestigationEnabled, investigationTargets, activeInvestigations, automationRules]);

  const shouldAutoInvestigate = (target: InvestigationTarget): boolean => {
    // Check automation rules
    const applicableRules = automationRules.filter(rule => 
      rule.enabled && evaluateRuleCondition(rule, target)
    );
    
    if (applicableRules.length === 0) return false;
    
    // Risk assessment
    const totalRisk = target.risk_factors.detection_chance + 
                     target.risk_factors.retaliation_risk + 
                     target.risk_factors.legal_consequences;
    
    const riskTolerance = applicableRules[0].risk_tolerance;
    
    if (totalRisk > riskTolerance * 100) return false;
    
    // Skill requirement check
    const hasRequiredSkills = target.required_skills.every(skill => {
      const playerSkill = skills[skill as keyof typeof skills] || 0;
      const requiredLevel = target.difficulty * 10;
      return playerSkill >= requiredLevel * 0.7; // 70% of required skill
    });
    
    return hasRequiredSkills;
  };

  const evaluateRuleCondition = (rule: AutomationRule, target: InvestigationTarget): boolean => {
    // Simple rule evaluation - in production this would be more sophisticated
    switch (rule.condition) {
      case 'high_priority':
        return target.priority === 'high' || target.priority === 'critical';
      case 'low_risk':
        const totalRisk = target.risk_factors.detection_chance + 
                         target.risk_factors.retaliation_risk + 
                         target.risk_factors.legal_consequences;
        return totalRisk < 150;
      case 'high_reward':
        const totalReward = target.potential_rewards.experience + 
                           target.potential_rewards.credits + 
                           target.potential_rewards.reputation;
        return totalReward > 1000;
      case 'skill_match':
        return target.required_skills.some(skill => 
          (skills[skill as keyof typeof skills] || 0) >= target.difficulty * 8
        );
      default:
        return false;
    }
  };

  const startAutomatedInvestigation = async (target: InvestigationTarget) => {
    try {
      const response = await fetch('/api/investigation/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetId: target.id,
          automated: true,
          efficiency: systemEfficiency
        })
      });
      
      if (response.ok) {
        setActiveInvestigations(prev => [...prev, target.id]);
        setInvestigationTargets(prev => 
          prev.map(t => t.id === target.id ? { ...t, status: 'investigating' } : t)
        );
      }
    } catch (error) {
      console.error('Error starting automated investigation:', error);
    }
  };

  const updateInvestigationProgress = async () => {
    for (const targetId of activeInvestigations) {
      try {
        const response = await fetch(`/api/investigation/progress/${targetId}`);
        const progressData = await response.json();
        
        setInvestigationTargets(prev => 
          prev.map(target => {
            if (target.id === targetId) {
              const updatedTarget = { ...target, progress: progressData.progress };
              
              // Check if investigation completed
              if (progressData.progress >= 100) {
                updatedTarget.status = progressData.success ? 'completed' : 'failed';
                setActiveInvestigations(prev => prev.filter(id => id !== targetId));
                
                // Add gathered intelligence
                if (progressData.intelligence) {
                  setIntelligenceData(prev => [...prev, ...progressData.intelligence]);
                }
              }
              
              return updatedTarget;
            }
            return target;
          })
        );
      } catch (error) {
        console.error(`Error updating investigation progress for ${targetId}:`, error);
      }
    }
  };

  const analyzeIntelligence = async () => {
    // Analyze patterns in gathered intelligence
    const recentIntel = intelligenceData.filter(intel => {
      const intelDate = new Date(intel.timestamp);
      const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
      return intelDate > hourAgo;
    });
    
    if (recentIntel.length === 0) return;
    
    // Pattern analysis
    const patterns = analyzeIntelligencePatterns(recentIntel);
    
    // Generate new investigation targets based on patterns
    const newTargets = generateTargetsFromPatterns(patterns);
    
    if (newTargets.length > 0) {
      setInvestigationTargets(prev => [...prev, ...newTargets]);
    }
  };

  const analyzeIntelligencePatterns = (intel: IntelligenceData[]): any[] => {
    const patterns = [];
    
    // Financial pattern analysis
    const financialIntel = intel.filter(i => i.category === 'financial');
    if (financialIntel.length >= 3) {
      patterns.push({
        type: 'financial_network',
        confidence: 0.8,
        entities: financialIntel.map(i => i.target_id)
      });
    }
    
    // Technical pattern analysis
    const technicalIntel = intel.filter(i => i.category === 'technical');
    if (technicalIntel.length >= 2) {
      patterns.push({
        type: 'technical_infrastructure',
        confidence: 0.7,
        systems: technicalIntel.map(i => i.content)
      });
    }
    
    // Operational pattern analysis
    const operationalIntel = intel.filter(i => i.category === 'operational');
    if (operationalIntel.length >= 4) {
      patterns.push({
        type: 'operational_schedule',
        confidence: 0.9,
        timeline: operationalIntel.map(i => ({ time: i.timestamp, content: i.content }))
      });
    }
    
    return patterns;
  };

  const generateTargetsFromPatterns = (patterns: any[]): InvestigationTarget[] => {
    const newTargets: InvestigationTarget[] = [];
    
    patterns.forEach(pattern => {
      if (pattern.confidence > 0.7) {
        const target: InvestigationTarget = {
          id: `auto_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: `Pattern-Based Target: ${pattern.type}`,
          type: 'system',
          difficulty: Math.ceil(pattern.confidence * 8),
          priority: pattern.confidence > 0.8 ? 'high' : 'medium',
          status: 'pending',
          progress: 0,
          estimated_time: Math.ceil(pattern.confidence * 120),
          required_skills: ['investigation', 'hacking'],
          potential_rewards: {
            experience: Math.ceil(pattern.confidence * 500),
            credits: Math.ceil(pattern.confidence * 1000),
            reputation: Math.ceil(pattern.confidence * 100),
            intelligence_points: Math.ceil(pattern.confidence * 50)
          },
          risk_factors: {
            detection_chance: Math.ceil((1 - pattern.confidence) * 30),
            retaliation_risk: Math.ceil((1 - pattern.confidence) * 20),
            legal_consequences: Math.ceil((1 - pattern.confidence) * 15)
          }
        };
        
        newTargets.push(target);
      }
    });
    
    return newTargets;
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'critical': return 'text-red-400 bg-red-900/20';
      case 'high': return 'text-orange-400 bg-orange-900/20';
      case 'medium': return 'text-yellow-400 bg-yellow-900/20';
      case 'low': return 'text-green-400 bg-green-900/20';
      default: return 'text-gray-400 bg-gray-900/20';
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed': return 'text-green-400';
      case 'investigating': return 'text-blue-400';
      case 'failed': return 'text-red-400';
      case 'pending': return 'text-gray-400';
      default: return 'text-gray-400';
    }
  };

  const getVerificationColor = (status: string): string => {
    switch (status) {
      case 'verified': return 'text-green-400';
      case 'partially_verified': return 'text-yellow-400';
      case 'disputed': return 'text-red-400';
      case 'unverified': return 'text-gray-400';
      default: return 'text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className={`bg-gray-900 border border-cyan-500/30 rounded-lg p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700 rounded mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-900 border border-cyan-500/30 rounded-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Search className="w-6 h-6 text-cyan-400" />
          <h3 className="text-xl font-bold text-cyan-400">Smart Investigation System</h3>
        </div>
        
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-green-400" />
            <span className="text-gray-300">Efficiency: {Math.round(systemEfficiency * 100)}%</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-blue-400" />
            <span className="text-gray-300">
              Last Scan: {lastScanTime ? lastScanTime.toLocaleTimeString() : 'Never'}
            </span>
          </div>
          
          <div className={`px-3 py-1 rounded text-xs font-medium ${
            autoInvestigationEnabled 
              ? 'bg-cyan-600 text-white' 
              : 'bg-gray-700 text-gray-300'
          }`}>
            {autoInvestigationEnabled ? 'Auto-Investigation ON' : 'Manual Mode'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Investigation Targets */}
        <div className="xl:col-span-2 space-y-4">
          <h4 className="text-lg font-semibold text-white flex items-center">
            <Target className="w-5 h-5 mr-2 text-orange-400" />
            Investigation Targets ({investigationTargets.length})
          </h4>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {investigationTargets.map((target) => (
              <div key={target.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <h5 className="font-medium text-white">{target.name}</h5>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(target.priority)}`}>
                      {target.priority.toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className={`text-sm font-medium ${getStatusColor(target.status)}`}>
                      {target.status.toUpperCase()}
                    </span>
                    {target.status === 'investigating' && (
                      <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                    )}
                  </div>
                </div>
                
                {target.status === 'investigating' && (
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                      <span>Progress</span>
                      <span>{target.progress}%</span>
                    </div>
                    <div className="bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${target.progress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <div className="text-gray-400 mb-1">Difficulty: {target.difficulty}/10</div>
                    <div className="text-gray-400 mb-1">Est. Time: {target.estimated_time}m</div>
                    <div className="text-gray-400">Type: {target.type}</div>
                  </div>
                  
                  <div>
                    <div className="text-green-400 mb-1">XP: {target.potential_rewards.experience}</div>
                    <div className="text-yellow-400 mb-1">Credits: {target.potential_rewards.credits}</div>
                    <div className="text-purple-400">Intel: {target.potential_rewards.intelligence_points}</div>
                  </div>
                </div>
                
                <div className="mt-3 pt-3 border-t border-gray-700">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Risk Factors:</span>
                    <div className="flex space-x-3">
                      <span className="text-red-400">Detection: {target.risk_factors.detection_chance}%</span>
                      <span className="text-orange-400">Retaliation: {target.risk_factors.retaliation_risk}%</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Intelligence Data */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-white flex items-center">
            <Database className="w-5 h-5 mr-2 text-purple-400" />
            Intelligence Data ({intelligenceData.length})
          </h4>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {intelligenceData.slice(0, 10).map((intel) => (
              <div key={intel.id} className="bg-gray-800 rounded-lg p-3 border border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    intel.category === 'strategic' ? 'bg-red-900/20 text-red-400' :
                    intel.category === 'operational' ? 'bg-orange-900/20 text-orange-400' :
                    intel.category === 'technical' ? 'bg-blue-900/20 text-blue-400' :
                    intel.category === 'financial' ? 'bg-green-900/20 text-green-400' :
                    'bg-purple-900/20 text-purple-400'
                  }`}>
                    {intel.category.toUpperCase()}
                  </span>
                  
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs ${getVerificationColor(intel.verification_status)}`}>
                      {intel.verification_status === 'verified' ? <CheckCircle className="w-3 h-3" /> :
                       intel.verification_status === 'disputed' ? <AlertTriangle className="w-3 h-3" /> :
                       <Eye className="w-3 h-3" />}
                    </span>
                    <span className="text-xs text-gray-400">Value: {intel.value}/10</span>
                  </div>
                </div>
                
                <p className="text-sm text-gray-300 mb-2 line-clamp-2">{intel.content}</p>
                
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Reliability: {intel.reliability}%</span>
                  <span>{new Date(intel.timestamp).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="mt-6 pt-6 border-t border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-400">{activeInvestigations.length}</div>
            <div className="text-sm text-gray-400">Active Investigations</div>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-400">
              {investigationTargets.filter(t => t.status === 'completed').length}
            </div>
            <div className="text-sm text-gray-400">Completed</div>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-400">
              {intelligenceData.filter(i => i.verification_status === 'verified').length}
            </div>
            <div className="text-sm text-gray-400">Verified Intel</div>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-cyan-400">
              {Math.round(systemEfficiency * 100)}%
            </div>
            <div className="text-sm text-gray-400">System Efficiency</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartInvestigationSystem;