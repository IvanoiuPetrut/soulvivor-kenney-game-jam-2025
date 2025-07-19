import { PowerType } from "../types/GameTypes";
import { Player } from "../entities/Player";
import { Enemy } from "../entities/Enemy";
import { GAME_CONFIG } from "../config/GameConfig";
import { AudioManager } from "../managers/AudioManager";
import { ParticleManager } from "../managers/ParticleManager";

export class WeaponSystem {
    private scene: Phaser.Scene;
    private player: Player;
    private audioManager: AudioManager;
    private particleManager: ParticleManager;
    private currentPower: PowerType = PowerType.NONE;

    // Crab Sword (revolving)
    private swordSprite: Phaser.GameObjects.Sprite | null = null;
    private swordAngle: number = 0;
    private swordRadius: number = 50;

    // Ghost Daggers
    private daggers: Phaser.GameObjects.Sprite[] = [];
    private daggerCooldown: number = 500; // 0.5 seconds
    private lastDaggerTime: number = 0;

    // Mage Projectile
    private mageProjectiles: Phaser.GameObjects.Graphics[] = [];
    private mageCooldown: number = 1000; // 1 second
    private lastMageTime: number = 0;

    constructor(
        scene: Phaser.Scene,
        player: Player,
        audioManager: AudioManager,
        particleManager: ParticleManager
    ) {
        this.scene = scene;
        this.player = player;
        this.audioManager = audioManager;
        this.particleManager = particleManager;
    }

    setPower(powerType: PowerType): void {
        // Clean up current power
        this.cleanup();

        this.currentPower = powerType;

        // Initialize new power
        switch (powerType) {
            case PowerType.CRAB_SWORD:
                this.initializeSword();
                break;
            case PowerType.GHOST_DAGGERS:
                console.log("Ghost daggers equipped!");
                break;
            case PowerType.MAGE_PROJECTILE:
                console.log("Mage projectile equipped!");
                break;
        }
    }

    private initializeSword(): void {
        // Create revolving sword sprite
        this.swordSprite = this.scene.add.sprite(
            this.player.sprite.x,
            this.player.sprite.y,
            "crab_power"
        );
        this.swordSprite.setScale(GAME_CONFIG.spriteScale);
        this.swordSprite.setDepth(95); // Above player but below UI

        console.log("Crab sword equipped!");
    }

    update(deltaTime: number, enemies: Enemy[]): void {
        if (this.currentPower === PowerType.NONE) return;

        switch (this.currentPower) {
            case PowerType.CRAB_SWORD:
                this.updateSword(deltaTime, enemies);
                break;
            case PowerType.GHOST_DAGGERS:
                this.updateDaggers(deltaTime, enemies);
                break;
            case PowerType.MAGE_PROJECTILE:
                this.updateMageProjectiles(deltaTime, enemies);
                break;
        }
    }

    private updateSword(deltaTime: number, enemies: Enemy[]): void {
        if (!this.swordSprite) return;

        // Rotate sword around player
        this.swordAngle += deltaTime * 3; // 3 radians per second

        const x =
            this.player.sprite.x + Math.cos(this.swordAngle) * this.swordRadius;
        const y =
            this.player.sprite.y + Math.sin(this.swordAngle) * this.swordRadius;

        this.swordSprite.setPosition(x, y);
        this.swordSprite.setRotation(this.swordAngle + Math.PI / 2); // Point outward

        // Check collision with enemies
        enemies.forEach((enemy) => {
            if (!enemy.sprite.active) return;

            const dx = this.swordSprite!.x - enemy.sprite.x;
            const dy = this.swordSprite!.y - enemy.sprite.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 25) {
                // 25 pixel collision
                enemy.takeDamage(30); // Sword damage

                // Play hit sound
                this.audioManager.playHit();

                // Create hit particles
                this.particleManager.createEnemyHitEffect(
                    enemy.sprite.x,
                    enemy.sprite.y
                );

                // Visual effect
                this.scene.tweens.add({
                    targets: enemy.sprite,
                    scaleX: GAME_CONFIG.spriteScale * 1.2,
                    scaleY: GAME_CONFIG.spriteScale * 1.2,
                    duration: 100,
                    ease: "Power2",
                    yoyo: true,
                });
            }
        });
    }

    private updateDaggers(deltaTime: number, enemies: Enemy[]): void {
        const currentTime = this.scene.time.now;

        // Check if we can shoot daggers
        if (currentTime - this.lastDaggerTime >= this.daggerCooldown) {
            const nearestEnemy = this.findNearestEnemy(enemies, 150); // 150 pixel range
            if (nearestEnemy) {
                this.shootDaggers(nearestEnemy);
                this.lastDaggerTime = currentTime;
            }
        }

        // Update existing daggers
        this.daggers = this.daggers.filter((dagger) => {
            if (!dagger.active) return false;

            // Check collision with enemies
            let hit = false;
            enemies.forEach((enemy) => {
                if (!enemy.sprite.active || hit) return;

                const dx = dagger.x - enemy.sprite.x;
                const dy = dagger.y - enemy.sprite.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < 20) {
                    enemy.takeDamage(20); // Dagger damage
                    this.audioManager.playHit();
                    this.particleManager.createEnemyHitEffect(
                        enemy.sprite.x,
                        enemy.sprite.y
                    );
                    dagger.destroy();
                    hit = true;
                }
            });

            return !hit;
        });
    }

    private updateMageProjectiles(deltaTime: number, enemies: Enemy[]): void {
        const currentTime = this.scene.time.now;

        // Check if we can shoot projectile
        if (currentTime - this.lastMageTime >= this.mageCooldown) {
            const nearestEnemy = this.findNearestEnemy(enemies, 300); // 300 pixel range
            if (nearestEnemy) {
                this.shootMageProjectile(nearestEnemy);
                this.lastMageTime = currentTime;
            }
        }

        // Update existing projectiles
        this.mageProjectiles = this.mageProjectiles.filter((projectile) => {
            if (!projectile.active) return false;

            // Check collision with enemies
            let hit = false;
            enemies.forEach((enemy) => {
                if (!enemy.sprite.active || hit) return;

                const dx = projectile.x - enemy.sprite.x;
                const dy = projectile.y - enemy.sprite.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < 25) {
                    enemy.takeDamage(40); // High mage damage
                    this.audioManager.playHit();
                    this.particleManager.createEnemyHitEffect(
                        enemy.sprite.x,
                        enemy.sprite.y
                    );
                    projectile.destroy();
                    hit = true;
                }
            });

            return !hit;
        });
    }

    private shootDaggers(target: Enemy): void {
        // Shoot 3 daggers in a cone
        const angles = [-0.3, 0, 0.3]; // Cone spread

        angles.forEach((angleOffset) => {
            const dagger = this.scene.add.sprite(
                this.player.sprite.x,
                this.player.sprite.y,
                "ghost_power"
            );
            dagger.setScale(GAME_CONFIG.spriteScale * 0.8);
            dagger.setDepth(95);

            // Calculate direction
            const baseAngle = Math.atan2(
                target.sprite.y - this.player.sprite.y,
                target.sprite.x - this.player.sprite.x
            );
            const finalAngle = baseAngle + angleOffset;

            dagger.setRotation(finalAngle);

            // Animate dagger
            const speed = 400;
            const targetX = dagger.x + Math.cos(finalAngle) * speed;
            const targetY = dagger.y + Math.sin(finalAngle) * speed;

            this.scene.tweens.add({
                targets: dagger,
                x: targetX,
                y: targetY,
                duration: 1000,
                ease: "Linear",
                onComplete: () => {
                    if (dagger.active) dagger.destroy();
                },
            });

            this.daggers.push(dagger);
        });
    }

    private shootMageProjectile(target: Enemy): void {
        // Create magic projectile
        const projectile = this.scene.add.graphics();
        projectile.fillStyle(0x4a90e2, 1); // Blue magic orb
        projectile.fillCircle(0, 0, 6);
        projectile.x = this.player.sprite.x;
        projectile.y = this.player.sprite.y;
        projectile.setDepth(95);

        // Calculate direction
        const dx = target.sprite.x - this.player.sprite.x;
        const dy = target.sprite.y - this.player.sprite.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        const speed = 500;
        const velocityX = (dx / distance) * speed;
        const velocityY = (dy / distance) * speed;

        // Animate projectile
        this.scene.tweens.add({
            targets: projectile,
            x: projectile.x + velocityX * 2,
            y: projectile.y + velocityY * 2,
            duration: 2000,
            ease: "Linear",
            onComplete: () => {
                if (projectile.active) projectile.destroy();
            },
        });

        this.mageProjectiles.push(projectile);
    }

    private findNearestEnemy(enemies: Enemy[], maxRange: number): Enemy | null {
        let nearest: Enemy | null = null;
        let nearestDistance = maxRange;

        enemies.forEach((enemy) => {
            if (!enemy.sprite.active) return;

            const dx = enemy.sprite.x - this.player.sprite.x;
            const dy = enemy.sprite.y - this.player.sprite.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < nearestDistance) {
                nearest = enemy;
                nearestDistance = distance;
            }
        });

        return nearest;
    }

    getCurrentPower(): PowerType {
        return this.currentPower;
    }

    private cleanup(): void {
        // Clean up sword
        if (this.swordSprite) {
            this.swordSprite.destroy();
            this.swordSprite = null;
        }

        // Clean up daggers
        this.daggers.forEach((dagger) => dagger.destroy());
        this.daggers = [];

        // Clean up mage projectiles
        this.mageProjectiles.forEach((projectile) => projectile.destroy());
        this.mageProjectiles = [];
    }

    destroy(): void {
        this.cleanup();
    }
}
