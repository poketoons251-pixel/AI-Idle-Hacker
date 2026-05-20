# Phase 1 Context — Terminal Foundation

## Domain

Player sees and interacts with a themed terminal as the primary game interface. This phase delivers the terminal UI, cyberpunk visual identity, HUD resource display, game loop skeleton, and command registry foundation.

## Requirements (from ROADMAP.md)

- **TERM-01**: Player sees an interactive terminal (xterm.js) as the primary game interface
- **TERM-02**: Terminal displays game events as formatted output (resource gains, purchases, hacks)
- **TERM-03**: Player can type commands in the terminal to initiate actions
- **TERM-04**: Terminal has cyberpunk theme (neon colors, dark background, custom font)
- **TERM-05**: Terminal supports ANSI color codes and basic formatting (bold, underline)
- **UI-01**: Resource counters always visible alongside terminal

## Decisions

### Terminal Implementation
- **Replace current TerminalInterface entirely with xterm.js** — The existing `src/components/TerminalInterface.tsx` (235 lines) is a basic React component with hardcoded switch and no ANSI support. xterm.js (used by VS Code, Hyper) provides authentic terminal feel, WebGL rendering for effects, and handles high-frequency writes. The component will be replaced, not wrapped.
- **Install**: `xterm` + `xterm-addon-webgl` + `xterm-addon-fit`
- **Integration**: Mount xterm.js in a React component via `useRef` + `useEffect`, clean up on unmount.

### Game Loop Timing
- **Web Worker for tick loop** — Use the existing `src/workers/idleWorker.ts` and `src/hooks/useIdleProgression.ts` infrastructure. The Worker handles accurate timing independent of main thread, safe when tab is inactive (critical for idle games). Main thread receives state updates via `postMessage` and renders to terminal.

### Resource Display
- **HUD bar at top of screen** — Resource counters (crypto, bandwidth, reputation) displayed in a persistent bar above the terminal. Classic idle game pattern — always visible, updates flash on change. Hosted within the existing `src/components/Layout.tsx`. Counters update reactively from Zustand store.

### Command Architecture
- **Command registry pattern** — Commands defined as registered objects: `{ name, description, handler, aliases }`. Registry is a Map or object that commands register against. Handlers receive terminal write function and game store access. Extensible for Phase 2's hacking commands, testable in isolation. Data-driven approach deferred until command count justifies it.

### Visual Effects
- **CRT scanlines + neon glow** — CSS overlay for CRT scanline effect (repeating gradient). Terminal text glows in cyber colors (`#00ff41` green, `#ff0080` pink, `#00d4ff` cyan). No typing animation — too slow for idle game with frequent output. Effects are CSS-only, zero performance cost.
- **Existing Tailwind config** already has: `cyber` color palette, `JetBrains Mono` font, `Orbitron` display font, custom animations (`glow`, `pulse-slow`, `flicker`).

### State Integration
- **Zustand store is single source of truth** — Existing `src/store/gameStore.ts` (2331 lines) already has Player, Equipment, Operation, Target interfaces. Game loop updates store, terminal reads from store for display. No new state management needed.

## Canonical Refs

- `.planning/ROADMAP.md` — Phase 1 goal, requirements, success criteria
- `.planning/REQUIREMENTS.md` — TERM-01 through TERM-05, UI-01
- `.planning/PROJECT.md` — Project context and key decisions
- `.planning/research/STACK.md` — xterm.js recommendation with rationale
- `.planning/research/ARCHITECTURE.md` — System architecture patterns
- `.planning/codebase/STACK.md` — Existing codebase stack analysis
- `src/components/TerminalInterface.tsx` — Current terminal component (to be replaced)
- `src/store/gameStore.ts` — Zustand game state store (single source of truth)
- `src/workers/idleWorker.ts` — Existing Web Worker for idle calculations
- `src/hooks/useIdleProgression.ts` — Existing hook for Worker communication
- `src/components/Layout.tsx` — Layout component (hosts HUD bar)
- `tailwind.config.js` — Cyber theme colors, fonts, animations

## Code Context

### Reusable Assets
- **Zustand store** (`gameStore.ts`) — Full game state with Player, Equipment, Operation, Target, Achievement interfaces. `persist` middleware for auto-save.
- **Tailwind cyber theme** — Custom colors (`cyber.primary: #00ff41`, `cyber.secondary: #ff0080`, `cyber.accent: #00d4ff`), fonts (`JetBrains Mono`, `Orbitron`), animations (`glow`, `pulse-slow`, `flicker`).
- **Layout component** — Already wraps all routes with Navigation and NotificationSystem.
- **Web Worker infrastructure** — `idleWorker.ts` and `useIdleProgression.ts` already handle Worker lifecycle.
- **UI components** — Radix UI slots, CVA variants, Lucide icons, Sonner toasts available.

### Patterns
- **State flow**: Zustand store → hooks → components. API calls write to Supabase, store updated optimistically.
- **Idle loop**: `useIdleProgression` hook → Worker → calculated rewards → store update.
- **AI autoplay**: `gameStore.makeAIDecision()` + `gameStore.executeAIDecision()` autonomous loop.

## Deferred Ideas

- Typing animation for terminal output — deferred due to idle game output frequency
- Data-driven command system — deferred until command count justifies (50+ commands)
- Matrix rain / glitch effects — deferred to Phase 6 (Content & Polish)
