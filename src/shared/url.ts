const FULL_URL_PATTERN = /^[a-z][a-z0-9+.-]*:\/\//i;

export function resolveCameraAddress(prefix: string, input: string): string {
  const trimmed = input.trim();
  if (FULL_URL_PATTERN.test(trimmed)) {
    return trimmed;
  }

  return `${prefix}${trimmed}`;
}
