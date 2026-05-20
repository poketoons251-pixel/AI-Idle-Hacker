# Technology Stack

**Project:** Cyberpunk Terminal Hacking Idle Game with AI Auto-Play
**Researched:** 2026-05-20

## Recommended Stack

### Core Framework
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| React | 19.x | UI framework | Existing scaffolding, ecosystem breadth, React Compiler auto-memoization closes most performance gaps. For a terminal-based idle game (not a 10K-row data grid), React is "fast enough" and the ecosystem advantage is decisive. |
| Vite | 6.x | Build tool | Existing scaffolding. Fast HMR, native ESM, optimal for SPA. |
| TypeScript | 5.x | Type safety | Existing scaffolding. Essential for complex game state types. |

### State Management
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Zustand | 5.x | Game state management | Zero-boilerplate, selective subscriptions prevent unnecessary re-renders, `subscribeWithSelector` for granular control, transient updates (via `subscribe` + `useRef`) for high-frequency game loop values without triggering React renders. The R3F/game community standard. |
| Zustand `subscribeWithSelector` middleware | 5.x | Fine-grained subscriptions | Subscribe to specific state slices (e.g., `state.resources.gold`) with equality functions. Critical for idle games where dozens of values tick every second but only a few affect the visible UI. |

### Terminal Emulation
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| @xterm/xterm | 0.5+ | Terminal rendering | Industry standard (VS Code, Hyper, Tabby). Zero dependencies, GPU-accelerated renderer via `@xterm/addon-webgl`, rich addon ecosystem (fit, web-links, serialize, unicode). Battle-tested for exactly this use case. |
| @xterm/addon-webgl | 0.5+ | GPU-accelerated rendering | WebGL2 renderer for smooth terminal output at high frequency. Essential for cyberpunk "matrix rain" effects and rapid log scrolling. |
| @xterm/addon-fit | 0.5+ | Responsive sizing | Auto-fits terminal to container. Required for responsive layouts. |
| @xterm/addon-web-links | 0.5+ | Link detection | Clickable URLs in terminal output. Useful for in-game links. |

### Database & Backend
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Supabase | v1.26+ | Backend platform | Existing scaffolding. PostgreSQL + Auth + Realtime + Edge Functions + Storage in one. Realtime channels via WebSockets for live game state sync. Edge Functions (Deno) for AI agent orchestration with API key protection. |
| Supabase Realtime | bundled | Live state sync | WebSocket-based Postgres change listeners. Chain multiple listeners on a single channel for game state synchronization. Perfect for multiplayer idle game features. |
| Supabase Edge Functions | bundled | AI agent backend | Deno runtime, 150s timeout, SSE streaming support. Protect LLM API keys server-side. Use `EdgeRuntime.waitUntil` for background AI decision loops. pg_cron for scheduled game events. |

### Local Storage (Save/Load)
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| idb-keyval | 6.x | Primary save storage | 295 bytes brotli'd. Promise-based IndexedDB wrapper. Stores any structured-cloneable type (objects, arrays, dates, blobs). Async — doesn't block the main thread. Perfect for idle game save states which can be large JSON objects. |
| Dexie.js | 4.x | Complex save data (optional) | If you need indexed queries, migrations, or multi-table game data (save slots, settings, achievements as separate stores). Adds ~12KB but provides a full IndexedDB query API. Use only if idb-keyval's simple KV model is insufficient. |

### Styling & Theming
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Tailwind CSS | 4.x | Utility-first styling | Existing scaffolding. Cyberpunk theme via CSS custom properties + Tailwind config. xterm.js theming integrates cleanly with Tailwind's color system. |

### AI Agent Integration
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Supabase Edge Functions + LLM API | current | AI auto-play backend | Run AI decision loops server-side via Edge Functions. Use model tiering: cheap model (Claude Haiku 4.5 / GPT-4o-mini) for routine idle decisions, expensive model (Claude Sonnet 4.6) for strategic choices. Prompt Caching cuts repeated system prompt costs by 63%. |
| SSE.js | current | Streaming AI responses | Browser SSE client for POST requests. Stream AI agent decisions back to the terminal UI in real-time. |

## Game Loop Implementation

### Primary Pattern: requestAnimationFrame + Zustand Transient Updates

```typescript
// Game loop running at 60fps without triggering React re-renders
const useGameStore = create(
  subscribeWithSelector(() => ({
    resources: { gold: 0, data: 0, energy: 100 },
    tick: 0,
    // ... actions
  }))
);

// In the game loop component:
function GameLoop() {
  const rafRef = useRef<number>(0);
  const lastTickRef = useRef(0);
  const TICK_INTERVAL = 1000 / 60; // 60Hz

  useEffect(() => {
    const loop = (timestamp: number) => {
      if (timestamp - lastTickRef.current >= TICK_INTERVAL) {
        // Direct store mutation — NO re-render
        const state = useGameStore.getState();
        // ... update game logic
        lastTickRef.current = timestamp;
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return null; // This component renders nothing
}
```

**Key rules:**
- Game state that changes every frame → store in Zustand, access via `getState()` in rAF loop
- UI-displayed values → use Zustand selectors for reactive components
- High-frequency values (position, counters) → transient subscriptions with `useRef`
- Tab visibility → listen to `visibilitychange`, clamp delta on resume to avoid spiral-of-death

### Web Workers (for heavy computation)

Use Web Workers for:
- AI agent decision loops (keep LLM calls off main thread)
- Complex economy calculations (if scaling to hundreds of concurrent resources)
- Offline progress calculation (compute elapsed-time earnings without blocking UI)

**Not needed for:** Basic idle tick logic, terminal rendering, simple resource generation.

## Save/Load Patterns

### Recommended Architecture: Local-First with Cloud Sync

```
┌─────────────────────────────────────────────┐
│  Browser                                    │
│  ┌──────────┐    ┌───────────────────────┐  │
│  │ idb-keyval│───▶│ Game State (IndexedDB)│  │
│  │ (primary) │    └───────────┬───────────┘  │
│  └──────────┘                │               │
│                              │ periodic sync  │
│                              ▼               │
│                    ┌───────────────────┐     │
│                    │ Supabase Postgres │     │
│                    │ (cloud backup)    │     │
│                    └───────────────────┘     │
└─────────────────────────────────────────────┘
```

**Save strategy:**
1. **Auto-save** to IndexedDB every 30 seconds + on `beforeunload`
2. **Cloud sync** to Supabase Postgres every 5 minutes (or on significant milestones)
3. **Offline progress** calculated on load: `elapsed = Date.now() - lastSaveTimestamp`, apply idle rates
4. **Export/Import** as Base64-encoded JSON for save sharing
5. **Multiple save slots** supported via IndexedDB key naming (`save-slot-1`, `save-slot-2`)

**Why not localStorage?**
- Synchronous — blocks main thread on read/write
- 5MB limit — idle game states can exceed this with complex economies
- String-only — requires manual JSON serialization
- No structured clone support for complex types

**Why not localForage?**
- ~7KB bundle vs idb-keyval's 295 bytes
- Falls back to WebSQL/localStorage (unnecessary for modern evergreen browsers)
- idb-keyval is sufficient for the KV access pattern idle games need

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Framework | React 19 | Solid.js | Solid is 70% faster on benchmarks, but ecosystem is 100x smaller. With React Compiler, the performance gap is acceptable for a terminal UI. Existing Vite+React scaffolding makes switching cost unjustified. |
| Framework | React 19 | Svelte 5 | Svelte has better bundle size (3-5KB vs 42KB) and ~40% faster updates. But migrating existing scaffolding + smaller component ecosystem for terminal/gaming patterns makes it a net loss. |
| State Mgmt | Zustand | Redux Toolkit | Redux boilerplate is overkill for a single-player idle game. Zustand's hook-based API is simpler and faster. |
| State Mgmt | Zustand | Jotai | Jotai's atomic model is great but Zustand's transient subscription pattern is better documented for game loops. |
| Terminal | xterm.js | wterm | wterm is modern (Zig+WASM, DOM rendering, CSS theming) but has a tiny ecosystem. xterm.js is used by VS Code, Hyper, and Tabby — battle-tested for production terminal rendering. |
| Terminal | xterm.js | ghostty-web | Promising (Ghostty's VT100 parser via WASM, xterm.js-compatible API) but still pre-1.0 and ~400KB WASM bundle. Too early for production. |
| Storage | idb-keyval | localStorage | localStorage is synchronous, 5MB-limited, string-only. IndexedDB handles large game states asynchronously. |
| Storage | idb-keyval | Dexie.js | Dexie is overkill unless you need complex queries. Start with idb-keyval; migrate to Dexie only if you need indexed lookups or migrations. |
| AI Backend | Supabase Edge Functions | Direct browser LLM calls | Exposing API keys in browser is a security risk. Edge Functions protect keys, enforce rate limits via RLS, and enable prompt caching. |
| AI Backend | Supabase Edge Functions | Dedicated Node.js server | Unnecessary complexity. Edge Functions handle the AI agent loop pattern well, with Deno's 150s timeout and SSE streaming. Only move to dedicated server if you need persistent WebSocket connections for multi-agent orchestration. |

## Installation

```bash
# Core (already in scaffolding)
npm install react react-dom typescript

# State management
npm install zustand

# Terminal emulation
npm install @xterm/xterm @xterm/addon-webgl @xterm/addon-fit @xterm/addon-web-links @xterm/addon-serialize

# Local storage
npm install idb-keyval

# Supabase (already in scaffolding)
npm install @supabase/supabase-js

# AI integration
npm install sse.js

# Dev dependencies
npm install -D @types/react @types/react-dom
```

## Confidence Levels

| Recommendation | Confidence | Reason |
|----------------|------------|--------|
| React 19 | HIGH | Existing scaffolding, React Compiler documented, 190M+ weekly downloads |
| Zustand 5.x | HIGH | Context7 verified, R3F game loop patterns well-documented, transient updates proven |
| xterm.js 0.5+ | HIGH | Context7 verified, used by VS Code/Hyper, WebGL addon documented |
| Supabase Realtime | HIGH | Context7 verified, official game sync patterns documented |
| Supabase Edge Functions | HIGH | Official docs verified, real cost data from production deployments |
| idb-keyval 6.x | HIGH | npm verified, Jake Archibald maintained, 295 bytes confirmed |
| SSE.js for streaming | MEDIUM | Community standard pattern, but library-specific docs limited |
| Web Workers for AI loops | MEDIUM | Pattern verified across multiple projects, but specific to game architecture |
| Offline progress calculation | HIGH | Standard idle game pattern, well-documented across the genre |

## Sources

- Context7: Zustand docs (`/pmndrs/zustand`), xterm.js docs (`/xtermjs/xterm.js`), Supabase docs (`/supabase/supabase`)
- js-framework-benchmark 2026: Solid.js 42.8 ops/s, Svelte 5 39.5, React 19 28.4 (with Compiler ~34)
- OpenIdle-Engine (GitHub): React + TypeScript idle game engine with data-driven architecture
- ai-agent-idle-game (GitHub): API-first idle game for AI agents, Supabase-backed
- Supabase Edge Functions cost analysis (DEV Community, 2026-04): Real production cost data
- R3F best practices: Zustand transient updates for game loops
- idb-keyval npm page: Size and API details
- wterm vs xterm.js comparison (2026-04): Terminal emulator landscape
- ghostty-web (GitHub): xterm.js-compatible Ghostty WASM terminal
