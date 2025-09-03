import React, { useState, useEffect } from 'react';
import { Brain, Heart, Zap, Shield, Target, TrendingUp, Users, MessageCircle, Star, Lock, Unlock } from 'lucide-react';
import { useGameStore } from '../store/gameStore';

interface PersonalityTrait {
  id: string;
  name: string;
  category: 'cognitive' | 'emotional' | 'social' | 'behavioral';
  trait_type: 'strength' | 'weakness' | 'quirk' | 'skill';
  description: string;
  impact_description: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
  effects: {
    cooperation_bonus?: number;
    trust_modifier?: number;
    skill_bonuses?: { [key: string]: number };
    dialogue_options?: string[];
  };
}

interface PartnerPersonality {
  id: string;
  partner_id: string;
  name: string;
  archetype: string;
  personality_type: string;
  core_traits: string[];
  communication_style: string;
  trust_threshold: number;
  loyalty_factor: number;
  evolution_potential: number;
  backstory: string;
  motivations: string[];
  fears: string[];
  goals: string[];
  relationship_preferences: {
    preferred_interaction_style: string;
    conflict_resolution: string;
    intimacy_comfort: string;
  };
  skill_specializations: { [key: string]: number };
  is_active: boolean;
}

interface RelationshipDynamics {
  id: string;
  partner_id: string;
  trust_level: number;
  respect_level: number;
  intimacy_level: number;
  conflict_level: number;
  relationship_type: string;
  compatibility_score: number;
  shared_experiences: number;
  current_mood: string;
  last_interaction_at: string;
}

interface PartnerEvolution {
  id: string;
  partner_id: string;
  evolution_stage: number;
  experience_points: number;
  skill_improvements: { [key: string]: number };
  personality_shifts: { [key: string]: number };
  unlocked_abilities: string[];
  next_evolution_requirements: {
    experience_points: number;
    trust_level: number;
    shared_experiences: number;
  };
}

interface AIPersonalitySystemProps {
  partnerId?: string;
  showAllPartners?: boolean;
  className?: string;
}

export const AIPersonalitySystem: React.FC<AIPersonalitySystemProps> = ({
  partnerId,
  showAllPartners = false,
  className = ''
}) => {
  const [personalities, setPersonalities] = useState<PartnerPersonality[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<PartnerPersonality | null>(null);
  const [relationship, setRelationship] = useState<RelationshipDynamics | null>(null);
  const [evolution, setEvolution] = useState<PartnerEvolution | null>(null);
  const [traits, setTraits] = useState<PersonalityTrait[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'traits' | 'relationship' | 'evolution'>('overview');
  const [loading, setLoading] = useState(true);
  
  const { player } = useGameStore();
  const { level } = player;

  useEffect(() => {
    fetchPersonalityData();
  }, [partnerId, showAllPartners]);

  useEffect(() => {
    if (selectedPartner) {
      fetchRelationshipData(selectedPartner.partner_id);
      fetchEvolutionData(selectedPartner.partner_id);
    }
  }, [selectedPartner]);

  const fetchPersonalityData = async () => {
    try {
      setLoading(true);
      
      if (partnerId) {
        // Fetch specific partner
        const response = await fetch(`/api/ai-partners/personalities/${partnerId}`);
        const data = await response.json();
        if (data.personality) {
          setPersonalities([data.personality]);
          setSelectedPartner(data.personality);
        }
      } else if (showAllPartners) {
        // Fetch all partners
        const response = await fetch('/api/ai-partners/personalities');
        const data = await response.json();
        if (data.personalities) {
          setPersonalities(data.personalities);
          if (data.personalities.length > 0) {
            setSelectedPartner(data.personalities[0]);
          }
        }
      }
      
      // Fetch available traits
      const traitsResponse = await fetch('/api/ai-partners/traits');
      const traitsData = await traitsResponse.json();
      if (traitsData.traits) {
        setTraits(traitsData.traits);
      }
    } catch (error) {
      console.error('Error fetching personality data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRelationshipData = async (partnerIdToFetch: string) => {
    try {
      const response = await fetch(`/api/ai-partners/relationships/${partnerIdToFetch}`);
      const data = await response.json();
      if (data.relationship) {
        setRelationship(data.relationship);
      }
    } catch (error) {
      console.error('Error fetching relationship data:', error);
    }
  };

  const fetchEvolutionData = async (partnerIdToFetch: string) => {
    try {
      const response = await fetch(`/api/ai-partners/evolution/${partnerIdToFetch}`);
      const data = await response.json();
      if (data.evolution) {
        setEvolution(data.evolution);
      }
    } catch (error) {
      console.error('Error fetching evolution data:', error);
    }
  };

  const getTraitsByIds = (traitIds: string[]): PersonalityTrait[] => {
    return traits.filter(trait => traitIds.includes(trait.id));
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'cognitive': return Brain;
      case 'emotional': return Heart;
      case 'social': return Users;
      case 'behavioral': return Zap;
      default: return Star;
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'text-gray-400';
      case 'uncommon': return 'text-green-400';
      case 'rare': return 'text-blue-400';
      case 'legendary': return 'text-purple-400';
      default: return 'text-gray-400';
    }
  };

  const getRelationshipColor = (type: string) => {
    switch (type) {
      case 'romantic': return 'text-pink-400';
      case 'friendly': return 'text-green-400';
      case 'professional': return 'text-blue-400';
      case 'mentor': return 'text-yellow-400';
      case 'rival': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getMoodEmoji = (mood: string) => {
    switch (mood) {
      case 'happy': return '😊';
      case 'focused': return '🎯';
      case 'curious': return '🤔';
      case 'concerned': return '😟';
      case 'excited': return '🤩';
      case 'calm': return '😌';
      case 'frustrated': return '😤';
      default: return '😐';
    }
  };

  const calculateEvolutionProgress = () => {
    if (!evolution) return 0;
    
    const req = evolution.next_evolution_requirements;
    const expProgress = (evolution.experience_points / req.experience_points) * 100;
    const trustProgress = relationship ? (relationship.trust_level / req.trust_level) * 100 : 0;
    const experienceProgress = relationship ? (relationship.shared_experiences / req.shared_experiences) * 100 : 0;
    
    return Math.min((expProgress + trustProgress + experienceProgress) / 3, 100);
  };

  if (loading) {
    return (
      <div className={`bg-gray-900 border border-cyan-500/30 rounded-lg p-6 ${className}`}>
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
    <div className={`bg-gray-900 border border-cyan-500/30 rounded-lg ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-cyan-400">AI Personality System</h3>
          
          {showAllPartners && personalities.length > 1 && (
            <select
              value={selectedPartner?.partner_id || ''}
              onChange={(e) => {
                const partner = personalities.find(p => p.partner_id === e.target.value);
                setSelectedPartner(partner || null);
              }}
              className="bg-gray-800 border border-gray-600 rounded px-3 py-1 text-white"
            >
              {personalities.map(partner => (
                <option key={partner.partner_id} value={partner.partner_id}>
                  {partner.name}
                </option>
              ))}
            </select>
          )}
        </div>
        
        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-800 rounded-lg p-1">
          {[
            { id: 'overview', label: 'Overview', icon: Brain },
            { id: 'traits', label: 'Traits', icon: Star },
            { id: 'relationship', label: 'Relationship', icon: Heart },
            { id: 'evolution', label: 'Evolution', icon: TrendingUp }
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
        {!selectedPartner ? (
          <div className="text-center py-8 text-gray-500">
            <Brain className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No AI partner selected.</p>
          </div>
        ) : (
          <>
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-semibold text-white mb-1">{selectedPartner.name}</h4>
                      <p className="text-cyan-400 text-sm">{selectedPartner.archetype}</p>
                      <p className="text-gray-400 text-sm">{selectedPartner.personality_type}</p>
                    </div>
                    
                    {relationship && (
                      <div className="text-right">
                        <div className={`text-sm font-medium ${getRelationshipColor(relationship.relationship_type)}`}>
                          {relationship.relationship_type.charAt(0).toUpperCase() + relationship.relationship_type.slice(1)}
                        </div>
                        <div className="text-xs text-gray-400">
                          {getMoodEmoji(relationship.current_mood)} {relationship.current_mood}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <p className="text-gray-300 text-sm leading-relaxed mb-4">
                    {selectedPartner.backstory}
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <h5 className="text-sm font-medium text-cyan-400 mb-2">Motivations</h5>
                      <ul className="text-xs text-gray-300 space-y-1">
                        {selectedPartner.motivations.map((motivation, index) => (
                          <li key={index} className="flex items-start">
                            <Target className="w-3 h-3 text-cyan-400 mr-1 mt-0.5 flex-shrink-0" />
                            {motivation}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h5 className="text-sm font-medium text-yellow-400 mb-2">Goals</h5>
                      <ul className="text-xs text-gray-300 space-y-1">
                        {selectedPartner.goals.map((goal, index) => (
                          <li key={index} className="flex items-start">
                            <Star className="w-3 h-3 text-yellow-400 mr-1 mt-0.5 flex-shrink-0" />
                            {goal}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h5 className="text-sm font-medium text-red-400 mb-2">Fears</h5>
                      <ul className="text-xs text-gray-300 space-y-1">
                        {selectedPartner.fears.map((fear, index) => (
                          <li key={index} className="flex items-start">
                            <Shield className="w-3 h-3 text-red-400 mr-1 mt-0.5 flex-shrink-0" />
                            {fear}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
                
                {/* Communication Style */}
                <div className="bg-gray-800 rounded-lg p-4">
                  <h5 className="text-sm font-medium text-cyan-400 mb-3 flex items-center">
                    <MessageCircle className="w-4 h-4 mr-1" />
                    Communication & Preferences
                  </h5>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Style:</span>
                      <span className="text-white ml-2">{selectedPartner.communication_style}</span>
                    </div>
                    
                    <div>
                      <span className="text-gray-400">Trust Threshold:</span>
                      <span className="text-white ml-2">{selectedPartner.trust_threshold}%</span>
                    </div>
                    
                    <div>
                      <span className="text-gray-400">Interaction Style:</span>
                      <span className="text-white ml-2">{selectedPartner.relationship_preferences.preferred_interaction_style}</span>
                    </div>
                    
                    <div>
                      <span className="text-gray-400">Conflict Resolution:</span>
                      <span className="text-white ml-2">{selectedPartner.relationship_preferences.conflict_resolution}</span>
                    </div>
                  </div>
                </div>
                
                {/* Skills */}
                <div className="bg-gray-800 rounded-lg p-4">
                  <h5 className="text-sm font-medium text-cyan-400 mb-3">Skill Specializations</h5>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {Object.entries(selectedPartner.skill_specializations).map(([skill, level]) => (
                      <div key={skill} className="text-center">
                        <div className="text-xs text-gray-400 mb-1">{skill}</div>
                        <div className="bg-gray-700 rounded-full h-2 mb-1">
                          <div 
                            className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full"
                            style={{ width: `${level}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-white">{level}%</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Traits Tab */}
            {activeTab === 'traits' && (
              <div className="space-y-4">
                {getTraitsByIds(selectedPartner.core_traits).map(trait => {
                  const CategoryIcon = getCategoryIcon(trait.category);
                  return (
                    <div key={trait.id} className="bg-gray-800 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <CategoryIcon className="w-5 h-5 text-cyan-400" />
                          <div>
                            <h5 className="font-medium text-white">{trait.name}</h5>
                            <div className="flex items-center space-x-2 text-xs">
                              <span className="text-gray-400">{trait.category}</span>
                              <span className="text-gray-500">•</span>
                              <span className={getRarityColor(trait.rarity)}>{trait.rarity}</span>
                              <span className="text-gray-500">•</span>
                              <span className="text-gray-400">{trait.trait_type}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-gray-300 text-sm mb-3">{trait.description}</p>
                      <p className="text-cyan-400 text-xs">{trait.impact_description}</p>
                      
                      {trait.effects && (
                        <div className="mt-3 pt-3 border-t border-gray-700">
                          <div className="text-xs text-gray-400 space-y-1">
                            {trait.effects.cooperation_bonus && (
                              <div>Cooperation: +{trait.effects.cooperation_bonus}%</div>
                            )}
                            {trait.effects.trust_modifier && (
                              <div>Trust Modifier: {trait.effects.trust_modifier > 0 ? '+' : ''}{trait.effects.trust_modifier}%</div>
                            )}
                            {trait.effects.skill_bonuses && Object.entries(trait.effects.skill_bonuses).map(([skill, bonus]) => (
                              <div key={skill}>{skill}: +{bonus}%</div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Relationship Tab */}
            {activeTab === 'relationship' && relationship && (
              <div className="space-y-6">
                {/* Relationship Levels */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Trust', value: relationship.trust_level, color: 'cyan' },
                    { label: 'Respect', value: relationship.respect_level, color: 'blue' },
                    { label: 'Intimacy', value: relationship.intimacy_level, color: 'pink' },
                    { label: 'Conflict', value: relationship.conflict_level, color: 'red', invert: true }
                  ].map(metric => (
                    <div key={metric.label} className="bg-gray-800 rounded-lg p-4 text-center">
                      <div className="text-sm text-gray-400 mb-2">{metric.label}</div>
                      <div className="text-2xl font-bold text-white mb-2">{metric.value}%</div>
                      <div className="bg-gray-700 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full bg-gradient-to-r ${
                            metric.color === 'cyan' ? 'from-cyan-500 to-cyan-400' :
                            metric.color === 'blue' ? 'from-blue-500 to-blue-400' :
                            metric.color === 'pink' ? 'from-pink-500 to-pink-400' :
                            'from-red-500 to-red-400'
                          }`}
                          style={{ width: `${metric.invert ? 100 - metric.value : metric.value}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Compatibility Score */}
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="text-sm font-medium text-cyan-400">Compatibility Score</h5>
                    <span className="text-2xl font-bold text-white">{relationship.compatibility_score.toFixed(1)}%</span>
                  </div>
                  
                  <div className="bg-gray-700 rounded-full h-3 mb-3">
                    <div 
                      className="bg-gradient-to-r from-cyan-500 to-blue-500 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${relationship.compatibility_score}%` }}
                    ></div>
                  </div>
                  
                  <div className="text-xs text-gray-400">
                    Based on {relationship.shared_experiences} shared experiences
                  </div>
                </div>
                
                {/* Recent Activity */}
                <div className="bg-gray-800 rounded-lg p-4">
                  <h5 className="text-sm font-medium text-cyan-400 mb-3">Relationship Status</h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Type:</span>
                      <span className={`font-medium ${getRelationshipColor(relationship.relationship_type)}`}>
                        {relationship.relationship_type.charAt(0).toUpperCase() + relationship.relationship_type.slice(1)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-400">Current Mood:</span>
                      <span className="text-white">
                        {getMoodEmoji(relationship.current_mood)} {relationship.current_mood}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-400">Last Interaction:</span>
                      <span className="text-white">
                        {new Date(relationship.last_interaction_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Evolution Tab */}
            {activeTab === 'evolution' && evolution && (
              <div className="space-y-6">
                {/* Evolution Progress */}
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h5 className="text-sm font-medium text-cyan-400">Evolution Stage {evolution.evolution_stage}</h5>
                    <span className="text-sm text-gray-400">{calculateEvolutionProgress().toFixed(1)}% to next stage</span>
                  </div>
                  
                  <div className="bg-gray-700 rounded-full h-3 mb-4">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${calculateEvolutionProgress()}%` }}
                    ></div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Experience:</span>
                      <div className="text-white">
                        {evolution.experience_points} / {evolution.next_evolution_requirements.experience_points}
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-gray-400">Trust Required:</span>
                      <div className="text-white">
                        {relationship?.trust_level || 0} / {evolution.next_evolution_requirements.trust_level}
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-gray-400">Shared Experiences:</span>
                      <div className="text-white">
                        {relationship?.shared_experiences || 0} / {evolution.next_evolution_requirements.shared_experiences}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Skill Improvements */}
                {Object.keys(evolution.skill_improvements).length > 0 && (
                  <div className="bg-gray-800 rounded-lg p-4">
                    <h5 className="text-sm font-medium text-cyan-400 mb-3">Skill Improvements</h5>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {Object.entries(evolution.skill_improvements).map(([skill, improvement]) => (
                        <div key={skill} className="text-center">
                          <div className="text-xs text-gray-400 mb-1">{skill}</div>
                          <div className="text-sm font-medium text-green-400">+{improvement}%</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Unlocked Abilities */}
                {evolution.unlocked_abilities.length > 0 && (
                  <div className="bg-gray-800 rounded-lg p-4">
                    <h5 className="text-sm font-medium text-cyan-400 mb-3">Unlocked Abilities</h5>
                    <div className="flex flex-wrap gap-2">
                      {evolution.unlocked_abilities.map(ability => (
                        <span key={ability} className="px-3 py-1 bg-purple-600/20 border border-purple-500/30 rounded-full text-xs text-purple-400">
                          <Unlock className="w-3 h-3 inline mr-1" />
                          {ability}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Personality Shifts */}
                {Object.keys(evolution.personality_shifts).length > 0 && (
                  <div className="bg-gray-800 rounded-lg p-4">
                    <h5 className="text-sm font-medium text-cyan-400 mb-3">Personality Evolution</h5>
                    <div className="space-y-2">
                      {Object.entries(evolution.personality_shifts).map(([trait, shift]) => (
                        <div key={trait} className="flex justify-between items-center">
                          <span className="text-gray-300 text-sm">{trait}</span>
                          <span className={`text-sm font-medium ${
                            shift > 0 ? 'text-green-400' : shift < 0 ? 'text-red-400' : 'text-gray-400'
                          }`}>
                            {shift > 0 ? '+' : ''}{shift}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AIPersonalitySystem;