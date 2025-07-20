import { GameObjects, Scene } from "phaser";
import { EventBus } from "../EventBus";
import { SCREEN_CENTER_X, SCREEN_CENTER_Y } from "../config/GameConfig";
import { AudioManager } from "../managers/AudioManager";

export class ControlsScene extends Scene {
    background: GameObjects.Image;
    title: GameObjects.Text;
    audioManager: AudioManager;

    constructor() {
        super("ControlsScene");
    }

    create() {
        // Initialize audio manager
        this.audioManager = new AudioManager(this);

        // Add title
        this.title = this.add
            .text(SCREEN_CENTER_X, 100, "Controls", {
                fontFamily: "KenneyPixel",
                fontSize: 64,
                color: "#ffffff",
                stroke: "#000000",
                strokeThickness: 8,
                align: "center",
            })
            .setOrigin(0.5)
            .setDepth(100);

        // Add controls instructions
        const controlsText = [
            "Movement: WASD or Arrow Keys",
            "",
            "Survive as long as you can!",
            "Collect XP to level up and get stronger!",
        ];

        controlsText.forEach((text, index) => {
            this.add
                .text(SCREEN_CENTER_X, 200 + index * 40, text, {
                    fontFamily: "KenneyPixel",
                    fontSize: 24,
                    color: "#ffffff",
                    stroke: "#000000",
                    strokeThickness: 4,
                    align: "center",
                })
                .setOrigin(0.5)
                .setDepth(100);
        });

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

        // Add keyboard input for ESC to go back
        this.input.keyboard?.on("keydown-ESC", () => {
            this.goBack();
        });

        EventBus.emit("current-scene-ready", this);
    }

    goBack() {
        // Play select sound
        this.audioManager.playSelect();

        // Go back to main menu
        this.scene.start("MainMenu");
    }
}
