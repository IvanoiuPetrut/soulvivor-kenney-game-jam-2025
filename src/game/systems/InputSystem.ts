import { InputKeys } from "../types/GameTypes";

export class InputSystem {
    private keys: InputKeys;
    private scene: Phaser.Scene;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.setupKeys();
    }

    private setupKeys(): void {
        const keyboard = this.scene.input.keyboard;

        this.keys = {
            // WASD keys
            up: keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
            down: keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
            left: keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
            right: keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
            siphon: keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
        };
    }

    getMovementVector(): { x: number; y: number } {
        const keyboard = this.scene.input.keyboard;
        let x = 0;
        let y = 0;

        // Check WASD and arrow keys
        if (
            this.keys.left.isDown ||
            keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT).isDown
        ) {
            x -= 1;
        }
        if (
            this.keys.right.isDown ||
            keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT).isDown
        ) {
            x += 1;
        }
        if (
            this.keys.up.isDown ||
            keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.UP).isDown
        ) {
            y -= 1;
        }
        if (
            this.keys.down.isDown ||
            keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN).isDown
        ) {
            y += 1;
        }

        // Normalize diagonal movement
        if (x !== 0 && y !== 0) {
            x *= 0.707; // approximately 1/√2
            y *= 0.707;
        }

        return { x, y };
    }

    isSiphonPressed(): boolean {
        return this.keys.siphon.isDown;
    }

    getKeys(): InputKeys {
        return this.keys;
    }
}
