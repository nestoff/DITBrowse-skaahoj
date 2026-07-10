# Camera Setup and Passwords Help Guide Design

## Goal

Create a concise, brand-neutral help guide that helps a first-time DITBrowse operator configure cameras and manage camera logins without needing prior knowledge of the application. The guide is bundled into DITBrowse for offline use and published as a GitHub Wiki from the same canonical content.

The documentation centers on two tasks:

1. Build and verify a camera list.
2. Configure, use, and reset saved camera credentials safely.

## Audience and voice

The primary reader is an operator setting up DITBrowse for a job. The guide assumes the reader understands basic IP networking but does not assume a particular camera manufacturer, camera web interface, or existing familiarity with DITBrowse.

Copy uses short steps, plain verbs, and the exact labels shown in the application. Brand-specific examples and terminology are excluded.

## Guide structure

### Quick Start

The opening section provides:

- A one-paragraph description of DITBrowse.
- A short setup sequence linking to the Camera Setup and Passwords and Sign-In pages.
- A compact overview still of the main camera workspace.

The GitHub Wiki Home page additionally links to the latest notarized Apple-silicon DMG release.

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

Fresh stills are captured directly from the current DITBrowse interface using a sanitized example workspace. They are not reconstructed mockups. Images use generic camera names and documentation-only addresses. Password fields are blank or masked; no real credential value is displayed.

Required stills:

1. Main camera workspace with numbered tile headers.
2. Camera List editor showing the shared list prefix and camera rows.
3. Camera row details showing Camera #, Follow Prefix, Full URL, Type, Lens, and Display Note.
4. Workspace Settings showing Password Presets and Saved Camera Passwords without secret values.
5. Camera sign-in dialog showing the paired saved-login action and Save checkbox.
6. Camera Session menu showing safe reload and destructive sign-out actions.

Stills are cropped to the relevant interface region when that improves readability. Captions explain what the reader should notice rather than repeating the heading.

Every instructional still receives a restrained annotation layer after capture:

- Clear arrows terminate at the exact live control or field being discussed.
- Numbered markers establish reading order and match numbered caption items below the image.
- Markers and arrows use high-contrast neutral white and gray styling that remains readable against the dark interface.
- Red is reserved for destructive sign-out, forgetting, or deletion actions; blue accents are not introduced.
- Annotations remain outside important labels and values whenever space permits and never obscure the target control.
- Callout wording uses the exact label visible in the captured application.
- Each annotated result is compared side by side with the unmodified capture to confirm that the interface remains an accurate representation of the current app.

Both the unmodified source capture and the publication-ready annotated image are retained so annotations can be updated when the interface changes.

## Screenshot privacy and data rules

- Use addresses reserved for documentation, such as the `192.0.2.0/24` range.
- Use neutral camera labels such as Camera 1 and Camera 2.
- Use generic camera types such as `Studio Camera` only when demonstrating type matching.
- Do not use production job names, saved URLs, usernames, or passwords.
- Do not show a plaintext password in Settings or authentication suggestions.
- Review every image at original resolution before publication.

## In-app Help Guide

DITBrowse gains a **Help** button beside **Camera List** in the main toolbar. It opens a full-window Help Guide overlay that follows the existing Camera List editor pattern rather than squeezing long instructions into a small dialog.

The overlay provides:

- A clear **Help Guide** title and close action.
- A compact navigation column for Quick Start, Camera Setup, Passwords and Sign-In, and Troubleshooting.
- A scrollable reading area with the same headings, steps, captions, and annotated stills used by the Wiki.
- Keyboard and focus behavior consistent with the rest of the application, including closing with Escape and returning focus to the Help button.
- Responsive sizing so text and annotations remain legible without stretching the guide edge to edge on a large display.

The complete guide, styles, and image assets are packaged with the application. Opening or reading Help never requires internet access, GitHub access, or an authenticated repository account. External links, such as the release page, are omitted from the offline Quick Start unless they can be presented as optional links without blocking the guide.

## Shared content architecture

The implementation keeps one canonical set of guide content and annotated images in the repository. The in-app renderer consumes that content at build time, and a deterministic publication script produces the GitHub Wiki Markdown pages from it. This prevents the in-app wording, callout numbers, image filenames, and Wiki instructions from drifting apart.

Guide content is data-only and does not execute arbitrary HTML. Each section declares its title, ordered steps, troubleshooting entries, image, alternative text, caption, and numbered callouts. The in-app component renders those fields natively, while the Wiki exporter converts them to Markdown.

The canonical help assets are versioned with the application. A UI change that affects a documented control requires updating its source capture, annotated still, and associated guide content in the same change.

## GitHub Wiki publication

The repository Wiki is currently disabled. Implementation will:

1. Enable the GitHub Wiki for `Lightlab24/DITBrowse`.
2. Initialize or clone the repository's wiki Git repository.
3. Generate and publish `Home.md`, `Camera-Setup.md`, `Passwords-and-Sign-In.md`, `Troubleshooting.md`, and `_Sidebar.md` from the canonical help content.
4. Store stills under an `images/` directory in the wiki repository and reference them with relative Markdown links.
5. Link the Home page to the v0.1.1 release page and direct DMG asset.

Because the GitHub repository is private, the Wiki and its images remain limited to users with repository access unless repository visibility changes separately.

## Verification

Before publication:

- Verify every application label matches v0.1.1.
- Compare every annotated still with a fresh capture of the installed app.
- Confirm each arrow terminates at the correct control and each marker matches its caption item.
- Verify all relative page and image links.
- Confirm every required still renders in Markdown.
- Inspect each still at original resolution for credentials or production data.
- Build the packaged application and confirm the Help Guide works with networking disabled.
- Confirm the Help overlay is keyboard accessible, scrollable, and readable at the application's minimum supported window size.
- Confirm opening and closing Help does not change the workspace, camera selection, or saved credentials.
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
- Camera-manufacturer login screens beyond the generic authentication prompt already presented by DITBrowse.
- Changing repository visibility.
