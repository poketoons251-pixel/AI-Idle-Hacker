# Architecture

**Analysis Date:** 2026-05-20

## Pattern Overview

**Overall:** Full-stack single-page application (SPA) with client-authoritative game logic and serverless backend API, using a hybrid state model where most game simulation runs client-side in a Zustand store while persistent data and real-time multiplayer features rely on Supabase + WebSocket.

**Key Characteristics:**
- **Client-authoritative game loop**: Core game state (player, operations, quests, equipment, AI companions) is stored and mutated in a single Zustand store (`src/store/gameStore.ts`). The server does not validate game state changes — it only persists data via Supabase.
- **Serverless-ready backend**: API layer is written as an Express app but deployed via Vercel serverless functions (`api/index.ts` → Vercel handler). Local development uses nodemon + tsx.
- **WebSocket for real-time features**: A separate WebSocket server (`api/websocket.ts`, port 8083) handles guild chat, friend status, and companion activity broadcasts using a room-based pattern.
- **Iterative phase architecture**: Codebase is organized by game system "phases" (Phase 2 quests, Phase 3 partner systems, Phase 4 balance, Phase 5 advanced features, Phase 6 social/guild/companion systems) which are layered on top of each other.
- **Idle progression via Web Workers**: A dedicated Web Worker (`src/workers/idleWorker.ts`) and inline worker (`src/hooks/useIdleProgression.ts`) offload idle reward calculations to a background thread.

## Layers

**Frontend (React SPA):**
- Purpose: Render the hacker-themed idle game UI and run the client-side game loop
- Location: `src/`
- Contains: React components, pages, Zustand store, hooks, utilities, Web Worker
- Depends on: Backend API for auth + persistent data, Self for game logic
- Used by: Browser (via Vite dev server or build)

**Backend API (Express):**
- Purpose: RESTful API for authentication, game data persistence, and real-time communication relay
- Location: `api/`
- Contains: Express app, route handlers, middleware, WebSocket server, Supabase client
- Depends on: Supabase for database + auth, JWT for session tokens
- Used by: Frontend via fetch/XHR and WebSocket connections

**Database (Supabase / PostgreSQL):**
- Purpose: Persistent storage for users, game state, social features, marketplace, and narrative content
- Location: `supabase/migrations/` (12+ SQL migration files)
- Contains: Tables for players, quests, story episodes, hacking techniques, AI companions, guilds, friendships, marketplace, events, etc.
- Used by: Backend API via Supabase JS client

**Web Worker:**
- Purpose: Offload idle reward math and AI decision calculations off the main thread
- Location: `src/workers/idleWorker.ts` and inline blob worker in `src/hooks/useIdleProgression.ts`
- Contains: Idle credit/XP/energy calculation functions, operation completion logic
- Used by: `useIdleProgression` hook (instantiated in `src/hooks/useIdleProgression.ts`)

## Data Flow

**Game Loop (Client-Side):**

1. User interacts with UI (starts operation, upgrades equipment, accepts quest)
2. Component calls action from Zustand store (`useGameStore` → e.g., `startOperation()`)
3. Store mutates state synchronously (or schedules async effects)
4. React re-renders via Zustand subscriptions
5. Every 5 seconds, `useIdleProgression` hook sends data to Web Worker for idle reward calculation
6. Worker returns rewards; store applies them (credits, XP, energy, completed operations)
7. AI autoplay system (if enabled) reads store state and makes decisions via `makeAIDecision()` / `executeAIDecision()`

**API Call Flow (Client → Server → Supabase):**

1. Frontend issues fetch to `/api/*` endpoint
2. Vite dev server proxies `/api` requests to `localhost:3001` (`vite.config.ts`)
3. Express app matches route → middleware stack (CORS, logger, auth, rate limiting)
4. Route handler queries Supabase using the server-side service role client (`api/config/supabase.ts`)
5. Response flows back through error handler to client
6. Client optionally updates Zustand store with API response data

**WebSocket Flow (Real-time):**

1. Client connects to WebSocket server (port 8083 local, separate from HTTP on 3001)
2. Client sends `authenticate` message with JWT token
3. Server verifies token via Supabase Auth, registers client in `clients` Map (keyed by userId)
4. Client can join guild chat rooms (`guildRooms` Map with Set of userIds)
5. Messages are broadcast to room members; friend status updates go to online friends
6. Heartbeat every 30 seconds detects stale connections

**State Management:**
- Single Zustand store with ~2300 lines (`src/store/gameStore.ts`)
- No persistence currently active (the `persist` middleware is commented out at line 2318)
- Store contains both state and actions — no separate reducer pattern
- State includes: `player`, `skills`, `equipment`, `operations`, `targets`, `quests`, `storyQuestLines`, `loreEntries`, `aiConfig`, `aiAnalytics`, `currentGuild`, `aiCompanions`, `friendships`, `chatMessages`, `crossPlatformLinks`, and UI state (`activeTab`, `notifications`)
- Actions are plain functions that call `set()` or `get()` from Zustand

## Key Abstractions

**Game Store (`src/store/gameStore.ts`):**
- Purpose: Central state container for the entire game
- Pattern: Single Zustand store with all game state + actions embedded
- Contains: Player model, quest system, narrative system, AI autoplay, guild/companion/social/CrossPlatform state
- Notable: ~2300 lines, 60+ action methods, 40+ TypeScript interfaces

**WebSocket Server (`api/websocket.ts`):**
- Purpose: Real-time communication for guild chat, friend status, companion activities
- Pattern: Singleton class `GameWebSocketServer` with room-based broadcasting
- Key data structures: `clients` Map (userId → WebSocket), `guildRooms` Map (guildId → Set of userIds)
- Message protocol: JSON with `{ type, data, timestamp }` envelope

**API Middleware Stack (`api/middleware/phase6.ts` & `api/middleware/auth.js`):**
- Purpose: Standardized request processing pipeline
- Middleware chain: `corsHandler` → `requestLogger` → `express.json()` → routes → `errorHandler`
- Auth middleware: Verifies JWT via Supabase Auth, attaches user to `req.user`
- Phase 6 middleware adds: rate limiting, guild membership validation, level/credit requirements, companion ownership validation

**Route Handlers (`api/routes/*.ts`):**
- Purpose: RESTful CRUD for game systems
- Pattern: Express Router with async handlers, wrapping Supabase queries
- Each route file maps to a domain: `auth.ts`, `hacking.ts`, `story.ts`, `campaigns.ts`, `guilds.ts`, `companions.ts`, `social.ts`, `marketplace.ts`, etc.

**UI Component Hierarchy:**
- `App.tsx` sets up React Router with 13 routes wrapped in `<Layout>`
- `Layout.tsx` provides the cyber-themed shell with `<Navigation />` + `<NotificationSystem />`
- `Navigation.tsx` renders player stats bar + nav links using `lucide-react` icons
- Each page (`pages/*.tsx`) is a full-screen view composing specialized components
- Specialized components live in `components/` grouped by domain: `ai/`, `quest/`, `quests/`, `narrative/`, `story/`, `investigation/`, `partners/`, `progression/`, `ui/`

**Idle Progression System (`src/hooks/useIdleProgression.ts`):**
- Purpose: Manages the idle game loop — calculates offline rewards, runs AI decisions
- Pattern: React hook that initializes a Web Worker (inline blob), runs a 5-second interval for calculations + AI decision making
- Handles page visibility changes to pause/resume progression
- Calculates: offline credit/XP generation, energy regeneration, operation completion, AI efficiency metrics

## Entry Points

**Frontend:**
- Location: `src/main.tsx`
- Triggers: Browser loads `index.html` → Vite injects React bundle
- Responsibilities: Mounting React app with StrictMode, loading CSS

**Backend (Local Dev):**
- Location: `api/server.ts`
- Triggers: `npm run server:dev` → nodemon → tsx executes `api/server.ts`
- Responsibilities: Creates HTTP server on `process.env.PORT || 3001`, initializes WebSocket server on port 8083, starts listening

**Backend (Vercel Production):**
- Location: `api/index.ts`
- Triggers: Vercel serverless invocation
- Responsibilities: Exports a handler wrapping the Express app for Vercel's serverless runtime

**Web Worker:**
- Location: `src/workers/idleWorker.ts` (separate file) + inline blob created in `src/hooks/useIdleProgression.ts`
- Triggers: Messages from the main thread via `postMessage`
- Responsibilities: `CALCULATE_IDLE_REWARDS` → returns credit/XP/energy/operation completions

## Error Handling

**Strategy:** Layered error handling with typed error classes, recovery strategies, and user-facing notifications.

**Frontend:**
- Custom `GameError` class (`src/utils/errorHandling.ts`) with `ErrorType` enum, `ErrorSeverity` enum, context metadata, and automatic retry strategies
- `ErrorHandler` singleton with error logging, recovery attempts (network retry with backoff, auth refresh, AI fallback, investigation reset, hacking cooldown)
- `fetchWithErrorHandling` wrapper for network calls
- `withErrorHandling` async wrapper for arbitrary functions
- `toast` notifications via `sonner` library for user-facing messages

**Backend:**
- Central `errorHandler` middleware in `api/middleware/phase6.ts` (lines 394-459)
- Handles PostgreSQL error codes (unique violation 23505, foreign key 23503, table missing 42P01)
- Generic 500 fallback, 404 handler for unmatched routes
- Development mode exposes error details

**Patterns:**
- Async route handlers use try/catch with error delegation to `next()`
- Auth middleware returns 401 for missing/invalid tokens
- Rate limiting returns 429 with retry headers
- Validation middleware returns 400 with field-level error details

## Cross-Cutting Concerns

**Logging:**
- Backend: `requestLogger` middleware logs method, path, status, duration, userId for every request
- Frontend: Console logging for store initialization, AI decisions, WebSocket events, worker messages — no structured logging library
- WebSocket: Server logs connections, disconnections, message errors

**Validation:**
- Backend: `validateInput` middleware with Joi-compatible schema (`api/middleware/phase6.ts`)
- Route-level validation for parameters, query strings, request bodies
- Frontend: Minimal validation — mostly in the store (e.g., energy checks before operations, prerequisite checks for quests)

**Authentication:**
- Dual auth middleware: Legacy `auth.js` (JWT verification via Supabase) and Phase 6 `authenticateUser` (same pattern, more user profile data attached)
- Frontend: `src/lib/supabase.ts` uses Supabase anon key with `autoRefreshToken: true` and `persistSession: true`

**Configuration:**
- Environment: `.env` file (not read during analysis), `process.env` variables for Supabase URL, keys, JWT secret
- Frontend: `import.meta.env.VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (with hardcoded fallbacks in `src/lib/supabase.ts`)
- Game balance: Centralized in `src/config/balanceConfig.ts` with `BalanceConfig` interface containing tuning numbers for hacking success rates, campaign rewards, relationship progression, and idle efficiency

---

*Architecture analysis: 2026-05-20*
