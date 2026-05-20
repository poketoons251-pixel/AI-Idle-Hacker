---
phase: 01-terminal-foundation
plan: 02
subsystem: ui
tags: [hud, zustand, layout, resources]
dependency:
  requires: []
  provides: [UI-01]
  affects: [Layout.tsx]
tech-stack:
  added: []
  patterns: [zustand-selectors, react-functional-component, tailwind-css]
key-files:
  created:
    - src/components/HudBar.tsx
  modified:
    - src/components/Layout.tsx
decisions:
  - Used individual Zustand selectors per RESEARCH.md Section 6 to prevent re-render storms
  - Energy displayed as fraction (current/max) with mini progress bar
  - Username shown on far right for player identity
  - No animation/flash-on-change (deferred to Phase 6)
metrics:
  duration: ~5min
  completed: "2026-05-20"
---

# Phase 01 Plan 02: HUD Bar Summary

**One-liner:** Persistent HUD bar displaying Credits (cyan), Level (pink), Energy (yellow with progress bar), and Reputation (green) from Zustand store, integrated into Layout.tsx above all page content.

## Tasks Completed

| # | Task | Commit | Status |
|---|------|--------|--------|
| 1 | Create HudBar.tsx with resource counters | d2975f3 | Done |
| 2 | Integrate HudBar into Layout.tsx | 54306c0 | Done |

## What Was Built

### HudBar Component (`src/components/HudBar.tsx`)
- Horizontal bar with 4 resource counters + username display
- **Credits**: DollarSign icon, cyan (`#00d4ff`), formatted with `.toLocaleString()`
- **Level**: Star icon, pink (`#ff0080`)
- **Energy**: Zap icon, yellow (`#ffaa00`), fraction display (e.g., "45/100") with mini progress bar
- **Reputation**: TrendingUp icon, green (`#00ff41`)
- **Username**: Displayed on far right, defaults to "Anonymous"
- Uses **individual Zustand selectors** (6 separate `useGameStore((s) => ...)` calls) — NOT full store access
- Styling: `bg-cyber-darker/90 backdrop-blur-sm`, `border-b border-cyber-primary/30`, `cyber-text-glow` on values
- "AI IDLE HACKER" title on left (hidden on mobile)

### Layout Integration (`src/components/Layout.tsx`)
- Added `import { HudBar } from './HudBar'`
- Rendered `<HudBar />` between `<Navigation />` and `<main>`
- Changed main padding from `py-8` to `pt-4 pb-8` for HUD bar breathing room

## Deviations from Plan

None - plan executed exactly as written.

## Threat Mitigations Applied

| Threat ID | Mitigation |
|-----------|------------|
| T-01-04 (DoS via re-render storms) | Individual Zustand selectors used — HudBar only re-renders when player slice changes |
| T-01-05 (Information Disclosure) | Accepted — resource values are game state, not PII |

## Known Stubs

None.

## Verification

- TypeScript compilation: PASS (no errors in HudBar.tsx or Layout.tsx)
- Individual selectors: VERIFIED in source code (6 separate `useGameStore((s) => ...)` calls)
- No other files modified: VERIFIED (only HudBar.tsx created, Layout.tsx modified)
- Initial state values: credits=1000, level=1, energy=100, maxEnergy=100, reputation=0, username="Anonymous"

## Self-Check: PASSED

- HudBar.tsx exists: YES
- Layout.tsx modified: YES
- Commits present: d2975f3, 54306c0
