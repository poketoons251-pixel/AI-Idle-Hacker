/**
 * ANSI color helper functions for terminal output formatting.
 * Each function wraps text with the appropriate ANSI escape codes.
 */
export const Colors = {
  green: (text: string) => `\x1b[32m${text}\x1b[0m`,
  brightGreen: (text: string) => `\x1b[1;32m${text}\x1b[0m`,
  pink: (text: string) => `\x1b[35m${text}\x1b[0m`,
  brightPink: (text: string) => `\x1b[1;35m${text}\x1b[0m`,
  brightMagenta: (text: string) => `\x1b[1;35m${text}\x1b[0m`,
  cyan: (text: string) => `\x1b[36m${text}\x1b[0m`,
  brightCyan: (text: string) => `\x1b[1;36m${text}\x1b[0m`,
  red: (text: string) => `\x1b[31m${text}\x1b[0m`,
  yellow: (text: string) => `\x1b[33m${text}\x1b[0m`,
  bold: (text: string) => `\x1b[1m${text}\x1b[0m`,
  dim: (text: string) => `\x1b[2m${text}\x1b[0m`,
  underline: (text: string) => `\x1b[4m${text}\x1b[0m`,
};
