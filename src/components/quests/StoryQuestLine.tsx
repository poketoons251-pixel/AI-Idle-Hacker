import React from 'react';
import {
  ChevronRight,
  Play,
  Lock,
  BookOpen,
  Users,
  Clock,
  Star,
  Zap
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

interface StoryQuestLineProps {
  storyline: StoryLine;
  onSelect: () => void;
  onShowLore: () => void;
}

export const StoryQuestLine: React.FC<StoryQuestLineProps> = ({
  storyline,
  onSelect,
  onShowLore
}) => {
  const Icon = storyline.icon;
  const isLocked = storyline.completedQuests === 0 && storyline.id !== 'origin-story';
  const progressPercentage = (storyline.completedQuests / storyline.totalQuests) * 100;

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden hover:border-gray-600 transition-colors">
      {/* Header with gradient */}
      <div className={`bg-gradient-to-r ${storyline.color} p-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{storyline.name}</h3>
              <p className="text-white/80 text-sm">{storyline.theme}</p>
            </div>
          </div>
          {isLocked && (
            <Lock className="w-5 h-5 text-white/60" />
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Description */}
        <p className="text-gray-300 text-sm mb-4">{storyline.description}</p>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-gray-400">Progress</span>
            <span className="text-xs text-gray-400">
              {storyline.completedQuests}/{storyline.totalQuests} quests
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className={`bg-gradient-to-r ${storyline.color} h-2 rounded-full transition-all duration-300`}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Current Quest */}
        {storyline.currentQuest && !isLocked && (
          <div className="bg-gray-900 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span className="text-xs text-yellow-400 font-medium">CURRENT QUEST</span>
            </div>
            <p className="text-white font-medium text-sm">{storyline.currentQuest}</p>
          </div>
        )}

        {/* Lore Context Preview */}
        <div className="bg-gray-900 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-4 h-4 text-cyan-400" />
            <span className="text-xs text-cyan-400 font-medium">WORLD CONTEXT</span>
          </div>
          <div className="space-y-2 text-xs">
            <div>
              <span className="text-gray-400">Setting:</span>
              <span className="text-gray-300 ml-2">{storyline.loreContext.setting}</span>
            </div>
            <div>
              <span className="text-gray-400">Key Characters:</span>
              <span className="text-gray-300 ml-2">
                {storyline.loreContext.keyCharacters.join(', ')}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={onSelect}
            disabled={isLocked}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              isLocked
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-cyan-600 hover:bg-cyan-700 text-white'
            }`}
          >
            {isLocked ? (
              <>
                <Lock className="w-4 h-4" />
                <span>Locked</span>
              </>
            ) : storyline.currentQuest ? (
              <>
                <Play className="w-4 h-4" />
                <span>Continue</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>Start Campaign</span>
              </>
            )}
          </button>
          
          <button
            onClick={onShowLore}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors flex items-center gap-2"
          >
            <BookOpen className="w-4 h-4" />
            <span>Lore</span>
          </button>
        </div>

        {/* Stats */}
        <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-700">
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3" />
              <span>Difficulty: {storyline.id === 'origin-story' ? 'Beginner' : 'Intermediate'}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>~{storyline.totalQuests * 15}min</span>
            </div>
          </div>
          
          {storyline.completedQuests > 0 && (
            <div className="flex items-center gap-1 text-xs text-green-400">
              <span>{Math.round(progressPercentage)}% Complete</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};