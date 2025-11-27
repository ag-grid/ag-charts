# Axis Configuration: Competitive Analysis

This document analyzes how competing charting libraries (Highcharts, Chart.js, ECharts) handle common axis configuration challenges. The findings will inform the proposed improvements for AG Charts.

## Key Themes

The analysis focused on the following themes identified from the product requirements:

1.  **API & Configuration Usability**
2.  **Axis Domain Control**
3.  **Dynamic & Responsive Axes**

---

## 1. API & Configuration Usability

### Axis Referencing & Linking

A universal feature is the ability to assign a unique identifier to an axis and link a data series to it directly.

-   **Highcharts:** Assigns an `id` to any `xAxis` or `yAxis`. Series are linked via `series.xAxis` and `series.yAxis` properties, which can be the index or the `id` of the axis.
-   **Chart.js:** Axes are defined in `options.scales` with a key that serves as the `id`. Datasets are linked using `xAxisID` and `yAxisID` properties.
-   **ECharts:** An `id` can be assigned to each axis. Series are linked using `xAxisId` and `yAxisId`.

**Conclusion:** The proposal to add an `id` to axes and link series to them is a standard and well-supported pattern that AG Charts should adopt.

### Configuration Defaults

All libraries feature a robust system of cascading defaults, where user-defined options are deeply merged with the default configuration. Setting a single property (e.g., the axis title) does not cause other defaults (like label formatting or gridline visibility) to be lost.

**Conclusion:** The issue described in the requirements is a deficiency in the AG Charts implementation. The proposed solution should aim to bring AG Charts in line with industry-standard deep-merging of options.

### Polar Axis Configuration

Competitors handle polar axes by defining a dedicated coordinate system and then specifying how axes map to its dimensions (angle and radius).

-   **Highcharts:** A global `chart.polar: true` flag transforms the chart. The standard `xAxis` becomes the angle axis, and the `yAxis` becomes the radial axis.
-   **Chart.js:** Uses a dedicated `radialLinear` scale, which is configured under `options.scales.r`. This single radial scale handles both angle and radius aspects implicitly.
-   **ECharts:** Provides the most explicit and flexible API. A `polar` component defines the coordinate system's center and radius. Axes are then defined separately as `angleAxis` and `radiusAxis`.

**Conclusion:** The proposal to use `position: 'angle'` and `position: 'radial'` combined with a `type` is a strong approach. It mirrors the explicit nature of the ECharts API, which provides clarity and power.

---

## 2. Axis Domain Control

### Min/Max and Padding

Libraries offer multiple ways to control the axis domain, including hard limits and soft padding.

-   **Highcharts:**

    -   `min` and `max` for hard limits.
    -   `minPadding` and `maxPadding` add a percentage-based buffer, but they are ignored if `min` or `max` are set.
    -   `softMin` and `softMax` are internal concepts but point to the need for non-strict domain suggestions.

-   **Chart.js:**

    -   `min` and `max` for hard limits.
    -   `suggestedMin` and `suggestedMax` provide "soft" limits that are only used if the data does not exceed them.
    -   Padding is controlled at the chart layout level (`layout.padding`) rather than per-axis.

-   **ECharts:**
    -   `min` and `max` for hard limits.
    -   `boundaryGap` provides padding. For value axes, it can be set as a percentage (e.g., `['20%', '20%']`), which is very flexible.
    -   `scale: true` allows an axis to "scale" to the data, ignoring a zero baseline.

**Conclusion:** The user need for both hard limits and flexible padding is well-established. The concept of a "soft" min/max (`suggestedMin`/`suggestedMax` in Chart.js) and percentage-based padding (`boundaryGap` in ECharts) are excellent models to consider for the AG Charts proposal.

---

## 3. Dynamic & Responsive Axes

### Zooming and Label Collision

All libraries provide mechanisms to prevent labels from overlapping, especially when zooming.

-   **Highcharts:** Offers `tickPixelInterval` to enforce a minimum distance between ticks, `autoRotation` of labels, and a `step` property to show every n-th label.
-   **Chart.js:** Features `autoSkip` to automatically hide labels to prevent overlap, with `autoSkipPadding` to control the spacing.
-   **ECharts:** Uses `axisLabel.interval` to control which labels are shown and supports label rotation. It also has an `overflow` property to control label rendering outside the grid.

**Conclusion:** The requested features for zoom-based interval and format changes are fundamental for readability. The suggestions in the requirements document, particularly decoupling ticks, labels, and gridlines, represent an opportunity for AG Charts to offer more granular and powerful control than its competitors.
