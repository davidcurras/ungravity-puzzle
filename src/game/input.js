// src/game/input.js
export function createInput() {
  const state = {
    flipRequested: false,
    pauseRequested: false,
    restartRequested: false,
    nextRequested: false,
  };

  function request(key) {
    state[key] = true;
  }

  // Keyboard
  window.addEventListener("keydown", (e) => {
    if (e.code === "Space") {
      e.preventDefault();
      request("flipRequested");
    }

    // Pause toggle
    if (e.code === "KeyP" || e.code === "Escape") {
      request("pauseRequested");
    }

    // Restart level
    if (e.code === "KeyR") {
      request("restartRequested");
    }

    // Next level
    if (e.code === "KeyN") {
      request("nextRequested");
    }
  });

  // Mouse / Touch (Pointer Events): flip
  window.addEventListener("pointerdown", (e) => {
    if (e.isPrimary) request("flipRequested");
  });

  return {
    consumeFlip() {
      const v = state.flipRequested;
      state.flipRequested = false;
      return v;
    },
    consumePause() {
      const v = state.pauseRequested;
      state.pauseRequested = false;
      return v;
    },
    consumeRestart() {
      const v = state.restartRequested;
      state.restartRequested = false;
      return v;
    },
    consumeNext() {
      const v = state.nextRequested;
      state.nextRequested = false;
      return v;
    },
  };
}
