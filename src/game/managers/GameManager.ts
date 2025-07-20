import { Player } from "../entities/Player";
import { InputSystem } from "../systems/InputSystem";
import { MovementSystem } from "../systems/MovementSystem";
import { EnemySystem } from "../systems/EnemySystem";
import { UISystem } from "../systems/UISystem";
import { WeaponSystem } from "../systems/WeaponSystem";
import { XPSystem } from "../systems/XPSystem";
import { AudioManager } from "./AudioManager";
import { ParticleManager } from "./ParticleManager";
import { SCREEN_CENTER_X, SCREEN_CENTER_Y } from "../config/GameConfig";
import { Game } from "../scenes/Game";
import { EnemyType } from "../types/GameTypes";
import { GAME_CONFIG } from "../config/GameConfig";
import { PowerType } from "../types/GameTypes";
import { HighScoreScene } from "../scenes/HighScoreScene";

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
    private xpSystem: XPSystem;
    private audioManager: AudioManager;
    private particleManager: ParticleManager;
    private gameState: GameState;
    private lastSiphonTime: number = 0;
    private siphonCooldown: number = 500; // 0.5 second cooldown
    private isPaused: boolean = false;

    // Siphon target highlighting
    private siphonTargetHighlight: Phaser.GameObjects.Graphics | null = null;
    private siphonRangeIndicator: Phaser.GameObjects.Graphics | null = null;
    private currentSiphonTarget: any = null;

    constructor(
        scene: Phaser.Scene,
        audioManager: AudioManager,
        particleManager: ParticleManager
    ) {
        this.scene = scene;
        this.audioManager = audioManager;
        this.particleManager = particleManager;
        this.gameState = {
            isPlaying: true,
            score: 0,
            level: 1,
            timeElapsed: 0,
        };

        // Create siphon target highlight graphic
        this.createSiphonHighlight();
    }

    initialize(): void {
        // Initialize systems
        this.inputSystem = new InputSystem(this.scene);
        this.movementSystem = new MovementSystem();
        this.enemySystem = new EnemySystem(this.scene);
        this.uiSystem = new UISystem(this.scene);
        this.xpSystem = new XPSystem(this.scene);

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

        // Set particle manager on player
        this.player.setParticleManager(this.particleManager);

        // Initialize weapon system
        this.weaponSystem = new WeaponSystem(
            this.scene,
            this.player,
            this.audioManager,
            this.particleManager
        );

        // Add player to movement system
        this.movementSystem.addEntity(this.player);

        // Set player target for enemy system
        this.enemySystem.setPlayer(this.player);

        // Set particle manager for enemy system
        this.enemySystem.setParticleManager(this.particleManager);

        // Set player for XP system
        this.xpSystem.setPlayer(this.player);

        // Set audio manager for XP system
        this.xpSystem.setAudioManager(this.audioManager);

        // Set up event listeners
        this.setupEventListeners();

        // Try to update to custom font if available
        this.scene.time.delayedCall(100, () => {
            this.uiSystem.updateToCustomFont();
        });
    }

    update(deltaTime: number): void {
        // Don't update anything if game is paused
        if (!this.gameState.isPlaying) return;

        // Update game time
        this.gameState.timeElapsed += deltaTime;

        // Handle input and move player (only if game is playing and not paused)
        if (!this.isPaused) {
            const movement = this.inputSystem.getMovementVector();
            this.player.move(movement);
        }

        // Update all entities
        this.movementSystem.update(deltaTime);

        // Update enemy system
        this.enemySystem.update(deltaTime);

        // Update weapon system with current enemies
        const enemies = this.enemySystem.getEnemies();
        this.weaponSystem.update(deltaTime, enemies);

        // Update XP system
        this.xpSystem.update(deltaTime);

        // Update UI with current game state and XP
        this.uiSystem.update(this.gameState, this.player.health);
        this.uiSystem.updateXPState(this.xpSystem.getXPState());

        // Update siphon target highlighting and range indicator
        this.updateSiphonTargetHighlight();
        this.updateSiphonRangeIndicator();

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

        // Listen for level-ups to pause game and show upgrade screen
        this.scene.events.on("levelUp", (xpState: any) => {
            this.handleLevelUp();
        });

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

    private handleLevelUp(): void {
        // Pause the game completely
        this.pauseGame();

        // Launch level-up screen
        this.scene.scene.launch("LevelUpScreen");

        // Get reference to level-up screen and show it
        const levelUpScene = this.scene.scene.get("LevelUpScreen") as any;
        if (levelUpScene && levelUpScene.showLevelUpScreen) {
            levelUpScene.showLevelUpScreen((upgrade: any) => {
                this.applyUpgrade(upgrade);
                this.resumeGame();
            });
        }
    }

    private applyUpgrade(upgrade: any): void {
        console.log("Applied upgrade:", upgrade.type);

        switch (upgrade.type) {
            case "movement_speed":
                // Increase player movement speed by 15%
                this.player.speed = Math.floor(this.player.speed * 1.15);
                console.log(`Player speed increased to ${this.player.speed}`);
                break;
            case "weapon_upgrade":
                // Improve current weapon damage and stats
                this.upgradeCurrentWeapon();
                break;
            case "life_regen":
                // Restore 50% of max health and increase max health by 20
                const healAmount = Math.floor(this.player.maxHealth * 0.5);
                this.player.health = Math.min(
                    this.player.health + healAmount,
                    this.player.maxHealth + 20
                );
                this.player.maxHealth += 20;
                console.log(
                    `Health restored by ${healAmount}, max health increased to ${this.player.maxHealth}`
                );
                break;
        }

        // Play power-up sound for upgrade
        this.audioManager.playPowerUp();
    }

    private upgradeCurrentWeapon(): void {
        // Check what weapon the player currently has and upgrade it
        const currentPower = this.weaponSystem.getCurrentPower();

        if (currentPower === PowerType.NONE) {
            console.log(
                "No weapon to upgrade - giving the player a basic weapon"
            );
            // If no weapon, give them the crab sword
            this.weaponSystem.setPower(PowerType.CRAB_SWORD);
            return;
        }

        // Upgrade weapon stats based on current weapon type
        console.log(`Upgrading weapon: ${currentPower}`);

        // For now, we'll track weapon upgrades via the weapon system
        // This could be expanded to modify damage multipliers, cooldowns, etc.
        this.weaponSystem.upgradeWeapon();
    }

    private pauseGame(): void {
        // Set pause flag first
        this.isPaused = true;
        this.gameState.isPlaying = false;

        // Stop player movement immediately by applying zero movement
        this.player.move({ x: 0, y: 0 });

        // Force stop player physics body before pausing physics
        const playerBody = this.player.sprite
            .body as Phaser.Physics.Arcade.Body;
        if (playerBody) {
            playerBody.setVelocity(0, 0);
            playerBody.setAcceleration(0, 0);
        }

        // Stop all enemy movement
        const enemies = this.enemySystem.getEnemies();
        enemies.forEach((enemy) => {
            const enemyBody = enemy.sprite.body as Phaser.Physics.Arcade.Body;
            if (enemyBody) {
                enemyBody.setVelocity(0, 0);
                enemyBody.setAcceleration(0, 0);
            }
        });

        // Hide siphon indicators during pause
        this.hideSiphonHighlight();
        this.hideSiphonRangeIndicator();

        // Pause physics for all objects AFTER stopping movement
        this.scene.physics.pause();

        // Pause all tweens
        this.scene.tweens.pauseAll();

        console.log("Game paused for level up");
    }

    private resumeGame(): void {
        // Clear pause flag
        this.isPaused = false;

        // Resume game logic
        this.gameState.isPlaying = true;

        // Resume physics
        this.scene.physics.resume();

        // Resume all tweens
        this.scene.tweens.resumeAll();

        // Close level-up screen
        this.scene.scene.stop("LevelUpScreen");

        console.log("Game resumed from level up");
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

        // Create power-up particles
        this.particleManager.createPowerUpEffect(
            enemy.sprite.x,
            enemy.sprite.y
        );

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

        // Save high score
        HighScoreScene.addHighScore(
            this.gameState.timeElapsed,
            finalTime,
            this.gameState.score
        );

        console.log(
            `Game Over! Survived: ${finalTime}, Final Score: ${this.gameState.score}`
        );

        // Start the GameOver scene with data
        this.scene.scene.start("GameOver", {
            finalTime: finalTime,
            finalScore: this.gameState.score,
            timeInSeconds: this.gameState.timeElapsed,
        });
    }

    private createSiphonHighlight(): void {
        // Create a graphics object for the siphon target highlight
        this.siphonTargetHighlight = this.scene.add.graphics();
        this.siphonTargetHighlight.setDepth(60); // Above enemies but below player
        this.siphonTargetHighlight.setVisible(false);

        // Create a graphics object for the siphon range indicator
        this.siphonRangeIndicator = this.scene.add.graphics();
        this.siphonRangeIndicator.setDepth(55); // Below enemies and target highlight
        this.siphonRangeIndicator.setVisible(false);
    }

    private updateSiphonTargetHighlight(): void {
        if (!this.siphonTargetHighlight) return;

        const enemies = this.enemySystem.getEnemies();
        const siphonRange = 85;

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

        // Update highlight visibility and position
        if (nearestEnemy && this.canSiphon()) {
            this.currentSiphonTarget = nearestEnemy;
            this.showSiphonHighlight(nearestEnemy);
        } else {
            this.currentSiphonTarget = null;
            this.hideSiphonHighlight();
        }
    }

    private showSiphonHighlight(enemy: any): void {
        if (!this.siphonTargetHighlight) return;

        // Clear previous drawing
        this.siphonTargetHighlight.clear();

        // Set position to enemy
        this.siphonTargetHighlight.setPosition(enemy.sprite.x, enemy.sprite.y);

        // Create pulsing glow effect
        const time = this.scene.time.now * 0.005; // Slow pulsing
        const pulseAlpha = 0.3 + 0.4 * Math.sin(time); // Pulse between 0.3 and 0.7
        const pulseRadius = 25 + 5 * Math.sin(time * 2); // Slightly varying radius

        // Draw outer glow ring
        this.siphonTargetHighlight.lineStyle(3, 0xffff00, pulseAlpha); // Yellow glow
        this.siphonTargetHighlight.strokeCircle(0, 0, pulseRadius);

        // Draw inner highlight ring
        this.siphonTargetHighlight.lineStyle(2, 0xffffff, 0.8); // White inner ring
        this.siphonTargetHighlight.strokeCircle(0, 0, 20);

        // Add power type indicator (small icon/color based on enemy type)
        let indicatorColor = 0xffffff;
        switch (enemy.type) {
            case EnemyType.CRAB:
                indicatorColor = 0xff4444; // Red for sword
                break;
            case EnemyType.GHOST:
                indicatorColor = 0x44ff44; // Green for daggers
                break;
            case EnemyType.MAGE:
                indicatorColor = 0x4444ff; // Blue for projectile
                break;
        }

        // Draw small indicator dots around the enemy
        this.siphonTargetHighlight.fillStyle(indicatorColor, 0.9);
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2 + time;
            const dotX = Math.cos(angle) * 30;
            const dotY = Math.sin(angle) * 30;
            this.siphonTargetHighlight.fillCircle(dotX, dotY, 3);
        }

        this.siphonTargetHighlight.setVisible(true);
    }

    private hideSiphonHighlight(): void {
        if (this.siphonTargetHighlight) {
            this.siphonTargetHighlight.setVisible(false);
            this.siphonTargetHighlight.clear();
        }
    }

    private updateSiphonRangeIndicator(): void {
        if (!this.siphonRangeIndicator) return;

        // Show range indicator only when space key is being held
        if (this.inputSystem.isSiphonPressed()) {
            this.showSiphonRangeIndicator();
        } else {
            this.hideSiphonRangeIndicator();
        }
    }

    private showSiphonRangeIndicator(): void {
        if (!this.siphonRangeIndicator) return;

        // Clear previous drawing
        this.siphonRangeIndicator.clear();

        // Set position to player
        this.siphonRangeIndicator.setPosition(
            this.player.sprite.x,
            this.player.sprite.y
        );

        // Draw siphon range circle
        const siphonRange = 85;
        const time = this.scene.time.now * 0.003;
        const pulseAlpha = 0.1 + 0.05 * Math.sin(time); // Very subtle pulse

        // Draw range circle
        this.siphonRangeIndicator.lineStyle(2, 0x00ffff, pulseAlpha); // Cyan color
        this.siphonRangeIndicator.strokeCircle(0, 0, siphonRange);

        // Add subtle fill for better visibility
        this.siphonRangeIndicator.fillStyle(0x00ffff, pulseAlpha * 0.3);
        this.siphonRangeIndicator.fillCircle(0, 0, siphonRange);

        this.siphonRangeIndicator.setVisible(true);
    }

    private hideSiphonRangeIndicator(): void {
        if (this.siphonRangeIndicator) {
            this.siphonRangeIndicator.setVisible(false);
            this.siphonRangeIndicator.clear();
        }
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

        // Clean up siphon graphics
        if (this.siphonTargetHighlight) {
            this.siphonTargetHighlight.destroy();
            this.siphonTargetHighlight = null;
        }
        if (this.siphonRangeIndicator) {
            this.siphonRangeIndicator.destroy();
            this.siphonRangeIndicator = null;
        }
    }

    getEnemySystem(): EnemySystem {
        return this.enemySystem;
    }
}
