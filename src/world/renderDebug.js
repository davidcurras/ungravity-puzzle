// src/world/renderDebug.js
import { mToPx, pl } from "./physics/physics.js";

export function renderWorldDebug(engine, world, camera) {
  const { ctx, viewW, viewH } = engine;

  // Background inside the virtual viewport
  ctx.fillStyle = "#0b1020";
  ctx.fillRect(0, 0, viewW, viewH);

  drawAxes(ctx, camera, viewW, viewH);

  for (let body = world.getBodyList(); body; body = body.getNext()) {
    const userData = body.getUserData() || {};
    const isStatic = body.isStatic();

    const stroke = isStatic ? "rgba(255,255,255,0.22)" : "rgba(106,167,255,0.9)";
    const fill = isStatic ? "rgba(255,255,255,0.06)" : "rgba(106,167,255,0.18)";

    for (let fixture = body.getFixtureList(); fixture; fixture = fixture.getNext()) {
      const shape = fixture.getShape();
      const type = shape.getType();

      const isSensor = fixture.isSensor();
      const sensorStroke = "rgba(114, 255, 190, 0.9)";
      const sensorFill = "rgba(114, 255, 190, 0.12)";

      if (type === "circle") {
        drawCircle(ctx, body, shape, camera, isSensor ? sensorStroke : stroke, isSensor ? sensorFill : fill);
      } else if (type === "polygon") {
        drawPolygon(ctx, body, shape, camera, isSensor ? sensorStroke : stroke, isSensor ? sensorFill : fill);
      }
    }

    if (userData.type) {
      const p = body.getPosition();
      const sx = mToPx(p.x - camera.x);
      const sy = mToPx(p.y - camera.y);
      ctx.fillStyle = "rgba(215,226,255,0.7)";
      ctx.font = "12px system-ui, -apple-system, Segoe UI, Roboto, Arial";
      ctx.fillText(userData.type, sx + 6, sy - 6);
    }
  }
}

function drawAxes(ctx, camera, viewW, viewH) {
  const ox = mToPx(0 - camera.x);
  const oy = mToPx(0 - camera.y);

  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.beginPath();
  ctx.moveTo(0, oy);
  ctx.lineTo(viewW, oy);
  ctx.moveTo(ox, 0);
  ctx.lineTo(ox, viewH);
  ctx.stroke();
}

function drawCircle(ctx, body, circleShape, camera, strokeStyle, fillStyle) {
  const bodyPos = body.getPosition();
  const bodyAngle = body.getAngle();

  const localCenter = circleShape.m_p;
  const worldCenter = pl.Vec2(
    bodyPos.x + (localCenter.x * Math.cos(bodyAngle) - localCenter.y * Math.sin(bodyAngle)),
    bodyPos.y + (localCenter.x * Math.sin(bodyAngle) + localCenter.y * Math.cos(bodyAngle))
  );

  const x = mToPx(worldCenter.x - camera.x);
  const y = mToPx(worldCenter.y - camera.y);
  const r = mToPx(circleShape.m_radius);

  ctx.fillStyle = fillStyle;
  ctx.strokeStyle = strokeStyle;
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  const dx = Math.cos(bodyAngle) * r;
  const dy = Math.sin(bodyAngle) * r;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + dx, y + dy);
  ctx.stroke();
}

function drawPolygon(ctx, body, polyShape, camera, strokeStyle, fillStyle) {
  const vertices = polyShape.m_vertices;
  const bodyPos = body.getPosition();
  const a = body.getAngle();

  ctx.fillStyle = fillStyle;
  ctx.strokeStyle = strokeStyle;
  ctx.lineWidth = 2;

  ctx.beginPath();
  for (let i = 0; i < vertices.length; i++) {
    const v = vertices[i];

    const wx = bodyPos.x + (v.x * Math.cos(a) - v.y * Math.sin(a));
    const wy = bodyPos.y + (v.x * Math.sin(a) + v.y * Math.cos(a));

    const sx = mToPx(wx - camera.x);
    const sy = mToPx(wy - camera.y);

    if (i === 0) ctx.moveTo(sx, sy);
    else ctx.lineTo(sx, sy);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}
