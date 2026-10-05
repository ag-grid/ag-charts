import type { AgFunnelSeriesOptions } from 'ag-charts-community';
import {
    type OptionsDefs,
    commonSeriesOptionsDefs,
    constant,
    funnelSeriesThemeableOptionsDef,
    required,
    string,
    without,
} from 'ag-charts-core';

export const funnelSeriesOptionsDef: OptionsDefs<AgFunnelSeriesOptions> = {
    ...funnelSeriesThemeableOptionsDef,
    ...without(commonSeriesOptionsDefs, ['showInLegend']),
    type: required(constant('funnel')),
    stageKey: required(string),
    valueKey: required(string),
};
