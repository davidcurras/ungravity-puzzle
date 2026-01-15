// src/game/progress.js

const STORAGE_KEY = "ungravity_progress_v1";

function isNum(v) {
  return typeof v === "number" && Number.isFinite(v);
}

function normalizeProgress(p) {
  // Fix legacy JSON serializations (Infinity/-Infinity become null).
  if (!p || typeof p !== "object") return {
    version: 1,
    unlocked: {},
    levels: {},
  };

  p.version = 1;
  p.unlocked = p.unlocked && typeof p.unlocked === "object" ? p.unlocked : {};
  p.levels = p.levels && typeof p.levels === "object" ? p.levels : {};

  for (const [levelId, rec] of Object.entries(p.levels)) {
    if (!rec || typeof rec !== "object") {
      delete p.levels[levelId];
      continue;
    }

    // Coerce bad values to null/0.
    if (!isNum(rec.bestScore)) rec.bestScore = null;
    if (!isNum(rec.bestTimeMs)) rec.bestTimeMs = null;
    if (!isNum(rec.bestRating)) rec.bestRating = 0;
    if (!isNum(rec.bestStarsCollected)) rec.bestStarsCollected = 0;
    if (!isNum(rec.starsTotal)) rec.starsTotal = null;
  }

  return p;
}

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
  const parsed = safeParse(raw, {
    version: 1,
    unlocked: {}, // { [levelId]: true }
    levels: {},   // { [levelId]: { bestScore, bestRating, bestTimeMs, bestStarsCollected, starsTotal } }
  });
  return normalizeProgress(parsed);
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
  // result: { score, rating, timeMs, collectedStars, starsTotal }
  const prev = progress.levels[levelId] || null;

  const next = {
    bestScore: isNum(prev?.bestScore) ? prev.bestScore : null,
    bestRating: prev?.bestRating ?? 0,
    bestTimeMs: isNum(prev?.bestTimeMs) ? prev.bestTimeMs : null,
    bestStarsCollected: prev?.bestStarsCollected ?? 0,
    starsTotal: isNum(prev?.starsTotal) ? prev.starsTotal : null,
  };

  // Best rating (higher is better)
  if (typeof result.rating === "number" && result.rating > next.bestRating) {
    next.bestRating = result.rating;
  }

  // Best score (higher is better)
  if (isNum(result.score) && (!isNum(next.bestScore) || result.score > next.bestScore)) {
    next.bestScore = result.score;
  }

  // Best time (lower is better)
  if (isNum(result.timeMs) && (!isNum(next.bestTimeMs) || result.timeMs < next.bestTimeMs)) {
    next.bestTimeMs = result.timeMs;
  }

  // Best stars collected (higher is better)
  if (typeof result.collectedStars === "number" && result.collectedStars > next.bestStarsCollected) {
    next.bestStarsCollected = result.collectedStars;
  }

  if (isNum(result.starsTotal)) {
    next.starsTotal = result.starsTotal;
  }

  progress.levels[levelId] = next;
  return next;
}
