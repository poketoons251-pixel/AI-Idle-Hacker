import React, { useState, useEffect } from 'react';
import { ArrowLeft, Play, Pause, FastForward, RotateCcw, BookOpen, Users, Target, Clock, Star, Trophy, AlertTriangle } from 'lucide-react';
import { useGameStore } from '../store/gameStore';

interface EpisodeChoice {
  id: string;
  text: string;
  description?: string;
  consequences: {
    trust_change?: number;
    respect_change?: number;
    resources?: { [key: string]: number };
    story_flags?: string[];
    unlock_episodes?: string[];
  };
  requirements?: {
    level?: number;
    resources?: { [key: string]: number };
    story_flags?: string[];
  };
}

interface EpisodeContent {
  id: string;
  title: string;
  description: string;
  narrative_text: string;
  characters: string[];
  setting: string;
  objectives: string[];
  choices: EpisodeChoice[];
  consequences?: {
    immediate: string;
    long_term: string[];
  };
  media?: {
    background_image?: string;
    character_portraits?: { [key: string]: string };
    sound_effects?: string[];
  };
}

interface CampaignEpisodeViewerProps {
  episodeId: string;
  campaignId: string;
  onClose: () => void;
  onComplete: (choices: string[], timeSpent: number) => void;
  autoPlay?: boolean;
  className?: string;
}

export const CampaignEpisodeViewer: React.FC<CampaignEpisodeViewerProps> = ({
  episodeId,
  campaignId,
  onClose,
  onComplete,
  autoPlay = false,
  className = ''
}) => {
  const [episode, setEpisode] = useState<EpisodeContent | null>(null);
  const [currentSection, setCurrentSection] = useState(0);
  const [selectedChoices, setSelectedChoices] = useState<string[]>([]);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [startTime] = useState(Date.now());
  const [readingProgress, setReadingProgress] = useState(0);
  const [showChoices, setShowChoices] = useState(false);
  const [loading, setLoading] = useState(true);
  const [narrativeSections, setNarrativeSections] = useState<string[]>([]);
  
  const { player } = useGameStore();
  const { level, credits } = player;

  useEffect(() => {
    fetchEpisodeContent();
  }, [episodeId]);

  useEffect(() => {
    if (isPlaying && narrativeSections.length > 0) {
      const interval = setInterval(() => {
        setReadingProgress(prev => {
          const newProgress = prev + 1;
          
          // Auto-advance sections during playback
          if (newProgress >= 100 && currentSection < narrativeSections.length - 1) {
            setCurrentSection(prev => prev + 1);
            return 0;
          }
          
          // Show choices when narrative is complete
          if (newProgress >= 100 && currentSection === narrativeSections.length - 1) {
            setShowChoices(true);
            setIsPlaying(false);
            return 100;
          }
          
          return Math.min(newProgress, 100);
        });
      }, autoPlay ? 50 : 100); // Faster for auto-play
      
      return () => clearInterval(interval);
    }
  }, [isPlaying, currentSection, narrativeSections.length, autoPlay]);

  const fetchEpisodeContent = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/campaigns/${campaignId}/episodes/${episodeId}/content`);
      const data = await response.json();
      
      if (data.episode) {
        setEpisode(data.episode);
        
        // Split narrative into readable sections
        const sections = data.episode.narrative_text
          .split(/\n\s*\n/) // Split on double line breaks
          .filter((section: string) => section.trim().length > 0);
        
        setNarrativeSections(sections);
      }
    } catch (error) {
      console.error('Error fetching episode content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChoiceSelect = (choiceId: string) => {
    if (selectedChoices.includes(choiceId)) {
      setSelectedChoices(prev => prev.filter(id => id !== choiceId));
    } else {
      setSelectedChoices(prev => [...prev, choiceId]);
    }
  };

  const canSelectChoice = (choice: EpisodeChoice): boolean => {
    if (!choice.requirements) return true;
    
    const req = choice.requirements;
    
    // Check level requirement
    if (req.level && level < req.level) return false;
    
    // Check resource requirements
    if (req.resources) {
      for (const [resource, amount] of Object.entries(req.resources)) {
        if (resource === 'credits' && credits < amount) return false;
        // Add other resource checks as needed
      }
    }
    
    // Check story flags (would need to be tracked in game state)
    // if (req.story_flags) {
    //   // Implementation depends on how story flags are stored
    // }
    
    return true;
  };

  const handleComplete = () => {
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    onComplete(selectedChoices, timeSpent);
  };

  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
  };

  const skipToChoices = () => {
    setCurrentSection(narrativeSections.length - 1);
    setReadingProgress(100);
    setShowChoices(true);
    setIsPlaying(false);
  };

  const restartEpisode = () => {
    setCurrentSection(0);
    setReadingProgress(0);
    setShowChoices(false);
    setSelectedChoices([]);
    setIsPlaying(autoPlay);
  };

  const goToPreviousSection = () => {
    if (currentSection > 0) {
      setCurrentSection(prev => prev - 1);
      setReadingProgress(0);
      setShowChoices(false);
    }
  };

  const goToNextSection = () => {
    if (currentSection < narrativeSections.length - 1) {
      setCurrentSection(prev => prev + 1);
      setReadingProgress(0);
    } else {
      setShowChoices(true);
    }
  };

  if (loading) {
    return (
      <div className={`fixed inset-0 bg-black/80 flex items-center justify-center z-50 ${className}`}>
        <div className="bg-gray-900 border border-cyan-500/30 rounded-lg p-8 max-w-2xl w-full mx-4">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-700 rounded mb-4"></div>
            <div className="h-4 bg-gray-700 rounded mb-2"></div>
            <div className="h-4 bg-gray-700 rounded mb-2"></div>
            <div className="h-4 bg-gray-700 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!episode) {
    return (
      <div className={`fixed inset-0 bg-black/80 flex items-center justify-center z-50 ${className}`}>
        <div className="bg-gray-900 border border-red-500/30 rounded-lg p-8 max-w-md w-full mx-4 text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-red-400 mb-2">Episode Not Found</h3>
          <p className="text-gray-300 mb-4">The requested episode could not be loaded.</p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 bg-black/90 flex items-center justify-center z-50 ${className}`}>
      <div className="bg-gray-900 border border-cyan-500/30 rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-4">
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-700 rounded transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-400" />
            </button>
            
            <div>
              <h2 className="text-xl font-bold text-cyan-400">{episode.title}</h2>
              <p className="text-sm text-gray-400">{episode.setting}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={restartEpisode}
              className="p-2 hover:bg-gray-700 rounded transition-colors"
              title="Restart Episode"
            >
              <RotateCcw className="w-4 h-4 text-gray-400" />
            </button>
            
            <button
              onClick={togglePlayback}
              className="p-2 hover:bg-gray-700 rounded transition-colors"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 text-cyan-400" />
              ) : (
                <Play className="w-4 h-4 text-cyan-400" />
              )}
            </button>
            
            <button
              onClick={skipToChoices}
              className="p-2 hover:bg-gray-700 rounded transition-colors"
              title="Skip to Choices"
            >
              <FastForward className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-2 bg-gray-800">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
            <span>Section {currentSection + 1} of {narrativeSections.length}</span>
            <span>{Math.round(readingProgress)}% Complete</span>
          </div>
          <div className="bg-gray-700 rounded-full h-1">
            <div 
              className="bg-gradient-to-r from-cyan-500 to-blue-500 h-1 rounded-full transition-all duration-200"
              style={{ width: `${(currentSection / narrativeSections.length) * 100 + (readingProgress / narrativeSections.length)}%` }}
            ></div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Episode Info */}
          <div className="mb-6">
            <div className="flex items-center space-x-6 text-sm text-gray-400 mb-4">
              {episode.characters.length > 0 && (
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-1" />
                  <span>{episode.characters.join(', ')}</span>
                </div>
              )}
              
              {episode.objectives.length > 0 && (
                <div className="flex items-center">
                  <Target className="w-4 h-4 mr-1" />
                  <span>{episode.objectives.length} Objectives</span>
                </div>
              )}
            </div>
            
            {episode.objectives.length > 0 && (
              <div className="bg-gray-800 rounded-lg p-4 mb-4">
                <h4 className="text-sm font-semibold text-cyan-400 mb-2 flex items-center">
                  <Target className="w-4 h-4 mr-1" />
                  Objectives
                </h4>
                <ul className="text-sm text-gray-300 space-y-1">
                  {episode.objectives.map((objective, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-cyan-400 mr-2">•</span>
                      {objective}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Narrative Content */}
          <div className="mb-6">
            <div className="bg-gray-800 rounded-lg p-6 min-h-[200px]">
              <div className="flex items-center mb-4">
                <BookOpen className="w-5 h-5 text-cyan-400 mr-2" />
                <h3 className="font-semibold text-white">Episode Content</h3>
              </div>
              
              {narrativeSections[currentSection] && (
                <div className="text-gray-300 leading-relaxed">
                  {narrativeSections[currentSection]
                    .substring(0, Math.floor((narrativeSections[currentSection].length * readingProgress) / 100))
                    .split('\n')
                    .map((line, index) => (
                      <p key={index} className="mb-3">{line}</p>
                    ))
                  }
                  
                  {readingProgress < 100 && (
                    <span className="inline-block w-2 h-5 bg-cyan-400 animate-pulse ml-1"></span>
                  )}
                </div>
              )}
              
              {/* Navigation Controls */}
              <div className="flex justify-between mt-6">
                <button
                  onClick={goToPreviousSection}
                  disabled={currentSection === 0}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded transition-colors"
                >
                  Previous
                </button>
                
                <button
                  onClick={goToNextSection}
                  disabled={currentSection === narrativeSections.length - 1 && readingProgress < 100}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </div>

          {/* Choices */}
          {showChoices && episode.choices.length > 0 && (
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-cyan-400 mb-4">Make Your Choice</h4>
              <div className="space-y-3">
                {episode.choices.map((choice) => {
                  const canSelect = canSelectChoice(choice);
                  const isSelected = selectedChoices.includes(choice.id);
                  
                  return (
                    <div
                      key={choice.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        !canSelect
                          ? 'border-gray-600 bg-gray-800/50 opacity-50 cursor-not-allowed'
                          : isSelected
                          ? 'border-cyan-500 bg-cyan-900/30'
                          : 'border-gray-600 bg-gray-800 hover:border-cyan-500/50 hover:bg-gray-750'
                      }`}
                      onClick={() => canSelect && handleChoiceSelect(choice.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className={`font-medium mb-2 ${
                            !canSelect ? 'text-gray-500' : isSelected ? 'text-cyan-400' : 'text-white'
                          }`}>
                            {choice.text}
                          </p>
                          
                          {choice.description && (
                            <p className={`text-sm ${
                              !canSelect ? 'text-gray-600' : 'text-gray-400'
                            }`}>
                              {choice.description}
                            </p>
                          )}
                          
                          {/* Choice Requirements */}
                          {!canSelect && choice.requirements && (
                            <div className="mt-2 text-xs text-red-400">
                              Requirements not met:
                              {choice.requirements.level && level < choice.requirements.level && (
                                <span className="block">• Level {choice.requirements.level} required</span>
                              )}
                              {choice.requirements.resources && Object.entries(choice.requirements.resources).map(([resource, amount]) => (
                                (resource === 'credits' && credits < amount) && (
                                  <span key={resource} className="block">• {amount} {resource} required</span>
                                )
                              ))}
                            </div>
                          )}
                          
                          {/* Choice Consequences Preview */}
                          {choice.consequences && isSelected && (
                            <div className="mt-2 text-xs text-cyan-400">
                              Effects:
                              {choice.consequences.trust_change && (
                                <span className="block">• Trust {choice.consequences.trust_change > 0 ? '+' : ''}{choice.consequences.trust_change}</span>
                              )}
                              {choice.consequences.respect_change && (
                                <span className="block">• Respect {choice.consequences.respect_change > 0 ? '+' : ''}{choice.consequences.respect_change}</span>
                              )}
                              {choice.consequences.resources && Object.entries(choice.consequences.resources).map(([resource, amount]) => (
                                <span key={resource} className="block">• {amount > 0 ? '+' : ''}{amount} {resource}</span>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        {isSelected && (
                          <div className="ml-4">
                            <div className="w-4 h-4 bg-cyan-500 rounded-full flex items-center justify-center">
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {showChoices && (
          <div className="border-t border-gray-700 p-6">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-400">
                {selectedChoices.length > 0 ? (
                  <span>{selectedChoices.length} choice(s) selected</span>
                ) : (
                  <span>Select your choices to continue</span>
                )}
              </div>
              
              <button
                onClick={handleComplete}
                disabled={selectedChoices.length === 0}
                className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded font-medium transition-colors"
              >
                Complete Episode
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CampaignEpisodeViewer;