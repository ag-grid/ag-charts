# Technical Review Plan - Axes Crosshairs Documentation

## Page Analysis Summary

### Chart Types/Features Covered

-   **Crosshairs**: Visual reference lines that follow mouse or snap to data points
-   **Band Highlights**: Shaded areas that emphasize entire category bands
-   Both features are enterprise-only functionality

### Key APIs and Configuration Options Documented

1. **Crosshair Configuration** (`AgCrosshairOptions`):

    - `enabled`: Enable/disable crosshairs
    - `snap`: Control snapping behavior (default true)
    - Styling: `stroke`, `strokeWidth`, `lineDash`
    - Label configuration with positioning, formatting, and custom renderers

2. **Band Highlight Configuration** (`AgBandHighlightOptions`):
    - `enabled`: Enable/disable band highlights
    - Styling: `stroke`, `strokeWidth`, `fill`, `fillOpacity`
    - Only available for category, unit-time, and ordinal-time axes

### Examples Referenced and Their Purposes

1. **enabling-crosshairs**: Basic crosshair enablement
2. **crosshair-snap**: Demonstrates snap=false behavior
3. **crosshair-styles**: Custom styling (stroke, strokeWidth, lineDash)
4. **crosshair-label-offset**: Label positioning with xOffset/yOffset
5. **crosshair-label-format**: Label formatting hierarchy and inheritance
6. **crosshair-default-label-custom-renderer**: Custom label renderer returning style object
7. **crosshair-default-label-custom-css**: CSS customization with class names
8. **crosshair-custom-label**: Full custom HTML label renderer
9. **band-highlight**: Band highlighting for category axes

### Interactive Features Described

-   Mouse hover triggers crosshairs and band highlights
-   Crosshairs can snap to data points or follow mouse freely
-   Tooltips/labels appear at crosshair positions
-   Band highlights shade entire category areas on hover
-   CSS class customization for label styling

## Validation Targets

### Specific TypeScript Interfaces to Verify

1. `AgCrosshairOptions` in `/packages/ag-charts-types/src/chart/crosshairOptions.ts`
2. `AgBandHighlightOptions` in `/packages/ag-charts-types/src/chart/bandHighlightOptions.ts`
3. `AgCrosshairLabel` and related interfaces
4. `AgCrosshairLabelFormatterParams` and `AgCrosshairLabelRendererParams`

### Implementation Files to Check

1. Crosshair implementation in enterprise package:
    - Look for crosshair-related files in `packages/ag-charts-enterprise/src/`
    - Verify enterprise-only feature flagging
2. Band highlight implementation:

    - Search for band highlight implementation files
    - Verify axis type restrictions (category, unit-time, ordinal-time only)

3. Default value implementations:
    - Check for `@Property` decorators to verify documented defaults
    - Verify snap default is actually true
    - Check label enabled state default behavior

### Examples to Test with Expected Behaviors

#### 1. enabling-crosshairs

**Documentation claims**:

-   Shows basic crosshair enablement
-   Crosshairs should appear on mouse hover
-   Should snap to data points by default

**Expected behaviors for example-tester**:

-   Crosshairs visible on both axes when hovering
-   Crosshairs snap to nearest data point
-   Labels appear at axis positions
-   No console errors

#### 2. crosshair-snap

**Documentation claims**:

-   Demonstrates snap=false behavior
-   Crosshair follows mouse pointer instead of snapping

**Expected behaviors for example-tester**:

-   Crosshairs follow exact mouse position
-   No snapping to data points
-   Smooth movement without jumping
-   Labels update continuously with mouse position

#### 3. crosshair-styles

**Documentation claims**:

-   Shows custom styling with stroke='#2b5c95', strokeWidth=2, lineDash=[5,10]

**Expected behaviors for example-tester**:

-   Crosshairs render with blue color (#2b5c95)
-   Line width is 2px
-   Dashed line pattern visible (5px dash, 10px gap)
-   Style applies to both axis crosshairs

#### 4. crosshair-label-offset

**Documentation claims**:

-   Labels positioned with xOffset=20, yOffset=20
-   Labels should be 20px right and 20px down from crosshair start

**Expected behaviors for example-tester**:

-   Labels offset from default position
-   Consistent 20px offset in both directions
-   Offset applies during movement
-   Labels don't overlap with axis

#### 5. crosshair-label-format

**Documentation claims**:

-   Interactive example with format hierarchy
-   Three buttons to test format inheritance
-   Crosshair inherits axis format unless overridden

**Expected behaviors for example-tester**:

-   "Remove formats" button: Both axis and crosshair use default format
-   "Set axis.label.format" button: Both use axis format
-   "Set crosshair.label.format" button: Crosshair uses its own format, axis unaffected
-   Format changes apply immediately

#### 6. crosshair-default-label-custom-renderer

**Documentation claims**:

-   Custom renderer returns object with text, color, backgroundColor, opacity
-   Example shows darkBlue background, aliceBlue text, 0.8 opacity

**Expected behaviors for example-tester**:

-   Labels have dark blue background
-   Text color is alice blue
-   Opacity is 0.8 (semi-transparent)
-   Renderer receives value and fractionDigits

#### 7. crosshair-default-label-custom-css

**Documentation claims**:

-   CSS customization using ag-charts-crosshair-label class
-   Example sets border-radius to 15px

**Expected behaviors for example-tester**:

-   Labels have rounded corners (15px border-radius)
-   Custom CSS applies via class names
-   Default styling still applies where not overridden
-   Both label and content classes available

#### 8. crosshair-custom-label

**Documentation claims**:

-   Fully custom HTML label via renderer returning string
-   Custom CSS classes and arrow styling

**Expected behaviors for example-tester**:

-   Custom HTML structure renders correctly
-   Arrow pointer visible on label
-   Custom styles from styles.css apply
-   Renderer receives value and fractionDigits

#### 9. band-highlight

**Documentation claims**:

-   Gray band highlight for hovered category
-   No additional label rendered
-   Only for category, unit-time, ordinal-time axes

**Expected behaviors for example-tester**:

-   Gray band appears on category hover
-   Band covers full category width
-   No label appears (unlike crosshairs)
-   Smooth transitions between categories

### User Interactions to Validate

1. **Mouse hover behaviors**:

    - Hover over chart area to trigger crosshairs
    - Move mouse smoothly to test tracking
    - Hover over data points to test snapping
    - Hover at chart edges to test label positioning

2. **Snap behavior testing**:

    - Test default snap=true behavior
    - Test snap=false for smooth following
    - Verify snap works with different chart types

3. **Label interaction**:

    - Verify labels don't obstruct view
    - Test label positioning with offsets
    - Check label updates with value changes

4. **Band highlight specific**:
    - Hover over different categories
    - Test transitions between bands
    - Verify no label appears

### Visual States to Screenshot and Analyze

1. **Default crosshair state** - Basic appearance
2. **Hover over data point** - Snapped crosshair with labels
3. **Mouse between points** - Snap vs no-snap comparison
4. **Custom styled crosshairs** - Verify style application
5. **Label with offsets** - Position verification
6. **Custom rendered labels** - HTML and styling
7. **Band highlight active** - Category highlighting
8. **Edge cases** - Behavior at chart boundaries

### Interactive Features Requiring Before/After Visual Comparison

1. Format button clicks in crosshair-label-format example
2. Hovering between categories for band highlights
3. Transition from snapped to unsnapped positions
4. Label appearance/disappearance on hover

### Chart Elements That Should Be Interactive

-   All data points (for crosshair snapping)
-   Entire chart area (for crosshair tracking)
-   Category bands (for band highlighting)
-   Interactive buttons in format example

### Expected Tooltip Content and Highlighting Behaviors

-   Crosshair labels show axis values at cursor position
-   Labels format according to hierarchy rules
-   Band highlights shade entire category area
-   No additional tooltips for band highlights

## Known Exceptions

No existing technical-review-exceptions.md file found for this page.

## Execution Plan

### Priority 1: Core Functionality Validation

1. **Verify TypeScript interfaces** match documentation
2. **Test basic crosshair enablement** (enabling-crosshairs example)
3. **Validate snap behavior** (crosshair-snap example)
4. **Confirm enterprise-only restriction**

### Priority 2: Styling and Customization

1. **Test crosshair styling options** (crosshair-styles example)
2. **Verify label positioning** (crosshair-label-offset example)
3. **Validate CSS customization** (crosshair-default-label-custom-css example)

### Priority 3: Advanced Features

1. **Test format inheritance hierarchy** (crosshair-label-format example)
2. **Validate custom renderers** (both renderer examples)
3. **Test band highlighting** (band-highlight example)

### Priority 4: Edge Cases and Interactions

1. **Test chart boundary behaviors**
2. **Verify multi-axis scenarios**
3. **Test responsive behavior**
4. **Validate performance with rapid mouse movement**

### Success Criteria for Each Test

-   No console errors or warnings
-   Visual appearance matches documentation
-   Interactive behaviors work as described
-   API usage follows documented patterns
-   Enterprise features properly restricted
-   All documented properties exist and work

### Estimated Complexity/Time

-   **High complexity**: Format inheritance, custom renderers
-   **Medium complexity**: Basic enablement, styling, positioning
-   **Low complexity**: Simple property verification
-   **Total estimated time**: 45-60 minutes for thorough testing

## example-tester Agent Delegation Plan

For each example, provide the example-tester agent with:

1. **Example identification**: Name and path
2. **Documentation claims**: What features the example demonstrates
3. **Expected visual elements**: Crosshairs, labels, band highlights
4. **Interactive behaviors**: Hover effects, snapping, format changes
5. **Configuration patterns**: Specific API usage from documentation
6. **Success criteria**: No errors, correct rendering, proper interactions

The agent should validate:

-   Correct AG Charts API usage
-   Chart renders without errors
-   Interactive features work as documented
-   Visual appearance matches expectations
-   TypeScript types are properly used
-   Best practices are followed
