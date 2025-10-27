# Technical Review Plan - Axis Position

## Page Analysis Summary

### Chart Types/Features Covered

-   **Axis Positioning**: Control where axes are rendered (top, bottom, left, right)
-   **Axis Crossing Point**: Using `crossAt` to position axes at specific values
-   **Secondary Axes**: Multiple axes on the same edge or opposite edges
-   **Sticky Behavior**: Axis behavior when cross position is outside domain

### Key APIs and Configuration Options Documented

1. **position** property:

    - Values: `'top'`, `'bottom'`, `'left'`, `'right'`
    - Controls axis placement on chart edges
    - Default: horizontal axes at `'bottom'`, vertical axes at `'left'`

2. **crossAt** property:

    - Type: `{ value: number | Date | string | string[], sticky?: boolean }`
    - Allows axis to intersect perpendicular axis at specific value
    - Default `sticky: true` keeps axis in view when cross value is out of range

3. **keys** property:
    - Associates series data with specific axes
    - Used for multi-axis charts

### Examples Referenced

1. **axis-position-basic**: Demonstrates axis placement with position property
2. **axis-cross-at**: Shows crossAt feature with centered axes

### Interactive Features Described

-   Axis positioning at chart edges
-   Axis crossing at specified values
-   Sticky behavior during zoom (referenced)
-   Multiple axes on same edge

## Validation Targets

### TypeScript Interfaces to Verify

1. **AgCartesianAxisPosition** type in `/packages/ag-charts-types/src/chart/cartesianOptions.ts`

    - Should be: `type AgCartesianAxisPosition = 'top' | 'right' | 'bottom' | 'left'` (line 323)
    - Used by: `position` property in `AgBaseCartesianAxisOptions`

2. **AgBaseCartesianAxisOptions** interface in `/packages/ag-charts-types/src/chart/cartesianOptions.ts`

    - `position?: AgCartesianAxisPosition` (line 40)
    - `crossAt?: AgCartesianAxisCrossAt` (line 42)
    - `keys?: string[]` (line 38)

3. **AgCartesianAxisCrossAt** interface in `/packages/ag-charts-types/src/chart/cartesianOptions.ts` (lines 60-69)
    - `value: number | Date | string | string[]`
    - `sticky?: boolean` (default: true)

### Implementation Files to Check

-   `/packages/ag-charts-community/src/chart/axis/` - Axis positioning logic
-   `/packages/ag-charts-community/src/chart/cartesianChart.ts` - Axis placement implementation
-   Default values for `position` and `sticky`

### Examples to Test with Expected Behaviors

#### 1. axis-position-basic

**Documentation Claims:**

-   Bottom axis with `position: 'bottom'` showing Quarter
-   Left axis with `position: 'left'` for revenue
-   Right axis with `position: 'right'` for profit margin
-   Multiple axes on different edges

**Expected Configuration Pattern**:

```js
axes: {
    x: { type: 'category', position: 'bottom', title: { text: 'Quarter' } },
    y: { type: 'number', position: 'left', keys: ['revenue'], title: { text: 'Revenue ($M)' } },
    ySecondary: { type: 'number', position: 'right', keys: ['profitMargin'], title: { text: 'Profit Margin (%)' } },
};
```

**Expected Behaviors:**

-   Three axes render at specified positions (bottom, left, right)
-   Category axis appears at bottom of chart
-   Two number axes on left and right sides
-   Axis titles display correctly at each position
-   Series data binds correctly to respective axes via `keys`
-   Left axis scales for revenue data
-   Right axis scales for profit margin data

**Visual Verification:**

-   Bottom axis: horizontal, shows category labels
-   Left axis: vertical, shows revenue scale
-   Right axis: vertical, shows profit margin scale
-   Axes don't overlap or obscure chart content
-   Tick marks face inward on all axes

#### 2. axis-cross-at

**Documentation Claims:**

-   Left axis positioned at `value: 0` on bottom axis scale
-   Bottom axis positioned at `value: 0` on left axis scale
-   Creates centered coordinate system
-   Axes intersect at origin (0, 0)
-   `sticky` behavior when zooming (axis sticks to edge when value leaves range)

**Expected Configuration Pattern**:

```js
axes: {
    y: { type: 'number', position: 'left', crossAt: { value: 0 } },
    x: { type: 'number', position: 'bottom', crossAt: { value: 0 } },
};
```

**Expected Behaviors:**

-   Both axes cross at (0, 0) point
-   Axes render through center of chart (not at edges)
-   Quadrant-style coordinate system visible
-   Both positive and negative values visible on both axes
-   Default `sticky: true` keeps axes in view
-   `crossAt.value` type matches perpendicular axis domain type

**Visual Verification:**

-   Axes intersect at chart center (where both = 0)
-   Four quadrants clearly defined
-   Axis lines visible through data area
-   Tick marks and labels render correctly
-   Chart content distributed across all quadrants

### User Interactions to Validate

1. **Axis Positioning**:

    - Verify axes render at correct edges
    - Test with all four position values
    - Check multiple axes on same edge behavior

2. **Cross At Interaction** (if zoom available):

    - Zoom to move crossAt value out of range
    - Verify axis sticks to edge (sticky: true)
    - Test with `sticky: false` if example provides it

3. **Multi-Axis Binding**:
    - Hover over series to verify correct axis association
    - Check that series use correct axis scales

### Visual States to Screenshot

1. **axis-position-basic**:

    - Full chart showing all three axes at their positions
    - Clear view of axis titles and labels
    - Series data visible on both scales

2. **axis-cross-at**:
    - Full chart showing centered axes
    - Clear intersection point at (0, 0)
    - All four quadrants visible with data

## Known Exceptions

No existing technical-review-exceptions.md file found for this page.

## Execution Plan

### Priority 1: API Contract Validation

1. Verify `position` property accepts only: `'top'`, `'right'`, `'bottom'`, `'left'`
2. Confirm `crossAt` structure matches `AgCartesianAxisCrossAt` interface
3. Validate `crossAt.value` accepts multiple types (number, Date, string, string[])
4. Verify `sticky` property defaults to `true`
5. Check that `keys` property exists for axis-series binding

### Priority 2: Example Testing (Delegate to example-tester)

1. **axis-position-basic**:

    - Verify three axes render at correct positions
    - Test axis-series binding via `keys` property
    - Validate titles display at each axis position
    - Check that series data scales correctly per axis

2. **axis-cross-at**:
    - Verify axes cross at (0, 0)
    - Test centered coordinate system rendering
    - Validate both positive and negative ranges
    - Check axis visibility through chart center

### Priority 3: Interactive Testing

1. Test hover interactions near axes
2. Verify tooltip behavior with multiple axes
3. If zoom available, test sticky behavior
4. Test responsive behavior with axis positioning

### Priority 4: Implementation Verification

1. Check default `position` values for horizontal/vertical axes
2. Verify `sticky` default value is `true`
3. Confirm perpendicular axis value type compatibility
4. Validate zoom interaction with `crossAt`

### Priority 5: Documentation Completeness

1. Verify all position values documented
2. Check crossAt property documentation completeness
3. Ensure sticky behavior fully explained
4. Validate link to Secondary Axes page works
5. Validate link to Zoom page works (referenced for sticky)

## Delegation Plan for example-tester Agent

### axis-position-basic

-   **Task**: Validate multi-position axis rendering
-   **Expected from docs**: Three axes at bottom, left, and right positions with titles
-   **Validate**: Correct positioning, axis-series binding via keys, proper scaling
-   **Check for**: Axis titles visible, correct tick marks, no rendering conflicts

### axis-cross-at

-   **Task**: Test centered axis crossing feature
-   **Expected from docs**: Axes intersect at (0, 0), creating quadrant system
-   **Validate**: Axes render through chart center, both positive/negative values
-   **Check for**: Proper intersection point, axis lines through data area

## Success Criteria

1. All documented position values work correctly
2. `crossAt` feature creates proper axis intersections
3. Default sticky behavior is `true` and works as described
4. Multiple axes can be positioned on different edges
5. Axes render cleanly without overlap or obscuring content
6. Cross values match perpendicular axis domain types
7. No console errors during normal usage
8. Examples demonstrate features claimed in documentation
