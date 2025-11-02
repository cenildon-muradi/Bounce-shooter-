// Breakout Shooter Game
// Mobile-optimized with touch controls

import * as debugConsole from './console.js';

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
let score = 0;

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

const bullets = [];
const blocks = [];

// Game config
const BULLET_SPEED = 7;
const BULLET_WIDTH = 6;
const BULLET_HEIGHT = 6;
const BULLET_COOLDOWN = 300; // ms between shots
const MAX_BOUNCES = 3;
let lastShot = 0;

// Block sizes and HP (now circles with radius)
const BLOCK_SIZES = {
  LARGE: { radius: 40, hp: 3, color: '#e74c3c' },
  MEDIUM: { radius: 30, hp: 2, color: '#3498db' },
  SMALL: { radius: 20, hp: 1, color: '#2ecc71' }
};

const BLOCK_SPEED = 0.4;
const BLOCK_SPAWN_INTERVAL = 2000; // ms between block spawns
let lastBlockSpawn = 0;

// Setup canvas size
function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();

  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;

  width = canvas.width;
  height = canvas.height;

  ctx.scale(dpr, dpr);

  // Position player at bottom center
  player.x = (rect.width - player.width) / 2;
  player.y = rect.height - player.height - 20;

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
  score = 0;
  bullets.length = 0;
  blocks.length = 0;

  console.log('🎮 Game initialized!');
  console.log('📱 Drag to move platform - follows your finger!');
  console.log('🔫 Auto-shoots bullets that ricochet up to 3 times');
  console.log('⚫ Circles: Large (HP:3) → Medium (HP:2) → Small (HP:1)');
  console.log('💥 Random ricochet angles off circles!');

  requestAnimationFrame(gameLoop);
}

// Touch handling - drag to move
let isDragging = false;

function handleTouchStart(e) {
  e.preventDefault();
  isDragging = true;
  const touch = e.touches[0];
  const rect = canvas.getBoundingClientRect();
  updatePlayerPosition(touch.clientX - rect.left);
}

function handleTouchMove(e) {
  e.preventDefault();
  if (!isDragging) return;
  const touch = e.touches[0];
  const rect = canvas.getBoundingClientRect();
  updatePlayerPosition(touch.clientX - rect.left);
}

function handleTouchEnd(e) {
  e.preventDefault();
  isDragging = false;
}

function handleMouseDown(e) {
  e.preventDefault();
  isDragging = true;
  const rect = canvas.getBoundingClientRect();
  updatePlayerPosition(e.clientX - rect.left);
}

function handleMouseMove(e) {
  e.preventDefault();
  if (!isDragging) return;
  const rect = canvas.getBoundingClientRect();
  updatePlayerPosition(e.clientX - rect.left);
}

function handleMouseUp(e) {
  e.preventDefault();
  isDragging = false;
}

function updatePlayerPosition(x) {
  const rect = canvas.getBoundingClientRect();
  // Center player on touch position
  player.x = x - player.width / 2;
  // Keep player within bounds
  player.x = Math.max(0, Math.min(rect.width - player.width, player.x));
}

// Spawn a bullet
function shootBullet() {
  const now = Date.now();
  if (now - lastShot < BULLET_COOLDOWN) return;

  lastShot = now;
  bullets.push({
    x: player.x + player.width / 2 - BULLET_WIDTH / 2,
    y: player.y,
    width: BULLET_WIDTH,
    height: BULLET_HEIGHT,
    vx: 0, // horizontal velocity
    vy: -BULLET_SPEED, // vertical velocity (up)
    bounces: 0
  });
}

// Spawn a block (circle)
function spawnBlock() {
  const now = Date.now();
  if (now - lastBlockSpawn < BLOCK_SPAWN_INTERVAL) return;

  lastBlockSpawn = now;
  const rect = canvas.getBoundingClientRect();

  // Start with large blocks
  const size = BLOCK_SIZES.LARGE;
  const margin = size.radius;
  const maxX = rect.width - margin * 2;

  blocks.push({
    x: margin + Math.random() * maxX,
    y: -size.radius,
    radius: size.radius,
    color: size.color,
    hp: size.hp,
    maxHp: size.hp,
    size: 'LARGE'
  });
}

// Split block into smaller blocks
function splitBlock(block) {
  const newSize = block.size === 'LARGE' ? 'MEDIUM' : 'SMALL';
  const sizeConfig = BLOCK_SIZES[newSize];

  // Create two smaller circles at slight offset
  const offset = sizeConfig.radius;

  blocks.push({
    x: block.x - offset,
    y: block.y,
    radius: sizeConfig.radius,
    color: sizeConfig.color,
    hp: sizeConfig.hp,
    maxHp: sizeConfig.hp,
    size: newSize
  });

  blocks.push({
    x: block.x + offset,
    y: block.y,
    radius: sizeConfig.radius,
    color: sizeConfig.color,
    hp: sizeConfig.hp,
    maxHp: sizeConfig.hp,
    size: newSize
  });
}

// Update game state
function update() {
  if (gameOver) return;

  const rect = canvas.getBoundingClientRect();

  // Player is controlled by drag, no need to update here

  // Auto-shoot
  shootBullet();

  // Spawn blocks
  spawnBlock();

  // Update bullets
  for (let i = bullets.length - 1; i >= 0; i--) {
    const bullet = bullets[i];

    bullet.x += bullet.vx;
    bullet.y += bullet.vy;

    // Wall bouncing (left and right)
    if (bullet.x <= 0 || bullet.x + bullet.width >= rect.width) {
      bullet.vx = -bullet.vx;
      bullet.x = Math.max(0, Math.min(rect.width - bullet.width, bullet.x));
      bullet.bounces++;
    }

    // Remove bullets that exceed max bounces or go off screen top/bottom
    if (bullet.bounces > MAX_BOUNCES || bullet.y + bullet.height < 0 || bullet.y > rect.height) {
      bullets.splice(i, 1);
    }
  }

  // Update blocks (circles)
  for (let i = blocks.length - 1; i >= 0; i--) {
    blocks[i].y += BLOCK_SPEED;

    // Check if block reached bottom (game over)
    if (blocks[i].y - blocks[i].radius > rect.height) {
      gameOver = true;
      console.log('💀 Game Over! Final score:', score);
      return;
    }
  }

  // Check collisions
  for (let i = bullets.length - 1; i >= 0; i--) {
    const bullet = bullets[i];
    if (!bullet) continue;

    for (let j = blocks.length - 1; j >= 0; j--) {
      const block = blocks[j];

      if (checkCircleCollision(bullet, block)) {
        // Reduce block HP
        block.hp--;

        // Calculate random ricochet angle
        const randomAngle = (Math.random() - 0.5) * Math.PI; // Random angle between -90° and +90°
        const speed = Math.sqrt(bullet.vx * bullet.vx + bullet.vy * bullet.vy);

        // Apply random ricochet direction
        bullet.vx = Math.sin(randomAngle) * speed;
        bullet.vy = Math.cos(randomAngle) * speed;

        bullet.bounces++;

        // If block HP is 0
        if (block.hp <= 0) {
          // Remove block
          blocks.splice(j, 1);

          // Split into smaller blocks if not SMALL
          if (block.size !== 'SMALL') {
            splitBlock(block);
          }

          // Award points
          score += block.size === 'LARGE' ? 30 : block.size === 'MEDIUM' ? 20 : 10;
        }

        // Remove bullet if max bounces exceeded
        if (bullet.bounces > MAX_BOUNCES) {
          bullets.splice(i, 1);
        }

        break;
      }
    }
  }
}

// Circle collision detection
function checkCircleCollision(bullet, block) {
  const bulletCenterX = bullet.x + bullet.width / 2;
  const bulletCenterY = bullet.y + bullet.height / 2;
  const bulletRadius = bullet.width / 2;

  const dx = bulletCenterX - block.x;
  const dy = bulletCenterY - block.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  return distance < (bulletRadius + block.radius);
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

  // Draw blocks (circles)
  blocks.forEach(block => {
    // Draw circle
    ctx.fillStyle = block.color;
    ctx.beginPath();
    ctx.arc(block.x, block.y, block.radius, 0, Math.PI * 2);
    ctx.fill();

    // Circle border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Draw HP number
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${block.radius * 0.8}px system-ui`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(block.hp, block.x, block.y);
  });

  // Draw score
  ctx.fillStyle = '#ecf0f1';
  ctx.font = 'bold 24px system-ui';
  ctx.textAlign = 'left';
  ctx.fillText(`Score: ${score}`, 20, 40);

  // Draw game over
  if (gameOver) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, rect.width, rect.height);

    ctx.fillStyle = '#e74c3c';
    ctx.font = 'bold 48px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', rect.width / 2, rect.height / 2 - 40);

    ctx.fillStyle = '#ecf0f1';
    ctx.font = 'bold 32px system-ui';
    ctx.fillText(`Final Score: ${score}`, rect.width / 2, rect.height / 2 + 20);

    ctx.font = '20px system-ui';
    ctx.fillText('Tap to restart', rect.width / 2, rect.height / 2 + 80);
  }
}

// Game loop
function gameLoop() {
  if (!gameRunning) return;

  update();
  render();

  requestAnimationFrame(gameLoop);
}

// Restart game on tap when game over
canvas.addEventListener('click', () => {
  if (gameOver) {
    initGame();
  }
});

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
