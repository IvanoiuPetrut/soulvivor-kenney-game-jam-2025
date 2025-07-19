# Game Structure - Vampire Survivors Clone

## Overview

A clean, modular implementation of a vampire survivors-like game with the core mechanic of stealing abilities from elite enemies.

## Folder Structure

```
src/game/
├── config/          # Game configuration and constants
│   └── GameConfig.ts # Resolution, scaling, and display settings
├── types/           # TypeScript interfaces and enums
│   └── GameTypes.ts # Core game entity interfaces and types
├── entities/        # Game objects (Player, Enemies, etc.)
│   └── Player.ts    # Player class with movement and health
├── systems/         # Game systems (Input, Movement, etc.)
│   ├── InputSystem.ts      # Handles WASD/Arrow key input
│   └── MovementSystem.ts   # Manages entity movement updates
├── managers/        # High-level game coordinators
│   └── GameManager.ts      # Central game state and system coordination
└── scenes/          # Phaser scenes
    └── Game.ts      # Main game scene using the new architecture
```

## Key Features Implemented

### ✅ Clean Architecture

-   **DRY (Don't Repeat Yourself)**: Shared interfaces and reusable systems
-   **KISS (Keep It Simple, Stupid)**: Simple, focused classes with single responsibilities
-   **Separation of Concerns**: Clear boundaries between entities, systems, and managers

### ✅ Pixel-Perfect Display (NEW!)

-   **960x540 Resolution**: Modern 16:9 aspect ratio optimized for pixel art
-   **3x Sprite Scaling**: 16x16 sprites displayed as 48x48 for perfect visibility
-   **Pixel Art Rendering**: Crisp pixel scaling without blur or smoothing
-   **Configurable Options**: Easy to switch between different resolution presets

### ✅ Player Movement

-   **Dual Input Support**: Both WASD and Arrow keys
-   **Smooth Movement**: Physics-based movement with proper collision bounds
-   **Diagonal Movement**: Normalized movement vectors for consistent speed
-   **Proper Scaling**: Player sprite correctly scaled with screen bounds

### ✅ Modular Systems

-   **InputSystem**: Centralized input handling
-   **MovementSystem**: Entity movement coordination
-   **GameManager**: High-level game state management

## Display Configuration

### Current Setup (960x540 @ 3x scaling)

-   **Base Sprite Size**: 16x16 pixels
-   **Display Size**: 48x48 pixels (3x scale)
-   **Resolution**: 960x540 (16:9 aspect ratio)
-   **Pixel Art**: Enabled for crisp rendering

### Alternative Configurations Available

```typescript
// Classic 4:3 ratio
classic: 640x480 @ 3x scale

// Large modern display
large: 1280x720 @ 4x scale

// Tiny retro style
retro: 320x240 @ 2x scale
```

Simply change `GAME_CONFIG` in `GameConfig.ts` to switch!

## Game Controls

| Key   | Action                                               |
| ----- | ---------------------------------------------------- |
| W / ↑ | Move Up                                              |
| S / ↓ | Move Down                                            |
| A / ← | Move Left                                            |
| D / → | Move Right                                           |
| Space | Siphon (placeholder for future enemy power stealing) |

## Technical Details

### Player Entity

-   Health system with visual damage feedback
-   Power system ready for ability implementation
-   Physics-enabled sprite with world bounds collision
-   Properly scaled and positioned for new resolution

### Display System

-   Pixel art rendering enabled for crisp sprites
-   Configurable resolution and scaling system
-   Responsive positioning using screen center constants
-   Physics world bounds matching display resolution

## Next Steps

The foundation is now ready for:

1. **Enemy System**: Fodder and Elite enemy implementation
2. **Siphon Mechanic**: Power stealing from Elite enemies
3. **Power System**: Different abilities (Homing Spirit, Revolving Scythes, Chain Lightning)
4. **XP & Progression**: Level-up system with passive upgrades
5. **Game Balance**: Spawn rates, difficulty scaling

## Running the Game

```bash
npm run dev
```

The player will now appear properly sized in the center of the screen at 960x540 resolution with crisp 3x scaled pixel art! The 16x16 sprites are now clearly visible and the foundation is solid for the vampire survivors-style gameplay loop.
