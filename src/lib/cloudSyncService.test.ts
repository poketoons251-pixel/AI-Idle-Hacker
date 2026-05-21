import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { GameState } from '../store/gameStore';

// Mock supabase before importing the module
const mockSupabase = {
  from: vi.fn(),
};

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

const mockAuthModule = {
  getAuthSession: vi.fn(),
  isAnonymous: vi.fn(),
  getUserId: vi.fn(),
};

vi.mock('../lib/supabaseAuth', () => ({
  getAuthSession: vi.fn(),
  isAnonymous: vi.fn(),
  getUserId: vi.fn(),
}));

// Import after mocking
import { saveToCloud, loadFromCloud, checkSyncConflict, getCloudSaveTimestamp } from '../lib/cloudSyncService';
import { supabase } from '../lib/supabase';
import * as authModule from '../lib/supabaseAuth';

describe('cloudSync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock implementations
    (authModule.getAuthSession as ReturnType<typeof vi.fn>).mockReset();
    (authModule.isAnonymous as ReturnType<typeof vi.fn>).mockReset();
    (authModule.getUserId as ReturnType<typeof vi.fn>).mockReset();
    (supabase.from as ReturnType<typeof vi.fn>).mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockGameState: Partial<GameState> = {
    player: {
      id: 'test-player-id',
      username: 'TestPlayer',
      level: 5,
      experience: 500,
      experienceToNext: 600,
      credits: 10000,
      reputation: 50,
      energy: 80,
      maxEnergy: 100,
      lastActive: Date.now(),
      skillPoints: 3,
      skills: { hacking: 5, stealth: 3, social: 2, hardware: 4, ai: 3 },
    },
    skills: { hacking: 5, stealth: 3, social: 2, hardware: 4, ai: 3 },
    equipment: [],
    operations: [],
    achievements: [],
    quests: [],
    activeQuests: [],
    completedQuests: [],
    storyQuestLines: [],
    loreEntries: [],
    unlockedLore: [],
    aiConfig: { enabled: false, isActive: false, priorities: { operations: 0.7, upgrades: 0.5, skills: 0.3, equipment: 0.4 }, riskTolerance: 0.6, resourceAllocation: { operations: 0.4, upgrades: 0.3, equipment: 0.2, reserve: 0.2 }, autoUpgrade: true, energyManagement: true, autoEnergyManagement: true },
    aiAnalytics: { decisionsMade: 0, decisionsCount: 0, successRate: 0, creditsEarned: 0, operationsStarted: 0, operationsCompleted: 0, totalSuccesses: 0, totalFailures: 0, efficiencyScore: 0, recentActions: [] },
    aiActive: false,
    currentGuild: null,
    guildMembers: [],
    availableGuilds: [],
    guildWars: [],
    aiCompanions: [],
    activeCompanion: null,
    companionTraining: [],
    companionMarketplace: [],
    friendships: [],
    mentorships: [],
    chatMessages: [],
    crossPlatformLinks: [],
    activeTab: 'dashboard',
    notifications: [],
    lastUpdate: Date.now(),
  };

  describe('saveToCloud', () => {
    it('rejects if user is anonymous', async () => {
      vi.mocked(authModule.getAuthSession).mockResolvedValue({ user: { is_anonymous: true, id: 'anon-id' } } as any);
      vi.mocked(authModule.isAnonymous).mockReturnValue(true);

      const result = await saveToCloud(mockGameState);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Must link account to save to cloud');
    });

    it('rejects if no session exists', async () => {
      vi.mocked(authModule.getAuthSession).mockResolvedValue(null);

      const result = await saveToCloud(mockGameState);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Must link account to save to cloud');
    });

    it('rejects if JSON state exceeds 100KB', async () => {
      vi.mocked(authModule.getAuthSession).mockResolvedValue({ user: { is_anonymous: false, id: 'linked-id' } } as any);
      vi.mocked(authModule.isAnonymous).mockReturnValue(false);
      vi.mocked(authModule.getUserId).mockReturnValue('linked-id');

      // Create a large state > 100KB
      const largeState = {
        ...mockGameState,
        loreEntries: Array(5000).fill({ id: 'test', category: 'overview' as const, title: 'Test', content: 'A'.repeat(100), storyLine: 'test', isUnlocked: true }),
      };

      const result = await saveToCloud(largeState);

      expect(result.success).toBe(false);
      expect(result.error).toContain('100KB');
    });

    it('upserts game state to game_saves table for linked users', async () => {
      vi.mocked(authModule.getAuthSession).mockResolvedValue({ user: { is_anonymous: false, id: 'linked-id' } } as any);
      vi.mocked(authModule.isAnonymous).mockReturnValue(false);
      vi.mocked(authModule.getUserId).mockReturnValue('linked-id');

      const mockUpsert = vi.fn().mockResolvedValue({ data: null, error: null });
      vi.mocked(supabase.from).mockReturnValue({ upsert: mockUpsert } as any);

      const result = await saveToCloud(mockGameState);

      expect(supabase.from).toHaveBeenCalledWith('game_saves');
      expect(mockUpsert).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    it('returns error on upsert failure', async () => {
      vi.mocked(authModule.getAuthSession).mockResolvedValue({ user: { is_anonymous: false, id: 'linked-id' } } as any);
      vi.mocked(authModule.isAnonymous).mockReturnValue(false);
      vi.mocked(authModule.getUserId).mockReturnValue('linked-id');

      const mockUpsert = vi.fn().mockResolvedValue({ data: null, error: { message: 'Database error' } });
      vi.mocked(supabase.from).mockReturnValue({ upsert: mockUpsert } as any);

      const result = await saveToCloud(mockGameState);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
    });
  });

  describe('loadFromCloud', () => {
    it('rejects if user is anonymous', async () => {
      vi.mocked(authModule.getAuthSession).mockResolvedValue({ user: { is_anonymous: true, id: 'anon-id' } } as any);
      vi.mocked(authModule.isAnonymous).mockReturnValue(true);

      const result = await loadFromCloud();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Must link account to load from cloud');
    });

    it('returns null data when no cloud save exists', async () => {
      vi.mocked(authModule.getAuthSession).mockResolvedValue({ user: { is_anonymous: false, id: 'linked-id' } } as any);
      vi.mocked(authModule.isAnonymous).mockReturnValue(false);
      vi.mocked(authModule.getUserId).mockReturnValue('linked-id');

      const mockSingle = vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } });
      vi.mocked(supabase.from).mockReturnValue({
        select: () => ({ eq: () => ({ single: mockSingle }) }),
      } as any);

      const result = await loadFromCloud();

      expect(result.success).toBe(true);
      expect(result.data).toBe(null);
    });

    it('returns parsed game state when cloud save exists', async () => {
      vi.mocked(authModule.getAuthSession).mockResolvedValue({ user: { is_anonymous: false, id: 'linked-id' } } as any);
      vi.mocked(authModule.isAnonymous).mockReturnValue(false);
      vi.mocked(authModule.getUserId).mockReturnValue('linked-id');

      const cloudData = {
        save_data: mockGameState,
        save_timestamp: '2026-05-21T10:00:00Z',
      };
      const mockSingle = vi.fn().mockResolvedValue({ data: cloudData, error: null });
      vi.mocked(supabase.from).mockReturnValue({
        select: () => ({ eq: () => ({ single: mockSingle }) }),
      } as any);

      const result = await loadFromCloud();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockGameState);
      expect(result.timestamp).toBe('2026-05-21T10:00:00Z');
    });

    it('returns error on query failure', async () => {
      vi.mocked(authModule.getAuthSession).mockResolvedValue({ user: { is_anonymous: false, id: 'linked-id' } } as any);
      vi.mocked(authModule.isAnonymous).mockReturnValue(false);
      vi.mocked(authModule.getUserId).mockReturnValue('linked-id');

      const mockSingle = vi.fn().mockResolvedValue({ data: null, error: { message: 'Query failed' } });
      vi.mocked(supabase.from).mockReturnValue({
        select: () => ({ eq: () => ({ single: mockSingle }) }),
      } as any);

      const result = await loadFromCloud();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Query failed');
    });
  });

  describe('checkSyncConflict', () => {
    it('returns no conflict when no cloud save exists', async () => {
      vi.mocked(authModule.getAuthSession).mockResolvedValue({ user: { is_anonymous: false, id: 'linked-id' } } as any);
      vi.mocked(authModule.isAnonymous).mockReturnValue(false);
      vi.mocked(authModule.getUserId).mockReturnValue('linked-id');

      const mockSingle = vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } });
      vi.mocked(supabase.from).mockReturnValue({
        select: () => ({ eq: () => ({ single: mockSingle }) }),
      } as any);

      const localTimestamp = Date.now();
      const result = await checkSyncConflict(localTimestamp);

      expect(result.hasConflict).toBe(false);
      expect(result.localTimestamp).toBe(localTimestamp);
    });

    it('returns conflict when cloud save is older than local by more than 5 minutes', async () => {
      vi.mocked(authModule.getAuthSession).mockResolvedValue({ user: { is_anonymous: false, id: 'linked-id' } } as any);
      vi.mocked(authModule.isAnonymous).mockReturnValue(false);
      vi.mocked(authModule.getUserId).mockReturnValue('linked-id');

      const now = Date.now();
      const sixMinutesAgo = new Date(now - 6 * 60 * 1000).toISOString();

      const mockSingle = vi.fn().mockResolvedValue({ data: { save_timestamp: sixMinutesAgo }, error: null });
      vi.mocked(supabase.from).mockReturnValue({
        select: () => ({ eq: () => ({ single: mockSingle }) }),
      } as any);

      const result = await checkSyncConflict(now);

      expect(result.hasConflict).toBe(true);
      expect(result.cloudTimestamp).toBe(sixMinutesAgo);
      expect(result.resolution).toBe('cloud');
    });

    it('returns no conflict when timestamps differ by less than 5 minutes', async () => {
      vi.mocked(authModule.getAuthSession).mockResolvedValue({ user: { is_anonymous: false, id: 'linked-id' } } as any);
      vi.mocked(authModule.isAnonymous).mockReturnValue(false);
      vi.mocked(authModule.getUserId).mockReturnValue('linked-id');

      const now = Date.now();
      const threeMinutesAgo = new Date(now - 3 * 60 * 1000).toISOString();

      const mockSingle = vi.fn().mockResolvedValue({ data: { save_timestamp: threeMinutesAgo }, error: null });
      vi.mocked(supabase.from).mockReturnValue({
        select: () => ({ eq: () => ({ single: mockSingle }) }),
      } as any);

      const result = await checkSyncConflict(now);

      expect(result.hasConflict).toBe(false);
      expect(result.localTimestamp).toBe(now);
    });
  });

  describe('getCloudSaveTimestamp', () => {
    it('returns timestamp when cloud save exists', async () => {
      vi.mocked(authModule.getAuthSession).mockResolvedValue({ user: { is_anonymous: false, id: 'linked-id' } } as any);
      vi.mocked(authModule.isAnonymous).mockReturnValue(false);
      vi.mocked(authModule.getUserId).mockReturnValue('linked-id');

      const timestamp = '2026-05-21T10:00:00Z';
      const mockSingle = vi.fn().mockResolvedValue({ data: { save_timestamp: timestamp }, error: null });
      vi.mocked(supabase.from).mockReturnValue({
        select: () => ({ eq: () => ({ single: mockSingle }) }),
      } as any);

      const result = await getCloudSaveTimestamp();

      expect(result).toBe(timestamp);
    });

    it('returns null when no cloud save exists', async () => {
      vi.mocked(authModule.getAuthSession).mockResolvedValue({ user: { is_anonymous: false, id: 'linked-id' } } as any);
      vi.mocked(authModule.isAnonymous).mockReturnValue(false);
      vi.mocked(authModule.getUserId).mockReturnValue('linked-id');

      const mockSingle = vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } });
      vi.mocked(supabase.from).mockReturnValue({
        select: () => ({ eq: () => ({ single: mockSingle }) }),
      } as any);

      const result = await getCloudSaveTimestamp();

      expect(result).toBe(null);
    });

    it('returns null when user is anonymous', async () => {
      vi.mocked(authModule.getAuthSession).mockResolvedValue({ user: { is_anonymous: true, id: 'anon-id' } } as any);
      vi.mocked(authModule.isAnonymous).mockReturnValue(true);

      const result = await getCloudSaveTimestamp();

      expect(result).toBe(null);
    });
  });
});
