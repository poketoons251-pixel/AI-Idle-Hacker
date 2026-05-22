---
phase: 06-content-and-polish
plan: 03
subsystem: audio
tags:
  - audio
  - web-audio-api
  - singleton
  - autoplay-policy
  - ambient
requires: []
provides: ["AudioManager singleton"]
affects: ["hacking.ts", "AchievementPopup.tsx", "gameStore.ts"]
tech-stack:
  added:
    - Web Audio API (browser-native, no dependencies)
  patterns:
    - Singleton class with static getInstance()
    - Lazy initialization on user gesture
    - Gain node graph (masterGain -> sfxGain, masterGain -> ambienceGain)
key-files:
  created:
    - src/lib/audioManager.ts
decisions:
  - Pure Web Audio API — zero external dependencies per D-01/D-05
  - Lazy init via click/keydown { once: true } listeners for browser autoplay policy
  - Ambient drone at 0.03 gain (near-silent) with random chirps every 5-15s
metrics:
  duration: ~8 min
  completed: 2026-05-22
---

# Phase 6 Plan 3: Audio System — AudioManager Singleton

**One-liner:** Pure Web Audio API AudioManager singleton with 7 synthesizer trigger sounds and ambient drone, lazy-initialized on first user interaction for browser autoplay policy compliance.

## Completed Tasks

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create AudioManager singleton with 7 trigger sounds | `942e5b5` | src/lib/audioManager.ts |
| 2 | Add ambient drone + lazy initialization | `6c10528` | src/lib/audioManager.ts |

## What Was Built

### src/lib/audioManager.ts (255 lines)

**Singleton Pattern:**
- `AudioManager.getInstance()` — static accessor, lazy-initializes the class
- Private constructor prevents external instantiation
- Gain node graph: `ctx.destination ← masterGain (vol 0.7) ← sfxGain (vol 0.8)` + `masterGain ← ambienceGain (vol 0.03)`

**7 Trigger Sounds (D-03 mapping):**
| Method | Wave | Character |
|---|---|---|
| `playHackComplete()` | Sine sweep 200→800Hz | Rising 0.3s confirm |
| `playUpgradePurchase()` | Square 440Hz | Short 0.1s blip |
| `playAchievementUnlock()` | Sine arpeggio (C5, E5, G5) | 3-note ascending 0.25s each |
| `playUIClick()` | White noise buffer | 0.02s noise burst |
| `playAIDecision()` | Sine double-beep 660Hz | Two 0.05s pulses |
| `playTerminalGlitch()` | White noise buffer | 0.08s static burst |
| `playNewTarget()` | Triangle 880→660Hz | Descending 0.2s chime |

**Ambient Drone (D-04):**
- 60Hz sawtooth oscillator → bandpass filter (120Hz, Q=0.5) → ambienceGain (0.03)
- Random sine chirps (800-2000Hz, 0.15s) every 5-15 seconds
- `startAmbientDrone()` / `stopAmbientDrone()` lifecycle
- Drone starts automatically on first user interaction via `setupLazyInit()`

**Lazy Initialization (Browser Autoplay Policy):**
- `setupLazyInit()` static method registers `click` and `keydown` handlers with `{ once: true }`
- On first interaction: creates AudioContext, initializes gain graph, starts ambient drone
- Module-level call: `AudioManager.setupLazyInit()` at bottom of file
- All `play*()` methods call `ensureInit()` as fallback

**Settings API:**
- `setMasterVolume(v: number)` — controls master gain (default 0.7)
- `setSfxVolume(v: number)` — controls SFX gain (default 0.8)
- `setAmbienceEnabled(bool)` — toggles ambience gain between 0.03 and 0
- Getters: `masterVolume`, `sfxVolume`, `ambienceEnabled`, `isInitialized`

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None. All methods are fully implemented with real audio synthesis.

## Threat Flags

None. All audio runs fully browser-sandboxed (Web Audio API). No network requests. AudioContext creation gated on user gesture via `setupLazyInit()`. No new trust boundaries introduced.

## Self-Check: PASSED

- [x] File exists at `src/lib/audioManager.ts`
- [x] `npx tsc --noEmit` passes (full project compiles)
- [x] No npm packages imported — pure Web Audio API
- [x] All 7 `play*()` methods present: playHackComplete, playUpgradePurchase, playAchievementUnlock, playUIClick, playAIDecision, playTerminalGlitch, playNewTarget
- [x] Ambient drone methods present: startAmbientDrone, stopAmbientDrone, setAmbienceEnabled, scheduleRandomChirp, playRandomChirp
- [x] Lazy init methods present: setupLazyInit, module-level `AudioManager.setupLazyInit()` call
- [x] Singleton via `getInstance()`
- [x] Gain node graph with masterGain → sfxGain + ambienceGain
- [x] Ambience at 0.03 gain, 60Hz sawtooth + bandpass filter (120Hz, Q=0.5)
- [x] Chirps every 5-15 seconds when drone active
- [x] Commit 1: `942e5b5` — feat(06-03): create AudioManager singleton with 7 trigger sounds
- [x] Commit 2: `6c10528` — feat(06-03): add ambient drone + lazy initialization to AudioManager
