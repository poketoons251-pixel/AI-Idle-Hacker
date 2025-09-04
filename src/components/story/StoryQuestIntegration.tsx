import React, { useState, useEffect } from 'react';
import { BookOpen, Users, MessageSquare, ChevronRight, Play, Clock } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import StoryChoiceDialog from './StoryChoiceDialog';

interface StoryEpisode {
  id: string;
  title: string;
  description: string;
  story_line: string;
  episode_number: number;
  narrative_text: string;
  choices: StoryChoice[];
  consequences: StoryConsequence[];
  requirements: any;
  rewards: any;
  unlocked: boolean;
  completed: boolean;
}

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

interface StoryConsequence {
  id: string;
  type: string;
  value: any;
  description: string;
}

interface PlayerProgress {
  episode_id: string;
  completed: boolean;
  choices_made: any[];
  completion_date: string | null;
}

export const StoryQuestIntegration: React.FC = () => {
  const [episodes, setEpisodes] = useState<StoryEpisode[]>([]);
  const [currentEpisode, setCurrentEpisode] = useState<StoryEpisode | null>(null);
  const [playerProgress, setPlayerProgress] = useState<PlayerProgress[]>([]);
  const [showChoiceDialog, setShowChoiceDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { player, startQuest, makeQuestChoice, addNotification } = useGameStore();

  // Fetch available story episodes
  useEffect(() => {
    fetchStoryEpisodes();
  }, []);

  const fetchStoryEpisodes = async () => {
    try {
      setLoading(true);
      
      // Import Supabase client dynamically to avoid build issues
      const { storyService } = await import('../../lib/supabase');
      
      // Fetch episodes directly from Supabase
      const episodes = await storyService.getStoryEpisodes();
      const playerProgress = await storyService.getPlayerProgress(player.id || 'default-player');
      
      setEpisodes(episodes || []);
      setPlayerProgress(playerProgress || []);
      
      // Find current episode
      const availableEpisodes = episodes.filter((ep: StoryEpisode) => 
        ep.unlocked && !ep.completed
      );
      if (availableEpisodes.length > 0) {
        setCurrentEpisode(availableEpisodes[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error fetching story episodes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartEpisode = async (episode: StoryEpisode) => {
    try {
      // Create a quest from the story episode
      const storyQuest = {
        id: `story-${episode.id}`,
        title: episode.title,
        description: episode.description,
        type: 'story' as const,
        category: 'progression' as const,
        difficulty: episode.episode_number as 1 | 2 | 3 | 4 | 5,
        objectives: [
          {
            id: 'story-choice',
            description: 'Make a narrative choice',
            type: 'operation_complete' as const,
            target: 1,
            current: 0,
            isCompleted: false,
            isOptional: false
          }
        ],
        rewards: episode.rewards || [
          {
            type: 'experience' as const,
            amount: 100 * episode.episode_number,
            scalingFactor: 1.0
          },
          {
            type: 'credits' as const,
            amount: 500 * episode.episode_number,
            scalingFactor: 1.0
          }
        ],
        prerequisites: [],
        isRepeatable: false,
        status: 'available' as const,
        progress: {
          startedAt: Date.now(),
          lastUpdated: Date.now(),
          completionPercentage: 0
        },
        storyLine: episode.story_line,
        narrativeContext: episode.narrative_text,
        choices: episode.choices.map(choice => ({
          id: choice.id,
          choice_text: choice.choice_text,
          choice_description: choice.choice_description,
          consequences: choice.consequences,
          next_choice_key: choice.next_choice_key,
          is_terminal: choice.is_terminal,
          choice_order: choice.choice_order,
          requirements: choice.requirements
        }))
      };

      // Add quest to game store
      startQuest(storyQuest.id);
      setCurrentEpisode(episode);
      setShowChoiceDialog(true);
      
      addNotification(`Started story episode: ${episode.title}`, 'info');
    } catch (err) {
      console.error('Error starting episode:', err);
      addNotification('Failed to start story episode', 'error');
    }
  };

  const handleMakeChoice = async (choiceId: string) => {
    if (!currentEpisode) return;

    try {
      // Import Supabase client dynamically
      const { storyService } = await import('../../lib/supabase');
      
      // Save player choice directly to Supabase
      await storyService.savePlayerChoice(
        player.id || 'default-player',
        currentEpisode.id,
        choiceId
      );
      
      // Find the selected choice for feedback
      const selectedChoice = currentEpisode.choices.find(c => c.id === choiceId);
      
      // Apply consequences through quest system
      makeQuestChoice(`story-${currentEpisode.id}`, choiceId);
      
      // Apply story-specific consequences if available
      if (selectedChoice?.consequences) {
        Object.entries(selectedChoice.consequences).forEach(([type, value]) => {
          applyStoryConsequence({ type, value, description: `${type}: ${value}` });
        });
      }
      
      setShowChoiceDialog(false);
      addNotification(`Choice made: ${selectedChoice?.choice_text || 'Choice recorded'}`, 'success');
      
      // Refresh episodes to get updated progress
      await fetchStoryEpisodes();
    } catch (err) {
      console.error('Error making choice:', err);
      addNotification('Failed to make choice', 'error');
    }
  };

  const applyStoryConsequence = (consequence: any) => {
    switch (consequence.type) {
      case 'unlock_episode':
        addNotification(`New episode unlocked: ${consequence.description}`, 'info');
        break;
      case 'character_relationship':
        addNotification(`Relationship changed: ${consequence.description}`, 'info');
        break;
      case 'story_branch':
        addNotification(`Story path changed: ${consequence.description}`, 'info');
        break;
      case 'lore_unlock':
        addNotification(`New lore discovered: ${consequence.description}`, 'info');
        break;
      default:
        console.log('Unknown consequence type:', consequence.type);
    }
  };

  const getEpisodeProgress = (episodeId: string) => {
    return playerProgress.find(p => p.episode_id === episodeId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
        <span className="ml-3 text-gray-300">Loading story campaigns...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
        <p className="text-red-400">Error loading story campaigns: {error}</p>
        <button 
          onClick={fetchStoryEpisodes}
          className="mt-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Story Campaign Header */}
      <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 rounded-lg p-6 border border-purple-500/30">
        <div className="flex items-center gap-3 mb-4">
          <BookOpen className="w-6 h-6 text-purple-400" />
          <h2 className="text-xl font-bold text-white">Story Campaigns</h2>
        </div>
        <p className="text-gray-300">
          Experience branching narratives that shape your hacker's journey. Your choices matter and will influence future episodes.
        </p>
      </div>

      {/* Current Episode */}
      {currentEpisode && (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-5 h-5 text-cyan-400" />
              <h3 className="text-lg font-semibold text-white">Current Episode</h3>
            </div>
            <span className="text-sm text-gray-400">Episode {currentEpisode.episode_number}</span>
          </div>
          
          <div className="space-y-4">
            <div>
              <h4 className="text-white font-medium mb-2">{currentEpisode.title}</h4>
              <p className="text-gray-300 text-sm mb-4">{currentEpisode.description}</p>
              <div className="bg-gray-900 rounded p-4 mb-4">
                <p className="text-gray-300 text-sm italic">{currentEpisode.narrative_text}</p>
              </div>
            </div>
            
            <button
              onClick={() => handleStartEpisode(currentEpisode)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors"
            >
              <Play className="w-4 h-4" />
              Continue Story
            </button>
          </div>
        </div>
      )}

      {/* Available Episodes */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Users className="w-5 h-5 text-cyan-400" />
          Available Episodes
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {episodes.map((episode) => {
            const progress = getEpisodeProgress(episode.id);
            const isCompleted = progress?.completed || false;
            const isUnlocked = episode.unlocked;
            
            return (
              <div
                key={episode.id}
                className={`bg-gray-800 rounded-lg p-4 border transition-colors ${
                  isCompleted
                    ? 'border-green-500/50 bg-green-900/20'
                    : isUnlocked
                    ? 'border-gray-700 hover:border-purple-500/50'
                    : 'border-gray-700/50 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="text-white font-medium mb-1">{episode.title}</h4>
                    <p className="text-gray-400 text-sm mb-2">{episode.description}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      Episode {episode.episode_number}
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    {isCompleted && (
                      <span className="text-green-400 text-xs font-medium">Completed</span>
                    )}
                    {isUnlocked && !isCompleted && (
                      <button
                        onClick={() => handleStartEpisode(episode)}
                        className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded transition-colors flex items-center gap-1"
                      >
                        <Play className="w-3 h-3" />
                        Start
                      </button>
                    )}
                    {!isUnlocked && (
                      <span className="text-gray-500 text-xs">Locked</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Story Choice Dialog */}
      {showChoiceDialog && currentEpisode && (
        <StoryChoiceDialog
          isOpen={showChoiceDialog}
          episode={{
            id: currentEpisode.id,
            title: currentEpisode.title,
            description: currentEpisode.description,
            episode_number: currentEpisode.episode_number,
            narrative_context: { current_situation: currentEpisode.narrative_text }
          }}
          currentChoiceKey="default"
          availableChoices={currentEpisode.choices}
          progressPercentage={0}
          onMakeChoice={handleMakeChoice}
          onClose={() => setShowChoiceDialog(false)}
        />
      )}
    </div>
  );
};