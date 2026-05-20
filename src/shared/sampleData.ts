import type { WorkspaceState } from "./types.js";
import { formatCameraLabel } from "./cameraLabel.js";
import { resolveCameraAddress } from "./url.js";

const prefix = "http://192.168.1.";

export const sampleWorkspace: WorkspaceState = {
  jobs: [{ id: "job-sample", name: "Sample Job", listIds: ["list-sample"] }],
  cameraLists: [
    {
      id: "list-sample",
      jobId: "job-sample",
      name: "Camera LAN",
      defaultPrefix: prefix,
      cameras: Array.from({ length: 12 }, (_, index) => {
        const suffix = String(41 + index);
        return {
          id: `camera-${suffix}`,
          name: suffix,
          url: resolveCameraAddress(prefix, suffix),
          suffix,
          prefixOverride: "",
          cameraType: "",
          lens: "",
          displayNote: "",
          notes: "",
          viewportOverride: null,
          zoomOverride: null
        };
      })
    }
  ],
  passwordRecords: [],
  tiles: Array.from({ length: 12 }, (_, index) => {
    const suffix = String(41 + index);
    const camera = {
      id: `camera-${suffix}`,
      name: suffix,
      url: resolveCameraAddress(prefix, suffix),
      suffix,
      prefixOverride: "",
      cameraType: "",
      lens: "",
      displayNote: "",
      notes: "",
      viewportOverride: null,
      zoomOverride: null
    };
    return {
      id: `tile-${suffix}`,
      cameraId: `camera-${suffix}`,
      url: resolveCameraAddress(prefix, suffix),
      title: formatCameraLabel(camera),
      partition: "persist:ditbrowse-job-sample-list-sample",
      viewport: { width: 1280, height: 720 },
      zoom: 1
    };
  }),
  selectedTileId: "tile-41",
  activeJobId: "job-sample",
  activeCameraListId: "list-sample",
  gridColumns: 4,
  defaultViewport: { width: 1280, height: 720 },
  defaultZoom: 1
};
