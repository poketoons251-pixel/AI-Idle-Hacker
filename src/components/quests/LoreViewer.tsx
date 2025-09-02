import React, { useState } from 'react';
import {
  Book,
  Lock,
  Unlock,
  Calendar,
  Tag,
  ChevronDown,
  ChevronRight,
  FileText,
  Database,
  Users,
  Globe,
  Zap,
  X
} from 'lucide-react';
import { useGameStore } from '../../store/gameStore';

interface LoreViewerProps {
  onClose: () => void;
  storyLine?: string;
}

const LoreViewer: React.FC<LoreViewerProps> = ({
  onClose,
  storyLine
}) => {
  const { loreEntries, unlockedLore } = useGameStore();
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Filter lore entries based on storyline and category
  const filteredEntries = loreEntries.filter(entry => {
    const matchesStoryLine = !storyLine || entry.storyLine === storyLine;
    const matchesCategory = selectedCategory === 'all' || entry.category === selectedCategory;
    return matchesStoryLine && matchesCategory;
  });

  // Get unique categories
  const categories = Array.from(new Set(filteredEntries.map(entry => entry.category)));

  const toggleExpanded = (entryId: string) => {
    const newExpanded = new Set(expandedEntries);
    if (newExpanded.has(entryId)) {
      newExpanded.delete(entryId);
    } else {
      newExpanded.add(entryId);
    }
    setExpandedEntries(newExpanded);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'characters': return Users;
      case 'world': return Globe;
      case 'technology': return Zap;
      case 'data': return Database;
      default: return FileText;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'characters': return 'text-green-400';
      case 'world': return 'text-blue-400';
      case 'technology': return 'text-purple-400';
      case 'data': return 'text-amber-400';
      default: return 'text-gray-400';
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 bg-gray-700 hover:bg-gray-600 rounded-full flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4 text-gray-300" />
        </button>
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
            <Book className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">
              {storyLine ? `${storyLine} Lore` : 'Lore Database'}
            </h2>
            <p className="text-white/80 text-sm">
              {filteredEntries.filter(entry => unlockedLore.includes(entry.id)).length} of {filteredEntries.length} entries unlocked
            </p>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      {categories.length > 1 && (
        <div className="p-4 border-b border-gray-700">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              All Categories
            </button>
            {categories.map(category => {
              const CategoryIcon = getCategoryIcon(category);
              const categoryColor = getCategoryColor(category);
              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    selectedCategory === category
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <CategoryIcon className="w-3 h-3" />
                  <span className="capitalize">{category}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Lore Entries */}
      <div className="p-4 space-y-3 overflow-y-auto flex-1">
        {filteredEntries.length === 0 ? (
          <div className="text-center py-8">
            <Book className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No lore entries found for this category.</p>
          </div>
        ) : (
          filteredEntries.map(entry => {
            const isUnlocked = unlockedLore.includes(entry.id);
            const isExpanded = expandedEntries.has(entry.id);
            const CategoryIcon = getCategoryIcon(entry.category);
            const categoryColor = getCategoryColor(entry.category);

            return (
              <div
                key={entry.id}
                className={`border rounded-lg transition-all duration-200 ${
                  isUnlocked
                    ? 'border-gray-600 bg-gray-900'
                    : 'border-gray-700 bg-gray-800/50'
                }`}
              >
                <div
                  className="p-3 cursor-pointer hover:bg-gray-800/50 transition-colors"
                  onClick={() => isUnlocked && toggleExpanded(entry.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isUnlocked ? 'bg-indigo-600/20' : 'bg-gray-700'
                      }`}>
                        {isUnlocked ? (
                          <CategoryIcon className={`w-4 h-4 ${categoryColor}`} />
                        ) : (
                          <Lock className="w-4 h-4 text-gray-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className={`font-medium ${
                            isUnlocked ? 'text-white' : 'text-gray-500'
                          }`}>
                            {isUnlocked ? entry.title : '???'}
                          </h3>
                          <div className="flex items-center gap-1">
                            <Tag className="w-3 h-3 text-gray-500" />
                            <span className={`text-xs capitalize ${categoryColor}`}>
                              {entry.category}
                            </span>
                          </div>
                        </div>
                        {isUnlocked && (
                          <div className="flex items-center gap-3 text-xs text-gray-400">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>{formatTimestamp(entry.timestamp)}</span>
                            </div>
                            {entry.unlockedBy && (
                              <div className="flex items-center gap-1">
                                <Unlock className="w-3 h-3" />
                                <span>Unlocked by: {entry.unlockedBy}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    {isUnlocked && (
                      <div className="flex-shrink-0 ml-2">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Expanded Content */}
                {isUnlocked && isExpanded && (
                  <div className="px-3 pb-3">
                    <div className="bg-gray-800 rounded-lg p-3 ml-11">
                      <div className="prose prose-sm prose-invert max-w-none">
                        <div className="text-gray-300 leading-relaxed whitespace-pre-line">
                          {entry.content}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Locked State */}
                {!isUnlocked && (
                  <div className="px-3 pb-3">
                    <div className="bg-gray-800/50 rounded-lg p-3 ml-11 border border-gray-700">
                      <div className="flex items-center gap-2 text-gray-500">
                        <Lock className="w-4 h-4" />
                        <span className="text-sm">
                          {entry.unlockedBy
                            ? `Complete quest "${entry.unlockedBy}" to unlock this lore entry`
                            : 'This lore entry is locked'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
      </div>
    </div>
  );
};

export { LoreViewer };