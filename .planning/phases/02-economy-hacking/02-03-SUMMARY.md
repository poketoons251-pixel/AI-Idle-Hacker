---
phase: "02"
plan: "03"
type: execute
wave: 2
depends_on: ["01"]
subsystem: economy-hacking
tags: [upgrade-panel, visual-feedback, terminal-commands, economy]
requires:
  - gameStore.upgradeEquipment action
  - commandRegistry singleton
  - Zustand store selectors
provides:
  - upgrade/upgrades terminal commands
  - UpgradePanel collapsible sidebar component
  - AnimatedCounter with flash animations
  - FloatingPopup for resource gain display
  - useResourceFlash hook for change detection
affects:
  - src/components/Layout.tsx
  - src/components/HudBar.tsx
  - src/components/TerminalContainer.tsx
tech-stack:
  added: []
  patterns:
    - Zustand selective selectors
    - Side-effect command registration
    - CSS keyframe animations
    - Collapsible sidebar pattern
key-files:
  created:
    - src/commands/economy.ts
    - src/components/UpgradePanel.tsx
    - src/components/AnimatedCounter.tsx
    - src/components/FloatingPopup.tsx
    - src/hooks/useResourceFlash.ts
  modified:
    - src/components/Layout.tsx
    - src/components/HudBar.tsx
    - src/components/TerminalContainer.tsx
    - src/styles/crt-effects.css
    - src/lib/terminalColors.ts
decisions:
  - Used brightMagenta as alias for brightPink (same ANSI code) for terminal color consistency
  - Added XP counter to HudBar (was missing) to satisfy cyan flash acceptance criteria
  - EquipmentCard typed inline to match Equipment interface subset used in display
metrics:
  duration: ~10min
  completed_date: "2026-05-20"
  tasks_completed: 3
  tasks_total: 3
  files_created: 5
  files_modified: 5
---

# Phase 02 Plan 03: Upgrade Panel & Visual Feedback Summary

**One-liner:** Collapsible upgrade sidebar with terminal commands, plus visual feedback system (counter flash, floating popups) for resource changes.

## Tasks Completed

| # | Task | Commit | Key Files |
|---|------|--------|-----------|
| 1 | Create upgrade and upgrades terminal commands | `6671b12` | `src/commands/economy.ts`, `src/components/TerminalContainer.tsx`, `src/lib/terminalColors.ts` |
| 2 | Create UpgradePanel component | `1bf9aea` | `src/components/UpgradePanel.tsx`, `src/components/Layout.tsx` |
| 3 | Build visual feedback system | `43cb292` | `src/hooks/useResourceFlash.ts`, `src/components/AnimatedCounter.tsx`, `src/components/FloatingPopup.tsx`, `src/styles/crt-effects.css`, `src/components/HudBar.tsx` |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing functionality] Added brightMagenta color to terminalColors.ts**
- **Found during:** Task 1
- **Issue:** Plan references `Colors.brightMagenta()` which did not exist in terminalColors.ts
- **Fix:** Added `brightMagenta` as alias for `brightPink` (same ANSI code `\x1b[1;35m`)
- **Files modified:** `src/lib/terminalColors.ts`
- **Commit:** `6671b12`

**2. [Rule 2 - Missing functionality] Added XP counter to HudBar**
- **Found during:** Task 3
- **Issue:** Acceptance criteria required `flash-cyan` match in HudBar for experience, but no XP counter existed
- **Fix:** Added XP display section with AnimatedCounter (cyan flash) and FloatingPopup
- **Files modified:** `src/components/HudBar.tsx`
- **Commit:** `43cb292`

**3. [Rule 1 - Bug] Fixed EquipmentCard interface type**
- **Found during:** Task 2
- **Issue:** Plan's inline type for EquipmentCard used `eq` prop name without proper interface
- **Fix:** Created explicit `EquipmentCardProps` interface with proper typing
- **Files modified:** `src/components/UpgradePanel.tsx`
- **Commit:** `1bf9aea`

## Requirements Fulfilled

- **ECON-03:** Player can spend credits via `upgrade <name>` command or UpgradePanel buy button
- **UI-02:** UpgradePanel accessible from terminal (`upgrades` command) and as collapsible sidebar
- **UI-05:** Counter flashes on change, floating "+X" popup for 1s, [EARNED] terminal lines

## Threat Flags

| Flag | File | Description |
|------|------|-------------|
| threat_flag: tampering | src/commands/economy.ts | upgrade command validates equipment exists and player can afford before calling upgradeEquipment (mitigates T-02-07) |
| threat_flag: tampering | src/components/UpgradePanel.tsx | Buy button disabled when player.credits < equipment.upgradeCost; store validates internally (mitigates T-02-08) |

## Self-Check: PASSED

All created files verified to exist. All commits verified in git log.
