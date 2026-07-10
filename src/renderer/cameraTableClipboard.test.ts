import { describe, expect, it } from "vitest";
import type { CameraList } from "../shared/types";
import {
  CAMERA_TABLE_COLUMNS,
  appendSequentialCamera,
  applyDraftCameraPatch,
  cameraTableSelectionBounds,
  cloneCameraList,
  createCameraTableSelection,
  isCameraTableCellSelected,
  resizeDraftCameraList,
  serializeCameraTableSelection,
  serializeWholeCameraTable
} from "./cameraTableClipboard";

const list: CameraList = {
  id: "list-test",
  jobId: "job-test",
  name: "Test Cameras",
  defaultPrefix: "http://10.20.100.",
  cameras: [
    {
      id: "camera-a",
      name: "A",
      suffix: "01",
      url: "http://10.20.100.01",
      prefixOverride: "",
      usesListPrefix: true,
      cameraType: "VENICE 2",
      lens: "35mm",
      displayNote: "Wide",
      notes: "",
      viewportOverride: null,
      zoomOverride: null
    },
    {
      id: "camera-b",
      name: "B",
      suffix: "02",
      url: "http://10.20.100.55/rmt.html",
      prefixOverride: "",
      usesListPrefix: false,
      cameraType: "FR7",
      lens: "50mm",
      displayNote: "Close",
      notes: "",
      viewportOverride: { width: 1280, height: 720 },
      zoomOverride: 1.05
    }
  ]
};

describe("camera table selection", () => {
  it("normalizes cell, row, and column bounds", () => {
    expect(
      cameraTableSelectionBounds(
        createCameraTableSelection(
          "cells",
          { rowIndex: 1, columnIndex: 3 },
          { rowIndex: 0, columnIndex: 1 }
        ),
        2
      )
    ).toEqual({ rowStart: 0, rowEnd: 1, columnStart: 1, columnEnd: 3 });

    expect(
      cameraTableSelectionBounds(
        createCameraTableSelection(
          "rows",
          { rowIndex: 1, columnIndex: 0 },
          { rowIndex: 0, columnIndex: 0 }
        ),
        2
      )
    ).toEqual({ rowStart: 0, rowEnd: 1, columnStart: 0, columnEnd: 8 });

    expect(
      cameraTableSelectionBounds(
        createCameraTableSelection(
          "columns",
          { rowIndex: 0, columnIndex: 5 },
          { rowIndex: 0, columnIndex: 7 }
        ),
        2
      )
    ).toEqual({ rowStart: 0, rowEnd: 1, columnStart: 5, columnEnd: 7 });
  });

  it("reports selected cells from normalized bounds", () => {
    const selection = createCameraTableSelection(
      "cells",
      { rowIndex: 0, columnIndex: 1 },
      { rowIndex: 1, columnIndex: 2 }
    );

    expect(isCameraTableCellSelected(selection, 2, 0, 1)).toBe(true);
    expect(isCameraTableCellSelected(selection, 2, 1, 2)).toBe(true);
    expect(isCameraTableCellSelected(selection, 2, 0, 3)).toBe(false);
  });
});

describe("camera table serialization", () => {
  it("serializes selected cells as TSV without headers", () => {
    const selection = createCameraTableSelection(
      "cells",
      { rowIndex: 0, columnIndex: 1 },
      { rowIndex: 1, columnIndex: 3 }
    );

    expect(serializeCameraTableSelection(list, selection)).toBe(
      "A\t01\thttp://10.20.100.01\nB\t02\thttp://10.20.100.55/rmt.html"
    );
  });

  it("serializes row and column selections", () => {
    expect(
      serializeCameraTableSelection(
        list,
        createCameraTableSelection("rows", { rowIndex: 0, columnIndex: 0 })
      )
    ).toBe("TRUE\tA\t01\thttp://10.20.100.01\tVENICE 2\t35mm\tWide\t\t");

    expect(
      serializeCameraTableSelection(
        list,
        createCameraTableSelection(
          "columns",
          { rowIndex: 0, columnIndex: 4 },
          { rowIndex: 0, columnIndex: 5 }
        )
      )
    ).toBe("VENICE 2\t35mm\nFR7\t50mm");
  });

  it("serializes the complete draft with standard headers", () => {
    const output = serializeWholeCameraTable(list);

    expect(output.split("\n")[0]).toBe(
      "Follow Prefix\tIndex\tCamera #\tFull URL\tType\tLens\tDisplay Note\tViewport\tZoom"
    );
    expect(output.split("\n")[1]).toBe(
      "TRUE\tA\t01\thttp://10.20.100.01\tVENICE 2\t35mm\tWide\t\t"
    );
    expect(output.split("\n")[2]).toBe(
      "FALSE\tB\t02\thttp://10.20.100.55/rmt.html\tFR7\t50mm\tClose\t1280x720\t1.05"
    );
    expect(CAMERA_TABLE_COLUMNS).toHaveLength(9);
  });
});

describe("shared camera draft helpers", () => {
  it("deep-clones viewport overrides", () => {
    const cloned = cloneCameraList(list);

    expect(cloned).not.toBe(list);
    expect(cloned.cameras[1]).not.toBe(list.cameras[1]);
    expect(cloned.cameras[1].viewportOverride).not.toBe(list.cameras[1].viewportOverride);
  });

  it("keeps sequential row and patch rules consistent", () => {
    const appended = appendSequentialCamera(list, () => "camera-c");
    expect(appended.cameras.at(-1)).toMatchObject({
      id: "camera-c",
      name: "C",
      suffix: "03",
      url: "http://10.20.100.03",
      usesListPrefix: true
    });

    expect(resizeDraftCameraList(list, 1).cameras).toHaveLength(1);
    let generatedId = 0;
    expect(
      resizeDraftCameraList(list, 120, () => `generated-${++generatedId}`).cameras
    ).toHaveLength(99);

    const patched = applyDraftCameraPatch(
      list.cameras[0],
      { suffix: "4" },
      list.defaultPrefix
    );
    expect(patched).toMatchObject({
      name: "D",
      suffix: "04",
      url: "http://10.20.100.04"
    });
  });
});
