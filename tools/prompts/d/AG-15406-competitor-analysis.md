# Competitor Analysis: Data Update Visual Indicators

This document analyzes how competing charting libraries handle visual indicators for data updates, based on the requirements in `AG-15406`.

## Highcharts

**Website:** https://www.highcharts.com/

**Analysis of Demo:** [https://www.highcharts.com/demo/highcharts/dynamic-update](https://www.highcharts.com/demo/highcharts/dynamic-update)

### Key Features

-   **Real-time Data Updates:** The demo showcases a spline chart that smoothly updates every second, simulating a real-time data feed.
-   **Animation on Update:** When a new data point is added, the chart animates to accommodate the new point. The existing line shifts to the left, and the new point is drawn on the right.
-   **No Explicit "Flash" Effect:** The Highcharts demo does not feature a "flash" effect on the entire chart, the data point, or the axis. The update is indicated by the animation of the series.

### Recommendations for AG Charts

-   **Differentiate with a "Flash" Effect:** Since Highcharts' approach is based on animation, AG Charts can differentiate by offering a more explicit and configurable "flash" effect as requested in `AG-15406`. This would provide a clear visual cue that a data update has occurred, which is especially useful for less frequent updates or when the user's attention needs to be drawn to the change.
-   **Offer Granular Control:** The request for flashing the chart, a datum, or a category is a strong differentiator. Highcharts does not appear to offer this level of granularity in their public-facing demos. Providing this would be a significant feature advantage.
-   **Learn from Highcharts' Smoothness:** While implementing the flash effect, it's important to ensure that it complements, rather than disrupts, the existing animations. The smoothness of the Highcharts update is a good quality to maintain.
