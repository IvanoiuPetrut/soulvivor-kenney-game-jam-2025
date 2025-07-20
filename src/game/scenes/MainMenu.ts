import { GameObjects, Scene } from "phaser";
import { EventBus } from "../EventBus";
import { SCREEN_CENTER_X, SCREEN_CENTER_Y } from "../config/GameConfig";
import { AudioManager } from "../managers/AudioManager";

export class MainMenu extends Scene {
    background: GameObjects.Image;
    logo: GameObjects.Image;
    title: GameObjects.Text;
    logoTween: Phaser.Tweens.Tween | null;
    audioManager: AudioManager;

    constructor() {
        super("MainMenu");
    }

    create() {
        // Initialize audio manager
        this.audioManager = new AudioManager(this);

        this.title = this.add
            .text(SCREEN_CENTER_X, SCREEN_CENTER_Y - 120, "Soulvivor", {
                fontFamily: "KenneyPixel",
                fontSize: 96,
                color: "#ffffff",
                stroke: "#000000",
                strokeThickness: 10,
                align: "center",
            })
            .setOrigin(0.5)
            .setDepth(100);

        // Add a "Start Game" button below the title
        const startButton = this.add
            .text(SCREEN_CENTER_X, SCREEN_CENTER_Y + 20, "Start Game", {
                fontFamily: "KenneyPixel",
                fontSize: 48,
                color: "#ffffff",
                padding: { left: 4, right: 4, top: 4, bottom: 4 },
                align: "center",
            })
            .setOrigin(0.5)
            .setDepth(100)
            .setInteractive({ useHandCursor: true })
            .on("pointerover", () => {
                startButton.setStyle({
                    color: " #68c5f9 ",
                });
            })
            .on("pointerout", () => {
                startButton.setStyle({
                    color: "#ffffff",
                });
            })
            .on("pointerdown", () => {
                this.changeScene();
            });

        // Add a "Controls" button below the Start Game button
        const controlsButton = this.add
            .text(SCREEN_CENTER_X, SCREEN_CENTER_Y + 90, "Controls", {
                fontFamily: "KenneyPixel",
                fontSize: 36,
                color: "#ffffff",
                padding: { left: 4, right: 4, top: 4, bottom: 4 },
                align: "center",
            })
            .setOrigin(0.5)
            .setDepth(100)
            .setInteractive({ useHandCursor: true })
            .on("pointerover", () => {
                controlsButton.setStyle({
                    color: "#68c5f9",
                });
            })
            .on("pointerout", () => {
                controlsButton.setStyle({
                    color: "#ffffff",
                });
            })
            .on("pointerdown", () => {
                this.audioManager.playSelect();
                this.scene.start("ControlsScene");
            });

        // Add a "High Scores" button below the Controls button
        const highScoresButton = this.add
            .text(SCREEN_CENTER_X, SCREEN_CENTER_Y + 160, "High Scores", {
                fontFamily: "KenneyPixel",
                fontSize: 36,
                color: "#ffffff",
                padding: { left: 4, right: 4, top: 4, bottom: 4 },
                align: "center",
            })
            .setOrigin(0.5)
            .setDepth(100)
            .setInteractive({ useHandCursor: true })
            .on("pointerover", () => {
                highScoresButton.setStyle({
                    color: "#68c5f9",
                });
            })
            .on("pointerout", () => {
                highScoresButton.setStyle({
                    color: "#ffffff",
                });
            })
            .on("pointerdown", () => {
                this.audioManager.playSelect();
                this.scene.start("HighScoreScene");
            });

        EventBus.emit("current-scene-ready", this);
    }

    changeScene() {
        // Play select sound
        this.audioManager.playSelect();

        if (this.logoTween) {
            this.logoTween.stop();
            this.logoTween = null;
        }

        this.scene.start("Game");
    }

    moveLogo(vueCallback: ({ x, y }: { x: number; y: number }) => void) {
        if (this.logoTween) {
            if (this.logoTween.isPlaying()) {
                this.logoTween.pause();
            } else {
                this.logoTween.play();
            }
        } else {
            this.logoTween = this.tweens.add({
                targets: this.logo,
                x: {
                    value: SCREEN_CENTER_X + 200,
                    duration: 3000,
                    ease: "Back.easeInOut",
                },
                y: {
                    value: SCREEN_CENTER_Y - 200,
                    duration: 1500,
                    ease: "Sine.easeOut",
                },
                yoyo: true,
                repeat: -1,
                onUpdate: () => {
                    if (vueCallback) {
                        vueCallback({
                            x: Math.floor(this.logo.x),
                            y: Math.floor(this.logo.y),
                        });
                    }
                },
            });
        }
    }
}
