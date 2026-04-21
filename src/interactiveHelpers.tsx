import React from "react";
import type { Root } from "./ink";

export function getRenderContext() {
  return {
    renderOptions: {
      stdout: process.stdout,
      stderr: process.stderr,
      stdin: process.stdin,
      patchConsole: false,
      exitOnCtrlC: true,
    },
  };
}

export async function renderAndRun(root: Root, element: React.ReactNode): Promise<void> {
  root.render(element);
  await root.waitUntilExit();
}

export async function exitWithMessage(message: string): Promise<never> {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}
