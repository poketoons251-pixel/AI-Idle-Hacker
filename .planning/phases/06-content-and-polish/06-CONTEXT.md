# Phase 6: Content & Polish — Context

**Gathered:** 2026-05-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Visual polish (terminal effects, animations), audio system (sound effects + ambience), expanded content (targets 5→20, upgrades 11→20), and performance optimization (bundle splitting, xterm.js WebGL). Makes the game feel complete — no new gameplay systems, only depth and polish.
</domain>

<decisions>
## Implementation Decisions

### Sound System
- **D-01:** **Hybrid approach — Web Audio API synth + free CC0 SFX packs.** Synth for UI feedback (beeps, blips, sweeps). CC0 packs for ambience. Zero-cost, no extra dependencies.
- **D-02:** **Sound style: cyberpunk digital.** Clean, cold, precise synth tones — not 8-bit retro, not heavy industrial. Inspired by Blade Runner terminals and Deus Ex UI.
- **D-03:** **Trigger-to-sound mapping:**
  - Hack complete: Rising synth sweep (sine, 200→800Hz, 0.3s)
  - Upgrade purchase: Short confirm blip (square, 440Hz, 0.1s)
  - Achievement unlock: Glissando arpeggio (3 ascending tones)
  - UI click: Tiny noise burst (0.02s)
  - AI decision: Quick double-beep
  - Terminal glitch: Low static burst
  - New target unlocked: Alert chime (triangle wave)
- **D-04:** **Ambient drone on Dashboard.** Subdued low ~60Hz saw wave, bandpass filtered, near-silent. Occasional random data-noise chirps. Should feel like the terminal is "alive" without being noticeable after 30s.
- **D-05:** **Implementation: singleton `AudioManager` class** wrapping raw Web Audio API. Zero external dependencies. Lazy-init on first user interaction (browser autoplay policy).

### Terminal Visual Effects
- **D-06:** **Glitch effect on terminal container** — brief CSS horizontal displacement + RGB-split. Triggered on hack attempts, target unlocks, and random ~30s intervals. Low CPU cost via CSS transforms.
- **D-07:** **Screen flash on achievement** — subtle green/white overlay, 0.3s duration.
- **D-08:** **Scan animation for `scan` command** — animated scanning line across terminal via CSS gradient sweep. Makes existing command feel more alive.
- **D-09:** **Skip matrix rain** — CRT scanlines + flicker already provide sufficient terminal texture. Canvas overlay adds GPU cost for diminishing return.

### Content Expansion
- **D-10:** **Targets: 5→20, organized in 4 tiers:**
  - Entry (difficulty 1-2): 4 new — IoT devices, smart home hubs, crypto mining rigs, etc.
  - Mid (difficulty 3-4): 4 new — dark web forums, corporate VPNs, hospital networks, etc.
  - High (difficulty 5-6): 4 new — military satellites, central bank SWIFT, AI research lab, etc.
  - Elite (difficulty 7-8): 3 new — alienware mainframe, NSA black site, quantum encryption node
- **D-11:** **Upgrades: 11→20 slots.**
  - 4 new hardware: Cooling system, network switch, FPGA array, neural interface
  - 5 new software: Packet injector, log cleaner, port scanner, AI training model, backdoor installer
- **D-12:** **Content added as data only** — extend `initialTargets` and `initialEquipment` arrays in `src/store/gameStore.ts`. No new components or routes needed.

### Performance
- **D-13:** **Lazy-load non-critical routes** via `React.lazy()` — Leaderboards, Settings, and any secondary pages. Reduces initial bundle size (~3MB).
- **D-14:** **Verify xterm.js WebGL renderer** addon is actively used (not just imported). Add `fit` addon for proper terminal resize.
- **D-15:** **No micro-optimization** — don't chase re-renders or premature optimization unless measurable jank is found.

### Claude's Discretion
- Sound volume levels and mixing (keep ambience very quiet, UI sounds moderate)
- Exact target names and reward values within each tier
- Terminal glitch CSS implementation specifics
- Which specific pages get lazy-loaded

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

- `.planning/ROADMAP.md` — Phase 6 goal, success criteria (6 items)
- `.planning/REQUIREMENTS.md` — Existing v1 requirements (Phase 6 has no specific reqs — pure polish)
- `.planning/PROJECT.md` — Project context, target audience, constraints
- `.planning/phases/03-persistence-polish/03-CONTEXT.md` — Deferred sound effects note (now due)
- `tailwind.config.js` — Existing animation keyframes (glow, pulse-slow, flicker, slide-in) — extend for new effects
- `src/store/gameStore.ts` — `initialTargets[]` (line 606), `initialEquipment[]` (line 654) — extend these
- `src/styles/crt-effects.css` — Existing CRT scanline/flicker CSS — reference for new effects
- `src/components/AchievementPopup.tsx` — Reusable slide-in notification pattern
- `src/commands/hacking.ts` — Hack command with 6-stage breach animation
- `src/commands/system.ts` — `scan` command — add scan-line animation
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **tailwind.config.js** — 4 existing keyframes (glow, pulse-slow, flicker, slide-in). Add new ones for glitch/scan effects.
- **crt-effects.css** — 82 lines of CRT overlay (scanlines, curvature, flicker). Pattern to follow for new CSS effects.
- **AchievementPopup.tsx** — Slide-in notification component. Could extend for sound system UI (mute indicator, volume indicator).
- **`sonner` toast library** — Already installed (v2.0.7). Could use for sound-system status notifications.
- **`lucide-react`** — 800+ icons. Speaker/mute icons available for sound toggle UI.

### Established Patterns
- **State flow**: Zustand store → individual selectors → components. Sound and animation settings should follow this.
- **CSS styling**: Tailwind utility classes + `cn()` helper. New effects should use the existing cyber-* color palette.
- **Component pattern**: Named exports, `React.FC<Props>`, `className` merging via `cn()`.

### Integration Points
- Sound toggle: `src/pages/Settings.tsx` — add Audio section with master volume + SFX/ambience toggles
- Animation toggle: Settings panel — extend Display section with "Terminal effects" toggle
- Content data: `src/store/gameStore.ts` — extend arrays, no new components
- Scan animation: `src/commands/system.ts` — hook into the `scan` command's output path

</code_context>

<specifics>
## Specific Ideas

- Synth sounds should feel "cold and digital" — think machinery, not music
- Terminal glitch should be subtle (50-100ms), not seizure-inducing
- New targets should have hacker-culture names (references to real dark-web lore, CTF challenges, etc.)
- Sound system must respect browser autoplay policy — first sound plays on user's first click/keypress

</specifics>

<deferred>
## Deferred Ideas

- Ambient music tracks — would need licensing or composition, out of v1 scope
- Particle effects (screen shatter on hack, data particle streams) — could add in future polish pass
- Prestige system — mentioned in v2 requirements, separate phase
- Dynamic world events — v2 requirement, separate phase

</deferred>

---

*Phase: 06-Content & Polish*
*Context gathered: 2026-05-22*
