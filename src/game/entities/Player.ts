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
        (this.sprite.body as Phaser.Physics.Arcade.Body).setCollideWorldBounds(
            true
        );
    }

    update(deltaTime: number): void {
        // Update position based on velocity
        this.sprite.x += this.velocity.x * deltaTime;
        this.sprite.y += this.velocity.y * deltaTime;

        // Update position tracking
        this.position.x = this.sprite.x;
        this.position.y = this.sprite.y;

        // Keep player within bounds (accounting for sprite size)
        const spriteHalfSize =
            (GAME_CONFIG.baseSpriteSize * GAME_CONFIG.spriteScale) / 2;
        this.sprite.x = Phaser.Math.Clamp(
            this.sprite.x,
            spriteHalfSize,
            GAME_CONFIG.width - spriteHalfSize
        );
        this.sprite.y = Phaser.Math.Clamp(
            this.sprite.y,
            spriteHalfSize,
            GAME_CONFIG.height - spriteHalfSize
        );
    }

    move(direction: { x: number; y: number }): void {
        this.velocity.x = direction.x * this.speed;
        this.velocity.y = direction.y * this.speed;
    }

    takeDamage(amount: number): void {
        this.health = Math.max(0, this.health - amount);

        // Visual feedback for taking damage
        this.sprite.setTint(0xff0000);
        this.scene.time.delayedCall(100, () => {
            this.sprite.setTint(0xffffff);
        });

        if (this.health <= 0) {
            this.destroy();
        }
    }

    heal(amount: number): void {
        this.health = Math.min(this.maxHealth, this.health + amount);
    }

    setPower(power: Power): void {
        this.currentPower = power;
        console.log(`Player acquired power: ${power.type}`);
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
        this.sprite.destroy();
    }
}
