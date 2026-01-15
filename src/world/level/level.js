// src/world/level/level.js
import { pl, pxToM } from "../physics/physics.js";

/**
 * Builds physics bodies from TMX object layers.
 * Primary convention (recommended):
 * - object.properties.kind = "wall" | "goal" | "star" | "spawn"
 *
 * Fallback convention:
 * - by name/type prefix:
 *   wall, goal, star, goodball / spawn
 */
export function buildLevelFromTMX(world, tmxMap, ballBody) {
  clearLevelBodies(world);

  const objects = collectObjects(tmxMap);

  // 1) Spawn ball
  const spawn = objects.find((o) => getKind(o) === "spawn");
  if (spawn && spawn.width && spawn.height) {
    const cx = spawn.x + spawn.width / 2;
    const cy = spawn.y + spawn.height / 2;
    ballBody.setTransform(pl.Vec2(pxToM(cx), pxToM(cy)), 0);
    ballBody.setLinearVelocity(pl.Vec2(0, 0));
    ballBody.setAngularVelocity(0);
    ballBody.setAwake(true);
  }

  // 2) Walls
  for (const o of objects) {
    if (getKind(o) !== "wall") continue;
    if (!o.width || !o.height) continue;

    const body = world.createBody({
      position: pl.Vec2(pxToM(o.x + o.width / 2), pxToM(o.y + o.height / 2)),
      angle: degToRad(o.rotation || 0),
    });

    body.createFixture(pl.Box(pxToM(o.width / 2), pxToM(o.height / 2)), {
      friction: 0.35,
      restitution: 0.15,
    });

    body.setUserData({ type: "wall", level: true, tmxId: o.id, name: o.name });
  }

  // 3) Goal (sensor)
  for (const o of objects) {
    if (getKind(o) !== "goal") continue;
    if (!o.width || !o.height) continue;

    const body = world.createBody({
      position: pl.Vec2(pxToM(o.x + o.width / 2), pxToM(o.y + o.height / 2)),
      angle: degToRad(o.rotation || 0),
    });

    body.createFixture(pl.Box(pxToM(o.width / 2), pxToM(o.height / 2)), {
      isSensor: true,
    });

    body.setUserData({ type: "goal", level: true, tmxId: o.id, name: o.name });
  }

  // 4) Stars (sensor)
  let starsTotal = 0;
  for (const o of objects) {
    if (getKind(o) !== "star") continue;
    if (!o.width || !o.height) continue;

    const body = world.createBody({
      position: pl.Vec2(pxToM(o.x + o.width / 2), pxToM(o.y + o.height / 2)),
      angle: degToRad(o.rotation || 0),
    });

    body.createFixture(pl.Box(pxToM(o.width / 2), pxToM(o.height / 2)), {
      isSensor: true,
    });

    body.setUserData({ type: "star", level: true, tmxId: o.id, name: o.name });
    starsTotal++;
  }

  return { objectsCount: objects.length, starsTotal };
}

function collectObjects(tmxMap) {
  const objs = [];
  for (const layer of tmxMap.layers || []) {
    if (layer.type !== "objectgroup") continue;
    for (const o of layer.objects || []) objs.push(o);
  }
  return objs;
}

function clearLevelBodies(world) {
  for (let b = world.getBodyList(); b; ) {
    const next = b.getNext();
    const ud = b.getUserData() || {};
    if (ud.level === true) world.destroyBody(b);
    b = next;
  }
}

function getKind(o) {
  // Priority: TMX custom property
  const kindProp = o?.properties?.kind;
  if (kindProp) return String(kindProp).toLowerCase();

  // Fallback: name/type prefixes
  if (startsWithAny(o.name, ["wall"]) || startsWithAny(o.type, ["wall"])) return "wall";
  if (startsWithAny(o.name, ["goal"]) || startsWithAny(o.type, ["goal"])) return "goal";
  if (startsWithAny(o.name, ["star"]) || startsWithAny(o.type, ["star"])) return "star";
  if (startsWithAny(o.name, ["goodball", "spawn"]) || startsWithAny(o.type, ["goodball", "spawn"])) return "spawn";

  return "";
}

function startsWithAny(str, prefixes) {
  if (!str) return false;
  const s = String(str).toLowerCase();
  return prefixes.some((p) => s.startsWith(p));
}

function degToRad(deg) {
  return (deg * Math.PI) / 180;
}