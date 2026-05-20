# AI Idle Hacker

## What This Is

A web-based idle hacker game combining terminal-style hacking simulation, cyberpunk aesthetics, resource management, and incremental game mechanics. The unique differentiator: AI auto-play capability where an AI agent watches the game, makes strategic decisions about upgrades and resource allocation, and plays like a human would — allowing the game to progress even when the player is away.

## Core Value

Players experience the fantasy of being a cyberpunk hacker — typing commands in a terminal to breach systems, stealing data/crypto, upgrading their rig, and deploying AI agents to automate their hacking operations.

## Key Features

- **Terminal Interface**: Authentic-feeling terminal where players type commands to hack into systems
- **Escalating Targets**: Systems of increasing difficulty with different security levels and rewards
- **Upgrade System**: Hardware (CPU, RAM, network) and Software (exploits, tools, scripts) upgrade trees
- **Resource Management**: Crypto, data, bandwidth, and reputation as core resources
- **AI Auto-Play**: AI agent that observes game state and makes strategic decisions — upgrading, hacking, and allocating resources autonomously
- **Cyberpunk Aesthetic**: Neon, glitch effects, dark theme, atmospheric UI
- **Idle/Incremental Mechanics**: Passive income from deployed scripts, exponential scaling, prestige system

## Technical Context

- **Frontend**: Vite + React + TypeScript (existing scaffolding)
- **Backend**: Supabase (auth, database, real-time)
- **API**: Node.js/Express routes in `/api`
- **Workers**: Web Workers for background processing
- **Styling**: Tailwind CSS with custom cyberpunk theme

## Target Audience

- Gamers who enjoy idle/incremental games (Cookie Clicker, Adventure Capitalist fans)
- People curious about hacking/cybersecurity who want a gamified experience
- Players who want both active gameplay and passive AI-driven progression

## Constraints

- Single-player only
- Web browser game (no native apps)
- MVP should feel like a near-complete experience, not a bare prototype

## Out of Scope

- Multiplayer/competitive modes
- Real hacking or actual security tools
- Mobile app versions (browser-only for v1)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| AI auto-play as core feature | Differentiates from standard idle games | AI makes strategic decisions, not just random actions |
| Terminal-first UI | Authentic hacker fantasy | Terminal is primary interaction, not decorative |
| Near-complete MVP | Players expect satisfying idle game loop | Include prestige, multiple target tiers, upgrade trees from start |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-20 after initialization*
