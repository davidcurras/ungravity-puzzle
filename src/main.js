// src/main.js
import { createEngine } from "./core/engine.js";
import { createCamera } from "./core/camera.js";
import { createInput } from "./core/input.js";

import { createSceneManager } from "./game/sceneManager.js";
import { loadProgress, saveProgress, ensureLevelUnlocked, isLevelUnlocked } from "./game/progress.js";
import { createRunState } from "./game/runState.js";
import { computeAndPersistWin } from "./game/winFlow.js";

import { createMenuScene } from "./game/scenes/menuScene.js";
import { createCreditsScene } from "./game/scenes/creditsScene.js";
import { createLevelsScene } from "./game/scenes/levelsScene.js";

import { createLevelManager } from "./world/level/levelManager.js";
import { renderWorldDebug } from "./world/renderDebug.js";

import { createOverlayController } from "./ui/overlay.js";
import { renderHud } from "./ui/hud.js";

// --- DOM ---
const canvas = document.getElementById("game");
const hudStatus = document.getElementById("hud-status");

const screens = {
  menu: document.getElementById("screen-menu"),
  levels: document.getElementById("screen-levels"),
  credits: document.getElementById("screen-credits"),
};

const sceneManager = createSceneManager({ screens });

const camera = createCamera();
const input = createInput();

// --- Levels (1..9) ---
const LEVELS = [
  { id: "map101", url: "./assets/maps/map101.tmx" },
  { id: "map102", url: "./assets/maps/map102.tmx" },
  { id: "map103", url: "./assets/maps/map103.tmx" },
  { id: "map104", url: "./assets/maps/map104.tmx" },
  { id: "map105", url: "./assets/maps/map105.tmx" },
  { id: "map106", url: "./assets/maps/map106.tmx" },
  { id: "map107", url: "./assets/maps/map107.tmx" },
  { id: "map108", url: "./assets/maps/map108.tmx" },
  { id: "map109", url: "./assets/maps/map109.tmx" },
];

// --- Progress ---
const progress = loadProgress();
ensureLevelUnlocked(progress, LEVELS[0].id);
saveProgress(progress);

// --- Run state ---
const state = createRunState();

// --- Level manager (world/session) ---
const levels = createLevelManager({ levels: LEVELS, progress });

// --- Scene navigation ---
const scenes = {};

function go(name, payload = null) {
  // hide overlay when leaving game
  if (name !== "game") overlay.hide();

  if (name === "menu") return sceneManager.setScene("menu", payload, scenes.menu);
  if (name === "levels") return sceneManager.setScene("levels", payload, scenes.levels);
  if (name === "credits") return sceneManager.setScene("credits", payload, scenes.credits);

  // game
  if (state.mode === "paused") state.mode = "playing";
  return sceneManager.setScene("game", payload, null);
}

// --- Gameplay helpers ---
async function goToLevel(index) {
  state.resetForLevel();
  state.mode = "loading";

  try {
    const info = await levels.load(index);
    state.mode = "playing";
    state.tmxInfo = info.tmxInfo;
  } catch (err) {
    console.error(err);
    state.mode = "paused";
    state.tmxInfo = `TMX error — ${err?.message || err}`;
  }
}

function startLevel(index) {
  goToLevel(index);
}

function restartLevel() {
  goToLevel(levels.getIndex());
}

function nextLevel() {
  const nextIdx = levels.getIndex() + 1;
  if (nextIdx >= LEVELS.length) return;

  // only if unlocked
  if (isLevelUnlocked(progress, LEVELS[nextIdx].id)) {
    goToLevel(nextIdx);
  }
}

// --- Overlay (pause + win) ---
const overlay = createOverlayController({
  onResume: () => {
    if (state.mode === "paused") state.mode = "playing";
  },
  onReplay: () => restartLevel(),
  onNext: () => nextLevel(),
  onLevels: () => go("levels"),
  onMenu: () => go("menu"),
});

// --- Scenes instances ---
scenes.menu = createMenuScene({ go });
scenes.credits = createCreditsScene({ go });
scenes.levels = createLevelsScene({
  go,
  getLevels: () => LEVELS,
  getProgress: () => progress,
  startLevel,
});

// Preload first level so game is ready; update/render are gated by scene.
goToLevel(0);

// Start in menu
go("menu");

// --- Engine loop ---
function update(dt) {
  if (sceneManager.getSceneName() !== "game") return;

  // Pause toggle (only when not loading)
  if (input.consumePause && input.consumePause()) {
    if (state.mode === "playing") state.mode = "paused";
    else if (state.mode === "paused") state.mode = "playing";
  }

  // Quick controls (optional)
  if (input.consumeRestart && input.consumeRestart()) restartLevel();
  if (input.consumeNext && input.consumeNext()) nextLevel();

  // tick timer only while playing
  if (state.mode === "playing") state.timeMs += dt * 1000;

  const session = levels.getSession();
  const world = session?.world;
  const ball = session?.ball;
  const contacts = session?.contacts;
  const gravity = session?.gravity;

  // simulate while playing
  if (state.mode === "playing" && world && contacts) {
    // flip gravity
    if (input.consumeFlip && input.consumeFlip()) {
      gravity?.randomizeExcludingCurrent?.();
    }

    world.step(dt, 8, 3);
    contacts.flushDestroyQueue?.();

    if (contacts.won) state.mode = "won";
  }

  // Win flow once
  if (state.mode === "won" && !state.winComputed && contacts) {
    state.winComputed = true;

    const result = computeAndPersistWin({
      progress,
      levels: LEVELS,
      levelIndex: levels.getIndex(),
      levelId: LEVELS[levels.getIndex()].id,
      contacts,
      timeMs: state.timeMs,
    });

    state.winResult = result?.winResult || null;
    saveProgress(progress);
  }

  // HUD
  renderHud(hudStatus, {
    mode: state.mode,
    levelIndex: levels.getIndex(),
    levelsCount: LEVELS.length,
    timeMs: state.timeMs,
    tmxInfo: state.tmxInfo,
    gravityName: gravity?.getName?.() || "DOWN",
    ballPos: ball?.getPosition?.() || null,
    contacts,
    winResult: state.winResult,
  });

  // Overlay
  if (state.mode === "paused") {
    overlay.show({
      kind: "pause",
      title: "Paused",
      subtitle: "Resume or go back to the menu.",
      canResume: true,
      canNext: false,
      showLevels: true,
      showMenu: true,
    });
  } else if (state.mode === "won") {
    const nextUnlocked =
      levels.getIndex() + 1 < LEVELS.length
        ? isLevelUnlocked(progress, LEVELS[levels.getIndex() + 1].id)
        : false;

    const scoreTxt = state.winResult ? `${state.winResult.score}` : "";
    const ratingTxt = state.winResult ? `${state.winResult.rating}/3` : "";

    overlay.show({
      kind: "win",
      title: "Level Complete",
      subtitle: `Score ${scoreTxt} — Rating ${ratingTxt}`,
      canResume: false,
      canNext: nextUnlocked,
      showLevels: true,
      showMenu: true,
    });
  } else {
    overlay.hide();
  }
}

function render(engine) {
  if (sceneManager.getSceneName() !== "game") return;

  const session = levels.getSession();
  if (session?.world) renderWorldDebug(engine, session.world, camera);
}

const engine = createEngine({ canvas, update, render });
engine.start();
