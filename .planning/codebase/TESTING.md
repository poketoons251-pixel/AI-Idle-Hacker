# Testing Patterns

**Analysis Date:** 2026-05-20

## Test Framework

**Runner:**
- **Vitest** ^3.2.4 — configured via `vitest.config.ts` at project root
- **jsdom** ^26.1.0 — DOM environment for React component testing

**Assertion Library:**
- Vitest's built-in `expect` (global, via `globals: true`)
- `@testing-library/jest-dom` ^6.8.0 — DOM matchers (e.g., `toBeInTheDocument`, `toHaveTextContent`)
- Custom `toBeWithinRange` matcher defined in `src/tests/setup.ts`

**Run Commands:**
```bash
npm test               # vitest (watch mode)
npm run test:run       # vitest run (single run, no watch)
npm run test:ui        # vitest --ui (Vitest UI dashboard)
```

## Test Configuration

**File:** `vitest.config.ts`
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,            // `describe`, `it`, `expect`, `vi` available without import
    environment: 'jsdom',     // Browser-like DOM environment
    setupFiles: ['./src/tests/setup.ts'],
    css: true,                // Process CSS imports in tests
    reporters: ['verbose'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/tests/setup.ts'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'), // Match tsconfig path alias
    },
  },
});
```

**Coverage:**
- Reporters: `text`, `json`, `html`
- Exclude: `node_modules/`, `src/tests/setup.ts`
- **No coverage threshold** configured (no `thresholds` block)
- No coverage directory exclusion for `src/test/` or `dist/` (only `node_modules/` and setup file)

## Test File Organization

**Location:**
- **Vitest test files:** `src/tests/` directory (separate from source, not co-located)
- **Manual test files:** `src/test/` directory (legacy console-based tests, **not run by Vitest**)
- **Setup file:** `src/tests/setup.ts`

**Naming:**
- Pattern: `*.test.ts` — `integration.test.ts`, `phase4Integration.test.ts`
- No `*.spec.ts` files found
- Test file names describe scope: `integration.test.ts` (cross-system), `phase4Integration.test.ts` (phase 4 specific)

**Structure:**
```
src/tests/
  setup.ts                    # Global test setup and mocks
  integration.test.ts         # Full integration test suite (590 lines)
  phase4Integration.test.ts   # Phase 4 balance config validation (172 lines)
src/test/
  questSystemTest.ts          # Legacy manual test (108 lines, not Vitest)
```

## Test Structure

**Suite Organization:**
```typescript
import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useGameStore } from '../store/gameStore';

// Mock implementations
vi.mock('../store/gameStore');
vi.mock('../utils/errorHandling');

describe('Phase 4 Integration Tests', () => {
  // Shared test data
  const mockGameStore = { /* ... */ };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useGameStore).mockReturnValue(mockGameStore);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Balance Configuration Integration', () => {
    it('should apply correct hacking success rates based on balance config', () => {
      // Test logic
    });
  });
});
```

**Patterns:**
- `describe` blocks nest by system/feature area — `Balance Configuration Integration`, `AI Decision Making Integration`, `Investigation System Integration`
- `beforeEach` clears all mocks and re-initializes mock return values
- `afterEach` restores all mocks (`vi.restoreAllMocks()`)
- Test descriptions use business language: `'should apply correct hacking success rates based on balance config'`

## Mocking

**Framework:** Vitest's built-in `vi` (global).

**Patterns:**

1. **Module mocking** — top-level `vi.mock()` calls:
```typescript
vi.mock('../store/gameStore');
vi.mock('../utils/errorHandling');
```

2. **Function mocking** — `vi.fn()` for function stubs:
```typescript
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
```

3. **Return value mocking** — `vi.mocked(module).mockReturnValue(value)`:
```typescript
vi.mocked(useGameStore).mockReturnValue(mockGameStore);
```

4. **Fetch mocking** — `global.fetch = vi.fn()` with `mockResolvedValueOnce`:
```typescript
global.fetch = vi.fn();

(fetch as Mock).mockResolvedValueOnce({
  ok: true,
  json: () => Promise.resolve({ choices: [mockChoice] })
});
```

5. **Third-party mocking** — mock `sonner` toast library:
```typescript
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn()
  }
}));
```

**What to Mock:**
- External API endpoints (fetch calls)
- Global services (store, error handler)
- Browser APIs (localStorage, IntersectionObserver, ResizeObserver, matchMedia, scrollTo, performance)

**What NOT to Mock:**
- Pure calculation functions (balance config logic, reward calculation)
- Synchronous utility functions when testing integration behavior
- Configuration objects (`balanceConfig`)

## Fixtures and Factories

**Inline test data** — most test data is defined directly within test files rather than imported from fixtures:

```typescript
const mockGameStore = {
  player: {
    id: 'test-player',
    experience: 5000,
    credits: 10000,
    reputation: 750,
    level: 5
  },
  skills: {
    hacking: 45,
    investigation: 38,
    social_engineering: 32,
    operations: 28
  },
  // ...
};
```

```typescript
const mockTargets = [
  {
    id: 'target-1',
    priority: 'high',
    difficulty: 6,
    potential_rewards: { experience: 800, credits: 1500 },
    risk_factors: { detection_chance: 25, retaliation_risk: 15 }
  },
  // ...
];
```

**No fixture files or factories** — no separate test data directory, no `@testing-library/react` factory helpers.

## Test Setup

**File:** `src/tests/setup.ts` (138 lines)

**What it does:**
1. Imports `expect`, `afterEach`, `beforeEach`, `vi` from vitest
2. Imports `cleanup` from `@testing-library/react`
3. Imports `@testing-library/jest-dom` (for DOM matchers)
4. Runs `cleanup()` after each test
5. Mocks global browser APIs:
   - `IntersectionObserver`
   - `ResizeObserver`
   - `matchMedia`
   - `scrollTo`
   - `localStorage` (getItem, setItem, removeItem, clear)
   - `sessionStorage` (getItem, setItem, removeItem, clear)
   - `performance` API (now, memory, mark, measure, getEntriesByType, etc.)
   - `PerformanceObserver`
   - `fetch`
6. Suppresses `console.error` and `console.warn` during tests (restores after)
7. Defines custom `toBeWithinRange` matcher with TypeScript declaration merging

**Custom matcher:**
```typescript
expect.extend({
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () => `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
});
```

**TypeScript declaration for custom matcher:**
```typescript
declare module 'vitest' {
  interface Assertion<T = any> {
    toBeWithinRange(floor: number, ceiling: number): T;
  }
}
```

## Test Types

**Unit Tests:**
- **Not present.** No unit tests for individual components, hooks, store actions, or utility functions exist.
- `src/test/questSystemTest.ts` is a manual console-based test (not Vitest) that directly manipulates the Zustand store and logs results — **not a proper unit test**.

**Integration Tests:**
- **Present and stored in `src/tests/integration.test.ts`** (590 lines) and `src/tests/phase4Integration.test.ts` (172 lines).
- Focus on verifying balance configuration values, system interaction scenarios, and error handling pathways.
- Test categories in `integration.test.ts`:
  - Balance Configuration Integration
  - AI Decision Making Integration
  - Investigation System Integration
  - Hacking System Integration
  - Episodic Campaign Integration
  - AI Personality System Integration
  - Idle Optimization Integration
  - Error Handling Integration
  - Performance Optimization
  - System Integration Scenarios
  - Performance Benchmarks

**E2E Tests:**
- **Not used.** No Playwright, Cypress, or other E2E framework.

## Common Patterns

**Balance Config Validation (from `phase4Integration.test.ts`):**
```typescript
it('should validate hacking technique success rates', () => {
  const config = balanceConfig.hackingTechniques;

  Object.values(config.baseSuccessRates).forEach(rate => {
    expect(rate).toBeGreaterThan(0);
    expect(rate).toBeLessThanOrEqual(1);
  });

  expect(config.skillBonusMultipliers.perLevelAbove).toBeGreaterThan(0);
  expect(config.skillBonusMultipliers.perLevelBelow).toBeLessThan(0);
});
```

**API Call with Fetch Mock (from `integration.test.ts`):**
```typescript
it('should deliver episodes based on player progression and difficulty', async () => {
  const mockCampaign = {
    id: 'campaign-1',
    difficulty: 'medium',
    episodes: [
      { id: 'ep-1', unlocked: true, completed: true },
      { id: 'ep-2', unlocked: true, completed: false },
      { id: 'ep-3', unlocked: false, completed: false }
    ]
  };

  (fetch as Mock).mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve({ campaign: mockCampaign })
  });

  const response = await fetch('/api/campaigns/current');
  const data = await response.json();

  const unlockedEpisodes = data.campaign.episodes.filter((ep: any) => ep.unlocked);
  const completedEpisodes = data.campaign.episodes.filter((ep: any) => ep.completed);

  expect(unlockedEpisodes).toHaveLength(2);
  expect(completedEpisodes).toHaveLength(1);
});
```

**Error Testing (from `integration.test.ts`):**
```typescript
it('should handle network errors with appropriate recovery strategies', async () => {
  const networkError = new Error('Network request failed');
  (fetch as Mock).mockRejectedValueOnce(networkError);

  try {
    await fetch('/api/test-endpoint');
  } catch (error) {
    expect(error).toBeDefined();
  }

  // Should attempt recovery
  expect(localStorageMock.setItem).toHaveBeenCalled();
});
```

**Custom Matcher Usage:**
```typescript
it('should apply execution time variations within acceptable range', () => {
  const variation = balanceConfig.hackingTechniques.difficultyScaling.experienceMultiplier;
  expect(variation).toBeLessThanOrEqual(0.15);
  expect(minTime).toBeGreaterThan(100);
  expect(maxTime).toBeLessThan(140);
});
```

**Performance Benchmark (from `integration.test.ts`):**
```typescript
it('should complete AI decision making within acceptable time limits', async () => {
  const startTime = performance.now();
  await new Promise(resolve => setTimeout(resolve, 100));
  const endTime = performance.now();
  const duration = endTime - startTime;
  expect(duration).toBeLessThan(500);
});
```

## Legacy Manual Test

**File:** `src/test/questSystemTest.ts` (108 lines)

This is a **non-Vitest** manual test that:
- Directly manipulates the Zustand store with `useGameStore.getState()` and `useGameStore.setState()`
- Uses `console.log` to report results with emoji indicators (🧪, ✅, 🎉)
- Exports `testQuestSystem()` function
- Attaches to `window.testQuestSystem` for browser console invocation
- Not run by `vitest` or any npm script

## Test Coverage Gaps

| Area | Coverage | Risk |
|------|----------|------|
| UI Components (button, card, badge, tabs, progress) | **Untested** | Low — shadcn-style, stable |
| Page Components (Dashboard, Operations, Character, etc.) | **Untested** | High — core user-facing logic |
| Custom Hooks (useIdleProgression, useTheme) | **Untested** | High — useIdleProgression has Web Worker + AI decision logic |
| Zustand Store (gameStore.ts actions) | **Untested** | High — largest file, core game logic |
| Utility Functions (rewardCalculator, questMechanics) | **Untested** | Medium — calculation logic |
| Data Files (questTypes, loreEntries, npcDialogues) | **Untested** | Low — mostly static data |
| Error Handling (errorHandler, GameError) | **Partially tested** | Medium — tested via integration |
| Balance Config (balanceConfig) | **Tested** | Low — validated in integration tests |
| WebSocket Service | **Untested** | Medium |
| Supabase Client | **Untested** | Medium |
| API Backend (`api/` directory) | **Untested** | High |

## Recommendations

1. **Add component unit tests** for all UI primitives in `src/components/ui/` using `@testing-library/react` render patterns
2. **Add store unit tests** for `gameStore.ts` — test individual actions in isolation
3. **Add hook tests** for `useIdleProgression.ts` — mock Web Worker and test decision logic
4. **Set coverage thresholds** in vitest.config.ts to enforce minimum coverage
5. **Co-locate test files** with source files (`Component.test.tsx` next to `Component.tsx`) rather than in `src/tests/`
6. **Remove or migrate** legacy `src/test/questSystemTest.ts` to proper Vitest tests
7. **Standardize on `*.test.tsx`** naming for component tests to enable JSX in test files

---

*Testing analysis: 2026-05-20*
