# Product Requirements Analysis: Data Update Visual Indicators

## Executive Summary

This document outlines a proposal for implementing a visual indicator for data updates in AG Charts, as per the requirements in `AG-15406`. The proposed solution is to introduce a configurable "flash" effect that can be applied to the entire chart, individual data points, or category bands. This feature will provide users with a clear visual cue when data changes, enhancing the user experience for real-time or frequently updated charts.

The implementation will be designed to be flexible, easy to use, and will minimize breaking changes to the existing API.

## Requirement Themes

The core themes identified from the product requirements are:

-   **Visual Indication of Data Updates:** The primary goal is to provide a clear visual signal when the chart's data has been updated.
-   **Granularity of Indication:** The user should be able to control what is visually indicated. The options are:
    -   The entire chart.
    -   The specific data point (datum) that was updated.
    -   The category (axis band) corresponding to the updated data.
-   **Configurability:** The visual effect itself should be customizable. Key options include:
    -   Color of the flash.
    -   Opacity of the flash.
    -   Duration of the flash and fade-out.
-   **Ease of Use:** The feature should be easy to enable and configure.

## Implementation Proposal

### API Design

To maintain consistency with the existing API, the proposed feature will be configured through a new set of options within the chart options.

The proposed top-level option will be `flashOnUpdate`, which will contain all the settings related to the flash effect.

```typescript
interface AgChartOptions {
    // ... existing options
    flashOnUpdate?: AgFlashOnUpdateOptions;
}
```

### Options Setup

The `AgFlashOnUpdateOptions` object will be structured as follows:

```typescript
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
_   flashDuration?: number;
    /** The duration of the fade-out effect in milliseconds. */
    fadeDuration?: number;
}
```

**Default Values:**

-   `enabled`: `false`
-   `item`: `'chart'`
-   `color`: `'rgba(0, 128, 0, 0.5)'` (a semi-transparent green)
-   `opacity`: `1`
-   `flashDuration`: `200`
-   `fadeDuration`: `1000`

### Minimizing Breaking Changes

This proposal introduces a new, optional property (`flashOnUpdate`) to the chart options. As it will be disabled by default (`enabled: false`), it will not affect any existing chart configurations. This ensures that the introduction of this feature will not cause any breaking changes.

### Behavioral Flexibility

The proposed `item` property provides the flexibility to choose the granularity of the flash effect:

-   `'chart'`: A flash overlay will cover the entire chart area. This is useful for indicating a general data refresh.
-   `'datum'`: The specific shape representing the updated data point (e.g., a bar, a column, a marker) will flash. This is ideal for highlighting specific changes in the data.
-   `'category'`: The background of the category axis band corresponding to the updated data will flash. This is suitable for cartesian charts with band scales, providing a clear indication of which category has new data.

The other options (`color`, `opacity`, `flashDuration`, `fadeDuration`) provide further flexibility to customize the visual appearance and timing of the effect to suit different application themes and user preferences.

### Considerations

-   High frequency updates - this needs to short-circuit or debounce the flash.

## Rationale

The proposed design was chosen for the following reasons:

-   **Consistency:** The use of an options object under the main chart options is consistent with how other features are configured in AG Charts.
-   **Discoverability:** Placing all related options under a single `flashOnUpdate` property makes the feature easy to discover and understand.
-   **Flexibility:** The proposed options provide a good balance of power and simplicity, allowing for a wide range of visual effects while keeping the configuration straightforward.
-   **No Breaking Changes:** The additive nature of the change ensures that existing users will not be affected.
-   **Competitive Advantage:** As identified in the competitor analysis, offering a highly configurable, built-in flash effect is a clear differentiator from competitors like Highcharts, who rely on more subtle animations for indicating updates.
