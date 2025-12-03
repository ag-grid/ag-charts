import {
    type OptionsDefs,
    arrayOf,
    boolean,
    constant,
    fillOptionsDef,
    lineDashOptionsDef,
    multiSeriesHighlightOptionsDef,
    number,
    positiveNumber,
    required,
    shapeHighlightOptionsDef,
    string,
    strokeOptionsDef,
    union,
} from 'ag-charts-core';
import type { AgHistogramSeriesOptions, AgHistogramSeriesThemeableOptions } from 'ag-charts-types';

import {
    commonSeriesOptionsDefs,
    commonSeriesThemeableOptionsDefs,
    seriesLabelOptionsDefs,
    shadowOptionsDefs,
    tooltipOptionsDefs,
} from 'ag-charts-core';

export const histogramSeriesThemeableOptionsDef: OptionsDefs<AgHistogramSeriesThemeableOptions> = {
    showInMiniChart: boolean,
    cornerRadius: positiveNumber,
    label: seriesLabelOptionsDefs,
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
};
