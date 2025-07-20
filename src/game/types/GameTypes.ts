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

// Skill System Types
export enum SkillTree {
    MOVEMENT = "movement",
    COMBAT = "combat",
    VITALITY = "vitality",
}

export enum SkillType {
    // Movement skills
    SPEED_BOOST = "speed_boost",
    DASH = "dash",
    MOVEMENT_EFFICIENCY = "movement_efficiency",

    // Combat skills
    WEAPON_MASTERY = "weapon_mastery",
    ATTACK_SPEED = "attack_speed",
    WEAPON_RANGE = "weapon_range",
    MULTI_STRIKE = "multi_strike",

    // Vitality skills
    MAX_HEALTH = "max_health",
    HEALTH_REGEN = "health_regen",
    DAMAGE_RESISTANCE = "damage_resistance",
    LIFESTEAL = "lifesteal",
}

export interface Skill {
    id: SkillType;
    name: string;
    description: string;
    tree: SkillTree;
    maxLevel: number;
    currentLevel: number;
    cost: number; // Skill points required per level
    prerequisites?: SkillType[]; // Required skills
}

export interface PlayerStats {
    // Base stats
    baseSpeed: number;
    baseHealth: number;

    // Skill-modified stats
    movementSpeed: number;
    maxHealth: number;
    healthRegen: number; // HP per second
    damageResistance: number; // Percentage damage reduction

    // Combat stats
    weaponDamageMultiplier: number;
    attackSpeedMultiplier: number;
    weaponRangeMultiplier: number;
    additionalProjectiles: number; // For daggers/projectiles

    // Skill points
    availableSkillPoints: number;
    totalSkillPoints: number;

    // Regeneration tracking
    lastRegenTime: number;
}

export interface SkillUpgrade {
    skillId: SkillType;
    tree: SkillTree;
    pointsToSpend: number;
}

// Legacy upgrade system (keeping for backwards compatibility)
export enum UpgradeType {
    MOVEMENT_SPEED = "movement_speed",
    WEAPON_UPGRADE = "weapon_upgrade",
    LIFE_REGEN = "life_regen",
}

export interface Upgrade {
    type: UpgradeType;
    title: string;
    description: string;
    icon?: string;
}
