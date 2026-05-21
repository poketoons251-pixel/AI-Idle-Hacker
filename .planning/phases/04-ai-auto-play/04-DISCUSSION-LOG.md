# Phase 4 Discussion Log — AI Auto-Play

**Date:** 2026-05-21
**Phase:** 4 — AI Auto-Play

## Areas Discussed

### 1. AI Decision Frequency
- **Options considered:** Every second, every 10 seconds, on-demand
- **Decision:** Every 10 seconds
- **Rationale:** Matches game loop rhythm. Visible progress without terminal spam. Configurable interval.

### 2. AI Strategy Complexity
- **Options considered:** Simple rules-based, LLM-powered, hybrid
- **Decision:** Hybrid (rules + LLM)
- **Rationale:** Fast routine decisions, smart strategic choices. Rules for routine, LLM via Edge Functions for strategic moments.

### 3. AI Reasoning Visibility
- **Options considered:** Actions only, full reasoning chain, summary reasoning
- **Decision:** Summary reasoning
- **Rationale:** Player understands AI strategy without verbosity. Format: `[AI] Analyzing... CPU gives +2/sec → Purchasing`.

### 4. AI Resource Allocation
- **Options considered:** Reserve 20%, spend aggressively, dynamic
- **Decision:** Reserve 20%
- **Rationale:** Safe buffer, configurable risk tolerance. Standard idle game AI pattern.

### 5. AI Toggle Location
- **Options considered:** HUD button, Settings panel, terminal command, both HUD + terminal
- **Decision:** Both HUD button + terminal command
- **Rationale:** Quick access + hacker fantasy. HUD status indicator (green/gray). `ai on/off` commands.

## Deferred Ideas
- Multi-agent competition (Phase 5+)
- AI personality customization (Future phase)
- Advanced AI strategy learning (Future phase)
- AI performance analytics dashboard (Future phase)
