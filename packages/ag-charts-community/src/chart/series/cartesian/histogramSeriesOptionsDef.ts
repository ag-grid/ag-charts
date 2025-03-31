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
    commonSeriesOptionsDefs,
    seriesLabelOptionsDefs,
    shadowOptionsDefs,
    tooltipOptionsDefs,
} from '../../commonOptionsDefs';

export const histogramSeriesOptionsDef: OptionsDefs<AgHistogramSeriesOptions<never>> = {
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
    label: seriesLabelOptionsDefs,
    tooltip: tooltipOptionsDefs,
    shadow: shadowOptionsDefs,
    ...commonSeriesOptionsDefs,
    ...fillOptionsDef,
    ...strokeOptionsDef,
    ...lineDashOptionsDef,
};
