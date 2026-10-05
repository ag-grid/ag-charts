import type { AgConeFunnelSeriesOptions } from 'ag-charts-community';
import {
    type OptionsDefs,
    commonSeriesOptionsDefs,
    coneFunnelSeriesThemeableOptionsDef,
    constant,
    required,
    string,
    without,
} from 'ag-charts-core';

export const coneFunnelSeriesOptionsDef: OptionsDefs<AgConeFunnelSeriesOptions> = {
    ...without(commonSeriesOptionsDefs, ['showInLegend']),
    ...coneFunnelSeriesThemeableOptionsDef,
    type: required(constant('cone-funnel')),
    stageKey: required(string),
    valueKey: required(string),
};
