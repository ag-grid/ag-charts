import {
    type OptionsDefs,
    arrayOf,
    boolean,
    constant,
    fillOptionsDef,
    lineDashOptionsDef,
    number,
    positiveNumber,
    required,
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
} from '../../commonOptionsDefs';

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
};

export const histogramSeriesOptionsDef: OptionsDefs<AgHistogramSeriesOptions> = {
    ...histogramSeriesThemeableOptionsDef,
    ...commonSeriesOptionsDefs,
    type: required(constant('histogram')),
    xKey: required(string),
    yKey: string,
    xName: string,
    yName: string,
    areaPlot: boolean,
    aggregation: union('count', 'sum', 'mean'),
    bins: arrayOf(arrayOf(number)),
    binCount: positiveNumber,
};
