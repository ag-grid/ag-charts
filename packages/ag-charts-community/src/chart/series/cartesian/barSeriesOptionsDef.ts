import {
    type OptionsDefs,
    boolean,
    callbackDefs,
    constant,
    fillOptionsDef,
    lineDashOptionsDef,
    number,
    positiveNumber,
    required,
    string,
    strokeOptionsDef,
    undocumented,
    union,
} from 'ag-charts-core';
import type { AgBarSeriesOptions, AgBarSeriesStyle, AgBarSeriesThemeableOptions } from 'ag-charts-types';

import {
    commonSeriesOptionsDefs,
    commonSeriesThemeableOptionsDefs,
    errorBarOptionsDefs,
    errorBarThemeableOptionsDefs,
    seriesLabelOptionsDefs,
    shadowOptionsDefs,
    tooltipOptionsDefs,
} from '../../commonOptionsDefs';

export const barSeriesThemeableOptionsDef: OptionsDefs<AgBarSeriesThemeableOptions> = {
    direction: union('horizontal', 'vertical'),
    showInMiniChart: boolean,
    cornerRadius: positiveNumber,
    itemStyler: callbackDefs<AgBarSeriesStyle>({
        ...fillOptionsDef,
        ...strokeOptionsDef,
        ...lineDashOptionsDef,
        cornerRadius: positiveNumber,
    }),
    crisp: boolean,
    label: {
        ...seriesLabelOptionsDefs,
        placement: union('inside-center', 'inside-start', 'inside-end', 'outside-start', 'outside-end'),
        padding: positiveNumber,
    },
    errorBar: errorBarThemeableOptionsDefs,
    shadow: shadowOptionsDefs,
    tooltip: tooltipOptionsDefs,
    ...commonSeriesThemeableOptionsDefs,
    ...fillOptionsDef,
    ...strokeOptionsDef,
    ...lineDashOptionsDef,
};

export const barSeriesOptionsDef: OptionsDefs<AgBarSeriesOptions> = {
    ...barSeriesThemeableOptionsDef,
    ...commonSeriesOptionsDefs,
    type: required(constant('bar')),
    xKey: required(string),
    yKey: required(string),
    xName: string,
    yName: string,
    direction: union('horizontal', 'vertical'),
    grouped: boolean,
    stacked: boolean,
    stackGroup: string,
    normalizedTo: number,
    legendItemName: string,
    errorBar: errorBarOptionsDefs,
};

// @ts-expect-error undocumented option
barSeriesOptionsDef.pickOutsideVisibleMinorAxis = undocumented(boolean);
// @ts-expect-error undocumented option
barSeriesOptionsDef.fastDataProcessing = undocumented(boolean);
// @ts-expect-error undocumented option
barSeriesOptionsDef.focusPriority = undocumented(number);
// @ts-expect-error undocumented option
barSeriesOptionsDef.sparklineMode = undocumented(boolean);
