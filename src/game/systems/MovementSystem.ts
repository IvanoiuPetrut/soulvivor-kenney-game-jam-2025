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
        for (const entity of this.entities) {
            entity.update(deltaTime);
        }
    }

    clear(): void {
        this.entities = [];
    }
}
