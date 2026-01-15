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

// --- Fixed timestep (stable physics) ---
const FIXED_STEP = 1 / 60;      // 60 Hz physics
const MAX_ACCUM = 0.25;         // clamp to avoid spiral of death
const MAX_STEPS_PER_FRAME = 6;  // cap substeps
let accumulator = 0;

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

// --- Back button handling (Browser Back) ---
function setupBackNavigation({ go, sceneManager, overlay, state }) {
  // Push an initial state so Back triggers popstate inside the app first
  if (!history.state || !history.state.__ungravity) {
    history.replaceState({ __ungravity: true, page: "boot" }, "");
  }
  history.pushState({ __ungravity: true, page: "app" }, "");

  window.addEventListener("popstate", () => {
    const scene = sceneManager.getSceneName?.() || sceneManager.getScene?.() || "";

    // 1) If an overlay is open, close it first (treat back like "close modal")
    // If you don't have a "isVisible", you can just hide defensively.
    overlay?.hide?.();

    // 2) If playing, go back to menu (or levels)
    if (scene === "game") {
      // if you want "back" to pause instead of menu, change this
      state.mode = "paused"; // optional
      go("menu");
    } else if (scene === "levels" || scene === "credits") {
      go("menu");
    } else {
      // already in menu: allow leaving site on next back
      // don't re-push state here
      return;
    }

    // Re-push so user needs a second Back to actually leave the site
    history.pushState({ __ungravity: true, page: "app" }, "");
  });
}

// --- Gameplay helpers ---
async function goToLevel(index) {
  state.resetForLevel();
  state.mode = "loading";
  accumulator = 0;

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

  // Pause toggle (avoid toggling during loading)
  if (state.mode !== "loading" && input.consumePause()) {
    if (state.mode === "playing") state.mode = "paused";
    else if (state.mode === "paused") state.mode = "playing";
  }

  // Quick controls (optional)
  if (input.consumeRestart()) restartLevel();
  if (input.consumeNext()) nextLevel();

  const session = levels.getSession();
  const world = session?.world;
  const ball = session?.ball;
  const contacts = session?.contacts;
  const gravity = session?.gravity;

  // tick timer only while playing (real time, not physics time)
  if (state.mode === "playing") state.timeMs += dt * 1000;

  // simulate while playing (fixed timestep)
  if (state.mode === "playing" && world && contacts) {
    // flip gravity (once per frame)
    if (input.consumeFlip()) {
      gravity?.randomizeExcludingCurrent?.();
    }

    accumulator = Math.min(accumulator + dt, MAX_ACCUM);

    let steps = 0;
    while (accumulator >= FIXED_STEP && steps < MAX_STEPS_PER_FRAME) {
      world.step(FIXED_STEP, 8, 3);
      contacts.flushDestroyQueue?.();

      if (contacts.won) {
        state.mode = "won";
        break;
      }

      accumulator -= FIXED_STEP;
      steps++;
    }

    // if we hit the cap, drop the remainder to keep the game responsive
    if (steps >= MAX_STEPS_PER_FRAME) accumulator = 0;
  }

  // Win flow once
  if (state.mode === "won" && !state.winComputed && contacts) {
    state.winComputed = true;

    const idx = levels.getIndex();
    const result = computeAndPersistWin({
      progress,
      levels: LEVELS,
      levelIndex: idx,
      levelId: LEVELS[idx].id,
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

setupBackNavigation({ go, sceneManager, overlay, state });

const engine = createEngine({ canvas, update, render });
engine.start();
