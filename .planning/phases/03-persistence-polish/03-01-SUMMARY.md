---
phase: "03"
plan: "01"
subsystem: persistence
tags:
  - indexeddb
  - zustand-persist
  - offline-progress
  - auto-save
dependency_graph:
  requires: []
  provides:
    - "IndexedDB storage adapter (idbStorage)"
    - "Persisted Zustand store"
    - "Auto-save every 30 seconds"
    - "Offline progress calculation"
  affects:
    - "src/store/gameStore.ts"
    - "src/hooks/useGameLoop.ts"
    - "src/lib/idbStorage.ts"
tech_stack:
  added:
    - "idb-keyval@^6.2.2"
  patterns:
    - "Zustand persist middleware with custom storage"
    - "IndexedDB via idb-keyval wrapper"
    - "setInterval-based auto-save"
    - "beforeunload handler for tab-close save"
key_files:
  created:
    - "src/lib/idbStorage.ts"
    - "src/tests/persistence.test.ts"
  modified:
    - "src/store/gameStore.ts"
    - "src/hooks/useGameLoop.ts"
    - "package.json"
decisions:
  - "Used idb-keyval instead of raw IndexedDB API — simpler, 295-byte wrapper"
  - "Persist partialize excludes: notifications, activeTab, aiActive, aiLastDecision, currentOperation, activeQuests, completedQuests, guild/companion/social data"
  - "Offline progress formula: min(elapsed, 8h) × rate × (elapsed > 2h ? 0.5 : 1.0) — diminishing multiplier applies to entire capped duration"
  - "Auto-save triggers via setLastUpdate which is in partialize list, causing persist to save"
  - "5-second minimum elapsed threshold before offline progress is calculated"
metrics:
  duration: "~5 minutes"
  completed_date: "2026-05-21T02:23:00Z"
  tasks_completed: 1
  tests_added: 14
  tests_passing: 14
---

# Phase 03 Plan 01: Persistence Core Summary

**One-liner:** IndexedDB storage adapter with Zustand persist middleware, auto-save every 30 seconds, beforeunload save, and offline progress calculation with 8-hour cap and diminishing returns after 2 hours.

## Implementation

### What Was Built

1. **IndexedDB Storage Adapter** (`src/lib/idbStorage.ts`)
   - Zustand-compatible storage interface using idb-keyval
   - `getItem`: retrieves and JSON-parses stored value, returns null if missing
   - `setItem`: JSON-stringifies and stores value in IndexedDB
   - `removeItem`: deletes key from IndexedDB
   - Uses idb-keyval's default database (no custom DB name needed)

2. **Persisted Zustand Store** (`src/store/gameStore.ts`)
   - Wrapped store creation with `persist()` middleware
   - Storage engine: `idbStorage` (custom IndexedDB adapter)
   - Store name: `'ai-idle-hacker-game'`
   - Partialized fields: `player`, `skills`, `equipment`, `targets`, `achievements`, `operations`, `lastUpdate`
   - Excluded from persistence: `notifications`, `activeTab`, `aiActive`, `aiLastDecision`, `currentOperation`, `activeQuests`, `completedQuests`, guild/companion/social data
   - Removed old commented-out persist block

3. **Auto-Save + Offline Progress** (`src/hooks/useGameLoop.ts`)
   - Auto-save: `setInterval(30000)` calls `setLastUpdate(Date.now())`, triggering persist save
   - Beforeunload handler: calls `setLastUpdate(Date.now())` on tab close
   - Offline progress on visibility change (tab becomes visible):
     - Calculates elapsed time since `lastUpdate`
     - Only triggers if elapsed > 5 seconds
     - Formula: `min(elapsed, 8h) × rate × (elapsed > 2h ? 0.5 : 1.0)`
     - Updates player credits and shows notification

### Tests Added (14 passing)

- `idbStorage`: 4 tests (getItem with data, getItem null, setItem, removeItem)
- `Zustand persist integration`: 2 tests (store wrapped, partialize fields)
- `Offline progress calculation`: 5 tests (1h no diminishing, 4h diminishing, 8h cap, <5s threshold, multiplier scope)
- `Auto-save interval`: 2 tests (triggers every 30s, callback calls setLastUpdate)
- `beforeunload handler`: 1 test (calls setLastUpdate)

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None.

## Threat Flags

| Flag | File | Description |
|------|------|-------------|
| threat_flag: tampering | src/lib/idbStorage.ts | Client-side IndexedDB storage — user can inspect/modify via DevTools (T-03-01, accepted) |
| threat_flag: tampering | src/hooks/useGameLoop.ts | Offline progress calculation vulnerable to system clock manipulation (T-03-03, mitigated by 8h cap + diminishing returns) |

## Verification

- [x] `npm run check` passes with no errors
- [x] `npm run test:run` — 14/14 tests passing
- [x] idb-keyval installed in package.json dependencies
- [x] src/lib/idbStorage.ts exists with exported idbStorage object
- [x] src/store/gameStore.ts uses persist() wrapper with idbStorage
- [x] useGameLoop.ts has setInterval(30000) auto-save
- [x] useGameLoop.ts has beforeunload handler
- [x] useGameLoop.ts calculates offline progress with 8h cap and 0.5x diminishing after 2h

## Self-Check: PASSED
