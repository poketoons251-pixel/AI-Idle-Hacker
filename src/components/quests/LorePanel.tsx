import React, { useState } from 'react';
import {
  X,
  BookOpen,
  Users,
  Globe,
  FileText,
  MessageSquare,
  Radio,
  Database,
  Eye,
  ChevronRight,
  Play,
  Volume2
} from 'lucide-react';

interface StoryLine {
  id: string;
  name: string;
  description: string;
  theme: string;
  icon: React.ComponentType<any>;
  color: string;
  progress: number;
  totalQuests: number;
  completedQuests: number;
  currentQuest?: string;
  loreContext: {
    setting: string;
    keyCharacters: string[];
    worldBuilding: string;
  };
}

interface LorePanelProps {
  storyline: StoryLine;
  onClose: () => void;
}

type LoreTab = 'overview' | 'characters' | 'world' | 'dataLogs' | 'news';

interface LoreEntry {
  id: string;
  title: string;
  content: string;
  type: 'data-log' | 'intercepted-message' | 'news-feed' | 'character-profile' | 'world-info';
  timestamp?: string;
  source?: string;
  classification?: 'public' | 'classified' | 'top-secret';
}

const getLoreData = (storylineId: string): Record<LoreTab, LoreEntry[]> => {
  const loreDatabase: Record<string, Record<LoreTab, LoreEntry[]>> = {
    'origin-story': {
      overview: [
        {
          id: 'origin-intro',
          title: 'The Digital Underground',
          content: 'Welcome to the shadows of cyberspace, where elite hackers operate beyond the reach of corporate surveillance. Your journey begins in the underground networks where legends are forged and digital freedom fighters are born.',
          type: 'world-info'
        }
      ],
      characters: [
        {
          id: 'ghost-chen',
          title: 'Marcus "Ghost" Chen',
          content: 'A legendary hacker known for his ability to infiltrate the most secure systems without leaving a trace. Ghost discovered you during your first amateur hack and has become your mentor in the digital underground.',
          type: 'character-profile',
          source: 'Underground Network Database'
        },
        {
          id: 'cipher-rodriguez',
          title: 'Sarah "Cipher" Rodriguez',
          content: 'Former NSA cryptographer turned whistleblower. Cipher specializes in breaking encryption and exposing government surveillance programs. She runs the secure communication networks for the resistance.',
          type: 'character-profile',
          source: 'Encrypted Personnel Files'
        }
      ],
      world: [
        {
          id: 'underground-network',
          title: 'The Underground Network',
          content: 'A decentralized network of hackers, activists, and digital freedom fighters operating in the shadows of the internet. Members communicate through encrypted channels and work together to expose corruption and fight digital oppression.',
          type: 'world-info'
        }
      ],
      dataLogs: [
        {
          id: 'first-contact',
          title: 'First Contact Protocol',
          content: '[ENCRYPTED LOG] New recruit detected. Skill level: Novice. Potential: High. Initiating mentorship protocol. Ghost assigned as primary contact. Begin with basic infiltration training.',
          type: 'data-log',
          timestamp: '2024-01-15 23:42:17',
          source: 'Underground Network',
          classification: 'classified'
        }
      ],
      news: [
        {
          id: 'cyber-crime-rise',
          title: 'Cyber Crime on the Rise',
          content: 'Government reports show a 300% increase in sophisticated cyber attacks this year. Security experts warn of a new generation of highly skilled hackers operating with unprecedented coordination.',
          type: 'news-feed',
          timestamp: '2024-01-20 08:30:00',
          source: 'CyberNews Daily'
        }
      ]
    },
    'corporate-wars': {
      overview: [
        {
          id: 'corp-wars-intro',
          title: 'The Corporate Surveillance State',
          content: 'Mega-corporations have become the new world powers, controlling data, infrastructure, and information flow. Their digital fortresses seem impenetrable, but every system has vulnerabilities waiting to be exploited.',
          type: 'world-info'
        }
      ],
      characters: [
        {
          id: 'director-kane',
          title: 'Director Kane',
          content: 'Head of DataCorp Security Division. Former military intelligence officer who now oversees corporate digital defense systems. Known for his ruthless pursuit of hackers and whistleblowers.',
          type: 'character-profile',
          source: 'Corporate Directory'
        }
      ],
      world: [
        {
          id: 'datacorp-towers',
          title: 'DataCorp Towers',
          content: 'Massive corporate complexes that house the world\'s largest data processing centers. These digital fortresses are protected by advanced AI security systems and employ thousands of cybersecurity specialists.',
          type: 'world-info'
        }
      ],
      dataLogs: [
        {
          id: 'datacorp-breach',
          title: 'DataCorp Security Breach',
          content: '[CLASSIFIED] Unauthorized access detected in Sector 7. Multiple firewalls compromised. Initiating lockdown protocol. All personnel report to security stations immediately.',
          type: 'data-log',
          timestamp: '2024-01-22 14:15:33',
          source: 'DataCorp Security',
          classification: 'top-secret'
        }
      ],
      news: [
        {
          id: 'datacorp-expansion',
          title: 'DataCorp Announces Global Expansion',
          content: 'DataCorp CEO announces plans to expand surveillance capabilities to 50 new cities worldwide. Privacy advocates express concerns about the growing corporate surveillance network.',
          type: 'news-feed',
          timestamp: '2024-01-25 12:00:00',
          source: 'Tech Tribune'
        }
      ]
    }
  };

  return loreDatabase[storylineId] || {
    overview: [],
    characters: [],
    world: [],
    dataLogs: [],
    news: []
  };
};

export const LorePanel: React.FC<LorePanelProps> = ({ storyline, onClose }) => {
  const [activeTab, setActiveTab] = useState<LoreTab>('overview');
  const [selectedEntry, setSelectedEntry] = useState<LoreEntry | null>(null);
  
  const loreData = getLoreData(storyline.id);
  const Icon = storyline.icon;

  const tabs = [
    { id: 'overview' as LoreTab, name: 'Overview', icon: BookOpen, count: loreData.overview.length },
    { id: 'characters' as LoreTab, name: 'Characters', icon: Users, count: loreData.characters.length },
    { id: 'world' as LoreTab, name: 'World', icon: Globe, count: loreData.world.length },
    { id: 'dataLogs' as LoreTab, name: 'Data Logs', icon: Database, count: loreData.dataLogs.length },
    { id: 'news' as LoreTab, name: 'News Feed', icon: Radio, count: loreData.news.length }
  ];

  const getClassificationColor = (classification?: string) => {
    switch (classification) {
      case 'top-secret': return 'text-red-400 bg-red-400/10';
      case 'classified': return 'text-yellow-400 bg-yellow-400/10';
      case 'public': return 'text-green-400 bg-green-400/10';
      default: return 'text-gray-400 bg-gray-400/10';
    }
  };

  const renderLoreEntry = (entry: LoreEntry) => (
    <div
      key={entry.id}
      className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors cursor-pointer"
      onClick={() => setSelectedEntry(entry)}
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="text-white font-medium">{entry.title}</h4>
        {entry.classification && (
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${getClassificationColor(entry.classification)}`}>
            {entry.classification.toUpperCase()}
          </span>
        )}
      </div>
      
      <p className="text-gray-300 text-sm mb-3 line-clamp-3">{entry.content}</p>
      
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-4">
          {entry.source && (
            <span>Source: {entry.source}</span>
          )}
          {entry.timestamp && (
            <span>Time: {entry.timestamp}</span>
          )}
        </div>
        <ChevronRight className="w-4 h-4" />
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-lg border border-gray-700 w-full max-w-6xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className={`bg-gradient-to-r ${storyline.color} p-6 rounded-t-lg`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">{storyline.name}</h2>
                <p className="text-white/80">{storyline.theme}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-64 bg-gray-800 border-r border-gray-700 p-4">
            <div className="space-y-2">
              {tabs.map((tab) => {
                const TabIcon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left ${
                      activeTab === tab.id
                        ? 'bg-cyan-600 text-white'
                        : 'text-gray-400 hover:text-white hover:bg-gray-700'
                    }`}
                  >
                    <TabIcon className="w-4 h-4" />
                    <span className="flex-1">{tab.name}</span>
                    {tab.count > 0 && (
                      <span className="bg-gray-600 text-xs px-2 py-1 rounded-full">
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {selectedEntry ? (
              /* Detailed Entry View */
              <div>
                <button
                  onClick={() => setSelectedEntry(null)}
                  className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 mb-4"
                >
                  <ChevronRight className="w-4 h-4 rotate-180" />
                  <span>Back to {tabs.find(t => t.id === activeTab)?.name}</span>
                </button>
                
                <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-xl font-bold text-white">{selectedEntry.title}</h3>
                    {selectedEntry.classification && (
                      <span className={`text-sm px-3 py-1 rounded-full font-medium ${getClassificationColor(selectedEntry.classification)}`}>
                        {selectedEntry.classification.toUpperCase()}
                      </span>
                    )}
                  </div>
                  
                  <div className="prose prose-invert max-w-none">
                    <p className="text-gray-300 leading-relaxed whitespace-pre-line">
                      {selectedEntry.content}
                    </p>
                  </div>
                  
                  {(selectedEntry.source || selectedEntry.timestamp) && (
                    <div className="mt-6 pt-4 border-t border-gray-700">
                      <div className="flex items-center gap-6 text-sm text-gray-400">
                        {selectedEntry.source && (
                          <div className="flex items-center gap-2">
                            <Database className="w-4 h-4" />
                            <span>Source: {selectedEntry.source}</span>
                          </div>
                        )}
                        {selectedEntry.timestamp && (
                          <div className="flex items-center gap-2">
                            <Eye className="w-4 h-4" />
                            <span>Accessed: {selectedEntry.timestamp}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Entry List View */
              <div>
                <div className="flex items-center gap-3 mb-6">
                  {React.createElement(tabs.find(t => t.id === activeTab)?.icon || BookOpen, {
                    className: 'w-5 h-5 text-cyan-400'
                  })}
                  <h3 className="text-xl font-bold text-white">
                    {tabs.find(t => t.id === activeTab)?.name}
                  </h3>
                </div>
                
                <div className="space-y-4">
                  {loreData[activeTab].length === 0 ? (
                    <div className="text-center py-12">
                      <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                      <h4 className="text-lg font-semibold text-gray-400 mb-2">No Entries Available</h4>
                      <p className="text-gray-500">Complete quests to unlock more lore entries.</p>
                    </div>
                  ) : (
                    loreData[activeTab].map(renderLoreEntry)
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};