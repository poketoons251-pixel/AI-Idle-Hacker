import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Brain, Users, Target, Settings, Play, Pause, BarChart3, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { toast } from 'sonner';
import { balanceConfig } from '../config/balanceConfig';
import { errorHandler, GameError, ErrorType, ErrorSeverity } from '../utils/errorHandling';

interface StoryChoice {
  id: string;
  text: string;
  context: string;
  consequences: {
    relationship_changes: Record<string, { trust?: number; respect?: number; intimacy?: number; conflict?: number }>;
    personality_impact: Record<string, number>;
    narrative_weight: number;
    risk_level: 'low' | 'medium' | 'high' | 'critical';
    resource_impact: { credits?: number; experience?: number; reputation?: number };
  };
  deadline?: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

interface AIPartner {
  id: string;
  name: string;
  specialization: string;
  trust: number;
  respect: number;
  intimacy: number;
  conflict: number;
  availability: boolean;
  current_task?: string;
  efficiency: number;
  coordination_bonus: number;
}

interface AutoplayDecision {
  choiceId: string;
  decision: string;
  confidence: number;
  reasoning: string;
  estimated_outcome: {
    success_probability: number;
    risk_assessment: number;
    relationship_impact: Record<string, number>;
    resource_projection: Record<string, number>;
  };
  timestamp: number;
}

interface AutoplayConfig {
  enabled: boolean;
  intelligence_level: number;
  risk_tolerance: number;
  relationship_priority: number;
  resource_priority: number;
  narrative_priority: number;
  decision_speed: number;
  partner_coordination: boolean;
  learning_enabled: boolean;
  override_critical: boolean;
}

interface CoordinationStrategy {
  id: string;
  name: string;
  description: string;
  efficiency_bonus: number;
  risk_modifier: number;
  relationship_impact: number;
  resource_cost: number;
}

const COORDINATION_STRATEGIES: CoordinationStrategy[] = [
  {
    id: 'independent',
    name: 'Independent Operation',
    description: 'Each partner works independently with minimal coordination',
    efficiency_bonus: 1.0,
    risk_modifier: 1.0,
    relationship_impact: 0.0,
    resource_cost: 0
  },
  {
    id: 'collaborative',
    name: 'Collaborative Approach',
    description: 'Partners share information and coordinate decisions',
    efficiency_bonus: 1.2,
    risk_modifier: 0.8,
    relationship_impact: 0.1,
    resource_cost: 100
  },
  {
    id: 'synchronized',
    name: 'Synchronized Operations',
    description: 'All partners work in perfect synchronization',
    efficiency_bonus: 1.5,
    risk_modifier: 0.6,
    relationship_impact: 0.2,
    resource_cost: 250
  },
  {
    id: 'adaptive',
    name: 'Adaptive Coordination',
    description: 'AI dynamically adjusts coordination based on situation',
    efficiency_bonus: 1.3,
    risk_modifier: 0.7,
    relationship_impact: 0.15,
    resource_cost: 200
  }
];

export const AdvancedAIAutoplay: React.FC = () => {
  const { player, skills, aiConfig, updatePlayer, updateSkills } = useGameStore();
  const [autoplayConfig, setAutoplayConfig] = useState<AutoplayConfig>({
    enabled: false,
    intelligence_level: 7,
    risk_tolerance: 0.6,
    relationship_priority: 0.7,
    resource_priority: 0.8,
    narrative_priority: 0.6,
    decision_speed: 5,
    partner_coordination: true,
    learning_enabled: true,
    override_critical: false
  });

  const [pendingChoices, setPendingChoices] = useState<StoryChoice[]>([]);
  const [aiPartners, setAIPartners] = useState<AIPartner[]>([]);
  const [recentDecisions, setRecentDecisions] = useState<AutoplayDecision[]>([]);
  const [coordinationStrategy, setCoordinationStrategy] = useState<string>('collaborative');
  const [systemStatus, setSystemStatus] = useState<{
    active: boolean;
    processing: boolean;
    efficiency: number;
    decisions_made: number;
    success_rate: number;
    last_decision: number;
  }>({
    active: false,
    processing: false,
    efficiency: 0,
    decisions_made: 0,
    success_rate: 0,
    last_decision: 0
  });

  // Calculate AI intelligence based on player progression and config
  const calculateAIIntelligence = useCallback(() => {
    const baseIntelligence = autoplayConfig.intelligence_level / 10;
    const skillBonus = (skills.ai + skills.social + skills.hacking) / 300;
    const experienceBonus = Math.min(0.3, player.level * 0.02);
    const learningBonus = autoplayConfig.learning_enabled ? recentDecisions.length * 0.01 : 0;
    
    return Math.min(0.95, baseIntelligence + skillBonus + experienceBonus + learningBonus);
  }, [autoplayConfig, skills, player.level, recentDecisions.length]);

  // Calculate partner coordination efficiency
  const calculateCoordinationEfficiency = useCallback(() => {
    if (!autoplayConfig.partner_coordination) return 1.0;
    
    const strategy = COORDINATION_STRATEGIES.find(s => s.id === coordinationStrategy);
    if (!strategy) return 1.0;
    
    const availablePartners = aiPartners.filter(p => p.availability).length;
    const partnerBonus = availablePartners * 0.1;
    const trustBonus = aiPartners.reduce((sum, p) => sum + p.trust, 0) / (aiPartners.length * 100) || 0;
    
    return strategy.efficiency_bonus * (1 + partnerBonus + trustBonus);
  }, [autoplayConfig.partner_coordination, coordinationStrategy, aiPartners]);

  // Analyze story choice and generate decision
  const analyzeStoryChoice = useCallback(async (choice: StoryChoice): Promise<AutoplayDecision> => {
    try {
      const intelligence = calculateAIIntelligence();
      const coordinationEfficiency = calculateCoordinationEfficiency();
      
      // Risk assessment
      const riskLevels = { low: 0.1, medium: 0.3, high: 0.6, critical: 0.9 };
      const baseRisk = riskLevels[choice.consequences.risk_level];
      const adjustedRisk = baseRisk * (1 - autoplayConfig.risk_tolerance);
      
      // Relationship impact analysis
      const relationshipScore = Object.values(choice.consequences.relationship_changes)
        .reduce((sum, changes) => {
          const positiveChanges = (changes.trust || 0) + (changes.respect || 0) + (changes.intimacy || 0);
          const negativeChanges = (changes.conflict || 0);
          return sum + positiveChanges - negativeChanges;
        }, 0);
      
      // Resource impact analysis
      const resourceScore = Object.values(choice.consequences.resource_impact)
        .reduce((sum, value) => sum + (value || 0), 0);
      
      // Decision algorithm
      const relationshipWeight = autoplayConfig.relationship_priority;
      const resourceWeight = autoplayConfig.resource_priority;
      const narrativeWeight = autoplayConfig.narrative_priority;
      const riskWeight = 1 - autoplayConfig.risk_tolerance;
      
      const decisionScore = 
        (relationshipScore * relationshipWeight) +
        (resourceScore * resourceWeight * 0.001) + // Scale down resource impact
        (choice.consequences.narrative_weight * narrativeWeight) -
        (adjustedRisk * riskWeight);
      
      // Apply intelligence and coordination bonuses
      const finalScore = decisionScore * intelligence * coordinationEfficiency;
      
      // Determine decision approach
      let decision: string;
      let confidence: number;
      
      if (finalScore > 0.7) {
        decision = 'aggressive_approach';
        confidence = Math.min(0.95, 0.7 + (finalScore - 0.7) * 0.5);
      } else if (finalScore > 0.3) {
        decision = 'balanced_approach';
        confidence = 0.6 + (finalScore - 0.3) * 0.25;
      } else {
        decision = 'conservative_approach';
        confidence = Math.max(0.3, 0.5 + finalScore * 0.2);
      }
      
      // Generate reasoning
      const reasoning = generateDecisionReasoning(choice, decision, {
        relationshipScore,
        resourceScore,
        adjustedRisk,
        intelligence,
        coordinationEfficiency
      });
      
      return {
        choiceId: choice.id,
        decision,
        confidence,
        reasoning,
        estimated_outcome: {
          success_probability: confidence,
          risk_assessment: adjustedRisk,
          relationship_impact: Object.fromEntries(
            Object.entries(choice.consequences.relationship_changes).map(([key, value]) => [
              key,
              (value.trust || 0) + (value.respect || 0) + (value.intimacy || 0) - (value.conflict || 0)
            ])
          ),
          resource_projection: choice.consequences.resource_impact || {}
        },
        timestamp: Date.now()
      };
    } catch (error) {
      throw new GameError(
        'Failed to analyze story choice',
        ErrorType.AI_DECISION,
        ErrorSeverity.MEDIUM,
        { choiceId: choice.id, error: error.message }
      );
    }
  }, [calculateAIIntelligence, calculateCoordinationEfficiency, autoplayConfig]);

  // Generate decision reasoning text
  const generateDecisionReasoning = (choice: StoryChoice, decision: string, analysis: any): string => {
    const reasons = [];
    
    if (analysis.relationshipScore > 0) {
      reasons.push('positive relationship impact');
    } else if (analysis.relationshipScore < 0) {
      reasons.push('potential relationship strain');
    }
    
    if (analysis.resourceScore > 0) {
      reasons.push('favorable resource outcome');
    } else if (analysis.resourceScore < 0) {
      reasons.push('resource cost consideration');
    }
    
    if (analysis.adjustedRisk > 0.5) {
      reasons.push('high risk assessment');
    } else if (analysis.adjustedRisk < 0.2) {
      reasons.push('low risk opportunity');
    }
    
    if (analysis.coordinationEfficiency > 1.2) {
      reasons.push('strong partner coordination');
    }
    
    const approachDescriptions = {
      aggressive_approach: 'Taking decisive action',
      balanced_approach: 'Maintaining strategic balance',
      conservative_approach: 'Prioritizing safety and stability'
    };
    
    return `${approachDescriptions[decision]} based on ${reasons.join(', ')}.`;
  };

  // Execute AI decision
  const executeDecision = useCallback(async (decision: AutoplayDecision) => {
    try {
      setSystemStatus(prev => ({ ...prev, processing: true }));
      
      const response = await fetch('/api/story/make-choice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          choiceId: decision.choiceId,
          approach: decision.decision,
          aiGenerated: true,
          confidence: decision.confidence
        })
      });
      
      if (!response.ok) {
        throw new Error(`Decision execution failed: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      // Update system status
      setSystemStatus(prev => ({
        ...prev,
        processing: false,
        decisions_made: prev.decisions_made + 1,
        success_rate: (prev.success_rate * prev.decisions_made + (result.success ? 1 : 0)) / (prev.decisions_made + 1),
        last_decision: Date.now()
      }));
      
      // Apply consequences
      if (result.consequences) {
        if (result.consequences.experience) {
          updatePlayer({ experience: player.experience + result.consequences.experience });
        }
        if (result.consequences.credits) {
          updatePlayer({ credits: player.credits + result.consequences.credits });
        }
        if (result.consequences.reputation) {
          updatePlayer({ reputation: player.reputation + result.consequences.reputation });
        }
      }
      
      // Update partner relationships
      if (result.relationship_changes) {
        setAIPartners(prev => prev.map(partner => {
          const changes = result.relationship_changes[partner.id];
          if (changes) {
            return {
              ...partner,
              trust: Math.max(0, Math.min(100, partner.trust + (changes.trust || 0))),
              respect: Math.max(0, Math.min(100, partner.respect + (changes.respect || 0))),
              intimacy: Math.max(0, Math.min(100, partner.intimacy + (changes.intimacy || 0))),
              conflict: Math.max(0, Math.min(100, partner.conflict + (changes.conflict || 0)))
            };
          }
          return partner;
        }));
      }
      
      toast.success(`AI decision executed: ${decision.decision}`, {
        description: `Confidence: ${Math.round(decision.confidence * 100)}%`
      });
      
    } catch (error) {
      errorHandler.handleError(new GameError(
        'Failed to execute AI decision',
        ErrorType.AI_DECISION,
        ErrorSeverity.HIGH,
        { decision, error: error.message }
      ));
      
      setSystemStatus(prev => ({ ...prev, processing: false }));
    }
  }, [player, updatePlayer]);

  // Process pending choices automatically
  const processAutoplay = useCallback(async () => {
    if (!autoplayConfig.enabled || systemStatus.processing || pendingChoices.length === 0) {
      return;
    }
    
    try {
      // Sort choices by priority and deadline
      const sortedChoices = [...pendingChoices].sort((a, b) => {
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        
        if (a.deadline && b.deadline) {
          return a.deadline - b.deadline;
        }
        return 0;
      });
      
      const choiceToProcess = sortedChoices[0];
      
      // Check if critical choice requires override
      if (choiceToProcess.consequences.risk_level === 'critical' && !autoplayConfig.override_critical) {
        toast.warning('Critical choice requires manual intervention', {
          description: choiceToProcess.text.substring(0, 100) + '...'
        });
        return;
      }
      
      // Analyze and execute decision
      const decision = await analyzeStoryChoice(choiceToProcess);
      setRecentDecisions(prev => [decision, ...prev.slice(0, 19)]); // Keep last 20 decisions
      
      await executeDecision(decision);
      
      // Remove processed choice
      setPendingChoices(prev => prev.filter(c => c.id !== choiceToProcess.id));
      
    } catch (error) {
      errorHandler.handleError(error);
    }
  }, [autoplayConfig, systemStatus.processing, pendingChoices, analyzeStoryChoice, executeDecision]);

  // Fetch pending choices and AI partners
  const fetchGameData = useCallback(async () => {
    try {
      const [choicesResponse, partnersResponse] = await Promise.all([
        fetch('/api/story/pending-choices'),
        fetch('/api/ai-partners')
      ]);
      
      if (choicesResponse.ok) {
        const choicesData = await choicesResponse.json();
        setPendingChoices(choicesData.choices || []);
      }
      
      if (partnersResponse.ok) {
        const partnersData = await partnersResponse.json();
        setAIPartners(partnersData.partners || []);
      }
    } catch (error) {
      errorHandler.handleError(new GameError(
        'Failed to fetch game data',
        ErrorType.NETWORK,
        ErrorSeverity.LOW,
        { error: error.message }
      ));
    }
  }, []);

  // Update system efficiency
  useEffect(() => {
    const intelligence = calculateAIIntelligence();
    const coordination = calculateCoordinationEfficiency();
    const efficiency = (intelligence * coordination * 100);
    
    setSystemStatus(prev => ({ ...prev, efficiency, active: autoplayConfig.enabled }));
  }, [calculateAIIntelligence, calculateCoordinationEfficiency, autoplayConfig.enabled]);

  // Autoplay processing interval
  useEffect(() => {
    if (!autoplayConfig.enabled) return;
    
    const interval = setInterval(() => {
      processAutoplay();
    }, autoplayConfig.decision_speed * 1000);
    
    return () => clearInterval(interval);
  }, [autoplayConfig.enabled, autoplayConfig.decision_speed, processAutoplay]);

  // Data fetching interval
  useEffect(() => {
    fetchGameData();
    const interval = setInterval(fetchGameData, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, [fetchGameData]);

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-orange-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Advanced AI Autoplay System
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">System Status</span>
                {systemStatus.active ? (
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    <Play className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    <Pause className="h-3 w-3 mr-1" />
                    Inactive
                  </Badge>
                )}
              </div>
              <Progress value={systemStatus.efficiency} className="h-2" />
              <p className="text-xs text-gray-600">{Math.round(systemStatus.efficiency)}% Efficiency</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Decisions Made</span>
                <span className="text-lg font-bold">{systemStatus.decisions_made}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Success Rate</span>
                <span className="text-sm font-medium">{Math.round(systemStatus.success_rate * 100)}%</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Pending Choices</span>
                <span className="text-lg font-bold">{pendingChoices.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Processing</span>
                {systemStatus.processing ? (
                  <Badge variant="default" className="bg-blue-100 text-blue-800">
                    <Clock className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                ) : (
                  <Badge variant="secondary">Idle</Badge>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={autoplayConfig.enabled}
                onChange={(e) => 
                  setAutoplayConfig(prev => ({ ...prev, enabled: e.target.checked }))
                }
                className="w-4 h-4 text-cyber-primary bg-cyber-dark border-cyber-primary rounded focus:ring-cyber-primary"
              />
              <span className="font-medium">Enable AI Autoplay</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchGameData}
              disabled={systemStatus.processing}
            >
              Refresh Data
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="configuration" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
          <TabsTrigger value="choices">Pending Choices</TabsTrigger>
          <TabsTrigger value="partners">AI Partners</TabsTrigger>
          <TabsTrigger value="decisions">Decision History</TabsTrigger>
        </TabsList>

        <TabsContent value="configuration" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                AI Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Intelligence Level</label>
                    <input
                      type="range"
                      value={autoplayConfig.intelligence_level}
                      onChange={(e) => 
                        setAutoplayConfig(prev => ({ ...prev, intelligence_level: parseInt(e.target.value) }))
                      }
                      min={1}
                      max={10}
                      step={1}
                      className="w-full h-2 bg-cyber-dark rounded-lg appearance-none cursor-pointer slider"
                    />
                    <p className="text-xs text-gray-600 mt-1">Level {autoplayConfig.intelligence_level}/10</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Risk Tolerance</label>
                    <input
                      type="range"
                      value={autoplayConfig.risk_tolerance * 100}
                      onChange={(e) => 
                        setAutoplayConfig(prev => ({ ...prev, risk_tolerance: parseInt(e.target.value) / 100 }))
                      }
                      min={0}
                      max={100}
                      step={5}
                      className="w-full h-2 bg-cyber-dark rounded-lg appearance-none cursor-pointer slider"
                    />
                    <p className="text-xs text-gray-600 mt-1">{Math.round(autoplayConfig.risk_tolerance * 100)}%</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Decision Speed (seconds)</label>
                    <input
                      type="range"
                      value={autoplayConfig.decision_speed}
                      onChange={(e) => 
                        setAutoplayConfig(prev => ({ ...prev, decision_speed: parseInt(e.target.value) }))
                      }
                      min={1}
                      max={30}
                      step={1}
                      className="w-full h-2 bg-cyber-dark rounded-lg appearance-none cursor-pointer slider"
                    />
                    <p className="text-xs text-gray-600 mt-1">{autoplayConfig.decision_speed}s between decisions</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Relationship Priority</label>
                    <input
                      type="range"
                      value={autoplayConfig.relationship_priority * 100}
                      onChange={(e) => 
                        setAutoplayConfig(prev => ({ ...prev, relationship_priority: parseInt(e.target.value) / 100 }))
                      }
                      min={0}
                      max={100}
                      step={5}
                      className="w-full h-2 bg-cyber-dark rounded-lg appearance-none cursor-pointer slider"
                    />
                    <p className="text-xs text-gray-600 mt-1">{Math.round(autoplayConfig.relationship_priority * 100)}%</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Resource Priority</label>
                    <input
                      type="range"
                      value={autoplayConfig.resource_priority * 100}
                      onChange={(e) => 
                        setAutoplayConfig(prev => ({ ...prev, resource_priority: parseInt(e.target.value) / 100 }))
                      }
                      min={0}
                      max={100}
                      step={5}
                      className="w-full h-2 bg-cyber-dark rounded-lg appearance-none cursor-pointer slider"
                    />
                    <p className="text-xs text-gray-600 mt-1">{Math.round(autoplayConfig.resource_priority * 100)}%</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Narrative Priority</label>
                    <input
                      type="range"
                      value={autoplayConfig.narrative_priority * 100}
                      onChange={(e) => 
                        setAutoplayConfig(prev => ({ ...prev, narrative_priority: parseInt(e.target.value) / 100 }))
                      }
                      min={0}
                      max={100}
                      step={5}
                      className="w-full h-2 bg-cyber-dark rounded-lg appearance-none cursor-pointer slider"
                    />
                    <p className="text-xs text-gray-600 mt-1">{Math.round(autoplayConfig.narrative_priority * 100)}%</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium">Partner Coordination</span>
                    <p className="text-sm text-gray-600">Enable AI partner coordination for enhanced decision making</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoplayConfig.partner_coordination}
                    onChange={(e) => 
                      setAutoplayConfig(prev => ({ ...prev, partner_coordination: e.target.checked }))
                    }
                    className="w-4 h-4 text-cyber-primary bg-cyber-dark border-cyber-primary rounded focus:ring-cyber-primary"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium">Learning Mode</span>
                    <p className="text-sm text-gray-600">AI learns from decision outcomes to improve future choices</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoplayConfig.learning_enabled}
                    onChange={(e) => 
                      setAutoplayConfig(prev => ({ ...prev, learning_enabled: e.target.checked }))
                    }
                    className="w-4 h-4 text-cyber-primary bg-cyber-dark border-cyber-primary rounded focus:ring-cyber-primary"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium">Override Critical Choices</span>
                    <p className="text-sm text-gray-600">Allow AI to make critical decisions without manual approval</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoplayConfig.override_critical}
                    onChange={(e) => 
                      setAutoplayConfig(prev => ({ ...prev, override_critical: e.target.checked }))
                    }
                    className="w-4 h-4 text-cyber-primary bg-cyber-dark border-cyber-primary rounded focus:ring-cyber-primary"
                  />
                </div>
              </div>
              
              {autoplayConfig.partner_coordination && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Coordination Strategy</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {COORDINATION_STRATEGIES.map((strategy) => (
                      <Button
                        key={strategy.id}
                        variant={coordinationStrategy === strategy.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCoordinationStrategy(strategy.id)}
                        className="justify-start h-auto p-3"
                      >
                        <div className="text-left">
                          <div className="font-medium">{strategy.name}</div>
                          <div className="text-xs opacity-70">{strategy.description}</div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="choices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Pending Story Choices ({pendingChoices.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pendingChoices.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No pending choices</p>
                  <p className="text-sm">All story decisions are up to date</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingChoices.map((choice) => (
                    <div key={choice.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={getPriorityColor(choice.priority)}>
                              {choice.priority}
                            </Badge>
                            <span className={`text-sm font-medium ${getRiskColor(choice.consequences.risk_level)}`}>
                              {choice.consequences.risk_level} risk
                            </span>
                          </div>
                          <p className="font-medium">{choice.text}</p>
                          <p className="text-sm text-gray-600 mt-1">{choice.context}</p>
                        </div>
                        {choice.deadline && (
                          <div className="text-right">
                            <p className="text-xs text-gray-500">Deadline</p>
                            <p className="text-sm font-medium">
                              {new Date(choice.deadline).toLocaleTimeString()}
                            </p>
                          </div>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3 text-sm">
                        <div>
                          <p className="font-medium text-gray-700">Relationship Impact</p>
                          {Object.entries(choice.consequences.relationship_changes).map(([partnerId, changes]) => (
                            <div key={partnerId} className="text-xs">
                              {partnerId}: {Object.entries(changes).map(([type, value]) => 
                                `${type} ${value > 0 ? '+' : ''}${value}`
                              ).join(', ')}
                            </div>
                          ))}
                        </div>
                        
                        <div>
                          <p className="font-medium text-gray-700">Resource Impact</p>
                          {Object.entries(choice.consequences.resource_impact).map(([resource, value]) => (
                            <div key={resource} className="text-xs">
                              {resource}: {value > 0 ? '+' : ''}{value}
                            </div>
                          ))}
                        </div>
                        
                        <div>
                          <p className="font-medium text-gray-700">Narrative Weight</p>
                          <Progress value={choice.consequences.narrative_weight * 100} className="h-2 mt-1" />
                          <p className="text-xs text-gray-600">{Math.round(choice.consequences.narrative_weight * 100)}%</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="partners" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                AI Partners ({aiPartners.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {aiPartners.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No AI partners available</p>
                  <p className="text-sm">Complete story missions to recruit AI partners</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {aiPartners.map((partner) => (
                    <div key={partner.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-medium">{partner.name}</h3>
                          <p className="text-sm text-gray-600">{partner.specialization}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {partner.availability ? (
                            <Badge variant="default" className="bg-green-100 text-green-800">
                              Available
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              Busy
                            </Badge>
                          )}
                          <span className="text-sm font-medium">{Math.round(partner.efficiency * 100)}%</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Trust</span>
                          <div className="flex items-center gap-2">
                            <Progress value={partner.trust} className="h-2 w-16" />
                            <span className="text-xs w-8">{partner.trust}%</span>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Respect</span>
                          <div className="flex items-center gap-2">
                            <Progress value={partner.respect} className="h-2 w-16" />
                            <span className="text-xs w-8">{partner.respect}%</span>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Intimacy</span>
                          <div className="flex items-center gap-2">
                            <Progress value={partner.intimacy} className="h-2 w-16" />
                            <span className="text-xs w-8">{partner.intimacy}%</span>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Conflict</span>
                          <div className="flex items-center gap-2">
                            <Progress value={partner.conflict} className="h-2 w-16" />
                            <span className="text-xs w-8">{partner.conflict}%</span>
                          </div>
                        </div>
                      </div>
                      
                      {partner.current_task && (
                        <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
                          <span className="font-medium">Current Task:</span> {partner.current_task}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="decisions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Recent Decisions ({recentDecisions.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentDecisions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No decisions made yet</p>
                  <p className="text-sm">AI decisions will appear here once autoplay is enabled</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentDecisions.map((decision, index) => (
                    <div key={`${decision.choiceId}-${index}`} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline">{decision.decision.replace('_', ' ')}</Badge>
                            <span className="text-sm font-medium">
                              {Math.round(decision.confidence * 100)}% confidence
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">{decision.reasoning}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">
                            {new Date(decision.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 text-sm">
                        <div>
                          <p className="font-medium text-gray-700">Estimated Outcome</p>
                          <div className="space-y-1 text-xs">
                            <div>Success: {Math.round(decision.estimated_outcome.success_probability * 100)}%</div>
                            <div>Risk: {Math.round(decision.estimated_outcome.risk_assessment * 100)}%</div>
                          </div>
                        </div>
                        
                        <div>
                          <p className="font-medium text-gray-700">Resource Projection</p>
                          <div className="space-y-1 text-xs">
                            {Object.entries(decision.estimated_outcome.resource_projection).map(([resource, value]) => (
                              <div key={resource}>
                                {resource}: {value > 0 ? '+' : ''}{value}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdvancedAIAutoplay;