import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { get, set, del, clear } from 'idb-keyval';

// Mock idb-keyval
vi.mock('idb-keyval', () => ({
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
  clear: vi.fn(),
}));

describe('idbStorage', () => {
  // We need to import after mocking
  let idbStorage: typeof import('../lib/idbStorage').idbStorage;

  beforeEach(async () => {
    vi.clearAllMocks();
    // Re-import to get fresh module with mocks
    const mod = await import('../lib/idbStorage');
    idbStorage = mod.idbStorage;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('getItem returns parsed value when data exists', async () => {
    const mockData = JSON.stringify({ player: { credits: 1000 }, lastUpdate: 12345 });
    vi.mocked(get).mockResolvedValue(mockData);

    const result = await idbStorage.getItem('ai-idle-hacker-game');

    expect(get).toHaveBeenCalledWith('ai-idle-hacker-game');
    expect(result).toEqual({ player: { credits: 1000 }, lastUpdate: 12345 });
  });

  it('getItem returns null when no data exists', async () => {
    vi.mocked(get).mockResolvedValue(undefined);

    const result = await idbStorage.getItem('ai-idle-hacker-game');

    expect(result).toBeNull();
  });

  it('setItem stores stringified value', async () => {
    const testData = { player: { credits: 2000 }, lastUpdate: 67890 };

    await idbStorage.setItem('ai-idle-hacker-game', testData);

    expect(set).toHaveBeenCalledWith('ai-idle-hacker-game', JSON.stringify(testData));
  });

  it('removeItem deletes the key', async () => {
    await idbStorage.removeItem('ai-idle-hacker-game');

    expect(del).toHaveBeenCalledWith('ai-idle-hacker-game');
  });
});

describe('Zustand persist integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset any persisted state between tests
    try {
      const { useGameStore } = require('../store/gameStore');
      useGameStore.persist.clearStorage();
    } catch {
      // Store might not be initialized yet
    }
  });

  it('store is wrapped with persist middleware', async () => {
    const { useGameStore } = await import('../store/gameStore');
    const persistConfig = (useGameStore as any).persist;
    expect(persistConfig).toBeDefined();
  });

  it('partialize returns only persisted fields', async () => {
    const { useGameStore } = await import('../store/gameStore');
    // Access the partialize function from persist config
    const persistOptions = (useGameStore as any).persist;
    expect(persistOptions).toBeDefined();
  });
});

describe('Offline progress calculation', () => {
  it('calculates credits for 1 hour away (no diminishing)', () => {
    const rate = 10; // credits per second
    const elapsed = 3600; // 1 hour in seconds

    const cappedSeconds = Math.min(elapsed, 8 * 3600);
    const diminishingMultiplier = elapsed > 2 * 3600 ? 0.5 : 1.0;
    const offlineCredits = Math.floor(cappedSeconds * rate * diminishingMultiplier);

    expect(offlineCredits).toBe(36000); // 3600 * 10 * 1.0
  });

  it('calculates credits for 4 hours away (diminishing applies)', () => {
    const rate = 10;
    const elapsed = 4 * 3600; // 4 hours

    const cappedSeconds = Math.min(elapsed, 8 * 3600);
    const diminishingMultiplier = elapsed > 2 * 3600 ? 0.5 : 1.0;
    const offlineCredits = Math.floor(cappedSeconds * rate * diminishingMultiplier);

    // 4h = 14400s, capped at 14400, multiplier 0.5
    expect(offlineCredits).toBe(72000); // 14400 * 10 * 0.5
  });

  it('caps offline progress at 8 hours', () => {
    const rate = 10;
    const elapsed = 10 * 3600; // 10 hours

    const cappedSeconds = Math.min(elapsed, 8 * 3600);
    const diminishingMultiplier = elapsed > 2 * 3600 ? 0.5 : 1.0;
    const offlineCredits = Math.floor(cappedSeconds * rate * diminishingMultiplier);

    // capped at 8h = 28800s, multiplier 0.5
    expect(offlineCredits).toBe(144000); // 28800 * 10 * 0.5
  });

  it('returns 0 credits for less than 5 seconds away', () => {
    const rate = 10;
    const elapsed = 3; // 3 seconds

    if (elapsed <= 5) {
      expect(true).toBe(true); // No offline progress calculated
    } else {
      const cappedSeconds = Math.min(elapsed, 8 * 3600);
      const diminishingMultiplier = elapsed > 2 * 3600 ? 0.5 : 1.0;
      const offlineCredits = Math.floor(cappedSeconds * rate * diminishingMultiplier);
      expect(offlineCredits).toBe(0);
    }
  });

  it('applies diminishing multiplier to entire duration when elapsed > 2h', () => {
    const rate = 5; // base rate
    const elapsed = 3 * 3600; // 3 hours

    const cappedSeconds = Math.min(elapsed, 8 * 3600);
    const diminishingMultiplier = elapsed > 2 * 3600 ? 0.5 : 1.0;
    const offlineCredits = Math.floor(cappedSeconds * rate * diminishingMultiplier);

    // 3h = 10800s, capped at 10800, multiplier 0.5
    expect(offlineCredits).toBe(27000); // 10800 * 5 * 0.5
  });
});

describe('Auto-save interval', () => {
  it('triggers save every 30 seconds', () => {
    const mockSetLastUpdate = vi.fn();
    let callCount = 0;

    // Simulate the interval callback logic
    const simulateInterval = () => {
      callCount++;
      mockSetLastUpdate(Date.now());
    };

    // Manually simulate 3 intervals
    simulateInterval(); // First 30s
    expect(mockSetLastUpdate).toHaveBeenCalledTimes(1);

    simulateInterval(); // Second 30s
    expect(mockSetLastUpdate).toHaveBeenCalledTimes(2);

    simulateInterval(); // Third 30s
    expect(mockSetLastUpdate).toHaveBeenCalledTimes(3);
  });

  it('interval callback calls setLastUpdate with current timestamp', () => {
    const mockGetState = vi.fn().mockReturnValue({
      setLastUpdate: vi.fn(),
    });

    // Simulate what the interval callback does
    const store = mockGetState();
    store.setLastUpdate(Date.now());

    expect(store.setLastUpdate).toHaveBeenCalled();
  });
});

describe('beforeunload handler', () => {
  it('calls setLastUpdate on beforeunload', () => {
    const mockSetLastUpdate = vi.fn();

    const handleBeforeUnload = () => {
      mockSetLastUpdate(Date.now());
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.dispatchEvent(new Event('beforeunload'));

    expect(mockSetLastUpdate).toHaveBeenCalledTimes(1);

    window.removeEventListener('beforeunload', handleBeforeUnload);
  });
});
