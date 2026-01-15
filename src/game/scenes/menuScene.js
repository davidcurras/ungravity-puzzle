// src/game/scenes/menuScene.js

export function createMenuScene({ go }) {
  const btnStart = document.getElementById("btn-start");
  const btnLevels = document.getElementById("btn-levels");
  const btnCredits = document.getElementById("btn-credits");

  function onStart() { go("game"); }
  function onLevels() { go("levels"); }
  function onCredits() { go("credits"); }

  return {
    onEnter() {
      btnStart?.addEventListener("click", onStart);
      btnLevels?.addEventListener("click", onLevels);
      btnCredits?.addEventListener("click", onCredits);
    },
    onExit() {
      btnStart?.removeEventListener("click", onStart);
      btnLevels?.removeEventListener("click", onLevels);
      btnCredits?.removeEventListener("click", onCredits);
    },
  };
}
