import { QuestReward } from '../store/gameStore';

export interface RewardCalculationContext {
  playerLevel: number;
  questDifficulty: number;
  playerReputation: number;
  completionTime?: number;
  choicesMade?: string[];
  skillLevels?: Record<string, number>;
}

export interface CalculatedReward extends QuestReward {
  originalAmount: number;
  finalAmount: number;
  bonusMultiplier: number;
  bonusReasons: string[];
}

/**
 * Calculate the final reward amount based on scaling factors and conditions
 */
export function calculateReward(
  reward: QuestReward,
  context: RewardCalculationContext
): CalculatedReward {
  const originalAmount = reward.amount;
  let finalAmount = originalAmount;
  let bonusMultiplier = 1;
  const bonusReasons: string[] = [];

  // Apply scaling factor based on player level
  if (reward.scalingFactor && reward.scalingFactor > 1) {
    const levelBonus = Math.pow(reward.scalingFactor, context.playerLevel - 1);
    bonusMultiplier *= levelBonus;
    bonusReasons.push(`Level scaling (${reward.scalingFactor}x per level)`);
  }

  // Apply difficulty bonus for credits and experience
  if (['credits', 'experience'].includes(reward.type)) {
    const difficultyBonus = 1 + (context.questDifficulty - 1) * 0.2;
    bonusMultiplier *= difficultyBonus;
    bonusReasons.push(`Difficulty bonus (${Math.round((difficultyBonus - 1) * 100)}%)`);
  }

  // Apply reputation bonus for high-reputation players
  if (context.playerReputation >= 100) {
    const repBonus = 1 + Math.min(context.playerReputation / 1000, 0.5);
    bonusMultiplier *= repBonus;
    bonusReasons.push(`Reputation bonus (${Math.round((repBonus - 1) * 100)}%)`);
  }

  // Apply conditional bonuses
  if (reward.conditional && reward.conditions) {
    const conditionMet = evaluateConditions(reward.conditions, context);
    if (conditionMet.met) {
      bonusMultiplier *= conditionMet.multiplier;
      bonusReasons.push(conditionMet.reason);
    }
  }

  // Apply completion time bonus for time-sensitive rewards
  if (context.completionTime && reward.type === 'experience') {
    const timeBonus = calculateTimeBonus(context.completionTime);
    if (timeBonus > 1) {
      bonusMultiplier *= timeBonus;
      bonusReasons.push(`Speed bonus (${Math.round((timeBonus - 1) * 100)}%)`);
    }
  }

  finalAmount = Math.round(originalAmount * bonusMultiplier);

  return {
    ...reward,
    originalAmount,
    finalAmount,
    bonusMultiplier,
    bonusReasons,
    amount: finalAmount
  };
}

/**
 * Evaluate conditional reward requirements
 */
function evaluateConditions(
  conditions: any,
  context: RewardCalculationContext
): { met: boolean; multiplier: number; reason: string } {
  // Example condition evaluations
  if (conditions.skillRequirement) {
    const { skill, level } = conditions.skillRequirement;
    const playerSkillLevel = context.skillLevels?.[skill] || 1;
    if (playerSkillLevel >= level) {
      return {
        met: true,
        multiplier: 1.5,
        reason: `${skill} skill bonus (level ${playerSkillLevel})`
      };
    }
  }

  if (conditions.reputationThreshold) {
    if (context.playerReputation >= conditions.reputationThreshold) {
      return {
        met: true,
        multiplier: 1.3,
        reason: `High reputation bonus`
      };
    }
  }

  if (conditions.choiceBonus && context.choicesMade) {
    const hasRequiredChoice = context.choicesMade.some(choice => 
      conditions.choiceBonus.choices.includes(choice)
    );
    if (hasRequiredChoice) {
      return {
        met: true,
        multiplier: conditions.choiceBonus.multiplier || 1.2,
        reason: `Choice bonus: ${conditions.choiceBonus.description}`
      };
    }
  }

  return { met: false, multiplier: 1, reason: '' };
}

/**
 * Calculate time-based completion bonus
 */
function calculateTimeBonus(completionTimeMs: number): number {
  const completionTimeMinutes = completionTimeMs / (1000 * 60);
  
  // Bonus for completing within certain time thresholds
  if (completionTimeMinutes <= 5) {
    return 1.5; // 50% bonus for very fast completion
  } else if (completionTimeMinutes <= 15) {
    return 1.3; // 30% bonus for fast completion
  } else if (completionTimeMinutes <= 30) {
    return 1.1; // 10% bonus for moderate completion
  }
  
  return 1; // No bonus for slow completion
}

/**
 * Generate reward preview text for UI display
 */
export function generateRewardPreview(
  rewards: QuestReward[],
  context: RewardCalculationContext
): string[] {
  return rewards.map(reward => {
    const calculated = calculateReward(reward, context);
    
    if (calculated.bonusMultiplier > 1) {
      return `${calculated.finalAmount} ${reward.type} (${calculated.originalAmount} base + ${Math.round((calculated.bonusMultiplier - 1) * 100)}% bonus)`;
    }
    
    return `${calculated.finalAmount} ${reward.type}`;
  });
}

/**
 * Calculate total reward value for comparison purposes
 */
export function calculateTotalRewardValue(
  rewards: QuestReward[],
  context: RewardCalculationContext
): number {
  return rewards.reduce((total, reward) => {
    const calculated = calculateReward(reward, context);
    
    // Assign relative values to different reward types
    const typeValues = {
      credits: 1,
      experience: 2,
      reputation: 3,
      skill_points: 5,
      equipment: 10,
      ability: 15,
      story_unlock: 8,
      achievement: 12,
      cosmetic: 5,
      title: 10,
      access_unlock: 20
    };
    
    const typeValue = typeValues[reward.type as keyof typeof typeValues] || 1;
    return total + (calculated.finalAmount * typeValue);
  }, 0);
}

/**
 * Generate achievement-style reward notifications
 */
export function generateRewardNotification(reward: CalculatedReward): string {
  const baseMessage = `Earned ${reward.finalAmount} ${reward.type.replace('_', ' ')}`;
  
  if (reward.bonusMultiplier > 1) {
    const bonusPercent = Math.round((reward.bonusMultiplier - 1) * 100);
    return `${baseMessage} (+${bonusPercent}% bonus!)`;
  }
  
  return baseMessage;
}