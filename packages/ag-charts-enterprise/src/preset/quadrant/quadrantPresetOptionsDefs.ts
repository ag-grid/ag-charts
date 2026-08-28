import { _ModuleSupport } from 'ag-charts-community';
import {
    type OptionsDefs,
    array,
    boolean,
    defined,
    number,
    numericValue,
    string,
    union,
    without,
} from 'ag-charts-core';
import type { AgQuadrantChartOptions } from 'ag-charts-types';

const axisPlacementOptionsDefs: OptionsDefs<NonNullable<AgQuadrantChartOptions['axisPlacement']>> = {
    crosshairLabel: union('crossing', 'edge'),
    label: union('crossing', 'edge'),
    title: union('crossing', 'edge'),
};

const pivotOptionsDefs: OptionsDefs<NonNullable<AgQuadrantChartOptions['pivot']>> = {
    x: numericValue,
    y: numericValue,
};

const regionLabelOptionsDefs: OptionsDefs<NonNullable<NonNullable<AgQuadrantChartOptions['regions']>['label']>> = {
    border: defined,
    color: defined,
    cornerRadius: defined,
    enabled: defined,
    fontFamily: defined,
    fontSize: defined,
    fontStyle: defined,
    fontWeight: defined,
    fill: defined,
    fillOpacity: defined,
    padding: defined,
    position: union(
        'outside-outer',
        'outside-center',
        'outside-inner',
        'inside-outer-outer',
        'inside-outer-center',
        'inside-outer-inner',
        'inside-center-outer',
        'inside-center',
        'inside-center-inner',
        'inside-inner-outer',
        'inside-inner-center',
        'inside-inner-inner'
    ),
    rotation: defined,
    spacing: number,
};

const regionOptionsDefs: OptionsDefs<NonNullable<NonNullable<AgQuadrantChartOptions['regions']>['topLeft']>> = {
    fill: defined,
    fillOpacity: defined,
    label: { ...regionLabelOptionsDefs, text: string },
    marker: defined,
    stroke: defined,
    strokeOpacity: defined,
    strokeWidth: defined,
};

const axisOptionsDefs: OptionsDefs<NonNullable<AgQuadrantChartOptions['xAxis']>> = {
    ...without(_ModuleSupport.numberAxisOptionsDefs, ['crossAt', 'crossLines', 'keys', 'reverse', 'position', 'type']),
};

export const quadrantOptionsDefs: OptionsDefs<AgQuadrantChartOptions> = {
    // Quadrant
    alignAxesToPivot: boolean,
    axisPlacement: axisPlacementOptionsDefs,
    pivot: pivotOptionsDefs,
    regions: {
        label: regionLabelOptionsDefs,
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
    maxRenderedItems: defined,
    maxSize: defined,
    minSize: defined,
    nodeClickRange: defined,
    styler: defined,
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
