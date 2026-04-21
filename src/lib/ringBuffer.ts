export class RingBuffer<T> {
  private items: T[] = [];
  droppedCount = 0;

  constructor(private readonly maxSize: number) {}

  push(batch: T[]): void {
    if (batch.length === 0) return;
    this.items.push(...batch);
    if (this.items.length > this.maxSize) {
      const overflow = this.items.length - this.maxSize;
      this.items.splice(0, overflow);
      this.droppedCount += overflow;
    }
  }

  toArray(): T[] {
    return [...this.items];
  }
}
