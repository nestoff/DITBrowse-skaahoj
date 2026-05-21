import type { ReactElement } from "react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { CameraList, Job } from "../../shared/types";
import { PillButton } from "./ui/PillButton";

interface JobListSelectorProps {
  jobs: Job[];
  cameraLists: CameraList[];
  activeCameraListId: string | null;
  activeList: CameraList | null;
  onSelectCameraList: (cameraListId: string) => void;
  onCreateJob: (jobName: string, listName: string, defaultPrefix: string) => void;
  onUpdateJobName: (jobName: string) => void;
  onDeleteJob: (jobId: string) => void;
}

export function JobListSelector({
  jobs,
  cameraLists,
  activeCameraListId,
  activeList,
  onSelectCameraList,
  onCreateJob,
  onUpdateJobName,
  onDeleteJob
}: JobListSelectorProps): ReactElement {
  const [creating, setCreating] = useState(false);
  const [newJobName, setNewJobName] = useState("New Job");
  const [newListName, setNewListName] = useState("Camera List");
  const [newDefaultPrefix, setNewDefaultPrefix] = useState(
    activeList?.defaultPrefix ?? "http://192.168.1."
  );
  const activeJob = useMemo(
    () => jobs.find((job) => job.id === activeList?.jobId) ?? null,
    [activeList?.jobId, jobs]
  );
  const [jobNameDraft, setJobNameDraft] = useState(activeJob?.name ?? "");

  useEffect(() => {
    setJobNameDraft(activeJob?.name ?? "");
  }, [activeJob?.id, activeJob?.name]);

  useEffect(() => {
    if (!creating) {
      return;
    }

    setNewDefaultPrefix(activeList?.defaultPrefix ?? "http://192.168.1.");
  }, [activeList?.defaultPrefix, creating]);

  function createJob(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const jobName = newJobName.trim();
    const listName = newListName.trim();
    const defaultPrefix = newDefaultPrefix.trim();
    if (!jobName || !listName || !defaultPrefix) {
      return;
    }

    onCreateJob(jobName, listName, defaultPrefix);
    setCreating(false);
    setNewJobName("New Job");
    setNewListName("Camera List");
  }

  function renameJob(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const jobName = jobNameDraft.trim();
    if (!jobName || jobName === activeJob?.name) {
      return;
    }

    onUpdateJobName(jobName);
  }

  function deleteJob(): void {
    if (!activeJob) {
      return;
    }

    const confirmed = window.confirm(
      `Delete "${activeJob.name}" and its camera lists, cookies, and saved passwords?`
    );
    if (confirmed) {
      onDeleteJob(activeJob.id);
    }
  }

  return (
    <div className="job-list-stack">
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
        <PillButton
          icon={<Plus size={14} strokeWidth={2.2} />}
          onClick={() => setCreating((open) => !open)}
        >
          New Job
        </PillButton>
        <PillButton
          icon={<Trash2 size={14} strokeWidth={2.2} />}
          tone="danger"
          disabled={!activeJob}
          onClick={deleteJob}
        >
          Delete Job
        </PillButton>
      </div>
      {activeJob && (
        <form className="job-inline-form" onSubmit={renameJob}>
          <label className="job-inline-field">
            <span>Current Job</span>
            <input
              aria-label="Current job name"
              value={jobNameDraft}
              onChange={(event) => setJobNameDraft(event.target.value)}
            />
          </label>
          <PillButton type="submit">Save Job Name</PillButton>
        </form>
      )}
      {creating && (
        <form className="new-job-form" aria-label="New job form" onSubmit={createJob}>
          <label className="job-inline-field">
            <span>Job</span>
            <input
              aria-label="New job name"
              value={newJobName}
              onChange={(event) => setNewJobName(event.target.value)}
            />
          </label>
          <label className="job-inline-field">
            <span>List</span>
            <input
              aria-label="New camera list name"
              value={newListName}
              onChange={(event) => setNewListName(event.target.value)}
            />
          </label>
          <label className="job-inline-field new-job-prefix-field">
            <span>Prefix</span>
            <input
              aria-label="New default URL prefix"
              value={newDefaultPrefix}
              onChange={(event) => setNewDefaultPrefix(event.target.value)}
            />
          </label>
          <div className="new-job-actions">
            <PillButton type="submit" tone="primary">
              Create Job
            </PillButton>
            <PillButton type="button" tone="muted" onClick={() => setCreating(false)}>
              Cancel
            </PillButton>
          </div>
        </form>
      )}
    </div>
  );
}
