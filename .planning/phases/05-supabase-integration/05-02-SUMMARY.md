---
phase: 05-supabase-integration
plan: 02
subsystem: cloud-sync
tags: [supabase, cloud-save, zustand, conflict-resolution]
dependency_graph:
  requires:
    - supabase client (src/lib/supabase.ts)
    - auth service (src/lib/supabaseAuth.ts)
    - game store (src/store/gameStore.ts)
  provides:
    - cloud save/load service with last-write-wins
    - Zustand store syncToCloud/syncFromCloud actions
    - idbStorage cloud sync hook
  affects:
    - src/lib/cloudSyncService.ts (new)
    - src/lib/idbStorage.ts (extended)
    - src/store/gameStore.ts (extended)
tech_stack:
  added: []
  patterns:
    - upsert with onConflict for last-write-wins
    - try/catch isolation for cloud sync failures
    - timestamp-based conflict detection (5-minute threshold)
key_files:
  created:
    - src/lib/cloudSyncService.ts
    - src/lib/cloudSyncService.test.ts
  modified:
    - src/lib/idbStorage.ts
    - src/store/gameStore.ts
decisions:
  - Cloud sync in idbStorage checks for Zustand persist wrapper structure (value.state.player) rather than raw state
  - syncToCloud excludes UI state (activeTab, notifications) from cloud payload per spec
  - syncFromCloud returns conflict info without overwriting — user must resolve manually
  - PGRST116 error code used to detect "no rows found" for graceful null returns
metrics:
  duration_minutes: ~15
  completed_date: "2026-05-21"
  tasks_completed: 2
  tests_added: 15
---

# Phase 05 Plan 02: Cloud Sync Service Summary

**One-liner:** Cloud save/load service with last-write-wins conflict resolution (5-minute threshold, cloud wins), Zustand store extended with syncToCloud/syncFromCloud actions, and idbStorage hooked for auto cloud sync on local save.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create cloud sync service with save/load and conflict detection | `bbd8a4f` | `src/lib/cloudSyncService.ts` (new), `src/lib/cloudSyncService.test.ts` (new) |
| 2 | Extend Zustand store with cloud sync integration | `e6e2f71` | `src/lib/idbStorage.ts`, `src/store/gameStore.ts` |

## Implementation Details

### Task 1: Cloud Sync Service (`src/lib/cloudSyncService.ts`)

**Exports:**
- `saveToCloud(gameState)`: Serializes game state, validates < 100KB, upserts to `game_saves` with `onConflict: 'player_id'`. Rejects anonymous users.
- `loadFromCloud()`: Fetches `save_data` from `game_saves`. Returns `{ success: true, data: null }` for PGRST116 (no rows).
- `checkSyncConflict(localTimestamp)`: Compares timestamps with 300,000ms (5-minute) threshold. Returns `resolution: 'cloud'` when conflict detected (per D-02 last-write-wins).
- `getCloudSaveTimestamp()`: Lightweight query for `save_timestamp` column only.

**Tests:** 15 unit tests covering all behavior requirements — anonymous rejection, size validation, upsert, PGRST116 handling, conflict detection thresholds.

### Task 2: Zustand Store Integration

**idbStorage.ts:**
- `setItem` extended with cloud sync hook after local save
- Checks for Zustand persist wrapper structure (`value.state.player` and `value.state.lastUpdate`)
- Wrapped in try/catch — cloud save failures never break local save (per T-05-09)

**gameStore.ts:**
- Added `cloudSync` state: `{ lastCloudSync: null, syncStatus: 'idle', syncError: null }`
- Added `syncToCloud()`: Saves game data excluding UI state (activeTab, notifications). Updates cloudSync status through syncing → synced/error.
- Added `syncFromCloud()`: Loads from cloud, checks conflict before overwriting. Returns conflict info when timestamps differ > 5 minutes. Merges cloud data into store when no conflict.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None.

## Threat Flags

| Flag | File | Description |
|------|------|-------------|
| threat_flag: tampering | src/lib/cloudSyncService.ts | saveToCloud sends full game state JSON to Supabase; RLS policy must enforce `auth.uid() = player_id` (already in Plan 01 migration) |
| threat_flag: information_disclosure | src/lib/cloudSyncService.ts | loadFromCloud reads other players' data only if RLS is misconfigured; RLS policy restricts SELECT to `auth.uid() = player_id` |

## Self-Check: PASSED

- [x] `src/lib/cloudSyncService.ts` exists with 4 exports
- [x] `src/lib/cloudSyncService.test.ts` exists with 15 passing tests
- [x] `src/lib/idbStorage.ts` extended with cloud sync hook
- [x] `src/store/gameStore.ts` extended with cloudSync state and sync actions
- [x] TypeScript compiles without errors (`npx tsc --noEmit`)
- [x] Commit `bbd8a4f`: Task 1 — cloud sync service
- [x] Commit `e6e2f71`: Task 2 — Zustand store integration
