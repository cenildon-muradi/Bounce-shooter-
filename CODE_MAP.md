# Code Map - Bounce Shooter

> **Quick reference guide for code locations and architecture**
> Use this to find what you need without reading entire files

## 📁 Project Structure

```
/
├── main.js           - Entry point, imports all modules, game loop
├── config.js         - Game constants and configuration
├── state.js          - Global game state variables
├── player.js         - Player logic and controls
├── enemies.js        - Enemy spawning and behavior
├── bullets.js        - Bullet/projectile system
├── physics.js        - Collision detection and physics
├── render.js         - All rendering/drawing code
├── ui.js             - UI elements (HUD, menus, overlays)
├── console.js        - Debug console (existing)
└── CODE_MAP.md       - This file
```

## 🎯 Where to Find Things

### Player & Controls
**File:** `player.js`
- Player object definition
- Touch/mouse input handlers
- Aiming system (drag to aim)
- Auto-fire direction tracking

### Enemies/Blocks
**File:** `enemies.js`
- Enemy spawning (normal + elite)
- Block splitting logic
- Enemy movement
- Grid system (if implemented)

### Bullets/Projectiles
**File:** `bullets.js`
- Bullet creation and shooting
- Bullet movement and updates
- Bounce/lifetime management

### Physics & Collisions
**File:** `physics.js`
- Wall collision detection
- Cube (AABB) collision detection
- Realistic bounce physics
- Collision response

### Rendering
**File:** `render.js`
- Canvas setup and resizing
- Player rendering
- Enemy/cube rendering
- Bullet rendering
- Aim arrow rendering
- Safe area handling

### UI Elements
**File:** `ui.js`
- Progress bar
- Score display
- Level up menu
- Upgrade selection
- Game over screen

### Configuration
**File:** `config.js`
- Block sizes and colors
- Speeds and intervals
- Bullet properties
- Safe area constants

### Game State
**File:** `state.js`
- Game variables (score, level, kills)
- Upgrade variables (damage, speed, bounces)
- Arrays (bullets, blocks)
- Safe area values

## 🔧 Common Tasks

### Adding a New Enemy Type
1. Edit `config.js` - Add to BLOCK_SIZES
2. Edit `enemies.js` - Update spawnBlock() or add new spawn function
3. Edit `render.js` - Add rendering logic if needed

### Changing Physics
1. Edit `physics.js` - Modify collision or bounce functions
2. May need to update `bullets.js` or `enemies.js` for movement

### Adding UI Elements
1. Edit `ui.js` - Add rendering function
2. Edit `render.js` - Call the new UI function in render()
3. Edit `state.js` - Add any needed state variables

### Modifying Controls
1. Edit `player.js` - Update input handlers
2. May need `state.js` for new aiming variables

### Changing Game Balance
1. Edit `config.js` - Constants like speeds, intervals, sizes
2. Edit `state.js` - Initial values for upgrades

## 📝 Key Concepts

### Safe Areas (iOS notch/bar)
- **Where:** `render.js`, `state.js`
- Variables: `safeAreaTop`, `safeAreaBottom`, `safeAreaLeft`, `safeAreaRight`
- Applied to: UI positioning, player position

### Bounce System
- **Where:** `physics.js`, `bullets.js`
- Bullets start with 0 bounces
- Walls AND enemies consume bounce life
- Upgrade adds +1 bounce

### Grid System (if implemented)
- **Where:** `enemies.js`, `config.js`
- 8 columns horizontally
- Cell size = smallest enemy size
- Prevents overlap

### Auto-Fire
- **Where:** `player.js`, `bullets.js`
- Always shooting in last aimed direction
- Drag updates direction
- Default: straight up

## 🎨 Rendering Order (bottom to top)
1. Clear canvas
2. Player platform
3. Bullets
4. Enemies/blocks
5. Aim arrow
6. Progress bar
7. Score
8. Upgrade menu (if active)
9. Game over screen (if game over)

## 🔄 Game Loop Flow
```
update() → render() → requestAnimationFrame()
  ↓           ↓
  • Shoot    • Draw everything
  • Spawn    • Handle safe areas
  • Move     • Position UI
  • Collide
```

## 📊 Data Flow

```
User Input (touch/mouse)
    ↓
player.js (handle input)
    ↓
state.js (update aim direction)
    ↓
bullets.js (create bullets in aimed direction)
    ↓
physics.js (detect collisions)
    ↓
enemies.js (handle damage, splits)
    ↓
state.js (update score, kills, level)
    ↓
ui.js (show progress, upgrades)
    ↓
render.js (draw everything)
```

## 💡 Tips for Token Efficiency

1. **Before making changes:** Check this file to find the right module
2. **Only read what you need:** Don't read entire files
3. **Use line numbers:** Read specific sections with offset/limit
4. **Check config first:** Many values are in config.js
5. **State variables:** All in state.js, don't search elsewhere

## 🐛 Debugging

- Console output: See browser console or in-game debug panel (🐛 button)
- State inspection: All variables in `state.js`
- Physics issues: Check `physics.js` collision functions
- Rendering issues: Check `render.js` draw order
- Performance: Check game loop in `main.js`
