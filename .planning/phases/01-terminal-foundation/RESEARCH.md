# Research: Phase 1 — Terminal Foundation

**Domain:** Cyberpunk idle hacker game — terminal UI replacement
**Researched:** 2026-05-20
**Overall confidence:** HIGH (all claims verified against official docs, Context7, and current npm packages)

---

## 1. xterm.js + React Integration

### Package Landscape (Current as of May 2026)

| Package | Version | Purpose | Notes |
|---------|---------|---------|-------|
| `@xterm/xterm` | 6.0.0 | Core terminal | Replaces old `xterm` package. Scoped to `@xterm/`. |
| `@xterm/addon-fit` | 0.11.0 | Resize to container | 1.2M+ weekly downloads. Zero dependencies. |
| `@xterm/addon-webgl` | 0.19.0 | GPU-accelerated renderer | WebGL2-based. Requires `@xterm/xterm` ^5.0.0 peer dep. |
| `@xterm/addon-canvas` | Latest | 2D Canvas fallback | Use as fallback when WebGL unavailable. |
| `@xterm/addon-web-links` | 0.12.0 | Clickable URLs | Optional, useful for in-game links. |
| `@xterm/addon-search` | Latest | Search in terminal | Optional for Phase 1. |

**CRITICAL:** The old `xterm` and `xterm-addon-*` packages are **deprecated**. Use the `@xterm/` scoped packages exclusively.

### Recommended React Integration Pattern

```typescript
// src/components/XtermTerminal.tsx
import React, { useEffect, useRef, useCallback } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebglAddon } from '@xterm/addon-webgl';
import { CanvasAddon } from '@xterm/addon-canvas';
import type { ITerminalOptions, ITheme } from '@xterm/xterm';

interface XtermTerminalProps {
  onCommand: (command: string) => void;
  className?: string;
  theme?: ITheme;
  options?: Partial<ITerminalOptions>;
}

export const XtermTerminal: React.FC<XtermTerminalProps> = ({
  onCommand,
  className,
  theme,
  options,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const inputBufferRef = useRef<string>('');

  useEffect(() => {
    if (!containerRef.current) return;

    // --- Initialization ---
    const term = new Terminal({
      cursorBlink: true,
      cursorStyle: 'block',
      fontFamily: "'JetBrains Mono', 'Cascadia Code', monospace",
      fontSize: 14,
      lineHeight: 1.2,
      allowTransparency: true, // Required for CSS overlay effects
      convertEol: true, // \n → \r\n for game output
      scrollback: 500,
      ...options,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    // WebGL renderer with canvas fallback
    try {
      const webglAddon = new WebglAddon();
      webglAddon.onContextLoss(() => {
        webglAddon.dispose();
        term.loadAddon(new CanvasAddon());
      });
      term.loadAddon(webglAddon);
    } catch {
      term.loadAddon(new CanvasAddon());
    }

    term.open(containerRef.current);
    fitAddon.fit();

    // --- Input Handling ---
    // Use onData (not onKey) — onData handles full UTF-8 sequences including
    // IME/Chinese input, while onKey only fires for individual key events.
    // Using onKey for input causes cursor corruption with history navigation.
    let currentInput = '';
    term.onData((data) => {
      const code = data.charCodeAt(0);

      if (code === 13) {
        // Enter key
        term.write('\r\n');
        if (currentInput.trim()) {
          onCommand(currentInput.trim());
        }
        currentInput = '';
        return;
      }

      if (code === 127 || code === 8) {
        // Backspace
        if (currentInput.length > 0) {
          currentInput = currentInput.slice(0, -1);
          term.write('\b \b');
        }
        return;
      }

      if (code === 27) {
        // Escape sequence — handle arrow keys for history
        // This is a simplification; a full implementation would parse
        // the complete escape sequence (e.g., \x1b[A for up arrow)
        return;
      }

      // Regular character input
      currentInput += data;
      term.write(data);
    });

    terminalRef.current = term;
    fitAddonRef.current = fitAddon;

    // --- Resize Observer ---
    const resizeObserver = new ResizeObserver(() => {
      // Debounce resize — FitAddon calls proposeDimensions which reads
      // terminal.scrollback. If terminal is not fully initialized, this throws.
      requestAnimationFrame(() => {
        if (fitAddonRef.current && terminalRef.current) {
          fitAddonRef.current.fit();
        }
      });
    });
    resizeObserver.observe(containerRef.current);

    // --- Cleanup (CRITICAL for React 18 Strict Mode) ---
    // React 18 Strict Mode intentionally double-invokes effects:
    // mount → unmount → remount. The cleanup function MUST fully dispose
    // the terminal to prevent:
    // 1. Double terminal instances rendering on top of each other
    // 2. Memory leaks from orphaned WebGL contexts
    // 3. "Cannot read properties of undefined (reading 'scrollback')" errors
    return () => {
      resizeObserver.disconnect();
      if (terminalRef.current) {
        terminalRef.current.dispose();
        terminalRef.current = null;
      }
      fitAddonRef.current = null;
    };
  }, [onCommand]); // Only re-run if onCommand reference changes

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width: '100%', height: '100%' }}
    />
  );
};
```

### React 18 Strict Mode Pitfalls

| Pitfall | Symptom | Solution |
|---------|---------|----------|
| **Double mount** | Terminal renders twice, input duplicated | Proper `dispose()` in cleanup. Use refs to guard. |
| **FitAddon "Cannot read scrollback"** | `TypeError: Cannot read properties of undefined (reading 'scrollback')` | Call `fitAddon.fit()` ONLY after `term.open()`. Use `requestAnimationFrame` in ResizeObserver. |
| **WebGL context loss on tab switch** | Terminal goes blank after suspend/sleep | Handle `webglAddon.onContextLoss()` → dispose WebGL, load CanvasAddon. Also call `term.clearTextureAtlas()` on visibility change. |
| **onData vs onKey confusion** | Chinese/IME input broken, arrow keys corrupt cursor | Use `onData` for character input. Parse escape sequences for special keys. Never use `onKey` for text input. |
| **allowTransparency required for CSS overlays** | CSS scanline overlay invisible over terminal | Set `allowTransparency: true` in Terminal options BEFORE `term.open()`. Cannot be changed after open. |

### Why NOT `xterm-for-react`

The `xterm-for-react` wrapper package is **abandoned** (last update 2022, incompatible with `@xterm/` scoped packages). It also adds an extra wrapper div that breaks FitAddon's dimension calculations. Write your own wrapper — it's ~60 lines and gives you full control over the lifecycle.

---

## 2. xterm.js Theming — Cyberpunk Palette

### ITheme Configuration

```typescript
const cyberpunkTheme: ITheme = {
  background: '#0a0a0a',
  foreground: '#00ff41',       // Primary green
  cursor: '#00ff41',
  cursorAccent: '#0a0a0a',
  selectionBackground: '#00d4ff40', // Transparent cyan
  selectionForeground: '#ffffff',

  // Standard ANSI colors — map to cyberpunk palette
  black: '#1a1a1a',
  red: '#ff0040',
  green: '#00ff41',
  yellow: '#ffcc00',
  blue: '#0066ff',
  magenta: '#ff0080',          // Pink
  cyan: '#00d4ff',
  white: '#e0e0e0',

  // Bright variants
  brightBlack: '#404040',
  brightRed: '#ff4060',
  brightGreen: '#00ff90',
  brightYellow: '#ffe040',
  brightBlue: '#4090ff',
  brightMagenta: '#ff40a0',    // Bright pink
  brightCyan: '#40e0ff',       // Bright cyan
  brightWhite: '#ffffff',
};
```

### Applying Theme

```typescript
// At terminal creation:
const term = new Terminal({
  theme: cyberpunkTheme,
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 14,
});

// Changing theme at runtime — MUST create a new object reference:
const newTheme = { ...cyberpunkTheme, foreground: '#ff0080' };
term.options.theme = newTheme; // Reference comparison — won't work with mutated object
```

### Font Setup

JetBrains Mono is already imported in `src/index.css`. Ensure the font loads before the terminal renders:

```css
/* src/index.css — already present */
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;700&display=swap');
```

For offline reliability, consider self-hosting the font via `fontsource`:
```bash
npm install @fontsource/jetbrains-mono
```
```typescript
// In your entry point:
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/700.css';
```

### Writing Colored Output

xterm.js interprets ANSI escape sequences in `term.write()`:

```typescript
// Color codes: \x1b[<style>;<color>m
term.write('\x1b[1;32m[SYSTEM]\x1b[0m Terminal initialized\n');  // Bold green
term.write('\x1b[1;35m[ALERT]\x1b[0m  Intrusion detected\n');    // Bold magenta/pink
term.write('\x1b[1;36m[INFO]\x1b[0m   Connection established\n'); // Bold cyan
term.write('\x1b[31mError:\x1b[0m     Access denied\n');          // Red
```

For a cleaner API, create a helper:

```typescript
// src/lib/terminalColors.ts
export const Colors = {
  green: (text: string) => `\x1b[32m${text}\x1b[0m`,
  brightGreen: (text: string) => `\x1b[1;32m${text}\x1b[0m`,
  pink: (text: string) => `\x1b[35m${text}\x1b[0m`,
  brightPink: (text: string) => `\x1b[1;35m${text}\x1b[0m`,
  cyan: (text: string) => `\x1b[36m${text}\x1b[0m`,
  brightCyan: (text: string) => `\x1b[1;36m${text}\x1b[0m`,
  red: (text: string) => `\x1b[31m${text}\x1b[0m`,
  yellow: (text: string) => `\x1b[33m${text}\x1b[0m`,
  bold: (text: string) => `\x1b[1m${text}\x1b[0m`,
  dim: (text: string) => `\x1b[2m${text}\x1b[0m`,
  underline: (text: string) => `\x1b[4m${text}\x1b[0m`,
};
```

---

## 3. Web Worker Game Loop Patterns

### Current State Analysis

The existing `idleWorker.ts` uses a **request-response** pattern:
- Main thread sends `CALCULATE_IDLE_REWARDS` → Worker calculates → Posts `IDLE_REWARDS_CALCULATED`
- Main thread polls every 5 seconds via `setInterval`

This works for offline calculations but is **not a game loop**. For Phase 1, we need to evolve this into a proper tick-based loop.

### Recommended Architecture: Dedicated Worker for Ticks

Based on the accumulator pattern (Gaffer on Games "Fix Your Timestep"), the cleanest approach for an idle game:

```typescript
// src/workers/gameLoopWorker.ts
// Dedicated worker that ONLY handles timing — no game logic
const TICK_RATE = 1000 / 10; // 10 ticks per second (100ms)
const TICK_INTERVAL = 10;

let tickCount = 0;
let running = false;

function gameLoop() {
  if (!running) return;

  tickCount++;
  self.postMessage({
    type: 'TICK',
    tick: tickCount,
    timestamp: Date.now(),
  });

  setTimeout(gameLoop, TICK_INTERVAL);
}

self.onmessage = (e) => {
  const { type } = e.data;

  switch (type) {
    case 'START':
      running = true;
      tickCount = 0;
      gameLoop();
      break;

    case 'STOP':
      running = false;
      break;

    case 'CALCULATE_IDLE':
      // Delegate heavy calculations to this same worker
      // to avoid creating multiple workers
      const result = calculateIdle(e.data.payload);
      self.postMessage({ type: 'IDLE_RESULT', data: result });
      break;
  }
};

function calculateIdle(payload: any) {
  // Same logic as current idleWorker.ts
  // ...
  return { credits: 0, experience: 0 }; // placeholder
}
```

### Main Thread Integration with Zustand

```typescript
// src/hooks/useGameLoop.ts
import { useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '../store/gameStore';

export function useGameLoop() {
  const workerRef = useRef<Worker | null>(null);
  const { lastUpdate, setLastUpdate, updatePlayer } = useGameStore();

  // Use Zustand selectors to avoid re-rendering on every tick
  // Only re-render when specific slices change
  const credits = useGameStore((s) => s.player.credits);
  const experience = useGameStore((s) => s.player.experience);

  useEffect(() => {
    // Vite-specific worker import — bundles worker automatically
    workerRef.current = new Worker(
      new URL('../workers/gameLoopWorker.ts', import.meta.url),
      { type: 'module' }
    );

    workerRef.current.onmessage = (e) => {
      const { type, tick, data } = e.data;

      switch (type) {
        case 'TICK':
          // Process tick — update Zustand store
          // IMPORTANT: batch state updates to avoid excessive re-renders
          handleGameTick(tick);
          break;

        case 'IDLE_RESULT':
          applyIdleRewards(data);
          break;
      }
    };

    // Start the loop
    workerRef.current.postMessage({ type: 'START' });

    // Calculate offline progress on mount
    calculateOfflineProgress();

    return () => {
      workerRef.current?.postMessage({ type: 'STOP' });
      workerRef.current?.terminate();
    };
  }, []);

  const handleGameTick = useCallback((tick: number) => {
    // Only do meaningful work every N ticks to avoid thrashing
    if (tick % 10 === 0) { // Every 1 second at 10 ticks/sec
      setLastUpdate(Date.now());
      // Check operation completions, energy regen, etc.
    }
  }, [setLastUpdate]);

  const calculateOfflineProgress = useCallback(() => {
    const timeAway = Date.now() - lastUpdate;
    if (timeAway > 5000) { // More than 5 seconds away
      workerRef.current?.postMessage({
        type: 'CALCULATE_IDLE',
        payload: { lastUpdate, /* ...game state... */ },
      });
    }
  }, [lastUpdate]);

  const applyIdleRewards = useCallback((data: any) => {
    updatePlayer({
      credits: useGameStore.getState().player.credits + data.credits,
      experience: useGameStore.getState().player.experience + data.experience,
    });
  }, [updatePlayer]);
}
```

### Key Patterns and Gotchas

| Pattern | Why | Caveat |
|---------|-----|--------|
| **Dedicated tick worker** | `setTimeout` in main thread is throttled when tab is inactive. Worker runs at full speed. | Worker can't access DOM. All state sync via `postMessage`. |
| **Zustand selectors** | `useGameStore((s) => s.player.credits)` prevents re-render when other state changes. | Don't select the entire store — `useGameStore()` re-renders on EVERY change. |
| **Batch tick updates** | Don't call `set()` on every tick. Accumulate and flush every N ticks. | Lost ticks if tab is backgrounded for long periods. Handle on visibility change. |
| **Vite worker import** | `new URL('./worker.ts', import.meta.url)` lets Vite bundle the worker. | Requires `{ type: 'module' }` for TypeScript workers. |
| **Offline calculation** | Calculate on mount using `Date.now() - lastUpdate`. Cap at 24h. | Existing code already does this correctly in `idleWorker.ts`. |

### Visibility Change Handling

```typescript
useEffect(() => {
  const handleVisibility = () => {
    if (document.hidden) {
      // Tab hidden — worker keeps running but postMessage is delayed
      // Record the exact time for offline calculation on return
      setLastUpdate(Date.now());
    } else {
      // Tab visible — calculate what happened while hidden
      calculateOfflineProgress();
    }
  };

  document.addEventListener('visibilitychange', handleVisibility);
  return () => document.removeEventListener('visibilitychange', handleVisibility);
}, []);
```

---

## 4. Command Registry Patterns in TypeScript

### Recommended Pattern: Typed Handler Map

For a terminal-based game, the command registry needs:
1. **Type-safe handlers** — each command has typed arguments
2. **Autocomplete** — tab completion for command names and arguments
3. **Extensibility** — new commands added without modifying registry core
4. **Help generation** — auto-generated help text

```typescript
// src/lib/commandRegistry.ts

export interface CommandContext {
  term: Terminal; // xterm.js instance for writing output
  store: ReturnType<typeof useGameStore.getState>; // Zustand store snapshot
}

export interface CommandDefinition<Args = string[]> {
  name: string;
  aliases: string[];
  description: string;
  usage: string;
  category: 'system' | 'hacking' | 'operations' | 'navigation' | 'info';
  handler: (args: Args, ctx: CommandContext) => void | Promise<void>;
  autocomplete?: (partial: string, ctx: CommandContext) => string[];
  minArgs?: number;
  maxArgs?: number;
}

export class CommandRegistry {
  private commands = new Map<string, CommandDefinition>();

  register(cmd: CommandDefinition): void {
    this.commands.set(cmd.name.toLowerCase(), cmd);
    cmd.aliases.forEach((alias) => {
      this.commands.set(alias.toLowerCase(), cmd);
    });
  }

  get(name: string): CommandDefinition | undefined {
    return this.commands.get(name.toLowerCase());
  }

  getAll(): CommandDefinition[] {
    // Deduplicate — return only primary names, not aliases
    const seen = new Set<string>();
    const result: CommandDefinition[] = [];
    for (const cmd of this.commands.values()) {
      if (!seen.has(cmd.name)) {
        seen.add(cmd.name);
        result.push(cmd);
      }
    }
    return result;
  }

  getNames(): string[] {
    return [...new Set(this.commands.keys())].sort();
  }

  async execute(input: string, ctx: CommandContext): Promise<void> {
    const parts = input.trim().split(/\s+/);
    const cmdName = parts[0].toLowerCase();
    const args = parts.slice(1);

    const cmd = this.get(cmdName);
    if (!cmd) {
      ctx.term.writeln(`\x1b[31mUnknown command: ${cmdName}\x1b[0m`);
      ctx.term.writeln('Type \x1b[1;36mhelp\x1b[0m for available commands.');
      return;
    }

    if (cmd.minArgs && args.length < cmd.minArgs) {
      ctx.term.writeln(`\x1b[31mUsage: ${cmd.usage}\x1b[0m`);
      return;
    }

    try {
      await cmd.handler(args, ctx);
    } catch (error) {
      ctx.term.writeln(`\x1b[31mError: ${error.message}\x1b[0m`);
    }
  }

  autocomplete(partial: string, ctx: CommandContext): string[] {
    const parts = partial.split(/\s+/);
    if (parts.length <= 1) {
      // Autocomplete command names
      const prefix = parts[0].toLowerCase();
      return this.getNames().filter((name) => name.startsWith(prefix));
    }

    // Autocomplete arguments for a specific command
    const cmd = this.get(parts[0]);
    if (cmd?.autocomplete) {
      return cmd.autocomplete(parts[parts.length - 1], ctx);
    }

    return [];
  }
}

// Singleton instance
export const commandRegistry = new CommandRegistry();
```

### Command Definitions (Phase 1 Examples)

```typescript
// src/commands/system.ts
import { commandRegistry, CommandContext } from '../lib/commandRegistry';
import { Colors } from '../lib/terminalColors';

commandRegistry.register({
  name: 'help',
  aliases: ['h', '?'],
  description: 'Show available commands',
  usage: 'help [category]',
  category: 'system',
  handler: (args, ctx) => {
    const commands = commandRegistry.getAll();

    if (args[0]) {
      // Filter by category
      const filtered = commands.filter((c) => c.category === args[0]);
      if (filtered.length === 0) {
        ctx.term.writeln(`Unknown category: ${args[0]}`);
        return;
      }
      printCommandList(filtered, ctx);
    } else {
      // Group by category
      const categories = [...new Set(commands.map((c) => c.category))];
      for (const cat of categories) {
        ctx.term.writeln(`\n\x1b[1;35m${cat.toUpperCase()}\x1b[0m`);
        printCommandList(commands.filter((c) => c.category === cat), ctx);
      }
    }
  },
});

commandRegistry.register({
  name: 'clear',
  aliases: ['cls'],
  description: 'Clear the terminal',
  usage: 'clear',
  category: 'system',
  handler: (_args, ctx) => {
    ctx.term.clear();
  },
});

commandRegistry.register({
  name: 'status',
  aliases: ['stat'],
  description: 'Show player status',
  usage: 'status',
  category: 'info',
  handler: (_args, ctx) => {
    const { player } = ctx.store;
    ctx.term.writeln(Colors.brightCyan('═══ PLAYER STATUS ═══'));
    ctx.term.writeln(`  Level:      ${Colors.brightGreen(String(player.level))}`);
    ctx.term.writeln(`  Credits:    ${Colors.brightGreen(player.credits.toLocaleString())}`);
    ctx.term.writeln(`  XP:         ${player.experience} / ${player.experienceToNext}`);
    ctx.term.writeln(`  Energy:     ${player.energy} / ${player.maxEnergy}`);
    ctx.term.writeln(`  Reputation: ${player.reputation}`);
    ctx.term.writeln(Colors.brightCyan('═════════════════════'));
  },
});

commandRegistry.register({
  name: 'scan',
  aliases: [],
  description: 'Scan for available targets',
  usage: 'scan',
  category: 'hacking',
  handler: (_args, ctx) => {
    const { targets } = ctx.store;
    const unlocked = targets.filter((t) => t.unlocked);

    ctx.term.writeln(Colors.brightPink('═══ NETWORK SCAN ═══'));
    for (const target of unlocked) {
      const diff = '█'.repeat(target.difficulty) + '░'.repeat(5 - target.difficulty);
      ctx.term.writeln(
        `  ${Colors.cyan(target.name.padEnd(30))} ${Colors.yellow(diff)} Sec:${target.securityLevel}`
      );
    }
    ctx.term.writeln(Colors.brightPink('═════════════════════'));
  },
});

function printCommandList(commands: CommandDefinition[], ctx: CommandContext) {
  for (const cmd of commands) {
    const name = Colors.brightGreen(cmd.name.padEnd(15));
    const aliases = cmd.aliases.length > 0
      ? Colors.dim(`(${cmd.aliases.join(', ')}) `)
      : '';
    ctx.term.writeln(`  ${name}${aliases}${cmd.description}`);
  }
}
```

### Tab Completion Integration with xterm.js

```typescript
// In your XtermTerminal component, extend the onData handler:
let currentInput = '';
let autocompleteIndex = -1;
let lastAutocompleteBase = '';

term.onData((data) => {
  const code = data.charCodeAt(0);

  if (code === 13) {
    // Enter — execute command
    term.write('\r\n');
    autocompleteIndex = -1;
    if (currentInput.trim()) {
      onCommand(currentInput.trim());
    }
    currentInput = '';
    return;
  }

  if (code === 9) {
    // Tab — autocomplete
    const suggestions = commandRegistry.autocomplete(currentInput, ctx);
    if (suggestions.length === 0) return;

    if (currentInput !== lastAutocompleteBase) {
      autocompleteIndex = 0;
      lastAutocompleteBase = currentInput;
    } else {
      autocompleteIndex = (autocompleteIndex + 1) % suggestions.length;
    }

    // Replace current input with suggestion
    const parts = currentInput.split(/\s+/);
    const suggestion = suggestions[autocompleteIndex];

    if (parts.length <= 1) {
      // Replace command name
      currentInput = suggestion;
    } else {
      // Replace last argument
      parts[parts.length - 1] = suggestion;
      currentInput = parts.join(' ');
    }

    // Clear line and rewrite
    term.write('\r\x1b[K'); // Carriage return + clear to end of line
    term.write(`> ${currentInput}`);
    return;
  }

  // ... rest of input handling
});
```

### Why This Pattern Over Alternatives

| Approach | Pros | Cons | Verdict |
|----------|------|------|---------|
| **Switch/case in handler** | Simple | Not extensible, no autocomplete, no help gen | Reject |
| **Class-based commands** | OOP-friendly | Boilerplate, harder to compose | Overkill |
| **Typed handler map (above)** | Extensible, typed, autocomplete, help gen | Requires registry setup | **Recommended** |
| **Commander.js / yargs** | Battle-tested | Node.js focused, overkill for browser game | Reject |

---

## 5. CSS CRT Effects

### Scanline Overlay

The key insight: xterm.js renders to a `<canvas>` element. CSS overlays using `::before`/`::after` pseudo-elements with `pointer-events: none` sit on top of the canvas without blocking terminal interaction.

```css
/* src/components/TerminalContainer.css */

.terminal-wrapper {
  position: relative;
  overflow: hidden;
  border: 1px solid #00ff4130;
  border-radius: 8px;
}

/* CRT Scanlines */
.terminal-wrapper::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 10;
  pointer-events: none;
  background: repeating-linear-gradient(
    0deg,
    rgba(0, 0, 0, 0.15) 0px,
    rgba(0, 0, 0, 0.15) 1px,
    transparent 1px,
    transparent 3px
  );
  background-size: 100% 4px;
}

/* RGB sub-pixel effect (subtle color separation) */
.terminal-wrapper::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 11;
  pointer-events: none;
  background: repeating-linear-gradient(
    90deg,
    rgba(255, 0, 0, 0.03) 0px,
    rgba(0, 255, 0, 0.03) 1px,
    rgba(0, 0, 255, 0.03) 2px,
    transparent 2px,
    transparent 3px
  );
  background-size: 3px 100%;
}

/* Screen curvature (optional — subtle barrel distortion) */
.terminal-wrapper .crt-curve {
  position: absolute;
  inset: 0;
  z-index: 12;
  pointer-events: none;
  border-radius: 8px;
  box-shadow:
    inset 0 0 100px rgba(0, 0, 0, 0.5),
    inset 0 0 30px rgba(0, 255, 65, 0.05);
}

/* Animated scanline (moving horizontal bar) */
@keyframes scanline {
  0% { transform: translateY(-100%); }
  100% { transform: translateY(100vh); }
}

.terminal-wrapper .scanline-bar {
  position: absolute;
  left: 0;
  right: 0;
  height: 4px;
  z-index: 13;
  pointer-events: none;
  background: linear-gradient(
    180deg,
    transparent 0%,
    rgba(0, 255, 65, 0.08) 50%,
    transparent 100%
  );
  animation: scanline 8s linear infinite;
}

/* Screen flicker */
@keyframes flicker {
  0% { opacity: 0.97; }
  5% { opacity: 0.95; }
  10% { opacity: 0.9; }
  15% { opacity: 0.95; }
  20% { opacity: 0.99; }
  50% { opacity: 0.95; }
  80% { opacity: 0.9; }
  90% { opacity: 0.98; }
  100% { opacity: 0.97; }
}

.terminal-wrapper .crt-flicker {
  position: absolute;
  inset: 0;
  z-index: 9;
  pointer-events: none;
  animation: flicker 0.15s infinite;
  background: rgba(0, 255, 65, 0.01);
}
```

### Neon Text Glow (CSS text-shadow stacking)

For HUD elements, titles, and non-terminal text:

```css
/* Neon green glow */
.neon-green {
  color: #00ff41;
  text-shadow:
    0 0 7px #00ff41,
    0 0 10px #00ff41,
    0 0 21px #00ff41,
    0 0 42px #00ff4180,
    0 0 82px #00ff4140;
}

/* Neon pink glow */
.neon-pink {
  color: #ff0080;
  text-shadow:
    0 0 7px #ff0080,
    0 0 10px #ff0080,
    0 0 21px #ff0080,
    0 0 42px #ff008080,
    0 0 82px #ff008040;
}

/* Neon cyan glow */
.neon-cyan {
  color: #00d4ff;
  text-shadow:
    0 0 7px #00d4ff,
    0 0 10px #00d4ff,
    0 0 21px #00d4ff,
    0 0 42px #00d4ff80,
    0 0 82px #00d4ff40;
}

/* Pulsing glow animation */
@keyframes pulse-glow {
  0%, 100% {
    text-shadow:
      0 0 7px #00ff41,
      0 0 10px #00ff41,
      0 0 21px #00ff41,
      0 0 42px #00ff4180;
  }
  50% {
    text-shadow:
      0 0 4px #00ff41,
      0 0 7px #00ff41,
      0 0 15px #00ff41,
      0 0 30px #00ff4160;
  }
}

.neon-pulse {
  animation: pulse-glow 2s ease-in-out infinite;
}
```

### Neon Glow for Borders (HUD bar)

```css
.cyber-border-glow {
  border: 1px solid #00ff4140;
  box-shadow:
    0 0 5px #00ff4120,
    0 0 10px #00ff4110,
    inset 0 0 5px #00ff4110;
}

.cyber-border-glow-pink {
  border: 1px solid #ff008040;
  box-shadow:
    0 0 5px #ff008020,
    0 0 10px #ff008010,
    inset 0 0 5px #ff008010;
}
```

### Performance Considerations

| Effect | Performance Impact | Mitigation |
|--------|-------------------|------------|
| **Scanline overlay (CSS)** | Negligible — GPU-composited | Use `will-change: transform` if animated |
| **RGB sub-pixel overlay** | Negligible | Same as above |
| **Animated scanline bar** | Low — single animated element | Use `transform` (not `top`/`left`) for GPU acceleration |
| **Screen flicker animation** | Low — opacity-only animation | Opacity changes are GPU-composited |
| **text-shadow stacking (5+ layers)** | Medium — CPU-rendered per text element | Limit to HUD elements, not terminal text |
| **box-shadow glow** | Low-Medium | Use sparingly; prefer border-color for static elements |
| **allowTransparency: true** | Low — forces canvas compositing | Required for overlays; accept the minor cost |

**Critical:** The CRT overlay effects MUST use `pointer-events: none` or they will block all terminal input. The z-index layering should be:
1. xterm.js canvas (z-index: 0, default)
2. CRT flicker overlay (z-index: 9)
3. Scanline overlay (z-index: 10)
4. RGB sub-pixel overlay (z-index: 11)
5. Screen curvature (z-index: 12)
6. Animated scanline bar (z-index: 13)

---

## 6. Zustand Store — Single Source of Truth

### Current State

The existing `gameStore.ts` is a massive monolithic store (~1700 lines) with `// @ts-nocheck` at the top. For Phase 1, we need to:

1. **Keep the existing store** — don't refactor it yet
2. **Add terminal-specific state** as a slice
3. **Use selectors properly** to avoid re-render storms

### Terminal State Slice

```typescript
// Add to gameStore.ts (or create a separate terminalStore.ts)

interface TerminalState {
  // Command history for up/down arrow navigation
  commandHistory: string[];
  historyIndex: number;

  // Current input buffer (for tab completion state)
  currentInput: string;

  // Terminal output lines (if we want to persist them in store)
  // Note: xterm.js manages its own buffer. Only store what React needs.
  bootSequenceComplete: boolean;

  // Actions
  addToHistory: (command: string) => void;
  navigateHistory: (direction: 'up' | 'down') => string;
  setCurrentInput: (input: string) => void;
  setBootSequenceComplete: () => void;
}

// In the store creator:
terminal: {
  commandHistory: [],
  historyIndex: -1,
  currentInput: '',
  bootSequenceComplete: false,
} as TerminalState,

addToHistory: (command) => set((state) => ({
  terminal: {
    ...state.terminal,
    commandHistory: [...state.terminal.commandHistory, command].slice(-50), // Keep last 50
    historyIndex: -1,
  },
})),

navigateHistory: (direction) => {
  const state = get();
  const { commandHistory, historyIndex } = state.terminal;

  if (commandHistory.length === 0) return '';

  let newIndex: number;
  if (direction === 'up') {
    newIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
  } else {
    newIndex = historyIndex + 1 >= commandHistory.length ? -1 : historyIndex + 1;
  }

  set({ terminal: { ...state.terminal, historyIndex: newIndex } });
  return newIndex === -1 ? '' : commandHistory[newIndex];
},
```

### Selector Best Practices for Game Loop

The game loop will update the store frequently. Use **shallow selectors** to prevent unnecessary re-renders:

```typescript
// BAD — re-renders on ANY store change
const store = useGameStore();

// GOOD — only re-renders when credits change
const credits = useGameStore((s) => s.player.credits);

// GOOD — only re-renders when either changes
const resources = useGameStore((s) => ({
  credits: s.player.credits,
  energy: s.player.energy,
}));
// Note: this creates a new object each time. For multiple values,
// consider zustand's shallow comparison or use multiple single-value selectors.

// BEST for multiple values — use multiple hooks
const credits = useGameStore((s) => s.player.credits);
const energy = useGameStore((s) => s.player.energy);
const level = useGameStore((s) => s.player.level);
```

---

## 7. Complete Installation

```bash
# Core xterm.js packages
npm install @xterm/xterm @xterm/addon-fit @xterm/addon-webgl @xterm/addon-canvas

# Optional: self-hosted fonts (recommended for offline reliability)
npm install @fontsource/jetbrains-mono

# Dev types (usually included in @xterm packages)
# No additional @types needed — xterm.js ships its own TypeScript declarations
```

### Vite Configuration

No additional Vite config needed. Vite handles Web Workers automatically with:
```typescript
new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' })
```

Ensure `tsconfig.json` has `"lib": ["ES2020", "DOM", "DOM.Iterable"]` (already present).

---

## 8. Architecture for Phase 1

```
src/
├── components/
│   ├── TerminalContainer.tsx    # Wrapper with CRT effects + HUD bar
│   ├── XtermTerminal.tsx        # xterm.js React integration
│   └── HudBar.tsx               # Resource counters at top
├── hooks/
│   ├── useGameLoop.ts           # Worker lifecycle + tick handling
│   └── useTerminalInput.ts      # Command input + history + autocomplete
├── lib/
│   ├── commandRegistry.ts       # Typed command registry
│   └── terminalColors.ts        # ANSI color helpers
├── commands/
│   ├── system.ts                # help, clear, status
│   ├── hacking.ts               # scan, exploit, breach
│   └── operations.ts            # start, list, cancel
├── workers/
│   ├── gameLoopWorker.ts        # Tick timer (dedicated worker)
│   └── idleWorker.ts            # Idle calculations (existing, keep)
├── store/
│   └── gameStore.ts             # Existing store + terminal slice
└── styles/
    └── crt-effects.css          # Scanlines, flicker, neon glow
```

### Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                        Main Thread                          │
│                                                             │
│  ┌──────────┐    ┌───────────────┐    ┌──────────────────┐  │
│  │ HudBar   │◄───│ Zustand Store │◄───│ XtermTerminal    │  │
│  │(selectors)│   │ (single src)  │    │ (onData handler) │  │
│  └──────────┘    └───────▲───────┘    └────────┬─────────┘  │
│                          │                     │            │
│                          │                     ▼            │
│                          │            ┌──────────────────┐  │
│                          │            │ CommandRegistry  │  │
│                          │            │ (execute cmd)    │  │
│                          │            └────────┬─────────┘  │
│                          │                     │            │
└──────────────────────────┼─────────────────────┼────────────┘
                           │                     │
                    postMessage            postMessage
                           │                     │
┌──────────────────────────┼─────────────────────┼────────────┐
│                     Web Workers               │            │
│                           │                     │            │
│  ┌──────────────────┐    │            ┌────────▼─────────┐  │
│  │ gameLoopWorker   │    │            │ idleWorker.ts    │  │
│  │ (tick timer)     │    │            │ (idle calcs)     │  │
│  │                  │    │            │                  │  │
│  │ postMessage ─────┼────┘            │ postMessage ─────┼──┘
│  └──────────────────┘                 └──────────────────┘
└─────────────────────────────────────────────────────────────┘
```

---

## 9. Pitfalls Summary

| # | Pitfall | Severity | Prevention |
|---|---------|----------|------------|
| 1 | **React 18 Strict Mode double-mount** creates duplicate terminals | HIGH | Proper `dispose()` in useEffect cleanup. Guard with refs. |
| 2 | **FitAddon throws before terminal is open** | HIGH | Call `fit()` only after `term.open()`. Use `requestAnimationFrame` in ResizeObserver. |
| 3 | **onKey vs onData confusion** breaks IME/history | HIGH | Use `onData` for text input. Parse escape sequences for special keys. |
| 4 | **allowTransparency not set** makes CSS overlays invisible | MEDIUM | Set in Terminal options BEFORE `term.open()`. Cannot change after. |
| 5 | **WebGL context loss** on tab switch/sleep | MEDIUM | Handle `onContextLoss` → dispose WebGL, load CanvasAddon. |
| 6 | **Zustand full-store selector** causes render storms | HIGH | Always use selectors: `useGameStore((s) => s.player.credits)`. |
| 7 | **Worker postMessage serialization** drops non-cloneable data | MEDIUM | Only send JSON-serializable data. No functions, Dates, or class instances. |
| 8 | **Tab throttling** slows setTimeout in main thread | MEDIUM | Use dedicated Web Worker for game loop timing. |
| 9 | **CRT overlay blocks input** | HIGH | All overlay elements MUST have `pointer-events: none`. |
| 10 | **Old `xterm` package** incompatible with `@xterm/` addons | MEDIUM | Use `@xterm/xterm` exclusively. Remove old `xterm` from package.json. |
| 11 | **Theme object mutation** doesn't update terminal | LOW | Create new object: `term.options.theme = { ...theme }`. |
| 12 | **Blob URL worker** (current approach) causes CSP issues | MEDIUM | Use Vite's `new URL('./worker.ts', import.meta.url)` pattern instead. |

---

## 10. Sources

| Source | Confidence | URL |
|--------|------------|-----|
| xterm.js official docs | HIGH | https://xtermjs.org/docs/ |
| xterm.js API reference (ITerminalOptions, ITheme) | HIGH | https://xtermjs.org/docs/api/terminal/ |
| @xterm/xterm npm package (v6.0.0) | HIGH | https://www.npmjs.com/package/@xterm/xterm |
| @xterm/addon-fit npm package (v0.11.0) | HIGH | https://www.npmjs.com/package/@xterm/addon-fit |
| @xterm/addon-webgl npm package (v0.19.0) | HIGH | https://www.npmjs.com/package/@xterm/addon-webgl |
| Zustand official docs | HIGH | https://zustand.docs.pmnd.rs/ |
| Zustand persist middleware | HIGH | https://github.com/pmndrs/zustand/blob/main/docs/reference/integrations/persisting-store-data.md |
| React 18 Strict Mode double-mount behavior | HIGH | https://react.dev/reference/react/StrictMode |
| React 18 Strict Mode + Zustand discussion | HIGH | https://github.com/pmndrs/zustand/discussions/1683 |
| Gaffer on Games — Fix Your Timestep | HIGH | https://www.gafferongames.com/post/fix_your_timestep/ |
| Web Workers MDN docs | HIGH | https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers |
| CSS-Tricks — Neon Text with CSS | HIGH | https://css-tricks.com/how-to-create-neon-text-with-css/ |
| CRT CSS effects (Alec Lownes) | MEDIUM | https://aleclownes.com/2017/02/01/crt-display.html |
| CRT scanlines gist | MEDIUM | https://gist.github.com/lmas/6a1bd445bc7a7145245085f4a740d3f5 |
| refactoring.guru — Command Pattern TypeScript | HIGH | https://refactoring.guru/design-patterns/command/typescript/example |
| StackOverflow — xterm-addon-fit React error | MEDIUM | https://stackoverflow.com/questions/74672618/ |
| Chinese article — onData vs onKey cursor issues | MEDIUM | https://segmentfault.com/a/1190000041644571 |
