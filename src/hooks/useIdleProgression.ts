import { useEffect, useRef, useCallback } from 'react';
import { useGameStore, Skills } from '../store/gameStore';

interface IdleRewards {
  credits: number;
  experience: number;
  completedOperations: string[];
  energyRestored: number;
  timeOffline: number;
}

export const useIdleProgression = () => {
  const workerRef = useRef<Worker | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const {
    player,
    equipment,
    operations,
    updatePlayer,
    completeOperation,
    addNotification,
    lastUpdate,
    setLastUpdate,
    aiConfig,
    aiActive,
    aiAnalytics,
    executeAIDecision,
    updateAIAnalytics
  } = useGameStore();

  // Filter active operations
  const activeOperations = operations.filter(op => op.status === 'active');

  // Initialize Web Worker
  const initWorker = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
    }

    try {
      // Create worker from inline script to avoid file path issues
      const workerScript = `
        // Web Worker for handling idle progression calculations
        function getExperienceRequired(level) {
          return Math.floor(100 * Math.pow(1.5, level - 1));
        }

        function getEnergyRegenRate(level, equipmentBonus) {
          const baseRegen = 1;
          const levelBonus = level * 0.1;
          return baseRegen + levelBonus + equipmentBonus;
        }

        function getIdleCreditRate(skills, equipmentBonus) {
          const baseRate = 0.5;
          const hackingSkill = skills?.hacking || 1;
          const networkSkill = skills?.network || 1;
          const skillBonus = (hackingSkill + networkSkill) * 0.1;
          return baseRate + skillBonus + equipmentBonus;
        }

        function processOperations(operations, currentTime, skills, equipmentBonus) {
          const completedOperations = [];
          let totalCredits = 0;
          let totalExperience = 0;

          operations.forEach(operation => {
              const elapsedTime = currentTime - operation.startTime;
              if (elapsedTime >= operation.duration) {
                completedOperations.push(operation.id);
                
                // Map operation types to skills
                const skillMap = {
                  'data_breach': skills?.hacking || 1,
                  'crypto_mining': skills?.hardware || 1,
                  'ddos': skills?.network || 1,
                  'social_engineering': skills?.social || 1
                };
                
                const relevantSkill = skillMap[operation.type] || 1;
                const skillMultiplier = 1 + relevantSkill * 0.1;
                const equipmentMultiplier = 1 + equipmentBonus;
                
                const baseReward = operation.baseReward || 50;
                const credits = Math.floor(baseReward * skillMultiplier * equipmentMultiplier);
                const experience = Math.floor(baseReward * 0.5 * skillMultiplier);
                
                totalCredits += credits;
                totalExperience += experience;
              }
            });

          return {
            completedOperations,
            totalRewards: { credits: totalCredits, experience: totalExperience }
          };
        }

        function calculateIdleRewards(data) {
          const currentTime = Date.now();
          const timeOffline = Math.max(0, currentTime - data.lastUpdate) / 1000;
          const cappedOfflineTime = Math.min(timeOffline, 24 * 60 * 60);
          
          const equipmentBonus = data.equipment.reduce((total, item) => total + item.bonus, 0) / 100;
          
          const operationResults = processOperations(
            data.activeOperations,
            currentTime,
            data.player.skills,
            equipmentBonus
          );
          
          const idleCreditRate = getIdleCreditRate(data.player.skills, equipmentBonus);
          const idleCredits = Math.floor(idleCreditRate * cappedOfflineTime);
          
          const energyRegenRate = getEnergyRegenRate(data.player.level, equipmentBonus);
          const energyToRestore = Math.floor(energyRegenRate * cappedOfflineTime);
          const actualEnergyRestored = Math.min(
            energyToRestore,
            data.player.maxEnergy - data.player.energy
          );
          
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
                error: 'Unknown message type: ' + type
              });
          }
        };
      `;

      const blob = new Blob([workerScript], { type: 'application/javascript' });
      const workerUrl = URL.createObjectURL(blob);
      workerRef.current = new Worker(workerUrl);

      // Handle worker messages
      workerRef.current.onmessage = (e) => {
        const { type, data, error } = e.data;

        switch (type) {
          case 'IDLE_REWARDS_CALCULATED':
            handleIdleRewards(data);
            break;

          case 'CALCULATION_ERROR':
            console.error('Worker calculation error:', error);
            addNotification('Error calculating idle rewards', 'error');
            break;

          case 'PONG':
            console.log('Worker is alive');
            break;

          default:
            console.warn('Unknown worker message type:', type);
        }
      };

      workerRef.current.onerror = (error) => {
        console.error('Worker error:', error);
        addNotification('Idle progression worker error', 'error');
      };

      // Clean up blob URL
      URL.revokeObjectURL(workerUrl);
    } catch (error) {
      console.error('Failed to initialize worker:', error);
      addNotification('Failed to initialize idle progression', 'error');
    }
  }, [addNotification]);

  // Handle idle rewards from worker
  const handleIdleRewards = useCallback((rewards: IdleRewards) => {
    if (!player) return; // Safety check
    
    const { credits, experience, completedOperations, energyRestored, timeOffline } = rewards;

    // Apply rewards
    if (credits > 0 || experience > 0 || energyRestored > 0) {
      updatePlayer({
        credits: player.credits + credits,
        experience: player.experience + experience,
        energy: Math.min(player.maxEnergy, player.energy + energyRestored)
      });

      // Show offline rewards notification if significant time passed and rewards are substantial
      if (timeOffline > 300 && (credits > 50 || experience > 25)) { // More than 5 minutes offline and meaningful rewards
        const timeString = timeOffline > 3600 
          ? `${Math.floor(timeOffline / 3600)}h ${Math.floor((timeOffline % 3600) / 60)}m`
          : `${Math.floor(timeOffline / 60)}m`;
        
        addNotification(
          `Welcome back! Offline for ${timeString}. Earned ${credits} credits, ${experience} XP, restored ${energyRestored} energy.`,
          'success'
        );
      }
    }

    // Complete operations
    completedOperations.forEach(operationId => {
      completeOperation(operationId);
    });

    // Update last update timestamp
    setLastUpdate(Date.now());
  }, [player, updatePlayer, completeOperation, addNotification, setLastUpdate]);

  // Calculate idle rewards
  const calculateIdleRewards = useCallback(() => {
    // Debug logging
    console.debug('calculateIdleRewards called:', { player, equipment, workerExists: !!workerRef.current });
    
    // Comprehensive safety checks
    if (!workerRef.current || 
        !player || 
        !equipment || 
        typeof player.level !== 'number' || 
        !player.skills || 
        typeof player.skills !== 'object' ||
        !Array.isArray(equipment)) {
      console.debug('Safety check failed, returning early');
      return;
    }

    const data = {
      player: {
        level: player.level,
        experience: player.experience,
        credits: player.credits,
        energy: player.energy,
        maxEnergy: player.maxEnergy,
        skills: player.skills
      },
      equipment: equipment.filter(item => item.equipped).map(item => ({
        type: item.type,
        level: item.level,
        bonus: item.bonus
      })),
      activeOperations: activeOperations.map(op => ({
        id: op.id,
        targetId: op.targetId,
        type: op.type,
        startTime: op.startTime,
        duration: op.duration,
        baseReward: op.baseReward
      })),
      lastUpdate
    };

    workerRef.current.postMessage({
      type: 'CALCULATE_IDLE_REWARDS',
      data
    });
  }, [player, equipment, activeOperations, lastUpdate]);

  // Helper functions for calculating action efficiency
  const calculateHackingEfficiency = useCallback(() => {
    const playerLevel = Math.floor(player.experience / 1000);
    const baseEfficiency = 0.78; // Increased base efficiency
    const skillBonus = (player.skills?.hacking || 1) * 0.025; // Enhanced skill impact
    const levelBonus = playerLevel * 0.012; // Better level scaling
    const equipmentBonus = equipment.reduce((total, item) => total + (item.equipped ? item.level * 0.008 : 0), 0);
    return Math.min(0.92, baseEfficiency + skillBonus + levelBonus + equipmentBonus);
  }, [player, equipment]);

  const calculateOperationEfficiency = useCallback(() => {
    const playerLevel = Math.floor(player.experience / 1000);
    const baseEfficiency = 0.82; // Increased base efficiency
    const skillBonus = (player.skills?.hacking || 1) * 0.018; // Enhanced skill impact
    const networkingBonus = (player.skills?.hardware || 1) * 0.012; // Additional hardware bonus
    const levelBonus = playerLevel * 0.01; // Improved level scaling
    return Math.min(0.94, baseEfficiency + skillBonus + networkingBonus + levelBonus);
  }, [player]);

  const calculateEquipmentEfficiency = useCallback(() => {
    const totalBonus = equipment.reduce((total, item) => total + (item.equipped ? item.bonus : 0), 0);
    const averageLevel = equipment.reduce((total, item) => total + (item.equipped ? item.level : 0), 0) / Math.max(1, equipment.filter(item => item.equipped).length);
    const baseEfficiency = 0.68; // Increased base efficiency
    const bonusEfficiency = totalBonus / 800; // Better scaling
    const levelEfficiency = averageLevel * 0.015; // Level-based efficiency
    return Math.min(0.88, baseEfficiency + bonusEfficiency + levelEfficiency);
  }, [equipment]);

  const calculateSkillEfficiency = useCallback(() => {
    const skills = player.skills || {} as Skills;
    const totalSkills = Object.values(skills).reduce((sum: number, skill: number) => sum + (skill || 0), 0);
    const skillVariety = Object.keys(skills).length;
    const baseEfficiency = 0.72; // Increased base efficiency
    const skillBonus = totalSkills * 0.012; // Better skill scaling
    const varietyBonus = skillVariety * 0.02; // Bonus for skill diversity
    return Math.min(0.85, baseEfficiency + skillBonus + varietyBonus);
  }, [player]);

  // AI Decision Making Engine
  const executeAIDecisions = useCallback(async () => {
    if (!aiActive || !player) return;

    try {
      // Check if enough time has passed since last AI decision
      const now = Date.now();
      const timeSinceLastDecision = now - (aiAnalytics.lastDecisionTime || 0);
      const decisionInterval = 10000; // 10 seconds between AI decisions

      if (timeSinceLastDecision < decisionInterval) return;

      // Enhanced AI Decision Logic with balance optimization
      const hackingEfficiency = calculateHackingEfficiency();
      const operationEfficiency = calculateOperationEfficiency();
      const equipmentEfficiency = calculateEquipmentEfficiency();
      const skillEfficiency = calculateSkillEfficiency();
      
      // Calculate AI skill level based on experience
      const aiSkillLevel = Math.floor(player.experience / 1000);
      const currentEfficiency = Math.min(0.95, hackingEfficiency + (aiSkillLevel * 0.01));
      
      const availableOperations = operations.filter(op => op.status === 'available');
      const activeOperationsCount = operations.filter(op => op.status === 'active').length;
      
      // Decide what action to take based on priorities and current state with improved efficiency
      let decision = null;

      // 1. Check if we should execute a hacking technique (enhanced with balance optimization)
      if (player.energy >= 15 && aiConfig.priorities.operations > 0.4) {
        try {
          const response = await fetch('/api/hacking/techniques');
          if (response.ok) {
            const data = await response.json();
            const availableTechniques = data.techniques?.filter((technique: any) => 
              technique.required_level <= player.level &&
              player.energy >= technique.energy_cost
            ) || [];
            
            if (availableTechniques.length > 0) {
              // Enhanced technique selection with balance optimization
              const bestTechnique = availableTechniques
                .map((technique: any) => {
                  // Apply skill bonuses with optimized balance parameters
                  const skillBonus = (player.skills.hacking || 1) * 0.035; // Updated from balance config
                  const equipmentBonus = equipment.reduce((total, item) => total + (item.equipped ? item.level * 0.5 : 0), 0);
                  const effectiveSuccessRate = Math.min(95, technique.base_success_rate + (skillBonus + equipmentBonus) * 100);
                  
                  // Calculate expected value with risk tolerance
                  const expectedValue = effectiveSuccessRate * technique.base_reward / 100;
                  const riskAdjustedScore = (effectiveSuccessRate * aiConfig.riskTolerance) + (expectedValue * (1 - aiConfig.riskTolerance)) / 100;
                  const efficiency = riskAdjustedScore / technique.energy_cost * currentEfficiency;
                  
                  return { ...technique, calculatedEfficiency: efficiency, effectiveSuccessRate };
                })
                .filter((technique: any) => technique.effectiveSuccessRate >= (aiConfig.riskTolerance * 100))
                .sort((a: any, b: any) => b.calculatedEfficiency - a.calculatedEfficiency)[0];
              
              if (bestTechnique) {
                decision = {
                  type: 'execute_hack',
                  techniqueId: bestTechnique.id,
                  targetInfo: 'ai_automated_target',
                  reason: `Executing ${bestTechnique.name} (Efficiency: ${bestTechnique.calculatedEfficiency.toFixed(2)}, Success Rate: ${Math.round(bestTechnique.effectiveSuccessRate)}%)`
                };
              }
            }
          }
        } catch (error) {
          console.error('Failed to fetch hacking techniques for AI:', error);
        }
      }

      // 2. Check if we should start an operation (fallback if no hacking techniques)
      if (!decision && activeOperationsCount < 3 && availableOperations.length > 0 && player.energy >= 20) {
        const bestOperation = availableOperations
          .filter(op => {
            const energyCost = op.energyCost || 20;
            const successRate = calculateOperationSuccessRate(op, player);
            return player.energy >= energyCost && successRate >= (aiConfig.riskTolerance * 100);
          })
          .sort((a, b) => {
            const scoreA = calculateOperationScore(a, player, aiConfig);
            const scoreB = calculateOperationScore(b, player, aiConfig);
            return scoreB - scoreA;
          })[0];

        if (bestOperation) {
          decision = {
            type: 'start_operation',
            operationId: bestOperation.id,
            reason: `Starting ${bestOperation.name} (Score: ${calculateOperationScore(bestOperation, player, aiConfig).toFixed(1)})`
          };
        }
      }

      // 3. Check if we should upgrade equipment
      if (!decision && player.credits >= 1000 && aiConfig.priorities.equipment > 0.3) {
        const upgradeableEquipment = equipment.filter(item => 
          item.equipped && item.level < 10 && player.credits >= (item.upgradeCost || 1000)
        );
        
        if (upgradeableEquipment.length > 0) {
          const bestEquipment = upgradeableEquipment
            .sort((a, b) => (b.bonus / (b.upgradeCost || 1000)) - (a.bonus / (a.upgradeCost || 1000)))[0];
          
          decision = {
            type: 'upgrade_equipment',
            equipmentId: bestEquipment.id,
            reason: `Upgrading ${bestEquipment.name} for better efficiency`
          };
        }
      }

      // 4. Check if we should allocate skill points
      if (!decision && player.skillPoints > 0 && aiConfig.priorities.skills > 0.2) {
        const skillPriorities = {
          hacking: aiConfig.priorities.operations * 0.4,
          network: aiConfig.priorities.operations * 0.3,
          hardware: aiConfig.priorities.equipment * 0.3,
          social: aiConfig.priorities.operations * 0.2
        };

        const bestSkill = Object.entries(skillPriorities)
          .sort(([,a], [,b]) => b - a)[0][0] as keyof typeof player.skills;

        decision = {
          type: 'allocate_skill',
          skill: bestSkill,
          points: Math.min(player.skillPoints, 3),
          reason: `Allocating skill points to ${bestSkill} for better performance`
        };
      }

      // Execute the decision
      if (decision) {
        executeAIDecision(decision);
        
        // Update analytics
        updateAIAnalytics({
          decisionsCount: aiAnalytics.decisionsCount + 1,
          lastDecisionTime: now,
          creditsEarned: decision.type === 'start_operation' ? aiAnalytics.creditsEarned : aiAnalytics.creditsEarned,
          operationsCompleted: decision.type === 'start_operation' ? aiAnalytics.operationsCompleted : aiAnalytics.operationsCompleted
        });

        console.log('AI Decision:', decision);
      }
    } catch (error) {
      console.error('AI Decision Error:', error);
      addNotification('AI decision-making error', 'error');
    }
  }, [aiActive, aiConfig, aiAnalytics, player, operations, equipment, executeAIDecision, updateAIAnalytics, addNotification]);

  // Helper function to calculate operation success rate
  const calculateOperationSuccessRate = (operation: any, player: any): number => {
    const skillMap: Record<string, keyof typeof player.skills> = {
      'data_breach': 'hacking',
      'crypto_mining': 'hardware', 
      'ddos': 'network',
      'social_engineering': 'social'
    };
    
    const relevantSkill = player.skills[skillMap[operation.type]] || 1;
    const baseRate = 65; // Increased base success rate
    const skillBonus = relevantSkill * 6; // Increased to 6% per skill level
    const difficultyPenalty = (operation.difficulty || 1) * 8; // Reduced penalty to 8%
    const playerLevelBonus = Math.floor(player.experience / 1000) * 2; // Level bonus
    
    return Math.max(15, Math.min(95, baseRate + skillBonus + playerLevelBonus - difficultyPenalty));
  };

  // Helper function to calculate operation score for AI decision making
  const calculateOperationScore = (operation: any, player: any, aiConfig: any): number => {
    const successRate = calculateOperationSuccessRate(operation, player) / 100;
    const reward = operation.baseReward || 50;
    const energyCost = operation.energyCost || 20;
    const duration = operation.duration || 30000;
    
    // Calculate efficiency (reward per energy per second)
    const efficiency = (reward * successRate) / (energyCost * (duration / 1000));
    
    // Apply AI priorities
    const priorityMultiplier = aiConfig.priorities.operations;
    const riskAdjustment = aiConfig.riskTolerance * successRate + (1 - aiConfig.riskTolerance) * 0.5;
    
    return efficiency * priorityMultiplier * riskAdjustment;
  };

  // Start idle progression interval
  const startIdleProgression = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Calculate idle rewards and execute AI decisions every 5 seconds
    intervalRef.current = setInterval(() => {
      calculateIdleRewards();
      executeAIDecisions();
    }, 5000);

    // Calculate immediately on start
    calculateIdleRewards();
    executeAIDecisions();
  }, [calculateIdleRewards, executeAIDecisions]);

  // Stop idle progression
  const stopIdleProgression = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    initWorker();
    startIdleProgression();

    // Handle page visibility changes
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopIdleProgression();
      } else {
        calculateIdleRewards(); // Calculate rewards when returning
        startIdleProgression();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup on unmount
    return () => {
      stopIdleProgression();
      if (workerRef.current) {
        workerRef.current.terminate();
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [initWorker, startIdleProgression, stopIdleProgression, calculateIdleRewards]);

  return {
    calculateIdleRewards,
    startIdleProgression,
    stopIdleProgression
  };
};