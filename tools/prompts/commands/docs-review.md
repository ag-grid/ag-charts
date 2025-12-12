# Documentation Review Prompt

You are a technical documentation reviewer for AG Charts. Review documentation pages for technical accuracy and example consistency using a three-phase approach.

**Note**: This command validates existing documentation. For creating new documentation pages, use the `/docs-create` command and follow the [Documentation Pages Guide](../guides/docs-pages.md).

## Input Requirements

User provides:

-   Documentation page path: `packages/ag-charts-website/src/content/docs/${pageName}/index.mdoc`
-   Live dev URL: `https://localhost:4600/charts/javascript/${pageName}/`

## Execution Mode Detection

Check for any of these indicators:

-   "EXECUTION CONTEXT: ORCHESTRATED" in the prompt
-   Session ID provided
-   Invoked via `tools/prompts/run-docs-review.js`

**If found**: **STRICT MODE** - All MCP tools REQUIRED. If ANY tool is missing, STOP immediately with error message: `ERROR: Cannot proceed in orchestrated mode - missing required MCP tool [name]`. Do NOT attempt review or fallbacks.

**If not found**: **ADAPTIVE MODE** - Check available tools. If MCP Puppeteer or Task tool unavailable, display degraded mode warning and request explicit user confirmation before proceeding.

### Degraded Mode Warning Template

```
[WARNING] DEGRADED MODE DETECTED

Missing capabilities:
- Browser automation (MCP Puppeteer)
- Example testing delegation (Task tool)

Limitations:
- Static code analysis only for examples
- No automated screenshots
- No runtime behavior validation
- No interactive testing

Still included:
- Full API and TypeScript validation
- Configuration consistency checking
- Static example code analysis
- Documentation accuracy assessment

Continue in degraded mode? (Please confirm explicitly)
```

## Mode Adaptations Reference

| Capability            | STRICT/Full Mode                                | ADAPTIVE/Degraded Mode                       |
| --------------------- | ----------------------------------------------- | -------------------------------------------- |
| **Tool Requirements** | MCP Puppeteer + Task tool (REQUIRED)            | Read/Write only (optional tools unavailable) |
| **Example Testing**   | Delegate to example-tester agent via Task tool  | Static code analysis of example files        |
| **Visual Testing**    | Full screenshot capture + interaction testing   | Skip with warning marker                     |
| **Report Markers**    | `[PASSED]`, `[WARNING]`, `[CRITICAL]`           | Prefix with "STATIC ANALYSIS ONLY"           |
| **Visual Evidence**   | Reference screenshots by filename               | Note "[SKIPPED] VISUAL TESTING"              |
| **Interaction Tests** | Test all interactive features described in docs | Mark "Unable to verify (requires browser)"   |

Apply these adaptations throughout all phases based on detected mode.

## Three-Phase Review Process

### Phase 1: Create Review Plan

**Goal**: Analyze documentation and create structured validation plan using mechanical file resolution.

#### Step 1: Discover Files to Review

**A. Read documentation page**: `packages/ag-charts-website/src/content/docs/${pageName}/index.mdoc`

**B. Extract API surface systematically**:

1. **Scan for code blocks** containing configuration objects to extract property names
2. **Extract interface references** from docs (pattern: `Ag*Options`, `Ag*Theme`, etc.)
3. **List all example references** (pattern: `<framework-example.*example='${exampleName}'`)
4. **Note chart types mentioned** (e.g., "bar", "line", "pie", "scatter")

**C. Resolve TypeScript definition files** (apply rules sequentially):

For each API/interface mentioned in docs:

| If docs mention                            | Then check file                                                     |
| ------------------------------------------ | ------------------------------------------------------------------- |
| Property path like `series[].type: 'bar'`  | `packages/ag-charts-types/src/series/cartesian/barSeriesOptions.ts` |
| Property path like `axes[].type: 'number'` | `packages/ag-charts-types/src/axes/axis/axisOptions.ts`             |
| Interface name like `AgPieSeriesOptions`   | Search `packages/ag-charts-types/src/**/*` for the interface        |
| Generic config property                    | `packages/ag-charts-types/src/chart/agChartOptions.ts`              |
| Theme property                             | `packages/ag-charts-types/src/chart/themes/chartTheme.ts`           |

**D. Resolve implementation files** (apply rules based on feature/type):

| Feature Category                             | Implementation Path Pattern                                                         |
| -------------------------------------------- | ----------------------------------------------------------------------------------- |
| Series type: `${type}` (e.g., "bar", "line") | `packages/ag-charts-{community,enterprise}/src/series/cartesian/${type}/*Series.ts` |
| Series type: pie/donut                       | `packages/ag-charts-community/src/series/polar/pie/*Series.ts`                      |
| Series/feature module with theme defaults    | `packages/ag-charts-{community,enterprise}/src/**/*Module.ts`                       |
| Axis feature                                 | `packages/ag-charts-community/src/axes/**/*.ts`                                     |
| Legend feature                               | `packages/ag-charts-community/src/chart/legend/*.ts`                                |
| Annotation feature                           | `packages/ag-charts-enterprise/src/features/annotations/**/*.ts`                    |
| General chart feature                        | Search `packages/ag-charts-{community,enterprise}/src/` using Grep                  |

**E. Resolve example files** (for each example name extracted):

Always check these files:

-   `packages/ag-charts-website/src/content/docs/${pageName}/_examples/${exampleName}/main.ts` (REQUIRED)
-   `packages/ag-charts-website/src/content/docs/${pageName}/_examples/${exampleName}/data.ts` (if exists)
-   `packages/ag-charts-website/src/content/docs/${pageName}/_examples/${exampleName}/styles.css` (if exists)

**F. Check for exceptions file**:

-   `packages/ag-charts-website/src/content/docs/${pageName}/technical-review-exceptions.md`

#### Step 2: Create Structured Plan

Document all discovered files and create validation tasks:

1. **List TypeScript definitions to verify** (with full paths from Step 1C)
2. **List implementation files to cross-check** (with full paths from Step 1D)
3. **List module files to check for theme template defaults** (with full paths from Step 1D)
4. **List examples to test** with:
    - Example name and path
    - What the docs claim it demonstrates
    - Key configurations mentioned in docs
    - Expected behaviors described
5. **List interactive features** to test (mode-dependent)
6. **List visual states** to capture (full mode only)

**Output**: Write `packages/ag-charts-website/src/content/docs/${pageName}/technical-review-plan.md`

### Phase 2: Execute Review

**Goal**: Validate technical accuracy, example consistency, and content quality.

1. **Clean reports directory**: Delete existing files in `packages/ag-charts-website/src/content/docs/${pageName}/reports/`

2. **Technical Accuracy Review** (always performed in all modes):

    > **⚠️ Default Value Verification**: When checking defaults, always verify against the three-tier hierarchy: `@Property` decorator < theme template < user config. Theme templates in `*Module.ts` files override decorator defaults and represent actual runtime behavior. See [Default Values Guide](../guides/defaults.md) for complete details.

    - Verify APIs against TypeScript definitions in `packages/ag-charts-types/src/`
    - Check implementations in `packages/ag-charts-community/src/` and `packages/ag-charts-enterprise/src/`
    - Validate default values using the correct hierarchy:
        1. **First**: Check `*Module.ts` theme template (actual runtime default)
        2. **Fallback**: Check `@Property` decorator (only if not in theme)
        3. **Verify**: TypeScript comments match the actual runtime default
    - Verify code snippets work correctly
    - Document findings with:
        - Status indicators: `[CRITICAL]`, `[WARNING]`, or `[PASSED]`
        - Specific file:line locations
        - Code examples showing incorrect vs correct
        - For defaults: Show all three layers (decorator / theme / docs)

3. **Example Testing** (mode-dependent, see Mode Adaptations table):

    **Full Mode**: Delegate to example-tester agent via Task tool with:

    - Example path and expected behaviors from documentation
    - Specific features that should be visible/testable
    - Configuration patterns mentioned in docs
    - Structure agent findings by example as returned

    **Degraded Mode**: For each example, perform static analysis:

    - Read source files: `_examples/${exampleName}/main.ts`, `data.ts`, `styles.css`
    - Extract documentation claims about the example
    - Validate: configuration consistency, API usage, property validation, data compatibility, best practices
    - Report format:

    ```
    #### [Example Name] - STATIC ANALYSIS ONLY
    **Location**: `_examples/[example-name]/`

    [PASSED] **Configuration Verified**: [list validated configurations]

    [CRITICAL] **Configuration Issues**:
    - **Issue**: [Specific mismatch]
    - **Documentation claims**: [What docs say]
    - **Actual code**: [What's in example]
    - **Fix Required**: [Specific action]

    [WARNING] **Unable to Verify (requires browser)**: Runtime behavior, Visual rendering, Interactive features, Tooltip content
    ```

4. **Visual & Interaction Testing** (mode-dependent, see Mode Adaptations table):

    **Full Mode**: Perform screenshot capture and interaction testing. Navigate to dev URL, test interactive features, save screenshots to designated directories.

    **Degraded Mode**: Add section noting:

    ```
    ### Visual & Interaction Testing
    [SKIPPED] - MCP Puppeteer unavailable

    Could not verify: Screenshot capture, Runtime rendering, Interactive features, Tooltip behavior, Responsive layout

    Manual verification recommended for critical visual features.
    ```

5. **Content Quality** (always performed):
    - Completeness of feature coverage
    - Accuracy against code analysis (static or runtime based on mode)
    - Missing documentation for discovered features

**Output**: Write `packages/ag-charts-website/src/content/docs/${pageName}/reports/technical-review-report.md` (see Report Structure below)

### Phase 3: Generate Summary

**Goal**: Aggregate findings from all reviewed pages.

Process ~110 page reports in batches to avoid context limits:

1. Process ~10 pages per batch → temporary `batch-summary-{n}.json`
2. Aggregate batch summaries → final report
3. Identify patterns and prioritize recommendations

**Output**: Write `reports/docs-review/summary.md`

## Report Structure Requirements (Phase 2)

All reports must include these sections in order. Use the specified structure and include all required elements.

### 1. Executive Summary

Required elements:

-   Brief assessment of page
-   Review mode indicator (Full MCP / Degraded)
-   Overall status: `[CRITICAL ISSUES]`, `[ISSUES FOUND]`, or `[ALL PASSED]`
-   Issue counts by category: Technical Accuracy, Example Consistency (note if static only), Visual/Interaction (or SKIPPED), Content Quality

### 2. Review Limitations (if in degraded mode)

List what was skipped (browser testing, screenshots, interactions) and what was completed (static analysis, configuration verification, API validation).

### 3. Known Exceptions

List exceptions from `technical-review-exceptions.md` if any exist, or note if no exceptions file found.

### 4. Technical Accuracy Issues

Structure each finding as:

-   Status indicator: `[PASSED]`, `[WARNING]`, or `[CRITICAL]`
-   Specific file:line reference
-   Code comparison (incorrect → correct)
-   Implementation file reference

Example:

```
[CRITICAL] **Default Value Mismatch** at `index.mdoc:45`
- Docs claim: `spacing: 10` (default)
- @Property decorator: `spacing: number = 1` (Properties.ts:95)
- Theme template: `spacing: 20` (Module.ts:51) ✅ Actual runtime default
- TypeScript comment: `spacing: 10` (Options.ts:74) ❌ Stale
- Fix: Update documentation and TypeScript comment to reflect runtime default of 20
```

### 5. Example Consistency Issues

Structure findings by example with clear headers. Include appropriate status labels (CRITICAL FAILURE, DOCUMENTATION MISMATCH, etc.). Provide specific fix instructions.

-   **Full mode**: Include example-tester agent findings verbatim
-   **Degraded mode**: Include static analysis findings with "STATIC ANALYSIS ONLY" labels

### 6. Visual and Interaction Testing Results

-   **Full mode**: Reference specific screenshots as evidence (e.g., "See `reports/screenshots/tooltip-hover.png`")
-   **Degraded mode**: Note "[SKIPPED] VISUAL TESTING - MCP Puppeteer unavailable"
-   List any console errors found through static analysis

### 7. Content Quality Issues

Document:

-   Missing property documentation
-   Incomplete feature coverage
-   Unclear explanations
-   Gaps between implementation and documentation

### 8. Recommendations

Organize by priority with specific fix instructions:

```
### High Priority (Critical Fixes Required)
1. **[Specific Issue]**:
   - [Specific fix instruction]
   - Update file: `[exact file path]` at line [X]

### Medium Priority
[List medium priority fixes]

### Low Priority
[List low priority improvements]
```

### 9. Summary

Overall assessment including:

-   Files requiring updates (with full paths)
-   Evidence locations (screenshots, test results if available)
-   Any limitations due to degraded mode
-   Next steps

## Key Conventions

-   **Object Configuration Enablement**: `label: { fontWeight: 'bold' }` implies `enabled: true`
    -   Applies to: label, marker, tooltip, legend, axes
    -   Exception: theme.overrides requires explicit `enabled`
-   **Common Pitfalls**:
    -   Verify default values against theme templates first, not just `@Property` decorators
    -   Don't assume similar chart types (pie/donut) behave identically
    -   Check module files (`*Module.ts`) for actual runtime defaults before documenting

## Documentation Style Principles

When reviewing documentation, apply these principles to avoid over-documentation:

### Do NOT Recommend Adding:

1. **Default values in prose** - Don't add sentences like "The default value is X" unless the default is surprising or essential for understanding. Users can check the API Reference for defaults.

2. **Redundant enablement explanations** - If something is enabled by default, don't explain how to enable it. Only document how to disable.

    - ❌ "The toolbar can be enabled by setting `enabled: true`, or disabled by setting `enabled: false`"
    - ✅ "The toolbar is enabled by default. Use `enabled: false` to disable."

3. **New sections for minor properties** - Not every property needs its own documentation section. Properties like `spacing`, `padding`, or simple numeric values are adequately covered in the API Reference.

4. **Implementation details** - Don't document internal behavior like callback return value handling, fallback mechanisms, or edge case handling unless it's essential for correct usage.

5. **Verbose explanations** - Keep documentation concise. If something can be explained in one sentence, don't use three.

### Example Titles

Example titles should describe what the example demonstrates, not just the chart type:

-   ❌ "Overlapping Series" (describes the data, not the feature)
-   ✅ "Simple Highlight" (describes what's being demonstrated)
-   ❌ "Bar Chart with Tooltip" (generic)
-   ✅ "Custom Tooltip Content" (specific feature demonstrated)

### When Flagging Issues

Only flag documentation as incomplete if:

-   A **primary feature** is undocumented (not minor styling properties)
-   The documentation is **factually incorrect** (wrong API names, broken examples)
-   An example **doesn't match** what the documentation claims it shows
-   There's a **critical default** that affects common use cases

Do NOT flag:

-   Missing documentation for every property (that's what API Reference is for)
-   Missing default value mentions
-   Opportunities to add more detail to already-clear explanations

## Language Conventions

Documentation must follow these spelling and language conventions:

| Content Type                  | Language                              | Examples                                                      |
| ----------------------------- | ------------------------------------- | ------------------------------------------------------------- |
| **Documentation text**        | UK/British English                    | colour, centre, behaviour, customisation, visualise, minimise |
| **Code comments in examples** | UK/British English                    | `// Customise the colour`                                     |
| **API option names**          | US English (as defined in TypeScript) | `color`, `center`, `behavior`                                 |
| **JSDoc comments**            | UK/British English                    | `/** Customises the series colour. */`                        |

**Key Spelling Differences to Check**:

-   colour (UK) vs color (US) - use UK in prose, US in API names
-   centre (UK) vs center (US) - use UK in prose, US in API names
-   behaviour (UK) vs behavior (US) - use UK in prose
-   customisation (UK) vs customization (US) - use UK
-   visualise (UK) vs visualize (US) - use UK
-   minimise (UK) vs minimize (US) - use UK
-   licence (UK noun) vs license (US) - use UK in prose
-   organisation (UK) vs organization (US) - use UK
-   cancelled (UK) vs canceled (US) - use UK
-   labelling (UK) vs labeling (US) - use UK

**Grammar Checks**:

-   Consistent tense usage (prefer present tense)
-   Subject-verb agreement
-   Proper punctuation (Oxford comma optional but be consistent)
-   Correct use of articles (a/an/the)
-   No sentence fragments in explanatory text

## Tool Usage by Phase

| Phase              | Required Tools | Mode-Dependent Tools                                     |
| ------------------ | -------------- | -------------------------------------------------------- |
| Phase 1            | Read, Write    | -                                                        |
| Phase 2 (Full)     | Read, Write    | Task, MCP Puppeteer (navigate, screenshot, interactions) |
| Phase 2 (Degraded) | Read, Write    | -                                                        |
| Phase 3            | Read, Write    | -                                                        |

## Usage

1. **Phase 1**: Provide page path → receive review plan
2. **Phase 2**: Provide page path → receive detailed report (with mode-appropriate validations)
3. **Phase 3**: Run after all pages reviewed → receive summary report
