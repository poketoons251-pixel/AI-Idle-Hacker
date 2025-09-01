// @ts-nocheck
/* eslint-disable semi */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
  type: 'operation' | 'upgrade' | 'skill' | 'resource' | 'start_operation' | 'upgrade_equipment' | 'allocate_skill' | 'emergency_override';
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

      executeAIDecision: (decision) => {
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