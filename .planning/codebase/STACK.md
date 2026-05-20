# Technology Stack

**Analysis Date:** 2026-05-20

## Project Overview

**AI Idle Hacker** is a browser-based idle/incremental hacking game with AI autoplay, guilds, companions, quests, and narrative storylines. It follows a monorepo structure with a React frontend and an Express backend, both written in TypeScript. The game uses Supabase as its database and authentication provider, and is deployable to both Vercel (serverless) and GitHub Pages (static).

---

## Languages

**Primary:**
- **TypeScript** ~5.8.3 — Used across the entire codebase: frontend (`src/`), backend (`api/`), tests (`src/tests/`), and config files (`vite.config.ts`, `vitest.config.ts`)
- **SQL** — Supabase database schema migrations in `supabase/migrations/` (12 migration files)

**Secondary:**
- **CSS** — TailwindCSS components and utility classes in `src/index.css` and inline in TSX
- **HTML** — Single entry point at `index.html`

---

## Runtime

**Environment:**
- **Node.js** (via `tsx`) — Backend runs with `tsx` for TypeScript execution without compilation
- **Browser** — Frontend runs client-side in modern browsers

**Package Manager:**
- **npm** — Lockfile `package-lock.json` present
- Commands: `npm run dev`, `npm run build`, `npm test`, `npm run lint`

---

## Frontend

**Core Framework:**
| Technology | Version | Purpose |
|---|---|---|
| React | ^18.3.1 | UI framework with hooks |
| React DOM | ^18.3.1 | DOM rendering |
| React Router DOM | ^7.8.2 | Client-side routing (14 routes in `App.tsx`) |
| TypeScript | ~5.8.3 | Type-safe JavaScript |

**Build & Dev Tools:**
| Technology | Version | Purpose |
|---|---|---|
| Vite | ^6.3.5 | Build tool and dev server |
| @vitejs/plugin-react | ^4.4.1 | React Fast Refresh + JSX transform |
| vite-tsconfig-paths | ^5.1.4 | TypeScript path alias resolution (`@/` → `src/`) |
| vite-plugin-trae-solo-badge | ^1.0.0 | Trae.ai solo badge overlay in production |
| babel-plugin-react-dev-locator | ^1.0.0 | Dev-time component locator overlay |
| postcss | ^8.5.6 | CSS processing pipeline |
| autoprefixer | ^10.4.21 | Vendor prefixing |

**Vite Config Highlights** (`vite.config.ts`):
- Base path: `/AI-Idle-Hacker/`
- Dev server proxies `/api` to `http://localhost:3001`
- Path alias `@/` → `./src/*`

**Styling:**
| Technology | Version | Purpose |
|---|---|---|
| TailwindCSS | ^3.4.17 | Utility-first CSS framework |
| @tailwindcss/forms | ^0.5.10 | Form input styling |
| @tailwindcss/typography | ^0.5.16 | Prose styling for narrative content |
| tailwind-merge | ^3.3.1 | Merge Tailwind classes without conflicts |
| clsx | ^2.1.1 | Conditional class name construction |

**Tailwind Config Highlights** (`tailwind.config.js`):
- Dark mode via `"class"` strategy
- Custom `cyber` color palette (primary: `#00ff41`, secondary: `#ff0080`, accent: `#00d4ff`)
- Custom fonts: `JetBrains Mono` (mono), `Orbitron` (display/cyber)
- Custom animations: `glow`, `pulse-slow`, `flicker`

**State Management:**
| Technology | Version | Purpose |
|---|---|---|
| Zustand | ^5.0.8 | Global game state with `persist` middleware (`src/store/gameStore.ts`) |

**UI Component Libraries:**
| Technology | Version | Purpose |
|---|---|---|
| @radix-ui/react-slot | ^1.2.3 | Polymorphic component slot primitive |
| class-variance-authority | ^0.7.1 | Component variant management (CVA) |
| lucide-react | ^0.511.0 | Icon library (~800+ icons) |
| sonner | ^2.0.7 | Toast notification system (`src/utils/errorHandling.ts`) |

**App Component Structure:**
- Entry: `src/main.tsx` → renders `<App />`
- Router: `BrowserRouter` with basename `/AI-Idle-Hacker` in `src/App.tsx`
- Layout: `src/components/Layout.tsx` wraps all routes with `Navigation` and `NotificationSystem`
- 14 pages in `src/pages/`: Dashboard, Operations, Character, Equipment, Quests, Marketplace, Leaderboards, Settings, AIAutoplay, GuildManagement, AICompanionHub, SocialDashboard, CrossPlatformSync, Home
- 25+ components in `src/components/` with subdirectories: `ai/`, `ui/`, `quest/`, `quests/`, `story/`, `narrative/`, `investigation/`, `partners/`

---

## Backend

**Core Framework:**
| Technology | Version | Purpose |
|---|---|---|
| Express | ^4.21.2 | HTTP server and routing |
| @types/express | ^4.17.21 | Type definitions |
| cors | ^2.8.5 | CORS middleware |
| dotenv | ^17.2.2 | Environment variable loading |
| jsonwebtoken | ^9.0.2 | JWT generation and verification |
| ws | (via npm) | WebSocket server |

**Backend Structure:**
- Entry point (dev): `api/server.ts` — starts Express app + WebSocket server
- Entry point (Vercel): `api/index.ts` — Vercel serverless handler wrapping Express
- Config: `api/config/supabase.ts` — Supabase client initialization
- Middleware: `api/middleware/auth.js`, `api/middleware/phase6.ts`
- Routes directory: 17 route files in `api/routes/`
  - Core: `auth.ts`, `hacking.ts`, `story.ts`, `intelligence.ts`, `partners.ts`, `ai-partners.ts`, `ai-personality.ts`, `campaigns.ts`, `investigation.ts`, `system.ts`
  - Phase 6: `guilds.ts`, `companions.ts`, `social.ts`, `sync.ts`, `guild-wars.ts`, `mentorship.ts`, `marketplace.ts`

**API Mount Points** (from `api/app.ts`):
- `/api/auth`, `/api/hacking`, `/api/story`, `/api/intelligence`, `/api/partners`, `/api/ai-partners`, `/api/ai-personality`, `/api/campaigns`, `/api/investigation`, `/api/system`
- `/api/guilds`, `/api/companions`, `/api/friends`, `/api/messages`, `/api/social`, `/api/sync`, `/api/guild-wars`, `/api/mentorship`, `/api/marketplace`
- `/api/health` — health check endpoint

**Dev Server:** (`nodemon.json`)
- Runner: `tsx api/server.ts`
- Watches: `api/` directory
- Port: 3001 (default)
- WebSocket: 8083

---

## Database

**Provider:** Supabase (PostgreSQL)
- URL: Hosted at `https://fudyahypzgleezrtdnai.supabase.co`
- Client library: `@supabase/supabase-js` ^2.57.0

**Schema Migrations** (12 files in `supabase/migrations/`):
- `story_episodes_missing_tables.sql` — Story episodes, choices, progress, consequences
- `story_campaigns_schema.sql` — Campaign episodes and branching choices
- `quest_system_phase2_schema.sql` — Players, quests, objectives, progress, rewards (349 lines)
- `hacking_techniques_schema.sql` — Hacking techniques and execution tracking (142 lines)
- `investigation_schema.sql` — Intelligence documents, reports, target profiles (175 lines)
- `ai_personality_schema.sql` — AI partner personalities, traits, relationship dynamics (222 lines)
- `partner_cooperation_schema.sql` — Partner cooperation mechanics
- `episodic_campaign_schema.sql` — Episodic campaign delivery
- `phase5_advanced_features.sql` — Special events, leaderboards, difficulty scaling, analytics (230 lines)
- `quest_permissions.sql`, `interaction_history_table.sql`, `add_interaction_date_column.sql`

**Database Tables Created:**
- `players`, `users`, `quests`, `quest_categories`, `quest_objectives`, `quest_progress`
- `story_episodes`, `story_episode_choices`, `story_choices`, `player_episode_choices`, `player_choices`, `story_consequences`, `player_episode_progress`
- `hacking_techniques`, `hacking_executions`
- `intelligence_docs`, `investigation_reports`, `target_profiles`
- `partner_personalities`, `personality_traits`, `relationship_dynamics`
- `campaign_metadata`, `campaign_progress`
- `special_events`, `event_participation`, `event_leaderboards`, `player_difficulty_profiles`
- `guilds`, `guild_members`, `guilds_chat_messages`, `friendships`, `ai_companions`, `marketplace_listings`, `cross_platform_links`
- Row Level Security (RLS) enabled on all tables

**Two Supabase Clients** (`api/config/supabase.ts`):
- `supabase` (service role key) — Server-side operations with full access
- `supabaseAnon` (anon key) — Client-side operations (frontend uses `src/lib/supabase.ts`)

---

## Testing

| Technology | Version | Purpose |
|---|---|---|
| Vitest | ^3.2.4 | Test runner and assertion library |
| @testing-library/react | ^16.3.0 | React component testing |
| @testing-library/jest-dom | ^6.8.0 | Custom DOM matchers |
| jsdom | ^26.1.0 | DOM environment for tests |

**Test Config** (`vitest.config.ts`):
- Globals: `true`
- Environment: `jsdom`
- Setup: `./src/tests/setup.ts`
- CSS: `true`
- Coverage reporters: text, json, html

**Test Commands:**
```bash
npm test              # Run tests in watch mode
npm run test:run      # Run tests once
npm run test:ui       # Run tests with Vitest UI
```

**Test Files:**
- `src/tests/setup.ts` — Global mocks (IntersectionObserver, ResizeObserver, fetch, localStorage, etc.)
- `src/tests/integration.test.ts` — Phase 4 integration tests (590 lines)
- `src/tests/phase4Integration.test.ts` — Additional Phase 4 tests
- `src/test/` — Legacy test files

---

## Code Quality

| Technology | Version | Purpose |
|---|---|---|
| ESLint | ^9.25.0 | Code linting |
| typescript-eslint | ^8.30.1 | TypeScript linting rules |
| eslint-plugin-react-hooks | ^5.2.0 | React Hooks linting rules |
| eslint-plugin-react-refresh | ^0.4.19 | React Fast Refresh linting |
| globals | ^16.0.0 | Global variable definitions |

**TypeScript Config** (`tsconfig.json`):
- Target: ES2020
- Module: ESNext with bundler resolution
- JSX: `react-jsx`
- Strict mode: `false` (noUnusedLocals, noUnusedParameters, noFallthroughCasesInSwitch all disabled)
- Path alias: `@/*` → `./src/*`
- Includes: `src`, `api`

---

## Web Workers

- `src/workers/idleWorker.ts` — Web Worker for idle progression calculations (offline credit/XP generation, energy restoration, operation completion)
- `src/hooks/useIdleProgression.ts` — React hook that spawns an inline Web Worker and manages idle reward processing (575 lines)

---

## Key Architecture Patterns

1. **State Flow**: Zustand store (`src/store/gameStore.ts`) is the single source of truth for game state. Components consume via hooks (`useGameStore`). API calls write to Supabase; store is updated optimistically.

2. **Idle Loop**: `useIdleProgression` hook runs a timer (configurable interval), posts data to a Web Worker, receives calculated rewards, and updates the store.

3. **AI Autoplay**: `gameStore.makeAIDecision()` and `gameStore.executeAIDecision()` form an autonomous decision loop that starts operations, upgrades equipment, and manages skills based on configurable priorities and risk tolerance.

4. **API Pattern**: Express routes follow a consistent pattern — authenticate via Supabase JWT, query Supabase, return JSON `{ success, data/error }`.

---

## Platform & Deployment

| Platform | Purpose | Config File |
|---|---|---|
| Vercel | Serverless backend hosting (API routes) | `vercel.json`, `.vercel/project.json` |
| GitHub Pages | Static frontend hosting | `npm run deploy` (gh-pages) |
| Live URL | `https://poketoons251-pixel.github.io/AI-Idle-Hacker/` | README.md |

**Vercel Config** (`vercel.json`):
```json
{"rewrites":[{"source":"/(.*)","destination":"/index.html"}]}
```

---

*Stack analysis: 2026-05-20*
