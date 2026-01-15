// src/game/scenes/levelsScene.js
import { isLevelUnlocked } from "../progress.js";

export function createLevelsScene({ go, getLevels, getProgress, startLevel }) {
  const btnBack = document.getElementById("btn-levels-back");
  const grid = document.getElementById("levels-grid");

  function onBack() {
    go("menu");
  }

  function getRatingFor(levelId) {
    const p = getProgress();
    const rec = p?.levels?.[levelId];
    return rec?.rating || 0; // 0..3
  }

  function starString(rating) {
    // Visual: ★★★ or ★★☆ etc
    const full = "★".repeat(Math.max(0, Math.min(3, rating)));
    const empty = "☆".repeat(3 - Math.max(0, Math.min(3, rating)));
    return full + empty;
  }

  function renderGrid() {
    if (!grid) return;
    const levels = getLevels();
    const progress = getProgress();

    grid.innerHTML = "";

    levels.forEach((lvl, index) => {
      const unlocked = isLevelUnlocked(progress, lvl.id);
      const rating = getRatingFor(lvl.id);

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "level-card";
      btn.disabled = !unlocked;

      const name = document.createElement("span");
      name.className = "level-name";
      name.textContent = `Level ${index + 1}`;

      const meta = document.createElement("span");
      meta.className = "level-meta";
      if (!unlocked) {
        meta.classList.add("locked");
        meta.textContent = "Locked";
      } else if (rating > 0) {
        meta.textContent = `Rating ${starString(rating)}`;
      } else {
        meta.textContent = "Unlocked";
      }

      btn.appendChild(name);
      btn.appendChild(meta);

      if (unlocked) {
        btn.addEventListener("click", () => {
          startLevel(index);
          go("game");
        });
      }

      grid.appendChild(btn);
    });
  }

  return {
    onEnter() {
      btnBack?.addEventListener("click", onBack);
      renderGrid();
    },
    onExit() {
      btnBack?.removeEventListener("click", onBack);
    },
  };
}
