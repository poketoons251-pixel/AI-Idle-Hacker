# Coding Conventions

**Analysis Date:** 2026-05-20

## Naming Patterns

**Files:**
- **React components**: PascalCase `.tsx` files — `Button.tsx`, `Card.tsx`, `Dashboard.tsx`, `EnhancedQuestSystem.tsx`
- **Utilities/Stores/Services**: camelCase `.ts` files — `gameStore.ts`, `errorHandling.ts`, `rewardCalculator.ts`, `questMechanics.ts`
- **Data/Config**: camelCase `.ts` files — `balanceConfig.ts`, `npcDialogues.ts`, `questTypes.ts`, `loreEntries.ts`
- **Hooks**: camelCase with `use` prefix — `useIdleProgression.ts`, `useTheme.ts`
- **CSS**: `index.css` (single entry point, no CSS modules)

**Functions:**
- camelCase for all functions and methods — `generateQuestFromType`, `calculateReward`, `handleError`, `startQuest`, `checkQuestCompletion`
- Private/factory helpers prefixed with `create` — `createNetworkError`, `createValidationError`, `createAIDecisionError`
- Event handlers prefixed with `handle` — `handleMessage`, `handleSendMessage`, `handleKeyPress`
- Boolean accessors prefixed with `is` or `has` — `isConnected`, `isActive`, `isCompleted`

**Variables:**
- camelCase throughout — `activeOperations`, `selectedQuestType`, `baseEfficiency`
- Constants in UPPER_SNAKE_CASE — used sparingly (e.g., enum values like `ErrorType.NETWORK`)
- Destructured store selectors match store property names — `const { player, operations, updatePlayer } = useGameStore()`

**Types:**
- Interfaces prefixed with PascalCase — `Player`, `Quest`, `QuestObjective`, `AIConfig`, `BalanceConfig`
- Type aliases also PascalCase — `Theme`, `StatusType`, `Operation['type']`
- Interfaces named after the entity they describe without prefix/suffix — `Player`, `Skills`, `Equipment`, `Guild`
- Props interfaces follow pattern `{ComponentName}Props` — `ButtonProps`, `BadgeProps`, `TabsProps`, `ChatBoxProps`

## Code Style

**Formatting:**
- No Prettier config detected — formatting relies solely on ESLint with typescript-eslint
- Semicolons: **mixed usage** — `eslint.config.js` does not enforce semicolons and `gameStore.ts` even has `/* eslint-disable semi */`; some files use semicolons (`button.tsx`, `card.tsx`), others omit them (`Layout.tsx`, `Navigation.tsx`, `App.tsx`)
- Quotes: Double quotes dominate in shadcn-style components (`button.tsx`, `card.tsx`, `badge.tsx`, `lib/utils.ts`) while single quotes dominate in application code (`Layout.tsx`, `App.tsx`, `Navigation.tsx`, pages/)
- Trailing commas: Used in multiline objects and arrays (consistent)
- Indentation: 2 spaces throughout

**Linting:**
| Tool | Version | Config File |
|------|---------|-------------|
| ESLint | ^9.25.0 | `eslint.config.js` |
| typescript-eslint | ^8.30.1 | Included in eslint.config |
| eslint-plugin-react-hooks | ^5.2.0 | Included in eslint.config |
| eslint-plugin-react-refresh | ^0.4.19 | Included in eslint.config |

- **Rule set**: Extends `js.configs.recommended` and `tseslint.configs.recommended` (flat config format)
- **Custom rules**: `react-hooks/recommended` rules enabled, `react-refresh/only-export-components` set to `warn` with `allowConstantExport: true`
- **Ignored patterns**: `['dist']`
- **Scope**: Only `**/*.{ts,tsx}` files linted
- **Environment**: `globals.browser` enabled

**TypeScript Settings:**
- `strict: false` — TypeScript strict mode is **not** enabled; this means `noImplicitAny`, `strictNullChecks`, `strictFunctionTypes`, etc. are off
- `noUnusedLocals: false` — Allows unused local variables
- `noUnusedParameters: false` — Allows unused function parameters
- `noFallthroughCasesInSwitch: false` — Does not enforce fallthrough checks
- `verbatimModuleSyntax: false` — Allows type/value mixing in imports
- `target: ES2020`, `module: ESNext`, `jsx: react-jsx`
- Path alias: `@/*` → `./src/*` via tsconfig and vite-tsconfig-paths
- `skipLibCheck: true`, `forceConsistentCasingInFileNames: false`

## Import Organization

**Order:**
1. React imports (`import React, { useState } from 'react'`)
2. Third-party library imports (`lucide-react`, `react-router-dom`, `zustand`, `class-variance-authority`, `@radix-ui/react-slot`)
3. Internal absolute imports (`../../store/gameStore`, `../../lib/utils`, `../../data/questTypes`)
4. Relative imports for same-directory files

**Path Aliases:**
- `@/` resolves to `./src/` (configured in both `tsconfig.json` and `vite.config.ts`)

**Pattern from `EnhancedQuestSystem.tsx`:**
```typescript
import React, { useState, useEffect } from 'react';
import { Play, Pause, Square, Clock, Target, Zap, AlertTriangle, Trophy } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { questTypes, generateQuestFromType, QuestType } from '../../data/questTypes';
import { QuestMechanicsHandler } from '../../utils/questMechanics';
```

**Pattern from `QuestGenerator.tsx`:**
```typescript
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Zap, Clock, Shield, Sword, Users, Search } from 'lucide-react';
import { questTypes, QuestType, generateQuestFromType } from '../../data/questTypes';
```

## Error Handling

**Patterns:**
- **Custom error class** `GameError` (`src/utils/errorHandling.ts`) with typed `ErrorType` enum and `ErrorSeverity` enum
- **Singleton `ErrorHandler`** class with recovery strategies, suppression, and logging
- **Factory functions** for common error scenarios — `createNetworkError()`, `createValidationError()`, `createAIDecisionError()`, `createInvestigationError()`, `createHackingError()`
- **`fetchWithErrorHandling`** wrapper for network requests that auto-creates GameErrors
- **`withErrorHandling`** HOF that wraps async functions with error handling
- **`handleComponentError`** for React component errors
- Recovery strategies as `Record<string, RecoveryStrategy>` map — `networkRetry`, `authRefresh`, `aiDecisionFallback`, `investigationReset`, `hackingCooldown`
- Toast notifications via `sonner` for user-facing error feedback
- Errors logged to console in development, localStorage analytics in production

**Usage pattern:**
```typescript
try {
  const response = await fetch('/api/story/pending-choices');
  // ...
} catch (error) {
  const gameError = new GameError(
    'AI decision system unavailable',
    ErrorType.AI_DECISION,
    ErrorSeverity.MEDIUM,
    { context: 'story_choice' },
    true
  );
  await errorHandler.handleError(gameError);
}
```

## Logging

**Framework:** No centralized logger. Uses `console.log`, `console.debug`, `console.error`, `console.warn` throughout.

**Patterns:**
- Game store initialization: `console.log('🎮 GameStore: Initializing with data:', ...)` with emoji prefixes
- Idle progression debug: `console.debug('calculateIdleRewards called:', ...)`
- Error logging: `console.group / console.groupEnd` pattern in `errorHandler.ts`
- Proxy logging in `vite.config.ts`: `console.log('Sending Request to the Target:', req.method, req.url)`
- No structured logging library (no winston, pino, etc.)

## Comments

**JSDoc/TSDoc:**
- Used minimally. Found in `rewardCalculator.ts` — `/** Calculate the final reward amount based on scaling factors and conditions */`
- `balanceConfig.ts` has section comments: `// Phase 4 Balance Configuration`
- Not consistently applied across the codebase

**General comments:**
- Section comments with lines: `// Player actions`, `// Equipment actions`, `// Operation actions`
- Inline comments for non-obvious logic: `// Check for duplicate notifications in the last 10 seconds`
- `// @ts-nocheck` at top of `gameStore.ts` (disables type checking entirely for this file)
- Some commented-out code exists (e.g., Layout.tsx commented energy regeneration interval)

## Component Design

**UI Components (shadcn-style):**
- Use `React.forwardRef` for all reusable UI primitives — `Button`, `Card`, `CardHeader`, `Progress`, `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`
- Set `Component.displayName = "ComponentName"` after definition
- Accept `className` prop and merge via `cn()` utility
- Use `class-variance-authority` (`cva`) for variant-based styling — `buttonVariants`, `badgeVariants`
- Use `Slot` from `@radix-ui/react-slot` for polymorphic `asChild` pattern
- Export both the component and its variant object: `export { Button, buttonVariants }`
- Named exports, **never default exports**

**Application Components:**
- Define using `React.FC<Props>` or inline type annotation
- Named exports preferred (`export const ComponentName`), but **mixed** — some use default exports (e.g., `EnhancedQuestSystem`, `QuestGenerator` via `export default`)
- Props defined as inline interface locally or imported
- Hooks called at top of component before any logic
- Store access via `const { ... } = useGameStore()` destructuring

**Page Components:**
- Located in `src/pages/`, named with PascalCase corresponding to route
- Mixed export style — `Dashboard.tsx` and `Operations.tsx` use named exports (`export const Dashboard`), while `GuildManagement.tsx` and `AICompanionHub.tsx` use default exports

**Pattern from `button.tsx`:**
```typescript
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
```

**Pattern from `StatusIndicator.tsx`:**
```typescript
export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status, label, showIcon = false, showLabel = true, size = 'md', className = '', pulse = false
}) => {
  // ... inline config object lookups
  return (
    <div className={`flex items-center ${sizeStyles.container} ${className}`}>
      {/* ... */}
    </div>
  );
};
```

## Module Design

**Exports:**
- Named exports dominate (`export const`, `export function`, `export interface`, `export enum`)
- Default exports used occasionally for main page components and feature components — inconsistent
- Re-exports used for aggregating UI components: `export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }`
- Barrel files: **not used** — each import goes to the exact file path

**File Organization:**
- One component per file (except `card.tsx` which exports 6 sub-components, and `StatusIndicator.tsx` which exports preset components)
- Types co-located with usage — interfaces defined in same file or imported from `gameStore.ts`

## CSS/Tailwind Conventions

- **TailwindCSS v3** with custom `cyber-*` color palette defined in `tailwind.config.js`
- Custom component classes in `index.css`: `.cyber-card`, `.cyber-button`, `.cyber-input`, `.cyber-border`, `.cyber-glow`
- Custom fonts: `JetBrains Mono` (mono), `Orbitron` (display) from Google Fonts
- `@tailwindcss/forms` and `@tailwindcss/typography` plugins installed
- `cn()` utility from `src/lib/utils.ts` — `export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }`
- Dark mode via `darkMode: "class"` strategy with `dark` class on `<html>`
- No CSS modules or CSS-in-JS — all styling via Tailwind utility classes

## State Management (Zustand)

- Single store: `src/store/gameStore.ts` using `create<GameState>()((set, get) => ({ ... }))`
- All game state centralized in one large `GameState` interface (~145 interface properties including actions)
- Actions are methods on the store, using `set()` for immutable updates and `get()` for reading current state
- No `zustand/middleware` persist middleware used currently (though `persist` is imported but not in use)
- Store access via `useGameStore()` hook; state destructured at component top

## Hooks Architecture

- Custom hooks in `src/hooks/`: `useIdleProgression.ts` (~575 lines), `useTheme.ts` (~29 lines)
- Hooks follow standard React pattern: return object with public API methods
- `useIdleProgression` includes inline Web Worker creation via Blob URL, setInterval-based polling, AI decision engine
- `useWebSocket` hook re-exports singleton methods from `websocketService.ts`

---

*Convention analysis: 2026-05-20*
