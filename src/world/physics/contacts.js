// src/world/physics/contacts.js

const REQUIRED_RATIO = 0.3;

export function createContactSystem(world) {
  const collectedBodies = new Set();

  const state = {
    won: false,
    starsCollected: 0,
    starsTotal: 0,
    requiredStars: 0,
    destroyQueue: [],
  };

  world.on("begin-contact", (contact) => {
    const fa = contact.getFixtureA();
    const fb = contact.getFixtureB();

    const ba = fa.getBody();
    const bb = fb.getBody();

    const a = ba.getUserData() || {};
    const b = bb.getUserData() || {};

    const isBallA = a.type === "ball";
    const isBallB = b.type === "ball";
    if (!isBallA && !isBallB) return;

    const otherBody = isBallA ? bb : ba;
    const otherData = isBallA ? b : a;

    if (otherData.type === "goal") {
      // ✅ gate: only win if enough stars
      if (state.starsCollected >= state.requiredStars) {
        state.won = true;
      }
      return;
    }

    if (otherData.type === "star") {
      if (collectedBodies.has(otherBody)) return;
      collectedBodies.add(otherBody);

      try {
        const prev = otherBody.getUserData() || {};
        otherBody.setUserData({ ...prev, collected: true });
      } catch {
        // ignore
      }

      state.starsCollected += 1;
      state.destroyQueue.push(otherBody);
      return;
    }
  });

  state.flushDestroyQueue = () => {
    while (state.destroyQueue.length) {
      const body = state.destroyQueue.pop();
      try {
        world.destroyBody(body);
      } catch {
        // ignore
      }
    }
  };

  state.isGoalEnabled = () => state.starsCollected >= state.requiredStars;

  state.reset = (starsTotal = 0) => {
    state.won = false;
    state.starsCollected = 0;
    state.starsTotal = starsTotal;
    state.requiredStars = Math.ceil(starsTotal * REQUIRED_RATIO);
    state.destroyQueue.length = 0;
    collectedBodies.clear();
  };

  return state;
}
