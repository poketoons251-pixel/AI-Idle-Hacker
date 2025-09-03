// Phase 4 Balance Configuration
// Optimized progression rates for episodic campaigns, AI personalities, and hacking techniques

export interface BalanceConfig {
  // Hacking Techniques Balance
  hackingTechniques: {
    baseSuccessRates: Record<string, number>;
    skillBonusMultipliers: {
      perLevelAbove: number;
      perLevelBelow: number;
    };
    difficultyScaling: {
      experienceMultiplier: number;
      creditMultiplier: number;
      reputationBase: number;
    };
    executionTimeVariance: number;
  };
  
  // Episodic Campaigns Balance
  episodicCampaigns: {
    progressionRates: {
      experiencePerEpisode: Record<number, number>; // difficulty -> base XP
      creditRewards: Record<number, number>; // difficulty -> base credits
      unlockRequirements: {
        levelGating: boolean;
        skillRequirements: boolean;
        timeGating: boolean;
      };
    };
    deliverySchedule: {
      baseInterval: number; // hours between episodes
      difficultyModifier: number; // multiplier based on difficulty
      playerLevelBonus: number; // reduction per player level
    };
  };
  
  // AI Personalities Balance
  aiPersonalities: {
    relationshipProgression: {
      trustGainRate: number;
      respectGainRate: number;
      intimacyGainRate: number;
      conflictDecayRate: number;
    };
    evolutionRequirements: {
      experienceThresholds: Record<string, number>;
      relationshipThresholds: Record<string, number>;
      timeRequirements: Record<string, number>; // hours
    };
    skillBonuses: {
      analytical: Record<string, number>;
      charismatic: Record<string, number>;
      paranoid: Record<string, number>;
    };
  };
  
  // Idle Optimization Balance
  idleOptimization: {
    autoplayEfficiency: {
      baseEfficiency: number;
      skillLearningRate: number;
      decisionAccuracy: number;
    };
    resourceManagement: {
      energyConsumption: number;
      resourceAllocation: Record<string, number>;
    };
  };
}

// Optimized balance configuration for Phase 4
export const balanceConfig: BalanceConfig = {
  hackingTechniques: {
    baseSuccessRates: {
      'Brute Force Attack': 0.72, // Slightly reduced for better balance
      'SQL Injection': 0.68, // Increased for better early game
      'Social Engineering': 0.74, // Increased for charismatic builds
      'Man-in-the-Middle Attack': 0.65, // Increased from 0.60
      'Network Jamming': 0.78, // Slightly reduced from 0.80
      'Zero-Day Exploit': 0.82 // Reduced from 0.85 for balance
    },
    skillBonusMultipliers: {
      perLevelAbove: 0.035, // Optimized for smoother progression
      perLevelBelow: -0.06 // Reduced penalty for better accessibility
    },
    difficultyScaling: {
      experienceMultiplier: 2.1, // Increased for faster progression
      creditMultiplier: 3.8, // Balanced for sustainable economy
      reputationBase: 1.4 // Enhanced reputation rewards
    },
    executionTimeVariance: 0.12 // Further reduced for consistency
  },
  
  episodicCampaigns: {
    progressionRates: {
      experiencePerEpisode: {
        1: 450, // Increased for better early progression
        2: 720, // Improved medium difficulty rewards
        3: 1050, // Enhanced hard episode rewards
        4: 1400, // Better expert progression
        5: 1850 // Increased master rewards
      },
      creditRewards: {
        1: 950, // Increased early game credits
        2: 1500, // Better medium rewards
        3: 2100, // Enhanced hard rewards
        4: 2800, // Improved expert rewards
        5: 3700 // Better master rewards
      },
      unlockRequirements: {
        levelGating: true,
        skillRequirements: true,
        timeGating: false // Disabled for better flow
      }
    },
    deliverySchedule: {
      baseInterval: 3.5, // Reduced to 3.5 hours for better engagement
      difficultyModifier: 1.25, // Reduced to 25% for smoother progression
      playerLevelBonus: 0.08 // Increased to 8% faster per level
    }
  },
  
  aiPersonalities: {
    relationshipProgression: {
      trustGainRate: 1.4, // Further increased for better engagement
      respectGainRate: 1.2, // Increased from 1.0
      intimacyGainRate: 0.9, // Slightly increased for better flow
      conflictDecayRate: 1.1 // Enhanced conflict resolution
    },
    evolutionRequirements: {
      experienceThresholds: {
        'stage_2': 2500,
        'stage_3': 6000,
        'stage_4': 12000,
        'stage_5': 25000
      },
      relationshipThresholds: {
        'trust': 60,
        'respect': 50,
        'intimacy': 40
      },
      timeRequirements: {
        'stage_2': 24, // 1 day
        'stage_3': 72, // 3 days
        'stage_4': 168, // 1 week
        'stage_5': 336 // 2 weeks
      }
    },
    skillBonuses: {
      analytical: {
        'hacking': 0.18, // Increased from 0.15
        'cryptography': 0.15,
        'reverse_engineering': 0.12
      },
      charismatic: {
        'social_engineering': 0.20,
        'communication': 0.15,
        'psychology': 0.12
      },
      paranoid: {
        'network_security': 0.15,
        'stealth': 0.18,
        'counter_surveillance': 0.20
      }
    }
  },
  
  idleOptimization: {
    autoplayEfficiency: {
      baseEfficiency: 0.82, // Increased to 82% for better idle experience
      skillLearningRate: 0.025, // Increased to 2.5% for faster learning
      decisionAccuracy: 0.88 // Improved to 88% accuracy
    },
    resourceManagement: {
      energyConsumption: 0.75, // Increased to 25% energy savings
      resourceAllocation: {
        'hacking': 0.32, // Slightly reduced for balance
        'skills': 0.28, // Increased skill focus
        'equipment': 0.22, // Increased equipment priority
        'research': 0.13, // Slightly reduced
        'social': 0.05 // Maintained social allocation
      }
    }
  }
};

// Dynamic balance adjustments based on player behavior
export class BalanceManager {
  private static instance: BalanceManager;
  private adjustments: Partial<BalanceConfig> = {};
  
  static getInstance(): BalanceManager {
    if (!BalanceManager.instance) {
      BalanceManager.instance = new BalanceManager();
    }
    return BalanceManager.instance;
  }
  
  // Adjust hacking success rates based on player performance
  adjustHackingDifficulty(technique: string, playerSuccessRate: number): number {
    const baseRate = balanceConfig.hackingTechniques.baseSuccessRates[technique] || 0.5;
    
    // If player is succeeding too much (>90%), slightly increase difficulty
    if (playerSuccessRate > 0.9) {
      return Math.max(0.1, baseRate - 0.05);
    }
    
    // If player is failing too much (<30%), slightly decrease difficulty
    if (playerSuccessRate < 0.3) {
      return Math.min(0.95, baseRate + 0.05);
    }
    
    return baseRate;
  }
  
  // Adjust episode delivery timing based on engagement
  adjustEpisodeDelivery(campaignId: string, playerEngagement: number): number {
    const baseInterval = balanceConfig.episodicCampaigns.deliverySchedule.baseInterval;
    
    // High engagement (>0.8) = faster delivery
    if (playerEngagement > 0.8) {
      return baseInterval * 0.8;
    }
    
    // Low engagement (<0.4) = slower delivery to avoid overwhelming
    if (playerEngagement < 0.4) {
      return baseInterval * 1.3;
    }
    
    return baseInterval;
  }
  
  // Calculate AI personality evolution speed based on interaction frequency
  calculateEvolutionSpeed(personalityType: string, interactionFrequency: number): number {
    const baseRequirement = balanceConfig.aiPersonalities.evolutionRequirements.experienceThresholds['stage_2'];
    
    // More interactions = faster evolution (up to 50% faster)
    const speedMultiplier = Math.min(1.5, 1 + (interactionFrequency * 0.5));
    
    return baseRequirement / speedMultiplier;
  }
}

// Export utility functions for balance calculations
export const BalanceUtils = {
  // Calculate effective success rate with all modifiers
  calculateEffectiveSuccessRate: (
    baseTechnique: string,
    playerSkills: Record<string, number>,
    equipmentBonuses: Record<string, number> = {},
    personalityBonuses: Record<string, number> = {}
  ): number => {
    const config = balanceConfig.hackingTechniques;
    let successRate = config.baseSuccessRates[baseTechnique] || 0.5;
    
    // Apply skill bonuses (simplified - would need technique requirements)
    Object.entries(playerSkills).forEach(([skill, level]) => {
      successRate += level * 0.01; // 1% per skill level
    });
    
    // Apply equipment bonuses
    Object.values(equipmentBonuses).forEach(bonus => {
      successRate += bonus;
    });
    
    // Apply personality bonuses
    Object.values(personalityBonuses).forEach(bonus => {
      successRate += bonus;
    });
    
    return Math.max(0.05, Math.min(0.95, successRate));
  },
  
  // Calculate episode rewards with difficulty scaling
  calculateEpisodeRewards: (difficulty: number, playerLevel: number): { xp: number; credits: number } => {
    const config = balanceConfig.episodicCampaigns.progressionRates;
    const baseXp = config.experiencePerEpisode[difficulty] || 500;
    const baseCredits = config.creditRewards[difficulty] || 1000;
    
    // Small level bonus (5% per level up to 50% max)
    const levelBonus = Math.min(0.5, playerLevel * 0.05);
    
    return {
      xp: Math.round(baseXp * (1 + levelBonus)),
      credits: Math.round(baseCredits * (1 + levelBonus))
    };
  },
  
  // Calculate AI autoplay efficiency
  calculateAutoplayEfficiency: (aiLevel: number, playerSkills: Record<string, number>): number => {
    const config = balanceConfig.idleOptimization.autoplayEfficiency;
    let efficiency = config.baseEfficiency;
    
    // AI level bonus (2% per level)
    efficiency += aiLevel * 0.02;
    
    // Player skill average bonus
    const avgSkill = Object.values(playerSkills).reduce((a, b) => a + b, 0) / Object.keys(playerSkills).length;
    efficiency += avgSkill * 0.01;
    
    return Math.min(0.95, efficiency);
  }
};