import type { RelayConfig } from "./types.js";
import { loadRelayIgnoreMatcher, type RelayIgnoreMatcher } from "./relayignore.js";
import { redactSensitiveText } from "./redaction.js";

export interface ContextSafety {
  ignore: RelayIgnoreMatcher;
  ignoreRulesStatus: string;
  redactionRulesStatus: string;
  shouldIgnorePath(candidate: string): boolean;
  redactText(value: string): string;
}

export async function createContextSafety(root: string, config: RelayConfig): Promise<ContextSafety> {
  const ignore = await loadRelayIgnoreMatcher(root, config.excludePatterns);

  return {
    ignore,
    ignoreRulesStatus: ignore.hasRelayIgnore
      ? "applied: default rules + .relayignore"
      : "applied: default rules only",
    redactionRulesStatus: "applied: basic sensitive value redaction",
    shouldIgnorePath(candidate: string): boolean {
      return ignore.shouldIgnorePath(candidate);
    },
    redactText(value: string): string {
      return redactSensitiveText(value);
    },
  };
}
