import type { ReactElement } from "react";
import { useEffect, useMemo, useReducer, useState } from "react";
import { sampleWorkspace } from "../shared/sampleData";
import { resolveCameraAddress } from "../shared/url";
import { runAllTileCommand, runSelectedTileCommand } from "./browserControls";
import { BrowserChrome } from "./components/BrowserChrome";
import { CameraListEditor } from "./components/CameraListEditor";
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
      <BrowserChrome
        workspace={workspace}
        selectedTile={selectedTile}
        activeList={activeList ?? null}
        activePartition={activePartition}
        onSelectTile={(tileId) => dispatch({ type: "selectTile", tileId })}
        onMoveTile={(tileId, direction) => dispatch({ type: "moveTile", tileId, direction })}
        onAddTile={() => dispatch({ type: "openNewTile", url: "about:blank" })}
        onNavigate={navigate}
        onBack={() => runSelectedTileCommand(workspace.selectedTileId, "back")}
        onForward={() => runSelectedTileCommand(workspace.selectedTileId, "forward")}
        onReload={() => runSelectedTileCommand(workspace.selectedTileId, "reload")}
        onReloadAll={() => runAllTileCommand("reload")}
        onColumnsChange={(columns) => dispatch({ type: "setGridColumns", columns })}
        onZoomChange={(zoom) => dispatch({ type: "setSelectedTileZoom", zoom })}
        onViewportChange={(viewport) =>
          dispatch({
            type: "setSelectedTileViewport",
            width: viewport.width,
            height: viewport.height
          })
        }
        onSelectCameraList={(cameraListId) => dispatch({ type: "selectCameraList", cameraListId })}
        onCreateJob={(jobName, listName, defaultPrefix) =>
          dispatch({ type: "createJobWithList", jobName, listName, defaultPrefix })
        }
        onEditList={() => setEditorOpen(true)}
        onResetSelectedScale={() => dispatch({ type: "resetSelectedTileScale" })}
        onResetGridOrder={() => dispatch({ type: "resetGridToListOrder" })}
        onClearSelectedCookies={(partition, url) => void clearSelectedTileStorage(partition, url)}
        onClearListCookies={(partition) => void clearPartitionStorage(partition)}
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
