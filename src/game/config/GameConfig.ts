export interface GameConfiguration {
    // Display settings
    width: number;
    height: number;
    pixelArt: boolean;

    // Sprite settings
    baseSpriteSize: number; // Original sprite size (16x16)
    spriteScale: number; // Scale multiplier for sprites

    // Camera settings
    cameraFollowPlayer: boolean;

    // Physics settings
    debug: boolean;
}

// Main configuration - easily tweakable
export const GAME_CONFIG: GameConfiguration = {
    // 960x540 gives us nice 16:9 ratio good for modern displays
    width: 960,
    height: 540,
    pixelArt: true,

    // 16x16 base sprites scaled up 3x = 48x48 display size
    baseSpriteSize: 16,
    spriteScale: 3,

    cameraFollowPlayer: false, // We'll enable this later for larger worlds

    debug: false,
};

// Derived values for convenience
export const SCREEN_CENTER_X = GAME_CONFIG.width / 2;
export const SCREEN_CENTER_Y = GAME_CONFIG.height / 2;

// Alternative configurations you can easily switch to:
export const ALTERNATIVE_CONFIGS = {
    // Classic 4:3 ratio
    classic: {
        ...GAME_CONFIG,
        width: 640,
        height: 480,
        spriteScale: 3,
    },

    // Larger modern display
    large: {
        ...GAME_CONFIG,
        width: 1280,
        height: 720,
        spriteScale: 4,
    },

    // Tiny retro style
    retro: {
        ...GAME_CONFIG,
        width: 320,
        height: 240,
        spriteScale: 2,
    },
};
