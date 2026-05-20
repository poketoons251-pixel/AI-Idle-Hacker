import React, { useCallback, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { XtermTerminal } from './XtermTerminal';
import { commandRegistry, CommandContext } from '../lib/commandRegistry';
import { useGameStore } from '../store/gameStore';
import '../styles/crt-effects.css';

// Side-effect import: registers system commands
import '../commands/system';

interface TerminalContainerProps {
  onTerminalReady?: (term: Terminal) => void;
}

export const TerminalContainer: React.FC<TerminalContainerProps> = ({ onTerminalReady }) => {
  const terminalRef = useRef<Terminal | null>(null);

  const handleTerminalReady = useCallback((term: Terminal) => {
    terminalRef.current = term;
    onTerminalReady?.(term);
  }, [onTerminalReady]);

  const handleCommand = useCallback((input: string) => {
    const term = terminalRef.current;
    if (!term) return;

    // Write the command echo
    term.writeln('');

    // Execute via registry
    const ctx: CommandContext = {
      term,
      store: useGameStore.getState(),
    };
    commandRegistry.execute(input, ctx).then(() => {
      // After command completes, write new prompt
      term.write('\r\n\x1b[1;32m$\x1b[0m ');
    });
  }, []);

  return (
    <div className="h-[600px]">
      <div className="terminal-wrapper">
        <XtermTerminal
          onCommand={handleCommand}
          onTerminalReady={handleTerminalReady}
          className="w-full h-full"
        />
        <div className="scanline-bar" />
        <div className="crt-flicker" />
      </div>
    </div>
  );
};
