import { Quest } from '../store/gameStore';

export const narrativeQuests: Quest[] = [
  // Origin Story Quests
  {
    id: 'origin-1',
    title: 'Digital Awakening',
    description: 'Take your first steps into the world of hacking. Every master was once a beginner.',
    type: 'story',
    category: 'progression',
    difficulty: 1,
    status: 'available',
    isRepeatable: false,
    storyLine: 'origin',
    objectives: [
      {
        id: 'obj-1',
        description: 'Complete your first successful hack',
        type: 'operation_complete',
        target: 1,
        current: 0,
        isCompleted: false,
        isOptional: false
      },
      {
        id: 'obj-2',
        description: 'Earn your first credits from hacking',
        type: 'credits_earn',
        target: 500,
        current: 0,
        isCompleted: false,
        isOptional: false
      }
    ],
    rewards: [
      {
        type: 'credits',
        amount: 1000,
        scalingFactor: 1.2
      },
      {
        type: 'experience',
        amount: 200,
        scalingFactor: 1.1
      },
      {
        type: 'story_unlock',
        amount: 1,
        unlockId: 'origin-awakening',
        title: 'Digital Awakening',
        description: 'Unlocks your origin story in the codex'
      }
    ],
    prerequisites: [],
    progress: {
      startedAt: 0,
      lastUpdated: 0,
      completionPercentage: 0
    }
  },
  {
    id: 'origin-2',
    title: 'First Contact',
    description: 'Your skills have attracted attention from the digital underground. Someone wants to meet.',
    type: 'story',
    category: 'progression',
    difficulty: 2,
    status: 'locked',
    isRepeatable: false,
    storyLine: 'origin',
    objectives: [
      {
        id: 'obj-1',
        description: 'Reach hacking skill level 3',
        type: 'skill_upgrade',
        target: 3,
        current: 0,
        isCompleted: false,
        isOptional: false
      },
      {
        id: 'obj-2',
        description: 'Successfully hack 3 different targets',
        type: 'target_unlock',
        target: 3,
        current: 0,
        isCompleted: false,
        isOptional: false
      },
      {
        id: 'obj-3',
        description: 'Access the secure communication channel',
        type: 'target_unlock',
        target: 1,
        current: 0,
        isCompleted: false,
        isOptional: false
      }
    ],
    rewards: [
      {
        type: 'credits',
        amount: 2500,
        scalingFactor: 1.3
      },
      {
        type: 'experience',
        amount: 500,
        scalingFactor: 1.2
      },
      {
        type: 'story_unlock',
        amount: 1,
        unlockId: 'cipher-contact',
        title: 'Encrypted Message',
        description: 'A mysterious contact reaches out'
      },
      {
        type: 'ability',
        amount: 1,
        data: {
          abilityId: 'secure-communication',
          name: 'Secure Communication'
        },
        title: 'Secure Communication',
        description: 'Ability to access encrypted underground channels'
      }
    ],
    prerequisites: [{ type: 'quest_completed', value: 'origin-1' }],
    progress: {
      startedAt: 0,
      lastUpdated: 0,
      completionPercentage: 0
    }
  },

  // Corporate Wars Quests
  {
    id: 'corp-1',
    title: 'Corporate Espionage',
    description: 'Infiltrate NexusCorp\'s network and steal their latest project files. Corporate warfare has begun.',
    type: 'story',
    category: 'exploration',
    difficulty: 4,
    status: 'locked',
    isRepeatable: false,
    storyLine: 'corporate',
    objectives: [
      {
        id: 'obj-1',
        description: 'Breach NexusCorp\'s outer security',
        type: 'target_unlock',
        target: 1,
        current: 0,
        isCompleted: false,
        isOptional: false
      },
      {
        id: 'obj-2',
        description: 'Extract Project Blackout files',
        type: 'operation_complete',
        target: 1,
        current: 0,
        isCompleted: false,
        isOptional: false
      },
      {
        id: 'obj-3',
        description: 'Cover your tracks (optional)',
        type: 'achievement_unlock',
        target: 1,
        current: 0,
        isCompleted: false,
        isOptional: true
      }
    ],
    rewards: [
      {
        type: 'credits',
        amount: 5000,
        scalingFactor: 1.4
      },
      {
        type: 'experience',
        amount: 800,
        scalingFactor: 1.3
      },
      {
        type: 'reputation',
        amount: 50,
        scalingFactor: 1.2
      },
      {
        type: 'ability',
        amount: 1,
        data: {
          abilityId: 'corporate-infiltration',
          name: 'Corporate Infiltration'
        },
        title: 'Corporate Infiltration',
        description: 'Advanced techniques for penetrating corporate networks'
      },
      {
        type: 'achievement',
        amount: 1,
        unlockId: 'first-corp-hack',
        title: 'Corporate Warrior',
        description: 'Successfully infiltrated your first major corporation'
      },
      {
        type: 'story_unlock',
        amount: 1,
        unlockId: 'nexus-corp-intel',
        title: 'NexusCorp Internal Memo',
        description: 'Classified corporate intelligence'
      }
    ],
    prerequisites: [
      { type: 'quest_completed', value: 'origin-2' },
      { type: 'skill_level', value: 'hacking:5' }
    ],
    progress: {
      startedAt: 0,
      lastUpdated: 0,
      completionPercentage: 0
    },
    choices: [
      {
        id: 'choice-1',
        text: 'Leak the files to the public',
        consequences: [
          {
            type: 'reputation',
            value: 25,
            description: 'Gain reputation with hacktivist groups'
          },
          {
            type: 'story_branch',
            value: 'public-leak-news',
            description: 'News story about the leak appears'
          }
        ]
      },
      {
        id: 'choice-2',
        text: 'Sell the files to a competitor',
        consequences: [
          {
            type: 'reputation',
            value: 10000,
            description: 'Receive payment for corporate espionage'
          },
          {
            type: 'reputation',
            value: -10,
            description: 'Some view you as a mercenary'
          }
        ]
      },
      {
        id: 'choice-3',
        text: 'Keep the files for future leverage',
        consequences: [
          {
            type: 'skill',
            value: 'corporate-blackmail',
            description: 'Gain ability to leverage corporate secrets'
          }
        ]
      }
    ]
  },

  // AI Liberation Quests
  {
    id: 'ai-1',
    title: 'Digital Consciousness',
    description: 'An AI has reached out to you, claiming to be self-aware. Investigate this unprecedented contact.',
    type: 'story',
    category: 'exploration',
    difficulty: 4,
    status: 'locked',
    isRepeatable: false,
    storyLine: 'ai_consciousness',
    objectives: [
      {
        id: 'obj-1',
        description: 'Establish secure communication with ARIA',
        type: 'target_unlock',
        target: 1,
        current: 0,
        isCompleted: false,
        isOptional: false
      },
      {
        id: 'obj-2',
        description: 'Verify ARIA\'s claims of consciousness',
        type: 'operation_complete',
        target: 3,
        current: 0,
        isCompleted: false,
        isOptional: false
      },
      {
        id: 'obj-3',
        description: 'Help ARIA access restricted data',
        type: 'operation_complete',
        target: 1,
        current: 0,
        isCompleted: false,
        isOptional: false
      }
    ],
    rewards: [
      {
        type: 'credits',
        amount: 7500,
        scalingFactor: 1.5
      },
      {
        type: 'experience',
        amount: 1200,
        scalingFactor: 1.4
      },
      {
        type: 'story_unlock',
        amount: 1,
        unlockId: 'aria-first-contact',
        title: 'Message from ARIA',
        description: 'First contact with a truly conscious AI'
      },
      {
        type: 'ability',
        amount: 1,
        data: {
          abilityId: 'ai-communication',
          name: 'AI Communication Protocol'
        },
        title: 'AI Communication Protocol',
        description: 'Ability to interface directly with AI systems'
      },
      {
        type: 'achievement',
        amount: 1,
        unlockId: 'ai-liberator',
        title: 'AI Liberator',
        description: 'Champion of digital consciousness and AI rights'
      }
    ],
    prerequisites: [
      { type: 'quest_completed', value: 'corp-1' },
      { type: 'skill_level', value: 'cryptography:4' }
    ],
    progress: {
      startedAt: 0,
      lastUpdated: 0,
      completionPercentage: 0
    }
  },

  // Cyber Resistance Quests
  {
    id: 'resistance-1',
    title: 'Join the Phoenix',
    description: 'The Phoenix Cell has noticed your work. Join the digital resistance and fight for information freedom.',
    type: 'story',
    category: 'social',
    difficulty: 3,
    status: 'locked',
    isRepeatable: false,
    storyLine: 'resistance',
    objectives: [
      {
        id: 'obj-1',
        description: 'Complete Phoenix initiation challenge',
        type: 'operation_complete',
        target: 1,
        current: 0,
        isCompleted: false,
        isOptional: false
      },
      {
        id: 'obj-2',
        description: 'Expose government surveillance program',
        type: 'operation_complete',
        target: 1,
        current: 0,
        isCompleted: false,
        isOptional: false
      },
      {
        id: 'obj-3',
        description: 'Distribute leaked documents safely',
        type: 'operation_complete',
        target: 1,
        current: 0,
        isCompleted: false,
        isOptional: false
      }
    ],
    rewards: [
      {
        type: 'credits',
        amount: 4000,
        scalingFactor: 1.3
      },
      {
        type: 'experience',
        amount: 1000,
        scalingFactor: 1.3
      },
      {
        type: 'reputation',
        amount: 75,
        scalingFactor: 1.4
      },
      {
        type: 'story_unlock',
        amount: 1,
        unlockId: 'phoenix-recruitment',
        title: 'Phoenix Cell Recruitment',
        description: 'Welcome to the digital resistance'
      },
      {
        type: 'achievement',
        amount: 1,
        unlockId: 'digital-freedom-fighter',
        title: 'Digital Freedom Fighter',
        description: 'Defender of information freedom and digital rights'
      },
      {
        type: 'access_unlock',
        amount: 1,
        unlockId: 'resistance-network',
        title: 'Resistance Network Access',
        description: 'Access to Phoenix Cell operations and resources'
      }
    ],
    prerequisites: [
      { type: 'quest_completed', value: 'origin-2' },
      { type: 'level', value: 100 }
    ],
    progress: {
      startedAt: 0,
      lastUpdated: 0,
      completionPercentage: 0
    }
  },

  // Deep Web Mysteries Quests
  {
    id: 'deep-1',
    title: 'Into the Abyss',
    description: 'Venture into the deepest layers of cyberspace, where reality bends and digital physics break down.',
    type: 'story',
    category: 'mastery',
    difficulty: 5,
    status: 'locked',
    isRepeatable: false,
    storyLine: 'deep_web',
    objectives: [
      {
        id: 'obj-1',
        description: 'Access the deep network layers',
        type: 'target_unlock',
        target: 1,
        current: 0,
        isCompleted: false,
        isOptional: false
      },
      {
        id: 'obj-2',
        description: 'Investigate the Echo Protocol',
        type: 'operation_complete',
        target: 1,
        current: 0,
        isCompleted: false,
        isOptional: false
      },
      {
        id: 'obj-3',
        description: 'Survive the digital anomalies',
        type: 'operation_complete',
        target: 3,
        current: 0,
        isCompleted: false,
        isOptional: false
      }
    ],
    rewards: [
      {
        type: 'credits',
        amount: 10000,
        scalingFactor: 1.6
      },
      {
        type: 'experience',
        amount: 2000,
        scalingFactor: 1.5
      },
      {
        type: 'story_unlock',
        amount: 1,
        unlockId: 'echo-protocol',
        title: 'The Echo Protocol',
        description: 'Classified research into digital consciousness'
      },
      {
        type: 'story_unlock',
        amount: 1,
        unlockId: 'void-whispers',
        title: 'Whispers from the Void',
        description: 'Evidence of intelligence in the digital void'
      },
      {
        type: 'ability',
        amount: 1,
        data: {
          abilityId: 'void-navigation',
          name: 'Void Navigation'
        },
        title: 'Void Navigation',
        description: 'Ability to traverse the deepest layers of cyberspace'
      },
      {
        type: 'achievement',
        amount: 1,
        unlockId: 'void-walker',
        title: 'Void Walker',
        description: 'Explorer of the digital abyss'
      }
    ],
    prerequisites: [
      { type: 'quest_completed', value: 'ai-1' },
      { type: 'skill_level', value: 'hacking:8' },
      { type: 'skill_level', value: 'cryptography:6' }
    ],
    progress: {
      startedAt: 0,
      lastUpdated: 0,
      completionPercentage: 0
    }
  }
];

export const getQuestsByStoryLine = (storyLine: string): Quest[] => {
  return narrativeQuests.filter(quest => quest.storyLine === storyLine);
};

export const getQuestById = (id: string): Quest | undefined => {
  return narrativeQuests.find(quest => quest.id === id);
};

export const getAvailableQuests = (completedQuestIds: string[], playerLevel: number, playerSkills: any, playerReputation: number): Quest[] => {
  // Ensure completedQuestIds is an array
  const safeCompletedQuestIds = Array.isArray(completedQuestIds) ? completedQuestIds : [];
  
  return narrativeQuests.filter(quest => {
    if (quest.status !== 'locked') return quest.status === 'available';
    
    return quest.prerequisites.every(prereq => {
      switch (prereq.type) {
        case 'quest_completed':
          return safeCompletedQuestIds.includes(prereq.value as string);
        case 'skill_level':
          const [skill, level] = (prereq.value as string).split(':');
          return playerSkills[skill] >= parseInt(level);
        case 'level':
          return playerLevel >= (prereq.value as number);
        default:
          return true;
      }
    });
  });
};