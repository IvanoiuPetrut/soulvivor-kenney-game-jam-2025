import { Player } from "../entities/Player";
import { InputSystem } from "../systems/InputSystem";
import { MovementSystem } from "../systems/MovementSystem";
import { SCREEN_CENTER_X, SCREEN_CENTER_Y } from "../config/GameConfig";

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

        // Create the player
        this.player = new Player(this.scene, {
            x: SCREEN_CENTER_X,
            y: SCREEN_CENTER_Y,
            speed: 300,
            health: 100,
        });

        // Add player to movement system
        this.movementSystem.addEntity(this.player);
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

        // Check for siphon input
        if (this.inputSystem.isSiphonPressed()) {
            this.handleSiphonAttempt();
        }

        // Check if player is alive
        if (this.player.health <= 0) {
            this.gameOver();
        }
    }

    private handleSiphonAttempt(): void {
        // TODO: Implement siphon logic when enemies are added
        console.log("Siphon attempt!");
    }

    private gameOver(): void {
        this.gameState.isPlaying = false;
        console.log("Game Over! Score:", this.gameState.score);
        // TODO: Transition to game over scene
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
    }
}
