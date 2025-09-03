import React, { useState, useEffect } from 'react';
import { Heart, Users, MessageCircle, TrendingUp, TrendingDown, AlertTriangle, Star, Clock, Target, Zap, Shield } from 'lucide-react';
import { useGameStore } from '../store/gameStore';

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
  interaction_frequency: number;
  emotional_state: {
    happiness: number;
    stress: number;
    excitement: number;
    concern: number;
  };
  relationship_milestones: {
    first_meeting: string;
    trust_established: string;
    deep_conversation: string;
    conflict_resolved: string;
    partnership_formed: string;
  };
}

interface PartnerInteraction {
  id: string;
  partner_id: string;
  interaction_type: string;
  context: string;
  player_choice: string;
  partner_response: string;
  relationship_impact: {
    trust_change: number;
    respect_change: number;
    intimacy_change: number;
    conflict_change: number;
  };
  mood_impact: string;
  timestamp: string;
  success_rating: number;
}

interface RelationshipEvent {
  id: string;
  partner_id: string;
  event_type: 'milestone' | 'conflict' | 'bonding' | 'challenge' | 'achievement';
  title: string;
  description: string;
  impact_summary: string;
  timestamp: string;
  significance: 'low' | 'medium' | 'high' | 'critical';
}

interface RelationshipDynamicsPanelProps {
  partnerId: string;
  className?: string;
}

export const RelationshipDynamicsPanel: React.FC<RelationshipDynamicsPanelProps> = ({
  partnerId,
  className = ''
}) => {
  const [relationship, setRelationship] = useState<RelationshipDynamics | null>(null);
  const [interactions, setInteractions] = useState<PartnerInteraction[]>([]);
  const [events, setEvents] = useState<RelationshipEvent[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'interactions' | 'history' | 'insights'>('overview');
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month' | 'all'>('week');
  
  const { player } = useGameStore();
  const { level, credits } = player;

  useEffect(() => {
    if (partnerId) {
      fetchRelationshipData();
      fetchInteractionHistory();
      fetchRelationshipEvents();
    }
  }, [partnerId, timeRange]);

  const fetchRelationshipData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/ai-partners/relationships/${partnerId}`);
      const data = await response.json();
      if (data.relationship) {
        setRelationship(data.relationship);
      }
    } catch (error) {
      console.error('Error fetching relationship data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInteractionHistory = async () => {
    try {
      const response = await fetch(`/api/ai-partners/interactions/${partnerId}?timeRange=${timeRange}`);
      const data = await response.json();
      if (data.interactions) {
        setInteractions(data.interactions);
      }
    } catch (error) {
      console.error('Error fetching interaction history:', error);
    }
  };

  const fetchRelationshipEvents = async () => {
    try {
      const response = await fetch(`/api/ai-partners/relationships/${partnerId}/events?timeRange=${timeRange}`);
      const data = await response.json();
      if (data.events) {
        setEvents(data.events);
      }
    } catch (error) {
      console.error('Error fetching relationship events:', error);
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
      case 'disappointed': return '😞';
      case 'proud': return '😌';
      case 'anxious': return '😰';
      default: return '😐';
    }
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'milestone': return Star;
      case 'conflict': return AlertTriangle;
      case 'bonding': return Heart;
      case 'challenge': return Target;
      case 'achievement': return TrendingUp;
      default: return MessageCircle;
    }
  };

  const getEventColor = (eventType: string) => {
    switch (eventType) {
      case 'milestone': return 'text-yellow-400';
      case 'conflict': return 'text-red-400';
      case 'bonding': return 'text-pink-400';
      case 'challenge': return 'text-orange-400';
      case 'achievement': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  const getSignificanceColor = (significance: string) => {
    switch (significance) {
      case 'critical': return 'border-red-500 bg-red-500/10';
      case 'high': return 'border-orange-500 bg-orange-500/10';
      case 'medium': return 'border-yellow-500 bg-yellow-500/10';
      case 'low': return 'border-gray-500 bg-gray-500/10';
      default: return 'border-gray-600 bg-gray-600/10';
    }
  };

  const calculateRelationshipTrend = () => {
    if (interactions.length < 2) return 0;
    
    const recent = interactions.slice(0, 5);
    const older = interactions.slice(5, 10);
    
    const recentAvg = recent.reduce((sum, int) => sum + int.success_rating, 0) / recent.length;
    const olderAvg = older.length > 0 ? older.reduce((sum, int) => sum + int.success_rating, 0) / older.length : recentAvg;
    
    return recentAvg - olderAvg;
  };

  const getInteractionTypeColor = (type: string) => {
    switch (type) {
      case 'conversation': return 'text-blue-400';
      case 'cooperation': return 'text-green-400';
      case 'conflict': return 'text-red-400';
      case 'support': return 'text-cyan-400';
      case 'challenge': return 'text-orange-400';
      case 'intimate': return 'text-pink-400';
      default: return 'text-gray-400';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return time.toLocaleDateString();
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

  if (!relationship) {
    return (
      <div className={`bg-gray-900 border border-cyan-500/30 rounded-lg p-6 ${className}`}>
        <div className="text-center py-8 text-gray-500">
          <Heart className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No relationship data available.</p>
        </div>
      </div>
    );
  }

  const relationshipTrend = calculateRelationshipTrend();

  return (
    <div className={`bg-gray-900 border border-cyan-500/30 rounded-lg ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-cyan-400">Relationship Dynamics</h3>
          
          <div className="flex items-center space-x-3">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="bg-gray-800 border border-gray-600 rounded px-3 py-1 text-white text-sm"
            >
              <option value="day">Last Day</option>
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="all">All Time</option>
            </select>
            
            <div className="flex items-center space-x-1 text-sm">
              {relationshipTrend > 0 ? (
                <TrendingUp className="w-4 h-4 text-green-400" />
              ) : relationshipTrend < 0 ? (
                <TrendingDown className="w-4 h-4 text-red-400" />
              ) : (
                <div className="w-4 h-4" />
              )}
              <span className={relationshipTrend > 0 ? 'text-green-400' : relationshipTrend < 0 ? 'text-red-400' : 'text-gray-400'}>
                {relationshipTrend > 0 ? 'Improving' : relationshipTrend < 0 ? 'Declining' : 'Stable'}
              </span>
            </div>
          </div>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-800 rounded-lg p-1">
          {[
            { id: 'overview', label: 'Overview', icon: Heart },
            { id: 'interactions', label: 'Interactions', icon: MessageCircle },
            { id: 'history', label: 'History', icon: Clock },
            { id: 'insights', label: 'Insights', icon: TrendingUp }
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
            {/* Relationship Status */}
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-white">Current Status</h4>
                <div className="flex items-center space-x-2">
                  <span className={`text-sm font-medium ${getRelationshipColor(relationship.relationship_type)}`}>
                    {relationship.relationship_type.charAt(0).toUpperCase() + relationship.relationship_type.slice(1)}
                  </span>
                  <span className="text-gray-400">•</span>
                  <span className="text-sm text-white">
                    {getMoodEmoji(relationship.current_mood)} {relationship.current_mood}
                  </span>
                </div>
              </div>
              
              {/* Relationship Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Trust', value: relationship.trust_level, color: 'cyan', icon: Shield },
                  { label: 'Respect', value: relationship.respect_level, color: 'blue', icon: Star },
                  { label: 'Intimacy', value: relationship.intimacy_level, color: 'pink', icon: Heart },
                  { label: 'Conflict', value: relationship.conflict_level, color: 'red', icon: AlertTriangle, invert: true }
                ].map(metric => {
                  const Icon = metric.icon;
                  return (
                    <div key={metric.label} className="text-center">
                      <div className="flex items-center justify-center mb-2">
                        <Icon className={`w-4 h-4 mr-1 ${
                          metric.color === 'cyan' ? 'text-cyan-400' :
                          metric.color === 'blue' ? 'text-blue-400' :
                          metric.color === 'pink' ? 'text-pink-400' :
                          'text-red-400'
                        }`} />
                        <span className="text-sm text-gray-400">{metric.label}</span>
                      </div>
                      <div className="text-xl font-bold text-white mb-2">{metric.value}%</div>
                      <div className="bg-gray-700 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-500 ${
                            metric.color === 'cyan' ? 'bg-gradient-to-r from-cyan-500 to-cyan-400' :
                            metric.color === 'blue' ? 'bg-gradient-to-r from-blue-500 to-blue-400' :
                            metric.color === 'pink' ? 'bg-gradient-to-r from-pink-500 to-pink-400' :
                            'bg-gradient-to-r from-red-500 to-red-400'
                          }`}
                          style={{ width: `${metric.invert ? 100 - metric.value : metric.value}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Emotional State */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h5 className="text-sm font-medium text-cyan-400 mb-3">Emotional State</h5>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(relationship.emotional_state).map(([emotion, level]) => (
                  <div key={emotion} className="text-center">
                    <div className="text-xs text-gray-400 mb-1 capitalize">{emotion}</div>
                    <div className="text-sm font-medium text-white mb-1">{level}%</div>
                    <div className="bg-gray-700 rounded-full h-1.5">
                      <div 
                        className={`h-1.5 rounded-full transition-all duration-500 ${
                          emotion === 'happiness' ? 'bg-green-400' :
                          emotion === 'stress' ? 'bg-red-400' :
                          emotion === 'excitement' ? 'bg-yellow-400' :
                          'bg-orange-400'
                        }`}
                        style={{ width: `${level}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Compatibility & Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-800 rounded-lg p-4">
                <h5 className="text-sm font-medium text-cyan-400 mb-3">Compatibility</h5>
                <div className="text-center">
                  <div className="text-3xl font-bold text-white mb-2">{relationship.compatibility_score.toFixed(1)}%</div>
                  <div className="bg-gray-700 rounded-full h-3 mb-2">
                    <div 
                      className="bg-gradient-to-r from-cyan-500 to-blue-500 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${relationship.compatibility_score}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-400">
                    Based on {relationship.shared_experiences} shared experiences
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-800 rounded-lg p-4">
                <h5 className="text-sm font-medium text-cyan-400 mb-3">Activity</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Interactions:</span>
                    <span className="text-white">{interactions.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Frequency:</span>
                    <span className="text-white">{relationship.interaction_frequency}/day</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Last Contact:</span>
                    <span className="text-white">{formatTimeAgo(relationship.last_interaction_at)}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Relationship Milestones */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h5 className="text-sm font-medium text-cyan-400 mb-3">Milestones</h5>
              <div className="space-y-2">
                {Object.entries(relationship.relationship_milestones)
                  .filter(([_, date]) => date)
                  .map(([milestone, date]) => (
                    <div key={milestone} className="flex items-center justify-between text-sm">
                      <span className="text-gray-300 capitalize">{milestone.replace('_', ' ')}</span>
                      <span className="text-gray-400">{new Date(date).toLocaleDateString()}</span>
                    </div>
                  ))
                }
              </div>
            </div>
          </div>
        )}

        {/* Interactions Tab */}
        {activeTab === 'interactions' && (
          <div className="space-y-4">
            {interactions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No interactions in the selected time range.</p>
              </div>
            ) : (
              interactions.map(interaction => (
                <div key={interaction.id} className="bg-gray-800 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${
                        interaction.success_rating >= 80 ? 'bg-green-400' :
                        interaction.success_rating >= 60 ? 'bg-yellow-400' :
                        interaction.success_rating >= 40 ? 'bg-orange-400' :
                        'bg-red-400'
                      }`}></div>
                      <div>
                        <h6 className={`font-medium ${getInteractionTypeColor(interaction.interaction_type)}`}>
                          {interaction.interaction_type.charAt(0).toUpperCase() + interaction.interaction_type.slice(1)}
                        </h6>
                        <p className="text-xs text-gray-400">{interaction.context}</p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-xs text-gray-400">{formatTimeAgo(interaction.timestamp)}</div>
                      <div className="text-xs text-white">{interaction.success_rating}% success</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-400">Your choice:</span>
                      <p className="text-gray-300 mt-1">{interaction.player_choice}</p>
                    </div>
                    
                    <div>
                      <span className="text-gray-400">Partner response:</span>
                      <p className="text-gray-300 mt-1">{interaction.partner_response}</p>
                    </div>
                    
                    {/* Impact Summary */}
                    <div className="pt-2 border-t border-gray-700">
                      <div className="flex flex-wrap gap-2 text-xs">
                        {Object.entries(interaction.relationship_impact)
                          .filter(([_, change]) => change !== 0)
                          .map(([metric, change]) => (
                            <span key={metric} className={`px-2 py-1 rounded ${
                              change > 0 ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'
                            }`}>
                              {metric.replace('_', ' ')}: {change > 0 ? '+' : ''}{change}
                            </span>
                          ))
                        }
                        {interaction.mood_impact && (
                          <span className="px-2 py-1 rounded bg-blue-600/20 text-blue-400">
                            Mood: {interaction.mood_impact}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            {events.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No events in the selected time range.</p>
              </div>
            ) : (
              events.map(event => {
                const EventIcon = getEventIcon(event.event_type);
                return (
                  <div key={event.id} className={`rounded-lg p-4 border ${getSignificanceColor(event.significance)}`}>
                    <div className="flex items-start space-x-3">
                      <EventIcon className={`w-5 h-5 mt-0.5 ${getEventColor(event.event_type)}`} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h6 className="font-medium text-white">{event.title}</h6>
                          <div className="flex items-center space-x-2 text-xs text-gray-400">
                            <span className="capitalize">{event.significance}</span>
                            <span>•</span>
                            <span>{formatTimeAgo(event.timestamp)}</span>
                          </div>
                        </div>
                        
                        <p className="text-gray-300 text-sm mb-2">{event.description}</p>
                        <p className="text-cyan-400 text-xs">{event.impact_summary}</p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Insights Tab */}
        {activeTab === 'insights' && (
          <div className="space-y-6">
            {/* Relationship Trends */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h5 className="text-sm font-medium text-cyan-400 mb-3">Relationship Trends</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Overall Trend:</span>
                    <div className="flex items-center space-x-1">
                      {relationshipTrend > 0 ? (
                        <TrendingUp className="w-4 h-4 text-green-400" />
                      ) : relationshipTrend < 0 ? (
                        <TrendingDown className="w-4 h-4 text-red-400" />
                      ) : (
                        <div className="w-4 h-4" />
                      )}
                      <span className={`text-sm ${
                        relationshipTrend > 0 ? 'text-green-400' : 
                        relationshipTrend < 0 ? 'text-red-400' : 'text-gray-400'
                      }`}>
                        {relationshipTrend > 0 ? 'Improving' : relationshipTrend < 0 ? 'Declining' : 'Stable'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Interaction Quality:</span>
                    <span className="text-white text-sm">
                      {interactions.length > 0 
                        ? (interactions.reduce((sum, int) => sum + int.success_rating, 0) / interactions.length).toFixed(1)
                        : 0
                      }% avg
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Communication Style:</span>
                    <span className="text-white text-sm">
                      {interactions.length > 0 
                        ? Object.entries(
                            interactions.reduce((acc, int) => {
                              acc[int.interaction_type] = (acc[int.interaction_type] || 0) + 1;
                              return acc;
                            }, {} as Record<string, number>)
                          ).sort(([,a], [,b]) => b - a)[0]?.[0] || 'None'
                        : 'None'
                      }
                    </span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Conflict Resolution:</span>
                    <span className={`text-sm ${
                      relationship.conflict_level < 20 ? 'text-green-400' :
                      relationship.conflict_level < 50 ? 'text-yellow-400' :
                      'text-red-400'
                    }`}>
                      {relationship.conflict_level < 20 ? 'Excellent' :
                       relationship.conflict_level < 50 ? 'Good' : 'Needs Work'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Trust Building:</span>
                    <span className={`text-sm ${
                      relationship.trust_level >= 80 ? 'text-green-400' :
                      relationship.trust_level >= 60 ? 'text-yellow-400' :
                      'text-red-400'
                    }`}>
                      {relationship.trust_level >= 80 ? 'Strong' :
                       relationship.trust_level >= 60 ? 'Developing' : 'Fragile'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Emotional Connection:</span>
                    <span className={`text-sm ${
                      relationship.intimacy_level >= 70 ? 'text-pink-400' :
                      relationship.intimacy_level >= 40 ? 'text-blue-400' :
                      'text-gray-400'
                    }`}>
                      {relationship.intimacy_level >= 70 ? 'Deep' :
                       relationship.intimacy_level >= 40 ? 'Growing' : 'Surface'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Recommendations */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h5 className="text-sm font-medium text-cyan-400 mb-3">Recommendations</h5>
              <div className="space-y-2">
                {relationship.trust_level < 60 && (
                  <div className="flex items-start space-x-2 text-sm">
                    <Shield className="w-4 h-4 text-yellow-400 mt-0.5" />
                    <div>
                      <span className="text-yellow-400 font-medium">Build Trust:</span>
                      <span className="text-gray-300 ml-1">Focus on consistent, honest interactions to strengthen trust.</span>
                    </div>
                  </div>
                )}
                
                {relationship.conflict_level > 40 && (
                  <div className="flex items-start space-x-2 text-sm">
                    <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5" />
                    <div>
                      <span className="text-red-400 font-medium">Address Conflicts:</span>
                      <span className="text-gray-300 ml-1">Work on resolving underlying tensions through open communication.</span>
                    </div>
                  </div>
                )}
                
                {relationship.interaction_frequency < 3 && (
                  <div className="flex items-start space-x-2 text-sm">
                    <MessageCircle className="w-4 h-4 text-blue-400 mt-0.5" />
                    <div>
                      <span className="text-blue-400 font-medium">Increase Contact:</span>
                      <span className="text-gray-300 ml-1">More frequent interactions can help strengthen your bond.</span>
                    </div>
                  </div>
                )}
                
                {relationship.compatibility_score > 80 && relationship.intimacy_level < 60 && (
                  <div className="flex items-start space-x-2 text-sm">
                    <Heart className="w-4 h-4 text-pink-400 mt-0.5" />
                    <div>
                      <span className="text-pink-400 font-medium">Deepen Connection:</span>
                      <span className="text-gray-300 ml-1">Your compatibility is high - consider more personal conversations.</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RelationshipDynamicsPanel;