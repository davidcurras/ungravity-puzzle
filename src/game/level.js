// src/game/level.js
import { pl, pxToM } from "./physics.js";

/**
 * Builds physics bodies from TMX object layers.
 * Convention (by name prefix):
 * - wall*  => static box
 * - goal*  => static sensor box
 * - goodball* / spawn* => ball start position (top-left + size -> center)
 */
export function buildLevelFromTMX(world, tmxMap, ballBody) {
  // Cleanup previous level bodies (keep ball)
  clearLevelBodies(world, ballBody);

  const objects = collectObjects(tmxMap);

  // 1) Find spawn for the ball
  const spawn = objects.find((o) => startsWithAny(o.name, ["goodball", "spawn"]) || startsWithAny(o.type, ["goodball", "spawn"]));
  if (spawn) {
    const { cx, cy } = tmxRectCenterPx(spawn);
    ballBody.setTransform(pl.Vec2(pxToM(cx), pxToM(cy)), 0);
    ballBody.setLinearVelocity(pl.Vec2(0, 0));
    ballBody.setAngularVelocity(0);
    ballBody.setAwake(true);
  }

  // 2) Create walls
  for (const o of objects) {
    const isWall = startsWithAny(o.name, ["wall"]) || startsWithAny(o.type, ["wall"]);
    if (!isWall) continue;
    if (!o.width || !o.height) continue;

    const body = world.createBody({
      position: pl.Vec2(pxToM(o.x + o.width / 2), pxToM(o.y + o.height / 2)),
      angle: degToRad(o.rotation || 0),
    });

    body.createFixture(pl.Box(pxToM(o.width / 2), pxToM(o.height / 2)), {
      friction: 0.3,
      resstitution: 0.2
    });

    body.setUserData({ type: "wall", tmxId: o.id, name: o.name });
  }

  // 3) Create goal (sensor)
  for (const o of objects) {
    const isGoal = startsWithAny(o.name, ["goal"]) || startsWithAny(o.type, ["goal"]);
    if (!isGoal) continue;
    if (!o.width || !o.height) continue;

    const body = world.createBody({
      position: pl.Vec2(pxToM(o.x + o.width / 2), pxToM(o.y + o.height / 2)),
      angle: degToRad(o.rotation || 0),
    });

    body.createFixture(pl.Box(pxToM(o.width / 2), pxToM(o.height / 2)), {
      isSensor: true,
    });

    body.setUserData({ type: "goal", tmxId: o.id, name: o.name });
  }

  return { objectsCount: objects.length };
}

function collectObjects(tmxMap) {
  const objs = [];
  for (const layer of tmxMap.layers || []) {
    if (layer.type !== "objectgroup") continue;
    for (const o of layer.objects || []) objs.push(o);
  }
  return objs;
}

function clearLevelBodies(world, ballBody) {
  for (let b = world.getBodyList(); b; ) {
    const next = b.getNext();
    if (b !== ballBody) world.destroyBody(b);
    b = next;
  }
}

function tmxRectCenterPx(o) {
  return { cx: o.x + o.width / 2, cy: o.y + o.height / 2 };
}

function startsWithAny(str, prefixes) {
  if (!str) return false;
  const s = String(str).toLowerCase();
  return prefixes.some((p) => s.startsWith(p));
}

function degToRad(deg) {
  return (deg * Math.PI) / 180;
}