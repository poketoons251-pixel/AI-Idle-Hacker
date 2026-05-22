# Requirements — AI Idle Hacker

## v1 Requirements

### Terminal Interface
- [ ] **TERM-01**: Player sees an interactive terminal (xterm.js) as the primary game interface
- [ ] **TERM-02**: Terminal displays game events as formatted output (resource gains, purchases, hacks)
- [ ] **TERM-03**: Player can type commands in the terminal to initiate actions
- [ ] **TERM-04**: Terminal has cyberpunk theme (neon colors, dark background, custom font)
- [ ] **TERM-05**: Terminal supports ANSI color codes and basic formatting (bold, underline)

### Resource Economy
- [ ] **ECON-01**: Game generates at least one core resource (crypto) passively over time
- [ ] **ECON-02**: Resource generation rate is visible to the player
- [ ] **ECON-03**: Player can spend resources to purchase upgrades
- [ ] **ECON-04**: Upgrades increase resource generation rate or unlock new capabilities
- [ ] **ECON-05**: At least 10 upgrades across hardware and software categories
- [ ] **ECON-06**: Upgrade costs scale exponentially (standard idle game progression)

### Hacking Gameplay
- [ ] **HACK-01**: Player can initiate hacking commands against target systems
- [ ] **HACK-02**: Targets have escalating difficulty levels with different rewards
- [ ] **HACK-03**: Hacking commands produce terminal output simulating a real hack
- [ ] **HACK-04**: Successful hacks yield resources, data, or unlock new targets
- [ ] **HACK-05**: At least 5 distinct target systems in v1

### AI Auto-Play
- [ ] **AI-01**: Player can enable/disable AI auto-play mode
- [x] **AI-02**: AI makes strategic decisions about which upgrades to purchase
- [ ] **AI-03**: AI initiates hacking commands against appropriate targets
- [ ] **AI-04**: AI decision reasoning is visible in terminal output
- [x] **AI-05**: AI runs via server-side edge functions (no browser-side LLM calls)

### Save System
- [x] **SAVE-01**: Game auto-saves to IndexedDB every 30 seconds
- [x] **SAVE-02**: Game saves on browser close/tab change (beforeunload event)
- [x] **SAVE-03**: Offline progress calculated on load (elapsed time × idle rate, capped at 8 hours)
- [ ] **SAVE-04**: Player can export save data as copy-pasteable string
- [ ] **SAVE-05**: Player can import save data from exported string

### UI/UX
- [ ] **UI-01**: Resource counters always visible alongside terminal
- [ ] **UI-02**: Upgrade panel accessible from terminal or sidebar
- [ ] **UI-03**: Settings panel with sound toggle and save management
- [ ] **UI-04**: Responsive layout that works on desktop browsers
- [ ] **UI-05**: Visual feedback on actions (flashing numbers, terminal animations)

### Achievements
- [ ] **ACH-01**: Achievement system tracks milestones (first hack, first upgrade, etc.)
- [ ] **ACH-02**: Achievements displayed in terminal on unlock
- [ ] **ACH-03**: At least 15 achievements in v1

## v2 Requirements (Deferred)

- Prestige/reset mechanic with permanent multipliers
- Cloud sync via Supabase auth
- Dynamic world events (random events that change game conditions)
- Skill tree / specialization branching
- Multiple AI agent competition/leaderboards
- Sound effects and ambient audio
- PWA installability

## Out of Scope

- **Real-time multiplayer** — Idle games are inherently async; adds massive complexity
- **Custom terminal renderer** — xterm.js is battle-tested; building from scratch is unjustified
- **Browser-side LLM calls** — Exposes API keys, unreliable, no cost control
- **Complex 3D/Canvas graphics** — Breaks terminal aesthetic, adds bundle size
- **Social features (chat, friends)** — Scope creep; focus on single-player + AI first
- **Mobile-native app** — Web PWA is sufficient for v1

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| TERM-01 through TERM-05 | Phase 1 | — |
| ECON-01 through ECON-06 | Phase 2 | — |
| HACK-01 through HACK-05 | Phase 2 | — |
| AI-01 through AI-05 | Phase 4 | — |
| SAVE-01 through SAVE-05 | Phase 3 | — |
| UI-01 through UI-05 | Phase 1-2 | — |
| ACH-01 through ACH-03 | Phase 3 | — |
