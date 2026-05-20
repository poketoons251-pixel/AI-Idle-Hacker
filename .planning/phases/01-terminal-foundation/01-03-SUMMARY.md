---
phase: 01-terminal-foundation
plan: 03
subsystem: terminal
tags: [command-registry, ansi-colors, crt-effects, terminal-container]
dependency_graph:
  requires:
    - "01-01 (XtermTerminal.tsx exists)"
  provides:
    - "Typed command registry with handler map"
    - "ANSI color helper functions"
    - "4 system commands (help, clear, status, scan)"
    - "CRT scanline/flicker CSS overlays"
    - "TerminalContainer wrapping xterm with CRT effects"
  affects:
    - "XtermTerminal.tsx (added onTerminalReady prop)"
    - "index.css (added CRT CSS import)"
tech_stack:
  added: []
  patterns:
    - "Command Registry pattern (typed handler map, no switch/case)"
    - "Singleton export for command registry"
    - "CSS overlay with pointer-events: none for non-blocking visuals"
    - "Callback prop pattern for Terminal instance access"
key_files:
  created:
    - src/lib/commandRegistry.ts
    - src/lib/terminalColors.ts
    - src/commands/system.ts
    - src/styles/crt-effects.css
    - src/components/TerminalContainer.tsx
  modified:
    - src/components/XtermTerminal.tsx
    - src/index.css
decisions:
  - "Removed terminal.addToHistory call from TerminalContainer — GameState interface has no terminal property yet; optional chaining not sufficient to satisfy TypeScript"
  - "Used Array.from() pattern implicitly via for...of on Map.values() — works with ES2020 target in project tsconfig"
metrics:
  duration: "~5 minutes"
  completed_date: "2026-05-20"
  tasks_completed: 2
  tasks_total: 2
  files_created: 5
  files_modified: 2
---

# Phase 01 Plan 03: Command Registry, CRT Effects & TerminalContainer Summary

**One-liner:** Typed command registry with 4 system commands, ANSI color helpers, CRT scanline/flicker CSS overlays, and TerminalContainer integrating xterm.js with cyberpunk visual effects.

## Tasks Completed

### Task 1: Command Registry, Terminal Colors, System Commands

Created three files implementing the typed command registry pattern:

- **`src/lib/terminalColors.ts`** — 11 ANSI color helper functions (green, brightGreen, pink, brightPink, cyan, brightCyan, red, yellow, bold, dim, underline)
- **`src/lib/commandRegistry.ts`** — `CommandRegistry` class with `register()`, `get()`, `getAll()`, `getNames()`, `execute()`, `autocomplete()` methods. Exports singleton `commandRegistry`. Typed `CommandContext` and `CommandDefinition` interfaces. Category type: `'system' | 'hacking' | 'operations' | 'navigation' | 'info'`
- **`src/commands/system.ts`** — Registers 4 commands:
  - `help` (aliases: `h`, `?`) — Lists all commands grouped by category with colored headers
  - `clear` (aliases: `cls`) — Clears terminal via `ctx.term.clear()`
  - `status` (aliases: `stat`) — Displays player status (Level, Credits, XP, Energy, Reputation) in cyan-bordered box
  - `scan` — Lists unlocked targets with difficulty bars (█/░) and security levels

**Commit:** `2dc915e`

### Task 2: CRT Effects CSS and TerminalContainer

Created CRT visual effects and TerminalContainer wrapper:

- **`src/styles/crt-effects.css`** — CRT scanlines (`::before` pseudo-element), screen curvature (`::after` inner shadow), animated scanline bar (8s cycle), CRT flicker animation (4s cycle). All overlays use `pointer-events: none` and GPU-composited properties (transform/opacity).
- **`src/index.css`** — Added `@import './styles/crt-effects.css';` at end
- **`src/components/XtermTerminal.tsx`** — Added `onTerminalReady?: (term: Terminal) => void` prop, called after `term.open()` and `fitAddon.fit()`
- **`src/components/TerminalContainer.tsx`** — Renders XtermTerminal inside `.terminal-wrapper` div with `.scanline-bar` and `.crt-flicker` overlay divs. `handleCommand` callback echoes input, executes via `commandRegistry.execute()`, writes new prompt on completion. Fixed height `h-[600px]`. Side-effect imports `../commands/system` to auto-register commands.

**Commit:** `4e3405f`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Removed terminal.addToHistory call**
- **Found during:** Task 2
- **Issue:** Plan referenced `useGameStore.getState().terminal?.addToHistory?.(input)` but GameState interface has no `terminal` property. TypeScript error TS2339 even with optional chaining.
- **Fix:** Removed the line entirely — it was a no-op placeholder for future terminal history functionality. Does not affect current plan goals.
- **Files modified:** src/components/TerminalContainer.tsx

## Known Stubs

None — all functionality specified in the plan is fully implemented.

## Threat Flags

None — all created files are covered by the plan's existing threat model (T-01-06, T-01-07, T-01-08). No new network endpoints, auth paths, or trust boundaries introduced.

## Self-Check: PASSED

- [x] `src/lib/commandRegistry.ts` exists and compiles
- [x] `src/lib/terminalColors.ts` exists and compiles
- [x] `src/commands/system.ts` exists and compiles
- [x] `src/styles/crt-effects.css` exists with scanlines, flicker, scanline-bar
- [x] CRT CSS imported in index.css
- [x] `src/components/TerminalContainer.tsx` exists and compiles
- [x] TerminalContainer renders XtermTerminal inside CRT wrapper
- [x] XtermTerminal has `onTerminalReady` prop
- [x] All overlays have `pointer-events: none`
- [x] 4 system commands registered on import
