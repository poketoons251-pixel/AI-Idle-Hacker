# External Integrations

**Analysis Date:** 2026-05-20

---

## Overview

AI Idle Hacker integrates with three main external services: **Supabase** (database + auth), a self-hosted **WebSocket** server, and **Google Fonts** (CDN). No third-party payments, analytics, or monitoring services are currently integrated. The frontend is served via GitHub Pages; the backend API deploys to Vercel.

---

## 1. Supabase (Primary Backend)

**Purpose:** Database, authentication, Row Level Security, and server-side business logic.

**SDK/Client:**
- `@supabase/supabase-js` ^2.57.0 — Single client library used both frontend and backend
- Server-side: `api/config/supabase.ts`
- Client-side: `src/lib/supabase.ts`

**Project Details:**
| Property | Value |
|---|---|
| Project Name | `trae_yn7gwgn6` (.vercel/project.json) |
| Supabase URL | `https://fudyahypzgleezrtdnai.supabase.co` (hardcoded in `src/lib/supabase.ts`) |
| Auth Method | JWT via `supabase.auth.getUser(token)` |

**Auth Configuration** (server-side — `api/config/supabase.ts`):
```typescript
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});
```

**Auth Configuration** (client-side — `src/lib/supabase.ts`):
```typescript
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});
```

**Environment Variables Required:**
| Variable | Used In | Purpose |
|---|---|---|
| `SUPABASE_URL` | `api/config/supabase.ts` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | `api/config/supabase.ts` | Server-side full-access client |
| `SUPABASE_ANON_KEY` | `api/config/supabase.ts`, `src/lib/supabase.ts` | Public client (RLS-gated) |
| `VITE_SUPABASE_URL` | `src/lib/supabase.ts` | Frontend Supabase URL |
| `VITE_SUPABASE_ANON_KEY` | `src/lib/supabase.ts` | Frontend anon key (fallback hardcoded) |
| `JWT_SECRET` | `api/websocket.ts` | JWT verification for WebSocket auth |

**Note:** The anon key is hardcoded with a fallback in `src/lib/supabase.ts` line 5. This is a security anti-pattern — the anon key is technically public by nature for Supabase (RLS provides security), but hardcoding credentials in source is not ideal practice.

**Database Schema:** 12 SQL migration files in `supabase/migrations/` covering:
- Story episodes and narrative choices
- Quest system (phase 2) with objectives, progress, rewards
- Hacking techniques and execution tracking
- Intelligence documents and investigation reports
- AI partner personalities and relationship dynamics
- Partner cooperation mechanics
- Episodic campaigns
- Special events and leaderboards (phase 5)
- Permission management

**Key Tables:**
| Table | Purpose | Migration |
|---|---|---|
| `players` | Player profiles, levels, credits, skills | `quest_system_phase2_schema.sql` |
| `users` | Auth users (Supabase managed) | Supabase built-in |
| `quests` | Quest definitions with types and rewards | `quest_system_phase2_schema.sql` |
| `quest_progress` | Per-player quest tracking | `quest_system_phase2_schema.sql` |
| `story_episodes` | Narrative episode containers | `story_campaigns_schema.sql` |
| `story_choices` | Branching narrative decision points | `story_campaigns_schema.sql` |
| `hacking_techniques` | Available hacking techniques | `hacking_techniques_schema.sql` |
| `hacking_executions` | Player execution history | `hacking_techniques_schema.sql` |
| `intelligence_docs` | Intelligence document definitions | `investigation_schema.sql` |
| `investigation_reports` | Player investigation results | `investigation_schema.sql` |
| `partner_personalities` | AI companion personalities | `ai_personality_schema.sql` |
| `relationship_dynamics` | Player-AI relationship tracking | `ai_personality_schema.sql` |
| `guilds` | Guild definitions and stats | (Phase 6, inline in routes) |
| `guild_members` | Guild membership and roles | (Phase 6, inline in routes) |
| `friendships` | Social connections between players | (Phase 6, inline in routes) |
| `ai_companions` | AI companion instances owned by players | (Phase 6, inline in routes) |
| `marketplace_listings` | Player marketplace trades | (Phase 6, inline in routes) |
| `special_events` | Timed and seasonal events | `phase5_advanced_features.sql` |
| `player_difficulty_profiles` | Adaptive difficulty tracking | `phase5_advanced_features.sql` |

---

## 2. WebSocket Server

**Purpose:** Real-time communication for guild chat, friend status updates, companion activities, and live notifications.

**Library:** `ws` (WebSocket — included in dependencies via npm)

**Port:** 8083 (configured in `api/server.ts`)

**Server Implementation:** `api/websocket.ts` (528 lines) — `GameWebSocketServer` class with:
- Authentication via JWT token verification
- Guild chat rooms (join/leave/message)
- Friend online/offline status broadcasting
- Companion activity streaming
- Heartbeat mechanism (30-second interval)
- Auto-reconnection support

**Message Types:**
| Type | Direction | Purpose |
|---|---|---|
| `authenticate` | Client → Server | JWT token validation |
| `authenticated` | Server → Client | Auth success with user data |
| `join_guild_chat` | Client → Server | Enter guild chat room |
| `leave_guild_chat` | Client → Server | Leave guild chat room |
| `guild_chat_message` | Bidirectional | Guild chat messages |
| `friend_status_update` | Bidirectional | Online/offline/busy/away |
| `companion_activity` | Client → Server | Companion action notifications |
| `user_joined_chat` | Server → Client | Guild member joined notification |
| `user_left_chat` | Server → Client | Guild member left notification |
| `connection_established` | Server → Client | Initial welcome message |
| `ping` / `pong` | Bidirectional | Keep-alive heartbeat |

**Client-Side Service:** `src/services/websocketService.ts` (197 lines) — Simulated WebSocket for development with:
- Event-driven architecture via `on`/`off` pattern
- Exponential backoff reconnection (up to 5 attempts)
- Simulated events for guild chat, friend online, notifications
- Singleton pattern (`websocketService`)

---

## 3. Google Fonts (CDN)

**Purpose:** Custom typography for the cyberpunk aesthetic.

**Fonts Loaded** (via `@import` in `src/index.css`):
```css
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=JetBrains+Mono:wght@300;400;500;700&display=swap');
```

- **Orbitron** — Display/heading font (used as `font-cyber` in Tailwind config)
- **JetBrains Mono** — Monospace font (used as `font-mono` in Tailwind config, the primary font)

**No local font files** — entirely CDN-dependent. Offline development requires cached fonts.

---

## 4. Authentication Flow

**How auth works end-to-end:**

1. **Supabase Auth** manages user registration and login (JWT-based)
2. **API Middleware** (`api/middleware/auth.js`, `api/middleware/phase6.ts`) verifies tokens via `supabase.auth.getUser(token)`
3. **WebSocket Auth** (`api/websocket.ts`) verifies JWT using `jsonwebtoken` library with `JWT_SECRET`
4. **Client requests** include `Authorization: Bearer <token>` header

**Backend Auth Middleware Pattern** (from `api/middleware/phase6.ts`):
```
authenticateUser     → Verifies JWT, loads user profile from Supabase
requireGuildMembership → Validates guild membership
requireGuildLeadership → Validates leader/officer role
requireLevel(N)      → Minimum level requirement
requireCredits(N)    → Minimum credits requirement
validateCompanionOwnership → Validates companion belongs to user
```

---

## 5. Rate Limiting

**Implementation:** In-memory `Map<string, { count, resetTime }>` in `api/middleware/phase6.ts`

**Tiers:**
| Endpoint Type | Window | Max Requests |
|---|---|---|
| Standard API | 15 min | 100 |
| Guild Operations | 5 min | 20 |
| Marketplace | 10 min | 30 |
| Social Interactions | 5 min | 50 |
| AI Companion | 10 min | 25 |

**Note:** In-memory rate limiting is not suitable for production with multiple server instances. A Redis-based solution would be needed for horizontal scaling.

---

## 6. CI/CD & Deployment

**Frontend Hosting:** GitHub Pages
- Deploy command: `npm run deploy` (uses `gh-pages` package ^6.3.0)
- Base path: `/AI-Idle-Hacker/`
- Live URL: `https://poketoons251-pixel.github.io/AI-Idle-Hacker/`

**Backend Hosting:** Vercel
- Handler: `api/index.ts` exports a Vercel serverless function wrapping the Express app
- Config: `vercel.json` rewrites all routes to `index.html` (SPA fallback)
- Project ID: `trae_yn7gwgn6` (in `.vercel/project.json`)

**No CI pipeline configured** — no GitHub Actions, no automated testing in CI.

**No error tracking or monitoring** integrated (no Sentry, Datadog, etc.)

**No logging framework** — uses `console.log` / `console.error` throughout.

---

## 7. Environment Configuration

**Files:**
| File | Purpose | Committed? |
|---|---|---|
| `.env` | Environment variables (secrets) | No (in `.gitignore`) |
| `.env.example` (if any) | Template for required vars | Not detected |
| `nodemon.json` | Dev server configuration | Yes |

**Required Environment Variables (inferred from code):**
```bash
# Supabase (server)
SUPABASE_URL=https://fudyahypzgleezrtdnai.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role-jwt>
SUPABASE_ANON_KEY=<anon-jwt>

# Supabase (client)
VITE_SUPABASE_URL=https://fudyahypzgleezrtdnai.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-jwt>

# WebSocket JWT
JWT_SECRET=<your-secret-key>

# CORS (optional, defaults to *)
FRONTEND_URL=http://localhost:5173

# Server port (optional, defaults to 3001)
PORT=3001
```

---

## 8. Dependency Graph

```
Browser (React App)
  ├── Supabase (database, auth, RLS)
  │     └── PostgreSQL (data storage)
  ├── Google Fonts CDN (fonts)
  ├── WebSocket Server (real-time guild chat, friend status)
  └── Express API Server (business logic via REST)
        ├── Supabase (service role access)
        ├── jsonwebtoken (JWT verify)
        └── ws (WebSocket server)
```

---

## Integration Risk Assessment

| Integration | Risk | Mitigation |
|---|---|---|
| Supabase | 💛 Medium — service role key exposure risk, RLS misconfiguration | Service key only used server-side; RLS policies on all tables; anon key is public by design |
| WebSocket (self-hosted) | 💛 Medium — port 8083 must be open; no TLS in dev; no auth rate limiting | JWT auth enforced on connection; production should add TLS/wss |
| Google Fonts CDN | 💚 Low — service degradation only affects aesthetics | Fallback fonts configured in Tailwind |
| GitHub Pages | 💚 Low — static file serving, no dynamic backend | Deploy script uses gh-pages package |
| Vercel | 💚 Low — serverless function wrapper | Cold starts possible but low-impact for game API |

---

*Integration audit: 2026-05-20*
