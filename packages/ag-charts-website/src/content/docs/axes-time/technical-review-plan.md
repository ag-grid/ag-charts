# Technical Review Plan - Time Axis Documentation

## Page Analysis Summary

### Features Covered

-   Three types of time axes: Unit Time, Ordinal Time, and Continuous Time
-   Time data handling with `number` (Unix timestamps) and `Date` objects
-   Custom unit configuration for Unit Time Axis (including weekly data)
-   Time intervals for customizing axis ticks, grid lines, and labels
-   Parent level labels for hierarchical time display
-   Formatting options for time labels

### Key APIs and Configuration Options Documented

-   `AgUnitTimeAxisOptions` - Unit Time Axis configuration
-   `AgOrdinalTimeAxisOptions` - Ordinal Time Axis configuration
-   `AgTimeAxisOptions` - Continuous Time Axis configuration
-   `AgTimeInterval` and `AgTimeIntervalUnit` - Time interval configuration
-   `unit` property for Unit Time Axis (with custom `step` and `epoch`)
-   `interval.step` property for controlling tick/grid spacing
-   `parentLevel` configuration for hierarchical time labels

### Examples Referenced

1. **time-vs-unit-time-vs-ordinal-time** - Demonstrates differences between three axis types
2. **unit-time-unit** - Shows custom unit configuration for weekly data
3. **time-interval** - Demonstrates interval customization
4. **axis-parent-level** - Shows parent level functionality
5. **axis-parent-level-customisation** - Demonstrates parent level customization

### Interactive Features Described

-   Dynamic zooming with parent level adjustments
-   Switching between different time axis types
-   Time-based data visualization with proper spacing
-   Hierarchical time label display

## Validation Targets

### TypeScript Interfaces to Verify

1. `AgUnitTimeAxisOptions` in `packages/ag-charts-types/src/`
2. `AgOrdinalTimeAxisOptions` in `packages/ag-charts-types/src/`
3. `AgTimeAxisOptions` in `packages/ag-charts-types/src/`
4. `AgTimeInterval` type definition
5. `AgTimeIntervalUnit` interface

### Implementation Files to Check

1. Unit Time Axis implementation in `packages/ag-charts-community/src/`
2. Ordinal Time Axis implementation
3. Continuous Time Axis implementation
4. Time interval handling logic
5. Parent level rendering logic
6. Default values for each axis type

### Examples to Test with Expected Behaviors

#### time-vs-unit-time-vs-ordinal-time

**Documentation claims:**

-   Shows difference between three time axis types
-   Unit Time: Shows evenly spaced bands for each time unit
-   Ordinal Time: Shows only provided values, ignoring time intervals
-   Continuous Time: Shows data on a continuous scale
-   Missing months (June-September) should be handled differently by each type

**Expected behaviors:**

-   Unit Time: All months Jan-Dec shown with even spacing
-   Ordinal Time: Only months with data shown (no gaps for missing months)
-   Continuous Time: Proportional spacing based on actual time intervals
-   Interactive switching between axis types via buttons
-   Bar chart visualization with school absence data

#### unit-time-unit

**Documentation claims:**

-   Demonstrates custom unit configuration for weekly data
-   Uses `unit: { unit: 'day', step: 7, epoch: new Date(2024, 0, 1) }`
-   Formatter used to display week numbers
-   Week starts on Monday due to epoch setting

**Expected behaviors:**

-   Data grouped into weekly buckets
-   Week numbers displayed on x-axis
-   Weeks start on Monday (Jan 1, 2024)
-   Proper handling of partial weeks
-   Bar chart showing weekly aggregated data

#### time-interval

**Documentation claims:**

-   Shows customization of axis intervals
-   Demonstrates both simple string interval and complex object interval
-   Controls spacing of ticks, grid lines, and labels

**Expected behaviors:**

-   Monthly interval spacing visible
-   Grid lines aligned with month boundaries
-   Custom weekly intervals (7-day steps) when configured
-   Proper epoch handling for interval alignment

#### axis-parent-level

**Documentation claims:**

-   Parent level enabled by default for Unit Time Axis
-   Shows hierarchical labels (e.g., months with year parent)
-   Dynamically adjusts as user zooms
-   Bold formatting for parent level

**Expected behaviors:**

-   Day-level data with month parent labels
-   Parent labels in bold
-   Zoom interaction changes label hierarchy
-   Smooth transition between zoom levels
-   Parent ticks visible

#### axis-parent-level-customisation

**Documentation claims:**

-   Custom formatting for parent level labels
-   Different tick configurations for parent vs child
-   Multi-line label formatting
-   Inherits from base axis options but can override

**Expected behaviors:**

-   No ticks for regular labels (width: 0)
-   Visible ticks for parent level (width: 1)
-   Day format: '%e' (day of month)
-   Parent month format: '%e\n%b' (day and month on separate lines)
-   Parent year format: '%b\n%Y' (month and year on separate lines)

### User Interactions to Validate

1. Button clicks to switch between axis types
2. Zoom interactions on time axes
3. Hover over chart elements for tooltips
4. Pan interactions if supported
5. Responsive behavior on window resize

### Visual States to Screenshot

1. Default state of each example
2. Each axis type variant (Unit, Ordinal, Continuous)
3. Zoomed states showing parent level changes
4. Hover states with tooltips
5. Different viewport sizes for responsive testing

## Known Exceptions

No existing technical review exceptions found for this page.

## Execution Plan

### Priority 1 - Critical API Validation

1. Verify all three axis type configurations exist in TypeScript definitions
2. Check implementation files for correct axis type handling
3. Validate `AgTimeInterval` and `AgTimeIntervalUnit` interfaces
4. Confirm default values match documentation claims

### Priority 2 - Example Functionality Testing

1. **Delegate to example-tester agent:**
    - Test time-vs-unit-time-vs-ordinal-time example
        - Verify three axis types render correctly
        - Check missing month handling
        - Validate button interactions
    - Test unit-time-unit example
        - Verify weekly grouping works
        - Check formatter output
        - Validate epoch handling
    - Test time-interval example
        - Verify interval spacing
        - Check grid line alignment
    - Test parent level examples
        - Verify hierarchical labels
        - Check zoom interactions
        - Validate formatting

### Priority 3 - Visual and Interaction Testing

1. Screenshot all axis type variations
2. Capture zoom states and parent level transitions
3. Test hover interactions and tooltips
4. Verify responsive behavior
5. Check for console errors during interactions

### Priority 4 - Content Completeness

1. Verify all configuration options are documented
2. Check for missing use cases
3. Validate cross-references to related documentation
4. Ensure examples cover all documented features

### Success Criteria

-   All TypeScript interfaces match documentation
-   Examples demonstrate claimed behaviors
-   No console errors during interactions
-   Visual rendering matches descriptions
-   Interactive features work as documented
-   Parent level functionality operates correctly
