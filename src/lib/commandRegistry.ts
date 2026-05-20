import type { Terminal } from '@xterm/xterm';
import type { useGameStore } from '../store/gameStore';

/** Command category types */
export type CommandCategory = 'system' | 'hacking' | 'operations' | 'navigation' | 'info';

/** Context passed to command handlers */
export interface CommandContext {
  term: Terminal;
  store: ReturnType<typeof useGameStore.getState>;
}

/** Handler function signature for commands */
export type CommandHandler = (args: string[], ctx: CommandContext) => void | Promise<void>;

/** Command definition interface */
export interface CommandDefinition {
  name: string;
  aliases: string[];
  description: string;
  usage: string;
  category: CommandCategory;
  handler: CommandHandler;
  autocomplete?: (args: string[], ctx: CommandContext) => string[];
  minArgs?: number;
  maxArgs?: number;
}

/** Typed command registry with handler map */
export class CommandRegistry {
  private commands: Map<string, CommandDefinition> = new Map();

  /** Register a new command */
  register(def: CommandDefinition): void {
    // Register under the primary name
    this.commands.set(def.name.toLowerCase(), def);
    // Register under each alias
    for (const alias of def.aliases) {
      this.commands.set(alias.toLowerCase(), def);
    }
  }

  /** Get a command definition by name or alias */
  get(name: string): CommandDefinition | undefined {
    return this.commands.get(name.toLowerCase());
  }

  /** Get all registered commands */
  getAll(): CommandDefinition[] {
    const seen = new Set<string>();
    const unique: CommandDefinition[] = [];
    for (const def of this.commands.values()) {
      if (!seen.has(def.name)) {
        seen.add(def.name);
        unique.push(def);
      }
    }
    return unique;
  }

  /** Get all command names (primary names only) */
  getNames(): string[] {
    const seen = new Set<string>();
    const names: string[] = [];
    for (const def of this.commands.values()) {
      if (!seen.has(def.name)) {
        seen.add(def.name);
        names.push(def.name);
      }
    }
    return names;
  }

  /** Execute a command by parsing input string */
  async execute(input: string, ctx: CommandContext): Promise<void> {
    const trimmed = input.trim();
    if (!trimmed) return;

    const parts = trimmed.split(/\s+/);
    const commandName = parts[0].toLowerCase();
    const args = parts.slice(1);

    const command = this.get(commandName);
    if (!command) {
      ctx.term.writeln(`\x1b[31mUnknown command: ${commandName}. Type "help" for available commands.\x1b[0m`);
      return;
    }

    // Validate argument count
    if (command.minArgs !== undefined && args.length < command.minArgs) {
      ctx.term.writeln(`\x1b[31mError: "${command.name}" requires at least ${command.minArgs} argument(s).\x1b[0m`);
      ctx.term.writeln(`\x1b[33mUsage: ${command.usage}\x1b[0m`);
      return;
    }

    if (command.maxArgs !== undefined && args.length > command.maxArgs) {
      ctx.term.writeln(`\x1b[31mError: "${command.name}" accepts at most ${command.maxArgs} argument(s).\x1b[0m`);
      ctx.term.writeln(`\x1b[33mUsage: ${command.usage}\x1b[0m`);
      return;
    }

    try {
      await command.handler(args, ctx);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error occurred';
      ctx.term.writeln(`\x1b[31mError executing "${command.name}": ${message}\x1b[0m`);
    }
  }

  /** Autocomplete command names based on partial input */
  autocomplete(partial: string): string[] {
    const lower = partial.toLowerCase();
    const seen = new Set<string>();
    const matches: string[] = [];
    for (const def of this.commands.values()) {
      if (!seen.has(def.name) && def.name.toLowerCase().startsWith(lower)) {
        seen.add(def.name);
        matches.push(def.name);
      }
    }
    return matches.sort();
  }
}

/** Singleton instance of the command registry */
export const commandRegistry = new CommandRegistry();
