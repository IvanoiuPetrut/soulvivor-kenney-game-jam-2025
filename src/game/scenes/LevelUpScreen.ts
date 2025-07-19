import { Scene } from "phaser";
import {
    SCREEN_CENTER_X,
    SCREEN_CENTER_Y,
    GAME_CONFIG,
} from "../config/GameConfig";

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

export class LevelUpScreen extends Scene {
    private background: Phaser.GameObjects.Rectangle;
    private titleText: Phaser.GameObjects.Text;
    private upgradeOptions: Upgrade[] = [];
    private optionBoxes: Phaser.GameObjects.Container[] = [];
    private selectedCallback: ((upgrade: Upgrade) => void) | null = null;

    constructor() {
        super("LevelUpScreen");
    }

    create(): void {
        // Semi-transparent black background to dim the game
        this.background = this.add.rectangle(
            SCREEN_CENTER_X,
            SCREEN_CENTER_Y,
            GAME_CONFIG.width,
            GAME_CONFIG.height,
            0x000000,
            0.8
        );
        this.background.setDepth(1000);

        // Title
        this.titleText = this.add
            .text(SCREEN_CENTER_X, SCREEN_CENTER_Y - 150, "LEVEL UP!", {
                fontFamily: "KenneyPixel, Arial",
                fontSize: "48px",
                color: "#ffff00",
                stroke: "#000000",
                strokeThickness: 4,
            })
            .setOrigin(0.5)
            .setDepth(1001);

        // Generate and display upgrade options
        this.generateUpgradeOptions();
        this.createUpgradeUI();
    }

    private generateUpgradeOptions(): void {
        const allUpgrades: Upgrade[] = [
            {
                type: UpgradeType.MOVEMENT_SPEED,
                title: "Swift Feet",
                description: "+20% Movement Speed\nDodge enemies with ease!",
            },
            {
                type: UpgradeType.WEAPON_UPGRADE,
                title: "Weapon Mastery",
                description:
                    "Improve current weapon:\n• Sword: +25% range, +15% speed\n• Daggers: -20% cooldown, +1 dagger\n• Magic: +50% cast speed",
            },
            {
                type: UpgradeType.LIFE_REGEN,
                title: "Vitality",
                description: "+5 Max Health\n+1 Health per 3 seconds",
            },
        ];

        // For now, show all 3 options (later could be randomized selection)
        this.upgradeOptions = allUpgrades;
    }

    private createUpgradeUI(): void {
        const optionWidth = 250;
        const optionHeight = 180;
        const spacing = 300;
        const startX =
            SCREEN_CENTER_X - (spacing * (this.upgradeOptions.length - 1)) / 2;

        this.upgradeOptions.forEach((upgrade, index) => {
            const x = startX + index * spacing;
            const y = SCREEN_CENTER_Y + 20;

            // Create container for this option
            const container = this.add.container(x, y);
            container.setDepth(1001);

            // Background box
            const box = this.add.rectangle(
                0,
                0,
                optionWidth,
                optionHeight,
                0x2c3e50
            );
            box.setStrokeStyle(3, 0x3498db);

            // Title text
            const titleText = this.add
                .text(0, -60, upgrade.title, {
                    fontFamily: "KenneyPixel, Arial",
                    fontSize: "20px",
                    color: "#ffffff",
                    stroke: "#000000",
                    strokeThickness: 2,
                    align: "center",
                })
                .setOrigin(0.5);

            // Description text
            const descText = this.add
                .text(0, 10, upgrade.description, {
                    fontFamily: "KenneyPixel, Arial",
                    fontSize: "14px",
                    color: "#ecf0f1",
                    stroke: "#000000",
                    strokeThickness: 1,
                    align: "center",
                    wordWrap: { width: optionWidth - 20 },
                })
                .setOrigin(0.5);

            // Add elements to container
            container.add([box, titleText, descText]);

            // Make interactive
            box.setInteractive({ useHandCursor: true });

            // Hover effects
            box.on("pointerover", () => {
                box.setStrokeStyle(3, 0xe74c3c);
                container.setScale(1.05);
                this.tweens.add({
                    targets: container,
                    scaleX: 1.05,
                    scaleY: 1.05,
                    duration: 100,
                    ease: "Back.easeOut",
                });
            });

            box.on("pointerout", () => {
                box.setStrokeStyle(3, 0x3498db);
                this.tweens.add({
                    targets: container,
                    scaleX: 1.0,
                    scaleY: 1.0,
                    duration: 100,
                    ease: "Back.easeOut",
                });
            });

            // Click handler
            box.on("pointerdown", () => {
                this.selectUpgrade(upgrade);
            });

            // Keyboard support
            if (index < 3) {
                const keys = ["ONE", "TWO", "THREE"];
                const keyName = keys[index];

                this.input.keyboard?.on(`keydown-${keyName}`, () => {
                    this.selectUpgrade(upgrade);
                });

                // Add number indicator
                const numberText = this.add
                    .text(-100, -80, `${index + 1}`, {
                        fontFamily: "KenneyPixel, Arial",
                        fontSize: "16px",
                        color: "#f39c12",
                        stroke: "#000000",
                        strokeThickness: 2,
                    })
                    .setOrigin(0.5);

                container.add(numberText);
            }

            this.optionBoxes.push(container);
        });

        // Add instruction text
        this.add
            .text(
                SCREEN_CENTER_X,
                SCREEN_CENTER_Y + 180,
                "Click or press 1, 2, 3 to choose",
                {
                    fontFamily: "KenneyPixel, Arial",
                    fontSize: "16px",
                    color: "#bdc3c7",
                    stroke: "#000000",
                    strokeThickness: 1,
                    align: "center",
                }
            )
            .setOrigin(0.5)
            .setDepth(1001);
    }

    private selectUpgrade(upgrade: Upgrade): void {
        // Play selection animation
        this.tweens.add({
            targets: this.optionBoxes,
            alpha: 0,
            scaleX: 0.8,
            scaleY: 0.8,
            duration: 200,
            ease: "Power2.easeIn",
            onComplete: () => {
                // Notify callback and close screen
                if (this.selectedCallback) {
                    this.selectedCallback(upgrade);
                }
                this.scene.stop();
            },
        });

        this.tweens.add({
            targets: [this.background, this.titleText],
            alpha: 0,
            duration: 200,
            ease: "Power2.easeIn",
        });
    }

    public showLevelUpScreen(callback: (upgrade: Upgrade) => void): void {
        this.selectedCallback = callback;

        // Start entrance animation
        this.optionBoxes.forEach((container, index) => {
            container.setAlpha(0);
            container.setScale(0.5);

            this.tweens.add({
                targets: container,
                alpha: 1,
                scaleX: 1,
                scaleY: 1,
                duration: 300,
                delay: index * 100,
                ease: "Back.easeOut",
            });
        });
    }
}
