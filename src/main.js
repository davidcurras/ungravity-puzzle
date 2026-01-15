// src/main.js
import { createEngine } from "./game/engine.js";
import { createCamera } from "./game/camera.js";
import { pl, createWorld, createBall } from "./game/physics.js";
import { renderWorldDebug } from "./game/renderDebug.js";
import { createInput } from "./game/input.js";
import { loadTMX } from "./game/tmx.js";
import { buildLevelFromTMX } from "./game/level.js";
import { createContactSystem } from "./game/contacts.js";
import { getLevelConfig, computeScore, computeRating } from "./game/scoring.js";
import {
  loadProgress,
  saveProgress,
  ensureLevelUnlocked,
  isLevelUnlocked,
  updateLevelBest,
} from "./game/progress.js";

const canvas = document.getElementById("game");
const hudStatus = document.getElementById("hud-status");

const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlay-title");
const overlaySubtitle = document.getElementById("overlay-subtitle");
const overlayStats = document.getElementById("overlay-stats");

const btnResume = document.getElementById("btn-resume");
const btnReplay = document.getElementById("btn-replay");
const btnNext = document.getElementById("btn-next");

const camera = createCamera();
const input = createInput();

const LEVELS = [{ id: "map101", url: "./assets/maps/map101.tmx" }];
let levelIndex = 0;

// Progress (localStorage)
const progress = loadProgress();
ensureLevelUnlocked(progress, LEVELS[0].id);
saveProgress(progress);

// Runtime state
let mode = "loading"; // "loading" | "playing" | "paused" | "won"
let runTimeMs = 0;
let tmxInfo = "TMX: not loaded";

let winResult = null;
let winComputed = false;

// World/session state
let world = null;
let ball = null;
let contacts = null;

// Gravity (4-direction random, excluding current)
const GRAVITY_MAG = 9.8;
const GRAVITY_DIRS = [
  { name: "DOWN", v: () => pl.Vec2(0, GRAVITY_MAG) },
  { name: "UP", v: () => pl.Vec2(0, -GRAVITY_MAG) },
  { name: "RIGHT", v: () => pl.Vec2(GRAVITY_MAG, 0) },
  { name: "LEFT", v: () => pl.Vec2(-GRAVITY_MAG, 0) },
];
let gravityIndex = 0;

function applyGravity() {
  if (!world) return;
  world.setGravity(GRAVITY_DIRS[gravityIndex].v());

  // Wake dynamic bodies so gravity change feels immediate
  for (let b = world.getBodyList(); b; b = b.getNext()) {
    if (!b.isStatic()) b.setAwake(true);
  }
}

function randomizeGravityDirection() {
  let next = gravityIndex;
  while (next === gravityIndex) {
    next = Math.floor(Math.random() * GRAVITY_DIRS.length);
  }
  gravityIndex = next;
  applyGravity();
}

function formatTime(ms) {
  const totalSeconds = ms / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const tenths = Math.floor((ms % 1000) / 100);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${tenths}`;
}

function showOverlay({ title, subtitle, stats, canResume, canNext }) {
  overlayTitle.textContent = title;
  overlaySubtitle.textContent = subtitle || "";
  overlayStats.textContent = stats || "";

  btnResume.disabled = !canResume;
  btnNext.disabled = !canNext;

  overlay.classList.remove("hidden");
}

function hideOverlay() {
  overlay.classList.add("hidden");
}

function createSession() {
  world = createWorld();
  ball = createBall(world, 160, 120, 18);
  contacts = createContactSystem(world);

  applyGravity();
}

async function loadLevel(index) {
  levelIndex = Math.max(0, Math.min(index, LEVELS.length - 1));

  // Don't allow loading locked levels
  if (!isLevelUnlocked(progress, LEVELS[levelIndex].id)) {
    levelIndex = 0;
  }

  mode = "loading";
  runTimeMs = 0;
  tmxInfo = "TMX: loading…";

  winResult = null;
  winComputed = false;

  createSession();

  try {
    const level = LEVELS[levelIndex];
    const map = await loadTMX(level.url);

    const objectLayers = map.layers.filter((l) => l.type === "objectgroup");
    const objectsCount = objectLayers.reduce((acc, l) => acc + l.objects.length, 0);

    const built = buildLevelFromTMX(world, map, ball);
    contacts.reset(built.starsTotal);

    tmxInfo = `TMX: ${level.id} — layers=${map.layers.length} — objects=${objectsCount}`;
    mode = "playing";
  } catch (err) {
    console.error(err);
    tmxInfo = `TMX error — ${err.message}`;
    mode = "paused";
  }
}

function togglePause() {
  if (mode === "playing") mode = "paused";
  else if (mode === "paused") mode = "playing";
}

function nextLevel() {
  const nextIdx = Math.min(levelIndex + 1, LEVELS.length - 1);
  // Only proceed if unlocked; otherwise do nothing (button should be disabled anyway)
  if (nextIdx !== levelIndex && isLevelUnlocked(progress, LEVELS[nextIdx].id)) {
    loadLevel(nextIdx);
  }
}

function restartLevel() {
  loadLevel(levelIndex);
}

// Button handlers
btnResume.addEventListener("click", () => {
  if (mode === "paused") togglePause();
});

btnReplay.addEventListener("click", () => {
  restartLevel();
});

btnNext.addEventListener("click", () => {
  nextLevel();
});

// Start game
loadLevel(0);

function update(dt) {
  // Global inputs
  if (input.consumePause()) togglePause();
  if (input.consumeRestart()) restartLevel();
  if (input.consumeNext()) nextLevel();

  // Run timer only while playing
  if (mode === "playing") runTimeMs += dt * 1000;

  if (mode === "playing") {
    if (!contacts.won && input.consumeFlip()) randomizeGravityDirection();

    world.step(dt, 8, 3);
    contacts.flushDestroyQueue();

    if (contacts.won) {
      mode = "won";
    }
  }

  // If we just won, compute scoring once and persist progress
  if (mode === "won" && !winComputed && contacts) {
    winComputed = true;

    const levelId = LEVELS[levelIndex].id;
    const { parTimeMs, maxTimeMs } = getLevelConfig(levelId);

    const totalStars = contacts.starsTotal;
    const collectedStars = contacts.starsCollected;
    const timeMs = runTimeMs;

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

    winResult = {
      levelId,
      timeMs,
      collectedStars,
      totalStars,
      rating,
      ...breakdown,
      parTimeMs,
      maxTimeMs,
    };

    // Persist progress
    ensureLevelUnlocked(progress, winResult.levelId);
    updateLevelBest(progress, winResult.levelId, {
      score: winResult.score,
      rating: winResult.rating,
      timeMs: winResult.timeMs,
      collectedStars: winResult.collectedStars,
    });

    // Unlock next level (if any)
    const nextIdx = levelIndex + 1;
    if (nextIdx < LEVELS.length) {
      ensureLevelUnlocked(progress, LEVELS[nextIdx].id);
    }

    saveProgress(progress);
  }

  // HUD values
  const p = ball?.getPosition?.() ?? pl.Vec2(0, 0);
  const gDir = GRAVITY_DIRS[gravityIndex].name;
  const stars = contacts ? `${contacts.starsCollected}/${contacts.starsTotal}` : "0/0";
  const goal = contacts
    ? `Goal ${contacts.isGoalEnabled() ? "ENABLED" : `LOCKED (${contacts.requiredStars} req)`}`
    : "Goal LOCKED";

  let resultText = "";
  if (mode === "won" && winResult) {
    resultText =
      ` — SCORE ${winResult.score} (stars ${winResult.starsScore} + time ${winResult.timeBonus})` +
      ` — RATING ${winResult.rating}/3` +
      ` — PAR ${formatTime(winResult.parTimeMs)}`;
  }

  hudStatus.textContent =
    `[${mode.toUpperCase()}] L${levelIndex + 1}/${LEVELS.length} — Time ${formatTime(runTimeMs)} — ` +
    `Gravity ${gDir} — Stars ${stars} — ${goal}` +
    resultText +
    ` — ball (${p.x.toFixed(2)}, ${p.y.toFixed(2)})m — ${tmxInfo}`;

  // Overlay UI
  if (mode === "paused") {
    showOverlay({
      title: "Paused",
      subtitle: "Press P or Esc to resume.",
      stats: `Time ${formatTime(runTimeMs)} — Stars ${stars}`,
      canResume: true,
      canNext: false,
    });
  } else if (mode === "won") {
    const nextUnlocked =
      levelIndex + 1 < LEVELS.length ? isLevelUnlocked(progress, LEVELS[levelIndex + 1].id) : false;

    const ratingTxt = winResult ? `${winResult.rating}/3` : "";
    const scoreTxt = winResult ? `${winResult.score}` : "";

    showOverlay({
      title: "Level Complete",
      subtitle: `Score ${scoreTxt} — Rating ${ratingTxt}`,
      stats: `Time ${formatTime(runTimeMs)} — Stars ${stars}`,
      canResume: false,
      canNext: nextUnlocked,
    });
  } else {
    hideOverlay();
  }
}

function render(engine) {
  if (world) renderWorldDebug(engine, world, camera);
}

const engine = createEngine({ canvas, update, render });
engine.start();
