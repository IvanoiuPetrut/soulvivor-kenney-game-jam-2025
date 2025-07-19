export class ParticleManager {
    private scene: Phaser.Scene;
    private particleEmitters: Map<
        string,
        Phaser.GameObjects.Particles.ParticleEmitter
    > = new Map();

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.initializeParticles();
    }

    private initializeParticles(): void {
        // Particle effects temporarily disabled
        console.log("Particle system disabled");
        return;

        // Movement dust particles
        const dustParticles = this.scene.add.particles(0, 0, "star", {
            scale: { start: 0.3, end: 0.05 }, // Larger and more visible
            speed: { min: 20, max: 40 },
            lifespan: 500, // Longer lifespan
            alpha: { start: 0.8, end: 0 }, // More opaque
            tint: 0x8b4513, // Brown dust color
            frequency: 30, // More frequent
            quantity: 3, // More particles
            emitting: false,
        });
        dustParticles.setDepth(25); // Above all tilemap layers but below enemies
        this.particleEmitters.set("dust", dustParticles);

        // Player hit particles (red blood-like)
        const playerHitParticles = this.scene.add.particles(0, 0, "star", {
            scale: { start: 0.2, end: 0.05 },
            speed: { min: 50, max: 100 },
            lifespan: 400,
            alpha: { start: 0.8, end: 0 },
            tint: 0xff4444, // Red color
            frequency: -1, // Burst mode
            quantity: 8,
            emitting: false,
            gravityY: 100,
        });
        playerHitParticles.setDepth(110); // Above player
        this.particleEmitters.set("playerHit", playerHitParticles);

        // Enemy hit particles (yellow sparks)
        const enemyHitParticles = this.scene.add.particles(0, 0, "star", {
            scale: { start: 0.15, end: 0.02 },
            speed: { min: 60, max: 120 },
            lifespan: 250,
            alpha: { start: 0.9, end: 0 },
            tint: 0xffff44, // Yellow sparks
            frequency: -1, // Burst mode
            quantity: 6,
            emitting: false,
        });
        enemyHitParticles.setDepth(85); // Above enemies
        this.particleEmitters.set("enemyHit", enemyHitParticles);

        // Enemy death particles (colorful explosion)
        const enemyDeathParticles = this.scene.add.particles(0, 0, "star", {
            scale: { start: 0.3, end: 0.01 },
            speed: { min: 100, max: 200 },
            lifespan: 600,
            alpha: { start: 1, end: 0 },
            tint: [0xff6b6b, 0x4ecdc4, 0x45b7d1, 0xffa07a, 0x98d8c8], // Multiple colors
            frequency: -1, // Burst mode
            quantity: 15,
            emitting: false,
            gravityY: 50,
            bounce: 0.3,
        });
        enemyDeathParticles.setDepth(105); // Above player
        this.particleEmitters.set("enemyDeath", enemyDeathParticles);

        // Power-up absorption particles (magical swirl)
        const powerUpParticles = this.scene.add.particles(0, 0, "star", {
            scale: { start: 0.2, end: 0.05 },
            speed: { min: 30, max: 80 },
            lifespan: 800,
            alpha: { start: 0.8, end: 0 },
            tint: [0x9b59b6, 0x3498db, 0xe74c3c], // Purple, blue, red
            frequency: -1, // Burst mode
            quantity: 12,
            emitting: false,
            rotate: { start: 0, end: 360 },
        });
        powerUpParticles.setDepth(115); // Above everything except UI
        this.particleEmitters.set("powerUp", powerUpParticles);
    }

    // Movement particles - continuous while moving
    startMovementParticles(x: number, y: number): void {
        // Particles disabled
        return;
    }

    stopMovementParticles(): void {
        // Particles disabled
        return;
    }

    // Player hit effect
    createPlayerHitEffect(x: number, y: number): void {
        // Particles disabled
        return;
    }

    // Enemy hit effect
    createEnemyHitEffect(x: number, y: number): void {
        // Particles disabled
        return;
    }

    // Enemy death effect
    createEnemyDeathEffect(x: number, y: number): void {
        // Particles disabled
        return;
    }

    // Power-up absorption effect
    createPowerUpEffect(x: number, y: number): void {
        // Particles disabled
        return;
    }

    // Update method for any continuous effects
    update(deltaTime: number): void {
        // Any continuous particle effects can be updated here
    }

    // Cleanup method
    destroy(): void {
        this.particleEmitters.forEach((emitter) => {
            if (emitter) {
                emitter.destroy();
            }
        });
        this.particleEmitters.clear();
    }
}
