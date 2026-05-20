# Phase 2 Discussion Log — Economy & Hacking

**Date:** 2026-05-20
**Phase:** 2 — Economy & Hacking

## Areas Discussed

### 1. Upgrade Flow
- **Options considered:** Terminal only, UI panel only, both UI + terminal
- **Decision:** Both UI panel + terminal commands
- **Rationale:** UI panel for idle game convenience (click → upgrade), terminal commands for hacker fantasy (`upgrade cpu`). Both call same Zustand store action.

### 2. Hacking Command Depth
- **Options considered:** Single command, multi-step, hybrid
- **Decision:** Multi-step hacking
- **Rationale:** Matches existing `HackingTechniqueSelector` component. Player scans → selects technique → executes → progress → result. More immersive.

### 3. Resource Generation Rate
- **Options considered:** Fast start (10/sec), slow start (1/sec), medium (5/sec)
- **Decision:** 5 credits/sec base, exponential scaling at 1.5x per level
- **Rationale:** Standard idle game curve. Player starts with 1000 credits. First upgrade adds +2/sec. Meaningful progression.

### 4. Upgrade Panel Location
- **Options considered:** Separate page, sidebar panel, terminal-driven
- **Decision:** Collapsible sidebar panel
- **Rationale:** Always accessible, terminal stays visible. Uses existing Layout pattern. Terminal command `upgrades` toggles panel.

### 5. Visual Feedback
- **Options considered:** Subtle, moderate, heavy
- **Decision:** Moderate (flash + popup + terminal line)
- **Rationale:** Counter flashes on change, "+X" popup for 1 second, terminal shows `[EARNED]` line. Clear but not overwhelming.

## Deferred Ideas
- Prestige/reset mechanic (Phase 3+)
- Dynamic world events (Phase 6)
- Skill tree branching (Phase 6)
- Achievement system (Phase 3)
- Sound effects (Phase 6)
