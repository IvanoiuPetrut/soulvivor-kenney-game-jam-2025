import { GameEntity } from "../types/GameTypes";

export class MovementSystem {
    private entities: GameEntity[] = [];

    addEntity(entity: GameEntity): void {
        this.entities.push(entity);
    }

    removeEntity(entity: GameEntity): void {
        const index = this.entities.indexOf(entity);
        if (index > -1) {
            this.entities.splice(index, 1);
        }
    }

    update(deltaTime: number): void {
        // Update all entities (player, enemies, etc.)
        for (const entity of this.entities) {
            entity.update(deltaTime);
        }

        // Clean up any destroyed entities
        this.entities = this.entities.filter(
            (entity) => entity.sprite && entity.sprite.active
        );
    }

    clear(): void {
        this.entities = [];
    }

    getEntityCount(): number {
        return this.entities.length;
    }
}
