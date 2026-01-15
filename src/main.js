// src/main.js
import { createEngine } from "./game/engine.js";
import { createCamera } from "./game/camera.js";
import { pl, createWorld, createBall, mToPx } from "./game/physics.js";

const canvas = document.getElementById("game");
const hudStatus = document.getElementById("hud-status");

const camera = createCamera();

// Planck world + one ball
const world = createWorld();
const ball = createBall(world, 160, 120, 18);

// Static floor (so the ball doesn't fall forever)
const floor = world.createBody({
  position: pl.Vec2(0, 22), // meters
});
floor.createFixture(pl.Box(40, 0.5), { friction: 0.4 });
floor.setUserData({ type: "floor" });

function update(dt) {
  world.step(dt, 8, 3);
  const p = ball.getPosition();
  hudStatus.textContent = `Running — ball y=${p.y.toFixed(2)}m — dt ${(dt * 1000).toFixed(1)}ms`;
}

function render(engine) {
  const { ctx, width, height } = engine;

  ctx.fillStyle = "#0b1020";
  ctx.fillRect(0, 0, width, height);

  // Draw floor line approx
  ctx.strokeStyle = "rgba(255,255,255,0.15)";
  ctx.beginPath();
  ctx.moveTo(0, mToPx(22));
  ctx.lineTo(width, mToPx(22));
  ctx.stroke();

  // Draw ball
  const pos = ball.getPosition();
  const x = mToPx(pos.x - camera.x);
  const y = mToPx(pos.y - camera.y);

  ctx.fillStyle = "#6aa7ff";
  ctx.beginPath();
  ctx.arc(x, y, 18, 0, Math.PI * 2);
  ctx.fill();
}

const engine = createEngine({ canvas, update, render });
engine.start();
