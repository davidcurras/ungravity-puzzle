// src/game/scoring.js

// Simple, tunable scoring model.
// - You always score for collected stars.
// - You also get a time bonus: faster -> more bonus.
// - Final "rating" (1-3) is based on normalized score, with a special-case for perfect run.

export const SCORE_VERSION = 1;

const STAR_POINTS = 1000;

// Per-level knobs (start simple, tune later)
const LEVEL_CONFIG = {
  map101: {
    parTimeMs: 25000,   // "great" time (25s)
    maxTimeMs: 120000,  // after this, time bonus is basically 0 (120s)
  },
};

export function getLevelConfig(levelId) {
  return LEVEL_CONFIG[levelId] || { parTimeMs: 30000, maxTimeMs: 120000 };
}

function clamp01(x) {
  return Math.max(0, Math.min(1, x));
}

/**
 * Returns a normalized time factor in [0..1].
 * 1.0 means at or below par time (best),
 * 0.0 means at or above max time (worst).
 */
export function timeFactor(timeMs, parTimeMs, maxTimeMs) {
  if (timeMs <= parTimeMs) return 1;
  if (timeMs >= maxTimeMs) return 0;
  const t = (timeMs - parTimeMs) / (maxTimeMs - parTimeMs);
  return 1 - clamp01(t);
}

/**
 * Compute score.
 * maxScore is defined so we can later normalize and rate consistently.
 */
export function computeScore({ collectedStars, totalStars, timeMs, parTimeMs, maxTimeMs }) {
  const starsScore = collectedStars * STAR_POINTS;

  // Max possible star score uses totalStars.
  const maxStarsScore = totalStars * STAR_POINTS;

  // Time bonus scaled by how many stars the level has (keeps levels comparable).
  const tf = timeFactor(timeMs, parTimeMs, maxTimeMs);

  // Time bonus is up to the same magnitude as maxStarsScore.
  const timeBonus = Math.round(maxStarsScore * tf);

  const score = starsScore + timeBonus;
  const maxScore = maxStarsScore + maxStarsScore; // stars + max timeBonus

  return {
    score,
    starsScore,
    timeBonus,
    maxScore,
    timeFactor: tf,
  };
}

/**
 * Compute 1-3 star rating from score.
 * Special case: perfect run (100% stars) AND time <= par => 3 stars.
 * Otherwise use normalized score thresholds.
 */
export function computeRating({ collectedStars, totalStars, timeMs, parTimeMs, maxTimeMs }) {
  if (totalStars <= 0) return 3; // edge case: no stars in level

  const ratio = collectedStars / totalStars;

  // Perfect run
  if (ratio === 1 && timeMs <= parTimeMs) return 3;

  const { score, maxScore } = computeScore({
    collectedStars,
    totalStars,
    timeMs,
    parTimeMs,
    maxTimeMs,
  });

  const normalized = maxScore > 0 ? score / maxScore : 0;

  // Thresholds (tune later)
  if (normalized >= 0.75) return 3;
  if (normalized >= 0.45) return 2;
  return 1;
}
