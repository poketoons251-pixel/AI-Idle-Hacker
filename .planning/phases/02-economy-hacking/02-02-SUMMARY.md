---
phase: "02"
plan: "02"
subsystem: economy-hacking
tags: [gameplay, hacking, targets, terminal]
dependency:
  requires: ["01"]
  provides: ["03"]
  affects: ["03"]
tech-stack:
  added: []
  patterns: ["async terminal animation", "side-effect command registration", "target lookup by name/id"]
key-files:
  created:
    - src/commands/hacking.ts
  modified:
    - src/store/gameStore.ts
    - src/components/TerminalContainer.tsx
decisions:
  - "Used async handler for hack command to support staged breach animation with delays"
  - "Target lookup supports both exact id match and partial name match for better UX"
  - "Breach animation uses setTimeout-based delays rather than CSS animations for terminal authenticity"
metrics:
  duration: "automated"
  completed_date: "2026-05-20"
---

# Phase 02 Plan 02: Economy & Hacking - Hacking Gameplay Summary

**One-liner:** Expanded hacking targets to 5 systems with escalating difficulty and implemented terminal hack command with 6-stage breach animation, reward distribution, and target unlocking.

## Objective

Implement hacking gameplay: expand targets to 5 systems, add terminal hack command with breach animation, and wire up reward/unlock flow.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add 2 more targets to reach 5 total | `e592940` | `src/store/gameStore.ts` |
| 2 | Create hack command with breach animation | `5e3919b` | `src/commands/hacking.ts`, `src/components/TerminalContainer.tsx` |

## Task Details

### Task 1: Add 2 more targets to reach 5 total

Extended `initialTargets` array in `gameStore.ts` from 3 to 5 targets:
- **target-4**: Regional Bank Server (corporation, difficulty 4, security 5, 800 credits / 400 XP / 20 rep)
- **target-5**: Government Data Vault (government, difficulty 5, security 7, 2000 credits / 1000 XP / 50 rep)

Targets follow escalating difficulty (1-5) with only target-1 initially unlocked.

### Task 2: Create hack command with breach animation

Created `src/commands/hacking.ts` with:
- **hack command** (aliases: `exploit`, `breach`) accepting target name or id
- **Target validation**: checks existence, unlocked status, and energy requirement
- **6-stage breach animation** with progressive delays:
  1. Scanning target (800ms, cyan)
  2. Bypassing firewall (1200ms, yellow)
  3. Exploiting vulnerabilities (1500ms, yellow)
  4. Accessing restricted data (1000ms, green)
  5. Extracting data packets (800ms, green)
  6. Cleaning traces (600ms, brightGreen)
- **Reward distribution**: credits, XP, reputation shown as `[EARNED]` lines
- **Auto-unlock**: next target in sequence unlocked after successful breach
- **TerminalContainer.tsx**: added side-effect import to register hack command

## Deviations from Plan

None - plan executed exactly as written.

## Success Criteria Verification

- **HACK-01**: `hack <target>` command initiates operation against target ✓
- **HACK-02**: 5 targets with escalating difficulty (1-5) and different rewards ✓
- **HACK-03**: Terminal shows 6-stage breach animation with colored output ✓
- **HACK-04**: Successful hack awards credits/XP/reputation and unlocks next target ✓
- **HACK-05**: 5 distinct target systems (Coffee Shop, Business Server, University, Bank, Government) ✓

## Known Stubs

None. All functionality is wired and operational.

## Threat Flags

| Flag | File | Description |
|------|------|-------------|
| threat_flag: input_validation | src/commands/hacking.ts | Target lookup uses partial name match (`.includes()`) — could match unintended targets if names overlap. Mitigated by requiring exact id match as primary lookup. |

## Self-Check: PASSED

All created/modified files verified to exist. All commits verified in git log.
