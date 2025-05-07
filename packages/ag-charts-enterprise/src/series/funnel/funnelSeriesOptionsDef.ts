import { type AgFunnelSeriesOptions, _ModuleSupport } from 'ag-charts-community';
import { type OptionsDefs, constant, required, string } from 'ag-charts-core';

const { commonSeriesOptionsDefs, funnelSeriesThemeableOptionsDef } = _ModuleSupport;

export const funnelSeriesOptionsDef: OptionsDefs<AgFunnelSeriesOptions> = {
    ...funnelSeriesThemeableOptionsDef,
    ...commonSeriesOptionsDefs,
    type: required(constant('funnel')),
    stageKey: required(string),
    valueKey: required(string),
};
