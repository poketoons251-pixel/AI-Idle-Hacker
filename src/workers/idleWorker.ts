// Web Worker for handling idle progression calculations
// This runs in a separate thread to avoid blocking the main UI

interface IdleCalculationData {
  player: {
    level: number;
    experience: number;
    credits: number;
    energy: number;
    maxEnergy: number;
    skills: {
      hacking: number;
      stealth: number;
      networking: number;
      cryptography: number;
      socialEngineering: number;
    };
  };
  equipment: {
    laptop: { level: number; bonus: number };
    software: { level: number; bonus: number };
    hardware: { level: number; bonus: number };
    network: { level: number; bonus: number };
  };
  activeOperations: Array<{
    id: string;
    targetId: string;
    type: string;
    startTime: number;
    duration: number;
    baseReward: number;
  }>;
  lastUpdate: number;
}

interface IdleRewards {
  credits: number;
  experience: number;
  completedOperations: string[];
  energyRestored: number;
  timeOffline: number;
}

// Calculate experience required for next level
function getExperienceRequired(level: number): number {
  return Math.floor(100 * Math.pow(1.5, level - 1));
}

// Calculate energy regeneration rate (energy per second)
function getEnergyRegenRate(level: number, equipmentBonus: number): number {
  const baseRegen = 1.2; // Increased base regeneration
  const levelBonus = level * 0.12; // Improved level scaling
  const equipmentMultiplier = 1 + (equipmentBonus * 0.8); // Better equipment scaling
  return (baseRegen + levelBonus) * equipmentMultiplier;
}

// Calculate idle credit generation rate
function getIdleCreditRate(skills: any, equipmentBonus: number): number {
  const baseRate = 0.65; // Increased base rate for better progression
  const hackingBonus = skills.hacking * 0.12; // Enhanced hacking skill impact
  const networkingBonus = skills.networking * 0.08; // Networking skill bonus
  const stealthBonus = skills.stealth * 0.06; // Additional stealth bonus
  const equipmentMultiplier = 1 + (equipmentBonus * 0.6); // Equipment scaling
  
  return (baseRate + hackingBonus + networkingBonus + stealthBonus) * equipmentMultiplier;
}

// Calculate operation completion and rewards
function processOperations(
  operations: any[],
  currentTime: number,
  skills: any,
  equipmentBonus: number
): { completedOperations: string[]; totalRewards: { credits: number; experience: number } } {
  const completedOperations: string[] = [];
  let totalCredits = 0;
  let totalExperience = 0;

  operations.forEach(operation => {
    const elapsedTime = currentTime - operation.startTime;
    if (elapsedTime >= operation.duration) {
      // Operation completed
      completedOperations.push(operation.id);
      
      // Calculate rewards with enhanced bonuses
      const skillMultiplier = 1 + (skills[operation.type] || 0) * 0.15; // Increased skill impact
      const equipmentMultiplier = 1 + (equipmentBonus * 1.2); // Better equipment scaling
      const difficultyBonus = 1 + ((operation.difficulty || 1) * 0.25); // Difficulty rewards
      
      const totalMultiplier = skillMultiplier * equipmentMultiplier * difficultyBonus;
      const credits = Math.floor(operation.baseReward * totalMultiplier);
      const experience = Math.floor(operation.baseReward * 0.6 * skillMultiplier); // Increased XP rate
      
      totalCredits += credits;
      totalExperience += experience;
    }
  });

  return {
    completedOperations,
    totalRewards: { credits: totalCredits, experience: totalExperience }
  };
}

// Main idle calculation function
function calculateIdleRewards(data: IdleCalculationData): IdleRewards {
  const currentTime = Date.now();
  const timeOffline = Math.max(0, currentTime - data.lastUpdate) / 1000; // Convert to seconds
  
  // Cap offline time to prevent exploitation (max 24 hours)
  const cappedOfflineTime = Math.min(timeOffline, 24 * 60 * 60);
  
  // Calculate equipment bonuses with synergy effects
  const rawEquipmentBonus = (
    data.equipment.laptop.bonus +
    data.equipment.software.bonus +
    data.equipment.hardware.bonus +
    data.equipment.network.bonus
  ) / 100; // Convert percentage to decimal
  
  // Add synergy bonus for having multiple high-level equipment
  const equipmentLevels = [
    data.equipment.laptop.level,
    data.equipment.software.level,
    data.equipment.hardware.level,
    data.equipment.network.level
  ];
  const averageLevel = equipmentLevels.reduce((sum, level) => sum + level, 0) / 4;
  const synergyBonus = Math.min(0.5, averageLevel * 0.02); // Max 50% synergy bonus
  
  const equipmentBonus = rawEquipmentBonus * (1 + synergyBonus);
  
  // Process completed operations
  const operationResults = processOperations(
    data.activeOperations,
    currentTime,
    data.player.skills,
    equipmentBonus
  );
  
  // Calculate idle credit generation
  const idleCreditRate = getIdleCreditRate(data.player.skills, equipmentBonus);
  const idleCredits = Math.floor(idleCreditRate * cappedOfflineTime);
  
  // Calculate energy restoration
  const energyRegenRate = getEnergyRegenRate(data.player.level, equipmentBonus);
  const energyToRestore = Math.floor(energyRegenRate * cappedOfflineTime);
  const actualEnergyRestored = Math.min(
    energyToRestore,
    data.player.maxEnergy - data.player.energy
  );
  
  // Calculate total rewards
  const totalCredits = idleCredits + operationResults.totalRewards.credits;
  const totalExperience = operationResults.totalRewards.experience;
  
  return {
    credits: totalCredits,
    experience: totalExperience,
    completedOperations: operationResults.completedOperations,
    energyRestored: actualEnergyRestored,
    timeOffline: cappedOfflineTime
  };
}

// Handle messages from main thread
self.onmessage = function(e) {
  const { type, data } = e.data;
  
  switch (type) {
    case 'CALCULATE_IDLE_REWARDS':
      try {
        const rewards = calculateIdleRewards(data);
        self.postMessage({
          type: 'IDLE_REWARDS_CALCULATED',
          data: rewards
        });
      } catch (error) {
        self.postMessage({
          type: 'CALCULATION_ERROR',
          error: error.message
        });
      }
      break;
      
    case 'PING':
      self.postMessage({ type: 'PONG' });
      break;
      
    default:
      self.postMessage({
        type: 'UNKNOWN_MESSAGE_TYPE',
        error: `Unknown message type: ${type}`
      });
  }
};

// Export types for TypeScript (won't be used in worker context but helps with type checking)
export type { IdleCalculationData, IdleRewards };