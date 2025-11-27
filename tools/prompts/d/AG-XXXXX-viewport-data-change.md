[Charts] Viewport Handling on Data Change

1. **Brief Requirements statement**

Define a set of predictable, configurable policies for how the chart viewport should react to data changes, including automatic panning for live data and stable views for interactive analysis.

2. **Current behaviour & Problem statement**

When a chart's underlying data changes, the current viewport may no longer be relevant. AG Charts currently lacks a clear or configurable mechanism to control viewport behaviour on data updates, leading to a potentially confusing user experience.

3. **Use cases**

-   **Live Data Streaming:** A financial analyst is watching a stock chart that updates every second with a new price. The analyst wants the chart to automatically scroll to the right to show the latest price, preserving their chosen zoom level constant for trend analysis. This is the primary use case for the `"stickToEnd": true` setting.

    -   _Data Example:_ A line chart displays stock prices for the last 5 minutes. Every second, a new data point is appended to the series, for example `data.push({ time: '10:05:01', price: 150.50 })`.

-   **Interactive Data Analysis:** A data scientist is analyzing a large dataset of sensor readings over a year. They zoom into a specific week in June to investigate an anomaly. The underlying dataset is then corrected with a few new data points added in January. The data scientist expects their view of that week in June to remain completely stable, not panning or zooming unexpectedly. This is the default `policy: 'preserveDomain'` behaviour.

    -   _Data Example:_ A scatter chart shows data from `2023-01-01` to `2023-12-31`. The user is zoomed into the domain `[new Date('2023-06-05'), new Date('2023-06-12')]`. A new data point for `2023-01-15` is added. The user's view should not change.

-   **Exploring Related Data (with `policy: 'preserveDomain'`):** A user is looking at a chart of monthly sales. They are viewing the first six months of the year. They click a button to add a new series for "projected sales", which includes data for the entire year. With `policy: 'preserveDomain'`, the chart's current view of the first six months remains fixed, and the new data for the latter half of the year is not immediately visible.

    -   _Data Example:_ A bar chart shows sales for `Jan` to `Jun`. The viewport is `['Jan', 'Jun']`. A new series is added with data for `Jan` to `Dec`. With `policy: 'preserveDomain'`, the viewport remains `['Jan', 'Jun']`, and the `Jul` to `Dec` data is outside the current view.

-   **Exploring Related Data (with `policy: 'preserveData'`):** A user is looking at a chart of monthly sales. They are viewing the first six months of the year. They click a button to add a new series for "projected sales", which includes data for the entire year. The user wants the chart to zoom out to show all data for both actual and projected sales, while preserving the start of the year in view. This is a use case for `policy: 'preserveData'`.
    -   _Data Example:_ A bar chart shows sales for `Jan` to `Jun`. The viewport is `['Jan', 'Jun']`. A new series is added with data for `Jan` to `Dec`. With `policy: 'preserveData'`, the viewport might expand to `['Jan', 'Dec']` to encompass the newly added data range.

4. **API Design**

Location: `options.zoom.onDataChange`.

New Members:

```typescript
interface AgChartOptions {
    // ... existing chart options

    zoom?: {
        // ... other zoom options e.g. enabled: true

        /**
         * Defines the behaviour of the chart's zoom and pan when series data is updated.
         */
        onDataChange?: {
            /**
             * Sets the policy for how the axis domains should react to data changes
             * when the 'stickToEnd' condition is not met.
             *
             * - `preserveDomain`: (Default) The visible axis domains remain fixed (e.g. `[new Date('2023-01-01'), new Date('2023-02-01')]`).
             * - `preserveData`: Adjusts the domain to ensure the same data points remain in view.
             * - `reset`: Resets the view to the show the full data range.
             * - `resize`: Allows the chart to resize as it will.
             *
             * @default 'preserveDomain'
             */
            policy?: 'preserveDomain' | 'preserveData' | 'reset' | 'resize';

            /**
             * If true, the chart will automatically pan to preserve the latest data point in view.
             * This behaviour is conditional: it only applies if the user's viewport is
             * already at the end of the data range. It overrides the 'policy' option
             * when this condition is met.
             *
             * @default false
             */
            stickToEnd?: boolean;
        };
    };
}
```

Default Values:

-   `zoom.onDataChange.policy`: `'preserveDomain'`
-   `zoom.onDataChange.stickToEnd`: `true` (maybe only on financial charts?)

5. **API Deprecations/Hiding**

None.

6. **Breaking changes in API or behaviour**

Defaults will cause breaking changes

7. **UX Design**

Not applicable, as this is a developer-facing API change.

8. **Dependencies**

None explicitly mentioned in this document.

9. **Functional Acceptance Criteria**

-   **General Rules**

    -   **No Zoom:** When no zoom is applied (the viewport shows the full `[0, 1]` range), the chart will always resize to fit all data, regardless of the `onDataChange` setting. TBD if this makes sense
    -   **Multiple Series:** When multiple series sharing an axis are updated, the changes are evaluated on the union of all data for that axis. For example, the "end of the data" is the maximum x-value across all series on that axis.

-   **`stickToEnd: true` (Conditional Override)**

    -   **Condition:** This policy is only active if the user's viewport is scrolled to the very end of the data range _before_ the data update.
    -   **behaviour:** When new data is appended to the end of the dataset, the chart pans to preserve the newest data point in view, maintaining the same zoom level. It overrides any other `policy`.
    -   **Visual Description:**
        -   **Before:** A line chart shows data points at `x=new Date('2023-01-08'), new Date('2023-01-09'), new Date('2023-01-10')`. The viewport is zoomed to `[new Date('2023-01-07T12:00:00Z'), new Date('2023-01-10T12:00:00Z')]`. The right edge of the chart shows the last data point at `new Date('2023-01-10')`.
        -   **Change:** A new data point `{x: new Date('2023-01-11'), y: 5}` is appended.
        -   **After:** The viewport pans to `[new Date('2023-01-08T12:00:00Z'), new Date('2023-01-11T12:00:00Z')]`. The data point at `new Date('2023-01-08')` is now off-screen to the left, and the new point at `new Date('2023-01-11')` is visible on the right. The visual width of the data points remains the same.
    -   **Complex Updates:** If data is added at both the beginning and end (e.g., points at `x=new Date('2023-01-01')` and `x=new Date('2023-01-11')` added to data `x=new Date('2023-01-02')..new Date('2023-01-10')`), and the user is viewing the end (`x=new Date('2023-01-10')`), `stickToEnd` will pan the view to show `x=new Date('2023-01-11')`. The visibility of the new point at `x=new Date('2023-01-01')` is not guaranteed and depends on the zoom level.

-   **behaviour by `policy` (when `stickToEnd` is `false` or its condition is not met)**

    -   **`policy: 'preserveDomain'`**

        -   **Description:** The viewport's start and end axis values are preserved.
        -   **Visual Description (Data added in middle):**
            -   **Before:** A bar chart shows two bars at `x=new Date('2023-01-01')` and `x=new Date('2023-01-03')`. The viewport domain is `[new Date('2023-01-01'), new Date('2023-01-04')]`.
            -   **Change:** A new data point `{x: new Date('2023-01-02'), y: 6}` is added.
            -   **After:** The viewport domain remains `[new Date('2023-01-01'), new Date('2023-01-04')]`. A new bar simply appears between the original two.
        -   **Visual Description (Data removed from end):**
            -   **Before:** A bar chart has three bars at `x=new Date('2023-01-01'), new Date('2023-01-02'), new Date('2023-01-03')`. The viewport is `[new Date('2023-01-01'), new Date('2023-01-04')]`.
            -   **Change:** The data for `x=new Date('2023-01-03')` is removed.
            -   **After:** The viewport remains `[new Date('2023-01-01'), new Date('2023-01-04')]`. The third bar disappears from the chart.

    -   **`policy: 'preserveData'`** TBD

        -   **Description:** The viewport adjusts (pans or zooms) to ensure the same data points that were at the edges of the view remain visible.
        -   **Visual Description (Data added, changing scale):**
            -   **Before:** A line chart shows data where the y-values range from 10 to 20. The y-axis viewport is `[5, 25]`.
            -   **Change:** A new data point with `y=30` is added.
            -   **After:** The y-axis viewport zooms out to `[5, 35]` to ensure the original data and the new peak are both visible.
        -   **Visual Description (Data added at beginning):**
            -   **Before:** A line chart shows data from `new Date('2023-01-02')` to `new Date('2023-01-10')`. The viewport is `[new Date('2023-01-02'), new Date('2023-01-10')]`.
            -   **Change:** A new data point `{x: new Date('2023-01-01'), y: 10}` is added.
            -   **After:** The viewport pans to `[new Date('2023-01-01'), new Date('2023-01-09')]` to keep the original data points in view, effectively shifting the domain.

    -   **`policy: 'reset'`**

        -   **Description:** The zoom is reset to show the full range of the new data.
        -   **Visual Description:**
            -   **Before:** The user is zoomed into a small section of the data, e.g., `[new Date('2023-01-15'), new Date('2023-01-25')]` out of `[new Date('2023-01-01'), new Date('2023-01-31')]`.
            -   **Change:** Any data change occurs.
            -   **After:** The viewport is reset to `[new Date('2023-01-01'), new Date('2023-01-31')]` (or whatever the new full data range is).

    -   **`policy: 'resize'`**
        -   **Description:** The chart's default, non-configurable resizing logic is used. This may result in the viewport changing in unpredictable ways and is not recommended for applications requiring stable zoom/pan.

10. **Non-functional Acceptance Criteria**

-   **Documentation:** All new `zoom.onDataChange` options must be fully documented.
-   **Performance:** The new logic should not introduce any noticeable performance regressions.
-   **Backward Compatibility:** This is a breaking change but original behaviour is still available

11. **Out of Scope**

None explicitly mentioned in this document.
