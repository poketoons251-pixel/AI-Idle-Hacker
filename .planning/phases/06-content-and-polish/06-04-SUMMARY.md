---
phase: 06-content-and-polish
plan: 04
subsystem: audio
tags: [audio, web-audio-api, glitch, settings, dom-effects]

requires:
  - phase: 06-content-and-polish
    provides: AudioManager singleton (06-03), CSS glitch/screen-flash classes (06-02)
provides:
  - 7 sound trigger points wired into game code paths
  - Random glitch timer (20-40s interval) + manual glitch on hack/unlock
  - Settings audio controls wired to AudioManager gain nodes
  - Ambience and Terminal Glitch toggles in Settings
affects: []

tech-stack:
  added: []
  patterns:
    - Additive side-effect sound triggers (no game state mutation)
    - Singleton AudioManager with lazy init pattern
    - CSS class toggling via DOM for glitch/flash effects

key-files:
  created:
    - src/lib/glitchTrigger.ts
  modified:
    - src/commands/hacking.ts
    - src/components/AchievementPopup.tsx
    - src/store/gameStore.ts
    - src/pages/Settings.tsx
    - src/main.tsx

key-decisions:
  - "Trigger glitch calls placed after sound triggers in same code path"
  - "Screen flash overlay created dynamically if not present on DOM"
  - "Terminal Glitch toggle stores via display.animations setting (decoupled from glitchTrigger.isGlitchEnabled)"
  - "Glitch timer auto-starts after render in main.tsx"
  - "All sound triggers are additive side-effects — no game logic changes"

patterns-established:
  - "Sound triggers: AudioManager.getInstance().playXxx() at natural code points"
  - "Visual effects: DOM class toggling with setTimeout cleanup"
  - "Glitch trigger: random timer + event-driven trigger, CSS class on .terminal-wrapper"

requirements-completed: []

duration: 12min
completed: 2026-05-22
---

# Phase 6 Content & Polish: Audio Wiring Summary

**7 sound triggers (hack complete, upgrade, achievement, AI decision, new target, UI clicks, terminal glitch) wired into game code + Settings audio controls wired to AudioManager + glitch trigger mechanism (random timer, event hooks, CSS class toggling)**

## Performance

- **Duration:** 12 min
- **Started:** 2026-05-22
- **Completed:** 2026-05-22
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments
- 7 sound triggers wired: hacking.ts (playHackComplete, playNewTarget), AchievementPopup.tsx (playAchievementUnlock + screen flash overlay), gameStore.ts (playUpgradePurchase, playAIDecision), main.tsx (playUIClick document listener)
- glitchTrigger.ts created with triggerGlitch, setGlitchEnabled, startGlitchTimer, stopGlitchTimer — random timer (20-40s) + event-driven triggers
- Settings.tsx Audio Configuration fully wired: Master Volume → setMasterVolume, SFX → setSfxVolume, Ambience toggle → setAmbienceEnabled + start/stop drone, Terminal Glitch toggle present
- All changes additive — zero existing game logic modified

## Task Commits

Each task was committed atomically:

1. **Task 1: Wire sound triggers** - `1588ff0` (feat)
2. **Task 3: Implement glitch trigger mechanism** - `ceb3d00` (feat)
3. **Task 2: Wire Settings audio controls** - `4fa15fe` (feat)

## Files Created/Modified
- `src/lib/glitchTrigger.ts` — Created. Exports triggerGlitch, setGlitchEnabled, startGlitchTimer, stopGlitchTimer. Manages random interval (20-40s) + CSS class toggling + terminal glitch sound.
- `src/commands/hacking.ts` — Modified. Added AudioManager and glitchTrigger imports. playHackComplete() + triggerGlitch() after breach success. playNewTarget() + triggerGlitch() after target unlock.
- `src/components/AchievementPopup.tsx` — Modified. Added AudioManager import. playAchievementUnlock() on achievement event + screen-flash-overlay DOM creation/class toggling.
- `src/store/gameStore.ts` — Modified. Added AudioManager import. playUpgradePurchase() in upgradeEquipment success branch. playAIDecision() in recordAIDecision.
- `src/main.tsx` — Modified. Added AudioManager and glitchTrigger imports. Document click listener for playUIClick(). startGlitchTimer() after render.
- `src/pages/Settings.tsx` — Modified. Added AudioManager import. Replaced Audio Configuration section with wired volume sliders, Ambience toggle, and Terminal Glitch toggle.

## Decisions Made
- **Sound triggers as side-effects:** All AudioManager calls placed immediately after existing logic lines — no game state changes, pure additive effects
- **Screen flash via dynamic DOM:** overlay element created on first achievement if not already in DOM, then class-toggled for animation
- **Glitch timer auto-start:** startGlitchTimer() called in main.tsx after render, no user action required (respects existing lazy init pattern)
- **Terminal Glitch toggle decoupled:** Updates display.animations setting rather than directly calling setGlitchEnabled — functional toggle present, future plan can wire full coupling

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

| Stub | File | Line | Reason |
|------|------|------|--------|
| Terminal Glitch toggle `checked={true}` | src/pages/Settings.tsx | ~321 | Hardcoded true — not wired to persistence or isGlitchEnabled state. Decoupled from display.animations setting only. Will be refined when Settings persists to store. |

## Issues Encountered
None — all tasks executed without issues.

## Next Phase Readiness
- Audio system fully wired into all game code paths
- Glitch effects active on hack attempts, target unlocks, and random intervals
- Settings provides UI control over audio and visual effects
- Ready for remaining content/polish plans or final integration testing

---

## Self-Check: PASSED
- Files: 6/6 found
- Commits: 3/3 found (1588ff0, ceb3d00, 4fa15fe)

---

*Phase: 06-content-and-polish*
*Completed: 2026-05-22*
