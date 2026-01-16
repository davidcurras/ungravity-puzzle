# ungravity-native

A lightweight, browser-first remake of **ungravity** (2013): a gravity-flip maze puzzle where you guide floating colored balls to the goal.

## Goals
- **100% front-end**: runs in the browser, no backend required.
- **Native web stack**: HTML + CSS + JavaScript (ES Modules).
- **Physics + TMX**: Planck.js (Box2D) + Tiled TMX levels.
- **Simple deployment**: works on GitHub Pages.

## Local Development

Because the project loads assets via `fetch()`, you must run it from a local web server (not `file://`).

### Option A — Python (recommended)
```bash
python3 -m http.server 8080

## Play

https://davidcurras.github.io/ungravity-puzzle