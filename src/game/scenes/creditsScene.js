// src/game/scenes/creditsScene.js

export function createCreditsScene({ go }) {
  const btnBack = document.getElementById("btn-credits-back");
  function onBack() { go("menu"); }

  return {
    onEnter() { btnBack?.addEventListener("click", onBack); },
    onExit() { btnBack?.removeEventListener("click", onBack); },
  };
}
