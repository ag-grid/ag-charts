# PREVis Evaluation Report: Calendar Heatmap

## Example Overview

**Chart Type:** Heatmap (Calendar-style)  
**Dataset:** Weekly Step Count Data (12 months x 4 weeks)  
**Purpose:** Visualize activity patterns across weeks and months  
**Evaluation Date:** August 13, 2025

## PREVis Scale Assessment

### 1. Understandability (Score: 5/10)

**Strengths:**

-   Simple title "Weekly Step Count" provides basic context
-   Grid layout with months and weeks is somewhat intuitive
-   Color intensity correlates with step count magnitude

**Areas for Improvement:**

-   Title misleadingly suggests this shows calendar weeks, but data structure shows 4 weeks per month uniformly (not actual calendar)
-   No legend or scale to interpret color values
-   Week numbering (1-4) doesn't align with actual calendar weeks
-   Missing context about what constitutes good/bad step counts
-   No indication of data aggregation method (weekly totals vs. averages)

**Recommendations:**

-   Clarify that this is a simplified 4-week-per-month view, not actual calendar weeks
-   Add gradient legend with step count ranges
-   Consider renaming to "Monthly Step Count by Week Period" for accuracy
-   Add reference lines or annotations for recommended activity levels (e.g., 70,000 steps/week)
-   Include subtitle explaining the data structure

### 2. Layout Clarity (Score: 6/10)

**Strengths:**

-   Clean grid structure without visual clutter
-   Months on top axis follows conventional heatmap patterns
-   Minimal design with disabled gridlines and labels
-   Appropriate use of whitespace

**Areas for Improvement:**

-   Left axis (weeks) has labels disabled, making it hard to identify specific weeks
-   No visual separation between quarters or seasons
-   Cell stroke width of 1 might be too subtle on some displays
-   Missing any form of data density indication

**Recommendations:**

-   Enable week labels on left axis for better navigation
-   Add subtle visual grouping for quarters
-   Consider slightly thicker borders or alternating background
-   Add row/column headers with summary statistics

### 3. Readability of Data Values (Score: 3/10)

**Strengths:**

-   Tooltip provides exact step count values on hover
-   Color encoding gives general magnitude sense

**Areas for Improvement:**

-   No direct value display anywhere in the visualization
-   No legend to translate colors to step ranges
-   Gradient legend explicitly disabled, removing crucial reference
-   Color scale lacks any numerical anchors
-   Impossible to determine actual values without interaction
-   No indication of data range (min/max values)

**Recommendations:**

-   Enable gradient legend immediately
-   Add value labels for highest/lowest cells
-   Include data range in subtitle or annotation
-   Consider optional value display mode
-   Add percentile or quartile indicators

### 4. Readability of Data Patterns (Score: 7/10)

**Strengths:**

-   Can identify relative high/low activity periods through color
-   Seasonal patterns somewhat visible (e.g., September week 2 peak at 81,668 steps)
-   Month-to-month comparisons are possible
-   Outliers stand out through color contrast (e.g., August week 2 low at 53,583)

**Areas for Improvement:**

-   Without a legend, pattern interpretation is purely relative
-   No trend indicators or moving averages
-   Difficult to identify if activity is increasing/decreasing over time
-   Week-to-week patterns within months are hard to discern
-   No statistical context for understanding variability

**Recommendations:**

-   Add monthly or quarterly averages as reference
-   Include trend line or year-over-year comparison
-   Highlight exceptional weeks with annotations
-   Consider sparklines for monthly trends
-   Add variance or consistency metrics

## Overall Perceptual Effectiveness

### Visual Encoding Assessment

-   **Color:** Poorly calibrated without legend or reference points
-   **Position:** Good use of 2D grid for temporal organization
-   **Size:** Uniform cell size appropriate but could vary by data importance
-   **Interaction:** Basic tooltip implementation, but insufficient for primary data access

### Cognitive Load Analysis

-   **Low:** Identifying relative highs and lows
-   **Medium:** Understanding monthly patterns
-   **High:** Extracting any quantitative information, making comparisons, understanding actual performance

### Task Suitability

-   **Excellent for:** None - lacks basic requirements for most tasks
-   **Good for:** Identifying relative activity patterns
-   **Limited for:** Quantitative analysis, goal tracking, performance assessment, trend identification

## Technical Implementation Quality

### AG Charts Feature Utilization

-   Underutilizes available features (gradient legend disabled)
-   Basic configuration without customization
-   No use of advanced features like annotations or reference lines
-   Minimal theme customization

### Performance Considerations

-   Small dataset (48 data points) performs well
-   No rendering optimizations needed
-   Could handle much more complex visualizations

## Data Design Analysis

### Dataset Issues

-   Unrealistic uniform 4-weeks-per-month structure
-   Step counts seem arbitrary (all between 53,583-81,668)
-   No missing data or real-world complexity
-   Lacks temporal context (what year? what days of week?)

### Missed Opportunities

-   Could show actual calendar structure with proper week numbers
-   Could include daily breakdowns for richer patterns
-   Could show goal attainment or comparative benchmarks
-   Could include metadata like weather, seasons, or events

## Final Score: 5.25/10

### Summary

This calendar heatmap fails to meet basic visualization standards due to the disabled gradient legend and lack of quantitative references. While the underlying structure could support activity pattern analysis, the current implementation provides minimal value beyond showing relative differences in step counts. The misleading "calendar" framing with artificial 4-week months further reduces its effectiveness.

### Critical Issues

1. **CRITICAL:** Gradient legend is disabled, removing essential reference
2. **CRITICAL:** No value scale or numerical references anywhere
3. **HIGH:** Misleading calendar metaphor with non-calendar data structure
4. **HIGH:** Week labels disabled, reducing navigation ability
5. **MEDIUM:** No context for interpreting step count values

### Priority Improvements

1. **Immediate:** Enable gradient legend with clear value ranges
2. **Immediate:** Add accurate title reflecting 4-week structure
3. **High:** Enable week labels on Y-axis
4. **High:** Add reference values for healthy activity levels
5. **Medium:** Include monthly/quarterly summaries
6. **Medium:** Add value labels for extremes

### Best Practices Violated

-   Removing essential legend components
-   Misleading visualization metaphor
-   Insufficient labeling and context
-   No quantitative reference points
-   Disabled axis labels reducing usability

### Learning Opportunities

This example currently demonstrates what NOT to do:

-   Never disable gradient legends for continuous color scales
-   Always provide quantitative context for data
-   Ensure visualization metaphors match data structure
-   Include sufficient labeling for navigation
-   Provide multiple levels of detail (overview + details)

### Recommendation

This example needs significant revision before it can serve as a good demonstration of AG Charts capabilities. The gradient legend must be enabled, proper labeling added, and the calendar metaphor either properly implemented or abandoned in favor of a more accurate representation. Consider using actual calendar data with proper week structures, or reframe as a simple month-by-week period heatmap with appropriate context and legends.
