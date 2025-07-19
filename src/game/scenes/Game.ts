import { EventBus } from "../EventBus";
import { Scene } from "phaser";
import { GameManager } from "../managers/GameManager";
import {
    GAME_CONFIG,
    SCREEN_CENTER_X,
    SCREEN_CENTER_Y,
} from "../config/GameConfig";

export class Game extends Scene {
    camera: Phaser.Cameras.Scene2D.Camera;
    background: Phaser.GameObjects.Image;
    gameManager: GameManager;

    constructor() {
        super("Game");
    }

    create() {
        this.camera = this.cameras.main;
        this.camera.setBackgroundColor(0x1a1a2e);

        this.background = this.add.image(
            SCREEN_CENTER_X,
            SCREEN_CENTER_Y,
            "background"
        );
        this.background.setAlpha(0.3);
        // Scale background to fit new resolution
        this.background.setDisplaySize(GAME_CONFIG.width, GAME_CONFIG.height);

        // Tilemap
        const map = this.make.tilemap({ key: "map" });
        const tileset = map.addTilesetImage("map", "tiles");

        //test tileset image

        if (tileset) {
            map.createLayer("Ground", tileset);
            map.createLayer("GroundDetails", tileset);
            map.createLayer("Rails", tileset);
            map.createLayer("Shadows", tileset);
            map.createLayer("Walks", tileset);
            map.createLayer("Buildings", tileset);
            map.createLayer("Objects", tileset);
        }

        // Enable physics (no bounds - free movement)
        // this.physics.world.setBounds(0, 0, GAME_CONFIG.width, GAME_CONFIG.height);

        // Initialize game manager
        this.gameManager = new GameManager(this);
        this.gameManager.initialize();

        // Set up camera to follow the player
        const player = this.gameManager.getPlayer();
        this.camera.startFollow(player.sprite);
        this.camera.setLerp(0.1, 0.1); // Smooth camera movement
        this.camera.setDeadzone(50, 50); // Small deadzone for smoother following

        EventBus.emit("current-scene-ready", this);
    }

    update(time: number, delta: number): void {
        // Convert delta from milliseconds to seconds
        const deltaTime = delta / 1000;

        // Update game through manager
        this.gameManager.update(deltaTime);
    }

    changeScene() {
        this.scene.start("GameOver");
    }
}
