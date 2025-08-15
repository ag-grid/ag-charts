# PREVis Evaluation: range-area-with-labels

## Overall Score: 7.5/10

### Effectiveness (8/10)

**Strengths:**

-   Chart effectively shows property price index divergence between different housing types
-   Range areas clearly visualize the spread between property types over time
-   Labels strategically placed at start, middle, and end points show spread values (Δ notation)
-   Two overlapping range areas create a comprehensive view of the price hierarchy

**Weaknesses:**

-   Label placement could be more intuitive - the delta values appear to float without clear connection to specific data points
-   Missing visual cues to connect labels to their corresponding ranges

### Understandability (7/10)

**Strengths:**

-   Clear title and subtitle explain the chart's purpose
-   Legend identifies the two range comparisons
-   Axes are well-labeled with appropriate units
-   Tooltip provides comprehensive information including date, values, and spread

**Weaknesses:**

-   The relationship between the two range areas could be clearer - it's not immediately obvious that they share the "Terraced houses" boundary
-   Delta notation (Δ) might not be universally understood without explanation
-   Y-axis on the right side is less conventional and may cause initial confusion

### Encoding (8/10)

**Strengths:**

-   Range area is appropriate for showing value ranges over time
-   Color differentiation between the two ranges is clear
-   Time series on x-axis is properly encoded as continuous time
-   Fill opacity (0.35) allows overlapping areas to remain visible

**Weaknesses:**

-   The shared boundary between ranges (Terraced houses) isn't visually emphasized
-   Labels could use additional encoding (size, color) to indicate magnitude of spread

### Pattern Detection (7/10)

**Strengths:**

-   Trend of widening spreads over time is visible
-   Seasonal patterns in property price divergence can be observed
-   Overall upward trend in all property types is clear

**Weaknesses:**

-   Labels only at three points limit pattern detection for spread changes
-   No visual indicators for significant events or trend changes
-   Overlapping areas make it harder to track individual range patterns

### Accuracy (8/10)

**Strengths:**

-   Data accurately represents UK property price indices
-   Precise values available through tooltips
-   Y-axis scale (100-160) appropriately frames the data
-   Source attribution adds credibility

**Weaknesses:**

-   Duplicate November 2020, 2021, and 2022 entries in data suggest data quality issues
-   Fixed decimal precision in labels may obscure small but meaningful differences

### Redundancy (7/10)

**Strengths:**

-   Labels complement rather than duplicate legend information
-   Tooltip provides additional detail beyond visible elements
-   Multiple encoding methods (position, area, color) reinforce the data

**Weaknesses:**

-   Some redundancy between delta labels and what can be visually inferred from the ranges
-   Both tooltip and labels show spread values, creating some duplication

## Recommendations for Improvement

1. **Enhanced Label Connection**: Add leader lines or visual connectors between labels and their corresponding spread points

2. **Highlight Shared Boundary**: Emphasize the "Terraced houses" line that serves as the boundary between both ranges

3. **More Dynamic Labeling**: Consider showing labels for notable events (maximum/minimum spreads, trend reversals) rather than just fixed positions

4. **Interactive Features**: Add ability to show/hide labels or adjust label density based on user preference

5. **Data Quality**: Fix duplicate date entries in the dataset

6. **Visual Hierarchy**: Consider using stronger visual differentiation (stroke width, opacity) to distinguish between the two range areas

7. **Context Annotations**: Add annotations for significant market events that influenced property price divergence

## AG Charts Feature Utilization

**Well-utilized features:**

-   Custom tooltip renderer with structured data display
-   Label formatter with conditional logic
-   Theme overrides for series styling
-   Time axis with custom formatting

**Underutilized opportunities:**

-   Crosshairs for better value reading
-   Annotations for market events
-   Animation on initial load
-   Interactive legend to show/hide ranges
