// src/game/scenes/levelsScene.js
import { isLevelUnlocked } from "../progress.js";

export function createLevelsScene({ go, getLevels, getProgress, startLevel }) {
  const btnBack = document.getElementById("btn-levels-back");
  const grid = document.getElementById("levels-grid");

  function onBack() {
    go("menu");
  }

  function pad2(n) {
    return String(n).padStart(2, "0");
  }

  function formatTime(ms) {
    if (!Number.isFinite(ms) || ms <= 0) return "—";
    const totalSec = Math.floor(ms / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    const tenths = Math.floor((ms % 1000) / 100);
    return `${pad2(min)}:${pad2(sec)}.${tenths}`;
  }

  function clampRating(r) {
    return Math.max(0, Math.min(3, r | 0));
  }

  function starString(rating) {
    const r = clampRating(rating);
    return "★".repeat(r) + "☆".repeat(3 - r);
  }

  function getRecord(levelId) {
    const p = getProgress();
    return p?.levels?.[levelId] || null;
  }

  function renderGrid() {
    if (!grid) return;

    const levels = getLevels();
    const progress = getProgress();
    grid.innerHTML = "";

    levels.forEach((lvl, index) => {
      const unlocked = isLevelUnlocked(progress, lvl.id);
      const rec = getRecord(lvl.id);

      const rating = rec?.bestRating ?? 0;
      const bestScore = rec?.bestScore ?? -1;
      const bestTimeMs = rec?.bestTimeMs ?? null;
      const bestStars = rec?.bestCollectedStars ?? 0;
      const starsTotal = rec?.starsTotal ?? null;

      const card = document.createElement("button");
      card.type = "button";
      card.className = "level-card";
      card.disabled = !unlocked;

      const title = document.createElement("div");
      title.className = "level-title";
      title.textContent = `Level ${index + 1}`;

      const line1 = document.createElement("div");
      line1.className = "level-line";

      if (!unlocked) {
        line1.innerHTML = `<span class="badge locked">🔒 Locked</span>`;
      } else if (!rec) {
        line1.innerHTML = `<span class="badge unlocked">Unlocked</span> <span class="muted">— Not completed</span>`;
      } else {
        line1.innerHTML = `<span class="rating">${starString(rating)}</span>`;
      }

      const line2 = document.createElement("div");
      line2.className = "level-line muted";

      if (!unlocked) {
        line2.textContent = "Beat the previous level to unlock.";
      } else if (!rec) {
        line2.textContent = "Play to set your best score.";
      } else {
        const scoreTxt = bestScore >= 0 ? bestScore.toLocaleString("en-US") : "—";
        const timeTxt = formatTime(bestTimeMs);
        const starsTxt = starsTotal != null ? `${bestStars}/${starsTotal}` : "";

        line2.textContent = `Best: ${starString(rating)} · ${scoreTxt} pts · ${timeTxt}${starsTxt ? " · " + starsTxt + " stars" : ""}`;
      }

      card.appendChild(title);
      card.appendChild(line1);
      card.appendChild(line2);

      if (unlocked) {
        card.addEventListener("click", () => {
          startLevel(index);
          go("game");
        });
      }

      grid.appendChild(card);
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
