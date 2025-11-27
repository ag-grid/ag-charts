[Charts] Visual indicator for data updates

1.  **Brief Requirements statement**

    -   Provide a configurable visual indicator when data is updated in AG Charts. The effect can be applicable to the entire chart, individual data points, or axis band.

2.  **Current behaviour & Problem statement**

    -   Currently, there is no built-in mechanism to visually highlight data changes in the chart.
    -   Users have no immediate visual feedback when the underlying data of a chart is updated, which is problematic for real-time or frequently updated data scenarios or for charts that update infrequently.

3.  **Use cases**

    -   Users want to build applications with real-time data feeds (e.g., stock tickers, monitoring dashboards) and need a way to draw the end-user's attention to the parts of the chart that have changed.
    -   Users want to draw attention to an infrequently updated chart when it updates.

4.  **API Design**

    -   **Location:** `AgChartOptions`
    -   **New Members:**

        ```typescript
        interface AgChartOptions {
            // ... existing options
            flashOnUpdate?: AgFlashOnUpdateOptions;
        }

        interface AgFlashOnUpdateOptions {
            /** Whether the flash effect is enabled. */
            enabled?: boolean;
            /** What part of the chart to flash. */
            item?: 'chart' | 'datum' | 'category';
            /** The color of the flash effect. */
            color?: string;
            /** The opacity of the flash effect. */
            opacity?: number;
            /** The duration of the flash in milliseconds. */
            flashDuration?: number;
            /** The duration of the fade-out effect in milliseconds. */
            fadeDuration?: number;
        }
        ```

    -   **Default Values: (TBD)**
        -   `enabled`: `false`
        -   `item`: `'chart'`
        -   `color`: `'rgba(0, 128, 0, 0.5)'`
        -   `opacity`: `1`
        -   `flashDuration`: `200`
        -   `fadeDuration`: `1000`

5.  **API Deprecations/Hiding**

    -   None.

6.  **Breaking changes in API or behavior**

    -   None. This is a new, opt-in feature that is disabled by default.

7.  **UX Design**

    -   **Interaction Notes:** A flash animation will be triggered on data updates. The visual appearance (color, opacity, duration) of the flash is configurable. The scope of the flash can be the whole chart, the specific datum shape(s), or the category axis band(s).

8.  **Dependencies**

    -   None.

9.  **Functional Acceptance Criteria**

    -   When `flashOnUpdate.enabled` is `true`, a visual flash effect occurs upon data update.
        -   A data update is defined when the `data` object is changed via `update()` or `updateDelta()`.
        -   We could limit some functionality to the transaction API only if necessary.
        -   The flash is above all other items (TBD.)
    -   The `item` option correctly targets `'chart'`, `'datum'`, or `'category'`.
        -   `chart` - TBD the entire chart container or just series area.
        -   `datum` - The updated marker/bar. This is very series specific.
        -   `category` - The category band on the axis. Only for band-scale catesian axes.
    -   The visual properties of the flash (`color`, `opacity`, `flashDuration`, `fadeDuration`) are correctly applied.
    -   The implementation should gracefully handle high-frequency updates to avoid overwhelming the user or causing performance issues (e.g., by debouncing or short-circuiting).

10. **Non-functional Acceptance Criteria**

    -   **State:** The feature is disabled by default (`enabled: false`).
    -   **Documentation:** The `flashOnUpdate` options are fully documented in the API reference. A new documentation page is created to explain the feature with examples for each `item` type.
    -   **Accessibility:** The default flash effect should be subtle enough not to cause issues for users with photosensitive epilepsy.
    -   **Localization:** Not applicable.
    -   **RTL Support:** Not applicable.
    -   **Theming:** The flash color should be customizable to allow integration with different application themes.

11. **Out of Scope**
    -   Any animation effects beyond the proposed "flash and fade".
