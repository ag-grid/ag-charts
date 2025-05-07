import { type AgConeFunnelSeriesOptions, _ModuleSupport } from 'ag-charts-community';
import { type OptionsDefs, constant, required, string } from 'ag-charts-core';

const { commonSeriesOptionsDefs, coneFunnelSeriesThemeableOptionsDef } = _ModuleSupport;

export const coneFunnelSeriesOptionsDef: OptionsDefs<AgConeFunnelSeriesOptions> = {
    ...coneFunnelSeriesThemeableOptionsDef,
    ...commonSeriesOptionsDefs,
    type: required(constant('cone-funnel')),
    stageKey: required(string),
    valueKey: required(string),
};
