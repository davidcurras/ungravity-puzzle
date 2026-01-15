// src/game/runState.js
export function createRunState() {
  return {
    mode: "loading", // loading | playing | paused | won
    timeMs: 0,
    tmxInfo: "TMX: not loaded",
    winResult: null,
    winComputed: false,

    resetForLevel() {
      this.timeMs = 0;
      this.winResult = null;
      this.winComputed = false;
      this.tmxInfo = "TMX: loading…";
    },
  };
}