# PREVis Assessment: Simple Line Chart Example

## Overview

This example demonstrates a line chart with error bars showing UK road fuel prices (petrol and diesel) throughout 2019. The visualization includes confidence intervals, custom tooltips, and a floating legend.

## PREVis Scale Assessment

### 1. Message Clarity (Score: 7/10)

**Strengths:**

-   Clear title explicitly states the subject: "UK Road Fuel Prices 2019"
-   Y-axis clearly labeled with units "Price (pence per litre)"
-   Source attribution provides credibility
-   Two distinct series (Petrol vs Diesel) are easy to differentiate

**Weaknesses:**

-   No explicit narrative or key insight highlighted
-   Error bars represent confidence intervals but this isn't immediately clear without tooltip interaction
-   Missing context about why 2019 data is significant or what story it tells

### 2. Visual Hierarchy (Score: 8/10)

**Strengths:**

-   Title has appropriate prominence with larger font size (20px)
-   Footnote uses smaller, italicized text to indicate secondary importance
-   Grid lines use subtle dashed pattern to avoid competing with data
-   Clear separation between chart elements

**Weaknesses:**

-   Floating legend could potentially obscure data points
-   All data points have equal visual weight - no emphasis on significant changes

### 3. Data-Ink Ratio (Score: 7/10)

**Strengths:**

-   Clean design with minimal decorative elements
-   Appropriate use of white space
-   Grid lines are subtle and functional
-   Error bars add meaningful information without clutter

**Weaknesses:**

-   Band highlighting on x-axis may be unnecessary
-   Error bar caps could be simplified
-   Legend border and corner radius are decorative rather than functional

### 4. Cognitive Load (Score: 6/10)

**Strengths:**

-   Only two series makes comparison straightforward
-   Consistent time intervals (weekly data)
-   Familiar line chart format
-   Custom tooltips provide detailed information on demand

**Weaknesses:**

-   Error bars add complexity that may not be immediately understood
-   52 data points per series creates a dense visualization
-   Tooltip format with confidence intervals requires interpretation
-   No aggregation or smoothing to show broader trends

### 5. Aesthetic Appeal (Score: 7/10)

**Strengths:**

-   Professional appearance with consistent styling
-   Smooth animations enhance engagement
-   Rounded legend corners add polish
-   Clean, modern design

**Weaknesses:**

-   Default color scheme is functional but not particularly engaging
-   No visual storytelling elements
-   Could benefit from more sophisticated color palette

### 6. Emotional Engagement (Score: 5/10)

**Strengths:**

-   Real-world data that affects daily life (fuel prices)
-   Shows price volatility that viewers can relate to

**Weaknesses:**

-   No narrative arc or story structure
-   Missing annotations for significant events
-   No visual emphasis on dramatic changes
-   Lacks context about external factors affecting prices

### 7. Persuasive Elements (Score: 4/10)

**Strengths:**

-   Credible source attribution
-   Confidence intervals suggest statistical rigor

**Weaknesses:**

-   No clear argument or conclusion presented
-   Missing comparative context (e.g., historical averages, inflation adjustment)
-   No call to action or takeaway message
-   Doesn't guide viewer to specific insights

### 8. Accessibility (Score: 7/10)

**Strengths:**

-   Clear labels and readable font sizes
-   Distinct line styles between series
-   Tooltips provide detailed information

**Weaknesses:**

-   Color-only differentiation between series (no pattern/dash distinction)
-   Small marker size (6px) may be difficult for some users
-   No keyboard navigation apparent from code
-   Error bars may be hard to distinguish at smaller screen sizes

## Overall PREVis Score: 6.4/10

## Recommendations for Improvement

### High Priority

1. **Add narrative elements**: Include annotations for significant price spikes/drops with explanatory context
2. **Improve accessibility**: Add line patterns in addition to colors, increase marker size
3. **Enhance story**: Add a subtitle explaining key insight (e.g., "Diesel consistently more expensive despite similar volatility")
4. **Simplify complexity**: Consider monthly averages option or trend line overlay

### Medium Priority

1. **Color strategy**: Use color to encode meaning (e.g., red for price increases, green for decreases)
2. **Progressive disclosure**: Start with simple lines, allow users to toggle error bars
3. **Context addition**: Include average price line or year-over-year comparison
4. **Visual focus**: Highlight periods of significant change or divergence between fuel types

### Low Priority

1. **Legend positioning**: Consider bottom placement to avoid data occlusion
2. **Grid refinement**: Remove band highlighting if not serving specific purpose
3. **Tooltip enhancement**: Add percentage change information
4. **Animation strategy**: Consider staged reveal to guide attention

## Conclusion

While this example demonstrates technical competence with AG Charts features (error bars, custom tooltips, theming), it falls short on persuasive visualization principles. The chart presents data accurately but doesn't tell a compelling story or guide viewers to meaningful insights. With targeted improvements to narrative structure, visual hierarchy, and accessibility, this could become a much more effective and persuasive visualization.

The example would benefit most from adding contextual annotations, simplifying the default view while allowing progressive complexity, and creating a clearer visual narrative about fuel price trends in 2019.
