import { type AgConeFunnelSeriesOptions, _ModuleSupport } from 'ag-charts-community';
import { type OptionsDefs, commonSeriesOptionsDefs, constant, required, string, without } from 'ag-charts-core';

const { coneFunnelSeriesThemeableOptionsDef } = _ModuleSupport;

export const coneFunnelSeriesOptionsDef: OptionsDefs<AgConeFunnelSeriesOptions> = {
    ...without(commonSeriesOptionsDefs, ['showInLegend']),
    ...coneFunnelSeriesThemeableOptionsDef,
    type: required(constant('cone-funnel')),
    stageKey: required(string),
    valueKey: required(string),
};
