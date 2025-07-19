import { GameState } from "../managers/GameManager";
import { GAME_CONFIG } from "../config/GameConfig";

export class UISystem {
    private scene: Phaser.Scene;
    private timerText: Phaser.GameObjects.Text | null = null;
    private healthText: Phaser.GameObjects.Text | null = null;
    private scoreText: Phaser.GameObjects.Text | null = null;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.createUI();
    }

    private createUI(): void {
        // Create survival timer (top center)
        this.timerText = this.scene.add
            .text(GAME_CONFIG.width / 2, 30, "00:00", {
                fontFamily: "Arial", // Fallback to Arial for now
                fontSize: "24px",
                color: "#ffffff",
                stroke: "#000000",
                strokeThickness: 2,
            })
            .setOrigin(0.5, 0)
            .setDepth(200);

        // Create health display (top left)
        this.healthText = this.scene.add
            .text(20, 20, "Health: 100", {
                fontFamily: "Arial",
                fontSize: "18px",
                color: "#ff4444",
                stroke: "#000000",
                strokeThickness: 2,
            })
            .setDepth(200);

        // Create score display (top right)
        this.scoreText = this.scene.add
            .text(GAME_CONFIG.width - 20, 20, "Score: 0", {
                fontFamily: "Arial",
                fontSize: "18px",
                color: "#44ff44",
                stroke: "#000000",
                strokeThickness: 2,
            })
            .setOrigin(1, 0)
            .setDepth(200);
    }

    update(gameState: GameState, playerHealth: number): void {
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

        // Update health display
        if (this.healthText) {
            this.healthText.setText(`Health: ${playerHealth}`);

            // Change color based on health
            if (playerHealth > 70) {
                this.healthText.setStyle({ color: "#44ff44" }); // Green
            } else if (playerHealth > 30) {
                this.healthText.setStyle({ color: "#ffaa00" }); // Orange
            } else {
                this.healthText.setStyle({ color: "#ff4444" }); // Red
            }
        }

        // Update score display
        if (this.scoreText) {
            this.scoreText.setText(`Score: ${gameState.score}`);
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

        if (this.healthText) {
            this.healthText.setStyle({
                ...customFontStyle,
                fontSize: "18px",
                color: "#ff4444",
            });
        }

        if (this.scoreText) {
            this.scoreText.setStyle({
                ...customFontStyle,
                fontSize: "18px",
                color: "#44ff44",
            });
        }
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
        if (this.healthText) {
            this.healthText.destroy();
            this.healthText = null;
        }
        if (this.scoreText) {
            this.scoreText.destroy();
            this.scoreText = null;
        }
    }
}
