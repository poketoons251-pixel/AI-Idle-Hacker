# Phase 3 Context — Persistence & Polish

## Domain

Save system, offline progress, achievements, settings panel, and responsive layout. This phase delivers persistence infrastructure, achievement tracking, user settings, and layout responsiveness.

## Requirements (from ROADMAP.md)

- **SAVE-01**: Game auto-saves to IndexedDB every 30 seconds
- **SAVE-02**: Game saves on browser close/tab change (beforeunload event)
- **SAVE-03**: Offline progress calculated on load (elapsed time × idle rate, capped at 8 hours)
- **SAVE-04**: Player can export save data as copy-pasteable string
- **SAVE-05**: Player can import save data from exported string
- **ACH-01**: Achievement system tracks milestones (first hack, first upgrade, etc.)
- **ACH-02**: Achievements displayed in terminal on unlock
- **ACH-03**: At least 15 achievements in v1
- **UI-03**: Settings panel accessible with sound toggle and save management
- **UI-04**: Layout is responsive on different desktop browser sizes

## Decisions

### Save Storage
- **IndexedDB via `idb-keyval`** — Replace Zustand's default localStorage persistence with IndexedDB. `idb-keyval` is a 295-byte async wrapper around IndexedDB. Zustand's `persist` middleware supports custom storage engines. Non-blocking, handles large game states, no 5MB limit. Install `idb-keyval` package.

### Offline Progress Calculation
- **8-hour cap with diminishing returns after 2 hours** — Formula: `min(elapsed, 8h) × rate × (elapsed > 2h ? 0.5 : 1.0)`. Fair to casual players, prevents exploitation from leaving game open for days. Calculated on game load using `lastUpdate` timestamp from store.

### Save Export Format
- **Base64-encoded JSON (primary) + file download (secondary)** — `exportSave()` serializes store state to JSON, encodes to base64, copies to clipboard. `importSave(base64)` decodes and merges into store. Secondary "Download as file" button for backup. Standard idle game pattern.

### Achievement Triggers
- **Auto-detected from Zustand store changes** — Achievement checker subscribes to store updates, checks thresholds (first hack, first upgrade, credits milestones, etc.). Triggers terminal notification + visual popup on unlock. 15+ achievements tracking various milestones.

### Settings Scope
- **Standard settings panel** — Sound toggle (on/off), save management (export/import/reset), display preferences (theme variant, font size, animation toggle). Hosted in existing Settings page. Enough to feel polished without scope creep.

### Existing Infrastructure
- **Zustand `persist` middleware** — Already configured in gameStore. Need to swap storage engine from localStorage to IndexedDB.
- **`lastUpdate` timestamp** — Already tracked in store for energy regeneration. Reuse for offline progress calculation.
- **Terminal notification system** — Already writes to xterm.js. Use for achievement unlock messages.
- **Visual feedback system** — `FloatingPopup` from Phase 2. Reuse for achievement notifications.
- **Settings page** — `src/pages/Settings.tsx` exists. Extend with save management and display prefs.

## Canonical Refs

- `.planning/ROADMAP.md` — Phase 3 goal, requirements, success criteria
- `.planning/REQUIREMENTS.md` — SAVE-01 through SAVE-05, ACH-01 through ACH-03, UI-03, UI-04
- `.planning/PROJECT.md` — Project context and key decisions
- `.planning/phases/01-terminal-foundation/01-CONTEXT.md` — Phase 1 decisions
- `.planning/phases/02-economy-hacking/02-CONTEXT.md` — Phase 2 decisions
- `src/store/gameStore.ts` — Zustand store with persist middleware
- `src/pages/Settings.tsx` — Existing settings page
- `src/components/XtermTerminal.tsx` — Terminal for achievement notifications
- `src/components/FloatingPopup.tsx` — Popup component for achievement display
- `src/hooks/useGameLoop.ts` — Game loop hook (offline progress integration point)

## Code Context

### Reusable Assets
- **Zustand persist middleware** — Already configured, needs custom storage engine swap
- **FloatingPopup component** — From Phase 2, reusable for achievement notifications
- **Terminal write capability** — `onTerminalReady` prop provides terminal instance
- **beforeunload handler pattern** — Standard browser API for tab close detection
- **Base64 encoding/decoding** — `btoa()` and `atob()` browser APIs

### Patterns
- **State flow**: Zustand store → individual selectors → components
- **Worker communication**: `postMessage` for tick data, `onmessage` for state updates
- **Auto-save pattern**: setInterval(30s) → serialize store → write to IndexedDB

## Deferred Ideas

- Cloud sync via Supabase — Phase 5
- Sound effects — Phase 6
- Advanced notification preferences — Future phase
- Auto-save interval customization — Future phase
- Multiple save slots — Future phase
