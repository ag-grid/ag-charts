# PREVis Assessment: treemap-with-nesting

## Overall Score: 6/10

## Dimension Scores

### 1. Data-Pixel Ratio: 5/10

-   **Strength**: Efficient use of screen space with nested rectangles representing hierarchical data
-   **Weakness**: Only 29 data points shown with minimal quantitative information (no size values)
-   **Issue**: No numeric values or sizes associated with nodes, making it purely a hierarchy visualization

### 2. Data Integrity: 4/10

-   **Strength**: Hierarchical relationships are preserved correctly
-   **Weakness**: No actual data values shown - purely structural representation
-   **Issue**: Missing critical information like employee count, department size, or other metrics that would make this a true data visualization

### 3. Spatial Stability: 7/10

-   **Strength**: Layout is stable and doesn't change during interaction
-   **Weakness**: Nested groups could benefit from clearer boundaries
-   **Note**: Good use of consistent rectangular partitioning

### 4. Ease of Learning: 6/10

-   **Strength**: Familiar treemap metaphor for hierarchical data
-   **Weakness**: Purpose unclear without size values - looks like an org chart but functions as a simple treemap
-   **Issue**: No legend or explanation of what the visualization represents

### 5. User Focus Guidance: 5/10

-   **Strength**: Clear color distinction between two main branches (blue vs orange)
-   **Weakness**: Semi-transparent group boundaries make hierarchy harder to follow
-   **Issue**: No visual hierarchy beyond color - all text appears equal weight

### 6. Intentional Interaction: 6/10

-   **Strength**: Basic hover tooltips provide node names
-   **Weakness**: No drill-down capability or meaningful interaction beyond hover
-   **Issue**: Could benefit from click-to-zoom or breadcrumb navigation for deeper exploration

### 7. Data Transformation Clarity: 4/10

-   **Strength**: Hierarchical structure is clear
-   **Weakness**: No indication of how rectangles are sized (appears arbitrary)
-   **Critical Issue**: Without size values, the treemap algorithm appears to use default sizing

### 8. Visual Hierarchy: 6/10

-   **Strength**: Two-color scheme helps distinguish major branches
-   **Weakness**: Text hierarchy not differentiated - all labels same size
-   **Issue**: Parent labels compete visually with child labels

### 9. Semantic Consistency: 7/10

-   **Strength**: Consistent use of rectangles for all nodes
-   **Weakness**: Color scheme doesn't convey meaning beyond top-level distinction
-   **Note**: Good consistency in visual treatment

### 10. Perceptual Intuitiveness: 5/10

-   **Strength**: Nested rectangles naturally suggest containment
-   **Weakness**: Without size encoding, loses main benefit of treemap visualization
-   **Issue**: Viewers expect area to encode a value in treemaps

## Critical Issues

1. **Missing Quantitative Data**: This treemap shows only structure, not quantities - defeating the primary purpose of treemap visualizations
2. **Weak Visual Hierarchy**: Semi-transparent group borders (fillOpacity: 0.5) make nested levels hard to distinguish
3. **Limited Interactivity**: No exploration features beyond basic hover
4. **Unclear Purpose**: Title says "Organisation Chart" but uses treemap instead of more appropriate org chart visualization

## Recommendations for Improvement

### High Priority

1. **Add meaningful size data**: Include employee counts, budget, or other metrics to justify treemap choice
2. **Improve visual hierarchy**: Use stronger borders, better color gradients, or shading for depth
3. **Enhanced tooltips**: Show full path, size values, and additional context on hover

### Medium Priority

1. **Add zoom/drill-down**: Allow users to focus on specific branches
2. **Implement breadcrumb navigation**: Show current position in hierarchy
3. **Use color meaningfully**: Encode department type, performance, or other attributes

### Low Priority

1. **Add animation**: Smooth transitions when data updates
2. **Include a legend**: Explain color coding and size encoding
3. **Offer alternative views**: Toggle between treemap and traditional org chart

## Data Enhancement Suggestions

Current data structure only includes names and hierarchy. Consider adding:

-   `size`: Number of employees or budget
-   `department`: Categorical data for color coding
-   `level`: Seniority level for additional visual encoding
-   `metrics`: Performance indicators or other KPIs

## Conclusion

This example demonstrates basic treemap nesting but fails to leverage the visualization's strengths. Without quantitative size encoding, it's essentially a less effective org chart. The semi-transparent styling further reduces clarity. To be effective, this example needs real data values and stronger visual design to justify the treemap approach over traditional hierarchical visualizations.
