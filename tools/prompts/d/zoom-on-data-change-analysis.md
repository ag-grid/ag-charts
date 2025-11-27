# Product Requirements: Viewport Handling on Data Change

This document outlines the research and proposal for handling chart zoom and pan (viewport) behavior when series data is updated by adding or removing points.

## 1. The Problem

When a chart's underlying data changes, the current viewport may no longer be relevant. For example, if a user has zoomed into a specific region, and new data is added outside that region, the user is unaware of it. In streaming data scenarios, the chart should automatically pan to show the latest information.

Currently, AG Charts does not provide a clear or configurable mechanism to control this behavior, leading to a potentially confusing user experience. This proposal aims to define a set of predictable, configurable policies for how the chart viewport should react to data changes.

## 2. Use Cases

-   **Live Data Streaming:** In financial charts or monitoring dashboards, the user expects the chart to automatically scroll to show the newest data as it arrives. This is often called a "stick-to-end" behavior.
-   **Interactive Data Analysis:** A user might zoom into a specific period of interest. If the dataset is updated (e.g., with corrections or back-filled data), the user's zoomed-in view should remain stable and not unexpectedly pan or zoom out.
-   **Dynamic Datasets:** When a dataset is completely replaced, the user typically expects the chart to reset its zoom and display the new data in its entirety or to a specific default view like "last 30 days".

## 3. Competitor Analysis

A review of major charting libraries reveals two primary approaches to this problem:

1.  **Declarative Policies:** Libraries provide a high-level option to specify a behavior.

    -   **TradingView (Lightweight Charts):** Excels at financial streaming. Its default behavior is to "stick-to-end," keeping the latest data point visible. This behavior can be disabled by the user.
    -   **ECharts:** Offers a `dataZoom` component that can be configured to follow data, but it's managed more programmatically.

2.  **Programmatic Control:** Libraries provide methods and events, leaving the implementation to the developer.
    -   **Highcharts:** Provides powerful methods like `setExtremes()` and `redraw()`. The developer is responsible for writing the logic to calculate the new axis range and apply it when data changes. This offers maximum flexibility but requires more code.
    -   **Chart.js:** Relies on developers to manage the `min` and `max` of scales upon data updates. Plugins for streaming often wrap this logic.

**Conclusion:** The most user-friendly approach is a hybrid one: provide simple, declarative policies for the most common use cases, while ensuring the underlying programmatic controls are available for advanced scenarios. This proposal focuses on the declarative policies.

## 4. Implementation Proposal for AG Charts

We propose adding a new configuration object to the chart's `zoom` options. This provides a simple, centralized way to control the behavior for the entire chart.

### API Design

The new options will be located under `options.zoom`. We introduce `onDataChange` and a new `initialState` object.

```typescript
interface AgChartOptions {
    // ... existing chart options

    zoom?: {
        // ... other zoom options e.g. enabled: true

        /**
         * Defines the initial visible range of the chart when it first loads,
         * or when the view is reset. If not defined, the chart defaults
         * to showing the full data range.
         */
        initialState?: {
            // This is a conceptual representation. The final API could use
            // proportions, specific domain values, or string keywords.
            // e.g., { proportion: [0.8, 1.0] } for the last 20% of data.
            range: [number, number] | [Date, Date] | 'last-month';
        };

        /**
         * Defines the behavior of the chart's zoom and pan when series data is updated.
         */
        onDataChange?: {
            /**
             * Sets the policy for how the axis domains should react to data changes
             * when the 'stickToEnd' condition is not met.
             *
             * - `preserveDomain`: (Default) The visible axis domains remain fixed.
             * - `preserveDataView`: Adjusts the domain to ensure the same data points remain in view.
             * - `reset`: Resets the view to the defined `zoom.initialState`.
             *
             * @default 'preserveDomain'
             */
            policy?: 'preserveDomain' | 'preserveDataView' | 'reset';

            /**
             * If true, the chart will automatically pan to keep the latest data point in view.
             * This behavior is conditional: it only applies if the user's viewport is
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

### Behavioral Policies Explained

The behavior is controlled by two complementary options: `stickToEnd` and `policy`. The chart first checks if the `stickToEnd` condition is met. If not, it uses the `policy` setting.

#### `stickToEnd: boolean`

-   **Behavior:** If `true`, the chart will pan to keep the most recent data point visible. This behavior is **conditional**: it only applies if the user's viewport is already at the end of the data range. If the user pans away from the end, this automatic panning is suspended, and the behavior falls back to the chosen `policy`.
-   **Default:** `false`
-   **Rationale:** This provides a superior user experience for streaming data, allowing users to temporarily "pause" the live feed by scrolling back, and then have it resume automatically when they scroll back to the end.

#### `policy: 'preserveDomain' | 'preserveDataView' | 'reset'`

This option defines the behavior when the `stickToEnd` condition is not met.

-   **`'preserveDomain'` (Default):**

    -   **Behavior:** The axes' visible ranges (`min` and `max`) are preserved across data updates. The _domain_ is fixed, but the data within it can change.
    -   **Rationale:** This is the most conservative behavior, ensuring a user's selected viewport is not lost. It is the default for backward compatibility.

-   **`'preserveDataView'`:**

    -   **Behavior:** The set of data points visible at the edges of the viewport are preserved. If data is inserted or removed from within the viewport, the domain will stretch or shrink to ensure the same edge data points remain visible. If data is appended to the dataset, the domain will expand to include the new data while keeping the original starting data point visible, effectively 'zooming out' to show the expanded dataset.
    -   **Rationale:** This provides an intuitive experience when the user is focused on a specific set of data points, not an abstract domain range.

-   **`'reset'`:**
    -   **Behavior:** After data is added or removed, the viewport resets to the configuration defined in `zoom.initialState`. If `initialState` is not provided, this policy defaults to fitting the entire new dataset.
    -   **Rationale:** This is extremely flexible. It can be used to ensure a chart always resets to a specific "default" view (e.g., "Last 30 Days") or to simply fit all data.

### Scenario Analysis

This section provides concrete examples of how the proposed policies would behave under different data update scenarios.

#### Scenario 1: Appending Data (e.g., live streaming)

-   **Initial State:** The chart axis displays a range from `0` to `100`. The user is zoomed into the domain `[80, 90]`.
-   **Action:** New data is added, making the full domain `0` to `110`.
-   **Policy Behaviors:**
    -   `policy: 'preserveDomain'`: The viewport remains `[80, 90]`.
    -   `policy: 'preserveDataView'`: The viewport expands to `[80, 110]` (assuming the data point corresponding to the start of the `[80, 90]` range is preserved, and the end expands to include the new data).
    -   `policy: 'reset'`: The viewport resets to show the full data range `[0, 110]` (assuming no `initialState` is defined).
    -   `stickToEnd: true`: The behavior depends on the user's location.
    -   If the user was viewing `[90, 100]` (at the end), the viewport would pan to `[100, 110]`.
    -   If the user was viewing `[80, 90]` (not at the end), the behavior would fall back to the configured `policy`. For `preserveDomain` or `preserveDataView`, the viewport would remain `[80, 90]`.

#### Scenario 2: Inserting Data in the Middle

-   **Initial State:** The chart axis displays from `0` to `100`. The user is zoomed into `[40, 60]`.
-   **Action:** 5 units of data are inserted at position `50`. The data point that was at `60` is now at coordinate `65`.
-   **Policy Behaviors:**
    -   `policy: 'preserveDomain'`: The viewport remains `[40, 60]`. The new data appears, but the data previously at `[51, 60]` is pushed out of view.
    -   `policy: 'preserveDataView'`: The viewport domain expands to `[40, 65]`. The zoom level changes, but the same data points that were at the edges of the view remain at the edges.
    -   `policy: 'reset'`: The viewport resets to show the full data range (assuming no `initialState` is defined).
    -   `stickToEnd: true`: The `stickToEnd` condition is not met because the user is not viewing the end of the data. The behavior is therefore determined by the `policy` setting. For example, if `policy` is `preserveDataView`, the viewport will expand to `[40, 65]`.

#### Scenario 3: Removing Data from the Middle

-   **Initial State:** The chart axis displays from `0` to `100`. The user is zoomed into `[40, 70]`.
-   **Action:** 10 units of data are removed from between `50` and `60`. The data point that was at `70` is now at coordinate `60`.
-   **Policy Behaviors:**
    -   `policy: 'preserveDomain'`: The viewport remains `[40, 70]`. A gap will appear in the data from `50` to `60`, and the data from `60` to `70` is now gone.
    -   `policy: 'preserveDataView'`: The viewport domain shrinks to `[40, 60]`. The zoom level changes to keep the edge data points in view.
    -   `policy: 'reset'`: The viewport resets to show the full data range (assuming no `initialState` is defined).
    -   `stickToEnd: true`: The `stickToEnd` condition is not met because the user is not viewing the end of the data. The behavior is therefore determined by the `policy` setting. For example, if `policy` is `preserveDataView`, the viewport will shrink to `[40, 60]`.

## 5. Rationale and Backward Compatibility

-   **Ease of Use:** By providing simple, declarative policies, we cover a wide range of common use cases with a single line of configuration.
-   **Flexibility:** The combination of policies and the `initialState` option provides a high degree of control for developers.
-   **Backward Compatibility:** The default policy of `'preserveDomain'` ensures that existing applications will not change their behavior when upgrading. The new feature is entirely opt-in.
