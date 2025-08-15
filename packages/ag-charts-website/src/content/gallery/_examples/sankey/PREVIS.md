# Sankey Diagram - PREVis Scale Evaluation

## Overall Score: 7/10

## Evaluation Breakdown

### 1. Data Selection and Quality (7/10)

**Strengths:**

-   Real-world financial data (Apple Q1 2022 earnings) that users can relate to
-   Clear hierarchical flow from revenue sources to profit
-   Appropriate complexity for demonstrating Sankey capabilities

**Weaknesses:**

-   Comment references incorrect source (medical students instead of Apple earnings)
-   Dataset could be expanded to show more complex flows or multiple periods
-   Missing some interesting financial flows (e.g., dividends, investments)

### 2. Visual Design (6/10)

**Strengths:**

-   Clean, uncluttered layout with center-aligned nodes
-   Flows are generally easy to follow

**Weaknesses:**

-   Default color scheme lacks semantic meaning (no color coding for profit/loss/expense categories)
-   No visual distinction between different types of flows (revenue vs costs)
-   Missing visual hierarchy to guide the eye through the financial story

### 3. Chart Configuration (6/10)

**Strengths:**

-   Basic Sankey implementation is functional
-   Proper key mappings for from/to relationships

**Weaknesses:**

-   Minimal customization beyond basic setup
-   No advanced features like custom colors, gradients, or node styling
-   Missing interactive features configuration

### 4. Interactivity (5/10)

**Strengths:**

-   Default tooltips show flow values

**Weaknesses:**

-   No enhanced interactions configured
-   Missing hover effects or highlighting
-   No drill-down or filtering capabilities

### 5. Documentation and Context (7/10)

**Strengths:**

-   Clear title and subtitle provide context
-   Size name properly labeled as "USD (billions)"

**Weaknesses:**

-   Incorrect source comment creates confusion
-   No additional context about the data or insights

## Recommendations for Improvement

### 1. **Enhanced Dataset**

```typescript
// Expand to show quarterly comparison or add more detail
const data = [
    // Revenue streams with more granularity
    { from: 'iPhone', to: 'Products', value: 45.6, category: 'revenue' },
    { from: 'iPhone Services', to: 'Services', value: 8.2, category: 'revenue' },
    // Add year-over-year comparison
    { from: 'Products Q1 2021', to: 'Products Q1 2022', value: 66.5, category: 'growth' },
];
```

### 2. **Semantic Color Coding**

```typescript
node: {
  fill: (params) => {
    const nodeColors = {
      'Revenue': '#10b981',      // Green for income
      'Costs': '#ef4444',        // Red for expenses
      'Gross Profit': '#3b82f6', // Blue for profit stages
      'Net Profit': '#8b5cf6',   // Purple for final profit
    };
    return nodeColors[params.datum.id] || '#94a3b8';
  }
},
link: {
  fill: (params) => {
    // Gradient from source node color to target node color
    return params.datum.from.includes('Profit') ? '#10b98150' : '#ef444450';
  }
}
```

### 3. **Enhanced Interactivity**

```typescript
tooltip: {
  enabled: true,
  renderer: (params) => {
    const { from, to, usd } = params.datum;
    const percentage = (usd / totalRevenue * 100).toFixed(1);
    return {
      content: `${from} → ${to}: $${usd}B (${percentage}% of revenue)`
    };
  }
},
node: {
  interaction: {
    highlight: {
      fill: 'gold',
      strokeWidth: 2
    }
  }
}
```

### 4. **Better Layout and Labeling**

```typescript
node: {
  alignment: 'justify', // Better for financial flows
  width: 20,
  padding: 10,
  label: {},
}
```

### 5. **Alternative Dataset Suggestions**

-   **Energy Flow**: Show energy production to consumption across sectors
-   **Supply Chain**: Trace materials from raw resources to final products
-   **Website Analytics**: User journey from acquisition channels to conversions
-   **Budget Allocation**: Government/organizational budget flow from sources to departments

## Final Recommendations

1. **Fix the source comment** - Remove incorrect medical students reference
2. **Implement semantic colors** - Use color to reinforce data meaning
3. **Add financial context** - Include percentage annotations or comparison data
4. **Enhance interactivity** - Add highlighting and detailed tooltips
5. **Consider animation** - Animate the initial flow reveal for visual impact
6. **Add data insights** - Include annotations for key findings (e.g., "Services = 26% of revenue")

This example demonstrates basic Sankey functionality but misses opportunities to showcase AG Charts' advanced customization capabilities and create a more compelling financial narrative.
