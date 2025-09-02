import React, { useState, useEffect } from 'react';
import { AlertTriangle, Zap, Eye, Brain, Users, Lightbulb, Clock, Shield } from 'lucide-react';
import { QuestTwist, TwistChoice, checkTwistTrigger, questTwists } from '../../data/questTwists';
import { Quest } from '../../store/gameStore';

interface QuestTwistHandlerProps {
  quest: Quest;
  questState: any;
  player: any;
  onTwistTriggered: (twist: QuestTwist, choice?: TwistChoice) => void;
  onChoiceMade: (choice: TwistChoice) => void;
}

interface ActiveTwist {
  twist: QuestTwist;
  triggeredAt: number;
  choicesMade: string[];
}

const QuestTwistHandler: React.FC<QuestTwistHandlerProps> = ({
  quest,
  questState,
  player,
  onTwistTriggered,
  onChoiceMade
}) => {
  const [activeTwist, setActiveTwist] = useState<ActiveTwist | null>(null);
  const [showTwistModal, setShowTwistModal] = useState(false);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [twistHistory, setTwistHistory] = useState<ActiveTwist[]>([]);

  useEffect(() => {
    // Check for twist triggers periodically
    const checkForTwists = () => {
      if (activeTwist) return; // Don't trigger new twists while one is active
      
      for (const twist of questTwists) {
        // Skip if this twist has already been triggered for this quest
        if (twistHistory.some(h => h.twist.id === twist.id)) continue;
        
        if (checkTwistTrigger(twist, questState, player)) {
          const newActiveTwist: ActiveTwist = {
            twist,
            triggeredAt: Date.now(),
            choicesMade: []
          };
          
          setActiveTwist(newActiveTwist);
          setShowTwistModal(true);
          onTwistTriggered(twist);
          break;
        }
      }
    };

    const interval = setInterval(checkForTwists, 2000); // Check every 2 seconds
    return () => clearInterval(interval);
  }, [questState, player, activeTwist, twistHistory, onTwistTriggered]);

  const getTwistIcon = (twistId: string) => {
    switch (twistId) {
      case 'double_agent_reveal':
        return <Eye className="w-8 h-8 text-red-400" />;
      case 'ai_awakening':
        return <Brain className="w-8 h-8 text-blue-400" />;
      case 'memory_fragment':
        return <Lightbulb className="w-8 h-8 text-yellow-400" />;
      case 'virus_evolution':
        return <Zap className="w-8 h-8 text-purple-400" />;
      case 'corporate_mole':
        return <Shield className="w-8 h-8 text-orange-400" />;
      case 'quantum_anomaly':
        return <AlertTriangle className="w-8 h-8 text-pink-400" />;
      default:
        return <AlertTriangle className="w-8 h-8 text-gray-400" />;
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common':
        return 'border-gray-400 bg-gray-800';
      case 'uncommon':
        return 'border-green-400 bg-green-900 bg-opacity-20';
      case 'rare':
        return 'border-blue-400 bg-blue-900 bg-opacity-20';
      case 'legendary':
        return 'border-purple-400 bg-purple-900 bg-opacity-20';
      default:
        return 'border-gray-400 bg-gray-800';
    }
  };

  const canMakeChoice = (choice: TwistChoice): boolean => {
    if (!choice.requirements) return true;
    
    const { skill, level, reputation } = choice.requirements;
    
    if (skill && level) {
      const playerSkillLevel = player.skills?.[skill] || 0;
      if (playerSkillLevel < level) return false;
    }
    
    if (reputation && (player.reputation || 0) < reputation) {
      return false;
    }
    
    return true;
  };

  const handleChoiceSelect = (choice: TwistChoice) => {
    if (!canMakeChoice(choice)) return;
    
    setSelectedChoice(choice.id);
    
    // Add choice to history
    if (activeTwist) {
      const updatedTwist = {
        ...activeTwist,
        choicesMade: [...activeTwist.choicesMade, choice.id]
      };
      setActiveTwist(updatedTwist);
    }
    
    onChoiceMade(choice);
    
    // Close modal after a delay
    setTimeout(() => {
      setShowTwistModal(false);
      if (activeTwist) {
        setTwistHistory(prev => [...prev, activeTwist]);
      }
      setActiveTwist(null);
      setSelectedChoice(null);
    }, 2000);
  };

  const getChoiceRequirementText = (choice: TwistChoice): string => {
    if (!choice.requirements) return '';
    
    const requirements = [];
    if (choice.requirements.skill && choice.requirements.level) {
      requirements.push(`${choice.requirements.skill} ${choice.requirements.level}+`);
    }
    if (choice.requirements.reputation) {
      requirements.push(`${choice.requirements.reputation} reputation`);
    }
    
    return requirements.length > 0 ? `Requires: ${requirements.join(', ')}` : '';
  };

  if (!showTwistModal || !activeTwist) {
    return null;
  }

  const { twist } = activeTwist;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <div className={`max-w-2xl w-full mx-4 p-6 rounded-lg border-2 ${getRarityColor(twist.rarity)} transform transition-all duration-500 scale-100`}>
        {/* Header */}
        <div className="flex items-center mb-6">
          <div className="mr-4">
            {getTwistIcon(twist.id)}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">{twist.name}</h2>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                twist.rarity === 'legendary' ? 'bg-purple-600 text-white' :
                twist.rarity === 'rare' ? 'bg-blue-600 text-white' :
                twist.rarity === 'uncommon' ? 'bg-green-600 text-white' :
                'bg-gray-600 text-white'
              }`}>
                {twist.rarity.toUpperCase()}
              </span>
            </div>
            <p className="text-gray-300 mt-1">{twist.description}</p>
          </div>
        </div>

        {/* Narrative Text */}
        <div className="mb-6 p-4 bg-gray-900 rounded-lg border border-cyan-400">
          <p className="text-cyan-300 leading-relaxed">
            {twist.narrativeText}
          </p>
        </div>

        {/* Choices */}
        {twist.choices && twist.choices.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-white mb-3">Choose your response:</h3>
            {twist.choices.map((choice, index) => {
              const canChoose = canMakeChoice(choice);
              const isSelected = selectedChoice === choice.id;
              
              return (
                <button
                  key={choice.id}
                  onClick={() => handleChoiceSelect(choice)}
                  disabled={!canChoose || selectedChoice !== null}
                  className={`w-full p-4 rounded-lg border-2 text-left transition-all duration-300 ${
                    isSelected
                      ? 'border-cyan-400 bg-cyan-900 bg-opacity-30'
                      : canChoose
                      ? 'border-gray-600 bg-gray-800 hover:border-cyan-400 hover:bg-gray-700'
                      : 'border-gray-700 bg-gray-900 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className={`font-medium ${
                        canChoose ? 'text-white' : 'text-gray-500'
                      }`}>
                        {choice.text}
                      </p>
                      
                      {choice.requirements && (
                        <p className={`text-xs mt-2 ${
                          canChoose ? 'text-cyan-400' : 'text-red-400'
                        }`}>
                          {getChoiceRequirementText(choice)}
                        </p>
                      )}
                      
                      {/* Preview consequences */}
                      {choice.consequences && choice.consequences.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-gray-400 mb-1">Consequences:</p>
                          <ul className="text-xs text-gray-300 space-y-1">
                            {choice.consequences.slice(0, 2).map((consequence, i) => (
                              <li key={i} className="flex items-center">
                                <span className="w-1 h-1 bg-cyan-400 rounded-full mr-2"></span>
                                {consequence.type.replace('_', ' ').toUpperCase()}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                    
                    {isSelected && (
                      <div className="ml-4 flex items-center">
                        <div className="w-6 h-6 bg-cyan-400 rounded-full flex items-center justify-center">
                          <span className="text-black text-xs font-bold">✓</span>
                        </div>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* No choices - automatic twist */}
        {(!twist.choices || twist.choices.length === 0) && (
          <div className="text-center">
            <button
              onClick={() => {
                setShowTwistModal(false);
                if (activeTwist) {
                  setTwistHistory(prev => [...prev, activeTwist]);
                }
                setActiveTwist(null);
              }}
              className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-semibold transition-colors"
            >
              Continue
            </button>
          </div>
        )}

        {/* Timer for automatic twists */}
        {(!twist.choices || twist.choices.length === 0) && (
          <div className="mt-4 flex items-center justify-center text-gray-400">
            <Clock className="w-4 h-4 mr-2" />
            <span className="text-sm">The situation unfolds...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestTwistHandler;