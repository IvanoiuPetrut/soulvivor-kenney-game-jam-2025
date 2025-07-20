import { EventBus } from "../EventBus";
import { Scene } from "phaser";
import { SCREEN_CENTER_X, SCREEN_CENTER_Y } from "../config/GameConfig";
import { AudioManager } from "../managers/AudioManager";

export class GameOver extends Scene {
    background: Phaser.GameObjects.Image;
    audioManager: AudioManager;
    private finalTime: string = "";
    private finalScore: number = 0;
    private timeInSeconds: number = 0;

    constructor() {
        super("GameOver");
    }

    init(data: {
        finalTime: string;
        finalScore: number;
        timeInSeconds: number;
    }) {
        // Receive data from the game scene
        this.finalTime = data.finalTime || "00:00";
        this.finalScore = data.finalScore || 0;
        this.timeInSeconds = data.timeInSeconds || 0;
    }

    create() {
        // Initialize audio manager
        this.audioManager = new AudioManager(this);

        // Add background with dark overlay
        this.background = this.add
            .image(SCREEN_CENTER_X, SCREEN_CENTER_Y, "background")
            .setOrigin(0.5)
            .setDisplaySize(1024, 768)
            .setAlpha(0.3);

        // Dark overlay
        this.add.rectangle(
            SCREEN_CENTER_X,
            SCREEN_CENTER_Y,
            1024,
            768,
            0x000000,
            0.6
        );

        // Game Over title
        this.add
            .text(SCREEN_CENTER_X, SCREEN_CENTER_Y - 150, "GAME OVER", {
                fontFamily: "KenneyPixel",
                fontSize: 64,
                color: "#ff4444",
                stroke: "#000000",
                strokeThickness: 8,
                align: "center",
            })
            .setOrigin(0.5)
            .setDepth(100);

        // Final stats box background
        const statsBoxBG = this.add
            .rectangle(
                SCREEN_CENTER_X,
                SCREEN_CENTER_Y - 20,
                400,
                160,
                0x1a1a2e,
                0.8
            )
            .setStrokeStyle(3, 0x68c5f9)
            .setDepth(99);

        // Stats title
        this.add
            .text(SCREEN_CENTER_X, SCREEN_CENTER_Y - 80, "FINAL STATS", {
                fontFamily: "KenneyPixel",
                fontSize: 24,
                color: "#68c5f9",
                stroke: "#000000",
                strokeThickness: 3,
                align: "center",
            })
            .setOrigin(0.5)
            .setDepth(100);

        // Time survived
        this.add
            .text(
                SCREEN_CENTER_X,
                SCREEN_CENTER_Y - 40,
                `Time Survived: ${this.finalTime}`,
                {
                    fontFamily: "KenneyPixel",
                    fontSize: 20,
                    color: "#ffffff",
                    stroke: "#000000",
                    strokeThickness: 2,
                    align: "center",
                }
            )
            .setOrigin(0.5)
            .setDepth(100);

        // Final score
        this.add
            .text(
                SCREEN_CENTER_X,
                SCREEN_CENTER_Y - 10,
                `Final Score: ${this.finalScore}`,
                {
                    fontFamily: "KenneyPixel",
                    fontSize: 20,
                    color: "#ffffff",
                    stroke: "#000000",
                    strokeThickness: 2,
                    align: "center",
                }
            )
            .setOrigin(0.5)
            .setDepth(100);

        // Check if this is a new high score
        const isNewHighScore = this.checkIfHighScore();
        if (isNewHighScore) {
            this.add
                .text(
                    SCREEN_CENTER_X,
                    SCREEN_CENTER_Y + 20,
                    "🏆 NEW HIGH SCORE! 🏆",
                    {
                        fontFamily: "KenneyPixel",
                        fontSize: 18,
                        color: "#ffd700",
                        stroke: "#000000",
                        strokeThickness: 2,
                        align: "center",
                    }
                )
                .setOrigin(0.5)
                .setDepth(100);

            // Add celebration effect
            this.addCelebrationEffect();
        }

        // Restart button
        const restartButton = this.add
            .text(SCREEN_CENTER_X - 100, SCREEN_CENTER_Y + 120, "Restart", {
                fontFamily: "KenneyPixel",
                fontSize: 36,
                color: "#ffffff",
                stroke: "#000000",
                strokeThickness: 6,
                padding: { left: 8, right: 8, top: 4, bottom: 4 },
                align: "center",
            })
            .setOrigin(0.5)
            .setDepth(100)
            .setInteractive({ useHandCursor: true })
            .on("pointerover", () => {
                restartButton.setStyle({
                    color: "#68c5f9",
                });
            })
            .on("pointerout", () => {
                restartButton.setStyle({
                    color: "#ffffff",
                });
            })
            .on("pointerdown", () => {
                this.restartGame();
            });

        // Main menu button
        const menuButton = this.add
            .text(SCREEN_CENTER_X + 100, SCREEN_CENTER_Y + 120, "Main Menu", {
                fontFamily: "KenneyPixel",
                fontSize: 36,
                color: "#ffffff",
                stroke: "#000000",
                strokeThickness: 6,
                padding: { left: 8, right: 8, top: 4, bottom: 4 },
                align: "center",
            })
            .setOrigin(0.5)
            .setDepth(100)
            .setInteractive({ useHandCursor: true })
            .on("pointerover", () => {
                menuButton.setStyle({
                    color: "#68c5f9",
                });
            })
            .on("pointerout", () => {
                menuButton.setStyle({
                    color: "#ffffff",
                });
            })
            .on("pointerdown", () => {
                this.goToMainMenu();
            });

        // High scores button
        const highScoresButton = this.add
            .text(SCREEN_CENTER_X, SCREEN_CENTER_Y + 180, "View High Scores", {
                fontFamily: "KenneyPixel",
                fontSize: 24,
                color: "#ffaa00",
                stroke: "#000000",
                strokeThickness: 4,
                padding: { left: 4, right: 4, top: 4, bottom: 4 },
                align: "center",
            })
            .setOrigin(0.5)
            .setDepth(100)
            .setInteractive({ useHandCursor: true })
            .on("pointerover", () => {
                highScoresButton.setStyle({
                    color: "#ffd700",
                });
            })
            .on("pointerout", () => {
                highScoresButton.setStyle({
                    color: "#ffaa00",
                });
            })
            .on("pointerdown", () => {
                this.viewHighScores();
            });

        // Keyboard controls
        this.input.keyboard?.on("keydown-R", () => {
            this.restartGame();
        });

        this.input.keyboard?.on("keydown-ESC", () => {
            this.goToMainMenu();
        });

        this.input.keyboard?.on("keydown-H", () => {
            this.viewHighScores();
        });

        // Instructions
        this.add
            .text(
                SCREEN_CENTER_X,
                SCREEN_CENTER_Y + 230,
                "R - Restart | ESC - Menu | H - High Scores",
                {
                    fontFamily: "KenneyPixel",
                    fontSize: 16,
                    color: "#888888",
                    stroke: "#000000",
                    strokeThickness: 2,
                    align: "center",
                }
            )
            .setOrigin(0.5)
            .setDepth(100);

        EventBus.emit("current-scene-ready", this);
    }

    private checkIfHighScore(): boolean {
        try {
            const stored = localStorage.getItem("soulvivor-highscores");
            if (!stored) return true; // First score is always a high score

            const highScores = JSON.parse(stored);
            if (highScores.length === 0) return true;

            // Check if this time is better than any existing score
            const worstHighScore = Math.min(
                ...highScores.map((score: any) => score.timeInSeconds)
            );
            return (
                this.timeInSeconds > worstHighScore || highScores.length < 10
            );
        } catch (error) {
            return true; // If there's an error, treat it as a high score
        }
    }

    private addCelebrationEffect(): void {
        // Create some celebratory particles or effects
        const colors = [0xffd700, 0xffffff, 0x68c5f9, 0xffaa00];

        for (let i = 0; i < 20; i++) {
            const star = this.add
                .text(
                    SCREEN_CENTER_X + (Math.random() - 0.5) * 400,
                    SCREEN_CENTER_Y + (Math.random() - 0.5) * 200,
                    "★",
                    {
                        fontSize: Math.random() * 20 + 10,
                        color: `#${colors[
                            Math.floor(Math.random() * colors.length)
                        ]
                            .toString(16)
                            .padStart(6, "0")}`,
                    }
                )
                .setDepth(200);

            this.tweens.add({
                targets: star,
                y: star.y - 100,
                alpha: 0,
                scale: 2,
                duration: 2000 + Math.random() * 1000,
                ease: "Quad.easeOut",
                onComplete: () => {
                    star.destroy();
                },
            });
        }
    }

    private restartGame(): void {
        this.audioManager.playSelect();
        this.scene.start("Game");
    }

    private goToMainMenu(): void {
        this.audioManager.playSelect();
        this.scene.start("MainMenu");
    }

    private viewHighScores(): void {
        this.audioManager.playSelect();
        this.scene.start("HighScoreScene");
    }
}
