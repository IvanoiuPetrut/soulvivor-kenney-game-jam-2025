import { EventBus } from "../EventBus";
import { Scene } from "phaser";
import { GameManager } from "../managers/GameManager";
import { AudioManager } from "../managers/AudioManager";
import {
    GAME_CONFIG,
    SCREEN_CENTER_X,
    SCREEN_CENTER_Y,
} from "../config/GameConfig";

export class Game extends Scene {
    camera: Phaser.Cameras.Scene2D.Camera;
    background: Phaser.GameObjects.Image;
    gameManager: GameManager;
    audioManager: AudioManager;
    // Store collision layers for enemy collision setup
    private walks: Phaser.Tilemaps.TilemapLayer | null = null;
    private buildings: Phaser.Tilemaps.TilemapLayer | null = null;
    private objects: Phaser.Tilemaps.TilemapLayer | null = null;

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

        let walks, buildings, objects;
        if (tileset) {
            const ground = map.createLayer("Ground", tileset);
            const groundDetails = map.createLayer("GroundDetails", tileset);
            const rails = map.createLayer("Rails", tileset);
            const shadows = map.createLayer("Shadows", tileset);
            walks = map.createLayer("Walks", tileset);
            buildings = map.createLayer("Buildings", tileset);
            objects = map.createLayer("Objects", tileset);

            // Scale all layers to match sprite scale
            ground?.setScale(GAME_CONFIG.spriteScale);
            groundDetails?.setScale(GAME_CONFIG.spriteScale);
            rails?.setScale(GAME_CONFIG.spriteScale);
            shadows?.setScale(GAME_CONFIG.spriteScale);
            walks?.setScale(GAME_CONFIG.spriteScale);
            buildings?.setScale(GAME_CONFIG.spriteScale);
            objects?.setScale(GAME_CONFIG.spriteScale);

            // Store layers for enemy collision setup
            this.walks = walks;
            this.buildings = buildings;
            this.objects = objects;

            walks?.setCollisionByProperty({ collides: true });
            buildings?.setCollisionByProperty({ collides: true });
            objects?.setCollisionByProperty({ collides: true });

            const debugGraphics = this.add.graphics().setAlpha(0.5);
            walks?.renderDebug(debugGraphics, {
                tileColor: null,
                collidingTileColor: new Phaser.Display.Color(255, 0, 0, 255),
                faceColor: new Phaser.Display.Color(40, 39, 37, 255),
            });
        }

        // Enable physics (no bounds - free movement)
        // this.physics.world.setBounds(0, 0, GAME_CONFIG.width, GAME_CONFIG.height);

        // Initialize audio manager and start background music
        this.audioManager = new AudioManager(this);
        this.audioManager.startBackgroundMusic();

        // Initialize game manager
        this.gameManager = new GameManager(this, this.audioManager);
        this.gameManager.initialize();

        // Set up camera to follow the player
        const player = this.gameManager.getPlayer();
        this.camera.startFollow(player.sprite);
        this.camera.setLerp(0.1, 0.1); // Smooth camera movement
        this.camera.setDeadzone(50, 50); // Small deadzone for smoother following

        // collision for player
        if (walks && buildings && objects) {
            this.physics.add.collider(player.sprite, walks);
            this.physics.add.collider(player.sprite, buildings);
            this.physics.add.collider(player.sprite, objects);
        }

        EventBus.emit("current-scene-ready", this);
    }

    update(time: number, delta: number): void {
        // Convert delta from milliseconds to seconds
        const deltaTime = delta / 1000;

        // Update game through manager
        this.gameManager.update(deltaTime);
    }

    changeScene() {
        // Stop background music when game ends
        this.audioManager.stopBackgroundMusic();
        this.scene.start("GameOver");
    }

    // Method to set up collision detection for enemies
    setupEnemyCollision(enemySprite: Phaser.GameObjects.Sprite): void {
        if (this.walks) {
            this.physics.add.collider(enemySprite, this.walks);
        }
        if (this.buildings) {
            this.physics.add.collider(enemySprite, this.buildings);
        }
        if (this.objects) {
            this.physics.add.collider(enemySprite, this.objects);
        }
    }
}
