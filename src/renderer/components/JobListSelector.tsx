import type { ReactElement } from "react";
import type { CameraList, Job } from "../../shared/types";

interface JobListSelectorProps {
  jobs: Job[];
  cameraLists: CameraList[];
  activeCameraListId: string | null;
  onSelectCameraList: (cameraListId: string) => void;
  onCreateJob: (jobName: string, listName: string, defaultPrefix: string) => void;
}

export function JobListSelector({
  jobs,
  cameraLists,
  activeCameraListId,
  onSelectCameraList,
  onCreateJob
}: JobListSelectorProps): ReactElement {
  function createJob(): void {
    const jobName = window.prompt("Job name", "New Job")?.trim();
    if (!jobName) {
      return;
    }

    const listName = window.prompt("Camera list name", "Camera List")?.trim();
    if (!listName) {
      return;
    }

    const defaultPrefix = window.prompt("Default URL prefix", "http://192.168.1.")?.trim();
    if (!defaultPrefix) {
      return;
    }

    onCreateJob(jobName, listName, defaultPrefix);
  }

  return (
    <div className="job-list-selector">
      <select
        aria-label="Job and camera list"
        value={activeCameraListId ?? ""}
        onChange={(event) => onSelectCameraList(event.target.value)}
      >
        {cameraLists.map((list) => {
          const job = jobs.find((candidate) => candidate.id === list.jobId);
          return (
            <option key={list.id} value={list.id}>
              {job?.name ?? "Job"} / {list.name}
            </option>
          );
        })}
      </select>
      <button type="button" onClick={createJob}>
        New Job
      </button>
    </div>
  );
}
