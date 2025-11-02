/**
 * GAME CONFIGURATION
 * All game constants and settings in one place
 * Change values here to adjust game balance
 */

// === BULLET/PROJECTILE SETTINGS ===
export const BASE_BULLET_SPEED = 7;
export const BULLET_WIDTH = 6;
export const BULLET_HEIGHT = 6;
export const BULLET_COOLDOWN = 150; // ms between shots

// === ENEMY/BLOCK SETTINGS ===
export const BLOCK_SIZES = {
  LARGE: { size: 80, hp: 3, color: '#e74c3c' },  // Red
  MEDIUM: { size: 60, hp: 2, color: '#3498db' }, // Blue
  SMALL: { size: 40, hp: 1, color: '#2ecc71' }   // Green
};

export const BLOCK_SPEED = 0.4;
export const BLOCK_SPAWN_INTERVAL = 4000; // ms between spawns (4s = half of original 2s)

// === PLAYER SETTINGS ===
export const PLAYER_WIDTH = 80;
export const PLAYER_HEIGHT = 20;
export const PLAYER_SPEED = 6;

// === PROGRESSION SETTINGS ===
export const INITIAL_REQUIRED_KILLS = 10;
export const KILLS_INCREMENT_PER_LEVEL = 5; // Each level adds 5 to required kills

// === UPGRADE SETTINGS ===
export const SPEED_UPGRADE_INCREMENT = 0.02; // +2% per upgrade
export const DAMAGE_UPGRADE_INCREMENT = 1;   // +1 damage per upgrade
export const BOUNCE_UPGRADE_INCREMENT = 1;   // +1 bounce per upgrade

// === HP SCALING ===
export const NORMAL_ENEMY_HP_MULTIPLIER = 5;  // HP = level * 5
export const ELITE_ENEMY_HP_MULTIPLIER = 10;  // HP = level * 10
export const ELITE_SIZE_GROWTH = 10;          // Elite size grows by level * 10

// === DIFFICULTY SCALING ===
export const SPEED_INCREASE_PER_LEVEL = 0.15;  // 15% speed increase per level
export const SPAWN_INTERVAL_DECREASE = 0.9;    // 10% faster spawns per level (multiply by 0.9)
export const MIN_SPAWN_INTERVAL = 500;         // Minimum spawn interval (ms)

// === UI/RENDERING SETTINGS ===
export const AIM_ARROW_LENGTH = 75;
export const AIM_ARROW_SIZE = 8;
export const AIM_ARROW_LINE_WIDTH = 2;
export const AIM_ARROW_DASH = [5, 5];
export const AIM_ARROW_COLOR = '#f39c12';

export const PROGRESS_BAR_HEIGHT = 30;
export const PROGRESS_BAR_PADDING = 10;
export const PROGRESS_BAR_COLOR = '#2ecc71';

// === SAFE AREA SETTINGS ===
export const EXTRA_LATERAL_SAFE_AREA = 50; // Additional lateral padding

// === GRID SYSTEM ===
export const GRID_COLUMNS = 8; // Horizontal divisions
export const GRID_CELL_SIZE = 40; // Size of smallest enemy (SMALL)

// === VERSION CHECK ===
export const VERSION_CHECK_INTERVAL = 2000; // ms between version checks

// === SCORING ===
export const SCORE_SMALL = 10;
export const SCORE_MEDIUM = 20;
export const SCORE_LARGE = 30;
export const SCORE_ELITE = 100;

// === GAME BALANCE NOTES ===
/**
 * Current balance (as of last update):
 * - Auto-fire always on
 * - Bullets start with 0 bounces (must upgrade)
 * - Enemy spawn: every 4 seconds (reduced from 2s)
 * - HP scaling: Normal=level*5, Elite=level*10
 * - Bounce system: all bounces (walls + enemies) consume life
 * - Physics: realistic cube collision with proper reflection angles
 */
