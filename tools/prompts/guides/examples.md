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

## Reading External Examples (Plnkr, CodePen, etc.)

When implementing features or updating gallery examples based on external code examples (Plnkr, CodePen, etc.), follow this approach to extract code:

### Primary Method: Using Plnkr API

The most efficient way to extract Plnkr code is through their JSON API:

1. **Extract the Plunk ID from the URL**:

    - From `https://plnkr.co/edit/95LNJoaB0eYqh6DU?open=main.js` → ID is `95LNJoaB0eYqh6DU`
    - From `https://embed.plnkr.co/plunk/mWWciY` → ID is `mWWciY`

2. **Fetch the plunk data via API**:

    ```
    https://api.plnkr.co/plunks/{plunkId}
    ```

    This returns JSON with all file contents in the `files` object.

3. **Extract file contents programmatically**:

    - The response includes a `files` object with keys like `main.js`, `index.html`, `styles.css`, `data.ts`
    - Each file has a `content` property with the full source code
    - Raw files are also accessible at `//run.plnkr.co/plunks/{plunkId}/{filename}`

4. **Example API response structure**:
    ```json
    {
      "id": "95LNJoaB0eYqh6DU",
      "files": {
        "main.js": {
          "content": "const { AgCharts } = agCharts;\n...",
          "filename": "main.js",
          "raw_url": "//run.plnkr.co/plunks/95LNJoaB0eYqh6DU/main.js"
        },
        "index.html": { ... }
      },
      "description": "Example description",
      "tags": ["ag-grid", "ag-charts", "example"]
    }
    ```

### Practical Usage Examples

#### Using WebFetch tool (for AI agents):

```
WebFetch url="https://api.plnkr.co/plunks/95LNJoaB0eYqh6DU"
        prompt="Extract the main.js and data.ts file contents from this plunk"
```

#### Using fetch in code:

```typescript
async function extractPlunkCode(plunkId: string) {
    const response = await fetch(`https://api.plnkr.co/plunks/${plunkId}`);
    const data = await response.json();

    return {
        mainJs: data.files['main.js']?.content,
        dataTs: data.files['data.ts']?.content,
        indexHtml: data.files['index.html']?.content,
        styles: data.files['styles.css']?.content,
    };
}
```

#### Direct raw file access:

```
// For direct file access without API:
https://run.plnkr.co/plunks/95LNJoaB0eYqh6DU/main.js
https://run.plnkr.co/plunks/95LNJoaB0eYqh6DU/data.ts
```

### Fallback Method: Manual Extraction

If the API is unavailable or access fails, use this fallback approach:

1. **Navigate to the Plnkr URL** and take a screenshot to capture the editor view
2. **Use page text extraction** to parse the visible code:
    - Use browser automation (e.g., `puppeteer_evaluate`) to extract text content
    - Look for file content in the DOM or use `document.body.innerText`
3. **Copy the visible code manually from the screenshot** if extraction fails:
    - Read the line numbers and code visually from the screenshot
    - Type it into your implementation
4. **Verify against original example** by comparing:
    - Data structure (fields, types, values)
    - Formatter patterns (especially for multi-font text segments)
    - Label positioning (offset values, placement options)

### Key Pattern Example: Multi-Font Text Segments

When copying label formatter patterns, ensure you preserve:

```typescript
// Original Plnkr pattern:
calloutLabel: {
  formatter: ({ datum }) => [
    { text: datum.value.toString(), fontSize: 20, color: 'purple', fontWeight: 'bold' },
    { text: '\n' + datum.label, fontSize: 10, color: 'grey' },
  ],
}

// In your example, maintain this structure:
// - Array of text segment objects (not a string)
// - Each segment has: text, fontSize, color, fontWeight properties
// - Use '\n' for line breaks between segments
```

### Gallery Example Updates

When updating gallery examples from external references:

1. Identify what feature is being showcased (e.g., "multi-font labels")
2. Update relevant gallery example `main.ts` with the formatter pattern
3. If data source changes, update `data.ts` to match the reference example
4. Validate with `nx validate-examples` before committing
5. Test locally via `nx dev` to verify visual appearance

### Best Practices for External Code Extraction

1. **Always try the API first**: The JSON API is more reliable than manual extraction
2. **Preserve exact formatting**: When copying formatter functions, maintain the exact structure including array syntax for text segments
3. **Check for dependencies**: Some plunks may reference external libraries - verify these in `index.html`
4. **Validate data types**: Ensure numeric values aren't accidentally converted to strings
5. **Test the extracted code**: Always run the extracted code locally to verify it works as expected
6. **Document the source**: Include a comment with the original Plnkr URL for future reference

### Common Plnkr URL Patterns

-   Edit view: `https://plnkr.co/edit/{plunkId}`
-   Embed view: `https://embed.plnkr.co/plunk/{plunkId}`
-   Preview: `https://embed.plnkr.co/{plunkId}/preview`
-   API endpoint: `https://api.plnkr.co/plunks/{plunkId}`
-   Raw file: `https://run.plnkr.co/plunks/{plunkId}/{filename}`

## Quick Playbook: Example-only Change

1. Edit the example files (`index.html`, `main.ts`, optional `styles.css`/`data.ts`)
2. Mirror updates in the sibling `index.mdoc` docs page
3. Run the relevant generation/typecheck command plus `nx validate-examples`
