import { Player } from "../entities/Player";
import { InputSystem } from "../systems/InputSystem";
import { MovementSystem } from "../systems/MovementSystem";
import { EnemySystem } from "../systems/EnemySystem";
import { UISystem } from "../systems/UISystem";
import { SCREEN_CENTER_X, SCREEN_CENTER_Y } from "../config/GameConfig";
import { Game } from "../scenes/Game";
import { EnemyType } from "../types/GameTypes";

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
    private gameState: GameState;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
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

        // Create the player
        this.player = new Player(this.scene, {
            x: SCREEN_CENTER_X,
            y: SCREEN_CENTER_Y,
            speed: 300,
            health: 100,
        });

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

        // Update UI with current game state
        this.uiSystem.update(this.gameState, this.player.health);

        // Check for siphon input
        if (this.inputSystem.isSiphonPressed()) {
            this.handleSiphonAttempt();
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
        this.scene.events.on(
            "enemySpawned",
            (enemySprite: Phaser.GameObjects.Sprite, enemyType: EnemyType) => {
                // Set up collision detection if this is a Game scene
                if (this.scene instanceof Game) {
                    // Only set up collision for enemies that can't pass through walls
                    if (enemyType !== EnemyType.GHOST) {
                        this.scene.setupEnemyCollision(enemySprite);
                    }
                }
            }
        );
    }

    private handleSiphonAttempt(): void {
        // TODO: Implement siphon logic when enemies are added
        console.log("Siphon attempt!");
    }

    private gameOver(): void {
        this.gameState.isPlaying = false;

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
        this.uiSystem.destroy();
    }

    getEnemySystem(): EnemySystem {
        return this.enemySystem;
    }
}
