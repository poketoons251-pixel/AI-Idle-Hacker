---
phase: 04-ai-auto-play
plan: 02
type: execute
subsystem: ai-decision-engine
tags: [ai, decision-engine, settings, strategic]
dependency_graph:
  requires: []
  provides:
    - AI-02: AI makes strategic decisions about upgrades
    - AI-03: AI initiates hacking commands against appropriate targets
  affects:
    - src/store/gameStore.ts (makeAIDecision replaced)
    - src/components/AIToggle.tsx (settings button added)
tech_stack:
  added: []
  patterns:
    - ROI-based equipment evaluation (bonus/upgradeCost)
    - Risk-adjusted target selection (credits/difficulty weighted by riskTolerance)
    - Priority-weighted action selection
    - Reserve threshold enforcement (20% default)
key_files:
  created:
    - src/lib/aiDecisionEngine.ts
    - src/components/AISettingsPanel.tsx
  modified:
    - src/store/gameStore.ts
    - src/components/AIToggle.tsx
decisions:
  - "Used separate module (aiDecisionEngine.ts) for decision logic — keeps gameStore clean, enables future LLM integration"
  - "Added operationType to AIDecision interface — needed for start_operation decisions"
  - "Changed initialAIConfig reserve from 0.1 to 0.2 — per D-04 requirement"
  - "Settings panel uses modal overlay with backdrop blur — matches cyberpunk theme"
  - "Priority sliders use 0-100% range mapped to 0.0-1.0 — consistent with existing AIConfig interface"
metrics:
  duration_minutes: ~15
  completed_date: "2026-05-21"
  tasks_completed: 2
  tasks_total: 2
  files_created: 2
  files_modified: 2
  lines_added: ~547
---

# Phase 4 Plan 02: AI Decision Engine & Settings Summary

**One-liner:** Hybrid AI decision engine with ROI-based upgrade evaluation, risk-adjusted target selection, 20% reserve enforcement, and cyberpunk-themed settings panel.

## Tasks Completed

### Task 1: AI Decision Engine with Strategic Evaluation

**Commit:** `3477fb7`

Created `src/lib/aiDecisionEngine.ts` with three exported functions:

- **`evaluateUpgradeOptions(ctx)`** — Filters equipped items (level < 10), calculates ROI as `bonus/upgradeCost`, excludes items exceeding available credits (`credits * (1 - reserve)`), returns sorted by value descending.

- **`evaluateTargetOptions(ctx)`** — Filters unlocked targets (difficulty <= level + 2), calculates base value as `credits/difficulty`, weights by riskTolerance (high risk favors harder targets, low risk favors easier), returns sorted by value descending.

- **`makeStrategicDecision(ctx)`** — Uses priorities to decide action type:
  - If upgrades > operations priority AND affordable upgrade exists → `upgrade_equipment`
  - If operations > upgrades priority AND energy sufficient → `start_operation`
  - If skillPoints > 0 → `allocate_skill` (prioritizes hacking)
  - Fallback: checks both upgrade and operation paths
  - Reasoning format: `"Analyzing... {specific numbers} → {action}"`
  - Confidence: 0.3-1.0 range based on value scores

Updated `src/store/gameStore.ts`:
- Imported `makeStrategicDecision` from aiDecisionEngine
- Replaced `makeAIDecision()` to build `StrategicContext` and delegate to engine
- Updated `initialAIConfig.reserve` from 0.1 to 0.2 (per D-04)
- Added `operationType?: string` to `AIDecision` interface

### Task 2: AI Settings Panel

**Commit:** `1558ca7`

Created `src/components/AISettingsPanel.tsx`:
- Risk Tolerance slider (0-100%, default 60%) — maps to `aiConfig.riskTolerance`
- Credit Reserve slider (0-50%, default 20%) — maps to `aiConfig.resourceAllocation.reserve`
- Priority sliders for Operations, Upgrades, Skills, Equipment — maps to `aiConfig.priorities`
- Modal overlay with backdrop blur, Escape key close, outside click close
- Zustand individual selectors to avoid unnecessary re-renders
- Cyberpunk theme: dark background, neon accent colors, glowing sliders
- Reusable `PrioritySlider` component with color-coded thumbs

Updated `src/components/AIToggle.tsx`:
- Added settings gear button next to AI toggle button
- Wrapped toggle and settings in flex container with gap

## Verification

- [x] TypeScript compiles without errors (`npx tsc --noEmit` — 0 errors)
- [x] `aiDecisionEngine.ts` exports: `makeStrategicDecision`, `evaluateUpgradeOptions`, `evaluateTargetOptions`
- [x] `evaluateUpgradeOptions` returns equipment sorted by ROI (bonus/upgradeCost)
- [x] `evaluateUpgradeOptions` filters by available credits (credits * (1 - reserve))
- [x] `evaluateTargetOptions` returns targets sorted by risk-adjusted value
- [x] `makeStrategicDecision` respects aiConfig priorities for action type selection
- [x] `makeStrategicDecision` enforces reserve threshold (default 0.2)
- [x] Reasoning strings follow format: "Analyzing... {details} → {action}"
- [x] `gameStore.ts` `makeAIDecision()` calls `makeStrategicDecision` from aiDecisionEngine
- [x] `AISettingsPanel` has Risk Tolerance slider (0-100%, default 60%)
- [x] `AISettingsPanel` has Credit Reserve slider (0-50%, default 20%)
- [x] `AISettingsPanel` has priority sliders for Operations, Upgrades, Skills, Equipment
- [x] Each slider updates aiConfig via `updateAIConfig()`
- [x] Panel accessible from HUD via settings button next to AI toggle
- [x] Panel opens/closes correctly (Escape, outside click, close button)
- [x] Settings persist via Zustand persist middleware (already configured on gameStore)
- [x] `executeAIDecision()` unchanged — still works with new decision format

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all functionality is wired and operational.

## Threat Flags

| Flag | File | Description |
|------|------|-------------|
| threat_flag: AI settings→game state | `src/components/AISettingsPanel.tsx` | User-configurable AI parameters directly affect automated gameplay decisions |
| threat_flag: Decision engine→store | `src/lib/aiDecisionEngine.ts` | Engine reads game state and produces decisions that mutate store (mitigated by pure computation, no network calls) |

## Self-Check: PASSED

- [x] `src/lib/aiDecisionEngine.ts` exists
- [x] `src/components/AISettingsPanel.tsx` exists
- [x] `src/store/gameStore.ts` modified (makeAIDecision replaced)
- [x] `src/components/AIToggle.tsx` modified (settings button added)
- [x] Commit `3477fb7` exists (Task 1)
- [x] Commit `1558ca7` exists (Task 2)
