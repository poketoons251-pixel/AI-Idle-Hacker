# Research Summary: Cyberpunk Terminal Hacking Idle Game

**Domain:** Web-based idle/incremental game with terminal UI and AI auto-play
**Researched:** 2026-05-20
**Overall confidence:** HIGH

## Executive Summary

The cyberpunk terminal hacking idle game sits at the intersection of three well-established domains: incremental game design, terminal emulation in the browser, and AI agent orchestration. Each domain has mature, production-ready solutions in 2026.

The existing Vite + React + TypeScript + Supabase + Tailwind scaffolding is a solid foundation. React 19 with the React Compiler closes most of the performance gap with signal-based frameworks for this use case — a terminal UI is not a 10,000-row data grid, and the ecosystem advantage (xterm.js integration, component libraries, community patterns) outweighs the 30-40% raw performance deficit.

State management via Zustand is the clear winner. Its transient subscription pattern (`subscribe` + `useRef`) is specifically designed for high-frequency game loop values that should NOT trigger React re-renders. This is the single most important architectural decision for performance.

The terminal layer should use xterm.js with the WebGL addon. It's the industry standard, used by VS Code and Hyper, with a mature addon ecosystem. Alternatives like wterm (Zig+WASM) and ghostty-web are interesting but too early for production.

AI auto-play runs server-side via Supabase Edge Functions, protecting API keys and enabling model tiering (cheap models for routine decisions, expensive models for strategy). The idle game's REST API becomes the "game surface" that AI agents interact with — a pattern already proven by projects like `ai-agent-idle-game`.

Save/load uses IndexedDB (via idb-keyval) as the primary store with Supabase Postgres as cloud backup. Offline progress is calculated on load using elapsed time and idle rates — the standard idle game pattern.

## Key Findings

**Stack:** React 19 + Zustand 5.x + xterm.js 0.5 + Supabase + idb-keyval — all verified against current documentation and production usage.

**Architecture:** Local-first game state in Zustand + IndexedDB, cloud sync to Supabase, AI decisions via Edge Functions, terminal rendering via xterm.js with WebGL acceleration.

**Critical pitfall:** The #1 performance killer is calling `setState` inside the game loop (requestAnimationFrame). Every state change triggers a React re-render. The fix is Zustand's transient subscription pattern — store game state in Zustand, access via `getState()` in the rAF loop, only use React state for values that actually need to re-render the UI.

## Implications for Roadmap

Based on research, suggested phase structure:

1. **Phase 1: Terminal Foundation** - Get xterm.js rendering with cyberpunk theme, basic game loop skeleton
   - Addresses: Core UI layer, terminal emulation
   - Avoids: Don't build custom terminal — xterm.js is battle-tested
   - Research confidence: HIGH — standard patterns, well-documented

2. **Phase 2: Idle Economy Engine** - Resource generation, upgrades, game tick logic with Zustand
   - Addresses: Core game mechanics, state management
   - Avoids: Don't use useState for game loop values — use Zustand transient subscriptions
   - Research confidence: HIGH — OpenIdle-Engine provides reference architecture

3. **Phase 3: Save/Load System** - IndexedDB persistence, offline progress calculation, export/import
   - Addresses: Data persistence, player retention
   - Avoids: Don't use localStorage — it's synchronous and 5MB-limited
   - Research confidence: HIGH — standard idle game pattern

4. **Phase 4: Supabase Integration** - Cloud sync, authentication, Realtime channels
   - Addresses: Multi-device sync, social features
   - Avoids: Don't build custom backend — Supabase handles auth, DB, realtime
   - Research confidence: HIGH — official patterns verified

5. **Phase 5: AI Auto-Play** - Edge Functions for AI decision loops, terminal output streaming
   - Addresses: AI agent integration, automated gameplay
   - Avoids: Don't call LLM APIs from browser — use Edge Functions for key protection
   - Research confidence: MEDIUM — emerging pattern, needs phase-specific design

6. **Phase 6: Polish & Content** - Cyberpunk theming, animations, sound, content depth
   - Addresses: User experience, game feel
   - Research confidence: HIGH — standard frontend work

**Phase ordering rationale:**
- Terminal first because it's the entire UI surface — everything else renders into it
- Economy before saves because you need game state to persist
- Saves before cloud sync because local-first is the foundation
- Cloud sync before AI because AI needs authenticated users and persistent state
- AI last because it's the most complex and depends on all previous layers

**Research flags for phases:**
- Phase 5 (AI Auto-Play): Likely needs deeper research. The specific pattern for AI decision loops (frequency, model selection, cost control, prompt design for game strategy) is not well-documented. Will need spike/prototyping.
- Phase 2 (Economy): The balance between game tick frequency and UI update frequency needs careful design. Consider whether a fixed-timestep game loop (like traditional games) or event-driven updates (like most idle games) is better.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All recommendations verified against Context7, official docs, and production usage |
| Features | HIGH | Idle game patterns are well-established; AI auto-play is emerging but documented |
| Architecture | HIGH | Local-first + cloud sync is standard; Zustand transient updates are well-documented for games |
| Pitfalls | HIGH | Performance pitfalls (setState in rAF, localStorage blocking) are well-known and documented |

## Gaps to Address

- **AI agent strategy design**: What should the AI "think about"? What game state does it need? What's the optimal decision frequency? This needs a dedicated design phase (use gsd-ai-integration-phase skill).
- **Game economy balance**: What are the resource generation rates? Upgrade costs? Prestige multipliers? This is game design, not technical research.
- **Multiplayer scope**: Does the game need real-time multiplayer (leaderboards, PvP, alliances) or just async competition? This affects Supabase Realtime usage significantly.
- **xterm.js custom rendering**: How to render cyberpunk "matrix rain" or custom ASCII art effects within xterm.js? May need custom addon or direct canvas overlay.
- **Web Worker communication pattern**: If AI loops run in Workers, what's the message protocol between Worker and main thread? Structured cloning vs SharedArrayBuffer tradeoffs need evaluation.
