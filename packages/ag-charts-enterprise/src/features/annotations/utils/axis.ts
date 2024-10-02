import type { _ModuleSupport } from 'ag-charts-community';

export function calculateAxisLabelPadding(axisLayout: _ModuleSupport.AxisLayout) {
    return axisLayout.gridPadding + axisLayout.seriesAreaPadding + axisLayout.tickSize + axisLayout.label.padding;
}
