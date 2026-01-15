// src/game/contacts.js

export function createContactSystem(world) {
  const state = {
    won: false,
    starsCollected: 0,
    starsTotal: 0,
    destroyQueue: [],
  };

  world.on("begin-contact", (contact) => {
    const fa = contact.getFixtureA();
    const fb = contact.getFixtureB();

    const ba = fa.getBody();
    const bb = fb.getBody();

    const a = ba.getUserData() || {};
    const b = bb.getUserData() || {};

    // We only care about ball touching other things
    const isBallA = a.type === "ball";
    const isBallB = b.type === "ball";
    if (!isBallA && !isBallB) return;

    const otherBody = isBallA ? bb : ba;
    const otherData = isBallA ? b : a;

    if (otherData.type === "goal") {
      state.won = true;
      return;
    }

    if (otherData.type === "star") {
      // Avoid double-collect
      if (otherBody._collected) return;
      otherBody._collected = true;

      state.starsCollected += 1;
      state.destroyQueue.push(otherBody);
      return;
    }
  });

  state.flushDestroyQueue = () => {
    while (state.destroyQueue.length) {
      const body = state.destroyQueue.pop();
      // Make sure it still exists
      try {
        world.destroyBody(body);
      } catch {
        // ignore if already destroyed
      }
    }
  };

  return state;
}