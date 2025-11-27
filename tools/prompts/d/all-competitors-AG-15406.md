# Competitor Analysis: Data Update Visual Indicators (AG-15406)

## Executive Summary

This document provides a competitive analysis of how different charting libraries handle visual feedback for data updates. The analysis focuses on the "flash on update" feature proposed in `AG-15406-product-analysis.md`.

The key finding is that **none of the analyzed competitors offer a simple, configurable, out-of-the-box "flash on update" feature**. Most libraries provide generic animation or highlighting APIs that could be used to build a similar effect, but this requires custom development work.

This presents a clear opportunity for AG Charts to differentiate itself by providing a built-in, easy-to-use `flashOnUpdate` feature as proposed.

## Overall Findings

| Competitor            | Out-of-the-box "Flash" Feature | Implementation Approach                                                            |
| :-------------------- | :----------------------------- | :--------------------------------------------------------------------------------- |
| **LightningChart JS** | No                             | Custom implementation using the generic `Animation` API.                           |
| **SciChart.js**       | No                             | Custom implementation using the `PaletteProvider` API to change point colors.      |
| **TradingView**       | No                             | No animation features. Requires complete custom implementation.                    |
| **Highcharts**        | No                             | Custom implementation using `point.update()` to change visual properties.          |
| **ECharts**           | No                             | Custom implementation using `dispatchAction` to `highlight` and `downplay` points. |

---

## Competitor Deep Dive

### LightningChart JS

**Analysis:**

LightningChart JS is a high-performance library that focuses on real-time data streaming. It provides a generic `Animation` API that allows developers to create custom animations. However, it does not have a specific feature for highlighting data updates.

**Implementation of "Flash" Effect:**

A developer could use the `Animation` API to create a "flash" effect. This would involve:

1.  Defining an animation that changes the color or opacity of a data point or the chart.
2.  Triggering the animation when the data is updated.
3.  Managing the animation lifecycle to create a "flash" (i.e., animate to a highlighted state and then back to the original state).

This would require a significant amount of custom code and is not a simple, declarative option.

**Conclusion:**

LightningChart JS does not offer a feature comparable to the proposed `flashOnUpdate`.

### SciChart.js

**Analysis:**

SciChart.js is another high-performance library with a focus on scientific and financial charts. It provides a powerful `PaletteProvider` API that allows for per-data-point styling based on programmatic rules.

**Implementation of "Flash" Effect:**

The `PaletteProvider` is well-suited for creating a "flash" effect. A developer could:

1.  Create a custom `PaletteProvider` that changes the color of a data point based on a "flash state".
2.  When data is updated, set the "flash state" for the corresponding data point to `true`.
3.  Use a timer to set the "flash state" back to `false` after a short duration.
4.  Trigger a redraw of the chart to apply the style changes.

While this is a powerful and flexible approach, it still requires custom logic and state management.

**Conclusion:**

SciChart.js provides the tools to build a "flash on update" feature, but it is not available out of the box.

### TradingView Lightweight Charts

**Analysis:**

TradingView's Lightweight Charts are designed for high-performance financial charting. The library prioritizes real-time responsiveness and does not provide any built-in animation or highlighting features for data updates.

**Implementation of "Flash" Effect:**

Implementing a "flash" effect in TradingView Lightweight Charts would be very difficult and would likely require a complex custom implementation, potentially by creating a custom series type. This is not a practical solution for most developers.

**Conclusion:**

TradingView does not offer any features for highlighting data updates.

### Highcharts

**Analysis:**

Highcharts is a popular and feature-rich charting library. It provides animations for data transitions and a `point.update()` method to programmatically change the visual properties of a data point.

**Implementation of "Flash" Effect:**

A developer could use the `point.update()` method to create a "flash" effect:

1.  When data is updated, find the corresponding point object.
2.  Call `point.update()` to change its color or marker.
3.  Use a `setTimeout` to call `point.update()` again to revert the changes.

This is a manual process that requires the developer to manage the state and timing of the flash.

**Conclusion:**

Highcharts does not have a built-in "flash on update" feature, but it can be implemented with custom code.

### ECharts

**Analysis:**

ECharts has a powerful animation engine that automatically handles transitions on data updates. It also provides a `dispatchAction` method to programmatically `highlight` and `downplay` data points or series.

**Implementation of "Flash" Effect:**

The `dispatchAction` method is ideal for creating a "flash" effect:

1.  When data is updated, call `dispatchAction` with the `highlight` action for the relevant data point.
2.  Use a `setTimeout` to call `dispatchAction` with the `downplay` action to remove the highlight.

This is a relatively straightforward way to implement a flash effect, but it still requires custom code and is not a single, configurable option.

**Conclusion:**

ECharts provides the best building blocks for a "flash on update" feature, but it does not offer a simple, declarative `flashOnUpdate` option like the one proposed for AG Charts.
