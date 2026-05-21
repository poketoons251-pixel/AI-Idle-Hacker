/**
 * AI Decision Engine — Strategic rules-based decision making for AI auto-play.
 *
 * Per D-04: Rules-based AI runs 100% in browser — no API calls, no Edge Functions.
 * The Edge Function client (aiEdgeFunctionClient.ts) is deprecated and no longer used.
 *
 * Design decisions:
 * - D-03: Reasoning strings in summary format with specific numbers
 * - D-04: 20% credit reserve enforced (configurable via aiConfig.resourceAllocation.reserve)
 *
 * Flow:
 * 1. makeStrategicDecision() — synchronous rules-based evaluation (ROI, risk-adjusted targets, priority weighting)
 * 2. Returns AIDecision or null if no action is viable
 */

import type {
  Equipment,
  Target,
  AIConfig,
  AIDecision,
} from '../store/gameStore';

export interface StrategicContext {
  credits: number;
  creditsPerSecond: number;
  level: number;
  energy: number;
  skillPoints: number;
  equipment: Equipment[];
  targets: Target[];
  aiConfig: AIConfig;
}

export interface UpgradeOption {
  equipment: Equipment;
  value: number; // ROI score (bonus / upgradeCost)
}

export interface TargetOption {
  target: Target;
  value: number; // Risk-adjusted value score
}

/**
 * Evaluate equipment upgrade options by ROI (bonus per credit spent).
 * 
 * Filters to equipped items with level < 10, calculates ROI as bonus/upgradeCost,
 * excludes items exceeding available credits (credits * (1 - reserve)).
 * Returns sorted by value descending (best ROI first).
 */
export function evaluateUpgradeOptions(ctx: StrategicContext): UpgradeOption[] {
  const reserve = ctx.aiConfig.resourceAllocation.reserve ?? 0.2;
  const availableCredits = ctx.credits * (1 - reserve);

  const upgradeable = ctx.equipment.filter(
    (e) => e.equipped && e.level < 10 && e.upgradeCost <= availableCredits
  );

  const options = upgradeable.map((equipment) => ({
    equipment,
    value: equipment.bonus / equipment.upgradeCost,
  }));

  return options.sort((a, b) => b.value - a.value);
}

/**
 * Evaluate hacking target options by risk-adjusted return.
 * 
 * Filters to unlocked targets where difficulty <= player.level + 2.
 * Calculates base value as rewards.credits / difficulty.
 * Weights by riskTolerance: high risk tolerance favors harder targets,
 * low risk tolerance favors easier targets.
 * Returns sorted by value descending (best risk-adjusted return first).
 */
export function evaluateTargetOptions(ctx: StrategicContext): TargetOption[] {
  const { riskTolerance } = ctx.aiConfig;

  const viableTargets = ctx.targets.filter(
    (t) => t.unlocked && t.difficulty <= ctx.level + 2
  );

  const options = viableTargets.map((target) => {
    const baseValue = target.rewards.credits / target.difficulty;
    // Risk tolerance weighting:
    // - riskTolerance > 0.5: favor higher difficulty (multiply by difficulty/riskTolerance)
    // - riskTolerance < 0.5: favor lower difficulty (multiply by (1 - difficulty/5) * (1 - riskTolerance))
    // - riskTolerance = 0.5: neutral (base value)
    let riskWeight = 1.0;
    if (riskTolerance > 0.5) {
      riskWeight = 1 + (riskTolerance - 0.5) * (target.difficulty / 5);
    } else if (riskTolerance < 0.5) {
      riskWeight = 1 + (0.5 - riskTolerance) * (1 - target.difficulty / 5);
    }

    return {
      target,
      value: baseValue * riskWeight,
    };
  });

  return options.sort((a, b) => b.value - a.value);
}

/**
 * Make a strategic decision based on current game state and AI configuration.
 * 
 * Decision logic:
 * 1. Calculate available credits (total * (1 - reserve))
 * 2. Use priorities to decide action type:
 *    - If upgrades priority > operations priority AND affordable upgrade exists → upgrade_equipment
 *    - If operations priority > upgrades priority AND energy sufficient → start_operation
 *    - If skillPoints > 0 → allocate_skill
 * 3. Build reasoning string with specific numbers (per D-03)
 * 4. Return AIDecision or null if no action is viable
 */
export function makeStrategicDecision(ctx: StrategicContext): AIDecision | null {
  const { priorities, riskTolerance } = ctx.aiConfig;
  const reserve = ctx.aiConfig.resourceAllocation.reserve ?? 0.2;
  const availableCredits = ctx.credits * (1 - reserve);

  // Evaluate all options
  const upgradeOptions = evaluateUpgradeOptions(ctx);
  const targetOptions = evaluateTargetOptions(ctx);

  // --- Priority 1: Upgrade equipment if upgrades > operations priority ---
  if (priorities.upgrades > priorities.operations && upgradeOptions.length > 0) {
    const bestUpgrade = upgradeOptions[0];
    const affordableCount = upgradeOptions.length;
    const roi = bestUpgrade.value.toFixed(3);
    const equip = bestUpgrade.equipment;

    return {
      type: 'upgrade_equipment',
      targetId: equip.id,
      reasoning: `Analyzing... ${equip.name} upgrade gives +${equip.bonus} bonus at ${equip.upgradeCost} credits (ROI: ${roi}), ${affordableCount} upgrades affordable → Purchasing ${equip.name}`,
      confidence: Math.min(0.3 + bestUpgrade.value * 10, 1.0),
      timestamp: new Date(),
      description: `AI upgraded ${equip.name} to level ${equip.level + 1}`,
    };
  }

  // --- Priority 2: Start operation if operations > upgrades priority ---
  if (priorities.operations > priorities.upgrades && targetOptions.length > 0) {
    const bestTarget = targetOptions[0];
    const target = bestTarget.target;
    const energyCost = target.difficulty * 10;

    if (ctx.energy >= energyCost) {
      const riskAdjustedValue = bestTarget.value.toFixed(1);
      const operationTypes: Array<'data_breach' | 'crypto_mining' | 'ddos' | 'social_engineering'> = [
        'data_breach',
        'crypto_mining',
        'ddos',
        'social_engineering',
      ];
      // Pick operation type based on risk tolerance
      let selectedType: typeof operationTypes[number];
      if (riskTolerance > 0.7) {
        selectedType = 'ddos'; // Aggressive
      } else if (riskTolerance > 0.4) {
        selectedType = 'data_breach'; // Balanced
      } else {
        selectedType = 'crypto_mining'; // Conservative
      }

      return {
        type: 'start_operation',
        targetId: target.id,
        operationType: selectedType,
        reasoning: `Analyzing... ${target.name} yields ${target.rewards.credits} credits at difficulty ${target.difficulty} (risk-adjusted: ${riskAdjustedValue}), energy sufficient → Starting ${selectedType}`,
        confidence: Math.min(0.3 + bestTarget.value / 100, 1.0),
        timestamp: new Date(),
        description: `AI started ${selectedType} operation on ${target.name}`,
      };
    }
  }

  // --- Priority 3: Allocate skill points if available ---
  if (ctx.skillPoints > 0) {
    return {
      type: 'allocate_skill',
      reasoning: `Analyzing... ${ctx.skillPoints} skill points available, prioritizing hacking skill → Allocating ${ctx.skillPoints} points to hacking`,
      confidence: 0.7,
      timestamp: new Date(),
      description: `AI allocated ${ctx.skillPoints} skill points to hacking`,
      skill: 'hacking',
      points: ctx.skillPoints,
    };
  }

  // --- Fallback: If neither priority dominates, check both paths ---
  // Try upgrades if any affordable
  if (upgradeOptions.length > 0) {
    const bestUpgrade = upgradeOptions[0];
    const equip = bestUpgrade.equipment;
    const roi = bestUpgrade.value.toFixed(3);

    return {
      type: 'upgrade_equipment',
      targetId: equip.id,
      reasoning: `Analyzing... ${equip.name} upgrade gives +${equip.bonus} bonus at ${equip.upgradeCost} credits (ROI: ${roi}) → Purchasing ${equip.name}`,
      confidence: Math.min(0.3 + bestUpgrade.value * 10, 1.0),
      timestamp: new Date(),
      description: `AI upgraded ${equip.name} to level ${equip.level + 1}`,
    };
  }

  // Try operations if energy sufficient
  if (targetOptions.length > 0) {
    const bestTarget = targetOptions[0];
    const target = bestTarget.target;
    const energyCost = target.difficulty * 10;

    if (ctx.energy >= energyCost) {
      const riskAdjustedValue = bestTarget.value.toFixed(1);
      const selectedType: 'data_breach' | 'crypto_mining' | 'ddos' | 'social_engineering' =
        riskTolerance > 0.5 ? 'data_breach' : 'crypto_mining';

      return {
        type: 'start_operation',
        targetId: target.id,
        operationType: selectedType,
        reasoning: `Analyzing... ${target.name} yields ${target.rewards.credits} credits at difficulty ${target.difficulty} (risk-adjusted: ${riskAdjustedValue}), energy sufficient → Starting ${selectedType}`,
        confidence: Math.min(0.3 + bestTarget.value / 100, 1.0),
        timestamp: new Date(),
        description: `AI started ${selectedType} operation on ${target.name}`,
      };
    }
  }

  // No viable action
  return null;
}
