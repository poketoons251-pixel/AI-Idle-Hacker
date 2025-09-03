import { describe, it, expect, beforeEach, vi } from 'vitest';
import { balanceConfig } from '../config/balanceConfig';

describe('Phase 4 Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Balance Configuration Validation', () => {
    it('should validate hacking technique success rates', () => {
      const config = balanceConfig.hackingTechniques;
      
      // Test base success rates are within reasonable bounds
      Object.values(config.baseSuccessRates).forEach(rate => {
        expect(rate).toBeGreaterThan(0);
        expect(rate).toBeLessThanOrEqual(1);
      });
      
      // Test skill bonus multipliers
      expect(config.skillBonusMultipliers.perLevelAbove).toBeGreaterThan(0);
      expect(config.skillBonusMultipliers.perLevelBelow).toBeLessThan(0);
      
      // Test difficulty scaling
      expect(config.difficultyScaling.experienceMultiplier).toBeGreaterThan(1);
      expect(config.difficultyScaling.creditMultiplier).toBeGreaterThan(1);
    });

    it('should validate campaign progression rates', () => {
      const config = balanceConfig.episodicCampaigns;
      
      // Test experience rewards increase with difficulty
      const expRewards = Object.values(config.progressionRates.experiencePerEpisode);
      for (let i = 1; i < expRewards.length; i++) {
        expect(expRewards[i]).toBeGreaterThan(expRewards[i - 1]);
      }
      
      // Test credit rewards increase with difficulty
      const creditRewards = Object.values(config.progressionRates.creditRewards);
      for (let i = 1; i < creditRewards.length; i++) {
        expect(creditRewards[i]).toBeGreaterThan(creditRewards[i - 1]);
      }
      
      // Test delivery schedule parameters
      expect(config.deliverySchedule.baseInterval).toBeGreaterThan(0);
      expect(config.deliverySchedule.difficultyModifier).toBeGreaterThan(1);
    });

    it('should validate AI personality evolution parameters', () => {
      const config = balanceConfig.aiPersonalities;
      
      // Test relationship progression rates
      expect(config.relationshipProgression.trustGainRate).toBeGreaterThan(0);
      expect(config.relationshipProgression.respectGainRate).toBeGreaterThan(0);
      expect(config.relationshipProgression.intimacyGainRate).toBeGreaterThan(0);
      expect(config.relationshipProgression.conflictDecayRate).toBeGreaterThan(0);
      
      // Test evolution thresholds increase
      const expThresholds = Object.values(config.evolutionRequirements.experienceThresholds);
      for (let i = 1; i < expThresholds.length; i++) {
        expect(expThresholds[i]).toBeGreaterThan(expThresholds[i - 1]);
      }
    });

    it('should validate idle optimization parameters', () => {
      const config = balanceConfig.idleOptimization;
      
      // Test autoplay efficiency
      expect(config.autoplayEfficiency.baseEfficiency).toBeGreaterThan(0);
      expect(config.autoplayEfficiency.baseEfficiency).toBeLessThanOrEqual(1);
      expect(config.autoplayEfficiency.skillLearningRate).toBeGreaterThan(0);
      expect(config.autoplayEfficiency.decisionAccuracy).toBeGreaterThan(0);
      
      // Test resource management
      expect(config.resourceManagement.energyConsumption).toBeGreaterThan(0);
      expect(config.resourceManagement.energyConsumption).toBeLessThanOrEqual(1);
      
      // Test resource allocation sums to 1
      const totalAllocation = Object.values(config.resourceManagement.resourceAllocation)
        .reduce((sum, value) => sum + value, 0);
      expect(totalAllocation).toBeCloseTo(1, 2);
    });
  });

  describe('System Integration Logic', () => {
    it('should calculate hacking success rates correctly', () => {
      const config = balanceConfig.hackingTechniques;
      const technique = 'Brute Force Attack';
      const baseRate = config.baseSuccessRates[technique];
      const playerLevel = 15;
      const requiredLevel = 10;
      
      // Calculate success rate with skill bonus
      const levelDifference = playerLevel - requiredLevel;
      const skillBonus = levelDifference > 0 
        ? levelDifference * config.skillBonusMultipliers.perLevelAbove
        : Math.abs(levelDifference) * config.skillBonusMultipliers.perLevelBelow;
      
      const finalRate = Math.max(0, Math.min(1, baseRate + skillBonus));
      
      expect(finalRate).toBeGreaterThan(baseRate);
      expect(finalRate).toBeLessThanOrEqual(1);
    });

    it('should calculate campaign rewards correctly', () => {
      const config = balanceConfig.episodicCampaigns;
      const difficulty = 3;
      const playerLevel = 15;
      
      const baseExp = config.progressionRates.experiencePerEpisode[difficulty];
      const baseCredits = config.progressionRates.creditRewards[difficulty];
      
      // Apply scaling
      const expMultiplier = balanceConfig.hackingTechniques.difficultyScaling.experienceMultiplier;
      const creditMultiplier = balanceConfig.hackingTechniques.difficultyScaling.creditMultiplier;
      
      const finalExp = Math.floor(baseExp * expMultiplier);
      const finalCredits = Math.floor(baseCredits * creditMultiplier);
      
      expect(finalExp).toBeGreaterThan(baseExp);
      expect(finalCredits).toBeGreaterThan(baseCredits);
    });

    it('should calculate AI relationship progression', () => {
      const config = balanceConfig.aiPersonalities;
      const initialTrust = 50;
      const actionImpact = 0.1;
      
      const trustGain = actionImpact * config.relationshipProgression.trustGainRate;
      const newTrust = Math.min(100, initialTrust + trustGain);
      
      expect(newTrust).toBeGreaterThan(initialTrust);
      expect(newTrust).toBeLessThanOrEqual(100);
    });
  });

  describe('Performance Validation', () => {
    it('should complete calculations within reasonable time', () => {
      const startTime = performance.now();
      
      // Simulate complex calculations
      const results = [];
      for (let i = 0; i < 1000; i++) {
        const config = balanceConfig.hackingTechniques;
        const rate = config.baseSuccessRates['Brute Force Attack'];
        const bonus = i * config.skillBonusMultipliers.perLevelAbove;
        results.push(Math.min(1, rate + bonus));
      }
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      expect(results).toHaveLength(1000);
      expect(executionTime).toBeLessThan(100); // Should complete within 100ms
    });

    it('should handle edge cases gracefully', () => {
      const config = balanceConfig.hackingTechniques;
      
      // Test with extreme values
      const extremeLevel = 1000;
      const requiredLevel = 1;
      const levelDifference = extremeLevel - requiredLevel;
      const skillBonus = levelDifference * config.skillBonusMultipliers.perLevelAbove;
      
      const baseRate = config.baseSuccessRates['Brute Force Attack'];
      const finalRate = Math.max(0, Math.min(1, baseRate + skillBonus));
      
      // Should be capped at 1.0
      expect(finalRate).toBe(1);
    });
  });
});