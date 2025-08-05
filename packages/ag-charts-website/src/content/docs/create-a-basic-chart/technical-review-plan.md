# Technical Review Plan: Create a Basic Chart

## Page Analysis Summary

### Chart Types/Features Covered

-   **Bar Series**: Basic bar chart creation
-   **Line Series**: Line chart for secondary data
-   **Combination Charts**: Combining bar and line series in a single chart
-   **Secondary Axes**: Configuring multiple Y-axes (left and right)

### Key APIs and Configuration Options Documented

1. **Core Chart Options**:

    - `container` (JavaScript only): HTML element for chart rendering
    - `data`: Array of data points
    - `series`: Array of series configurations
    - `AgCharts.create()`: JavaScript API for chart creation

2. **Series Configuration**:

    - `type`: Chart type ('bar', 'line')
    - `xKey`: Data property for X axis
    - `yKey`: Data property for Y axis
    - `yName`: Human-readable name for tooltips and legend

3. **Axes Configuration**:

    - `type`: Axis type ('category', 'number', 'time', 'log')
    - `position`: Axis placement ('top', 'bottom', 'left', 'right')
    - `keys`: Associates axis with specific series
    - `label.formatter`: Function for custom label formatting

4. **Styling Options**:
    - `title`: Chart title configuration
    - `subtitle`: Chart subtitle configuration
    - `legend`: Legend configuration (position, etc.)

### Examples Referenced and Their Purposes

1. **basic-example**: Simple bar chart demonstrating fundamental concepts
2. **combination-charts-example**: Adding a line series to create a combination chart
3. **second-series-example**: Configuring secondary axes for different data scales
4. **title-example**: Adding title and subtitle to the chart
5. **legend-example**: Configuring legend position
6. **format-series-example**: Using yName for human-readable series names
7. **second-series-formatted-example**: Formatting axis labels with units
8. **complete-formatted-example**: Final example combining all features
9. **theme-example**: Not referenced in documentation (needs investigation)

### Interactive Features Described

-   **Tooltips**: Hovering over chart elements displays data values
-   **Legend Interaction**: Clicking legend items toggles series visibility
-   **Hover Effects**: Chart elements respond to mouse hover

## Validation Targets

### TypeScript Interfaces to Verify

1. `AgChartOptions` - Main configuration interface
2. `AgBarSeriesOptions` - Bar series specific options
3. `AgLineSeriesOptions` - Line series specific options
4. `AgCategoryAxisOptions` - Category axis configuration
5. `AgNumberAxisOptions` - Number axis configuration
6. `AgChartTitleOptions` - Title configuration
7. `AgChartSubtitleOptions` - Subtitle configuration
8. `AgChartLegendOptions` - Legend configuration
9. `AgAxisLabelFormatterParams` - Formatter function parameters

### Implementation Files to Check

1. **Core Series Implementation**:

    - `packages/ag-charts-community/src/chart/series/cartesian/barSeries.ts`
    - `packages/ag-charts-community/src/chart/series/cartesian/lineSeries.ts`

2. **Axes Implementation**:

    - `packages/ag-charts-community/src/chart/axis/categoryAxis.ts`
    - `packages/ag-charts-community/src/chart/axis/numberAxis.ts`

3. **Chart Components**:
    - `packages/ag-charts-community/src/chart/chart.ts` (for title/subtitle)
    - `packages/ag-charts-community/src/chart/legend.ts`

### Examples to Test with Expected Behaviors

#### 1. basic-example

**Documentation Claims**:

-   Creates a simple bar chart
-   Uses container, data, and series properties
-   Displays ice cream sales data by month

**Expected Behaviors**:

-   Bar chart renders with months on X-axis
-   Ice cream sales values on Y-axis
-   Tooltips show values on hover
-   No legend (single series)

#### 2. combination-charts-example

**Documentation Claims**:

-   Adds line series to existing bar chart
-   Shows both iceCreamSales (bar) and avgTemp (line) data

**Expected Behaviors**:

-   Both bar and line series visible
-   Legend appears automatically with two series
-   Same Y-axis scale for both series
-   Tooltips work for both series types

#### 3. second-series-example

**Documentation Claims**:

-   Configures three axes: bottom, left, right
-   Associates iceCreamSales with left axis
-   Associates avgTemp with right axis

**Expected Behaviors**:

-   Three axes visible (bottom category, left and right number)
-   Bar series uses left Y-axis scale
-   Line series uses right Y-axis scale
-   Different scales on left vs right axes

#### 4. title-example

**Documentation Claims**:

-   Adds title "Ice Cream Sales"
-   Adds subtitle "Data from 2022"

**Expected Behaviors**:

-   Title appears at top of chart
-   Subtitle appears below title
-   Both are centered by default

#### 5. legend-example

**Documentation Claims**:

-   Positions legend on the right side
-   Legend should show both series

**Expected Behaviors**:

-   Legend moves from bottom to right side
-   Legend items clickable to toggle series
-   Legend shows correct series names/colors

#### 6. format-series-example

**Documentation Claims**:

-   Uses yName to provide human-readable series name
-   Legend and tooltips use yName instead of yKey

**Expected Behaviors**:

-   Legend shows "Ice Cream Sales" instead of "iceCreamSales"
-   Tooltips display formatted name
-   Second series still shows raw key name

#### 7. second-series-formatted-example

**Documentation Claims**:

-   Formats right axis labels with '°C' suffix
-   Uses formatter function on axis label

**Expected Behaviors**:

-   Right axis shows temperature values with "°C"
-   Left axis unchanged
-   Formatter receives params object with value

#### 8. complete-formatted-example

**Documentation Claims**:

-   Combines all features from tutorial
-   Interactive legend for toggling series
-   Formatted axes and human-readable names

**Expected Behaviors**:

-   All formatting applied correctly
-   Legend interaction works
-   Tooltips show formatted values
-   Both axes properly formatted

### User Interactions to Validate

1. **Hover Interactions**:

    - Hover over bars → tooltips with values
    - Hover over line points → tooltips with values
    - Hover between data points → no tooltips
    - Rapid hover across elements → smooth tooltip updates

2. **Legend Interactions**:

    - Click legend items → toggle series visibility
    - Hover legend items → visual feedback
    - Legend position affects chart layout

3. **Responsive Behavior**:
    - Window resize → chart adapts
    - Mobile viewport → chart remains functional

### Visual States to Screenshot and Analyze

1. **Default states** for each example
2. **Hover states** showing tooltips
3. **Legend interaction states** (series toggled off)
4. **Different viewport sizes** (desktop, tablet, mobile)
5. **Error states** if any configuration issues

## Known Exceptions

No existing exceptions file found for this page.

## Execution Plan

### Priority 1: Core Functionality Validation

1. **Verify basic chart creation** (basic-example)

    - Test chart renders correctly
    - Validate data binding works
    - Check console for errors

2. **Test combination charts** (combination-charts-example)

    - Verify multiple series render
    - Check legend appears automatically
    - Test series interaction

3. **Validate axes configuration** (second-series-example)
    - Confirm three axes render
    - Verify correct axis associations
    - Check scale independence

### Priority 2: API Contract Verification

1. **Cross-reference TypeScript definitions**

    - Check all documented properties exist
    - Verify property types match
    - Confirm optional vs required

2. **Validate implementation defaults**
    - Check actual default behaviors
    - Verify legend auto-enable logic
    - Test formatter function signatures

### Priority 3: Styling and Formatting

1. **Test title/subtitle** (title-example)

    - Verify rendering and positioning
    - Check text property usage

2. **Validate legend configuration** (legend-example)

    - Test position changes
    - Verify interaction behavior

3. **Check series naming** (format-series-example)

    - Confirm yName usage in legend/tooltips
    - Test multiple series naming

4. **Test axis formatting** (second-series-formatted-example)
    - Verify formatter function works
    - Check parameter structure

### Priority 4: Comprehensive Testing

1. **Full integration test** (complete-formatted-example)

    - All features work together
    - No conflicts between configurations
    - Performance is acceptable

2. **Edge case testing**
    - Empty data handling
    - Missing configuration properties
    - Browser compatibility

### Estimated Complexity

-   **High complexity**: Multi-series axes configuration, formatter functions
-   **Medium complexity**: Basic chart setup, legend/title configuration
-   **Low complexity**: Simple property settings

### Delegation Plan for example-tester Agent

For each example, provide the example-tester agent with:

1. **Example Path**: `packages/ag-charts-website/src/content/docs/create-a-basic-chart/_examples/[example-name]/`

2. **Specific Validation Requirements**:

    - Chart type verification (bar, line, or combination)
    - Data binding correctness
    - Interactive features (tooltips, legend clicks)
    - Console error checking
    - TypeScript type safety
    - Visual rendering accuracy

3. **Expected Features by Example**:

    - basic-example: Single bar series, tooltips
    - combination-charts-example: Two series, auto-legend
    - second-series-example: Three axes, dual Y-scales
    - title-example: Title/subtitle rendering
    - legend-example: Right-positioned legend
    - format-series-example: Human-readable series names
    - second-series-formatted-example: Axis label formatting
    - complete-formatted-example: All features integrated

4. **Key Testing Points**:
    - Verify AG Charts API usage patterns
    - Check for deprecated API usage
    - Validate event handling
    - Test responsive behavior
    - Confirm accessibility features
