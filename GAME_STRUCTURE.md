# Game Structure - Vampire Survivors Clone

## Overview

A clean, modular implementation of a vampire survivors-like game with the core mechanic of stealing abilities from elite enemies.

## Folder Structure

```
src/game/
├── config/          # Game configuration and constants
│   └── GameConfig.ts # Resolution, scaling, and display settings
├── types/           # TypeScript interfaces and enums
│   └── GameTypes.ts # Core game entity interfaces and enemy types
├── entities/        # Game objects (Player, Enemies, etc.)
│   ├── Player.ts    # Player class with movement and health
│   └── Enemy.ts     # Enemy classes (Mage, Crab, Ghost) with AI
├── systems/         # Game systems (Input, Movement, etc.)
│   ├── InputSystem.ts      # Handles WASD/Arrow key input
│   ├── MovementSystem.ts   # Manages entity movement updates
│   ├── EnemySystem.ts      # Enemy spawning and management
│   └── UISystem.ts         # UI display, timer, health, score (NEW!)
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

### ✅ Pixel-Perfect Display

-   **960x540 Resolution**: Modern 16:9 aspect ratio optimized for pixel art
-   **3x Sprite Scaling**: 16x16 sprites displayed as 48x48 for perfect visibility
-   **Pixel Art Rendering**: Crisp pixel scaling without blur or smoothing
-   **Custom Font**: Kenney Pixel Square font for authentic retro feel

### ✅ Player System

-   **Dual Input Support**: Both WASD and Arrow keys
-   **Smooth Movement**: Physics-based movement with proper collision bounds
-   **Sprite Animations**: Breathing idle animation, movement bounce, sprite flipping
-   **Visual Feedback**: Damage effects, healing effects, power acquisition

### ✅ Enemy System

-   **Three Enemy Types**: Mage (ranged), Crab (melee tank), Ghost (phase walker)
-   **Intelligent AI**: Each enemy type has unique behavior patterns
-   **Smart Spawning**: Off-screen spawning with spawn rate and count limits
-   **Visual Effects**: Death animations, attack animations, type-specific behaviors

### ✅ UI & Progression System (NEW!)

-   **Survival Timer**: Real-time timer showing how long you've survived
-   **Health Display**: Dynamic health bar with color-coded status
-   **Score System**: Points awarded for defeating enemies
-   **Game Over Screen**: Shows final stats and survival time
-   **Custom Font**: Retro pixel font for authentic game feel

### ✅ Modular Systems

-   **InputSystem**: Centralized input handling
-   **MovementSystem**: Entity movement coordination
-   **EnemySystem**: Enemy spawning, AI, and lifecycle management
-   **UISystem**: User interface, timer, health, scoring display
-   **GameManager**: High-level game state management

## Enemy Behaviors

### 🧙 **Mage Enemy**

-   **Health**: 30 HP | **Speed**: 80 | **Range**: 200 pixels | **Points**: 15
-   **Behavior**: Ranged attacker that shoots purple magic orbs
-   **AI**: Maintains distance, stops to cast when in range
-   **Attack**: 2-second cooldown magic projectiles

### 🦀 **Crab Enemy**

-   **Health**: 50 HP | **Speed**: 60 | **Range**: 40 pixels | **Points**: 10
-   **Behavior**: Tank melee enemy with pincer attacks
-   **AI**: Aggressive pursuit, side-to-side scuttling movement
-   **Attack**: 1.5-second cooldown pincer strikes

### 👻 **Ghost Enemy**

-   **Health**: 25 HP | **Speed**: 100 | **Range**: 35 pixels | **Points**: 12
-   **Behavior**: Fast phase-walker, can move through screen bounds
-   **AI**: Very aggressive pursuit, floating animation
-   **Attack**: 1-second cooldown phase attacks

## UI Elements

### 📊 **HUD Display**

-   **Survival Timer** (Top Center): MM:SS format, changes color over time
-   **Health Display** (Top Left): Shows current health with color coding
-   **Score Display** (Top Right): Running score from defeated enemies

### 🎮 **Dynamic Visual Feedback**

-   **Timer Colors**: White → Orange (2min) → Red (5min)
-   **Health Colors**: Green (70+) → Orange (30-70) → Red (0-30)
-   **Game Over Screen**: Final stats with animated restart prompt

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

### Enemy System

-   **Spawning**: Off-screen enemy spawning every 3-5 seconds
-   **AI Pathfinding**: Direct movement toward player with aggro ranges
-   **Attack Systems**: Ranged projectiles, melee attacks, special abilities
-   **Scoring**: Point rewards for defeating enemies (10-15 points each)

### UI System

-   **Real-time Updates**: Timer, health, and score update every frame
-   **Event-driven Scoring**: Enemies emit events when defeated
-   **Custom Font Loading**: Web font integration for pixel-perfect text
-   **Game Over Handling**: Comprehensive end-game statistics display

### Display System

-   Pixel art rendering enabled for crisp sprites
-   Configurable resolution and scaling system
-   Responsive positioning using screen center constants
-   Physics world bounds matching display resolution

## Next Steps

The foundation is now ready for:

1. **Collision Detection**: Player-enemy and projectile collision
2. **Siphon Mechanic**: Power stealing from Elite enemies
3. **Power System**: Different abilities (Homing Spirit, Revolving Scythes, Chain Lightning)
4. **XP & Progression**: Level-up system with passive upgrades
5. **Audio System**: Sound effects and background music

## Running the Game

```bash
npm run dev
```

**Complete survival game experience!** You'll see:

-   **Real-time survival timer** counting up in MM:SS format
-   **Health display** showing your current status
-   **Score counter** tracking points from defeated enemies
-   **Enemies spawning and attacking** with full AI behaviors
-   **Custom pixel font** for authentic retro styling
-   **Game over screen** with final survival stats

The game now feels like a proper vampire survivors-style experience with complete UI feedback and progression tracking!
