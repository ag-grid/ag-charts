import { type AgFunnelSeriesOptions, _ModuleSupport } from 'ag-charts-community';
import { type OptionsDefs, commonSeriesOptionsDefs, constant, required, string, without } from 'ag-charts-core';

const { funnelSeriesThemeableOptionsDef } = _ModuleSupport;

export const funnelSeriesOptionsDef: OptionsDefs<AgFunnelSeriesOptions> = {
    ...funnelSeriesThemeableOptionsDef,
    ...without(commonSeriesOptionsDefs, ['showInLegend']),
    type: required(constant('funnel')),
    stageKey: required(string),
    valueKey: required(string),
};
