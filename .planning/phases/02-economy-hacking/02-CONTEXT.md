# Phase 2 Context — Economy & Hacking

## Domain

Core idle game loop — resources generate passively, upgrades purchasable, hacking targets available with terminal output. This phase delivers the economy engine, hacking gameplay, upgrade system, and visual feedback.

## Requirements (from ROADMAP.md)

- **ECON-01**: Game generates at least one core resource (crypto) passively over time
- **ECON-02**: Resource generation rate is visible to the player
- **ECON-03**: Player can spend resources to purchase upgrades
- **ECON-04**: Upgrades increase resource generation rate or unlock new capabilities
- **ECON-05**: At least 10 upgrades across hardware and software categories
- **ECON-06**: Upgrade costs scale exponentially (standard idle game progression)
- **HACK-01**: Player can initiate hacking commands against target systems
- **HACK-02**: Targets have escalating difficulty levels with different rewards
- **HACK-03**: Hacking commands produce terminal output simulating a breach sequence
- **HACK-04**: Successful hacks yield resources and unlock harder targets
- **HACK-05**: At least 5 distinct target systems in v1
- **UI-02**: Upgrade panel accessible from terminal or sidebar
- **UI-05**: Visual feedback on actions (flashing numbers, terminal animations)

## Decisions

### Upgrade Flow
- **Both UI panel + terminal commands** — Players can upgrade via UI panel (click to buy) or terminal commands (`upgrade cpu`, `upgrade ram`). Both call the same Zustand store action (`upgradeEquipment`). UI panel serves the idle game loop (fast, convenient), terminal commands serve the hacker fantasy (authentic, power user).

### Hacking Command Depth
- **Multi-step hacking** — Player scans for targets → selects hacking technique via `HackingTechniqueSelector` → executes hack → terminal shows progress animation → result. Matches existing `HackingTechniqueSelector` component and `startOperation` store action. More immersive than single-command hacking.

### Resource Generation Rate
- **5 credits/sec base rate** — Player starts with 1000 credits (existing store). Base generation: 5 credits/sec. First upgrade adds +2/sec. Exponential cost scaling at 1.5x per level. Standard idle game curve — early upgrades feel impactful, later ones require more investment.

### Upgrade Panel Location
- **Collapsible sidebar panel** — Right side of terminal, toggleable. Shows available upgrades with cost, effect, and buy button. Keeps terminal visible at all times. Uses existing Layout pattern. Terminal command `upgrades` also opens/toggles the panel.

### Visual Feedback
- **Moderate intensity** — Counter flashes on change (green for +credits, pink for +reputation, cyan for +experience). Small "+X" popup animation floats up from counter for 1 second. Terminal shows `[EARNED] +50 credits` line on resource gain. Satisfying without being chaotic for idle game pace.

### Existing Infrastructure
- **Zustand store** already has: `upgradeEquipment`, `startOperation`, `completeOperation`, `unlockTarget`, `spendCredits`, `gainExperience` actions. Equipment, Operation, Target interfaces defined.
- **Operations page** already has target cards, `HackingTechniqueSelector`, active operations display.
- **Game loop Worker** already handles energy regeneration (+1/sec). Extend for credit generation.
- **Command registry** from Phase 1 — add `upgrade`, `hack`, `buy`, `upgrades` commands.

## Canonical Refs

- `.planning/ROADMAP.md` — Phase 2 goal, requirements, success criteria
- `.planning/REQUIREMENTS.md` — ECON-01 through ECON-06, HACK-01 through HACK-05, UI-02, UI-05
- `.planning/PROJECT.md` — Project context and key decisions
- `.planning/phases/01-terminal-foundation/01-CONTEXT.md` — Phase 1 decisions (terminal, game loop, commands)
- `.planning/research/FEATURES.md` — Feature landscape with table stakes/differentiators
- `.planning/research/ARCHITECTURE.md` — System architecture patterns
- `src/store/gameStore.ts` — Zustand store with Equipment, Operation, Target interfaces and actions
- `src/pages/Operations.tsx` — Existing operations page with target cards and HackingTechniqueSelector
- `src/components/HackingTechniqueSelector.tsx` — Technique selection component
- `src/lib/commandRegistry.ts` — Command registry from Phase 1
- `src/components/XtermTerminal.tsx` — xterm.js terminal wrapper
- `src/workers/gameLoopWorker.ts` — Game loop tick worker
- `src/hooks/useGameLoop.ts` — Game loop hook

## Code Context

### Reusable Assets
- **Zustand store actions**: `upgradeEquipment(equipmentId)`, `startOperation(targetId, type)`, `completeOperation(operationId)`, `unlockTarget(targetId)`, `spendCredits(amount)`, `gainExperience(amount)`
- **Existing components**: `HackingTechniqueSelector`, `TargetCard`, `DetailedActiveOperation`
- **Game loop**: `useGameLoop` hook with tick accumulator, energy regeneration pattern
- **Command registry**: `CommandRegistry` class with `register`, `execute`, `autocomplete` methods
- **Terminal**: `XtermTerminal` with `onCommand` callback, `onTerminalReady` prop

### Patterns
- **State flow**: Zustand store → individual selectors → components (prevents re-render storms)
- **Worker communication**: `postMessage` for tick data, `onmessage` for state updates
- **Command execution**: `onData` → `handleCommand` → `commandRegistry.execute()` → terminal output

## Deferred Ideas

- Prestige/reset mechanic — Phase 3 or later
- Dynamic world events — Phase 6
- Skill tree branching — Phase 6
- Achievement system — Phase 3
- Sound effects — Phase 6
