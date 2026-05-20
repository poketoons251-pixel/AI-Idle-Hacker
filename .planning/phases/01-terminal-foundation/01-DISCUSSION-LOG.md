# Phase 1 Discussion Log — Terminal Foundation

**Date:** 2026-05-20
**Phase:** 1 — Terminal Foundation

## Areas Discussed

### 1. Terminal Approach
- **Options considered:** Replace entirely with xterm.js, wrap/extend current component, hybrid approach
- **Decision:** Replace entirely with xterm.js
- **Rationale:** Current component too basic (235 lines, hardcoded switch, no ANSI support). xterm.js is industry standard, used by VS Code/Hyper, provides authentic terminal feel with WebGL rendering.

### 2. Game Loop Timing
- **Options considered:** requestAnimationFrame, setInterval/setTimeout, Web Worker
- **Decision:** Web Worker
- **Rationale:** Already have infrastructure (`idleWorker.ts`, `useIdleProgression.ts`). Tab-safe timing critical for idle games. Accurate timing without blocking main thread.

### 3. Resource Display
- **Options considered:** Inside terminal, sidebar overlay, HUD bar at top
- **Decision:** HUD bar at top
- **Rationale:** Classic idle game pattern. Always visible without taking focus from terminal. Layout component already exists to host this.

### 4. Command Architecture
- **Options considered:** Hardcoded switch, command registry pattern, data-driven
- **Decision:** Command registry pattern
- **Rationale:** Extensible for Phase 2 hacking commands. Testable in isolation. Organized handlers. Data-driven deferred until 50+ commands.

### 5. Cyberpunk Effects
- **Options considered:** CRT scanlines + glow, typing animation, minimal, all effects
- **Decision:** CRT scanlines + neon glow
- **Rationale:** Sets cyberpunk mood immediately. CSS-only, zero performance cost. Typing animation too slow for idle game output frequency.

## Deferred Ideas
- Typing animation for terminal output (too slow for idle game)
- Data-driven command system (defer until 50+ commands)
- Matrix rain / glitch effects (Phase 6)
