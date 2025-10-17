# Technical Review Plan: Sankey Series Documentation

**Review Mode**: Full Mode (MCP Puppeteer + Task tool available)
**Documentation Page**: `packages/ag-charts-website/src/content/docs/sankey-series/index.mdoc`
**Live Dev URL**: `https://localhost:4600/charts/javascript/sankey-series/`

## Files Discovered

### TypeScript Definitions

-   `packages/ag-charts-types/src/series/standalone/sankeyOptions.ts` - Main API definitions
    -   `AgSankeySeriesOptions` interface
    -   `AgSankeySeriesLabelOptions` interface
    -   `AgSankeySeriesLinkOptions` interface
    -   `AgSankeySeriesNodeOptions` interface

### Implementation Files

-   `packages/ag-charts-enterprise/src/series/sankey/sankeySeries.ts` - Main series implementation
-   `packages/ag-charts-enterprise/src/series/sankey/sankeySeriesProperties.ts` - Property definitions with @Property decorators

### Example Files

1. **simple-sankey** (`_examples/simple-sankey/`)

    - Demonstrates: Basic sankey configuration
    - Key config: `fromKey`, `toKey`, `sizeKey`, `sizeName`, `label.edgePlacement: 'outside'`
    - Expected: UK Power Generation data visualization

2. **alignment** (`_examples/alignment/`)

    - Demonstrates: Horizontal node alignment options
    - Key config: `node.alignment` with 'left', 'right', 'center', 'justify'
    - Expected: Interactive buttons to change alignment

3. **vertical-alignment** (`_examples/vertical-alignment/`)

    - Demonstrates: Vertical node alignment options
    - Key config: `node.verticalAlignment` with 'top', 'bottom', 'center'
    - Expected: Interactive buttons to change vertical alignment

4. **sorting** (`_examples/sorting/`)

    - Demonstrates: Node sorting methods
    - Key config: `node.sort` with 'data', 'ascending', 'descending', 'auto'
    - Expected: Interactive buttons to change sorting

5. **label-placement** (`_examples/label-placement/`)

    - Demonstrates: Label placement relative to nodes
    - Key config: `label.placement` ('left', 'right', 'center'), `label.edgePlacement` ('inside', 'outside')
    - Expected: Interactive buttons to change placement

6. **node-style** (`_examples/node-style/`)

    - Demonstrates: Node styling options
    - Key config: `node.fill`, `node.stroke`, `node.strokeWidth`
    - Expected: Styled nodes with custom colors

7. **link-style** (`_examples/link-style/`)
    - Demonstrates: Link styling options
    - Key config: `link.fill`, `link.fillOpacity`, `link.stroke`, `link.strokeWidth`, `link.strokeOpacity`
    - Expected: Styled links with custom colors and opacity

## Validation Tasks

### Phase 1: Technical Accuracy

-   [ ] Verify all API references match TypeScript definitions in `sankeyOptions.ts`
-   [ ] Cross-check default values against `@Property` decorators in `sankeySeriesProperties.ts`
-   [ ] Validate property paths and option structures in code snippets
-   [ ] Verify alignment options: 'left', 'right', 'center', 'justify'
-   [ ] Verify verticalAlignment options: 'top', 'bottom', 'center'
-   [ ] Verify sort options: 'data', 'ascending', 'descending', 'auto'
-   [ ] Verify label placement options: 'left', 'right', 'center'
-   [ ] Verify edgePlacement options: 'inside', 'outside'
-   [ ] Check node style properties: fill, stroke, strokeWidth
-   [ ] Check link style properties: fill, fillOpacity, stroke, strokeWidth, strokeOpacity
-   [ ] Validate `minSize` property documentation
-   [ ] Validate `node.spacing` and `node.minSpacing` properties
-   [ ] Validate `node.width` property
-   [ ] Validate `label.spacing` property

### Phase 2: Example Testing (delegate to example-tester agent)

For each example:

-   [ ] **simple-sankey**: Verify basic configuration and data rendering
-   [ ] **alignment**: Test all 4 alignment modes ('left', 'right', 'center', 'justify')
-   [ ] **vertical-alignment**: Test all 3 vertical alignment modes ('top', 'bottom', 'center')
-   [ ] **sorting**: Test all 4 sorting modes ('data', 'ascending', 'descending', 'auto')
-   [ ] **label-placement**: Test placement and edgePlacement combinations
-   [ ] **node-style**: Verify custom node styling renders correctly
-   [ ] **link-style**: Verify custom link styling renders correctly

### Phase 3: Visual & Interaction Testing

-   [ ] Navigate to `https://localhost:4600/charts/javascript/sankey-series/`
-   [ ] Capture screenshot: overall page layout
-   [ ] Test interactive features in alignment example
-   [ ] Test interactive features in vertical-alignment example
-   [ ] Test interactive features in sorting example
-   [ ] Test interactive features in label-placement example
-   [ ] Verify tooltips display correctly on hover
-   [ ] Check for console errors
-   [ ] Verify responsive layout

### Phase 4: Content Quality

-   [ ] Check completeness of feature coverage
-   [ ] Verify all properties mentioned in TypeScript definitions are documented
-   [ ] Check for missing documentation on:
    -   `minSize` property
    -   `node.spacing` property
    -   `node.minSpacing` property
    -   `node.width` property (documented default vs actual default)
    -   `node.alignment` property (documented default vs actual default)
    -   `node.verticalAlignment` property (documented default)
    -   `node.sort` property (documented default)
    -   `label.spacing` property
    -   `itemStyler` properties for nodes and links
    -   Circular loop handling (warning is present)
-   [ ] Identify gaps between implementation and documentation

## API Surface from Documentation

### Series-Level Properties

-   `type: 'sankey'`
-   `fromKey: string` - start node key
-   `toKey: string` - end node key
-   `sizeKey: string` - link size key
-   `sizeName: string` - human-readable size name (optional)

### Node Options (`node`)

-   `alignment: 'left' | 'right' | 'center' | 'justify'`
-   `verticalAlignment: 'top' | 'bottom' | 'center'`
-   `sort: 'data' | 'ascending' | 'descending' | 'auto'`
-   `fill: CssColor`
-   `stroke: CssColor`
-   `strokeWidth: number`

### Link Options (`link`)

-   `fill: CssColor`
-   `fillOpacity: number`
-   `stroke: CssColor`
-   `strokeWidth: number`
-   `strokeOpacity: number`

### Label Options (`label`)

-   `placement: 'left' | 'right' | 'center'`
-   `edgePlacement: 'inside' | 'outside'`

## Expected Default Values (from TypeScript definitions)

From `sankeyOptions.ts`:

-   `node.spacing`: 20 (comment in TypeScript)
-   `node.minSpacing`: 0 (comment in TypeScript)
-   `node.width`: 1 (comment in TypeScript)
-   `node.alignment`: 'center' (comment in TypeScript)
-   `node.verticalAlignment`: 'center' (comment in TypeScript)
-   `node.sort`: 'auto' (comment in TypeScript)

From `sankeySeriesProperties.ts` @Property decorators:

-   `label.spacing`: 1 (line 58)
-   `label.placement`: undefined (line 61)
-   `label.edgePlacement`: undefined (line 64)
-   `link.fillOpacity`: 1 (line 72)
-   `link.strokeOpacity`: 1 (line 78)
-   `link.strokeWidth`: 1 (line 81)
-   `link.lineDash`: [0] (line 84)
-   `link.lineDashOffset`: 0 (line 87)
-   `node.spacing`: 1 (line 95)
-   `node.minSpacing`: 0 (line 98)
-   `node.width`: 1 (line 101)
-   `node.alignment`: 'justify' (line 104)
-   `node.verticalAlignment`: 'center' (line 107)
-   `node.sort`: 'auto' (line 110)
-   `node.fillOpacity`: 1 (line 116)
-   `node.strokeOpacity`: 1 (line 122)
-   `node.strokeWidth`: 1 (line 125)
-   `node.lineDash`: [0] (line 128)
-   `node.lineDashOffset`: 0 (line 131)
-   `minSize`: 1 (line 196)

## Discrepancies to Investigate

1. **node.spacing default**: TypeScript comment says 20, @Property decorator says 1
2. **node.alignment default**: TypeScript comment says 'center', @Property decorator says 'justify'
3. Documentation does not mention default values - need to determine correct defaults
