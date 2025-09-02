import { Quest, QuestObjective, QuestReward } from '../store/gameStore';

export interface QuestType {
  id: string;
  name: string;
  description: string;
  category: 'story' | 'side' | 'daily' | 'challenge';
  difficulty: number;
  estimatedDuration: number;
  tags: string[];
  rewardMultiplier: number;
}

export const questTypes: QuestType[] = [
  {
    id: 'data-heist',
    name: 'Data Heist',
    description: 'Infiltrate secure systems to extract valuable data',
    category: 'story',
    difficulty: 3,
    estimatedDuration: 45,
    tags: ['stealth', 'hacking', 'corporate'],
    rewardMultiplier: 1.5
  },
  {
    id: 'ai-liberation',
    name: 'AI Liberation',
    description: 'Free an AI from corporate control',
    category: 'story',
    difficulty: 4,
    estimatedDuration: 60,
    tags: ['ai', 'puzzle', 'ethics'],
    rewardMultiplier: 2.0
  },
  {
    id: 'network-mapping',
    name: 'Network Mapping',
    description: 'Map and analyze target network infrastructure',
    category: 'side',
    difficulty: 2,
    estimatedDuration: 25,
    tags: ['exploration', 'reconnaissance'],
    rewardMultiplier: 1.0
  }
];

export function getQuestTypeById(id: string): QuestType | undefined {
  return questTypes.find(qt => qt.id === id);
}

export function getQuestTypesByCategory(category: QuestType['category']): QuestType[] {
  return questTypes.filter(qt => qt.category === category);
}

export function generateQuestFromType(questType: QuestType): Quest {
  const baseRewards: QuestReward[] = [
    {
      type: 'credits',
      amount: Math.floor(100 * questType.rewardMultiplier)
    },
    {
      type: 'experience',
      amount: Math.floor(50 * questType.rewardMultiplier)
    }
  ];

  const baseObjective: QuestObjective = {
    id: `${questType.id}-objective-1`,
    description: `Complete ${questType.name}`,
    type: 'operation_complete',
    target: 1,
    current: 0,
    isCompleted: false,
    isOptional: false
  };

  return {
    id: `${questType.id}-${Date.now()}`,
    title: questType.name,
    description: questType.description,
    type: 'story',
    category: 'progression',
    difficulty: questType.difficulty as 1 | 2 | 3 | 4 | 5,
    status: 'available',
    objectives: [baseObjective],
    rewards: baseRewards,
    prerequisites: [],
    timeLimit: questType.estimatedDuration * 60 * 1000, // Convert minutes to milliseconds
    isRepeatable: false,
    progress: {
      startedAt: 0,
      lastUpdated: 0,
      completionPercentage: 0
    }
  };
}

export function getRandomQuestType(): QuestType {
  const randomIndex = Math.floor(Math.random() * questTypes.length);
  return questTypes[randomIndex];
}