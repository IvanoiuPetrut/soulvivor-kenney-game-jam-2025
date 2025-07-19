import { GameEntity, Position, Velocity } from "../types/GameTypes";
import { GAME_CONFIG } from "../config/GameConfig";
import { Player } from "./Player";

export class XPDrop implements GameEntity {
    sprite: Phaser.GameObjects.Sprite;
    position: Position;
    velocity: Velocity;
    scene: Phaser.Scene;
    health: number = 1;
    maxHealth: number = 1;
    xpValue: number;

    private player: Player | null = null;
    private attractionRange: number = 100; // Range at which XP starts moving toward player
    private collectionRange: number = 25; // Range at which XP is collected
    private attractionSpeed: number = 200; // Speed when moving toward player
    private isBeingAttracted: boolean = false;
    private bobTween: Phaser.Tweens.Tween | null = null;

    constructor(
        scene: Phaser.Scene,
        x: number,
        y: number,
        xpValue: number = 1
    ) {
        this.scene = scene;
        this.xpValue = xpValue;
        this.position = { x, y };
        this.velocity = { x: 0, y: 0 };

        // Create XP drop sprite using the star image
        this.sprite = scene.add.sprite(x, y, "xp_drop");
        this.sprite.setScale(GAME_CONFIG.spriteScale * 0.5); // Smaller than normal sprites
        this.sprite.setDepth(45); // Above ground but below enemies
        this.sprite.setTint(0x00ff00); // Green color for XP
        this.sprite.setAlpha(0.5);

        // PostFX

        // Enable physics
        scene.physics.add.existing(this.sprite);
        const body = this.sprite.body as Phaser.Physics.Arcade.Body;
        body.setSize(8, 8); // Small collision box

        // Start floating animation
        this.startFloatingAnimation();
    }

    setPlayer(player: Player): void {
        this.player = player;
    }

    update(deltaTime: number): void {
        if (!this.player) return;

        const playerPos = this.player.getPosition();
        const distance = this.getDistanceToPlayer(playerPos);

        // Check if player is close enough to collect
        if (distance <= this.collectionRange) {
            this.collect();
            return;
        }

        // Check if player is close enough to start attraction
        if (distance <= this.attractionRange && !this.isBeingAttracted) {
            this.startAttraction();
        } else if (distance > this.attractionRange && this.isBeingAttracted) {
            this.stopAttraction();
        }

        // Move toward player if being attracted
        if (this.isBeingAttracted) {
            this.moveTowardPlayer(playerPos, deltaTime);
        }

        // Update position tracking
        this.position.x = this.sprite.x;
        this.position.y = this.sprite.y;
    }

    private getDistanceToPlayer(playerPos: Position): number {
        const dx = this.sprite.x - playerPos.x;
        const dy = this.sprite.y - playerPos.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    private moveTowardPlayer(playerPos: Position, deltaTime: number): void {
        // Calculate direction to player
        const dx = playerPos.x - this.sprite.x;
        const dy = playerPos.y - this.sprite.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0) {
            // Normalize and apply speed
            const normalizedX = dx / distance;
            const normalizedY = dy / distance;

            // Use physics body for smooth movement
            const body = this.sprite.body as Phaser.Physics.Arcade.Body;
            body.setVelocity(
                normalizedX * this.attractionSpeed,
                normalizedY * this.attractionSpeed
            );
        }
    }

    private startAttraction(): void {
        this.isBeingAttracted = true;

        // Stop floating animation and start attraction effects
        this.stopFloatingAnimation();

        // Scale up slightly when attracted
        this.scene.tweens.add({
            targets: this.sprite,
            scaleX: GAME_CONFIG.spriteScale * 0.7,
            scaleY: GAME_CONFIG.spriteScale * 0.7,
            duration: 200,
            ease: "Back.easeOut",
        });

        // Add attraction glow effect
        this.sprite.setTint(0x44ff44);
    }

    private stopAttraction(): void {
        this.isBeingAttracted = false;

        // Stop physics movement
        const body = this.sprite.body as Phaser.Physics.Arcade.Body;
        body.setVelocity(0, 0);

        // Scale back down
        this.scene.tweens.add({
            targets: this.sprite,
            scaleX: GAME_CONFIG.spriteScale * 0.5,
            scaleY: GAME_CONFIG.spriteScale * 0.5,
            duration: 200,
            ease: "Back.easeOut",
        });

        // Remove glow
        this.sprite.setTint(0x00ff00);

        // Restart floating animation
        this.startFloatingAnimation();
    }

    private startFloatingAnimation(): void {
        if (this.bobTween) return;

        this.bobTween = this.scene.tweens.add({
            targets: this.sprite,
            y: this.sprite.y - 3,
            alpha: 0.5,
            scaleX: GAME_CONFIG.spriteScale * 0.5,
            scaleY: GAME_CONFIG.spriteScale * 0.5,
            duration: 1000,
            ease: "Sine.easeInOut",
            yoyo: true,
            repeat: -1,
        });
    }

    private stopFloatingAnimation(): void {
        if (this.bobTween) {
            this.bobTween.destroy();
            this.bobTween = null;
        }
    }

    private collect(): void {
        // Collection animation - scale up and fade out
        this.scene.tweens.add({
            targets: this.sprite,
            scaleX: GAME_CONFIG.spriteScale * 1.2,
            scaleY: GAME_CONFIG.spriteScale * 1.2,
            alpha: 0,
            duration: 150,
            ease: "Back.easeOut",
            onComplete: () => {
                // Emit collection event
                this.scene.events.emit("xpCollected", this.xpValue);
                this.destroy();
            },
        });

        // Stop all other animations
        this.stopFloatingAnimation();
        this.isBeingAttracted = false;
    }

    destroy(): void {
        this.stopFloatingAnimation();
        this.scene.tweens.killTweensOf(this.sprite);
        if (this.sprite.body) {
            (this.sprite.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
        }
        this.sprite.destroy();
    }
}
