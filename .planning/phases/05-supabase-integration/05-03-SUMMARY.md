---
phase: 05-supabase-integration
plan: 03
subsystem: leaderboards
tags: [supabase, leaderboards, realtime, settings]
dependency_graph:
  requires:
    - supabase client (src/lib/supabase.ts)
    - auth service (src/lib/supabaseAuth.ts)
    - game store (src/store/gameStore.ts)
  provides:
    - leaderboard CRUD service with realtime subscription
    - Leaderboards page wired to real Supabase data
    - Settings privacy toggle wired to leaderboard visibility
  affects:
    - src/lib/leaderboardService.ts (new)
    - src/pages/Leaderboards.tsx (rewired from mock data)
    - src/pages/Settings.tsx (wired toggle)
tech_stack:
  added: []
  patterns:
    - upsert with onConflict for leaderboard score submissions
    - postgres_changes for realtime leaderboard updates
    - RLS-scoped update for player own entries
key_files:
  created:
    - src/lib/leaderboardService.ts
    - src/lib/leaderboardService.test.ts
  modified:
    - src/pages/Leaderboards.tsx
decisions:
  - Leaderboards are the ONLY realtime feature in v1 scope (per D-03)
  - No Edge Functions needed — rules-based AI runs in browser (per D-04)
  - Anonymous users cannot submit scores — must link account first
  - Realtime subscription auto-refetches leaderboard on INSERT/UPDATE/DELETE
  - Player score auto-submits on milestone changes (level, reputation, credits)
  - Edge Function code annotated with deprecation comments referencing D-04
metrics:
  duration_minutes: ~20
  completed_date: "2026-05-22"
  tasks_completed: 3
  tests_added: 5
---

# Phase 05 Plan 03: Leaderboard Summary

**One-liner:** Leaderboard service with Supabase queries and realtime, Leaderboards page wired to real data, Settings privacy toggle wired, Edge Function references deprecated per D-04.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Remove Edge Function references and confirm rules-based AI in browser | `4c1e985` | Various (deprecation comments) |
| 2 | Create leaderboard service with Supabase queries and realtime subscription | `b8692a8` | `src/lib/leaderboardService.ts` (new), `src/lib/leaderboardService.test.ts` (new) |
| 3 | Wire Leaderboards page to real Supabase data and add realtime updates | `65459ec` | `src/pages/Leaderboards.tsx` |

## Implementation Details

### Task 1: Edge Function Deprecation (Commit `4c1e985`)
- Per D-04, confirmed rules-based AI engine (`aiDecisionEngine.ts`) is the active decision maker
- Added deprecation comments to `src/lib/aiEdgeFunctionClient.ts` and `api/functions/ai-decision.ts`
- Verified `gameStore.ts` `makeAIDecision` calls `makeStrategicDecision` from `aiDecisionEngine.ts`

### Task 2: Leaderboard Service (`src/lib/leaderboardService.ts`) (Commit `b8692a8`)

**Exports:**
- `getLeaderboard(category, limit)`: Queries `global_leaderboards` ordered by score DESC, maps to `LeaderboardEntry` with computed rank
- `submitScore(entry)`: Upserts to `global_leaderboards` with `onConflict: 'player_id,category'`. Rejects anonymous users.
- `getPlayerRank(category)`: Gets player's entry, counts entries with higher score for rank computation
- `subscribeToLeaderboard(category, callback)`: Creates `postgres_changes` channel for realtime INSERT/UPDATE/DELETE. Returns unsubscribe function.
- `updateLeaderboardEntry(updates)`: RLS-scoped update — only the calling player's entry

**Tests:** 5 unit tests covering getLeaderboard, submitScore, getPlayerRank, subscribeToLeaderboard, updateLeaderboardEntry.

### Task 3: Leaderboards Page (`src/pages/Leaderboards.tsx`) (Commit `65459ec`)
- Removed `mockLeaderboardData` array — data comes from Supabase
- Added real data loading via `getLeaderboard()` and `getPlayerRank()` in useEffect
- Added realtime subscription via `subscribeToLeaderboard()` with cleanup on unmount
- Added auto-submit: `submitPlayerScore()` calls `updateLeaderboardEntry()` when player.level/reputation/credits change
- Added loading state (spinner), error state ("Unable to load leaderboard" + retry button), empty state ("No data yet")
- Anonymous users see "Link your account to appear on leaderboards" message
- Player rank, reputation, level, credits shown in StatCards
- Sort controls preserved (reputation, level, credits, operations, success rate)

### Settings (`src/pages/Settings.tsx`)
- `showOnLeaderboard` toggle already existed in the privacy section
- Wired to game store — no code changes needed (already connected)

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None.

## Threat Flags

| Flag | File | Description |
|------|------|-------------|
| threat_flag: tampering | src/lib/leaderboardService.ts | submitScore sends scores to Supabase; RLS enforces `auth.uid() = player_id` per Plan 01 migration |
| threat_flag: information_disclosure | src/lib/leaderboardService.ts | Leaderboard is intentionally public (per D-03); only shows username, level, score — no email or personal info |

## Self-Check: PASSED

- [x] `src/lib/leaderboardService.ts` exists with 5 exports
- [x] `src/lib/leaderboardService.test.ts` exists with 5 test suites
- [x] `src/pages/Leaderboards.tsx` wired to real Supabase data, no mock data
- [x] Realtime subscription with cleanup on unmount
- [x] Loading, error, empty, and anonymous states implemented
- [x] Player score auto-submits on milestone changes
- [x] Edge Function code annotated with deprecation comments per D-04
- [x] Build passes (`npm run build`)
- [x] Deployed to GitHub Pages
- [x] Commit `4c1e985`: Task 1 — Edge Function deprecation
- [x] Commit `b8692a8`: Task 2 — leaderboard service
- [x] Commit `65459ec`: Task 3 — Leaderboards page
