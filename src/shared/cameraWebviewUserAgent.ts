/**
 * Sony camera Web Apps often reject Electron's default User-Agent
 * (it contains "Electron"). Use a plain Chrome-on-macOS UA for guest tiles.
 *
 * Electron 42 ≈ Chromium 138.
 */
export const CAMERA_WEBVIEW_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36";

export function withoutElectronToken(userAgent: string): string {
  return userAgent
    .replace(/\s*Electron\/[\w.-]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
