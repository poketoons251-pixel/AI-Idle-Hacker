---
phase: 04-ai-auto-play
plan: 01
type: execute
subsystem: ai-auto-play
tags: [ai, toggle, game-loop, terminal, reasoning]
dependency_graph:
  requires: []
  provides:
    - AI toggle UI component (HUD button)
    - Terminal ai on/off/status commands
    - AI decision loop integration (10s interval)
    - Terminal reasoning output (cyan [AI] prefix)
  affects:
    - HudBar.tsx (added AIToggle)
    - TerminalContainer.tsx (added ai commands import)
tech_stack:
  added: []
  patterns:
    - CustomEvent bridge for game-loop → terminal communication
    - Zustand selectors for AI state
    - Command registry pattern for terminal commands
key_files:
  created:
    - src/components/AIToggle.tsx
    - src/commands/ai.ts
  modified:
    - src/components/HudBar.tsx
    - src/components/XtermTerminal.tsx
    - src/hooks/useGameLoop.ts
    - src/components/TerminalContainer.tsx
decisions:
  - Used CustomEvent bridge (ai-terminal-output) for game-loop to terminal communication instead of direct terminal reference
  - AIToggle placed in HudBar right side, before username
  - AI decision counter resets to 0 after reaching 10 (every 10 seconds)
  - Terminal output uses cyan ANSI code \x1b[36m with [AI] prefix
metrics:
  duration: ~5 minutes
  completed_date: "2026-05-21T03:30:00Z"
  tasks_completed: 3
  files_created: 2
  files_modified: 4
---

# Phase 04 Plan 01: AI Auto-Play Controls & Decision Loop Summary

**One-liner:** AI toggle controls (HUD button + terminal commands) with 10-second decision loop and cyan terminal reasoning output.

## Tasks Completed

### Task 1: Create AI toggle component and wire to HUD + terminal commands

**Commit:** `f3b31f5`

- Created `src/components/AIToggle.tsx` — button with green circle (active) / gray circle (inactive), calls `toggleAI()` from gameStore
- Integrated AIToggle into `src/components/HudBar.tsx` — placed on right side of HUD bar, before username
- Created `src/commands/ai.ts` — registered `ai`, `ai on`, `ai off` commands in command registry
- Added `import '../commands/ai'` to `src/components/TerminalContainer.tsx`

**Acceptance criteria met:**
- ✅ AIToggle.tsx exists with export default (named export `AIToggle`)
- ✅ Renders button with green indicator when aiActive=true, gray when false
- ✅ onClick calls toggleAI() from gameStore
- ✅ HudBar.tsx imports and renders AIToggle
- ✅ Terminal accepts "ai on", "ai off", "ai" commands
- ✅ "ai on" enables AI, "ai off" disables AI, "ai" prints status

### Task 2: Integrate AI decision loop into game loop with 10-second interval

**Commit:** `105733e`

- Added `aiDecisionCounterRef` to `useGameLoop.ts`
- In `handleSecondTick`, increment counter every second; at 10, reset and run AI decision
- Checks `aiActive` before making decisions — skips when inactive
- Calls `makeAIDecision()` and `executeAIDecision()` from gameStore
- Dispatches reasoning and result to terminal via `CustomEvent('ai-terminal-output')`

**Acceptance criteria met:**
- ✅ useGameLoop.ts contains aiDecisionCounterRef and 10-second check logic
- ✅ When aiActive=true, makeAIDecision() is called every 10 seconds
- ✅ Terminal shows cyan [AI] reasoning lines before each action
- ✅ Terminal shows cyan [AI] result lines after each action
- ✅ When aiActive=false, no AI decisions are made
- ✅ Existing game loop behavior (energy regen, credit generation) unchanged

### Task 3: Wire AI decision output to terminal via event system

**Commit:** `105733e` (combined with Task 2)

- Added `window.addEventListener('ai-terminal-output', ...)` in XtermTerminal.tsx useEffect
- Event handler writes `event.detail.text` to `terminal.writeln()`
- Cleanup removes event listener on unmount
- Uses CustomEvent pattern — no direct terminal reference needed from game loop

**Acceptance criteria met:**
- ✅ XtermTerminal.tsx subscribes to AI output events
- ✅ AI reasoning lines appear in terminal with cyan color
- ✅ AI result lines appear in terminal with cyan color
- ✅ Terminal scrolls correctly with AI output mixed with other output

## Deviations from Plan

None — plan executed exactly as written.

**Note:** The plan referenced `HUD.tsx` but the actual file is `HudBar.tsx`. Adapted accordingly (Rule 3 — blocking issue fix).

## Threat Surface Scan

| Flag | File | Description |
|------|------|-------------|
| threat_flag: T-04-01 | src/store/gameStore.ts | AI decision execution validates decision type (mitigated by existing code) |
| threat_flag: T-04-03 | src/commands/ai.ts | Terminal ai on/off commands only affect local gameStore state (mitigated) |

## Known Stubs

None.

## Self-Check: PASSED

- ✅ `src/components/AIToggle.tsx` — exists
- ✅ `src/commands/ai.ts` — exists
- ✅ `src/components/HudBar.tsx` — modified
- ✅ `src/components/XtermTerminal.tsx` — modified
- ✅ `src/hooks/useGameLoop.ts` — modified
- ✅ `src/components/TerminalContainer.tsx` — modified
- ✅ Commit `f3b31f5` — Task 1
- ✅ Commit `105733e` — Tasks 2 & 3
- ✅ TypeScript compiles without errors
