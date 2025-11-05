# Visual Analysis Requirements

## 🔍 MANDATORY VISUAL ANALYSIS REQUIREMENT

**You MUST use both Puppeteer screenshots and PREVis evaluation to visually analyze each example.**

## Screenshot Handoff to Sub-Agents

**CRITICAL:** Sub-agents start with fresh context and don't automatically inherit screenshots unless properly handed off.

**Correct Pattern for PREVis Evaluation:**

1. Main agent takes screenshot with Puppeteer (screenshot appears visually in your conversation)
2. Launch **previs-evaluator** agent (NOT data-viz-designer - it lacks Puppeteer tools)
3. In the Task prompt, explicitly state:
    - "Screenshot is already provided in the conversation above"
    - "DO NOT navigate to the URL or capture new screenshots"
    - "Analyze the visualization shown in the screenshot"
    - Include the example name for context

**Why previs-evaluator instead of data-viz-designer?**

-   previs-evaluator lacks Puppeteer tools → cannot accidentally recapture screenshots
-   Specialized for PREVis methodology → more focused analysis
-   data-viz-designer is for design/dataset guidance, not quality evaluation

## Initial Assessment (BEFORE changes)

1. **Navigate to the example**: Use the Puppeteer tool to visit `https://localhost:4600/charts/gallery/examples/{exampleName}`
2. **Take screenshot**: Capture the current visual state of the chart (it will be visible in your conversation)
3. **Run PREVis evaluation**: Launch the **previs-evaluator** agent to evaluate the screenshot for visual quality
4. **Analyze visually**: Base your improvements on what you see and the PREVis feedback

### Puppeteer Configuration for Dev Server

```javascript
await puppeteer_navigate({
    url: `https://localhost:4600/charts/gallery/examples/${exampleName}`,
    allowDangerous: true, // Required for self-signed certificate
    launchOptions: {
        headless: true, // Required to avoid focus issues
        args: ['--ignore-certificate-errors'],
    },
});
```

## Validation (AFTER changes)

1. **Take new screenshot**: Capture the updated state with Puppeteer (it will be visible in your conversation)
2. **Run PREVis evaluation**: Launch the **previs-evaluator** agent to evaluate the new screenshot (following the handoff pattern above)
3. **Compare before/after**: Verify improvements are visible and appropriate
4. **Check for regressions**: Ensure changes improved the visualization without breaking anything

## Pre-Enhancement Checklist ✅

### Before Making Any Changes:

-   [ ] Screenshot taken with Puppeteer (current state documented and visible in conversation)
-   [ ] PREVis evaluation requested from **previs-evaluator** agent on the screenshot
-   [ ] Chart type and data structure identified (do not change these)
-   [ ] If 'simple-\*' example: Confirmed NOT adding more series/data (keep it simple!)
-   [ ] Current features cataloged (what's already implemented)
-   [ ] Multi-series vs single-series determined
-   [ ] Target audience considered (enterprise/finance focus)
-   [ ] **Footnote necessity assessed** - Only add if absolutely essential (footnotes reduce visualization space, especially for polar/radar charts)
-   [ ] Visual goals defined (3-5 specific improvements max)

### During Implementation:

-   [ ] Dark mode compatibility verified (no hardcoded colors)
-   [ ] TypeScript types properly used (no `any` type)
-   [ ] Theme conflicts avoided (no explicit theme setting)
-   [ ] Feature combinations checked (compatibility matrix)
-   [ ] Performance impact considered (animation duration, marker usage)

### After Changes:

-   [ ] New screenshot taken with Puppeteer (verify improvements - visible in conversation)
-   [ ] PREVis evaluation requested from **previs-evaluator** agent on the new screenshot
-   [ ] **✅ PREVis SCORE VERIFICATION**:
    -   [ ] PREVis score is at least as good as baseline (NO regression)
    -   [ ] No new visual issues identified by PREVis
    -   [ ] If score decreased: CHANGES REVERTED
-   [ ] **✅ COMPILATION & BUILD (MUST RUN ALL)**:
    -   [ ] Example compiles without TypeScript errors
    -   [ ] Example generates without warnings (`yarn nx run ag-charts-website-gallery_${exampleName}_main.ts:generate`)
    -   [ ] **VALIDATION PASSES** (`yarn nx run ag-charts-website-gallery_[example-name]_main.ts:typecheck`) - **CRITICAL - DO NOT SKIP**
    -   [ ] Thumbnail generation succeeds (`yarn nx generate-thumbnails ag-charts-website`)
    -   [ ] All `axes[].type` fields are specified
-   [ ] **THOROUGH Overlap Check** (CRITICAL for floating elements):
    -   [ ] Floating legend doesn't obscure any data points
    -   [ ] Floating legend doesn't overlap axis labels or titles
    -   [ ] Tooltips appear without being cut off or overlapping legend
    -   [ ] Annotations don't conflict with other elements
    -   [ ] Checked at multiple viewport sizes (desktop/tablet/mobile)
    -   [ ] Verified with data at chart edges/corners
    -   [ ] Tested with maximum data values that might extend upward
-   [ ] All themes tested (light/dark mode switching works)
-   [ ] **Footnote minimization verified** - Only essential footnotes remain (to maximize visualization space)
-   [ ] Chart loads correctly in development server
-   [ ] Before/after comparison confirms improvements without regressions

## Visual Verification for Floating Elements

```typescript
// 1. Take initial screenshot WITHOUT floating legend
await puppeteer_screenshot({ name: 'before-floating-legend' });

// 2. Apply floating legend configuration
// ... make changes ...

// 3. Take screenshot WITH floating legend
await puppeteer_screenshot({ name: 'after-floating-legend' });

// 4. Visually compare:
//    - Is any data obscured?
//    - Does legend overlap important chart elements?
//    - Is the chart still readable at different viewport sizes?
//    - Would a standard legend position work better?

// 5. Test at different viewports
await page.setViewport({ width: 1200, height: 800 });
await puppeteer_screenshot({ name: 'floating-legend-desktop' });

await page.setViewport({ width: 768, height: 600 });
await puppeteer_screenshot({ name: 'floating-legend-tablet' });

// 6. If ANY overlap or readability issues → REVERT to standard positioning
```

## Common Overlap Scenarios to Check

-   📍 **Data peaks**: High values that extend into legend area
-   📍 **Corner data points**: Series that start/end near legend position
-   📍 **Long labels**: Category labels that might extend under floating legend
-   📍 **Tooltip conflicts**: Hovering near legend causes tooltip cutoff
-   📍 **Annotation overlaps**: Reference lines or annotations intersecting legend
-   📍 **Responsive issues**: Legend overlaps at smaller viewport sizes

## PREVis Integration

### Using PREVis Results to Guide Improvements

1. **Analyze PREVis feedback** for specific visual issues:

    - Color contrast problems
    - Layout issues
    - Missing interactive elements
    - Data readability concerns

2. **Map PREVis issues to features**:

    - "Poor data comparison" → Load shared tooltips feature
    - "Lacks visual hierarchy" → Load axis bands feature
    - "Difficult to track values" → Load reference lines feature

3. **Validate improvements** with follow-up PREVis evaluation:
    - Score must not decrease
    - Identified issues should be resolved
    - No new issues should be introduced
