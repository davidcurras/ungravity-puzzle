// src/main.js
import { createEngine } from "./game/engine.js";
import { createCamera } from "./game/camera.js";
import { pl, createWorld, createBall } from "./game/physics.js";
import { renderWorldDebug } from "./game/renderDebug.js";
import { createInput } from "./game/input.js";

const canvas = document.getElementById("game");
const hudStatus = document.getElementById("hud-status");

const camera = createCamera();
const input = createInput();

const world = createWorld();
const ball = createBall(world, 160, 120, 18);

// Static floor
const floor = world.createBody({ position: pl.Vec2(0, 22) });
floor.createFixture(pl.Box(40, 0.5), { friction: 0.4 });
floor.setUserData({ type: "floor" });

// Gravity state
let gravityY = 9.8;
world.setGravity(pl.Vec2(0, gravityY));

function flipGravity() {
  gravityY *= -1;
  world.setGravity(pl.Vec2(0, gravityY));

  // Wake up every dynamic body so gravity change takes effect immediately
  for (let b = world.getBodyList(); b; b = b.getNext()) {
    if (!b.isStatic()) b.setAwake(true);
  }
}

function update(dt) {
  if (input.consumeFlip()) {
    flipGravity();
  }

  world.step(dt, 8, 3);

  const p = ball.getPosition();
  const gDir = gravityY > 0 ? "DOWN" : "UP";
  hudStatus.textContent =
    `Running — Gravity ${gDir} — ball y=${p.y.toFixed(2)}m — dt ${(dt * 1000).toFixed(1)}ms`;
}

function render(engine) {
  renderWorldDebug(engine, world, camera);
}

const engine = createEngine({ canvas, update, render });
engine.start();
