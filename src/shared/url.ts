const ABSOLUTE_URL_PATTERN = /^[a-z][a-z0-9+.-]*:\/\//i;
const SPECIAL_SCHEME_PATTERN = /^(about|data|file|mailto|javascript):/i;
const BARE_IPV4_PATTERN = /^(?:\d{1,3}\.){3}\d{1,3}(?::\d+)?(?:[/?#].*)?$/;
const BARE_HOSTNAME_PATTERN = /^(?:localhost|(?:[a-z0-9-]+\.)+[a-z0-9-]+)(?::\d+)?(?:[/?#].*)?$/i;
const BARE_IPV4_PREFIX_PATTERN = /^(?:\d{1,3}\.){1,3}$/;

function hasScheme(input: string): boolean {
  return ABSOLUTE_URL_PATTERN.test(input) || SPECIAL_SCHEME_PATTERN.test(input);
}

function looksLikeBareHost(input: string): boolean {
  return BARE_IPV4_PATTERN.test(input) || BARE_HOSTNAME_PATTERN.test(input);
}

export function normalizeCameraUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed || hasScheme(trimmed)) {
    return trimmed;
  }

  return looksLikeBareHost(trimmed) ? `http://${trimmed}` : trimmed;
}

export function normalizeCameraPrefix(prefix: string): string {
  const trimmed = prefix.trim();
  if (!trimmed || hasScheme(trimmed)) {
    return trimmed;
  }

  if (BARE_IPV4_PREFIX_PATTERN.test(trimmed) || looksLikeBareHost(trimmed)) {
    return `http://${trimmed}`;
  }

  return trimmed;
}

export function resolveCameraAddress(prefix: string, input: string): string {
  const trimmed = input.trim();
  const normalizedInput = normalizeCameraUrl(trimmed);
  if (normalizedInput !== trimmed || hasScheme(trimmed)) {
    return normalizedInput;
  }

  return `${normalizeCameraPrefix(prefix)}${trimmed}`;
}
