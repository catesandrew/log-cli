import { describe, expect, mock, test } from "bun:test";
import { buildRenderContext } from "../src/interactiveHelpers.tsx";

function makeStream(isTTY: boolean) {
  let destroyed = false;
  return {
    isTTY,
    get destroyed() {
      return destroyed;
    },
    destroy() {
      destroyed = true;
    },
  } as unknown as NodeJS.ReadStream;
}

describe("buildRenderContext", () => {
  test("uses process stdin directly when it is already interactive", () => {
    const stdin = makeStream(true);
    const stdout = { isTTY: true } as NodeJS.WriteStream;
    const stderr = {} as NodeJS.WriteStream;

    const context = buildRenderContext({ stdin, stdout, stderr });

    expect(context.renderOptions.stdin).toBe(stdin);
    context.dispose();
    expect((stdin as unknown as { destroyed: boolean }).destroyed).toBe(false);
  });

  test("uses a tty fallback for Ink input when stdin is piped but stdout is interactive", () => {
    const stdin = makeStream(false);
    const ttyInput = makeStream(true);
    const stdout = { isTTY: true } as NodeJS.WriteStream;
    const stderr = {} as NodeJS.WriteStream;
    const openInteractiveInput = mock(() => ttyInput);

    const context = buildRenderContext(
      { stdin, stdout, stderr },
      { openInteractiveInput },
    );

    expect(openInteractiveInput).toHaveBeenCalledTimes(1);
    expect(context.renderOptions.stdin).toBe(ttyInput);
    context.dispose();
    expect((ttyInput as unknown as { destroyed: boolean }).destroyed).toBe(true);
  });

  test("falls back to the original stdin when no tty fallback is available", () => {
    const stdin = makeStream(false);
    const stdout = { isTTY: true } as NodeJS.WriteStream;
    const stderr = {} as NodeJS.WriteStream;
    const context = buildRenderContext(
      { stdin, stdout, stderr },
      { openInteractiveInput: () => null },
    );

    expect(context.renderOptions.stdin).toBe(stdin);
  });
});
