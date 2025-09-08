import React, { useState, useEffect } from 'react';
import { Users, MessageCircle, UserPlus, Search, Star, Trophy, Gift, Bell, Send, MoreVertical } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { StatusIndicator } from '../components/ui/StatusIndicator';

interface Friend {
  id: string;
  name: string;
  level: number;
  status: 'online' | 'offline' | 'away';
  lastSeen: string;
  avatar: string;
  guild?: string;
  mutualFriends: number;
  friendshipDate: string;
}

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  type: 'text' | 'system' | 'gift';
  isRead: boolean;
}

interface MentorshipRequest {
  id: string;
  type: 'sent' | 'received';
  userId: string;
  userName: string;
  userLevel: number;
  message: string;
  timestamp: string;
  status: 'pending' | 'accepted' | 'declined';
}

interface Mentorship {
  id: string;
  role: 'mentor' | 'mentee';
  partnerId: string;
  partnerName: string;
  partnerLevel: number;
  startDate: string;
  progress: {
    sessionsCompleted: number;
    skillsLearned: string[];
    achievements: string[];
  };
  nextSession?: string;
}

const SocialDashboard: React.FC = () => {
  const { player } = useGameStore();
  const [activeTab, setActiveTab] = useState<'friends' | 'messages' | 'mentorship' | 'discover'>('friends');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [mentorships, setMentorships] = useState<Mentorship[]>([]);
  const [mentorshipRequests, setMentorshipRequests] = useState<MentorshipRequest[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  // Mock data for demonstration
  useEffect(() => {
    const mockFriends: Friend[] = [
      {
        id: 'friend-1',
        name: 'CyberNinja',
        level: 42,
        status: 'online',
        lastSeen: '2024-01-10T12:00:00Z',
        avatar: '🥷',
        guild: 'Elite Hackers',
        mutualFriends: 5,
        friendshipDate: '2023-11-15T00:00:00Z'
      },
      {
        id: 'friend-2',
        name: 'DataMage',
        level: 38,
        status: 'away',
        lastSeen: '2024-01-10T10:30:00Z',
        avatar: '🧙‍♂️',
        guild: 'Quantum Coders',
        mutualFriends: 3,
        friendshipDate: '2023-12-01T00:00:00Z'
      },
      {
        id: 'friend-3',
        name: 'CodeBreaker',
        level: 35,
        status: 'offline',
        lastSeen: '2024-01-09T18:45:00Z',
        avatar: '🔓',
        mutualFriends: 2,
        friendshipDate: '2023-12-10T00:00:00Z'
      }
    ];

    const mockMessages: Message[] = [
      {
        id: 'msg-1',
        senderId: 'friend-1',
        senderName: 'CyberNinja',
        content: 'Hey! Want to team up for the next guild war?',
        timestamp: '2024-01-10T11:30:00Z',
        type: 'text',
        isRead: false
      },
      {
        id: 'msg-2',
        senderId: 'player',
        senderName: 'You',
        content: 'Absolutely! What time works for you?',
        timestamp: '2024-01-10T11:32:00Z',
        type: 'text',
        isRead: true
      },
      {
        id: 'msg-3',
        senderId: 'friend-2',
        senderName: 'DataMage',
        content: 'Check out this new encryption algorithm I discovered!',
        timestamp: '2024-01-10T09:15:00Z',
        type: 'text',
        isRead: true
      }
    ];

    const mockMentorships: Mentorship[] = [
      {
        id: 'mentor-1',
        role: 'mentor',
        partnerId: 'student-1',
        partnerName: 'NewHacker',
        partnerLevel: 12,
        startDate: '2024-01-01T00:00:00Z',
        progress: {
          sessionsCompleted: 5,
          skillsLearned: ['Basic Encryption', 'Network Scanning'],
          achievements: ['First Hack', 'Data Collector']
        },
        nextSession: '2024-01-11T15:00:00Z'
      },
      {
        id: 'mentor-2',
        role: 'mentee',
        partnerId: 'expert-1',
        partnerName: 'MasterHacker',
        partnerLevel: 55,
        startDate: '2023-12-15T00:00:00Z',
        progress: {
          sessionsCompleted: 8,
          skillsLearned: ['Advanced AI', 'Quantum Computing', 'Neural Networks'],
          achievements: ['AI Specialist', 'Quantum Pioneer']
        },
        nextSession: '2024-01-12T10:00:00Z'
      }
    ];

    const mockRequests: MentorshipRequest[] = [
      {
        id: 'req-1',
        type: 'received',
        userId: 'user-1',
        userName: 'AspiringSec',
        userLevel: 8,
        message: 'Hi! I\'m new to cybersecurity and would love to learn from you. Could you be my mentor?',
        timestamp: '2024-01-10T08:00:00Z',
        status: 'pending'
      }
    ];

    setFriends(mockFriends);
    setMessages(mockMessages);
    setMentorships(mockMentorships);
    setMentorshipRequests(mockRequests);
    setSelectedFriend(mockFriends[0]);
  }, []);

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedFriend) return;
    
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      senderId: 'player',
      senderName: 'You',
      content: messageInput,
      timestamp: new Date().toISOString(),
      type: 'text',
      isRead: true
    };
    
    setMessages(prev => [...prev, newMessage]);
    setMessageInput('');
  };

  const handleAddFriend = async (userId: string) => {
    setLoading(true);
    try {
      // API call to send friend request
      console.log('Sending friend request to:', userId);
    } catch (error) {
      console.error('Failed to send friend request:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMentorshipRequest = async (requestId: string, action: 'accept' | 'decline') => {
    setLoading(true);
    try {
      // API call to handle mentorship request
      console.log('Handling mentorship request:', requestId, action);
      setMentorshipRequests(prev => 
        prev.map(req => 
          req.id === requestId 
            ? { ...req, status: action === 'accept' ? 'accepted' : 'declined' }
            : req
        )
      );
    } catch (error) {
      console.error('Failed to handle mentorship request:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-400';
      case 'away': return 'bg-yellow-400';
      case 'offline': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const renderFriends = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-white">Friends ({friends.length})</h3>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2">
          <UserPlus className="w-4 h-4" />
          <span>Add Friend</span>
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {friends.map((friend) => (
          <div key={friend.id} className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-xl">
                    {friend.avatar}
                  </div>
                  <div className="absolute -bottom-1 -right-1">
                    <StatusIndicator 
                      status={friend.status === 'online' ? 'online' : friend.status === 'away' ? 'away' : 'offline'} 
                      showLabel={false} 
                      size="sm"
                    />
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-white">{friend.name}</h4>
                  <p className="text-sm text-gray-400">Level {friend.level}</p>
                </div>
              </div>
              <button className="text-gray-400 hover:text-white">
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-2 text-sm">
              {friend.guild && (
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-purple-400" />
                  <span className="text-gray-300">{friend.guild}</span>
                </div>
              )}
              <div className="flex items-center space-x-2">
                <Star className="w-4 h-4 text-yellow-400" />
                <span className="text-gray-300">{friend.mutualFriends} mutual friends</span>
              </div>
              <div className="text-gray-400">
                {friend.status === 'online' ? 'Online now' : 
                 friend.status === 'away' ? 'Away' :
                 `Last seen ${new Date(friend.lastSeen).toLocaleDateString()}`}
              </div>
            </div>
            
            <div className="flex space-x-2 mt-4">
              <button 
                onClick={() => setSelectedFriend(friend)}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 px-3 rounded-lg transition-colors flex items-center justify-center space-x-1"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Message</span>
              </button>
              <button className="bg-gray-600 hover:bg-gray-700 text-white py-2 px-3 rounded-lg transition-colors">
                <Gift className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderMessages = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-96">
      {/* Friends List */}
      <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
        <h4 className="font-semibold text-white mb-4">Conversations</h4>
        <div className="space-y-2">
          {friends.map((friend) => {
            const lastMessage = messages.filter(m => m.senderId === friend.id || (m.senderId === 'player' && selectedFriend?.id === friend.id)).pop();
            return (
              <div 
                key={friend.id}
                onClick={() => setSelectedFriend(friend)}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedFriend?.id === friend.id ? 'bg-purple-600/30' : 'hover:bg-gray-700/50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-sm">
                      {friend.avatar}
                    </div>
                    <div className={`absolute -bottom-1 -right-1 w-3 h-3 ${getStatusColor(friend.status)} rounded-full border border-gray-800`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-white text-sm">{friend.name}</div>
                    {lastMessage && (
                      <div className="text-xs text-gray-400 truncate">
                        {lastMessage.senderId === 'player' ? 'You: ' : ''}{lastMessage.content}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Chat Area */}
      <div className="lg:col-span-2 bg-gray-800/50 rounded-lg border border-gray-700 flex flex-col">
        {selectedFriend ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                    {selectedFriend.avatar}
                  </div>
                  <div className={`absolute -bottom-1 -right-1 w-3 h-3 ${getStatusColor(selectedFriend.status)} rounded-full border border-gray-800`} />
                </div>
                <div>
                  <h4 className="font-semibold text-white">{selectedFriend.name}</h4>
                  <p className="text-sm text-gray-400 capitalize">{selectedFriend.status}</p>
                </div>
              </div>
            </div>
            
            {/* Messages */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {messages
                .filter(m => m.senderId === selectedFriend.id || (m.senderId === 'player' && selectedFriend))
                .map((message) => (
                <div key={message.id} className={`flex ${message.senderId === 'player' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.senderId === 'player' 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-gray-700 text-gray-100'
                  }`}>
                    <p className="text-sm">{message.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Message Input */}
            <div className="p-4 border-t border-gray-700">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                />
                <button 
                  onClick={handleSendMessage}
                  className="bg-purple-600 hover:bg-purple-700 text-white p-2 rounded-lg transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400">Select a friend to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderMentorship = () => (
    <div className="space-y-6">
      {/* Mentorship Requests */}
      {mentorshipRequests.length > 0 && (
        <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
          <h4 className="font-semibold text-yellow-400 mb-3 flex items-center space-x-2">
            <Bell className="w-4 h-4" />
            <span>Mentorship Requests ({mentorshipRequests.filter(r => r.status === 'pending').length})</span>
          </h4>
          <div className="space-y-3">
            {mentorshipRequests.filter(r => r.status === 'pending').map((request) => (
              <div key={request.id} className="bg-gray-800/50 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h5 className="font-semibold text-white">{request.userName}</h5>
                    <p className="text-sm text-gray-400">Level {request.userLevel}</p>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(request.timestamp).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-gray-300 text-sm mb-4">{request.message}</p>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => handleMentorshipRequest(request.id, 'accept')}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
                  >
                    Accept
                  </button>
                  <button 
                    onClick={() => handleMentorshipRequest(request.id, 'decline')}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Active Mentorships */}
      <div>
        <h4 className="text-lg font-bold text-white mb-4">Active Mentorships ({mentorships.length})</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {mentorships.map((mentorship) => (
            <div key={mentorship.id} className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    mentorship.role === 'mentor' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-blue-500/20 text-blue-400'
                  }`}>
                    {mentorship.role === 'mentor' ? <Star className="w-6 h-6" /> : <Trophy className="w-6 h-6" />}
                  </div>
                  <div>
                    <h5 className="font-semibold text-white">{mentorship.partnerName}</h5>
                    <p className="text-sm text-gray-400">
                      {mentorship.role === 'mentor' ? 'Your Mentee' : 'Your Mentor'} • Level {mentorship.partnerLevel}
                    </p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  mentorship.role === 'mentor' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-blue-500/20 text-blue-400'
                }`}>
                  {mentorship.role}
                </span>
              </div>
              
              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Sessions Completed:</span>
                  <span className="text-white font-semibold">{mentorship.progress.sessionsCompleted}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Skills Learned:</span>
                  <span className="text-white font-semibold">{mentorship.progress.skillsLearned.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Achievements:</span>
                  <span className="text-white font-semibold">{mentorship.progress.achievements.length}</span>
                </div>
              </div>
              
              {mentorship.nextSession && (
                <div className="bg-purple-900/30 rounded-lg p-3 mb-4">
                  <p className="text-sm text-purple-400">Next Session:</p>
                  <p className="text-white font-semibold">
                    {new Date(mentorship.nextSession).toLocaleString()}
                  </p>
                </div>
              )}
              
              <div className="flex space-x-2">
                <button className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg transition-colors text-sm">
                  Schedule Session
                </button>
                <button className="bg-gray-600 hover:bg-gray-700 text-white py-2 px-3 rounded-lg transition-colors">
                  <MessageCircle className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderDiscover = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-white">Discover Players</h3>
        <div className="flex space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search players..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>
      </div>
      
      <div className="text-center py-12">
        <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">Player Discovery</h3>
        <p className="text-gray-400">Player discovery features coming soon</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Social Dashboard</h1>
          <p className="text-gray-400">Connect with friends, find mentors, and build your network</p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 mb-8 bg-gray-800/50 p-1 rounded-lg">
          {[
            { id: 'friends', label: 'Friends', icon: Users },
            { id: 'messages', label: 'Messages', icon: MessageCircle },
            { id: 'mentorship', label: 'Mentorship', icon: Star },
            { id: 'discover', label: 'Discover', icon: Search }
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
          {activeTab === 'friends' && renderFriends()}
          {activeTab === 'messages' && renderMessages()}
          {activeTab === 'mentorship' && renderMentorship()}
          {activeTab === 'discover' && renderDiscover()}
        </div>
      </div>
    </div>
  );
};

export default SocialDashboard;