import {
    type OptionsDefs,
    boolean,
    constant,
    lineDashOptionsDef,
    number,
    required,
    string,
    strokeOptionsDef,
    undocumented,
} from 'ag-charts-core';
import type { AgLineSeriesOptions } from 'ag-charts-types';

import {
    commonSeriesOptionsDefs,
    errorBarOptionsDefs,
    interpolationValidator,
    markerOptionsDefs,
    seriesLabelOptionsDefs,
    tooltipOptionsDefs,
} from '../../commonOptionsDefs';

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
    label: seriesLabelOptionsDefs,
    marker: markerOptionsDefs,
    tooltip: tooltipOptionsDefs,
    errorBar: errorBarOptionsDefs,
    ...commonSeriesOptionsDefs,
    ...strokeOptionsDef,
    ...lineDashOptionsDef,
};

// @ts-expect-error undocumented option
lineSeriesOptionsDef.pickOutsideVisibleMinorAxis = undocumented(boolean);
// @ts-expect-error undocumented option
lineSeriesOptionsDef.focusPriority = undocumented(number);
// @ts-expect-error undocumented option
lineSeriesOptionsDef.sparklineMode = undocumented(boolean);
