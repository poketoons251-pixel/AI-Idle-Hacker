import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import AudioManager from "./lib/audioManager";
import { startGlitchTimer } from "./lib/glitchTrigger";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Global UI click sound (AudioManager handles init/lazy init internally)
document.addEventListener('click', () => {
  AudioManager.getInstance().playUIClick();
});

// Start random glitch timer
startGlitchTimer();
