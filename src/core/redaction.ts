const PRIVATE_KEY_BLOCK = /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g;
const BEARER_TOKEN = /\b(Bearer\s+)([A-Za-z0-9._~+/=-]{6,})/gi;
const SENSITIVE_KEY_VALUE =
  /(["']?[\w.-]*(?:api[_-]?key|token|secret|password)[\w.-]*["']?\s*[:=]\s*)(["']?)([^\s"',;]+)/gi;

export function redactSensitiveText(value: string): string {
  if (!value) {
    return value;
  }

  return value
    .replace(PRIVATE_KEY_BLOCK, "[REDACTED_PRIVATE_KEY]")
    .replace(BEARER_TOKEN, "$1[REDACTED]")
    .replace(SENSITIVE_KEY_VALUE, (_match, prefix: string, quote: string) => `${prefix}${quote}[REDACTED]`);
}
