import { commandRegistry, CommandContext, CommandCategory } from '../lib/commandRegistry';
import { Colors } from '../lib/terminalColors';
import { useGameStore } from '../store/gameStore';

/**
 * AI auto-play commands: ai on, ai off, ai (status)
 * Side-effect: importing this file registers all commands.
 */

// ── ai ────────────────────────────────────────────────────────────────
commandRegistry.register({
  name: 'ai',
  aliases: [],
  description: 'Toggle AI auto-play or check status',
  usage: 'ai [on|off]',
  category: 'system' as CommandCategory,
  handler: (args: string[], ctx: CommandContext) => {
    const state = useGameStore.getState();
    const subcommand = args[0]?.toLowerCase();

    if (subcommand === 'on') {
      if (!state.aiActive) {
        state.toggleAI();
        ctx.term.writeln(Colors.cyan(`\r\n[AI] AI Auto-Play activated`));
      } else {
        ctx.term.writeln(Colors.dim(`\r\n[AI] AI Auto-Play is already active`));
      }
    } else if (subcommand === 'off') {
      if (state.aiActive) {
        state.toggleAI();
        ctx.term.writeln(Colors.dim(`\r\n[AI] AI Auto-Play deactivated`));
      } else {
        ctx.term.writeln(Colors.dim(`\r\n[AI] AI Auto-Play is already inactive`));
      }
    } else {
      // No args — print current status
      const status = state.aiActive ? 'Active' : 'Inactive';
      const color = state.aiActive ? Colors.green : Colors.dim;
      ctx.term.writeln(`\r\n${Colors.cyan('[AI]')} AI Auto-Play: ${color(status)}`);
    }
  },
});
