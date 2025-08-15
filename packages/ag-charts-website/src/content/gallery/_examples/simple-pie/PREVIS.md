# PREVis Evaluation Report: Simple Pie Chart

## Example Overview

**Example Name:** simple-pie  
**Chart Type:** Pie Chart  
**Data Domain:** Technology Revenue by Segment  
**Framework:** AG Charts Enterprise  
**Evaluation Date:** 2025-08-13

## PREVis Scale Assessment

The PREVis (Perceived Readability Evaluation for Visualizations) scale evaluates data visualizations across four key dimensions: understandability, layout clarity, readability of data values, and readability of data patterns. This report provides a comprehensive evaluation of the simple-pie example.

### 1. Understandability (Score: 7/10)

**Strengths:**

-   Clear and descriptive title "Technology Revenue by Segment" immediately communicates the chart's purpose
-   Subtitle "Q4 2024 Revenue Distribution" provides temporal context
-   Footnote displays total revenue, giving viewers essential context for interpreting percentages
-   Familiar pie chart format that most users understand intuitively

**Areas for Improvement:**

-   Could benefit from a brief description or insight statement highlighting key findings
-   The "Other" category lacks detail about what it encompasses
-   No indication of data source or collection methodology

### 2. Layout Clarity (Score: 8/10)

**Strengths:**

-   Clean, uncluttered design with appropriate use of white space
-   Callout labels with 20-pixel offset provide good separation from the chart
-   Minimum angle of 5 degrees for callout labels prevents overlapping
-   Legend disabled to reduce visual clutter (appropriate given clear labeling)
-   Professional stroke width of 1 pixel provides subtle sector separation

**Areas for Improvement:**

-   Could explore using a donut chart variant for better center space utilization
-   Label positioning could be optimized for smaller slices
-   No visual hierarchy between major and minor segments

### 3. Readability of Data Values (Score: 8/10)

**Strengths:**

-   Dual labeling system: callout labels show segment names, sector labels show percentages
-   Smart threshold: only displays percentages for segments ≥5% to avoid clutter
-   Currency formatting uses appropriate locale settings (USD with no decimal places)
-   Tooltip provides both absolute values and percentages with proper formatting
-   Custom tooltip renderer includes both revenue and market share metrics

**Areas for Improvement:**

-   Smaller segments (<5%) lack visible percentage labels
-   Could benefit from value labels on callout lines for immediate value recognition
-   No option to toggle between absolute values and percentages

### 4. Readability of Data Patterns (Score: 7/10)

**Strengths:**

-   Natural ordering from largest to smallest segments aids pattern recognition
-   Clear dominance of "Cloud Services" (42.5K) is immediately apparent
-   Highlight functionality with increased stroke width (2px) helps focus attention
-   Smooth 800ms animation duration enhances initial data reveal
-   Color differentiation allows for easy segment identification

**Areas for Improvement:**

-   No explicit grouping of related segments (e.g., core services vs. emerging technologies)
-   Missing comparative context (e.g., vs. previous quarter or year)
-   Could benefit from visual encoding of growth rates or trends
-   No clear visual distinction between segments above/below average

## Technical Implementation Quality

### Data Structure (9/10)

-   Clean, typed interface with appropriate data types
-   Well-organized data with meaningful segment names
-   Realistic revenue values that tell a coherent story

### Code Quality (8/10)

-   Proper use of TypeScript for type safety
-   Clean separation of data and configuration
-   Effective use of Intl.NumberFormat for localization
-   Modular structure with separate data file

### Interactivity (7/10)

-   Functional tooltips with custom renderer
-   Highlight on hover for better focus
-   Smooth animations enhance user experience
-   Missing: click interactions, drill-down capability, or filtering options

## Overall PREVis Score: 7.5/10

### Summary

This simple pie chart example demonstrates solid fundamental implementation of data visualization principles. It excels in layout clarity and data value readability while maintaining good understandability. The main areas for enhancement involve improving pattern readability through better visual encoding of relationships and trends.

### Key Recommendations for Improvement

1. **Enhanced Data Patterns:**

    - Consider grouping related segments visually
    - Add year-over-year comparison capability
    - Implement visual indicators for growth/decline

2. **Improved Interactivity:**

    - Add click-to-focus functionality for detailed segment exploration
    - Implement a toggle for absolute values vs. percentages
    - Consider adding filtering or segment selection capabilities

3. **Better Context:**

    - Include data source attribution
    - Add comparative metrics (industry averages, historical data)
    - Provide narrative insights or key takeaways

4. **Accessibility Enhancements:**

    - Ensure color palette meets WCAG contrast requirements
    - Add keyboard navigation support
    - Include screen reader-friendly descriptions

5. **Visual Refinements:**
    - Explore using a sequential or diverging color scheme to encode an additional dimension
    - Consider a donut chart variant for improved aesthetics
    - Add subtle gradients or textures for better visual appeal

### Conclusion

The simple-pie example provides a solid foundation for displaying categorical revenue data. While it successfully achieves its primary goal of showing revenue distribution, there are opportunities to enhance its effectiveness through improved pattern visibility, richer interactivity, and better contextual information. The implementation demonstrates good coding practices and appropriate use of AG Charts features, making it a reliable starting point for further customization.
