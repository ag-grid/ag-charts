# PREVis Evaluation: 100% Stacked Column Chart

## Overview

This example demonstrates a 100% stacked column chart showing the ethnic diversity of school pupils across different educational settings in the UK. The chart uses normalization to display proportional representation of ethnic groups, allowing for direct comparison across school types with vastly different total populations.

## PREVis Scores

### Purpose: 7/10

**Message Clarity**

-   **Strengths:**
    -   Clear title explicitly states the subject matter
    -   Percentage formatting enables easy proportional comparison
    -   Data source properly attributed in footnote
    -   Vertical stacking naturally shows composition
-   **Weaknesses:**
    -   No clear insight or story highlighted in the data
    -   Missing context about significance or trends
    -   No indication of what patterns viewers should observe
    -   Lacks temporal context (when was this data collected?)

### Relevance: 8/10

**Chart Appropriateness**

-   **Strengths:**
    -   100% stacked column is ideal for comparing proportions across categories
    -   Normalization enables fair comparison despite varying school populations
    -   Vertical orientation works well for the 5 school type categories
    -   Shared tooltip mode allows cross-category comparison
-   **Weaknesses:**
    -   School types appear in arbitrary order (could be ordered by size or diversity)
    -   Missing actual enrollment numbers which could provide valuable context

### Elegance: 5/10

**Visual Appeal**

-   **Strengths:**
    -   Clean, uncluttered design
    -   Professional layout with title and source attribution
    -   Band highlighting provides subtle visual feedback
-   **Weaknesses:**
    -   Default color palette lacks cultural sensitivity and semantic meaning
    -   No visual hierarchy to guide attention to key insights
    -   Colors don't follow any logical progression or grouping
    -   Missing visual polish like gradients or subtle effects
    -   Legend at bottom requires eye movement between chart and legend

### Versatility: 7/10

**Flexibility**

-   **Strengths:**
    -   Code structure is clear and modular
    -   Data format is straightforward and extensible
    -   Configuration pattern is consistent across series
    -   Easy to adapt for similar demographic datasets
-   **Weaknesses:**
    -   Repetitive series configuration could be refactored
    -   Hard-coded ethnic categories limit reusability
    -   No parameterization for color schemes or themes
    -   Missing configuration for sorting or filtering

### Innovation: 3/10

**Uniqueness**

-   **Strengths:**
    -   Demonstrates AG Charts' normalization feature
    -   Band highlighting adds subtle interactivity
-   **Weaknesses:**
    -   Very basic implementation with no advanced features
    -   Doesn't showcase AG Charts' enterprise capabilities
    -   No annotations, insights, or data storytelling elements
    -   Missing interactive features like drill-down or filtering
    -   No use of animations or transitions

### Simplicity: 9/10

**Ease of Understanding**

-   **Strengths:**
    -   Code is extremely concise and readable
    -   Data structure is immediately clear
    -   Configuration follows predictable patterns
    -   No unnecessary complexity
    -   Good property naming conventions
-   **Weaknesses:**
    -   Could benefit from TypeScript interface for data structure
    -   Series configuration repetition could be simplified with mapping

## Overall Score: 39/60 (65%)

## Key Strengths

1. **Appropriate visualization choice:** 100% stacked column perfectly suits proportional comparison
2. **Clean implementation:** Highly readable and maintainable code
3. **Proper attribution:** Includes data source for credibility
4. **Accessibility basics:** Clear labels and logical structure

## Priority Improvements

### HIGH PRIORITY

1. **Cultural Color Sensitivity:**

    - Avoid using colors that could be interpreted as value judgments
    - Consider a neutral, professional palette (blues, teals, purples)
    - Ensure sufficient contrast between adjacent segments

2. **Data Ordering & Insights:**

    - Sort school types by total enrollment or diversity index
    - Highlight the most interesting pattern (e.g., Special schools diversity)
    - Add annotations for notable observations

3. **Enhanced Tooltips:**
    - Show both percentages and absolute numbers
    - Include total enrollment per school type
    - Format numbers with thousand separators

### MEDIUM PRIORITY

1. **Visual Enhancement:**

    - Add subtle gradients or textures for visual interest
    - Implement hover state highlighting for better interactivity
    - Consider moving legend to right side for better scanning

2. **Context & Storytelling:**

    - Add subtitle with key insight or data year
    - Include brief description of what the data reveals
    - Add reference lines for national averages if available

3. **Code Optimization:**
    - Create TypeScript interface for data structure
    - Refactor repetitive series configuration using array mapping
    - Add constants for colors and formatting

### LOW PRIORITY

1. **Advanced Features:**
    - Add animation on initial load
    - Implement click-to-focus on specific ethnic groups
    - Consider toggle between percentage and absolute views
    - Add export functionality for the chart

## Recommendations for Improvement

### Immediate Code Enhancements

```typescript
// Add TypeScript interface
interface SchoolDiversityData {
    type: 'Nursery' | 'Primary' | 'Secondary' | 'Special' | 'Referral units';
    white: number;
    mixed: number;
    asian: number;
    black: number;
    chinese: number;
    other: number;
}

// Define thoughtful color palette
const ethnicGroupColors = {
    white: '#64748b', // Neutral slate
    mixed: '#06b6d4', // Cyan
    asian: '#8b5cf6', // Violet
    black: '#f59e0b', // Amber
    chinese: '#10b981', // Emerald
    other: '#ec4899', // Pink
};

// Simplify series configuration
const ethnicGroups = ['white', 'mixed', 'asian', 'black', 'chinese', 'other'];
const series = ethnicGroups.map((group) => ({
    type: 'bar' as const,
    xKey: 'type',
    yKey: group,
    yName: group.charAt(0).toUpperCase() + group.slice(1),
    normalizedTo: 100,
    stacked: true,
    fill: ethnicGroupColors[group],
}));
```

### Data Enhancement

-   Sort school types by total enrollment (Primary > Secondary > Special > Nursery > Referral)
-   Calculate and display diversity index for each school type
-   Add percentage point changes if historical data is available

### Visual Polish

-   Implement subtle shadows between stack segments
-   Add hover animations for segment emphasis
-   Consider pattern fills for accessibility (colorblind users)
-   Add data labels for segments > 10%

## Conclusion

This example provides a functional demonstration of 100% stacked columns but falls short of showcasing AG Charts' full potential. The visualization handles a sensitive topic (ethnic diversity) with a generic approach that misses opportunities for thoughtful design and meaningful insights. While the code is admirably simple, the example would benefit significantly from cultural sensitivity in color choices, better data storytelling, and enhanced interactivity.

The current implementation serves as a basic technical demonstration but doesn't inspire users or showcase why they should choose AG Charts for their data visualization needs. With focused improvements to visual design, interactivity, and data presentation, this could become a compelling example of both technical capability and thoughtful design.

**Priority Level: HIGH** - Given the sensitive nature of demographic data, this example needs immediate attention to ensure appropriate visual treatment and meaningful presentation of the diversity information.
