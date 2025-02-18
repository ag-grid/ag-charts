import {
    type OptionsDefs,
    boolean,
    constant,
    fillOptionsDef,
    lineDashOptionsDef,
    number,
    required,
    string,
    strokeOptionsDef,
} from 'ag-charts-core';
import type { AgAreaSeriesOptions } from 'ag-charts-types';

import {
    commonSeriesOptionsDef,
    interpolationValidator,
    markerOptionsDef,
    seriesLabelOptionsDef,
    shadowOptionsDef,
    tooltipOptionsDef,
} from '../../commonOptionsDef';

export const areaSeriesOptionsDef: OptionsDefs<AgAreaSeriesOptions> = {
    type: required(constant('area')),
    xKey: required(string),
    yKey: required(string),
    xName: string,
    yName: string,
    stacked: boolean,
    stackGroup: string,
    normalizedTo: number,
    showInMiniChart: boolean,
    connectMissingData: boolean,
    interpolation: interpolationValidator,
    label: seriesLabelOptionsDef,
    marker: markerOptionsDef,
    tooltip: tooltipOptionsDef,
    shadow: shadowOptionsDef,
    ...commonSeriesOptionsDef,
    ...fillOptionsDef,
    ...strokeOptionsDef,
    ...lineDashOptionsDef,
};
