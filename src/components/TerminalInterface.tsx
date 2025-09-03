import React, { useState, useEffect, useRef } from 'react';
import { Terminal, ChevronRight, Zap, Shield, Wifi } from 'lucide-react';

interface TerminalLine {
  id: string;
  type: 'input' | 'output' | 'error' | 'success';
  content: string;
  timestamp: Date;
}

interface TerminalInterfaceProps {
  onCommandExecute?: (command: string) => void;
  isExecuting?: boolean;
  className?: string;
}

const TerminalInterface: React.FC<TerminalInterfaceProps> = ({
  onCommandExecute,
  isExecuting = false,
  className = ''
}) => {
  const [lines, setLines] = useState<TerminalLine[]>([
    {
      id: 'init-1',
      type: 'output',
      content: 'AI Idle Hacker Terminal v2.1.0',
      timestamp: new Date()
    },
    {
      id: 'init-2',
      type: 'output',
      content: 'Type "help" for available commands',
      timestamp: new Date()
    }
  ]);
  const [currentInput, setCurrentInput] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [lineCounter, setLineCounter] = useState(3);
  const inputRef = useRef<HTMLInputElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);

  const availableCommands = {
    help: 'Show available commands',
    scan: 'Scan for nearby targets',
    exploit: 'Execute hacking technique',
    status: 'Show current system status',
    clear: 'Clear terminal output',
    history: 'Show command history'
  };

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [lines]);

  const addLine = (content: string, type: TerminalLine['type'] = 'output') => {
    const newLine: TerminalLine = {
      id: `line-${lineCounter}`,
      type,
      content,
      timestamp: new Date()
    };
    setLineCounter(prev => prev + 1);
    setLines(prev => [...prev, newLine]);
  };

  const handleCommand = (command: string) => {
    const trimmedCommand = command.trim().toLowerCase();
    
    // Add input to terminal
    addLine(`> ${command}`, 'input');
    
    // Add to history
    setCommandHistory(prev => [...prev, command]);
    setHistoryIndex(-1);

    // Process command
    switch (trimmedCommand) {
      case 'help':
        addLine('Available commands:');
        Object.entries(availableCommands).forEach(([cmd, desc]) => {
          addLine(`  ${cmd.padEnd(10)} - ${desc}`);
        });
        break;
        
      case 'scan':
        addLine('Scanning network for targets...');
        setTimeout(() => {
          addLine('Found 3 potential targets:', 'success');
          addLine('  192.168.1.100 - Corporate Server');
          addLine('  10.0.0.50 - Database Node');
          addLine('  172.16.0.25 - IoT Device');
        }, 1500);
        break;
        
      case 'status':
        addLine('System Status:');
        addLine('  CPU Usage: 23%');
        addLine('  Memory: 1.2GB / 8GB');
        addLine('  Network: Connected');
        addLine('  Security Level: HIGH', 'success');
        break;
        
      case 'clear':
        setLines([]);
        return;
        
      case 'history':
        addLine('Command History:');
        commandHistory.forEach((cmd, index) => {
          addLine(`  ${index + 1}. ${cmd}`);
        });
        break;
        
      default:
        if (trimmedCommand.startsWith('exploit')) {
          if (onCommandExecute) {
            onCommandExecute(command);
          } else {
            addLine('Exploit command requires technique selection', 'error');
          }
        } else if (trimmedCommand) {
          addLine(`Command not found: ${trimmedCommand}`, 'error');
          addLine('Type "help" for available commands');
        }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isExecuting) {
      handleCommand(currentInput);
      setCurrentInput('');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setCurrentInput(commandHistory[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex !== -1) {
        const newIndex = historyIndex + 1;
        if (newIndex >= commandHistory.length) {
          setHistoryIndex(-1);
          setCurrentInput('');
        } else {
          setHistoryIndex(newIndex);
          setCurrentInput(commandHistory[newIndex]);
        }
      }
    }
  };

  const getLineIcon = (type: TerminalLine['type']) => {
    switch (type) {
      case 'input':
        return <ChevronRight className="w-4 h-4 text-cyan-400" />;
      case 'success':
        return <Zap className="w-4 h-4 text-green-400" />;
      case 'error':
        return <Shield className="w-4 h-4 text-red-400" />;
      default:
        return <Wifi className="w-4 h-4 text-blue-400" />;
    }
  };

  const getLineColor = (type: TerminalLine['type']) => {
    switch (type) {
      case 'input':
        return 'text-cyan-300';
      case 'success':
        return 'text-green-400';
      case 'error':
        return 'text-red-400';
      default:
        return 'text-gray-300';
    }
  };

  return (
    <div className={`bg-gray-900 border border-cyan-500/30 rounded-lg overflow-hidden ${className}`}>
      {/* Terminal Header */}
      <div className="bg-gray-800 px-4 py-2 border-b border-cyan-500/30 flex items-center gap-2">
        <Terminal className="w-5 h-5 text-cyan-400" />
        <span className="text-cyan-400 font-mono text-sm">Terminal</span>
        <div className="flex gap-1 ml-auto">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
        </div>
      </div>

      {/* Terminal Content */}
      <div 
        ref={terminalRef}
        className="h-96 overflow-y-auto p-4 font-mono text-sm bg-black/50"
        onClick={() => inputRef.current?.focus()}
      >
        {lines.map((line) => (
          <div key={line.id} className="flex items-start gap-2 mb-1">
            {getLineIcon(line.type)}
            <span className={getLineColor(line.type)}>
              {line.content}
            </span>
          </div>
        ))}
        
        {/* Current Input Line */}
        <div className="flex items-center gap-2 mt-2">
          <ChevronRight className="w-4 h-4 text-cyan-400" />
          <span className="text-cyan-400">$</span>
          <input
            ref={inputRef}
            type="text"
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isExecuting}
            className="flex-1 bg-transparent text-cyan-300 outline-none font-mono"
            placeholder={isExecuting ? "Executing..." : "Enter command..."}
            autoFocus
          />
          {isExecuting && (
            <div className="animate-spin w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full"></div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TerminalInterface;