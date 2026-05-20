import { commandRegistry, CommandContext, CommandCategory } from '../lib/commandRegistry';
import { Colors } from '../lib/terminalColors';

/**
 * Economy commands: upgrades, upgrade
 * Side-effect: importing this file registers all commands.
 */

// ── upgrades ──────────────────────────────────────────────────────────
commandRegistry.register({
  name: 'upgrades',
  aliases: ['shop', 'store'],
  description: 'List all available upgrades',
  usage: 'upgrades',
  category: 'info' as CommandCategory,
  handler: (_args: string[], ctx: CommandContext) => {
    const { equipment, player } = ctx.store;

    ctx.term.writeln('');
    ctx.term.writeln(Colors.bold(Colors.brightPink('╔══════════════════════════════════════════╗')));
    ctx.term.writeln(Colors.bold(Colors.brightPink('║          UPGRADE SHOP                    ║')));
    ctx.term.writeln(Colors.bold(Colors.brightPink('╚══════════════════════════════════════════╝')));
    ctx.term.writeln('');

    // Group by type
    const hardware = equipment.filter(e => e.type === 'hardware');
    const software = equipment.filter(e => e.type === 'software');

    ctx.term.writeln(Colors.bold(Colors.cyan('── HARDWARE ──')));
    for (const eq of hardware) {
      const canAfford = player.credits >= eq.upgradeCost;
      const costColor = canAfford ? Colors.green : Colors.red;
      ctx.term.writeln(`  ${Colors.bold(eq.name)} (Lv.${eq.level}) | Bonus: +${eq.bonus}/sec | Cost: ${costColor(eq.upgradeCost.toLocaleString())} credits`);
    }

    ctx.term.writeln('');
    ctx.term.writeln(Colors.bold(Colors.brightMagenta('── SOFTWARE ──')));
    for (const eq of software) {
      const canAfford = player.credits >= eq.upgradeCost;
      const costColor = canAfford ? Colors.green : Colors.red;
      ctx.term.writeln(`  ${Colors.bold(eq.name)} (Lv.${eq.level}) | Bonus: +${eq.bonus}/sec | Cost: ${costColor(eq.upgradeCost.toLocaleString())} credits`);
    }

    ctx.term.writeln('');
    ctx.term.writeln(Colors.dim('  Use "upgrade <name>" to purchase. e.g., "upgrade Server Rack"'));
    ctx.term.writeln('');
  },
});

// ── upgrade ───────────────────────────────────────────────────────────
commandRegistry.register({
  name: 'upgrade',
  aliases: ['buy', 'purchase'],
  description: 'Purchase an equipment upgrade',
  usage: 'upgrade <equipment-name>',
  category: 'hacking' as CommandCategory,
  minArgs: 1,
  handler: (args: string[], ctx: CommandContext) => {
    const { equipment, player, upgradeEquipment } = ctx.store;
    const searchTerm = args.join(' ').toLowerCase();

    const eq = equipment.find(e => e.name.toLowerCase().includes(searchTerm));
    if (!eq) {
      ctx.term.writeln(Colors.red(`Equipment "${searchTerm}" not found. Use "upgrades" to see available items.`));
      return;
    }

    if (player.credits < eq.upgradeCost) {
      ctx.term.writeln(Colors.red(`Insufficient credits. ${eq.name} costs ${eq.upgradeCost.toLocaleString()}, you have ${player.credits.toLocaleString()}.`));
      return;
    }

    upgradeEquipment(eq.id);
    ctx.term.writeln(Colors.bold(Colors.brightGreen(`  Upgraded ${eq.name} to level ${eq.level}!`)));
    ctx.term.writeln(Colors.yellow(`  [EARNED] +${eq.bonus} credits/sec generation rate`));
    ctx.term.writeln('');
  },
});
