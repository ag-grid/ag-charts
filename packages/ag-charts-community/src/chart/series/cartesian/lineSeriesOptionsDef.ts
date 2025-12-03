import {
    type OptionsDefs,
    boolean,
    callbackDefs,
    commonSeriesOptionsDefs,
    commonSeriesThemeableOptionsDefs,
    constant,
    errorBarOptionsDefs,
    errorBarThemeableOptionsDefs,
    interpolationOptionsDefs,
    lineDashOptionsDef,
    lineHighlightOptionsDef,
    lineSegmentation,
    markerOptionsDefs,
    markerStyleOptionsDefs,
    multiSeriesHighlightOptionsDef,
    number,
    required,
    seriesLabelOptionsDefs,
    shapeHighlightOptionsDef,
    string,
    strokeOptionsDef,
    tooltipOptionsDefs,
    undocumented,
} from 'ag-charts-core';
import type { AgLineSeriesOptions, AgLineSeriesStylerResult, AgLineSeriesThemeableOptions } from 'ag-charts-types';

const highlight = multiSeriesHighlightOptionsDef(shapeHighlightOptionsDef, lineHighlightOptionsDef);

const lineStyler = callbackDefs<AgLineSeriesStylerResult>({
    ...strokeOptionsDef,
    ...lineDashOptionsDef,
    marker: markerStyleOptionsDefs,
});

export const lineSeriesThemeableOptionsDef: OptionsDefs<AgLineSeriesThemeableOptions> = {
    title: string,
    showInMiniChart: boolean,
    connectMissingData: boolean,
    interpolation: interpolationOptionsDefs,
    label: seriesLabelOptionsDefs,
    styler: lineStyler,
    marker: markerOptionsDefs,
    tooltip: tooltipOptionsDefs,
    errorBar: errorBarThemeableOptionsDefs,
    ...commonSeriesThemeableOptionsDefs,
    ...strokeOptionsDef,
    ...lineDashOptionsDef,
    highlight,
    segmentation: lineSegmentation,
};

// @ts-expect-error undocumented option
lineSeriesThemeableOptionsDef.sparklineMode = undocumented(boolean);

export const lineSeriesOptionsDef: OptionsDefs<AgLineSeriesOptions> = {
    ...lineSeriesThemeableOptionsDef,
    ...commonSeriesOptionsDefs,
    highlight,
    type: required(constant('line')),
    xKey: required(string),
    yKey: required(string),
    xKeyAxis: string,
    yKeyAxis: string,
    xName: string,
    yName: string,
    stacked: boolean,
    stackGroup: string,
    normalizedTo: number,
    legendItemName: string,
    errorBar: errorBarOptionsDefs,
};

// @ts-expect-error undocumented option
lineSeriesOptionsDef.yFilterKey = undocumented(string);
// @ts-expect-error undocumented option
lineSeriesOptionsDef.pickOutsideVisibleMinorAxis = undocumented(boolean);
// @ts-expect-error undocumented option
lineSeriesOptionsDef.focusPriority = undocumented(number);
