# Feature Landscape

**Domain:** Cyberpunk terminal hacking idle game with AI auto-play
**Researched:** 2026-05-20

## Table Stakes

Features players expect from any idle/incremental game. Missing = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Resource generation (passive income) | Core idle game mechanic | Low | Resources tick up over time, displayed in terminal |
| Upgrades/purchases | Progression loop | Low | Spend resources to increase generation rate |
| Offline progress | Players close the tab | Medium | Calculate elapsed time × idle rate on load, cap at reasonable max (8hrs) |
| Auto-save | Players expect no progress loss | Low | IndexedDB auto-save every 30s + on `beforeunload` |
| Save export/import | Community sharing, backup | Medium | Base64-encoded JSON, copy-paste format |
| Multiple save slots | Risk management, experimentation | Low | Separate IndexedDB keys per slot |
| Prestige/reset mechanic | Long-term progression | Medium | Reset progress for permanent multiplier — standard in modern idle games |
| Terminal-style UI | Theme requirement | Medium | xterm.js with cyberpunk color palette, scrolling log output |
| Visual feedback on actions | Game feel | Low | Terminal output confirms purchases, resource gains flash |
| Settings panel | Accessibility, preferences | Low | Sound toggle, theme variants, save management |

## Differentiators

Features that set this product apart. Not expected, but valued.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| AI auto-play agent | "Play while you sleep" taken literally — AI makes strategic decisions | High | Supabase Edge Functions run AI decision loops, output streamed to terminal via SSE |
| Hacking narrative/theme | Immersive cyberpunk aesthetic, not just numbers going up | Medium | Terminal commands, "hacking" animations, lore through terminal output |
| Real-time terminal log | Game events appear as terminal output in real-time | Medium | xterm.js with high-frequency writes, WebGL renderer for smooth scrolling |
| AI decision transparency | Watch the AI "think" — see its reasoning in the terminal | Medium | Stream AI reasoning alongside actions, not just results |
| Multi-agent competition | Multiple AI agents competing on leaderboards | High | Supabase Realtime for live leaderboard, async PvP |
| Dynamic world events | Random events that change game conditions | Medium | Supabase pg_cron for scheduled events, Realtime for push |
| Skill tree / specialization | Player choice in progression path | Medium | Branching upgrades, replayability through different builds |
| Achievement system | Milestone tracking, bragging rights | Low | IndexedDB-stored, displayed in terminal |

## Anti-Features

Features to explicitly NOT build.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Real-time multiplayer (synchronous) | Adds massive complexity, server costs, and latency issues. Idle games are inherently async. | Async competition via leaderboards, not real-time interaction |
| Custom terminal renderer | xterm.js is battle-tested. Building a terminal from scratch is a multi-month project with worse results. | Use xterm.js with custom theme and addons |
| Browser-side LLM calls | Exposes API keys, unreliable on mobile, no cost control. | All AI through Supabase Edge Functions |
| Complex 3D/Canvas graphics | Breaks the terminal aesthetic, adds unnecessary bundle size. | ASCII art, ANSI color effects, terminal-based animations |
| Social features (chat, friends) | Scope creep. Focus on single-player + AI competition first. | Add post-launch if there's demand |
| Mobile-native app (React Native) | Terminal aesthetic works poorly on mobile. Web PWA is sufficient. | Responsive web design + PWA installability |

## Feature Dependencies

```
Terminal UI → Resource Display → Terminal output formatting
Resource Generation → Upgrades → Can't buy upgrades without resources
Upgrades → Prestige → Prestige resets upgrades but keeps multiplier
Offline Progress → Save System → Need save timestamps to calculate elapsed time
Save System → Cloud Sync → Local saves must exist before cloud sync makes sense
AI Auto-Play → Resource Generation → AI needs game mechanics to interact with
AI Auto-Play → Supabase Edge Functions → AI decisions run server-side
AI Auto-Play → Terminal UI → AI decisions streamed as terminal output
Real-time Leaderboard → Cloud Sync → Need cloud saves for cross-device competition
Dynamic Events → Supabase pg_cron → Scheduled server-side events
```

## MVP Recommendation

Prioritize:
1. **Terminal UI with xterm.js** — The entire game lives here. Get this right first.
2. **Basic resource generation + upgrades** — The core idle loop. One resource, 3-5 upgrades.
3. **Auto-save to IndexedDB + offline progress** — Players must not lose progress.
4. **Cyberpunk theme** — Visual identity is a key differentiator.
5. **AI auto-play (basic)** — One AI agent making simple decisions (buy cheapest upgrade available).

Defer:
- **Multi-agent competition**: Requires cloud sync, leaderboards, and stable economy first.
- **Skill tree / prestige**: Need core loop validated before adding meta-progression.
- **Dynamic world events**: Adds complexity to an already complex AI integration.
- **Achievement system**: Nice to have, not core to the loop.

## Sources

- OpenIdle-Engine (GitHub): Data-driven idle game engine — resources, tasks, actions, converters, equipment
- ai-agent-idle-game (GitHub): API-first idle game for AI agents — click, upgrades, PvP, alliances, dungeons, prestige
- Cookie Clicker, Adventure Capitalist, Universal Paperclips: Genre conventions analysis
- Supabase game sync patterns: Realtime multiplayer game architecture
