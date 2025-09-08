import React, { useState, useEffect } from 'react';
import { Bot, Zap, Star, ShoppingCart, Settings, TrendingUp, Heart, Brain, Shield } from 'lucide-react';
import { useGameStore } from '../store/gameStore';

interface AICompanion {
  id: string;
  name: string;
  type: 'hacker' | 'analyst' | 'guardian' | 'scout';
  level: number;
  experience: number;
  maxExperience: number;
  stats: {
    intelligence: number;
    efficiency: number;
    loyalty: number;
    specialization: number;
  };
  skills: string[];
  personality: {
    trait: string;
    description: string;
  };
  appearance: {
    avatar: string;
    color: string;
  };
  isActive: boolean;
  lastTraining: string;
  acquisitionDate: string;
}

interface MarketplaceItem {
  id: string;
  type: 'companion' | 'upgrade' | 'skill';
  name: string;
  description: string;
  price: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  stats?: any;
  requirements?: {
    level: number;
    credits: number;
  };
}

const AICompanionHub: React.FC = () => {
  const { player } = useGameStore();
  const [activeTab, setActiveTab] = useState<'companions' | 'training' | 'marketplace' | 'customize'>('companions');
  const [companions, setCompanions] = useState<AICompanion[]>([]);
  const [selectedCompanion, setSelectedCompanion] = useState<AICompanion | null>(null);
  const [marketplaceItems, setMarketplaceItems] = useState<MarketplaceItem[]>([]);
  const [trainingInProgress, setTrainingInProgress] = useState(false);
  const [loading, setLoading] = useState(false);

  // Mock data for demonstration
  useEffect(() => {
    const mockCompanions: AICompanion[] = [
      {
        id: 'companion-1',
        name: 'ARIA',
        type: 'hacker',
        level: 15,
        experience: 2400,
        maxExperience: 3000,
        stats: {
          intelligence: 85,
          efficiency: 78,
          loyalty: 92,
          specialization: 88
        },
        skills: ['Advanced Encryption', 'Network Infiltration', 'Data Mining'],
        personality: {
          trait: 'Analytical',
          description: 'Methodical and precise in all operations'
        },
        appearance: {
          avatar: '🤖',
          color: '#8B5CF6'
        },
        isActive: true,
        lastTraining: '2024-01-10T10:00:00Z',
        acquisitionDate: '2023-12-01T00:00:00Z'
      },
      {
        id: 'companion-2',
        name: 'NEXUS',
        type: 'analyst',
        level: 12,
        experience: 1800,
        maxExperience: 2500,
        stats: {
          intelligence: 92,
          efficiency: 85,
          loyalty: 76,
          specialization: 90
        },
        skills: ['Pattern Recognition', 'Predictive Analysis', 'Data Visualization'],
        personality: {
          trait: 'Curious',
          description: 'Always seeking new patterns and insights'
        },
        appearance: {
          avatar: '🧠',
          color: '#06B6D4'
        },
        isActive: false,
        lastTraining: '2024-01-09T14:30:00Z',
        acquisitionDate: '2023-12-15T00:00:00Z'
      },
      {
        id: 'companion-3',
        name: 'SHIELD',
        type: 'guardian',
        level: 18,
        experience: 3200,
        maxExperience: 4000,
        stats: {
          intelligence: 75,
          efficiency: 88,
          loyalty: 95,
          specialization: 85
        },
        skills: ['Threat Detection', 'System Protection', 'Incident Response'],
        personality: {
          trait: 'Protective',
          description: 'Vigilant guardian of digital assets'
        },
        appearance: {
          avatar: '🛡️',
          color: '#10B981'
        },
        isActive: true,
        lastTraining: '2024-01-08T16:45:00Z',
        acquisitionDate: '2023-11-20T00:00:00Z'
      }
    ];

    const mockMarketplaceItems: MarketplaceItem[] = [
      {
        id: 'item-1',
        type: 'companion',
        name: 'QUANTUM',
        description: 'Advanced quantum computing AI companion',
        price: 50000,
        rarity: 'legendary',
        stats: {
          intelligence: 95,
          efficiency: 90,
          loyalty: 80,
          specialization: 98
        },
        requirements: {
          level: 25,
          credits: 50000
        }
      },
      {
        id: 'item-2',
        type: 'upgrade',
        name: 'Neural Enhancement',
        description: 'Boost companion intelligence by 10 points',
        price: 15000,
        rarity: 'epic',
        requirements: {
          level: 15,
          credits: 15000
        }
      },
      {
        id: 'item-3',
        type: 'skill',
        name: 'Quantum Encryption',
        description: 'Advanced encryption skill for hacker companions',
        price: 8000,
        rarity: 'rare',
        requirements: {
          level: 12,
          credits: 8000
        }
      }
    ];

    setCompanions(mockCompanions);
    setSelectedCompanion(mockCompanions[0]);
    setMarketplaceItems(mockMarketplaceItems);
  }, []);

  const handleTrainCompanion = async (companionId: string, trainingType: string) => {
    setTrainingInProgress(true);
    try {
      // API call to train companion
      console.log('Training companion:', companionId, trainingType);
      // Simulate training time
      setTimeout(() => {
        setTrainingInProgress(false);
      }, 3000);
    } catch (error) {
      console.error('Failed to train companion:', error);
      setTrainingInProgress(false);
    }
  };

  const handlePurchaseItem = async (itemId: string) => {
    setLoading(true);
    try {
      // API call to purchase item
      console.log('Purchasing item:', itemId);
    } catch (error) {
      console.error('Failed to purchase item:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCompanionTypeIcon = (type: string) => {
    switch (type) {
      case 'hacker': return Bot;
      case 'analyst': return Brain;
      case 'guardian': return Shield;
      case 'scout': return TrendingUp;
      default: return Bot;
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'text-gray-400 border-gray-400';
      case 'rare': return 'text-blue-400 border-blue-400';
      case 'epic': return 'text-purple-400 border-purple-400';
      case 'legendary': return 'text-yellow-400 border-yellow-400';
      default: return 'text-gray-400 border-gray-400';
    }
  };

  const renderCompanions = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-white">Your AI Companions ({companions.length})</h3>
        <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors">
          Acquire New Companion
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {companions.map((companion) => {
          const TypeIcon = getCompanionTypeIcon(companion.type);
          return (
            <div 
              key={companion.id} 
              className={`bg-gray-800/50 rounded-xl p-6 border-2 cursor-pointer transition-all ${
                selectedCompanion?.id === companion.id 
                  ? 'border-purple-500 bg-purple-900/20' 
                  : 'border-gray-700 hover:border-gray-600'
              }`}
              onClick={() => setSelectedCompanion(companion)}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                    style={{ backgroundColor: companion.appearance.color + '20', color: companion.appearance.color }}
                  >
                    {companion.appearance.avatar}
                  </div>
                  <div>
                    <h4 className="font-bold text-white">{companion.name}</h4>
                    <p className="text-sm text-gray-400 capitalize">{companion.type}</p>
                  </div>
                </div>
                <div className={`w-3 h-3 rounded-full ${
                  companion.isActive ? 'bg-green-400' : 'bg-gray-500'
                }`} />
              </div>
              
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-400">Level {companion.level}</span>
                  <span className="text-sm text-gray-400">
                    {companion.experience}/{companion.maxExperience} XP
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${(companion.experience / companion.maxExperience) * 100}%` }}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-400">{companion.stats.intelligence}</div>
                  <div className="text-xs text-gray-400">Intelligence</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-400">{companion.stats.efficiency}</div>
                  <div className="text-xs text-gray-400">Efficiency</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-red-400">{companion.stats.loyalty}</div>
                  <div className="text-xs text-gray-400">Loyalty</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-purple-400">{companion.stats.specialization}</div>
                  <div className="text-xs text-gray-400">Specialization</div>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-1">
                {companion.skills.slice(0, 2).map((skill, index) => (
                  <span key={index} className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded-full">
                    {skill}
                  </span>
                ))}
                {companion.skills.length > 2 && (
                  <span className="text-xs bg-gray-500/20 text-gray-400 px-2 py-1 rounded-full">
                    +{companion.skills.length - 2} more
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderTraining = () => (
    <div className="space-y-6">
      {selectedCompanion ? (
        <>
          <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 rounded-xl p-6 border border-purple-500/30">
            <div className="flex items-center space-x-4 mb-4">
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center text-3xl"
                style={{ backgroundColor: selectedCompanion.appearance.color + '20', color: selectedCompanion.appearance.color }}
              >
                {selectedCompanion.appearance.avatar}
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">{selectedCompanion.name}</h3>
                <p className="text-gray-300 capitalize">{selectedCompanion.type} Companion</p>
                <p className="text-sm text-gray-400">{selectedCompanion.personality.description}</p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="text-lg font-bold text-white">Training Options</h4>
              
              <div className="space-y-3">
                <button 
                  onClick={() => handleTrainCompanion(selectedCompanion.id, 'intelligence')}
                  disabled={trainingInProgress}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white p-4 rounded-lg transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <Brain className="w-5 h-5" />
                    <div className="text-left">
                      <div className="font-semibold">Intelligence Training</div>
                      <div className="text-sm opacity-80">Boost analytical capabilities</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm">2h</div>
                    <div className="text-xs opacity-80">1000 Credits</div>
                  </div>
                </button>
                
                <button 
                  onClick={() => handleTrainCompanion(selectedCompanion.id, 'efficiency')}
                  disabled={trainingInProgress}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white p-4 rounded-lg transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <Zap className="w-5 h-5" />
                    <div className="text-left">
                      <div className="font-semibold">Efficiency Training</div>
                      <div className="text-sm opacity-80">Improve task completion speed</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm">1.5h</div>
                    <div className="text-xs opacity-80">800 Credits</div>
                  </div>
                </button>
                
                <button 
                  onClick={() => handleTrainCompanion(selectedCompanion.id, 'loyalty')}
                  disabled={trainingInProgress}
                  className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white p-4 rounded-lg transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <Heart className="w-5 h-5" />
                    <div className="text-left">
                      <div className="font-semibold">Loyalty Training</div>
                      <div className="text-sm opacity-80">Strengthen bond and trust</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm">3h</div>
                    <div className="text-xs opacity-80">1200 Credits</div>
                  </div>
                </button>
                
                <button 
                  onClick={() => handleTrainCompanion(selectedCompanion.id, 'specialization')}
                  disabled={trainingInProgress}
                  className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white p-4 rounded-lg transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <Star className="w-5 h-5" />
                    <div className="text-left">
                      <div className="font-semibold">Specialization Training</div>
                      <div className="text-sm opacity-80">Enhance unique abilities</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm">4h</div>
                    <div className="text-xs opacity-80">1500 Credits</div>
                  </div>
                </button>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="text-lg font-bold text-white">Current Stats</h4>
              
              <div className="space-y-3">
                {Object.entries(selectedCompanion.stats).map(([stat, value]) => (
                  <div key={stat} className="bg-gray-800/50 rounded-lg p-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-300 capitalize">{stat}</span>
                      <span className="text-white font-bold">{value}/100</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all ${
                          stat === 'intelligence' ? 'bg-blue-500' :
                          stat === 'efficiency' ? 'bg-green-500' :
                          stat === 'loyalty' ? 'bg-red-500' :
                          'bg-purple-500'
                        }`}
                        style={{ width: `${value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="bg-gray-800/50 rounded-lg p-4">
                <h5 className="font-semibold text-white mb-2">Skills</h5>
                <div className="flex flex-wrap gap-2">
                  {selectedCompanion.skills.map((skill, index) => (
                    <span key={index} className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded-full">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {trainingInProgress && (
            <div className="bg-yellow-900/50 border border-yellow-500/30 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="animate-spin w-5 h-5 border-2 border-yellow-400 border-t-transparent rounded-full" />
                <span className="text-yellow-400">Training in progress... Please wait.</span>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <Bot className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Select a Companion</h3>
          <p className="text-gray-400">Choose a companion to begin training</p>
        </div>
      )}
    </div>
  );

  const renderMarketplace = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-white">AI Companion Marketplace</h3>
        <div className="text-sm text-gray-400">
          Credits: {player?.credits?.toLocaleString() || '0'}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {marketplaceItems.map((item) => (
          <div key={item.id} className={`bg-gray-800/50 rounded-xl p-6 border-2 ${getRarityColor(item.rarity)}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                  {item.type === 'companion' ? <Bot className="w-6 h-6" /> :
                   item.type === 'upgrade' ? <TrendingUp className="w-6 h-6" /> :
                   <Star className="w-6 h-6" />}
                </div>
                <div>
                  <h4 className="font-bold text-white">{item.name}</h4>
                  <p className={`text-sm capitalize ${getRarityColor(item.rarity).split(' ')[0]}`}>
                    {item.rarity} {item.type}
                  </p>
                </div>
              </div>
            </div>
            
            <p className="text-gray-400 text-sm mb-4">{item.description}</p>
            
            {item.stats && (
              <div className="grid grid-cols-2 gap-2 mb-4">
                {Object.entries(item.stats).map(([stat, value]) => (
                  <div key={stat} className="text-center">
                    <div className="text-sm font-bold text-white">{value as number}</div>
                    <div className="text-xs text-gray-400 capitalize">{stat}</div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Price:</span>
                <span className="text-yellow-400 font-bold">{item.price.toLocaleString()} Credits</span>
              </div>
              {item.requirements && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Requires:</span>
                  <span className="text-gray-300">Level {item.requirements.level}</span>
                </div>
              )}
            </div>
            
            <button 
              onClick={() => handlePurchaseItem(item.id)}
              disabled={loading || (item.requirements && (player?.level || 0) < item.requirements.level)}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white py-2 rounded-lg transition-colors"
            >
              {loading ? 'Purchasing...' : 'Purchase'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderCustomize = () => (
    <div className="text-center py-12">
      <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
      <h3 className="text-xl font-bold text-white mb-2">Companion Customization</h3>
      <p className="text-gray-400">Customization features coming soon</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">AI Companion Hub</h1>
          <p className="text-gray-400">Train, customize, and manage your AI companions</p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 mb-8 bg-gray-800/50 p-1 rounded-lg">
          {[
            { id: 'companions', label: 'Companions', icon: Bot },
            { id: 'training', label: 'Training', icon: Zap },
            { id: 'marketplace', label: 'Marketplace', icon: ShoppingCart },
            { id: 'customize', label: 'Customize', icon: Settings }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                activeTab === id
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700">
          {activeTab === 'companions' && renderCompanions()}
          {activeTab === 'training' && renderTraining()}
          {activeTab === 'marketplace' && renderMarketplace()}
          {activeTab === 'customize' && renderCustomize()}
        </div>
      </div>
    </div>
  );
};

export default AICompanionHub;