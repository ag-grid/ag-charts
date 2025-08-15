# PREVis Evaluation Report: Bubble with Custom Markers

## Example Overview

**Example:** bubble-with-custom-markers  
**URL:** https://localhost:4600/charts/gallery/examples/bubble-with-custom-markers  
**Evaluation Date:** 2025-08-13  
**Evaluator:** AG Charts Data Visualization Expert

## Executive Summary

This example demonstrates custom marker shapes in a bubble chart by visualizing rainfall data across seasons using raindrop-shaped markers. While the creative use of custom shapes adds visual appeal and thematic coherence, the example exhibits several readability and design issues that impact its effectiveness as a data visualization.

**Overall PREVis Score: 5.2/7** (Moderate readability with room for improvement)

## PREVis Dimensional Evaluation

### 1. Understandability (Score: 5.5/7)

**Strengths:**

-   Clear title "Rainfall" immediately communicates the subject matter
-   Subtitle provides good context: "Volume of rainfall in millimeters on rainy days by season"
-   Seasonal categorization is intuitive and familiar to most users
-   Custom raindrop shape reinforces the rainfall theme

**Weaknesses:**

-   No visible y-axis labels make it difficult to understand the scale of values
-   The relationship between marker size and rainfall volume is not explicitly communicated
-   Missing legend to explain the size-to-value mapping
-   The use of only x-position and size to encode data leaves the y-position seemingly random, which could confuse users

**Recommendations:**

-   Add y-axis labels or gridlines with values
-   Include a size legend showing example raindrops with their corresponding values
-   Consider using y-position meaningfully or clarifying why points are vertically distributed

### 2. Layout Clarity (Score: 4.8/7)

**Strengths:**

-   Clean, uncluttered design with good use of whitespace
-   Alternating background shading for seasons provides visual separation
-   Consistent spacing between seasonal sections

**Weaknesses:**

-   Significant overlapping of raindrop markers, especially in Autumn, making individual values hard to distinguish
-   Random vertical positioning creates visual noise without adding information
-   No clear visual hierarchy beyond the seasonal groupings
-   The density of markers in some areas creates visual clutter

**Recommendations:**

-   Implement a force-directed layout or jittering algorithm to reduce overlap
-   Consider using transparency or outline styles to improve visibility of overlapping markers
-   Add more structured vertical positioning (e.g., group by rainfall intensity ranges)

### 3. Readability of Data Values (Score: 4.5/7)

**Strengths:**

-   Crosshair tooltip shows precise values on hover (visible in code as formatted "mm" values)
-   Size encoding provides general magnitude comparison

**Weaknesses:**

-   No static value labels, requiring interaction to read specific values
-   Overlapping markers make it impossible to accurately assess individual marker sizes
-   Missing y-axis scale prevents quick value estimation
-   No reference lines or benchmarks for context (e.g., average rainfall)

**Recommendations:**

-   Add selective value labels for key data points (highest, lowest, median)
-   Include reference lines for average rainfall per season
-   Consider adding a data table or summary statistics panel
-   Implement smart label positioning for non-overlapping values

### 4. Readability of Data Patterns (Score: 6.0/7)

**Strengths:**

-   Seasonal patterns are clearly visible with Autumn showing notably higher rainfall
-   Size variation effectively communicates the range of rainfall values
-   Clustering patterns within seasons are apparent
-   The alternating background shading helps segment the data

**Weaknesses:**

-   Difficult to compare precise values between seasons due to overlap
-   No trend lines or statistical summaries to highlight patterns
-   Distribution within each season is hard to assess due to random y-positioning

**Recommendations:**

-   Add box plots or violin plots as overlays to show distribution
-   Include seasonal averages or medians as reference markers
-   Consider a companion chart showing aggregated seasonal totals

## Technical Implementation Analysis

### Positive Aspects:

1. **Creative Custom Shape Implementation:** The raindrop shape function uses cubic curves effectively
2. **Enterprise Features Usage:** Proper use of AG Charts Enterprise features
3. **Interactive Elements:** Crosshair with custom HTML renderer for tooltips
4. **Data Structure:** Clean, well-organized data with proper typing

### Areas for Improvement:

1. **Accessibility:** No aria-labels or keyboard navigation considerations
2. **Performance:** 200+ data points may cause rendering issues on slower devices
3. **Responsive Design:** Fixed size values may not scale well on different screen sizes
4. **Color Usage:** Single color scheme limits ability to encode additional dimensions

## Specific Recommendations for Enhancement

### Immediate Improvements (High Priority):

1. **Add Y-Axis Labels:** Enable y-axis labels to show rainfall values
2. **Reduce Overlap:** Implement better positioning algorithm to minimize marker overlap
3. **Add Legend:** Include a size legend explaining the marker size to value mapping
4. **Value Labels:** Add static labels for notable data points (max, min per season)

### Medium-Term Enhancements:

1. **Statistical Overlays:** Add mean/median lines per season
2. **Distribution Visualization:** Include box plots or density curves
3. **Interactive Features:** Add season filtering or zoom capabilities
4. **Color Encoding:** Use color gradient to encode rainfall intensity

### Long-Term Considerations:

1. **Alternative Visualizations:** Consider split view with detailed and overview panels
2. **Animation:** Animate transitions when filtering or changing views
3. **Comparative Analysis:** Add year-over-year comparison capability
4. **Export Options:** Enable data export and chart image download

## Comparison with Best Practices

### Adherence to Visualization Principles:

-   **Gestalt Principles:** Partial - good grouping by season, but poor figure-ground separation
-   **Pre-attentive Processing:** Limited - size differences are pre-attentive but overlap reduces effectiveness
-   **Data-Ink Ratio:** Good - minimal non-data elements, though custom shapes add decorative elements
-   **Cognitive Load:** Moderate - seasonal structure helps, but missing context increases load

### Industry Standards Comparison:

Compared to standard bubble charts in tools like Tableau or D3.js examples, this visualization:

-   Excels in thematic coherence with custom shapes
-   Falls short in standard readability features (legends, labels, scales)
-   Misses opportunities for advanced interactions common in modern visualizations

## Conclusion

The "Bubble with Custom Markers" example demonstrates creative use of AG Charts' custom shape capabilities and effectively communicates the rainfall theme through visual metaphor. However, it prioritizes aesthetic appeal over functional readability, resulting in a visualization that, while visually engaging, presents challenges for accurate data reading and pattern analysis.

The primary issues stem from marker overlap, missing axis labels, and lack of supporting elements like legends and reference lines. With the recommended improvements, this example could transform from a visually interesting demonstration to a highly effective and readable data visualization that showcases both AG Charts' technical capabilities and best practices in data visualization design.

**Final Assessment:** The example succeeds as a technical demonstration of custom markers but requires significant enhancements to meet professional data visualization standards for readability and usability.

## PREVis Scores Summary

-   **Understandability:** 5.5/7
-   **Layout Clarity:** 4.8/7
-   **Readability of Data Values:** 4.5/7
-   **Readability of Data Patterns:** 6.0/7
-   **Overall Perceived Readability:** 5.2/7

---

_Evaluated using PREVis (Perceived Readability Evaluation for Visualizations) framework_
