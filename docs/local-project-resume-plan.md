# Feature candidate 3: save and resume a template locally

Date: 2026-09-22. Status: proposed implementation plan; no application changes made.

Source: `C:/work/DDAStatus/reports/weekly/2026-09-21_paintbynumbers.md`, feature candidate ③.

## Outcome and recommended scope

A visitor can generate a template, merge/split regions, move numbers, close the tab,
and return to a **Resume last project** card. Resuming restores the edited template
without regenerating it, with palette, settings and a useful undo/redo history intact.

Ship one automatically saved local project first. Keep project-file download/import as
the portable backup. A multi-project gallery, account, cloud sync, installable offline
app and persistence of the separate Paint Mode prototype are follow-up work.

Show **Saving…**, **Saved on this device**, or **Couldn’t save — download a project file**.
Only show Saved after the database transaction completes. Explain that local projects
belong to this browser and site; clearing site data can remove them.

## What already exists, and what needs repair

- `src/utils/sessionStorage.ts` writes one `pbn_session` entry to localStorage and
  imports/exports JSON. Its `autoSave` method is invoked by manual save buttons; there
  is no app startup caller of `sessionStorage.load()`.
- JSON serialization loses the `Int32Array` type of `PipelineResult.labelMap`. Import
  casts parsed JSON without reconstructing the array or validating the full project.
- Import logic is repeated in `ImageUploader.tsx`, `ExportPanel.tsx` and the older
  `SessionControls.tsx`. It does not consistently restore `sourceImage`, pipeline
  completion state, label overrides, history or palette order. `startPipeline` requires
  `sourceImage`, so showing a loaded image is not sufficient for continued editing.
- `appStore.ts` already has undo/redo snapshots for generation, merge and split. These
  are not saved. Recoloring, palette ordering and number moves do not consistently
  create history checkpoints, and loading a new image does not clear all old history.
- Existing storage tests mostly check method presence and a few JSON fields. They do
  not establish that a restored project can merge, split, undo and export.

These findings come from current source inspection, not the report's live-site claims.

## 1. Establish one project format and restore path

Add `src/projects/types.ts`, `projectCodec.ts` and a store action such as
`restoreProject(project)`. Route browser resume and all file-import entry points through
the same validation and restoration code.

Persist:

- Schema version, project ID, revision, creation/update time and a small thumbnail.
- The original source image as a Blob, stored once per project. Keep the original
  dimensions and encoding so crop/rotation and future regeneration use the same input.
- Current settings, edited result (including typed label map), label overrides and
  palette ordering. Store current state separately from the history cursor because
  not every existing change creates a history entry.
- History checkpoints and cursor, including both undo and redo branches at save time.
- Useful editing preferences such as active panel and view mode. Restore zoom to fit
  initially; reset hover, drag and merge selections, worker progress and error notices.

Do not persist store functions, DOM image elements, worker instances or blob URLs.
Decode a fresh image and rebuild runtime image data when resuming. Reconstruct the
processed coordinate space using the settings associated with the saved result;
pending settings changes must not make split operations use a mismatched crop.

Restore atomically, after validation and image decoding. Set pipeline status to complete
when a result exists and idle for a pre-generation draft. Never regenerate just to
resume: that would discard manual work and can produce different automatic regions.
Cancel pending regeneration timers and reject stale worker completions using a project
generation token. Apply the same isolation when loading a different image or resetting.

Use a versioned JSON file format with explicit array encoding for portable exports.
Accept legacy unversioned files, including numeric-key objects produced by JSON-stringified
typed arrays. Merge missing settings with current defaults, validate dimensions, palette
indices and history pointers, and reject unsupported future versions without replacing
the open project. Legacy imports get a baseline history entry, not invented past edits.

## 2. Add transactional IndexedDB storage

Add a small async repository in `src/projects/projectRepository.ts` with load, save,
delete and migration operations. Use separate stores for project metadata/current state,
source assets and history checkpoints. Write related changes in one transaction; keep
the last committed project intact if the next transaction fails.

IndexedDB supports larger structured records and Blobs, with structured cloning that
preserves typed arrays. This fits the existing pipeline data better than JSON in
localStorage. See [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
and [structured cloning](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm).

Write only new or changed checkpoints, and reuse the source asset. A four-million-pixel
Int32 label map alone is about 16 MB; rewriting every historical result after every
change would be expensive. Make history snapshots immutable and share unchanged result
records for number-position or display-order edits.

Proposed initial history budget: up to 20 checkpoints, also bounded by an estimated
128 MiB of unique result data, subject to measurement on representative projects.
Always retain current state; keep a contiguous window around the cursor and disclose
when older undo steps have been dropped. Keep the same window in memory and on disk
so refresh does not unexpectedly change the available history. Do not silently discard
history in response to a quota failure; offer an explicit reduced-history retry or file
download while retaining the last successful save.

Migrate `pbn_session` only if no IndexedDB project exists. Validate and write it before
offering resume; retain the old entry until the new record has been read back successfully.
Never overwrite newer work with a legacy entry. Handle blocked database upgrades with
a clear close-other-tabs message rather than leaving initialization pending indefinitely.

Browser storage can be cleared or evicted, and private browsing has different retention.
Keep file backup available and handle unavailable storage without blocking generation.
See [browser storage retention and quotas](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria).

## 3. Autosave completed work and offer resume

Add `useProjectAutosave.ts`, a small save-status component and `ResumeProjectCard.tsx`.
Initialize the persistence coordinator once; clean up subscriptions during remounts.

- Save the initial image draft and completed generation/merge/split operations promptly.
  Coalesce rapid number moves, recoloring and settings adjustments after roughly one
  second of inactivity, with a maximum wait of five seconds.
- Track explicit durable revisions; do not save for mouse movement, worker progress,
  zoom changes or transient selections. Suspend writes during hydration.
- Keep the last completed template while a pipeline run is in flight. The store currently
  clears `result` at run start: this intermediate null must never replace the saved result.
  Record settings for the completed result separately from any pending draft settings.
- Serialize writes and recheck the revision after completion. An older async write must
  not turn the status to Saved while newer changes remain. Flush on explicit Save now;
  lifecycle events are best-effort, not the primary persistence mechanism.
- On startup, load only resume metadata/thumbnail first. Show Resume last project,
  last-saved time, Download backup and Delete saved project. Keep the ordinary uploader.
- If starting another image would replace a saved project, offer Download backup,
  Replace saved project or Cancel. Loading a new image must not destroy the previous
  persisted project until replacement has been chosen and the new draft commits.
- Returning to the home screen is distinct from deleting the saved project. Explicit
  deletion clears both new storage and the legacy entry so migration cannot resurrect it.
  Provide a Remember this project on this device toggle with a clear removal action.
- Prevent silent cross-tab overwrites: compare expected revision in the write transaction.
  On conflict, pause autosave and offer reload-latest or download-this-tab's version.

History work belongs in this stage: normalize checkpoint creation for completed region
edits, recoloring, palette order and committed number moves; preserve redo until a new
edit branches from it. Group a drag or slider gesture into one undo step.

Update the existing Export panel's save/import controls to use these operations. Remove
or redirect the unused legacy control so a second persistence implementation cannot drift.
Localize all new controls and states across the existing 22 locales. Update privacy copy
and the no-upload guide to describe automatic local retention and how to delete it.

## 4. Verify reliability and ship

Use meaningful storage and user-flow tests rather than extending the current method-
existence tests. A test-only IndexedDB implementation can cover repository transactions;
real-browser checks must cover persistence across reload/tab close and actual quota errors.

Required acceptance scenarios:

1. Generate, merge, split, recolor, reorder the palette and move a number; wait for Saved,
   reload and resume. The template and next SVG export match the saved state.
2. Undo and redo still work after resume. Saving while positioned in the middle of history
   preserves the redo branch; making a new edit then discards only that branch.
3. Resume a cropped/rotated project, then split and regenerate successfully. Source image,
   result dimensions and pixel coordinates remain consistent.
4. Reload during generation or a failed save and recover the last committed template.
   A stale operation from a previous project cannot overwrite a new or restored project.
5. Import a legacy browser save and JSON file, continue editing, and export/reimport the
   new format. Invalid files leave the existing editor and saved project untouched.
6. Exercise storage denial, quota exhaustion, transaction abort, blocked upgrades and two
   tabs editing the same project. Never show Saved after failure or silently overwrite work.
7. Delete the saved project and reload: no resume card and no legacy resurrection. Starting
   a new image never brings old regions into its undo history.
8. Test a representative 4 MP image with repeated edits on desktop and mobile browsers.
   Measure save latency, storage growth and input responsiveness before fixing the history
   budget. Check that image/project contents are never added to network requests.

Run production build, lint, relevant store/worker/export tests and indexability checks.
Manually cover Chrome/Edge, Firefox and Safari/iOS, including disabled/private storage.
Publish save/resume claims only after these acceptance checks pass. Recheck competitor
pricing before adding any paid-versus-free comparison; the supplied report is dated.

Optional measurement using existing analytics: resume offered, resume completed and save
failure category. Never include image data, project contents, filenames, titles or persistent
project identifiers. Review resume-to-edit/export usage over several weeks; traffic is too
small for a meaningful short A/B test.

## Delivery sequence and effort

Four reviewable changes: (1) shared format/restore and legacy compatibility, (2) IndexedDB
repository and migration, (3) autosave/history/resume UX, (4) browser verification and copy.
Estimated effort: 4–6 engineering days, including tests and localization review. History
size and correcting current import/restore behavior are the largest uncertainties.

The first implementation checkpoint should prove one edited template can survive a
save/load round trip and still split, undo and export. Build the automatic behavior and
resume interface on that verified foundation.
