import { installCoreCommands } from "./core";

let ready = false;

export function ensureCommandsReady(): void {
  if (ready) return;
  installCoreCommands();
  ready = true;
}

export * from "./bus";
export * from "./types";
