import type { CameraEntry } from "./types.js";

function normalizeCameraNumber(camera: Pick<CameraEntry, "name" | "suffix">): string {
  const suffix = camera.suffix.trim();
  if (suffix) {
    return suffix;
  }

  const cameraNameMatch = camera.name.trim().match(/^camera\s+(.+)$/i);
  if (cameraNameMatch) {
    return cameraNameMatch[1].trim();
  }

  return camera.name.trim();
}

export function formatCameraLabel(
  camera: Pick<CameraEntry, "name" | "suffix"> &
    Partial<Pick<CameraEntry, "cameraType" | "lens" | "displayNote">>
): string {
  return [
    normalizeCameraNumber(camera),
    (camera.cameraType ?? "").trim(),
    (camera.lens ?? "").trim(),
    (camera.displayNote ?? "").trim()
  ]
    .filter(Boolean)
    .join(" • ");
}
