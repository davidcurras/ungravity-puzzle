// src/config.js

// Gameplay tuning knobs (keep this file small and boring).

// Minimum ratio of collectibles required to enable the goal.
export const REQUIRED_STAR_RATIO = 0.30;

// Physics stepping (fixed timestep for stability).
export const FIXED_PHYSICS_DT = 1 / 60;
export const MAX_PHYSICS_SUBSTEPS = 5;
