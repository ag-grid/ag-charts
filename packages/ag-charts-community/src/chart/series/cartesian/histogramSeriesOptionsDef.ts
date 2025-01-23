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
import type { AgHistogramSeriesOptions } from 'ag-charts-types';

import {
    commonSeriesOptionsDef,
    seriesLabelOptionsDef,
    shadowOptionsDef,
    tooltipOptionsDef,
} from '../../commonOptionsDef';

export const histogramSeriesOptionsDef: OptionsDefs<AgHistogramSeriesOptions> = {
    type: required(constant('histogram')),
    xKey: required(string),
    yKey: string,
    xName: string,
    yName: string,
    areaPlot: boolean,
    aggregation: union('count', 'sum', 'mean'),
    bins: arrayOf(arrayOf(number)),
    binCount: positiveNumber,
    showInMiniChart: boolean,
    cornerRadius: positiveNumber,
    label: seriesLabelOptionsDef,
    tooltip: tooltipOptionsDef,
    shadow: shadowOptionsDef,
    ...commonSeriesOptionsDef,
    ...fillOptionsDef,
    ...strokeOptionsDef,
    ...lineDashOptionsDef,
};
