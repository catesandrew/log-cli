import { describe, expect, test } from "bun:test";
import { RingBuffer } from "../src/lib/ringBuffer.ts";

describe("RingBuffer", () => {
  test("keeps only the newest N entries", () => {
    const buffer = new RingBuffer<number>(3);
    buffer.push([1, 2, 3]);
    buffer.push([4, 5]);

    expect(buffer.toArray()).toEqual([3, 4, 5]);
    expect(buffer.droppedCount).toBe(2);
  });
});
