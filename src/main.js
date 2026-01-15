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

const canvas = document.getElementById("game");
const hudStatus = document.getElementById("hud-status");

const camera = createCamera();
const input = createInput();

// Levels (por ahora solo 1; después agregamos más)
const LEVELS = [
  { id: "map101", url: "./assets/maps/map101.tmx" },
];

let levelIndex = 0;

// Runtime state
let mode = "loading"; // "loading" | "playing" | "paused" | "won"
let runTimeMs = 0;
let winResult = null; // { score, rating, starsScore, timeBonus, maxScore, ... }
let winComputed = false;
let tmxInfo = "TMX: not loaded";

// World/session state (se recrea al cargar nivel)
let world = null;
let ball = null;
let contacts = null;

// Gravity state (4-way, random excluding current)
const GRAVITY_MAG = 9.8;
const GRAVITY_DIRS = [
  { name: "DOWN", v: () => pl.Vec2(0, GRAVITY_MAG) },
  { name: "UP", v: () => pl.Vec2(0, -GRAVITY_MAG) },
  { name: "RIGHT", v: () => pl.Vec2(GRAVITY_MAG, 0) },
  { name: "LEFT", v: () => pl.Vec2(-GRAVITY_MAG, 0) },
];

let gravityIndex = 0; // start DOWN

function applyGravity() {
  if (!world) return;
  world.setGravity(GRAVITY_DIRS[gravityIndex].v());

  // wake dynamic bodies so change is immediate
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
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  const tenths = Math.floor((ms % 1000) / 100);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${tenths}`;
}

function createSession() {
  world = createWorld();
  ball = createBall(world, 160, 120, 18);
  contacts = createContactSystem(world);

  applyGravity();
}

async function loadLevel(index) {
  levelIndex = Math.max(0, Math.min(index, LEVELS.length - 1));
  mode = "loading";
  runTimeMs = 0;
  winResult = null;
  winComputed = false;
  tmxInfo = "TMX: loading…";

  createSession();

  try {
    const level = LEVELS[levelIndex];
    const map = await loadTMX(level.url);

    const objectLayers = map.layers.filter((l) => l.type === "objectgroup");
    const objectsCount = objectLayers.reduce((acc, l) => acc + l.objects.length, 0);

    const built = buildLevelFromTMX(world, map, ball);
    contacts.reset(built.starsTotal);

    tmxInfo =
      `TMX loaded — ${map.width}x${map.height} tiles @ ${map.tilewidth}x${map.tileheight}px — ` +
      `${objectLayers.length} object layers — ${objectsCount} objects — built ${built.objectsCount}`;

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
  if (levelIndex < LEVELS.length - 1) {
    loadLevel(levelIndex + 1);
  } else {
    // no-op por ahora
    loadLevel(levelIndex);
  }
}

function restartLevel() {
  loadLevel(levelIndex);
}

// Start
loadLevel(0);

function update(dt) {
  // Global controls
  if (input.consumePause()) togglePause();
  if (input.consumeRestart()) restartLevel();
  if (input.consumeNext()) nextLevel();

  // Time only while playing
  if (mode === "playing") runTimeMs += dt * 1000;

  if (mode === "playing") {
    if (!contacts.won && input.consumeFlip()) randomizeGravityDirection();

    world.step(dt, 8, 3);
    contacts.flushDestroyQueue();

    if (contacts.won) {
      mode = "won";
    }

    // If we just won, compute final scoring once
    if (mode === "won" && !winComputed) {
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
    }
  }

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
}

function render(engine) {
  if (world) renderWorldDebug(engine, world, camera);
}

const engine = createEngine({ canvas, update, render });
engine.start();
