// src/main.js
import { createEngine } from "./game/engine.js";
import { createCamera } from "./game/camera.js";
import { pl, createWorld, createBall } from "./game/physics.js";
import { renderWorldDebug } from "./game/renderDebug.js";
import { createInput } from "./game/input.js";
import { loadTMX } from "./game/tmx.js";
import { buildLevelFromTMX } from "./game/level.js";

const canvas = document.getElementById("game");
const hudStatus = document.getElementById("hud-status");

const camera = createCamera();
const input = createInput();

const world = createWorld();
const ball = createBall(world, 160, 120, 18);

let tmxInfo = "TMX: not loaded";

loadTMX("./assets/maps/map101.tmx")
  .then((map) => {
    const objectLayers = map.layers.filter((l) => l.type === "objectgroup");
    const objectsCount = objectLayers.reduce((acc, l) => acc + l.objects.length, 0);

    // Build physics level from TMX objects
    const built = buildLevelFromTMX(world, map, ball);

    tmxInfo = `TMX loaded — ${map.width}x${map.height} tiles @ ${map.tilewidth}x${map.tileheight}px — ${objectLayers.length} object layers — ${objectsCount} objects — built ${built.objectsCount}`;
    console.log("TMX MAP:", map);
  })
  .catch((err) => {
    tmxInfo = `TMX error — ${err.message}`;
    console.error(err);
  });


/* // Static floor
const floor = world.createBody({ position: pl.Vec2(0, 22) });
floor.createFixture(pl.Box(40, 0.5), { friction: 0.4 });
floor.setUserData({ type: "floor" });
*/

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
    `Running — Gravity ${gDir} — ball y=${p.y.toFixed(2)}m — dt ${(dt * 1000).toFixed(1)}ms | ${tmxInfo}`;
}

function render(engine) {
  renderWorldDebug(engine, world, camera);
}

const engine = createEngine({ canvas, update, render });
engine.start();
