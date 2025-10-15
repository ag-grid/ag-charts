# Examples Guide

This guide covers working with examples in the AG Charts codebase, including guidelines, validation, and path mappings.

## Repo to Dev Server Paths

Example paths are mapped from repo paths:

-   `packages/ag-charts-website/src/content/gallery/_examples/${exampleName}/index.html` => `/charts/gallery/examples/${exampleName}`
-   `packages/ag-charts-website/src/content/docs/${pageName}/_examples/${exampleName}/index.html` => `/charts/vanilla/${pageName}/examples/${exampleName}`

## Example Guidelines

-   When adding examples, make sure to also update the Markdoc page relating to the example (index.mdoc adjacent to the enclosing `_examples/` folder).
-   Never add inline documentation to examples.
-   `-test` page examples are for internal testing and don't typically need much documentation.
-   Any other examples should be documented in the related `index.mdoc` file which should be a sibling of the enclosing parent folder `_examples`.
-   Examples have a `index.html` which is just a HTML snippet, not a full HTML document.
    -   Do not include <script> or other tags to load resources.
    -   `main.ts` is automatically included at runtime.
    -   Trivial example:
        ```html
        <div id="myChart"></div>
        ```
    -   Complex example:
        ```html
        <div class="controls-row">
            <button id="toggleBtn" onclick="toggleUpdates()">Start Updates</button>
            <select id="methodSelect" onchange="updateMethod(this.value)">
                <option value="updateDelta">updateDelta()</option>
                <option value="applyTransaction">applyTransaction()</option>
            </select>
            <span id="cpuUsage" style="margin-left: 10px">CPU: 0%</span>
        </div>
        <div id="myChart"></div>
        ```
-   Styles for examples should be put into an adjacent `styles.css` file which will automatically be included at runtime.
    -   Styles in `external/ag-website-shared/src/components/example-runner/styles/example-controls.css` are applied automatically, and should be favoured for presenting controls in examples.
-   Examples typically have a `data.ts` with a `getData()` function (for single data-set examples) which includes the dataset used by the example.
-   If a TData type is useful for the example, `data.ts` should also declare this.
-   For deeper architectural context, see the main AGENTS.md file for Documentation Resources.

## Example Validation + Building

-   **Gallery example** (`packages/ag-charts-website/src/content/gallery/_examples/${exampleName}/`)
    -   `nx run ag-charts-website-gallery_${exampleName}_main.ts:generate`
    -   `nx run ag-charts-website-gallery_${exampleName}_main.ts:typecheck`
-   **Docs example** (`packages/ag-charts-website/src/content/docs/${pageName}/_examples/${exampleName}/`)
    -   `nx run ag-charts-website-${pageName}_${exampleName}_main.ts:generate`
    -   `nx run ag-charts-website-${pageName}_${exampleName}_main.ts:typecheck`
-   **All examples**
    -   `nx validate-examples` (batch typecheck; much faster than individual targets)
-   **Ad-hoc or `-test` examples**
    -   Add `// @ag-skip-fws` to `main.ts` to skip framework variant generation

## Example Generation

-   Use `nx generate-examples ag-charts-website` to exercise example generation
-   Use `nx generate-thumbnails ag-charts-website` to exercise thumbnail generation

## Quick Playbook: Example-only Change

1. Edit the example files (`index.html`, `main.ts`, optional `styles.css`/`data.ts`)
2. Mirror updates in the sibling `index.mdoc` docs page
3. Run the relevant generation/typecheck command plus `nx validate-examples`
