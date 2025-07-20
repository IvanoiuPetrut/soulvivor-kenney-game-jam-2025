import { GameObjects, Scene } from "phaser";
import { EventBus } from "../EventBus";
import { SCREEN_CENTER_X, SCREEN_CENTER_Y } from "../config/GameConfig";
import { AudioManager } from "../managers/AudioManager";

export interface HighScore {
    time: string;
    timeInSeconds: number;
    score: number;
    date: string;
}

export class HighScoreScene extends Scene {
    background: GameObjects.Image;
    title: GameObjects.Text;
    audioManager: AudioManager;
    private highScores: HighScore[] = [];

    constructor() {
        super("HighScoreScene");
    }

    create() {
        // Initialize audio manager
        this.audioManager = new AudioManager(this);

        // Add title
        this.title = this.add
            .text(SCREEN_CENTER_X, 60, "High Scores", {
                fontFamily: "KenneyPixel",
                fontSize: 48,
                color: "#ffffff",
                stroke: "#000000",
                strokeThickness: 6,
                align: "center",
            })
            .setOrigin(0.5)
            .setDepth(100);

        // Load and display high scores
        this.loadHighScores();
        this.displayHighScores();

        // Add back button
        const backButton = this.add
            .text(SCREEN_CENTER_X, SCREEN_CENTER_Y + 200, "Back to Menu", {
                fontFamily: "KenneyPixel",
                fontSize: 32,
                color: "#ffffff",
                stroke: "#000000",
                strokeThickness: 6,
                padding: { left: 4, right: 4, top: 4, bottom: 4 },
                align: "center",
            })
            .setOrigin(0.5)
            .setDepth(100)
            .setInteractive({ useHandCursor: true })
            .on("pointerover", () => {
                backButton.setStyle({
                    color: "#68c5f9",
                });
            })
            .on("pointerout", () => {
                backButton.setStyle({
                    color: "#ffffff",
                });
            })
            .on("pointerdown", () => {
                this.goBack();
            });

        // Add clear scores button
        const clearButton = this.add
            .text(
                SCREEN_CENTER_X + 200,
                SCREEN_CENTER_Y + 200,
                "Clear Scores",
                {
                    fontFamily: "KenneyPixel",
                    fontSize: 24,
                    color: "#ff6666",
                    stroke: "#000000",
                    strokeThickness: 4,
                    padding: { left: 4, right: 4, top: 4, bottom: 4 },
                    align: "center",
                }
            )
            .setOrigin(0.5)
            .setDepth(100)
            .setInteractive({ useHandCursor: true })
            .on("pointerover", () => {
                clearButton.setStyle({
                    color: "#ff4444",
                });
            })
            .on("pointerout", () => {
                clearButton.setStyle({
                    color: "#ff6666",
                });
            })
            .on("pointerdown", () => {
                this.clearHighScores();
            });

        // Add keyboard input for ESC to go back
        this.input.keyboard?.on("keydown-ESC", () => {
            this.goBack();
        });

        EventBus.emit("current-scene-ready", this);
    }

    private loadHighScores(): void {
        try {
            const stored = localStorage.getItem("soulvivor-highscores");
            if (stored) {
                this.highScores = JSON.parse(stored);
                // Sort by time survived (descending)
                this.highScores.sort(
                    (a, b) => b.timeInSeconds - a.timeInSeconds
                );
                // Keep only top 10
                this.highScores = this.highScores.slice(0, 10);
            } else {
                this.highScores = [];
            }
        } catch (error) {
            console.error("Error loading high scores:", error);
            this.highScores = [];
        }
    }

    private saveHighScores(): void {
        try {
            localStorage.setItem(
                "soulvivor-highscores",
                JSON.stringify(this.highScores)
            );
        } catch (error) {
            console.error("Error saving high scores:", error);
        }
    }

    private displayHighScores(): void {
        if (this.highScores.length === 0) {
            // Show "no scores yet" message
            this.add
                .text(
                    SCREEN_CENTER_X,
                    SCREEN_CENTER_Y - 50,
                    "No high scores yet!",
                    {
                        fontFamily: "KenneyPixel",
                        fontSize: 32,
                        color: "#888888",
                        stroke: "#000000",
                        strokeThickness: 4,
                        align: "center",
                    }
                )
                .setOrigin(0.5)
                .setDepth(100);

            this.add
                .text(
                    SCREEN_CENTER_X,
                    SCREEN_CENTER_Y - 10,
                    "Play the game to set your first score!",
                    {
                        fontFamily: "KenneyPixel",
                        fontSize: 24,
                        color: "#666666",
                        stroke: "#000000",
                        strokeThickness: 3,
                        align: "center",
                    }
                )
                .setOrigin(0.5)
                .setDepth(100);
            return;
        }

        // Header row
        this.add
            .text(SCREEN_CENTER_X - 180, 120, "Rank", {
                fontFamily: "KenneyPixel",
                fontSize: 20,
                color: "#ffaa00",
                stroke: "#000000",
                strokeThickness: 3,
            })
            .setOrigin(0.5)
            .setDepth(100);

        this.add
            .text(SCREEN_CENTER_X - 60, 120, "Time Survived", {
                fontFamily: "KenneyPixel",
                fontSize: 20,
                color: "#ffaa00",
                stroke: "#000000",
                strokeThickness: 3,
            })
            .setOrigin(0.5)
            .setDepth(100);

        this.add
            .text(SCREEN_CENTER_X + 80, 120, "Score", {
                fontFamily: "KenneyPixel",
                fontSize: 20,
                color: "#ffaa00",
                stroke: "#000000",
                strokeThickness: 3,
            })
            .setOrigin(0.5)
            .setDepth(100);

        this.add
            .text(SCREEN_CENTER_X + 180, 120, "Date", {
                fontFamily: "KenneyPixel",
                fontSize: 20,
                color: "#ffaa00",
                stroke: "#000000",
                strokeThickness: 3,
            })
            .setOrigin(0.5)
            .setDepth(100);

        // Display each high score
        this.highScores.forEach((score, index) => {
            const y = 160 + index * 35;
            const rank = index + 1;

            // Different colors for top 3
            let textColor = "#ffffff";
            if (rank === 1) textColor = "#ffd700"; // Gold
            else if (rank === 2) textColor = "#c0c0c0"; // Silver
            else if (rank === 3) textColor = "#cd7f32"; // Bronze

            // Rank
            this.add
                .text(SCREEN_CENTER_X - 180, y, `#${rank}`, {
                    fontFamily: "KenneyPixel",
                    fontSize: 18,
                    color: textColor,
                    stroke: "#000000",
                    strokeThickness: 2,
                })
                .setOrigin(0.5)
                .setDepth(100);

            // Time survived
            this.add
                .text(SCREEN_CENTER_X - 60, y, score.time, {
                    fontFamily: "KenneyPixel",
                    fontSize: 18,
                    color: textColor,
                    stroke: "#000000",
                    strokeThickness: 2,
                })
                .setOrigin(0.5)
                .setDepth(100);

            // Score
            this.add
                .text(SCREEN_CENTER_X + 80, y, score.score.toString(), {
                    fontFamily: "KenneyPixel",
                    fontSize: 18,
                    color: textColor,
                    stroke: "#000000",
                    strokeThickness: 2,
                })
                .setOrigin(0.5)
                .setDepth(100);

            // Date
            this.add
                .text(SCREEN_CENTER_X + 180, y, score.date, {
                    fontFamily: "KenneyPixel",
                    fontSize: 16,
                    color: textColor,
                    stroke: "#000000",
                    strokeThickness: 2,
                })
                .setOrigin(0.5)
                .setDepth(100);
        });
    }

    private clearHighScores(): void {
        this.highScores = [];
        this.saveHighScores();

        // Play select sound
        this.audioManager.playSelect();

        // Restart the scene to refresh the display
        this.scene.restart();
    }

    goBack() {
        // Play select sound
        this.audioManager.playSelect();

        // Go back to main menu
        this.scene.start("MainMenu");
    }

    // Static method to add a new high score from the game over screen
    static addHighScore(
        timeInSeconds: number,
        timeString: string,
        score: number
    ): void {
        try {
            const stored = localStorage.getItem("soulvivor-highscores");
            let highScores: HighScore[] = stored ? JSON.parse(stored) : [];

            const newScore: HighScore = {
                time: timeString,
                timeInSeconds: timeInSeconds,
                score: score,
                date: new Date().toLocaleDateString(),
            };

            highScores.push(newScore);

            // Sort by time survived (descending)
            highScores.sort((a, b) => b.timeInSeconds - a.timeInSeconds);

            // Keep only top 10
            highScores = highScores.slice(0, 10);

            localStorage.setItem(
                "soulvivor-highscores",
                JSON.stringify(highScores)
            );
        } catch (error) {
            console.error("Error adding high score:", error);
        }
    }
}
