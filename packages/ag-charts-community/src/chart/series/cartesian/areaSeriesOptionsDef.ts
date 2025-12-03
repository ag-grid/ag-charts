import {
    type OptionsDefs,
    boolean,
    callbackDefs,
    constant,
    fillOptionsDef,
    lineDashOptionsDef,
    multiSeriesHighlightOptionsDef,
    number,
    required,
    shapeHighlightOptionsDef,
    shapeSegmentation,
    string,
    strokeOptionsDef,
    undocumented,
} from 'ag-charts-core';
import type { AgAreaSeriesOptions, AgAreaSeriesStylerResult, AgAreaSeriesThemeableOptions } from 'ag-charts-types';

import {
    commonSeriesOptionsDefs,
    commonSeriesThemeableOptionsDefs,
    interpolationOptionsDefs,
    markerOptionsDefs,
    markerStyleOptionsDefs,
    seriesLabelOptionsDefs,
    shadowOptionsDefs,
    tooltipOptionsDefs,
} from 'ag-charts-core';

const highlight = multiSeriesHighlightOptionsDef(shapeHighlightOptionsDef, shapeHighlightOptionsDef);

const areaStyler = callbackDefs<AgAreaSeriesStylerResult>({
    ...strokeOptionsDef,
    ...fillOptionsDef,
    ...lineDashOptionsDef,
    marker: markerStyleOptionsDefs,
});

export const areaSeriesThemeableOptionsDef: OptionsDefs<AgAreaSeriesThemeableOptions> = {
    showInMiniChart: boolean,
    connectMissingData: boolean,
    interpolation: interpolationOptionsDefs,
    label: seriesLabelOptionsDefs,
    styler: areaStyler,
    marker: markerOptionsDefs,
    tooltip: tooltipOptionsDefs,
    shadow: shadowOptionsDefs,
    ...commonSeriesThemeableOptionsDefs,
    ...fillOptionsDef,
    ...strokeOptionsDef,
    ...lineDashOptionsDef,
    highlight,
    segmentation: shapeSegmentation,
};

export const areaSeriesOptionsDef: OptionsDefs<AgAreaSeriesOptions> = {
    ...areaSeriesThemeableOptionsDef,
    ...commonSeriesOptionsDefs,
    highlight,
    type: required(constant('area')),
    xKey: required(string),
    yKey: required(string),
    xKeyAxis: string,
    yKeyAxis: string,
    xName: string,
    yName: string,
    legendItemName: string,
    stacked: boolean,
    stackGroup: string,
    normalizedTo: number,
};

// @ts-expect-error undocumented option
areaSeriesOptionsDef.yFilterKey = undocumented(string);
