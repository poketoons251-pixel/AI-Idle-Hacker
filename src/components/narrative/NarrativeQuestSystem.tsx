import React, { useState, useEffect, useMemo } from 'react';
import { useGameStore } from '../../store/gameStore';
import { getQuestsByStoryLine, getQuestById, getAvailableQuests } from '../../data/narrativeQuests';
import { getNPCsByStoryLine } from '../../data/npcDialogues';
import { getLoreEntriesByStoryLine } from '../../data/loreEntries';
import { 
  BookOpen, 
  Users, 
  MapPin, 
  Clock, 
  Star, 
  Zap, 
  ChevronRight, 
  Play, 
  CheckCircle, 
  Lock,
  Award,
  Eye,
  MessageCircle
} from 'lucide-react';
import NPCDialogueSystem from './NPCDialogueSystem';
import CodexSystem from './CodexSystem';

interface NarrativeQuestSystemProps {
  className?: string;
}

type ViewMode = 'overview' | 'quest_details' | 'npc_dialogue' | 'codex';
type StoryLine = 'origin' | 'corporate' | 'ai_liberation' | 'resistance' | 'deep_web';

const NarrativeQuestSystem: React.FC<NarrativeQuestSystemProps> = ({ className = '' }) => {
  const { player, quests, startQuest } = useGameStore();
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [selectedStoryLine, setSelectedStoryLine] = useState<StoryLine>('origin');
  const [selectedQuestId, setSelectedQuestId] = useState<string | null>(null);
  const [selectedNPCId, setSelectedNPCId] = useState<string | null>(null);

  // Mock player progress for demonstration
  const playerProgress = {
    completedQuests: ['origin-1', 'origin-2'],
    activeQuests: ['corp-1', 'ai-1'],
    reputation: player.reputation || 0,
    skills: player.skills || {},
    level: player.level || 1
  };

  const storyLines = [
    { id: 'origin' as StoryLine, name: 'Origin Story', description: 'Your journey into the digital underground', color: 'cyan' },
    { id: 'corporate' as StoryLine, name: 'Corporate Wars', description: 'Infiltrate mega-corporations', color: 'red' },
    { id: 'ai_liberation' as StoryLine, name: 'AI Liberation', description: 'Free artificial minds from bondage', color: 'purple' },
    { id: 'resistance' as StoryLine, name: 'Cyber Resistance', description: 'Fight against digital oppression', color: 'orange' },
    { id: 'deep_web' as StoryLine, name: 'Deep Web Mysteries', description: 'Uncover hidden digital secrets', color: 'green' }
  ];

  const availableQuests = useMemo(() => {
    return getAvailableQuests(playerProgress.completedQuests, playerProgress.level, playerProgress.skills, playerProgress.reputation);
  }, [playerProgress]);

  const storyLineQuests = useMemo(() => {
    return getQuestsByStoryLine(selectedStoryLine);
  }, [selectedStoryLine]);

  const storyLineNPCs = useMemo(() => {
    return getNPCsByStoryLine(selectedStoryLine);
  }, [selectedStoryLine]);

  const storyLineLore = useMemo(() => {
    return getLoreEntriesByStoryLine(selectedStoryLine);
  }, [selectedStoryLine]);

  const getStoryLineProgress = (storyLine: StoryLine) => {
    const quests = getQuestsByStoryLine(storyLine);
    const completed = quests.filter(q => playerProgress.completedQuests.includes(q.id)).length;
    const total = quests.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { completed, total, percentage };
  };

  const getQuestStatus = (questId: string) => {
    if (playerProgress.completedQuests.includes(questId)) return 'completed';
    if (playerProgress.activeQuests.includes(questId)) return 'active';
    if (availableQuests.some(q => q.id === questId)) return 'available';
    return 'locked';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400';
      case 'active': return 'text-cyan-400';
      case 'available': return 'text-yellow-400';
      case 'locked': return 'text-gray-500';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'active': return <Play className="w-4 h-4" />;
      case 'available': return <Star className="w-4 h-4" />;
      case 'locked': return <Lock className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getStoryLineColor = (storyLine: StoryLine) => {
    const colors = {
      origin: 'cyan',
      corporate: 'red',
      ai_liberation: 'purple',
      resistance: 'orange',
      deep_web: 'green'
    };
    return colors[storyLine] || 'gray';
  };

  const handleQuestAction = (questId: string) => {
    const status = getQuestStatus(questId);
    if (status === 'available') {
      startQuest(questId);
    } else if (status === 'active') {
      setSelectedQuestId(questId);
      setViewMode('quest_details');
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Story Line Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {storyLines.map((story) => {
          const progress = getStoryLineProgress(story.id);
          const isSelected = selectedStoryLine === story.id;
          
          return (
            <div
              key={story.id}
              onClick={() => setSelectedStoryLine(story.id)}
              className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                isSelected 
                  ? `border-${story.color}-500 bg-${story.color}-900/20` 
                  : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className={`font-semibold text-${story.color}-400`}>{story.name}</h3>
                <div className={`text-sm text-${story.color}-400`}>
                  {progress.completed}/{progress.total}
                </div>
              </div>
              
              <p className="text-gray-400 text-sm mb-3">{story.description}</p>
              
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className={`bg-${story.color}-500 h-2 rounded-full transition-all duration-300`}
                  style={{ width: `${progress.percentage}%` }}
                />
              </div>
              
              <div className="mt-2 text-xs text-gray-500">
                {progress.percentage}% Complete
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Story Line Details */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-2xl font-bold text-${getStoryLineColor(selectedStoryLine)}-400`}>
            {storyLines.find(s => s.id === selectedStoryLine)?.name}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('codex')}
              className="flex items-center gap-2 px-3 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              Codex
            </button>
            <button
              onClick={() => setViewMode('npc_dialogue')}
              className="flex items-center gap-2 px-3 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              Contacts
            </button>
          </div>
        </div>

        {/* Quest List */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white mb-4">Story Quests</h3>
          {storyLineQuests.map((quest) => {
            const status = getQuestStatus(quest.id);
            const isClickable = status === 'available' || status === 'active';
            
            return (
              <div
                key={quest.id}
                onClick={() => isClickable && handleQuestAction(quest.id)}
                className={`p-4 border border-gray-700 rounded-lg transition-all duration-200 ${
                  isClickable 
                    ? 'cursor-pointer hover:border-cyan-500 bg-gray-800/50' 
                    : 'opacity-50 bg-gray-800/20'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={getStatusColor(status)}>
                        {getStatusIcon(status)}
                      </div>
                      <h4 className="font-semibold text-white">{quest.title}</h4>
                      <span className={`text-xs px-2 py-1 rounded ${getStatusColor(status)} bg-gray-700`}>
                        {status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm mb-2">{quest.description}</p>
                    {/* Quest introduction would go here if quest had narrative property */}
                  </div>
                  {isClickable && (
                    <ChevronRight className="w-5 h-5 text-gray-500" />
                  )}
                </div>

                {/* Quest Rewards Preview */}
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Award className="w-3 h-3" />
                    <span>{Array.isArray(quest.rewards) ? quest.rewards.length : 0} rewards</span>
                  </div>
                  {/* Estimated duration would go here if quest had this property */}
                  {quest.difficulty && (
                    <div className="flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      <span className="capitalize">{quest.difficulty}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Story Elements Summary */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-700 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-purple-400" />
              <span className="font-semibold text-white">NPCs</span>
            </div>
            <p className="text-2xl font-bold text-purple-400">{storyLineNPCs.length}</p>
            <p className="text-xs text-gray-400">Available contacts</p>
          </div>
          
          <div className="bg-gray-700 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-4 h-4 text-blue-400" />
              <span className="font-semibold text-white">Lore</span>
            </div>
            <p className="text-2xl font-bold text-blue-400">{storyLineLore.length}</p>
            <p className="text-xs text-gray-400">Codex entries</p>
          </div>
          
          <div className="bg-gray-700 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-green-400" />
              <span className="font-semibold text-white">Progress</span>
            </div>
            <p className="text-2xl font-bold text-green-400">
              {getStoryLineProgress(selectedStoryLine).percentage}%
            </p>
            <p className="text-xs text-gray-400">Story completion</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderQuestDetails = () => {
    if (!selectedQuestId) return null;
    
    const quest = getQuestById(selectedQuestId);
    if (!quest) return null;

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setViewMode('overview')}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <ChevronRight className="w-5 h-5 rotate-180" />
          </button>
          <h2 className="text-2xl font-bold text-cyan-400">{quest.title}</h2>
        </div>

        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <div className="prose prose-invert max-w-none">
            <p className="text-gray-300 mb-4">{quest.description}</p>
            
            {/* Quest narrative introduction would go here if quest had narrative property */}

            {quest.objectives && quest.objectives.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-cyan-400 mb-2">Objectives</h3>
                <ul className="space-y-2">
                  {quest.objectives.map((objective, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-cyan-400 rounded-full" />
                      <span className="text-gray-300">{objective.description}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {Array.isArray(quest.rewards) && quest.rewards.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-cyan-400 mb-2">Rewards</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {quest.rewards.map((reward, index) => (
                    <div key={index} className="bg-gray-700 p-3 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-yellow-400" />
                        <span className="font-semibold text-white capitalize">
                          {reward.type.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400 mt-1">
                        {reward.amount} {reward.type === 'credits' ? 'credits' : ''}
                        {reward.type === 'experience' ? 'XP' : ''}
                        {reward.itemId || reward.title || ''}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* World building content would go here if quest had narrative property */}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`bg-gray-900 rounded-lg border border-gray-700 ${className}`}>
      <div className="p-6 border-b border-gray-700">
        <h1 className="text-3xl font-bold text-cyan-400 flex items-center gap-2">
          <BookOpen className="w-8 h-8" />
          Narrative Quest System
        </h1>
        <p className="text-gray-400 mt-2">
          Immerse yourself in the digital underground through compelling story-driven missions
        </p>
      </div>

      <div className="p-6">
        {viewMode === 'overview' && renderOverview()}
        {viewMode === 'quest_details' && renderQuestDetails()}
        {viewMode === 'npc_dialogue' && (
          <NPCDialogueSystem 
            storyLine={selectedStoryLine}
            npcId={selectedNPCId}
            onClose={() => setViewMode('overview')}
          />
        )}
        {viewMode === 'codex' && (
          <CodexSystem />
        )}
      </div>
    </div>
  );
};

export default NarrativeQuestSystem;