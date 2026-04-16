---
targets: ['*']
name: spruce-example
description: Improve AG Charts gallery examples to professional quality with PREVis evaluation. Workflow skill that orchestrates visual analysis, feature loading, and validation.
context: fork
---

# Spruce Example

Structured workflow for improving AG Charts gallery examples. Orchestrates visual analysis (PREVis), feature loading, and validation using the `example` skill for chart construction fundamentals.

## When to Use This Skill

- Improving an existing gallery example
- User requests to "spruce up", "improve", or "refine" an example
- Example needs better data visualisation practices or theme compatibility

## Prerequisites

- Development server must be running (`yarn nx dev`)
- Puppeteer available for visual analysis
- Access to previs-evaluator agent for PREVis evaluation

## Workflow

### Step 0: Load Required Documentation

**Read these files FIRST:**

1. `.rulesync/skills/example/ag-charts/chart-construction.md` — Construction patterns
2. `.rulesync/skills/example/ag-charts/quality-rules.md` — Mandatory styling rules
3. `.rulesync/skills/spruce-example/visual-analysis.md` — PREVis evaluation workflow
4. `.rulesync/skills/spruce-example/troubleshooting.md` — Quick fixes for common issues
5. _(Optional)_ `.rulesync/rules/examples.md` — Framework compatibility patterns

### Step 1: Baseline Visual Analysis

**Complete ALL before proceeding:**

1. Navigate to `https://localhost:4600/charts/gallery/examples/[example-name]` with Puppeteer
2. Take initial screenshot (visible in your conversation context)
3. Run PREVis evaluation via **previs-evaluator** agent:
    - Launch previs-evaluator (NOT data-viz-designer)
    - Explicitly state: "Screenshot is already provided above, DO NOT navigate or capture new screenshots"
4. Record baseline PREVis score
5. Document identified issues

**CRITICAL**: Stop if Puppeteer fails — do not proceed with code-only analysis.

### Step 2: Load Feature Modules

Load **Tier 1** always, then additional tiers based on PREVis issues.

Feature modules are at `.rulesync/skills/example/ag-charts/features/`:

**Tier 1 — Essentials (always load):**

| File | Purpose |
|------|---------|
| `tooltips.md` | Tooltip patterns and shared tooltips |
| `theme-overrides.md` | Theme-aware styling patterns |

**Tier 2 — Enhancement (load based on PREVis issues):**

| Issue Type | Load Module |
|------------|-------------|
| Visual hierarchy (flat appearance, hard to track) | `axes.md` |
| Legend problems (obscures data, too much space) | `legends.md` |
| Data readability (values unclear, overlapping labels) | `data-labels.md` |

**Tier 3 — Advanced (load based on specific needs):**

| Issue Type | Load Module |
|------------|-------------|
| Advanced needs (maps, Sankey, gauges) | `enterprise.md` |
| Value-based differentiation (no thresholds) | `segmentation.md` |
| Missing context (no baseline/target) | `reference-lines.md` |
| Styling enhancements (varied emphasis) | `recent-features.md` |

### Step 3: Implementation

**Verify BEFORE making changes** (from quality-rules.md):

- NO hardcoded colours (hex, rgb, named colours)
- NO font properties (fontSize, fontWeight, fontFamily, fontStyle)
- NO styles.css or CSS files
- Using specific chart type (e.g., `AgCartesianChartOptions`, not `AgChartOptions`)
- All axes have `type` specified

**Framework Compatibility (CRITICAL for gallery examples):**

- ALL examples MUST work across all frameworks (vanilla, React, Angular, Vue)
- NO `@ag-skip-fws` directive for gallery examples
- Follow framework-compatible patterns from `.rulesync/rules/examples.md`

**Apply improvements:**

- Focus on structural enhancements (tooltips, bands, formatters)
- Let theme handle ALL visual styling
- Use `highlight.*` properties (not deprecated `highlightStyle`)
- Add `heading` to all tooltip configurations
- Minimise footnotes — only add if absolutely essential

### Step 4: Validation (MANDATORY)

Read `.rulesync/skills/example/ag-charts/validation.md` for full command reference, then run:

1. **Generate example:**
    ```bash
    nx run ag-charts-website-gallery_[example-name]_main.ts:generate
    ```

2. **Validate example (CRITICAL — do not skip):**
    ```bash
    nx run ag-charts-website-gallery_[example-name]_main.ts:typecheck
    ```
    **If this fails → REVERT ALL CHANGES**

3. **Visual verification:**
    - Take final screenshot with Puppeteer
    - Run final PREVis evaluation via **previs-evaluator** agent
    - **Score MUST NOT decrease** (if decreased → REVERT)

4. **Generate thumbnail:**
    ```bash
    nx generate-thumbnails ag-charts-website
    ```

**Documentation Update:** If this example has an adjacent `index.mdoc`, update it to reflect changes.

## Completion Checklist

- [ ] PREVis score maintained or improved
- [ ] NO hardcoded colours or fonts in code
- [ ] Footnotes minimised (only essential ones kept)
- [ ] `yarn nx run ag-charts-website-gallery_[example-name]_main.ts:typecheck` PASSED
- [ ] Thumbnails generated successfully
- [ ] Works in both light and dark themes

## Failure Handling

If validation fails, check `.rulesync/skills/spruce-example/troubleshooting.md`, then:

- **PREVis score decreased** → Revert all changes immediately
- **Typecheck failed** → Check axes[].type, remove colours/fonts, or revert
- **TypeScript errors** → Use specific chart types (see troubleshooting.md)
- **Thumbnail generation failed** → Check for runtime errors
- **Dark mode broken** → Search for hardcoded colours and remove them

## Example Path Mappings

- **Repo path**: `packages/ag-charts-website/src/content/gallery/_examples/${exampleName}/`
- **Dev server**: `https://localhost:4600/charts/gallery/examples/${exampleName}`

## Related Documentation

- Example skill: `.rulesync/skills/example/SKILL.md`
- Examples guide: `.rulesync/rules/examples.md`
- Framework patterns: `.rulesync/rules/examples-framework-patterns.md`
- Documentation pages: `.rulesync/rules/docs-pages.md`
- Spruce Docs skill: `.rulesync/skills/spruce-docs/SKILL.md`
