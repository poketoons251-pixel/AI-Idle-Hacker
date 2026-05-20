// Dedicated Web Worker for game loop timing — no game logic
// Posts TICK messages at 10 ticks per second using setTimeout (not setInterval)
// to prevent drift accumulation.

const TICK_INTERVAL_MS = 100; // 10 ticks per second
let tickCount = 0;
let running = false;
let timerId: ReturnType<typeof setTimeout> | null = null;

function tick() {
  if (!running) return;
  tickCount++;
  self.postMessage({ type: 'TICK', tick: tickCount, timestamp: Date.now() });
  timerId = setTimeout(tick, TICK_INTERVAL_MS);
}

self.onmessage = (e: MessageEvent) => {
  const { type } = e.data;
  switch (type) {
    case 'START':
      running = true;
      tickCount = 0;
      tick();
      break;
    case 'STOP':
      running = false;
      if (timerId) {
        clearTimeout(timerId);
        timerId = null;
      }
      break;
  }
};
