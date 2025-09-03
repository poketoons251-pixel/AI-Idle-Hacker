import React, { useState, useEffect } from 'react';
import { X, Clock, Zap, Users, Target } from 'lucide-react';

interface StoryChoice {
  id: string;
  choice_text: string;
  choice_description?: string;
  consequences: Record<string, number>;
  next_choice_key?: string;
  is_terminal: boolean;
  choice_order: number;
  requirements?: {
    min_level?: number;
    required_items?: string[];
    min_reputation?: number;
  };
}

interface StoryEpisode {
  id: string;
  title: string;
  description: string;
  episode_number: number;
  narrative_context: Record<string, any>;
}

interface StoryChoiceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  episode: StoryEpisode | null;
  currentChoiceKey: string;
  availableChoices: StoryChoice[];
  progressPercentage: number;
  onMakeChoice: (choiceId: string) => Promise<void>;
  isLoading?: boolean;
}

const StoryChoiceDialog: React.FC<StoryChoiceDialogProps> = ({
  isOpen,
  onClose,
  episode,
  currentChoiceKey,
  availableChoices,
  progressPercentage,
  onMakeChoice,
  isLoading = false
}) => {
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedChoice(null);
    }
  }, [isOpen, currentChoiceKey]);

  const handleChoiceSelect = async (choiceId: string) => {
    if (isProcessing || isLoading) return;
    
    setSelectedChoice(choiceId);
    setIsProcessing(true);
    
    try {
      await onMakeChoice(choiceId);
    } catch (error) {
      console.error('Error making choice:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const getConsequenceIcon = (type: string) => {
    switch (type) {
      case 'reputation': return <Users className="w-4 h-4" />;
      case 'credits': return <Zap className="w-4 h-4" />;
      case 'items': return <Target className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getConsequenceColor = (type: string, value: number) => {
    const isPositive = value > 0;
    switch (type) {
      case 'reputation':
        return isPositive ? 'text-blue-400' : 'text-red-400';
      case 'credits':
        return isPositive ? 'text-green-400' : 'text-red-400';
      case 'items':
        return 'text-purple-400';
      default:
        return isPositive ? 'text-cyan-400' : 'text-orange-400';
    }
  };

  const formatConsequenceValue = (type: string, value: number) => {
    const prefix = value > 0 ? '+' : '';
    switch (type) {
      case 'credits':
        return `${prefix}${value.toLocaleString()}`;
      case 'reputation':
        return `${prefix}${value}`;
      default:
        return `${prefix}${value}`;
    }
  };

  if (!isOpen || !episode) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-cyan-500/30 rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-900/50 to-blue-900/50 p-6 border-b border-cyan-500/30">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-cyan-400 mb-2">
                {episode.title}
              </h2>
              <p className="text-gray-300 text-sm">
                Episode {episode.episode_number} • Progress: {progressPercentage}%
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
              disabled={isProcessing}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Episode Description */}
          <div className="mb-6">
            <p className="text-gray-300 leading-relaxed">
              {episode.description}
            </p>
            {episode.narrative_context?.current_situation && (
              <div className="mt-4 p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
                <p className="text-cyan-300 text-sm font-medium mb-2">Current Situation:</p>
                <p className="text-gray-300 text-sm">
                  {episode.narrative_context.current_situation}
                </p>
              </div>
            )}
          </div>

          {/* Available Choices */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-white mb-4">
              Choose Your Path:
            </h3>
            
            {availableChoices.map((choice, index) => {
              const isSelected = selectedChoice === choice.id;
              const isDisabled = isProcessing || isLoading;
              
              return (
                <div
                  key={choice.id}
                  className={`
                    border rounded-lg p-4 cursor-pointer transition-all duration-200
                    ${
                      isSelected
                        ? 'border-cyan-400 bg-cyan-900/20 shadow-lg shadow-cyan-500/20'
                        : 'border-gray-600 hover:border-cyan-500/50 hover:bg-gray-800/50'
                    }
                    ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                  onClick={() => !isDisabled && handleChoiceSelect(choice.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-cyan-400 font-mono text-sm">
                          [{String.fromCharCode(65 + index)}]
                        </span>
                        <h4 className="text-white font-medium">
                          {choice.choice_text}
                        </h4>
                      </div>
                      
                      {choice.choice_description && (
                        <p className="text-gray-400 text-sm mb-3">
                          {choice.choice_description}
                        </p>
                      )}
                      
                      {/* Consequences Preview */}
                      {Object.keys(choice.consequences).length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2">
                          {Object.entries(choice.consequences).map(([type, value]) => (
                            <div
                              key={type}
                              className={`
                                flex items-center gap-1 px-2 py-1 rounded text-xs
                                bg-gray-800/50 border border-gray-600
                                ${getConsequenceColor(type, value)}
                              `}
                            >
                              {getConsequenceIcon(type)}
                              <span className="capitalize">{type}:</span>
                              <span className="font-mono">
                                {formatConsequenceValue(type, value)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Requirements */}
                      {choice.requirements && (
                        <div className="text-xs text-yellow-400">
                          {choice.requirements.min_level && (
                            <span>Requires Level {choice.requirements.min_level} • </span>
                          )}
                          {choice.requirements.min_reputation && (
                            <span>Requires {choice.requirements.min_reputation} Reputation • </span>
                          )}
                          {choice.requirements.required_items && (
                            <span>Requires: {choice.requirements.required_items.join(', ')}</span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {choice.is_terminal && (
                      <div className="ml-4">
                        <span className="px-2 py-1 bg-red-900/50 border border-red-500/50 rounded text-xs text-red-400">
                          Final Choice
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {isSelected && isProcessing && (
                    <div className="mt-3 flex items-center gap-2 text-cyan-400">
                      <div className="animate-spin w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full" />
                      <span className="text-sm">Processing choice...</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-800/50 p-4 border-t border-gray-700">
          <div className="flex items-center justify-between text-sm text-gray-400">
            <div className="flex items-center gap-4">
              <span>Choice Key: {currentChoiceKey}</span>
              <span>Available Options: {availableChoices.length}</span>
            </div>
            <div className="text-xs">
              Use keyboard shortcuts [A-Z] or click to select
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoryChoiceDialog;