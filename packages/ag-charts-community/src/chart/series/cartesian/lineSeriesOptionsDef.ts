import {
    type OptionsDefs,
    boolean,
    constant,
    lineDashOptionsDef,
    lineHighlightOptionsDef,
    multiSeriesHighlightOptionsDef,
    number,
    required,
    shapeHighlightOptionsDef,
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
    interpolationOptionsDefs,
    markerOptionsDefs,
    seriesLabelOptionsDefs,
    tooltipOptionsDefs,
} from '../../commonOptionsDefs';

const highlight = multiSeriesHighlightOptionsDef(shapeHighlightOptionsDef, lineHighlightOptionsDef);

export const lineSeriesThemeableOptionsDef: OptionsDefs<AgLineSeriesThemeableOptions> = {
    title: string,
    showInMiniChart: boolean,
    connectMissingData: boolean,
    interpolation: interpolationOptionsDefs,
    label: seriesLabelOptionsDefs,
    marker: markerOptionsDefs,
    tooltip: tooltipOptionsDefs,
    errorBar: errorBarThemeableOptionsDefs,
    ...commonSeriesThemeableOptionsDefs,
    ...strokeOptionsDef,
    ...lineDashOptionsDef,
    highlight,
};

// @ts-expect-error undocumented option
lineSeriesThemeableOptionsDef.sparklineMode = undocumented(boolean);

export const lineSeriesOptionsDef: OptionsDefs<AgLineSeriesOptions> = {
    ...lineSeriesThemeableOptionsDef,
    ...commonSeriesOptionsDefs,
    highlight,
    type: required(constant('line')),
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
