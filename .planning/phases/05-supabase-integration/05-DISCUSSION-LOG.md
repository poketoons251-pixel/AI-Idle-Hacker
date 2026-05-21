# Phase 5 Discussion Log — Supabase Integration

**Date:** 2026-05-21
**Phase:** 5 — Supabase Integration

## Areas Discussed

### 1. Auth Flow
- **Options considered:** Email/password, OAuth, magic link, anonymous-first
- **Decision:** Anonymous-first + OAuth fallback
- **Rationale:** No signup wall, link account later for cloud saves. Matches idle game UX.

### 2. Cloud Sync Strategy
- **Options considered:** Full state sync, delta sync, last-write-wins
- **Decision:** Full state sync + last-write-wins
- **Rationale:** Simple, game state is small (<100KB), standard idle game pattern.

### 3. Realtime Channels Scope
- **Options considered:** Leaderboards only, live AI competition, guild chat
- **Decision:** Leaderboards only for v1
- **Rationale:** Async competition fits idle model, low complexity.

### 4. Edge Functions Decision
- **Options considered:** Supabase CLI deployment, Vercel serverless, drop LLM
- **Decision:** Drop LLM, use rules-based AI only
- **Rationale:** Phase 4 rules-based AI is strategic enough. Runs free in browser. No server costs.

### 5. Migration Strategy
- **Options considered:** Keep all 12 migrations, adapt for v1, start fresh
- **Decision:** Adapt for v1 scope
- **Rationale:** Keep player/auth/hacking/sync tables, comment out unused features.

## Deferred Ideas
- Live AI competition (Phase 6+)
- Guild chat and social features (Phase 6+)
- Edge Functions for advanced features (Future phase)
- Delta sync optimization (Future phase)
