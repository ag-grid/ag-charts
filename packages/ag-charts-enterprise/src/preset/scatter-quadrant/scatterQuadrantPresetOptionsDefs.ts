import { _ModuleSupport } from 'ag-charts-community';
import { type OptionsDefs, array, boolean, defined, numericValue, string, without } from 'ag-charts-core';
import type { AgQuadrantChartOptions } from 'ag-charts-types';

const pivotOptionsDefs: OptionsDefs<NonNullable<AgQuadrantChartOptions['pivot']>> = {
    x: numericValue,
    y: numericValue,
};

const regionOptionsDefs: OptionsDefs<NonNullable<NonNullable<AgQuadrantChartOptions['regions']>['topLeft']>> = {
    fill: defined,
    fillOpacity: defined,
    label: defined,
    marker: defined,
    stroke: defined,
    strokeOpacity: defined,
    strokeWidth: defined,
};

const axisOptionsDefs: OptionsDefs<NonNullable<AgQuadrantChartOptions['xAxis']>> = {
    ...without(_ModuleSupport.numberAxisOptionsDefs, ['crossAt', 'crossLines', 'position']),
};

export const scatterQuadrantOptionsDefs: OptionsDefs<AgQuadrantChartOptions> = {
    // Quadrant
    alignAxesToPivot: boolean,
    pivot: pivotOptionsDefs,
    regions: {
        bottomLeft: regionOptionsDefs,
        bottomRight: regionOptionsDefs,
        topLeft: regionOptionsDefs,
        topRight: regionOptionsDefs,
    },
    xAxis: axisOptionsDefs,
    yAxis: axisOptionsDefs,

    // Scatter
    cursor: defined,
    errorBar: defined,
    fill: defined,
    fillOpacity: defined,
    highlight: defined,
    itemStyler: defined,
    lineDash: defined,
    lineDashOffset: defined,
    label: defined,
    labelName: defined,
    labelKey: defined,
    legendItemName: defined,
    maxRenderedItems: defined,
    maxSize: defined,
    minSize: defined,
    nodeClickRange: defined,
    styler: defined,
    showInLegend: defined,
    shape: defined,
    size: defined,
    sizeKey: defined,
    stroke: defined,
    strokeOpacity: defined,
    strokeWidth: defined,
    tooltip: defined,
    xName: defined,
    xKey: defined,
    yName: defined,
    yKey: defined,

    // Chart
    animation: defined,
    container: defined,
    contextMenu: defined,
    context: () => true,
    data: array,
    dataIdKey: string,
    dataSource: defined,
    enableRtl: boolean,
    footnote: defined,
    formatter: defined,
    height: defined,
    initialState: defined,
    listeners: defined,
    locale: defined,
    minHeight: defined,
    minWidth: defined,
    padding: defined,
    selection: defined,
    subtitle: defined,
    title: defined,
    theme: defined,
    width: defined,
};
