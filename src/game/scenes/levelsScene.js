// src/game/scenes/levelsScene.js

export function createLevelsScene({ go }) {
  const btnBack = document.getElementById("btn-levels-back");
  function onBack() { go("menu"); }

  return {
    onEnter() { btnBack?.addEventListener("click", onBack); },
    onExit() { btnBack?.removeEventListener("click", onBack); },
  };
}
