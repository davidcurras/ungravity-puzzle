// src/main.js
import { createEngine } from "./game/engine.js";
import { createCamera, worldToScreen } from "./game/camera.js";

const canvas = document.getElementById("game");
const hudStatus = document.getElementById("hud-status");

const camera = createCamera();

// Demo “world” object (placeholder)
const world = {
  ball: { x: 120, y: 120, r: 18, vx: 40, vy: 0 },
};

function update(dt, engine) {
  // Simple placeholder motion to validate dt
  const b = world.ball;
  b.x += b.vx * dt;
  if (b.x > engine.width - b.r || b.x < b.r) b.vx *= -1;

  hudStatus.textContent = `Running — dt ${(dt * 1000).toFixed(1)} ms`;
}

function render(engine) {
  const { ctx, width, height } = engine;

  // Background
  ctx.fillStyle = "#0b1020";
  ctx.fillRect(0, 0, width, height);

  // Example using camera transform (world->screen)
  const b = world.ball;
  const p = worldToScreen(camera, b.x, b.y);

  ctx.fillStyle = "#6aa7ff";
  ctx.beginPath();
  ctx.arc(p.x, p.y, b.r * camera.zoom, 0, Math.PI * 2);
  ctx.fill();
}

const engine = createEngine({ canvas, update, render });
engine.start();