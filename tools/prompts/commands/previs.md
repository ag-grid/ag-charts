# PREVis Gallery Example Analysis

## 📋 Overview

Automated process to generate or refresh `PREVIS.md` files for AG Charts gallery examples using PREVis evaluation methodology. Creates baseline visual analysis documentation for future improvements.

**Usage**: `/previs [example-name]` or `/previs batch [pattern]`

## 🔄 Process Flow

### STEP 1: Environment Setup

**Prerequisites Check:**

-   [ ] Dev server running on `https://localhost:4600` (use `nx dev` if not)
-   [ ] Puppeteer configured with self-signed cert support
-   [ ] Example exists in gallery structure

### STEP 2: Visual Capture & Analysis

**Navigate and Screenshot:**

1. Navigate to `https://localhost:4600/charts/gallery/examples/[example-name]`
2. Take screenshot (1200x800px, saved as `[example-name]-analysis.png`)
3. Capture current visual state

**PREVis Evaluation:**

IMPORTANT: Use the **previs-evaluator** agent (NOT data-viz-designer) for PREVis analysis. The previs-evaluator is specialized for quality assessment and lacks Puppeteer tools, preventing redundant screenshot capture.

Launch previs-evaluator agent with this prompt:

```
Perform PREVis evaluation on the AG Charts gallery example '[example-name]' shown in the screenshot above.

IMPORTANT: The screenshot is already provided in this conversation context. DO NOT attempt to navigate to the URL or capture new screenshots. Analyze the visualization shown.

Evaluate these 6 dimensions (score 1-10 each):

**P**urpose Clarity (1-10):
- Is the visualization's intent immediately clear?
- Can viewers understand what story the data tells?
- Is the chart type appropriate for the data?

**R**eadability (1-10):
- Can users easily extract specific data values?
- Are labels, axes, and legends clear and legible?
- Is there proper contrast and spacing?

**E**ngagement (1-10):
- Does it invite exploration and interaction?
- Are there visual elements that draw attention appropriately?
- Does it maintain viewer interest?

**V**isual Hierarchy (1-10):
- Is information properly structured and prioritized?
- Are the most important elements emphasized?
- Is there clear visual organization?

**i**nteractivity (1-10):
- Are interactive features discoverable and useful?
- Do hover states provide valuable feedback?
- Are tooltips informative and well-designed?

**S**cale (1-10):
- Does it handle the data volume appropriately?
- Is the visualization neither too sparse nor too cluttered?
- Does it scale well visually?

For each dimension scoring ≤6, identify specific issues:
- Missing or poor tooltips
- Lack of visual structure (gridlines, bands, grouping)
- Unclear data values or poor labeling
- Static appearance with no interactive feedback
- Poor use of space or cluttered layout
- Legend issues or missing context
- Inappropriate chart type for data
- Poor color usage or accessibility issues

Provide your analysis in this exact format:

## PREVis Analysis Results

**Overall PREVis Score: X.X/10**

### Dimension Scores:
- **Purpose Clarity**: X/10 - [brief explanation]
- **Readability**: X/10 - [brief explanation]
- **Engagement**: X/10 - [brief explanation]
- **Visual Hierarchy**: X/10 - [brief explanation]
- **Interactivity**: X/10 - [brief explanation]
- **Scale**: X/10 - [brief explanation]

### Identified Issues:
1. **[Issue Category]**: [Specific description]
2. **[Issue Category]**: [Specific description]
3. **[Issue Category]**: [Specific description]

### Improvement Opportunities:
- **Critical** (Score ≤4): [List critical issues requiring immediate attention]
- **High** (Score 5-6): [List high-priority improvements]
- **Medium** (Score 7-8): [List moderate enhancements]
- **Low** (Score 9-10): [List minor polish opportunities]

### Strengths:
- [List what the example does well]
- [Highlight effective design choices]
```

### STEP 3: Generate PREVIS.md File

**Create Documentation:**
Write the analysis results to `packages/ag-charts-website/src/content/gallery/_examples/[example-name]/PREVIS.md`:

```markdown
# PREVis Analysis: [Example Name]

_Generated: [Date]_
_Analyst: previs-evaluator agent_

## Screenshot

![Analysis Screenshot]([example-name]-analysis.png)

[Insert complete PREVis analysis from Step 2]

## Analysis Context

-   **Example Type**: [Chart type/category]
-   **Data Characteristics**: [Brief description of dataset]
-   **Target Use Case**: [Intended business/analytical purpose]
-   **Theme Compatibility**: [Light/Dark mode status]

## Historical Notes

-   **Baseline Analysis**: [Current date]
-   **Previous Improvements**: [Track changes over time]
-   **Outstanding Issues**: [Known limitations or technical constraints]

---

_This analysis provides baseline documentation for future example improvements and quality tracking._
```

### STEP 4: Batch Processing

For multiple examples:

```bash
# Pattern-based analysis
/previs batch simple-*        # All simple chart examples
/previs batch *-with-labels   # All examples with labels
/previs batch stacked-*       # All stacked chart types
/previs batch *               # All gallery examples
```

**Batch Process:**

1. Iterate through matching examples
2. Capture screenshot for each
3. Run PREVis analysis on each screenshot
4. Generate individual PREVIS.md files
5. Create summary report of all analyses

### STEP 5: Summary Report

Generate `PREVIS-SUMMARY.md` with:

```markdown
# Gallery Examples - PREVis Analysis Summary

_Generated: [Date]_

## Overall Statistics

-   **Total Examples Analyzed**: X
-   **Average PREVis Score**: X.X/10
-   **Score Distribution**:
    -   9.0-10.0 (Excellent): X examples
    -   7.0-8.9 (Good): X examples
    -   5.0-6.9 (Needs Improvement): X examples
    -   <5.0 (Critical Issues): X examples

## Priority Improvement Candidates

### Critical (Score ≤5.0):

-   [example-name]: X.X/10 - [primary issues]

### High Priority (Score 5.1-6.9):

-   [example-name]: X.X/10 - [primary issues]

## Common Issues Across Examples:

1. **[Issue Type]**: Found in X examples
2. **[Issue Type]**: Found in X examples
3. **[Issue Type]**: Found in X examples

## Examples by Category:

-   **Simple Charts**: Average X.X/10
-   **Complex Visualizations**: Average X.X/10
-   **Interactive Examples**: Average X.X/10
-   **Multi-Series**: Average X.X/10

## Recommendations:

1. Focus improvement efforts on examples scoring <7.0
2. Address common issues that appear across multiple examples
3. Use high-scoring examples as reference patterns
```

## 🔧 Quality Gates

**Validation Requirements:**

-   [ ] Screenshot captured successfully
-   [ ] PREVis analysis completed with all 6 dimensions scored
-   [ ] PREVIS.md file created with complete analysis
-   [ ] Issues categorized by priority level
-   [ ] Analysis follows standardized format

## 📊 Output Structure

**Per Example:**

-   Screenshot: `[example-name]-analysis.png`
-   Analysis: `PREVIS.md`
-   Scores for all 6 PREVis dimensions
-   Prioritized improvement opportunities

**Summary Report:**

-   `PREVIS-SUMMARY.md` with cross-example insights
-   Statistical overview of gallery quality
-   Priority improvement recommendations
-   Common issue patterns identified

---

**Purpose**: Create systematic visual quality documentation to guide future example improvements and maintain gallery standards.
