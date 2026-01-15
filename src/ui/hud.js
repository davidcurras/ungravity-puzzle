// src/ui/hud.js

import { REQUIRED_STAR_RATIO } from "../config.js";

function pad2(n) {
  return String(n).padStart(2, "0");
}

function formatTime(ms) {
  if (!Number.isFinite(ms) || ms < 0) ms = 0;
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  const tenths = Math.floor((ms % 1000) / 100);
  return `${pad2(min)}:${pad2(sec)}.${tenths}`;
}

export function renderHud(hudStatusEl, data) {
  if (!hudStatusEl) return;

  const {
    mode,
    levelIndex,
    levelsCount,
    timeMs,
    gravityName,
    contacts,
    tmxInfo,
    winResult,
  } = data || {};

  const lvl = Number.isFinite(levelIndex) ? levelIndex + 1 : 1;
  const lvlCount = Number.isFinite(levelsCount) ? levelsCount : 1;

  const collected = contacts?.starsCollected ?? 0;
  const total = contacts?.starsTotal ?? 0;

  // goal gating
  const needed =
    contacts?.requiredStars ?? (total > 0 ? Math.ceil(total * REQUIRED_STAR_RATIO) : 0);
  const goalReady =
    total === 0 ? true : contacts?.isGoalEnabled ? contacts.isGoalEnabled() : collected >= needed;
  const goalTxt =
    total === 0 ? "" : goalReady ? "Goal: READY" : `Goal: locked (${collected}/${needed})`;

  const timeTxt = formatTime(timeMs || 0);
  const starsTxt = total > 0 ? `Stars: ${collected}/${total}` : "Stars: —";
  const gravTxt = gravityName ? `Gravity: ${gravityName}` : "Gravity: —";

  let tail = "";
  if (mode === "paused") tail = " · Paused";
  if (mode === "won") {
    const score = winResult?.score != null ? winResult.score : "";
    const rating = winResult?.rating != null ? `${winResult.rating}/3` : "";
    tail = ` · WIN${score ? ` · ${score} pts` : ""}${rating ? ` · ${rating}` : ""}`;
  }

  const info = tmxInfo ? ` · ${tmxInfo}` : "";

  hudStatusEl.textContent =
    `Level ${lvl}/${lvlCount} · ${starsTxt} · ${goalTxt} · ${gravTxt} · Time: ${timeTxt}${tail}${info}`;
}
