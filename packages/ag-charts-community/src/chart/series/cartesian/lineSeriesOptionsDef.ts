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
import type { AgLineSeriesOptions, AgLineSeriesThemeableOptions } from 'ag-charts-types';

import {
    commonSeriesOptionsDefs,
    commonSeriesThemeableOptionsDefs,
    errorBarOptionsDefs,
    errorBarThemeableOptionsDefs,
    interpolationValidator,
    markerOptionsDefs,
    seriesLabelOptionsDefs,
    tooltipOptionsDefs,
} from '../../commonOptionsDefs';

export const lineSeriesThemeableOptionsDef: OptionsDefs<AgLineSeriesThemeableOptions> = {
    title: string,
    showInMiniChart: boolean,
    connectMissingData: boolean,
    interpolation: interpolationValidator,
    label: seriesLabelOptionsDefs,
    marker: markerOptionsDefs,
    tooltip: tooltipOptionsDefs,
    errorBar: errorBarThemeableOptionsDefs,
    ...commonSeriesThemeableOptionsDefs,
    ...strokeOptionsDef,
    ...lineDashOptionsDef,
};

export const lineSeriesOptionsDef: OptionsDefs<AgLineSeriesOptions> = {
    ...lineSeriesThemeableOptionsDef,
    ...commonSeriesOptionsDefs,
    type: constant('line'),
    xKey: required(string),
    yKey: required(string),
    xName: string,
    yName: string,
    stacked: boolean,
    stackGroup: string,
    normalizedTo: number,
    legendItemName: string,
    errorBar: errorBarOptionsDefs,
};

// @ts-expect-error undocumented option
lineSeriesOptionsDef.pickOutsideVisibleMinorAxis = undocumented(boolean);
// @ts-expect-error undocumented option
lineSeriesOptionsDef.focusPriority = undocumented(number);
// @ts-expect-error undocumented option
lineSeriesOptionsDef.sparklineMode = undocumented(boolean);
