export class AudioManager {
    private scene: Phaser.Scene;
    private music: Phaser.Sound.BaseSound | null = null;
    private sounds: Map<string, Phaser.Sound.BaseSound> = new Map();

    // Volume settings
    private musicVolume: number = 0.2; // Lower volume for background music
    private sfxVolume: number = 0.7; // Higher volume for sound effects

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.initializeSounds();
    }

    private initializeSounds(): void {
        // Initialize all sound effects
        const soundKeys = ["select", "hit", "powerUp", "hurt"];

        soundKeys.forEach((key) => {
            if (this.scene.cache.audio.exists(key)) {
                const sound = this.scene.sound.add(key, {
                    volume: this.sfxVolume,
                });
                this.sounds.set(key, sound);
            }
        });

        // Initialize background music
        if (this.scene.cache.audio.exists("music")) {
            this.music = this.scene.sound.add("music", {
                volume: this.musicVolume,
                loop: true,
            });
        }
    }

    startBackgroundMusic(): void {
        if (this.music && !this.music.isPlaying) {
            this.music.play();
        }
    }

    stopBackgroundMusic(): void {
        if (this.music && this.music.isPlaying) {
            this.music.stop();
        }
    }

    playSelect(): void {
        this.playSound("select");
    }

    playHit(): void {
        this.playSound("hit");
    }

    playPowerUp(): void {
        this.playSound("powerUp");
    }

    playHurt(): void {
        this.playSound("hurt");
    }

    private playSound(key: string): void {
        const sound = this.sounds.get(key);
        if (sound) {
            sound.play();
        }
    }

    setMusicVolume(volume: number): void {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        if (this.music) {
            (this.music as any).setVolume(this.musicVolume);
        }
    }

    setSfxVolume(volume: number): void {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
        this.sounds.forEach((sound) => {
            (sound as any).setVolume(this.sfxVolume);
        });
    }

    destroy(): void {
        this.stopBackgroundMusic();
        this.sounds.forEach((sound) => {
            if (sound) {
                sound.destroy();
            }
        });
        this.sounds.clear();

        if (this.music) {
            this.music.destroy();
            this.music = null;
        }
    }
}
