import React from 'react';
import {
  Target,
  Clock,
  Star,
  Award,
  Users,
  Zap,
  Shield,
  Brain,
  Globe,
  FileText,
  CheckCircle,
  Play,
  AlertTriangle,
  Coins,
  TrendingUp,
  GitBranch,
  ChevronRight,
  MessageSquare,
  Search,
  Crown
} from 'lucide-react';
import { Quest, QuestObjective, QuestReward } from '../../store/gameStore';

interface QuestCardProps {
  quest: Quest;
  onStart?: () => void;
  onContinue?: () => void;
  showActions?: boolean;
  onMakeChoice?: (questId: string, choiceId: string) => void;
}

const getQuestTypeIcon = (type: string) => {
  switch (type) {
    case 'story': return FileText;
    case 'daily': return Clock;
    case 'achievement': return Award;
    case 'tutorial': return Target;
    case 'network-infiltration': return Globe;
    case 'social-engineering': return Users;
    case 'data-extraction': return Brain;
    case 'system-defense': return Shield;
    default: return Target;
  }
};

const getQuestTypeColor = (type: string) => {
  switch (type) {
    case 'story': return 'from-purple-500 to-pink-500';
    case 'daily': return 'from-yellow-500 to-orange-500';
    case 'achievement': return 'from-green-500 to-teal-500';
    case 'tutorial': return 'from-blue-500 to-cyan-500';
    case 'network-infiltration': return 'from-red-500 to-orange-500';
    case 'social-engineering': return 'from-indigo-500 to-purple-500';
    case 'data-extraction': return 'from-cyan-500 to-blue-500';
    case 'system-defense': return 'from-green-500 to-emerald-500';
    default: return 'from-gray-500 to-gray-600';
  }
};

const getDifficultyInfo = (difficulty: number) => {
  if (difficulty <= 2) return { label: 'Beginner', color: 'text-green-400', stars: 1 };
  if (difficulty <= 4) return { label: 'Intermediate', color: 'text-yellow-400', stars: 2 };
  if (difficulty <= 6) return { label: 'Advanced', color: 'text-orange-400', stars: 3 };
  if (difficulty <= 8) return { label: 'Expert', color: 'text-red-400', stars: 4 };
  return { label: 'Master', color: 'text-purple-400', stars: 5 };
};

const formatReward = (reward: QuestReward) => {
  const finalAmount = reward.scalingFactor ? 
    Math.floor(reward.amount * reward.scalingFactor) : reward.amount;

  switch (reward.type) {
    case 'credits':
      return {
        icon: Coins,
        text: `${finalAmount?.toLocaleString()} Credits`,
        color: 'text-yellow-400'
      };
    case 'experience':
      return {
        icon: TrendingUp,
        text: `${finalAmount} XP`,
        color: 'text-blue-400'
      };
    case 'skill_points':
      return {
        icon: Star,
        text: `${finalAmount} Skill Points`,
        color: 'text-purple-400'
      };
    case 'reputation':
      return {
        icon: Users,
        text: `${finalAmount} Reputation`,
        color: 'text-orange-400'
      };
    case 'equipment':
      return {
        icon: Shield,
        text: reward.data?.name || reward.title || 'Equipment',
        color: 'text-green-400'
      };
    case 'ability':
      return {
        icon: Zap,
        text: reward.data?.name || reward.title || 'New Ability',
        color: 'text-cyan-400'
      };
    case 'story_unlock':
      return {
        icon: FileText,
        text: reward.title || 'Story Content',
        color: 'text-purple-400'
      };
    case 'achievement':
      return {
        icon: Award,
        text: reward.title || 'Achievement',
        color: 'text-gold-400'
      };
    case 'cosmetic':
      return {
        icon: Star,
        text: reward.title || 'Cosmetic Item',
        color: 'text-pink-400'
      };
    case 'title':
      return {
        icon: Crown,
        text: reward.title || 'Player Title',
        color: 'text-yellow-300'
      };
    case 'access_unlock':
      return {
        icon: Target,
        text: reward.title || 'New Access',
        color: 'text-red-400'
      };
    default:
      return {
        icon: Award,
        text: 'Reward',
        color: 'text-gray-400'
      };
  }
};

export const QuestCard: React.FC<QuestCardProps> = ({
  quest,
  onStart,
  onContinue,
  showActions = true
}) => {
  const TypeIcon = getQuestTypeIcon(quest.type);
  const typeColor = getQuestTypeColor(quest.type);
  const difficultyInfo = getDifficultyInfo(quest.difficulty);
  const isCompleted = quest.status === 'completed';
  const isActive = quest.status === 'active';
  const completedObjectives = quest.objectives.filter(obj => obj.completed).length;
  const progressPercentage = (completedObjectives / quest.objectives.length) * 100;

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden hover:border-gray-600 transition-all duration-200">
      {/* Header */}
      <div className={`bg-gradient-to-r ${typeColor} p-4`}>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <TypeIcon className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-bold text-white mb-1">{quest.title}</h3>
              <p className="text-white/80 text-sm leading-relaxed">{quest.description}</p>
            </div>
          </div>
          
          {/* Status Badge */}
          <div className="flex items-center gap-2 flex-shrink-0 ml-3">
            {isCompleted && (
              <div className="flex items-center gap-1 bg-green-500/20 text-green-400 px-2 py-1 rounded-full text-xs font-medium">
                <CheckCircle className="w-3 h-3" />
                <span>Complete</span>
              </div>
            )}
            {isActive && (
              <div className="flex items-center gap-1 bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full text-xs font-medium">
                <Zap className="w-3 h-3" />
                <span>Active</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Quest Metadata */}
        <div className="flex items-center gap-4 mb-4 text-sm">
          {/* Difficulty */}
          <div className="flex items-center gap-1">
            <div className="flex items-center">
              {Array.from({ length: 5 }, (_, i) => (
                <Star
                  key={i}
                  className={`w-3 h-3 ${
                    i < difficultyInfo.stars
                      ? `${difficultyInfo.color} fill-current`
                      : 'text-gray-600'
                  }`}
                />
              ))}
            </div>
            <span className={`${difficultyInfo.color} font-medium ml-1`}>
              {difficultyInfo.label}
            </span>
          </div>

          {/* Category */}
          <div className="flex items-center gap-1 text-gray-400">
            <Target className="w-3 h-3" />
            <span className="capitalize">{quest.category}</span>
          </div>

          {/* Estimated Time */}
          {quest.estimatedTime && (
            <div className="flex items-center gap-1 text-gray-400">
              <Clock className="w-3 h-3" />
              <span>{quest.estimatedTime}min</span>
            </div>
          )}
        </div>

        {/* Progress Bar (for active quests) */}
        {isActive && (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-400">Progress</span>
              <span className="text-sm text-gray-400">
                {completedObjectives}/{quest.objectives.length} objectives
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className={`bg-gradient-to-r ${typeColor} h-2 rounded-full transition-all duration-300`}
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Narrative Context (for story quests) */}
        {quest.type === 'story' && quest.narrativeContext && (
          <div className="bg-gray-900 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-cyan-400" />
              <span className="text-xs text-cyan-400 font-medium">STORY CONTEXT</span>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">
              {quest.narrativeContext}
            </p>
          </div>
        )}

        {/* Key Objectives Preview */}
        {quest.objectives.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-400 mb-2">Objectives</h4>
            <div className="space-y-2">
              {quest.objectives.slice(0, 3).map((objective, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  {objective.completed ? (
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                  ) : (
                    <div className="w-4 h-4 border border-gray-600 rounded-full flex-shrink-0" />
                  )}
                  <span className={objective.completed ? 'text-gray-400 line-through' : 'text-gray-300'}>
                    {objective.description}
                  </span>
                </div>
              ))}
              {quest.objectives.length > 3 && (
                <div className="text-xs text-gray-500 ml-6">
                  +{quest.objectives.length - 3} more objectives
                </div>
              )}
            </div>
          </div>
        )}

        {/* Player Choices (for story quests with choices) */}
        {quest.type === 'story' && quest.choices && quest.choices.length > 0 && isActive && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-3">
              <GitBranch className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-medium text-purple-400">CHOOSE YOUR PATH</span>
            </div>
            <div className="space-y-2">
              {quest.choices.map((choice, index) => (
                <button
                  key={index}
                  onClick={() => onMakeChoice && onMakeChoice(quest.id, choice.id)}
                  className="w-full text-left p-3 bg-gray-900 hover:bg-gray-800 border border-gray-700 hover:border-purple-500/50 rounded-lg transition-all duration-200 group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-gray-200 font-medium mb-1 group-hover:text-purple-300">
                        {choice.text}
                      </p>
                      <p className="text-gray-400 text-xs leading-relaxed">
                        {choice.description}
                      </p>
                      {choice.consequences && choice.consequences.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {choice.consequences.map((consequence, cIndex) => (
                            <span
                              key={cIndex}
                              className="text-xs px-2 py-1 bg-gray-800 text-gray-300 rounded"
                            >
                              {consequence.description}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-purple-400 flex-shrink-0 ml-2" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Character Dialogue (for story quests) */}
        {quest.type === 'story' && quest.characterDialogue && (
          <div className="bg-gray-900 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="w-4 h-4 text-green-400" />
              <span className="text-xs text-green-400 font-medium">DIALOGUE</span>
            </div>
            <div className="space-y-2">
              {Object.entries(quest.characterDialogue).map(([character, dialogue], index) => (
                <div key={index} className="border-l-2 border-green-400/30 pl-3">
                  <p className="text-green-300 text-xs font-medium mb-1">{character}:</p>
                  <p className="text-gray-300 text-sm leading-relaxed italic">
                    "{dialogue}"
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Environmental Clues (for story quests) */}
        {quest.type === 'story' && quest.environmentalClues && quest.environmentalClues.length > 0 && (
          <div className="bg-gray-900 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Search className="w-4 h-4 text-amber-400" />
              <span className="text-xs text-amber-400 font-medium">ENVIRONMENTAL CLUES</span>
            </div>
            <div className="space-y-1">
              {quest.environmentalClues.map((clue, index) => (
                <div key={index} className="flex items-start gap-2">
                  <div className="w-1 h-1 bg-amber-400 rounded-full mt-2 flex-shrink-0" />
                  <p className="text-gray-300 text-sm leading-relaxed">{clue}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rewards */}
        {Array.isArray(quest.rewards) && quest.rewards.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-400 mb-2">Rewards</h4>
            <div className="flex flex-wrap gap-2">
              {quest.rewards.map((reward, index) => {
                const rewardInfo = formatReward(reward);
                const RewardIcon = rewardInfo.icon;
                return (
                  <div
                    key={index}
                    className="flex items-center gap-1 bg-gray-900 rounded px-2 py-1 text-xs"
                  >
                    <RewardIcon className={`w-3 h-3 ${rewardInfo.color}`} />
                    <span className="text-gray-300">{rewardInfo.text}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Prerequisites Warning */}
        {quest.prerequisites && quest.prerequisites.length > 0 && !isCompleted && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-yellow-400" />
              <span className="text-xs text-yellow-400 font-medium">PREREQUISITES</span>
            </div>
            <p className="text-yellow-300 text-xs">
              Complete required quests or meet skill requirements to unlock this quest.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        {showActions && (
          <div className="flex gap-2 pt-4 border-t border-gray-700">
            {!isCompleted && !isActive && onStart && (
              <button
                onClick={onStart}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-colors"
              >
                <Play className="w-4 h-4" />
                <span>Start Quest</span>
              </button>
            )}
            
            {isActive && onContinue && (
              <button
                onClick={onContinue}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
              >
                <Target className="w-4 h-4" />
                <span>Continue Quest</span>
              </button>
            )}
            
            {isCompleted && (
              <div className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-700 text-gray-400 rounded-lg font-medium">
                <CheckCircle className="w-4 h-4" />
                <span>Completed</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};