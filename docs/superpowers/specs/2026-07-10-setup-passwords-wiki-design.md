# Camera Setup and Passwords Wiki Design

## Goal

Create a concise, brand-neutral GitHub Wiki that helps a first-time DITBrowse operator configure cameras and manage camera logins without needing prior knowledge of the application.

The documentation centers on two tasks:

1. Build and verify a camera list.
2. Configure, use, and reset saved camera credentials safely.

## Audience and voice

The primary reader is an operator setting up DITBrowse for a job. The guide assumes the reader understands basic IP networking but does not assume a particular camera manufacturer, camera web interface, or existing familiarity with DITBrowse.

Copy uses short steps, plain verbs, and the exact labels shown in the application. Brand-specific examples and terminology are excluded.

## Wiki structure

### Home

The Home page provides:

- A one-paragraph description of DITBrowse.
- A link to the latest notarized Apple-silicon DMG release.
- A short setup sequence linking to the Camera Setup and Passwords and Sign-In pages.
- A compact overview still of the main camera workspace.

### Camera Setup

The Camera Setup page documents this workflow in order:

1. Open **Camera List**.
2. Create or select a job and camera list.
3. Set the list's shared URL prefix.
4. Add camera rows or set the camera count.
5. Enter each camera's positive integer camera number.
6. Choose whether a camera follows the shared prefix or uses a full URL.
7. Optionally enter camera type, lens, and display note metadata.
8. Optionally set per-camera resolution and zoom overrides.
9. Save changes.
10. Confirm each camera appears in the grid and that its camera number is centered in the tile header.

The page explains that a camera following the list prefix combines the prefix with a normalized two-digit network suffix derived from the integer camera number. The displayed camera identity remains the normal integer value. The guide tells the operator to verify the resolved **Full URL** before saving and explains when to disable **Follow Prefix** and enter a full URL for a different addressing scheme.

### Passwords and Sign-In

The Passwords and Sign-In page documents:

- Adding a global password preset with username, password, and optional camera-type match.
- Responding to the camera authentication prompt manually.
- Using the recommended paired **Use … login & Sign In** action.
- How **Save for this camera** scopes a saved login to that camera in the active job/list.
- The difference between safe **Reload** actions and destructive **Sign out, forget login & reload** actions in the **Camera Session** menu.
- Deleting an individual saved camera password from Settings.
- Why password presets remain available after camera-specific sign-out.

No screenshot, example, caption, or prose may expose a real production password.

### Troubleshooting

The Troubleshooting page covers only setup and password problems:

- Camera tile remains blank.
- Camera opens at the wrong address.
- Camera number produces the wrong suffix.
- A camera needs a full URL instead of the shared prefix.
- Authentication prompt keeps returning.
- Wrong login was saved for a camera.
- Password preset is not recommended for the expected camera.
- Sign-out cleared a saved login intentionally.

Each entry follows a symptom, likely cause, and corrective action format.

## Still-image plan

Fresh stills are captured from the current v0.1.1 interface using a sanitized example workspace. Images use generic camera names and non-production addresses. Password fields are blank or masked; no real credential value is displayed.

Required stills:

1. Main camera workspace with numbered tile headers.
2. Camera List editor showing the shared list prefix and camera rows.
3. Camera row details showing Camera #, Follow Prefix, Full URL, Type, Lens, and Display Note.
4. Workspace Settings showing Password Presets and Saved Camera Passwords without secret values.
5. Camera sign-in dialog showing the paired saved-login action and Save checkbox.
6. Camera Session menu showing safe reload and destructive sign-out actions.

Stills are cropped to the relevant interface region when that improves readability. Captions explain what the reader should notice rather than repeating the heading.

## Screenshot privacy and data rules

- Use documentation-only camera addresses in the private IPv4 ranges.
- Use neutral camera labels such as Camera 1 and Camera 2.
- Use generic camera types such as `Studio Camera` only when demonstrating type matching.
- Do not use production job names, saved URLs, usernames, or passwords.
- Do not show a plaintext password in Settings or authentication suggestions.
- Review every image at original resolution before publication.

## GitHub Wiki publication

The repository Wiki is currently disabled. Implementation will:

1. Enable the GitHub Wiki for `Lightlab24/DITBrowse`.
2. Initialize or clone the repository's wiki Git repository.
3. Publish `Home.md`, `Camera-Setup.md`, `Passwords-and-Sign-In.md`, `Troubleshooting.md`, and `_Sidebar.md`.
4. Store stills under an `images/` directory in the wiki repository and reference them with relative Markdown links.
5. Link the Home page to the v0.1.1 release page and direct DMG asset.

Because the GitHub repository is private, the Wiki and its images remain limited to users with repository access unless repository visibility changes separately.

## Verification

Before publication:

- Verify every application label matches v0.1.1.
- Verify all relative page and image links.
- Confirm every required still renders in Markdown.
- Inspect each still at original resolution for credentials or production data.
- Confirm the wiki sidebar reaches all four pages.
- Confirm the release and DMG links resolve.
- Read the complete wiki once in task order as a first-time operator.

After publication:

- Read back each page from the wiki Git repository.
- Confirm the GitHub repository reports Wiki enabled.
- Confirm the Home page URL is available to an authenticated repository user.

## Out of scope

- Camera-manufacturer-specific setup instructions.
- Detailed Companion module documentation.
- Network engineering beyond shared prefix and camera-address examples.
- Developer architecture, API, source-build, and release-process documentation.
- Changing repository visibility.
