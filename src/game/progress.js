// src/game/progress.js

const STORAGE_KEY = "ungravity_progress_v1";

function safeParse(json, fallback) {
  try {
    const v = JSON.parse(json);
    return v && typeof v === "object" ? v : fallback;
  } catch {
    return fallback;
  }
}

export function loadProgress() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return safeParse(raw, {
    version: 1,
    unlocked: {}, // { [levelId]: true }
    levels: {},   // { [levelId]: { bestScore, bestRating, bestTimeMs, bestStarsCollected } }
  });
}

export function saveProgress(progress) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export function ensureLevelUnlocked(progress, levelId) {
  if (!progress.unlocked[levelId]) progress.unlocked[levelId] = true;
}

export function isLevelUnlocked(progress, levelId) {
  return !!progress.unlocked[levelId];
}

export function updateLevelBest(progress, levelId, result) {
  // result: { score, rating, timeMs, collectedStars }
  const prev = progress.levels[levelId] || null;

  const next = {
    bestScore: prev?.bestScore ?? -Infinity,
    bestRating: prev?.bestRating ?? 0,
    bestTimeMs: prev?.bestTimeMs ?? Infinity,
    bestStarsCollected: prev?.bestStarsCollected ?? 0,
  };

  // Best rating (higher is better)
  if (typeof result.rating === "number" && result.rating > next.bestRating) {
    next.bestRating = result.rating;
  }

  // Best score (higher is better)
  if (typeof result.score === "number" && result.score > next.bestScore) {
    next.bestScore = result.score;
  }

  // Best time (lower is better) — only if level was completed
  if (typeof result.timeMs === "number" && result.timeMs < next.bestTimeMs) {
    next.bestTimeMs = result.timeMs;
  }

  // Best stars collected (higher is better)
  if (typeof result.collectedStars === "number" && result.collectedStars > next.bestStarsCollected) {
    next.bestStarsCollected = result.collectedStars;
  }

  progress.levels[levelId] = next;
  return next;
}