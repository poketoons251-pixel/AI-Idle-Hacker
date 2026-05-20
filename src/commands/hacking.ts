import { commandRegistry, CommandContext, CommandCategory } from '../lib/commandRegistry';
import { Colors } from '../lib/terminalColors';
import type { Target, Operation } from '../store/gameStore';

/**
 * Hacking commands: hack, exploit, breach
 * Side-effect: importing this file registers the hack command.
 */

commandRegistry.register({
  name: 'hack',
  aliases: ['exploit', 'breach'],
  description: 'Initiate hacking operation against a target',
  usage: 'hack <target-name-or-id>',
  category: 'hacking' as CommandCategory,
  minArgs: 1,
  handler: async (args: string[], ctx: CommandContext) => {
    const { targets, operations, startOperation, player } = ctx.store;
    const searchTerm = args.join(' ').toLowerCase();

    // Find target by name or id
    const target = targets.find(t =>
      t.id.toLowerCase() === searchTerm ||
      t.name.toLowerCase().includes(searchTerm)
    );

    if (!target) {
      ctx.term.writeln(Colors.red(`Target "${searchTerm}" not found. Use "scan" to see available targets.`));
      return;
    }

    if (!target.unlocked) {
      ctx.term.writeln(Colors.yellow(`Target "${target.name}" is locked. Complete easier targets first.`));
      return;
    }

    if (player.energy < target.difficulty * 10) {
      ctx.term.writeln(Colors.red(`Insufficient energy. Need ${target.difficulty * 10}, have ${player.energy}.`));
      return;
    }

    // Start the operation
    const opType: Operation['type'] = 'data_breach';
    startOperation(target.id, opType);

    // Find the newly created operation
    const freshState = ctx.store;
    const op = freshState.operations.find(o => o.targetId === target.id && o.status === 'active');
    if (!op) {
      ctx.term.writeln(Colors.red('Failed to start operation. Try again.'));
      return;
    }

    await simulateBreach(ctx, target, op);
  },
});

async function simulateBreach(ctx: CommandContext, target: Target, operation: Operation) {
  const stages = [
    { msg: `Scanning ${target.name}...`, delay: 800, color: 'cyan' as const },
    { msg: 'Bypassing firewall...', delay: 1200, color: 'yellow' as const },
    { msg: 'Exploiting vulnerabilities...', delay: 1500, color: 'yellow' as const },
    { msg: 'Accessing restricted data...', delay: 1000, color: 'green' as const },
    { msg: 'Extracting data packets...', delay: 800, color: 'green' as const },
    { msg: 'Cleaning traces...', delay: 600, color: 'brightGreen' as const },
  ];

  ctx.term.writeln('');
  ctx.term.writeln(Colors.bold(Colors.brightPink('╔══════════════════════════════════════╗')));
  ctx.term.writeln(Colors.bold(Colors.brightPink('║     INITIATING BREACH SEQUENCE       ║')));
  ctx.term.writeln(Colors.bold(Colors.brightPink('╚══════════════════════════════════════╝')));
  ctx.term.writeln('');

  for (const stage of stages) {
    await delay(stage.delay);
    const colorFn = Colors[stage.color] || Colors.green;
    ctx.term.writeln(`  [${stage.delay}ms] ${colorFn(stage.msg)}`);
  }

  // Complete the operation
  ctx.store.completeOperation(operation.id);

  ctx.term.writeln('');
  ctx.term.writeln(Colors.bold(Colors.brightGreen('╔══════════════════════════════════════╗')));
  ctx.term.writeln(Colors.bold(Colors.brightGreen('║       BREACH SUCCESSFUL              ║')));
  ctx.term.writeln(Colors.bold(Colors.brightGreen('╚══════════════════════════════════════╝')));
  ctx.term.writeln('');
  ctx.term.writeln(Colors.yellow(`  [EARNED] +${target.rewards.credits} credits`));
  ctx.term.writeln(Colors.green(`  [EARNED] +${target.rewards.experience} XP`));
  ctx.term.writeln(Colors.pink(`  [EARNED] +${target.rewards.reputation} reputation`));
  ctx.term.writeln('');

  // Unlock next target if applicable
  const allTargets = ctx.store.targets;
  const currentIndex = allTargets.findIndex(t => t.id === target.id);
  if (currentIndex >= 0 && currentIndex < allTargets.length - 1) {
    const nextTarget = allTargets[currentIndex + 1];
    if (!nextTarget.unlocked) {
      ctx.store.unlockTarget(nextTarget.id);
      ctx.term.writeln(Colors.bold(Colors.brightCyan(`  [UNLOCKED] New target: ${nextTarget.name}`)));
      ctx.term.writeln('');
    }
  }
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
