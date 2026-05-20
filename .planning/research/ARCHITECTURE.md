# Architecture Patterns

**Domain:** Cyberpunk terminal hacking idle game with AI auto-play
**Researched:** 2026-05-20

## Recommended Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Browser (React 19 + Vite)                                  │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────┐ │
│  │   xterm.js    │  │   React UI   │  │    Game Loop      │ │
│  │  (WebGL)      │  │  Components  │  │  (requestAnimFrame)│ │
│  │              │  │              │  │                   │ │
│  │  Terminal     │  │  Settings    │  │  Zustand getState │ │
│  │  Output       │  │  Modals      │  │  (no re-render)   │ │
│  │  Input        │  │  Overlays    │  │                   │ │
│  └──────┬───────┘  └──────┬───────┘  └─────────┬─────────┘ │
│         │                 │                     │           │
│  ┌──────┴─────────────────┴─────────────────────┴─────────┐ │
│  │                  Zustand Stores                         │ │
│  │  ┌────────────┐ ┌──────────┐ ┌────────┐ ┌───────────┐ │ │
│  │  │ Game Store │ │ UI Store │ │AI Store│ │Settings   │ │ │
│  │  │ resources  │ │ modals   │ │ status │ │ preferences│ │ │
│  │  │ upgrades   │ │ theme    │ │ budget │ │ save slots │ │ │
│  │  │ tick       │ │ overlays │ │ history│ │            │ │ │
│  │  └────────────┘ └──────────┘ └────────┘ └───────────┘ │ │
│  └────────────────────────┬───────────────────────────────┘ │
│                           │                                 │
│  ┌────────────────────────┴───────────────────────────────┐ │
│  │                  idb-keyval (IndexedDB)                 │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌──────────────────┐ │ │
│  │  │ save-slot-1 │ │ save-slot-2 │ │ settings         │ │ │
│  │  │ (game state)│ │ (game state)│ │ (user prefs)     │ │ │
│  │  └─────────────┘ └─────────────┘ └──────────────────┘ │ │
│  └────────────────────────┬───────────────────────────────┘ │
│                           │ periodic sync                   │
└───────────────────────────┼─────────────────────────────────┘
                            │
┌───────────────────────────┼─────────────────────────────────┐
│  Supabase (Cloud)         │                                 │
│                           │                                 │
│  ┌────────────────────────┴──────────┐                     │
│  │  PostgreSQL                       │                     │
│  │  ┌─────────┐ ┌────────┐ ┌──────┐ │                     │
│  │  │ players │ │ saves  │ │events│ │                     │
│  │  │ profiles│ │ sync   │ │leader│ │                     │
│  │  └─────────┘ └────────┘ └──────┘ │                     │
│  └─────────────────┬─────────────────┘                     │
│                    │                                       │
│  ┌─────────────────┴─────────────────┐                     │
│  │  Edge Functions (Deno)            │                     │
│  │  ┌──────────────────────────────┐ │                     │
│  │  │ AI Decision Loop             │ │                     │
│  │  │ - Read game state from DB    │ │                     │
│  │  │ - Call LLM (Claude/GPT)      │ │                     │
│  │  │ - Parse decision             │ │                     │
│  │  │ - Execute game action        │ │                     │
│  │  │ - Stream result via SSE      │ │                     │
│  │  └──────────────────────────────┘ │                     │
│  │  ┌──────────────────────────────┐ │                     │
│  │  │ pg_cron Scheduled Events     │ │                     │
│  │  │ - World events               │ │                     │
│  │  │ - Leaderboard updates        │ │                     │
│  │  └──────────────────────────────┘ │                     │
│  └───────────────────────────────────┘                     │
│                    │                                       │
│  ┌─────────────────┴─────────────────┐                     │
│  │  Supabase Realtime (WebSockets)   │                     │
│  │  - Live leaderboard updates       │                     │
│  │  - World event notifications      │                     │
│  │  - AI decision streaming          │                     │
│  └───────────────────────────────────┘                     │
└─────────────────────────────────────────────────────────────┘
```

### Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| **GameLoop** | rAF loop, tick logic, delta time calculation | Zustand stores (via `getState()`), no React renders |
| **TerminalView** | xterm.js instance, WebGL rendering, user input | Game Store (transient subscription for output), UI Store (theme) |
| **GameStore** | Resources, upgrades, tick counter, economy logic | GameLoop (read/write), idb-keyval (save/load), Supabase (sync) |
| **UIStore** | Modal state, theme, overlay visibility, terminal UI state | React components (reactive subscriptions) |
| **AIStore** | Agent status, decision history, budget tracking | Edge Functions (via fetch/SSE), TerminalView (stream output) |
| **SettingsStore** | User preferences, save slot selection, auto-save interval | idb-keyval (persist), React components |
| **SaveManager** | Auto-save, load, export/import, offline progress calc | idb-keyval, GameStore, Supabase |
| **Edge Functions** | AI decision loop, event scheduling, cloud sync | Supabase Postgres, LLM APIs, browser (SSE) |

### Data Flow

```
1. Game Loop (rAF, 60fps):
   getState() → update resources → (no re-render)

2. UI Update (reactive, only when values change):
   Zustand selector triggers → React re-render → terminal.write()

3. Save (every 30s):
   getState() → serialize → idb-keyval.set() → (async, no block)

4. Cloud Sync (every 5min):
   getState() → Supabase.upsert() → Realtime notifies other devices

5. AI Decision (every N game ticks):
   Browser → Edge Function (fetch) → LLM call → parse → execute action
   → SSE stream back to browser → terminal.write(decision)

6. Offline Progress (on load):
   Load save from idb-keyval → elapsed = now - lastSave → apply idle rates
   → update resources → save → render
```

## Patterns to Follow

### Pattern 1: Transient Subscriptions for Game Loop

**What:** Access high-frequency game state without triggering React re-renders.

**When:** Any value that changes every frame or every game tick but doesn't need to re-render the UI.

**Example:**
```typescript
// Store
const useGameStore = create(subscribeWithSelector(() => ({
  tick: 0,
  resources: { data: 0, credits: 0 },
  incrementTick: () => set(state => ({ tick: state.tick + 1 })),
})));

// Component — no re-renders on tick change
function GameLoop() {
  const tickRef = useRef(useGameStore.getState().tick);

  useEffect(() => {
    const unsub = useGameStore.subscribe(
      state => state.tick,
      (tick) => { tickRef.current = tick; }
    );
    return unsub;
  }, []);

  // Use tickRef.current in imperative code (canvas, rAF, etc.)
}
```

### Pattern 2: Selective Zustand Selectors for UI

**What:** Components subscribe only to the specific state slices they need.

**When:** Any React component that displays game state.

**Example:**
```typescript
// GOOD: Only re-renders when gold changes
const gold = useGameStore(state => state.resources.gold);

// BAD: Re-renders on ANY state change
const state = useGameStore();
```

### Pattern 3: Fixed Timestep Game Loop

**What:** Separate update logic (fixed interval) from rendering (as fast as possible).

**When:** Any game with time-dependent logic (resource generation, timers).

**Example:**
```typescript
const TICK = 1000 / 60; // 60Hz
let lag = 0;
let lastTime = 0;

function loop(currentTime) {
  if (!lastTime) lastTime = currentTime;
  const delta = Math.min(currentTime - lastTime, 250); // clamp
  lastTime = currentTime;
  lag += delta;

  while (lag >= TICK) {
    updateGameLogic(TICK); // fixed step
    lag -= TICK;
  }

  render(); // as fast as possible
  requestAnimationFrame(loop);
}
```

### Pattern 4: Edge Function AI Decision Loop

**What:** Server-side AI makes game decisions, streams results to browser.

**When:** AI auto-play feature.

**Example:**
```typescript
// Edge Function (Deno)
serve(async (req) => {
  const { gameState, agentConfig } = await req.json();

  // Call LLM with prompt caching
  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5',
    system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: `Game state: ${JSON.stringify(gameState)}` }],
    max_tokens: 500,
  });

  // Parse decision and execute
  const decision = parseDecision(response.content);
  const result = await executeGameAction(decision);

  // Stream back to browser
  return new Response(JSON.stringify({ decision, result }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: Monolithic Zustand Store
**What:** One store with 50+ properties for game state, UI state, settings, AI status.
**Why bad:** Every `set()` triggers equality checks on the entire tree. Selectors become complex. Hard to test.
**Instead:** Split by domain: `useGameStore`, `useUIStore`, `useAIStore`, `useSettingsStore`.

### Anti-Pattern 2: Game State in React useState
**What:** `const [resources, setResources] = useState({ gold: 0 })` in a component, updated every tick.
**Why bad:** Every update triggers a full component re-render + virtual DOM diff. At 60fps, this destroys performance.
**Instead:** Zustand store + `getState()` in rAF loop. React state only for UI-only values.

### Anti-Pattern 3: Synchronous Save on Every Tick
**What:** `localStorage.setItem('save', JSON.stringify(state))` inside the game loop.
**Why bad:** Blocks main thread every tick. Game becomes unresponsive.
**Instead:** Async IndexedDB save on interval (30s) + `beforeunload` event.

### Anti-Pattern 4: Direct LLM Calls from Browser
**What:** `fetch('https://api.anthropic.com/...', { headers: { 'x-api-key': KEY } })` in React code.
**Why bad:** API key exposed in browser source. Anyone can steal it and run up bills.
**Instead:** Supabase Edge Function holds the key. Browser calls Edge Function.

## Scalability Considerations

| Concern | At 100 users | At 10K users | At 1M users |
|---------|--------------|--------------|-------------|
| **Game state** | Single Zustand store, fine | Split stores, still fine | Consider Web Workers for heavy computation |
| **Save storage** | IndexedDB per user, trivial | IndexedDB + Supabase sync, manageable | Supabase Postgres partitioning, CDN for save data |
| **AI decisions** | Edge Functions, free tier sufficient | Edge Functions Pro tier, model tiering critical | Dedicated AI service, queue-based processing |
| **Realtime** | Supabase Realtime, no issues | Connection pooling, channel optimization | Custom WebSocket server or Supabase Enterprise |
| **Terminal rendering** | xterm.js + WebGL, smooth | Same — client-side, no server impact | Same — scales with user's device, not server |
| **Cost** | ~$0 (Supabase free tier) | ~$60/mo (Supabase Pro + AI APIs) | ~$500+/mo (scales with AI usage) |

## Sources

- Zustand docs: Transient updates, subscribeWithSelector, store splitting
- OpenIdle-Engine (GitHub): Data-driven idle game architecture
- Supabase game sync patterns: Realtime multiplayer architecture
- AI Agent Infinite Loops guide (TheCodeForge, 2026-04): Edge Function patterns, cost control
- Supabase Edge Functions advanced patterns (DEV Community, 2026-05): SSE streaming, WebSocket upgrades, background jobs
- requestAnimationFrame game loop patterns (fsjs.dev, samhogy.co.uk): Fixed timestep, delta clamping
