# Deeper Analysis: Axis Linking and Configuration

This document expands on the proposal in `AG-8445-axis-refactoring-proposal.md`, providing a deeper analysis of different approaches for two key areas:

1.  **Linking Series to Axes**
2.  **Modifying Axis Properties Without Losing Defaults**

---

## Broader Competitive Landscape

An analysis of a broader list of 18 competitors, including popular libraries like **Plotly.js**, **Recharts**, and **ECharts**, reinforces the conclusions of the initial analysis. The dominant patterns in the market align with the recommended strategies.

-   **On Axis Linking:** The series-centric, ID-based linking model is the clear industry standard. While many libraries use generic `xAxisId` and `yAxisId` properties, this can be confusing for certain chart types like horizontal bars. A more robust approach, as proposed below, is to use role-based names like `horizontalAxisId` and `verticalAxisId`. This aligns with the goal of providing a clear and unambiguous API, even if it diverges slightly from the naming conventions of some competitors.

    -   **Plotly.js** uses this pattern by having traces (series) reference axes by their layout key (e.g., `yaxis: 'y2'`).
    -   **Recharts**, a component-based library, uses the same core principle, passing an `yAxisId` prop to its series components (`<Line yAxisId="left" />`).

-   **On Modifying Properties:** The concept of declaratively updating a configuration by providing a partial object is also standard.
    -   **Plotly.js** updates its `layout` object, which contains axis definitions, by merging in partial layout objects.
    -   This supports the recommendation for a "Deep Merging with Heuristic Matching" strategy to allow users to easily override defaults without losing the entire configuration.

The broader review confirms that the recommended approaches are not only sound but also align with the expectations of developers familiar with other modern charting libraries.

---

## 1. Linking Series to Axes

The core requirement is to create a stable, intuitive way for a data series to be associated with one or more axes, especially in charts with multiple axes.

### Approach 1: Series-Centric Linking via ID (Recommended)

-   **Description:** Each axis object in the `axes` array can be given an optional `id` string. Each series object then gets properties to reference these IDs. To avoid the ambiguity of `x` and `y`, the names of these properties should reflect the axis's role within the chart's coordinate system.

    -   For **Cartesian** charts: `horizontalAxisId` and `verticalAxisId`.
    -   For **Polar** charts: `angleAxisId` and `radialAxisId`.

-   **Pros:**

    -   **Explicit & Unambiguous:** It is perfectly clear which series is being rendered on which axis. `horizontalAxisId` refers to an axis at `position: 'top'` or `'bottom'`, which is independent of what data (`xKey` or `yKey`) the series plots on it. This correctly solves the horizontal bar chart problem.
    -   **Industry Standard Principle:** While the property names may differ, the core principle of ID-based linking from the series is a market standard.
    -   **Stable Reference:** The `id` is not dependent on the order of elements in the `axes` array, making maintenance easy and safe.
    -   **Extensible:** Provides a clear pattern for other coordinate systems in the future.

-   **Cons:**
    -   **Minor Verbosity:** Requires the user to create and assign `id`s, which can feel slightly verbose for a very simple, single-axis chart.

### Approach 2: Axis-Centric Linking

-   **Description:** This is an evolution of the current `axis.keys` system. Each series would have an `id`, and the axis configuration would include a `series: ['series-id-1', 'series-id-2']` array to declare which series it applies to.

-   **Pros:**

    -   Keeps all axis-related configuration encapsulated within the axis object itself.

-   **Cons:**
    -   **Counter-intuitive:** It is more natural to think of a series _using_ an axis, rather than an axis _claiming_ a series. This can be confusing.
    -   **Poor Discoverability:** To understand how a single series is rendered, a developer might have to search through the entire `axes` array to find which axis references it.

### Approach 3: Linking by Position

-   **Description:** A series would declare the `position` of the axis it wants to bind to, for example: `verticalAxisPosition: 'right'`.

-   **Pros:**

    -   **Simple for Basic Charts:** Very easy to understand for standard charts with one axis in each position (top, bottom, left, right).

-   **Cons:**
    -   **Ambiguous:** This approach fails as soon as there are two axes in the same position (e.g., two `'left'` axes). There is no way to differentiate between them.
    -   **Inflexible:** Does not support more complex layouts where axes might be positioned by a numeric `offset` instead of a named position.

### Recommended Hybrid Strategy

For maximum flexibility and backward compatibility, a hybrid approach is best:

1.  **Primary Method: ID Linking.** This should be the officially recommended and documented method, using the role-based properties (`horizontalAxisId`, etc.).
2.  **Default Fallback: Automatic Linking.** For simple charts where no `id`s are specified, the chart should automatically link series to the first available axis in the default position (e.g., `position: 'bottom'` for horizontal, `position: 'left'` for vertical). This preserves the "it just works" experience for new users.
3.  **Legacy Support:** The existing `axis.keys` mechanism should be maintained for backward compatibility, perhaps with a console deprecation warning encouraging users to migrate to the new `id` system.

---

## 2. Modifying Axis Properties

The goal is to allow a user to override a few specific properties of a default axis without needing to redefine the entire axis configuration.

### Approach 1: Deep Merging with Heuristic Matching (Recommended)

-   **Description:** The user provides a partial axis object in the `axes` array. The charting engine identifies which default axis to apply the changes to by matching key properties. The partial object is then deeply merged into the default configuration.

    The key to this approach is the matching logic. The recommended hierarchy is:

    1.  **Match by `id`:** If the user provides `axes: [{ id: 'my-axis', title: { ... } }]`, the engine finds the default axis with `id: 'my-axis'` and merges the properties. This is the most explicit and reliable method.
    2.  **Match by `(position, type)`:** If no `id` is provided, the engine falls back to matching on the combination of `position` and `type`. For example, `axes: [{ position: 'left', type: 'number', ... }]` will reliably find the primary vertical axis in a standard cartesian chart.

-   **Pros:**

    -   **Intuitive API:** Users only need to specify what they want to change and provide enough information to identify the target axis.
    -   **Reduces Boilerplate:** Eliminates the need to copy-paste large default configuration objects.

-   **Cons:**
    -   **Requires Clear Documentation:** The matching logic (especially the fallback) must be clearly documented so users understand how to target an axis correctly.

### Approach 2: Explicit Override Objects

-   **Description:** The API could be structured to separate the base axis definitions from the overrides. This would involve a separate `axisOverrides` array.

    ```typescript
    axisOverrides: [
        {
            match: { position: 'left', type: 'number' },
            options: { title: { text: 'New Title' } },
        },
    ];
    ```

-   **Pros:**

    -   **Very Powerful:** The `match` object could be extended to support complex selectors.
    -   **Clear Separation of Concerns:** A clean distinction between the chart's structure and its cosmetic configuration.

-   **Cons:**
    -   **High Verbosity:** This is a much more complex and verbose API for making a simple change.
    -   **Unconventional:** This pattern is not common in other charting libraries, increasing the learning curve.

### Approach 3: Theme-Based Overrides

-   **Description:** Use the existing `theme` object to define overrides for specific axis types and positions.

    ```typescript
    theme: {
        overrides: {
            cartesian: {
                axes: {
                    number: {
                        left: {
                            title: {
                                text: '...';
                            }
                        }
                    }
                }
            }
        }
    }
    ```

-   **Pros:**

    -   **Reusable:** Excellent for defining a consistent look and feel across an entire application.

-   **Cons:**
    -   **Wrong Tool for the Job:** Theming is intended for global, application-wide styles, not for one-off modifications to a single chart instance.
    -   **Verbose for Single Changes:** Requires a deeply nested object to change a single property on a single chart.

### Recommended Strategy

Approach 1, **Deep Merging with Heuristic Matching**, is the clear winner for instance-level configuration. It provides the best balance of power and ease of use. This should be complemented by the **Theme-Based Overrides** (Approach 3) for managing global styles. The instance-level `axes` array would be merged on top of any theme configuration, giving developers a clear hierarchy of control.
