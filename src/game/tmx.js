// src/game/tmx.js

export async function loadTMX(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load TMX: ${url} (${res.status})`);
  const xmlText = await res.text();

  const doc = new DOMParser().parseFromString(xmlText, "text/xml");
  const parserError = doc.querySelector("parsererror");
  if (parserError) throw new Error(`TMX parse error: ${parserError.textContent}`);

  return parseTMX(doc);
}

export function parseTMX(doc) {
  const mapEl = doc.querySelector("map");
  if (!mapEl) throw new Error("Invalid TMX: missing <map>");

  const map = {
    width: num(mapEl.getAttribute("width")),
    height: num(mapEl.getAttribute("height")),
    tilewidth: num(mapEl.getAttribute("tilewidth")),
    tileheight: num(mapEl.getAttribute("tileheight")),
    orientation: mapEl.getAttribute("orientation") || "orthogonal",
    renderorder: mapEl.getAttribute("renderorder") || "",
    infinite: mapEl.getAttribute("infinite") === "1",
    layers: [],
  };

  // Only parse objectgroups for now (what we need for walls/spawns/goals)
  const objectGroups = Array.from(doc.querySelectorAll("objectgroup"));
  for (const og of objectGroups) {
    const layer = {
      type: "objectgroup",
      name: og.getAttribute("name") || "Objects",
      objects: [],
    };

    const objects = Array.from(og.querySelectorAll("object"));
    for (const obj of objects) {
      layer.objects.push(parseObject(obj));
    }

    map.layers.push(layer);
  }

  return map;
}

function parseObject(objEl) {
  const o = {
    id: num(objEl.getAttribute("id")),
    name: objEl.getAttribute("name") || "",
    type: objEl.getAttribute("type") || "",
    x: num(objEl.getAttribute("x")),
    y: num(objEl.getAttribute("y")),
    width: num(objEl.getAttribute("width")),
    height: num(objEl.getAttribute("height")),
    rotation: num(objEl.getAttribute("rotation")),
    properties: {},
  };

  // Tiled stores ellipse/polygon/polyline/point as child tags if present
  o.shape = "rect";
  if (objEl.querySelector("ellipse")) o.shape = "ellipse";
  if (objEl.querySelector("point")) o.shape = "point";

  const poly = objEl.querySelector("polygon");
  if (poly) {
    o.shape = "polygon";
    o.points = parsePoints(poly.getAttribute("points") || "");
  }

  const pline = objEl.querySelector("polyline");
  if (pline) {
    o.shape = "polyline";
    o.points = parsePoints(pline.getAttribute("points") || "");
  }

  // Custom properties (Tiled)
  const props = objEl.querySelectorAll("properties > property");
  for (const p of props) {
    const key = p.getAttribute("name");
    const val = p.getAttribute("value") ?? p.textContent ?? "";
    if (key) o.properties[key] = val;
  }

  return o;
}

function parsePoints(pointsStr) {
  // "0,0 16,0 16,16 0,16"
  return pointsStr
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((pair) => {
      const [x, y] = pair.split(",").map(Number);
      return { x, y };
    });
}

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}