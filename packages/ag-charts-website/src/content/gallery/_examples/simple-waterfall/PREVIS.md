# PREVis Assessment: Simple Waterfall Chart

## Current Implementation Analysis

### Strengths

1. **Clear Subject Matter**: Manchester United transfer fees provide a relatable and interesting dataset
2. **Effective Use of Waterfall**: Shows cumulative impact of player transfers on net spending
3. **Good Visual Hierarchy**: Title, subtitle, and footnote provide context
4. **Dynamic Opacity**: Uses `itemStyler` to vary opacity based on fee magnitude
5. **Proper Formatting**: Currency formatting with appropriate precision

### PREVis Score: 6/10

## Issues Identified

### 1. Data Clarity (Score: 5/10)

-   **Problem**: X-axis labels (player names) are difficult to read when positioned at top
-   **Issue**: No clear indication of running total or net position
-   **Missing**: Visual separation between incoming and outgoing transfers

### 2. Visual Design (Score: 6/10)

-   **Problem**: Opacity variation based on fee creates inconsistent visual weight
-   **Issue**: Line connector style (dashed) may not be optimal for showing flow
-   **Missing**: No visual indication of transfer direction beyond color

### 3. Interactivity (Score: 7/10)

-   **Good**: Tooltips work well
-   **Missing**: No way to see cumulative totals at each step
-   **Issue**: Band highlighting may not add value for this use case

### 4. Information Architecture (Score: 6/10)

-   **Problem**: Footnote information (17 arrivals, 11 departures) doesn't match data (6 ins, 5 outs)
-   **Issue**: No clear indication of final net spend
-   **Missing**: Date information not utilized despite being in dataset

## Recommendations for Improvement

### 1. Enhanced Data Storytelling

```typescript
// Add running total annotations
annotations: [
    {
        type: 'text',
        x: 'final',
        y: -148.1,
        text: 'Net Spend: £148.1M',
    },
];
```

### 2. Improved Visual Hierarchy

```typescript
// Better color scheme with consistent opacity
item: {
    positive: {
        name: 'Sales',
        fill: '#22c55e',
        fillOpacity: 0.8,
        label: {
            enabled: true,
            placement: 'outside'
        }
    },
    negative: {
        name: 'Signings',
        fill: '#ef4444',
        fillOpacity: 0.8,
        label: {
            enabled: true,
            placement: 'outside'
        }
    }
}
```

### 3. Better Axis Configuration

```typescript
axes: [
    {
        type: 'category',
        position: 'bottom', // Move to bottom for better readability
        label: {
            rotation: -45,
            autoRotate: false,
        },
    },
    {
        type: 'number',
        position: 'left',
        title: {
            text: 'Transfer Fee (£M)',
        },
        crosshair: {
            enabled: true,
            label: {
                enabled: true,
            },
        },
    },
];
```

### 4. Enhanced Interactivity

```typescript
// Add custom tooltip showing running total
tooltip: {
    renderer: ({ datum, xKey, yKey }) => {
        const runningTotal = calculateRunningTotal(datum);
        return {
            title: datum[xKey],
            content: [
                { name: 'Fee', value: formatCurrency(datum[yKey]) },
                { name: 'Running Total', value: formatCurrency(runningTotal) },
            ],
        };
    };
}
```

### 5. Alternative Dataset Suggestion

Consider using a more comprehensive financial dataset that better demonstrates waterfall capabilities:

-   **Quarterly P&L Breakdown**: Revenue streams, costs, taxes leading to net profit
-   **Budget Variance Analysis**: Planned vs actual with variance categories
-   **Sales Pipeline**: Lead generation through to closed deals with conversion drops

### 6. Additional Features to Showcase

-   **Subtotals**: Add intermediate totals (e.g., "Total Sales", "Total Purchases")
-   **Threshold Lines**: Show budget limits or targets
-   **Time-based Animation**: Animate bars appearing in chronological order
-   **Drill-down Capability**: Click to expand categories into sub-items

## Implementation Priority

1. **High**: Fix axis positioning and label readability
2. **High**: Add running total indicator
3. **Medium**: Improve color scheme and remove opacity variation
4. **Medium**: Add proper annotations for key insights
5. **Low**: Consider alternative dataset for better demonstration

## Final Assessment

The example demonstrates basic waterfall functionality but misses opportunities to showcase AG Charts' advanced capabilities. The football transfer theme is engaging but the implementation needs refinement to effectively communicate the financial flow and cumulative impact of transfers.
