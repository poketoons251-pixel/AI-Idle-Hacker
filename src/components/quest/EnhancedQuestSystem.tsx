import React, { useState, useEffect } from 'react';
import { Play, Pause, Square, Clock, Target, Zap, AlertTriangle, Trophy } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { questTypes, generateQuestFromType, QuestType } from '../../data/questTypes';
import { QuestMechanicsHandler } from '../../utils/questMechanics';
import { QuestTwist, checkTwistTrigger, questTwists } from '../../data/questTwists';
import QuestTwistHandler from './QuestTwistHandler';
import QuestCompletionCelebration from './QuestCompletionCelebration';

interface EnhancedQuestSystemProps {
  className?: string;
}

interface ActiveQuestState {
  questId: string;
  startTime: number;
  progress: number;
  currentObjective: number;
  mechanicsState: any;
  failures: number;
  detectionCount: number;
  hintsUsed: number;
  lastAction: string;
  completionMethod?: string;
  completionPath?: string;
  intendedPath: string;
  puzzlesSolved: number;
  totalPuzzles: number;
  objectivesCompleted: number;
  totalObjectives: number;
  difficulty: string;
}

const EnhancedQuestSystem: React.FC<EnhancedQuestSystemProps> = ({ className = '' }) => {
  const { player, activeQuests, claimReward } = useGameStore();
  const [selectedQuestType, setSelectedQuestType] = useState<QuestType | null>(null);
  const [activeQuestStates, setActiveQuestStates] = useState<Map<string, ActiveQuestState>>(new Map());
  const [mechanicsHandlers, setMechanicsHandlers] = useState<Map<string, QuestMechanicsHandler>>(new Map());
  const [showTwistHandler, setShowTwistHandler] = useState(false);
  const [currentTwist, setCurrentTwist] = useState<{ questId: string; twist: QuestTwist } | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [completedQuestData, setCompletedQuestData] = useState<any>(null);
  const [questLog, setQuestLog] = useState<string[]>([]);

  // Initialize quest states and mechanics handlers
  useEffect(() => {
    activeQuests.forEach(quest => {
      if (!activeQuestStates.has(quest.id)) {
        const questState: ActiveQuestState = {
          questId: quest.id,
          startTime: Date.now(),
          progress: 0,
          currentObjective: 0,
          mechanicsState: {},
          failures: 0,
          detectionCount: 0,
          hintsUsed: 0,
          lastAction: '',
          intendedPath: 'standard',
          puzzlesSolved: 0,
          totalPuzzles: quest.objectives?.filter(obj => obj.description.toLowerCase().includes('puzzle')).length || 0,
          objectivesCompleted: 0,
          totalObjectives: quest.objectives?.length || 0,
          difficulty: quest.difficulty?.toString() || 'normal'
        };
        
        setActiveQuestStates(prev => new Map(prev.set(quest.id, questState)));
        
        // Initialize mechanics handler
        const handler = new QuestMechanicsHandler();
        setMechanicsHandlers(prev => new Map(prev.set(quest.id, handler)));
      }
    });
  }, [activeQuests, player.skills]);

  // Update quest progress periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveQuestStates(prevStates => {
        const newStates = new Map(prevStates);
        
        activeQuests.forEach(quest => {
          const state = newStates.get(quest.id);
          const handler = mechanicsHandlers.get(quest.id);
          
          if (state && handler && state.progress < 100) {
            // Simulate quest progress based on mechanics
            const progressUpdate = handler.updateMechanic(quest.id, 'progress', 1);
            
            if (progressUpdate.success) {
              const newProgress = Math.min(100, state.progress + (progressUpdate.progressPercentage || 1));
              const updatedState = {
                ...state,
                progress: newProgress,
                objectivesCompleted: Math.floor((newProgress / 100) * state.totalObjectives)
              };
              
              newStates.set(quest.id, updatedState);
              
              // Check for quest completion
              if (newProgress >= 100 && state.progress < 100) {
                handleQuestCompletion(quest, updatedState);
              }
              
              // Check for twists
              checkForQuestTwists(quest, updatedState);
            } else if (progressUpdate.mechanicFailed) {
              const updatedState = {
                ...state,
                failures: state.failures + 1
              };
              newStates.set(quest.id, updatedState);
            }
          }
        });
        
        return newStates;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeQuests, mechanicsHandlers, player.skills]);

  const checkForQuestTwists = (quest: any, questState: ActiveQuestState) => {
    if (showTwistHandler) return; // Don't trigger multiple twists
    
    for (const twist of questTwists) {
      if (checkTwistTrigger(twist, questState, player)) {
        setCurrentTwist({ questId: quest.id, twist });
        setShowTwistHandler(true);
        addToQuestLog(`🌟 TWIST: ${twist.name} triggered in ${quest.title}!`);
        break;
      }
    }
  };

  const handleQuestCompletion = (quest: any, questState: ActiveQuestState) => {
    const completionTime = Date.now() - questState.startTime;
    const completedState = {
      ...questState,
      completionTime,
      estimatedTime: 300000, // 5 minutes estimated
      optimalTime: 180000 // 3 minutes optimal
    };
    
    setCompletedQuestData({ quest, questState: completedState });
    setShowCelebration(true);
    
    // Quest completion handled by celebration component
    
    // Claim rewards
    const rewards = Array.isArray(quest.rewards) ? quest.rewards : [];
    rewards.forEach((reward: any) => {
      claimReward(reward);
    });
    
    addToQuestLog(`🏆 Quest completed: ${quest.title}`);
  };

  const handleTwistTriggered = (twist: QuestTwist, choice?: any) => {
    addToQuestLog(`⚡ ${twist.name}: ${twist.description}`);
  };

  const handleTwistChoice = (choice: any) => {
    if (currentTwist) {
      const questState = activeQuestStates.get(currentTwist.questId);
      if (questState) {
        // Apply choice consequences
        const updatedState = {
          ...questState,
          lastAction: choice.id,
          completionMethod: choice.id.includes('social') ? 'social_only' : questState.completionMethod,
          completionPath: choice.id !== 'standard' ? choice.id : questState.completionPath
        };
        
        setActiveQuestStates(prev => new Map(prev.set(currentTwist.questId, updatedState)));
        addToQuestLog(`🎯 Choice made: ${choice.text}`);
      }
    }
  };

  const generateNewQuest = (questType: QuestType) => {
    const newQuest = generateQuestFromType(questType);
    // In a real implementation, this would be added to the game store
    addToQuestLog(`📋 New quest generated: ${newQuest.title}`);
  };

  const simulateAction = (questId: string, action: string) => {
    const questState = activeQuestStates.get(questId);
    const handler = mechanicsHandlers.get(questId);
    
    if (questState && handler) {
      const updatedState = {
        ...questState,
        lastAction: action,
        progress: Math.min(100, questState.progress + 10)
      };
      
      if (action === 'use_hint') {
        updatedState.hintsUsed += 1;
      } else if (action === 'stealth_detected') {
        updatedState.detectionCount += 1;
      } else if (action === 'puzzle_solved') {
        updatedState.puzzlesSolved += 1;
      }
      
      setActiveQuestStates(prev => new Map(prev.set(questId, updatedState)));
      addToQuestLog(`🎮 Action: ${action} in quest ${questId}`);
    }
  };

  const addToQuestLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setQuestLog(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 19)]);
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return 'bg-green-500';
    if (progress >= 75) return 'bg-blue-500';
    if (progress >= 50) return 'bg-yellow-500';
    if (progress >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className={`bg-gray-900 border border-cyan-400 rounded-lg p-6 ${className}`}>
      <h2 className="text-2xl font-bold text-cyan-400 mb-6 flex items-center">
        <Zap className="w-6 h-6 mr-2" />
        Enhanced Quest System
      </h2>

      {/* Active Quests */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-3">Active Quests</h3>
        {activeQuests.length === 0 ? (
          <p className="text-gray-400">No active quests. Generate a new quest to begin.</p>
        ) : (
          <div className="space-y-4">
            {activeQuests.map(quest => {
              const questState = activeQuestStates.get(quest.id);
              if (!questState) return null;
              
              return (
                <div key={quest.id} className="bg-gray-800 border border-gray-600 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-white font-semibold">{quest.title}</h4>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        questState.difficulty === 'expert' ? 'bg-red-600 text-white' :
                        questState.difficulty === 'hard' ? 'bg-orange-600 text-white' :
                        questState.difficulty === 'normal' ? 'bg-blue-600 text-white' :
                        'bg-green-600 text-white'
                      }`}>
                        {questState.difficulty.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-gray-300 text-sm mb-3">{quest.description}</p>
                  
                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="flex justify-between text-sm text-gray-400 mb-1">
                      <span>Progress</span>
                      <span>{Math.round(questState.progress)}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(questState.progress)}`}
                        style={{ width: `${questState.progress}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  {/* Quest Stats */}
                  <div className="grid grid-cols-4 gap-4 mb-3">
                    <div className="text-center">
                      <Clock className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
                      <div className="text-xs text-gray-400">
                        {Math.floor((Date.now() - questState.startTime) / 60000)}m
                      </div>
                    </div>
                    <div className="text-center">
                      <Target className="w-4 h-4 text-green-400 mx-auto mb-1" />
                      <div className="text-xs text-gray-400">
                        {questState.objectivesCompleted}/{questState.totalObjectives}
                      </div>
                    </div>
                    <div className="text-center">
                      <AlertTriangle className="w-4 h-4 text-red-400 mx-auto mb-1" />
                      <div className="text-xs text-gray-400">
                        {questState.failures}
                      </div>
                    </div>
                    <div className="text-center">
                      <Trophy className="w-4 h-4 text-yellow-400 mx-auto mb-1" />
                      <div className="text-xs text-gray-400">
                        {questState.hintsUsed}
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => simulateAction(quest.id, 'hack_system')}
                      className="px-3 py-1 bg-cyan-600 hover:bg-cyan-700 text-white rounded text-sm transition-colors"
                    >
                      Hack
                    </button>
                    <button
                      onClick={() => simulateAction(quest.id, 'stealth_move')}
                      className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm transition-colors"
                    >
                      Stealth
                    </button>
                    <button
                      onClick={() => simulateAction(quest.id, 'social_engineer')}
                      className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors"
                    >
                      Social
                    </button>
                    <button
                      onClick={() => simulateAction(quest.id, 'use_hint')}
                      className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-sm transition-colors"
                    >
                      Hint
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quest Generation */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-3">Generate New Quest</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {questTypes.slice(0, 6).map(questType => (
            <button
              key={questType.id}
              onClick={() => generateNewQuest(questType)}
              className="p-3 bg-gray-800 border border-gray-600 hover:border-cyan-400 rounded-lg text-left transition-colors"
            >
              <h4 className="text-white font-medium text-sm">{questType.name}</h4>
              <p className="text-gray-400 text-xs mt-1">{questType.category}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Quest Log */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-3">Quest Log</h3>
        <div className="bg-gray-800 border border-gray-600 rounded-lg p-3 h-32 overflow-y-auto">
          {questLog.length === 0 ? (
            <p className="text-gray-400 text-sm">No recent activity...</p>
          ) : (
            <div className="space-y-1">
              {questLog.map((entry, index) => (
                <p key={index} className="text-gray-300 text-xs font-mono">
                  {entry}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Twist Handler */}
      {showTwistHandler && currentTwist && (
        <QuestTwistHandler
          quest={activeQuests.find(q => q.id === currentTwist.questId)!}
          questState={activeQuestStates.get(currentTwist.questId)!}
          player={player}
          onTwistTriggered={handleTwistTriggered}
          onChoiceMade={handleTwistChoice}
        />
      )}

      {/* Completion Celebration */}
      {showCelebration && completedQuestData && (
        <QuestCompletionCelebration
          quest={completedQuestData.quest}
          questState={completedQuestData.questState}
          rewards={completedQuestData.quest.rewards || []}
          onClose={() => {
            setShowCelebration(false);
            setCompletedQuestData(null);
          }}
          visible={showCelebration}
        />
      )}
    </div>
  );
};

export default EnhancedQuestSystem;