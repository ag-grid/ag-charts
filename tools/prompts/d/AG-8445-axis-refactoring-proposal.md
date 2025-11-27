# Proposal: AG Charts Axis Options Refactoring (AG-8445)

This document outlines a proposal for refactoring the AG Charts axis options to improve usability, power, and flexibility. The proposal is based on an analysis of the requirements in `AG-8445` and a competitive analysis of other major charting libraries.

## Executive Summary

The current axis configuration in AG Charts presents several usability challenges. Key properties are difficult to customize without overwriting all defaults, axes are hard to reference, and advanced control over the domain and dynamic behavior is lacking. This proposal addresses these issues by introducing:

1.  **A Deep-Merging Options Strategy:** To allow for targeted customizations without losing defaults.
2.  **Axis Identification:** A new `id` property on each axis for easy referencing and linking.
3.  **Simplified Polar Axis Configuration:** A more intuitive `position` and `type` system for polar charts.
4.  **Enhanced Domain Control:** "Soft" and "hard" `min`/`max` settings, along with percentage-based padding.
5.  **Decoupled Axis Components:** Separate control over ticks, labels, and gridlines for better responsive behavior.

These changes will align AG Charts with industry best practices, minimize breaking changes, and provide a more intuitive and powerful API for developers.

---

## Requirement Themes

The analysis of the requirements document revealed three core themes:

1.  **API & Configuration Usability:** The primary pain point is the difficulty of making simple customizations. The API feels rigid and requires developers to specify more configuration than should be necessary. This includes identifying axes, configuring polar charts, and dealing with confusing property names.

2.  **Axis Domain Control:** Developers need more fine-grained control over the axis domain. The current `nice` behavior is not always desirable, and there is no straightforward way to add padding or ensure gridlines are synchronized across multiple axes.

3.  **Dynamic & Responsive Axes:** Axes need to adapt intelligently to user interactions like zooming. This includes changing label formats and intervals dynamically and managing label collisions gracefully.

---

## Implementation Proposal

### 1. Deep-Merging Options and Defaulting

**Problem:** When a user provides an `axes` array, all default axis configurations are lost.

**Proposal:**
Implement a deep-merging (recursive merge) strategy for the `axes` array. When the user supplies an array of axis options, the chart will:

1.  Determine the default axes based on the series and chart type.
2.  Match the user-provided axis objects to the default axis objects. The matching logic will be based on `position` and `type` (and the new `id`, see below).
3.  Recursively merge the user's options into the default options. If the user provides `axes: [{ type: 'number', position: 'left', title: { text: 'My Title' } }]`, only the `title.text` will be changed, and all other properties (labels, gridlines, etc.) will be inherited from the default 'left' number axis.

**Example:**

```typescript
// Current behavior: Loses all defaults for both axes.
AgCharts.create({
    axes: [{ type: 'number', position: 'left', title: { text: 'Sales' } }],
});

// Proposed behavior: Only the left axis title is changed. The bottom axis is unaffected.
AgCharts.create({
    axes: [{ type: 'number', position: 'left', title: { text: 'Sales' } }],
});
```

### 2. Axis Identification and Linking

**Problem:** There is no stable way to reference a specific axis for linking series or for use in other modules like zoom or annotations.

**Proposal:**

1.  Introduce a new optional `id: string` property to the axis options.
2.  Introduce a new optional `xAxisId: string` and `yAxisId: string` to all series options.
3.  If a series specifies an `xAxisId` or `yAxisId`, it will be bound to the axis with the matching `id`.
4.  If `id`s are not provided, the existing behavior (linking by `axis.keys` or by default) will be maintained to ensure backward compatibility.

**Example:**

```typescript
AgCharts.create({
    axes: [
        { type: 'number', position: 'left', id: 'primary-y-axis' },
        { type: 'number', position: 'right', id: 'secondary-y-axis' },
        { type: 'category', position: 'bottom' },
    ],
    series: [
        { type: 'bar', xKey: 'quarter', yKey: 'revenue', yAxisId: 'primary-y-axis' },
        { type: 'line', xKey: 'quarter', yKey: 'growth', yAxisId: 'secondary-y-axis' },
    ],
});
```

### 3. Simplified Polar Axis Configuration

**Problem:** Polar axis types like `angle-category` are verbose and inconsistent with cartesian axes.

**Proposal:**
Deprecate the existing polar axis types and introduce `position: 'angle'` and `position: 'radial'`.

-   `{ type: 'category', position: 'angle' }` will replace `angle-category`.
-   `{ type: 'number', position: 'angle' }` will replace `angle-number`.
-   `{ type: 'category', position: 'radial' }` will replace `radial-category`.
-   `{ type: 'number', position: 'radial' }` will replace `radial-number`.

This creates a consistent `(type, position)` tuple for identifying all axes, cartesian or polar. The old types will be supported with a deprecation warning to avoid breaking changes.

### 4. Enhanced Domain Control

**Problem:** Users lack fine-grained control over the axis domain, especially with `nice` numbers and padding.

**Proposal:**

1.  **Modify `nice` behavior:** When `nice: true`, it should not override an explicitly user-provided `min` or `max`.
2.  Introduce `softMin` and `softMax`: These properties will suggest a domain, but the axis will still expand to include all data points if they fall outside the range. This is equivalent to Chart.js's `suggestedMin`/`suggestedMax`.
3.  Introduce `padding: { min: number, max: number }`: This will add a percentage-based buffer to the ends of the axis. For example, `padding: { min: 0.1 }` adds a 10% buffer to the minimum end of the axis. This is inspired by Highcharts' `minPadding` and ECharts' `boundaryGap`.

**Example:**

```typescript
axes: [
    {
        type: 'number',
        position: 'left',
        min: 0, // Hard minimum
        softMax: 100, // Will be 100, unless data goes to 120, then it will be >120
        padding: { max: 0.05 }, // Add 5% padding to the top end
    },
];
```

### 5. Decoupled Axis Components

**Problem:** Ticks, labels, and gridlines are tightly coupled, preventing behaviors like hiding labels while keeping gridlines.

**Proposal:**
Refactor the axis options to allow for independent configuration of ticks, labels, and gridlines. This involves moving properties into distinct objects.

**Example (Conceptual):**

```typescript
axes: [
    {
        // ...
        ticks: {
            enabled: true, // Show ticks
            // ... tick styling
        },
        labels: {
            enabled: true, // Show labels
            // ... label styling
            collision: {
                strategy: 'hide', // 'hide', 'rotate', etc.
            },
        },
        gridLines: {
            enabled: true, // Show gridlines
            // ... gridline styling
        },
    },
];
```

This structure provides a clear and extensible foundation for adding more advanced responsive behaviors in the future.

---

## Minimizing Breaking Changes

This proposal is designed to be largely additive.

-   The old axis linking mechanism (`axis.keys`) will continue to work.
-   Old polar axis types will be supported with deprecation warnings.
-   The new domain control features (`softMin`/`softMax`, `padding`) are optional and do not change existing behavior.
-   The core change to option merging is the most impactful, but it is designed to fix behavior that is currently considered a bug. It should lead to more intuitive and predictable chart configurations.

## Rationale

The proposed changes are heavily informed by the competitive analysis. The introduction of `id` for axis linking, deep-merging of options, percentage-based padding, and soft domain limits are all standard features in other major charting libraries. By adopting these patterns, we make AG Charts more familiar to new users and more powerful for existing ones.

Furthermore, the simplification of polar coordinates and the decoupling of axis components provide a stronger architectural foundation that will make it easier to add new features and improve the library in the long run.
