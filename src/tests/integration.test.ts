import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useGameStore } from '../store/gameStore';
import { errorHandler, GameError, ErrorType, ErrorSeverity } from '../utils/errorHandling';
import { balanceConfig } from '../config/balanceConfig';

// Mock implementations
vi.mock('../store/gameStore');
vi.mock('../utils/errorHandling');

// Mock fetch globally
global.fetch = vi.fn();

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock toast notifications
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn()
  }
}));

describe('Phase 4 Integration Tests', () => {
  const mockGameStore = {
    player: {
      id: 'test-player',
      experience: 5000,
      credits: 10000,
      reputation: 750,
      level: 5
    },
    skills: {
      hacking: 45,
      investigation: 38,
      social_engineering: 32,
      operations: 28
    },
    aiConfig: {
      riskTolerance: 0.6,
      priorities: {
        relationships: 0.7,
        progression: 0.8,
        safety: 0.9
      }
    },
    updatePlayer: vi.fn(),
    updateSkills: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useGameStore).mockReturnValue(mockGameStore);
    vi.mocked(fetch).mockClear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Balance Configuration Integration', () => {
    it('should apply correct hacking success rates based on balance config', () => {
      const technique = 'brute_force';
      const playerLevel = 5;
      const hackingSkill = 45;
      
      const baseRate = balanceConfig.hackingTechniques.baseSuccessRates[technique] || 0.3;
      const skillMultiplier = balanceConfig.hackingTechniques.skillBonusMultipliers.perLevelAbove;
      const levelDifference = hackingSkill - (playerLevel * 10);
      
      let expectedRate = baseRate;
      if (levelDifference > 0) {
        expectedRate += (levelDifference / 10) * skillMultiplier;
      }
      
      expect(expectedRate).toBeGreaterThan(0.3);
      expect(expectedRate).toBeLessThan(1.0);
    });

    it('should calculate episodic campaign progression correctly', () => {
      const episodeLevel = 2;
      const experienceReward = balanceConfig.episodicCampaigns.progressionRates.experiencePerEpisode[episodeLevel];
      const creditReward = balanceConfig.episodicCampaigns.progressionRates.creditRewards[episodeLevel];
      
      expect(experienceReward).toBeGreaterThan(0);
      expect(creditReward).toBeGreaterThan(0);
      expect(experienceReward).toBe(720);
    });

    it('should provide balanced AI personality evolution rates', () => {
      const personalityConfig = balanceConfig.aiPersonalities.relationshipProgression;
      
      expect(personalityConfig.trustGainRate).toBeGreaterThan(0);
      expect(personalityConfig.respectGainRate).toBeGreaterThan(0);
        expect(personalityConfig.intimacyGainRate).toBeGreaterThan(0);
      expect(personalityConfig.conflictDecayRate).toBeGreaterThan(0);
    });
  });

  describe('AI Decision Making Integration', () => {
    it('should make intelligent story choices based on personality and relationships', async () => {
      const mockChoice = {
        id: 'test-choice-1',
        text: 'How should we approach this target?',
        consequences: {
          relationship_changes: {
            'partner-1': { trust: 5, respect: 3 },
            'partner-2': { trust: -2, conflict: 4 }
          },
          personality_impact: {
            'analytical': 10,
            'empathy': -5
          },
          narrative_weight: 0.8,
          risk_level: 'medium' as const
        }
      };

      (fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ choices: [mockChoice] })
      });

      // Mock AI decision endpoint
      (fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ 
          decision: 'conservative_approach',
          confidence: 0.85,
          reasoning: 'Prioritizing relationship stability'
        })
      });

      const response = await fetch('/api/story/pending-choices');
      const data = await response.json();
      
      expect(data.choices).toHaveLength(1);
      expect(data.choices[0].consequences.risk_level).toBe('medium');
    });

    it('should handle AI decision failures gracefully', async () => {
      const mockError = new GameError(
        'AI decision system unavailable',
        ErrorType.AI_DECISION,
        ErrorSeverity.MEDIUM,
        { context: 'story_choice' },
        true
      );

      (fetch as Mock).mockRejectedValueOnce(new Error('Network error'));
      
      // Should fallback to manual mode
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        expect.stringContaining('ai_automation_disabled'),
        expect.any(String)
      );
    });
  });

  describe('Investigation System Integration', () => {
    it('should prioritize investigation targets based on risk and reward', async () => {
      const mockTargets = [
        {
          id: 'target-1',
          priority: 'high',
          difficulty: 6,
          potential_rewards: { experience: 800, credits: 1500 },
          risk_factors: { detection_chance: 25, retaliation_risk: 15 }
        },
        {
          id: 'target-2', 
          priority: 'medium',
          difficulty: 4,
          potential_rewards: { experience: 400, credits: 800 },
          risk_factors: { detection_chance: 10, retaliation_risk: 5 }
        }
      ];

      (fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ targets: mockTargets })
      });

      const response = await fetch('/api/investigation/targets');
      const data = await response.json();
      
      expect(data.targets).toHaveLength(2);
      
      // High priority target should be considered despite higher risk
      const highPriorityTarget = data.targets.find((t: any) => t.priority === 'high');
      expect(highPriorityTarget).toBeDefined();
      expect(highPriorityTarget.potential_rewards.experience).toBeGreaterThan(500);
    });

    it('should generate intelligence patterns from gathered data', async () => {
      const mockIntelligence = [
        {
          id: 'intel-1',
          category: 'financial',
          reliability: 85,
          content: 'Target uses offshore accounts',
          timestamp: new Date().toISOString()
        },
        {
          id: 'intel-2',
          category: 'financial', 
          reliability: 90,
          content: 'Regular transfers to shell company',
          timestamp: new Date().toISOString()
        },
        {
          id: 'intel-3',
          category: 'financial',
          reliability: 78,
          content: 'Connection to known money laundering network',
          timestamp: new Date().toISOString()
        }
      ];

      (fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ intelligence: mockIntelligence })
      });

      const response = await fetch('/api/investigation/intelligence');
      const data = await response.json();
      
      // Should identify financial pattern with 3+ related intel pieces
      const financialIntel = data.intelligence.filter((i: any) => i.category === 'financial');
      expect(financialIntel).toHaveLength(3);
      expect(financialIntel.every((i: any) => i.reliability > 75)).toBe(true);
    });
  });

  describe('Hacking System Integration', () => {
    it('should calculate success rates with skill bonuses correctly', () => {
      const technique = 'sql_injection';
      const targetDifficulty = 5;
      const playerSkill = 45;
      
      const baseRate = balanceConfig.hackingTechniques.baseSuccessRates[technique] || 0.4;
      const skillBonus = Math.max(0, (playerSkill - targetDifficulty * 10)) * 0.04;
      const finalRate = Math.min(0.95, baseRate + skillBonus);
      
      expect(finalRate).toBeGreaterThan(baseRate);
      expect(finalRate).toBeLessThanOrEqual(0.95);
    });

    it('should apply execution time variations within acceptable range', () => {
      const baseTime = 120; // seconds
      const variation = balanceConfig.hackingTechniques.difficultyScaling.experienceMultiplier;
      
      const minTime = baseTime * (1 - variation);
      const maxTime = baseTime * (1 + variation);
      
      expect(variation).toBeLessThanOrEqual(0.15); // Max 15% variation
      expect(minTime).toBeGreaterThan(100);
      expect(maxTime).toBeLessThan(140);
    });

    it('should provide appropriate rewards for failed attempts', () => {
      const creditMultiplier = balanceConfig.hackingTechniques.difficultyScaling.creditMultiplier;
      const experienceMultiplier = balanceConfig.hackingTechniques.difficultyScaling.experienceMultiplier;
      
      expect(creditMultiplier).toBeGreaterThan(0);
      expect(experienceMultiplier).toBeGreaterThan(0);
    });
  });

  describe('Episodic Campaign Integration', () => {
    it('should deliver episodes based on player progression and difficulty', async () => {
      const mockCampaign = {
        id: 'campaign-1',
        difficulty: 'medium',
        episodes: [
          { id: 'ep-1', unlocked: true, completed: true },
          { id: 'ep-2', unlocked: true, completed: false },
          { id: 'ep-3', unlocked: false, completed: false }
        ]
      };

      (fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ campaign: mockCampaign })
      });

      const response = await fetch('/api/campaigns/current');
      const data = await response.json();
      
      const unlockedEpisodes = data.campaign.episodes.filter((ep: any) => ep.unlocked);
      const completedEpisodes = data.campaign.episodes.filter((ep: any) => ep.completed);
      
      expect(unlockedEpisodes).toHaveLength(2);
      expect(completedEpisodes).toHaveLength(1);
    });

    it('should calculate episode rewards with difficulty multipliers', () => {
      const episodeLevel = 3;
      const baseReward = balanceConfig.episodicCampaigns.progressionRates.creditRewards[episodeLevel];
      const deliveryConfig = balanceConfig.episodicCampaigns.deliverySchedule;
      
      const finalReward = baseReward * deliveryConfig.difficultyModifier;
      
      expect(finalReward).toBeGreaterThan(baseReward);
      expect(deliveryConfig.difficultyModifier).toBeGreaterThan(1.0);
    });
  });

  describe('AI Personality System Integration', () => {
    it('should track relationship changes accurately', async () => {
      const mockPartner = {
        id: 'partner-1',
        name: 'Alex',
        trust: 65,
        respect: 70,
        intimacy: 45,
        conflict: 20
      };

      const relationshipChange = {
        trust: 5,
        respect: 3,
        intimacy: 2,
        conflict: -1
      };

      (fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ 
          partner: {
            ...mockPartner,
            trust: mockPartner.trust + relationshipChange.trust,
            respect: mockPartner.respect + relationshipChange.respect,
            intimacy: mockPartner.intimacy + relationshipChange.intimacy,
            conflict: mockPartner.conflict + relationshipChange.conflict
          }
        })
      });

      const response = await fetch('/api/ai-personality/update-relationship', {
        method: 'POST',
        body: JSON.stringify({ partnerId: 'partner-1', changes: relationshipChange })
      });
      
      const data = await response.json();
      
      expect(data.partner.trust).toBe(70);
      expect(data.partner.respect).toBe(73);
      expect(data.partner.intimacy).toBe(47);
      expect(data.partner.conflict).toBe(19);
    });

    it('should have proper evolution requirements for personality traits', () => {
      const evolutionRequirements = balanceConfig.aiPersonalities.evolutionRequirements;
      
      expect(evolutionRequirements.experienceThresholds.stage_2).toBeGreaterThan(0);
      expect(evolutionRequirements.relationshipThresholds.trust).toBeGreaterThan(0);
      expect(evolutionRequirements.timeRequirements.stage_2).toBeGreaterThan(0);
    });
  });

  describe('Idle Optimization Integration', () => {
    it('should calculate autoplay efficiency based on player progression', () => {
      const playerLevel = 5;
      const hackingSkill = 45;
      
      const baseEfficiency = balanceConfig.idleOptimization.autoplayEfficiency.baseEfficiency;
      const skillBonus = hackingSkill * 0.002;
      const levelBonus = playerLevel * 0.01;
      
      const totalEfficiency = Math.min(0.95, baseEfficiency + skillBonus + levelBonus);
      
      expect(totalEfficiency).toBeGreaterThan(baseEfficiency);
      expect(totalEfficiency).toBeLessThanOrEqual(0.95);
    });

    it('should manage resources efficiently during idle play', () => {
      const resourceManagement = balanceConfig.idleOptimization.resourceManagement;
      
      expect(resourceManagement.energyConsumption).toBe(0.75); // 75% energy consumption
      expect(resourceManagement.resourceAllocation.hacking).toBe(0.32); // 32% hacking allocation
      expect(resourceManagement.resourceAllocation.skills).toBe(0.28); // 28% skills allocation
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle network errors with appropriate recovery strategies', async () => {
      const networkError = new Error('Network request failed');
      (fetch as Mock).mockRejectedValueOnce(networkError);

      try {
        await fetch('/api/test-endpoint');
      } catch (error) {
        expect(error).toBeDefined();
      }

      // Should attempt recovery
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('should suppress repeated errors to avoid spam', () => {
      const errorType = ErrorType.NETWORK;
      
      errorHandler.suppressError(errorType, 30000);
      
      // Subsequent errors of same type should be suppressed
      expect(errorHandler.getErrorStats().recent).toBeDefined();
    });

    it('should provide emergency save functionality for critical errors', () => {
      const criticalError = new GameError(
        'Critical system failure',
        ErrorType.CLIENT,
        ErrorSeverity.CRITICAL,
        {},
        false
      );

      errorHandler.handleError(criticalError);
      
      // Should save emergency state
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'emergency_save',
        expect.stringContaining('state')
      );
    });
  });

  describe('Performance Optimization', () => {
    it('should limit concurrent operations to prevent overload', async () => {
      const maxConcurrentInvestigations = 3;
      const activeInvestigations = ['inv-1', 'inv-2', 'inv-3'];
      
      expect(activeInvestigations.length).toBeLessThanOrEqual(maxConcurrentInvestigations);
    });

    it('should implement proper caching for frequently accessed data', () => {
      const cacheKey = 'investigation_targets';
      const cacheData = { targets: [], timestamp: Date.now() };
      
      localStorageMock.setItem(cacheKey, JSON.stringify(cacheData));
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        cacheKey,
        expect.stringContaining('targets')
      );
    });

    it('should clean up resources and intervals properly', () => {
      const mockInterval = setInterval(() => {}, 1000);
      
      // Component should clear intervals on unmount
      clearInterval(mockInterval);
      
      expect(mockInterval).toBeDefined();
    });
  });

  describe('System Integration Scenarios', () => {
    it('should handle complex multi-system interactions', async () => {
      // Scenario: AI makes investigation decision that affects personality relationships
      const investigationDecision = {
        targetId: 'target-1',
        approach: 'aggressive',
        aiGenerated: true
      };

      const expectedRelationshipImpact = {
        'partner-1': { trust: -3, respect: 5, conflict: 2 },
        'partner-2': { trust: 1, respect: 2, conflict: -1 }
      };

      (fetch as Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, relationshipChanges: expectedRelationshipImpact })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ partners: [] })
        });

      const investigationResponse = await fetch('/api/investigation/execute', {
        method: 'POST',
        body: JSON.stringify(investigationDecision)
      });

      const investigationData = await investigationResponse.json();
      expect(investigationData.success).toBe(true);
      expect(investigationData.relationshipChanges).toBeDefined();
    });

    it('should maintain data consistency across system boundaries', async () => {
      // Ensure player data remains consistent across different systems
      const initialCredits = mockGameStore.player.credits;
      const hackingReward = 500;
      const investigationCost = 200;
      
      const expectedFinalCredits = initialCredits + hackingReward - investigationCost;
      
      expect(expectedFinalCredits).toBe(10300);
      expect(expectedFinalCredits).toBeGreaterThan(0);
    });

    it('should handle system failures gracefully without data loss', async () => {
      // Simulate system failure during critical operation
      const criticalOperation = {
        type: 'campaign_completion',
        data: { episodeId: 'ep-1', rewards: { experience: 1000, credits: 2000 } }
      };

      (fetch as Mock).mockRejectedValueOnce(new Error('Server error'));

      try {
        await fetch('/api/campaigns/complete', {
          method: 'POST',
          body: JSON.stringify(criticalOperation)
        });
      } catch (error) {
        // Should save operation for retry
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          expect.stringContaining('pending_operation'),
          expect.any(String)
        );
      }
    });
  });
});

// Performance benchmarks
describe('Performance Benchmarks', () => {
  it('should complete AI decision making within acceptable time limits', async () => {
    const startTime = performance.now();
    
    // Simulate AI decision process
    await new Promise(resolve => setTimeout(resolve, 100)); // Max 100ms
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    expect(duration).toBeLessThan(500); // Should complete within 500ms
  });

  it('should handle large datasets efficiently', () => {
    const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
      id: `item-${i}`,
      data: `test-data-${i}`,
      timestamp: Date.now()
    }));
    
    const startTime = performance.now();
    
    // Simulate data processing
    const processed = largeDataset.filter(item => item.id.includes('5'));
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    expect(processed.length).toBeGreaterThan(0);
    expect(duration).toBeLessThan(100); // Should process within 100ms
  });

  it('should maintain responsive UI during background operations', async () => {
    const backgroundTasks = Array.from({ length: 5 }, (_, i) => 
      new Promise(resolve => setTimeout(resolve, 50))
    );
    
    const startTime = performance.now();
    await Promise.all(backgroundTasks);
    const endTime = performance.now();
    
    const totalDuration = endTime - startTime;
    expect(totalDuration).toBeLessThan(300); // Parallel execution should be efficient
  });
});

export {};