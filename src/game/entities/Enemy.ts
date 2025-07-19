import {
    GameEntity,
    Position,
    Velocity,
    EnemyConfig,
    EnemyType,
    EnemyStats,
    EnemyBehavior,
} from "../types/GameTypes";
import { GAME_CONFIG } from "../config/GameConfig";
import { Player } from "./Player";

export abstract class Enemy implements GameEntity {
    sprite: Phaser.GameObjects.Sprite;
    position: Position;
    velocity: Velocity;
    health: number;
    maxHealth: number;
    scene: Phaser.Scene;
    type: EnemyType;
    stats: EnemyStats;
    behavior: EnemyBehavior;

    // AI and behavior properties
    protected target: Player | null = null;
    protected lastAttackTime: number = 0;
    protected isAlive: boolean = true;

    constructor(
        scene: Phaser.Scene,
        config: EnemyConfig,
        stats: EnemyStats,
        behavior: EnemyBehavior
    ) {
        this.scene = scene;
        this.type = config.type;
        this.stats = stats;
        this.behavior = behavior;

        this.health = stats.health;
        this.maxHealth = stats.health;
        this.position = { x: config.x, y: config.y };
        this.velocity = { x: 0, y: 0 };

        // Create sprite based on enemy type
        const spriteKey = `enemy_${config.type}`;
        this.sprite = scene.add.sprite(config.x, config.y, spriteKey);
        this.sprite.setScale(GAME_CONFIG.spriteScale);
        this.sprite.setDepth(50); // Below player but above background

        // Enable physics
        scene.physics.add.existing(this.sprite);
        // Remove world bounds restriction for infinite movement
        // (this.sprite.body as Phaser.Physics.Arcade.Body).setCollideWorldBounds(
        //     !behavior.canPassThroughWalls
        // );
    }

    update(deltaTime: number): void {
        if (!this.isAlive) return;

        // Update AI behavior
        this.updateAI(deltaTime);

        // Update position tracking from physics body (physics handles the actual movement)
        this.position.x = this.sprite.x;
        this.position.y = this.sprite.y;

        // Update specific enemy behavior
        this.updateBehavior(deltaTime);
    }

    protected abstract updateAI(deltaTime: number): void;
    protected abstract updateBehavior(deltaTime: number): void;
    protected abstract attack(): void;

    setTarget(player: Player): void {
        this.target = player;
    }

    protected moveTowardsTarget(): void {
        if (!this.target) return;

        const dx = this.target.position.x - this.position.x;
        const dy = this.target.position.y - this.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0) {
            // Calculate velocity
            const velocityX = (dx / distance) * this.stats.speed;
            const velocityY = (dy / distance) * this.stats.speed;

            // Set physics body velocity
            const body = this.sprite.body as Phaser.Physics.Arcade.Body;
            body.setVelocity(velocityX, velocityY);

            // Update internal velocity tracking for consistency
            this.velocity.x = velocityX;
            this.velocity.y = velocityY;

            // Handle sprite flipping like player
            if (dx > 0) {
                this.sprite.setFlipX(false); // Face right
            } else if (dx < 0) {
                this.sprite.setFlipX(true); // Face left
            }
        }
    }

    protected isInAttackRange(): boolean {
        if (!this.target) return false;

        const dx = this.target.position.x - this.position.x;
        const dy = this.target.position.y - this.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        return distance <= this.stats.attackRange;
    }

    protected canAttack(): boolean {
        const currentTime = this.scene.time.now;
        return currentTime - this.lastAttackTime >= this.stats.attackCooldown;
    }

    takeDamage(amount: number): void {
        this.health = Math.max(0, this.health - amount);

        // Visual feedback
        this.sprite.setTint(0xff0000);
        this.scene.time.delayedCall(100, () => {
            this.sprite.setTint(0xffffff);
        });

        if (this.health <= 0) {
            this.die();
        }
    }

    protected die(): void {
        this.isAlive = false;

        // Death animation
        this.scene.tweens.add({
            targets: this.sprite,
            alpha: 0,
            scaleX: GAME_CONFIG.spriteScale * 1.5,
            scaleY: GAME_CONFIG.spriteScale * 1.5,
            duration: 300,
            ease: "Power2",
            onComplete: () => {
                this.destroy();
            },
        });

        // Emit death event for scoring
        this.scene.events.emit("enemyDefeated", this.stats.points, this.type);
        console.log(
            `${this.type} defeated! Awarded ${this.stats.points} points`
        );
    }

    destroy(): void {
        this.scene.tweens.killTweensOf(this.sprite);
        this.sprite.destroy();
    }

    getDistanceToTarget(): number {
        if (!this.target) return Infinity;

        const dx = this.target.position.x - this.position.x;
        const dy = this.target.position.y - this.position.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
}

// Mage Enemy - Ranged attacker
export class MageEnemy extends Enemy {
    private projectiles: Phaser.GameObjects.Graphics[] = [];

    constructor(scene: Phaser.Scene, config: EnemyConfig) {
        const stats: EnemyStats = {
            health: 30,
            speed: 80,
            damage: 15,
            attackRange: 200,
            attackCooldown: 2000, // 2 seconds
            points: 15,
        };

        const behavior: EnemyBehavior = {
            canPassThroughWalls: true, // All enemies can now pass through obstacles
            hasRangedAttack: true,
            attackPattern: "ranged",
            aggroRange: Infinity, // Follow player at infinite distance
        };

        super(scene, config, stats, behavior);
    }

    protected updateAI(deltaTime: number): void {
        if (!this.target) return;

        const distanceToTarget = this.getDistanceToTarget();

        // Always pursue since aggro range is infinite
        // If in attack range, stop moving and attack
        if (this.isInAttackRange() && this.canAttack()) {
            // Stop movement using physics body
            const body = this.sprite.body as Phaser.Physics.Arcade.Body;
            body.setVelocity(0, 0);

            // Update internal velocity tracking for consistency
            this.velocity.x = 0;
            this.velocity.y = 0;
            this.attack();
        } else if (!this.isInAttackRange()) {
            // Move towards target but maintain some distance
            this.moveTowardsTarget();
        }
    }

    protected updateBehavior(deltaTime: number): void {
        // Update projectiles and check for player collision
        this.projectiles = this.projectiles.filter((projectile) => {
            if (!projectile.active) {
                return false; // Remove inactive projectiles
            }

            // Check collision with player using distance
            if (this.target) {
                const dx = projectile.x - this.target.position.x;
                const dy = projectile.y - this.target.position.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                // If projectile is close enough to player (collision)
                if (distance < 20) {
                    // 20 pixel collision radius
                    // Deal damage to player
                    this.target.takeDamage(this.stats.damage);

                    // Create hit effect
                    this.scene.tweens.add({
                        targets: projectile,
                        scaleX: 2,
                        scaleY: 2,
                        alpha: 0,
                        duration: 200,
                        ease: "Power2",
                        onComplete: () => {
                            if (projectile && projectile.active) {
                                projectile.destroy();
                            }
                        },
                    });

                    return false; // Remove projectile from array
                }
            }

            return true; // Keep projectile
        });
    }

    protected attack(): void {
        this.lastAttackTime = this.scene.time.now;

        // Create a magic projectile
        this.createProjectile();

        // Visual attack feedback
        this.scene.tweens.add({
            targets: this.sprite,
            scaleX: GAME_CONFIG.spriteScale * 1.2,
            scaleY: GAME_CONFIG.spriteScale * 1.2,
            duration: 200,
            ease: "Back.easeOut",
            yoyo: true,
        });
    }

    private createProjectile(): void {
        if (!this.target) return;

        // Create a simple circular projectile
        const projectile = this.scene.add.graphics();
        projectile.fillStyle(0x8b5cf6, 1); // Purple magic orb
        projectile.fillCircle(0, 0, 4);
        projectile.x = this.position.x;
        projectile.y = this.position.y;
        projectile.setDepth(75);

        // Calculate direction to target
        const dx = this.target.position.x - this.position.x;
        const dy = this.target.position.y - this.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        const speed = 300;
        const velocityX = (dx / distance) * speed;
        const velocityY = (dy / distance) * speed;

        // Animate projectile
        this.scene.tweens.add({
            targets: projectile,
            x: projectile.x + velocityX * 2, // 2 seconds flight time
            y: projectile.y + velocityY * 2,
            duration: 2000,
            ease: "Linear",
            onComplete: () => {
                projectile.destroy();
            },
        });

        this.projectiles.push(projectile);
    }
}

// Crab Enemy - Melee tank
export class CrabEnemy extends Enemy {
    constructor(scene: Phaser.Scene, config: EnemyConfig) {
        const stats: EnemyStats = {
            health: 50,
            speed: 60,
            damage: 20,
            attackRange: 40,
            attackCooldown: 1500, // 1.5 seconds
            points: 10,
        };

        const behavior: EnemyBehavior = {
            canPassThroughWalls: true, // All enemies can now pass through obstacles
            hasRangedAttack: false,
            attackPattern: "melee",
            aggroRange: Infinity, // Follow player at infinite distance
        };

        super(scene, config, stats, behavior);
    }

    protected updateAI(deltaTime: number): void {
        if (!this.target) return;

        const distanceToTarget = this.getDistanceToTarget();

        // Always pursue aggressively since aggro range is infinite
        if (this.isInAttackRange() && this.canAttack()) {
            this.attack();
        } else {
            this.moveTowardsTarget();
        }
    }

    protected updateBehavior(deltaTime: number): void {
        // Add some side-to-side scuttling movement when moving
        if (this.velocity.x !== 0 || this.velocity.y !== 0) {
            const time = this.scene.time.now;
            const scuttleOffset = Math.sin(time * 0.01) * 10;
            this.sprite.y += scuttleOffset * 0.05;
        }
    }

    protected attack(): void {
        this.lastAttackTime = this.scene.time.now;
        console.log("Crab attack");

        // Check for collision with player and deal damage
        if (this.target) {
            const dx = this.sprite.x - this.target.position.x;
            const dy = this.sprite.y - this.target.position.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Use the same attack range as isInAttackRange method
            if (distance <= this.stats.attackRange) {
                this.target.takeDamage(this.stats.damage);
                console.log("Crab deals melee damage!");
            }
        }

        // Crab pincer attack animation
        this.scene.tweens.add({
            targets: this.sprite,
            scaleX: GAME_CONFIG.spriteScale * 1.3,
            duration: 150,
            ease: "Power2",
            yoyo: true,
        });
    }
}

// Ghost Enemy - Can phase through walls
export class GhostEnemy extends Enemy {
    private phaseAlpha: number = 0.7;

    constructor(scene: Phaser.Scene, config: EnemyConfig) {
        const stats: EnemyStats = {
            health: 25,
            speed: 100,
            damage: 12,
            attackRange: 35,
            attackCooldown: 1000, // 1 second
            points: 12,
        };

        const behavior: EnemyBehavior = {
            canPassThroughWalls: true, // All enemies can now pass through obstacles
            hasRangedAttack: false,
            attackPattern: "special",
            aggroRange: Infinity, // Follow player at infinite distance
        };

        super(scene, config, stats, behavior);

        // Make ghost semi-transparent and add floating effect
        this.sprite.setAlpha(this.phaseAlpha);
        this.startFloatingAnimation();
    }

    protected updateAI(deltaTime: number): void {
        if (!this.target) return;

        const distanceToTarget = this.getDistanceToTarget();

        // Ghost is very aggressive and always pursues since aggro range is infinite
        if (this.isInAttackRange() && this.canAttack()) {
            this.attack();
        } else {
            this.moveTowardsTarget();
        }
    }

    protected updateBehavior(deltaTime: number): void {
        // Ghost can move freely, no bounds checking needed since canPassThroughWalls is true
    }

    protected attack(): void {
        this.lastAttackTime = this.scene.time.now;

        // Check for collision with player and deal damage
        if (this.target) {
            const dx = this.sprite.x - this.target.position.x;
            const dy = this.sprite.y - this.target.position.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Use the same attack range as isInAttackRange method
            if (distance <= this.stats.attackRange) {
                this.target.takeDamage(this.stats.damage);
                console.log("Ghost deals phase damage!");
            }
        }

        // Ghost phase attack - briefly becomes more solid
        this.scene.tweens.add({
            targets: this.sprite,
            alpha: 1,
            scaleX: GAME_CONFIG.spriteScale * 1.2,
            scaleY: GAME_CONFIG.spriteScale * 1.2,
            duration: 200,
            ease: "Power2",
            yoyo: true,
            onComplete: () => {
                this.sprite.setAlpha(this.phaseAlpha);
            },
        });
    }

    private startFloatingAnimation(): void {
        // Gentle floating up and down
        this.scene.tweens.add({
            targets: this.sprite,
            y: this.sprite.y - 5,
            duration: 1500,
            ease: "Sine.easeInOut",
            yoyo: true,
            repeat: -1,
        });
    }
}
