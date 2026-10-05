import type { AgNightingaleSeriesOptions } from 'ag-charts-community';
import {
    type OptionsDefs,
    boolean,
    commonSeriesOptionsDefs,
    constant,
    nightingaleSeriesThemeableOptionsDef,
    number,
    required,
    string,
    undocumented,
} from 'ag-charts-core';

export const nightingaleSeriesOptionsDef: OptionsDefs<AgNightingaleSeriesOptions> = {
    ...commonSeriesOptionsDefs,
    ...nightingaleSeriesThemeableOptionsDef,
    type: required(constant('nightingale')),
    angleKey: required(string),
    radiusKey: required(string),
    angleName: string,
    radiusName: string,
    legendItemName: string,
    grouped: boolean,
    stacked: boolean,
    stackGroup: string,
    normalizedTo: number,
};

// @ts-expect-error undocumented option
nightingaleSeriesOptionsDef.angleKeyAxis = undocumented(string);
// @ts-expect-error undocumented option
nightingaleSeriesOptionsDef.radiusKeyAxis = undocumented(string);
