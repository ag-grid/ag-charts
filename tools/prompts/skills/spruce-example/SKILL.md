---
name: Spruce Example
description: Improve AG Charts gallery examples to professional quality standards with theme compatibility and PREVis evaluation. Use when creating or refining gallery examples, when user asks to "spruce up" an example, or when improving example quality.
---

# Spruce Example

This skill guides you through improving AG Charts gallery examples using a structured workflow that ensures professional quality, theme compatibility, and measurable visual quality improvements.

## When to Use This Skill

-   Creating a new gallery example
-   Improving an existing gallery example
-   User requests to "spruce up", "improve", or "refine" an example
-   Example needs better data visualization practices
-   Example needs theme compatibility (light/dark mode)

## Prerequisites

-   Development server must be running (`yarn nx dev`)
-   Puppeteer available for visual analysis
-   Access to previs-evaluator agent for PREVis evaluation

## Workflow

### Step 0: Load Required Documentation

**Read these files FIRST** (located in `tools/prompts/commands/spruce-example/`):

1. `core-rules.md` - Mandatory rules for theme compatibility
2. `visual-analysis.md` - PREVis evaluation workflow
3. `troubleshooting.md` - Quick fixes for common issues
4. _(Optional)_ `tools/prompts/guides/examples.md` - Framework compatibility patterns

### Step 1: Baseline Visual Analysis

**Complete ALL before proceeding:**

1. Navigate to `https://localhost:4600/charts/gallery/examples/[example-name]` with Puppeteer
2. Take initial screenshot (this will be visible in your conversation context)
3. Run PREVis evaluation via **previs-evaluator** agent:
    - Launch previs-evaluator (NOT data-viz-designer)
    - Explicitly state in the Task prompt: "Screenshot is already provided above, DO NOT navigate or capture new screenshots"
    - The previs-evaluator lacks Puppeteer tools, preventing redundant screenshot capture
4. Record baseline PREVis score
5. Document identified issues

**🛑 CRITICAL**: Stop if Puppeteer fails - do not proceed with code-only analysis.

### Step 2: Load Feature Modules

Based on PREVis issues identified, load **ONLY relevant** modules from `tools/prompts/commands/spruce-example/features/`:

_(All paths are relative to repository root: `tools/prompts/commands/spruce-example/features/[module].md`)_

| Issue Type                                                 | Load Module          |
| ---------------------------------------------------------- | -------------------- |
| Tooltip issues (poor comparison, missing tooltips)         | `tooltips.md`        |
| Visual hierarchy (flat appearance, hard to track)          | `axes.md`            |
| Value-based differentiation (no thresholds, unclear zones) | `segmentation.md`    |
| Data readability (values unclear, overlapping labels)      | `data-labels.md`     |
| Legend problems (obscures data, too much space)            | `legends.md`         |
| Missing context (no baseline/target, no annotations)       | `reference-lines.md` |
| Advanced needs (maps, Sankey, gauges)                      | `enterprise.md`      |
| Styling enhancements (varied emphasis)                     | `recent-features.md` |
| Code quality (repetitive config)                           | `theme-overrides.md` |

### Step 3: Implementation

**Verify BEFORE making changes:**

-   ✅ NO hardcoded colors (hex, rgb, named colors)
-   ✅ NO font properties (fontSize, fontWeight, fontFamily, fontStyle)
-   ✅ NO styles.css or CSS files
-   ✅ Using specific chart type (e.g., `AgCartesianChartOptions`, not `AgChartOptions`)
-   ✅ All axes have `type` specified

**Framework Compatibility (CRITICAL for gallery examples):**

-   ✅ All examples MUST work across all frameworks (vanilla, React, Angular, Vue)
-   ✅ NO `@ag-skip-fws` directive for examples (only for benchmarks/test pages)
-   ✅ Follow framework-compatible patterns from `tools/prompts/guides/examples.md`
-   ✅ Use simple, declarative patterns: top-level options, chart instance, simple event handlers

**Apply improvements:**

-   Focus on structural enhancements (tooltips, bands, formatters)
-   Let theme handle ALL visual styling
-   Use `highlight.*` properties (not deprecated `highlightStyle`)
-   Add `heading` to all tooltip configurations
-   **Minimize footnotes** - only add if absolutely essential (footnotes reduce visualization space)

### Step 4: Validation (MANDATORY)

**Run these commands IN ORDER:**

1. **Generate example:**

    ```bash
    nx run ag-charts-website-gallery_[example-name]_main.ts:generate
    ```

2. **🚨 CRITICAL - Validate example:**

    ```bash
    nx run ag-charts-website-gallery_[example-name]_main.ts:typecheck
    ```

    **If this fails → REVERT ALL CHANGES**

3. **Visual verification:**

    - Take final screenshot with Puppeteer (it will be visible in your conversation)
    - Run final PREVis evaluation via **previs-evaluator** agent (following handoff pattern from Step 1)
    - Record final PREVis score
    - **Score MUST NOT decrease** (if decreased → REVERT)

4. **Generate thumbnail:**
    ```bash
    nx generate-thumbnails ag-charts-website
    ```

**📝 Documentation Update:**

After completing validation, if this example has an adjacent `index.mdoc` documentation page:

-   Update the documentation to reflect any structural or configuration changes
-   Ensure code snippets in docs match the improved example patterns
-   See `tools/prompts/guides/docs-pages.md` for documentation standards
-   Consider using the `spruce-docs` skill for documentation improvements

## Completion Checklist

Cannot mark complete until **ALL** checked:

-   [ ] PREVis score maintained or improved
-   [ ] NO hardcoded colors or fonts in code
-   [ ] Footnotes minimized (only essential ones kept)
-   [ ] `yarn nx run ag-charts-website-gallery_[example-name]_main.ts:typecheck` PASSED
-   [ ] Thumbnails generated successfully
-   [ ] Works in both light and dark themes

## Critical Rules

1. **Theme compatibility is paramount** - When in doubt, remove styling and let the theme handle it
2. **Always run visual validation** - PREVis score must not decrease
3. **TypeScript must compile** - If typecheck fails, revert all changes immediately
4. **Zero tolerance for hardcoded styling** - No colors, fonts, or CSS files allowed

## Failure Handling

If validation fails, check `tools/prompts/commands/spruce-example/troubleshooting.md`, then:

-   **PREVis score decreased** → Revert all changes immediately
-   **Typecheck failed** → Check axes[].type, remove colors/fonts, or revert
-   **TypeScript errors** → Use specific chart types (see troubleshooting.md)
-   **Thumbnail generation failed** → Check for runtime errors
-   **Dark mode broken** → Search for hardcoded colors and remove them

## Example Path Mappings

Gallery examples:

-   **Repo path**: `packages/ag-charts-website/src/content/gallery/_examples/${exampleName}/`
-   **Dev server**: `https://localhost:4600/charts/gallery/examples/${exampleName}`

## Related Documentation

-   Main workflow command: `tools/prompts/commands/spruce-example.md`
-   Examples guide: `tools/prompts/guides/examples.md`
-   Framework patterns guide: `tools/prompts/guides/examples-framework-patterns.md`
-   Documentation pages guide: `tools/prompts/guides/docs-pages.md`
-   Testing guide: `tools/prompts/guides/testing.md`
-   Spruce Docs skill: `tools/prompts/skills/spruce-docs/SKILL.md` (for documentation improvements)

## Example Usage

When the user says:

-   "Spruce up the sales-data example"
-   "Improve the bar-chart gallery example"
-   "Make this example look more professional"

This skill will automatically activate and guide you through the structured workflow above.

---

**Remember**: This is a structured workflow - follow steps in order and don't skip validation!
