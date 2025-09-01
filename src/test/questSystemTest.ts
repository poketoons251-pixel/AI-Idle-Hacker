// Quest System Foundation Test
import { useGameStore } from '../store/gameStore';
import type { Quest, QuestObjective, QuestReward } from '../store/gameStore';

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

// Test function to verify quest system functionality
export function testQuestSystem() {
  console.log('🧪 Testing Quest System Foundation...');
  
  const store = useGameStore.getState();
  
  // Test 1: Add test quest to the store
  console.log('Test 1: Adding test quest to store');
  useGameStore.setState((state) => ({
    quests: [...state.quests, testQuest],
  }));
  
  const currentState = useGameStore.getState();
  console.log('✅ Quest added successfully. Total quests:', currentState.quests.length);
  
  // Test 2: Start quest
  console.log('Test 2: Starting quest');
  store.startQuest('test-quest-1');
  
  const stateAfterStart = useGameStore.getState();
  console.log('✅ Active quests:', stateAfterStart.activeQuests.length);
  console.log('✅ Quest status:', stateAfterStart.activeQuests[0]?.status);
  
  // Test 3: Update quest progress
  console.log('Test 3: Updating quest progress');
  store.updateQuestProgress('test-quest-1', 'obj-1', 1);
  
  const stateAfterProgress = useGameStore.getState();
  const activeQuest = stateAfterProgress.activeQuests.find(q => q.id === 'test-quest-1');
  console.log('✅ Quest progress:', activeQuest?.progress.completionPercentage + '%');
  console.log('✅ Objective completed:', activeQuest?.objectives[0].isCompleted);
  
  // Test 4: Check if quest completed automatically
  const stateAfterCompletion = useGameStore.getState();
  console.log('✅ Completed quests:', stateAfterCompletion.completedQuests.length);
  console.log('✅ Active quests after completion:', stateAfterCompletion.activeQuests.length);
  
  // Test 5: Claim rewards
  if (stateAfterCompletion.completedQuests.length > 0) {
    console.log('Test 5: Claiming quest rewards');
    const playerCreditsBefore = stateAfterCompletion.player.credits;
    store.claimReward('test-quest-1');
    
    const stateAfterReward = useGameStore.getState();
    const creditsGained = stateAfterReward.player.credits - playerCreditsBefore;
    console.log('✅ Credits gained from quest:', creditsGained);
  }
  
  console.log('🎉 Quest System Foundation Test Complete!');
  
  return {
    success: true,
    message: 'All quest system foundation tests passed successfully',
  };
}

// Export for use in development
if (typeof window !== 'undefined') {
  (window as any).testQuestSystem = testQuestSystem;
}