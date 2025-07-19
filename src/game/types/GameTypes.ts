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
    type: "fodder" | "elite";
}

export enum PowerType {
    NONE = "none",
    HOMING_SPIRIT = "homing_spirit",
    REVOLVING_SCYTHES = "revolving_scythes",
    CHAIN_LIGHTNING = "chain_lightning",
}

export interface Power {
    type: PowerType;
    cooldown: number;
    lastUsed: number;
    damage: number;
}
