import type { AdvisorConfig } from "./types.js";
import { loadAdvisorIgnoreMatcher, type AdvisorIgnoreMatcher } from "./advisorignore.js";
import { redactSensitiveText } from "./redaction.js";

export interface ContextSafety {
  ignore: AdvisorIgnoreMatcher;
  ignoreRulesStatus: string;
  redactionRulesStatus: string;
  shouldIgnorePath(candidate: string): boolean;
  redactText(value: string): string;
}

export async function createContextSafety(root: string, config: AdvisorConfig): Promise<ContextSafety> {
  const ignore = await loadAdvisorIgnoreMatcher(root, config.excludePatterns);

  return {
    ignore,
    ignoreRulesStatus: ignore.hasAdvisorIgnore
      ? "applied: default rules + .advisorignore"
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
