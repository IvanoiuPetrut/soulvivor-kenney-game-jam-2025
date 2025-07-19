import {
    GameEntity,
    PlayerConfig,
    Position,
    Velocity,
    Power,
    PowerType,
} from "../types/GameTypes";
import { GAME_CONFIG } from "../config/GameConfig";
import { AudioManager } from "../managers/AudioManager";

export class Player implements GameEntity {
    sprite: Phaser.GameObjects.Sprite;
    position: Position;
    velocity: Velocity;
    health: number;
    maxHealth: number;
    speed: number;
    scene: Phaser.Scene;
    currentPower: Power;
    private audioManager: AudioManager | null = null;

    // Health bar components
    private healthBarBackground: Phaser.GameObjects.Rectangle;
    private healthBarFill: Phaser.GameObjects.Rectangle;
    private healthBarWidth: number = 40;
    private healthBarHeight: number = 6;

    // Animation and visual properties
    private idleTween: Phaser.Tweens.Tween | null = null;
    private lastMovementDirection: { x: number; y: number } = { x: 0, y: 0 };
    private isMoving: boolean = false;

    constructor(scene: Phaser.Scene, config: PlayerConfig) {
        this.scene = scene;
        this.speed = config.speed;
        this.health = config.health;
        this.maxHealth = config.health;

        this.position = { x: config.x, y: config.y };
        this.velocity = { x: 0, y: 0 };

        // Create the player sprite
        this.sprite = scene.add.sprite(config.x, config.y, "player");
        this.sprite.setScale(GAME_CONFIG.spriteScale); // Scale up the 16x16 sprite
        this.sprite.setDepth(100); // Ensure player is rendered on top

        // Initialize with no power
        this.currentPower = {
            type: PowerType.NONE,
            cooldown: 0,
            lastUsed: 0,
            damage: 0,
        };

        // Enable physics on the player sprite
        scene.physics.add.existing(this.sprite);
        // Remove world bounds restriction for infinite movement
        // (this.sprite.body as Phaser.Physics.Arcade.Body).setCollideWorldBounds(true);

        // Create health bar
        this.createHealthBar();

        // Start idle animation
        this.startIdleAnimation();
    }

    private createHealthBar(): void {
        const offsetY = 25; // Distance below player sprite

        // Create health bar background (dark red)
        this.healthBarBackground = this.scene.add.rectangle(
            this.sprite.x,
            this.sprite.y + offsetY,
            this.healthBarWidth,
            this.healthBarHeight,
            0x660000
        );
        this.healthBarBackground.setDepth(90); // Above ground, below player

        // Create health bar fill (bright red)
        this.healthBarFill = this.scene.add.rectangle(
            this.sprite.x,
            this.sprite.y + offsetY,
            this.healthBarWidth,
            this.healthBarHeight,
            0xff0000
        );
        this.healthBarFill.setDepth(91); // Above background
    }

    update(deltaTime: number): void {
        // Update position tracking from physics body (physics handles the actual movement)
        this.position.x = this.sprite.x;
        this.position.y = this.sprite.y;

        // Update health bar position
        this.updateHealthBar();

        // Update movement state for animations
        this.updateMovementState();
    }

    private updateHealthBar(): void {
        const offsetY = 25;

        // Update health bar positions to follow player
        this.healthBarBackground.setPosition(
            this.sprite.x,
            this.sprite.y + offsetY
        );
        this.healthBarFill.setPosition(this.sprite.x, this.sprite.y + offsetY);

        // Update health bar fill width based on current health
        const healthPercentage = this.health / this.maxHealth;
        const fillWidth = this.healthBarWidth * healthPercentage;
        this.healthBarFill.setSize(fillWidth, this.healthBarHeight);

        // Change health bar color based on health percentage
        if (healthPercentage > 0.6) {
            this.healthBarFill.setFillStyle(0x00ff00); // Green when healthy
        } else if (healthPercentage > 0.3) {
            this.healthBarFill.setFillStyle(0xffaa00); // Orange when moderate
        } else {
            this.healthBarFill.setFillStyle(0xff0000); // Red when critical
        }
    }

    move(direction: { x: number; y: number }): void {
        // Set physics body velocity instead of internal velocity
        const body = this.sprite.body as Phaser.Physics.Arcade.Body;
        body.setVelocity(direction.x * this.speed, direction.y * this.speed);

        // Update internal velocity tracking for consistency
        this.velocity.x = direction.x * this.speed;
        this.velocity.y = direction.y * this.speed;

        // Handle sprite flipping based on horizontal movement
        this.handleSpriteFlipping(direction);

        // Update movement tracking
        this.lastMovementDirection = { ...direction };

        // Update movement state
        const newIsMoving = direction.x !== 0 || direction.y !== 0;
        if (newIsMoving !== this.isMoving) {
            this.isMoving = newIsMoving;
            if (this.isMoving) {
                this.stopIdleAnimation();
                this.startMovementAnimation();
            } else {
                this.stopMovementAnimation();
                this.startIdleAnimation();
            }
        }
    }

    private handleSpriteFlipping(direction: { x: number; y: number }): void {
        // Only flip horizontally when there's horizontal movement
        if (direction.x > 0) {
            // Moving right - face right (normal orientation)
            this.sprite.setFlipX(false);
        } else if (direction.x < 0) {
            // Moving left - face left (flipped)
            this.sprite.setFlipX(true);
        }
        // Don't change flip when only moving vertically or not moving
    }

    private updateMovementState(): void {
        // Add subtle movement bob when moving
        if (this.isMoving) {
            // Add a very subtle vertical bob while moving
            const time = this.scene.time.now;
            const bobOffset = Math.sin(time * 0.015) * 2; // Very subtle 2-pixel bob
            this.sprite.y += bobOffset * 0.1; // Make it extremely subtle
        }
    }

    private startIdleAnimation(): void {
        if (this.idleTween) return; // Already running

        // Gentle breathing animation - subtle scale pulse
        this.idleTween = this.scene.tweens.add({
            targets: this.sprite,
            scaleX: GAME_CONFIG.spriteScale * 1.02, // Very subtle scale change
            scaleY: GAME_CONFIG.spriteScale * 0.98,
            duration: 2000, // 2 second breathing cycle
            ease: "Sine.easeInOut",
            yoyo: true,
            repeat: -1,
            onComplete: () => {
                this.idleTween = null;
            },
        });
    }

    private stopIdleAnimation(): void {
        if (this.idleTween) {
            this.idleTween.destroy();
            this.idleTween = null;
            // Reset scale to normal
            this.sprite.setScale(GAME_CONFIG.spriteScale);
        }
    }

    private startMovementAnimation(): void {
        // When moving, add a subtle bounce effect
        this.scene.tweens.add({
            targets: this.sprite,
            scaleX: GAME_CONFIG.spriteScale * 1.05,
            scaleY: GAME_CONFIG.spriteScale * 0.95,
            duration: 100,
            ease: "Back.easeOut",
            yoyo: true,
            onComplete: () => {
                // Reset to normal scale
                this.sprite.setScale(GAME_CONFIG.spriteScale);
            },
        });
    }

    private stopMovementAnimation(): void {
        // Smooth transition back to idle
        this.scene.tweens.add({
            targets: this.sprite,
            scaleX: GAME_CONFIG.spriteScale,
            scaleY: GAME_CONFIG.spriteScale,
            duration: 200,
            ease: "Sine.easeOut",
        });
    }

    setAudioManager(audioManager: AudioManager): void {
        this.audioManager = audioManager;
    }

    takeDamage(amount: number): void {
        this.health = Math.max(0, this.health - amount);

        // Play hurt sound
        if (this.audioManager) {
            this.audioManager.playHurt();
        }

        // Enhanced visual feedback for taking damage

        // 1. Red tint effect on player sprite
        this.sprite.setTint(0xff4444);

        // 2. Sprite wobble/shake effect
        const originalX = this.sprite.x;
        const originalY = this.sprite.y;

        this.scene.tweens.add({
            targets: this.sprite,
            x: originalX + 8,
            y: originalY + 4,
            duration: 60,
            ease: "Power2",
            yoyo: true,
            repeat: 2,
            onComplete: () => {
                // Reset position and tint
                this.sprite.setPosition(originalX, originalY);
                this.sprite.setTint(0xffffff);
            },
        });

        // 3. Health bar shake effect
        this.scene.tweens.add({
            targets: [this.healthBarBackground, this.healthBarFill],
            scaleY: 1.5,
            duration: 100,
            ease: "Back.easeOut",
            yoyo: true,
        });

        // 4. Health bar flash effect
        this.scene.tweens.add({
            targets: this.healthBarFill,
            alpha: 0.3,
            duration: 150,
            ease: "Sine.easeInOut",
            yoyo: true,
            repeat: 1,
        });

        // 5. Screen shake effect (slight)
        this.scene.cameras.main.shake(200, 0.02);

        // 6. Health bar color pulse effect for critical health
        const healthPercentage = this.health / this.maxHealth;
        if (healthPercentage <= 0.3 && healthPercentage > 0) {
            this.scene.tweens.add({
                targets: this.healthBarFill,
                scaleX: 1.1,
                duration: 300,
                ease: "Sine.easeInOut",
                yoyo: true,
                repeat: 2,
            });
        }

        if (this.health <= 0) {
            this.destroy();
        }
    }

    heal(amount: number): void {
        this.health = Math.min(this.maxHealth, this.health + amount);

        // Add healing visual effect
        this.sprite.setTint(0x00ff00);
        this.scene.tweens.add({
            targets: this.sprite,
            scaleX: GAME_CONFIG.spriteScale * 1.2,
            scaleY: GAME_CONFIG.spriteScale * 1.2,
            duration: 200,
            ease: "Back.easeOut",
            yoyo: true,
            onComplete: () => {
                this.sprite.setTint(0xffffff);
                this.sprite.setScale(GAME_CONFIG.spriteScale);
            },
        });
    }

    setPower(power: Power): void {
        this.currentPower = power;
        console.log(`Player acquired power: ${power.type}`);

        // Add power acquisition visual effect
        this.scene.tweens.add({
            targets: this.sprite,
            scaleX: GAME_CONFIG.spriteScale * 1.3,
            scaleY: GAME_CONFIG.spriteScale * 1.3,
            duration: 300,
            ease: "Back.easeOut",
            yoyo: true,
        });
    }

    canUsePower(): boolean {
        if (this.currentPower.type === PowerType.NONE) return false;

        const currentTime = this.scene.time.now;
        return (
            currentTime - this.currentPower.lastUsed >=
            this.currentPower.cooldown
        );
    }

    usePower(): void {
        if (!this.canUsePower()) return;

        this.currentPower.lastUsed = this.scene.time.now;

        // Power usage will be implemented when we add specific powers
        switch (this.currentPower.type) {
            case PowerType.CRAB_SWORD:
                // TODO: Implement crab sword
                break;
            case PowerType.GHOST_DAGGERS:
                // TODO: Implement ghost daggers
                break;
            case PowerType.MAGE_PROJECTILE:
                // TODO: Implement mage projectile
                break;
        }
    }

    getPosition(): Position {
        return { ...this.position };
    }

    destroy(): void {
        // Clean up animations
        this.stopIdleAnimation();
        this.scene.tweens.killTweensOf(this.sprite);

        // Clean up health bar
        if (this.healthBarBackground) {
            this.healthBarBackground.destroy();
        }
        if (this.healthBarFill) {
            this.healthBarFill.destroy();
        }

        this.sprite.destroy();
    }
}
