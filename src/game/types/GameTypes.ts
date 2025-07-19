export interface Position {
    x: number;
    y: number;
}

export interface Velocity {
    x: number;
    y: number;
}

export interface GameEntity {
    sprite: Phaser.GameObjects.Sprite;
    position: Position;
    velocity: Velocity;
    health: number;
    maxHealth: number;
    update(deltaTime: number): void;
}

export interface InputKeys {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
    siphon: Phaser.Input.Keyboard.Key;
}

export interface PlayerConfig {
    x: number;
    y: number;
    speed: number;
    health: number;
}

export interface EnemyConfig {
    x: number;
    y: number;
    speed: number;
    health: number;
    type: EnemyType;
}

export enum PowerType {
    NONE = "none",
    CRAB_SWORD = "crab_sword", // Revolving sword around player
    GHOST_DAGGERS = "ghost_daggers", // Short range cone attack
    MAGE_PROJECTILE = "mage_projectile", // Long range single projectile
}

export interface Power {
    type: PowerType;
    cooldown: number;
    lastUsed: number;
    damage: number;
}

// Enemy system types
export enum EnemyType {
    MAGE = "mage",
    CRAB = "crab",
    GHOST = "ghost",
}

export interface EnemyStats {
    health: number;
    speed: number;
    damage: number;
    attackRange: number;
    attackCooldown: number;
    points: number; // XP points awarded on death
}

export interface EnemyBehavior {
    canPassThroughWalls: boolean;
    hasRangedAttack: boolean;
    attackPattern: "melee" | "ranged" | "special";
    aggroRange: number; // Distance at which enemy starts chasing player
}
