import { XPDrop } from "../entities/XPDrop";
import { Player } from "../entities/Player";
import { EnemyType } from "../types/GameTypes";
import { AudioManager } from "../managers/AudioManager";

export interface XPSystemState {
    currentXP: number;
    xpToNextLevel: number;
    level: number;
    totalXP: number;
}

export class XPSystem {
    private scene: Phaser.Scene;
    private xpDrops: XPDrop[] = [];
    private player: Player | null = null;
    private xpState: XPSystemState;
    private audioManager: AudioManager | null = null;

    // XP progression settings
    private baseXPRequired: number = 10; // XP needed for level 2
    private xpScaling: number = 1.5; // How much more XP each level needs

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.xpState = {
            currentXP: 0,
            xpToNextLevel: this.baseXPRequired,
            level: 1,
            totalXP: 0,
        };

        this.setupEventListeners();
    }

    setPlayer(player: Player): void {
        this.player = player;
        // Set player reference for all existing drops
        this.xpDrops.forEach((drop) => drop.setPlayer(player));
    }

    setAudioManager(audioManager: AudioManager): void {
        this.audioManager = audioManager;
    }

    private setupEventListeners(): void {
        // Listen for XP collection
        this.scene.events.on("xpCollected", (xpValue: number) => {
            this.addXP(xpValue);
        });

        // Listen for XP drop creation requests
        this.scene.events.on(
            "createXPDrop",
            (x: number, y: number, enemyType: EnemyType) => {
                this.createXPDrop(x, y, enemyType);
            }
        );
    }

    createXPDrop(x: number, y: number, enemyType: EnemyType): void {
        // Different enemy types drop different amounts of XP
        let xpValue = 1;
        switch (enemyType) {
            case EnemyType.MAGE:
                xpValue = 3; // Higher XP for harder enemies
                break;
            case EnemyType.CRAB:
                xpValue = 2;
                break;
            case EnemyType.GHOST:
                xpValue = 2;
                break;
            default:
                xpValue = 1;
        }

        const xpDrop = new XPDrop(this.scene, x, y, xpValue);

        if (this.player) {
            xpDrop.setPlayer(this.player);
        }

        this.xpDrops.push(xpDrop);
    }

    private addXP(amount: number): void {
        this.xpState.currentXP += amount;
        this.xpState.totalXP += amount;

        // Play power-up sound when XP is collected
        if (this.audioManager) {
            this.audioManager.playPowerUp();
        }

        // Check for level up
        if (this.xpState.currentXP >= this.xpState.xpToNextLevel) {
            this.levelUp();
        }

        // Emit XP change event for UI updates
        this.scene.events.emit("xpChanged", this.xpState);
    }

    private levelUp(): void {
        // Calculate overflow XP
        const overflow = this.xpState.currentXP - this.xpState.xpToNextLevel;

        // Increase level
        this.xpState.level++;

        // Calculate XP needed for next level (exponential scaling)
        this.xpState.xpToNextLevel = Math.floor(
            this.baseXPRequired *
                Math.pow(this.xpScaling, this.xpState.level - 1)
        );

        // Set current XP to overflow amount
        this.xpState.currentXP = overflow;

        // Emit level up event
        this.scene.events.emit("levelUp", this.xpState);

        console.log(`Level up! Now level ${this.xpState.level}`);
    }

    update(deltaTime: number): void {
        // Update all XP drops
        this.xpDrops = this.xpDrops.filter((drop) => {
            if (drop.sprite && drop.sprite.active) {
                drop.update(deltaTime);
                return true;
            } else {
                // Clean up destroyed drops
                drop.destroy();
                return false;
            }
        });
    }

    getXPState(): XPSystemState {
        return { ...this.xpState };
    }

    getXPProgress(): number {
        return this.xpState.currentXP / this.xpState.xpToNextLevel;
    }

    cleanup(): void {
        // Clean up all XP drops
        this.xpDrops.forEach((drop) => drop.destroy());
        this.xpDrops = [];

        // Remove event listeners
        this.scene.events.off("xpCollected");
        this.scene.events.off("enemyDefeated");
    }
}
