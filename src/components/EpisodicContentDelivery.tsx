import React, { useState, useEffect } from 'react';
import { Clock, Lock, Unlock, Play, CheckCircle, Star, Calendar, Trophy } from 'lucide-react';
import { useGameStore } from '../store/gameStore';

interface Episode {
  id: string;
  campaign_id: string;
  episode_number: number;
  title: string;
  description: string;
  content: string;
  unlock_requirements: {
    level?: number;
    completed_episodes?: string[];
    resources?: { [key: string]: number };
    time_delay?: number;
  };
  rewards: {
    experience: number;
    resources: { [key: string]: number };
    unlocks?: string[];
  };
  estimated_duration: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  tags: string[];
  is_unlocked: boolean;
  is_completed: boolean;
  completion_date?: string;
  player_choices?: any[];
}

interface CampaignProgress {
  id: string;
  campaign_id: string;
  current_episode: number;
  episodes_completed: number;
  total_episodes: number;
  completion_percentage: number;
  last_played_at: string;
  time_invested: number;
}

interface EpisodicContentDeliveryProps {
  campaignId: string;
  className?: string;
}

export const EpisodicContentDelivery: React.FC<EpisodicContentDeliveryProps> = ({
  campaignId,
  className = ''
}) => {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [progress, setProgress] = useState<CampaignProgress | null>(null);
  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoProgressEnabled, setAutoProgressEnabled] = useState(false);
  const [nextUnlockTime, setNextUnlockTime] = useState<Date | null>(null);
  
  const { player, gainExperience, updatePlayer } = useGameStore();
  const { level, credits } = player;

  useEffect(() => {
    fetchCampaignData();
    const interval = setInterval(checkAutoProgress, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [campaignId]);

  const fetchCampaignData = async () => {
    try {
      setLoading(true);
      
      // Fetch episodes
      const episodesResponse = await fetch(`/api/campaigns/${campaignId}/episodes`);
      const episodesData = await episodesResponse.json();
      
      // Fetch progress
      const progressResponse = await fetch(`/api/campaigns/${campaignId}/progress`);
      const progressData = await progressResponse.json();
      
      if (episodesData.episodes) {
        const processedEpisodes = episodesData.episodes.map((episode: Episode) => ({
          ...episode,
          is_unlocked: checkEpisodeUnlocked(episode, progressData.progress),
          is_completed: progressData.progress?.completed_episodes?.includes(episode.id) || false
        }));
        
        setEpisodes(processedEpisodes);
      }
      
      if (progressData.progress) {
        setProgress(progressData.progress);
      }
      
      calculateNextUnlock(episodesData.episodes, progressData.progress);
    } catch (error) {
      console.error('Error fetching campaign data:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkEpisodeUnlocked = (episode: Episode, progress: CampaignProgress | null): boolean => {
    if (!episode.unlock_requirements) return true;
    
    const req = episode.unlock_requirements;
    
    // Check level requirement
    if (req.level && level < req.level) return false;
    
    // Check completed episodes requirement
    if (req.completed_episodes) {
      const completedEpisodes = progress?.episodes_completed ? 
        Array.from({ length: progress.episodes_completed }, (_, i) => `ep_${i + 1}`) : [];
      if (!req.completed_episodes.every(reqEp => completedEpisodes.includes(reqEp))) {
        return false;
      }
    }
    
    // Check resource requirements
    if (req.resources) {
      for (const [resource, amount] of Object.entries(req.resources)) {
        if (resource === 'credits' && credits < amount) return false;
        // Add other resource checks as needed
      }
    }
    
    // Check time delay requirement
    if (req.time_delay && progress?.last_played_at) {
      const lastPlayed = new Date(progress.last_played_at);
      const requiredTime = new Date(lastPlayed.getTime() + req.time_delay * 1000);
      if (new Date() < requiredTime) return false;
    }
    
    return true;
  };

  const calculateNextUnlock = (episodes: Episode[], progress: CampaignProgress | null) => {
    const lockedEpisodes = episodes.filter(ep => !checkEpisodeUnlocked(ep, progress));
    
    if (lockedEpisodes.length === 0) {
      setNextUnlockTime(null);
      return;
    }
    
    // Find the next episode that will unlock based on time delay
    const timeBasedUnlocks = lockedEpisodes
      .filter(ep => ep.unlock_requirements?.time_delay && progress?.last_played_at)
      .map(ep => {
        const lastPlayed = new Date(progress!.last_played_at);
        return new Date(lastPlayed.getTime() + ep.unlock_requirements!.time_delay! * 1000);
      })
      .sort((a, b) => a.getTime() - b.getTime());
    
    if (timeBasedUnlocks.length > 0) {
      setNextUnlockTime(timeBasedUnlocks[0]);
    }
  };

  const checkAutoProgress = async () => {
    if (!autoProgressEnabled || !progress) return;
    
    // Enhanced auto-progress with balance optimization
    const playerLevel = Math.floor(player.experience / 1000);
    const autoProgressEfficiency = Math.min(0.95, 0.75 + (playerLevel * 0.02)); // From balance config
    
    // Check if any new episodes have been unlocked
    const updatedEpisodes = episodes.map(episode => ({
      ...episode,
      is_unlocked: checkEpisodeUnlocked(episode, progress)
    }));
    
    const newlyUnlocked = updatedEpisodes.filter((ep, index) => 
      ep.is_unlocked && !episodes[index].is_unlocked
    );
    
    if (newlyUnlocked.length > 0) {
      setEpisodes(updatedEpisodes);
      
      // Enhanced auto-start logic with difficulty-based decisions
      for (const episode of newlyUnlocked) {
        const shouldAutoStart = calculateAutoStartProbability(episode, autoProgressEfficiency);
        
        if (Math.random() < shouldAutoStart) {
          await startEpisode(episode);
          break; // Only auto-start one episode at a time
        }
      }
    }
  };

  const calculateAutoStartProbability = (episode: Episode, efficiency: number): number => {
     const baseProbability = {
       'easy': 0.9,
       'medium': 0.7,
       'hard': 0.4,
       'expert': 0.2
     }[episode.difficulty] || 0.5;
     
     // Adjust based on player level and efficiency
     const levelBonus = Math.min(0.2, player.level * 0.01);
     return Math.min(0.95, baseProbability * efficiency + levelBonus);
   };

   const calculateAutoCompletionProbability = (episode: Episode): number => {
     const playerLevel = Math.floor(player.experience / 1000);
     const baseProbability = {
       'easy': 0.95,
       'medium': 0.85,
       'hard': 0.70,
       'expert': 0.55
     }[episode.difficulty] || 0.75;
     
     // Apply skill bonuses and level adjustments
     const skillBonus = Math.min(0.15, playerLevel * 0.01);
     const levelRequirementMet = !episode.unlock_requirements?.level || player.level >= episode.unlock_requirements.level;
     const levelBonus = levelRequirementMet ? 0.1 : 0;
     
     return Math.min(0.98, baseProbability + skillBonus + levelBonus);
   };

   const getOptimizedCompletionTime = (episode: Episode): number => {
     const baseTime = episode.estimated_duration * 1000; // Convert to milliseconds
     const playerLevel = Math.floor(player.experience / 1000);
     
     // Apply time reduction based on player skill and level
     const skillReduction = Math.min(0.3, playerLevel * 0.02); // Max 30% reduction
     const difficultyMultiplier = {
       'easy': 0.8,
       'medium': 0.9,
       'hard': 1.0,
       'expert': 1.1
     }[episode.difficulty] || 1.0;
     
     // Add some randomization (±10% variation)
     const randomVariation = 0.9 + (Math.random() * 0.2);
     
     return Math.floor(baseTime * (1 - skillReduction) * difficultyMultiplier * randomVariation);
    };

    const calculateExperienceMultiplier = (episode: Episode): number => {
      const playerLevel = Math.floor(player.experience / 1000);
      const baseMultiplier = 1.0;
      
      // Difficulty-based multipliers from balance config
      const difficultyMultiplier = {
        'easy': 1.1,
        'medium': 1.3,
        'hard': 1.6,
        'expert': 2.0
      }[episode.difficulty] || 1.2;
      
      // Level-based bonus (diminishing returns)
      const levelBonus = Math.min(0.5, playerLevel * 0.02);
      
      // Auto-progress efficiency bonus
      const autoBonus = autoProgressEnabled ? 0.1 : 0;
      
      return baseMultiplier * difficultyMultiplier * (1 + levelBonus + autoBonus);
    };

    const calculateCreditMultiplier = (episode: Episode): number => {
      const playerLevel = Math.floor(player.experience / 1000);
      const baseMultiplier = 1.0;
      
      // Difficulty-based multipliers
      const difficultyMultiplier = {
        'easy': 1.2,
        'medium': 1.5,
        'hard': 1.8,
        'expert': 2.2
      }[episode.difficulty] || 1.3;
      
      // Level-based bonus
      const levelBonus = Math.min(0.3, playerLevel * 0.015);
      
      return baseMultiplier * difficultyMultiplier * (1 + levelBonus);
    };

    const calculateCompletionBonus = (episode: Episode): { experience: number; credits: number } => {
      const baseExperienceBonus = episode.rewards.experience * 0.15; // 15% bonus
      const baseCreditBonus = (episode.rewards.resources?.credits || 0) * 0.1; // 10% bonus
      
      const difficultyMultiplier = {
        'easy': 1.0,
        'medium': 1.2,
        'hard': 1.4,
        'expert': 1.6
      }[episode.difficulty] || 1.1;
      
      return {
        experience: Math.floor(baseExperienceBonus * difficultyMultiplier),
        credits: Math.floor(baseCreditBonus * difficultyMultiplier)
      };
    };

  const startEpisode = async (episode: Episode) => {
    if (!episode.is_unlocked || episode.is_completed) return;
    
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/episodes/${episode.id}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        setSelectedEpisode(episode);
        
        // Enhanced auto-completion with balance optimization
        if (autoProgressEnabled) {
          const completionProbability = calculateAutoCompletionProbability(episode);
          const timeVariation = getOptimizedCompletionTime(episode);
          
          if (Math.random() < completionProbability) {
            setTimeout(() => completeEpisode(episode), timeVariation);
          }
        }
      }
    } catch (error) {
      console.error('Error starting episode:', error);
    }
  };

  const completeEpisode = async (episode: Episode) => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/episodes/${episode.id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          choices: episode.player_choices || [],
          time_spent: episode.estimated_duration
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        
        // Apply enhanced rewards with balance optimization
        if (episode.rewards.experience) {
          const experienceMultiplier = calculateExperienceMultiplier(episode);
          const enhancedExperience = Math.floor(episode.rewards.experience * experienceMultiplier);
          gainExperience(enhancedExperience);
        }
        
        if (episode.rewards.resources && episode.rewards.resources.credits) {
          const creditMultiplier = calculateCreditMultiplier(episode);
          const enhancedCredits = Math.floor(episode.rewards.resources.credits * creditMultiplier);
          updatePlayer({
            credits: player.credits + enhancedCredits
          });
        }
        
        // Apply completion bonuses for auto-progress
        if (autoProgressEnabled) {
          const completionBonus = calculateCompletionBonus(episode);
          if (completionBonus.experience > 0) {
            gainExperience(completionBonus.experience);
          }
          if (completionBonus.credits > 0) {
            updatePlayer({
              credits: player.credits + completionBonus.credits
            });
          }
        }
        
        // Update local state
        setEpisodes(prev => prev.map(ep => 
          ep.id === episode.id ? { ...ep, is_completed: true, completion_date: new Date().toISOString() } : ep
        ));
        
        // Refresh progress
        await fetchCampaignData();
        
        setSelectedEpisode(null);
      }
    } catch (error) {
      console.error('Error completing episode:', error);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'hard': return 'text-orange-400';
      case 'expert': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const getTimeUntilUnlock = () => {
    if (!nextUnlockTime) return null;
    
    const now = new Date();
    const diff = nextUnlockTime.getTime() - now.getTime();
    
    if (diff <= 0) return 'Available now';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  if (loading) {
    return (
      <div className={`bg-gray-900 border border-cyan-500/30 rounded-lg p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700 rounded mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-900 border border-cyan-500/30 rounded-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-cyan-400 mb-2">Episodic Campaign</h3>
          {progress && (
            <div className="flex items-center space-x-4 text-sm text-gray-300">
              <span>Episode {progress.current_episode}/{progress.total_episodes}</span>
              <span>{progress.completion_percentage.toFixed(1)}% Complete</span>
              <span className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                {formatDuration(progress.time_invested)}
              </span>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-3">
          {nextUnlockTime && (
            <div className="text-sm text-yellow-400 flex items-center">
              <Calendar className="w-4 h-4 mr-1" />
              Next: {getTimeUntilUnlock()}
            </div>
          )}
          
          <button
            onClick={() => setAutoProgressEnabled(!autoProgressEnabled)}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              autoProgressEnabled
                ? 'bg-cyan-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Auto Progress
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      {progress && (
        <div className="mb-6">
          <div className="bg-gray-700 rounded-full h-2 mb-2">
            <div 
              className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress.completion_percentage}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Episodes List */}
      <div className="space-y-3">
        {episodes.map((episode) => (
          <div
            key={episode.id}
            className={`border rounded-lg p-4 transition-all duration-200 ${
              episode.is_completed
                ? 'border-green-500/30 bg-green-900/20'
                : episode.is_unlocked
                ? 'border-cyan-500/30 bg-gray-800 hover:bg-gray-750 cursor-pointer'
                : 'border-gray-600/30 bg-gray-800/50'
            }`}
            onClick={() => episode.is_unlocked && !episode.is_completed && startEpisode(episode)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="flex items-center space-x-2">
                    {episode.is_completed ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : episode.is_unlocked ? (
                      <Play className="w-5 h-5 text-cyan-400" />
                    ) : (
                      <Lock className="w-5 h-5 text-gray-500" />
                    )}
                    
                    <span className="text-sm text-gray-400">Episode {episode.episode_number}</span>
                  </div>
                  
                  <h4 className={`font-semibold ${
                    episode.is_completed ? 'text-green-400' :
                    episode.is_unlocked ? 'text-white' : 'text-gray-500'
                  }`}>
                    {episode.title}
                  </h4>
                  
                  <span className={`text-xs px-2 py-1 rounded ${getDifficultyColor(episode.difficulty)} bg-gray-700`}>
                    {episode.difficulty?.toUpperCase() || 'UNKNOWN'}
                  </span>
                </div>
                
                <p className={`text-sm mb-3 ${
                  episode.is_unlocked ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  {episode.description}
                </p>
                
                <div className="flex items-center space-x-4 text-xs text-gray-400">
                  <span className="flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    {formatDuration(episode.estimated_duration)}
                  </span>
                  
                  {episode.rewards.experience > 0 && (
                    <span className="flex items-center">
                      <Star className="w-3 h-3 mr-1" />
                      +{episode.rewards.experience} XP
                    </span>
                  )}
                  
                  {Object.keys(episode.rewards.resources || {}).length > 0 && (
                    <span className="flex items-center">
                      <Trophy className="w-3 h-3 mr-1" />
                      Rewards
                    </span>
                  )}
                  
                  {episode.completion_date && (
                    <span className="text-green-400">
                      Completed {new Date(episode.completion_date).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
              
              {!episode.is_unlocked && episode.unlock_requirements && (
                <div className="text-xs text-gray-500 ml-4">
                  <div>Requirements:</div>
                  {episode.unlock_requirements.level && (
                    <div>Level {episode.unlock_requirements.level}</div>
                  )}
                  {episode.unlock_requirements.completed_episodes && (
                    <div>Complete {episode.unlock_requirements.completed_episodes.length} episodes</div>
                  )}
                  {episode.unlock_requirements.time_delay && (
                    <div>Wait {formatDuration(episode.unlock_requirements.time_delay)}</div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {episodes.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No episodes available for this campaign.</p>
        </div>
      )}
    </div>
  );
};

export default EpisodicContentDelivery;