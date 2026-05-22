import AudioManager from './audioManager';

const GLITCH_DURATION = 100; // ms
const GLITCH_MIN_INTERVAL = 20000; // 20s
const GLITCH_MAX_INTERVAL = 40000; // 40s

let glitchTimer: ReturnType<typeof setTimeout> | null = null;
let isGlitchEnabled = true;

export function setGlitchEnabled(enabled: boolean): void {
  isGlitchEnabled = enabled;
  if (!enabled && glitchTimer) {
    clearTimeout(glitchTimer);
    glitchTimer = null;
  } else if (enabled && !glitchTimer) {
    scheduleRandomGlitch();
  }
}

export function triggerGlitch(): void {
  if (!isGlitchEnabled) return;
  const wrapper = document.querySelector('.terminal-wrapper') as HTMLElement;
  if (!wrapper) return;
  wrapper.classList.add('glitch-active');
  AudioManager.getInstance().playTerminalGlitch();
  setTimeout(() => {
    wrapper.classList.remove('glitch-active');
  }, GLITCH_DURATION);
}

function scheduleRandomGlitch(): void {
  if (!isGlitchEnabled) return;
  const delay = GLITCH_MIN_INTERVAL + Math.random() * (GLITCH_MAX_INTERVAL - GLITCH_MIN_INTERVAL);
  glitchTimer = setTimeout(() => {
    triggerGlitch();
    scheduleRandomGlitch();
  }, delay);
}

export function startGlitchTimer(): void {
  if (glitchTimer) return;
  scheduleRandomGlitch();
}

export function stopGlitchTimer(): void {
  if (glitchTimer) {
    clearTimeout(glitchTimer);
    glitchTimer = null;
  }
}
