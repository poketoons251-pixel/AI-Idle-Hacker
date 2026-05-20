import React, { useEffect, useRef, useCallback } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebglAddon } from '@xterm/addon-webgl';
import { CanvasAddon } from '@xterm/addon-canvas';
import type { ITerminalOptions, ITheme } from '@xterm/xterm';

interface XtermTerminalProps {
  onCommand: (command: string) => void;
  className?: string;
}

const cyberpunkTheme: ITheme = {
  background: '#0a0a0a',
  foreground: '#00ff41',
  cursor: '#00ff41',
  cursorAccent: '#0a0a0a',
  selectionBackground: '#00d4ff40',
  selectionForeground: '#ffffff',
  black: '#1a1a1a',
  red: '#ff0040',
  green: '#00ff41',
  yellow: '#ffcc00',
  blue: '#0066ff',
  magenta: '#ff0080',
  cyan: '#00d4ff',
  white: '#e0e0e0',
  brightBlack: '#404040',
  brightRed: '#ff4060',
  brightGreen: '#00ff90',
  brightYellow: '#ffe040',
  brightBlue: '#4090ff',
  brightMagenta: '#ff40a0',
  brightCyan: '#40e0ff',
  brightWhite: '#ffffff',
};

const terminalOptions: Partial<ITerminalOptions> = {
  cursorBlink: true,
  cursorStyle: 'block',
  fontFamily: "'JetBrains Mono', 'Consolas', 'Monaco', monospace",
  fontSize: 14,
  lineHeight: 1.2,
  allowTransparency: true,
  convertEol: true,
  scrollback: 500,
  theme: cyberpunkTheme,
};

export const XtermTerminal: React.FC<XtermTerminalProps> = ({
  onCommand,
  className,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const term = new Terminal(terminalOptions);

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    // WebGL renderer with Canvas fallback
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

    // Boot message
    term.writeln('\x1b[1;32mAI Idle Hacker Terminal v2.1.0\x1b[0m');
    term.writeln('\x1b[1;36mType "help" for available commands\x1b[0m');
    term.write('\x1b[1;32m$\x1b[0m ');

    // Input handling using onData (not onKey)
    let currentInput = '';
    term.onData((data) => {
      const code = data.charCodeAt(0);

      if (code === 13) {
        // Enter
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
        // Escape — arrow key history handled in Plan 03
        return;
      }

      // Regular character
      currentInput += data;
      term.write(data);
    });

    terminalRef.current = term;
    fitAddonRef.current = fitAddon;

    // ResizeObserver with requestAnimationFrame debounce
    const resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(() => {
        if (fitAddonRef.current && terminalRef.current) {
          fitAddonRef.current.fit();
        }
      });
    });
    resizeObserver.observe(containerRef.current);

    // Cleanup — CRITICAL for React 18 Strict Mode
    return () => {
      resizeObserver.disconnect();
      if (terminalRef.current) {
        terminalRef.current.dispose();
        terminalRef.current = null;
      }
      fitAddonRef.current = null;
    };
  }, [onCommand]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width: '100%', height: '100%' }}
    />
  );
};
