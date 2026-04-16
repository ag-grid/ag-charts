# Examples & Validation

## Example Requirements Format

List all required examples with specifications:

### Example Template

```markdown
### Example N: [example-name]

-   **Location**: `_examples/[example-name]/`
-   **Purpose**: [What this example demonstrates]
-   **Configuration**:
    -   [List key configuration]
-   **Data**: [Data requirements]
-   **Framework Compatible**: Yes
-   **Files Required**:
    -   `main.ts` - TypeScript implementation
    -   `index.html` - HTML body snippet (see structure below)
    -   `data.ts` - (Optional) Data file with `getData()` function
    -   `styles.css` - (Optional) Custom styles
```

## HTML Structure for Examples

The `index.html` file must be a **body snippet only**, not a complete HTML document:

**Simple Example (no controls):**

```html
<div id="myChart"></div>
```

**Example with Controls:**

```html
<div class="example-controls">
    <div class="controls-row">
        <button onclick="functionName()">Button Text</button>
        <select onchange="changeHandler(this.value)">
            <option value="option1">Option 1</option>
            <option value="option2">Option 2</option>
        </select>
        <span id="statusDisplay">Status: Ready</span>
    </div>
</div>
<div id="myChart"></div>
```

**Key Requirements:**

-   No `<!DOCTYPE>`, `<html>`, `<head>`, or `<body>` tags
-   No `<script>` tags (main.ts is automatically included)
-   Use `class="example-controls"` wrapper for control sections
-   Use `class="controls-row"` for the inner controls container
-   Chart container must be `<div id="myChart"></div>`
-   Event handlers use `onclick="functionName()"` pattern (top-level functions only)

The `example-controls.css` styles are automatically applied at runtime.

## TypeScript Function Scoping

For framework compatibility, utility functions need proper scoping:

```typescript
const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    // ... options
};

const chart = AgCharts.create(options);

let isRunning = false;

// Called from DOM (onclick="toggleUpdates()") - no comment needed
function toggleUpdates() {
    if (isRunning) {
        stopUpdates();
    } else {
        startUpdates();
    }
}

// Uses chart/state but NOT called from DOM - needs /** inScope */
/** inScope */
function startUpdates() {
    isRunning = true;
    // ... use chart
}

/** inScope */
function stopUpdates() {
    isRunning = false;
    // ... use chart
}
```

**Important:** Always initialize chart immediately with `const chart = AgCharts.create(options)` right after the options definition. Do NOT use deferred initialization.

**When to add `/** inScope */`:**

-   Function uses `chart` reference or module-level state variables
-   Function is NOT directly called from HTML event handlers
-   Function is called by other functions, timers, or intervals

**When NOT to add `/** inScope */`:**

-   Function is called directly from HTML (auto-hoisted)
-   Function doesn't use chart instance or state

## Navigation Entry

Provide JSON to add to `packages/ag-charts-website/src/content/docs-nav/nav.json`:

```json
{
    "title": "[Page Title]",
    "path": "[page-name]"
}
```

Specify which section it should be added to.

## Pre-Submission Validation Checklist

```markdown
### Structure

-   [ ] Frontmatter complete
-   [ ] Opening paragraph clear
-   [ ] Progressive disclosure followed
-   [ ] API Reference at end

### Technical Accuracy

-   [ ] Property names match TypeScript definitions
-   [ ] API interface names correct
-   [ ] Default values verified
-   [ ] Cross-references valid

### Examples

-   [ ] Examples to be created (see Example Requirements)
-   [ ] Example names valid
-   [ ] Examples framework-compatible

### Next Steps

1. Create examples (see Example Requirements document)
2. Add page to navigation (see Navigation Entry)
3. Run `yarn nx generate-examples ag-charts-website`
4. Run `yarn nx validate-examples`
5. Test in dev server with `yarn nx dev`
```

## Error Handling

### Missing API Interface

-   Search entire `packages/ag-charts-types/src/` directory
-   Check for alternative interface names
-   Verify with user if interface name is correct

### Unclear Page Type

-   Ask clarifying questions
-   Review similar features to determine best fit
-   Suggest most appropriate page type with explanation

### Insufficient Information

-   Request additional details from user
-   List specific information needed
-   Suggest researching similar features first
