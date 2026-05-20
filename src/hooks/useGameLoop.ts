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

    return () => {
      workerRef.current?.postMessage({ type: 'STOP' });
      workerRef.current?.terminate();
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

  // Visibility change handling
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        // Record time when tab goes hidden
        storeRef.current.getState().setLastUpdate(Date.now());
      }
      // On return, the tick loop continues — no special handling needed
      // for Phase 1 skeleton. Phase 3 will add offline progress calculation.
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
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
