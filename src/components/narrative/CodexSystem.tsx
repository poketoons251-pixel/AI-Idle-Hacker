import React, { useState, useMemo } from 'react';
import { useGameStore } from '../../store/gameStore';
import { loreEntries, getLoreEntriesByStoryLine, getLoreById } from '../../data/loreEntries';
import { dataLogs, newsArticles, environmentalClues, getUnlockedDataLogs, getUnlockedNewsArticles } from '../../data/environmentalStory';
import { Book, FileText, Newspaper, Search, Eye, Lock, Clock, MapPin, User, Zap } from 'lucide-react';

interface CodexSystemProps {
  className?: string;
}

type ContentType = 'lore' | 'data_logs' | 'news' | 'clues';
type StoryLineFilter = 'all' | 'origin' | 'corporate' | 'ai_liberation' | 'resistance' | 'deep_web';

const CodexSystem: React.FC<CodexSystemProps> = ({ className = '' }) => {
  const { player } = useGameStore();
  const [activeTab, setActiveTab] = useState<ContentType>('lore');
  const [storyLineFilter, setStoryLineFilter] = useState<StoryLineFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<string | null>(null);

  // Mock player progress for demonstration
  const playerProgress = {
    completedQuests: ['origin-1', 'origin-2', 'corp-1', 'ai-1'],
    visitedLocations: ['underground_tunnels', 'corporate_district', 'hacker_den'],
    activeQuests: ['resistance-1'],
    startTime: Date.now() - 86400000, // 1 day ago
    reputation: player.reputation || 0,
    skills: player.skills || {}
  };

  const unlockedLore = useMemo(() => {
    return loreEntries.filter(entry => 
entry.id === 'origin-001' // Simplified for now as player.unlockedLore doesn't exist
    );
  }, [player]);

  const unlockedDataLogs = useMemo(() => {
    return getUnlockedDataLogs(playerProgress);
  }, [playerProgress]);

  const unlockedNews = useMemo(() => {
    return getUnlockedNewsArticles(playerProgress);
  }, [playerProgress]);

  const availableClues = useMemo(() => {
    return environmentalClues.filter(clue => 
      playerProgress.visitedLocations.includes(clue.location.toLowerCase().replace(/\s+/g, '_'))
    );
  }, [playerProgress]);

  const filteredContent = useMemo(() => {
    let content: any[] = [];
    
    switch (activeTab) {
      case 'lore':
        content = unlockedLore;
        break;
      case 'data_logs':
        content = unlockedDataLogs;
        break;
      case 'news':
        content = unlockedNews;
        break;
      case 'clues':
        content = availableClues;
        break;
    }

    // Filter by story line
    if (storyLineFilter !== 'all') {
      content = content.filter(item => 
        item.storyLine === storyLineFilter || 
        (activeTab === 'clues' && item.relatedQuest?.includes(storyLineFilter))
      );
    }

    // Filter by search term
    if (searchTerm) {
      content = content.filter(item => 
        item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.headline?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return content;
  }, [activeTab, storyLineFilter, searchTerm, unlockedLore, unlockedDataLogs, unlockedNews, availableClues]);

  const getTabIcon = (tab: ContentType) => {
    switch (tab) {
      case 'lore': return <Book className="w-4 h-4" />;
      case 'data_logs': return <FileText className="w-4 h-4" />;
      case 'news': return <Newspaper className="w-4 h-4" />;
      case 'clues': return <Search className="w-4 h-4" />;
    }
  };

  const getClassificationColor = (classification: string) => {
    switch (classification) {
      case 'public': return 'text-green-400';
      case 'restricted': return 'text-yellow-400';
      case 'classified': return 'text-orange-400';
      case 'top_secret': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getCredibilityColor = (credibility: string) => {
    switch (credibility) {
      case 'verified': return 'text-green-400';
      case 'unverified': return 'text-yellow-400';
      case 'propaganda': return 'text-red-400';
      case 'leaked': return 'text-purple-400';
      default: return 'text-gray-400';
    }
  };

  const getSignificanceColor = (significance: string) => {
    switch (significance) {
      case 'flavor': return 'text-gray-400';
      case 'hint': return 'text-blue-400';
      case 'important': return 'text-yellow-400';
      case 'critical': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const renderContentItem = (item: any, index: number) => {
    const isSelected = selectedEntry === item.id;
    
    return (
      <div
        key={item.id}
        className={`p-4 border border-gray-700 rounded-lg cursor-pointer transition-all duration-200 hover:border-cyan-500 ${
          isSelected ? 'border-cyan-400 bg-cyan-900/20' : 'bg-gray-800/50'
        }`}
        onClick={() => setSelectedEntry(isSelected ? null : item.id)}
      >
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-semibold text-cyan-400">
            {item.title || item.headline}
          </h3>
          <div className="flex items-center gap-2 text-sm">
            {activeTab === 'data_logs' && (
              <span className={`px-2 py-1 rounded text-xs ${getClassificationColor(item.classification)}`}>
                {item.classification?.toUpperCase()}
              </span>
            )}
            {activeTab === 'news' && (
              <span className={`px-2 py-1 rounded text-xs ${getCredibilityColor(item.credibility)}`}>
                {item.credibility?.toUpperCase()}
              </span>
            )}
            {activeTab === 'clues' && (
              <span className={`px-2 py-1 rounded text-xs ${getSignificanceColor(item.significance)}`}>
                {item.significance?.toUpperCase()}
              </span>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
          {item.source && (
            <div className="flex items-center gap-1">
              <User className="w-3 h-3" />
              <span>{item.source}</span>
            </div>
          )}
          {item.author && (
            <div className="flex items-center gap-1">
              <User className="w-3 h-3" />
              <span>{item.author}</span>
            </div>
          )}
          {item.location && (
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              <span>{item.location}</span>
            </div>
          )}
          {item.timestamp && (
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{new Date(item.timestamp).toLocaleDateString()}</span>
            </div>
          )}
          {item.publishDate && (
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{new Date(item.publishDate).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        <p className="text-gray-300 text-sm mb-3 line-clamp-3">
          {item.content?.substring(0, 200) || item.description?.substring(0, 200)}...
        </p>

        {item.storyLine && (
          <div className="flex items-center gap-2">
            <Zap className="w-3 h-3 text-purple-400" />
            <span className="text-xs text-purple-400 capitalize">
              {item.storyLine.replace('_', ' ')} Story Line
            </span>
          </div>
        )}

        {isSelected && (
          <div className="mt-4 pt-4 border-t border-gray-600">
            <div className="prose prose-invert max-w-none">
              <div className="whitespace-pre-wrap text-gray-300">
                {item.content || item.description}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`bg-gray-900 rounded-lg border border-gray-700 ${className}`}>
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-cyan-400 flex items-center gap-2">
            <Book className="w-6 h-6" />
            Digital Codex
          </h2>
          <div className="text-sm text-gray-400">
            {filteredContent.length} entries available
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search codex entries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Content Type Tabs */}
        <div className="flex gap-2 mb-4">
          {(['lore', 'data_logs', 'news', 'clues'] as ContentType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                activeTab === tab
                  ? 'bg-cyan-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {getTabIcon(tab)}
              <span className="capitalize">{tab.replace('_', ' ')}</span>
            </button>
          ))}
        </div>

        {/* Story Line Filter */}
        <div className="flex gap-2 flex-wrap">
          {(['all', 'origin', 'corporate', 'ai_liberation', 'resistance', 'deep_web'] as StoryLineFilter[]).map((filter) => (
            <button
              key={filter}
              onClick={() => setStoryLineFilter(filter)}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                storyLineFilter === filter
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {filter === 'all' ? 'All Stories' : filter.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="p-6">
        {filteredContent.length === 0 ? (
          <div className="text-center py-12">
            <Lock className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-400 mb-2">No Entries Available</h3>
            <p className="text-gray-500">
              Complete quests and explore the digital world to unlock codex entries.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredContent.map((item, index) => renderContentItem(item, index))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CodexSystem;