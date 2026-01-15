// src/game/scenes/menuScene.js

export function createMenuScene({ go, hasActiveRun = () => false }) {
  const screen = document.getElementById("screen-menu");

  const btnPlay = screen?.querySelector("#btn-start");
  const btnLevels = screen?.querySelector("#btn-levels");
  const btnCredits = screen?.querySelector("#btn-credits");

  function syncLabels() {
    if (btnPlay) btnPlay.textContent = hasActiveRun() ? "Continue" : "Play";
  }

  function onPlay() {
    go("game");
  }

  function onLevels() {
    go("levels");
  }

  function onCredits() {
    go("credits");
  }

  return {
    onEnter() {
      syncLabels();
      btnPlay?.addEventListener("click", onPlay);
      btnLevels?.addEventListener("click", onLevels);
      btnCredits?.addEventListener("click", onCredits);
    },
    onExit() {
      btnPlay?.removeEventListener("click", onPlay);
      btnLevels?.removeEventListener("click", onLevels);
      btnCredits?.removeEventListener("click", onCredits);
    },
  };
}
