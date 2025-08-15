# PREVis Evaluation Report: Simple Donut Chart

## Example Overview

**Example Name:** simple-donut  
**Chart Type:** Donut Chart  
**Data Domain:** UK Dwelling Fire Statistics by Property Type  
**Framework:** AG Charts Enterprise  
**Evaluation Date:** 2025-08-14

## PREVis Scale Assessment

The PREVis (Perceived Readability Evaluation for Visualizations) scale evaluates data visualizations across four key dimensions: understandability, layout clarity, readability of data values, and readability of data patterns. This report provides a comprehensive evaluation of the simple-donut example.

### 1. Understandability (Score: 8/10)

**Strengths:**

-   Clear and descriptive title "Dwelling Fires by Property Type" immediately communicates the chart's purpose
-   Subtitle "United Kingdom - Annual Statistics" provides geographic and temporal context
-   Source attribution in footnote adds credibility with "UK Home Office Fire Statistics"
-   Center labels showing total (29,570 Total Fires) provide immediate context for the data
-   Real-world data domain that is immediately relatable and important for public safety
-   Familiar donut chart format that most users understand intuitively

**Areas for Improvement:**

-   Missing specific year reference in the subtitle (which annual period?)
-   The "Dwelling" category name is ambiguous when all categories are dwelling types
-   No explanatory text about fire prevention implications or trends
-   Could benefit from clarifying whether data includes all fire types or specific categories

### 2. Layout Clarity (Score: 9/10)

**Strengths:**

-   Excellent use of donut chart format with 60% inner radius ratio creating balanced visual weight
-   Clean separation between segments with 2-pixel spacing enhances readability
-   Center space effectively utilized with total count display
-   Well-positioned title, subtitle, and footnote with appropriate spacing (20px)
-   Bottom-positioned legend with adequate spacing (40px) from chart
-   Outer radius ratio of 0.95 maximizes chart area without crowding
-   Professional stroke width of 1 pixel provides subtle sector separation

**Areas for Improvement:**

-   Legend with 8 horizontal items may not scale well on narrow screens
-   Could explore responsive legend positioning or multi-column layout

### 3. Readability of Data Values (Score: 8/10)

**Strengths:**

-   Smart data sorting (descending by count) improves value comparison
-   Number formatting with thousands separators (15,349) enhances readability
-   Legend includes both category names and percentages for quick reference
-   Sector labels display raw counts directly on the chart
-   Comprehensive tooltip shows incidents, percentage, and ranking (#1 of 8)
-   Inner labels effectively show total with appropriate font sizing (24px/16px)
-   Consistent use of Intl.NumberFormat for locale-appropriate formatting

**Areas for Improvement:**

-   Smaller segments (Dwelling: 610, High Rise Flats: 820) have values that are difficult to read
-   No option to toggle between absolute values and percentages on sectors
-   Callout labels disabled, which could help identify smallest segments
-   Could benefit from abbreviating longer category names on the chart

### 4. Readability of Data Patterns (Score: 8/10)

**Strengths:**

-   Data pre-sorted by count creates natural visual hierarchy
-   Clear dominance of "Houses" category (51.9%) is immediately apparent
-   Effective use of color differentiation for segment identification
-   Highlight functionality with increased stroke width (2px) draws attention
-   Smooth 800ms animation enhances initial pattern reveal
-   Ranking information in tooltip helps understand relative importance
-   Logical flow from largest to smallest segments aids comparison

**Areas for Improvement:**

-   No visual grouping of related property types (e.g., all flat types together)
-   Missing trend indicators or year-over-year comparisons
-   Could benefit from visual encoding of risk levels or fire severity
-   Smallest segments (<3%) are barely visible and could be grouped

## Technical Implementation Quality

### Data Structure (9/10)

-   Clean TypeScript interface with appropriate typing
-   Realistic fire statistics data that tells a meaningful public safety story
-   Well-organized with clear property type categorization
-   Data values appear authentic and proportional to real-world patterns

### Code Quality (9/10)

-   Excellent use of data sorting for improved visual hierarchy
-   Proper TypeScript typing throughout
-   Effective use of Intl.NumberFormat for consistent formatting
-   Smart calculation of totals and percentages
-   Clean separation of concerns with modular data file
-   Efficient use of array methods for data manipulation
-   Good use of theme overrides for consistent styling

### Interactivity (7/10)

-   Functional hover highlighting with visual feedback
-   Rich tooltip with multiple data points (value, percentage, rank)
-   Smooth animations enhance user experience
-   Missing: click interactions, filtering, or drill-down capabilities
-   No keyboard navigation support

### Accessibility (6/10)

-   Formatted numbers improve readability
-   Clear text hierarchy aids navigation
-   Source attribution provides data credibility
-   Missing: ARIA labels, keyboard navigation, screen reader support
-   No colorblind-safe palette implementation
-   Small segments may be difficult to interact with for users with motor impairments

## Overall PREVis Score: 7.9/10

### Summary

This simple donut chart example demonstrates excellent implementation of data visualization best practices. It excels in layout clarity and effectively uses the donut format to display fire statistics data. The visualization successfully balances aesthetic appeal with functional design, making complex fire statistics accessible and understandable. The use of real-world public safety data adds significant value to the example.

### Key Recommendations for Improvement

1. **Enhanced Context and Clarity:**

    - Add specific year or date range to subtitle
    - Rename ambiguous "Dwelling" category to something more specific
    - Include brief insight text highlighting key findings
    - Add comparison data (previous year, regional averages)

2. **Improved Small Segment Handling:**

    - Group categories under 1000 incidents into "Other Property Types" with detail on hover
    - Enable callout labels for smallest segments
    - Implement smart label positioning for segments under 3%
    - Consider minimum angle threshold for visibility

3. **Better Pattern Recognition:**

    - Group related property types visually (all flats together)
    - Add risk level indicators through color intensity or patterns
    - Include trend arrows or indicators for year-over-year changes
    - Use semantic color scheme (e.g., heat map for risk levels)

4. **Enhanced Interactivity:**

    - Add click-to-focus for detailed segment exploration
    - Implement filtering by property characteristics
    - Add data table view toggle option
    - Include drill-down capability for grouped segments

5. **Accessibility Improvements:**

    - Implement colorblind-safe palette with pattern options
    - Add comprehensive keyboard navigation
    - Include ARIA labels and screen reader descriptions
    - Ensure minimum touch target sizes for mobile
    - Provide high contrast mode option

6. **Responsive Design:**
    - Implement responsive legend layout (side position on wide screens, bottom on narrow)
    - Add mobile-optimized touch interactions
    - Consider adaptive text sizing for different screen sizes

### Best Practices Demonstrated

-   Pre-sorting data for logical visual flow
-   Effective use of inner labels to maximize information density
-   Multiple data representations (visual, percentage, ranking)
-   Clear data attribution with source footnote
-   Consistent number formatting throughout
-   Smooth, purposeful animation that enhances understanding
-   Clean code structure with proper TypeScript usage
-   Efficient data calculations and transformations

### Conclusion

The simple-donut example provides an excellent demonstration of AG Charts' donut chart capabilities with meaningful real-world fire safety data. The implementation showcases strong technical practices, effective data presentation, and thoughtful visual design. While the visualization successfully achieves its primary goal of showing fire incident distribution across property types, opportunities exist to enhance accessibility, improve small segment handling, and add richer interactivity. The use of public safety data makes this example particularly valuable for demonstrating how data visualization can communicate important societal information effectively. With the recommended enhancements, this could serve as a best-in-class reference for donut chart implementation.
