# Spruce Up Gallery Example

## 📋 Overview

Improve AG Charts gallery examples to showcase features while maintaining theme compatibility and professional quality.

**Target**: Enterprise/finance customers requiring professional, theme-compatible visualizations.

**Usage**: `/spruce-example [example-name]`

⚠️ IMPORTANT: If you are unable to follow the instructions, STOP AND FAIL.

⚠️ IMPORTANT: All sub-prompts for this command are in the `${REPO_ROOT}/tools/prompts/commands/spruce-example` directory, look for .md files there if in doubt.

```bash
PROMPT_ROOT=${REPO_ROOT}/tools/prompts/commands/spruce-example
```

## ⚠️ MANDATORY WORKFLOW - COMPLETE IN ORDER

### STEP 0: Load Required Documentation

**Read these files FIRST (non-negotiable):**

1. `${PROMPT_ROOT}/core-rules.md`
2. `${PROMPT_ROOT}/visual-analysis.md`
3. `${PROMPT_ROOT}/troubleshooting.md` (quick reference)

### STEP 1: Baseline Visual Analysis

**Complete ALL before proceeding:**

-   [ ] Navigate to `https://localhost:4600/charts/gallery/examples/[example-name]` with Puppeteer
-   [ ] Take initial screenshot (this will be visible in your conversation context)
-   [ ] Run PREVis evaluation via **previs-evaluator** agent with this pattern:
    -   Launch the previs-evaluator agent (NOT data-viz-designer)
    -   In your Task prompt, state: "Perform PREVis evaluation on the AG Charts example '[example-name]' shown in the screenshot above. IMPORTANT: The screenshot is already provided in this conversation context. DO NOT attempt to navigate or capture new screenshots. Analyze the visualization shown and evaluate the six PREVis dimensions..."
    -   The previs-evaluator agent does NOT have Puppeteer tools and expects screenshots to be provided
-   [ ] Record baseline PREVis score: **\_**
-   [ ] Document identified issues: **\_**

**STOP if Puppeteer fails - do not proceed with code-only analysis**

### STEP 2: Load Feature Modules

This step is critical, do not skip it.

The intent is to load instructions about how to improve the example based on the PREVis issues.

**Based on PREVis issues, load ONLY relevant modules:**

| PREVis Finding                                  | Priority | Load Module                                  | Quick Fix                                 |
| ----------------------------------------------- | -------- | -------------------------------------------- | ----------------------------------------- |
| **Tooltip Issues**                              |
| "Poor data comparison" / "Can't compare series" | CRITICAL | `${PROMPT_ROOT}/features/tooltips.md`        | Add `tooltip: { mode: 'shared' }`         |
| "Missing tooltips" / "No hover feedback"        | CRITICAL | `${PROMPT_ROOT}/features/tooltips.md`        | Enable tooltips with heading              |
| "Empty line in tooltip"                         | HIGH     | `${PROMPT_ROOT}/features/tooltips.md`        | Add `heading` property                    |
| **Visual Hierarchy**                            |
| "Lacks visual structure" / "Flat appearance"    | HIGH     | `${PROMPT_ROOT}/features/axes.md`            | Add axis bands with gridLine styles       |
| "Hard to track values" / "Grid too sparse"      | HIGH     | `${PROMPT_ROOT}/features/axes.md`            | Configure gridLine patterns               |
| "No hover highlighting"                         | MEDIUM   | `${PROMPT_ROOT}/features/axes.md`            | Add `bandHighlight: { enabled: true }`    |
| **Value-Based Visual Differentiation**          |
| "No visual thresholds" / "Missing targets"      | HIGH     | `${PROMPT_ROOT}/features/segmentation.md`    | Add series segmentation                   |
| "Performance zones unclear"                     | HIGH     | `${PROMPT_ROOT}/features/segmentation.md`    | Use y-axis segmentation                   |
| "Time periods not differentiated"               | MEDIUM   | `${PROMPT_ROOT}/features/segmentation.md`    | Use x-axis segmentation                   |
| **Data Readability**                            |
| "Values unclear" / "Can't read exact values"    | HIGH     | `${PROMPT_ROOT}/features/data-labels.md`     | Enable labels with placement              |
| "Cluttered labels" / "Overlapping text"         | HIGH     | `${PROMPT_ROOT}/features/data-labels.md`     | Smart label placement strategies          |
| "Poor number formatting"                        | MEDIUM   | Core formatter patterns                      | Use root-level `formatter.y`              |
| **Legend Problems**                             |
| "Legend obscures data"                          | CRITICAL | `${PROMPT_ROOT}/features/legends.md`         | Reposition or use standard placement      |
| "Legend takes too much space"                   | MEDIUM   | `${PROMPT_ROOT}/features/legends.md`         | Optimize position/layout                  |
| **Context Missing**                             |
| "No baseline/target shown"                      | HIGH     | `${PROMPT_ROOT}/features/reference-lines.md` | Add reference lines for targets           |
| "Missing context" / "No annotations"            | MEDIUM   | `${PROMPT_ROOT}/features/reference-lines.md` | Add contextual annotations                |
| **Interactivity**                               |
| "Static visualization"                          | MEDIUM   | `${PROMPT_ROOT}/features/axes.md`            | Add crosshairs and highlights             |
| "No drill-down capability"                      | LOW      | `${PROMPT_ROOT}/features/enterprise.md`      | Consider navigator/zoom                   |
| **Advanced Needs**                              |
| "Executive dashboard quality"                   | MEDIUM   | `${PROMPT_ROOT}/features/enterprise.md`      | Add gauges/KPIs if appropriate            |
| "Geographic data present"                       | HIGH     | `${PROMPT_ROOT}/features/enterprise.md`      | Use map visualizations                    |
| "Flow/process data"                             | HIGH     | `${PROMPT_ROOT}/features/enterprise.md`      | Consider Sankey diagrams                  |
| **Styling Enhancements**                        |
| "Need varied emphasis" / "All items same style" | MEDIUM   | `${PROMPT_ROOT}/features/recent-features.md` | Use series/item stylers                   |
| **Code Quality**                                |
| "Repetitive configuration"                      | LOW      | `${PROMPT_ROOT}/features/theme-overrides.md` | Use theme overrides for DRY               |
| **Common Errors**                               |
| TypeScript compilation errors                   | HIGH     | `${PROMPT_ROOT}/troubleshooting.md`          | Check chart types and axes[].type         |
| CSS/styling conflicts                           | CRITICAL | `${PROMPT_ROOT}/troubleshooting.md`          | Remove all CSS files and color/font props |

### STEP 3: Implementation

**Verify BEFORE making changes:**

-   [ ] NO hardcoded colors (hex, rgb, named)
-   [ ] NO font properties (fontSize, fontWeight, fontFamily, fontStyle)
-   [ ] NO styles.css or CSS files
-   [ ] Using specific chart type (AgCartesianChartOptions, not AgChartOptions)
-   [ ] All axes have `type` specified

**Apply improvements:**

-   Focus on structural enhancements (tooltips, bands, formatters)
-   Let theme handle ALL visual styling
-   Use `highlight.*` properties (not deprecated `highlightStyle`)
-   Add `heading` to all tooltip configurations
-   **Minimize footnotes** - Only add if absolutely essential to explain the example (footnotes reduce vertical space for visualization, especially critical for polar/radar charts)

### STEP 4: Validation (MANDATORY)

**Run these commands IN ORDER:**

1. Generate example:

    ```bash
    nx run ag-charts-website-gallery_[example-name]_main.ts:generate
    ```

2. **CRITICAL - Validate example:**

    ```bash
    nx run ag-charts-website-gallery_[example-name]_main.ts:typecheck
    ```

    **If this fails → REVERT ALL CHANGES**

3. Visual verification:

    - [ ] Take final screenshot with Puppeteer
    - [ ] Run final PREVis evaluation
    - [ ] Final PREVis score: **\_**
    - [ ] **Score MUST NOT decrease** (if decreased → REVERT)

4. Generate thumbnail:
    ```bash
    nx generate-thumbnails ag-charts-website
    ```

## ✅ Completion Checklist

**Cannot mark complete until ALL checked:**

-   [ ] PREVis score maintained or improved
-   [ ] NO hardcoded colors or fonts
-   [ ] **Footnotes minimized** - Only essential footnotes kept (to maximize visualization space)
-   [ ] nx run ag-charts-website-gallery\_[example-name]\_main.ts:typecheck PASSED
    -   [ ] TypeScript compiles without errors
-   [ ] Thumbnails generated successfully
-   [ ] Works in light/dark themes

## 🚫 If Validation Fails

**Check `troubleshooting.md` for quick fixes, then:**

1. **PREVis score decreased**: Revert all changes immediately
2. **nx run ag-charts-website-gallery\_[example-name]\_main.ts:typecheck failed**: Check axes[].type, remove colors/fonts, or revert
3. **TypeScript errors**: Use specific chart types (see troubleshooting.md)
4. **Thumbnail generation failed**: Check for runtime errors
5. **Dark mode broken**: Search for hardcoded colors and remove them

## 📂 Documentation Structure

```
${PROMPT_ROOT}/spruce-example/
├── core-rules.md          # Mandatory rules (MUST READ)
├── visual-analysis.md     # PREVis workflow (MUST READ)
├── troubleshooting.md     # Quick fixes for common issues
└── features/              # Load based on PREVis gaps
    ├── tooltips.md
    ├── axes.md
    ├── legends.md
    ├── reference-lines.md
    ├── data-labels.md
    └── enterprise.md
```

---

**Remember**: Theme compatibility is paramount. When in doubt, remove styling and let the theme handle it.
