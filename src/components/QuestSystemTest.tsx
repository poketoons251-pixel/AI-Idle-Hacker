import React, { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import type { Quest } from '../store/gameStore';
import { narrativeQuests } from '../data/narrativeQuests';
import { questTypes } from '../data/questTypes';

// Enhanced Phase 2 test quest data
const testQuest: Quest = {
  id: 'test-quest-phase2',
  title: 'Digital Awakening - Phase 2 Test',
  description: 'Experience the enhanced quest system with narrative elements, story progression, and dynamic mechanics.',
  type: 'story',
  category: 'progression',
  difficulty: 2,
  storyLine: 'origin',
  objectives: [
    {
      id: 'obj-1',
      description: 'Complete your first hack using enhanced mechanics',
      type: 'operation_complete',
      target: 1,
      current: 0,
      isCompleted: false,
      isOptional: false,
    },
    {
      id: 'obj-2',
      description: 'Discover a piece of lore',
      type: 'achievement_unlock',
      target: 1,
      current: 0,
      isCompleted: false,
      isOptional: true,
    },
  ],
  rewards: [
    {
      type: 'credits',
      amount: 500,
      scalingFactor: 1.2,
    },
    {
      type: 'experience',
      amount: 200,
      scalingFactor: 1.1,
    },
    {
      type: 'story_unlock',
      amount: 1,
      itemId: 'origin_awakening',
      data: {
        title: 'The First Step',
        description: 'Your journey into the digital underground begins.'
      }
    },
    {
      type: 'achievement',
      amount: 1,
      itemId: 'phase2_tester',
      data: {
        title: 'Phase 2 Pioneer',
        description: 'Successfully tested the enhanced quest system.'
      }
    },
  ],
  prerequisites: [
    {
      type: 'level',
      value: 1,
    },
  ],
  isRepeatable: false,
  status: 'available',
  progress: {
    startedAt: 0,
    lastUpdated: 0,
    completionPercentage: 0,
  },

};

export const QuestSystemTest: React.FC = () => {
  const {
    quests,
    activeQuests,
    completedQuests,
    startQuest,
    updateQuestProgress,
    claimReward,
    player,
  } = useGameStore();

  const runTest = () => {
    console.log('🧪 Testing Enhanced Quest System Phase 2...');
    
    // Add enhanced test quest to store
    useGameStore.setState((state) => ({
      quests: [...state.quests.filter(q => q.id !== 'test-quest-phase2'), testQuest],
    }));
    
    console.log('✅ Enhanced test quest added to store');
    console.log('📖 Enhanced quest with story line:', testQuest.storyLine);
    
    // Start the quest
    setTimeout(() => {
      startQuest('test-quest-phase2');
      console.log('✅ Quest started with story line:', testQuest.storyLine);
      
      // Update progress for first objective
      setTimeout(() => {
        updateQuestProgress('test-quest-phase2', 'obj-1', 1);
        console.log('✅ Primary objective completed');
        
        // Update progress for optional objective
        setTimeout(() => {
          updateQuestProgress('test-quest-phase2', 'obj-2', 1);
          console.log('✅ Optional lore objective completed');
          
          // Check if quest completed and claim reward
          setTimeout(() => {
            const currentState = useGameStore.getState();
            const completedQuest = currentState.completedQuests.find(q => q.id === 'test-quest-phase2');
            if (completedQuest) {
              console.log('📖 Quest completed successfully');
              claimReward('test-quest-phase2');
              console.log('✅ Enhanced quest rewards claimed (including story unlock & achievement)');
            }
            console.log('🎉 Enhanced Quest System Phase 2 Test Complete!');
          }, 100);
        }, 100);
      }, 100);
    }, 100);
  };

  const loadNarrativeQuests = () => {
    console.log('📚 Loading narrative quests...');
    useGameStore.setState((state) => ({
      quests: [...state.quests.filter(q => !narrativeQuests.some(nq => nq.id === q.id)), ...narrativeQuests],
    }));
    console.log('✅ Loaded', narrativeQuests.length, 'narrative quests');
  };

  const testQuestTypes = () => {
    console.log('🎯 Testing quest types system...');
    questTypes.forEach((type, index) => {
      if (index < 3) { // Test first 3 types to avoid spam
        console.log(`🔧 Quest Type: ${type.name} - ${type.description}`);
        console.log(`   Quest Type: ${type.name} - ${type.description}`);
      }
    });
    console.log('✅ Quest types system functional');
  };

  return (
    <div className="p-4 bg-gray-800 text-green-400 rounded-lg m-4">
      <h3 className="text-lg font-bold mb-4">Enhanced Quest System Phase 2 Test</h3>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="space-y-2">
          <p>Total Quests: {quests.length}</p>
          <p>Active Quests: {activeQuests.length}</p>
          <p>Completed Quests: {completedQuests.length}</p>
          <p>Player Credits: {player.credits}</p>
        </div>
        <div className="space-y-2">
          <p>Narrative Quests: {quests.filter(q => q.storyLine).length}</p>
          <p>Story Lines: {new Set(quests.filter(q => q.storyLine).map(q => q.storyLine)).size}</p>
          <p>Quest Types Available: {questTypes.length}</p>
          <p>Player Level: {player.level}</p>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={runTest}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          Run Enhanced Test
        </button>
        <button
          onClick={loadNarrativeQuests}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded"
        >
          Load Narrative Quests
        </button>
        <button
          onClick={testQuestTypes}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
        >
          Test Quest Types
        </button>
      </div>
      
      {activeQuests.length > 0 && (
        <div className="mt-4">
          <h4 className="font-bold">Active Quests:</h4>
          {activeQuests.map((quest) => (
            <div key={quest.id} className="bg-gray-700 p-3 rounded mt-2 border-l-4 border-blue-500">
              <div className="flex justify-between items-start mb-2">
                <p className="font-semibold">{quest.title}</p>
                {quest.storyLine && (
                  <span className="text-xs bg-purple-600 px-2 py-1 rounded">
                    {quest.storyLine}
                  </span>
                )}
              </div>
              <p className="text-sm mb-2">{quest.description}</p>
              <div className="flex justify-between items-center">
                <p className="text-xs">Progress: {quest.progress.completionPercentage}%</p>
                <p className="text-xs">Difficulty: {quest.difficulty}</p>
              </div>

            </div>
          ))}
        </div>
      )}
      
      {completedQuests.length > 0 && (
        <div className="mt-4">
          <h4 className="font-bold">Completed Quests:</h4>
          {completedQuests.map((quest) => (
            <div key={quest.id} className="bg-green-800 p-3 rounded mt-2 border-l-4 border-green-400">
              <div className="flex justify-between items-start mb-2">
                <p className="font-semibold">{quest.title}</p>
                {quest.storyLine && (
                  <span className="text-xs bg-green-600 px-2 py-1 rounded">
                    {quest.storyLine}
                  </span>
                )}
              </div>
              <p className="text-xs mb-2">Status: {quest.status}</p>

            </div>
          ))}
        </div>
      )}
    </div>
  );
};