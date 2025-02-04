import {
    type OptionsDefs,
    boolean,
    callback,
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
import type { AgBarSeriesOptions } from 'ag-charts-types';

import {
    commonSeriesOptionsDef,
    errorBarOptionsDef,
    seriesLabelOptionsDef,
    shadowOptionsDef,
    tooltipOptionsDef,
} from '../../commonOptionsDef';

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
    itemStyler: callback,
    crisp: boolean,
    label: {
        ...seriesLabelOptionsDef,
        placement: union('inside-center', 'inside-start', 'inside-end', 'outside-start', 'outside-end'),
        padding: positiveNumber,
    },
    errorBar: errorBarOptionsDef,
    shadow: shadowOptionsDef,
    tooltip: tooltipOptionsDef,
    ...commonSeriesOptionsDef,
    ...fillOptionsDef,
    ...strokeOptionsDef,
    ...lineDashOptionsDef,

    // @ts-expect-error undocumented option
    fastDataProcessing: boolean,
    focusPriority: number,
};
