# Domain Pitfalls

**Domain:** Web-based idle/incremental game with terminal UI and AI auto-play
**Researched:** 2026-05-20

## Critical Pitfalls

### Pitfall 1: setState Inside the Game Loop
**What goes wrong:** Calling `useState` setters or Zustand `set()` inside a `requestAnimationFrame` callback triggers React re-renders at 60fps. This causes severe jank, dropped frames, and eventually the browser throttling the tab.

**Why it happens:** React's mental model is "state change → re-render." Developers naturally put game state in React state, then update it every frame.

**Consequences:** UI becomes unresponsive, battery drains rapidly, mobile devices thermal-throttle, the game feels broken even though the logic is correct.

**Prevention:** Use Zustand's transient subscription pattern. Store game state in Zustand. In the rAF loop, access via `useGameStore.getState()` (no re-render). Only use React state for values that need to trigger UI updates (score display, status overlays). For components that need high-frequency values, use `useRef` + `subscribe()`:

```typescript
// GOOD: No re-renders
useEffect(() => {
  const unsub = useGameStore.subscribe(
    state => state.tickCounter,
    (tick) => { tickRef.current = tick; }
  );
  return unsub;
}, []);
```

**Detection:** React DevTools Profiler shows 60+ renders per second on components that shouldn't be re-rendering. FPS meter shows dropped frames.

### Pitfall 2: Synchronous localStorage for Game Saves
**What goes wrong:** Using `localStorage.setItem()` with large game state objects (complex economies with hundreds of resources, upgrades, achievements) blocks the main thread for 50-200ms. During this block, the game loop pauses, animations stutter, and input is dropped.

**Why it happens:** `localStorage` is synchronous by design. Idle game states grow over time as the economy expands.

**Consequences:** Visible stutter every auto-save. On mobile, this can trigger the browser's "page unresponsive" dialog.

**Prevention:** Use IndexedDB via `idb-keyval`. It's async and stores any structured-cloneable type. The 295-byte library is trivial to add.

**Detection:** Chrome DevTools Performance panel shows long tasks coinciding with save intervals.

### Pitfall 3: Tab Threading and Delta Time Spikes
**What goes wrong:** `requestAnimationFrame` pauses when the tab is hidden. When the user returns after 10 minutes, the first frame reports a delta of 600,000ms. If the game logic applies this delta directly, it generates 10 minutes of resources in one frame — which may be intended (offline progress), but if not handled carefully, can cause integer overflow, negative values, or economy-breaking windfalls.

**Why it happens:** Browsers throttle rAF in background tabs to save battery. This is correct behavior but catches game developers off guard.

**Consequences:** Economy exploits (intentional or accidental), negative resource values from overflow, broken upgrade costs.

**Prevention:**
1. Clamp delta time: `const dt = Math.min(delta, 250)` to prevent spiral-of-death
2. Separate offline progress calculation (on load) from online tick logic
3. On `visibilitychange` resume, reset the timer: `lastTime = performance.now()`
4. Cap offline earnings to a reasonable maximum (e.g., 8 hours)

**Detection:** Console log delta values; look for spikes > 1000ms on tab restore.

### Pitfall 4: Exposing LLM API Keys in Browser Code
**What goes wrong:** Putting Anthropic, OpenAI, or other LLM API keys in frontend JavaScript. Anyone can view source, extract the key, and run up massive bills.

**Why it happens:** Quick prototyping temptation. "It's just a demo" becomes production.

**Consequences:** Stolen API keys, thousands of dollars in unauthorized usage, account suspension.

**Prevention:** ALL LLM calls go through Supabase Edge Functions. The Edge Function holds the API key as an environment variable. The frontend sends a request to the Edge Function, which calls the LLM and returns the result. Use Row Level Security (RLS) to enforce per-user rate limits.

**Detection:** Search codebase for `sk-`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY` in any client-side file.

## Moderate Pitfalls

### Pitfall 5: xterm.js Without WebGL Renderer
**What goes wrong:** Using the default canvas renderer for xterm.js when output is high-frequency (matrix rain effects, rapid log scrolling, large ASCII art). The CPU-based renderer becomes a bottleneck.

**Prevention:** Always load `@xterm/addon-webgl` for production. Handle WebGL context loss gracefully (browsers drop contexts under memory pressure):

```typescript
const webglAddon = new WebglAddon();
webglAddon.onContextLoss(() => {
  webglAddon.dispose();
  // Optionally recreate after delay
});
terminal.loadAddon(webglAddon);
```

### Pitfall 6: AI Agent Infinite Loops
**What goes wrong:** AI agents making decisions in a loop without termination conditions. Each LLM call costs money. An infinite loop drains API credits in minutes.

**Prevention:**
- Set `maxSteps` on agent loops (10 is a good production default)
- Implement cost tracking per conversation in Supabase
- Set hard budget ceilings via API usage limits
- Add cooldown between AI decisions (e.g., one decision per 30 seconds of game time)
- Use model tiering: cheap model for routine decisions, expensive model only for strategic choices

### Pitfall 7: Supabase Edge Function Cold Starts
**What goes wrong:** Infrequently-called Edge Functions cold-start in 200-500ms. For AI agent decisions, this adds to the already 1-5 second LLM response time, making the game feel sluggish.

**Prevention:** Warm up key functions via GitHub Actions cron or pg_cron scheduled calls. For the AI decision loop, use `EdgeRuntime.waitUntil` to keep functions warm between calls.

### Pitfall 8: Zustand Store Bloat
**What goes wrong:** Putting everything in one Zustand store — game state, UI state, settings, AI agent status. As the store grows, every `set()` call triggers equality checks on the entire state tree, and selector performance degrades.

**Prevention:** Split stores by domain:
- `useGameStore` — resources, upgrades, tick counter
- `useUIStore` — terminal output, modal state, theme
- `useAIStore` — agent status, decision history, budget
- `useSettingsStore` — user preferences, save slot selection

### Pitfall 9: IndexedDB Storage Quota
**What goes wrong:** Browsers limit IndexedDB storage (typically 50-60% of available disk space, but can be evicted under storage pressure). If the game accumulates large save data (extensive logs, achievement history, AI decision logs), it can hit quota.

**Prevention:**
- Implement save data rotation (keep last N game states)
- Compress save data before storing (e.g., gzip via `CompressionStream`)
- Monitor storage: `navigator.storage.estimate()`
- Request persistent storage: `navigator.storage.persist()`

### Pitfall 10: xterm.js Theme Clashes with Tailwind
**What goes wrong:** xterm.js has its own theme system (JS object with color values) while Tailwind uses CSS classes. Mixing them leads to inconsistent colors, especially for cyberpunk custom palettes.

**Prevention:** Define the cyberpunk color palette as CSS custom properties, then reference them in both Tailwind config and xterm.js theme object. This ensures consistency:

```css
:root {
  --cyber-green: #00ff41;
  --cyber-cyan: #00ffff;
  --cyber-magenta: #ff00ff;
  --cyber-dark: #0a0a0f;
}
```

```typescript
const terminal = new Terminal({
  theme: {
    background: 'var(--cyber-dark)',
    foreground: 'var(--cyber-green)',
    // ... map to xterm color indices
  }
});
```

## Minor Pitfalls

### Pitfall 11: Missing `FitAddon` on xterm.js
**What goes wrong:** Terminal doesn't resize with the browser window. Text wraps incorrectly, content is cut off.

**Prevention:** Always use `@xterm/addon-fit` and call `fitAddon.fit()` on window resize.

### Pitfall 12: Not Handling `beforeunload` for Saves
**What goes wrong:** User closes the tab between auto-save intervals. All progress since the last save is lost.

**Prevention:** Listen to `beforeunload` and trigger an immediate IndexedDB save.

### Pitfall 13: AI Decision Logs Growing Unbounded
**What goes wrong:** Every AI decision is logged to the database. Over weeks, this grows to megabytes of data, slowing queries and increasing storage costs.

**Prevention:** Implement log rotation. Keep only the last N decisions per agent, or summarize old decisions periodically.

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Terminal setup | xterm.js WebGL context loss on mobile | Handle `onContextLoss`, fallback to canvas renderer |
| Game loop | setState in rAF causing 60 renders/sec | Zustand transient subscriptions, `getState()` in loop |
| Save system | localStorage blocking main thread | Use idb-keyval (IndexedDB) exclusively |
| Offline progress | Delta time spike on tab restore causing overflow | Clamp delta, separate offline calc from online tick |
| AI integration | API key exposure in browser | All LLM calls through Supabase Edge Functions |
| AI integration | Infinite agent loops draining credits | maxSteps, cost tracking, cooldowns, budget ceilings |
| Cloud sync | Conflicting saves from multiple devices | Last-write-wins with timestamps, or CRDT for complex state |
| Cyberpunk theme | Color inconsistency between xterm.js and Tailwind | CSS custom properties as single source of truth |
| Performance | Zustand store growing too large | Split stores by domain (game, UI, AI, settings) |
| Storage | IndexedDB quota exceeded | Save rotation, compression, persistent storage request |

## Sources

- Zustand docs: Transient updates pattern for high-frequency state
- R3F best practices: "NEVER call setState inside useFrame"
- Supabase Edge Functions cost analysis (DEV Community, 2026-04): Cold starts, timeouts, cost control
- AI Agent Infinite Loops guide (TheCodeForge, 2026-04): maxSteps, cost tracking, budget ceilings
- idler game loop patterns (samhogy.co.uk, 2025-06): Fixed timestep, delta clamping, visibility handling
- requestAnimationFrame best practices (MDN, fsjs.dev): Tab throttling, delta time, spiral-of-death prevention
- xterm.js WebGL addon docs: Context loss handling
- OpenIdle-Engine (GitHub): Idle game architecture patterns
