import React, { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import type { Quest } from '../store/gameStore';

// Test quest data
const testQuest: Quest = {
  id: 'test-quest-1',
  title: 'First Steps in Hacking',
  description: 'Complete your first operation to learn the basics of hacking.',
  type: 'story',
  category: 'progression',
  difficulty: 1,
  objectives: [
    {
      id: 'obj-1',
      description: 'Complete 1 operation',
      type: 'operation_complete',
      target: 1,
      current: 0,
      isCompleted: false,
      isOptional: false,
    },
  ],
  rewards: [
    {
      type: 'credits',
      amount: 100,
    },
    {
      type: 'experience',
      amount: 50,
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
    console.log('🧪 Testing Quest System Foundation...');
    
    // Add test quest to store
    useGameStore.setState((state) => ({
      quests: [...state.quests.filter(q => q.id !== 'test-quest-1'), testQuest],
    }));
    
    console.log('✅ Test quest added to store');
    
    // Start the quest
    setTimeout(() => {
      startQuest('test-quest-1');
      console.log('✅ Quest started');
      
      // Update progress after a short delay
      setTimeout(() => {
        updateQuestProgress('test-quest-1', 'obj-1', 1);
        console.log('✅ Quest progress updated');
        
        // Check if quest completed and claim reward
        setTimeout(() => {
          const currentState = useGameStore.getState();
          if (currentState.completedQuests.some(q => q.id === 'test-quest-1')) {
            claimReward('test-quest-1');
            console.log('✅ Quest reward claimed');
          }
          console.log('🎉 Quest System Test Complete!');
        }, 100);
      }, 100);
    }, 100);
  };

  return (
    <div className="p-4 bg-gray-800 text-green-400 rounded-lg m-4">
      <h3 className="text-lg font-bold mb-4">Quest System Test</h3>
      
      <div className="space-y-2 mb-4">
        <p>Total Quests: {quests.length}</p>
        <p>Active Quests: {activeQuests.length}</p>
        <p>Completed Quests: {completedQuests.length}</p>
        <p>Player Credits: {player.credits}</p>
      </div>
      
      <button
        onClick={runTest}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
      >
        Run Quest System Test
      </button>
      
      {activeQuests.length > 0 && (
        <div className="mt-4">
          <h4 className="font-bold">Active Quests:</h4>
          {activeQuests.map((quest) => (
            <div key={quest.id} className="bg-gray-700 p-2 rounded mt-2">
              <p className="font-semibold">{quest.title}</p>
              <p className="text-sm">{quest.description}</p>
              <p className="text-xs">Progress: {quest.progress.completionPercentage}%</p>
            </div>
          ))}
        </div>
      )}
      
      {completedQuests.length > 0 && (
        <div className="mt-4">
          <h4 className="font-bold">Completed Quests:</h4>
          {completedQuests.map((quest) => (
            <div key={quest.id} className="bg-green-800 p-2 rounded mt-2">
              <p className="font-semibold">{quest.title}</p>
              <p className="text-xs">Status: {quest.status}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};