import { Player } from "../entities/Player";
import { InputSystem } from "../systems/InputSystem";
import { MovementSystem } from "../systems/MovementSystem";
import { EnemySystem } from "../systems/EnemySystem";
import { UISystem } from "../systems/UISystem";
import { WeaponSystem } from "../systems/WeaponSystem";
import { AudioManager } from "./AudioManager";
import { SCREEN_CENTER_X, SCREEN_CENTER_Y } from "../config/GameConfig";
import { Game } from "../scenes/Game";
import { EnemyType } from "../types/GameTypes";
import { GAME_CONFIG } from "../config/GameConfig";
import { PowerType } from "../types/GameTypes";

export interface GameState {
    isPlaying: boolean;
    score: number;
    level: number;
    timeElapsed: number;
}

export class GameManager {
    private scene: Phaser.Scene;
    private player: Player;
    private inputSystem: InputSystem;
    private movementSystem: MovementSystem;
    private enemySystem: EnemySystem;
    private uiSystem: UISystem;
    private weaponSystem: WeaponSystem;
    private audioManager: AudioManager;
    private gameState: GameState;
    private lastSiphonTime: number = 0;
    private siphonCooldown: number = 500; // 0.5 second cooldown

    constructor(scene: Phaser.Scene, audioManager: AudioManager) {
        this.scene = scene;
        this.audioManager = audioManager;
        this.gameState = {
            isPlaying: true,
            score: 0,
            level: 1,
            timeElapsed: 0,
        };
    }

    initialize(): void {
        // Initialize systems
        this.inputSystem = new InputSystem(this.scene);
        this.movementSystem = new MovementSystem();
        this.enemySystem = new EnemySystem(this.scene);
        this.uiSystem = new UISystem(this.scene);

        // Create the player at the center of the tilemap
        // Tilemap is 150x150 tiles, each tile is 16px scaled by spriteScale (3x)
        const tilemapWidth = 150;
        const tilemapHeight = 150;
        const tileSize = 16 * GAME_CONFIG.spriteScale; // 16px * 3 = 48px per tile

        const tilemapCenterX = (tilemapWidth * tileSize) / 2;
        const tilemapCenterY = (tilemapHeight * tileSize) / 2;

        this.player = new Player(this.scene, {
            x: tilemapCenterX,
            y: tilemapCenterY,
            speed: 300,
            health: 100,
        });

        // Set audio manager on player
        this.player.setAudioManager(this.audioManager);

        // Initialize weapon system
        this.weaponSystem = new WeaponSystem(
            this.scene,
            this.player,
            this.audioManager
        );

        // Add player to movement system
        this.movementSystem.addEntity(this.player);

        // Set player target for enemy system
        this.enemySystem.setPlayer(this.player);

        // Set up event listeners
        this.setupEventListeners();

        // Try to update to custom font if available
        this.scene.time.delayedCall(100, () => {
            this.uiSystem.updateToCustomFont();
        });
    }

    update(deltaTime: number): void {
        if (!this.gameState.isPlaying) return;

        // Update game time
        this.gameState.timeElapsed += deltaTime;

        // Handle input and move player
        const movement = this.inputSystem.getMovementVector();
        this.player.move(movement);

        // Update all entities
        this.movementSystem.update(deltaTime);

        // Update enemy system
        this.enemySystem.update(deltaTime);

        // Update weapon system with current enemies
        const enemies = this.enemySystem.getEnemies();
        this.weaponSystem.update(deltaTime, enemies);

        // Update UI with current game state
        this.uiSystem.update(this.gameState, this.player.health);

        // Check for power stealing (siphon input)
        if (this.inputSystem.isSiphonPressed() && this.canSiphon()) {
            this.handlePowerSteal();
        }

        // Check if player is alive
        if (this.player.health <= 0) {
            this.gameOver();
        }
    }

    private setupEventListeners(): void {
        // Listen for enemy defeats to award points
        this.scene.events.on(
            "enemyDefeated",
            (points: number, enemyType: string) => {
                this.addScore(points);
            }
        );

        // Listen for enemy spawns to set up collision detection
        // this.scene.events.on(
        //     "enemySpawned",
        //     (enemySprite: Phaser.GameObjects.Sprite, enemyType: EnemyType) => {
        //         // All enemies can now pass through obstacles - no collision setup needed
        //         console.log(
        //             `Enemy ${enemyType} spawned without collision detection`
        //         );
        //     }
        // );
    }

    private canSiphon(): boolean {
        const currentTime = this.scene.time.now;
        return currentTime - this.lastSiphonTime >= this.siphonCooldown;
    }

    private handlePowerSteal(): void {
        const enemies = this.enemySystem.getEnemies();
        const siphonRange = 85; // 60 pixel range for power stealing

        // Find nearest enemy within siphon range
        let nearestEnemy = null;
        let nearestDistance = siphonRange;

        enemies.forEach((enemy) => {
            if (!enemy.sprite.active) return;

            const dx = enemy.sprite.x - this.player.sprite.x;
            const dy = enemy.sprite.y - this.player.sprite.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < nearestDistance) {
                nearestEnemy = enemy;
                nearestDistance = distance;
            }
        });

        if (nearestEnemy) {
            this.stealPowerFromEnemy(nearestEnemy);
            this.lastSiphonTime = this.scene.time.now;
        }
    }

    private stealPowerFromEnemy(enemy: any): void {
        // Determine power type based on enemy type
        let powerType: PowerType = PowerType.NONE;

        switch (enemy.type) {
            case EnemyType.CRAB:
                powerType = PowerType.CRAB_SWORD;
                break;
            case EnemyType.GHOST:
                powerType = PowerType.GHOST_DAGGERS;
                break;
            case EnemyType.MAGE:
                powerType = PowerType.MAGE_PROJECTILE;
                break;
        }

        // Set the new power
        this.weaponSystem.setPower(powerType);

        // Play power-up sound
        this.audioManager.playPowerUp();

        // Kill the enemy (they get absorbed)
        enemy.takeDamage(1000); // Instant kill

        // Visual effect for power stealing
        this.scene.tweens.add({
            targets: enemy.sprite,
            scaleX: 0,
            scaleY: 0,
            alpha: 0,
            duration: 300,
            ease: "Power2.easeIn",
        });

        // Player power absorption effect
        this.scene.tweens.add({
            targets: this.player.sprite,
            scaleX: GAME_CONFIG.spriteScale * 1.2,
            scaleY: GAME_CONFIG.spriteScale * 1.2,
            duration: 200,
            ease: "Back.easeOut",
            yoyo: true,
        });

        console.log(`Power stolen: ${powerType}`);
    }

    private handleSiphonAttempt(): void {
        // TODO: Implement siphon logic when enemies are added
        console.log("Siphon attempt!");
    }

    private gameOver(): void {
        this.gameState.isPlaying = false;

        // Stop background music
        this.audioManager.stopBackgroundMusic();

        // Format final time for display
        const minutes = Math.floor(this.gameState.timeElapsed / 60);
        const seconds = Math.floor(this.gameState.timeElapsed % 60);
        const finalTime = `${minutes.toString().padStart(2, "0")}:${seconds
            .toString()
            .padStart(2, "0")}`;

        // Show game over screen
        this.uiSystem.showGameOver(finalTime, this.gameState.score);

        console.log(
            `Game Over! Survived: ${finalTime}, Final Score: ${this.gameState.score}`
        );
    }

    getPlayer(): Player {
        return this.player;
    }

    getGameState(): GameState {
        return { ...this.gameState };
    }

    addScore(points: number): void {
        this.gameState.score += points;
    }

    destroy(): void {
        this.movementSystem.clear();
        this.enemySystem.clear();
        this.weaponSystem.destroy();
        this.uiSystem.destroy();
    }

    getEnemySystem(): EnemySystem {
        return this.enemySystem;
    }
}
