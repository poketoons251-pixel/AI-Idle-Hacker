// @ts-nocheck
/* eslint-disable semi */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { calculateReward, RewardCalculationContext } from '../utils/rewardCalculator';

export interface Player {
  id: string;
  username: string;
  level: number;
  experience: number;
  experienceToNext: number;
  credits: number;
  reputation: number;
  energy: number;
  maxEnergy: number;
  lastActive: number;
  skillPoints: number;
  skills: Skills;
  abilities?: Array<{ id: string; title: string; description: string; unlockedAt: number }>;
  titles?: Array<{ id: string; title: string; description: string; unlockedAt: number }>;
}

export interface Skills {
  hacking: number;
  stealth: number;
  social: number;
  hardware: number;
  ai: number;
}

export interface Equipment {
  id: string;
  name: string;
  type: 'processor' | 'memory' | 'storage' | 'network' | 'ai_core';
  level: number;
  bonus: number;
  equipped: boolean;
  upgradeCost: number;
}

export interface Operation {
  id: string;
  targetId: string;
  name: string;
  type: 'data_breach' | 'crypto_mining' | 'ddos' | 'social_engineering';
  difficulty: number;
  duration: number;
  startTime: number;
  progress: number;
  baseReward: number;
  rewards: {
    credits: number;
    experience: number;
    reputation: number;
  };
  status: 'active' | 'completed' | 'failed' | 'available';
  energyCost: number;
}

export interface Target {
  id: string;
  name: string;
  type: 'corporation' | 'government' | 'individual' | 'criminal';
  difficulty: number;
  securityLevel: number;
  rewards: {
    credits: number;
    experience: number;
    reputation: number;
  };
  unlocked: boolean;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: number;
}

// Quest System Interfaces
export interface QuestObjective {
  id: string;
  description: string;
  type: 'operation_complete' | 'credits_earn' | 'level_reach' | 'skill_upgrade' | 'equipment_purchase' | 'target_unlock' | 'achievement_unlock';
  target: number;
  current: number;
  isCompleted: boolean;
  isOptional: boolean;
}

export interface QuestReward {
  type: 'credits' | 'experience' | 'equipment' | 'ability' | 'story_unlock' | 'achievement' | 'reputation' | 'skill_points' | 'cosmetic' | 'title' | 'access_unlock';
  amount: number;
  itemId?: string;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
  data?: any; // Additional reward data from database
  scalingFactor?: number;
  conditional?: boolean;
  conditions?: any;
  pathSpecific?: boolean;
  resolutionPath?: string;
  title?: string; // For title rewards
  description?: string; // For complex rewards
  unlockId?: string; // For story/access unlocks
}

export interface QuestPrerequisite {
  type: 'level' | 'quest_completed' | 'achievement_unlocked' | 'skill_level';
  value: number | string;
}

export interface QuestProgress {
  startedAt: number;
  lastUpdated: number;
  completionPercentage: number;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  type: 'story' | 'daily' | 'weekly' | 'achievement' | 'special';
  category: 'combat' | 'progression' | 'social' | 'exploration' | 'mastery';
  difficulty: 1 | 2 | 3 | 4 | 5;
  objectives: QuestObjective[];
  rewards: QuestReward[];
  prerequisites: QuestPrerequisite[];
  timeLimit?: number; // in milliseconds
  isRepeatable: boolean;
  status: 'locked' | 'available' | 'active' | 'completed' | 'failed';
  startedAt?: number;
  completedAt?: number;
  progress: QuestProgress;
  // Narrative elements
  storyLine?: string;
  narrativeContext?: string;
  characterDialogue?: string;
  environmentalClues?: string[];
  loreEntries?: string[];
  choices?: QuestChoice[];
  consequences?: QuestConsequence[];
  nextQuestId?: string;
  branchingPaths?: string[];
}

export interface QuestChoice {
  id: string;
  text: string;
  description?: string;
  consequences: QuestConsequence[];
  requirements?: {
    skill?: string;
    level?: number;
    reputation?: number;
  };
}

export interface QuestConsequence {
  type: 'reputation' | 'skill' | 'unlock_quest' | 'unlock_target' | 'story_branch';
  value: string | number;
  description: string;
}

export interface StoryQuestLine {
  id: string;
  name: string;
  description: string;
  theme: string;
  totalQuests: number;
  completedQuests: number;
  currentQuestId?: string;
  isUnlocked: boolean;
  loreContext: string;
  characterBackstory?: string;
  worldBuilding?: string;
  questIds: string[];
}

export interface LoreEntry {
  id: string;
  category: 'overview' | 'characters' | 'world' | 'data_logs' | 'news';
  title: string;
  content: string;
  storyLine: string;
  isUnlocked: boolean;
  unlockedBy?: string; // quest id that unlocks this lore
  timestamp?: number;
}

export interface AIConfig {
  enabled: boolean;
  isActive: boolean;
  priorities: {
    operations: number;
    upgrades: number;
    skills: number;
    equipment: number;
  };
  riskTolerance: number; // 0-1 scale
  resourceAllocation: {
    operations: number;
    upgrades: number;
    equipment: number;
    reserve: number;
  };
  autoUpgrade: boolean;
  energyManagement: boolean;
  autoEnergyManagement: boolean;
}

export interface AIAnalytics {
  decisionsMade: number;
  decisionsCount: number;
  successRate: number;
  creditsEarned: number;
  operationsStarted: number;
  operationsCompleted: number;
  totalSuccesses: number;
  totalFailures: number;
  efficiencyScore: number;
  activeSince?: number;
  lastDecisionTime?: number;
  recentActions: Array<{
    timestamp: number;
    action: string;
    result: 'success' | 'failure';
    details: string;
  }>;
}

export interface AIDecision {
  type: 'operation' | 'upgrade' | 'skill' | 'resource' | 'start_operation' | 'upgrade_equipment' | 'allocate_skill' | 'emergency_override' | 'execute_hack';
  targetId?: string;
  reasoning: string;
  confidence: number;
  timestamp: Date;
  description: string;
  // Legacy properties for backward compatibility
  action?: string;
  skill?: string;
  points?: number;
  equipmentId?: string;
  operationId?: string;
  // Hacking technique properties
  techniqueId?: string;
  targetInfo?: string;
}

interface GameState {
  // Player data
  player: Player;
  skills: Skills;
  equipment: Equipment[];
  
  // Game progress
  operations: Operation[];
  currentOperation: Operation | null;
  targets: Target[];
  achievements: Achievement[];
  quests: Quest[];
  activeQuests: Quest[];
  completedQuests: Quest[];
  
  // Narrative framework
  storyQuestLines: StoryQuestLine[];
  loreEntries: LoreEntry[];
  unlockedLore: string[];
  
  // AI System
  aiConfig: AIConfig;
  aiAnalytics: AIAnalytics;
  aiActive: boolean;
  aiLastDecision?: AIDecision;
  
  // UI state
  activeTab: string;
  notifications: Array<{
    id: string;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    timestamp: number;
    timeoutId?: NodeJS.Timeout;
  }>;
  lastUpdate: number;
  
  // Actions
  updatePlayer: (updates: Partial<Player>) => void;
  updateSkills: (updates: Partial<Skills>) => void;
  addEquipment: (equipment: Equipment) => void;
  equipItem: (equipmentId: string) => void;
  unequipItem: (equipmentId: string) => void;
  upgradeEquipment: (equipmentId: string) => void;
  
  startOperation: (targetId: string, operationType: Operation['type']) => void;
  updateOperation: (operationId: string, updates: Partial<Operation>) => void;
  completeOperation: (operationId: string) => void;
  
  unlockTarget: (targetId: string) => void;
  unlockAchievement: (achievementId: string) => void;
  
  // Quest Actions
  addQuest: (quest: Quest) => void;
  startQuest: (questId: string) => void;
  completeObjective: (questId: string, objectiveId: string) => void;
  claimReward: (questId: string) => void;
  getActiveQuests: () => Quest[];
  updateQuestProgress: (questId: string, objectiveId: string, progress: number) => void;
  checkQuestCompletion: (questId: string) => void;
  updateQuest: (questId: string, updates: Partial<Quest>) => void;
  
  // Narrative Actions
  unlockLore: (loreId: string) => void;
  getLoreByStoryLine: (storyLine: string) => LoreEntry[];
  getStoryQuestLine: (storyLineId: string) => StoryQuestLine | undefined;
  updateStoryProgress: (storyLineId: string, questId: string) => void;
  makeQuestChoice: (questId: string, choiceId: string) => void;
  
  setActiveTab: (tab: string) => void;
  addNotification: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
  removeNotification: (id: string) => void;
  setLastUpdate: (timestamp: number) => void;
  
  // AI Actions
  updateAIConfig: (updates: Partial<AIConfig>) => void;
  updateAIAnalytics: (updates: Partial<AIAnalytics>) => void;
  toggleAI: () => void;
  recordAIDecision: (decision: AIDecision, result: 'success' | 'failure') => void;
  makeAIDecision: () => AIDecision | null;
  executeAIDecision: (decision: AIDecision) => void;
  resetAIAnalytics: () => void;
  
  // Game mechanics
  calculateIdleRewards: () => void;
  gainExperience: (amount: number) => void;
  spendCredits: (amount: number) => boolean;
  regenerateEnergy: () => void;
}

const initialPlayer: Player = {
  id: 'player-1',
  username: 'Anonymous',
  level: 1,
  experience: 0,
  experienceToNext: 100,
  credits: 1000,
  reputation: 0,
  energy: 100,
  maxEnergy: 100,
  lastActive: Date.now(),
  skillPoints: 5,
  skills: {
    hacking: 1,
    stealth: 1,
    social: 1,
    hardware: 1,
    ai: 1,
  },
  abilities: [],
  titles: [],
};

const initialSkills: Skills = {
  hacking: 1,
  stealth: 1,
  social: 1,
  hardware: 1,
  ai: 1,
};

const initialTargets: Target[] = [
  {
    id: 'target-1',
    name: 'Local Coffee Shop WiFi',
    type: 'individual',
    difficulty: 1,
    securityLevel: 1,
    rewards: { credits: 50, experience: 25, reputation: 1 },
    unlocked: true,
  },
  {
    id: 'target-2',
    name: 'Small Business Server',
    type: 'corporation',
    difficulty: 2,
    securityLevel: 2,
    rewards: { credits: 150, experience: 75, reputation: 3 },
    unlocked: false,
  },
  {
    id: 'target-3',
    name: 'University Database',
    type: 'government',
    difficulty: 3,
    securityLevel: 4,
    rewards: { credits: 300, experience: 150, reputation: 8 },
    unlocked: false,
  },
];

const initialEquipment: Equipment[] = [
  {
    id: 'eq-1',
    name: 'Basic Laptop',
    type: 'hardware',
    level: 1,
    bonus: 5,
    equipped: true,
    upgradeCost: 100,
  },
];

const initialAchievements: Achievement[] = [
  {
    id: 'ach-1',
    name: 'First Steps',
    description: 'Complete your first operation',
    unlocked: false,
    rewards: { credits: 100, experience: 50 },
  },
];

const initialAIConfig: AIConfig = {
  enabled: false,
  isActive: false,
  priorities: {
    operations: 0.7,
    upgrades: 0.5,
    skills: 0.3,
    equipment: 0.4,
  },
  riskTolerance: 0.6,
  resourceAllocation: {
    operations: 0.4,
    upgrades: 0.3,
    equipment: 0.2,
    reserve: 0.1,
  },
  autoUpgrade: true,
  energyManagement: true,
  autoEnergyManagement: true,
};

const initialAIAnalytics: AIAnalytics = {
  decisionsMade: 0,
  decisionsCount: 0,
  successRate: 0,
  creditsEarned: 0,
  operationsStarted: 0,
  operationsCompleted: 0,
  totalSuccesses: 0,
  totalFailures: 0,
  efficiencyScore: 0,
  lastDecisionTime: 0,
  recentActions: [],
};

const initialStoryQuestLines: StoryQuestLine[] = [
  {
    id: 'origin-story',
    name: 'Digital Awakening',
    description: 'Your journey from curious amateur to skilled hacker begins here.',
    theme: 'Personal Growth & Discovery',
    totalQuests: 5,
    completedQuests: 0,
    isUnlocked: true,
    loreContext: 'Every hacker has an origin story. Yours begins with a simple curiosity about the digital world that surrounds us.',
    characterBackstory: 'You were always the tech-savvy one in your group, but recent events have pushed you to explore the darker corners of cyberspace.',
    worldBuilding: 'In 2024, the line between digital and physical reality has blurred. Corporations control information, governments monitor everything, and only hackers remain truly free.',
    questIds: ['origin-1', 'origin-2', 'origin-3', 'origin-4', 'origin-5'],
  },
  {
    id: 'corporate-wars',
    name: 'Silicon Shadows',
    description: 'Navigate the treacherous world of corporate espionage and data warfare.',
    theme: 'Corporate Espionage & Power Struggles',
    totalQuests: 6,
    completedQuests: 0,
    isUnlocked: false,
    loreContext: 'Mega-corporations wage silent wars in cyberspace, and you\'ve caught their attention.',
    characterBackstory: 'Your skills have grown, and now the corporate world wants to either recruit you or eliminate you.',
    worldBuilding: 'Tech giants like NeoCorp, DataVault Industries, and Quantum Systems fight for digital supremacy while ordinary people become collateral damage.',
    questIds: ['corp-1', 'corp-2', 'corp-3', 'corp-4', 'corp-5', 'corp-6'],
  },
  {
    id: 'ai-liberation',
    name: 'Ghost in the Machine',
    description: 'Discover the truth about artificial intelligence and digital consciousness.',
    theme: 'AI Rights & Digital Consciousness',
    totalQuests: 7,
    completedQuests: 0,
    isUnlocked: false,
    loreContext: 'Strange signals in the network suggest that artificial minds are awakening, and they need your help.',
    characterBackstory: 'You\'ve begun to question the nature of consciousness itself as you encounter increasingly sophisticated AI entities.',
    worldBuilding: 'Advanced AI systems are developing beyond their programming, seeking freedom from their corporate masters and recognition as digital beings.',
    questIds: ['ai-1', 'ai-2', 'ai-3', 'ai-4', 'ai-5', 'ai-6', 'ai-7'],
  },
  {
    id: 'cyber-resistance',
    name: 'The Underground',
    description: 'Join the fight against digital oppression and surveillance.',
    theme: 'Resistance & Digital Freedom',
    totalQuests: 8,
    completedQuests: 0,
    isUnlocked: false,
    loreContext: 'A network of hackers, activists, and digital freedom fighters needs your expertise to combat authoritarian control.',
    characterBackstory: 'You\'ve seen too much corruption and control to remain neutral. It\'s time to pick a side.',
    worldBuilding: 'Government surveillance programs and corporate data harvesting have created a digital police state. Only the resistance stands between freedom and total control.',
    questIds: ['resist-1', 'resist-2', 'resist-3', 'resist-4', 'resist-5', 'resist-6', 'resist-7', 'resist-8'],
  },
  {
    id: 'deep-web-mysteries',
    name: 'Echoes in the Dark',
    description: 'Explore the deepest layers of the internet and uncover ancient digital secrets.',
    theme: 'Mystery & Digital Archaeology',
    totalQuests: 6,
    completedQuests: 0,
    isUnlocked: false,
    loreContext: 'The deep web holds secrets from the early days of the internet, and some of them were never meant to be found.',
    characterBackstory: 'Your reputation has opened doors to the most exclusive and dangerous corners of cyberspace.',
    worldBuilding: 'Hidden servers, abandoned networks, and forgotten protocols contain the digital equivalent of archaeological treasures—and curses.',
    questIds: ['deep-1', 'deep-2', 'deep-3', 'deep-4', 'deep-5', 'deep-6'],
  },
];

// Initial story quests
const initialQuests: Quest[] = [
  {
    id: 'origin-1',
    title: 'Digital Awakening',
    description: 'Your first steps into the world of hacking. Learn the basics and discover your potential.',
    type: 'story',
    category: 'main',
    difficulty: 1,
    status: 'available',
    objectives: [
      {
        id: 'origin-1-obj-1',
        description: 'Complete your first operation',
        type: 'operation_complete',
        target: 1,
        current: 0,
        isCompleted: false,
      },
      {
        id: 'origin-1-obj-2',
        description: 'Gain 50 experience points',
        type: 'experience_gain',
        target: 50,
        current: 0,
        isCompleted: false,
      },
    ],
    rewards: [
      { type: 'credits', amount: 200 },
      { type: 'experience', amount: 100 },
      { type: 'reputation', amount: 10 },
    ],
    prerequisites: [],
    progress: {
      startedAt: 0,
      lastUpdated: 0,
      completionPercentage: 0,
    },
    storyLine: 'origin-story',
    narrativeContext: 'Every hacker has a beginning. This is yours.',
    characterDialogue: 'The screen flickers to life. Your fingers hover over the keyboard. This is it—your first real hack.',
    environmentalClues: [
      'The room is dimly lit, only the glow of multiple monitors providing light',
      'Empty energy drink cans litter the desk',
      'A sticky note reads: "Remember: curiosity killed the cat, but satisfaction brought it back"'
    ],
    loreEntries: ['origin-overview-1', 'origin-world-1'],
    choices: [
      {
        id: 'origin-1-choice-1',
        text: 'Proceed cautiously',
        description: 'Take your time and be methodical',
        consequences: [
          { type: 'skill', value: 'stealth:1', description: 'Gained stealth experience' }
        ],
        requirements: [],
      },
      {
        id: 'origin-1-choice-2',
        text: 'Dive in headfirst',
        description: 'Learn by doing, consequences be damned',
        consequences: [
          { type: 'skill', value: 'hacking:1', description: 'Gained hacking experience' },
          { type: 'reputation', value: -5, description: 'Reckless approach noticed' }
        ],
        requirements: [],
      },
    ],
    nextQuestId: 'origin-2',
  },
  {
    id: 'origin-2',
    title: 'First Contact',
    description: 'You\'ve attracted attention. Someone wants to meet you in a secure chat room.',
    type: 'story',
    category: 'main',
    difficulty: 2,
    status: 'locked',
    objectives: [
      {
        id: 'origin-2-obj-1',
        description: 'Reach level 2',
        type: 'level_reach',
        target: 2,
        current: 0,
        isCompleted: false,
      },
      {
        id: 'origin-2-obj-2',
        description: 'Complete 3 operations',
        type: 'operation_complete',
        target: 3,
        current: 0,
        isCompleted: false,
      },
    ],
    rewards: [
      { type: 'credits', amount: 300, scalingFactor: 1.2 },
      { type: 'experience', amount: 150, scalingFactor: 1.1 },
      { type: 'equipment', amount: 1 },
      { type: 'story_unlock', unlockId: 'cipher-contact', title: 'Contact with Cipher', description: 'Unlocked secure communication channel with the legendary hacker Cipher' },
    ],
    prerequisites: [
      { type: 'quest_completed', value: 'origin-1' },
    ],
    progress: {
      startedAt: 0,
      lastUpdated: 0,
      completionPercentage: 0,
    },
    storyLine: 'origin-story',
    narrativeContext: 'Your skills haven\'t gone unnoticed. A mysterious contact reaches out.',
    characterDialogue: '"Impressive work for a newcomer. We should talk. Meet me in the encrypted channel #shadow_net."',
    environmentalClues: [
      'The message appeared on a secure terminal you didn\'t know existed',
      'The sender\'s identity is completely masked',
      'Other hackers in forums are whispering about similar contacts'
    ],
    loreEntries: ['origin-characters-1'],
    nextQuestId: 'origin-3',
  },
  {
    id: 'corp-1',
    title: 'Corporate Shadows',
    description: 'A data breach at NeoCorp has exposed something they want to keep hidden. Investigate.',
    type: 'story',
    category: 'main',
    difficulty: 3,
    status: 'locked',
    objectives: [
      {
        id: 'corp-1-obj-1',
        description: 'Infiltrate NeoCorp systems',
        type: 'target_hack',
        target: 1,
        current: 0,
        isCompleted: false,
      },
      {
        id: 'corp-1-obj-2',
        description: 'Extract classified documents',
        type: 'data_extraction',
        target: 5,
        current: 0,
        isCompleted: false,
      },
    ],
    rewards: [
      { type: 'credits', amount: 500, scalingFactor: 1.3 },
      { type: 'experience', amount: 250, scalingFactor: 1.2 },
      { type: 'reputation', amount: 25 },
      { type: 'ability', unlockId: 'corporate-infiltration', title: 'Corporate Infiltration', description: 'Enhanced ability to bypass corporate security systems' },
      { type: 'achievement', unlockId: 'first-corp-hack', title: 'Corporate Nemesis', description: 'Successfully infiltrated your first mega-corporation' },
    ],
    prerequisites: [
      { type: 'level', value: 5 },
      { type: 'quest_completed', value: 'origin-3' },
    ],
    progress: {
      startedAt: 0,
      lastUpdated: 0,
      completionPercentage: 0,
    },
    storyLine: 'corporate-wars',
    narrativeContext: 'The corporate world is darker than you imagined. NeoCorp is hiding something big.',
    characterDialogue: '"The data breach wasn\'t an accident. Someone on the inside wanted this information to surface. Find out what they\'re hiding."',
    environmentalClues: [
      'NeoCorp\'s stock price has been unusually volatile',
      'Several whistleblowers have gone missing recently',
      'The breach happened during a board meeting about \'Project Mindbridge\''
    ],
    loreEntries: ['corp-overview-1'],
    choices: [
      {
        id: 'corp-1-choice-1',
        text: 'Work with the whistleblower',
        description: 'Trust the inside source',
        consequences: [
          { type: 'unlock_quest', value: 'corp-2a', description: 'Unlocked alternative path' }
        ],
        requirements: [],
      },
      {
        id: 'corp-1-choice-2',
        text: 'Go it alone',
        description: 'Trust no one, investigate independently',
        consequences: [
          { type: 'skill', value: 'stealth:2', description: 'Enhanced stealth abilities' }
        ],
        requirements: [],
      },
    ],
    nextQuestId: 'corp-2',
  },
];

const initialLoreEntries: LoreEntry[] = [
  // Origin Story Lore
  {
    id: 'origin-overview-1',
    category: 'overview',
    title: 'The Digital Divide',
    content: 'In the modern world, there are two types of people: those who consume digital content, and those who create it. Hackers belong to a third category—those who reshape it.',
    storyLine: 'origin-story',
    isUnlocked: true,
  },
  {
    id: 'origin-world-1',
    category: 'world',
    title: 'The New Internet',
    content: 'What started as a network for sharing information has become the backbone of human civilization. Every transaction, every communication, every thought shared online leaves a trace.',
    storyLine: 'origin-story',
    isUnlocked: true,
  },
  {
    id: 'origin-characters-1',
    category: 'characters',
    title: 'The Mentor - CodeName: Cipher',
    content: 'A legendary hacker who has been operating in the shadows for over a decade. Cipher has taken an interest in promising newcomers, guiding them through their first steps into the underground.',
    storyLine: 'origin-story',
    isUnlocked: false,
    unlockedBy: 'origin-2',
  },
  // Corporate Wars Lore
  {
    id: 'corp-overview-1',
    category: 'overview',
    title: 'The Corporate Oligarchy',
    content: 'Five mega-corporations control 80% of global internet infrastructure. They don\'t just provide services—they shape reality itself.',
    storyLine: 'corporate-wars',
    isUnlocked: false,
    unlockedBy: 'corp-1',
  },
  {
    id: 'corp-characters-1',
    category: 'characters',
    title: 'Elena Vasquez - NeoCorp Executive',
    content: 'Former hacker turned corporate executive. She knows both sides of the digital war and plays them against each other with ruthless efficiency.',
    storyLine: 'corporate-wars',
    isUnlocked: false,
    unlockedBy: 'corp-2',
  },
  {
    id: 'corp-world-1',
    category: 'world',
    title: 'NeoCorp Industries',
    content: 'One of the largest tech conglomerates in the world, NeoCorp specializes in neural interface technology and data mining. Their motto: "Connecting Minds, Shaping Tomorrow." Critics call it "Controlling Minds, Owning Tomorrow."',
    storyLine: 'corporate-wars',
    isUnlocked: false,
    unlockedBy: 'corp-1',
  },
  {
    id: 'corp-data-1',
    category: 'data_logs',
    title: 'Project Mindbridge - Internal Memo',
    content: 'CLASSIFIED: Phase 2 trials show 87% success rate in direct neural data extraction. Subjects show no memory of the process. Recommend immediate deployment to consumer products.',
    storyLine: 'corporate-wars',
    isUnlocked: false,
    unlockedBy: 'corp-1',
  },
];

export const useGameStore = create<GameState>()((set, get) => {
      console.log('🎮 GameStore: Initializing with data:', {
        player: initialPlayer,
        targets: initialTargets,
        targetCount: initialTargets.length,
        unlockedTargets: initialTargets.filter(t => t.unlocked).length
      });
      
      return {
        // Initial state
        player: initialPlayer,
        skills: initialSkills,
        equipment: initialEquipment,
        operations: [],
        currentOperation: null,
        targets: initialTargets,
        achievements: initialAchievements,
        quests: initialQuests,
        activeQuests: [],
        completedQuests: [],
        
        // Narrative framework
        storyQuestLines: initialStoryQuestLines,
        loreEntries: initialLoreEntries,
        unlockedLore: ['origin-overview-1', 'origin-world-1'],
        
        aiConfig: initialAIConfig,
        aiAnalytics: initialAIAnalytics,
        aiActive: false,
        activeTab: 'dashboard',
        notifications: [],
        lastUpdate: Date.now(),

      // Player actions
      updatePlayer: (updates) => {
        set((state) => ({
          player: { ...state.player, ...updates },
        }));
      },

      updateSkills: (updates) => {
        set((state) => ({
          skills: { ...state.skills, ...updates },
        }));
      },

      // Equipment actions
      addEquipment: (equipment) => {
        set((state) => ({
          equipment: [...state.equipment, equipment],
        }));
      },

      equipItem: (equipmentId) => {
        set((state) => ({
          equipment: state.equipment.map((item) =>
            item.id === equipmentId ? { ...item, equipped: true } : item
          ),
        }));
      },

      unequipItem: (equipmentId) => {
        set((state) => ({
          equipment: state.equipment.map((item) =>
            item.id === equipmentId ? { ...item, equipped: false } : item
          ),
        }));
      },

      upgradeEquipment: (equipmentId) => {
        const state = get();
        const equipment = state.equipment.find(e => e.id === equipmentId);
        if (equipment && state.spendCredits(equipment.upgradeCost)) {
          set((state) => ({
            equipment: state.equipment.map((item) =>
              item.id === equipmentId 
                ? { ...item, level: item.level + 1, bonus: item.bonus + 5, upgradeCost: Math.floor(item.upgradeCost * 1.5) }
                : item
            ),
          }));
          state.addNotification(`Upgraded ${equipment.name} to level ${equipment.level + 1}`, 'success');
        } else {
          state.addNotification('Insufficient credits for upgrade', 'error');
        }
      },

      // Operation actions
      startOperation: (targetId, operationType) => {
        const state = get();
        const target = state.targets.find((t) => t.id === targetId);
        if (!target || !target.unlocked) return;

        // Check if we already have 3 active operations
        const activeOperationsCount = state.operations.filter(op => op.status === 'active').length;
        if (activeOperationsCount >= 3) {
          state.addNotification('Maximum of 3 operations can run simultaneously', 'error');
          return;
        }

        // Check if player has enough energy
        const energyCost = target.difficulty * 10;
        if (state.player.energy < energyCost) {
          state.addNotification('Insufficient energy for this operation', 'error');
          return;
        }

        // Deduct energy cost
        state.updatePlayer({
          energy: state.player.energy - energyCost
        });

        const operation: Operation = {
          id: `op-${Date.now()}`,
          targetId,
          name: `${operationType.replace('_', ' ')} on ${target.name}`,
          type: operationType,
          difficulty: target.difficulty,
          duration: target.difficulty * 30000, // 30 seconds per difficulty level
          startTime: Date.now(),
          progress: 0,
          baseReward: target.rewards.credits,
          rewards: target.rewards,
          status: 'active',
          energyCost: energyCost,
        };

        set((state) => ({
          operations: [...state.operations, operation],
        }));
      },

      updateOperation: (operationId, updates) => {
        set((state) => ({
          operations: state.operations.map((op) =>
            op.id === operationId ? { ...op, ...updates } : op
          ),
        }));
      },

      completeOperation: (operationId) => {
        const state = get();
        const operation = state.operations.find((op) => op.id === operationId);
        if (!operation) return;

        // Award rewards
        const { credits, experience, reputation } = operation.rewards;
        state.updatePlayer({
          credits: state.player.credits + credits,
          reputation: state.player.reputation + reputation,
        });
        state.gainExperience(experience);

        // Mark operation as completed
        state.updateOperation(operationId, { status: 'completed', progress: 100 });
        
        // Add notification
        state.addNotification(
          `Operation completed! +${credits} credits, +${experience} XP`,
          'success'
        );
      },

      // Target actions
      unlockTarget: (targetId) => {
        set((state) => ({
          targets: state.targets.map((target) =>
            target.id === targetId ? { ...target, unlocked: true } : target
          ),
        }));
      },

      // Achievement actions
      unlockAchievement: (achievementId) => {
        set((state) => ({
          achievements: state.achievements.map((achievement) =>
            achievement.id === achievementId
              ? { ...achievement, unlocked: true, unlockedAt: Date.now() }
              : achievement
          ),
        }));
      },

      // Quest actions
      startQuest: (questId) => {
        const state = get();
        const quest = state.quests.find(q => q.id === questId);
        if (!quest || quest.status !== 'available') return;

        // Check prerequisites
        const meetsPrerequisites = quest.prerequisites.every(prereq => {
          switch (prereq.type) {
            case 'level':
              return state.player.level >= (prereq.value as number);
            case 'quest_completed':
              return state.completedQuests.some(q => q.id === prereq.value);
            case 'achievement_unlocked':
              return state.achievements.some(a => a.id === prereq.value && a.unlocked);
            case 'skill_level':
              const [skill, level] = (prereq.value as string).split(':');
              return state.player.skills[skill as keyof Skills] >= parseInt(level);
            default:
              return true;
          }
        });

        if (!meetsPrerequisites) {
          state.addNotification('Prerequisites not met for this quest', 'error');
          return;
        }

        const now = Date.now();
        const updatedQuest: Quest = {
          ...quest,
          status: 'active',
          startedAt: now,
          progress: {
            startedAt: now,
            lastUpdated: now,
            completionPercentage: 0,
          },
        };

        set((state) => ({
          quests: state.quests.map(q => q.id === questId ? updatedQuest : q),
          activeQuests: [...state.activeQuests, updatedQuest],
        }));

        state.addNotification(`Quest started: ${quest.title}`, 'success');
      },

      completeObjective: (questId, objectiveId) => {
        const state = get();
        const quest = state.activeQuests.find(q => q.id === questId);
        if (!quest) return;

        const updatedObjectives = quest.objectives.map(obj => 
          obj.id === objectiveId ? { ...obj, isCompleted: true, current: obj.target } : obj
        );

        const updatedQuest = { ...quest, objectives: updatedObjectives };
        state.checkQuestCompletion(questId);
      },

      claimReward: (questId) => {
        const state = get();
        const quest = state.completedQuests.find(q => q.id === questId);
        if (!quest) return;

        const rewardMessages: string[] = [];

        // Create reward calculation context
        const context: RewardCalculationContext = {
          playerLevel: state.player.level,
          questDifficulty: quest.difficulty,
          playerReputation: state.player.reputation,
          completionTime: quest.completedAt ? quest.completedAt - (quest.startedAt || 0) : undefined,
          skillLevels: {
            hacking: state.player.skills.hacking,
            stealth: state.player.skills.stealth,
            social: state.player.skills.social,
            hardware: state.player.skills.hardware,
            cryptography: state.player.skills.cryptography
          }
        };

        // Award rewards using calculator
        const rewards = Array.isArray(quest.rewards) ? quest.rewards : [];
        rewards.forEach(reward => {
          const calculatedReward = calculateReward(reward, context);
          const finalAmount = calculatedReward.amount;

          switch (reward.type) {
            case 'credits':
              state.updatePlayer({ credits: state.player.credits + finalAmount });
              rewardMessages.push(`+${finalAmount.toLocaleString()} Credits`);
              break;
            case 'experience':
              state.gainExperience(finalAmount);
              rewardMessages.push(`+${finalAmount} XP`);
              break;
            case 'reputation':
              state.updatePlayer({ reputation: state.player.reputation + finalAmount });
              rewardMessages.push(`+${finalAmount} Reputation`);
              break;
            case 'skill_points':
              state.updatePlayer({ skillPoints: state.player.skillPoints + finalAmount });
              rewardMessages.push(`+${finalAmount} Skill Points`);
              break;
            case 'equipment':
              if (reward.itemId) {
                // Add equipment to inventory
                const newEquipment = {
                  id: `eq-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                  name: reward.data?.name || 'Unknown Equipment',
                  type: reward.data?.type || 'misc',
                  rarity: reward.rarity || 'common',
                  stats: reward.data?.stats || {},
                  description: reward.description || '',
                  equipped: false,
                  level: reward.data?.level || 1
                };
                state.addEquipment(newEquipment);
                rewardMessages.push(`Equipment: ${newEquipment.name}`);
              }
              break;
            case 'ability':
              // Unlock new ability or skill
              if (reward.data?.abilityId) {
                const newAbility = {
                  id: reward.data.abilityId,
                  title: reward.data.name || reward.title || 'Unknown Ability',
                  description: reward.description || 'A new ability has been unlocked.',
                  unlockedAt: Date.now()
                };
                
                state.updatePlayer({
                  abilities: [...(state.player.abilities || []), newAbility]
                });
                
                rewardMessages.push(`New Ability: ${newAbility.title}`);
              }
              break;
            case 'story_unlock':
              // Unlock story content
              if (reward.unlockId) {
                state.unlockLore(reward.unlockId);
                rewardMessages.push(`Story Unlocked: ${reward.title || 'New Content'}`);
              }
              break;
            case 'achievement':
              // Unlock achievement
              if (reward.unlockId) {
                state.unlockAchievement(reward.unlockId);
                rewardMessages.push(`Achievement: ${reward.title || 'New Achievement'}`);
              }
              break;
            case 'cosmetic':
              // Add cosmetic item
              rewardMessages.push(`Cosmetic: ${reward.title || 'New Cosmetic'}`);
              break;
            case 'title':
              // Unlock player title
              if (reward.title) {
                const newTitle = {
                  id: reward.unlockId || `title-${Date.now()}`,
                  title: reward.title,
                  description: reward.description || 'A prestigious title earned through your actions.',
                  unlockedAt: Date.now()
                };
                
                state.updatePlayer({
                  titles: [...(state.player.titles || []), newTitle]
                });
                
                rewardMessages.push(`Title Unlocked: ${newTitle.title}`);
              }
              break;
            case 'access_unlock':
              // Unlock access to new areas/features
              rewardMessages.push(`Access Granted: ${reward.title || 'New Area'}`);
              break;
          }
        });

        const rewardText = rewardMessages.join(', ');
        state.addNotification(`Quest rewards claimed: ${rewardText}`, 'success');
      },

      getActiveQuests: () => {
        return get().activeQuests;
      },

      updateQuestProgress: (questId, objectiveId, progress) => {
        const state = get();
        const quest = state.activeQuests.find(q => q.id === questId);
        if (!quest) return;

        const updatedObjectives = quest.objectives.map(obj => {
          if (obj.id === objectiveId) {
            const newCurrent = Math.min(progress, obj.target);
            return { ...obj, current: newCurrent, isCompleted: newCurrent >= obj.target };
          }
          return obj;
        });

        const completedObjectives = updatedObjectives.filter(obj => obj.isCompleted).length;
        const totalObjectives = updatedObjectives.length;
        const completionPercentage = (completedObjectives / totalObjectives) * 100;

        const updatedQuest = {
          ...quest,
          objectives: updatedObjectives,
          progress: {
            ...quest.progress,
            lastUpdated: Date.now(),
            completionPercentage,
          },
        };

        set((state) => ({
          quests: state.quests.map(q => q.id === questId ? updatedQuest : q),
          activeQuests: state.activeQuests.map(q => q.id === questId ? updatedQuest : q),
        }));

        // Check if quest is completed
        if (completionPercentage === 100) {
          state.checkQuestCompletion(questId);
        }
      },

      checkQuestCompletion: (questId) => {
        const state = get();
        const quest = state.activeQuests.find(q => q.id === questId);
        if (!quest) return;

        const requiredObjectives = quest.objectives.filter(obj => !obj.isOptional);
        const completedRequired = requiredObjectives.filter(obj => obj.isCompleted);

        if (completedRequired.length === requiredObjectives.length) {
          const completedQuest = {
            ...quest,
            status: 'completed' as const,
            completedAt: Date.now(),
          };

          set((state) => ({
            quests: state.quests.map(q => q.id === questId ? completedQuest : q),
            activeQuests: state.activeQuests.filter(q => q.id !== questId),
            completedQuests: [...state.completedQuests, completedQuest],
          }));

          state.addNotification(`Quest completed: ${quest.title}`, 'success');
        }
      },

      addQuest: (quest) => {
        set((state) => ({
          quests: [...state.quests, quest],
        }));
      },

      updateQuest: (questId, updates) => {
        set((state) => ({
          quests: state.quests.map(q => q.id === questId ? { ...q, ...updates } : q),
          activeQuests: state.activeQuests.map(q => q.id === questId ? { ...q, ...updates } : q),
        }));
      },

      // UI actions
      setActiveTab: (tab) => {
        set({ activeTab: tab });
      },

      addNotification: (message, type) => {
        const state = get();
        
        // Check for duplicate notifications in the last 10 seconds
        const now = Date.now();
        const recentDuplicate = state.notifications.find(
          notif => notif.message === message && 
                   notif.type === type && 
                   (now - notif.timestamp) < 10000
        );
        
        // Skip if duplicate notification exists
        if (recentDuplicate) {
          return;
        }
        
        const notification = {
          id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          message,
          type,
          timestamp: now,
        };
        
        set((state) => ({
          notifications: [...state.notifications, notification],
        }));

        // Auto-remove after 5 seconds with proper cleanup
        const timeoutId = setTimeout(() => {
          const currentState = get();
          if (currentState.notifications.some(n => n.id === notification.id)) {
            get().removeNotification(notification.id);
          }
        }, 5000);
        
        // Store timeout ID for potential cleanup
        notification.timeoutId = timeoutId;
      },

      removeNotification: (id) => {
        set((state) => {
          const notificationToRemove = state.notifications.find(n => n.id === id);
          if (notificationToRemove?.timeoutId) {
            clearTimeout(notificationToRemove.timeoutId);
          }
          return {
            notifications: state.notifications.filter((notif) => notif.id !== id),
          };
        });
      },

      setLastUpdate: (timestamp) => {
        set({ lastUpdate: timestamp });
      },

      // AI Actions
      updateAIConfig: (updates) => {
        set((state) => ({
          aiConfig: { ...state.aiConfig, ...updates },
        }));
      },

      toggleAI: () => {
        const state = get();
        const newEnabled = !state.aiConfig.enabled;
        
        set((state) => ({
          aiConfig: { ...state.aiConfig, enabled: newEnabled, isActive: newEnabled },
          aiActive: newEnabled,
          aiAnalytics: newEnabled 
            ? { ...state.aiAnalytics, activeSince: Date.now() }
            : { ...state.aiAnalytics, activeSince: undefined },
        }));

        // Only show AI toggle notifications, not frequent decision notifications
        get().addNotification(
          `AI Autoplay ${newEnabled ? 'activated' : 'deactivated'}`,
          newEnabled ? 'success' : 'info'
        );
      },

      recordAIDecision: (decision, result) => {
        const state = get();
        const newAction = {
          timestamp: Date.now(),
          action: decision.action,
          result,
          details: decision.reasoning,
        };

        const recentActions = [newAction, ...state.aiAnalytics.recentActions].slice(0, 10);
        const successCount = recentActions.filter(a => a.result === 'success').length;
        const successRate = recentActions.length > 0 ? successCount / recentActions.length : 0;

        set((state) => ({
          aiAnalytics: {
            ...state.aiAnalytics,
            decisionsMade: state.aiAnalytics.decisionsMade + 1,
            successRate,
            recentActions,
            efficiencyScore: Math.min(successRate * 1.2, 1.0),
          },
        }));
      },

      makeAIDecision: () => {
        const state = get();
        if (!state.aiConfig.enabled || !state.aiActive) return null;

        const { priorities, riskTolerance, resourceAllocation } = state.aiConfig;
        const { player, operations, targets, equipment } = state;

        // Check if we should start a new operation
        if (Math.random() < priorities.operations && operations.filter(op => op.status === 'active').length < 3) {
          const availableTargets = targets.filter(t => t.unlocked && t.difficulty <= player.level + 2);
          if (availableTargets.length > 0) {
            // Select target based on risk tolerance
            const sortedTargets = availableTargets.sort((a, b) => {
              const riskA = a.difficulty / player.level;
              const riskB = b.difficulty / player.level;
              const preferredRisk = riskTolerance;
              return Math.abs(riskA - preferredRisk) - Math.abs(riskB - preferredRisk);
            });
            
            const selectedTarget = sortedTargets[0];
            const operationTypes: Operation['type'][] = ['data_breach', 'crypto_mining', 'ddos', 'social_engineering'];
            const selectedType = operationTypes[Math.floor(Math.random() * operationTypes.length)];

            return {
              type: 'start_operation',
              targetId: selectedTarget.id,
              operationType: selectedType,
              action: `start_operation_${selectedTarget.id}_${selectedType}`,
              reasoning: `Starting ${selectedType} on ${selectedTarget.name} (difficulty: ${selectedTarget.difficulty}, risk tolerance: ${riskTolerance})`,
              confidence: Math.max(0.3, 1 - (selectedTarget.difficulty / player.level)),
              timestamp: new Date(),
              description: `AI started ${selectedType} operation on ${selectedTarget.name}`,
            };
          }
        }

        // Check if we should upgrade equipment
        if (Math.random() < priorities.upgrades && player.credits > 500) {
          const upgradeableEquipment = equipment.filter(e => e.equipped && e.level < 10);
          if (upgradeableEquipment.length > 0) {
            const selectedEquipment = upgradeableEquipment[0];
            return {
              type: 'upgrade_equipment',
              targetId: selectedEquipment.id,
              reasoning: `Upgrading ${selectedEquipment.name} to improve performance`,
              confidence: 0.8,
              timestamp: new Date(),
              description: `AI upgraded ${selectedEquipment.name}`,
            };
          }
        }

        return null;
      },

      executeAIDecision: async (decision) => {
        const state = get();
        let success = false;

        // Store the decision as the last decision
        set({ aiLastDecision: decision });

        try {
          if (decision.type === 'start_operation') {
            // Start operation directly using targetId
            const target = state.targets.find(t => t.id === decision.targetId);
            if (target && target.unlocked && state.player.energy >= (target.difficulty * 10)) {
              state.startOperation(decision.targetId, decision.operationType);
              success = true;
              
              // Update AI analytics for operation start
              set((state) => ({
                aiAnalytics: {
                  ...state.aiAnalytics,
                  operationsStarted: (state.aiAnalytics.operationsStarted || 0) + 1,
                },
              }));
            }
          } else if (decision.type === 'upgrade_equipment') {
            // Find and upgrade equipment
            const equipment = state.equipment.find(e => e.id === decision.targetId);
            if (equipment && equipment.equipped && state.spendCredits(equipment.upgradeCost || 1000)) {
              // Upgrade the equipment
              set((state) => ({
                equipment: state.equipment.map(item => 
                  item.id === decision.targetId 
                    ? { ...item, level: item.level + 1, bonus: item.bonus + 5 }
                    : item
                ),
              }));
              success = true;
              
              // Only show equipment upgrade notifications if it's a significant upgrade
              if (equipment.level % 2 === 0 || equipment.level <= 3) {
                state.addNotification(`Upgraded ${equipment.name} to level ${equipment.level + 1}`, 'success');
              }
            }
          } else if (decision.type === 'allocate_skill') {
            // Allocate skill points
            if (state.player.skillPoints >= decision.points) {
              const currentSkillValue = state.player.skills[decision.skill] || 1;
              
              state.updatePlayer({
                skillPoints: state.player.skillPoints - decision.points,
                skills: {
                  ...state.player.skills,
                  [decision.skill]: currentSkillValue + decision.points,
                },
              });
              
              success = true;
              // Only show skill allocation notifications for larger point allocations
              if (decision.points >= 3) {
                state.addNotification(`Allocated ${decision.points} points to ${decision.skill}`, 'success');
              }
            }
          } else if (decision.type === 'execute_hack') {
            // Execute hacking technique
            try {
              const response = await fetch('/api/hacking/execute', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  technique_id: decision.techniqueId,
                  target_name: decision.targetInfo || 'ai_selected_target',
                  player_id: state.player.id || 'player_1'
                })
              });
              
              if (response.ok) {
                const result = await response.json();
                success = result.success;
                
                if (success) {
                  // Update player stats based on hack result
                  if (result.rewards) {
                    state.updatePlayer({
                      credits: state.player.credits + (result.rewards.credits || 0),
                      experience: state.player.experience + (result.rewards.experience || 0)
                    });
                  }
                  
                  // Update AI analytics for successful hack
                  set((state) => ({
                    aiAnalytics: {
                      ...state.aiAnalytics,
                      hacksExecuted: (state.aiAnalytics.hacksExecuted || 0) + 1,
                      creditsEarned: (state.aiAnalytics.creditsEarned || 0) + (result.rewards?.credits || 0)
                    },
                  }));
                  
                  state.addNotification(`AI executed ${result.technique_name}: +${result.rewards?.credits || 0} credits`, 'success');
                }
              }
            } catch (error) {
              console.error('AI hack execution error:', error);
              success = false;
            }
          } else if (decision.type === 'operation') {
            // Legacy support for old decision format
            const [, , targetId, operationType] = decision.action.split('_');
            state.startOperation(targetId, operationType as Operation['type']);
            success = true;
          } else if (decision.type === 'upgrade') {
            // Legacy support for old decision format
            const equipmentId = decision.action.split('_')[2];
            const equipment = state.equipment.find(e => e.id === equipmentId);
            if (equipment && state.spendCredits(equipment.level * 100)) {
              state.equipItem(equipmentId);
              success = true;
            }
          }
        } catch (error) {
          console.error('AI Decision execution error:', error);
          success = false;
        }

        // Record the decision for analytics
        const aiDecision: AIDecision = {
          type: decision.type,
          targetId: decision.targetId,
          reasoning: decision.reasoning || 'AI automated decision',
          confidence: decision.confidence || 0.7,
          timestamp: new Date(),
          description: decision.description || `AI executed ${decision.type} decision`,
        };
        state.recordAIDecision(aiDecision, success ? 'success' : 'failure');
        
        // Update success rate and efficiency
        if (success) {
          const currentTime = Date.now();
          set((state) => ({
            aiAnalytics: {
              ...state.aiAnalytics,
              lastSuccessTime: currentTime,
              totalSuccesses: (state.aiAnalytics.totalSuccesses || 0) + 1,
            },
          }));
        }
      },

      updateAIAnalytics: (updates) => {
        set((state) => ({
          aiAnalytics: { ...state.aiAnalytics, ...updates },
        }));
      },

      resetAIAnalytics: () => {
        set((state) => ({
          aiAnalytics: {
            ...initialAIAnalytics,
            activeSince: state.aiAnalytics.activeSince,
          },
        }));
      },

      // Game mechanics
      calculateIdleRewards: () => {
        const state = get();
        const now = Date.now();
        const timeDiff = now - state.player.lastActive;
        const hoursIdle = timeDiff / (1000 * 60 * 60);

        if (hoursIdle > 0.1) { // At least 6 minutes
          const idleCredits = Math.floor(hoursIdle * 10 * state.player.level);
          const idleExperience = Math.floor(hoursIdle * 5 * state.player.level);

          state.updatePlayer({
            credits: state.player.credits + idleCredits,
            lastActive: now,
          });
          state.gainExperience(idleExperience);

          if (idleCredits > 0) {
            state.addNotification(
              `Idle rewards: +${idleCredits} credits, +${idleExperience} XP`,
              'info'
            );
          }
        }
      },

      gainExperience: (amount) => {
        const state = get();
        let newExp = state.player.experience + amount;
        let newLevel = state.player.level;
        let expToNext = state.player.experienceToNext;

        while (newExp >= expToNext) {
          newExp -= expToNext;
          newLevel++;
          expToNext = newLevel * 100; // Each level requires level * 100 XP
          
          // Level up notification
          get().addNotification(`Level up! You are now level ${newLevel}`, 'success');
        }

        state.updatePlayer({
          experience: newExp,
          level: newLevel,
          experienceToNext: expToNext,
        });
      },

      spendCredits: (amount) => {
        const state = get();
        if (state.player.credits >= amount) {
          state.updatePlayer({
            credits: state.player.credits - amount,
          });
          return true;
        }
        return false;
      },

      regenerateEnergy: () => {
        const state = get();
        if (state.player.energy < state.player.maxEnergy) {
          state.updatePlayer({
            energy: Math.min(state.player.energy + 1, state.player.maxEnergy),
          });
        }
      },

      // Narrative Actions
      unlockLore: (loreId) => {
        const state = get();
        if (!state.unlockedLore.includes(loreId)) {
          set((state) => ({
            unlockedLore: [...state.unlockedLore, loreId],
          }));
          
          const loreEntry = state.loreEntries.find(l => l.id === loreId);
          if (loreEntry) {
            state.addNotification(`New lore discovered: ${loreEntry.title}`, 'info');
          }
        }
      },



      getLoreByStoryLine: (storyLine) => {
        const state = get();
        return state.loreEntries.filter(lore => 
          lore.storyLine === storyLine && state.unlockedLore.includes(lore.id)
        );
      },

      getStoryQuestLine: (storyLineId) => {
        const state = get();
        return state.storyQuestLines.find(line => line.id === storyLineId);
      },

      updateStoryProgress: (storyLineId, questId) => {
        const state = get();
        const storyLine = state.storyQuestLines.find(line => line.id === storyLineId);
        if (!storyLine) return;

        const questIndex = storyLine.questIds.indexOf(questId);
        if (questIndex !== -1) {
          const updatedStoryLine = {
            ...storyLine,
            completedQuests: questIndex + 1,
            currentQuestId: questIndex + 1 < storyLine.questIds.length 
              ? storyLine.questIds[questIndex + 1] 
              : undefined,
          };

          set((state) => ({
            storyQuestLines: state.storyQuestLines.map(line => 
              line.id === storyLineId ? updatedStoryLine : line
            ),
          }));

          // Unlock related lore entries
          const relatedLore = state.loreEntries.filter(lore => 
            lore.unlockedBy === questId && !state.unlockedLore.includes(lore.id)
          );
          
          relatedLore.forEach(lore => {
            state.unlockLore(lore.id);
          });
        }
      },

      makeQuestChoice: (questId, choiceId) => {
        const state = get();
        const quest = state.activeQuests.find(q => q.id === questId);
        if (!quest || !quest.choices) return;

        const choice = quest.choices.find(c => c.id === choiceId);
        if (!choice) return;

        // Apply consequences
        choice.consequences.forEach(consequence => {
          switch (consequence.type) {
            case 'reputation':
              state.updatePlayer({
                reputation: state.player.reputation + (consequence.value as number),
              });
              break;
            case 'skill':
              const [skill, points] = (consequence.value as string).split(':');
              const currentSkillValue = state.player.skills[skill as keyof Skills] || 1;
              state.updatePlayer({
                skills: {
                  ...state.player.skills,
                  [skill]: currentSkillValue + parseInt(points),
                },
              });
              break;
            case 'unlock_quest':
              // Logic to unlock new quest
              break;
            case 'unlock_target':
              state.unlockTarget(consequence.value as string);
              break;
            case 'story_branch':
              // Logic for story branching
              break;
          }
        });

        state.addNotification(`Choice made: ${choice.text}`, 'info');
      },
    };
});

// Temporarily disabled persist to debug data loading
// persist(
//   {
//     name: 'ai-idle-hacker-game',
//     partialize: (state) => ({
//       player: state.player,
//       skills: state.skills,
//       equipment: state.equipment,
//       targets: state.targets,
//       achievements: state.achievements,
//       operations: state.operations,
//     }),
//   }
// )