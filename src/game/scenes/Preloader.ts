import { Scene } from "phaser";
import { SCREEN_CENTER_X, SCREEN_CENTER_Y } from "../config/GameConfig";

export class Preloader extends Scene {
    constructor() {
        super("Preloader");
    }

    init() {
        //  We loaded this image in our Boot Scene, so we can display it here
        this.add.image(SCREEN_CENTER_X, SCREEN_CENTER_Y, "background");

        //  A simple progress bar. This is the outline of the bar.
        this.add
            .rectangle(SCREEN_CENTER_X, SCREEN_CENTER_Y, 468, 32)
            .setStrokeStyle(1, 0xffffff);

        //  This is the progress bar itself. It will increase in size from the left based on the % of progress.
        const bar = this.add.rectangle(
            SCREEN_CENTER_X - 230,
            SCREEN_CENTER_Y,
            4,
            28,
            0xffffff
        );

        //  Use the 'progress' event emitted by the LoaderPlugin to update the loading bar
        this.load.on("progress", (progress: number) => {
            //  Update the progress bar (our bar is 464px wide, so 100% = 464px)
            bar.width = 4 + 460 * progress;
        });

        // Load custom font
        this.loadCustomFont();
    }

    private loadCustomFont(): void {
        // Create a custom font face and add it to the document
        const fontFace = new FontFace(
            "KenneyPixel",
            "url(assets/font/pixel.ttf)"
        );

        fontFace
            .load()
            .then((loadedFont) => {
                document.fonts.add(loadedFont);
                console.log("Custom font loaded successfully");
            })
            .catch((error) => {
                console.warn("Custom font failed to load:", error);
            });
    }

    preload() {
        //  Load the assets for the game - Replace with your own assets
        this.load.setPath("assets");

        this.load.image("logo", "logo.png");
        this.load.image("star", "star.png");
        this.load.image("player", "player.png");

        // Load enemy sprites
        this.load.image("enemy_mage", "enemies/mage.png");
        this.load.image("enemy_crab", "enemies/crab.png");
        this.load.image("enemy_ghost", "enemies/ghost.png");

        // Load tilemap
        this.load.tilemapTiledJSON("map", "map/map.json");
        this.load.image("tiles", "map/tilemap.png");

        // Load custom font (TTF fonts need to be handled differently)
        // We'll load it as a web font in the create method
    }

    create() {
        //  When all the assets have loaded, it's often worth creating global objects here that the rest of the game can use.
        //  For example, you can define global animations here, so we can use them in other scenes.

        //  Move to the MainMenu. You could also swap this for a Scene Transition, such as a camera fade.
        this.scene.start("MainMenu");
    }
}
