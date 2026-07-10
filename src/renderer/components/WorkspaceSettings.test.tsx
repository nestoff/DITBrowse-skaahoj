import type { ComponentProps } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { sampleWorkspace } from "../../shared/sampleData";
import { WorkspaceSettings } from "./WorkspaceSettings";

type WorkspaceSettingsProps = ComponentProps<typeof WorkspaceSettings>;

function createProps(
  overrides: Partial<WorkspaceSettingsProps> = {}
): WorkspaceSettingsProps {
  return {
    jobs: sampleWorkspace.jobs,
    cameraLists: sampleWorkspace.cameraLists,
    activeCameraListId: sampleWorkspace.activeCameraListId,
    activeList: sampleWorkspace.cameraLists[0],
    selectedTile:
      sampleWorkspace.tiles.find((tile) => tile.id === sampleWorkspace.selectedTileId) ?? null,
    onSelectCameraList: vi.fn(),
    onCreateJob: vi.fn(),
    onUpdateJobName: vi.fn(),
    onDeleteJob: vi.fn(),
    onReloadAll: vi.fn(),
    credentialPresets: [],
    passwordRecords: [],
    onAddCredentialPreset: vi.fn(),
    onDeleteCredentialPreset: vi.fn(),
    onDeletePasswordRecord: vi.fn(),
    onDeleteSelectedTilePassword: vi.fn(),
    onResetSelectedScale: vi.fn(),
    onResetGridOrder: vi.fn(),
    resetBusy: false,
    onResetSelectedCamera: vi.fn(),
    onRequestResetList: vi.fn(),
    controlApiInfo: {
      host: "127.0.0.1",
      port: 54321,
      baseUrl: "http://127.0.0.1:54321",
      configuredPort: 54321
    },
    onSetControlApiPort: vi.fn(async () => undefined),
    ...overrides
  };
}

describe("WorkspaceSettings", () => {
  it("creates and renames jobs from the full workspace", () => {
    const onCreateJob = vi.fn();
    const onUpdateJobName = vi.fn();
    render(
      <WorkspaceSettings
        {...createProps({ onCreateJob, onUpdateJobName })}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "New Job" }));
    fireEvent.change(screen.getByLabelText("New job name"), {
      target: { value: "Commercial A" }
    });
    fireEvent.change(screen.getByLabelText("New camera list name"), {
      target: { value: "Main Cameras" }
    });
    fireEvent.change(screen.getByLabelText("New default URL prefix"), {
      target: { value: "10.20.100." }
    });
    fireEvent.click(screen.getByRole("button", { name: "Create Job" }));

    expect(onCreateJob).toHaveBeenCalledWith("Commercial A", "Main Cameras", "10.20.100.");

    fireEvent.change(screen.getByLabelText("Current job name"), {
      target: { value: "Commercial B" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Save Job Name" }));

    expect(onUpdateJobName).toHaveBeenCalledWith("Commercial B");
  });

  it("uses the shared confirmation dialog for job deletion", () => {
    const onDeleteJob = vi.fn();
    const confirm = vi.spyOn(window, "confirm");
    render(<WorkspaceSettings {...createProps({ onDeleteJob })} />);

    fireEvent.click(screen.getByRole("button", { name: "Delete Job" }));

    expect(screen.getByRole("dialog", { name: "Delete job" })).toBeVisible();
    expect(confirm).not.toHaveBeenCalled();
    expect(onDeleteJob).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Delete job" }));

    expect(onDeleteJob).toHaveBeenCalledWith("job-sample");
    confirm.mockRestore();
  });

  it("runs selected and all-camera sign-out actions", () => {
    const onResetSelectedCamera = vi.fn();
    const onRequestResetList = vi.fn();
    render(
      <WorkspaceSettings
        {...createProps({ onResetSelectedCamera, onRequestResetList })}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Sign Out & Reload Camera" }));
    fireEvent.click(screen.getByRole("button", { name: "Sign Out & Reload All" }));

    expect(onResetSelectedCamera).toHaveBeenCalledOnce();
    expect(onRequestResetList).toHaveBeenCalledOnce();
  });

  it("sets and clears the local control API port", async () => {
    const onSetControlApiPort = vi.fn(async () => undefined);
    render(<WorkspaceSettings {...createProps({ onSetControlApiPort })} />);

    expect(screen.getByLabelText("Local API shortcuts")).toHaveTextContent(
      "GET /api/focus/1"
    );
    expect(screen.getByLabelText("Local API shortcuts")).toHaveTextContent("GET /api/grid");
    expect(screen.getByLabelText("Local API shortcuts")).toHaveTextContent(
      "ws://127.0.0.1:54321/api/ws"
    );

    fireEvent.change(screen.getByLabelText("API port"), {
      target: { value: "54001" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Save Port" }));

    await waitFor(() => expect(onSetControlApiPort).toHaveBeenCalledWith(54001));

    fireEvent.click(screen.getByRole("button", { name: "Auto" }));

    await waitFor(() => expect(onSetControlApiPort).toHaveBeenCalledWith(null));
  });

  it("manages visible global credential presets", () => {
    const onAddCredentialPreset = vi.fn();
    const onDeleteCredentialPreset = vi.fn();
    render(
      <WorkspaceSettings
        {...createProps({
          credentialPresets: [
            {
              id: "preset-1",
              username: "admin",
              password: "ABCD1234",
              cameraType: "VENICE 2"
            }
          ],
          onAddCredentialPreset,
          onDeleteCredentialPreset
        })}
      />
    );

    expect(screen.getByLabelText("Saved credential presets")).toHaveTextContent("admin");
    expect(screen.getByLabelText("Saved credential presets")).toHaveTextContent("ABCD1234");

    fireEvent.change(screen.getByLabelText("Preset username"), {
      target: { value: "operator" }
    });
    fireEvent.change(screen.getByLabelText("Preset password"), {
      target: { value: "secret" }
    });
    fireEvent.change(screen.getByLabelText("Preset model match"), {
      target: { value: "VENICE 2" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Add" }));

    expect(onAddCredentialPreset).toHaveBeenCalledWith("operator", "secret", "VENICE 2");

    fireEvent.click(screen.getByLabelText("Saved credential presets").querySelector("button")!);
    expect(onDeleteCredentialPreset).toHaveBeenCalledWith("preset-1");
  });

  it("shows and deletes saved camera passwords", () => {
    const onDeletePasswordRecord = vi.fn();
    const onDeleteSelectedTilePassword = vi.fn();
    render(
      <WorkspaceSettings
        {...createProps({
          passwordRecords: [
            {
              id: "password-1",
              jobId: "job-sample",
              cameraListId: "list-sample",
              cameraId: "camera-41",
              url: "http://192.168.1.41",
              username: "admin",
              password: "ABCD1234"
            }
          ],
          onDeletePasswordRecord,
          onDeleteSelectedTilePassword
        })}
      />
    );

    expect(screen.getByLabelText("Saved camera passwords")).toHaveTextContent(
      "http://192.168.1.41"
    );
    expect(screen.getByLabelText("Saved camera passwords")).toHaveTextContent("ABCD1234");

    fireEvent.click(screen.getByRole("button", { name: "Forget Selected Tile Password" }));
    expect(onDeleteSelectedTilePassword).toHaveBeenCalledOnce();

    fireEvent.click(screen.getByLabelText("Saved camera passwords").querySelector("button")!);
    expect(onDeletePasswordRecord).toHaveBeenCalledWith("password-1");
  });
});
