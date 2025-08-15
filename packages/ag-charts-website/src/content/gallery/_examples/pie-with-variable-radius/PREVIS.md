# PREVis Evaluation: Pie with Variable Radius

## Overall Score: 6/10

This example demonstrates the variable radius feature in pie charts, encoding two dimensions of data (population and GDP per capita) in a single visualization. While technically competent, it falls short of creating a truly compelling and effective visualization.

## Detailed Evaluation

### 1. Clarity of Purpose (5/10)

**Purpose:** Show how pie charts can encode two variables using angle and radius
**Issues:**

-   The dual encoding (angle for population, radius for GDP per capita) creates cognitive load
-   Variable radius makes it difficult to accurately compare slice sizes
-   The relationship between the two variables isn't immediately clear

### 2. Data Encoding (4/10)

**Strengths:**

-   Successfully demonstrates the technical capability of variable radius
-   Shows multiple data dimensions in one chart

**Weaknesses:**

-   Perceptually misleading: smaller population with higher GDP per capita appears larger visually
-   The radius variation distorts the primary angle-based comparison
-   Double encoding creates interpretation challenges

### 3. Visual Effectiveness (5/10)

**Positive:**

-   Clean color palette with good contrast
-   Inner labels provide context with total GDP

**Negative:**

-   Variable radius breaks fundamental pie chart conventions
-   Visual area doesn't match the actual data proportions
-   The chart requires significant mental effort to interpret correctly

### 4. Informativeness (6/10)

**What Works:**

-   Rich tooltip with comprehensive data breakdown
-   GDP per capita ranking adds useful context
-   Subtitle explains the encoding scheme

**What Doesn't:**

-   The visualization doesn't reveal insights effectively
-   A simple bar chart or scatter plot would be more informative
-   The relationship between variables is obscured rather than clarified

### 5. Practical Applicability (4/10)

**Limited Use Cases:**

-   While technically interesting, this approach has limited real-world value
-   Most data visualization experts discourage variable radius pie charts
-   Better alternatives exist for multi-dimensional data

### 6. Code Quality (7/10)

**Good:**

-   Clean implementation with proper TypeScript types
-   Well-structured tooltip renderer
-   Appropriate use of formatters

**Could Improve:**

-   Consider adding warnings about when to use this chart type
-   Could demonstrate alternative visualizations for comparison

## Key Issues

1. **Perceptual Problems:** The human eye struggles to accurately decode area when both angle and radius vary
2. **Misleading Representation:** Lithuania appears largest despite Estonia having higher GDP per capita
3. **Poor Data-Ink Ratio:** Complex encoding for simple three-country comparison
4. **Against Best Practices:** Variable radius pie charts are generally discouraged in data visualization

## Recommendations for Improvement

### High Priority

1. **Add Alternative Visualization:** Show the same data as a scatter plot or grouped bar chart for comparison
2. **Include Guidance:** Add comments about when (if ever) to use variable radius
3. **Simplify or Enhance Dataset:** Either use more countries to justify complexity or simplify to standard pie

### Medium Priority

1. **Visual Cues:** Add more explicit visual indicators for what each dimension represents
2. **Interactive Features:** Allow toggling between standard and variable radius views
3. **Educational Content:** Explain the perceptual challenges of this chart type

### Low Priority

1. **Animation:** Animate the radius changes to help users understand the encoding
2. **Color Encoding:** Consider using color to reinforce one of the dimensions

## Alternative Approaches

This data would be better visualized as:

1. **Scatter Plot:** GDP per capita vs. population with bubble size for total GDP
2. **Grouped Bar Chart:** Side-by-side comparison of all metrics
3. **Standard Pie + Bar:** Pie for GDP share, separate bar for per capita values
4. **Small Multiples:** Individual charts for each metric

## Conclusion

While this example successfully demonstrates AG Charts' technical capability to create variable radius pie charts, it serves more as a cautionary tale than a best practice example. The visualization creates more confusion than clarity and goes against established data visualization principles. It would be valuable to reposition this as a "what not to do" example or pair it with better alternatives to educate users about appropriate chart selection.

The example would benefit from either:

1. Being replaced with a more appropriate use case for variable radius (if one exists)
2. Being reframed as a comparison study showing why standard visualizations work better
3. Including clear warnings about the perceptual issues with this approach
