// src/world/level/levelManager.js
import { loadTMX } from "./tmx.js";
import { buildLevelFromTMX } from "./level.js";
import { createSession } from "../../game/session.js";
import { isLevelUnlocked } from "../../game/progress.js";

export function createLevelManager({ levels, progress }) {
  let index = 0;
  let session = null;

  async function load(targetIndex) {
    index = Math.max(0, Math.min(targetIndex, levels.length - 1));
    if (!isLevelUnlocked(progress, levels[index].id)) index = 0;

    session = createSession({ gravityMagnitude: 9.8 });

    const level = levels[index];
    const map = await loadTMX(level.url);

    const objectLayers = map.layers.filter((l) => l.type === "objectgroup");
    const objectsCount = objectLayers.reduce((acc, l) => acc + l.objects.length, 0);

    const built = buildLevelFromTMX(session.world, map, session.ball);
    session.contacts.reset(built.starsTotal);

    return {
      tmxInfo: `TMX: ${level.id} — layers=${map.layers.length} — objects=${objectsCount}`,
    };
  }

  return {
    getIndex: () => index,
    getLevel: () => levels[index],
    getSession: () => session,
    load,
  };
}
