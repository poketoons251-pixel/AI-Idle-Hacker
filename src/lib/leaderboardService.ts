/**
 * Leaderboard Service — Supabase-backed leaderboard with realtime updates.
 *
 * Per D-03: Leaderboards are the only realtime feature in v1 scope.
 * Supabase Realtime pushes score updates when players achieve milestones.
 * Per D-04: No Edge Functions needed — all logic runs in browser.
 *
 * Functions:
 * - getLeaderboard(category, limit) — fetch top N entries ordered by score DESC
 * - submitScore(entry) — upsert player's score (rejects anonymous users)
 * - getPlayerRank(category) — get player's rank position
 * - subscribeToLeaderboard(category, callback) — realtime postgres_changes subscription
 * - updateLeaderboardEntry(updates) — update only the calling player's entry (RLS enforced)
 */

import { supabase } from './supabase';
import { getAuthSession, isAnonymous, getUserId } from './supabaseAuth';
import type { Session } from '@supabase/supabase-js';

export interface LeaderboardEntry {
  rank: number;
  username: string;
  level: number;
  reputation: number;
  totalCredits: number;
  operationsCompleted: number;
  successRate: number;
  lastActive: string;
  change: 'up' | 'down' | 'same';
  changeAmount: number;
  isCurrentPlayer?: boolean;
}

export interface RealtimePayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: Record<string, unknown> | null;
  old: Record<string, unknown> | null;
  table: string;
  schema: string;
  commit_timestamp: string;
}

/**
 * Fetch the top N leaderboard entries for a given category.
 * Results are ordered by score descending with rank computed from row position.
 */
export async function getLeaderboard(
  category: string = 'overall',
  limit: number = 50
): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase
    .from('global_leaderboards')
    .select('*')
    .eq('category', category)
    .order('score', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[Leaderboard] Failed to fetch leaderboard:', error.message);
    return [];
  }

  return (data || []).map((row, index) => mapRowToEntry(row, index + 1));
}

/**
 * Submit or update the player's score on the leaderboard.
 * Rejects anonymous users. Uses upsert with onConflict: 'player_id,category'.
 */
export async function submitScore(entry: {
  username: string;
  score: number;
  level: number;
  reputation: number;
  totalCredits: number;
  operationsCompleted: number;
}): Promise<{ success: boolean; error?: string }> {
  const session = await getAuthSession();
  if (!session || isAnonymous(session)) {
    return { success: false, error: 'Anonymous users cannot submit scores. Link your account first.' };
  }

  const playerId = getUserId(session);
  if (!playerId) {
    return { success: false, error: 'Unable to determine player ID.' };
  }

  const { error } = await supabase.from('global_leaderboards').upsert(
    {
      player_id: playerId,
      username: entry.username,
      score: entry.score,
      level: entry.level,
      reputation: entry.reputation,
      total_credits: entry.totalCredits,
      operations_completed: entry.operationsCompleted,
      category: 'overall',
      last_updated: new Date().toISOString(),
    },
    { onConflict: 'player_id,category' }
  );

  if (error) {
    console.error('[Leaderboard] Failed to submit score:', error.message);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Get the player's current rank position in the leaderboard.
 * Returns { rank: null, entry: null } if player has no entry.
 */
export async function getPlayerRank(
  category: string = 'overall'
): Promise<{ rank: number | null; entry: LeaderboardEntry | null }> {
  const session = await getAuthSession();
  if (!session || isAnonymous(session)) {
    return { rank: null, entry: null };
  }

  const playerId = getUserId(session);
  if (!playerId) {
    return { rank: null, entry: null };
  }

  // Get player's own entry
  const { data: playerEntry, error: entryError } = await supabase
    .from('global_leaderboards')
    .select('*')
    .eq('player_id', playerId)
    .eq('category', category)
    .single();

  if (entryError || !playerEntry) {
    return { rank: null, entry: null };
  }

  // Count how many entries have a higher score to determine rank
  const { count, error: rankError } = await supabase
    .from('global_leaderboards')
    .select('score', { count: 'exact', head: true })
    .eq('category', category)
    .gt('score', playerEntry.score);

  if (rankError) {
    console.error('[Leaderboard] Failed to compute rank:', rankError.message);
    return { rank: null, entry: mapRowToEntry(playerEntry, 0) };
  }

  const rank = (count ?? 0) + 1;
  return { rank, entry: mapRowToEntry(playerEntry, rank) };
}

/**
 * Subscribe to realtime leaderboard changes for a given category.
 * Fires callback on INSERT, UPDATE, or DELETE events.
 * Returns an unsubscribe function for cleanup.
 */
export function subscribeToLeaderboard(
  category: string = 'overall',
  callback: (payload: RealtimePayload) => void
): { unsubscribe: () => void } {
  const channel = supabase
    .channel('leaderboard:' + category)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'global_leaderboards',
        filter: 'category=eq.' + category,
      },
      (payload) => {
        callback({
          eventType: payload.eventType as RealtimePayload['eventType'],
          new: payload.new ?? null,
          old: payload.old ?? null,
          table: payload.table,
          schema: payload.schema,
          commit_timestamp: payload.commit_timestamp,
        });
      }
    )
    .subscribe();

  return {
    unsubscribe: () => {
      supabase.removeChannel(channel);
    },
  };
}

/**
 * Update the calling player's leaderboard entry.
 * Only updates fields provided in the updates object.
 * RLS ensures player can only update their own entry.
 */
export async function updateLeaderboardEntry(updates: {
  score?: number;
  level?: number;
  reputation?: number;
  totalCredits?: number;
  operationsCompleted?: number;
}): Promise<{ success: boolean; error?: string }> {
  const session = await getAuthSession();
  if (!session || isAnonymous(session)) {
    return { success: false, error: 'Anonymous users cannot update leaderboard entries.' };
  }

  const playerId = getUserId(session);
  if (!playerId) {
    return { success: false, error: 'Unable to determine player ID.' };
  }

  const updateData: Record<string, unknown> = {
    last_updated: new Date().toISOString(),
  };

  if (updates.score !== undefined) updateData.score = updates.score;
  if (updates.level !== undefined) updateData.level = updates.level;
  if (updates.reputation !== undefined) updateData.reputation = updates.reputation;
  if (updates.totalCredits !== undefined) updateData.total_credits = updates.totalCredits;
  if (updates.operationsCompleted !== undefined) updateData.operations_completed = updates.operationsCompleted;

  const { error } = await supabase
    .from('global_leaderboards')
    .update(updateData)
    .eq('player_id', playerId)
    .eq('category', 'overall');

  if (error) {
    console.error('[Leaderboard] Failed to update entry:', error.message);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Map a Supabase row to a LeaderboardEntry with computed rank.
 */
function mapRowToEntry(row: Record<string, unknown>, rank: number): LeaderboardEntry {
  return {
    rank,
    username: (row.username as string) || 'Anonymous',
    level: (row.level as number) || 1,
    reputation: (row.reputation as number) || 0,
    totalCredits: Number(row.total_credits) || 0,
    operationsCompleted: Number(row.operations_completed) || 0,
    successRate: 0, // Computed from operations data on the client
    lastActive: row.last_updated
      ? formatRelativeTime(row.last_updated as string)
      : 'Unknown',
    change: 'same',
    changeAmount: 0,
    isCurrentPlayer: false,
  };
}

/**
 * Format a timestamp as a relative time string (e.g., "2 minutes ago").
 */
function formatRelativeTime(timestamp: string): string {
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now.getTime() - then.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
  if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
  return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
}
