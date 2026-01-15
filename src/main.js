// src/main.js
import { createEngine } from "./core/engine.js";
import { createCamera } from "./core/camera.js";
import { createInput } from "./core/input.js";

import { loadProgress, saveProgress, ensureLevelUnlocked, isLevelUnlocked } from "./game/progress.js";
import { createRunState } from "./game/runState.js";
import { computeAndPersistWin } from "./game/winFlow.js";

import { renderWorldDebug } from "./world/renderDebug.js";
import { createLevelManager } from "./world/level/levelManager.js";

import { createOverlayController } from "./ui/overlay.js";
import { renderHud } from "./ui/hud.js";

const canvas = document.getElementById("game");
const hudStatus = document.getElementById("hud-status");

const camera = createCamera();
const input = createInput();

// Levels list (keep it here or move later to a config file)
const LEVELS = [{ id: "map101", url: "./assets/maps/map101.tmx" }];

// Progress (localStorage)
const progress = loadProgress();
ensureLevelUnlocked(progress, LEVELS[0].id);
saveProgress(progress);

// Run state
const state = createRunState();

// Level/session manager
const levels = createLevelManager({ levels: LEVELS, progress });

// Overlay UI
const overlay = createOverlayController({
  onResume: () => {
    if (state.mode === "paused") state.mode = "playing";
  },
  onReplay: () => restartLevel(),
  onNext: () => nextLevel(),
});

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

function restartLevel() {
  const idx = levels.getIndex();
  goToLevel(idx);
}

function nextLevel() {
  const nextIdx = levels.getIndex() + 1;
  if (nextIdx < LEVELS.length && isLevelUnlocked(progress, LEVELS[nextIdx].id)) {
    goToLevel(nextIdx);
  }
}

// Start
goToLevel(0);

function update(dt) {
  // Input that can happen in any mode
  if (input.consumePause()) {
    if (state.mode === "playing") state.mode = "paused";
    else if (state.mode === "paused") state.mode = "playing";
  }
  if (input.consumeRestart()) restartLevel();
  if (input.consumeNext()) nextLevel();

  // Tick timer only while playing
  if (state.mode === "playing") state.timeMs += dt * 1000;

  const session = levels.getSession();
  const world = session?.world;
  const ball = session?.ball;
  const contacts = session?.contacts;
  const gravity = session?.gravity;

  // Simulate only while playing
  if (state.mode === "playing" && world && contacts) {
    if (!contacts.won && input.consumeFlip()) gravity.randomizeExcludingCurrent();

    world.step(dt, 8, 3);
    contacts.flushDestroyQueue();

    if (contacts.won) state.mode = "won";
  }

  // Win flow (compute + persist) once
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

    state.winResult = result.winResult;
    saveProgress(progress);
  }

  // HUD + Overlay
  const hudData = {
    mode: state.mode,
    levelIndex: levels.getIndex(),
    levelsCount: LEVELS.length,
    timeMs: state.timeMs,
    tmxInfo: state.tmxInfo,
    gravityName: gravity?.getName?.() || "DOWN",
    ballPos: ball?.getPosition?.() || null,
    contacts,
    winResult: state.winResult,
  };

  renderHud(hudStatus, hudData);

  // Overlay UI
  if (state.mode === "paused") {
    overlay.show({
      title: "Paused",
      subtitle: "Press P or Esc to resume.",
      stats: `Time ${hudData.formattedTime} — Stars ${hudData.starsText}`,
      canResume: true,
      canNext: false,
    });
  } else if (state.mode === "won") {
    const nextUnlocked =
      levels.getIndex() + 1 < LEVELS.length ? isLevelUnlocked(progress, LEVELS[levels.getIndex() + 1].id) : false;

    const scoreTxt = state.winResult ? `${state.winResult.score}` : "";
    const ratingTxt = state.winResult ? `${state.winResult.rating}/3` : "";

    overlay.show({
      title: "Level Complete",
      subtitle: `Score ${scoreTxt} — Rating ${ratingTxt}`,
      stats: `Time ${hudData.formattedTime} — Stars ${hudData.starsText}`,
      canResume: false,
      canNext: nextUnlocked,
    });
  } else {
    overlay.hide();
  }
}

function render(engine) {
  const session = levels.getSession();
  if (session?.world) renderWorldDebug(engine, session.world, camera);
}

const engine = createEngine({ canvas, update, render });
engine.start();
