# Quick Reference - For AI Assistants

> **ALWAYS READ THIS FIRST before making any changes**
> This saves tokens by directing you to the right place immediately

## 🎯 Fast Lookup Table

| What to Change | File | Line Range (approx) | Variables/Functions |
|----------------|------|---------------------|---------------------|
| **Bullet speed** | `config.js` | 6-9 | `BASE_BULLET_SPEED` |
| **Enemy spawn rate** | `config.js` | 16 | `BLOCK_SPAWN_INTERVAL` |
| **Enemy sizes** | `config.js` | 12-16 | `BLOCK_SIZES` |
| **Safe areas** | `config.js` | 40 | `EXTRA_LATERAL_SAFE_AREA` |
| **Upgrade balance** | `config.js` | 28-31 | `*_UPGRADE_INCREMENT` |
| **HP scaling** | `config.js` | 34-37 | `*_HP_MULTIPLIER` |
| **Player size** | `config.js` | 19-21 | `PLAYER_WIDTH/HEIGHT` |
| **Aim arrow** | `config.js` | 43-48 | `AIM_ARROW_*` |
| **Game state** | `state.js` | entire file | All game variables |
| **Collision detection** | `main.js` | ~620-630 | `checkCubeCollision()` |
| **Bounce physics** | `main.js` | ~540-580 | Collision response |
| **Enemy spawning** | `main.js` | ~330-390 | `spawnBlock()`, `spawnEliteBlock()` |
| **Rendering** | `main.js` | ~630-750 | `render()` |
| **Input handling** | `main.js` | ~220-285 | Touch/mouse handlers |
| **Auto-fire** | `main.js` | ~285-330 | `shootBulletInDirection()` |

## 🔧 Common Modifications

### Change Enemy Behavior
```
1. Read: config.js (lines 12-24)
2. Edit: config.js constants
3. If spawn logic: main.js ~330-390
```

### Modify Physics
```
1. Read: main.js ~540-630 (collision + bounce)
2. Edit: specific collision response section
```

### Adjust UI/HUD
```
1. Read: config.js (lines 43-53) for constants
2. Edit: main.js render() function ~630-850
3. Safe areas: state.js (setSafeAreas)
```

### Balance Changes
```
1. Read: config.js ONLY
2. Edit: appropriate constants
3. NO need to read main.js
```

## 📊 Architecture Summary

```
config.js     → All constants (READ THIS for balance changes)
state.js      → All variables (import/modify game state)
main.js       → Game logic (physics, spawning, rendering)
console.js    → Debug panel (leave alone)
CODE_MAP.md   → Detailed architecture
QUICK_REF.md  → This file
```

## 💡 Token-Saving Workflow

### ❌ DON'T DO THIS (wastes tokens):
1. Read entire main.js
2. Search for the value
3. Make change
4. Read again to verify

### ✅ DO THIS (saves tokens):
1. Check this file → find exact location
2. Read ONLY that section (use offset/limit)
3. Make targeted change
4. Done

## 🎮 Current Game State (Quick Facts)

- **File structure**: Partially modular (config.js + state.js created, main.js still monolithic)
- **Enemy type**: Cubes (not circles)
- **Bounce system**: Starts at 0, upgradeable, all bounces count
- **Shooting**: Auto-fire always on, drag to aim
- **Grid system**: NOT YET IMPLEMENTED
- **Safe areas**: iOS notch/bar supported, lateral areas = default (50px not added yet)

## 🚀 Next Improvements Needed

1. [ ] Add 50px lateral safe areas
2. [ ] Implement grid system for enemies
3. [ ] Split main.js into modules (physics.js, enemies.js, bullets.js, render.js, etc.)
4. [ ] Add grid-based enemy positioning
5. [ ] Prevent enemy overlap with grid tracking

## 📝 Before Any Change - Checklist

- [ ] Checked QUICK_REF.md (this file)
- [ ] Identified exact file and line range
- [ ] Read ONLY the necessary section
- [ ] Made targeted change
- [ ] Tested if possible

## 🎯 Example: "Add 50px lateral safe areas"

**Fast path:**
1. Read this file → see "Safe areas" → `config.js` line 40
2. Edit `config.js`: `EXTRA_LATERAL_SAFE_AREA = 50`
3. Read `state.js` → find `setSafeAreas()`
4. Read `main.js` → search for "updateSafeAreas" (one function)
5. Modify that function to add `EXTRA_LATERAL_SAFE_AREA`
6. Done in ~5 file operations

**Slow path (don't do this):**
1. Read entire main.js (800+ lines)
2. Search through code
3. Find safe area code
4. Make change
5. Read again
6. Uses 10x more tokens

---

**Remember**: This project is optimized for minimal token usage. Always start here!
