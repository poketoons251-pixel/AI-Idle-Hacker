# Phase 6: Content & Polish — Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-22
**Phase:** 06-content-and-polish
**Areas discussed:** Sound implementation, Terminal visual effects, New targets & upgrades content, Performance scope

---

## Sound Implementation

| Option | Description | Selected |
|--------|-------------|----------|
| Web Audio API (synth only) | Zero-dependency programmatic sounds | |
| Howler.js (SFX library) | Library + pre-made sound files | |
| Free CC0 SFX packs | Downloadable free sounds from Mixkit/ZapSplat | |
| Both (synth + CC0) | Synth for UI, CC0 for ambience | ✓ |

**User's choice:** Both — synth for UI actions + CC0 packs for ambience
**Notes:** No additional cost, zero extra dependencies. Synth style: cyberpunk digital (Blade Runner/Deus Ex style, not 8-bit, not industrial). Specific trigger-to-sound mapping captured in CONTEXT.md.

## Terminal Visual Effects

| Option | Description | Selected |
|--------|-------------|----------|
| Glitch effect | CSS displacement + RGB-split on terminal | ✓ |
| Matrix rain | Canvas overlay of falling green characters | |
| Screen flash | Brief overlay on achievement | ✓ |
| Scan animation | CSS gradient sweep on `scan` command | ✓ |

**User's choice:** Glitch + screen flash + scan animation. Skip matrix rain.
**Notes:** Matrix rain skipped because CRT scanlines + flicker already provide sufficient terminal texture. Canvas overlay adds GPU cost for diminishing return.

## New Targets & Upgrades Content

| Option | Description | Selected |
|--------|-------------|----------|
| 4-tier target expansion | Entry/Mid/High/Elite tiers filling 5→20 | ✓ |
| 4 new hardware upgrades | Cooling, network switch, FPGA, neural interface | ✓ |
| 5 new software upgrades | Packet injector, log cleaner, port scanner, AI model, backdoor | ✓ |

**User's choice:** 4-tier expansion with hacker-culture naming. 9 new upgrade slots.
**Notes:** Content added as data only — extend arrays in gameStore.ts. No new components or routes.

## Performance Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Lazy-load routes | React.lazy for secondary pages | ✓ |
| xterm.js WebGL verification | Confirm addon is active + add fit addon | ✓ |
| Re-render optimization | Chase unnecessary renders in Zustand | |
| Both of the above | Lazy loading + WebGL check only | ✓ |

**User's choice:** Lazy loading + WebGL verification + fit addon. No micro-optimization.

---

## Claude's Discretion

- Sound volume levels and mixing (keep ambience very quiet)
- Exact target names and reward values per tier
- Terminal glitch CSS implementation specifics
- Which specific pages get lazy-loaded

## Deferred Ideas

- Ambient music tracks — would need licensing or composition
- Particle effects — future polish pass
- Prestige system — v2 requirement
- Dynamic world events — v2 requirement
