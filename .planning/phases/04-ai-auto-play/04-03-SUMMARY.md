---
phase: 04-ai-auto-play
plan: 03
type: execute
wave: 2
depends_on:
  - "01"
  - "02"
subsystem: ai-auto-play
tags:
  - edge-functions
  - llm-integration
  - hybrid-ai
  - supabase
requires:
  - "04-01: AI Auto-Play Controls & Decision Loop"
  - "04-02: AI Decision Engine & Settings"
provides:
  - "LLM-enhanced strategic decisions via Supabase Edge Functions"
  - "Hybrid decision engine (rules + LLM fallback)"
  - "Client wrapper with rate limiting and error handling"
affects:
  - "src/lib/aiDecisionEngine.ts"
  - "src/store/gameStore.ts"
  - "src/hooks/useGameLoop.ts"
  - "src/pages/AIAutoplay.tsx"
tech-stack:
  added:
    - "Supabase Edge Functions (Deno runtime)"
    - "Anthropic Claude Haiku API"
  patterns:
    - "Hybrid AI: rules-based fast path + LLM strategic override"
    - "Rate limiting (30s window) for LLM calls"
    - "Graceful fallback: LLM failure → rules-based decision"
    - "Async decision making in game loop"
key-files:
  created:
    - "api/functions/ai-decision.ts (360 lines)"
    - "src/lib/aiEdgeFunctionClient.ts (141 lines)"
  modified:
    - "src/lib/aiDecisionEngine.ts (+90 lines, added makeStrategicDecisionWithLLM)"
    - "src/store/gameStore.ts (makeAIDecision → async)"
    - "src/hooks/useGameLoop.ts (async decision handling)"
    - "src/pages/AIAutoplay.tsx (async decision handling)"
    - "tsconfig.json (exclude api/functions)"
decisions:
  - "Used Anthropic Claude Haiku for cost-effective strategic decisions (per STACK.md model tiering)"
  - "Edge Function uses Deno std http/server for Supabase compatibility"
  - "Client uses browser-side supabase client (src/lib/supabase.ts) not server-side (api/config/supabase.ts)"
  - "Rate limit: 1 LLM call per 30 seconds (per T-04-09 threat mitigation)"
  - "Client timeout: 30s (Edge Function has 150s timeout)"
  - "tsconfig excludes api/functions (Deno runtime not compatible with browser TypeScript)"
  - "Hybrid threshold: confidence < 0.5 AND riskTolerance > 0.4 triggers LLM consultation"
metrics:
  duration: "~15 minutes"
  completed: "2026-05-21"
  tasks_completed: 2
  tasks_total: 2
  files_created: 2
  files_modified: 5
---

# Phase 4 Plan 03: AI Edge Functions Integration Summary

**One-liner:** Supabase Edge Function for LLM-enhanced AI strategic decisions with hybrid rules+LLM decision engine, rate-limited client wrapper, and graceful fallback to rules-based decisions.

## Tasks Completed

### Task 1: Create Supabase Edge Function for AI decision making
**Commit:** `8b127c6`
**Files:** `api/functions/ai-decision.ts` (360 lines)

Created a Deno-based Supabase Edge Function that:
- Accepts POST requests with JSON body containing gameState (credits, level, equipment, targets, aiConfig, recentActions)
- Builds system and user prompts with game state context for LLM
- Calls Anthropic Claude Haiku API (cost-effective model per STACK.md tiering)
- Parses LLM response with markdown code block handling
- Validates AIDecision: type enum, targetId references valid equipment/targets, confidence clamped 0.0-1.0
- Returns `{ decision: AIDecision | null, error?: string }`
- Handles errors gracefully: LLM unavailable → null decision with error message
- API key read from `ANTHROPIC_API_KEY` environment variable (not hardcoded)
- CORS headers for browser client communication
- Per T-04-07: Response validated before returning
- Per T-04-09: Client-side rate limiting documented (max 1 call per 30s)

### Task 2: Create Edge Function client and integrate into hybrid decision engine
**Commit:** `cffb405`
**Files:** `src/lib/aiEdgeFunctionClient.ts`, `src/lib/aiDecisionEngine.ts`, `src/store/gameStore.ts`, `src/hooks/useGameLoop.ts`, `src/pages/AIAutoplay.tsx`

Created browser-side client wrapper (`aiEdgeFunctionClient.ts`):
- `fetchAIDecision(request)` calls Supabase Edge Function with game state
- Rate limiting: 30-second window between LLM calls (T-04-09 mitigation)
- 30-second client timeout (Edge Function has 150s)
- Dual-path: `supabase.functions.invoke()` → direct fetch fallback
- Network error handling: returns `{ decision: null, error: "Network error" }`

Integrated into hybrid decision engine (`aiDecisionEngine.ts`):
- Added `makeStrategicDecisionWithLLM()` async function
- Flow: rules-based first → if confidence < 0.5 AND riskTolerance > 0.4 → consult LLM
- LLM returns valid decision → use with "LLM consulted:" reasoning prefix
- LLM fails → fall back to rules-based decision (logged to console)
- Rules confidence >= 0.5 → use rules-based directly (no network call)

Updated gameStore and callers:
- `makeAIDecision()` now async, returns `Promise<AIDecision | null>`
- `useGameLoop.ts`: handles async with `.then()` (non-blocking)
- `AIAutoplay.tsx`: handles async with `await` in interval
- TypeScript compiles cleanly (0 errors)

## Deviations from Plan

None - plan executed exactly as written.

## Authentication Gates

None encountered during execution.

## Threat Flags

| Flag | File | Description |
|------|------|-------------|
| threat_flag:information_disclosure | api/functions/ai-decision.ts | Game state sent to Anthropic API (per T-04-08: accepted — no PII in game data) |
| threat_flag:rate_limiting | src/lib/aiEdgeFunctionClient.ts | Client-side rate limiting implemented (30s window per T-04-09) |
| threat_flag:response_validation | api/functions/ai-decision.ts | LLM output validated: type enum, targetId existence, confidence range (per T-04-07) |

## Known Stubs

None. All functionality is wired end-to-end:
- Edge Function calls real LLM API (requires ANTHROPIC_API_KEY secret)
- Client calls real Edge Function (requires Supabase deployment)
- Hybrid decision engine integrates both paths
- Game loop handles async decisions non-blocking

## Verification

- [x] TypeScript compiles without errors: `npx tsc --noEmit` (0 errors)
- [x] Edge Function exists at api/functions/ai-decision.ts with Deno.serve handler
- [x] Edge Function accepts POST with gameState JSON body
- [x] Edge Function calls LLM API with game state prompt
- [x] Edge Function returns { decision: AIDecision | null, error?: string }
- [x] Edge Function validates decision type against allowed enum values
- [x] Edge Function handles LLM errors gracefully
- [x] API key read from environment variable (not hardcoded)
- [x] Client wrapper exists with export fetchAIDecision
- [x] fetchAIDecision handles network errors and timeouts gracefully
- [x] makeStrategicDecision calls LLM when rules confidence < 0.5
- [x] makeStrategicDecision falls back to rules-based when LLM unavailable
- [x] LLM-enhanced decisions include "LLM consulted:" in reasoning
- [x] Game loop continues working when Edge Function is unreachable (async, non-blocking)
- [x] No browser-side LLM API calls (all go through Edge Function)

## Self-Check: PASSED

All 8 files verified present. All 3 commits verified in git log.
