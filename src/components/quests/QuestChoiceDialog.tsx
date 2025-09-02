import React, { useState } from 'react';
import {
  X,
  GitBranch,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  TrendingUp,
  Users,
  Shield,
  Target
} from 'lucide-react';
import { Quest, QuestChoice, QuestConsequence } from '../../store/gameStore';

interface QuestChoiceDialogProps {
  quest: Quest;
  isOpen: boolean;
  onClose: () => void;
  onMakeChoice: (questId: string, choiceId: string) => void;
  playerStats?: {
    level: number;
    credits: number;
    reputation: number;
    skills: Record<string, number>;
  };
}

const QuestChoiceDialog: React.FC<QuestChoiceDialogProps> = ({
  quest,
  isOpen,
  onClose,
  onMakeChoice,
  playerStats
}) => {
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  if (!isOpen || !quest.choices) return null;

  const handleChoiceSelect = (choiceId: string) => {
    setSelectedChoice(choiceId);
    setIsConfirming(false);
  };

  const handleConfirm = () => {
    if (selectedChoice) {
      onMakeChoice(quest.id, selectedChoice);
      onClose();
      setSelectedChoice(null);
      setIsConfirming(false);
    }
  };

  const canMakeChoice = (choice: QuestChoice): boolean => {
    if (!choice.requirements || !playerStats) return true;
    
    return Object.entries(choice.requirements).every(([key, value]) => {
      switch (key) {
        case 'level':
          return playerStats.level >= (value as number);
        case 'reputation':
          return playerStats.reputation >= (value as number);
        case 'skill':
          return playerStats.skills[value as string] >= (choice.requirements?.level || 1);
        default:
          return true;
      }
    });
  };

  const getConsequenceIcon = (consequence: QuestConsequence) => {
    switch (consequence.type) {
      case 'reputation': return Users;
      case 'skill': return Target;
      case 'unlock_quest': return CheckCircle;
      case 'unlock_target': return Target;
      case 'story_branch': return GitBranch;
      default: return CheckCircle;
    }
  };

  const getConsequenceColor = (consequence: QuestConsequence) => {
    const isPositive = typeof consequence.value === 'number' ? consequence.value > 0 : true;
    switch (consequence.type) {
      case 'reputation': return isPositive ? 'text-green-400' : 'text-red-400';
      case 'skill': return isPositive ? 'text-purple-400' : 'text-red-400';
      case 'unlock_quest': return 'text-blue-400';
      case 'unlock_target': return 'text-yellow-400';
      case 'story_branch': return 'text-cyan-400';
      default: return 'text-gray-400';
    }
  };

  const selectedChoiceData = quest.choices.find(c => c.id === selectedChoice);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg border border-gray-700 max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <GitBranch className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-bold text-white mb-1">Choose Your Path</h2>
                <p className="text-white/80 text-sm">{quest.title}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/60 hover:text-white transition-colors p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-4 max-h-[calc(90vh-120px)] overflow-y-auto">
          {/* Quest Context */}
          {quest.narrativeContext && (
            <div className="bg-gray-900 rounded-lg p-3 mb-4">
              <p className="text-gray-300 text-sm leading-relaxed">
                {quest.narrativeContext}
              </p>
            </div>
          )}

          {/* Character Dialogue */}
          {quest.characterDialogue && (
            <div className="bg-gray-900 rounded-lg p-3 mb-4">
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

          {/* Choices */}
          <div className="space-y-3 mb-4">
            <h3 className="text-white font-medium flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-purple-400" />
              Available Choices
            </h3>
            {quest.choices.map((choice, index) => {
              const canChoose = canMakeChoice(choice);
              const isSelected = selectedChoice === choice.id;
              
              return (
                <button
                  key={choice.id}
                  onClick={() => canChoose && handleChoiceSelect(choice.id)}
                  disabled={!canChoose}
                  className={`w-full text-left p-4 rounded-lg border transition-all duration-200 ${
                    isSelected
                      ? 'border-purple-500 bg-purple-500/10'
                      : canChoose
                      ? 'border-gray-600 bg-gray-900 hover:border-purple-500/50 hover:bg-gray-800'
                      : 'border-gray-700 bg-gray-800/50 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className={`font-medium ${
                      canChoose ? 'text-white' : 'text-gray-500'
                    }`}>
                      {choice.text}
                    </h4>
                    {isSelected && (
                      <CheckCircle className="w-5 h-5 text-purple-400 flex-shrink-0" />
                    )}
                  </div>
                  
                  <p className={`text-sm leading-relaxed mb-3 ${
                    canChoose ? 'text-gray-300' : 'text-gray-500'
                  }`}>
                    {choice.description}
                  </p>

                  {/* Requirements */}
                  {choice.requirements && Object.keys(choice.requirements).length > 0 && (
                    <div className="mb-3">
                      <div className="flex items-center gap-1 mb-2">
                        <AlertTriangle className="w-3 h-3 text-amber-400" />
                        <span className="text-xs text-amber-400 font-medium">REQUIREMENTS</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(choice.requirements).map(([key, value], reqIndex) => {
                          const isMet = playerStats ? (() => {
                            switch (key) {
                              case 'level': return playerStats.level >= (value as number);
                              case 'reputation': return playerStats.reputation >= (value as number);
                              case 'skill': return playerStats.skills[value as string] >= (choice.requirements?.level || 1);
                              default: return true;
                            }
                          })() : false;
                          
                          return (
                            <span
                              key={reqIndex}
                              className={`text-xs px-2 py-1 rounded ${
                                isMet
                                  ? 'bg-green-500/20 text-green-400'
                                  : 'bg-red-500/20 text-red-400'
                              }`}
                            >
                              {key === 'skill' ? `${value} skill` : `${key} ${value}+`}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Consequences Preview */}
                  {choice.consequences && choice.consequences.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1 mb-2">
                        <Clock className="w-3 h-3 text-blue-400" />
                        <span className="text-xs text-blue-400 font-medium">CONSEQUENCES</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {choice.consequences.map((consequence, cIndex) => {
                          const ConsequenceIcon = getConsequenceIcon(consequence);
                          const consequenceColor = getConsequenceColor(consequence);
                          
                          return (
                            <div
                              key={cIndex}
                              className="flex items-center gap-1 text-xs px-2 py-1 bg-gray-800 rounded"
                            >
                              <ConsequenceIcon className={`w-3 h-3 ${consequenceColor}`} />
                              <span className="text-gray-300">{consequence.description}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Confirmation Section */}
          {selectedChoice && selectedChoiceData && (
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-medium text-purple-400">CHOICE SELECTED</span>
              </div>
              <p className="text-gray-300 text-sm mb-3">
                You have selected: <span className="font-medium text-white">{selectedChoiceData.text}</span>
              </p>
              <p className="text-gray-400 text-xs mb-4">
                This choice will have permanent consequences and cannot be undone.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleConfirm}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Confirm Choice
                </button>
                <button
                  onClick={() => setSelectedChoice(null)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors"
                >
                  Change
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export { QuestChoiceDialog };