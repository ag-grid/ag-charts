# Product Requirements: Enhanced Axis Domain Control

## Executive Summary

The current axis domain configuration in AG Charts lacks the fine-grained control necessary for many common use cases. Developers struggle to set explicit axis limits that are respected by the `nice` number algorithm, and there is no simple way to add padding to the ends of an axis. This proposal introduces a more powerful and flexible system for axis domain control, inspired by best practices from leading charting libraries. We propose the introduction of "soft" and "hard" `min`/`max` settings, along with percentage-based padding, to give developers precise control over the axis domain while maintaining sensible defaults. These changes are designed to be additive, minimizing breaking changes and providing a more intuitive API.

---

## Requirement Themes

Based on user feedback and internal analysis, the core requirement is for **Enhanced Axis Domain Control**. This breaks down into several key needs:

1.  **Explicit Domain Limits:** Developers need to set a hard `min` and/or `max` for an axis that is not overridden by the `nice` property.
2.  **Suggested Domain Limits:** A common requirement is to suggest a `min` or `max` (e.g., 0), but allow the axis to expand if the data exceeds this limit. This is often referred to as a "soft" limit.
3.  **Axis Padding:** There is a need for a simple, declarative way to add padding to the ends of an axis to prevent data points from being clipped or rendered directly on the chart's edge. This is often desired as a percentage of the total axis range.
4.  **Predictable `nice` Behavior:** The interaction between user-defined limits and the `nice: true` setting needs to be clarified and made more predictable. `nice` should round the axis limits to "nice" numbers but should not override an explicit `min` or `max`.

---

## Implementation Proposal

This proposal is based on the "Enhanced Domain Control" section of the `AG-8445-axis-refactoring-proposal.md` document and is supported by a broad analysis of competitor libraries.

### API Design & Options Setup

We propose the following additions and modifications to the axis options:

1.  **Modify `nice` behavior:** When `nice: true`, it should not override an explicitly user-provided `min` or `max`. It should find the nearest "nice" number that respects the given limit.

2.  **Introduce `softMin` and `softMax`:** These properties will suggest a domain boundary. The axis will respect this boundary unless the data falls outside of it, in which case the axis will expand. This is directly comparable to Chart.js's `suggestedMin`/`suggestedMax` and AnyChart's `softMinimum()`/`softMaximum()`.

    -   `softMin: number`: A suggested minimum value for the axis.
    -   `softMax: number`: A suggested maximum value for the axis.

3.  **Introduce `padding`:** This object will allow for percentage-based padding to be added to the calculated domain of the axis. This is a common feature, seen in libraries like Highcharts (`minPadding`/`maxPadding`), SciChart.js (`growBy`), and Victory (`domainPadding`).

    -   `padding.min: number`: Percentage of the data range to add as padding to the minimum end of the axis (e.g., `0.1` for 10%).
    -   `padding.max: number`: Percentage of the data range to add as padding to the maximum end of the axis (e.g., `0.1` for 10%).

**Example Usage:**

```typescript
// Example 1: Hard minimum of 0, but auto-scaling max with 5% top padding.
AgCharts.create({
    axes: [
        {
            type: 'number',
            position: 'left',
            min: 0, // Data below 0 will be clipped.
            padding: { max: 0.05 }, // Add 5% padding to the top.
        },
    ],
    // ...
});

// Example 2: Suggested range of 0-100. If data exceeds 100, the axis will expand.
AgCharts.create({
    axes: [
        {
            type: 'number',
            position: 'left',
            softMin: 0,
            softMax: 100,
        },
    ],
    // ...
});
```

### Minimizing Breaking Changes

This proposal is designed to be largely additive and non-breaking:

-   The existing `min` and `max` properties retain their function as hard limits. The only change is that `nice: true` will now respect them, which is more intuitive and can be considered a bug fix.
-   The new `softMin`, `softMax`, and `padding` properties are optional and default to `undefined` and `{ min: 0, max: 0 }` respectively, resulting in no change to the existing behavior when they are not used.
-   Developers who do not use these new properties will see no change in their charts.

### Behavioral Flexibility

This proposal provides a flexible hierarchy of control over the axis domain:

1.  **Fully Automatic (Default):** No properties set. The axis domain is determined entirely by the data range and the `nice` property.
2.  **Padding:** Use `padding` to add space around the automatic domain.
3.  **Soft Limits:** Use `softMin`/`softMax` to guide the domain, while still allowing it to grow for larger data values.
4.  **Hard Limits:** Use `min`/`max` to enforce a strict domain, clipping any data that falls outside it.
5.  **Combinations:** Developers can combine these properties, for example, setting a hard `min: 0` while having a soft `max` and adding padding.

---

## Rationale

The proposed changes are heavily informed by a competitive analysis of over 15 charting libraries, as detailed in `axis-domain-analysis.md`. The analysis shows a clear consensus on how flexible axis domains should be handled.

-   **Industry Standard:** The concept of hard limits (`min`/`max`), soft limits (`suggestedMin`/`suggestedMax`), and padding is a standard feature set. Libraries like **Chart.js**, **Highcharts**, **AnyChart**, and **Victory** all offer similar controls. Adopting these patterns makes AG Charts more familiar to developers and brings our capabilities in line with the competition.
-   **Clarity and Power:** Separating hard limits (`min`/`max`) from soft limits (`softMin`/`softMax`) and padding (`padding`) creates a clear and unambiguous API. It resolves the current confusion around the `nice` property's interaction with `min`/`max`.
-   **Specific Competitor Examples:**
    -   **Highcharts** and **ECharts** offer `min`/`max` for hard limits and padding properties (`minPadding`, `boundaryGap`) for spacing.
    -   **Chart.js** provides `min`/`max` and `suggestedMin`/`suggestedMax`, which maps directly to our proposed `min`/`max` and `softMin`/`softMax`.
    -   **TradingView**, a highly specialized library, uses `scaleMargins` to provide proportional padding, demonstrating the importance of this feature in demanding, real-time contexts.
    -   **Recharts** and **Victory** use a `domain` property, which is powerful but can be less intuitive than the separate `min`/`max`/`padding` properties proposed here, which offer a more progressive and layered approach to configuration.

By implementing this proposal, we provide a more powerful, flexible, and intuitive developer experience that aligns with established industry conventions for axis domain control.
