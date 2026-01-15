// src/main.js
import { createEngine } from "./game/engine.js";
import { createCamera } from "./game/camera.js";
import { pl, createWorld, createBall } from "./game/physics.js";
import { renderWorldDebug } from "./game/renderDebug.js";
import { createInput } from "./game/input.js";
import { loadTMX } from "./game/tmx.js";
import { buildLevelFromTMX } from "./game/level.js";
import { createContactSystem } from "./game/contacts.js";

const canvas = document.getElementById("game");
const hudStatus = document.getElementById("hud-status");

const camera = createCamera();
const input = createInput();

const world = createWorld();
const ball = createBall(world, 160, 120, 18);
const contacts = createContactSystem(world);

let tmxInfo = "TMX: not loaded";

loadTMX("./assets/maps/map101.tmx")
  .then((map) => {
    const objectLayers = map.layers.filter((l) => l.type === "objectgroup");
    const objectsCount = objectLayers.reduce((acc, l) => acc + l.objects.length, 0);

    // Build physics level from TMX objects
    const built = buildLevelFromTMX(world, map, ball);
    contacts.won = false;
    contacts.starsCollected = 0;
    contacts.starsTotal = built.starsTotal;

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

// Gravity state (4-way, random excluding current)
const GRAVITY_MAG = 9.8;

const GRAVITY_DIRS = [
  { name: "DOWN",  v: () => pl.Vec2(0,  GRAVITY_MAG) },
  { name: "UP",    v: () => pl.Vec2(0, -GRAVITY_MAG) },
  { name: "RIGHT", v: () => pl.Vec2( GRAVITY_MAG, 0) },
  { name: "LEFT",  v: () => pl.Vec2(-GRAVITY_MAG, 0) },
];

let gravityIndex = 0; // start DOWN by default

function applyGravity() {
  world.setGravity(GRAVITY_DIRS[gravityIndex].v());

  // Wake up dynamic bodies so the change takes effect immediately
  for (let b = world.getBodyList(); b; b = b.getNext()) {
    if (!b.isStatic()) b.setAwake(true);
  }
}

function randomizeGravityDirection() {
  // pick any direction except the current one
  let next = gravityIndex;
  while (next === gravityIndex) {
    next = Math.floor(Math.random() * GRAVITY_DIRS.length);
  }
  gravityIndex = next;
  applyGravity();
}

// initial gravity
applyGravity();

function update(dt) {
  if (!contacts.won && input.consumeFlip()) {
    randomizeGravityDirection(); // tu función 4-way random
  }

  world.step(dt, 8, 3);
  contacts.flushDestroyQueue();

  const p = ball.getPosition();
  const gDir = GRAVITY_DIRS[gravityIndex].name;

  const stars = `${contacts.starsCollected}/${contacts.starsTotal}`;
  const winText = contacts.won ? " — ✅ WIN!" : "";

  hudStatus.textContent =
    `Running — Gravity ${gDir} — stars ${stars}${winText} — ball y=${p.y.toFixed(2)}m — dt ${(dt * 1000).toFixed(1)}ms | ${tmxInfo}`;
}

function render(engine) {
  renderWorldDebug(engine, world, camera);
}

const engine = createEngine({ canvas, update, render });
engine.start();
