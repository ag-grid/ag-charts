# Technical Review Plan: Pyramid Series

## Page Analysis Summary

### Chart Types/Features Covered

-   Pyramid Series - a triangular shaped visualization using height to represent proportional values
-   Simple vertical pyramid configuration
-   Horizontal pyramid configuration using `direction` property
-   Reverse pyramid configuration using `reverse` property
-   Customization features:
    -   Fill colors via `fills` array
    -   Triangle shape via `aspectRatio` property

### Key APIs and Configuration Options Documented

-   Series type: `'pyramid'`
-   Required keys:
    -   `stageKey`: Maps to categories/segments in the pyramid
    -   `valueKey`: Provides numerical values determining segment height
-   Direction control: `direction: 'horizontal'` (default is 'vertical')
-   Order control: `reverse: true` (default is false)
-   Styling:
    -   `fills`: Array of colors for segment fills
    -   `aspectRatio`: Ratio of width to height (e.g., 3/2)

### Examples Referenced and Their Purposes

1. **simple-pyramid**: Basic pyramid chart demonstrating fundamental `stageKey` and `valueKey` configuration
2. **horizontal-pyramid**: Demonstrates horizontal direction configuration
3. **reverse-pyramid**: Shows reverse order functionality
4. **pyramid-fills**: Custom fill colors using the `fills` array
5. **pyramid-aspect-ratio**: Custom triangle shape using `aspectRatio`

### Interactive Features Described

-   The documentation doesn't explicitly describe interactive features like tooltips, hover states, or click interactions
-   Based on AG Charts patterns, pyramids likely support:
    -   Hover tooltips showing stage and value information
    -   Hover highlight effects on segments
    -   Legend interaction (if legend is enabled)

## Validation Targets

### Specific TypeScript Interfaces to Verify

-   `AgPyramidSeriesOptions` (main interface in `/packages/ag-charts-types/src/series/standalone/pyramidOptions.ts`)
-   Key properties to validate:
    -   `type: 'pyramid'`
    -   `stageKey: DatumKey<TDatum>`
    -   `valueKey: DatumKey<TDatum>`
    -   `direction?: 'horizontal' | 'vertical'`
    -   `reverse?: boolean`
    -   `fills?: AgColorType[]`
    -   `aspectRatio?: number`
    -   `spacing?: number` (not documented but exists in interface)
    -   `label?`, `stageLabel?`, `tooltip?` configurations (not documented)

### Implementation Files to Check

-   Primary implementation: Look for `pyramidSeries.ts` or similar in:
    -   `/packages/ag-charts-community/src/chart/series/`
    -   `/packages/ag-charts-enterprise/src/series/`
-   Property files: Look for `pyramidSeriesProperties.ts`
-   Module registration files to verify feature availability

### Examples to Test with Expected Behaviors

#### 1. simple-pyramid

**Documentation claims:**

-   Uses `stageKey` for categories mapped to segments
-   Uses `valueKey` for numerical values determining height
-   Should create a basic triangular pyramid visualization

**Expected behaviors to validate:**

-   Chart renders as a triangular pyramid shape
-   Segments are stacked vertically with heights proportional to values
-   Each segment represents a category from the data
-   Tooltips should show stage name and value on hover
-   Segments should have hover highlight effects
-   Legend should display stage names (if enabled)

#### 2. horizontal-pyramid

**Documentation claims:**

-   Setting `direction: 'horizontal'` creates a horizontal pyramid

**Expected behaviors to validate:**

-   Pyramid renders horizontally (rotated 90 degrees)
-   Segments stack horizontally instead of vertically
-   Width of segments represents values instead of height
-   All interactive features work in horizontal orientation
-   Tooltips and hover effects function correctly

#### 3. reverse-pyramid

**Documentation claims:**

-   Setting `reverse: 'true'` reverses the pyramid (note: docs show string 'true' but interface expects boolean)

**Expected behaviors to validate:**

-   Pyramid segments render in reverse order
-   If normally largest-to-smallest, should show smallest-to-largest
-   Interactive features maintain correct associations
-   **Bug to verify:** Documentation shows `reverse: 'true'` (string) but TypeScript interface expects boolean

#### 4. pyramid-fills

**Documentation claims:**

-   `fills` property accepts array of colors: `['#5C6BC0', '#3F51B5', '#303F9F', '#1A237E']`
-   Colors customize pyramid segment fills

**Expected behaviors to validate:**

-   Each segment uses the corresponding color from the fills array
-   Colors cycle if more segments than colors provided
-   Hover states maintain fill colors with appropriate highlighting
-   Legend shows correct colors for each stage

#### 5. pyramid-aspect-ratio

**Documentation claims:**

-   `aspectRatio: 3/2` means width grows 3px for every 2px of height

**Expected behaviors to validate:**

-   Pyramid shape changes based on aspect ratio
-   Ratio of 3/2 creates a wider pyramid
-   Pyramid maintains aspect ratio on resize
-   All segments scale proportionally

### User Interactions to Validate

1. **Hover interactions:**

    - Hovering over pyramid segments shows tooltips
    - Segments highlight on hover
    - Tooltip content includes stage name and value
    - Tooltip positioning works correctly for all segments

2. **Legend interactions (if present):**

    - Clicking legend items toggles segment visibility
    - Hovering legend items highlights corresponding segments
    - Legend shows correct stage names and colors

3. **Keyboard navigation:**

    - Tab navigation through interactive elements
    - Focus indicators on segments or legend items

4. **Edge cases:**
    - Behavior with negative values
    - Behavior with zero values
    - Behavior with single segment
    - Window resize maintains pyramid integrity

### Visual States to Screenshot and Analyze

1. **Default states:**

    - Each example in its initial rendered state
    - Full pyramid visualization showing all segments

2. **Interactive states:**

    - Hover tooltips on different segments (top, middle, bottom)
    - Hover highlight effects on segments
    - Legend interaction states (if applicable)

3. **Configuration variations:**

    - Horizontal vs vertical pyramid comparison
    - Normal vs reversed pyramid comparison
    - Different aspect ratios showing shape variations
    - Custom fills showing color application

4. **Responsive behavior:**
    - Desktop viewport (1200px width)
    - Tablet viewport (768px width)
    - Mobile viewport (375px width)

## Known Exceptions

-   No existing `technical-review-exceptions.md` file found for this page
-   No documented exceptions to consider during review

## Execution Plan

### Priority 1: Critical Documentation Accuracy

1. **Verify required properties documentation:**
    - Confirm `stageKey` and `valueKey` are required and work as described
    - Test examples fail without these properties
2. **Fix documentation error:**

    - Verify `reverse: 'true'` should be `reverse: true` (boolean not string)
    - Check if string value causes TypeScript errors or runtime issues

3. **Test basic pyramid rendering:**
    - Validate simple-pyramid example creates expected visualization
    - Verify segments represent data correctly

### Priority 2: Configuration Options Validation

1. **Direction property testing:**

    - Verify horizontal pyramid renders correctly
    - Confirm default is vertical when not specified

2. **Reverse property testing:**

    - Validate reverse order functionality
    - Test with both boolean and string values

3. **Customization testing:**
    - Verify fills array applies colors correctly
    - Test aspectRatio changes pyramid shape as described

### Priority 3: Undocumented Features Discovery

1. **Check for additional properties:**

    - Test `spacing` property between segments
    - Investigate `label` and `stageLabel` configurations
    - Explore `tooltip` customization options
    - Test `shadow`, `strokeWidth`, `strokeOpacity` etc.

2. **Interactive features validation:**
    - Document all hover behaviors
    - Test keyboard navigation support
    - Verify legend functionality

### Priority 4: example-tester Agent Delegation

For each example, provide the example-tester agent with:

1. Example path and configuration code
2. Expected chart type and visual appearance
3. Required data structure (stageKey/valueKey mapping)
4. Interactive behaviors to test
5. Console error checking
6. TypeScript validation requirements

### Success Criteria

-   All documented properties work as described
-   Examples demonstrate claimed features
-   No console errors during interactions
-   TypeScript types match documentation
-   Interactive features function correctly
-   Visual rendering matches expectations
-   Documentation is complete for basic usage

### Estimated Complexity/Time

-   **High complexity items:**
    -   Full interactive behavior testing across all examples
    -   TypeScript interface validation
    -   Undocumented feature discovery
-   **Medium complexity items:**

    -   Basic configuration testing
    -   Visual screenshot analysis
    -   Documentation accuracy checks

-   **Low complexity items:**
    -   Fix obvious documentation errors
    -   Basic example validation

Total estimated time: 2-3 hours for thorough review including screenshot capture and analysis
