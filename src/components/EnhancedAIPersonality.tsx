import React, { useState, useEffect, useCallback } from 'react';
import { Brain, Heart, Zap, Target, Users, MessageCircle, TrendingUp, Shield } from 'lucide-react';
import { useGameStore } from '../store/gameStore';

interface AIPersonalityTrait {
  id: string;
  name: string;
  description: string;
  value: number; // 0-100
  influence_weight: number;
  evolution_stage: number;
}

interface AIPartner {
  id: string;
  name: string;
  personality_type: string;
  relationship_level: number;
  trust: number;
  respect: number;
  intimacy: number;
  conflict: number;
  compatibility_score: number;
  last_interaction: string;
}

interface StoryChoice {
  id: string;
  text: string;
  consequences: {
    relationship_changes: { [partnerId: string]: { trust?: number; respect?: number; intimacy?: number; conflict?: number } };
    personality_impact: { [traitId: string]: number };
    narrative_weight: number;
    risk_level: 'low' | 'medium' | 'high' | 'critical';
  };
}

interface EnhancedAIPersonalityProps {
  className?: string;
  autoDecisionEnabled?: boolean;
}

export const EnhancedAIPersonality: React.FC<EnhancedAIPersonalityProps> = ({
  className = '',
  autoDecisionEnabled = false
}) => {
  const [personalityTraits, setPersonalityTraits] = useState<AIPersonalityTrait[]>([]);
  const [aiPartners, setAiPartners] = useState<AIPartner[]>([]);
  const [pendingChoices, setPendingChoices] = useState<StoryChoice[]>([]);
  const [decisionHistory, setDecisionHistory] = useState<any[]>([]);
  const [aiDecisionAccuracy, setAiDecisionAccuracy] = useState(0.75);
  const [loading, setLoading] = useState(true);
  
  const { player, aiConfig } = useGameStore();

  useEffect(() => {
    fetchPersonalityData();
    const interval = setInterval(processAIDecisions, 15000); // Check every 15 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchPersonalityData = async () => {
    try {
      setLoading(true);
      
      // Fetch personality traits
      const traitsResponse = await fetch(`/api/ai-personality/traits?player_id=${encodeURIComponent(player.id)}`);
      if (!traitsResponse.ok) {
        throw new Error(`Failed to fetch traits: ${traitsResponse.status}`);
      }
      const traitsData = await traitsResponse.json();
      
      // Fetch AI partners
      const partnersResponse = await fetch(`/api/ai-personality/partners?player_id=${encodeURIComponent(player.id)}`);
      if (!partnersResponse.ok) {
        throw new Error(`Failed to fetch partners: ${partnersResponse.status}`);
      }
      const partnersData = await partnersResponse.json();
      
      // Fetch pending story choices
      const choicesResponse = await fetch('/api/story/pending-choices');
      const choicesData = await choicesResponse.json();
      
      setPersonalityTraits(traitsData.traits || []);
      setAiPartners(partnersData.partners || []);
      setPendingChoices(choicesData.choices || []);
      
      // Calculate AI decision accuracy based on experience and traits
      const playerLevel = Math.floor(player.experience / 1000);
      const baseAccuracy = 0.75;
      const levelBonus = Math.min(0.2, playerLevel * 0.01);
      const traitBonus = calculateTraitBonus(traitsData.traits || []);
      
      setAiDecisionAccuracy(Math.min(0.95, baseAccuracy + levelBonus + traitBonus));
    } catch (error) {
      console.error('Error fetching personality data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTraitBonus = (traits: AIPersonalityTrait[]): number => {
    const analyticalTrait = traits.find(t => t.name.toLowerCase().includes('analytical'));
    const empathyTrait = traits.find(t => t.name.toLowerCase().includes('empathy'));
    const strategicTrait = traits.find(t => t.name.toLowerCase().includes('strategic'));
    
    let bonus = 0;
    if (analyticalTrait) bonus += (analyticalTrait.value / 100) * 0.1;
    if (empathyTrait) bonus += (empathyTrait.value / 100) * 0.08;
    if (strategicTrait) bonus += (strategicTrait.value / 100) * 0.12;
    
    return bonus;
  };

  const processAIDecisions = useCallback(async () => {
    if (!autoDecisionEnabled || pendingChoices.length === 0) return;
    
    for (const choice of pendingChoices) {
      const shouldMakeDecision = Math.random() < aiDecisionAccuracy;
      
      if (shouldMakeDecision) {
        const optimalChoice = calculateOptimalChoice(choice);
        await executeStoryChoice(choice.id, optimalChoice);
      }
    }
  }, [autoDecisionEnabled, pendingChoices, aiDecisionAccuracy, personalityTraits, aiPartners]);

  const calculateOptimalChoice = (choice: StoryChoice): string => {
    // Enhanced decision-making algorithm
    const riskTolerance = aiConfig.riskTolerance || 0.5;
    const relationshipPriority = aiConfig.priorities?.operations || 0.7;
    
    // Analyze consequences for each potential decision
    let bestScore = -Infinity;
    let bestChoiceId = choice.id;
    
    // Simulate different choice outcomes
    const potentialOutcomes = generatePotentialOutcomes(choice);
    
    for (const outcome of potentialOutcomes) {
      const score = evaluateOutcomeScore(outcome, riskTolerance, relationshipPriority);
      
      if (score > bestScore) {
        bestScore = score;
        bestChoiceId = outcome.choiceId;
      }
    }
    
    return bestChoiceId;
  };

  const generatePotentialOutcomes = (choice: StoryChoice): any[] => {
    // Generate multiple potential outcomes based on current relationships and personality
    const outcomes = [];
    
    // Conservative approach
    outcomes.push({
      choiceId: `${choice.id}_conservative`,
      riskLevel: 'low',
      relationshipImpact: calculateConservativeImpact(choice),
      personalityAlignment: calculatePersonalityAlignment(choice, 'conservative')
    });
    
    // Aggressive approach
    outcomes.push({
      choiceId: `${choice.id}_aggressive`,
      riskLevel: 'high',
      relationshipImpact: calculateAggressiveImpact(choice),
      personalityAlignment: calculatePersonalityAlignment(choice, 'aggressive')
    });
    
    // Balanced approach
    outcomes.push({
      choiceId: `${choice.id}_balanced`,
      riskLevel: 'medium',
      relationshipImpact: calculateBalancedImpact(choice),
      personalityAlignment: calculatePersonalityAlignment(choice, 'balanced')
    });
    
    return outcomes;
  };

  const evaluateOutcomeScore = (outcome: any, riskTolerance: number, relationshipPriority: number): number => {
    let score = 0;
    
    // Risk assessment
    const riskPenalty = {
      'low': 0,
      'medium': -0.2,
      'high': -0.5,
      'critical': -1.0
    }[outcome.riskLevel] || 0;
    
    score += riskPenalty * (1 - (riskTolerance || 0));
    
    // Relationship impact assessment
    const relationshipScore = Object.values(outcome.relationshipImpact).reduce((sum: number, impact: any) => {
      return sum + (impact.trust || 0) + (impact.respect || 0) + (impact.intimacy || 0) - (impact.conflict || 0);
    }, 0);
    
    score += Number(relationshipScore || 0) * Number(relationshipPriority || 0);
    
    // Personality alignment bonus
    score += (outcome.personalityAlignment || 0) * 0.3;
    
    return score;
  };

  const calculateConservativeImpact = (choice: StoryChoice): any => {
    // Conservative choices prioritize maintaining existing relationships
    const impact: any = {};
    
    aiPartners.forEach(partner => {
      impact[partner.id] = {
        trust: Math.min(5, partner.trust * 0.02),
        respect: Math.min(3, partner.respect * 0.01),
        intimacy: 0,
        conflict: Math.max(-2, -partner.conflict * 0.1)
      };
    });
    
    return impact;
  };

  const calculateAggressiveImpact = (choice: StoryChoice): any => {
    // Aggressive choices can yield high rewards but risk relationships
    const impact: any = {};
    
    aiPartners.forEach(partner => {
      const compatibilityFactor = partner.compatibility_score / 100;
      
      impact[partner.id] = {
        trust: compatibilityFactor > 0.7 ? 8 : -5,
        respect: compatibilityFactor > 0.6 ? 10 : -3,
        intimacy: compatibilityFactor > 0.8 ? 5 : 0,
        conflict: compatibilityFactor < 0.5 ? 8 : 2
      };
    });
    
    return impact;
  };

  const calculateBalancedImpact = (choice: StoryChoice): any => {
    // Balanced choices provide moderate, consistent gains
    const impact: any = {};
    
    aiPartners.forEach(partner => {
      impact[partner.id] = {
        trust: 3,
        respect: 4,
        intimacy: 2,
        conflict: -1
      };
    });
    
    return impact;
  };

  const calculatePersonalityAlignment = (choice: StoryChoice, approach: string): number => {
    let alignment = 0;
    
    personalityTraits.forEach(trait => {
      const traitValue = trait.value / 100;
      
      switch (approach) {
        case 'conservative':
          if (trait.name.toLowerCase().includes('cautious') || trait.name.toLowerCase().includes('analytical')) {
            alignment += traitValue * trait.influence_weight;
          }
          break;
        case 'aggressive':
          if (trait.name.toLowerCase().includes('bold') || trait.name.toLowerCase().includes('decisive')) {
            alignment += traitValue * trait.influence_weight;
          }
          break;
        case 'balanced':
          if (trait.name.toLowerCase().includes('diplomatic') || trait.name.toLowerCase().includes('adaptive')) {
            alignment += traitValue * trait.influence_weight;
          }
          break;
      }
    });
    
    return alignment;
  };

  const executeStoryChoice = async (choiceId: string, decision: string) => {
    try {
      const response = await fetch('/api/story/make-choice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          choiceId,
          decision,
          aiGenerated: true,
          decisionAccuracy: aiDecisionAccuracy
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        
        // Update decision history
        setDecisionHistory(prev => [...prev, {
          choiceId,
          decision,
          timestamp: new Date().toISOString(),
          outcome: result.outcome,
          accuracy: aiDecisionAccuracy
        }]);
        
        // Remove from pending choices
        setPendingChoices(prev => prev.filter(c => c.id !== choiceId));
        
        // Refresh personality data to reflect changes
        await fetchPersonalityData();
      }
    } catch (error) {
      console.error('Error executing story choice:', error);
    }
  };

  const getTraitColor = (value: number): string => {
    if (value >= 80) return 'text-green-400';
    if (value >= 60) return 'text-blue-400';
    if (value >= 40) return 'text-yellow-400';
    if (value >= 20) return 'text-orange-400';
    return 'text-red-400';
  };

  const getRelationshipStatus = (partner: AIPartner): string => {
    const avgScore = (partner.trust + partner.respect + partner.intimacy - partner.conflict) / 3;
    if (avgScore >= 80) return 'Excellent';
    if (avgScore >= 60) return 'Good';
    if (avgScore >= 40) return 'Neutral';
    if (avgScore >= 20) return 'Strained';
    return 'Poor';
  };

  if (loading) {
    return (
      <div className={`bg-gray-900 border border-purple-500/30 rounded-lg p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700 rounded mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-900 border border-purple-500/30 rounded-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Brain className="w-6 h-6 text-purple-400" />
          <h3 className="text-xl font-bold text-purple-400">Enhanced AI Personality</h3>
        </div>
        
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-2">
            <Target className="w-4 h-4 text-cyan-400" />
            <span className="text-gray-300">Decision Accuracy: {Math.round(aiDecisionAccuracy * 100)}%</span>
          </div>
          
          <div className={`px-3 py-1 rounded text-xs font-medium ${
            autoDecisionEnabled 
              ? 'bg-green-600 text-white' 
              : 'bg-gray-700 text-gray-300'
          }`}>
            {autoDecisionEnabled ? 'Auto-Decisions ON' : 'Manual Mode'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personality Traits */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-white flex items-center">
            <Zap className="w-5 h-5 mr-2 text-yellow-400" />
            Personality Traits
          </h4>
          
          <div className="space-y-3">
            {personalityTraits.map((trait) => (
              <div key={trait.id} className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-white">{trait.name}</span>
                  <span className={`font-bold ${getTraitColor(trait.value)}`}>
                    {trait.value}%
                  </span>
                </div>
                
                <div className="bg-gray-700 rounded-full h-2 mb-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-500 ${
                      trait.value >= 80 ? 'bg-green-500' :
                      trait.value >= 60 ? 'bg-blue-500' :
                      trait.value >= 40 ? 'bg-yellow-500' :
                      trait.value >= 20 ? 'bg-orange-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${trait.value}%` }}
                  ></div>
                </div>
                
                <p className="text-xs text-gray-400">{trait.description}</p>
                
                <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                  <span>Evolution Stage: {trait.evolution_stage}</span>
                  <span>Influence: {Math.round(trait.influence_weight * 100)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Partners */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-white flex items-center">
            <Users className="w-5 h-5 mr-2 text-blue-400" />
            AI Partner Relationships
          </h4>
          
          <div className="space-y-3">
            {aiPartners.map((partner) => (
              <div key={partner.id} className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h5 className="font-medium text-white">{partner.name}</h5>
                    <p className="text-xs text-gray-400">{partner.personality_type}</p>
                  </div>
                  
                  <div className="text-right">
                    <div className={`text-sm font-medium ${
                      getRelationshipStatus(partner) === 'Excellent' ? 'text-green-400' :
                      getRelationshipStatus(partner) === 'Good' ? 'text-blue-400' :
                      getRelationshipStatus(partner) === 'Neutral' ? 'text-yellow-400' :
                      getRelationshipStatus(partner) === 'Strained' ? 'text-orange-400' : 'text-red-400'
                    }`}>
                      {getRelationshipStatus(partner)}
                    </div>
                    <div className="text-xs text-gray-500">
                      Compatibility: {partner.compatibility_score}%
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Trust:</span>
                    <span className="text-cyan-400">{partner.trust}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Respect:</span>
                    <span className="text-green-400">{partner.respect}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Intimacy:</span>
                    <span className="text-pink-400">{partner.intimacy}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Conflict:</span>
                    <span className="text-red-400">{partner.conflict}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pending Decisions */}
      {pendingChoices.length > 0 && (
        <div className="mt-6">
          <h4 className="text-lg font-semibold text-white flex items-center mb-4">
            <MessageCircle className="w-5 h-5 mr-2 text-orange-400" />
            Pending Story Decisions ({pendingChoices.length})
          </h4>
          
          <div className="space-y-3">
            {pendingChoices.slice(0, 3).map((choice) => (
              <div key={choice.id} className="bg-gray-800 border border-orange-500/30 rounded-lg p-4">
                <p className="text-white mb-2">{choice.text}</p>
                
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>Risk Level: 
                    <span className={`ml-1 ${
                      choice.consequences.risk_level === 'low' ? 'text-green-400' :
                      choice.consequences.risk_level === 'medium' ? 'text-yellow-400' :
                      choice.consequences.risk_level === 'high' ? 'text-orange-400' : 'text-red-400'
                    }`}>
                      {choice.consequences.risk_level.toUpperCase()}
                    </span>
                  </span>
                  
                  <span>Narrative Weight: {choice.consequences.narrative_weight}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Decisions */}
      {decisionHistory.length > 0 && (
        <div className="mt-6">
          <h4 className="text-lg font-semibold text-white flex items-center mb-4">
            <TrendingUp className="w-5 h-5 mr-2 text-green-400" />
            Recent AI Decisions
          </h4>
          
          <div className="space-y-2">
            {decisionHistory.slice(-5).reverse().map((decision, index) => (
              <div key={index} className="bg-gray-800 rounded p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">
                    Decision made with {Math.round(decision.accuracy * 100)}% confidence
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(decision.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedAIPersonality;