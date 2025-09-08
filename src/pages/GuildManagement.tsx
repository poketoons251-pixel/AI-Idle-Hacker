import React, { useState, useEffect } from 'react';
import { Users, Crown, Coins, Sword, Shield, Plus, Search, Settings, MessageCircle } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { ChatBox } from '../components/ui/ChatBox';
import { StatusIndicator } from '../components/ui/StatusIndicator';

interface Guild {
  id: string;
  name: string;
  description: string;
  level: number;
  memberCount: number;
  maxMembers: number;
  treasury: number;
  isPublic: boolean;
  requirements: {
    minLevel: number;
    minPower: number;
  };
  leader: {
    id: string;
    name: string;
    level: number;
  };
  warStatus: 'peace' | 'preparing' | 'active' | 'cooldown';
  nextWarTime?: string;
}

interface GuildMember {
  id: string;
  name: string;
  level: number;
  power: number;
  role: 'leader' | 'officer' | 'member';
  contribution: number;
  lastActive: string;
  joinedAt: string;
}

const GuildManagement: React.FC = () => {
  const { player } = useGameStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'treasury' | 'wars' | 'browse'>('overview');
  const [currentGuild, setCurrentGuild] = useState<Guild | null>(null);
  const [guildMembers, setGuildMembers] = useState<GuildMember[]>([]);
  const [availableGuilds, setAvailableGuilds] = useState<Guild[]>([]);
  const [showCreateGuild, setShowCreateGuild] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  // Mock data for demonstration
  useEffect(() => {
    // Simulate fetching guild data
    const mockGuild: Guild = {
      id: 'guild-1',
      name: 'Elite Hackers',
      description: 'The most advanced AI hackers in the digital realm',
      level: 15,
      memberCount: 28,
      maxMembers: 30,
      treasury: 150000,
      isPublic: true,
      requirements: {
        minLevel: 10,
        minPower: 5000
      },
      leader: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'CyberMaster',
        level: 45
      },
      warStatus: 'preparing',
      nextWarTime: '2024-01-15T18:00:00Z'
    };

    const mockMembers: GuildMember[] = [
      {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'CyberMaster',
        level: 45,
        power: 12500,
        role: 'leader',
        contribution: 25000,
        lastActive: '2024-01-10T12:00:00Z',
        joinedAt: '2023-12-01T10:00:00Z'
      },
      {
        id: 'player-2',
        name: 'DataNinja',
        level: 38,
        power: 9800,
        role: 'officer',
        contribution: 18500,
        lastActive: '2024-01-10T11:30:00Z',
        joinedAt: '2023-12-05T14:20:00Z'
      },
      {
        id: 'player-3',
        name: 'CodeBreaker',
        level: 32,
        power: 7200,
        role: 'member',
        contribution: 12000,
        lastActive: '2024-01-09T20:15:00Z',
        joinedAt: '2023-12-10T09:45:00Z'
      }
    ];

    const mockAvailableGuilds: Guild[] = [
      {
        id: 'guild-2',
        name: 'Digital Warriors',
        description: 'Conquer the digital battlefield together',
        level: 12,
        memberCount: 25,
        maxMembers: 30,
        treasury: 95000,
        isPublic: true,
        requirements: {
          minLevel: 8,
          minPower: 3000
        },
        leader: {
          id: 'player-4',
          name: 'TechCommander',
          level: 40
        },
        warStatus: 'peace'
      },
      {
        id: 'guild-3',
        name: 'Quantum Coders',
        description: 'Advanced quantum computing specialists',
        level: 18,
        memberCount: 15,
        maxMembers: 20,
        treasury: 200000,
        isPublic: false,
        requirements: {
          minLevel: 15,
          minPower: 8000
        },
        leader: {
          id: 'player-5',
          name: 'QuantumLord',
          level: 50
        },
        warStatus: 'active'
      }
    ];

    setCurrentGuild(mockGuild);
    setGuildMembers(mockMembers);
    setAvailableGuilds(mockAvailableGuilds);
  }, []);

  const handleCreateGuild = async (guildData: any) => {
    setLoading(true);
    try {
      // API call to create guild
      console.log('Creating guild:', guildData);
      setShowCreateGuild(false);
    } catch (error) {
      console.error('Failed to create guild:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGuild = async (guildId: string) => {
    setLoading(true);
    try {
      // API call to join guild
      console.log('Joining guild:', guildId);
    } catch (error) {
      console.error('Failed to join guild:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveGuild = async () => {
    setLoading(true);
    try {
      // API call to leave guild
      console.log('Leaving guild');
      setCurrentGuild(null);
    } catch (error) {
      console.error('Failed to leave guild:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderGuildOverview = () => (
    <div className="space-y-6">
      {/* Guild Header */}
      <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 rounded-xl p-6 border border-purple-500/30">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
              <Crown className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{currentGuild?.name}</h2>
              <p className="text-gray-300">{currentGuild?.description}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-purple-400">Level {currentGuild?.level}</div>
            <div className="text-sm text-gray-400">{currentGuild?.memberCount}/{currentGuild?.maxMembers} Members</div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-black/30 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Coins className="w-5 h-5 text-yellow-400" />
              <span className="text-gray-300">Treasury</span>
            </div>
            <div className="text-xl font-bold text-yellow-400">{currentGuild?.treasury?.toLocaleString()} Credits</div>
          </div>
          
          <div className="bg-black/30 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Sword className="w-5 h-5 text-red-400" />
              <span className="text-gray-300">War Status</span>
            </div>
            <div className={`text-xl font-bold capitalize ${
              currentGuild?.warStatus === 'active' ? 'text-red-400' :
              currentGuild?.warStatus === 'preparing' ? 'text-yellow-400' :
              currentGuild?.warStatus === 'cooldown' ? 'text-blue-400' :
              'text-green-400'
            }`}>
              {currentGuild?.warStatus}
            </div>
          </div>
          
          <div className="bg-black/30 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Shield className="w-5 h-5 text-blue-400" />
              <span className="text-gray-300">Requirements</span>
            </div>
            <div className="text-sm text-gray-300">
              Level {currentGuild?.requirements.minLevel}+ | {currentGuild?.requirements.minPower}+ Power
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button className="bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-lg transition-colors flex flex-col items-center space-y-2">
          <MessageCircle className="w-6 h-6" />
          <span>Guild Chat</span>
        </button>
        <button className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-lg transition-colors flex flex-col items-center space-y-2">
          <Users className="w-6 h-6" />
          <span>Members</span>
        </button>
        <button className="bg-yellow-600 hover:bg-yellow-700 text-white p-4 rounded-lg transition-colors flex flex-col items-center space-y-2">
          <Coins className="w-6 h-6" />
          <span>Treasury</span>
        </button>
        <button className="bg-red-600 hover:bg-red-700 text-white p-4 rounded-lg transition-colors flex flex-col items-center space-y-2">
          <Sword className="w-6 h-6" />
          <span>Guild Wars</span>
        </button>
      </div>
    </div>
  );

  const renderMembers = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-white">Guild Members ({guildMembers.length})</h3>
        <div className="flex space-x-2">
          <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors">
            Invite Members
          </button>
          <button className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div className="space-y-2">
        {guildMembers.map((member) => (
          <div key={member.id} className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  member.role === 'leader' ? 'bg-yellow-500' :
                  member.role === 'officer' ? 'bg-purple-500' :
                  'bg-blue-500'
                }`}>
                  {member.role === 'leader' ? <Crown className="w-5 h-5" /> : <Users className="w-5 h-5" />}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-white">{member.name}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      member.role === 'leader' ? 'bg-yellow-500/20 text-yellow-400' :
                      member.role === 'officer' ? 'bg-purple-500/20 text-purple-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>
                      {member.role}
                    </span>
                  </div>
                  <div className="text-sm text-gray-400">
                    Level {member.level} | {member.power.toLocaleString()} Power
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-green-400">
                  {member.contribution.toLocaleString()} Contribution
                </div>
                <div className="text-xs text-gray-500">
                  Last active: {new Date(member.lastActive).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderBrowseGuilds = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-white">Browse Guilds</h3>
        <button 
          onClick={() => setShowCreateGuild(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Create Guild</span>
        </button>
      </div>
      
      <div className="flex space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search guilds..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
          />
        </div>
      </div>
      
      <div className="grid gap-4">
        {availableGuilds.map((guild) => (
          <div key={guild.id} className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="text-lg font-bold text-white">{guild.name}</h4>
                <p className="text-gray-400 text-sm">{guild.description}</p>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-purple-400">Level {guild.level}</div>
                <div className="text-sm text-gray-400">{guild.memberCount}/{guild.maxMembers} Members</div>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex space-x-4 text-sm">
                <span className="text-gray-300">Min Level: {guild.requirements.minLevel}</span>
                <span className="text-gray-300">Min Power: {guild.requirements.minPower}</span>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  guild.isPublic ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {guild.isPublic ? 'Public' : 'Private'}
                </span>
              </div>
              <button 
                onClick={() => handleJoinGuild(guild.id)}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                {loading ? 'Joining...' : 'Join Guild'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (!currentGuild && activeTab !== 'browse') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">No Guild Found</h2>
            <p className="text-gray-400 mb-6">Join or create a guild to access advanced social features</p>
            <div className="space-x-4">
              <button 
                onClick={() => setActiveTab('browse')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
              >
                Browse Guilds
              </button>
              <button 
                onClick={() => setShowCreateGuild(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors"
              >
                Create Guild
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Guild Management</h1>
          <p className="text-gray-400">Manage your guild and collaborate with other players</p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 mb-8 bg-gray-800/50 p-1 rounded-lg">
          {[
            { id: 'overview', label: 'Overview', icon: Crown },
            { id: 'members', label: 'Members', icon: Users },
            { id: 'treasury', label: 'Treasury', icon: Coins },
            { id: 'wars', label: 'Guild Wars', icon: Sword },
            { id: 'browse', label: 'Browse', icon: Search }
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
          {activeTab === 'overview' && renderGuildOverview()}
          {activeTab === 'members' && renderMembers()}
          {activeTab === 'treasury' && (
            <div className="text-center py-12">
              <Coins className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Guild Treasury</h3>
              <p className="text-gray-400">Treasury management features coming soon</p>
            </div>
          )}
          {activeTab === 'wars' && (
            <div className="text-center py-12">
              <Sword className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Guild Wars</h3>
              <p className="text-gray-400">Guild war features coming soon</p>
            </div>
          )}
          {activeTab === 'browse' && renderBrowseGuilds()}
        </div>

        {/* Leave Guild Button */}
        {currentGuild && (
          <div className="mt-6 text-center">
            <button 
              onClick={handleLeaveGuild}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Leave Guild
            </button>
          </div>
        )}
      </div>
      
      {/* Guild Chat */}
      <div className="mt-8">
        <ChatBox 
          title="Guild Chat"
          placeholder="Chat with your guild members..."
          onSendMessage={(message) => console.log('Guild message:', message)}
        />
      </div>
    </div>
  );
};

export default GuildManagement;