import React, { useState, useEffect } from 'react';
import { Users, MessageCircle, Zap, Target, Clock, Star, Shield, Code, Wifi, AlertTriangle } from 'lucide-react';

interface AIPartner {
  id: string;
  name: string;
  specialization: 'hacking' | 'social_engineering' | 'physical_security' | 'intelligence' | 'support';
  personality_type: 'analytical' | 'aggressive' | 'cautious' | 'creative' | 'loyal';
  skill_level: number;
  trust_level: number;
  availability_status: 'available' | 'busy' | 'offline' | 'mission';
  current_mission?: string;
  last_active: string;
  avatar_color: string;
}

interface PartnerRelationship {
  partner_id: string;
  relationship_level: number;
  trust_points: number;
  cooperation_bonus: number;
  shared_missions: number;
  last_interaction: string;
}

interface CooperationMission {
  id: string;
  title: string;
  description: string;
  mission_type: 'coordinated_hack' | 'intelligence_gathering' | 'social_infiltration' | 'security_bypass';
  required_partners: number;
  difficulty_level: number;
  estimated_duration: number;
  reward_credits: number;
  success_probability: number;
  partner_requirements: {
    specializations: string[];
    min_skill_level: number;
    min_trust_level: number;
  };
  is_active: boolean;
}

interface PartnerCoordinationHubProps {
  partners: AIPartner[];
  relationships: PartnerRelationship[];
  availableMissions: CooperationMission[];
  activeMissions: CooperationMission[];
  onStartMission: (missionId: string, partnerIds: string[]) => Promise<void>;
  onSendMessage: (partnerId: string, message: string) => Promise<void>;
  onImproveRelationship: (partnerId: string, action: string) => Promise<void>;
  isLoading?: boolean;
}

const PartnerCoordinationHub: React.FC<PartnerCoordinationHubProps> = ({
  partners,
  relationships,
  availableMissions,
  activeMissions,
  onStartMission,
  onSendMessage,
  onImproveRelationship,
  isLoading = false
}) => {
  const [selectedTab, setSelectedTab] = useState<'partners' | 'missions' | 'active'>('partners');
  const [selectedPartner, setSelectedPartner] = useState<AIPartner | null>(null);
  const [selectedMission, setSelectedMission] = useState<CooperationMission | null>(null);
  const [selectedPartners, setSelectedPartners] = useState<string[]>([]);
  const [messageText, setMessageText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const specializationIcons = {
    hacking: <Code className="w-4 h-4" />,
    social_engineering: <MessageCircle className="w-4 h-4" />,
    physical_security: <Shield className="w-4 h-4" />,
    intelligence: <Target className="w-4 h-4" />,
    support: <Wifi className="w-4 h-4" />
  };

  const specializationColors = {
    hacking: 'text-green-400 border-green-500/30 bg-green-900/20',
    social_engineering: 'text-blue-400 border-blue-500/30 bg-blue-900/20',
    physical_security: 'text-red-400 border-red-500/30 bg-red-900/20',
    intelligence: 'text-purple-400 border-purple-500/30 bg-purple-900/20',
    support: 'text-yellow-400 border-yellow-500/30 bg-yellow-900/20'
  };

  const personalityTraits = {
    analytical: { icon: '🤖', description: 'Methodical and precise' },
    aggressive: { icon: '⚡', description: 'Bold and direct' },
    cautious: { icon: '🛡️', description: 'Careful and thorough' },
    creative: { icon: '🎨', description: 'Innovative and adaptive' },
    loyal: { icon: '🤝', description: 'Trustworthy and reliable' }
  };

  const getPartnerRelationship = (partnerId: string) => {
    return relationships.find(rel => rel.partner_id === partnerId);
  };

  const getAvailabilityColor = (status: string) => {
    switch (status) {
      case 'available': return 'text-green-400';
      case 'busy': return 'text-yellow-400';
      case 'offline': return 'text-gray-400';
      case 'mission': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  const canStartMission = (mission: CooperationMission) => {
    if (selectedPartners.length < mission.required_partners) return false;
    
    const selectedPartnerObjects = partners.filter(p => selectedPartners.includes(p.id));
    
    // Check specialization requirements
    const hasRequiredSpecs = mission.partner_requirements.specializations.every(spec => 
      selectedPartnerObjects.some(p => p.specialization === spec)
    );
    
    // Check skill and trust levels
    const meetsSkillReq = selectedPartnerObjects.every(p => 
      p.skill_level >= mission.partner_requirements.min_skill_level
    );
    
    const meetsTrustReq = selectedPartnerObjects.every(p => {
      const rel = getPartnerRelationship(p.id);
      return rel && rel.trust_points >= mission.partner_requirements.min_trust_level;
    });
    
    return hasRequiredSpecs && meetsSkillReq && meetsTrustReq;
  };

  const handleStartMission = async (missionId: string) => {
    if (!canStartMission(selectedMission!) || isProcessing) return;
    
    setIsProcessing(true);
    try {
      await onStartMission(missionId, selectedPartners);
      setSelectedMission(null);
      setSelectedPartners([]);
    } catch (error) {
      console.error('Error starting mission:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendMessage = async (partnerId: string) => {
    if (!messageText.trim() || isProcessing) return;
    
    setIsProcessing(true);
    try {
      await onSendMessage(partnerId, messageText);
      setMessageText('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImproveRelationship = async (partnerId: string, action: string) => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    try {
      await onImproveRelationship(partnerId, action);
    } catch (error) {
      console.error('Error improving relationship:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-gray-900 border border-cyan-500/30 rounded-lg shadow-xl">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-900/50 to-blue-900/50 p-4 border-b border-cyan-500/30">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-cyan-400 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Partner Coordination Hub
          </h2>
          <div className="text-sm text-gray-400">
            {partners.filter(p => p.availability_status === 'available').length} Available Partners
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1">
          {[
            { key: 'partners', label: 'AI Partners', count: partners.length },
            { key: 'missions', label: 'Cooperation Missions', count: availableMissions.length },
            { key: 'active', label: 'Active Operations', count: activeMissions.length }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setSelectedTab(tab.key as any)}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                ${
                  selectedTab === tab.key
                    ? 'bg-cyan-600 text-white shadow-lg'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }
              `}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 max-h-96 overflow-y-auto">
        {selectedTab === 'partners' && (
          <div className="space-y-3">
            {partners.map(partner => {
              const relationship = getPartnerRelationship(partner.id);
              const personality = personalityTraits[partner.personality_type];
              
              return (
                <div
                  key={partner.id}
                  className="border border-gray-600 rounded-lg p-4 hover:border-cyan-500/50 transition-colors cursor-pointer"
                  onClick={() => setSelectedPartner(partner)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      {/* Avatar */}
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                        style={{ backgroundColor: partner.avatar_color }}
                      >
                        {partner.name.charAt(0)}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-white">{partner.name}</h3>
                          <span className="text-lg">{personality.icon}</span>
                          <span className={`text-sm ${getAvailabilityColor(partner.availability_status)}`}>
                            {partner.availability_status.toUpperCase()}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`px-2 py-1 rounded border text-xs ${specializationColors[partner.specialization]}`}>
                            {specializationIcons[partner.specialization]}
                            <span className="ml-1 capitalize">{partner.specialization.replace('_', ' ')}</span>
                          </div>
                          <span className="text-xs text-gray-400">{personality.description}</span>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-yellow-400" />
                            <span className="text-gray-300">Skill: {partner.skill_level}/10</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Shield className="w-3 h-3 text-blue-400" />
                            <span className="text-gray-300">Trust: {partner.trust_level}/10</span>
                          </div>
                          {relationship && (
                            <div className="flex items-center gap-1">
                              <Zap className="w-3 h-3 text-green-400" />
                              <span className="text-gray-300">Bonus: +{relationship.cooperation_bonus}%</span>
                            </div>
                          )}
                        </div>
                        
                        {partner.current_mission && (
                          <div className="mt-2 text-xs text-blue-400">
                            Current Mission: {partner.current_mission}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPartner(partner);
                        }}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
                      >
                        Communicate
                      </button>
                      
                      {relationship && relationship.trust_points < 100 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleImproveRelationship(partner.id, 'gift');
                          }}
                          disabled={isProcessing}
                          className="px-3 py-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white text-xs rounded transition-colors"
                        >
                          Improve Trust
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {selectedTab === 'missions' && (
          <div className="space-y-3">
            {availableMissions.map(mission => {
              const isSelected = selectedMission?.id === mission.id;
              
              return (
                <div
                  key={mission.id}
                  className={`
                    border rounded-lg p-4 cursor-pointer transition-all duration-200
                    ${
                      isSelected
                        ? 'border-cyan-400 bg-cyan-900/20'
                        : 'border-gray-600 hover:border-cyan-500/50'
                    }
                  `}
                  onClick={() => setSelectedMission(mission)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-medium text-white mb-1">{mission.title}</h3>
                      <p className="text-sm text-gray-400 mb-2">{mission.description}</p>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-300 mb-2">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {mission.required_partners} Partners
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {mission.estimated_duration}h
                        </span>
                        <span className="flex items-center gap-1">
                          <Zap className="w-3 h-3" />
                          {mission.reward_credits.toLocaleString()} credits
                        </span>
                        <span className="text-green-400">
                          {mission.success_probability}% success
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap gap-1">
                        {mission.partner_requirements.specializations.map(spec => (
                          <span
                            key={spec}
                            className={`px-2 py-1 rounded text-xs border ${specializationColors[spec as keyof typeof specializationColors]}`}
                          >
                            {spec.replace('_', ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-sm text-gray-400 mb-1">
                        Difficulty: {mission.difficulty_level}/10
                      </div>
                      <div className="text-xs text-gray-500">
                        Min Skill: {mission.partner_requirements.min_skill_level}
                      </div>
                      <div className="text-xs text-gray-500">
                        Min Trust: {mission.partner_requirements.min_trust_level}
                      </div>
                    </div>
                  </div>
                  
                  {isSelected && (
                    <div className="border-t border-gray-700 pt-3 mt-3">
                      <h4 className="text-sm font-medium text-white mb-2">Select Partners:</h4>
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        {partners
                          .filter(p => p.availability_status === 'available')
                          .map(partner => {
                            const isPartnerSelected = selectedPartners.includes(partner.id);
                            const relationship = getPartnerRelationship(partner.id);
                            const meetsRequirements = 
                              partner.skill_level >= mission.partner_requirements.min_skill_level &&
                              relationship && relationship.trust_points >= mission.partner_requirements.min_trust_level;
                            
                            return (
                              <button
                                key={partner.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (isPartnerSelected) {
                                    setSelectedPartners(prev => prev.filter(id => id !== partner.id));
                                  } else if (meetsRequirements) {
                                    setSelectedPartners(prev => [...prev, partner.id]);
                                  }
                                }}
                                disabled={!meetsRequirements}
                                className={`
                                  p-2 rounded text-xs border transition-colors text-left
                                  ${
                                    isPartnerSelected
                                      ? 'border-cyan-400 bg-cyan-900/30 text-cyan-300'
                                      : meetsRequirements
                                      ? 'border-gray-600 hover:border-gray-500 text-gray-300'
                                      : 'border-gray-700 text-gray-500 cursor-not-allowed'
                                  }
                                `}
                              >
                                <div className="flex items-center gap-2">
                                  <div 
                                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                                    style={{ backgroundColor: partner.avatar_color }}
                                  >
                                    {partner.name.charAt(0)}
                                  </div>
                                  <div>
                                    <div className="font-medium">{partner.name}</div>
                                    <div className="text-xs opacity-75">
                                      {partner.specialization.replace('_', ' ')}
                                    </div>
                                  </div>
                                </div>
                              </button>
                            );
                          })
                        }
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-400">
                          Selected: {selectedPartners.length}/{mission.required_partners}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartMission(mission.id);
                          }}
                          disabled={!canStartMission(mission) || isProcessing}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white text-sm rounded transition-colors"
                        >
                          {isProcessing ? 'Starting...' : 'Start Mission'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            
            {availableMissions.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <Target className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No cooperation missions available</p>
              </div>
            )}
          </div>
        )}

        {selectedTab === 'active' && (
          <div className="space-y-3">
            {activeMissions.map(mission => (
              <div
                key={mission.id}
                className="border border-blue-500/30 bg-blue-900/10 rounded-lg p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-white mb-1">{mission.title}</h3>
                    <p className="text-sm text-gray-400 mb-2">{mission.description}</p>
                    
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-blue-400">
                        Duration: {mission.estimated_duration}h
                      </span>
                      <span className="text-green-400">
                        Success Rate: {mission.success_probability}%
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-blue-400">
                    <div className="animate-spin w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full" />
                    <span className="text-sm">In Progress</span>
                  </div>
                </div>
              </div>
            ))}
            
            {activeMissions.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <AlertTriangle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No active operations</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Partner Communication Modal */}
      {selectedPartner && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-cyan-500/30 rounded-lg shadow-2xl max-w-md w-full">
            <div className="bg-gradient-to-r from-cyan-900/50 to-blue-900/50 p-4 border-b border-cyan-500/30">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-cyan-400">
                  Communicate with {selectedPartner.name}
                </h3>
                <button
                  onClick={() => setSelectedPartner(null)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="p-4">
              <div className="mb-4">
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Type your message..."
                  className="w-full h-24 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-cyan-500 focus:outline-none resize-none"
                />
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => handleSendMessage(selectedPartner.id)}
                  disabled={!messageText.trim() || isProcessing}
                  className="flex-1 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 text-white rounded transition-colors"
                >
                  {isProcessing ? 'Sending...' : 'Send Message'}
                </button>
                <button
                  onClick={() => setSelectedPartner(null)}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PartnerCoordinationHub;