// src/game/winFlow.js
import { getLevelConfig, computeScore, computeRating } from "./scoring.js";
import { ensureLevelUnlocked, updateLevelBest } from "./progress.js";

export function computeAndPersistWin({ progress, levels, levelIndex, levelId, contacts, timeMs }) {
  const { parTimeMs, maxTimeMs } = getLevelConfig(levelId);

  const totalStars = contacts.starsTotal;
  const collectedStars = contacts.starsCollected;

  const breakdown = computeScore({
    collectedStars,
    totalStars,
    timeMs,
    parTimeMs,
    maxTimeMs,
  });

  const rating = computeRating({
    collectedStars,
    totalStars,
    timeMs,
    parTimeMs,
    maxTimeMs,
  });

  const winResult = {
    levelId,
    timeMs,
    collectedStars,
    totalStars,
    rating,
    ...breakdown,
    parTimeMs,
    maxTimeMs,
  };

  ensureLevelUnlocked(progress, levelId);
  updateLevelBest(progress, levelId, {
    score: winResult.score,
    rating: winResult.rating,
    timeMs: winResult.timeMs,
    collectedStars: winResult.collectedStars,
    starsTotal: winResult.totalStars,
  });

  // Unlock next
  const nextIdx = levelIndex + 1;
  if (nextIdx < levels.length) ensureLevelUnlocked(progress, levels[nextIdx].id);

  return { winResult };
}
