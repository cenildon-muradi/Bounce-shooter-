/**
 * GAME STATE
 * All mutable game state variables
 * Import these when you need to read/modify game state
 */

import { BLOCK_SPEED, BLOCK_SPAWN_INTERVAL, INITIAL_REQUIRED_KILLS } from './config.js';

// === CANVAS & DIMENSIONS ===
export let width = 0;
export let height = 0;

export function setDimensions(w, h) {
  width = w;
  height = h;
}

// === GAME STATUS ===
export let gameRunning = false;
export let gameOver = false;
export let gamePaused = false;

export function setGameRunning(value) { gameRunning = value; }
export function setGameOver(value) { gameOver = value; }
export function setGamePaused(value) { gamePaused = value; }

// === SAFE AREAS (iOS notch/bar) ===
export let safeAreaTop = 0;
export let safeAreaBottom = 0;
export let safeAreaLeft = 0;
export let safeAreaRight = 0;

export function setSafeAreas(top, bottom, left, right) {
  safeAreaTop = top;
  safeAreaBottom = bottom;
  safeAreaLeft = left;
  safeAreaRight = right;
}

// === PROGRESSION ===
export let score = 0;
export let kills = 0;
export let requiredKills = INITIAL_REQUIRED_KILLS;
export let level = 1;
export let showUpgradeMenu = false;

export function setScore(value) { score = value; }
export function addScore(value) { score += value; }
export function setKills(value) { kills = value; }
export function incrementKills() { kills++; }
export function setRequiredKills(value) { requiredKills = value; }
export function setLevel(value) { level = value; }
export function setShowUpgradeMenu(value) { showUpgradeMenu = value; }

// === PLAYER UPGRADES ===
export let bulletDamage = 1;
export let bulletSpeedMultiplier = 1;
export let maxBounces = 0; // Starts at 0

export function setBulletDamage(value) { bulletDamage = value; }
export function setBulletSpeedMultiplier(value) { bulletSpeedMultiplier = value; }
export function setMaxBounces(value) { maxBounces = value; }

export function incrementBulletDamage() { bulletDamage++; }
export function incrementMaxBounces() { maxBounces++; }
export function addSpeedMultiplier(value) { bulletSpeedMultiplier += value; }

// === PLAYER OBJECT ===
export const player = {
  x: 0,
  y: 0,
  width: 80,
  height: 20,
  speed: 6,
  moveLeft: false,
  moveRight: false
};

// === AIMING SYSTEM ===
export let aimStartX = 0;
export let aimStartY = 0;
export let aimCurrentX = 0;
export let aimCurrentY = 0;
export let isAiming = false;
export let lastDirX = 0;      // Last shooting direction
export let lastDirY = -1;     // Defaults to up

export function setAimStart(x, y) {
  aimStartX = x;
  aimStartY = y;
}

export function setAimCurrent(x, y) {
  aimCurrentX = x;
  aimCurrentY = y;
}

export function setIsAiming(value) {
  isAiming = value;
}

export function setLastDirection(x, y) {
  lastDirX = x;
  lastDirY = y;
}

// === GAME OBJECTS (Arrays) ===
export const bullets = [];
export const blocks = [];

export function clearBullets() {
  bullets.length = 0;
}

export function clearBlocks() {
  blocks.length = 0;
}

// === TIMING ===
export let lastShot = 0;
export let lastBlockSpawn = 0;

export function setLastShot(value) { lastShot = value; }
export function setLastBlockSpawn(value) { lastBlockSpawn = value; }

// === DIFFICULTY (changes with level) ===
export let currentBlockSpeed = BLOCK_SPEED;
export let currentSpawnInterval = BLOCK_SPAWN_INTERVAL;

export function setCurrentBlockSpeed(value) { currentBlockSpeed = value; }
export function setCurrentSpawnInterval(value) { currentSpawnInterval = value; }

// === GRID SYSTEM ===
export const gridOccupied = new Set(); // Tracks occupied grid cells as "row,col" strings

export function isGridCellOccupied(row, col) {
  return gridOccupied.has(`${row},${col}`);
}

export function occupyGridCell(row, col) {
  gridOccupied.add(`${row},${col}`);
}

export function freeGridCell(row, col) {
  gridOccupied.delete(`${row},${col}`);
}

export function clearGrid() {
  gridOccupied.clear();
}

// === RESET FUNCTION ===
export function resetGameState() {
  gameRunning = true;
  gameOver = false;
  gamePaused = false;
  showUpgradeMenu = false;
  score = 0;
  kills = 0;
  requiredKills = INITIAL_REQUIRED_KILLS;
  level = 1;
  bulletDamage = 1;
  bulletSpeedMultiplier = 1;
  maxBounces = 0;
  clearBullets();
  clearBlocks();
  clearGrid();
  currentBlockSpeed = BLOCK_SPEED;
  currentSpawnInterval = BLOCK_SPAWN_INTERVAL;
  isAiming = false;
  aimStartX = 0;
  aimStartY = 0;
  aimCurrentX = 0;
  aimCurrentY = 0;
  lastDirX = 0;
  lastDirY = -1;
  lastShot = 0;
  lastBlockSpawn = 0;
}

// === GETTER HELPERS (for read-only access) ===
export function getState() {
  return {
    width,
    height,
    gameRunning,
    gameOver,
    gamePaused,
    score,
    kills,
    requiredKills,
    level,
    showUpgradeMenu,
    bulletDamage,
    bulletSpeedMultiplier,
    maxBounces,
    safeAreaTop,
    safeAreaBottom,
    safeAreaLeft,
    safeAreaRight
  };
}
