const ABSOLUTE_URL_PATTERN = /^[a-z][a-z0-9+.-]*:\/\//i;
const SPECIAL_SCHEME_PATTERN = /^(about|data|file|mailto|javascript):/i;
const BARE_IPV4_PATTERN = /^(?:\d{1,3}\.){3}\d{1,3}(?::\d+)?(?:[/?#].*)?$/;
const BARE_HOSTNAME_PATTERN = /^(?:localhost|(?:[a-z0-9-]+\.)+[a-z0-9-]+)(?::\d+)?(?:[/?#].*)?$/i;
const BARE_IPV4_PREFIX_PATTERN = /^(?:\d{1,3}\.){1,3}$/;
const CAMERA_GUI_DEFAULT_PATH = "/rmt.html";

function hasScheme(input: string): boolean {
  return ABSOLUTE_URL_PATTERN.test(input) || SPECIAL_SCHEME_PATTERN.test(input);
}

function looksLikeBareHost(input: string): boolean {
  return BARE_IPV4_PATTERN.test(input) || BARE_HOSTNAME_PATTERN.test(input);
}

function isPrivateIpv4Host(hostname: string): boolean {
  const octets = hostname.split(".").map((part) => Number(part));
  if (
    octets.length !== 4 ||
    octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)
  ) {
    return false;
  }

  const [first, second] = octets;
  return (
    first === 10 ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168)
  );
}

function withDefaultCameraGuiPath(input: string): string {
  try {
    const parsed = new URL(input);
    const isHttp = parsed.protocol === "http:" || parsed.protocol === "https:";
    const isRoot = parsed.pathname === "/" && !parsed.search && !parsed.hash;
    if (isHttp && isRoot && isPrivateIpv4Host(parsed.hostname)) {
      parsed.pathname = CAMERA_GUI_DEFAULT_PATH;
      return parsed.toString();
    }
  } catch {
    return input;
  }

  return input;
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
    return withDefaultCameraGuiPath(normalizedInput);
  }

  return `${normalizeCameraPrefix(prefix)}${trimmed}`;
}

export function resolveCameraWebviewUrl(input: string): string {
  return withDefaultCameraGuiPath(normalizeCameraUrl(input));
}

export function cameraBaseFromCommittedUrl(input: string): string {
  const normalized = normalizeCameraUrl(input);

  try {
    const parsed = new URL(normalized);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.origin;
    }
  } catch {
    return normalized;
  }

  return normalized;
}
