# Axis Domain Analysis of Charting Libraries

This document analyzes how various charting libraries handle the setting of axis domains, including minimum and maximum values, padding, and the concept of a "domain".

## Summary Table

| Library               | Min/Max Control                                            | Padding Control                | Domain Concept        |
| --------------------- | ---------------------------------------------------------- | ------------------------------ | --------------------- |
| **LightningChart JS** | `setInterval(min, max)`                                    | Manual calculation             | Interval              |
| **SciChart.js**       | `visibleRange`                                             | `growBy`                       | `visibleRange`        |
| **TradingView**       | `autoScale`, `scaleMargins`                                | `scaleMargins`, `rightOffset`  | Visible Range         |
| **Highcharts**        | `min`, `max`                                               | `minPadding`, `maxPadding`     | `min`/`max`           |
| **ECharts**           | `min`, `max`                                               | `boundaryGap`, `offset`        | `min`/`max`           |
| **AMCharts**          | `min`, `max`, `strictMinMax`                               | `extraMin`, `extraMax`         | `min`/`max`           |
| **ZingChart**         | `values: 'min,max,step'`                                   | `margin: 'dynamic'`            | `min`/`max`           |
| **FusionCharts**      | `yAxisMinValue`, `yAxisMaxValue`                           | `chart*Margin`, `*Padding`     | `yAxis*Value`         |
| **Chart.js**          | `min`, `max`, `suggestedMin/Max`                           | `grace`, `layout.padding`      | `min`/`max`           |
| **Google Charts**     | `viewWindow: {min, max}`                                   | `chartArea`                    | `viewWindow`          |
| **Recharts**          | `domain: [min, max]`                                       | `padding`, `domain` offsets    | `domain`              |
| **D3.js**             | `scale.domain([min, max])`                                 | Manual domain extension        | `domain`              |
| **ApexCharts**        | `min`, `max`                                               | `grid.padding`                 | `min`/`max`           |
| **Plotly.js**         | `range: [min, max]`                                        | `automargin`, `margin.pad`     | `domain` (positional) |
| **Kendo UI**          | `min`, `max`                                               | `padding`                      | `min`/`max`           |
| **AnyChart**          | `minimum()`, `maximum()`, `softMinimum()`, `softMaximum()` | `minimumGap()`, `maximumGap()` | Scale                 |
| **Victory**           | `domain`, `minDomain`, `maxDomain`                         | `domainPadding`                | `domain`              |
| **Nivo**              | `min`, `max`                                               | `tickPadding`                  | `valueScale`          |

---

## Detailed Analysis

### LightningChart JS

-   **Min/Max (Hard/Soft):** The visible range is called an "interval". You set it with `setInterval(start, end)`.
-   **Padding:** No direct padding property. You must manually calculate the padding and adjust the `start` and `end` values in `setInterval`.
-   **Domain:** The "domain" is the "interval". By default, axes fit the data, but this can be changed with `setScrollStrategy`.

### SciChart.js

-   **Min/Max (Hard/Soft):** The `visibleRange` property sets the min and max.
-   **Padding:** The `growBy` property adds padding as a factor (e.g., `new NumberRange(0.1, 0.1)` for 10% padding on both ends).
-   **Domain:** The `visibleRange` property effectively defines the domain.

### TradingView Lightweight Charts

-   **Min/Max (Hard/Soft):** The price scale (y-axis) uses `autoScale: false` to disable automatic scaling. There is no direct `min`/`max` setting; it's controlled by `scaleMargins`. The time scale (x-axis) has a `rightOffset`.
-   **Padding:** The price scale uses `scaleMargins: { top: 0.2, bottom: 0.1 }` to set padding as a proportion of the height. The time scale has `rightOffset` for padding on the right.
-   **Domain:** The visible range of the data.

### Highcharts

-   **Min/Max (Hard/Soft):** `min` and `max` properties set the hard limits of the axis.
-   **Padding:** `minPadding` and `maxPadding` add padding as a percentage of the axis length. These are ignored if `min` or `max` are set.
-   **Domain:** The range of values defined by `min` and `max`.

### ECharts

-   **Min/Max (Hard/Soft):** `min` and `max` properties set the hard limits. `scale: true` allows the axis to not start at zero.
-   **Padding:** `boundaryGap` adds padding to the ends of the axis. `offset` creates a margin between the axis and the chart area.
-   **Domain:** The range of values defined by `min` and `max`.

### AMCharts

-   **Min/Max (Hard/Soft):** `min` and `max` set the limits. `strictMinMax: true` forces the axis to use the exact `min` and `max` values.
-   **Padding:** `extraMin` and `extraMax` add padding relative to the current range.
-   **Domain:** The range of values defined by `min` and `max`.

### ZingChart

-   **Min/Max (Hard/Soft):** The `values` attribute in the `scaleX` or `scaleY` object sets the min, max, and step: `values: '0,100,10'`.
-   **Padding:** `plotarea: { margin: 'dynamic' }` allows ZingChart to automatically calculate margins.
-   **Domain:** The range of values defined by `min` and `max`.

### FusionCharts

-   **Min/Max (Hard/Soft):** `yAxisMinValue` and `yAxisMaxValue` set the limits for the y-axis.
-   **Padding:** A large number of attributes control padding, including `chartLeftMargin`, `chartRightMargin`, `captionPadding`, `xAxisNamePadding`, `yAxisValuesPadding`, etc.
-   **Domain:** The range of values defined by `yAxisMinValue` and `yAxisMaxValue`.

### Chart.js

-   **Min/Max (Hard/Soft):** `min` and `max` set hard limits. `suggestedMin` and `suggestedMax` provide soft limits that will be extended if the data exceeds them.
-   **Padding:** The `grace` property adds a percentage margin to the calculated `min` and `max`. `layout.padding` controls the padding of the entire chart area.
-   **Domain:** The range of values defined by `min` and `max`.

### Google Charts

-   **Min/Max (Hard/Soft):** `viewWindow: { min, max }` sets the hard limits.
-   **Padding:** `chartArea: { left, top, width, height }` controls the drawable area of the chart, effectively managing padding.
-   **Domain:** The `viewWindow` defines the domain.

### Recharts

-   **Min/Max (Hard/Soft):** The `domain` prop on `XAxis` and `YAxis` sets the min and max: `domain={[0, 100]}`. It can also use `'dataMin'` and `'dataMax'`.
-   **Padding:** The `padding` prop on `XAxis` and `YAxis` adds padding to the ends of the axis: `padding={{ top: 20, bottom: 20 }}`. You can also add offsets to the `domain`, e.g., `domain={['dataMin - 10', 'dataMax + 10']}`.
-   **Domain:** The `domain` prop directly controls the domain.

### D3.js

-   **Min/Max (Hard/Soft):** The `scale.domain([min, max])` method sets the input domain of the scale.
-   **Padding:** There is no direct padding property. You must manually extend the domain to add padding. For band scales, `scaleBand.padding()` is available.
-   **Domain:** The `domain` of the scale.

### ApexCharts

-   **Min/Max (Hard/Soft):** `min` and `max` properties in the `xaxis` and `yaxis` objects set the limits.
-   **Padding:** `grid.padding` controls the padding around the entire chart area.
-   **Domain:** The range of values defined by `min` and `max`.

### Plotly.js

-   **Min/Max (Hard/Soft):** `range: [min, max]` sets the limits. `autorange: false` is required.
-   **Padding:** `automargin: true` automatically adjusts margins. `layout.margin.pad` sets padding between the plot area and axis lines.
-   **Domain:** The `domain` property is used to position the axis within the plot area, which is useful for subplots. It does not control the data range.

### Kendo UI

-   **Min/Max (Hard/Soft):** `min` and `max` properties set the limits for both value and category axes.
-   **Padding:** The `padding` property on axis labels controls their spacing. `chartArea` and `plotArea` also have `margin` and `padding`.
-   **Domain:** The range of values defined by `min` and `max`.

### AnyChart

-   **Min/Max (Hard/Soft):** `minimum()` and `maximum()` set hard limits. `softMinimum()` and `softMaximum()` provide soft limits.
-   **Padding:** `minimumGap()` and `maximumGap()` add padding as a ratio of the scale's range.
-   **Domain:** The "scale" of the axis, which can be linear, logarithmic, ordinal, or dateTime.

### Victory

-   **Min/Max (Hard/Soft):** The `domain` prop sets the explicit range. `minDomain` and `maxDomain` can be used to set the minimum and maximum expected values.
-   **Padding:** The `domainPadding` prop adds space between the data and the edges of the domain.
-   **Domain:** The `domain` prop directly controls the domain.

### Nivo

-   **Min/Max (Hard/Soft):** `min` and `max` properties within the `valueScale` object set the limits.
-   **Padding:** `tickPadding` controls the spacing between tick marks and their labels. Visual padding is achieved by extending the `min` and `max` of the `valueScale`.
-   **Domain:** The `valueScale` defines the domain.
