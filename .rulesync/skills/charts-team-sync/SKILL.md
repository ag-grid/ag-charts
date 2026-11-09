---
targets: ['*']
name: charts-team-sync
description: 'Build the skeleton Google Slides deck for a Charts Team Sync meeting, for the team to populate: release highlights grouped by presenter, an agenda with Slack avatars and version badges, and the Roadmap and Download Stats slots. Covers the most recent release (bX.Y.Z branch) unless told otherwise. Use when asked to prepare, create or set up a Charts Sync or Team Sync deck or slides, or on /charts-team-sync [date] [versions].'
---

# Charts Team Sync

Builds `Charts Team Sync - YYYY-MM-DD` from the most recent previous deck, as a private skeleton in the deck owner's My
Drive. Presenters fill in their slides after the owner has reviewed it and moved it to the shared folder.

This repository is public. Do not add Drive IDs, email addresses, spreadsheet links or other internal details to this
skill; everything below is looked up when the skill runs.

## Arguments

`/charts-team-sync [date] [versions]`

-   `date`: the meeting date. Past meetings have no fixed weekday, so ask if it isn't given.
-   `versions`: the Charts releases to cover, such as `14.2.0 14.3.0`. Default: the most recent release.

## Before you start

Load `anthropic-skills:google-workspace` and read its `references/slides.md`. Check that the Google Drive, Google Slides,
Atlassian and Slack connectors are available. If Google Slides is missing, say so and stop: connectors added during a
session only load in a new one.

## 1. Find the scope

The default release is the first entry in the website's version list:

```sh
git fetch origin --quiet
git show origin/latest:packages/ag-charts-website/src/content/versions/ag-charts-versions.json
```

Each entry has `version`, `date`, `highlights` and `notesPath`. Confirm that `origin/b<version>` exists. Don't take the
highest `b*` branch instead, because a release branch exists before its release ships.

If the first entry is a patch with no highlights, ask whether to cover the minor release before it.

Compare the release dates with the date in the previous deck's title (step 3). If an earlier release also shipped after
that deck and isn't in scope, say so when you propose the contents: that release has no other sync to cover it.

## 2. Gather the content

For each release in scope, use these sources, in this order:

1. **`highlights` in the version list:** every highlight gets a place in the deck, and its `path` gives the docs link.
2. **The upgrade page** named by `notesPath`, under `packages/ag-charts-website/src/content/docs/`.
3. **JIRA:** project `AG`, component `Charts`, excluding bugs and sub-tasks, `statusCategory = Done`. The `fixVersion`
   uses the Grid version number, not the Charts one (Charts 14.3.0 is `36.3.0`), so match the release by its date.
4. **Commits,** to fill gaps and attribute work:

    ```sh
    git log "$(git merge-base origin/b<previous> origin/b<version>)..$(git merge-base origin/b<version> origin/latest)" \
        --no-merges --format='%an|%s' -- packages/
    ```

Group the work into topics of about 3 to 5 short bullets, each becoming one slide. Check every option name you quote
against `ag-charts-types`, and every docs link with `curl -sL -o /dev/null -w '%{http_code}'`. Omit what you can't verify.

For the Releases slide, take the next unreleased `AG` version's release date from JIRA. Code freeze is about 3 working days
before it. Features come from that version's epics and stories; the owner tweaks this slide themselves.

## 3. Propose the contents and wait

Find the template: `title contains 'Charts Team Sync'` in Drive `search_files`, taking the latest date in a title and
ignoring `Appendix` decks. Note its parent folder as the shared folder.

Show a table of slide range, presenter and content, in this order, so each presenter is handed over to once:

1. The owner: title, agenda, Releases.
2. Each other team member in turn, with all of their topics together across releases.
3. The owner: their own features.
4. The Roadmap presenter: their features, then Roadmap.
5. The owner: Download Stats and wrap-up.

JIRA assignees and commit counts only suggest a presenter, and they can be wrong. List your presenter choices and any
inferred dates as things to check. **Don't build until the owner has approved the contents.**

## 4. Build outside the shared folder

The shared folder's members inherit edit access to anything in it, so never build there.

1. Copy the template with Drive `copy_file`, using `parentId: "root"` and the new title.
2. Read the copy's `layouts(objectId,layoutProperties.name)` and `slides.objectId`, and note the object IDs of the
   `TITLE` and `TITLE_AND_BODY` layouts and the Roadmap and Download Stats slides.
3. Keep the Roadmap and Download Stats slides. Their speaker notes hold the links for repopulating them, which only
   survive by staying on the slide. Empty them: delete images and shapes other than the title and body placeholders, and
   delete any body text. Update the Roadmap title's years if they have changed.
4. Look up each presenter with `slack_search_users`. Check that their `Profile Pic` URL returns 200 without credentials,
   because Google fetches it directly, and that the image is square.
5. Write the spec below to a new temporary directory and generate the batches:

    ```sh
    node .rulesync/skills/charts-team-sync/scripts/deck-requests.mjs <dir>/spec.json <dir>/batches
    ```

6. Send each `batch-N.json` with `update_presentation`, in order, reading the deck for a fresh `revisionId` before each
   one. Send every request in the file unchanged. Don't send a partial batch or adjust elements by hand with an absolute
   `updatePageElementTransform`: created shapes store a different base size, so scale 1 resizes them.

```json
{
    "id": "d20261110",
    "layouts": { "title": "<TITLE layout ID>", "body": "<TITLE_AND_BODY layout ID>" },
    "deleteSlideIds": ["<every slide except Roadmap and Download Stats>"],
    "subtitle": "Tuesday 10th November",
    "agenda": [
        { "presenter": "Name", "avatarUrl": "<Profile Pic URL>", "label": "Releases: Upcoming Major Release" },
        { "presenter": "Name", "avatarUrl": "<Profile Pic URL>", "label": "Theme Builder", "version": "14.3.0" }
    ],
    "slides": [
        {
            "title": "Releases",
            "size": 20,
            "paragraphs": [
                { "text": "Released since last sync: 14.3.0 (4th November)" },
                { "text": "Code freeze ~4th December for 15.0.0 (~3.5 weeks)" },
                { "text": "Features:" },
                { "text": "[Name to populate]", "level": 1 }
            ]
        },
        {
            "title": "Release Highlights: 14.3.0",
            "paragraphs": [
                { "text": "Volume Profile + HLC Series [Name]", "heading": true },
                { "text": "New HLC series" },
                { "text": "HLC docs", "url": "https://www.ag-grid.com/charts/javascript/hlc-series/" },
                { "text": "[Name to populate]" }
            ]
        }
    ]
}
```

-   `id` prefixes every object ID, so it must not match the template's. Use `d` and the meeting date.
-   `agenda` is a flat list in slide order, without presenter grouping. Include the Roadmap and Download Stats rows, which
    have no `version`. With two releases in scope, the newest gets a solid badge and the older a light one.
-   `slides` holds the Releases and highlights slides in running order, ending with the Roadmap presenter's features. The
    kept Roadmap and Download Stats slides then follow them. End every topic with a `[Name to populate]` line.

## 5. Verify

1. Read the deck back: slide order, titles, bullets and links match the approved contents.
2. Render each kind of slide with `read_slide_page_thumbnail` at `LARGE` and look at it: title, agenda, Releases, one
   highlights slide, Roadmap. Check that no agenda label wraps.
3. Read the Roadmap and Download Stats `notesPage` and confirm that the links are still there.
4. Run Drive `get_file_permissions` on the deck: the owner should be the only entry.

## 6. Hand over

Link the deck and report what you checked, what you inferred, and what is left to populate.

Check the shared folder with `get_file_permissions` and name any presenter who isn't a member. **Don't share the deck, add
anyone to the folder or move the deck until the owner says so.** Moving the deck with Drive `update_file` and `parentId`
keeps its link. If a permission check blocks the move, ask the owner to drag it in Drive; don't copy and trash it, which
changes the link.
