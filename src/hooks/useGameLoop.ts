import { useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '../store/gameStore';

interface GameLoopOptions {
  onTick?: (tick: number) => void;
}

export function useGameLoop(options: GameLoopOptions = {}) {
  const workerRef = useRef<Worker | null>(null);
  const tickAccumulatorRef = useRef<number>(0);
  const { onTick } = options;

  // Use Zustand getState() to avoid re-render dependencies
  const storeRef = useRef(useGameStore);

  useEffect(() => {
    // Vite worker bundling
    workerRef.current = new Worker(
      new URL('../workers/gameLoopWorker.ts', import.meta.url),
      { type: 'module' }
    );

    workerRef.current.onmessage = (e: MessageEvent) => {
      const { type, tick, timestamp } = e.data;

      if (type === 'TICK') {
        // Accumulate ticks — do meaningful work every 10 ticks (1 second)
        tickAccumulatorRef.current++;
        if (tickAccumulatorRef.current >= 10) {
          tickAccumulatorRef.current = 0;
          handleSecondTick(timestamp);
        }
        // Call onTick for every tick (for components that need per-tick updates)
        onTick?.(tick);
      }
    };

    // Start the loop
    workerRef.current.postMessage({ type: 'START' });

    // Auto-save every 30 seconds (triggers persist via lastUpdate change)
    const saveInterval = setInterval(() => {
      const store = storeRef.current.getState();
      store.setLastUpdate(Date.now());
    }, 30000);

    return () => {
      workerRef.current?.postMessage({ type: 'STOP' });
      workerRef.current?.terminate();
      clearInterval(saveInterval);
    };
  }, [onTick]);

  const handleSecondTick = useCallback((timestamp: number) => {
    const store = storeRef.current.getState();

    // Energy regeneration: +1 energy per second, capped at maxEnergy
    if (store.player.energy < store.player.maxEnergy) {
      store.updatePlayer({
        energy: Math.min(store.player.maxEnergy, store.player.energy + 1),
      });
    }

    // Passive credit generation: base rate + equipped equipment bonuses
    const getCreditRate = () => {
      const state = storeRef.current.getState();
      const baseRate = 5; // per D-03: 5 credits/sec base rate
      const equipmentBonus = state.equipment
        .filter(e => e.equipped)
        .reduce((sum, e) => sum + e.bonus, 0);
      return baseRate + equipmentBonus;
    };

    const rate = getCreditRate();
    const newCredits = store.player.credits + rate;
    store.updatePlayer({ credits: newCredits });

    // Update lastUpdate timestamp
    store.setLastUpdate(timestamp);
  }, []);

  // Visibility change handling + beforeunload + offline progress
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        // Record time when tab goes hidden
        storeRef.current.getState().setLastUpdate(Date.now());
      } else {
        // Tab became visible — calculate offline progress
        const store = storeRef.current.getState();
        const now = Date.now();
        const elapsed = (now - store.lastUpdate) / 1000; // seconds

        if (elapsed > 5) { // Only calculate if away for more than 5 seconds
          const rate = store.getCreditRate();

          // 8-hour cap with diminishing returns after 2 hours
          // Formula: min(elapsed, 8h) × rate × (elapsed > 2h ? 0.5 : 1.0)
          const cappedSeconds = Math.min(elapsed, 8 * 3600); // 8h = 28800s
          const diminishingMultiplier = elapsed > 2 * 3600 ? 0.5 : 1.0; // 2h = 7200s
          const offlineCredits = Math.floor(cappedSeconds * rate * diminishingMultiplier);

          if (offlineCredits > 0) {
            store.updatePlayer({
              credits: store.player.credits + offlineCredits,
            });
            store.addNotification(
              `Welcome back! Earned ${offlineCredits.toLocaleString()} credits while away (${Math.floor(elapsed / 60)}min)`,
              'info'
            );
          }
        }
      }
    };

    const handleBeforeUnload = () => {
      const store = storeRef.current.getState();
      store.setLastUpdate(Date.now());
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  return {
    stop: useCallback(() => {
      workerRef.current?.postMessage({ type: 'STOP' });
    }, []),
    start: useCallback(() => {
      workerRef.current?.postMessage({ type: 'START' });
    }, []),
  };
}
