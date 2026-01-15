// src/ui/overlay.js
export function createOverlayController({ onResume, onReplay, onNext }) {
  const overlay = document.getElementById("overlay");
  const titleEl = document.getElementById("overlay-title");
  const subtitleEl = document.getElementById("overlay-subtitle");
  const statsEl = document.getElementById("overlay-stats");

  const btnResume = document.getElementById("btn-resume");
  const btnReplay = document.getElementById("btn-replay");
  const btnNext = document.getElementById("btn-next");

  btnResume.addEventListener("click", () => onResume?.());
  btnReplay.addEventListener("click", () => onReplay?.());
  btnNext.addEventListener("click", () => onNext?.());

  function show({ title, subtitle, stats, canResume, canNext }) {
    titleEl.textContent = title || "";
    subtitleEl.textContent = subtitle || "";
    statsEl.textContent = stats || "";

    btnResume.disabled = !canResume;
    btnNext.disabled = !canNext;

    overlay.classList.remove("hidden");
  }

  function hide() {
    overlay.classList.add("hidden");
  }

  return { show, hide };
}
