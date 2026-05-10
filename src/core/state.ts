import path from "node:path";
import { DEFAULT_LANE, STATE_FILE } from "./constants.js";
import { readJsonIfExists, writeJsonFile } from "./fs.js";
import type { RelayMode, RelayState } from "./types.js";

export function createDefaultState(mode: RelayMode): RelayState {
  return {
    currentRun: "",
    currentLane: DEFAULT_LANE,
    mode,
    currentChange: "",
    updatedAt: new Date().toISOString(),
    advisorMode: "review",
    executorFailures: {
      currentTask: 0,
      totalEscalations: 0,
    },
    directFixLog: [],
  };
}

export async function loadState(root: string): Promise<RelayState> {
  const state = await readJsonIfExists<RelayState>(path.join(root, STATE_FILE));

  if (!state) {
    throw new Error("Missing .relay/state.json. Run relay init first.");
  }

  return state;
}

export async function writeState(root: string, state: RelayState): Promise<void> {
  await writeJsonFile(path.join(root, STATE_FILE), state);
}

export async function updateState(root: string, patch: Partial<RelayState>): Promise<RelayState> {
  const current = await loadState(root);
  const next = { ...current, ...patch, updatedAt: new Date().toISOString() };
  await writeState(root, next);
  return next;
}
