// src/ui/overlay.js

export function createOverlayController({ onResume, onReplay, onNext, onLevels, onMenu }) {
  const root = document.getElementById("overlay");

  // Scope everything to the overlay root to avoid collisions with duplicated IDs in other screens
  const titleEl = root?.querySelector("#overlay-title");
  const subtitleEl = root?.querySelector("#overlay-subtitle");

  const btnResume = root?.querySelector("#btn-resume");
  const btnReplay = root?.querySelector("#btn-replay");
  const btnNext = root?.querySelector("#btn-next");
  const btnLevels = root?.querySelector("#btn-levels");
  const btnMenu = root?.querySelector("#btn-menu");

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

    root.classList.remove("hidden");
    if (titleEl) titleEl.textContent = title;
    if (subtitleEl) subtitleEl.textContent = subtitle;

    // Labels
    if (btnResume) btnResume.textContent = "Resume";
    if (btnReplay) btnReplay.textContent = kind === "win" ? "Play Again" : "Restart";
    if (btnNext) btnNext.textContent = "Next Level";
    if (btnLevels) btnLevels.textContent = "Level Select";
    if (btnMenu) btnMenu.textContent = "Main Menu";

    // Visibility
    setVisible(btnResume, kind === "pause");
    setVisible(btnNext, kind === "win");
    setVisible(btnReplay, true);
    setVisible(btnLevels, !!showLevels);
    setVisible(btnMenu, !!showMenu);

    // Enabled states
    setDisabled(btnResume, !canResume);
    setDisabled(btnNext, !canNext);
  }

  function hide() {
    if (!root) return;
    root.classList.add("hidden");
  }

  return { show, hide };
}
