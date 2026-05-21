# Roadmap — AI Idle Hacker

## Overview

| Metric | Value |
|--------|-------|
| Phases | 6 |
| v1 Requirements | 33 |
| v2 Requirements | 6 (deferred) |
| Project Mode | mvp (vertical slices) |

---

### Phase 1: Terminal Foundation
**Goal:** Player sees and interacts with a themed terminal as the primary game interface
**Mode:** mvp
**Requirements:** TERM-01, TERM-02, TERM-03, TERM-04, TERM-05, UI-01
**Success Criteria:**
1. Player opens the game and sees a cyberpunk-themed terminal with neon colors
2. Player can type a command and see formatted output in the terminal
3. Resource counter is visible alongside the terminal
4. Terminal scrolls smoothly with game events appearing as output
5. Basic game loop skeleton runs (tick → update state → render)

### Phase 2: Economy & Hacking
**Goal:** Core idle game loop — resources generate, upgrades purchasable, hacking targets available
**Mode:** mvp
**Requirements:** ECON-01, ECON-02, ECON-03, ECON-04, ECON-05, ECON-06, HACK-01, HACK-02, HACK-03, HACK-04, HACK-05, UI-02, UI-05
**Plans:** 3 plans
**Success Criteria:**
1. Player earns crypto passively at a visible rate
2. Player can purchase at least 10 upgrades that increase generation rate
3. Player can initiate hacking commands against 5+ target systems
4. Hacking produces terminal output simulating breach sequences
5. Successful hacks yield resources and unlock harder targets
6. Upgrade costs scale exponentially, creating meaningful progression

Plans:
- [ ] 02-01-PLAN.md — Economy foundation: passive credit generation, 11 upgrades, cost scaling, HUD rate display
- [ ] 02-02-PLAN.md — Hacking gameplay: 5 targets, hack command with breach animation, reward/unlock flow
- [ ] 02-03-PLAN.md — Upgrade UI + visual feedback: UpgradePanel sidebar, economy commands, counter flash/popups

### Phase 3: Persistence & Polish
**Goal:** Player progress is saved, offline progress works, achievements track milestones
**Mode:** mvp
**Requirements:** SAVE-01, SAVE-02, SAVE-03, SAVE-04, SAVE-05, ACH-01, ACH-02, ACH-03, UI-03, UI-04
**Plans:** 2/3 plans executed
**Success Criteria:**
1. Game auto-saves every 30 seconds and on tab close
2. Player closing and reopening browser sees offline progress calculated correctly
3. Player can export and import save data via copy-paste
4. 15+ achievements track and display on unlock
5. Settings panel accessible with sound toggle and save management
6. Layout is responsive on different desktop browser sizes

Plans:
- [x] 03-01-PLAN.md — Persistence core: IndexedDB storage, Zustand persist, auto-save, offline progress
- [x] 03-02-PLAN.md — Save management: export/import via base64, Settings UI
- [ ] 03-03-PLAN.md — Achievements + Settings: 18 auto-detected achievements, notifications, responsive layout

### Phase 4: AI Auto-Play
**Goal:** AI agent can play the game autonomously, making strategic decisions visible in terminal
**Mode:** mvp
**Requirements:** AI-01, AI-02, AI-03, AI-04, AI-05
**Success Criteria:**
1. Player can toggle AI auto-play on/off
2. AI purchases upgrades strategically when enabled
3. AI initiates hacking commands against appropriate targets
4. AI reasoning is visible as terminal output ("Analyzing targets...", "Purchasing CPU upgrade")
5. AI runs via Supabase Edge Functions, not browser-side LLM calls
6. Game state is correctly passed to and from AI decision loop

Plans:
- [x] 04-01-PLAN.md — AI toggle controls (HUD + terminal), game loop integration, terminal reasoning output
- [x] 04-02-PLAN.md — Strategic decision engine (ROI-based upgrades, target selection), AI settings panel
- [x] 04-03-PLAN.md — Supabase Edge Function for LLM decisions, hybrid AI integration

### Phase 5: Supabase Integration
**Goal:** Cloud sync, authentication, and real-time features connect the game to the backend
**Mode:** mvp
**Requirements:** (cloud sync foundation for v2 features)
**Plans:** 3 plans
**Success Criteria:**
1. Player can authenticate with Supabase auth
2. Game state syncs to cloud database on save
3. Player can load saves from cloud on different devices
4. Realtime channels ready for future leaderboard features
5. Edge Functions deployed and callable for AI auto-play

Plans:
- [ ] 05-01-PLAN.md — Auth + DB schema: anonymous-first auth, OAuth linking, game_saves/player_profiles/leaderboards tables with RLS
- [ ] 05-02-PLAN.md — Cloud sync service: save/load with last-write-wins, Zustand integration, conflict detection
- [ ] 05-03-PLAN.md — Leaderboards + realtime: real Supabase data, realtime subscriptions, Edge Function deprecation

### Phase 6: Content & Polish
**Goal:** Game feels complete — animations, sound, content depth, and final polish
**Mode:** mvp
**Requirements:** (polish across all areas)
**Success Criteria:**
1. Terminal has smooth animations and visual effects (glitch, matrix rain)
2. Sound effects for key actions (hack complete, upgrade purchased, achievement unlocked)
3. At least 20 target systems with varied descriptions and rewards
4. At least 20 upgrades with clear progression paths
5. Game runs at 60fps with no jank during terminal output
6. Player session feels satisfying for both 5-minute and 2-hour play sessions

---

## Requirement Coverage

| Category | v1 Count | Mapped | Unmapped |
|----------|----------|--------|----------|
| Terminal | 5 | 5 (Phase 1) | 0 |
| Economy | 6 | 6 (Phase 2) | 0 |
| Hacking | 5 | 5 (Phase 2) | 0 |
| AI Auto-Play | 5 | 5 (Phase 4) | 0 |
| Save System | 5 | 5 (Phase 3) | 0 |
| UI/UX | 5 | 5 (Phase 1-2) | 0 |
| Achievements | 3 | 3 (Phase 3) | 0 |
| **Total** | **33** | **33** | **0** |

**Coverage: 100% — all v1 requirements mapped to phases**
