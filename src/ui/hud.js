// src/ui/hud.js
function formatTime(ms) {
  const totalSeconds = ms / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const tenths = Math.floor((ms % 1000) / 100);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${tenths}`;
}

export function renderHud(hudEl, data) {
  const {
    mode,
    levelIndex,
    levelsCount,
    timeMs,
    tmxInfo,
    gravityName,
    ballPos,
    contacts,
    winResult,
  } = data;

  const formattedTime = formatTime(timeMs);

  const starsText = contacts ? `${contacts.starsCollected}/${contacts.starsTotal}` : "0/0";
  const goalText = contacts
    ? `Goal ${contacts.isGoalEnabled() ? "ENABLED" : `LOCKED (${contacts.requiredStars} req)`}`
    : "Goal LOCKED";

  let resultText = "";
  if (mode === "won" && winResult) {
    resultText =
      ` — SCORE ${winResult.score} (stars ${winResult.starsScore} + time ${winResult.timeBonus})` +
      ` — RATING ${winResult.rating}/3` +
      ` — PAR ${formatTime(winResult.parTimeMs)}`;
  }

  const p = ballPos;
  const ballText = p ? `(${p.x.toFixed(2)}, ${p.y.toFixed(2)})m` : "(—, —)m";

  hudEl.textContent =
    `[${mode.toUpperCase()}] L${levelIndex + 1}/${levelsCount} — Time ${formattedTime} — ` +
    `Gravity ${gravityName} — Stars ${starsText} — ${goalText}` +
    resultText +
    ` — ball ${ballText} — ${tmxInfo}`;

  // Handy for overlay caller
  data.formattedTime = formattedTime;
  data.starsText = starsText;
}
