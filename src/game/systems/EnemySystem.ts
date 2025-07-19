import { Enemy, MageEnemy, CrabEnemy, GhostEnemy } from "../entities/Enemy";
import { EnemyType, EnemyConfig } from "../types/GameTypes";
import { Player } from "../entities/Player";
import { GAME_CONFIG } from "../config/GameConfig";
import { ParticleManager } from "../managers/ParticleManager";

export interface SpawnConfig {
    enemyType: EnemyType;
    spawnRate: number; // Enemies per second
    maxCount: number; // Maximum number of this enemy type on screen
}

export class EnemySystem {
    private scene: Phaser.Scene;
    private enemies: Enemy[] = [];
    private player: Player | null = null;
    private particleManager: ParticleManager | null = null;
    private spawnConfigs: SpawnConfig[] = [];
    private lastSpawnTimes: Map<EnemyType, number> = new Map();

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.initializeSpawnConfigs();
    }

    private initializeSpawnConfigs(): void {
        // Aggressive spawn rates for constant pressure
        this.spawnConfigs = [
            {
                enemyType: EnemyType.CRAB,
                spawnRate: 0.8, // Every ~1.25 seconds (much faster)
                maxCount: 15, // Allow many more enemies
            },
            {
                enemyType: EnemyType.MAGE,
                spawnRate: 0.6, // Every ~1.67 seconds (much faster)
                maxCount: 10, // Allow many more enemies
            },
            {
                enemyType: EnemyType.GHOST,
                spawnRate: 0.7, // Every ~1.43 seconds (much faster)
                maxCount: 12, // Allow many more enemies
            },
        ];

        // Initialize spawn timers
        this.spawnConfigs.forEach((config) => {
            this.lastSpawnTimes.set(config.enemyType, 0);
        });

        // Enable unlimited spawning for maximum pressure
        this.enableUnlimitedSpawning();
    }

    // Method to remove spawn limits for extreme pressure
    private enableUnlimitedSpawning(): void {
        this.spawnConfigs.forEach((config) => {
            config.maxCount = Infinity; // Remove all limits
            config.spawnRate *= 1.5; // Make spawning even faster
        });
        console.log("Unlimited spawning enabled - maximum pressure mode!");
    }

    setPlayer(player: Player): void {
        this.player = player;
        // Set target for all existing enemies
        this.enemies.forEach((enemy) => enemy.setTarget(player));
    }

    setParticleManager(particleManager: ParticleManager): void {
        this.particleManager = particleManager;
        // Set particle manager for all existing enemies
        this.enemies.forEach((enemy) =>
            enemy.setParticleManager(particleManager)
        );
    }

    update(deltaTime: number): void {
        // Update all enemies
        this.enemies.forEach((enemy) => enemy.update(deltaTime));

        // Remove dead enemies
        this.enemies = this.enemies.filter((enemy) => {
            if (!enemy.sprite.active) {
                return false;
            }
            return true;
        });

        // Handle spawning
        this.handleSpawning();
    }

    private handleSpawning(): void {
        if (!this.player) return;

        const currentTime = this.scene.time.now / 1000; // Convert to seconds

        this.spawnConfigs.forEach((config) => {
            const lastSpawnTime =
                this.lastSpawnTimes.get(config.enemyType) || 0;
            const timeSinceLastSpawn = currentTime - lastSpawnTime;
            const spawnInterval = 1 / config.spawnRate;

            // Check if it's time to spawn and we haven't reached max count
            if (timeSinceLastSpawn >= spawnInterval) {
                const currentCount = this.getEnemyCount(config.enemyType);
                if (currentCount < config.maxCount) {
                    this.spawnEnemy(config.enemyType);
                    this.lastSpawnTimes.set(config.enemyType, currentTime);

                    // Log pressure level every 10th enemy
                    const totalEnemies = this.getTotalEnemyCount();
                    if (totalEnemies % 10 === 0) {
                        console.log(
                            `Enemy pressure: ${totalEnemies} enemies active`
                        );
                    }
                }
            }
        });
    }

    private getEnemyCount(type: EnemyType): number {
        return this.enemies.filter((enemy) => enemy.type === type).length;
    }

    private spawnEnemy(type: EnemyType): void {
        const spawnPos = this.getRandomSpawnPosition();

        const config: EnemyConfig = {
            x: spawnPos.x,
            y: spawnPos.y,
            speed: 0, // Will be set by enemy class
            health: 0, // Will be set by enemy class
            type: type,
        };

        let enemy: Enemy;

        switch (type) {
            case EnemyType.MAGE:
                enemy = new MageEnemy(this.scene, config);
                break;
            case EnemyType.CRAB:
                enemy = new CrabEnemy(this.scene, config);
                break;
            case EnemyType.GHOST:
                enemy = new GhostEnemy(this.scene, config);
                break;
            default:
                return;
        }

        if (this.player) {
            enemy.setTarget(this.player);
        }

        if (this.particleManager) {
            enemy.setParticleManager(this.particleManager);
        }

        this.enemies.push(enemy);

        // Emit event for collision setup
        this.scene.events.emit("enemySpawned", enemy.sprite, enemy.type);

        // console.log(`Spawned ${type} at (${spawnPos.x}, ${spawnPos.y})`);
    }

    private getRandomSpawnPosition(): { x: number; y: number } {
        if (!this.player) {
            return { x: 0, y: 0 };
        }

        // Spawn enemies in a circle around the player
        const minDistance = 200; // Minimum distance from player
        const maxDistance = 400; // Maximum distance from player

        // Random distance within range
        const distance =
            minDistance + Math.random() * (maxDistance - minDistance);

        // Random angle (full circle)
        const angle = Math.random() * Math.PI * 2;

        // Calculate position
        const x = this.player.position.x + Math.cos(angle) * distance;
        const y = this.player.position.y + Math.sin(angle) * distance;

        return { x, y };
    }

    getEnemies(): Enemy[] {
        return [...this.enemies];
    }

    getTotalEnemyCount(): number {
        return this.enemies.length;
    }

    // Method to increase difficulty over time
    increaseDifficulty(): void {
        this.spawnConfigs.forEach((config) => {
            config.spawnRate = Math.min(config.spawnRate * 1.1, 1.0); // Cap at 1 per second
            config.maxCount = Math.min(config.maxCount + 1, 10); // Cap at 10 per type
        });

        console.log("Difficulty increased!");
    }

    clear(): void {
        this.enemies.forEach((enemy) => enemy.destroy());
        this.enemies = [];
        this.lastSpawnTimes.clear();
    }
}
