# Phase 5 Context — Supabase Integration

## Domain

Cloud sync, authentication, real-time features connect the game to the backend. This phase delivers Supabase auth, cloud save sync, leaderboard system, and deployment configuration.

## Requirements (from ROADMAP.md)

- **Auth-01**: Player can authenticate with Supabase auth (anonymous-first + OAuth)
- **Auth-02**: Game state syncs to cloud database on save
- **Auth-03**: Player can load saves from cloud on different devices
- **Realtime-01**: Leaderboards update in real-time via Supabase Realtime
- **Deploy-01**: Edge Functions not needed — rules-based AI runs free in browser

## Decisions

### Auth Flow
- **Anonymous-first + OAuth fallback** — Players start playing instantly (no signup wall). When they want cloud saves, they can link Google/GitHub account via Supabase OAuth. Matches idle game UX — don't block gameplay with auth. Supabase anon auth provides temporary session that can be upgraded to permanent account.

### Cloud Sync Strategy
- **Full state sync + last-write-wins** — Upload entire game state (JSON under 100KB) on save. Simple, no delta sync complexity. Last-write-wins conflict resolution: if same account on multiple devices, most recent session wins. Add sync conflict warning if timestamps differ significantly. Standard idle game pattern.

### Realtime Channels Scope
- **Leaderboards only for v1** — Async competition fits idle game model. Supabase Realtime pushes score updates when players achieve milestones (first hack, credits milestones, level ups). Live AI competition and guild chat deferred to Phase 6+.

### Edge Functions Decision
- **Drop LLM, use rules-based AI only** — Phase 4's rules-based decision engine is strategic enough (ROI-based upgrades, risk-adjusted targets, priority weighting). Runs 100% free in browser — no API calls, no server costs. No Edge Functions needed for AI. Keeps entire game free to host and play.

### Migration Strategy
- **Adapt for v1 scope** — Keep player, auth, hacking, and sync tables. Comment out guilds, companions, marketplace, social features. Add `game_saves` table for cloud sync. Clean migrations are easier to maintain than half-used schema.

### Existing Infrastructure
- **Supabase client** — `api/config/supabase.ts` has service role + anon clients
- **Frontend client** — `src/lib/supabase.ts` exists
- **12 migrations** — `supabase/migrations/` with players, quests, hacking, etc.
- **Vercel deployment** — `api/` Express routes deployed to Vercel
- **GitHub Pages** — Frontend deployed to `gh-pages` branch
- **Supabase free tier** — 500MB database, 50k monthly active users sufficient for v1

## Canonical Refs

- `.planning/ROADMAP.md` — Phase 5 goal, requirements, success criteria
- `.planning/REQUIREMENTS.md` — Auth and realtime requirements
- `.planning/PROJECT.md` — Project context and key decisions
- `.planning/phases/04-ai-auto-play/04-CONTEXT.md` — Phase 4 AI decisions (rules-based only)
- `supabase/migrations/` — Existing database migrations
- `api/config/supabase.ts` — Supabase client configuration
- `src/lib/supabase.ts` — Frontend Supabase client
- `.env` — Supabase environment variables

## Code Context

### Reusable Assets
- **Supabase clients** — Service role (server) and anon (client) already configured
- **Zustand persist** — IndexedDB storage adapter from Phase 3, extend for cloud sync
- **Game state structure** — Player, equipment, operations, achievements, lastUpdate
- **Vercel config** — `vercel.json` already set up for API routes
- **GitHub Pages** — `gh-pages` branch deployment working

### Patterns
- **State flow**: Zustand store → individual selectors → components
- **Save pattern**: Auto-save every 30s → IndexedDB → (Phase 5) cloud sync
- **Auth pattern**: Supabase anon session → upgrade to OAuth → permanent account

## Deferred Ideas

- Live AI competition (Phase 6+)
- Guild chat and social features (Phase 6+)
- Edge Functions for advanced features (Future phase, if needed)
- Delta sync optimization (Future phase, if game state grows large)
