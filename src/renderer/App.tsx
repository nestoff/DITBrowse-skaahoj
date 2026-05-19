import type { ReactElement } from "react";
import { useEffect, useMemo, useReducer, useState } from "react";
import { sampleWorkspace } from "../shared/sampleData";
import { resolveCameraAddress } from "../shared/url";
import { runAllTileCommand, runSelectedTileCommand } from "./browserControls";
import { AddressBar } from "./components/AddressBar";
import { CameraListEditor } from "./components/CameraListEditor";
import { CookieCommands } from "./components/CookieCommands";
import { GridControls } from "./components/GridControls";
import { JobListSelector } from "./components/JobListSelector";
import { TabStrip } from "./components/TabStrip";
import { TileGrid } from "./components/TileGrid";
import {
  clearPartitionStorage,
  clearSelectedTileStorage,
  loadWorkspace,
  saveWorkspace
} from "./state/workspaceStorage";
import { workspaceReducer } from "./state/workspaceReducer";

export function App(): ReactElement {
  const [workspace, dispatch] = useReducer(workspaceReducer, sampleWorkspace);
  const [loaded, setLoaded] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);

  useEffect(() => {
    let active = true;
    loadWorkspace().then((loadedWorkspace) => {
      if (active) {
        dispatch({ type: "hydrateWorkspace", workspace: loadedWorkspace });
        setLoaded(true);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (loaded) {
      void saveWorkspace(workspace);
    }
  }, [loaded, workspace]);

  const selectedTile = useMemo(
    () => workspace.tiles.find((tile) => tile.id === workspace.selectedTileId) ?? null,
    [workspace.selectedTileId, workspace.tiles]
  );

  const activeList = workspace.cameraLists.find(
    (list) => list.id === workspace.activeCameraListId
  );
  const activePartition =
    workspace.activeJobId && workspace.activeCameraListId
      ? `persist:ditbrowse-${workspace.activeJobId}-${workspace.activeCameraListId}`
      : null;

  function navigate(input: string, target: "selected" | "new"): void {
    const url = resolveCameraAddress(activeList?.defaultPrefix ?? "", input);
    dispatch(
      target === "selected" ? { type: "navigateSelectedTile", url } : { type: "openNewTile", url }
    );
  }

  return (
    <main className="app-shell">
      <header className="top-bar">
        <button
          type="button"
          aria-label="Back"
          onClick={() => runSelectedTileCommand(workspace.selectedTileId, "back")}
        >
          Back
        </button>
        <button
          type="button"
          aria-label="Forward"
          onClick={() => runSelectedTileCommand(workspace.selectedTileId, "forward")}
        >
          Forward
        </button>
        <button
          type="button"
          aria-label="Reload"
          onClick={() => runSelectedTileCommand(workspace.selectedTileId, "reload")}
        >
          Reload
        </button>
        <button type="button" aria-label="Reload all" onClick={() => runAllTileCommand("reload")}>
          Reload All
        </button>
        <AddressBar value={selectedTile?.url ?? ""} onNavigate={navigate} />
        <GridControls
          columns={workspace.gridColumns}
          selectedZoom={selectedTile?.zoom ?? workspace.defaultZoom}
          selectedViewport={selectedTile?.viewport ?? workspace.defaultViewport}
          onColumnsChange={(columns) => dispatch({ type: "setGridColumns", columns })}
          onZoomChange={(zoom) => dispatch({ type: "setSelectedTileZoom", zoom })}
          onViewportChange={(viewport) =>
            dispatch({
              type: "setSelectedTileViewport",
              width: viewport.width,
              height: viewport.height
            })
          }
        />
        <JobListSelector
          jobs={workspace.jobs}
          cameraLists={workspace.cameraLists}
          activeCameraListId={workspace.activeCameraListId}
          onSelectCameraList={(cameraListId) =>
            dispatch({ type: "selectCameraList", cameraListId })
          }
          onCreateJob={(jobName, listName, defaultPrefix) =>
            dispatch({ type: "createJobWithList", jobName, listName, defaultPrefix })
          }
        />
        <button type="button" onClick={() => setEditorOpen(true)}>
          Edit List
        </button>
        <button type="button" onClick={() => dispatch({ type: "resetSelectedTileScale" })}>
          Reset Scale
        </button>
        <button type="button" onClick={() => dispatch({ type: "resetGridToListOrder" })}>
          Reset Order
        </button>
        <CookieCommands
          selectedTile={selectedTile}
          activePartition={activePartition}
          onClearSelected={(partition, url) => void clearSelectedTileStorage(partition, url)}
          onClearList={(partition) => void clearPartitionStorage(partition)}
        />
      </header>
      <TabStrip
        tiles={workspace.tiles}
        selectedTileId={workspace.selectedTileId}
        onSelectTile={(tileId) => dispatch({ type: "selectTile", tileId })}
        onMoveTile={(tileId, direction) => dispatch({ type: "moveTile", tileId, direction })}
        onAddTile={() => dispatch({ type: "openNewTile", url: "about:blank" })}
      />
      <TileGrid
        tiles={workspace.tiles}
        columns={workspace.gridColumns}
        selectedTileId={workspace.selectedTileId}
        onSelectTile={(tileId) => dispatch({ type: "selectTile", tileId })}
      />
      {editorOpen && (
        <CameraListEditor
          activeList={activeList ?? null}
          onClose={() => setEditorOpen(false)}
          onUpdatePrefix={(defaultPrefix) =>
            dispatch({ type: "updateActiveListPrefix", defaultPrefix })
          }
          onUpdateCamera={(cameraId, patch) =>
            dispatch({ type: "updateCameraEntry", cameraId, patch })
          }
          onAddCamera={() => dispatch({ type: "addCameraEntry" })}
          onImportRows={(rows) => {
            dispatch({ type: "replaceActiveListFromCsv", rows });
            setEditorOpen(false);
          }}
        />
      )}
    </main>
  );
}
