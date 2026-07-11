export interface HelpTroubleshootingItem {
  symptom: string;
  cause: string;
  action: string;
}

export interface HelpSection {
  id: "quick-start" | "camera-setup" | "passwords" | "troubleshooting";
  title: string;
  introduction: string;
  steps?: string[];
  notes?: string[];
  troubleshooting?: HelpTroubleshootingItem[];
}

export const helpSections: HelpSection[] = [
  {
    id: "quick-start",
    title: "Quick Start",
    introduction:
      "Set up the camera list first, then save a reusable login or sign in to each camera when prompted.",
    steps: [
      "Open Camera List from the top-right of the main tab row.",
      "Select or create the job and camera list for the current setup.",
      "Set the shared URL prefix, add camera rows, and verify every resolved Full URL.",
      "Save the camera list and confirm each camera number appears centered in its tile header.",
      "Add a password preset or use the sign-in prompt when a camera requests credentials."
    ]
  },
  {
    id: "camera-setup",
    title: "Camera Setup",
    introduction:
      "A camera number is a positive whole number such as 1, 2, or 12. DITBrowse uses that number as the camera identity.",
    steps: [
      "Open Camera List and choose the correct job and camera list.",
      "Enter the shared URL prefix used by cameras in this list.",
      "Add the required rows and enter each Camera # as a positive whole number.",
      "Leave Follow Prefix on when the camera uses the shared prefix. DITBrowse derives a two-digit network suffix, so camera 1 resolves with suffix 01 while its displayed number remains 1.",
      "Turn Follow Prefix off and enter Full URL when that camera uses a different address pattern.",
      "Optionally enter Type, Lens, Display Note, Resolution, and Zoom.",
      "Read the resolved Full URL in every row, save, and confirm the numbered tiles appear in the grid."
    ],
    notes: [
      "If a camera opens at the wrong address, correct Camera # or enter a Full URL before changing passwords.",
      "Camera numbers are integers only; do not enter labels, spaces, decimals, or punctuation."
    ]
  },
  {
    id: "passwords",
    title: "Passwords and Sign-In",
    introduction:
      "Password presets are reusable suggestions. A saved camera login is tied to one camera in the active job and camera list.",
    steps: [
      "Open Camera List, scroll to Workspace Settings, and add a Password Preset with username, password, and optional camera type.",
      "When a camera requests credentials, use the matching Use … login & Sign In button to fill both fields and submit once.",
      "Leave Save for this camera checked to reuse that login for this camera in the active job and list.",
      "Use Camera Session > Reload selected or Reload all for a normal non-destructive refresh.",
      "Use Camera Session > Sign out, forget login & reload selected when the saved login is wrong or the camera must request credentials again.",
      "Use Sign out, forget active-list logins & reload all… only when every saved login in the current list should be cleared."
    ],
    notes: [
      "Signing out and forgetting a camera login does not delete the reusable Password Preset.",
      "Saved Camera Passwords in Workspace Settings can remove one stored camera login directly."
    ]
  },
  {
    id: "troubleshooting",
    title: "Troubleshooting",
    introduction: "Start with the address, then check the saved login.",
    troubleshooting: [
      {
        symptom: "The tile is blank.",
        cause: "The camera address is unreachable or resolves to the wrong host.",
        action:
          "Open Camera List and verify the resolved Full URL, network connection, and camera power."
      },
      {
        symptom: "Camera 1 opens the wrong address.",
        cause: "The shared prefix or derived 01 suffix does not match this network.",
        action:
          "Correct the prefix, or turn off Follow Prefix and enter that camera's Full URL."
      },
      {
        symptom: "The authentication prompt keeps returning.",
        cause: "The saved camera login is no longer accepted.",
        action:
          "Use Sign out, forget login & reload selected, then sign in again with the correct credentials."
      },
      {
        symptom: "The expected preset is not recommended.",
        cause: "Its optional camera type does not match the Type value in Camera List.",
        action: "Correct the camera Type or use a preset without a type match."
      }
    ]
  }
];
