// src/game/physics.js
import planck from "https://esm.sh/planck-js@0.3.0";

export const pl = planck;
export const SCALE = 30; // pixels per meter (Box2D-style)

// Create a simple physics world
export function createWorld() {
  return new pl.World({
    gravity: pl.Vec2(0, 9.8), // down
  });
}

// Helper conversions
export function pxToM(px) {
  return px / SCALE;
}
export function mToPx(m) {
  return m * SCALE;
}

// Create a dynamic ball body
export function createBall(world, xPx, yPx, radiusPx) {
  const body = world.createDynamicBody({
    position: pl.Vec2(pxToM(xPx), pxToM(yPx)),
    linearDamping: 0.05,
    angularDamping: 0.2,
  });

  body.createFixture(pl.Circle(pxToM(radiusPx)), {
    density: 1.0,
    friction: 0.2,
    restitution: 0.2,
  });

  body.setUserData({ type: "ball" });
  return body;
}