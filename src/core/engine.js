// src/core/engine.js
export function createEngine({ canvas, update, render }) {
  const ctx = canvas.getContext("2d", { alpha: false });

  const engine = {
    canvas,
    ctx,

    // Physical canvas size (CSS pixels)
    width: 0,
    height: 0,

    // Render viewport (virtual resolution)
    viewW: 1280,
    viewH: 720,
    scale: 1,
    offsetX: 0,
    offsetY: 0,

    dpr: 1,
    running: false,
    lastTs: 0,
    maxDt: 1 / 20,
  };

  function getViewportSize() {
    // Better on mobile (accounts for dynamic browser UI)
    const vv = window.visualViewport;
    const w = vv ? vv.width : window.innerWidth;
    const h = vv ? vv.height : window.innerHeight;
    return { w: Math.floor(w), h: Math.floor(h) };
  }

  function resize() {
    const { w, h } = getViewportSize();

    // cap DPR so TV/retina doesn't create giant render buffers
    const rawDpr = window.devicePixelRatio || 1;
    const dpr = Math.min(2, rawDpr);

    engine.dpr = dpr;
    engine.width = w;
    engine.height = h;

    // Fit virtual resolution into screen (letterbox)
    const sx = w / engine.viewW;
    const sy = h / engine.viewH;
    engine.scale = Math.min(sx, sy);

    // Center the letterboxed area
    engine.offsetX = Math.floor((w - engine.viewW * engine.scale) * 0.5);
    engine.offsetY = Math.floor((h - engine.viewH * engine.scale) * 0.5);

    // Physical canvas size in device pixels
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);

    // Set transform so drawing happens in "virtual pixels"
    // (0,0) top-left of the letterboxed area
    ctx.setTransform(
      dpr * engine.scale, 0,
      0, dpr * engine.scale,
      engine.offsetX * dpr, engine.offsetY * dpr
    );

    // You can clear using virtual size: engine.viewW / engine.viewH
  }

  function clearLetterbox() {
    // Clear full physical canvas (including bars)
    ctx.setTransform(engine.dpr, 0, 0, engine.dpr, 0, 0);
    ctx.fillStyle = "#0b1020";
    ctx.fillRect(0, 0, engine.width, engine.height);

    // Restore virtual transform
    ctx.setTransform(
      engine.dpr * engine.scale, 0,
      0, engine.dpr * engine.scale,
      engine.offsetX * engine.dpr, engine.offsetY * engine.dpr
    );
  }

  function frame(ts) {
    if (!engine.running) return;

    const dt = Math.min((ts - engine.lastTs) / 1000 || 0, engine.maxDt);
    engine.lastTs = ts;

    update(dt, engine);
    clearLetterbox();
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
  window.visualViewport?.addEventListener("resize", resize);

  return engine;
}
