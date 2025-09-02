import React, { useState, useEffect } from 'react';
import { Trophy, Star, Zap, Crown, Target, Clock, Eye, Brain, Users, Lightbulb } from 'lucide-react';
import { CompletionMechanic, getApplicableCompletionMechanics } from '../../data/questTwists';
import { Quest, QuestReward } from '../../store/gameStore';

interface QuestCompletionCelebrationProps {
  quest: Quest;
  questState: any;
  rewards: QuestReward[];
  onClose: () => void;
  visible: boolean;
}

interface CelebrationAnimation {
  id: string;
  type: 'confetti' | 'sparkles' | 'pulse' | 'glow';
  duration: number;
  intensity: 'low' | 'medium' | 'high' | 'extreme';
}

const QuestCompletionCelebration: React.FC<QuestCompletionCelebrationProps> = ({
  quest,
  questState,
  rewards,
  onClose,
  visible
}) => {
  const [completionMechanics, setCompletionMechanics] = useState<CompletionMechanic[]>([]);
  const [showAnimation, setShowAnimation] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [celebrationText, setCelebrationText] = useState('');

  useEffect(() => {
    if (visible) {
      const mechanics = getApplicableCompletionMechanics(questState);
      setCompletionMechanics(mechanics);
      setShowAnimation(true);
      setCurrentStep(0);
      
      // Generate celebration text based on completion mechanics
      if (mechanics.length > 0) {
        setCelebrationText(mechanics[0].celebrationText);
      } else {
        setCelebrationText('Mission accomplished! Another successful hack in the books.');
      }
      
      // Auto-advance through celebration steps
      const timer = setTimeout(() => {
        setCurrentStep(1);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [visible, questState]);

  const getCompletionIcon = (mechanic: CompletionMechanic) => {
    switch (mechanic.id) {
      case 'perfect_execution':
        return <Target className="w-8 h-8 text-yellow-400" />;
      case 'speed_demon':
        return <Zap className="w-8 h-8 text-blue-400" />;
      case 'ghost_protocol':
        return <Eye className="w-8 h-8 text-purple-400" />;
      case 'master_hacker':
        return <Brain className="w-8 h-8 text-green-400" />;
      case 'social_engineer':
        return <Users className="w-8 h-8 text-pink-400" />;
      case 'creative_solution':
        return <Lightbulb className="w-8 h-8 text-orange-400" />;
      default:
        return <Trophy className="w-8 h-8 text-gold-400" />;
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common':
        return 'text-gray-400 border-gray-400';
      case 'uncommon':
        return 'text-green-400 border-green-400';
      case 'rare':
        return 'text-blue-400 border-blue-400';
      case 'legendary':
        return 'text-purple-400 border-purple-400';
      default:
        return 'text-gray-400 border-gray-400';
    }
  };

  const getRewardIcon = (reward: QuestReward) => {
    switch (reward.type) {
      case 'credits':
        return '💰';
      case 'experience':
        return '⭐';
      case 'reputation':
        return '👑';
      case 'skill_points':
        return '🎯';
      case 'equipment':
        return '⚙️';
      case 'ability':
        return '🔮';
      case 'story_unlock':
        return '📖';
      case 'achievement':
        return '🏆';
      case 'cosmetic':
        return '🎨';
      case 'title':
        return '👤';
      case 'access_unlock':
        return '🔑';
      default:
        return '🎁';
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
      <div className={`bg-gray-900 border-2 border-cyan-400 rounded-lg p-8 max-w-2xl w-full mx-4 transform transition-all duration-1000 ${
        showAnimation ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
      }`}>
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <div className={`p-4 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 animate-pulse`}>
              <Trophy className="w-12 h-12 text-white" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-cyan-400 mb-2">QUEST COMPLETE</h2>
          <h3 className="text-xl text-white mb-4">{quest.title}</h3>
        </div>

        {/* Completion Mechanics */}
        {completionMechanics.length > 0 && (
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-cyan-400 mb-3">Special Achievements</h4>
            <div className="space-y-3">
              {completionMechanics.map((mechanic, index) => (
                <div
                  key={mechanic.id}
                  className={`flex items-center p-3 rounded-lg border-2 ${getRarityColor(mechanic.rarity)} bg-gray-800 transform transition-all duration-500 delay-${index * 200}`}
                  style={{
                    animationDelay: `${index * 0.2}s`,
                    transform: currentStep >= 1 ? 'translateX(0)' : 'translateX(-100px)',
                    opacity: currentStep >= 1 ? 1 : 0
                  }}
                >
                  <div className="mr-4">
                    {getCompletionIcon(mechanic)}
                  </div>
                  <div className="flex-1">
                    <h5 className="font-semibold text-white">{mechanic.name}</h5>
                    <p className="text-sm text-gray-300">{mechanic.description}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs px-2 py-1 rounded ${getRarityColor(mechanic.rarity)} bg-opacity-20`}>
                      {mechanic.rarity.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Celebration Text */}
        <div className="mb-6 p-4 bg-gray-800 rounded-lg border border-cyan-400">
          <p className="text-cyan-300 text-center italic text-lg">
            {celebrationText}
          </p>
        </div>

        {/* Rewards */}
        <div className="mb-6">
          <h4 className="text-lg font-semibold text-cyan-400 mb-3">Rewards Earned</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {rewards.map((reward, index) => (
              <div
                key={`${reward.type}-${index}`}
                className="flex items-center p-3 bg-gray-800 rounded-lg border border-gray-600 hover:border-cyan-400 transition-colors"
                style={{
                  animationDelay: `${(index + completionMechanics.length) * 0.1}s`,
                  transform: currentStep >= 1 ? 'scale(1)' : 'scale(0.8)',
                  opacity: currentStep >= 1 ? 1 : 0,
                  transition: 'all 0.3s ease-out'
                }}
              >
                <span className="text-2xl mr-3">{getRewardIcon(reward)}</span>
                <div className="flex-1">
                  <div className="text-white font-medium">
                    {reward.type === 'credits' && `${reward.amount} Credits`}
                    {reward.type === 'experience' && `${reward.amount} XP`}
                    {reward.type === 'reputation' && `+${reward.amount} Rep`}
                    {reward.type === 'skill_points' && `${reward.amount} SP`}
                    {reward.type === 'equipment' && reward.itemId}
                    {reward.type === 'ability' && reward.itemId}
                    {reward.type === 'story_unlock' && 'Story Unlock'}
                    {reward.type === 'achievement' && reward.itemId}
                    {reward.type === 'cosmetic' && reward.itemId}
                    {reward.type === 'title' && reward.title}
                    {reward.type === 'access_unlock' && 'Access Granted'}
                  </div>
                  {reward.description && (
                    <div className="text-xs text-gray-400">{reward.description}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quest Stats */}
        <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-gray-800 rounded-lg">
            <Clock className="w-6 h-6 text-cyan-400 mx-auto mb-1" />
            <div className="text-white font-semibold">
              {Math.floor((questState.completionTime || 0) / 60000)}m
            </div>
            <div className="text-xs text-gray-400">Time</div>
          </div>
          <div className="text-center p-3 bg-gray-800 rounded-lg">
            <Target className="w-6 h-6 text-green-400 mx-auto mb-1" />
            <div className="text-white font-semibold">
              {questState.objectivesCompleted || 0}/{questState.totalObjectives || 0}
            </div>
            <div className="text-xs text-gray-400">Objectives</div>
          </div>
          <div className="text-center p-3 bg-gray-800 rounded-lg">
            <Star className="w-6 h-6 text-yellow-400 mx-auto mb-1" />
            <div className="text-white font-semibold">
              {questState.failures || 0}
            </div>
            <div className="text-xs text-gray-400">Failures</div>
          </div>
          <div className="text-center p-3 bg-gray-800 rounded-lg">
            <Crown className="w-6 h-6 text-purple-400 mx-auto mb-1" />
            <div className="text-white font-semibold">
              {questState.difficulty || 'Normal'}
            </div>
            <div className="text-xs text-gray-400">Difficulty</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-semibold transition-colors"
          >
            Continue Hacking
          </button>
        </div>
      </div>

      {/* Background Animation */}
      {showAnimation && (
        <div className="fixed inset-0 pointer-events-none">
          {/* Confetti Animation */}
          <div className="absolute inset-0">
            {Array.from({ length: 50 }).map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 bg-cyan-400 animate-bounce"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${2 + Math.random() * 2}s`
                }}
              />
            ))}
          </div>
          
          {/* Sparkles */}
          <div className="absolute inset-0">
            {Array.from({ length: 30 }).map((_, i) => (
              <div
                key={i}
                className="absolute text-yellow-400 animate-pulse"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 3}s`,
                  fontSize: `${0.5 + Math.random() * 1}rem`
                }}
              >
                ✨
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestCompletionCelebration;