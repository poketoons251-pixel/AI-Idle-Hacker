/**
 * AI Edge Function Client — Browser-side wrapper for calling the Supabase
 * Edge Function that runs LLM-enhanced strategic decisions.
 * 
 * This module handles:
 * - Calling the Edge Function with game state
 * - Network error handling (graceful fallback)
 * - Timeout management (30s client timeout, Edge Function has 150s)
 * - Response parsing into EdgeFunctionResponse format
 * 
 * Per AI-05: All LLM calls go through Edge Functions, NOT browser-side.
 * Per T-04-09: Client rate-limits to max 1 call per 30 seconds.
 * Per T-04-10: Uses Supabase function invocation pattern.
 */

import { supabase as supabaseClient } from '../lib/supabase';
import type { AIDecision } from '../store/gameStore';

// --- Types ---

export interface EdgeFunctionRequest {
  gameState: {
    credits: number;
    creditsPerSecond: number;
    level: number;
    energy: number;
    skillPoints: number;
    equipment: Array<{ id: string; name: string; level: number; bonus: number; equipped: boolean; upgradeCost: number }>;
    targets: Array<{ id: string; name: string; difficulty: number; rewards: { credits: number } }>;
    aiConfig: { priorities: Record<string, number>; riskTolerance: number; resourceAllocation: Record<string, number> };
  };
  recentActions: Array<{ action: string; result: string; timestamp: number }>;
}

export interface EdgeFunctionResponse {
  decision: AIDecision | null;
  error?: string;
}

// --- Rate Limiting ---

const RATE_LIMIT_WINDOW_MS = 30_000; // 30 seconds between LLM calls
let lastCallTime = 0;

/**
 * Check if we're within the rate limit window.
 * Returns true if a call should be allowed.
 */
function isRateLimited(): boolean {
  const now = Date.now();
  return (now - lastCallTime) < RATE_LIMIT_WINDOW_MS;
}

/**
 * Record that a call was made (for rate limiting).
 */
function recordCall(): void {
  lastCallTime = Date.now();
}

// --- Edge Function Caller ---

/**
 * Call the AI decision Edge Function with the current game state.
 * 
 * Uses supabase.functions.invoke() for authenticated function calls.
 * Falls back to direct fetch if Supabase client is unavailable.
 * 
 * @param request - Game state and recent actions for LLM context
 * @returns EdgeFunctionResponse with validated AIDecision or error
 */
export async function fetchAIDecision(request: EdgeFunctionRequest): Promise<EdgeFunctionResponse> {
  // Rate limit check
  if (isRateLimited()) {
    return { decision: null, error: 'Rate limited: max 1 LLM call per 30 seconds' };
  }

  recordCall();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30_000); // 30s client timeout

  try {
    // Try Supabase function invocation first
    const { data, error } = await supabaseClient.functions.invoke('ai-decision', {
      body: request,
    });

    if (error) {
      // Supabase invocation failed — try direct fetch as fallback
      return await fetchDirect(request, controller.signal);
    }

    return data as EdgeFunctionResponse;
  } catch (e) {
    // Supabase client threw — try direct fetch as fallback
    try {
      return await fetchDirect(request, controller.signal);
    } catch (fallbackError) {
      return {
        decision: null,
        error: `Network error: ${fallbackError instanceof Error ? fallbackError.message : 'unknown'}`,
      };
    }
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Direct fetch to the Edge Function URL (fallback path).
 * 
 * Uses the Supabase project URL + /functions/v1/ai-decision endpoint.
 * The anon key is sent for authentication.
 */
async function fetchDirect(
  request: EdgeFunctionRequest,
  signal: AbortSignal
): Promise<EdgeFunctionResponse> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return { decision: null, error: 'Supabase configuration missing' };
  }

  const functionUrl = `${supabaseUrl}/functions/v1/ai-decision`;

  const response = await fetch(functionUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseAnonKey}`,
      'apikey': supabaseAnonKey,
    },
    body: JSON.stringify(request),
    signal,
  });

  if (!response.ok) {
    throw new Error(`Edge Function returned ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  return data as EdgeFunctionResponse;
}
