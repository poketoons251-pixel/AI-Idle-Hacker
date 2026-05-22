import { commandRegistry, CommandContext, CommandCategory } from '../lib/commandRegistry';
import { Colors } from '../lib/terminalColors';

/**
 * System commands: help, clear, status, scan
 * Side-effect: importing this file registers all commands.
 */

// ── help ──────────────────────────────────────────────────────────────
commandRegistry.register({
  name: 'help',
  aliases: ['h', '?'],
  description: 'List all available commands',
  usage: 'help [category]',
  category: 'system' as CommandCategory,
  handler: (args: string[], ctx: CommandContext) => {
    const allCommands = commandRegistry.getAll();

    // Group by category
    const grouped: Record<string, typeof allCommands> = {};
    for (const cmd of allCommands) {
      if (!grouped[cmd.category]) {
        grouped[cmd.category] = [];
      }
      grouped[cmd.category].push(cmd);
    }

    // Filter by category if specified
    const filterCategory = args[0]?.toLowerCase();
    const categories = filterCategory
      ? { [filterCategory]: grouped[filterCategory] || [] }
      : grouped;

    ctx.term.writeln('');
    ctx.term.writeln(Colors.bold(Colors.brightPink('╔══════════════════════════════════════════╗')));
    ctx.term.writeln(Colors.bold(Colors.brightPink('║          AVAILABLE COMMANDS              ║')));
    ctx.term.writeln(Colors.bold(Colors.brightPink('╚══════════════════════════════════════════╝')));
    ctx.term.writeln('');

    for (const [category, commands] of Object.entries(categories)) {
      if (!commands || commands.length === 0) continue;
      ctx.term.writeln(Colors.bold(Colors.brightPink(`── ${category.toUpperCase()} ──`)));
      for (const cmd of commands) {
        const aliasStr = cmd.aliases.length > 0 ? ` (${cmd.aliases.join(', ')})` : '';
        const paddedName = cmd.name.padEnd(12);
        ctx.term.writeln(`  ${Colors.cyan(paddedName)} ${Colors.dim('-')} ${cmd.description}${Colors.dim(aliasStr)}`);
      }
      ctx.term.writeln('');
    }
  },
});

// ── clear ─────────────────────────────────────────────────────────────
commandRegistry.register({
  name: 'clear',
  aliases: ['cls'],
  description: 'Clear the terminal screen',
  usage: 'clear',
  category: 'system' as CommandCategory,
  handler: (_args: string[], ctx: CommandContext) => {
    ctx.term.clear();
  },
});

// ── status ────────────────────────────────────────────────────────────
commandRegistry.register({
  name: 'status',
  aliases: ['stat'],
  description: 'Display player status and resources',
  usage: 'status',
  category: 'info' as CommandCategory,
  handler: (_args: string[], ctx: CommandContext) => {
    const { player } = ctx.store;

    ctx.term.writeln('');
    ctx.term.writeln(Colors.cyan('┌────────────────────────────────────────┐'));
    ctx.term.writeln(Colors.cyan('│') + Colors.bold(Colors.brightCyan('          PLAYER STATUS'.padEnd(38))) + Colors.cyan('│'));
    ctx.term.writeln(Colors.cyan('├────────────────────────────────────────┤'));
    ctx.term.writeln(Colors.cyan('│') + `  ${Colors.bold('Level:')}        ${Colors.brightGreen(String(player.level).padStart(24))}  ` + Colors.cyan('│'));
    ctx.term.writeln(Colors.cyan('│') + `  ${Colors.bold('Credits:')}      ${Colors.yellow(player.credits.toLocaleString().padStart(24))}  ` + Colors.cyan('│'));
    ctx.term.writeln(Colors.cyan('│') + `  ${Colors.bold('XP:')}           ${Colors.green(`${player.experience}/${player.experienceToNext}`.padStart(24))}  ` + Colors.cyan('│'));
    ctx.term.writeln(Colors.cyan('│') + `  ${Colors.bold('Energy:')}       ${Colors.brightCyan(`${player.energy}/${player.maxEnergy}`.padStart(24))}  ` + Colors.cyan('│'));
    ctx.term.writeln(Colors.cyan('│') + `  ${Colors.bold('Reputation:')}   ${Colors.pink(String(player.reputation).padStart(24))}  ` + Colors.cyan('│'));
    ctx.term.writeln(Colors.cyan('└────────────────────────────────────────┘'));
    ctx.term.writeln('');
  },
});

// ── scan ──────────────────────────────────────────────────────────────
commandRegistry.register({
  name: 'scan',
  aliases: [],
  description: 'Scan for available targets',
  usage: 'scan',
  category: 'info' as CommandCategory,
  handler: (_args: string[], ctx: CommandContext) => {
    // Trigger scan-line animation on terminal wrapper
    const termEl = ctx.term.element as HTMLElement;
    const wrapper = termEl?.closest('.terminal-wrapper');
    if (wrapper) {
      let scanLine = wrapper.querySelector('.scan-line') as HTMLElement;
      if (!scanLine) {
        scanLine = document.createElement('div');
        scanLine.className = 'scan-line';
        wrapper.appendChild(scanLine);
      }
      scanLine.classList.remove('scanning');
      // Force reflow to restart CSS animation
      void scanLine.offsetWidth;
      scanLine.classList.add('scanning');
      setTimeout(() => scanLine.classList.remove('scanning'), 1600);
    }

    const { targets } = ctx.store;
    const unlocked = targets.filter((t) => t.unlocked);

    ctx.term.writeln('');
    ctx.term.writeln(Colors.bold(Colors.brightPink('── SCAN RESULTS ──')));
    ctx.term.writeln('');

    if (unlocked.length === 0) {
      ctx.term.writeln(Colors.dim('  No targets found. Complete operations to unlock more.'));
      ctx.term.writeln('');
      return;
    }

    const maxDifficulty = 5;
    for (const target of unlocked) {
      const filled = '█'.repeat(target.difficulty);
      const empty = '░'.repeat(maxDifficulty - target.difficulty);
      const bar = Colors.green(filled) + Colors.dim(empty);

      const secLevel = target.securityLevel <= 2
        ? Colors.green('LOW')
        : target.securityLevel <= 4
          ? Colors.yellow('MEDIUM')
          : Colors.red('HIGH');

      ctx.term.writeln(`  ${Colors.bold(Colors.cyan(target.name))}`);
      ctx.term.writeln(`    Difficulty: ${bar}  Security: ${secLevel}`);
      ctx.term.writeln(`    Reward: ${Colors.yellow(`${target.rewards.credits} credits`)} | ${Colors.green(`${target.rewards.experience} XP`)}`);
      ctx.term.writeln('');
    }
  },
});
