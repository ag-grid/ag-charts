# PREVis Evaluation: Custom Tooltips

## Overall Score: 72/100

### Dimension Scores

#### 1. Perceptibility (8/10)

**Strengths:**

-   Clear stacked bar chart structure makes data relationships visible
-   Custom tooltips provide exact values with thousand separators for readability
-   Good use of color to distinguish between different WEEE categories
-   Axis labels with 'k' notation simplify large numbers

**Weaknesses:**

-   Eight different categories in the stack may challenge perceptual limits
-   Similar color hues between some categories could cause confusion
-   No visual hierarchy to emphasize important categories

#### 2. Recognizability (7/10)

**Strengths:**

-   Standard stacked bar chart is a familiar visualization type
-   Quarter-based time series is easily understood
-   Tooltips follow expected hover interaction patterns
-   Clear axis titles and chart title communicate the subject matter

**Weaknesses:**

-   WEEE terminology may not be immediately recognizable to all audiences
-   Long category names in legend could benefit from grouping or simplification
-   No visual cues to guide interpretation of the data patterns

#### 3. Emphasis (6/10)

**Strengths:**

-   Custom tooltips highlight specific values on hover
-   Stacking emphasizes total waste collected per quarter
-   Title and footnote provide context

**Weaknesses:**

-   No clear focal point or primary insight highlighted
-   All categories treated with equal visual weight despite varying importance
-   Missing opportunities to emphasize trends or notable patterns
-   Custom tooltip styling is minimal and doesn't leverage color or visual hierarchy

#### 4. Variation (8/10)

**Strengths:**

-   Good variety in data values showing real quarterly fluctuations
-   Eight distinct categories provide comprehensive coverage
-   Data shows interesting patterns (Q3 peak for cooling appliances)

**Weaknesses:**

-   Limited use of visual variation techniques (all bars same treatment)
-   Could benefit from additional encoding methods for key insights

#### 5. Immediacy (7/10)

**Strengths:**

-   Stacked format immediately shows total waste volumes
-   Quarterly progression is instantly visible
-   Tooltips provide immediate access to precise values

**Weaknesses:**

-   Requires hovering to understand individual category values
-   No summary statistics or trends immediately visible
-   Dense legend requires scanning to match colors to categories

#### 6. Simplicity (8/10)

**Strengths:**

-   Clean, uncluttered design
-   Simple custom tooltip implementation with clear formatting
-   No unnecessary decorative elements
-   Straightforward data structure (quarters × categories)

**Weaknesses:**

-   Eight categories may be more than optimal for quick comprehension
-   Could potentially group related categories for simpler overview

### Technical Implementation Analysis

**Custom Tooltip Implementation:**

-   Basic HTML string concatenation approach is functional but dated
-   Inline styles in tooltip HTML reduce maintainability
-   Custom formatting function for thousands is good but could use Intl.NumberFormat
-   Tooltip renderer properly uses typed parameters

**Data Quality:**

-   Real government data (UK WEEE statistics) adds credibility
-   Appropriate precision in values
-   Good documentation of data source

**Code Quality:**

-   Clean separation of data and configuration
-   Proper TypeScript typing
-   Could benefit from more modern tooltip implementation using template literals

### Recommendations for Improvement

1. **Enhanced Custom Tooltips:**

    - Add percentage of total to tooltip
    - Include quarter-over-quarter change indicators
    - Use more sophisticated styling with shadows and better typography
    - Consider using a tooltip component approach rather than HTML strings

2. **Visual Enhancements:**

    - Group related categories with visual separators or color families
    - Add trend indicators or annotations for significant changes
    - Consider highlighting the largest contributors
    - Add subtle animations on data updates

3. **Data Insights:**

    - Add summary statistics (total, average, trend)
    - Highlight seasonal patterns (Q3 cooling appliance peak)
    - Consider a complementary view showing proportions

4. **Interactivity:**

    - Add ability to focus on specific categories
    - Include comparison mode between quarters
    - Add drill-down capabilities for category details

5. **Modern Implementation:**

    ```typescript
    // Better tooltip approach
    const tooltipRenderer = ({ datum, yKey, yName, fill }: AgBarSeriesTooltipRendererParams<DataType>) => {
        const value = datum[yKey] as number;
        const formatter = new Intl.NumberFormat('en-GB');
        const total = Object.values(datum)
            .filter((v): v is number => typeof v === 'number')
            .reduce((sum, val) => sum + val, 0);
        const percentage = ((value / total) * 100).toFixed(1);

        return `
        <div class="custom-tooltip">
          <div class="tooltip-header" style="border-left: 4px solid ${fill}">
            <strong>${yName}</strong>
            <span class="quarter">${datum.quarter}</span>
          </div>
          <div class="tooltip-value">
            ${formatter.format(value)} tonnes
            <span class="percentage">(${percentage}%)</span>
          </div>
        </div>
      `;
    };
    ```

### Conclusion

This example demonstrates basic custom tooltip functionality but misses opportunities to showcase AG Charts' advanced tooltip capabilities. While the visualization is functional and clean, it could better leverage custom tooltips to provide richer insights and improved user experience. The PREVis score of 72/100 reflects solid fundamentals with room for enhancement in emphasis, recognizability, and leveraging the full potential of custom tooltips.
