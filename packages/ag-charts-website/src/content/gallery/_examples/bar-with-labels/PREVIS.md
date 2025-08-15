# PREVis Assessment Report: Bar With Labels

## Example Overview

**Title:** Change in Number of Jobs  
**Chart Type:** Horizontal Bar Chart with Labels  
**Data:** Employment change data across 7 job sectors (positive and negative values)  
**Framework:** AG Charts Enterprise

## PREVis Scale Assessment

### Individual Scores

#### **P**urpose (Score: 7/10)

The visualization effectively communicates job market changes across different sectors. The purpose is clear and well-defined:

-   Clear title indicating the metric being displayed (change in jobs)
-   Horizontal orientation allows for easy reading of category labels
-   Positive and negative values provide immediate insight into growth vs. decline sectors
-   Source attribution adds credibility

**Weaknesses:**

-   Lacks temporal context (what time period does this change represent?)
-   Missing absolute values or percentage context for the changes
-   Could benefit from additional context about significance of these changes

#### **R**elevance (Score: 8/10)

The horizontal bar chart is highly appropriate for this data:

-   Excellent choice for comparing values across categories
-   Horizontal orientation optimal for reading job category names
-   Bar chart correctly emphasizes discrete categories rather than continuous data
-   Labels directly on bars eliminate need for constant axis reference

**Strengths:**

-   Chart type matches data structure perfectly
-   Horizontal layout maximizes label readability
-   Direct labeling reduces cognitive load

#### **E**legance (Score: 5/10)

The visual design is functional but lacks polish:

**Strengths:**

-   Clean, uncluttered design
-   Direct labels with proper +/- formatting
-   Clear axis labeling

**Weaknesses:**

-   Default color scheme lacks strategic intent
-   No visual differentiation between positive and negative values
-   Missing visual hierarchy or emphasis
-   Grid lines could be more subtle
-   Typography could be refined for better readability
-   No use of color to enhance meaning (e.g., green for growth, red for decline)

#### **V**ersatility (Score: 6/10)

The example provides moderate adaptability:

-   Simple data structure easy to modify
-   Clear configuration pattern
-   Label formatter demonstrates customization potential

**Limitations:**

-   Lacks parameterization for key features
-   No demonstration of handling edge cases (very small values, many categories)
-   Missing configuration for different data scales or formats

#### **I**nnovation (Score: 3/10)

The example demonstrates basic functionality without exploring advanced features:

-   No use of enterprise features despite importing ag-charts-enterprise
-   Missing interactivity enhancements (tooltips, hover states)
-   No creative visual elements or animations
-   Doesn't showcase AG Charts' unique capabilities
-   Label formatting is the only customization shown
-   No exploration of advanced styling or theming

#### **S**implicity (Score: 9/10)

The implementation is exceptionally straightforward:

-   Minimal configuration achieving the desired result
-   Clean code structure with clear intent
-   Simple data format
-   Easy to understand and modify
-   No unnecessary complexity
-   Direct mapping from data to visualization

## Overall Assessment

### Overall Score: 6.3/10

### Key Strengths

1. **Clarity of Purpose:** The chart immediately communicates its message
2. **Appropriate Chart Selection:** Horizontal bar chart is ideal for this data
3. **Code Simplicity:** Clean, minimal implementation that's easy to understand
4. **Effective Labeling:** Direct labels with smart +/- formatting

### Critical Issues

1. **Visual Design**

    - Lacks visual differentiation between positive and negative values
    - Default styling doesn't enhance data comprehension
    - Missing color coding that could reinforce meaning

2. **Context and Completeness**

    - No temporal context for the changes shown
    - Missing absolute values or percentages for context
    - No indication of statistical significance or confidence

3. **Underutilization of Features**
    - Imports enterprise but uses no enterprise features
    - No tooltip customization
    - No interactivity enhancements
    - Missing accessibility considerations

### Areas for Improvement

1. **Enhanced Visual Encoding**

    ```typescript
    series: [
        {
            type: 'bar',
            direction: 'horizontal',
            xKey: 'job',
            yKey: 'change',
            fill: '#e0e0e0',
            formatter: ({ datum, yKey }) => ({
                fill: datum[yKey] >= 0 ? '#4caf50' : '#f44336',
            }),
            label: {
                formatter: (params) => {
                    return (params.value > 0 ? '+' : '') + params.value;
                },
                placement: params => params.value >= 0 ? 'outside' : 'inside',
            },
        },
    ],
    ```

2. **Improved Context**

    ```typescript
    title: {
        text: 'Change in Number of Jobs (2022-2023)',
    },
    subtitle: {
        text: 'Thousands of positions',
    },
    ```

3. **Enhanced Interactivity**

    ```typescript
    tooltip: {
        renderer: ({ datum, xKey, yKey }) => ({
            title: datum[xKey],
            content: [
                {
                    label: 'Change',
                    value: `${datum[yKey] > 0 ? '+' : ''}${datum[yKey]}k jobs`,
                },
                {
                    label: 'Percentage',
                    value: `${(datum[yKey] / datum.baseline * 100).toFixed(1)}%`,
                },
            ],
        }),
    },
    ```

4. **Add Visual Polish**

    ```typescript
    axes: [
        {
            type: 'number',
            position: 'bottom',
            title: {
                enabled: true,
                text: 'Change (Thousands)',
            },
            line: {
                enabled: false,
            },
            gridLine: {
                style: [
                    {
                        stroke: 'rgba(0, 0, 0, 0.1)',
                        strokeWidth: 1,
                    },
                ],
            },
            crossLines: [
                {
                    type: 'line',
                    value: 0,
                    stroke: '#333',
                    strokeWidth: 2,
                },
            ],
        },
    ],
    ```

5. **Leverage Enterprise Features**
    - Add animations for initial load
    - Implement zoom for datasets with many categories
    - Add export functionality
    - Include annotations for significant thresholds

### Specific Recommendations

1. **Enhance Data Structure:**

    ```typescript
    export function getData() {
        return [
            { job: 'Agriculture', change: 17, baseline: 450, percentage: 3.8 },
            { job: 'Recreation', change: 30, baseline: 1200, percentage: 2.5 },
            // ... include context for better storytelling
        ];
    }
    ```

2. **Improve Visual Hierarchy:**

    - Use color strategically to encode positive/negative
    - Add subtle animations on load
    - Implement hover states for bars
    - Consider sorting by value for easier comparison

3. **Add Meaningful Annotations:**
    ```typescript
    annotations: [
        {
            type: 'line',
            value: 0,
            axis: 'x',
            stroke: '#666',
            strokeWidth: 2,
            label: {
                text: 'No change',
                position: 'top',
            },
        },
    ],
    ```

## Priority Level: **Medium-High**

This example serves its basic purpose but significantly underutilizes AG Charts capabilities. While the simplicity is admirable, it fails to showcase features that would make it a compelling gallery example. The lack of visual differentiation between positive and negative values is a missed opportunity for intuitive data visualization. With moderate enhancements focusing on visual encoding and interactivity, this could become a strong example of effective data communication.

## Technical Notes

-   Consider adding a more comprehensive dataset with additional context fields
-   The enterprise import suggests this should showcase enterprise features but doesn't
-   Label placement could be optimized based on bar length and value sign
-   Grid styling should be more subtle to not compete with data
-   Consider responsive design for different viewport sizes
-   Add ARIA labels for accessibility
-   The footnote about the source is good practice but could include a link or date
