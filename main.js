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
  width: 60,
  height: 40,
  speed: 5,
  moveLeft: false,
  moveRight: false
};

const bullets = [];
const blocks = [];

// Game config
const BULLET_SPEED = 8;
const BULLET_WIDTH = 4;
const BULLET_HEIGHT = 15;
const BULLET_COOLDOWN = 250; // ms between shots
let lastShot = 0;

const BLOCK_WIDTH = 50;
const BLOCK_HEIGHT = 30;
const BLOCK_SPEED = 0.5;
const BLOCK_SPAWN_INTERVAL = 1500; // ms between block spawns
let lastBlockSpawn = 0;

// Colors for blocks
const BLOCK_COLORS = [
  '#e74c3c', // red
  '#3498db', // blue
  '#2ecc71', // green
  '#f39c12', // orange
  '#9b59b6', // purple
  '#1abc9c', // turquoise
];

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

  gameRunning = true;
  gameOver = false;
  score = 0;
  bullets.length = 0;
  blocks.length = 0;

  console.log('🎮 Game initialized!');
  console.log('📱 Touch left side to move left, right side to move right');
  console.log('🔫 Player shoots automatically');

  requestAnimationFrame(gameLoop);
}

// Touch handling
let touchX = null;

function handleTouchStart(e) {
  e.preventDefault();
  const touch = e.touches[0];
  touchX = touch.clientX;
  updatePlayerMovement(touchX);
}

function handleTouchMove(e) {
  e.preventDefault();
  const touch = e.touches[0];
  touchX = touch.clientX;
  updatePlayerMovement(touchX);
}

function handleTouchEnd(e) {
  e.preventDefault();
  player.moveLeft = false;
  player.moveRight = false;
  touchX = null;
}

function handleMouseDown(e) {
  const rect = canvas.getBoundingClientRect();
  touchX = e.clientX - rect.left;
  updatePlayerMovement(touchX);
}

function updatePlayerMovement(x) {
  const rect = canvas.getBoundingClientRect();
  const centerX = rect.width / 2;

  if (x < centerX - 30) {
    player.moveLeft = true;
    player.moveRight = false;
  } else if (x > centerX + 30) {
    player.moveLeft = false;
    player.moveRight = true;
  } else {
    player.moveLeft = false;
    player.moveRight = false;
  }
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
    height: BULLET_HEIGHT
  });
}

// Spawn a block
function spawnBlock() {
  const now = Date.now();
  if (now - lastBlockSpawn < BLOCK_SPAWN_INTERVAL) return;

  lastBlockSpawn = now;
  const rect = canvas.getBoundingClientRect();
  const maxX = rect.width - BLOCK_WIDTH;

  blocks.push({
    x: Math.random() * maxX,
    y: -BLOCK_HEIGHT,
    width: BLOCK_WIDTH,
    height: BLOCK_HEIGHT,
    color: BLOCK_COLORS[Math.floor(Math.random() * BLOCK_COLORS.length)],
    hp: 1
  });
}

// Update game state
function update() {
  if (gameOver) return;

  const rect = canvas.getBoundingClientRect();

  // Move player
  if (player.moveLeft) {
    player.x = Math.max(0, player.x - player.speed);
  }
  if (player.moveRight) {
    player.x = Math.min(rect.width - player.width, player.x + player.speed);
  }

  // Auto-shoot
  shootBullet();

  // Spawn blocks
  spawnBlock();

  // Update bullets
  for (let i = bullets.length - 1; i >= 0; i--) {
    bullets[i].y -= BULLET_SPEED;

    // Remove bullets that go off screen
    if (bullets[i].y + bullets[i].height < 0) {
      bullets.splice(i, 1);
    }
  }

  // Update blocks
  for (let i = blocks.length - 1; i >= 0; i--) {
    blocks[i].y += BLOCK_SPEED;

    // Check if block reached bottom (game over)
    if (blocks[i].y > rect.height) {
      gameOver = true;
      console.log('💀 Game Over! Final score:', score);
      return;
    }
  }

  // Check collisions
  for (let i = bullets.length - 1; i >= 0; i--) {
    const bullet = bullets[i];

    for (let j = blocks.length - 1; j >= 0; j--) {
      const block = blocks[j];

      if (checkCollision(bullet, block)) {
        // Remove bullet and block
        bullets.splice(i, 1);
        blocks.splice(j, 1);
        score += 10;
        break;
      }
    }
  }
}

// Collision detection
function checkCollision(a, b) {
  return a.x < b.x + b.width &&
         a.x + a.width > b.x &&
         a.y < b.y + b.height &&
         a.y + a.height > b.y;
}

// Render game
function render() {
  const rect = canvas.getBoundingClientRect();

  // Clear canvas
  ctx.clearRect(0, 0, rect.width, rect.height);

  // Draw player (spaceship-like)
  ctx.fillStyle = '#3498db';
  ctx.beginPath();
  ctx.moveTo(player.x + player.width / 2, player.y);
  ctx.lineTo(player.x + player.width, player.y + player.height);
  ctx.lineTo(player.x, player.y + player.height);
  ctx.closePath();
  ctx.fill();

  // Draw player body
  ctx.fillStyle = '#2980b9';
  ctx.fillRect(player.x + player.width / 3, player.y + player.height / 2, player.width / 3, player.height / 2);

  // Draw bullets
  ctx.fillStyle = '#f39c12';
  bullets.forEach(bullet => {
    ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
  });

  // Draw blocks
  blocks.forEach(block => {
    ctx.fillStyle = block.color;
    ctx.fillRect(block.x, block.y, block.width, block.height);

    // Block border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.strokeRect(block.x, block.y, block.width, block.height);
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
