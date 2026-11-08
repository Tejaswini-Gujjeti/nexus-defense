export interface SpatialEntity {
  id: string;
  x: number;
  y: number;
  radius: number;
}

export class SpatialHash<T extends SpatialEntity> {
  private cellSize: number;
  private grid: Map<string, Set<T>> = new Map();

  constructor(cellSize: number = 64) {
    this.cellSize = cellSize;
  }

  private getKey(col: number, row: number): string {
    return `${col},${row}`;
  }

  clear(): void {
    this.grid.clear();
  }

  insert(entity: T): void {
    const minCol = Math.floor((entity.x - entity.radius) / this.cellSize);
    const maxCol = Math.floor((entity.x + entity.radius) / this.cellSize);
    const minRow = Math.floor((entity.y - entity.radius) / this.cellSize);
    const maxRow = Math.floor((entity.y + entity.radius) / this.cellSize);

    for (let c = minCol; c <= maxCol; c++) {
      for (let r = minRow; r <= maxRow; r++) {
        const key = this.getKey(c, r);
        let cell = this.grid.get(key);
        if (!cell) {
          cell = new Set();
          this.grid.set(key, cell);
        }
        cell.add(entity);
      }
    }
  }

  queryRadius(x: number, y: number, radius: number): T[] {
    const minCol = Math.floor((x - radius) / this.cellSize);
    const maxCol = Math.floor((x + radius) / this.cellSize);
    const minRow = Math.floor((y - radius) / this.cellSize);
    const maxRow = Math.floor((y + radius) / this.cellSize);

    const candidates = new Set<T>();

    for (let c = minCol; c <= maxCol; c++) {
      for (let r = minRow; r <= maxRow; r++) {
        const cell = this.grid.get(this.getKey(c, r));
        if (cell) {
          cell.forEach((entity) => {
            const dx = entity.x - x;
            const dy = entity.y - y;
            const distSq = dx * dx + dy * dy;
            const totalRadius = radius + entity.radius;
            if (distSq <= totalRadius * totalRadius) {
              candidates.add(entity);
            }
          });
        }
      }
    }

    return Array.from(candidates);
  }
}
