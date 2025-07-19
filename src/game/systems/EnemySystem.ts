import { Enemy, MageEnemy, CrabEnemy, GhostEnemy } from "../entities/Enemy";
import { EnemyType, EnemyConfig } from "../types/GameTypes";
import { Player } from "../entities/Player";
import { GAME_CONFIG } from "../config/GameConfig";

export interface SpawnConfig {
    enemyType: EnemyType;
    spawnRate: number; // Enemies per second
    maxCount: number; // Maximum number of this enemy type on screen
}

export class EnemySystem {
    private scene: Phaser.Scene;
    private enemies: Enemy[] = [];
    private player: Player | null = null;
    private spawnConfigs: SpawnConfig[] = [];
    private lastSpawnTimes: Map<EnemyType, number> = new Map();

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.initializeSpawnConfigs();
    }

    private initializeSpawnConfigs(): void {
        // Start with basic spawn rates - we can make this dynamic later
        this.spawnConfigs = [
            {
                enemyType: EnemyType.CRAB,
                spawnRate: 0.3, // Every ~3 seconds
                maxCount: 3,
            },
            {
                enemyType: EnemyType.MAGE,
                spawnRate: 0.2, // Every ~5 seconds
                maxCount: 2,
            },
            {
                enemyType: EnemyType.GHOST,
                spawnRate: 0.25, // Every ~4 seconds
                maxCount: 2,
            },
        ];

        // Initialize spawn timers
        this.spawnConfigs.forEach((config) => {
            this.lastSpawnTimes.set(config.enemyType, 0);
        });
    }

    setPlayer(player: Player): void {
        this.player = player;
        // Set target for all existing enemies
        this.enemies.forEach((enemy) => enemy.setTarget(player));
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

        this.enemies.push(enemy);

        // Emit event for collision setup
        this.scene.events.emit("enemySpawned", enemy.sprite, enemy.type);

        console.log(`Spawned ${type} at (${spawnPos.x}, ${spawnPos.y})`);
    }

    private getRandomSpawnPosition(): { x: number; y: number } {
        // Spawn enemies off-screen or at screen edges
        const margin = 50;
        const side = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left

        switch (side) {
            case 0: // Top
                return {
                    x: Math.random() * GAME_CONFIG.width,
                    y: -margin,
                };
            case 1: // Right
                return {
                    x: GAME_CONFIG.width + margin,
                    y: Math.random() * GAME_CONFIG.height,
                };
            case 2: // Bottom
                return {
                    x: Math.random() * GAME_CONFIG.width,
                    y: GAME_CONFIG.height + margin,
                };
            case 3: // Left
                return {
                    x: -margin,
                    y: Math.random() * GAME_CONFIG.height,
                };
            default:
                return { x: 0, y: 0 };
        }
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
