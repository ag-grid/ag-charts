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
import type { AgLineSeriesOptions } from 'ag-charts-types';

import {
    commonSeriesOptionsDef,
    errorBarOptionsDef,
    interpolationValidator,
    markerOptionsDef,
    seriesLabelOptionsDef,
    tooltipOptionsDef,
} from '../../commonOptionsDef';

export const lineSeriesOptionsDef: OptionsDefs<AgLineSeriesOptions> = {
    type: constant('line'),
    xKey: required(string),
    yKey: required(string),
    xName: string,
    yName: string,
    title: string,
    stacked: boolean,
    stackGroup: string,
    normalizedTo: number,
    legendItemName: string,
    showInMiniChart: boolean,
    connectMissingData: boolean,
    interpolation: interpolationValidator,
    label: seriesLabelOptionsDef,
    marker: markerOptionsDef,
    tooltip: tooltipOptionsDef,
    errorBar: errorBarOptionsDef,
    ...commonSeriesOptionsDef,
    ...fillOptionsDef,
    ...strokeOptionsDef,
    ...lineDashOptionsDef,

    // @ts-expect-error undocumented option
    pickOutsideVisibleMinorAxis: boolean,
    focusPriority: number,
};
