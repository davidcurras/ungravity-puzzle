// src/game/sceneManager.js

/**
 * Minimal scene manager:
 * - Controls which DOM "screen" is visible
 * - Delegates update/render only for the active scene
 *
 * Scenes:
 * - "menu"
 * - "levels"
 * - "credits"
 * - "game"
 */
export function createSceneManager({ screens }) {
  const state = {
    current: "menu",
    payload: null,
    scene: null, // object with optional update(dt), render(engine), onEnter(payload), onExit()
  };

  function hideAllScreens() {
    Object.values(screens).forEach((el) => el.classList.add("hidden"));
  }

  function showScreen(name) {
    hideAllScreens();
    const el = screens[name];
    if (el) el.classList.remove("hidden");
  }

  function setScene(name, payload = null, sceneObj = null) {
    if (state.scene?.onExit) state.scene.onExit();

    state.current = name;
    state.payload = payload;
    state.scene = sceneObj;

    // Show DOM screens for non-game scenes
    if (name === "menu" || name === "levels" || name === "credits") {
      showScreen(name);
    } else {
      // "game" scene: hide all DOM screens
      hideAllScreens();
    }

    if (state.scene?.onEnter) state.scene.onEnter(payload);
  }

  function update(dt) {
    state.scene?.update?.(dt);
  }

  function render(engine) {
    state.scene?.render?.(engine);
  }

  function getSceneName() {
    return state.current;
  }

  return {
    setScene,
    update,
    render,
    getSceneName,
    showScreen, // handy for later
  };
}
