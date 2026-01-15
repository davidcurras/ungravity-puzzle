const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d", { alpha: false });

function resize() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.floor(window.innerWidth * dpr);
  canvas.height = Math.floor(window.innerHeight * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // draw in CSS pixels
}
window.addEventListener("resize", resize);
resize();

function loop() {
  // fondo
  ctx.fillStyle = "#0b1020";
  ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

  // placeholder
  ctx.fillStyle = "#6aa7ff";
  ctx.beginPath();
  ctx.arc(120, 120, 18, 0, Math.PI * 2);
  ctx.fill();

  requestAnimationFrame(loop);
}
loop();

document.getElementById("hud").textContent = "Ungravity Puzzle";