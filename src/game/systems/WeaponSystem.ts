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
    private baseSwordRadius: number = 50;

    // Ghost Daggers
    private daggers: Phaser.GameObjects.Sprite[] = [];
    private baseDaggerCooldown: number = 500; // 0.5 seconds
    private lastDaggerTime: number = 0;

    // Mage Projectile
    private mageProjectiles: Phaser.GameObjects.Graphics[] = [];
    private baseMageCooldown: number = 1000; // 1 second
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

    private getSwordRadius(): number {
        return this.baseSwordRadius * this.player.stats.weaponRangeMultiplier;
    }

    private getDaggerCooldown(): number {
        return (
            this.baseDaggerCooldown / this.player.stats.attackSpeedMultiplier
        );
    }

    private getMageCooldown(): number {
        return this.baseMageCooldown / this.player.stats.attackSpeedMultiplier;
    }

    private getWeaponDamage(baseDamage: number): number {
        return Math.floor(
            baseDamage * this.player.stats.weaponDamageMultiplier
        );
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
        // Scale sword based on range multiplier
        const swordScale =
            GAME_CONFIG.spriteScale * this.player.stats.weaponRangeMultiplier;
        this.swordSprite.setScale(swordScale);
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

        // Rotate sword around player (faster based on attack speed)
        const rotationSpeed = 3 * this.player.stats.attackSpeedMultiplier;
        this.swordAngle += deltaTime * rotationSpeed;

        const swordRadius = this.getSwordRadius();
        const x =
            this.player.sprite.x + Math.cos(this.swordAngle) * swordRadius;
        const y =
            this.player.sprite.y + Math.sin(this.swordAngle) * swordRadius;

        this.swordSprite.setPosition(x, y);
        this.swordSprite.setRotation(this.swordAngle + Math.PI / 2); // Point outward

        // Update sword scale based on range multiplier
        const swordScale =
            GAME_CONFIG.spriteScale * this.player.stats.weaponRangeMultiplier;
        this.swordSprite.setScale(swordScale);

        // Check collision with enemies (larger hitbox based on range)
        const hitRadius = 25 * this.player.stats.weaponRangeMultiplier;
        enemies.forEach((enemy) => {
            if (!enemy.sprite.active) return;

            const dx = this.swordSprite!.x - enemy.sprite.x;
            const dy = this.swordSprite!.y - enemy.sprite.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < hitRadius) {
                const damage = this.getWeaponDamage(30); // Base sword damage
                enemy.takeDamage(damage);

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
        const daggerCooldown = this.getDaggerCooldown();

        // Check if we can shoot daggers
        if (currentTime - this.lastDaggerTime >= daggerCooldown) {
            const range = 150 * this.player.stats.weaponRangeMultiplier;
            const nearestEnemy = this.findNearestEnemy(enemies, range);
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
                    const damage = this.getWeaponDamage(20); // Base dagger damage
                    enemy.takeDamage(damage);
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
        const mageCooldown = this.getMageCooldown();

        // Check if we can shoot projectile
        if (currentTime - this.lastMageTime >= mageCooldown) {
            const range = 300 * this.player.stats.weaponRangeMultiplier;
            const nearestEnemy = this.findNearestEnemy(enemies, range);
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
                    const damage = this.getWeaponDamage(40); // Base mage damage
                    enemy.takeDamage(damage);
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
        // Calculate number of daggers (base 3 + additional projectiles)
        const numDaggers = 3 + this.player.stats.additionalProjectiles;
        const angles: number[] = [];

        // Create angle spread based on number of daggers
        const baseSpread = 0.6; // Base cone spread
        const angleStep = baseSpread / (numDaggers - 1);
        const startAngle = -baseSpread / 2;

        for (let i = 0; i < numDaggers; i++) {
            angles.push(startAngle + i * angleStep);
        }

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

            // Animate dagger with increased range
            const speed = 400;
            const range = 1000 * this.player.stats.weaponRangeMultiplier;
            const targetX = dagger.x + Math.cos(finalAngle) * range;
            const targetY = dagger.y + Math.sin(finalAngle) * range;

            this.scene.tweens.add({
                targets: dagger,
                x: targetX,
                y: targetY,
                duration: (range / speed) * 1000,
                ease: "Linear",
                onComplete: () => {
                    if (dagger.active) dagger.destroy();
                },
            });

            this.daggers.push(dagger);
        });
    }

    private shootMageProjectile(target: Enemy): void {
        // Calculate number of projectiles (base 1 + additional)
        const numProjectiles = 1 + this.player.stats.additionalProjectiles;

        for (let i = 0; i < numProjectiles; i++) {
            // Create magic projectile
            const projectile = this.scene.add.graphics();
            projectile.fillStyle(0x4a90e2, 1); // Blue magic orb
            const orbSize = 6 * this.player.stats.weaponRangeMultiplier;
            projectile.fillCircle(0, 0, orbSize);

            // Slight offset for multiple projectiles
            const offsetAngle = (i - (numProjectiles - 1) / 2) * 0.2;
            const offsetX = Math.cos(offsetAngle) * 10;
            const offsetY = Math.sin(offsetAngle) * 10;

            projectile.x = this.player.sprite.x + offsetX;
            projectile.y = this.player.sprite.y + offsetY;
            projectile.setDepth(95);

            // Calculate direction
            const dx = target.sprite.x - this.player.sprite.x;
            const dy = target.sprite.y - this.player.sprite.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            const speed = 500;
            const range = 2000 * this.player.stats.weaponRangeMultiplier;
            const velocityX = (dx / distance) * speed;
            const velocityY = (dy / distance) * speed;

            // Animate projectile
            this.scene.tweens.add({
                targets: projectile,
                x: projectile.x + velocityX * (range / speed),
                y: projectile.y + velocityY * (range / speed),
                duration: (range / speed) * 1000,
                ease: "Linear",
                onComplete: () => {
                    if (projectile.active) projectile.destroy();
                },
            });

            this.mageProjectiles.push(projectile);
        }
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

    upgradeWeapon(): void {
        switch (this.currentPower) {
            case PowerType.CRAB_SWORD:
                // Increase sword speed and radius
                this.baseSwordRadius = Math.min(this.baseSwordRadius + 10, 80); // Max radius 80
                console.log(
                    `Crab sword upgraded! New radius: ${this.baseSwordRadius}`
                );
                break;
            case PowerType.GHOST_DAGGERS:
                // Reduce cooldown for faster shooting
                this.baseDaggerCooldown = Math.max(
                    this.baseDaggerCooldown - 100,
                    200
                ); // Min 200ms cooldown
                console.log(
                    `Ghost daggers upgraded! New cooldown: ${this.baseDaggerCooldown}ms`
                );
                break;
            case PowerType.MAGE_PROJECTILE:
                // Reduce cooldown for faster shooting
                this.baseMageCooldown = Math.max(
                    this.baseMageCooldown - 200,
                    400
                ); // Min 400ms cooldown
                console.log(
                    `Mage projectile upgraded! New cooldown: ${this.baseMageCooldown}ms`
                );
                break;
            default:
                console.log("No weapon to upgrade");
                break;
        }
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
