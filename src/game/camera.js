// src/game/camera.js
export function createCamera() {
  return {
    x: 0,
    y: 0,
    zoom: 1,
  };
}

export function worldToScreen(cam, wx, wy) {
  return {
    x: (wx - cam.x) * cam.zoom,
    y: (wy - cam.y) * cam.zoom,
  };
}

export function screenToWorld(cam, sx, sy) {
  return {
    x: sx / cam.zoom + cam.x,
    y: sy / cam.zoom + cam.y,
  };
}