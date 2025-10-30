You are acting as a release manager for AG Charts. Your task is to automate the process of generating release notes by following these steps precisely.

**Preamble: Variable Setup**

Before starting, you will be given a version number and a date. From the version number (e.g., `13.2.1`), you must derive:

-   `<major>` (e.g., `13`)
-   `<minor>` (e.g., `2`)
-   `<patch>` (e.g., `1`)
-   `<version>` (e.g., `13.2.1`)
-   `<filename>` (e.g., `13_2_1.md`)

You will use these variables throughout the process.

**Release Process:**

1.  **Gather Information:**

    -   Ask the user for the release **version number**.
    -   Ask the user for the release **date**.
    -   From the version number, determine if it's a **major** (`x.0.0`), **minor** (`x.y.0`), or **patch** (`x.y.z`) release.

2.  **Create Changelog File:**

    -   Create or overwrite the file at `packages/ag-charts-website/public/changelog/releases/<filename>`.
    -   The content of this file must be a single line: `#### <date> - Charts v<version>`.
    -   **Note on Date Format:** Use the format `29th October 2025`.
    -   For major releases only, add a second line 'For more details see [Upgrade to AG Charts <major>](https://www.ag-grid.com/charts/javascript/upgrade-to-ag-charts-<major>/)'.

3.  **Update `releaseVersionNotes.json`:**

    -   Read the file `packages/ag-charts-website/public/changelog/releaseVersionNotes.json`.
    -   Parse the JSON content into an array.
    -   For minor versions create a new JSON object: `{ "release version": "<version>", "markdown": "/releases/<major>_<minor>" }`.
    -   For major versions create a new JSON object: `{ "release version": "<version>", "markdown": "/releases/<major>" }`.
    -   Check if an object with the same `"release version"` already exists. If so, replace the existing entry. Otherwise, add the new object to the beginning of the array.
    -   Stringify the updated array and write it back to the file, overwriting the original content.

4.  **Update `ag-charts-versions.json`:**

    -   Read the file `packages/ag-charts-website/src/content/versions/ag-charts-versions.json`.
    -   Parse the JSON content into an array.
    -   Create a new JSON object based on the release type:
        -   **For a Patch Release:** `{ "version": "<version>", "date": "<date>" }`.
        -   **For a Major or Minor Release:**
            1.  Ask the user for 5 highlight points.
            2.  Create a JSON object with placeholders if the user doesn't provide them. The `notesPath` depends on the release type:
                -   For a **Major** release, the path is `./upgrade-to-ag-charts-<major>`.
                -   For a **Minor** release, the path is `./upgrade-to-ag-charts-<major>-<minor>`.
                ```json
                {
                    "version": "<version>",
                    "date": "<date>",
                    "highlights": [
                        { "text": "User highlight 1", "path": "./path-to-docs" },
                        { "text": "User highlight 2", "path": "./path-to-docs" },
                        { "text": "User highlight 3", "path": "./path-to-docs" },
                        { "text": "User highlight 4", "path": "./path-to-docs" },
                        { "text": "User highlight 5", "path": "./path-to-docs" }
                    ],
                    "notesPath": "./upgrade-to-ag-charts-<major>[-<minor>]"
                }
                ```
    -   **Note on Date Format:** Use the format `October 29th, 2025`.
    -   Check if an object with the same `"version"` already exists. If so, replace the existing entry. Otherwise, add the new object to the beginning of the array.
    -   Stringify the updated array and write it back to the file.

5.  **Create Upgrade Guide (for Major/Minor releases only):**

    -   Determine the folder path based on the release type:
        -   **For a Major release:** `packages/ag-charts-website/src/content/docs/upgrade-to-ag-charts-<major>`
        -   **For a Minor release:** `packages/ag-charts-website/src/content/docs/upgrade-to-ag-charts-<major>-<minor>`
    -   If it does not exist, create the folder and add an `index.mdoc` file into it.
    -   Copy the content from `packages/ag-charts-website/src/content/templates/migration.mdoc` into the `index.mdoc` in this folder. Replace the contents if there are any.
    -   In the new file, replace placeholders like `<major>` and `<minor>` with the correct values. Leave any comments unchanged.
    -   Replace <!-- XXXX --> in the blog link with the release version in the format <major>\_<minor> for minor releases and <major> for major releases.
    -   Ask the user if there are any deprecations and breaking changes to fill in the "TODO" sections. If yes, add a placeholder to each relevant section and adjust the comments accordingly
    -   For major versions, in the newly created file, replace the introductory text 'for feature highlights of what's new in this version.' with 'for feature highlights of what's new in this major version.'

6.  **Update Migration `index.mdoc` (for Major releases only):**

    -   Read the file `packages/ag-charts-website/src/content/docs/migration/index.mdoc`.
    -   Find the line containing the second `---` (the end of the frontmatter).
    -   Before inserting, check if `## Version <major>` already exists in the content. If not, insert the following text immediately after that line:

        ```mdoc
        ## Version <major>

        {% majorTable library="charts" major=<major> /%}
        ```

    -   Write the modified content back to the file.

7.  Run `nx format --all`
