import {
    GameEntity,
    PlayerConfig,
    Position,
    Velocity,
    Power,
    PowerType,
    PlayerStats,
    SkillType,
    SkillTree,
} from "../types/GameTypes";
import { GAME_CONFIG } from "../config/GameConfig";
import { AudioManager } from "../managers/AudioManager";
import { ParticleManager } from "../managers/ParticleManager";

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
    private particleManager: ParticleManager | null = null;

    // Skill system
    public stats: PlayerStats;
    private skillLevels: Map<SkillType, number> = new Map();

    // Health bar components
    private healthBarBackground: Phaser.GameObjects.Rectangle;
    private healthBarFill: Phaser.GameObjects.Rectangle;
    private healthBarWidth: number = 40;
    private healthBarHeight: number = 6;
    private healthBarOffsetY: number = 35; // Single source of truth for health bar offset

    // Animation and visual properties
    private idleTween: Phaser.Tweens.Tween | null = null;
    private lastMovementDirection: { x: number; y: number } = { x: 0, y: 0 };
    private isMoving: boolean = false;

    constructor(scene: Phaser.Scene, config: PlayerConfig) {
        this.scene = scene;

        // Initialize stats system
        this.stats = {
            // Base stats
            baseSpeed: config.speed,
            baseHealth: config.health,

            // Skill-modified stats (start with base values)
            movementSpeed: config.speed,
            maxHealth: config.health,
            healthRegen: 0,
            damageResistance: 0,

            // Combat stats
            weaponDamageMultiplier: 1.0,
            attackSpeedMultiplier: 1.0,
            weaponRangeMultiplier: 1.0,
            additionalProjectiles: 0,

            // Skill points (start with 0, will be awarded on level up)
            availableSkillPoints: 0,
            totalSkillPoints: 0,

            // Regeneration tracking
            lastRegenTime: 0,
        };

        this.speed = this.stats.movementSpeed;
        this.health = config.health;
        this.maxHealth = this.stats.maxHealth;

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
        // Create health bar background (dark red)
        this.healthBarBackground = this.scene.add.rectangle(
            this.sprite.x,
            this.sprite.y + this.healthBarOffsetY,
            this.healthBarWidth,
            this.healthBarHeight,
            0x660000
        );
        this.healthBarBackground.setDepth(90); // Above ground, below player

        // Create health bar fill (bright red)
        this.healthBarFill = this.scene.add.rectangle(
            this.sprite.x,
            this.sprite.y + this.healthBarOffsetY,
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

        // Handle health regeneration
        this.handleHealthRegen(deltaTime);

        // Update speed based on current stats
        this.speed = this.stats.movementSpeed;

        // Update movement state for animations
        this.updateMovementState();

        // Update particle positions if moving
        if (this.isMoving && this.particleManager) {
            this.particleManager.startMovementParticles(
                this.sprite.x,
                this.sprite.y
            );
        }
    }

    private handleHealthRegen(deltaTime: number): void {
        if (this.stats.healthRegen <= 0) return;
        if (this.health >= this.maxHealth) return;

        const currentTime = this.scene.time.now;

        // Regenerate health every second
        if (currentTime - this.stats.lastRegenTime >= 1000) {
            const regenAmount = this.stats.healthRegen;
            this.health = Math.min(this.health + regenAmount, this.maxHealth);
            this.stats.lastRegenTime = currentTime;

            // Visual feedback for regeneration
            if (this.particleManager) {
                this.particleManager.createPowerUpEffect(
                    this.sprite.x,
                    this.sprite.y
                );
            }
        }
    }

    private updateHealthBar(): void {
        // Update health bar positions to follow player
        this.healthBarBackground.setPosition(
            this.sprite.x,
            this.sprite.y + this.healthBarOffsetY
        );
        this.healthBarFill.setPosition(
            this.sprite.x,
            this.sprite.y + this.healthBarOffsetY
        );

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
                // Start movement particles
                if (this.particleManager) {
                    this.particleManager.startMovementParticles(
                        this.sprite.x,
                        this.sprite.y
                    );
                }
            } else {
                this.stopMovementAnimation();
                this.startIdleAnimation();
                // Stop movement particles
                if (this.particleManager) {
                    this.particleManager.stopMovementParticles();
                }
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

    setParticleManager(particleManager: ParticleManager): void {
        this.particleManager = particleManager;
    }

    public applySkillBonus(skillType: SkillType, level: number): void {
        switch (skillType) {
            // Movement skills
            case SkillType.SPEED_BOOST:
                this.stats.movementSpeed =
                    this.stats.baseSpeed * (1 + level * 0.15); // 15% per level
                break;
            case SkillType.MOVEMENT_EFFICIENCY:
                // Reduces stamina cost for movement (placeholder for future stamina system)
                break;

            // Combat skills
            case SkillType.WEAPON_MASTERY:
                this.stats.weaponDamageMultiplier = 1 + level * 0.2; // 20% damage per level
                break;
            case SkillType.ATTACK_SPEED:
                this.stats.attackSpeedMultiplier = 1 + level * 0.25; // 25% attack speed per level
                break;
            case SkillType.WEAPON_RANGE:
                this.stats.weaponRangeMultiplier = 1 + level * 0.2; // 20% range per level
                break;
            case SkillType.MULTI_STRIKE:
                this.stats.additionalProjectiles = level; // +1 projectile per level
                break;

            // Vitality skills
            case SkillType.MAX_HEALTH:
                const healthIncrease = level * 20; // +20 HP per level
                this.stats.maxHealth = this.stats.baseHealth + healthIncrease;
                this.maxHealth = this.stats.maxHealth;
                break;
            case SkillType.HEALTH_REGEN:
                this.stats.healthRegen = level * 2; // +2 HP/sec per level
                break;
            case SkillType.DAMAGE_RESISTANCE:
                this.stats.damageResistance = Math.min(level * 0.1, 0.5); // 10% per level, max 50%
                break;
            case SkillType.LIFESTEAL:
                // Will be implemented in weapon systems
                break;
        }
    }

    public takeDamage(amount: number): void {
        // Apply damage resistance
        const finalDamage = Math.max(
            1,
            Math.floor(amount * (1 - this.stats.damageResistance))
        );

        this.health = Math.max(0, this.health - finalDamage);

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

        // Visual feedback
        this.sprite.setTint(0xff0000);
        this.scene.time.delayedCall(200, () => {
            this.sprite.setTint(0xffffff);
        });

        // Screen shake effect
        this.scene.cameras.main.shake(100, 0.01);

        // Damage particle effect
        if (this.particleManager) {
            this.particleManager.createPlayerHitEffect(
                this.sprite.x,
                this.sprite.y
            );
        }

        console.log(
            `Player took ${finalDamage} damage (${amount} reduced by ${Math.floor(
                this.stats.damageResistance * 100
            )}%)`
        );

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

    public getSkillLevel(skillType: SkillType): number {
        return this.skillLevels.get(skillType) || 0;
    }

    public setSkillLevel(skillType: SkillType, level: number): void {
        this.skillLevels.set(skillType, level);
    }
}
