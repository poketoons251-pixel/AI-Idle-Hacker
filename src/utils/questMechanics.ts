import { Player, Quest, QuestObjective } from '../store/gameStore';

// Quest Mechanic Interface
export interface QuestMechanic {
  type: string;
  parameters?: Record<string, any>;
}

// Quest Mechanics Engine
export interface MechanicState {
  id: string;
  type: string;
  active: boolean;
  progress: number;
  maxProgress: number;
  startTime?: number;
  endTime?: number;
  parameters: Record<string, any>;
  status: 'pending' | 'active' | 'completed' | 'failed';
}

export interface QuestMechanicsEngine {
  mechanics: Map<string, MechanicState>;
  questId: string;
  player: Player;
  startTime: number;
}

// Mechanic Handlers
export class QuestMechanicsHandler {
  private engines: Map<string, QuestMechanicsEngine> = new Map();

  initializeQuest(questId: string, mechanics: QuestMechanic[], player: Player): QuestMechanicsEngine {
    const engine: QuestMechanicsEngine = {
      mechanics: new Map(),
      questId,
      player,
      startTime: Date.now()
    };

    // Add null/undefined check for mechanics array
    if (mechanics && Array.isArray(mechanics)) {
      mechanics.forEach((mechanic, index) => {
      const mechanicState: MechanicState = {
        id: `${questId}_mechanic_${index}`,
        type: mechanic.type,
        active: index === 0, // First mechanic starts active
        progress: 0,
        maxProgress: this.calculateMaxProgress(mechanic),
        parameters: mechanic.parameters || {},
        status: index === 0 ? 'active' : 'pending'
      };
      
      engine.mechanics.set(mechanicState.id, mechanicState);
      });
    }

    this.engines.set(questId, engine);
    return engine;
  }

  updateMechanic(questId: string, mechanicId: string, progressDelta: number): MechanicUpdateResult {
    const engine = this.engines.get(questId);
    if (!engine) {
      return { success: false, error: 'Quest engine not found' };
    }

    const mechanic = engine.mechanics.get(mechanicId);
    if (!mechanic || !mechanic.active) {
      return { success: false, error: 'Mechanic not active' };
    }

    // Apply mechanic-specific logic
    const result = this.processMechanicUpdate(mechanic, progressDelta, engine);
    
    if (result.success && mechanic.progress >= mechanic.maxProgress) {
      mechanic.status = 'completed';
      mechanic.active = false;
      
      // Activate next mechanic
      this.activateNextMechanic(engine, mechanicId);
    }

    return result;
  }

  private processMechanicUpdate(mechanic: MechanicState, progressDelta: number, engine: QuestMechanicsEngine): MechanicUpdateResult {
    switch (mechanic.type) {
      case 'timer':
        return this.processTimerMechanic(mechanic, progressDelta, engine);
      case 'resource_management':
        return this.processResourceMechanic(mechanic, progressDelta, engine);
      case 'puzzle':
        return this.processPuzzleMechanic(mechanic, progressDelta, engine);
      case 'stealth':
        return this.processStealthMechanic(mechanic, progressDelta, engine);
      case 'combat':
        return this.processCombatMechanic(mechanic, progressDelta, engine);
      case 'social':
        return this.processSocialMechanic(mechanic, progressDelta, engine);
      case 'exploration':
        return this.processExplorationMechanic(mechanic, progressDelta, engine);
      case 'crafting':
        return this.processCraftingMechanic(mechanic, progressDelta, engine);
      case 'investigation':
        return this.processInvestigationMechanic(mechanic, progressDelta, engine);
      case 'hacking':
        return this.processHackingMechanic(mechanic, progressDelta, engine);
      default:
        return this.processGenericMechanic(mechanic, progressDelta);
    }
  }

  private processTimerMechanic(mechanic: MechanicState, progressDelta: number, engine: QuestMechanicsEngine): MechanicUpdateResult {
    const timeLimit = mechanic.parameters.timeLimit || 1800000; // 30 minutes default
    const elapsed = Date.now() - (mechanic.startTime || engine.startTime);
    
    if (elapsed >= timeLimit) {
      mechanic.status = 'failed';
      return { success: false, error: 'Time limit exceeded', mechanicFailed: true };
    }
    
    mechanic.progress = Math.min(elapsed, timeLimit);
    mechanic.maxProgress = timeLimit;
    
    return { 
      success: true, 
      timeRemaining: timeLimit - elapsed,
      progressPercentage: (mechanic.progress / mechanic.maxProgress) * 100
    };
  }

  private processResourceMechanic(mechanic: MechanicState, progressDelta: number, engine: QuestMechanicsEngine): MechanicUpdateResult {
    const energyCost = mechanic.parameters.energyCost || 0;
    const toolsRequired = mechanic.parameters.toolsRequired || [];
    
    // Check if player has required resources
    if (engine.player.energy < energyCost) {
      return { success: false, error: 'Insufficient energy' };
    }
    
    // Check for required tools (simplified - assume player has basic tools)
    const hasTools = true; // Simplified for now - would need equipment system
    
    if (!hasTools) {
      return { success: false, error: 'Missing required tools' };
    }
    
    mechanic.progress += progressDelta;
    return { success: true, resourcesConsumed: { energy: energyCost } };
  }

  private processPuzzleMechanic(mechanic: MechanicState, progressDelta: number, engine: QuestMechanicsEngine): MechanicUpdateResult {
    const complexity = mechanic.parameters.puzzleComplexity || 'medium';
    const timePerPuzzle = mechanic.parameters.timePerPuzzle || 300000;
    
    // Simulate puzzle solving based on player intelligence/hacking skill
    const playerSkill = engine.player.skills?.hacking || 1;
    const difficultyMultiplier = {
      'easy': 0.5,
      'medium': 1.0,
      'hard': 1.5,
      'expert': 2.0
    }[complexity] || 1.0;
    
    const solveChance = Math.min(0.9, playerSkill / (10 * difficultyMultiplier));
    const success = Math.random() < solveChance;
    
    if (success) {
      mechanic.progress += progressDelta;
      return { success: true, puzzleSolved: true };
    } else {
      return { success: false, error: 'Puzzle solving failed', retryAllowed: true };
    }
  }

  private processStealthMechanic(mechanic: MechanicState, progressDelta: number, engine: QuestMechanicsEngine): MechanicUpdateResult {
    const detectionThreshold = mechanic.parameters.detectionThreshold || 75;
    const stealthSkill = engine.player.skills?.stealth || 1;
    
    // Calculate detection risk
    const baseDetectionRisk = 30;
    const skillReduction = stealthSkill * 5;
    const currentRisk = Math.max(5, baseDetectionRisk - skillReduction);
    
    if (Math.random() * 100 < currentRisk) {
      mechanic.status = 'failed';
      return { success: false, error: 'Detected by security', mechanicFailed: true };
    }
    
    mechanic.progress += progressDelta;
    return { success: true, detectionRisk: currentRisk };
  }

  private processCombatMechanic(mechanic: MechanicState, progressDelta: number, engine: QuestMechanicsEngine): MechanicUpdateResult {
    const combatSkill = engine.player.skills?.hacking || 1; // Use hacking as combat substitute
    const requiredSkill = mechanic.parameters.combatSkillRequired || 5;
    
    if (combatSkill < requiredSkill) {
      return { success: false, error: 'Insufficient combat skill' };
    }
    
    // Simulate combat encounter
    const attackPower = combatSkill * 10;
    const enemyHealth = mechanic.parameters.enemyHealth || 100;
    
    mechanic.progress += Math.min(progressDelta, attackPower);
    mechanic.maxProgress = enemyHealth;
    
    return { success: true, damage: attackPower };
  }

  private processSocialMechanic(mechanic: MechanicState, progressDelta: number, engine: QuestMechanicsEngine): MechanicUpdateResult {
    const charisma = engine.player.skills?.social || 1;
    const requiredCharisma = mechanic.parameters.charismaRequired || 5;
    const trustThreshold = mechanic.parameters.trustThreshold || 80;
    
    if (charisma < requiredCharisma) {
      return { success: false, error: 'Insufficient social skill' };
    }
    
    // Build trust over time
    const trustGain = (charisma / requiredCharisma) * progressDelta;
    mechanic.progress += trustGain;
    mechanic.maxProgress = trustThreshold;
    
    return { success: true, trustLevel: mechanic.progress };
  }

  private processExplorationMechanic(mechanic: MechanicState, progressDelta: number, engine: QuestMechanicsEngine): MechanicUpdateResult {
    const navigationSkill = engine.player.skills?.stealth || 1; // Use stealth as exploration substitute
    const dangerLevel = mechanic.parameters.dangerLevel || 'low';
    
    const dangerMultipliers = {
      'low': 0.1,
      'medium': 0.3,
      'high': 0.5,
      'extreme': 0.8
    };
    
    const dangerChance = dangerMultipliers[dangerLevel as keyof typeof dangerMultipliers] || 0.1;
    
    if (Math.random() < dangerChance) {
      const damage = Math.floor(Math.random() * 20) + 5;
      return { success: false, error: `Encountered danger, lost ${damage} health`, damage };
    }
    
    mechanic.progress += progressDelta;
    return { success: true, areaExplored: progressDelta };
  }

  private processCraftingMechanic(mechanic: MechanicState, progressDelta: number, engine: QuestMechanicsEngine): MechanicUpdateResult {
    const craftingSkill = engine.player.skills?.hardware || 1; // Use hardware as crafting substitute
    const requiredSkill = mechanic.parameters.skillRequired || 5;
    const componentsNeeded = mechanic.parameters.componentsNeeded || [];
    
    if (craftingSkill < requiredSkill) {
      return { success: false, error: 'Insufficient hardware skill' };
    }
    
    // Check for components (simplified - assume player has basic components)
    const hasComponents = true; // Simplified for now - would need inventory system
    
    if (!hasComponents) {
      return { success: false, error: 'Missing required components' };
    }
    
    mechanic.progress += progressDelta;
    return { success: true, craftingProgress: mechanic.progress };
  }

  private processInvestigationMechanic(mechanic: MechanicState, progressDelta: number, engine: QuestMechanicsEngine): MechanicUpdateResult {
    const investigationSkill = engine.player.skills?.ai || 1; // Use AI as investigation substitute
    const cluesRequired = mechanic.parameters.cluesRequired || 5;
    
    // Find clues based on skill level
    const clueChance = Math.min(0.8, investigationSkill / 10);
    const foundClue = Math.random() < clueChance;
    
    if (foundClue) {
      mechanic.progress += 1;
      mechanic.maxProgress = cluesRequired;
      return { success: true, clueFound: true, cluesFound: mechanic.progress };
    }
    
    return { success: false, error: 'No clues found', retryAllowed: true };
  }

  private processHackingMechanic(mechanic: MechanicState, progressDelta: number, engine: QuestMechanicsEngine): MechanicUpdateResult {
    const hackingSkill = engine.player.skills?.hacking || 1;
    const requiredSkill = mechanic.parameters.hackingSkillRequired || 5;
    const securityLayers = mechanic.parameters.securityLayers || 1;
    
    if (hackingSkill < requiredSkill) {
      return { success: false, error: 'Insufficient hacking skill' };
    }
    
    // Bypass security layers
    const bypassChance = Math.min(0.9, hackingSkill / (requiredSkill * 1.2));
    const success = Math.random() < bypassChance;
    
    if (success) {
      mechanic.progress += 1;
      mechanic.maxProgress = securityLayers;
      return { success: true, layersBypassed: mechanic.progress };
    } else {
      return { success: false, error: 'Security bypass failed', retryAllowed: true };
    }
  }

  private processGenericMechanic(mechanic: MechanicState, progressDelta: number): MechanicUpdateResult {
    mechanic.progress += progressDelta;
    return { success: true };
  }

  private calculateMaxProgress(mechanic: QuestMechanic): number {
    switch (mechanic.type) {
      case 'timer':
        return mechanic.parameters?.timeLimit || 1800000;
      case 'puzzle':
        return mechanic.parameters?.puzzleCount || 3;
      case 'combat':
        return mechanic.parameters?.enemyHealth || 100;
      case 'social':
        return mechanic.parameters?.trustThreshold || 80;
      case 'exploration':
        return mechanic.parameters?.areasToExplore || 5;
      case 'crafting':
        return mechanic.parameters?.itemsToCraft || 1;
      case 'investigation':
        return mechanic.parameters?.cluesRequired || 5;
      case 'hacking':
        return mechanic.parameters?.securityLayers || 3;
      default:
        return 100;
    }
  }

  private activateNextMechanic(engine: QuestMechanicsEngine, completedMechanicId: string): void {
    const mechanicIds = Array.from(engine.mechanics.keys());
    const currentIndex = mechanicIds.indexOf(completedMechanicId);
    
    if (currentIndex >= 0 && currentIndex < mechanicIds.length - 1) {
      const nextMechanicId = mechanicIds[currentIndex + 1];
      const nextMechanic = engine.mechanics.get(nextMechanicId);
      
      if (nextMechanic) {
        nextMechanic.active = true;
        nextMechanic.status = 'active';
        nextMechanic.startTime = Date.now();
      }
    }
  }

  getQuestProgress(questId: string): QuestProgressInfo | null {
    const engine = this.engines.get(questId);
    if (!engine) return null;

    const mechanics = Array.from(engine.mechanics.values());
    const completedMechanics = mechanics.filter(m => m.status === 'completed').length;
    const totalMechanics = mechanics.length;
    const overallProgress = (completedMechanics / totalMechanics) * 100;

    const activeMechanic = mechanics.find(m => m.active);
    const failedMechanic = mechanics.find(m => m.status === 'failed');

    return {
      questId,
      overallProgress,
      completedMechanics,
      totalMechanics,
      activeMechanic: activeMechanic ? {
        id: activeMechanic.id,
        type: activeMechanic.type,
        progress: activeMechanic.progress,
        maxProgress: activeMechanic.maxProgress,
        progressPercentage: (activeMechanic.progress / activeMechanic.maxProgress) * 100
      } : null,
      failed: !!failedMechanic,
      failureReason: failedMechanic?.status === 'failed' ? 'Mechanic failed' : undefined
    };
  }

  cleanupQuest(questId: string): void {
    this.engines.delete(questId);
  }
}

// Types
export interface MechanicUpdateResult {
  success: boolean;
  error?: string;
  mechanicFailed?: boolean;
  retryAllowed?: boolean;
  timeRemaining?: number;
  progressPercentage?: number;
  resourcesConsumed?: Record<string, number>;
  puzzleSolved?: boolean;
  detectionRisk?: number;
  damage?: number;
  trustLevel?: number;
  areaExplored?: number;
  craftingProgress?: number;
  clueFound?: boolean;
  cluesFound?: number;
  layersBypassed?: number;
}

export interface QuestProgressInfo {
  questId: string;
  overallProgress: number;
  completedMechanics: number;
  totalMechanics: number;
  activeMechanic: {
    id: string;
    type: string;
    progress: number;
    maxProgress: number;
    progressPercentage: number;
  } | null;
  failed: boolean;
  failureReason?: string;
}

// Global instance
export const questMechanicsHandler = new QuestMechanicsHandler();