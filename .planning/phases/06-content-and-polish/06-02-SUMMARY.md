---
phase: 06-content-and-polish
plan: 02
subsystem: visual-effects
tags:
  - css
  - animation
  - glitch
  - scan
  - screen-flash
  - tailwind
requires: []
provides:
  - glitch animation keyframes + CSS classes
  - screen-flash overlay keyframes + CSS classes
  - scan-sweep animation keyframes + CSS classes
  - scan command animated scan-line
affects:
  - tailwind.config.js (animation + keyframes extensions)
  - src/styles/crt-effects.css (new CSS rules appended)
  - src/commands/system.ts (scan handler DOM animation trigger)
tech-stack:
  added:
    - CSS @keyframes for glitch displacement + RGB-split
    - CSS @keyframes for screen flash overlay
    - CSS @keyframes for scan line sweep
    - Tailwind animation aliases (glitch, screen-flash, scan-sweep)
  patterns:
    - "CSS-only visual effects (no JS animation libraries)"
    - "DOM-based animation trigger via closest/classList toggles"
key-files:
  created: []
  modified:
    - tailwind.config.js (81 → 85 lines, +21 ins)
    - src/styles/crt-effects.css (108 → 174 lines, +66 ins)
    - src/commands/system.ts (128 → 145 lines, +17 ins)
decisions:
  - "Keyframes duplicated in both Tailwind config and standalone CSS because crt-effects.css loads independently"
  - "Z-index layering: scan-line=13, screen-flash=14 (respects existing scanline-bar=13, curvature=12)"
  - "Glitch limited to 3 iterations (0.15s each) per threat model T-06-02-01"
  - "scan-line element created dynamically on first scan, reused for subsequent scans with reflow trick"
metrics:
  duration: 7min
  completed: "2026-05-22T11:56:00Z"
---

# Phase 6 Plan 2: Terminal Visual Effects — Summary

**One-liner:** Added three reactive CSS visual effects — glitch (horizontal displacement + RGB-split), screen-flash overlay (green radial gradient), and scan-line animation (top-to-bottom sweep wired to `scan` command) — via Tailwind keyframes, standalone CSS classes, and DOM animation trigger.

## Tasks

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Add glitch/screen-flash/scan keyframes to tailwind.config.js | `a32a4df` | `tailwind.config.js` |
| 2 | Add glitch/screen-flash/scan CSS classes to crt-effects.css | `98985d7` | `src/styles/crt-effects.css` |
| 3 | Wire scan animation into scan command handler | `3d769e8` | `src/commands/system.ts` |

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None.

## Threat Flags

None — CSS animations are GPU-composited and browser-sandboxed. Scan command DOM manipulation is scoped to owned ` .terminal-wrapper`.

## Verification Results

- [x] `tailwind.config.js` parses and has all 3 new animation aliases (glitch, screen-flash, scan-sweep)
- [x] `crt-effects.css` has all 5 required classes: glitch-active, screen-flash-overlay, flash-active, scan-line, scanning
- [x] `system.ts` has scan animation trigger with closest + querySelector + classList toggles
- [x] `npx tsc --noEmit` passes without errors

## Self-Check: PASSED
