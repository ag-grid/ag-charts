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
import type { AgBarSeriesOptions, AgBarSeriesStyle } from 'ag-charts-types';

import {
    commonSeriesOptionsDefs,
    errorBarOptionsDefs,
    seriesLabelOptionsDefs,
    shadowOptionsDefs,
    tooltipOptionsDefs,
} from '../../commonOptionsDefs';

export const barSeriesOptionsDef: OptionsDefs<AgBarSeriesOptions> = {
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
    errorBar: errorBarOptionsDefs,
    shadow: shadowOptionsDefs,
    tooltip: tooltipOptionsDefs,
    ...commonSeriesOptionsDefs,
    ...fillOptionsDef,
    ...strokeOptionsDef,
    ...lineDashOptionsDef,
};

// @ts-expect-error undocumented option
barSeriesOptionsDef.pickOutsideVisibleMinorAxis = undocumented(boolean);
// @ts-expect-error undocumented option
barSeriesOptionsDef.fastDataProcessing = undocumented(boolean);
// @ts-expect-error undocumented option
barSeriesOptionsDef.focusPriority = undocumented(number);
// @ts-expect-error undocumented option
barSeriesOptionsDef.sparklineMode = undocumented(boolean);
