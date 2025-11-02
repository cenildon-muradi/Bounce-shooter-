// Breakout Shooter Game
// Mobile-optimized with touch controls

import * as debugConsole from './console.js';
import { EXTRA_LATERAL_SAFE_AREA, GRID_COLUMNS, GRID_CELL_SIZE } from './config.js';
import { isGridCellOccupied, occupyGridCell, freeGridCell } from './state.js';

// Version checking configuration
const VERSION_CHECK_INTERVAL = 2000;
let currentVersion = window.__BUILD || 'unknown';
let checkCounter = 0;

// Check for version updates
async function checkForUpdates() {
  try {
    checkCounter++;
    const res = await fetch('./version.txt', { cache: 'no-store' });
    if (!res.ok) return;
    const latestVersion = (await res.text()).trim();
    if (checkCounter % 10 === 0) {
      console.log(`✅ Version check #${checkCounter}: current=${currentVersion}, latest=${latestVersion}`);
    }
    if (latestVersion !== currentVersion) {
      console.log('🔄 New version detected!', { current: currentVersion, latest: latestVersion });
      showReloadButton();
    }
  } catch (err) {
    console.debug('Version check failed:', err.message);
  }
}

function showReloadButton() {
  const reloadBtn = document.getElementById('reload-button');
  if (reloadBtn) reloadBtn.classList.add('show');
}

function forceReload() {
  console.log('🔄 Reloading application...');
  window.location.reload(true);
}

function initVersionCheck() {
  const reloadBtn = document.getElementById('reload-button');
  if (reloadBtn) reloadBtn.addEventListener('click', forceReload);
  setInterval(checkForUpdates, VERSION_CHECK_INTERVAL);
  console.log(`👁️ Version monitoring started (checking every ${VERSION_CHECK_INTERVAL/1000}s)`);
}

// ============================================
// GAME CODE
// ============================================

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

let width, height;
let gameRunning = false;
let gameOver = false;
let gamePaused = false;
let score = 0;

// Safe area insets for iOS
let safeAreaTop = 0;
let safeAreaBottom = 0;
let safeAreaLeft = 0;
let safeAreaRight = 0;

// Get safe area insets from CSS
function updateSafeAreas() {
  const computedStyle = getComputedStyle(document.documentElement);
  safeAreaTop = parseInt(computedStyle.getPropertyValue('env(safe-area-inset-top)') || '0', 10);
  safeAreaBottom = parseInt(computedStyle.getPropertyValue('env(safe-area-inset-bottom)') || '0', 10);
  safeAreaLeft = parseInt(computedStyle.getPropertyValue('env(safe-area-inset-left)') || '0', 10);
  safeAreaRight = parseInt(computedStyle.getPropertyValue('env(safe-area-inset-right)') || '0', 10);

  // Fallback: try reading from body padding
  if (safeAreaTop === 0 && safeAreaBottom === 0) {
    const bodyStyle = getComputedStyle(document.body);
    safeAreaTop = parseInt(bodyStyle.paddingTop, 10) || 0;
    safeAreaBottom = parseInt(bodyStyle.paddingBottom, 10) || 0;
    safeAreaLeft = parseInt(bodyStyle.paddingLeft, 10) || 0;
    safeAreaRight = parseInt(bodyStyle.paddingRight, 10) || 0;
  }

  // Add extra lateral safe area
  safeAreaLeft += EXTRA_LATERAL_SAFE_AREA;
  safeAreaRight += EXTRA_LATERAL_SAFE_AREA;

  console.log(`📱 Safe areas - Top: ${safeAreaTop}px, Bottom: ${safeAreaBottom}px, Left: ${safeAreaLeft}px, Right: ${safeAreaRight}px`);
}

// Progression system
let kills = 0;
let requiredKills = 10;
let level = 1;
let showUpgradeMenu = false;

// Player upgrades
let bulletDamage = 1;
let bulletSpeedMultiplier = 1;
let maxBounces = 0; // Starts at 0 - only gets bounces from upgrades

// Game objects
const player = {
  x: 0,
  y: 0,
  width: 80,
  height: 20,
  speed: 6,
  moveLeft: false,
  moveRight: false
};

// Aiming system
let aimStartX = 0;
let aimStartY = 0;
let aimCurrentX = 0;
let aimCurrentY = 0;
let isAiming = false;

// Last known shooting direction (defaults to straight up)
let lastDirX = 0;
let lastDirY = -1;

const bullets = [];
const blocks = [];

// Game config
const BASE_BULLET_SPEED = 7;
const BULLET_WIDTH = 6;
const BULLET_HEIGHT = 6;
const BULLET_COOLDOWN = 150; // ms between shots (reduced for continuous shooting)
let lastShot = 0;

// Block sizes and HP (now cubes with size)
const BLOCK_SIZES = {
  LARGE: { size: 80, hp: 3, color: '#e74c3c' },
  MEDIUM: { size: 60, hp: 2, color: '#3498db' },
  SMALL: { size: 40, hp: 1, color: '#2ecc71' }
};

const BLOCK_SPEED = 0.4;
const BLOCK_SPAWN_INTERVAL = 4000; // ms between block spawns (doubled from 2000 for half the enemies)
let lastBlockSpawn = 0;
let currentBlockSpeed = BLOCK_SPEED;
let currentSpawnInterval = BLOCK_SPAWN_INTERVAL;

// Setup canvas size
function resizeCanvas() {
  // Update safe areas first
  updateSafeAreas();

  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();

  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;

  width = canvas.width;
  height = canvas.height;

  ctx.scale(dpr, dpr);

  // Position player at bottom center, above safe area
  player.x = (rect.width - player.width) / 2;
  player.y = rect.height - player.height - safeAreaBottom - 20;

  console.log(`Canvas resized: ${rect.width}x${rect.height} (DPR: ${dpr})`);
}

// Initialize game
function initGame() {
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  // Touch controls
  canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
  canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
  canvas.addEventListener('touchend', handleTouchEnd, { passive: false });

  // Mouse controls (for desktop testing)
  canvas.addEventListener('mousedown', handleMouseDown);
  canvas.addEventListener('mousemove', handleMouseMove);
  canvas.addEventListener('mouseup', handleMouseUp);
  canvas.addEventListener('mouseleave', handleMouseUp);

  gameRunning = true;
  gameOver = false;
  gamePaused = false;
  showUpgradeMenu = false;
  score = 0;
  kills = 0;
  requiredKills = 10;
  level = 1;
  bulletDamage = 1;
  bulletSpeedMultiplier = 1;
  maxBounces = 0; // Start with 0 bounces - must upgrade to get bounces
  bullets.length = 0;
  blocks.length = 0;
  currentBlockSpeed = BLOCK_SPEED;
  currentSpawnInterval = BLOCK_SPAWN_INTERVAL;
  isAiming = false;
  aimStartX = 0;
  aimStartY = 0;
  aimCurrentX = 0;
  aimCurrentY = 0;
  lastDirX = 0;
  lastDirY = -1; // Start shooting upward

  console.log('🎮 Game initialized!');
  console.log('📱 iOS safe areas respected - optimized for notch and home bar');
  console.log('🎯 Auto-fire ALWAYS ON! Drag to change direction - arrow always visible!');
  console.log('🔫 Bullets start with 0 bounces - disappear on first wall/enemy hit!');
  console.log('⭐ Upgrade bounce to make bullets reflect on walls and enemies');
  console.log('🧱 ALL bounces (walls + enemies) consume bullet life');
  console.log('🟥 Enemies are cubes with HP scaling: 5, 10, 15, 20...');
  console.log('📉 Fewer initial enemies - longer spawn interval (4s vs 2s)');
  console.log('💥 Realistic bounce physics - angles reflect based on collision side!');
  console.log('📊 Kill enemies to fill progress bar and level up!');
  console.log('💪 Choose upgrades: Bounce, Speed (+2%), or Damage');
  console.log('💀 Elite enemies spawn when you level up!');

  requestAnimationFrame(gameLoop);
}

// Touch handling - drag to aim
let isDragging = false;

function handleTouchStart(e) {
  // Don't interfere with upgrade menu or game over
  if (showUpgradeMenu || gameOver) return;

  e.preventDefault();
  const touch = e.touches[0];
  const rect = canvas.getBoundingClientRect();

  isAiming = true;
  aimStartX = touch.clientX - rect.left;
  aimStartY = touch.clientY - rect.top;
  aimCurrentX = aimStartX;
  aimCurrentY = aimStartY;
}

function handleTouchMove(e) {
  if (!isAiming) return;
  e.preventDefault();

  const touch = e.touches[0];
  const rect = canvas.getBoundingClientRect();

  aimCurrentX = touch.clientX - rect.left;
  aimCurrentY = touch.clientY - rect.top;
}

function handleTouchEnd(e) {
  if (!isAiming) return;
  e.preventDefault();

  // Stop aiming
  isAiming = false;
}

function handleMouseDown(e) {
  // Don't interfere with upgrade menu or game over
  if (showUpgradeMenu || gameOver) return;

  e.preventDefault();
  const rect = canvas.getBoundingClientRect();

  isAiming = true;
  aimStartX = e.clientX - rect.left;
  aimStartY = e.clientY - rect.top;
  aimCurrentX = aimStartX;
  aimCurrentY = aimStartY;
}

function handleMouseMove(e) {
  if (!isAiming) return;
  e.preventDefault();

  const rect = canvas.getBoundingClientRect();
  aimCurrentX = e.clientX - rect.left;
  aimCurrentY = e.clientY - rect.top;
}

function handleMouseUp(e) {
  if (!isAiming) return;
  e.preventDefault();

  // Stop aiming
  isAiming = false;
}

// Shoot bullet in aimed direction
function shootBulletInDirection() {
  const now = Date.now();
  if (now - lastShot < BULLET_COOLDOWN) return;

  const rect = canvas.getBoundingClientRect();
  const playerCenterX = player.x + player.width / 2;
  const playerCenterY = player.y + player.height / 2;

  let dirX = lastDirX;
  let dirY = lastDirY;

  // If currently aiming, update direction
  if (isAiming) {
    const dx = aimCurrentX - aimStartX;
    const dy = aimCurrentY - aimStartY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Only update direction if drag distance is significant
    if (distance >= 10) {
      dirX = dx / distance;
      dirY = dy / distance;

      // Remember this direction
      lastDirX = dirX;
      lastDirY = dirY;
    }
  }

  lastShot = now;
  const bulletSpeed = BASE_BULLET_SPEED * bulletSpeedMultiplier;

  // Shoot single projectile
  bullets.push({
    x: playerCenterX - BULLET_WIDTH / 2,
    y: playerCenterY - BULLET_HEIGHT / 2,
    width: BULLET_WIDTH,
    height: BULLET_HEIGHT,
    vx: dirX * bulletSpeed,
    vy: dirY * bulletSpeed,
    bounces: 0,
    damage: bulletDamage
  });
}

// === GRID HELPER FUNCTIONS ===

// Convert grid coordinates to pixel position
function gridToPixel(col, row) {
  const rect = canvas.getBoundingClientRect();
  const playAreaWidth = rect.width - safeAreaLeft - safeAreaRight;
  const columnWidth = playAreaWidth / GRID_COLUMNS;

  // Center the cell within its column
  const x = safeAreaLeft + col * columnWidth + (columnWidth - GRID_CELL_SIZE) / 2;
  const y = row * GRID_CELL_SIZE;

  return { x, y };
}

// Convert pixel position to grid coordinates
function pixelToGrid(x, y) {
  const rect = canvas.getBoundingClientRect();
  const playAreaWidth = rect.width - safeAreaLeft - safeAreaRight;
  const columnWidth = playAreaWidth / GRID_COLUMNS;

  const col = Math.floor((x - safeAreaLeft) / columnWidth);
  const row = Math.floor(y / GRID_CELL_SIZE);

  return { col, row };
}

// Find an available grid cell for spawning
function findAvailableGridCell(enemySize) {
  const rect = canvas.getBoundingClientRect();
  const cellsNeeded = Math.ceil(enemySize / GRID_CELL_SIZE);

  // Try top rows first (enemies spawn from top)
  const maxRow = 5; // Only check top 5 rows for spawning

  // Shuffle columns to randomize spawn position
  const columns = Array.from({ length: GRID_COLUMNS }, (_, i) => i);
  for (let i = columns.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [columns[i], columns[j]] = [columns[j], columns[i]];
  }

  // Find first available position
  for (let row = 0; row < maxRow; row++) {
    for (const col of columns) {
      // Check if this position and adjacent cells (if needed) are free
      let allFree = true;
      for (let dc = 0; dc < cellsNeeded && allFree; dc++) {
        for (let dr = 0; dr < cellsNeeded && allFree; dr++) {
          if (col + dc >= GRID_COLUMNS || isGridCellOccupied(row + dr, col + dc)) {
            allFree = false;
          }
        }
      }

      if (allFree) {
        return { col, row, cellsNeeded };
      }
    }
  }

  return null; // No available position
}

// Spawn a block (cube) using grid system
function spawnBlock() {
  const now = Date.now();
  if (now - lastBlockSpawn < currentSpawnInterval) return;

  lastBlockSpawn = now;

  // Start with large blocks
  const sizeConfig = BLOCK_SIZES.LARGE;
  const hp = level * 5; // HP scales with level

  // Find available grid position
  const gridPos = findAvailableGridCell(sizeConfig.size);
  if (!gridPos) {
    console.log('⚠️ No grid space available for spawning');
    return; // Grid is full, can't spawn
  }

  // Convert grid position to pixel coordinates
  const pixelPos = gridToPixel(gridPos.col, gridPos.row);

  // Mark grid cells as occupied
  for (let dc = 0; dc < gridPos.cellsNeeded; dc++) {
    for (let dr = 0; dr < gridPos.cellsNeeded; dr++) {
      occupyGridCell(gridPos.row + dr, gridPos.col + dc);
    }
  }

  blocks.push({
    x: pixelPos.x,
    y: pixelPos.y - sizeConfig.size, // Spawn above visible area
    width: sizeConfig.size,
    height: sizeConfig.size,
    color: sizeConfig.color,
    hp: hp,
    maxHp: hp,
    size: 'LARGE',
    isElite: false,
    speed: currentBlockSpeed,
    gridCol: gridPos.col,
    gridRow: gridPos.row,
    gridCells: gridPos.cellsNeeded
  });

  // At higher levels, sometimes spawn multiple blocks at once
  if (level >= 3 && Math.random() < 0.3) {
    const secondGridPos = findAvailableGridCell(sizeConfig.size);
    if (secondGridPos) {
      const secondPixelPos = gridToPixel(secondGridPos.col, secondGridPos.row);

      // Mark second block's grid cells as occupied
      for (let dc = 0; dc < secondGridPos.cellsNeeded; dc++) {
        for (let dr = 0; dr < secondGridPos.cellsNeeded; dr++) {
          occupyGridCell(secondGridPos.row + dr, secondGridPos.col + dc);
        }
      }

      blocks.push({
        x: secondPixelPos.x,
        y: secondPixelPos.y - sizeConfig.size - 100,
        width: sizeConfig.size,
        height: sizeConfig.size,
        color: sizeConfig.color,
        hp: hp,
        maxHp: hp,
        size: 'LARGE',
        isElite: false,
        speed: currentBlockSpeed,
        gridCol: secondGridPos.col,
        gridRow: secondGridPos.row,
        gridCells: secondGridPos.cellsNeeded
      });
    }
  }
}

// Spawn an elite block with extra HP using grid system
function spawnEliteBlock() {
  const baseSize = BLOCK_SIZES.LARGE;
  const eliteSize = baseSize.size + level * 10; // Grows with level
  const eliteHP = level * 10; // Elite HP: 10x level

  // Find available grid position
  const gridPos = findAvailableGridCell(eliteSize);
  if (!gridPos) {
    console.log('⚠️ No grid space available for elite spawn');
    return; // Grid is full, can't spawn
  }

  // Convert grid position to pixel coordinates
  const pixelPos = gridToPixel(gridPos.col, gridPos.row);

  // Mark grid cells as occupied
  for (let dc = 0; dc < gridPos.cellsNeeded; dc++) {
    for (let dr = 0; dr < gridPos.cellsNeeded; dr++) {
      occupyGridCell(gridPos.row + dr, gridPos.col + dc);
    }
  }

  blocks.push({
    x: pixelPos.x,
    y: pixelPos.y - eliteSize,
    width: eliteSize,
    height: eliteSize,
    color: '#9b59b6', // Purple for elite
    hp: eliteHP,
    maxHp: eliteHP,
    size: 'ELITE',
    isElite: true,
    speed: currentBlockSpeed * 0.8, // Elites move slightly slower but tankier
    gridCol: gridPos.col,
    gridRow: gridPos.row,
    gridCells: gridPos.cellsNeeded
  });

  console.log(`💀 Elite spawned! HP: ${eliteHP}, Level: ${level}`);
}

// Split block into smaller blocks using grid system
function splitBlock(block) {
  // Elite blocks don't split
  if (block.isElite) return;

  const newSize = block.size === 'LARGE' ? 'MEDIUM' : 'SMALL';
  const sizeConfig = BLOCK_SIZES[newSize];
  const splitHP = Math.ceil(block.maxHp / 2);

  // Try to place split blocks near the parent's position
  // First split block - try left/adjacent cells
  const gridPos1 = findAvailableGridCell(sizeConfig.size);
  if (gridPos1) {
    const pixelPos1 = gridToPixel(gridPos1.col, gridPos1.row);

    // Mark grid cells as occupied
    for (let dc = 0; dc < gridPos1.cellsNeeded; dc++) {
      for (let dr = 0; dr < gridPos1.cellsNeeded; dr++) {
        occupyGridCell(gridPos1.row + dr, gridPos1.col + dc);
      }
    }

    blocks.push({
      x: pixelPos1.x,
      y: block.y, // Keep same vertical position
      width: sizeConfig.size,
      height: sizeConfig.size,
      color: sizeConfig.color,
      hp: splitHP,
      maxHp: splitHP,
      size: newSize,
      isElite: false,
      speed: block.speed,
      gridCol: gridPos1.col,
      gridRow: gridPos1.row,
      gridCells: gridPos1.cellsNeeded
    });
  }

  // Second split block - try right/adjacent cells
  const gridPos2 = findAvailableGridCell(sizeConfig.size);
  if (gridPos2) {
    const pixelPos2 = gridToPixel(gridPos2.col, gridPos2.row);

    // Mark grid cells as occupied
    for (let dc = 0; dc < gridPos2.cellsNeeded; dc++) {
      for (let dr = 0; dr < gridPos2.cellsNeeded; dr++) {
        occupyGridCell(gridPos2.row + dr, gridPos2.col + dc);
      }
    }

    blocks.push({
      x: pixelPos2.x,
      y: block.y, // Keep same vertical position
      width: sizeConfig.size,
      height: sizeConfig.size,
      color: sizeConfig.color,
      hp: splitHP,
      maxHp: splitHP,
      size: newSize,
      isElite: false,
      speed: block.speed,
      gridCol: gridPos2.col,
      gridRow: gridPos2.row,
      gridCells: gridPos2.cellsNeeded
    });
  }
}

// Level up and show upgrade menu
function levelUp() {
  level++;
  requiredKills += 5;
  kills = 0;
  gamePaused = true;
  showUpgradeMenu = true;

  // Increase difficulty with each level
  // Block speed increases by 15% per level
  currentBlockSpeed = BLOCK_SPEED * (1 + (level - 1) * 0.15);

  // Spawn interval decreases by 10% per level (blocks spawn faster)
  currentSpawnInterval = Math.max(500, BLOCK_SPAWN_INTERVAL * Math.pow(0.9, level - 1));

  // Spawn elite enemy
  spawnEliteBlock();

  console.log(`🎉 Level ${level}! Next goal: ${requiredKills} kills`);
  console.log(`📈 Difficulty: Speed ${currentBlockSpeed.toFixed(2)}, Spawn interval ${currentSpawnInterval.toFixed(0)}ms`);
}

// Apply upgrade
function applyUpgrade(upgradeType) {
  if (upgradeType === 'damage') {
    bulletDamage++;
    console.log(`⚔️ Damage upgraded to ${bulletDamage}`);
  } else if (upgradeType === 'speed') {
    bulletSpeedMultiplier += 0.02;
    console.log(`⚡ Speed upgraded to ${(bulletSpeedMultiplier * 100).toFixed(0)}%`);
  } else if (upgradeType === 'bounce') {
    maxBounces++;
    console.log(`🎾 Max bounces upgraded to ${maxBounces}`);
  }

  showUpgradeMenu = false;
  gamePaused = false;
}

// Update game state
function update() {
  if (gameOver || gamePaused) return;

  const rect = canvas.getBoundingClientRect();

  // Always shoot continuously
  shootBulletInDirection();

  // Spawn blocks
  spawnBlock();

  // Update bullets
  for (let i = bullets.length - 1; i >= 0; i--) {
    const bullet = bullets[i];

    bullet.x += bullet.vx;
    bullet.y += bullet.vy;

    // Wall bouncing (left, right, top, bottom) - COUNTS as bounce
    let bounced = false;

    // Left and right walls
    if (bullet.x <= 0 || bullet.x + bullet.width >= rect.width) {
      bullet.vx = -bullet.vx;
      bullet.x = Math.max(0, Math.min(rect.width - bullet.width, bullet.x));
      bullet.bounces++;
      bounced = true;
    }

    // Top and bottom walls
    if (bullet.y <= 0 || bullet.y + bullet.height >= rect.height) {
      bullet.vy = -bullet.vy;
      bullet.y = Math.max(0, Math.min(rect.height - bullet.height, bullet.y));
      bullet.bounces++;
      bounced = true;
    }

    // Remove bullets that exceed max bounces or go off screen
    if (bullet.bounces > maxBounces) {
      bullets.splice(i, 1);
    }
  }

  // Update blocks (cubes)
  for (let i = blocks.length - 1; i >= 0; i--) {
    const block = blocks[i];
    const oldY = block.y;
    block.y += block.speed || currentBlockSpeed;

    // Free grid cells when block moves past spawn zone
    if (block.gridCells !== undefined && !block.gridFreed) {
      const spawnZoneHeight = 10 * GRID_CELL_SIZE; // Top 10 rows
      if (block.y > spawnZoneHeight) {
        for (let dc = 0; dc < block.gridCells; dc++) {
          for (let dr = 0; dr < block.gridCells; dr++) {
            freeGridCell(block.gridRow + dr, block.gridCol + dc);
          }
        }
        block.gridFreed = true; // Mark as freed to avoid freeing multiple times
      }
    }

    // Check if block reached bottom (game over)
    if (block.y > rect.height) {
      gameOver = true;
      console.log('💀 Game Over! Final score:', score);
      console.log(`📊 Reached Level ${level}, Killed ${kills + (level - 1) * (requiredKills - 5) + 10} enemies total`);
      return;
    }
  }

  // Check collisions
  for (let i = bullets.length - 1; i >= 0; i--) {
    const bullet = bullets[i];
    if (!bullet) continue;

    for (let j = blocks.length - 1; j >= 0; j--) {
      const block = blocks[j];

      if (checkCubeCollision(bullet, block)) {
        // Reduce block HP by bullet damage
        block.hp -= bullet.damage;

        // Calculate correct bounce physics based on collision side
        const bulletCenterX = bullet.x + bullet.width / 2;
        const bulletCenterY = bullet.y + bullet.height / 2;
        const blockCenterX = block.x + block.width / 2;
        const blockCenterY = block.y + block.height / 2;

        // Calculate which side was hit
        const dx = bulletCenterX - blockCenterX;
        const dy = bulletCenterY - blockCenterY;
        const width = (bullet.width + block.width) / 2;
        const height = (bullet.height + block.height) / 2;
        const crossWidth = width * dy;
        const crossHeight = height * dx;

        // Determine collision side and reflect accordingly
        if (Math.abs(dx) <= width && Math.abs(dy) <= height) {
          if (crossWidth > crossHeight) {
            if (crossWidth > -crossHeight) {
              // Bottom collision
              bullet.vy = Math.abs(bullet.vy);
            } else {
              // Left collision
              bullet.vx = -Math.abs(bullet.vx);
            }
          } else {
            if (crossWidth > -crossHeight) {
              // Right collision
              bullet.vx = Math.abs(bullet.vx);
            } else {
              // Top collision
              bullet.vy = -Math.abs(bullet.vy);
            }
          }
        }

        bullet.bounces++;

        // If block HP is 0
        if (block.hp <= 0) {
          // Free grid cells occupied by this block
          if (block.gridCells !== undefined) {
            for (let dc = 0; dc < block.gridCells; dc++) {
              for (let dr = 0; dr < block.gridCells; dr++) {
                freeGridCell(block.gridRow + dr, block.gridCol + dc);
              }
            }
          }

          // Remove block
          blocks.splice(j, 1);

          // Only count kills for blocks that don't split
          const countsAsKill = block.size === 'SMALL' || block.isElite;

          if (countsAsKill) {
            kills++;
            console.log(`💥 Kill! ${kills}/${requiredKills}`);

            // Check for level up
            if (kills >= requiredKills) {
              levelUp();
            }
          }

          // Split into smaller blocks if not SMALL and not ELITE
          if (block.size !== 'SMALL' && !block.isElite) {
            splitBlock(block);
          }

          // Award points
          if (block.isElite) {
            score += 100;
          } else {
            score += block.size === 'LARGE' ? 30 : block.size === 'MEDIUM' ? 20 : 10;
          }
        }

        // Remove bullet if max bounces exceeded
        if (bullet.bounces > maxBounces) {
          bullets.splice(i, 1);
        }

        break;
      }
    }
  }
}

// Cube (AABB) collision detection
function checkCubeCollision(bullet, block) {
  return bullet.x < block.x + block.width &&
         bullet.x + bullet.width > block.x &&
         bullet.y < block.y + block.height &&
         bullet.y + bullet.height > block.y;
}

// Render game
function render() {
  const rect = canvas.getBoundingClientRect();

  // Clear canvas
  ctx.clearRect(0, 0, rect.width, rect.height);

  // Draw player (platform/cube)
  ctx.fillStyle = '#3498db';
  ctx.fillRect(player.x, player.y, player.width, player.height);

  // Platform top highlight
  ctx.fillStyle = '#5dade2';
  ctx.fillRect(player.x, player.y, player.width, player.height / 3);

  // Platform border
  ctx.strokeStyle = '#2980b9';
  ctx.lineWidth = 2;
  ctx.strokeRect(player.x, player.y, player.width, player.height);

  // Draw bullets as circles
  bullets.forEach(bullet => {
    const radius = bullet.width / 2;
    ctx.fillStyle = '#f39c12';
    ctx.beginPath();
    ctx.arc(bullet.x + radius, bullet.y + radius, radius, 0, Math.PI * 2);
    ctx.fill();

    // Bullet glow
    ctx.strokeStyle = '#f1c40f';
    ctx.lineWidth = 2;
    ctx.stroke();
  });

  // Draw blocks (cubes)
  blocks.forEach(block => {
    // Draw cube (rectangle)
    ctx.fillStyle = block.color;
    ctx.fillRect(block.x, block.y, block.width, block.height);

    // Elite glow effect
    if (block.isElite) {
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 5;
      ctx.strokeRect(block.x, block.y, block.width, block.height);
      ctx.strokeStyle = block.color;
      ctx.lineWidth = 3;
      ctx.strokeRect(block.x, block.y, block.width, block.height);
    } else {
      // Cube border
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 3;
      ctx.strokeRect(block.x, block.y, block.width, block.height);
    }

    // Draw HP number
    const centerX = block.x + block.width / 2;
    const centerY = block.y + block.height / 2;
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.min(block.width, block.height) * 0.4}px system-ui`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(block.hp, centerX, centerY);
  });

  // Draw aiming indicator (always visible)
  if (!gameOver && !gamePaused) {
    const playerCenterX = player.x + player.width / 2;
    const playerCenterY = player.y + player.height / 2;

    // Use last known direction
    const dirX = lastDirX;
    const dirY = lastDirY;

    // Smaller arrow size (30% of original)
    const lineLength = 75;
    const endX = playerCenterX + dirX * lineLength;
    const endY = playerCenterY + dirY * lineLength;

    // Draw arrow line (thinner)
    ctx.strokeStyle = '#f39c12';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(playerCenterX, playerCenterY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw smaller arrow head
    const arrowSize = 8;
    const angle = Math.atan2(dirY, dirX);
    ctx.fillStyle = '#f39c12';
    ctx.beginPath();
    ctx.moveTo(endX, endY);
    ctx.lineTo(
      endX - arrowSize * Math.cos(angle - Math.PI / 6),
      endY - arrowSize * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      endX - arrowSize * Math.cos(angle + Math.PI / 6),
      endY - arrowSize * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fill();
  }

  // Draw progress bar at top (below safe area)
  const barHeight = 30;
  const barPadding = 10;
  const barWidth = rect.width - barPadding * 2;
  const barY = safeAreaTop + 10;

  // Background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(barPadding, barY, barWidth, barHeight);

  // Progress fill
  const progress = kills / requiredKills;
  ctx.fillStyle = '#2ecc71';
  ctx.fillRect(barPadding, barY, barWidth * progress, barHeight);

  // Border
  ctx.strokeStyle = '#ecf0f1';
  ctx.lineWidth = 2;
  ctx.strokeRect(barPadding, barY, barWidth, barHeight);

  // Text
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 16px system-ui';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${kills}/${requiredKills} - Level ${level}`, rect.width / 2, barY + barHeight / 2);

  // Draw score (below progress bar)
  ctx.fillStyle = '#ecf0f1';
  ctx.font = 'bold 20px system-ui';
  ctx.textAlign = 'left';
  ctx.fillText(`Score: ${score}`, 20, barY + barHeight + 30);

  // Draw upgrade menu
  if (showUpgradeMenu) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Center menu content vertically considering safe areas
    const menuTopMargin = safeAreaTop + 80;

    ctx.fillStyle = '#f39c12';
    ctx.font = 'bold 36px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(`LEVEL ${level}!`, rect.width / 2, menuTopMargin);

    ctx.fillStyle = '#ecf0f1';
    ctx.font = '20px system-ui';
    ctx.fillText('Choose an upgrade:', rect.width / 2, menuTopMargin + 50);

    // Draw upgrade buttons
    const buttonWidth = Math.min(250, rect.width - 40);
    const buttonHeight = 70;
    const buttonX = rect.width / 2 - buttonWidth / 2;
    const startY = menuTopMargin + 100;
    const spacing = 90;

    const upgrades = [
      { type: 'bounce', label: '🎾 +1 Bounce', desc: `Current: ${maxBounces} bounces` },
      { type: 'speed', label: '⚡ +2% Speed', desc: `Current: ${(bulletSpeedMultiplier * 100).toFixed(0)}%` },
      { type: 'damage', label: '⚔️ +1 Damage', desc: `Current: ${bulletDamage}` }
    ];

    upgrades.forEach((upgrade, i) => {
      const y = startY + i * spacing;

      // Button background
      ctx.fillStyle = '#2c3e50';
      ctx.fillRect(buttonX, y, buttonWidth, buttonHeight);

      // Button border
      ctx.strokeStyle = '#3498db';
      ctx.lineWidth = 3;
      ctx.strokeRect(buttonX, y, buttonWidth, buttonHeight);

      // Button text
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 20px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(upgrade.label, rect.width / 2, y + 25);

      ctx.fillStyle = '#bdc3c7';
      ctx.font = '16px system-ui';
      ctx.fillText(upgrade.desc, rect.width / 2, y + 50);

      // Store button position for click detection
      upgrade.bounds = { x: buttonX, y, width: buttonWidth, height: buttonHeight };
    });

    // Store upgrades for click handler
    canvas.upgradeButtons = upgrades;
  }

  // Draw game over
  if (gameOver) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Center vertically considering safe areas
    const centerY = (rect.height + safeAreaTop - safeAreaBottom) / 2;

    ctx.fillStyle = '#e74c3c';
    ctx.font = 'bold 48px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', rect.width / 2, centerY - 40);

    ctx.fillStyle = '#ecf0f1';
    ctx.font = 'bold 32px system-ui';
    ctx.fillText(`Final Score: ${score}`, rect.width / 2, centerY + 20);

    ctx.font = '20px system-ui';
    ctx.fillText('Tap to restart', rect.width / 2, centerY + 80);
  }
}

// Game loop
function gameLoop() {
  if (!gameRunning) return;

  update();
  render();

  requestAnimationFrame(gameLoop);
}

// Handle clicks for game over restart and upgrade menu
canvas.addEventListener('click', (e) => {
  if (gameOver) {
    initGame();
    return;
  }

  // Handle upgrade menu clicks
  if (showUpgradeMenu && canvas.upgradeButtons) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    canvas.upgradeButtons.forEach(upgrade => {
      const b = upgrade.bounds;
      if (x >= b.x && x <= b.x + b.width && y >= b.y && y <= b.y + b.height) {
        applyUpgrade(upgrade.type);
      }
    });
  }
});

// Handle touch for upgrade menu (mobile)
canvas.addEventListener('touchstart', (e) => {
  if (showUpgradeMenu && canvas.upgradeButtons) {
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    canvas.upgradeButtons.forEach(upgrade => {
      const b = upgrade.bounds;
      if (x >= b.x && x <= b.x + b.width && y >= b.y && y <= b.y + b.height) {
        applyUpgrade(upgrade.type);
        e.preventDefault();
      }
    });
  }
}, { passive: false });

// ============================================
// INITIALIZATION
// ============================================

function init() {
  debugConsole.init();

  console.log('🚀 Breakout Shooter loaded!');
  console.log('📦 Build version:', currentVersion);

  initVersionCheck();
  initGame();
}

// Run initialization when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

export { init };
