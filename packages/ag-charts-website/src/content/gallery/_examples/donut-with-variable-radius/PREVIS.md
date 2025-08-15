# PREVis Analysis: Donut with Variable Radius

## Overall Assessment

This example demonstrates an innovative donut chart variant where segment radius varies proportionally to the data values, creating a distinctive visualization that combines angle and radius to encode two dimensions of information. The variable radius feature adds visual weight to larger values while maintaining the familiar donut chart structure.

## PREVis Scores

### Purpose Clarity: 8/10

**Strengths:**

-   Clear title "Oxford Street Selfridges" and subtitle "Total Product Value by Department" immediately establish context
-   Central "Total Value £40M" label provides aggregated context
-   Variable radius effectively emphasizes value differences beyond just angular size
-   Business context (retail departments) is relatable and meaningful

**Areas for improvement:**

-   The variable radius concept might not be immediately obvious to all users
-   Could benefit from a brief explanation of how the visualization works

### Readability: 7/10

**Strengths:**

-   Clean typography with good contrast on dark background
-   Well-positioned callout labels avoid overlapping
-   Consistent color palette with distinct segment colors
-   Appropriate spacing between elements

**Areas for improvement:**

-   Dark background may reduce accessibility in some contexts
-   Some smaller segments (like "Decor") are harder to read due to size
-   The variable radius can make precise value comparison challenging

### Engagement: 9/10

**Strengths:**

-   Variable radius creates visual intrigue and draws attention
-   Interactive tooltips provide detailed information on hover
-   Smooth highlight effects enhance user engagement
-   The combination of angle and radius encoding is visually compelling
-   Well-crafted business scenario creates narrative interest

**Areas for improvement:**

-   Could benefit from subtle animations during initial render

### Visual Hierarchy: 8/10

**Strengths:**

-   Title and subtitle establish clear hierarchy
-   Central total value acts as focal point
-   Larger radius segments naturally draw more attention
-   Good balance between chart and labeling elements

**Areas for improvement:**

-   Some segments are visually overwhelmed by larger ones
-   Legend is disabled, which may reduce accessibility for some users

### Interactivity: 7/10

**Strengths:**

-   Hover tooltips provide formatted value information
-   Highlight effects with increased stroke width on interaction
-   Callout labels help identify segments without requiring interaction

**Areas for improvement:**

-   Limited interaction beyond basic hover
-   No click-through functionality or drill-down capabilities
-   Could benefit from animation or transitions

### Scale: 8/10

**Strengths:**

-   Handles 9 data points effectively without overcrowding
-   Variable radius provides additional encoding dimension
-   Good use of space with central label area
-   Scales well for this data complexity level

**Areas for improvement:**

-   May become unwieldy with many more segments
-   Very small values might become nearly invisible
-   Performance considerations for larger datasets not tested

## Technical Implementation Notes

### Advanced AG Charts Features Utilized:

-   **Variable Radius**: `radiusKey` property enables radius variation based on data values
-   **Custom Formatting**: Number formatter for clean value display
-   **Callout Labels**: Positioned labels with collision avoidance
-   **Inner Labels**: Central value display with custom spacing
-   **Custom Tooltips**: Formatted value rendering with business context
-   **Highlight Effects**: Interactive visual feedback

### Data Structure:

-   Clean separation of concerns with external data module
-   Hierarchical data structure supporting multiple levels
-   Realistic business values in appropriate ranges

### Styling Approach:

-   Semi-transparent fills (50% opacity) for sophisticated look
-   Rounded corners for modern aesthetic
-   Consistent stroke styling across segments

## Recommendations for Enhancement

### High Priority:

1. **Add explanatory text** about the variable radius feature
2. **Improve accessibility** with alternative color schemes or patterns
3. **Consider re-enabling legend** with custom formatting

### Medium Priority:

1. **Add entrance animations** for more engaging initial presentation
2. **Implement drill-down functionality** to department or subcategory level
3. **Add comparison modes** or time-series capability

### Low Priority:

1. **Experiment with gradient fills** to enhance visual appeal
2. **Add export functionality** for business reporting
3. **Consider responsive design** optimizations

## Conclusion

This example effectively demonstrates AG Charts' variable radius capability in a business-relevant context. The combination of familiar donut chart structure with the innovative radius variation creates a compelling visualization that both informs and engages. While the concept may require brief explanation for some users, the visual impact and data encoding efficiency make this a strong showcase example.

**Overall PREVis Score: 7.8/10**

The example successfully balances innovation with usability, creating a sophisticated visualization that pushes beyond traditional donut chart limitations while maintaining clarity and business relevance.
