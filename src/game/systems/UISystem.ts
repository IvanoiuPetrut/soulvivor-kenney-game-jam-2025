import { GameState } from "../managers/GameManager";
import { GAME_CONFIG } from "../config/GameConfig";

export class UISystem {
    private scene: Phaser.Scene;
    private timerText: Phaser.GameObjects.Text | null = null;
    // Removed healthText and scoreText since we now have visual health bar under player
    // and XP bar at bottom

    // XP bar components
    private xpBarBackground: Phaser.GameObjects.Rectangle | null = null;
    private xpBarFill: Phaser.GameObjects.Rectangle | null = null;
    private xpBarWidth: number = 400;
    private xpBarHeight: number = 12;
    private currentXP: number = 45; // Demo value for visual testing
    private maxXP: number = 100;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.createUI();
    }

    private createUI(): void {
        // Create survival timer that will stay at top of screen
        this.timerText = this.scene.add
            .text(0, 0, "00:00", {
                fontFamily: "Arial", // Fallback to Arial for now
                fontSize: "24px",
                color: "#ffffff",
                stroke: "#000000",
                strokeThickness: 2,
            })
            .setOrigin(0.5, 0) // Center horizontally, top aligned
            .setDepth(200)
            .setScrollFactor(0); // Make timer ignore camera movement

        // Create XP bar at bottom of screen
        this.createXPBar();

        // Position timer initially
        this.updateTimerPosition();
    }

    private createXPBar(): void {
        const camera = this.scene.cameras.main;

        // Create XP bar background (dark)
        this.xpBarBackground = this.scene.add.rectangle(
            0,
            0,
            this.xpBarWidth,
            this.xpBarHeight,
            0x333333
        );
        this.xpBarBackground.setDepth(200);
        this.xpBarBackground.setScrollFactor(0); // Stick to screen

        // Create XP bar fill (bright purple/blue)
        this.xpBarFill = this.scene.add.rectangle(
            0,
            0,
            this.xpBarWidth * (this.currentXP / this.maxXP),
            this.xpBarHeight,
            0x4a90e2
        );
        this.xpBarFill.setDepth(201);
        this.xpBarFill.setScrollFactor(0); // Stick to screen
        this.xpBarFill.setOrigin(0, 0.5); // Left-aligned fill

        // Position XP bar initially
        this.updateXPBarPosition();
    }

    private updateXPBarPosition(): void {
        const camera = this.scene.cameras.main;
        const bottomY = camera.y + camera.height - 30; // 30px from bottom
        const centerX = camera.centerX;

        if (this.xpBarBackground) {
            this.xpBarBackground.setPosition(centerX, bottomY);
        }

        if (this.xpBarFill) {
            // Position fill bar at left edge of background
            const fillX = centerX - this.xpBarWidth / 2;
            this.xpBarFill.setPosition(fillX, bottomY);
        }
    }

    private updateTimerPosition(): void {
        const camera = this.scene.cameras.main;

        // Position timer at top center of camera view
        if (this.timerText) {
            this.timerText.setPosition(camera.centerX, camera.y + 30);
        }
    }

    update(gameState: GameState, playerHealth: number): void {
        // Update UI positions to follow camera
        this.updateXPBarPosition();
        this.updateTimerPosition();

        // Update survival timer
        if (this.timerText) {
            const minutes = Math.floor(gameState.timeElapsed / 60);
            const seconds = Math.floor(gameState.timeElapsed % 60);
            const timeString = `${minutes.toString().padStart(2, "0")}:${seconds
                .toString()
                .padStart(2, "0")}`;
            this.timerText.setText(timeString);

            // Add some visual flair - change color based on survival time
            if (gameState.timeElapsed > 120) {
                // After 2 minutes
                this.timerText.setStyle({ color: "#ffaa00" }); // Orange
            }
            if (gameState.timeElapsed > 300) {
                // After 5 minutes
                this.timerText.setStyle({ color: "#ff4444" }); // Red
            }
        }

        // Update XP bar (using demo values for now - no logic implementation)
        if (this.xpBarFill) {
            const fillWidth = this.xpBarWidth * (this.currentXP / this.maxXP);
            this.xpBarFill.setSize(fillWidth, this.xpBarHeight);
        }
    }

    // Method to update font when custom font is loaded
    updateToCustomFont(): void {
        const customFontStyle = {
            fontFamily: "KenneyPixel, Arial",
            fontSize: "24px",
            color: "#ffffff",
            stroke: "#000000",
            strokeThickness: 2,
        };

        if (this.timerText) {
            this.timerText.setStyle(customFontStyle);
        }

        // Health and Score text styles are no longer used, so no need to update them here.
        // if (this.healthText) {
        //     this.healthText.setStyle({
        //         ...customFontStyle,
        //         fontSize: "18px",
        //         color: "#ff4444",
        //     });
        // }

        // if (this.scoreText) {
        //     this.scoreText.setStyle({
        //         ...customFontStyle,
        //         fontSize: "18px",
        //         color: "#44ff44",
        //     });
        // }
    }

    showGameOver(finalTime: string, finalScore: number): void {
        // Create game over overlay
        const overlay = this.scene.add
            .rectangle(
                GAME_CONFIG.width / 2,
                GAME_CONFIG.height / 2,
                GAME_CONFIG.width,
                GAME_CONFIG.height,
                0x000000,
                0.7
            )
            .setDepth(300);

        // Game over text
        const gameOverText = this.scene.add
            .text(
                GAME_CONFIG.width / 2,
                GAME_CONFIG.height / 2 - 50,
                "GAME OVER",
                {
                    fontFamily: "KenneyPixel, Arial",
                    fontSize: "48px",
                    color: "#ff4444",
                    stroke: "#000000",
                    strokeThickness: 4,
                }
            )
            .setOrigin(0.5)
            .setDepth(301);

        // Final stats
        const statsText = this.scene.add
            .text(
                GAME_CONFIG.width / 2,
                GAME_CONFIG.height / 2 + 20,
                `Survived: ${finalTime}\nFinal Score: ${finalScore}`,
                {
                    fontFamily: "KenneyPixel, Arial",
                    fontSize: "24px",
                    color: "#ffffff",
                    stroke: "#000000",
                    strokeThickness: 2,
                    align: "center",
                }
            )
            .setOrigin(0.5)
            .setDepth(301);

        // Restart instruction
        const restartText = this.scene.add
            .text(
                GAME_CONFIG.width / 2,
                GAME_CONFIG.height / 2 + 100,
                "Press R to Restart",
                {
                    fontFamily: "KenneyPixel, Arial",
                    fontSize: "20px",
                    color: "#cccccc",
                    stroke: "#000000",
                    strokeThickness: 2,
                }
            )
            .setOrigin(0.5)
            .setDepth(301);

        // Blinking animation for restart text
        this.scene.tweens.add({
            targets: restartText,
            alpha: 0.3,
            duration: 800,
            ease: "Sine.easeInOut",
            yoyo: true,
            repeat: -1,
        });
    }

    destroy(): void {
        if (this.timerText) {
            this.timerText.destroy();
            this.timerText = null;
        }
        // Removed healthText and scoreText destruction
        if (this.xpBarBackground) {
            this.xpBarBackground.destroy();
            this.xpBarBackground = null;
        }
        if (this.xpBarFill) {
            this.xpBarFill.destroy();
            this.xpBarFill = null;
        }
    }
}
