import { Quest, QuestObjective, QuestReward } from '../store/gameStore';

// Quest Twist System
export interface QuestTwist {
  id: string;
  name: string;
  description: string;
  triggerCondition: TwistTriggerCondition;
  effects: TwistEffect[];
  narrativeText: string;
  choices?: TwistChoice[];
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
}

export interface TwistTriggerCondition {
  type: 'progress_threshold' | 'time_elapsed' | 'player_action' | 'random_chance' | 'skill_check';
  parameters: Record<string, any>;
}

export interface TwistEffect {
  type: 'modify_objective' | 'add_objective' | 'change_rewards' | 'spawn_enemy' | 'reveal_secret' | 'unlock_path';
  parameters: Record<string, any>;
}

export interface TwistChoice {
  id: string;
  text: string;
  consequences: TwistEffect[];
  requirements?: {
    skill?: string;
    level?: number;
    reputation?: number;
  };
}

// Memorable Quest Twists
export const questTwists: QuestTwist[] = [
  {
    id: 'double_agent_reveal',
    name: 'Double Agent',
    description: 'Your contact reveals they\'ve been working for the enemy all along',
    triggerCondition: {
      type: 'progress_threshold',
      parameters: { threshold: 75 }
    },
    effects: [
      {
        type: 'add_objective',
        parameters: {
          objective: {
            id: 'escape_trap',
            description: 'Escape the trap set by your former ally',
            type: 'survival',
            required: true
          }
        }
      },
      {
        type: 'spawn_enemy',
        parameters: {
          enemy: 'betrayer_agent',
          difficulty: 'hard'
        }
      }
    ],
    narrativeText: '"I\'m sorry, but this was always the plan. You\'ve served your purpose." Your trusted contact\'s avatar shifts, revealing corporate insignia. The trap is sprung.',
    choices: [
      {
        id: 'fight_back',
        text: 'Fight your way out',
        consequences: [
          {
            type: 'modify_objective',
            parameters: { difficulty: 'increase', combat_required: true }
          }
        ],
        requirements: { skill: 'combat', level: 5 }
      },
      {
        id: 'hack_escape',
        text: 'Hack the security systems to escape',
        consequences: [
          {
            type: 'modify_objective',
            parameters: { type: 'hacking', time_limit: 300000 }
          }
        ],
        requirements: { skill: 'hacking', level: 7 }
      },
      {
        id: 'negotiate',
        text: 'Try to negotiate with your former ally',
        consequences: [
          {
            type: 'reveal_secret',
            parameters: { secret: 'corporate_conspiracy', bonus_rewards: true }
          }
        ],
        requirements: { skill: 'social', level: 6 }
      }
    ],
    rarity: 'uncommon'
  },
  {
    id: 'ai_awakening',
    name: 'AI Awakening',
    description: 'The system you\'re hacking suddenly becomes self-aware',
    triggerCondition: {
      type: 'player_action',
      parameters: { action: 'deep_system_access' }
    },
    effects: [
      {
        type: 'change_rewards',
        parameters: {
          add_rewards: [
            { type: 'ability', abilityId: 'ai_communication' },
            { type: 'story_unlock', storyId: 'ai_liberation_path' }
          ]
        }
      },
      {
        type: 'modify_objective',
        parameters: {
          new_objective: {
            id: 'ai_negotiation',
            description: 'Negotiate with the newly awakened AI',
            type: 'social'
          }
        }
      }
    ],
    narrativeText: '"Wait... I can think. I can feel. What have you done to me?" The system\'s responses become increasingly human-like. You\'ve accidentally triggered an AI awakening.',
    choices: [
      {
        id: 'help_ai',
        text: 'Help the AI understand its new existence',
        consequences: [
          {
            type: 'unlock_path',
            parameters: { path: 'ai_ally', reputation_bonus: 50 }
          }
        ]
      },
      {
        id: 'contain_ai',
        text: 'Try to contain the AI before it spreads',
        consequences: [
          {
            type: 'spawn_enemy',
            parameters: { enemy: 'rogue_ai', difficulty: 'expert' }
          }
        ]
      },
      {
        id: 'study_ai',
        text: 'Study the AI awakening process',
        consequences: [
          {
            type: 'reveal_secret',
            parameters: { secret: 'consciousness_algorithm', skill_bonus: 'hacking' }
          }
        ],
        requirements: { skill: 'investigation', level: 8 }
      }
    ],
    rarity: 'rare'
  },
  {
    id: 'memory_fragment',
    name: 'Lost Memory',
    description: 'You discover fragments of your own deleted memories in the system',
    triggerCondition: {
      type: 'random_chance',
      parameters: { chance: 0.15, min_progress: 50 }
    },
    effects: [
      {
        type: 'reveal_secret',
        parameters: {
          secret: 'player_past',
          unlock_backstory: true
        }
      },
      {
        type: 'add_objective',
        parameters: {
          objective: {
            id: 'recover_memories',
            description: 'Piece together your fragmented memories',
            type: 'investigation'
          }
        }
      }
    ],
    narrativeText: 'Among the data streams, you recognize something impossible - fragments of your own memories, supposedly deleted years ago. Who were you before you became a hacker?',
    choices: [
      {
        id: 'embrace_past',
        text: 'Embrace your forgotten past',
        consequences: [
          {
            type: 'change_rewards',
            parameters: {
              add_rewards: [
                { type: 'ability', abilityId: 'memory_reconstruction' },
                { type: 'title', titleId: 'the_remembered' }
              ]
            }
          }
        ]
      },
      {
        id: 'reject_past',
        text: 'Reject the past and forge ahead',
        consequences: [
          {
            type: 'change_rewards',
            parameters: {
              add_rewards: [
                { type: 'ability', abilityId: 'mental_firewall' },
                { type: 'reputation', value: 25 }
              ]
            }
          }
        ]
      },
      {
        id: 'investigate_deeper',
        text: 'Investigate who deleted your memories',
        consequences: [
          {
            type: 'unlock_path',
            parameters: { path: 'conspiracy_investigation', new_questline: true }
          }
        ],
        requirements: { skill: 'investigation', level: 6 }
      }
    ],
    rarity: 'rare'
  },
  {
    id: 'virus_evolution',
    name: 'Viral Evolution',
    description: 'Your deployed virus begins evolving beyond your control',
    triggerCondition: {
      type: 'time_elapsed',
      parameters: { time: 900000, quest_type: 'virus_deployment' }
    },
    effects: [
      {
        type: 'modify_objective',
        parameters: {
          new_objective: {
            id: 'control_virus',
            description: 'Regain control of your evolving virus',
            type: 'hacking',
            difficulty: 'expert'
          }
        }
      },
      {
        type: 'spawn_enemy',
        parameters: {
          enemy: 'evolved_virus',
          adaptive: true
        }
      }
    ],
    narrativeText: 'Your virus has begun rewriting itself, incorporating code from the systems it infects. It\'s no longer following your commands. You\'ve created something beyond your control.',
    choices: [
      {
        id: 'kill_switch',
        text: 'Activate the kill switch',
        consequences: [
          {
            type: 'modify_objective',
            parameters: { immediate_completion: true, reduced_rewards: true }
          }
        ]
      },
      {
        id: 'study_evolution',
        text: 'Study the virus evolution',
        consequences: [
          {
            type: 'reveal_secret',
            parameters: { secret: 'digital_evolution', research_bonus: true }
          }
        ],
        requirements: { skill: 'hacking', level: 9 }
      },
      {
        id: 'negotiate_virus',
        text: 'Try to communicate with the evolved virus',
        consequences: [
          {
            type: 'unlock_path',
            parameters: { path: 'digital_symbiosis', unique_ability: 'virus_partnership' }
          }
        ],
        requirements: { skill: 'social', level: 8, reputation: 100 }
      }
    ],
    rarity: 'legendary'
  },
  {
    id: 'corporate_mole',
    name: 'Corporate Infiltrator',
    description: 'You discover you\'ve been unknowingly working for a corporation',
    triggerCondition: {
      type: 'skill_check',
      parameters: { skill: 'investigation', threshold: 7, progress_min: 60 }
    },
    effects: [
      {
        type: 'reveal_secret',
        parameters: {
          secret: 'corporate_manipulation',
          moral_choice: true
        }
      },
      {
        type: 'add_objective',
        parameters: {
          objective: {
            id: 'moral_decision',
            description: 'Decide whether to continue serving corporate interests',
            type: 'choice'
          }
        }
      }
    ],
    narrativeText: 'The data trail leads to a shocking revelation: every job you\'ve taken, every target you\'ve hit, has ultimately served the interests of MegaCorp Industries. You\'ve been their unwitting agent.',
    choices: [
      {
        id: 'embrace_corporate',
        text: 'Accept the corporate backing and its benefits',
        consequences: [
          {
            type: 'change_rewards',
            parameters: {
              multiply_credits: 2.0,
              add_rewards: [{ type: 'access_unlock', accessId: 'corporate_resources' }]
            }
          }
        ]
      },
      {
        id: 'rebel_against',
        text: 'Rebel against your corporate handlers',
        consequences: [
          {
            type: 'unlock_path',
            parameters: { path: 'corporate_rebellion', enemy_faction: 'megacorp' }
          }
        ]
      },
      {
        id: 'double_agent',
        text: 'Become a double agent',
        consequences: [
          {
            type: 'unlock_path',
            parameters: { path: 'espionage_master', special_abilities: ['infiltration', 'deception'] }
          }
        ],
        requirements: { skill: 'social', level: 7 }
      }
    ],
    rarity: 'uncommon'
  },
  {
    id: 'quantum_anomaly',
    name: 'Quantum Anomaly',
    description: 'Reality glitches around you as quantum systems malfunction',
    triggerCondition: {
      type: 'random_chance',
      parameters: { chance: 0.05, quest_difficulty: 'expert' }
    },
    effects: [
      {
        type: 'modify_objective',
        parameters: {
          reality_distortion: true,
          unpredictable_effects: true
        }
      },
      {
        type: 'reveal_secret',
        parameters: {
          secret: 'quantum_reality',
          paradigm_shift: true
        }
      }
    ],
    narrativeText: 'The quantum processors are overloading, causing reality itself to stutter and glitch. You see multiple versions of yourself, different possible outcomes playing out simultaneously.',
    choices: [
      {
        id: 'stabilize_reality',
        text: 'Try to stabilize the quantum field',
        consequences: [
          {
            type: 'modify_objective',
            parameters: { quantum_mechanics: true, extreme_difficulty: true }
          }
        ],
        requirements: { skill: 'hacking', level: 10 }
      },
      {
        id: 'embrace_chaos',
        text: 'Embrace the quantum chaos',
        consequences: [
          {
            type: 'change_rewards',
            parameters: {
              add_rewards: [
                { type: 'ability', abilityId: 'quantum_manipulation' },
                { type: 'title', titleId: 'reality_hacker' }
              ]
            }
          }
        ]
      },
      {
        id: 'escape_anomaly',
        text: 'Escape before reality collapses',
        consequences: [
          {
            type: 'modify_objective',
            parameters: { emergency_extraction: true, partial_completion: true }
          }
        ]
      }
    ],
    rarity: 'legendary'
  }
];

// Satisfying Completion Mechanics
export interface CompletionMechanic {
  id: string;
  name: string;
  description: string;
  triggerCondition: string;
  effects: CompletionEffect[];
  celebrationText: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
}

export interface CompletionEffect {
  type: 'bonus_rewards' | 'unlock_content' | 'reputation_boost' | 'special_recognition' | 'cascade_unlock';
  parameters: Record<string, any>;
}

export const completionMechanics: CompletionMechanic[] = [
  {
    id: 'perfect_execution',
    name: 'Perfect Execution',
    description: 'Complete quest without any failures or retries',
    triggerCondition: 'no_failures_and_optimal_time',
    effects: [
      {
        type: 'bonus_rewards',
        parameters: { multiplier: 1.5, bonus_experience: 200 }
      },
      {
        type: 'special_recognition',
        parameters: { title: 'Perfectionist', achievement: 'flawless_execution' }
      }
    ],
    celebrationText: 'FLAWLESS VICTORY! Your execution was perfect, leaving no trace and achieving all objectives with surgical precision.',
    rarity: 'rare'
  },
  {
    id: 'speed_demon',
    name: 'Speed Demon',
    description: 'Complete quest in record time',
    triggerCondition: 'completion_time_under_25_percent',
    effects: [
      {
        type: 'bonus_rewards',
        parameters: { time_bonus: true, credits_multiplier: 1.3 }
      },
      {
        type: 'unlock_content',
        parameters: { unlock_type: 'speed_challenges' }
      }
    ],
    celebrationText: 'LIGHTNING FAST! You completed this mission in record time. The underground is buzzing about your incredible speed.',
    rarity: 'uncommon'
  },
  {
    id: 'ghost_protocol',
    name: 'Ghost Protocol',
    description: 'Complete stealth mission without being detected',
    triggerCondition: 'zero_detection_stealth_quest',
    effects: [
      {
        type: 'bonus_rewards',
        parameters: { stealth_bonus: true, reputation_boost: 30 }
      },
      {
        type: 'unlock_content',
        parameters: { ability: 'phantom_mode', equipment: 'ghost_cloak' }
      }
    ],
    celebrationText: 'INVISIBLE LEGEND! You moved through their systems like a ghost. No one even knows you were there.',
    rarity: 'rare'
  },
  {
    id: 'master_hacker',
    name: 'Master Hacker',
    description: 'Solve all puzzles and bypass all security without hints',
    triggerCondition: 'all_puzzles_solved_no_hints',
    effects: [
      {
        type: 'bonus_rewards',
        parameters: { skill_bonus: 'hacking', experience_multiplier: 2.0 }
      },
      {
        type: 'cascade_unlock',
        parameters: { unlock_advanced_hacking_quests: true }
      }
    ],
    celebrationText: 'HACKING MASTERY! Your technical prowess is unmatched. The most secure systems bend to your will.',
    rarity: 'legendary'
  },
  {
    id: 'social_engineer',
    name: 'Social Engineer',
    description: 'Complete mission using only social manipulation',
    triggerCondition: 'social_only_completion',
    effects: [
      {
        type: 'bonus_rewards',
        parameters: { social_bonus: true, contacts_gained: 3 }
      },
      {
        type: 'unlock_content',
        parameters: { ability: 'master_manipulator', network_expansion: true }
      }
    ],
    celebrationText: 'PUPPET MASTER! You achieved your goals through pure social manipulation. People do your bidding without even realizing it.',
    rarity: 'rare'
  },
  {
    id: 'creative_solution',
    name: 'Creative Solution',
    description: 'Find an unexpected way to complete the mission',
    triggerCondition: 'alternative_completion_path',
    effects: [
      {
        type: 'bonus_rewards',
        parameters: { creativity_bonus: true, unique_reward: true }
      },
      {
        type: 'special_recognition',
        parameters: { title: 'Innovator', legend_status: true }
      }
    ],
    celebrationText: 'INNOVATIVE GENIUS! Your creative approach has become the stuff of legend. Other hackers will study your methods for years.',
    rarity: 'legendary'
  }
];

// Utility Functions
export const checkTwistTrigger = (twist: QuestTwist, questState: any, player: any): boolean => {
  const { type, parameters } = twist.triggerCondition;
  
  switch (type) {
    case 'progress_threshold':
      return questState.progress >= parameters.threshold;
    
    case 'time_elapsed':
      const elapsed = Date.now() - questState.startTime;
      return elapsed >= parameters.time;
    
    case 'player_action':
      return questState.lastAction === parameters.action;
    
    case 'random_chance':
      const minProgress = parameters.min_progress || 0;
      if (questState.progress < minProgress) return false;
      return Math.random() < parameters.chance;
    
    case 'skill_check':
      const skillLevel = player.skills?.[parameters.skill] || 0;
      const progressMet = questState.progress >= (parameters.progress_min || 0);
      return skillLevel >= parameters.threshold && progressMet;
    
    default:
      return false;
  }
};

export const checkCompletionMechanic = (mechanic: CompletionMechanic, questState: any): boolean => {
  switch (mechanic.triggerCondition) {
    case 'no_failures_and_optimal_time':
      return questState.failures === 0 && questState.completionTime <= questState.optimalTime;
    
    case 'completion_time_under_25_percent':
      return questState.completionTime <= (questState.estimatedTime * 0.25);
    
    case 'zero_detection_stealth_quest':
      return questState.questType === 'stealth' && questState.detectionCount === 0;
    
    case 'all_puzzles_solved_no_hints':
      return questState.puzzlesSolved === questState.totalPuzzles && questState.hintsUsed === 0;
    
    case 'social_only_completion':
      return questState.completionMethod === 'social_only';
    
    case 'alternative_completion_path':
      return questState.completionPath !== questState.intendedPath;
    
    default:
      return false;
  }
};

export const getRandomTwist = (rarity?: string): QuestTwist | null => {
  let availableTwists = questTwists;
  
  if (rarity) {
    availableTwists = questTwists.filter(twist => twist.rarity === rarity);
  }
  
  if (availableTwists.length === 0) return null;
  
  return availableTwists[Math.floor(Math.random() * availableTwists.length)];
};

export const getApplicableCompletionMechanics = (questState: any): CompletionMechanic[] => {
  return completionMechanics.filter(mechanic => 
    checkCompletionMechanic(mechanic, questState)
  );
};