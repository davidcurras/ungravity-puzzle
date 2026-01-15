// src/world/physics/gravity.js
import { pl } from "./physics.js";

export function createGravityController(world, { magnitude = 9.8 } = {}) {
  const dirs = [
    { name: "DOWN", vec: () => pl.Vec2(0, magnitude) },
    { name: "UP", vec: () => pl.Vec2(0, -magnitude) },
    { name: "RIGHT", vec: () => pl.Vec2(magnitude, 0) },
    { name: "LEFT", vec: () => pl.Vec2(-magnitude, 0) },
  ];

  let index = 0;

  function wakeDynamics() {
    for (let b = world.getBodyList(); b; b = b.getNext()) {
      if (!b.isStatic()) b.setAwake(true);
    }
  }

  function apply() {
    world.setGravity(dirs[index].vec());
    wakeDynamics();
  }

  function randomizeExcludingCurrent() {
    let next = index;
    while (next === index) next = Math.floor(Math.random() * dirs.length);
    index = next;
    apply();
  }

  function getName() {
    return dirs[index].name;
  }

  return { apply, randomizeExcludingCurrent, getName };
}
