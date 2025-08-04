# Technical Review Plan: Axis Labels Documentation

## Page Analysis Summary

### Chart Types/Features Covered

-   Axis label collision avoidance mechanisms
-   Label text wrapping strategies (`on-space`, `always`, `hyphenate`, `never`)
-   Label truncation with tooltip display
-   Label rotation (fixed and automatic)
-   Label skipping behavior
-   Label text formatting (formatter and format string)
-   Label customization (styling)

### Key APIs and Configuration Options Documented

1. **Collision Avoidance**:

    - `label.avoidCollisions` - Enable/disable collision avoidance
    - `label.wrapping` - Text wrapping strategy
    - `label.truncate` - Enable truncation
    - `label.rotation` - Fixed rotation angle
    - `label.autoRotate` - Enable automatic rotation
    - `label.autoRotateAngle` - Angle for automatic rotation
    - `label.minSpacing` - Minimum gap between labels

2. **Text Formatting**:
    - `label.formatter` - Callback function for custom formatting
    - `label.format` - Static format string

### Examples Referenced

1. **axis-label-collision** - Interactive example demonstrating all collision avoidance features
2. **axis-label-formatter** - Shows formatter callback usage for customizing label text
3. **axis-label-format** - Demonstrates format string usage for time and number axes

### Interactive Features Described

-   Resizable chart (grab handle) to test collision avoidance
-   Dropdown controls for:
    -   Enabling/disabling collision avoidance
    -   Changing label lengths
    -   Toggling rotation, wrapping, and truncation options
-   Hover tooltips for truncated labels

## Validation Targets

### TypeScript Interfaces to Verify

1. `AgBaseCartesianAxisLabelOptions` in `packages/ag-charts-types/src/chart/cartesianOptions.ts`
    - Verify `autoRotate`, `autoRotateAngle`, `wrapping`, `truncate` properties
2. `AgBaseAxisLabelOptions` in `packages/ag-charts-types/src/chart/axisOptions.ts`
    - Verify `avoidCollisions`, `minSpacing`, `rotation`, `formatter` properties
3. `AgNumericAxisFormattableLabelOptions` and `AgTimeAxisFormattableLabelOptions`
    - Verify `format` property and supported format strings

### Implementation Files to Check

1. Axis label implementation in `packages/ag-charts-community/src/chart/axis/`
    - Check default values for collision avoidance properties
    - Verify wrapping strategy implementations
    - Check truncation behavior and tooltip generation
    - Verify rotation logic (auto vs fixed)
    - Check label skipping algorithm
2. Category axis specific defaults
    - Verify `autoRotate` defaults to true for category axes
    - Verify `autoRotateAngle` defaults to 335 degrees
    - Verify `wrapping` defaults to `on-space` for category axes

### Examples to Test with Expected Behaviors

#### 1. axis-label-collision

**Documentation claims**:

-   Resizable chart with grab handle
-   Collision avoidance can be toggled on/off
-   Label length can be changed via dropdown
-   Rotation, wrapping, and truncation controls available
-   Labels try wrapping → truncation → rotation → skipping (in that order)

**Expected behaviors for example-tester**:

-   Chart should be resizable via grab handle in bottom right
-   Collision avoidance toggle should enable/disable all avoidance strategies
-   Label length dropdown should change the text length of axis labels
-   When collision avoidance is enabled:
    -   Long labels should first try to wrap (if wrapping enabled)
    -   If still colliding, should truncate (if truncation enabled)
    -   If still colliding, should rotate (if rotation enabled)
    -   Finally, should skip labels if needed
-   Hovering over truncated labels should show full text in tooltip

**Interactive features to validate**:

-   Grab handle should allow smooth resizing
-   All dropdown controls should work correctly
-   Label behavior should change based on control settings

#### 2. axis-label-formatter

**Documentation claims**:

-   Number axis multiplies values by 100 and appends '%'
-   Category axis adds '==' around 'Windows' label only
-   Formatter receives params object with value, index, fractionDigits

**Expected behaviors for example-tester**:

-   Y-axis labels should show as percentages (e.g., "50%", "100%")
-   X-axis should show normal labels except "Windows" should appear as "==Windows=="
-   No console errors when rendering

#### 3. axis-label-format

**Documentation claims**:

-   Time axis uses format "%b %Y" (short month name + full year)
-   Number axis uses format "$#{0>6.2f}" (dollar sign, 6 digits padded with 0, 2 decimal places)

**Expected behaviors for example-tester**:

-   Time axis labels should show as "Jan 2024", "Feb 2024", etc.
-   Number axis labels should show as "$000001.50", "$000002.00", etc.
-   Format strings should be correctly parsed and applied

### User Interactions to Validate

1. **Resize interactions**:

    - Drag grab handle to make chart smaller/larger
    - Verify collision avoidance responds to size changes
    - Check that labels adjust strategy based on available space

2. **Control interactions**:

    - Toggle collision avoidance on/off
    - Change label length via dropdown
    - Toggle wrapping/truncation/rotation independently
    - Verify each control affects label behavior correctly

3. **Hover interactions**:
    - Hover over truncated labels to see tooltips
    - Hover over rotated labels
    - Hover over wrapped labels
    - Verify tooltip positioning and content

### Visual States to Screenshot and Analyze

1. **Default state** - Chart with default collision avoidance settings
2. **Collision states**:
    - Labels with wrapping enabled (all wrapping modes)
    - Labels with truncation (showing ellipsis)
    - Labels with rotation (both fixed and auto)
    - Labels being skipped
3. **Interactive states**:
    - Tooltip displayed on truncated label hover
    - Chart during resize operation
    - Different control settings applied

## Known Exceptions

-   No existing `technical-review-exceptions.md` file found

## Execution Plan

### Priority 1: API Contract Validation

1. Cross-reference all documented properties with TypeScript definitions
2. Verify property types and optional/required status
3. Check for any undocumented properties in the interfaces
4. Verify default values mentioned in documentation

### Priority 2: Implementation Verification

1. Check actual default values in implementation code
2. Verify collision avoidance strategy order (wrap → truncate → rotate → skip)
3. Confirm category axis specific defaults
4. Verify formatter and format implementations

### Priority 3: Example Testing

1. Delegate testing of axis-label-collision example to example-tester
    - Provide detailed expected behaviors list
    - Request validation of all interactive controls
    - Ask for screenshots of different collision avoidance states
2. Delegate testing of axis-label-formatter example
    - Verify custom formatting is applied correctly
    - Check params object structure
3. Delegate testing of axis-label-format example
    - Verify format string parsing
    - Check both time and number format examples

### Priority 4: Interactive Testing

1. Test resize functionality thoroughly
2. Test all control combinations in collision example
3. Verify tooltip behavior for truncated labels
4. Test keyboard navigation if applicable

### Priority 5: Visual Validation

1. Capture screenshots of all collision avoidance states
2. Document any visual issues or inconsistencies
3. Verify responsive behavior at different viewport sizes

## Success Criteria

-   All documented properties exist in TypeScript definitions with correct types
-   Default values in documentation match implementation
-   All examples demonstrate the features as described
-   Interactive controls work as expected
-   Collision avoidance strategies apply in the correct order
-   No console errors during any interactions
-   Visual appearance matches documentation descriptions
