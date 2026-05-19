import { contextBridge } from "electron";

contextBridge.exposeInMainWorld("ditbrowse", {
  version: "0.1.0"
});
