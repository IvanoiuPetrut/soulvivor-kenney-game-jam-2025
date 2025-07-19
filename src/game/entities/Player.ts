import {
    GameEntity,
    PlayerConfig,
    Position,
    Velocity,
    Power,
    PowerType,
} from "../types/GameTypes";
import { GAME_CONFIG } from "../config/GameConfig";

export class Player implements GameEntity {
    sprite: Phaser.GameObjects.Sprite;
    position: Position;
    velocity: Velocity;
    health: number;
    maxHealth: number;
    speed: number;
    scene: Phaser.Scene;
    currentPower: Power;

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

        // Start idle animation
        this.startIdleAnimation();
    }

    update(deltaTime: number): void {
        // Update position tracking from physics body (physics handles the actual movement)
        this.position.x = this.sprite.x;
        this.position.y = this.sprite.y;

        // Update movement state for animations
        this.updateMovementState();
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

    takeDamage(amount: number): void {
        this.health = Math.max(0, this.health - amount);

        // Enhanced visual feedback for taking damage
        this.sprite.setTint(0xff0000);

        // Add a damage shake effect
        this.scene.tweens.add({
            targets: this.sprite,
            x: this.sprite.x + 5,
            duration: 50,
            ease: "Power2",
            yoyo: true,
            repeat: 3,
            onComplete: () => {
                this.sprite.x = this.position.x; // Reset position
            },
        });

        this.scene.time.delayedCall(150, () => {
            this.sprite.setTint(0xffffff);
        });

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
            case PowerType.HOMING_SPIRIT:
                // TODO: Implement homing spirit
                break;
            case PowerType.REVOLVING_SCYTHES:
                // TODO: Implement revolving scythes
                break;
            case PowerType.CHAIN_LIGHTNING:
                // TODO: Implement chain lightning
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
        this.sprite.destroy();
    }
}
