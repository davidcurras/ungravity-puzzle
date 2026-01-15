// src/game/input.js
export function createInput() {
  const input = {
    flipRequested: false,
  };

  function requestFlip() {
    input.flipRequested = true;
  }

  // Keyboard
  window.addEventListener("keydown", (e) => {
    if (e.code === "Space") {
      e.preventDefault();
      requestFlip();
    }
  });

  // Mouse / Touch (Pointer Events)
  window.addEventListener("pointerdown", (e) => {
    // only primary button/touch
    if (e.isPrimary) requestFlip();
  });

  input.consumeFlip = () => {
    const v = input.flipRequested;
    input.flipRequested = false;
    return v;
  };

  return input;
}