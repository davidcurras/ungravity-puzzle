// src/game/engine.js
export function createEngine({ canvas, update, render }) {
  const ctx = canvas.getContext("2d", { alpha: false });

  const engine = {
    canvas,
    ctx,
    width: 0,
    height: 0,
    dpr: 1,
    running: false,
    lastTs: 0,
    maxDt: 1 / 20, // clamp to avoid huge jumps when tab is inactive
  };

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    engine.dpr = dpr;
    engine.width = window.innerWidth;
    engine.height = window.innerHeight;

    canvas.width = Math.floor(engine.width * dpr);
    canvas.height = Math.floor(engine.height * dpr);

    // Draw in CSS pixels
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function frame(ts) {
    if (!engine.running) return;

    const dt = Math.min((ts - engine.lastTs) / 1000 || 0, engine.maxDt);
    engine.lastTs = ts;

    update(dt, engine);
    render(engine);

    requestAnimationFrame(frame);
  }

  engine.start = () => {
    if (engine.running) return;
    engine.running = true;
    resize();
    engine.lastTs = performance.now();
    requestAnimationFrame(frame);
  };

  engine.stop = () => {
    engine.running = false;
  };

  engine.resize = resize;

  window.addEventListener("resize", resize);

  return engine;
}