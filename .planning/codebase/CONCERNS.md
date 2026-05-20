# Codebase Concerns

**Analysis Date:** 2026-05-20

## Critical Severity

### Hardcoded Supabase Anon Key in Frontend Source
- **Issue:** The Supabase anonymous API key is hardcoded as a fallback value in `src/lib/supabase.ts` (line 5), exposed directly in client-side source code.
- **Files:** `src/lib/supabase.ts`
- **Impact:** Anyone who inspects the client bundle can obtain the anon key. While Supabase anon keys are designed to be public by default (RLS provides security), this represents a misunderstanding of the security model — the real risk is that the hardcoded fallback could be a stale/invalid key or could be replaced with a production key accidentally. Additionally, the service role key is never appropriate in client code, but the presence of a hardcoded key suggests a pattern that could lead to credential leakage.
- **Fix approach:** Remove the hardcoded fallback values and rely exclusively on `import.meta.env.VITE_SUPABASE_ANON_KEY`. Ensure all `.env.*` files are in `.gitignore` and never committed.

### Hardcoded JWT Secret in WebSocket Server
- **Issue:** The WebSocket server in `api/websocket.ts` (line 127) falls back to `'your-secret-key'` when `JWT_SECRET` is not set, which is a well-known placeholder secret.
- **Files:** `api/websocket.ts`
- **Impact:** If deployed with the default `JWT_SECRET`, any attacker can forge valid JWT tokens, authenticate to the WebSocket server, and access real-time features, impersonating any user.
- **Fix approach:** Remove the hardcoded fallback. Throw an error at startup if `JWT_SECRET` is not set, or use a randomly generated ephemeral secret only in development mode.

### TypeScript Type Checking Disabled for Entire Game Store
- **Issue:** `src/store/gameStore.ts` opens with `// @ts-nocheck` (line 1), completely disabling TypeScript type checking for the entire 2331-line file.
- **Files:** `src/store/gameStore.ts`
- **Impact:** Every type error, missing property, and incorrect argument in the core state management file is invisible to the compiler. This file contains 80+ interfaces, 20+ state fields, and 80+ action methods — all unchecked. The `/* eslint-disable semi */` also disables semicolon linting.
- **Fix approach:** Remove the `@ts-nocheck` and `eslint-disable semi` directives. Fix the type errors that surface. Consider breaking the store into smaller slices to make it manageable.

### TypeScript Strict Mode Fully Disabled
- **Issue:** `tsconfig.json` (line 19) sets `"strict": false`, and explicitly disables `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`, `noUncheckedSideEffectImports`, and `forceConsistentCasingInFileNames`.
- **Files:** `tsconfig.json`
- **Impact:** The entire codebase has no strict null checks, no implicit-any prevention, and no unused-variable warnings. This means null reference errors, undefined property access, and type mismatches will only be caught at runtime, not during development.
- **Fix approach:** Enable `strict: true` incrementally. Start with `strictNullChecks`, then `noImplicitAny`, then the full `strict` flag. Fix the ~200+ errors that will surface.

### Missing Auth Middleware on Express Request.user Usage
- **Issue:** Multiple API routes (`sync.ts`, `mentorship.ts`, `companions.ts`, etc.) access `req.user` in their handlers but do NOT apply the `authenticateUser` middleware on their routes. The `req.user` property is only typed via a global declaration (`api/types/express.d.ts`) but the middleware that populates it is never applied to these route files.
- **Files:** `api/routes/sync.ts`, `api/routes/mentorship.ts`, `api/routes/companions.ts`, `api/routes/social.ts`, `api/routes/marketplace.ts`, `api/routes/guilds.ts`, `api/routes/guild-wars.ts`, `api/routes/ai-partners.ts`, `api/routes/ai-personality.ts`, `api/routes/campaigns.ts`, `api/routes/intelligence.ts`, `api/routes/investigation.ts`, `api/routes/partners.ts`
- **Impact:** All these routes will crash with a TypeError when accessing `req.user.id` because `req.user` is undefined. The authentication middleware from `auth.js` was never applied to these route groups in `app.ts`. This is a production-blocking bug.
- **Fix approach:** Apply the `authenticateUser` middleware from `api/middleware/auth.js` (or `phase6.ts`) to every route group that needs authentication in `api/app.ts`.

### Supabase Service Role Key Silent Fallback
- **Issue:** `api/routes/hacking.ts` (line 11-14) creates a new Supabase client with `process.env.SUPABASE_URL || ''` and `process.env.SUPABASE_SERVICE_ROLE_KEY || ''`. If the env vars are missing, it silently creates a client with empty credentials.
- **Files:** `api/routes/hacking.ts`, `api/config/supabase.ts`
- **Impact:** The hacking route initializes its OWN Supabase client (instead of using the shared one from `api/config/supabase.ts`), duplicating configuration. The empty string fallback will cause confusing failures at runtime instead of failing fast at startup.
- **Fix approach:** Remove the redundant `createClient` call in `hacking.ts` and import the shared `supabase` client from `../config/supabase.js`.

### In-Memory Rate Limiting Does Not Scale
- **Issue:** `api/middleware/phase6.ts` (line 30) implements rate limiting using an in-memory `Map<string, { count, resetTime }>`.
- **Files:** `api/middleware/phase6.ts`
- **Impact:** Rate limits are per-process. In any multi-instance deployment (horizontal scaling, serverless functions via Vercel), each instance has its own counter, making rate limiting ineffective. On Vercel (which this project targets per `vercel.json`), each request may hit a different serverless function instance.
- **Fix approach:** Replace in-memory rate limiting with a database-backed approach using Supabase, or use an external store like Redis. The comment on line 29 ("in production, use Redis") confirms the team is aware but hasn't addressed it.

---

## High Severity

### Duplicate Authentication Middleware Implementations
- **Issue:** There are TWO separate authentication middleware implementations: `api/middleware/auth.js` (JavaScript, 39 lines) and `api/middleware/phase6.ts` (TypeScript, 543 lines) which contains its own `authenticateUser` function with the same logic but different response shapes.
- **Files:** `api/middleware/auth.js`, `api/middleware/phase6.ts`
- **Impact:** Inconsistent behavior — `auth.js` returns `{ error: "..." }` while `phase6.ts` returns `{ success: false, error: "..." }` for authentication failures. `auth.js` is used by `system.ts` and `story.ts`, while `phase6.ts` middleware is registered globally in `app.ts` but NOT actually applied to any routes (it's imported but the `requestLogger` and `corsHandler` are the only functions used). The `authenticateUser` from `phase6.ts` is never applied to any routes.
- **Fix approach:** Consolidate to a single auth middleware. Remove the legacy `auth.js` and fix `phase6.ts`'s `authenticateUser` to match response conventions. Then apply it to all protected routes.

### Duplicate Test Directories
- **Issue:** Two test directories exist: `src/test/` contains `questSystemTest.ts` (108 lines, a manual test runner with `window.testQuestSystem`) and `src/tests/` contains actual Vitest test files.
- **Files:** `src/test/questSystemTest.ts`, `src/tests/integration.test.ts`, `src/tests/phase4Integration.test.ts`, `src/tests/setup.ts`
- **Impact:** The test in `src/test/` is not run by Vitest (the test runner), is dead code that only works when manually invoked via the browser console. It also directly mutates the Zustand store state, which can cause side effects.
- **Fix approach:** Delete `src/test/questSystemTest.ts` and the `src/test/` directory. Its functionality is either covered by the Vitest tests or should be converted to a proper test.

### Massive Monolithic Game Store (2331 Lines)
- **Issue:** `src/store/gameStore.ts` is a single file containing 80+ interface definitions, 80+ action methods, and massive amounts of inline data/initialization. It implements guild systems, companion systems, social systems, quest systems, narrative systems, AI systems, and game mechanics all in one file.
- **Files:** `src/store/gameStore.ts`
- **Impact:** Impossible to reason about, test, or modify safely. The file has `@ts-nocheck` partly because fixing all the type errors in such a large file is prohibitively difficult. Any change risks breaking unrelated features. The file has multiple inconsistencies (e.g., `GuildWar` uses `attackerGuildId`/`defenderGuildId` in the `startGuildWar` method but the interface uses `attackingGuildId`/`defendingGuildId`).
- **Fix approach:** Slice the store into separate Zustand stores using `slice` pattern: `playerSlice`, `questSlice`, `guildSlice`, `companionSlice`, etc. Each slice under `src/store/slices/`.

### Quest System Fragmentation (quest/ vs quests/)
- **Issue:** There are TWO parallel quest component directories: `src/components/quest/` (EnhancedQuestSystem, QuestCompletionCelebration, QuestGenerator, QuestTwistHandler) and `src/components/quests/` (LorePanel, LoreViewer, QuestCard, QuestChoiceDialog, QuestObjectiveTracker, StoryQuestLine).
- **Files:** Directories `src/components/quest/` and `src/components/quests/`
- **Impact:** Unclear which set is the "current" implementation. Both contain different components with overlapping responsibilities (QuestCard vs QuestGenerator, StoryQuestLine vs NarrativeQuestSystem). This indicates two phases of development that were never consolidated.
- **Fix approach:** Either merge into a single `src/components/quest/` directory or clearly delineate roles (e.g., `quests/` = display components, `quest/` = logic components).

### Narrative System Fragmentation (narrative/ vs story/)
- **Issue:** Similar to quests, there are `src/components/narrative/` (CodexSystem, NarrativeQuestSystem, NPCDialogueSystem) and `src/components/story/` (StoryChoiceDialog, StoryQuestIntegration). The `src/data/` directory also has `questTypes.ts` and `questTwists.ts` with narrative data.
- **Files:** Directories `src/components/narrative/`, `src/components/story/`, `src/data/questTypes.ts`, `src/data/questTwists.ts`
- **Impact:** Unclear separation of concerns. The narrative data in `src/data/` overlaps with quest data in `src/store/gameStore.ts`. The component directories may both be partially used.
- **Fix approach:** Consolidate into a single `src/components/narrative/` directory with clear component hierarchy.

### Duplicate Web Worker Logic
- **Issue:** `src/workers/idleWorker.ts` (199 lines) defines proper typed idle calculation worker code, but `src/hooks/useIdleProgression.ts` (lines 42-165) ALSO creates an inlined Web Worker via `Blob` with duplicate (and slightly different) calculation logic.
- **Files:** `src/workers/idleWorker.ts`, `src/hooks/useIdleProgression.ts`
- **Impact:** The standalone worker file is never used — the hook creates its own inline worker. The two implementations have diverged: different values for base regen rates, skill bonuses, and equipment scaling. The inline blob worker is harder to debug, cannot be tree-shaken, and increases bundle size.
- **Fix approach:** Delete `src/workers/idleWorker.ts` and refactor the blob-based inline worker to use a proper Worker import. Or, keep the standalone file and have the hook import it properly.

### Stub API Routes with Empty Handlers
- **Issue:** `api/routes/auth.ts` (34 lines) has three route handlers (`/register`, `/login`, `/logout`) that are completely empty except for `// TODO: Implement register/logic logic` comments. They do nothing and return nothing (the response is never sent).
- **Files:** `api/routes/auth.ts`
- **Impact:** These endpoints hang forever (never sending a response) because the async functions don't call `res.json()` or `res.status()`. The client will time out after 30+ seconds on these routes. This blocks any auth-dependent flow.
- **Fix approach:** Either implement the auth routes properly using Supabase Auth, or remove the route registrations from `app.ts` and clearly mark auth as not-yet-implemented with appropriate error responses.

### Simulated WebSocket in Production Code
- **Issue:** `src/services/websocketService.ts` (197 lines) implements a fully simulated WebSocket that never actually connects to a real server. It generates fake events (guild chat, friend status, notifications) on timers using `setInterval`. The `isConnected()` method always returns `true` (line 182: `return true; // Simulated as always connected`).
- **Files:** `src/services/websocketService.ts`
- **Impact:** This code gives users a false sense of real-time functionality. The simulated data doesn't correspond to actual game state. When a real WebSocket server is eventually added, the API surface may need to change, breaking all consumers.
- **Fix approach:** Gate the simulated behavior behind a `VITE_USE_SIMULATED_WS` flag. When the flag is false, attempt a real connection to the server's WebSocket endpoint (running on port 8083 per `api/server.ts`).

### Missing Return After Error Responses in Async Route Handlers
- **Issue:** Multiple route files have async handlers that call `res.status().json()` for error cases but don't `return`, so execution continues after the error response. For example, `api/routes/story.ts` line 24: `return res.status(500).json({ error: progressError.message });` — this one is correct, but other routes like `api/routes/hacking.ts` line 57-59 send a response but do NOT return it.
- **Files:** `api/routes/hacking.ts` (lines 57, 89, 138), `api/routes/system.ts` (multiple)
- **Impact:** In non-returned error paths, the function continues executing, potentially sending multiple responses to the same request, causing `ERR_HTTP_HEADERS_SENT` errors and memory leaks.
- **Fix approach:** Ensure EVERY `res.status().json()` call in route handlers is preceded by `return`. Use a consistent pattern of `return res.status(N).json(...)`.

### Empty/Dead Page: Home.tsx
- **Issue:** `src/pages/Home.tsx` contains only `export default function Home() { return <div></div>; }` — an empty component that is never imported or routed to in `App.tsx`.
- **Files:** `src/pages/Home.tsx`
- **Impact:** Dead code that adds confusion about the routing structure.
- **Fix approach:** Delete `Home.tsx`.

### Unused Empty.tsx Component
- **Issue:** `src/components/Empty.tsx` exists but is imported nowhere in the codebase (checked via grep).
- **Files:** `src/components/Empty.tsx`
- **Impact:** Dead code.
- **Fix approach:** Delete `Empty.tsx` if not needed, or add it to barrel exports.

---

## Medium Severity

### Rate Limit Store Memory Leak
- **Issue:** The in-memory `rateLimitStore` Map in `api/middleware/phase6.ts` only cleans up stale entries when a new request comes in for that exact key (line 109: `for (const [k, v] of rateLimitStore.entries())`). Keys that are never accessed again will persist indefinitely.
- **Files:** `api/middleware/phase6.ts`
- **Impact:** In a long-running server, the Map will grow proportionally to the number of unique IP+path combinations ever seen, consuming increasing memory.
- **Fix approach:** Add a periodic cleanup interval (e.g., every 5 minutes) that purges all expired entries. Or use a `Map` with TTL-based eviction library.

### Input Validation Middleware Uses Non-Existent Validation Library
- **Issue:** `api/middleware/phase6.ts` exports a `validateInput` function (line 250) that calls `schema.validate(req.body)`, but no validation library (Joi, Zod, Yup) is imported anywhere in the file or in the project's dependencies.
- **Files:** `api/middleware/phase6.ts`
- **Impact:** Any route using this middleware will crash with a `TypeError: schema.validate is not a function` at runtime.
- **Fix approach:** Import a validation library (e.g., `joi` or `zod`) and add it to `package.json`. Or implement proper validation inline.

### Type Mismatches Between Frontend and Backend Interfaces
- **Issue:** The `GameStore` interfaces in `src/store/gameStore.ts` use different field names and types than the Supabase table schemas. For example:
  - `GuildWar` uses `attackerGuildId`/`defenderGuildId` in the method but `attackingGuildId`/`defendingGuildId` in the interface
  - `AICompanion` has `hacker | analyst | social | guardian` type while API expects `hacker | social | combat | hybrid`
  - `CompanionTraining` in the store has `skill: string` but the API has `skill_type: string`
  - Store uses `isRepeatable` but SQL uses `is_repeatable`
  - Store uses `type: 'direct' | 'guild' | 'system'` for chat messages but API expects `text | system | announcement`
- **Files:** `src/store/gameStore.ts`, multiple `api/routes/*.ts`, multiple SQL migration files in `supabase/migrations/`
- **Impact:** Data flowing between frontend and backend will be silently corrupted or lost. Type mismatches won't be caught until runtime because strict mode is disabled.
- **Fix approach:** Create shared TypeScript types in `src/types/` and `api/types/` that align exactly with the database schema. Use code generation from the Supabase schema.

### Quest Reward System Has Undefined Behavior for Several Cases
- **Issue:** In `src/store/gameStore.ts`, the `claimReward` method (line 1260) has several reward type handlers that are incomplete:
  - `cosmetic` type (line 1354): Only pushes a message string to the rewards array, never actually grants any item
  - `access_unlock` type (line 1374): Only adds a message, never performs any unlock
  - The `unlock_quest` and `story_branch` consequence handlers in `makeQuestChoice` (lines 1948-1956) are completely empty with only comments
- **Files:** `src/store/gameStore.ts` (lines 1353-1377, 1948-1956)
- **Impact:** Players who earn cosmetic or access_unlock rewards receive notifications but nothing actually happens. Quest choices that should unlock new quests or branch stories have no effect.
- **Fix approach:** Either implement the missing handlers or remove these reward/consequence types from the valid type unions.

### Quest Types Reference Non-Existent Objective Types
- **Issue:** The initial quest data in `gameStore.ts` uses objective types like `'experience_gain'` (line 758), `'target_hack'` (line 869), `'data_extraction'` (line 878) that are NOT defined in the `QuestObjective.type` union (line 88: `'operation_complete' | 'credits_earn' | 'level_reach' | 'skill_upgrade' | 'equipment_purchase' | 'target_unlock' | 'achievement_unlock'`).
- **Files:** `src/store/gameStore.ts` (lines 758, 869, 878)
- **Impact:** Quest objectives may never be tracked or completed because the type-checking logic in `updateQuestProgress` doesn't handle these types. The quests can never be completed by the player.
- **Fix approach:** Either add the missing objective types to the interface union or update quest data to use only valid types.

### Achievement Interface Has Undefined `rewards` Property
- **Issue:** The initial `Achievement` data (line 623) includes a `rewards` property: `{ credits: 100, experience: 50 }`, but the `Achievement` interface (lines 75-82) does NOT define a `rewards` field. This means the rewards data is silently dropped and inaccessible.
- **Files:** `src/store/gameStore.ts` (lines 75-82, 623-630)
- **Impact:** Achievements can never grant their rewards. The TypeScript compiler would catch this if `@ts-nocheck` wasn't disabling it.
- **Fix approach:** Add `rewards?: { credits: number; experience: number; }` to the `Achievement` interface and implement reward granting logic, or remove the rewards from the data.

### Unused Imports and ESLint Suppressions
- **Issue:** Multiple files have unused imports:
  - `api/middleware/phase6.ts` imports `Request, Response, NextFunction` from express (lines 5) — used
  - `api/routes/hacking.ts` imports `dotenv` (line 3) but `dotenv.config()` is called in `api/app.ts` already
  - `api/routes/companions.ts` has unused `createClient`
  - `src/hooks/useIdleProgression.ts` imports `Skills` (line 2) from gameStore but uses it only as a type cast (line 320), not as a proper type annotation
- **Files:** Multiple files across the codebase
- **Impact:** Slightly increased bundle size and mental overhead. Hidden type issues when unused imports mask real problems.
- **Fix approach:** Run ESLint with `noUnusedLocals` and `noUnusedParameters` enabled. Clean up all unused imports.

### In-Memory State with No Persistence to Backend
- **Issue:** The Zustand store's `persist` middleware is commented out (lines 2318-2331) with the note "Temporarily disabled persist to debug data loading." The frontend never saves game state to the Supabase backend. All game state is in-memory and will be lost on page refresh.
- **Files:** `src/store/gameStore.ts`
- **Impact:** Game progress is entirely lost on page refresh. The actual game cannot function as an idle game (which requires persistent state).
- **Fix approach:** Either re-enable the Zustand `persist` middleware to use `localStorage` as a quick fix, or implement proper save/load against the Supabase `/api/sync/save` and `/api/sync/saves` endpoints.

### Quest Mechanic Engine Uses Skill Values From Non-Existent Skill Names
- **Issue:** `src/utils/questMechanics.ts` accesses skills from `engine.player.skills` using names like `'stealth'`, `'social'`, `'hardware'`, `'ai'`, `'investigation'` (lines 178, 196, 213, 230, 252, 272, 289). However, the `Skills` interface in `gameStore.ts` only defines: `hacking`, `stealth`, `social`, `hardware`, `ai`. Skills like `'investigation'` or character skills like `'charisma'` or `'combat'` don't exist in the player's skill set.
- **Files:** `src/utils/questMechanics.ts`, `src/store/gameStore.ts`
- **Impact:** Lookups for non-existent skills return `undefined`, causing the fallback `|| 1` to always provide the minimum value. The mechanic engine is effectively non-functional for most mechanic types.
- **Fix approach:** Either add the missing skills to the `Skills` interface, or map mechanics to existing skills.

---

## Low Severity

### Console.log Statements in Production Code
- **Issue:** Multiple files contain `console.log` statements that will execute in production:
  - `src/store/gameStore.ts` (line 999): `console.log('🎮 GameStore: Initializing with data:', ...)`
  - `api/middleware/phase6.ts` (line 469): `console.log(...)` for request logging
  - `src/hooks/useIdleProgression.ts` (line 246): `console.debug(...)`
  - `src/services/websocketService.ts` (line 55): `console.log('WebSocket connected (simulated)')`
- **Files:** Multiple files
- **Impact:** Unnecessary console output in production. Could leak internal state to browser dev tools. Minor performance impact.
- **Fix approach:** Use a proper logger abstraction that respects `NODE_ENV`, or at minimum gate behind `if (process.env.NODE_ENV === 'development')`.

### Todo/Fixme Comments for Missing Implementation
- **Issue:** While `grep` found no `TODO`/`FIXME` comments (likely filtered), `api/routes/auth.ts` has explicit TODO comments for unimplemented routes. The `api/routes/companions.ts` has `// TODO: Implement currency/credits check and deduction` (line 457).
- **Files:** `api/routes/auth.ts`, `api/routes/companions.ts`
- **Impact:** Unfinished features that will cause runtime errors when triggered.
- **Fix approach:** Track these in an issue tracker and either implement or mark as unavailable.

### Hardcoded Magic Numbers Throughout
- **Issue:** Numerous hardcoded values appear across the codebase:
  - Max 3 concurrent operations (gameStore.ts line 1110)
  - 24-hour offline cap (idleWorker.ts line 111, useIdleProgression.ts line 102)
  - 10-second notification duplicate check window (gameStore.ts line 1478)
  - 5-second notification auto-remove (gameStore.ts line 1503)
  - Max 5 companions (companions.ts line 71)
  - Max 5 active mentorships (mentorship.ts line 79)
  - 500-character message limit (websocket.ts line 267)
  - 1MB save data limit (sync.ts line 208)
- **Files:** Across the codebase
- **Impact:** Difficult to tune game balance. Changes require hunting through multiple files.
- **Fix approach:** Move all configurable constants to `src/config/balanceConfig.ts` (where some already exist) and reference them from there.

### Test Integration Tests Have Brittle Hardcoded Expectations
- **Issue:** `src/tests/integration.test.ts` has tests that assert exact numeric values (e.g., line 101: `expect(experienceReward).toBe(720)`). These values are tied to `balanceConfig.ts` and will break when balance is tuned.
- **Files:** `src/tests/integration.test.ts`
- **Impact:** Tests will fail on any balance adjustment, requiring constant maintenance. The tests don't test behavior, they test configuration.
- **Fix approach:** Use range assertions (`expect(x).toBeGreaterThan(500)`) or test the calculation formulas rather than exact config values.

### Reflected XSS Potential in Error Messages
- **Issue:** In `api/middleware/phase6.ts` lines 335-340 and 375-380, the `requireLevel` and `requireCredits` middleware interpolate user data directly into error responses (`Your current level: ${user.level || 1}`). While these values come from the database, reflected values in error messages are a potential XSS vector if any UI component renders them unsafely.
- **Files:** `api/middleware/phase6.ts`
- **Impact:** Low — Supabase-returned values are controlled by the database. But if an admin/user can manipulate these fields, they could inject content.
- **Fix approach:** Sanitize values before including in error messages as defense-in-depth.

### Inconsistent Property Naming Convention
- **Issue:** The codebase mixes `snake_case` and `camelCase` inconsistently:
  - Backend Supabase schemas use `snake_case` (e.g., `player_id`, `is_active`, `created_at`)
  - Frontend TypeScript interfaces use `camelCase` (e.g., `playerId`, `isActive`, `createdAt`)
  - API route code maps between them inconsistently — some routes use `snake_case` in API responses, others use `camelCase`
  - Express route handler types use `req.user?.id` in some places and `req.params.player_id` in others
- **Files:** Throughout codebase
- **Impact:** Mapping errors when data crosses the API boundary. Confusion for developers.
- **Fix approach:** Choose a convention (recommend: databases use `snake_case`, API contracts use `snake_case`, frontend code uses `camelCase` with explicit mapping at the API layer).

### `cors` Package Imported But Custom CORS Middleware Used
- **Issue:** `api/app.ts` (line 6) imports the `cors` npm package, but it's never used — the app uses a custom `corsHandler` from `phase6.ts` instead (line 44).
- **Files:** `api/app.ts`
- **Impact:** Unused dependency in `package.json`. The custom `corsHandler` (line 478 of phase6.ts) sets `Access-Control-Allow-Origin: *` by default when `FRONTEND_URL` is not set, which is less secure than using the `cors` package with proper configuration.
- **Fix approach:** Remove the unused `cors` import and `cors` from package.json, or replace the custom handler with the `cors` package middleware.

---

## Architecture Concerns

### No Error Boundary in React Tree
- **Issue:** `src/App.tsx` has no error boundary wrapping the component tree. A crash in any page or component will unmount the entire React tree, showing a white screen.
- **Files:** `src/App.tsx`
- **Impact:** Any unhandled error in any page (Dashboard, Quests, etc.) will crash the entire app. The `errorHandling.ts` has a `handleComponentError` function (line 519) but it's never connected to a React error boundary component.
- **Fix approach:** Create a React Error Boundary component that wraps the `<Routes>` in `App.tsx` and calls `handleComponentError` from `errorHandling.ts`.

### Mixed JS/TS Backend
- **Issue:** `api/middleware/auth.js` is a JavaScript file while all other backend files are TypeScript. The nodemon config `.js` in the extensions list to support it.
- **Files:** `api/middleware/auth.js`
- **Impact:** The JS file doesn't get any type checking. With `"allowJs": false` implied by the tsconfig (it at least doesn't allow JS), this file is invisible to the compiler.
- **Fix approach:** Convert `auth.js` to TypeScript (`.ts`) and fix the import paths that reference `.js`.

### WebSocket Server Port Mismatch
- **Issue:** `api/server.ts` initializes the WebSocket server on port **8083** (`initializeWebSocketServer(8083)`), but the `GameWebSocketServer` class defaults to port **8080** and the frontend's simulated WebSocket doesn't specify any port.
- **Files:** `api/server.ts`, `api/websocket.ts`
- **Impact:** If the frontend ever connects to a real WebSocket, it will connect to the wrong port.
- **Fix approach:** Make the WebSocket port configurable via environment variable and use `VITE_WS_PORT` in the frontend.

### Supabase Client Duplicated
- **Issue:** There are THREE Supabase client instances:
  1. `src/lib/supabase.ts` — frontend client with anon key
  2. `api/config/supabase.ts` — backend client with service role key
  3. `api/routes/hacking.ts` — duplicate backend client with service role key
- **Files:** `src/lib/supabase.ts`, `api/config/supabase.ts`, `api/routes/hacking.ts`
- **Impact:** The `hacking.ts` duplicate bypasses any configuration or middleware added to the shared client. If the shared client is updated (e.g., adding custom fetch), hacking routes won't benefit.
- **Fix approach:** Remove the duplicate from `hacking.ts` and import from `../config/supabase.js`.

---

## Test Coverage Gaps

### No Store Unit Tests
- **What's not tested:** The `src/store/gameStore.ts` (2331 lines, the core of the application) has zero unit tests. No tests exist for `startQuest`, `claimReward`, `makeQuestChoice`, guild actions, companion actions, AI decision making, or any other store method.
- **Files:** `src/store/gameStore.ts`
- **Risk:** Any change to the store can break critical game logic without detection.
- **Priority:** High

### No API Route Integration Tests
- **What's not tested:** None of the 17 API route files have integration tests. Tests exist in `src/tests/` but they mock fetch and test frontend logic, not backend endpoints.
- **Files:** `api/routes/*.ts`
- **Risk:** Auth middleware issues, missing error returns, and validation bugs (all identified above) won't be caught by tests.
- **Priority:** High

### No WebSocket Tests
- **What's not tested:** The `GameWebSocketServer` class (528 lines in `api/websocket.ts`) has zero tests.
- **Files:** `api/websocket.ts`
- **Risk:** Connection handling, message routing, and guild chat all untested.
- **Priority:** Medium

---

## Summary of Immediate Action Items

| Priority | Concern | Quick Fix |
|----------|---------|-----------|
| CRITICAL | Hardcoded JWT secret in WebSocket | Remove fallback, fail on missing env var |
| CRITICAL | Missing auth middleware on protected routes | Apply `authenticateUser` middleware in `app.ts` |
| CRITICAL | Empty auth route handlers hang forever | Add error responses or implement properly |
| HIGH | Duplicate test directory | Remove `src/test/` |
| HIGH | Stub `Home.tsx` and `Empty.tsx` | Delete unused files |
| HIGH | Duplicate Web Worker (blob vs file) | Consolidate to one implementation |
| MEDIUM | Non-existent `validate()` on middleware | Remove or implement validation |
| MEDIUM | Rate limit Map memory leak | Add periodic cleanup |
| MEDIUM | Commented-out persist middleware | Re-enable or implement save/load |
| LOW | Unused `cors` npm dependency | Remove import and dependency |

---

*Concerns audit: 2026-05-20*
