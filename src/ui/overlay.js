// src/ui/overlay.js

export function createOverlayController({ onResume, onReplay, onNext, onLevels, onMenu }) {
  const root = document.getElementById("overlay");
  const titleEl = document.getElementById("overlay-title");
  const subtitleEl = document.getElementById("overlay-subtitle");

  const btnResume = document.getElementById("btn-resume");
  const btnReplay = document.getElementById("btn-replay");
  const btnNext = document.getElementById("btn-next");
  const btnLevels = document.getElementById("btn-levels");
  const btnMenu = document.getElementById("btn-menu");

  function setVisible(el, v) {
    if (!el) return;
    el.classList.toggle("hidden", !v);
  }

  function setDisabled(el, d) {
    if (!el) return;
    el.disabled = !!d;
  }

  // Attach listeners once
  btnResume?.addEventListener("click", () => onResume?.());
  btnReplay?.addEventListener("click", () => onReplay?.());
  btnNext?.addEventListener("click", () => onNext?.());
  btnLevels?.addEventListener("click", () => onLevels?.());
  btnMenu?.addEventListener("click", () => onMenu?.());

  function show({
    kind = "pause", // "pause" | "win"
    title = "",
    subtitle = "",
    canResume = false,
    canNext = false,
    showLevels = true,
    showMenu = true,
  } = {}) {
    if (!root) return;

    if (titleEl) titleEl.textContent = title;
    if (subtitleEl) subtitleEl.textContent = subtitle;

    root.classList.remove("hidden");

    // Buttons
    setVisible(btnResume, !!canResume);
    setVisible(btnReplay, true);
    setVisible(btnNext, kind === "win");
    setVisible(btnLevels, !!showLevels);
    setVisible(btnMenu, !!showMenu);

    setDisabled(btnResume, !canResume);
    setDisabled(btnNext, !canNext);
  }

  function hide() {
    if (!root) return;
    root.classList.add("hidden");
  }

  return { show, hide };
}
