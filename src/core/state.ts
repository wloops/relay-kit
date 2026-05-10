import path from "node:path";
import { DEFAULT_LANE, STATE_FILE } from "./constants.js";
import { readJsonIfExists, writeJsonFile } from "./fs.js";
import type { AdvisorMode, AdvisorState } from "./types.js";

export function createDefaultState(mode: AdvisorMode): AdvisorState {
  return {
    currentRun: "",
    currentLane: DEFAULT_LANE,
    mode,
    currentChange: "",
    updatedAt: new Date().toISOString(),
  };
}

export async function loadState(root: string): Promise<AdvisorState> {
  const state = await readJsonIfExists<AdvisorState>(path.join(root, STATE_FILE));

  if (!state) {
    throw new Error("Missing .advisor-kit/state.json. Run advisor init first.");
  }

  return state;
}

export async function writeState(root: string, state: AdvisorState): Promise<void> {
  await writeJsonFile(path.join(root, STATE_FILE), {
    currentRun: state.currentRun,
    currentLane: state.currentLane,
    mode: state.mode,
    currentChange: state.currentChange,
    updatedAt: state.updatedAt,
  });
}

export async function updateState(root: string, patch: Partial<AdvisorState>): Promise<AdvisorState> {
  const current = await loadState(root);
  const next = { ...current, ...patch, updatedAt: new Date().toISOString() };
  await writeState(root, next);
  return next;
}
