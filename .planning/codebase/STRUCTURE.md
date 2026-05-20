# Codebase Structure

**Analysis Date:** 2026-05-20

## Directory Layout

```
AI-Idle-Hacker/
├── api/                     # Express backend (server + Vercel serverless)
│   ├── config/              # Supabase client configuration
│   ├── middleware/           # Auth, CORS, logging, rate limiting, validation
│   ├── routes/              # 17 route modules (REST endpoints)
│   ├── types/               # Express type extensions
│   ├── app.ts               # Express app setup (middleware + route mounting)
│   ├── index.ts             # Vercel serverless handler
│   ├── server.ts            # Local dev server (HTTP + WebSocket bootstrap)
│   └── websocket.ts         # WebSocket server (guild chat, friends, companions)
├── public/                  # Static assets (Vite public dir)
├── src/                     # Frontend React application
│   ├── assets/              # Static assets (react.svg)
│   ├── components/          # React components (25+ files/dirs)
│   │   ├── ai/              # AI autoplay sub-components (5 files)
│   │   ├── investigation/   # Investigation panel component
│   │   ├── narrative/       # Codex, NPCDialogue, NarrativeQuest components
│   │   ├── partners/        # Partner coordination hub
│   │   ├── progression/     # Progression panel
│   │   ├── quest/           # Enhanced quest system (generator, completion, twists)
│   │   ├── quests/          # Quest UI (cards, lore, choices, objectives, story lines)
│   │   ├── story/           # Story choice dialog + integration
│   │   └── ui/              # Reusable UI primitives (8 files)
│   ├── config/              # Game balance configuration
│   ├── data/                # Static content data (6 files)
│   ├── hooks/               # Custom React hooks (2 files)
│   ├── lib/                 # Supabase client + utility functions
│   ├── pages/               # Full-page route components (14 pages)
│   ├── services/            # WebSocket client service
│   ├── store/               # Zustand game store (sole store)
│   ├── test/                # Quest system test file
│   ├── tests/               # Integration tests + Vitest setup
│   ├── utils/               # Game utility functions (3 files)
│   └── workers/             # Web Worker for idle calculations
├── supabase/
│   └── migrations/          # 12 SQL migration files
├── .planning/               # Planning documents
├── .trae/                   # Trae IDE design docs
├── package.json             # Dependencies + scripts
├── tsconfig.json            # TypeScript config (path alias @/* → ./src/*)
├── vite.config.ts           # Vite config (React, proxy, TS path plugin)
├── vitest.config.ts         # Vitest test runner config
├── tailwind.config.js       # Tailwind CSS config (cyber theme)
├── postcss.config.js        # PostCSS config
├── eslint.config.js         # ESLint flat config
├── vercel.json              # Vercel deployment config (SPA rewrites)
├── nodemon.json             # Nodemon config for local API server
└── index.html               # Vite HTML entry point
```

## Directory Purposes

**`api/` — Backend API Server:**
- Purpose: Express.js REST API + WebSocket server for game persistence and real-time features
- Contains: Route handlers (17 route modules), middleware (auth, CORS, rate limiting, logging, validation), Supabase configuration, WebSocket server
- Key files: `app.ts` (Express app with all middleware + routes), `server.ts` (local dev bootstrap), `index.ts` (Vercel serverless handler), `websocket.ts` (WebSocket server for real-time features)
- Route count: 17 route files covering authentication, hacking, story, intelligence, campaigns, partners, AI companions, AI personality, guilds, companions, social, sync, guild wars, mentorship, marketplace, investigation, and system health

**`src/` — Frontend React Application:**
- Purpose: Complete SPA game client with routing, state management, UI components, and idle progression engine
- Contains: Pages (14), components (25+ files/dirs), store (Zustand), hooks, utilities, Web Worker, static data, configuration
- Entry point: `main.tsx` → `App.tsx` (Router + Layout)

**`src/components/` — Reusable UI Components:**
- Purpose: Domain-grouped React components for every game system
- Groups:
  - `ai/` — Autoplay controls, strategy config, performance analytics, resource optimization, smart operation management
  - `investigation/` — Investigation panel
  - `narrative/` — Codex system, NPC dialogue, narrative quest system
  - `partners/` — Partner coordination hub
  - `progression/` — Progression panel
  - `quest/` — Enhanced quest system (generator, twist handler, completion celebration)
  - `quests/` — Quest UI (cards, choices, objectives, lore viewer, story quest line)
  - `story/` — Story choices dialog + integration with quest system
  - `ui/` — Atomic UI primitives: `badge.tsx`, `button.tsx`, `card.tsx`, `ChatBox.tsx`, `NotificationToast.tsx`, `progress.tsx`, `StatusIndicator.tsx`, `tabs.tsx`
- Top-level components: `Layout.tsx`, `Navigation.tsx`, `NotificationSystem.tsx`, `TerminalInterface.tsx`, `AdvancedAIAutoplay.tsx`, `AIPersonalitySystem.tsx`, `CampaignEpisodeViewer.tsx`, `EnhancedAIPersonality.tsx`, `EpisodicContentDelivery.tsx`, `HackingTechniqueSelector.tsx`, `IdleOptimizationSystem.tsx`, `Phase3Integration.tsx`, `QuestSystemTest.tsx`, `RelationshipDynamicsPanel.tsx`, `SmartInvestigationSystem.tsx`

**`src/pages/` — Route-Level Page Components:**
- Purpose: Top-level screens rendered by React Router — each corresponds to a nav link
- Contains: 14 page components — `Dashboard.tsx`, `Operations.tsx`, `Character.tsx`, `Equipment.tsx`, `Marketplace.tsx`, `Leaderboards.tsx`, `Settings.tsx`, `AIAutoplay.tsx`, `Quests.tsx`, `Home.tsx`, `GuildManagement.tsx`, `AICompanionHub.tsx`, `SocialDashboard.tsx`, `CrossPlatformSync.tsx`

**`src/store/` — Application State:**
- Purpose: Single Zustand store holding all game state
- Key file: `gameStore.ts` (~2331 lines) — contains all TypeScript interfaces (Player, Operation, Quest, Guild, AICompanion, etc.), initial state, and 60+ action methods
- All game data (operations, quests, lore, targets, AI config) initialized with hardcoded default values

**`src/utils/` — Game Logic Utilities:**
- `errorHandling.ts` (~577 lines) — typed error system with `GameError` class, recovery strategies, singleton `ErrorHandler`
- `rewardCalculator.ts` (~206 lines) — quest reward calculation with scaling factors, difficulty bonuses, reputation bonuses
- `questMechanics.ts` (~426 lines) — quest mechanics engine with handler state machine

**`src/hooks/` — Custom React Hooks:**
- `useIdleProgression.ts` (~575 lines) — idle game loop hook: Web Worker lifecycle, AI decision engine, efficiency calculations
- `useTheme.ts` (~29 lines) — light/dark theme toggle with localStorage persistence

**`src/services/` — Client-Side Services:**
- `websocketService.ts` (~197 lines) — WebSocket client singleton with simulated events, reconnection logic, event emitter pattern for guild chat, friend status, notifications

**`src/workers/` — Web Workers:**
- `idleWorker.ts` (~199 lines) — standalone Web Worker for idle reward calculations (alternative to inline blob in the hook)

**`src/data/` — Static Game Content:**
- 6 data modules: `environmentalStory.ts`, `loreEntries.ts`, `narrativeQuests.ts`, `npcDialogues.ts`, `questTwists.ts`, `questTypes.ts`

**`supabase/migrations/` — Database Schema:**
- 12 SQL migration files defining tables for: players, quests (categories, objectives, rewards, choices), story episodes/campaigns, hacking techniques, AI personalities, partner cooperation, investigation reports, special events, marketplace listings

## Key File Locations

**Entry Points:**
- `src/main.tsx`: React app mount point
- `index.html`: Vite HTML entry
- `api/server.ts`: Local backend server entry
- `api/index.ts`: Vercel serverless handler
- `src/workers/idleWorker.ts`: Web Worker entry (also created as inline blob in `useIdleProgression.ts`)

**Configuration:**
- `package.json`: Dependencies and all scripts
- `tsconfig.json`: TypeScript config with `@/*` → `./src/*` path alias
- `vite.config.ts`: Build config, React plugin, proxy to `localhost:3001`
- `tailwind.config.js`: Tailwind with cyberpunk theme colors
- `vercel.json`: SPA rewrite rules for deployment
- `nodemon.json`: Dev server config for `api/server.ts`
- `vitest.config.ts`: Test runner config

**Core Logic:**
- `src/store/gameStore.ts`: ALL game state, initial data, and actions (~2331 lines)
- `src/hooks/useIdleProgression.ts`: Idle game loop, AI decision engine, Web Worker bridge
- `src/utils/errorHandling.ts`: Typed error system with recovery strategies
- `api/websocket.ts`: WebSocket server for real-time multiplayer
- `api/middleware/phase6.ts`: API middleware stack (auth, rate limiting, validation)

**Testing:**
- `src/tests/integration.test.ts`: Integration test
- `src/tests/phase4Integration.test.ts`: Phase 4 integration tests
- `src/tests/setup.ts`: Vitest setup
- `src/test/questSystemTest.ts`: Standalone quest system test

## Naming Conventions

**Files:**
- React components: PascalCase — `Dashboard.tsx`, `Navigation.tsx`, `AIPersonalitySystem.tsx`
- Utilities/hooks: camelCase — `errorHandling.ts`, `useIdleProgression.ts`, `rewardCalculator.ts`
- API routes: kebab-case domain names — `ai-partners.ts`, `guild-wars.ts`
- Config files: kebab-case — `vite.config.ts`, `tailwind.config.js`, `nodemon.json`

**Directories:**
- Frontend directories: lowercase, single-word or hyphenated — `components/`, `pages/`, `store/`, `utils/`, `hooks/`
- Component sub-directories: lowercase single word — `ai/`, `ui/`, `quest/`, `quests/`, `narrative/`, `story/`

**Functions:**
- React components: PascalCase function declarations or arrow functions with `React.FC` type
- Store actions: camelCase — `startOperation`, `completeOperation`, `gainExperience`, `sendFriendRequest`
- Utility functions: camelCase — `calculateReward`, `fetchWithErrorHandling`, `cn` (classnames)
- API route handlers: async functions with Express `Request`/`Response` typing

**Variables:**
- camelCase throughout — `playerSkills`, `activeOperations`, `successRate`
- TypeScript types/interfaces: PascalCase — `Player`, `Operation`, `Quest`, `AIConfig`, `Guild`

## Where to Add New Code

**New Feature (e.g., new game system):**
1. Define TypeScript interfaces in `src/store/gameStore.ts`
2. Add initial state + action methods in the same store file
3. Create page component in `src/pages/` if it needs a full route
4. Create domain-specific components in `src/components/<domain>/`
5. Add route to `src/App.tsx` if it's a new page
6. Add API routes in `api/routes/<name>.ts` if server persistence is needed
7. Register API route in `api/app.ts` with Express router
8. Add Supabase migration in `supabase/migrations/` if new tables are needed
9. Add test in `src/tests/` if adding integration testing

**New Component/Module:**
- Implementation: `src/components/` — use existing subdirectory for the domain (`ai/`, `quest/`, `narrative/`, `ui/`) or create a new one
- Page component: `src/pages/<PageName>.tsx`
- Shared UI primitive: `src/components/ui/<name>.tsx`

**Utilities:**
- Game logic: `src/utils/<name>.ts`
- Shared helpers: `src/lib/utils.ts` (currently just the `cn()` Tailwind helper)

**Hooks:**
- Custom hooks: `src/hooks/use<Name>.ts`

**API Routes:**
- Backend endpoints: `api/routes/<name>.ts` — follows pattern of Express Router with async handlers
- Middleware: `api/middleware/` for reusable request processing

## Special Directories

**`.planning/`:**
- Purpose: GSD planning documents, codebase maps, and project management artifacts
- Generated: Yes (by GSD workflow)
- Committed: Yes (tracked in git)

**`.trae/`:**
- Purpose: Trae IDE design documents and specifications
- Generated: Not applicable (hand-written design docs)
- Committed: Yes

**`node_modules/`:**
- Purpose: NPM package dependencies
- Generated: Yes (by `npm install`)
- Committed: No (in `.gitignore`)

**`supabase/migrations/`:**
- Purpose: PostgreSQL schema migrations in SQL
- Generated: No (hand-written)
- Committed: Yes

---

*Structure analysis: 2026-05-20*
