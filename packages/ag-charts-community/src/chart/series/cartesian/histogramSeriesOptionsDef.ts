import {
    type OptionsDefs,
    arrayOf,
    boolean,
    callbackDefs,
    callbackOf,
    commonSeriesOptionsDefs,
    commonSeriesThemeableOptionsDefs,
    constant,
    fillOptionsDef,
    labelFitOptionsDefs,
    lineDashOptionsDef,
    multiSeriesHighlightOptionsDef,
    number,
    or,
    positiveNumber,
    required,
    seriesLabelOptionsDefs,
    shadowOptionsDefs,
    shapeHighlightOptionsDef,
    string,
    strokeOptionsDef,
    tooltipOptionsDefs,
    union,
} from 'ag-charts-core';
import type {
    AgHistogramSeriesOptions,
    AgHistogramSeriesStyle,
    AgHistogramSeriesThemeableOptions,
} from 'ag-charts-types';

const histogramStyler = callbackDefs<AgHistogramSeriesStyle>({
    ...fillOptionsDef,
    ...strokeOptionsDef,
    ...lineDashOptionsDef,
    cornerRadius: positiveNumber,
});

const histogramLabelPlacement = union('inside-center', 'inside-start', 'inside-end', 'outside-start', 'outside-end');

export const histogramSeriesThemeableOptionsDef: OptionsDefs<AgHistogramSeriesThemeableOptions> = {
    showInMiniChart: boolean,
    cornerRadius: positiveNumber,
    styler: histogramStyler,
    itemStyler: histogramStyler,
    label: {
        ...seriesLabelOptionsDefs,
        ...labelFitOptionsDefs,
        placement: or(histogramLabelPlacement, arrayOf(histogramLabelPlacement)),
        spacing: positiveNumber,
    },
    tooltip: tooltipOptionsDefs,
    shadow: shadowOptionsDefs,
    ...commonSeriesThemeableOptionsDefs,
    ...fillOptionsDef,
    ...strokeOptionsDef,
    ...lineDashOptionsDef,
    highlight: multiSeriesHighlightOptionsDef(shapeHighlightOptionsDef, shapeHighlightOptionsDef),
    areaPlot: boolean,
    aggregation: union('count', 'sum', 'mean'),
    bins: arrayOf(arrayOf(number)),
    binCount: positiveNumber,
};

export const histogramSeriesOptionsDef: OptionsDefs<AgHistogramSeriesOptions> = {
    ...commonSeriesOptionsDefs,
    ...histogramSeriesThemeableOptionsDef,
    type: required(constant('histogram')),
    xKey: required(string),
    yKey: string,
    xKeyAxis: string,
    yKeyAxis: string,
    xName: string,
    yName: string,
    getItemId: callbackOf(string),
};
