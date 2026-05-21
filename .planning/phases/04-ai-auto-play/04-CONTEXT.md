# Phase 4 Context — AI Auto-Play

## Domain

AI agent plays autonomously, making strategic decisions about upgrades and resource allocation, with reasoning visible in terminal. This phase delivers AI decision engine, Edge Functions integration, AI toggle controls, and reasoning visibility.

## Requirements (from ROADMAP.md)

- **AI-01**: Player can enable/disable AI auto-play mode
- **AI-02**: AI makes strategic decisions about which upgrades to purchase
- **AI-03**: AI initiates hacking commands against appropriate targets
- **AI-04**: AI decision reasoning is visible in terminal output
- **AI-05**: AI runs via server-side edge functions (no browser-side LLM calls)

## Decisions

### AI Decision Frequency
- **Every 10 seconds** — Matches game loop rhythm. Gives player time to see AI reasoning without terminal spam. Configurable interval in AI settings. Implemented via setInterval in game loop hook.

### AI Strategy Complexity
- **Hybrid (rules-based + LLM)** — Rules-based for routine actions (buy cheapest upgrade, hack available target), LLM via Supabase Edge Functions for strategic decisions (when to save vs spend, which upgrade path to prioritize). Matches Phase 1 research recommendation. Edge Functions protect API keys, enable model tiering (Haiku for routine, Sonnet for strategy).

### AI Reasoning Visibility
- **Summary reasoning** — Brief context before each action. Format: `[AI] Analyzing... CPU gives +2/sec at 500 credits → Purchasing`. Player sees AI thinking without terminal spam. Terminal output uses distinct AI prefix color (cyan).

### AI Resource Allocation
- **Reserve 20%** — Standard idle game AI pattern. Keeps buffer for unexpected opportunities. Configurable in AI settings (player can adjust risk tolerance 0-100%). AI will never spend below reserve threshold.

### AI Toggle Location
- **Both HUD button + terminal command** — HUD toggle with status indicator (green = active, gray = inactive). `ai on/off` commands for terminal immersion. AI status always visible in HUD.

### Existing Infrastructure
- **gameStore** already has: `makeAIDecision()`, `executeAIDecision()`, `updateAIConfig()`, `toggleAI()`, `recordAIDecision()` actions
- **AIDecision, AIConfig, AIAnalytics** interfaces already defined
- **Supabase Edge Functions** infrastructure exists in `api/` directory
- **Game loop** already handles tick timing — extend for AI decision interval
- **Terminal** supports colored output — use for AI reasoning lines

## Canonical Refs

- `.planning/ROADMAP.md` — Phase 4 goal, requirements, success criteria
- `.planning/REQUIREMENTS.md` — AI-01 through AI-05
- `.planning/PROJECT.md` — Project context and key decisions
- `.planning/phases/01-terminal-foundation/01-CONTEXT.md` — Phase 1 decisions
- `.planning/phases/02-economy-hacking/02-CONTEXT.md` — Phase 2 decisions
- `.planning/phases/03-persistence-polish/03-CONTEXT.md` — Phase 3 decisions
- `.planning/research/STACK.md` — AI Edge Functions recommendation
- `src/store/gameStore.ts` — Zustand store with AI actions and interfaces
- `api/` — Supabase Edge Functions directory
- `src/hooks/useGameLoop.ts` — Game loop hook (AI decision interval integration)
- `src/components/XtermTerminal.tsx` — Terminal for AI reasoning output

## Code Context

### Reusable Assets
- **AI interfaces**: `AIDecision`, `AIConfig`, `AIAnalytics` already defined in gameStore
- **AI actions**: `makeAIDecision()`, `executeAIDecision()`, `toggleAI()`, `updateAIConfig()` already implemented
- **Game loop**: `useGameLoop` hook with tick accumulator — extend for AI decision interval
- **Terminal**: `onTerminalReady` prop provides terminal instance for AI output
- **Supabase client**: `api/config/supabase.ts` has service role and anon clients

### Patterns
- **State flow**: Zustand store → individual selectors → components
- **Worker communication**: `postMessage` for tick data, `onmessage` for state updates
- **Command execution**: `onData` → `handleCommand` → `commandRegistry.execute()` → terminal output

## Deferred Ideas

- Multi-agent competition — Phase 5+
- AI personality customization — Future phase
- Advanced AI strategy learning — Future phase
- AI performance analytics dashboard — Future phase
