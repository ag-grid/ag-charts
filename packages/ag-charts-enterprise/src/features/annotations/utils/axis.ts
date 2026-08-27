import type { _ModuleSupport } from 'ag-charts-community';

/**
 * Distance from the axis line at which the axis places its own tick labels, which is where an
 * annotation's axis label has to sit to line up with them. `label.boxOffset` is the axis's own
 * correction for a boxed tick label (one with a `fill` or a bordered stroke) and is `0` otherwise.
 */
export function calculateAxisLabelPadding(axisLayout: _ModuleSupport.AxisLayout) {
    return (
        axisLayout.gridPadding +
        axisLayout.seriesAreaPadding +
        axisLayout.tickSize +
        axisLayout.label.spacing +
        axisLayout.label.boxOffset
    );
}
