// src/main.js
import { createEngine } from "./game/engine.js";
import { createCamera } from "./game/camera.js";
import { pl, createWorld, createBall } from "./game/physics.js";
import { renderWorldDebug } from "./game/renderDebug.js";

const canvas = document.getElementById("game");
const hudStatus = document.getElementById("hud-status");

const camera = createCamera();

const world = createWorld();
const ball = createBall(world, 160, 120, 18);

// Static floor
const floor = world.createBody({ position: pl.Vec2(0, 22) });
floor.createFixture(pl.Box(40, 0.5), { friction: 0.4 });
floor.setUserData({ type: "floor" });

function update(dt) {
  world.step(dt, 8, 3);
  const p = ball.getPosition();
  hudStatus.textContent = `Running — ball y=${p.y.toFixed(2)}m — dt ${(dt * 1000).toFixed(1)}ms`;
}

function render(engine) {
  renderWorldDebug(engine, world, camera);
}

const engine = createEngine({ canvas, update, render });
engine.start();
