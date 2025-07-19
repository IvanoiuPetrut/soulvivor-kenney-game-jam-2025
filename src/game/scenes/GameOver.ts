import { EventBus } from "../EventBus";
import { Scene } from "phaser";
import { SCREEN_CENTER_X, SCREEN_CENTER_Y } from "../config/GameConfig";
import { AudioManager } from "../managers/AudioManager";

export class GameOver extends Scene {
    camera: Phaser.Cameras.Scene2D.Camera;
    background: Phaser.GameObjects.Image;
    gameOverText: Phaser.GameObjects.Text;
    audioManager: AudioManager;

    constructor() {
        super("GameOver");
    }

    create() {
        // Initialize audio manager
        this.audioManager = new AudioManager(this);

        this.camera = this.cameras.main;
        this.camera.setBackgroundColor(0xff0000);

        this.background = this.add.image(
            SCREEN_CENTER_X,
            SCREEN_CENTER_Y,
            "background"
        );
        this.background.setAlpha(0.5);

        this.gameOverText = this.add
            .text(SCREEN_CENTER_X, SCREEN_CENTER_Y, "Game Over", {
                fontFamily: "Arial Black",
                fontSize: 64,
                color: "#ffffff",
                stroke: "#000000",
                strokeThickness: 8,
                align: "center",
            })
            .setOrigin(0.5)
            .setDepth(100);

        EventBus.emit("current-scene-ready", this);
    }

    changeScene() {
        // Play select sound
        this.audioManager.playSelect();
        this.scene.start("MainMenu");
    }
}
