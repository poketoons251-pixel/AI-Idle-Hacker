import { supabase } from './supabase';
import { getAuthSession, isAnonymous, getUserId } from './supabaseAuth';
import type { GameState } from '../store/gameStore';

/**
 * Cloud Sync Service — Save/load game state to Supabase with last-write-wins conflict detection.
 *
 * Per D-02: Upload entire game state (JSON under 100KB) on save.
 * Last-write-wins: if same account on multiple devices, most recent session wins.
 * Anonymous users cannot save to cloud (no persistent identity).
 */

const MAX_SAVE_SIZE_BYTES = 102400; // 100KB per D-02
const CONFLICT_THRESHOLD_MS = 300000; // 5 minutes

/**
 * Save game state to cloud (Supabase game_saves table).
 * Rejects anonymous users. Validates JSON size < 100KB.
 * Uses upsert with onConflict: 'player_id' for last-write-wins.
 */
export async function saveToCloud(
  gameState: Partial<GameState>
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getAuthSession();
    if (!session || isAnonymous(session)) {
      return { success: false, error: 'Must link account to save to cloud' };
    }

    const playerId = getUserId(session);
    if (!playerId) {
      return { success: false, error: 'Unable to determine player ID' };
    }

    const serializedState = JSON.stringify(gameState);

    if (serializedState.length > MAX_SAVE_SIZE_BYTES) {
      return {
        success: false,
        error: `Save data exceeds maximum size of 100KB (${Math.round(serializedState.length / 1024)}KB)`,
      };
    }

    const { error } = await supabase.from('game_saves').upsert(
      {
        player_id: playerId,
        save_data: gameState,
        device_info: { userAgent: navigator.userAgent },
        save_timestamp: new Date().toISOString(),
      },
      { onConflict: 'player_id' }
    );

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error during cloud save',
    };
  }
}

/**
 * Load game state from cloud (Supabase game_saves table).
 * Returns null data if no cloud save exists for the player.
 */
export async function loadFromCloud(): Promise<{
  success: boolean;
  data?: GameState | null;
  timestamp?: string;
  error?: string;
}> {
  try {
    const session = await getAuthSession();
    if (!session || isAnonymous(session)) {
      return { success: false, error: 'Must link account to load from cloud' };
    }

    const playerId = getUserId(session);
    if (!playerId) {
      return { success: false, error: 'Unable to determine player ID' };
    }

    const { data, error } = await supabase
      .from('game_saves')
      .select('save_data, save_timestamp')
      .eq('player_id', playerId)
      .single();

    // PGRST116 = no rows found
    if (error && error.code === 'PGRST116') {
      return { success: true, data: null };
    }

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      data: data.save_data as GameState,
      timestamp: data.save_timestamp as string,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error during cloud load',
    };
  }
}

/**
 * Check for sync conflicts between local and cloud save timestamps.
 * Returns conflict info when timestamps differ by more than 5 minutes.
 * Resolution is 'cloud' per D-02 last-write-wins.
 */
export async function checkSyncConflict(
  localTimestamp: number
): Promise<{
  hasConflict: boolean;
  cloudTimestamp?: string;
  localTimestamp: number;
  resolution?: 'cloud';
}> {
  try {
    const session = await getAuthSession();
    if (!session || isAnonymous(session)) {
      return { hasConflict: false, localTimestamp };
    }

    const playerId = getUserId(session);
    if (!playerId) {
      return { hasConflict: false, localTimestamp };
    }

    const { data, error } = await supabase
      .from('game_saves')
      .select('save_timestamp')
      .eq('player_id', playerId)
      .single();

    // No cloud save exists
    if (error && error.code === 'PGRST116') {
      return { hasConflict: false, localTimestamp };
    }

    if (error || !data?.save_timestamp) {
      return { hasConflict: false, localTimestamp };
    }

    const cloudTimestamp = data.save_timestamp;
    const cloudDate = new Date(cloudTimestamp);
    const localDate = new Date(localTimestamp);
    const diffMs = Math.abs(cloudDate.getTime() - localDate.getTime());

    if (diffMs > CONFLICT_THRESHOLD_MS) {
      return {
        hasConflict: true,
        cloudTimestamp,
        localTimestamp,
        resolution: 'cloud',
      };
    }

    return { hasConflict: false, localTimestamp };
  } catch {
    return { hasConflict: false, localTimestamp };
  }
}

/**
 * Get just the cloud save timestamp (lightweight query).
 * Returns null if no cloud save exists or user is anonymous.
 */
export async function getCloudSaveTimestamp(): Promise<string | null> {
  try {
    const session = await getAuthSession();
    if (!session || isAnonymous(session)) {
      return null;
    }

    const playerId = getUserId(session);
    if (!playerId) {
      return null;
    }

    const { data, error } = await supabase
      .from('game_saves')
      .select('save_timestamp')
      .eq('player_id', playerId)
      .single();

    if (error && error.code === 'PGRST116') {
      return null;
    }

    if (error || !data?.save_timestamp) {
      return null;
    }

    return data.save_timestamp;
  } catch {
    return null;
  }
}
