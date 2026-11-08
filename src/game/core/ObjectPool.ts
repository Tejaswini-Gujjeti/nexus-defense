export class ObjectPool<T> {
  private pool: T[] = [];
  private createFn: () => T;
  private resetFn?: (item: T) => void;

  constructor(createFn: () => T, resetFn?: (item: T) => void, initialCapacity: number = 20) {
    this.createFn = createFn;
    this.resetFn = resetFn;

    for (let i = 0; i < initialCapacity; i++) {
      this.pool.push(this.createFn());
    }
  }

  obtain(): T {
    if (this.pool.length > 0) {
      const item = this.pool.pop()!;
      if (this.resetFn) {
        this.resetFn(item);
      }
      return item;
    }
    const item = this.createFn();
    if (this.resetFn) {
      this.resetFn(item);
    }
    return item;
  }

  release(item: T): void {
    this.pool.push(item);
  }

  size(): number {
    return this.pool.length;
  }
}
