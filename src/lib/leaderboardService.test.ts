import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Session } from '@supabase/supabase-js';

// Mock supabase before importing the module
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    channel: vi.fn(),
    removeChannel: vi.fn(),
  },
}));

vi.mock('../lib/supabaseAuth', () => ({
  getAuthSession: vi.fn(),
  isAnonymous: vi.fn(),
  getUserId: vi.fn(),
}));

// Import after mocking
import {
  getLeaderboard,
  submitScore,
  getPlayerRank,
  subscribeToLeaderboard,
  updateLeaderboardEntry,
} from '../lib/leaderboardService';
import { supabase } from '../lib/supabase';
import * as authModule from '../lib/supabaseAuth';

describe('leaderboardService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (authModule.getAuthSession as ReturnType<typeof vi.fn>).mockReset();
    (authModule.isAnonymous as ReturnType<typeof vi.fn>).mockReset();
    (authModule.getUserId as ReturnType<typeof vi.fn>).mockReset();
    (supabase.from as ReturnType<typeof vi.fn>).mockReset();
    (supabase.channel as ReturnType<typeof vi.fn>).mockReset();
    (supabase.removeChannel as ReturnType<typeof vi.fn>).mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getLeaderboard', () => {
    it('returns top 50 entries ordered by score DESC for overall category', async () => {
      const mockEntries = [
        { id: '1', player_id: 'p1', username: 'Player1', score: 1000, level: 10, reputation: 500, total_credits: 50000, operations_completed: 50, category: 'overall' },
        { id: '2', player_id: 'p2', username: 'Player2', score: 800, level: 8, reputation: 400, total_credits: 40000, operations_completed: 40, category: 'overall' },
      ];

      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: mockEntries, error: null }),
      };
      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue(mockChain);

      const result = await getLeaderboard('overall', 50);

      expect(supabase.from).toHaveBeenCalledWith('global_leaderboards');
      expect(mockChain.eq).toHaveBeenCalledWith('category', 'overall');
      expect(mockChain.order).toHaveBeenCalledWith('score', { ascending: false });
      expect(mockChain.limit).toHaveBeenCalledWith(50);
      expect(result).toHaveLength(2);
      expect(result[0].rank).toBe(1);
      expect(result[0].username).toBe('Player1');
      expect(result[1].rank).toBe(2);
    });

    it('returns empty array when no entries exist', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      };
      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue(mockChain);

      const result = await getLeaderboard();

      expect(result).toEqual([]);
    });
  });

  describe('submitScore', () => {
    it('rejects anonymous users', async () => {
      (authModule.getAuthSession as ReturnType<typeof vi.fn>).mockResolvedValue({ user: { id: 'anon-id', is_anonymous: true } as Session });
      (authModule.isAnonymous as ReturnType<typeof vi.fn>).mockReturnValue(true);

      const result = await submitScore({
        username: 'TestPlayer',
        score: 100,
        level: 1,
        reputation: 10,
        totalCredits: 1000,
        operationsCompleted: 0,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Anonymous');
    });

    it('upserts player score when authenticated', async () => {
      (authModule.getAuthSession as ReturnType<typeof vi.fn>).mockResolvedValue({ user: { id: 'test-user', is_anonymous: false } as Session });
      (authModule.isAnonymous as ReturnType<typeof vi.fn>).mockReturnValue(false);
      (authModule.getUserId as ReturnType<typeof vi.fn>).mockReturnValue('test-user');

      const mockUpsert = vi.fn().mockResolvedValue({ error: null });
      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({ upsert: mockUpsert });

      const result = await submitScore({
        username: 'TestPlayer',
        score: 500,
        level: 5,
        reputation: 100,
        totalCredits: 10000,
        operationsCompleted: 10,
      });

      expect(result.success).toBe(true);
      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          player_id: 'test-user',
          username: 'TestPlayer',
          score: 500,
          category: 'overall',
        }),
        expect.objectContaining({ onConflict: 'player_id,category' })
      );
    });
  });

  describe('getPlayerRank', () => {
    it('returns null rank when player has no entry', async () => {
      (authModule.getAuthSession as ReturnType<typeof vi.fn>).mockResolvedValue({ user: { id: 'test-user', is_anonymous: false } as Session });
      (authModule.isAnonymous as ReturnType<typeof vi.fn>).mockReturnValue(false);
      (authModule.getUserId as ReturnType<typeof vi.fn>).mockReturnValue('test-user');

      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue(mockChain);

      const result = await getPlayerRank();

      expect(result.rank).toBeNull();
      expect(result.entry).toBeNull();
    });

    it('returns player rank by counting entries with higher score', async () => {
      (authModule.getAuthSession as ReturnType<typeof vi.fn>).mockResolvedValue({ user: { id: 'test-user', is_anonymous: false } as Session });
      (authModule.isAnonymous as ReturnType<typeof vi.fn>).mockReturnValue(false);
      (authModule.getUserId as ReturnType<typeof vi.fn>).mockReturnValue('test-user');

      const playerEntry = { id: '3', player_id: 'test-user', username: 'TestPlayer', score: 500, level: 5, reputation: 100, total_credits: 10000, operations_completed: 10, category: 'overall' };

      // First .from() call: player's entry query (single)
      // Second .from() call: rank count query (count)
      let fromCallCount = 0;
      (supabase.from as ReturnType<typeof vi.fn>).mockImplementation(() => {
        fromCallCount++;
        if (fromCallCount === 1) {
          // Player entry query
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: playerEntry, error: null }),
          };
        } else {
          // Rank count query
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            gt: vi.fn().mockResolvedValue({ count: 2, error: null }),
          };
        }
      });

      const result = await getPlayerRank();

      expect(result.rank).toBe(3);
      expect(result.entry).not.toBeNull();
      expect(result.entry?.username).toBe('TestPlayer');
    });
  });

  describe('subscribeToLeaderboard', () => {
    it('creates a realtime channel with postgres_changes subscription', () => {
      const mockOn = vi.fn().mockReturnThis();
      const mockSubscribe = vi.fn().mockReturnThis();
      const mockChannel = {
        on: mockOn,
        subscribe: mockSubscribe,
      };
      (supabase.channel as ReturnType<typeof vi.fn>).mockReturnValue(mockChannel);

      const callback = vi.fn();
      const { unsubscribe } = subscribeToLeaderboard('overall', callback);

      expect(supabase.channel).toHaveBeenCalledWith('leaderboard:overall');
      expect(mockOn).toHaveBeenCalledWith(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'global_leaderboards',
          filter: 'category=eq.overall',
        },
        expect.any(Function)
      );
      expect(mockSubscribe).toHaveBeenCalled();
      expect(typeof unsubscribe).toBe('function');
    });

    it('unsubscribe function calls removeChannel', () => {
      const mockOn = vi.fn().mockReturnThis();
      const mockSubscribe = vi.fn().mockReturnThis();
      const mockChannel = {
        on: mockOn,
        subscribe: mockSubscribe,
      };
      (supabase.channel as ReturnType<typeof vi.fn>).mockReturnValue(mockChannel);

      const callback = vi.fn();
      const { unsubscribe } = subscribeToLeaderboard('overall', callback);

      unsubscribe();

      expect(supabase.removeChannel).toHaveBeenCalledWith(mockChannel);
    });
  });

  describe('updateLeaderboardEntry', () => {
    it('updates only the calling player entry (RLS enforced)', async () => {
      (authModule.getAuthSession as ReturnType<typeof vi.fn>).mockResolvedValue({ user: { id: 'test-user', is_anonymous: false } as Session });
      (authModule.isAnonymous as ReturnType<typeof vi.fn>).mockReturnValue(false);
      (authModule.getUserId as ReturnType<typeof vi.fn>).mockReturnValue('test-user');

      const mockEqCategory = vi.fn().mockResolvedValue({ error: null });
      const mockEqPlayer = vi.fn().mockReturnValue({ eq: mockEqCategory });
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEqPlayer });
      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({ update: mockUpdate });

      const result = await updateLeaderboardEntry({
        score: 600,
        level: 6,
        reputation: 120,
        totalCredits: 12000,
        operationsCompleted: 15,
      });

      expect(result.success).toBe(true);
      expect(mockEqPlayer).toHaveBeenCalledWith('player_id', 'test-user');
    });

    it('rejects anonymous users', async () => {
      (authModule.getAuthSession as ReturnType<typeof vi.fn>).mockResolvedValue({ user: { id: 'anon-id', is_anonymous: true } as Session });
      (authModule.isAnonymous as ReturnType<typeof vi.fn>).mockReturnValue(true);

      const result = await updateLeaderboardEntry({ score: 100 });

      expect(result.success).toBe(false);
    });
  });
});
