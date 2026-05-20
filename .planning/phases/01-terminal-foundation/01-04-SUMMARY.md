---
phase: 01-terminal-foundation
plan: 04
subsystem: game-loop
tags: [web-worker, zustand, react-hooks, game-loop, xterm-js]

# Dependency graph
requires:
  - phase: 01-terminal-foundation-01
    provides: XtermTerminal component, xterm.js packages, CRT effects CSS
  - phase: 01-terminal-foundation-03
    provides: TerminalContainer wrapper, command registry, system commands
provides:
  - Dedicated tick timer Web Worker (10 ticks/sec)
  - useGameLoop hook with worker lifecycle management
  - Dashboard integration with TerminalContainer as primary interface
  - Energy regeneration game loop (+1 energy/sec)
  - Periodic [SYSTEM] terminal output every 5 seconds
  - Visibility change handler for offline progress foundation
affects: [02-idle-calculations, 03-offline-progress, all future phases needing game loop]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Web Worker timing via setTimeout (not setInterval) to prevent drift"
    - "Vite worker bundling: new URL('../workers/gameLoopWorker.ts', import.meta.url)"
    - "Tick accumulator pattern: batch store updates to once per second"
    - "Zustand getState() in callbacks to avoid stale closures"
    - "Terminal ref forwarding via onTerminalReady prop chain"

key-files:
  created:
    - src/workers/gameLoopWorker.ts
    - src/hooks/useGameLoop.ts
  modified:
    - src/pages/Dashboard.tsx
    - src/components/TerminalContainer.tsx

key-decisions:
  - "Energy regeneration as Phase 1 proof-of-concept (not idle credit generation)"
  - "Tick accumulator batches to 1-second intervals to avoid re-render storms"
  - "onTerminalReady prop chain: Dashboard → TerminalContainer → XtermTerminal"

patterns-established:
  - "Game loop: Worker ticks → main thread accumulator → Zustand store update → render"
  - "Worker only handles timing; game logic runs on main thread"
  - "START/STOP message protocol for worker lifecycle control"

requirements-completed: [TERM-02]

# Metrics
duration: 8min
completed: 2026-05-20
---

# Phase 01 Plan 04: Game Loop Skeleton Summary

**Game loop worker with tick accumulator, energy regeneration, and TerminalContainer integrated into Dashboard as primary interface**

## Performance

- **Duration:** 8 min
- **Started:** 2026-05-20T~14:00:00Z
- **Completed:** 2026-05-20T~14:08:00Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments

- Created dedicated Web Worker (gameLoopWorker.ts) firing ticks at 10/sec using setTimeout
- Created useGameLoop hook managing worker lifecycle with tick accumulator (1-second batching)
- Integrated TerminalContainer into Dashboard as first major section below header
- Energy regeneration: +1 energy per second, capped at maxEnergy
- Terminal receives periodic [SYSTEM] messages every 5 seconds with credit count
- Visibility change handler records timestamp for future offline progress (Phase 3)
- Build succeeds: gameLoopWorker bundled as separate chunk (0.29 kB)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create gameLoopWorker.ts** - `bc182a7` (feat)
2. **Task 2: Create useGameLoop hook** - `c8d20b2` (feat)
3. **Task 3: Wire TerminalContainer into Dashboard** - `76bb41d` (feat)

## Files Created/Modified

- `src/workers/gameLoopWorker.ts` - Dedicated tick timer worker (10 ticks/sec, START/STOP protocol)
- `src/hooks/useGameLoop.ts` - Worker lifecycle hook with tick accumulator and energy regen
- `src/pages/Dashboard.tsx` - Added TerminalContainer, useGameLoop, terminal ref forwarding
- `src/components/TerminalContainer.tsx` - Added onTerminalReady prop for ref forwarding

## Decisions Made

- Energy regeneration as Phase 1 proof-of-concept (idle credit generation deferred to Phase 2)
- Tick accumulator batches to 1-second intervals (every 10 ticks) to avoid re-render storms
- Zustand getState() used in worker callback (not hooks) to prevent stale closures
- onTerminalReady prop chain: Dashboard → TerminalContainer → XtermTerminal for terminal ref access

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed EnhancedQuestSystem import alias mismatch**
- **Found during:** Task 3 (Dashboard integration)
- **Issue:** Dashboard imported `NarrativeQuestSystem` as `EnhancedQuestSystem` alias, but JSX used both `<NarrativeQuestSystem />` (unimported) and `<EnhancedQuestSystem />` (aliased) — causing TS2304 error
- **Fix:** Changed import to `import NarrativeQuestSystem` and updated both JSX references to `<NarrativeQuestSystem />`
- **Files modified:** src/pages/Dashboard.tsx
- **Verification:** `npx tsc --noEmit` passes (only pre-existing test file errors remain)
- **Committed in:** 76bb41d (Task 3 commit)

---

**Total deviations:** 1 auto-fixed (1 bug fix)
**Impact on plan:** Pre-existing bug fix required for compilation. No scope creep.

## Issues Encountered

- `npx tsc --noEmit src/hooks/useGameLoop.ts` standalone fails with TS1343 on `import.meta.url` — this is a known TypeScript limitation when compiling single files without project context. Full project `npx tsc --noEmit` passes correctly. Vite handles `import.meta.url` worker bundling natively.

## Known Stubs

None — all functionality is wired and operational.

## Threat Flags

| Flag | File | Description |
|------|------|-------------|
| threat_flag:worker-message | src/workers/gameLoopWorker.ts | Worker posts tick numbers and timestamps to main thread — no player data sent (T-01-11: accepted) |
| threat_flag:tick-dos | src/workers/gameLoopWorker.ts | Tick rate capped at 10/sec via setTimeout (T-01-09: mitigated) |
| threat_flag:render-storm | src/hooks/useGameLoop.ts | Tick accumulator batches store updates to once/sec; getState() avoids re-render loops (T-01-10: mitigated) |

## Next Phase Readiness

- Game loop skeleton complete: tick → update state → render pattern operational
- Terminal displays game events from the loop (resource gains as output)
- Ready for Phase 2: idle credit generation can hook into the existing game loop
- Visibility change handler in place for Phase 3 offline progress calculation
- Old TerminalInterface.tsx still exists — should be deleted after verification

---
*Phase: 01-terminal-foundation*
*Completed: 2026-05-20*

## Self-Check: PASSED

All files verified: gameLoopWorker.ts, useGameLoop.ts, Dashboard.tsx, TerminalContainer.tsx, SUMMARY.md
All commits verified: bc182a7, c8d20b2, 76bb41d
