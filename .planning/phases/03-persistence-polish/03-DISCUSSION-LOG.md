# Phase 3 Discussion Log — Persistence & Polish

**Date:** 2026-05-21
**Phase:** 3 — Persistence & Polish

## Areas Discussed

### 1. Save Storage
- **Options considered:** localStorage, IndexedDB via idb-keyval, both
- **Decision:** IndexedDB via `idb-keyval`
- **Rationale:** Non-blocking, no size limits, idle game standard. Zustand persist supports custom storage engines.

### 2. Offline Progress Calculation
- **Options considered:** 8h cap, uncapped, diminishing returns after 2h
- **Decision:** 8-hour cap with diminishing returns after 2 hours
- **Rationale:** Fair to casual players, prevents exploitation. Formula: `min(elapsed, 8h) × rate × (elapsed > 2h ? 0.5 : 1.0)`.

### 3. Save Export Format
- **Options considered:** Base64 JSON, downloadable file, both
- **Decision:** Base64 JSON (primary) + file download (secondary)
- **Rationale:** Copy-paste is idle game standard. File download as backup option.

### 4. Achievement Triggers
- **Options considered:** Auto-detected, manually triggered, hybrid
- **Decision:** Auto-detected from Zustand store changes
- **Rationale:** Instant feedback, no manual intervention. Subscribe to store updates, check thresholds.

### 5. Settings Scope
- **Options considered:** Minimal, standard, full
- **Decision:** Standard (sound, saves, display prefs)
- **Rationale:** Polished without scope creep. Sound toggle, save management, display preferences.

## Deferred Ideas
- Cloud sync via Supabase (Phase 5)
- Sound effects (Phase 6)
- Advanced notification preferences (Future phase)
- Auto-save interval customization (Future phase)
- Multiple save slots (Future phase)
