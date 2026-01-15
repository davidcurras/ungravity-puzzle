// src/game/session.js
import { createWorld, createBall } from "../world/physics/physics.js";
import { createContactSystem } from "../world/physics/contacts.js";
import { createGravityController } from "../world/physics/gravity.js";

export function createSession({ gravityMagnitude = 9.8 } = {}) {
  const world = createWorld();
  const ball = createBall(world, 160, 120, 18);
  const contacts = createContactSystem(world);
  const gravity = createGravityController(world, { magnitude: gravityMagnitude });

  gravity.apply();

  return { world, ball, contacts, gravity };
}
